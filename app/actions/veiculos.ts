"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

export interface VehicleFormData {
  plate: string;
  model?: string;
  brand?: string;
  year?: string;
  color?: string;
  renavam?: string;
  chassi?: string;
  tipo?: string;
  combustivel?: string;
  quilometragem?: number;
  status?: string;
  responsavel?: string;
  seguradora?: string;
  apoliceSeguro?: string;
  vencimentoSeguro?: string | null;
  vencimentoIpva?: string | null;
  observacoes?: string;
}

export async function getVehicles() {
  return await prisma.vehicle.findMany({
    orderBy: [{ status: "asc" }, { plate: "asc" }],
    include: {
      payables: {
        take: 5,
        orderBy: { due_date: "desc" }
      }
    }
  });
}

export async function getVehicleById(id: number) {
  return await prisma.vehicle.findUnique({
    where: { id },
    include: {
      payables: {
        orderBy: { due_date: "desc" }
      }
    }
  });
}

export async function createVehicle(data: VehicleFormData) {
  const plateNormalized = data.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!plateNormalized) {
    throw new Error("A placa do veículo é obrigatória.");
  }

  // Verifica se já existe placa cadastrada
  const existing = await prisma.vehicle.findUnique({
    where: { plate: plateNormalized }
  });
  if (existing) {
    throw new Error(`Já existe um veículo cadastrado com a placa ${plateNormalized}.`);
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      plate: plateNormalized,
      model: data.model?.trim() || null,
      brand: data.brand?.trim() || null,
      year: data.year?.trim() || null,
      color: data.color?.trim() || null,
      renavam: data.renavam?.trim() || null,
      chassi: data.chassi?.trim() || null,
      tipo: data.tipo?.trim() || "Utilitário",
      combustivel: data.combustivel?.trim() || "Flex",
      quilometragem: Number(data.quilometragem) || 0,
      status: data.status || "Ativo",
      responsavel: data.responsavel?.trim() || null,
      seguradora: data.seguradora?.trim() || null,
      apoliceSeguro: data.apoliceSeguro?.trim() || null,
      vencimentoSeguro: data.vencimentoSeguro ? new Date(data.vencimentoSeguro) : null,
      vencimentoIpva: data.vencimentoIpva ? new Date(data.vencimentoIpva) : null,
      observacoes: data.observacoes?.trim() || null,
      ativo: true
    }
  });

  await createLog("CRIOU", "Veículo", `Cadastrou o veículo placa ${vehicle.plate} (${vehicle.model || "Sem modelo"}).`);

  revalidatePath("/administracao/veiculos");
  return { success: true, vehicle };
}

export async function updateVehicle(id: number, data: VehicleFormData) {
  const plateNormalized = data.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!plateNormalized) {
    throw new Error("A placa do veículo é obrigatória.");
  }

  // Verifica se a placa pertence a outro veículo
  const existing = await prisma.vehicle.findUnique({
    where: { plate: plateNormalized }
  });
  if (existing && existing.id !== id) {
    throw new Error(`A placa ${plateNormalized} já pertence a outro veículo.`);
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      plate: plateNormalized,
      model: data.model?.trim() || null,
      brand: data.brand?.trim() || null,
      year: data.year?.trim() || null,
      color: data.color?.trim() || null,
      renavam: data.renavam?.trim() || null,
      chassi: data.chassi?.trim() || null,
      tipo: data.tipo?.trim() || "Utilitário",
      combustivel: data.combustivel?.trim() || "Flex",
      quilometragem: Number(data.quilometragem) || 0,
      status: data.status || "Ativo",
      responsavel: data.responsavel?.trim() || null,
      seguradora: data.seguradora?.trim() || null,
      apoliceSeguro: data.apoliceSeguro?.trim() || null,
      vencimentoSeguro: data.vencimentoSeguro ? new Date(data.vencimentoSeguro) : null,
      vencimentoIpva: data.vencimentoIpva ? new Date(data.vencimentoIpva) : null,
      observacoes: data.observacoes?.trim() || null
    }
  });

  await createLog("EDITOU", "Veículo", `Atualizou os dados do veículo placa ${vehicle.plate}.`);

  revalidatePath("/administracao/veiculos");
  return { success: true, vehicle };
}

export async function toggleVehicleActive(id: number) {
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v) throw new Error("Veículo não encontrado.");

  const novoStatus = !v.ativo;
  const updated = await prisma.vehicle.update({
    where: { id },
    data: {
      ativo: novoStatus,
      status: novoStatus ? "Ativo" : "Inativo"
    }
  });

  await createLog("STATUS", "Veículo", `${novoStatus ? "Reativou" : "Desativou"} o veículo ${v.plate}.`);

  revalidatePath("/administracao/veiculos");
  return { success: true, ativo: novoStatus };
}

export async function deleteVehicle(id: number) {
  const v = await prisma.vehicle.findUnique({
    where: { id },
    include: { payables: true }
  });
  if (!v) throw new Error("Veículo não encontrado.");

  if (v.payables.length > 0) {
    throw new Error("Não é possível excluir um veículo que possui despesas financeiras vinculadas. Desative-o em vez de excluir.");
  }

  await prisma.vehicle.delete({ where: { id } });
  await createLog("EXCLUIU", "Veículo", `Excluiu o veículo placa ${v.plate}.`);

  revalidatePath("/administracao/veiculos");
  return { success: true };
}
