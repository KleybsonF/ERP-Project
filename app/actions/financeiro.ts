"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

function revalidateFinanceiro() {
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/receitas");
  revalidatePath("/financeiro/despesas");
  revalidatePath("/");
}

export async function getFinanceiroData(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate && endDate ? { due_date: { gte: startDate, lte: endDate } } : {};
  
  const receivables = await prisma.accountsReceivable.findMany({
    where: {
      ...dateFilter,
      OR: [
        { occurrenceId: null },
        { occurrence: { isHidden: false } }
      ]
    },
    include: {
      customer: true,
      occurrence: true,
      paymentMethod: true,
    },
    orderBy: { due_date: "desc" }
  });

  const payables = await prisma.accountsPayable.findMany({
    where: dateFilter,
    include: { category: true, vehicle: true },
    orderBy: { due_date: "desc" }
  });

  const customers = await prisma.customer.findMany({ 
    where: { isHidden: false },
    orderBy: { name: 'asc' } 
  });
  const paymentMethods = await prisma.paymentMethod.findMany();
  
  let expenseCategories = await prisma.expenseCategory.findMany();
  if (expenseCategories.length === 0) {
    await prisma.expenseCategory.createMany({
      data: [{ name: "Fornecedores" }, { name: "Combustível" }, { name: "Alimentação" }, { name: "Manutenção Veicular" }, { name: "Salários" }, { name: "Impostos" }]
    });
    expenseCategories = await prisma.expenseCategory.findMany();
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { ativo: true },
    orderBy: { plate: 'asc' }
  });

  return { receivables, payables, customers, paymentMethods, expenseCategories, vehicles };
}

export async function getReceivablesData(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate && endDate ? { due_date: { gte: startDate, lte: endDate } } : {};

  const receivables = await prisma.accountsReceivable.findMany({
    where: {
      ...dateFilter,
      OR: [
        { occurrenceId: null },
        { occurrence: { isHidden: false } }
      ]
    },
    include: {
      customer: true,
      occurrence: true,
      paymentMethod: true,
    },
    orderBy: { due_date: "desc" }
  });

  const customers = await prisma.customer.findMany({
    where: { isHidden: false },
    orderBy: { name: "asc" }
  });

  let paymentMethods = await prisma.paymentMethod.findMany();
  if (paymentMethods.length === 0) {
    await prisma.paymentMethod.createMany({
      data: [{ name: "Pix" }, { name: "Boleto" }, { name: "Cartão de Crédito" }, { name: "Cartão de Débito" }, { name: "Transferência" }, { name: "Dinheiro" }]
    });
    paymentMethods = await prisma.paymentMethod.findMany();
  }

  return { receivables, customers, paymentMethods };
}

export async function getPayablesData(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate && endDate ? { due_date: { gte: startDate, lte: endDate } } : {};

  const payables = await prisma.accountsPayable.findMany({
    where: dateFilter,
    include: { category: true, vehicle: true },
    orderBy: { due_date: "desc" }
  });

  let expenseCategories = await prisma.expenseCategory.findMany();
  if (expenseCategories.length === 0) {
    await prisma.expenseCategory.createMany({
      data: [{ name: "Fornecedores" }, { name: "Combustível" }, { name: "Alimentação" }, { name: "Manutenção Veicular" }, { name: "Salários" }, { name: "Impostos" }]
    });
    expenseCategories = await prisma.expenseCategory.findMany();
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { ativo: true },
    orderBy: { plate: "asc" }
  });

  return { payables, expenseCategories, vehicles };
}

export async function receivePayment(receivableId: number, occurrenceId: number | null) {
  const rec = await prisma.accountsReceivable.update({
    where: { id: receivableId },
    data: { status: "Recebido" },
    include: { customer: true }
  });

  if (occurrenceId) {
    await prisma.occurrence.update({
      where: { id: occurrenceId },
      data: { payment_status: "Recebido" }
    });
    revalidatePath("/ocorrencias");
    revalidatePath("/os");
  }

  await createLog("STATUS", "Financeiro", `Baixa realizada no recebível #${receivableId} (Cliente: ${rec.customer.name}, Valor: R$ ${rec.amount.toFixed(2)}).`);

  revalidateFinanceiro();
  return rec;
}

export async function createReceivable(data: { clientId: number; amount: number; due_date: Date; paymentMethodId: number | null; status?: string }) {
  const rec = await prisma.accountsReceivable.create({
    data: {
      clientId: data.clientId,
      amount: data.amount,
      due_date: data.due_date,
      paymentMethodId: data.paymentMethodId,
      status: data.status || "Pendente"
    },
    include: { customer: true }
  });

  await createLog("CRIOU", "Financeiro", `Conta a Receber avulsa criada: Cliente ${rec.customer.name}, Valor R$ ${rec.amount.toFixed(2)}.`);

  revalidateFinanceiro();
  return rec;
}

export async function createPayable(data: { description: string; categoryId: number; amount: number; due_date: Date; vehicleId: number | null; responsible?: string; status?: string }) {
  const pay = await prisma.accountsPayable.create({
    data: {
      description: data.description,
      categoryId: data.categoryId,
      amount: data.amount,
      due_date: data.due_date,
      vehicleId: data.vehicleId,
      responsible: data.responsible || null,
      status: data.status || "Pendente"
    },
    include: { category: true }
  });

  await createLog("CRIOU", "Financeiro", `Conta a Pagar criada: "${pay.description}" (${pay.category.name}), Valor R$ ${pay.amount.toFixed(2)}.`);

  revalidateFinanceiro();
  return pay;
}

export async function payPayable(id: number) {
  const pay = await prisma.accountsPayable.update({
    where: { id },
    data: { status: "Pago" }
  });

  await createLog("STATUS", "Financeiro", `Baixa de pagamento realizada na despesa #${id} ("${pay.description}", Valor: R$ ${pay.amount.toFixed(2)}).`);

  revalidateFinanceiro();
  return pay;
}

export async function updateReceivable(id: number, data: { clientId: number; amount: number; due_date: Date; paymentMethodId: number | null; status: string }) {
  const updated = await prisma.accountsReceivable.update({
    where: { id },
    data: {
      clientId: data.clientId,
      amount: data.amount,
      due_date: data.due_date,
      paymentMethodId: data.paymentMethodId,
      status: data.status
    },
    include: { customer: true }
  });

  await createLog("EDITOU", "Financeiro", `Conta a Receber #${id} atualizada (Cliente: ${updated.customer.name}, Valor: R$ ${updated.amount.toFixed(2)}, Status: ${updated.status}).`);

  revalidateFinanceiro();
  return updated;
}

export async function updatePayable(id: number, data: { description: string; categoryId: number; amount: number; due_date: Date; vehicleId: number | null; responsible: string; status: string }) {
  const updated = await prisma.accountsPayable.update({
    where: { id },
    data,
    include: { category: true }
  });

  await createLog("EDITOU", "Financeiro", `Conta a Pagar #${id} atualizada ("${updated.description}", Valor: R$ ${updated.amount.toFixed(2)}, Status: ${updated.status}).`);

  revalidateFinanceiro();
  return updated;
}

export async function deleteReceivable(id: number) {
  const rec = await prisma.accountsReceivable.findUnique({ 
    where: { id },
    include: { customer: true }
  });
  if (rec?.occurrenceId) {
    throw new Error("Não é possível remover receita vinculada a uma Ocorrência/O.S. Cancele a ocorrência para anular.");
  }
  await prisma.accountsReceivable.delete({ where: { id } });

  await createLog("EXCLUIU", "Financeiro", `Conta a Receber #${id} excluída (Cliente: ${rec?.customer.name || "N/A"}).`);

  revalidateFinanceiro();
}

export async function deletePayable(id: number) {
  const pay = await prisma.accountsPayable.findUnique({ where: { id } });
  await prisma.accountsPayable.delete({ where: { id } });

  await createLog("EXCLUIU", "Financeiro", `Conta a Pagar #${id} excluída ("${pay?.description || "N/A"}").`);

  revalidateFinanceiro();
}

export async function createExpenseCategory(name: string) {
  const cat = await prisma.expenseCategory.create({
    data: { name: name.trim() }
  });
  revalidateFinanceiro();
  return cat;
}
