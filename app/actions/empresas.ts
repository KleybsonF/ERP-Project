"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

const DEFAULT_COMPANY = {
  razaoSocial: "Confiança Dedetizadora LTDA ME",
  nomeFantasia: "Confiança Dedetizadora",
  cnpj: "11.365.123/0001-42",
  inscricaoEstadual: "20.345.678-9",
  inscricaoMunicipal: "43210-9",
  telefone: "(84) 3272-4289",
  whatsapp: "(84) 99973-1210",
  email: "confianca_dedetizadora@hotmail.com",
  website: "https://confiancadetetizadora.com.br",
  cep: "59140-460",
  logradouro: "Rua Treze de Maio",
  numero: "34",
  complemento: "Sede Própria",
  bairro: "Boa Esperança",
  cidade: "Parnamirim",
  estado: "RN",
  responsavelTecnico: "Flavio H. Ariston Oliveira",
  conselhoClasse: "Médico Veterinário - CRMV/RN-0242",
  alvaraSanitario: "014/2026 - VAL: 18/03/2027",
  licencaAmbiental: "006/2024 - VAL: 12/07/2027",
  registroConselho: "CRMV/RN-0242",
  pixChave: "11.365.123/0001-42",
  pixTipo: "CNPJ",
  logoUrl: "/contratos/logo_empresa.jpeg",
  assinaturaUrl: "/contratos/assinatura_eletronica.jpeg",
  isMatriz: true,
  isAtiva: true
};

export async function getCompanies() {
  const count = await prisma.company.count();
  if (count === 0) {
    await prisma.company.create({
      data: DEFAULT_COMPANY
    });
  }

  return await prisma.company.findMany({
    orderBy: [
      { isMatriz: "desc" },
      { razaoSocial: "asc" }
    ]
  });
}

export async function getCompanyById(id: number) {
  return await prisma.company.findUnique({
    where: { id }
  });
}

export async function getDefaultCompany() {
  const matriz = await prisma.company.findFirst({
    where: { isMatriz: true, isAtiva: true }
  });
  if (matriz) return matriz;

  return await prisma.company.findFirst({
    where: { isAtiva: true }
  });
}

export type CompanyFormData = {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;

  telefone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;

  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;

  responsavelTecnico?: string;
  conselhoClasse?: string;
  alvaraSanitario?: string;
  licencaAmbiental?: string;
  registroConselho?: string;

  pixChave?: string;
  pixTipo?: string;

  logoUrl?: string;
  assinaturaUrl?: string;

  isMatriz?: boolean;
  isAtiva?: boolean;
};

export async function createCompany(data: CompanyFormData) {
  if (data.isMatriz) {
    await prisma.company.updateMany({
      where: { isMatriz: true },
      data: { isMatriz: false }
    });
  }

  const company = await prisma.company.create({
    data: {
      razaoSocial: data.razaoSocial.trim(),
      nomeFantasia: data.nomeFantasia?.trim() || null,
      cnpj: data.cnpj?.trim() || null,
      inscricaoEstadual: data.inscricaoEstadual?.trim() || null,
      inscricaoMunicipal: data.inscricaoMunicipal?.trim() || null,

      telefone: data.telefone?.trim() || null,
      whatsapp: data.whatsapp?.trim() || null,
      email: data.email?.trim() || null,
      website: data.website?.trim() || null,

      cep: data.cep?.trim() || null,
      logradouro: data.logradouro?.trim() || null,
      numero: data.numero?.trim() || null,
      complemento: data.complemento?.trim() || null,
      bairro: data.bairro?.trim() || null,
      cidade: data.cidade?.trim() || null,
      estado: data.estado?.trim() || null,

      responsavelTecnico: data.responsavelTecnico?.trim() || null,
      conselhoClasse: data.conselhoClasse?.trim() || null,
      alvaraSanitario: data.alvaraSanitario?.trim() || null,
      licencaAmbiental: data.licencaAmbiental?.trim() || null,
      registroConselho: data.registroConselho?.trim() || null,

      pixChave: data.pixChave?.trim() || null,
      pixTipo: data.pixTipo?.trim() || "CNPJ",

      logoUrl: data.logoUrl || null,
      assinaturaUrl: data.assinaturaUrl || null,

      isMatriz: !!data.isMatriz,
      isAtiva: data.isAtiva !== undefined ? !!data.isAtiva : true
    }
  });

  await createLog("CRIOU", "Empresa", `Empresa '${company.razaoSocial}' cadastrada.`);
  revalidatePath("/administracao/empresa");
  return company;
}

export async function updateCompany(id: number, data: CompanyFormData) {
  if (data.isMatriz) {
    await prisma.company.updateMany({
      where: { isMatriz: true, id: { not: id } },
      data: { isMatriz: false }
    });
  }

  const company = await prisma.company.update({
    where: { id },
    data: {
      razaoSocial: data.razaoSocial.trim(),
      nomeFantasia: data.nomeFantasia?.trim() || null,
      cnpj: data.cnpj?.trim() || null,
      inscricaoEstadual: data.inscricaoEstadual?.trim() || null,
      inscricaoMunicipal: data.inscricaoMunicipal?.trim() || null,

      telefone: data.telefone?.trim() || null,
      whatsapp: data.whatsapp?.trim() || null,
      email: data.email?.trim() || null,
      website: data.website?.trim() || null,

      cep: data.cep?.trim() || null,
      logradouro: data.logradouro?.trim() || null,
      numero: data.numero?.trim() || null,
      complemento: data.complemento?.trim() || null,
      bairro: data.bairro?.trim() || null,
      cidade: data.cidade?.trim() || null,
      estado: data.estado?.trim() || null,

      responsavelTecnico: data.responsavelTecnico?.trim() || null,
      conselhoClasse: data.conselhoClasse?.trim() || null,
      alvaraSanitario: data.alvaraSanitario?.trim() || null,
      licencaAmbiental: data.licencaAmbiental?.trim() || null,
      registroConselho: data.registroConselho?.trim() || null,

      pixChave: data.pixChave?.trim() || null,
      pixTipo: data.pixTipo?.trim() || "CNPJ",

      logoUrl: data.logoUrl || null,
      assinaturaUrl: data.assinaturaUrl || null,

      isMatriz: !!data.isMatriz,
      isAtiva: data.isAtiva !== undefined ? !!data.isAtiva : true
    }
  });

  await createLog("EDITOU", "Empresa", `Empresa '${company.razaoSocial}' (#${id}) atualizada.`);
  revalidatePath("/administracao/empresa");
  return company;
}

export async function deleteCompany(id: number) {
  const total = await prisma.company.count();
  if (total <= 1) {
    throw new Error("Não é possível excluir a única empresa cadastrada no sistema.");
  }

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) throw new Error("Empresa não encontrada.");

  await prisma.company.delete({ where: { id } });
  await createLog("EXCLUIU", "Empresa", `Empresa '${company.razaoSocial}' (#${id}) excluída.`);
  
  // Se a excluída era matriz, define a primeira restante como matriz
  if (company.isMatriz) {
    const firstRemaining = await prisma.company.findFirst();
    if (firstRemaining) {
      await prisma.company.update({
        where: { id: firstRemaining.id },
        data: { isMatriz: true }
      });
    }
  }

  revalidatePath("/administracao/empresa");
}

export async function setCompanyAsMatriz(id: number) {
  await prisma.company.updateMany({
    where: { isMatriz: true },
    data: { isMatriz: false }
  });

  const company = await prisma.company.update({
    where: { id },
    data: { isMatriz: true, isAtiva: true }
  });

  await createLog("EDITOU", "Empresa", `Empresa '${company.razaoSocial}' (#${id}) definida como Matriz principal.`);
  revalidatePath("/administracao/empresa");
  return company;
}
