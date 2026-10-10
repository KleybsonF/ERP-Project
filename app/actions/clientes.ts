"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "./logs";

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
      contacts: true,
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
  
  await createLog("CRIOU", "Clientes", `Cliente #${customer.id} (${customer.name}) cadastrado.`);

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

  await createLog("EDITOU", "Clientes", `Cliente #${id} (${data.name}) atualizado.`);

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

/**
 * Exclui permanentemente um cliente e todos os dados vinculados a ele
 * (contatos, endereços, OS, visitas, atribuições e contas a receber).
 * Registros de ponto dos funcionários são preservados, apenas desvinculados.
 */
export async function deleteCustomer(id: number) {
  const customer = await prisma.customer.findUnique({ where: { id }, select: { name: true } });
  if (!customer) throw new Error("Cliente não encontrado.");

  const orders = await prisma.serviceOrder.findMany({ where: { customerId: id }, select: { id: true } });
  const orderIds = orders.map(o => o.id);
  const locations = await prisma.customerLocation.findMany({ where: { customerId: id }, select: { id: true } });
  const locationIds = locations.map(l => l.id);

  await prisma.$transaction([
    // Preserva o histórico de ponto dos funcionários, apenas removendo o vínculo
    prisma.employeeWorkLog.updateMany({
      where: { OR: [{ orderId: { in: orderIds } }, { locationId: { in: locationIds } }] },
      data: { orderId: null, locationId: null }
    }),
    prisma.accountsReceivable.deleteMany({
      where: { OR: [{ clientId: id }, { orderId: { in: orderIds } }] }
    }),
    prisma.serviceOrderAssignment.deleteMany({ where: { serviceOrderId: { in: orderIds } } }),
    prisma.serviceOrderVisit.deleteMany({ where: { serviceOrderId: { in: orderIds } } }),
    prisma.serviceOrder.deleteMany({ where: { customerId: id } }),
    prisma.locationContact.deleteMany({ where: { locationId: { in: locationIds } } }),
    prisma.customerLocation.deleteMany({ where: { customerId: id } }),
    prisma.customerContact.deleteMany({ where: { customerId: id } }),
    prisma.customer.delete({ where: { id } })
  ]);

  await createLog("Exclusão", "Clientes", `Cliente #${id} (${customer.name}) excluído permanentemente.`);

  revalidatePath("/clientes");
  revalidatePath("/os");
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

export type GlobalCustomerSearchResult = {
  id: number;
  name: string;
  type: string;
  document: string | null;
  isHidden: boolean;
  subtitle: string | null;
  contact: string | null;
  location: string | null;
};

/**
 * Busca global de clientes usada na barra de pesquisa do topo.
 * `field` corresponde ao select "Tipo" da Topbar.
 * Telefones e documentos são comparados apenas pelos dígitos, ignorando máscara.
 */
export async function searchCustomersGlobal(query: string, field: string = "all"): Promise<GlobalCustomerSearchResult[]> {
  const q = (query || "").trim();
  if (!q) return [];

  const digits = q.replace(/\D/g, "");
  const isNumeric = /^\d+$/.test(q);
  const ci = { contains: q, mode: "insensitive" as const };
  const use = (f: string) => field === "all" || field === f;
  const or: any[] = [];

  // ID do cliente (exato)
  if (use("id") && isNumeric && q.length <= 9) {
    or.push({ id: Number(q) });
  }

  // Nome / Razão Social (inclui nome social, fantasia e responsável)
  if (use("nome")) {
    or.push({ name: ci }, { nomeSocial: ci }, { nomeFantasia: ci }, { responsavel: ci });
  }

  // CPF / CNPJ
  if (use("cpf_cnpj")) {
    or.push({ document: ci }, { cpfResponsavel: ci });
    if (digits.length >= 3) {
      const like = `%${digits}%`;
      const rows = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM "Customer"
        WHERE regexp_replace(COALESCE(document, ''), '[^0-9]', '', 'g') LIKE ${like}
           OR regexp_replace(COALESCE("cpfResponsavel", ''), '[^0-9]', '', 'g') LIKE ${like}
      `;
      if (rows.length) or.push({ id: { in: rows.map(r => Number(r.id)) } });
    }
  }

  // Telefone (principal, contatos do cliente e contatos dos endereços)
  if (use("telefone")) {
    or.push(
      { phone: ci },
      { contacts: { some: { value: ci } } },
      { locations: { some: { contacts: { some: { phone: ci } } } } }
    );
    if (digits.length >= 3) {
      const like = `%${digits}%`;
      const rows = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM "Customer"
          WHERE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE ${like}
        UNION
        SELECT "customerId" AS id FROM "CustomerContact"
          WHERE regexp_replace(COALESCE(value, ''), '[^0-9]', '', 'g') LIKE ${like}
        UNION
        SELECT l."customerId" AS id FROM "LocationContact" lc
          JOIN "CustomerLocation" l ON l.id = lc."locationId"
          WHERE regexp_replace(COALESCE(lc.phone, ''), '[^0-9]', '', 'g') LIKE ${like}
      `;
      if (rows.length) or.push({ id: { in: rows.map(r => Number(r.id)) } });
    }
  }

  // E-mail
  if (use("email")) {
    or.push({ contacts: { some: { value: ci } } });
  }

  // Endereço (rua, bairro, cidade, CEP, condomínio)
  if (use("rua")) {
    or.push({
      locations: {
        some: {
          OR: [
            { street: ci },
            { neighborhood: ci },
            { city: ci },
            { cep: ci },
            { condominium: { name: ci } },
          ],
        },
      },
    });
  }

  // Ocorrência / Ordem de Serviço (número ou ID da OS)
  if (use("os") || use("ocorrencia")) {
    const orderOr: any[] = [{ number: ci }];
    if (isNumeric && q.length <= 9) orderOr.push({ id: Number(q) });
    or.push({ orders: { some: { OR: orderOr } } });
  }

  if (or.length === 0) return [];

  const customers = await prisma.customer.findMany({
    where: { OR: or },
    take: 10,
    orderBy: [{ isHidden: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      document: true,
      phone: true,
      isHidden: true,
      nomeFantasia: true,
      nomeSocial: true,
      contacts: { take: 1, select: { value: true } },
      locations: { take: 1, select: { city: true, state: true, neighborhood: true } },
    },
  });

  // ID exato sempre aparece primeiro (mesmo se não estiver entre os 10 primeiros)
  if (use("id") && isNumeric && q.length <= 9) {
    const exactId = Number(q);
    const idx = customers.findIndex(c => c.id === exactId);
    if (idx > 0) {
      customers.unshift(customers.splice(idx, 1)[0]);
    } else if (idx === -1) {
      const exact = await prisma.customer.findUnique({
        where: { id: exactId },
        select: {
          id: true, name: true, type: true, document: true, phone: true, isHidden: true,
          nomeFantasia: true, nomeSocial: true,
          contacts: { take: 1, select: { value: true } },
          locations: { take: 1, select: { city: true, state: true, neighborhood: true } },
        },
      });
      if (exact) customers.unshift(exact);
    }
  }

  return customers.map(c => {
    const loc = c.locations[0];
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      document: c.document,
      isHidden: c.isHidden,
      subtitle: c.nomeFantasia || c.nomeSocial || null,
      contact: c.phone || c.contacts[0]?.value || null,
      location: loc ? [loc.neighborhood, loc.city && `${loc.city}${loc.state ? `/${loc.state}` : ""}`].filter(Boolean).join(" · ") : null,
    };
  });
}
