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

export async function createCustomer(data: { name: string; document: string; phone: string; street?: string; neighborhood?: string; city?: string; state?: string; cep?: string; contacts?: { name: string; phone: string }[] }) {
  await prisma.customer.create({
    data: {
      name: data.name,
      document: data.document,
      phone: data.phone,
      ...((data.street && data.neighborhood && data.city && data.state && data.cep) ? {
        locations: {
          create: {
            street: data.street,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            cep: data.cep,
            ...(data.contacts && data.contacts.length > 0 ? {
              contacts: {
                create: data.contacts.map(c => ({ name: c.name, phone: c.phone }))
              }
            } : {})
          }
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

export async function updateCustomer(id: number, data: { name: string; document: string; phone: string; locationId?: number; street?: string; neighborhood?: string; city?: string; state?: string; cep?: string }) {
  await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      document: data.document,
      phone: data.phone,
    }
  });

  if (data.locationId && data.street && data.neighborhood && data.city && data.state && data.cep) {
    await prisma.customerLocation.update({
      where: { id: data.locationId },
      data: {
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        cep: data.cep
      }
    });
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
