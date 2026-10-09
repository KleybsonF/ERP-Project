"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getCustomers() {
  return await prisma.customer.findMany({
    include: {
      contacts: true,
      locations: {
        include: {
          contacts: true
        }
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCustomerById(id: number) {
  return await prisma.customer.findUnique({
    where: { id },
    include: {
      locations: {
        include: {
          contacts: true
        }
      },
    },
  });
}

export async function createCustomer(data: { 
  name: string; 
  type: string;
  document: string; 
  phone: string; 
  
  nomeSocial?: string;
  dataNascimento?: string;
  rg?: string;
  rgEmissor?: string;
  rgDataExp?: string;
  nomePai?: string;
  nomeMae?: string;
  nacionalidade?: string;
  naturalidade?: string;
  estadoCivil?: string;
  sexo?: string;
  profissao?: string;
  
  nomeFantasia?: string;
  responsavel?: string;
  cpfResponsavel?: string;
  dataFundacao?: string;
  inscricaoMunicipal?: string;
  
  inscricaoEstadual?: string;
  contacts?: {
    name: string;
    type: string;
    value: string;
  }[];
  locations?: { 
    street: string; 
    neighborhood: string; 
    city: string; 
    state: string; 
    cep: string; 
    numero?: string | null;
    complemento?: string | null;
    pontoReferencia?: string | null;
    codigoMun?: string | null;
    condominiumId?: number | null;
  }[] 
}) {
  const doc = data.document.trim() === "" ? null : data.document.trim();
  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      type: data.type,
      document: doc,
      phone: data.phone,
      
      nomeSocial: data.nomeSocial || null,
      dataNascimento: data.dataNascimento || null,
      rg: data.rg || null,
      rgEmissor: data.rgEmissor || null,
      rgDataExp: data.rgDataExp || null,
      nomePai: data.nomePai || null,
      nomeMae: data.nomeMae || null,
      nacionalidade: data.nacionalidade || null,
      naturalidade: data.naturalidade || null,
      estadoCivil: data.estadoCivil || null,
      sexo: data.sexo || null,
      profissao: data.profissao || null,
      
      nomeFantasia: data.nomeFantasia || null,
      responsavel: data.responsavel || null,
      cpfResponsavel: data.cpfResponsavel || null,
      dataFundacao: data.dataFundacao || null,
      inscricaoMunicipal: data.inscricaoMunicipal || null,
      
      inscricaoEstadual: data.inscricaoEstadual || null,

      ...(data.contacts && data.contacts.length > 0 ? {
        contacts: {
          create: data.contacts.map(c => ({
            name: c.name,
            type: c.type,
            value: c.value
          }))
        }
      } : {}),

      ...(data.locations && data.locations.length > 0 ? {
        locations: {
          create: data.locations.map(loc => ({
            street: loc.street,
            neighborhood: loc.neighborhood,
            city: loc.city,
            state: loc.state,
            cep: loc.cep,
            numero: loc.numero || null,
            complemento: loc.complemento || null,
            pontoReferencia: loc.pontoReferencia || null,
            codigoMun: loc.codigoMun || null,
            condominiumId: loc.condominiumId || null
          }))
        }
      } : {})
    }
  });
  
  revalidatePath("/clientes");
  return customer;
}
export async function createLocation(data: { customerId: number; street: string; neighborhood: string; city: string; state: string; cep: string; contact: string }) {
  await prisma.customerLocation.create({
    data: {
      customerId: data.customerId,
      street: data.street,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      cep: data.cep,
      contact: data.contact,
    }
  });
  revalidatePath("/clientes");
}

export async function updateCustomer(id: number, data: { 
  name: string; 
  type: string;
  document: string; 
  phone: string; 
  
  nomeSocial?: string;
  dataNascimento?: string;
  rg?: string;
  rgEmissor?: string;
  rgDataExp?: string;
  nomePai?: string;
  nomeMae?: string;
  nacionalidade?: string;
  naturalidade?: string;
  estadoCivil?: string;
  sexo?: string;
  profissao?: string;
  
  nomeFantasia?: string;
  responsavel?: string;
  cpfResponsavel?: string;
  dataFundacao?: string;
  inscricaoMunicipal?: string;
  
  inscricaoEstadual?: string;
  contacts?: {
    id?: number;
    name: string;
    type: string;
    value: string;
  }[];
  locations?: { 
    id?: number;
    street: string; 
    neighborhood: string; 
    city: string; 
    state: string; 
    cep: string; 
    numero?: string | null;
    complemento?: string | null;
    pontoReferencia?: string | null;
    codigoMun?: string | null;
    condominiumId?: number | null;
  }[] 
}) {
  const doc = data.document.trim() === "" ? null : data.document.trim();
  
  // First update customer base data
  await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      document: doc,
      phone: data.phone,
      
      nomeSocial: data.nomeSocial || null,
      dataNascimento: data.dataNascimento || null,
      rg: data.rg || null,
      rgEmissor: data.rgEmissor || null,
      rgDataExp: data.rgDataExp || null,
      nomePai: data.nomePai || null,
      nomeMae: data.nomeMae || null,
      nacionalidade: data.nacionalidade || null,
      naturalidade: data.naturalidade || null,
      estadoCivil: data.estadoCivil || null,
      sexo: data.sexo || null,
      profissao: data.profissao || null,
      
      nomeFantasia: data.nomeFantasia || null,
      responsavel: data.responsavel || null,
      cpfResponsavel: data.cpfResponsavel || null,
      dataFundacao: data.dataFundacao || null,
      inscricaoMunicipal: data.inscricaoMunicipal || null,
      
      inscricaoEstadual: data.inscricaoEstadual || null,
    }
  });

  // Then update locations if provided
  if (data.locations) {
    const locationIdsToKeep = data.locations.filter(l => l.id).map(l => l.id as number);
    await prisma.customerLocation.deleteMany({
      where: { customerId: id, id: { notIn: locationIdsToKeep } }
    });
    for (const loc of data.locations) {
      if (loc.id) {
        // Update existing location
        await prisma.customerLocation.update({
          where: { id: loc.id },
          data: {
            street: loc.street,
            neighborhood: loc.neighborhood,
            city: loc.city,
            state: loc.state,
            cep: loc.cep,
            numero: loc.numero || null,
            complemento: loc.complemento || null,
            pontoReferencia: loc.pontoReferencia || null,
            codigoMun: loc.codigoMun || null,
            condominiumId: loc.condominiumId || null
          }
        });
      } else {
        // Create new location
        await prisma.customerLocation.create({
          data: {
            customerId: id,
            street: loc.street,
            neighborhood: loc.neighborhood,
            city: loc.city,
            state: loc.state,
            cep: loc.cep,
            numero: loc.numero || null,
            complemento: loc.complemento || null,
            pontoReferencia: loc.pontoReferencia || null,
            codigoMun: loc.codigoMun || null,
            condominiumId: loc.condominiumId || null
          }
        });
      }
    }
  }

  if (data.contacts) {
    const contactIdsToKeep = data.contacts.filter(c => c.id).map(c => c.id as number);
    await prisma.customerContact.deleteMany({
      where: { customerId: id, id: { notIn: contactIdsToKeep } }
    });
    for (const c of data.contacts) {
      if (c.id) {
        await prisma.customerContact.update({
          where: { id: c.id },
          data: {
            name: c.name,
            type: c.type,
            value: c.value
          }
        });
      } else {
        await prisma.customerContact.create({
          data: {
            customerId: id,
            name: c.name,
            type: c.type,
            value: c.value
          }
        });
      }
    }
  }

  revalidatePath("/clientes");
}

export async function hideCustomer(id: number) {
  await prisma.customer.update({
    where: { id },
    data: {
      isHidden: true
    }
  });
  revalidatePath("/clientes");
}

export async function unhideCustomer(id: number) {
  await prisma.customer.update({
    where: { id },
    data: {
      isHidden: false
    }
  });
  revalidatePath("/clientes");
}

export async function getCondominiums() {
  return await prisma.condominium.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createCondominium(name: string) {
  const condo = await prisma.condominium.create({
    data: { name }
  });
  revalidatePath("/clientes");
  return condo;
}
