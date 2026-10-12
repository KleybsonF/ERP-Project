"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

export interface BlacklistFormData {
  nome: string;
  documento?: string;
  tipo?: string;
  motivo: string;
  telefone?: string;
  email?: string;
  bloquearAgendamento?: boolean;
  bloquearVenda?: boolean;
  cadastradoPor?: string;
  observacoes?: string;
}

export async function getBlacklist() {
  return await prisma.blacklist.findMany({
    orderBy: [{ ativo: "desc" }, { createdAt: "desc" }]
  });
}

export async function getBlacklistById(id: number) {
  return await prisma.blacklist.findUnique({
    where: { id }
  });
}

export async function checkBlacklist(documento?: string, nome?: string) {
  if (!documento && !nome) return null;

  const docClean = documento ? documento.replace(/[^0-9]/g, "") : "";
  const nomeTrim = nome?.trim();

  const conditions: any[] = [];
  if (docClean && docClean.length >= 8) {
    conditions.push({ documento: { contains: docClean } });
  }
  if (nomeTrim && nomeTrim.length >= 3) {
    conditions.push({ nome: { contains: nomeTrim, mode: "insensitive" } });
  }

  if (conditions.length === 0) return null;

  return await prisma.blacklist.findFirst({
    where: {
      ativo: true,
      OR: conditions
    }
  });
}

export async function createBlacklistEntry(data: BlacklistFormData) {
  if (!data.nome.trim()) {
    throw new Error("O nome ou razão social é obrigatório.");
  }
  if (!data.motivo.trim()) {
    throw new Error("O motivo do bloqueio é obrigatório.");
  }

  const docClean = data.documento ? data.documento.trim() : null;

  const entry = await prisma.blacklist.create({
    data: {
      nome: data.nome.trim(),
      documento: docClean,
      tipo: data.tipo || "Inadimplência",
      motivo: data.motivo.trim(),
      telefone: data.telefone?.trim() || null,
      email: data.email?.trim() || null,
      bloquearAgendamento: data.bloquearAgendamento !== false,
      bloquearVenda: data.bloquearVenda !== false,
      cadastradoPor: data.cadastradoPor || "Administrador",
      observacoes: data.observacoes?.trim() || null,
      ativo: true
    }
  });

  await createLog("CRIOU", "Blacklist", `Inseriu "${entry.nome}" na Blacklist (${entry.tipo}). Motivo: ${entry.motivo}`);

  revalidatePath("/administracao/blacklist");
  return { success: true, entry };
}

export async function updateBlacklistEntry(id: number, data: BlacklistFormData) {
  if (!data.nome.trim()) {
    throw new Error("O nome ou razão social é obrigatório.");
  }
  if (!data.motivo.trim()) {
    throw new Error("O motivo do bloqueio é obrigatório.");
  }

  const entry = await prisma.blacklist.update({
    where: { id },
    data: {
      nome: data.nome.trim(),
      documento: data.documento?.trim() || null,
      tipo: data.tipo || "Inadimplência",
      motivo: data.motivo.trim(),
      telefone: data.telefone?.trim() || null,
      email: data.email?.trim() || null,
      bloquearAgendamento: data.bloquearAgendamento !== false,
      bloquearVenda: data.bloquearVenda !== false,
      observacoes: data.observacoes?.trim() || null
    }
  });

  await createLog("EDITOU", "Blacklist", `Atualizou os dados de "${entry.nome}" na Blacklist.`);

  revalidatePath("/administracao/blacklist");
  return { success: true, entry };
}

export async function toggleBlacklistActive(id: number, motivoDesbloqueio?: string) {
  const entry = await prisma.blacklist.findUnique({ where: { id } });
  if (!entry) throw new Error("Registro não encontrado na blacklist.");

  const novoStatus = !entry.ativo;

  const updated = await prisma.blacklist.update({
    where: { id },
    data: {
      ativo: novoStatus,
      dataDesbloqueio: novoStatus ? null : new Date(),
      motivoDesbloqueio: novoStatus ? null : (motivoDesbloqueio?.trim() || "Desbloqueado pelo administrador")
    }
  });

  await createLog(
    "STATUS",
    "Blacklist",
    `${novoStatus ? "Reativou bloqueio de" : "Desbloqueou"} "${entry.nome}". ${motivoDesbloqueio ? `Justificativa: ${motivoDesbloqueio}` : ""}`
  );

  revalidatePath("/administracao/blacklist");
  return { success: true, ativo: novoStatus };
}

export async function deleteBlacklistEntry(id: number) {
  const entry = await prisma.blacklist.findUnique({ where: { id } });
  if (!entry) throw new Error("Registro não encontrado.");

  await prisma.blacklist.delete({ where: { id } });
  await createLog("EXCLUIU", "Blacklist", `Removeu permanentemente "${entry.nome}" da Blacklist.`);

  revalidatePath("/administracao/blacklist");
  return { success: true };
}
