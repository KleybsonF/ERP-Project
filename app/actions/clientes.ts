"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getCustomers() {
  return await prisma.customer.findMany({
    include: {
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
  locations?: { 
    street: string; 
    neighborhood: string; 
    city: string; 
    state: string; 
    cep: string; 
    contacts?: { name: string; phone: string }[] 
  }[] 
}) {
  const doc = data.document.trim() === "" ? null : data.document.trim();
  await prisma.customer.create({
    data: {
      name: data.name,
      type: data.type,
      document: doc,
      phone: data.phone,
      ...(data.locations && data.locations.length > 0 ? {
        locations: {
          create: data.locations.map(loc => ({
            street: loc.street,
            neighborhood: loc.neighborhood,
            city: loc.city,
            state: loc.state,
            cep: loc.cep,
            ...(loc.contacts && loc.contacts.length > 0 ? {
              contacts: {
                create: loc.contacts.map(c => ({ name: c.name, phone: c.phone }))
              }
            } : {})
          }))
        }
      } : {})
    }
  });
  revalidatePath("/clientes");
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
  locations?: { 
    id?: number;
    street: string; 
    neighborhood: string; 
    city: string; 
    state: string; 
    cep: string; 
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
    }
  });

  // Then update locations if provided
  if (data.locations && data.locations.length > 0) {
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
            cep: loc.cep
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
            cep: loc.cep
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
