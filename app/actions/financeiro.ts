"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getFinanceiroData(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate && endDate ? { due_date: { gte: startDate, lte: endDate } } : {};
  
  const receivables = await prisma.accountsReceivable.findMany({
    where: {
      ...dateFilter,
      OR: [
        { orderId: null },
        { serviceOrder: { isHidden: false } }
      ]
    },
    include: {
      customer: true,
      serviceOrder: true,
      paymentMethod: true,
    },
    orderBy: { due_date: "desc" }
  });

  const payables = await prisma.accountsPayable.findMany({
    where: dateFilter,
    include: { category: true, vehicle: true },
    orderBy: { due_date: "desc" }
  });

  const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } });
  const paymentMethods = await prisma.paymentMethod.findMany();
  
  let expenseCategories = await prisma.expenseCategory.findMany();
  if (expenseCategories.length === 0) {
    await prisma.expenseCategory.createMany({
      data: [{ name: "Fornecedores" }, { name: "Combustível" }, { name: "Alimentação" }, { name: "Manutenção Veicular" }, { name: "Salários" }, { name: "Impostos" }]
    });
    expenseCategories = await prisma.expenseCategory.findMany();
  }

  const vehicles = await prisma.vehicle.findMany();

  return { receivables, payables, customers, paymentMethods, expenseCategories, vehicles };
}

export async function receivePayment(receivableId: number, orderId: number | null) {
  await prisma.accountsReceivable.update({
    where: { id: receivableId },
    data: { status: "Recebido" }
  });

  if (orderId) {
    await prisma.serviceOrder.update({
      where: { id: orderId },
      data: { payment_status: "Recebido" }
    });
  }

  revalidatePath("/financeiro");
  revalidatePath("/os");
  revalidatePath("/");
}

export async function createReceivable(data: { clientId: number; amount: number; due_date: Date; paymentMethodId: number | null }) {
  await prisma.accountsReceivable.create({
    data: {
      ...data,
      status: "Pendente"
    }
  });
  revalidatePath("/financeiro");
  revalidatePath("/");
}

export async function createPayable(data: { description: string; categoryId: number; amount: number; due_date: Date; vehicleId: number | null; responsible: string }) {
  await prisma.accountsPayable.create({
    data: {
      ...data,
      status: "Pendente"
    }
  });
  revalidatePath("/financeiro");
  revalidatePath("/");
}

export async function payPayable(id: number) {
  await prisma.accountsPayable.update({
    where: { id },
    data: { status: "Pago" }
  });
  revalidatePath("/financeiro");
  revalidatePath("/");
}

export async function updateReceivable(id: number, data: { clientId: number; amount: number; due_date: Date; paymentMethodId: number | null; status: string }) {
  await prisma.accountsReceivable.update({
    where: { id },
    data: {
      clientId: data.clientId,
      amount: data.amount,
      due_date: data.due_date,
      paymentMethodId: data.paymentMethodId,
      status: data.status
    }
  });
  revalidatePath("/financeiro");
  revalidatePath("/");
}

export async function updatePayable(id: number, data: { description: string; categoryId: number; amount: number; due_date: Date; vehicleId: number | null; responsible: string; status: string }) {
  await prisma.accountsPayable.update({
    where: { id },
    data
  });
  revalidatePath("/financeiro");
  revalidatePath("/");
}
