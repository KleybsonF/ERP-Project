"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

function revalidateFinanceiro() {
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/receitas");
  revalidatePath("/financeiro/despesas");
  revalidatePath("/financeiro/pontos-recebimento");
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
      cashPoint: true,
    },
    orderBy: { due_date: "desc" }
  });

  const payables = await prisma.accountsPayable.findMany({
    where: dateFilter,
    include: { 
      category: true, 
      vehicle: true,
      cashPoint: true 
    },
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
    await syncExpenseCategorySequence();
    expenseCategories = await prisma.expenseCategory.findMany();
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { ativo: true },
    orderBy: { plate: 'asc' }
  });

  const cashPoints = await prisma.cashPoint.findMany({
    where: { ativo: true },
    orderBy: { id: "asc" }
  });

  return { receivables, payables, customers, paymentMethods, expenseCategories, vehicles, cashPoints };
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
      cashPoint: true,
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

  const cashPoints = await prisma.cashPoint.findMany({
    where: { ativo: true },
    orderBy: { id: "asc" }
  });

  return { receivables, customers, paymentMethods, cashPoints };
}

export async function getPayablesData(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate && endDate ? { due_date: { gte: startDate, lte: endDate } } : {};

  const payables = await prisma.accountsPayable.findMany({
    where: dateFilter,
    include: { 
      category: true, 
      vehicle: true,
      cashPoint: true 
    },
    orderBy: { due_date: "desc" }
  });

  let expenseCategories = await prisma.expenseCategory.findMany();
  if (expenseCategories.length === 0) {
    await prisma.expenseCategory.createMany({
      data: [{ name: "Fornecedores" }, { name: "Combustível" }, { name: "Alimentação" }, { name: "Manutenção Veicular" }, { name: "Salários" }, { name: "Impostos" }]
    });
    await syncExpenseCategorySequence();
    expenseCategories = await prisma.expenseCategory.findMany();
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { ativo: true },
    orderBy: { plate: "asc" }
  });

  const cashPoints = await prisma.cashPoint.findMany({
    where: { ativo: true },
    orderBy: { id: "asc" }
  });

  return { payables, expenseCategories, vehicles, cashPoints };
}

export async function receivePayment(receivableId: number, occurrenceId: number | null, cashPointId?: number | null) {
  const updateData: any = { status: "Recebido" };
  if (cashPointId) {
    updateData.cashPointId = Number(cashPointId);
  }

  const rec = await prisma.accountsReceivable.update({
    where: { id: receivableId },
    data: updateData,
    include: { customer: true, cashPoint: true }
  });

  if (occurrenceId) {
    await prisma.occurrence.update({
      where: { id: occurrenceId },
      data: { payment_status: "Recebido" }
    });
    revalidatePath("/ocorrencias");
    revalidatePath("/os");
  }

  const cxName = rec.cashPoint ? ` no caixa "${rec.cashPoint.name}"` : "";
  await createLog("STATUS", "Financeiro", `Baixa realizada no recebível #${receivableId}${cxName} (Cliente: ${rec.customer.name}, Valor: R$ ${rec.amount.toFixed(2)}).`);

  revalidateFinanceiro();
  return rec;
}

export async function createReceivable(data: { clientId: number; amount: number; due_date: Date; paymentMethodId: number | null; cashPointId?: number | null; status?: string }) {
  const rec = await prisma.accountsReceivable.create({
    data: {
      clientId: data.clientId,
      amount: data.amount,
      due_date: data.due_date,
      paymentMethodId: data.paymentMethodId,
      cashPointId: data.cashPointId ? Number(data.cashPointId) : null,
      status: data.status || "Pendente"
    },
    include: { customer: true, cashPoint: true }
  });

  const cxName = rec.cashPoint ? ` vinculado ao caixa "${rec.cashPoint.name}"` : "";
  await createLog("CRIOU", "Financeiro", `Conta a Receber criada${cxName}: Cliente ${rec.customer.name}, Valor R$ ${rec.amount.toFixed(2)}.`);

  revalidateFinanceiro();
  return rec;
}

export async function createPayable(data: { description: string; categoryId: number; amount: number; due_date: Date; vehicleId: number | null; cashPointId?: number | null; responsible?: string; status?: string }) {
  const pay = await prisma.accountsPayable.create({
    data: {
      description: data.description,
      categoryId: data.categoryId,
      amount: data.amount,
      due_date: data.due_date,
      vehicleId: data.vehicleId,
      cashPointId: data.cashPointId ? Number(data.cashPointId) : null,
      responsible: data.responsible || null,
      status: data.status || "Pendente"
    },
    include: { category: true, cashPoint: true }
  });

  const cxName = pay.cashPoint ? ` vinculado ao caixa "${pay.cashPoint.name}"` : "";
  await createLog("CRIOU", "Financeiro", `Conta a Pagar criada${cxName}: "${pay.description}" (${pay.category.name}), Valor R$ ${pay.amount.toFixed(2)}.`);

  revalidateFinanceiro();
  return pay;
}

export async function payPayable(id: number, cashPointId?: number | null) {
  const updateData: any = { status: "Pago" };
  if (cashPointId) {
    updateData.cashPointId = Number(cashPointId);
  }

  const pay = await prisma.accountsPayable.update({
    where: { id },
    data: updateData,
    include: { cashPoint: true }
  });

  const cxName = pay.cashPoint ? ` do caixa "${pay.cashPoint.name}"` : "";
  await createLog("STATUS", "Financeiro", `Baixa de pagamento realizada na despesa #${id}${cxName} ("${pay.description}", Valor: R$ ${pay.amount.toFixed(2)}).`);

  revalidateFinanceiro();
  return pay;
}

export async function updateReceivable(id: number, data: { clientId: number; amount: number; due_date: Date; paymentMethodId: number | null; cashPointId?: number | null; status: string }) {
  const updated = await prisma.accountsReceivable.update({
    where: { id },
    data: {
      clientId: data.clientId,
      amount: data.amount,
      due_date: data.due_date,
      paymentMethodId: data.paymentMethodId,
      cashPointId: data.cashPointId !== undefined ? (data.cashPointId ? Number(data.cashPointId) : null) : undefined,
      status: data.status
    },
    include: { customer: true, cashPoint: true }
  });

  await createLog("EDITOU", "Financeiro", `Conta a Receber #${id} atualizada (Cliente: ${updated.customer.name}, Valor: R$ ${updated.amount.toFixed(2)}, Status: ${updated.status}).`);

  revalidateFinanceiro();
  return updated;
}

export async function updatePayable(id: number, data: { description: string; categoryId: number; amount: number; due_date: Date; vehicleId: number | null; cashPointId?: number | null; responsible: string; status: string }) {
  const updated = await prisma.accountsPayable.update({
    where: { id },
    data: {
      description: data.description,
      categoryId: data.categoryId,
      amount: data.amount,
      due_date: data.due_date,
      vehicleId: data.vehicleId,
      cashPointId: data.cashPointId !== undefined ? (data.cashPointId ? Number(data.cashPointId) : null) : undefined,
      responsible: data.responsible,
      status: data.status
    },
    include: { category: true, cashPoint: true }
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

async function syncExpenseCategorySequence() {
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE
        m_id int;
      BEGIN
        SELECT MAX(id) INTO m_id FROM "ExpenseCategory";
        IF m_id IS NULL OR m_id < 1 THEN
          PERFORM setval('"ExpenseCategory_id_seq"', 1, false);
        ELSE
          PERFORM setval('"ExpenseCategory_id_seq"', m_id, true);
        END IF;
      END $$;
    `);
  } catch (e) {
    console.error("Failed to sync ExpenseCategory sequence:", e);
  }
}

export async function createExpenseCategory(name: string) {
  try {
    const cat = await prisma.expenseCategory.create({
      data: { name: name.trim() }
    });
    revalidateFinanceiro();
    return cat;
  } catch (err: any) {
    if (err?.code === "P2002") {
      await syncExpenseCategorySequence();
      const retry = await prisma.expenseCategory.create({
        data: { name: name.trim() }
      });
      revalidateFinanceiro();
      return retry;
    }
    throw err;
  }
}

export interface ImportPayableItem {
  description: string;
  categoryName?: string;
  amount: number;
  due_date: string | Date;
  vehiclePlate?: string;
  cashPointName?: string;
  responsible?: string;
  status?: string;
}

export async function importPayables(items: ImportPayableItem[]) {
  if (!items || items.length === 0) {
    throw new Error("Nenhum registro para importar.");
  }

  // 1. Carregar categorias existentes
  let existingCategories = await prisma.expenseCategory.findMany();
  const categoryMap = new Map<string, number>();
  existingCategories.forEach((cat) => {
    categoryMap.set(cat.name.trim().toLowerCase(), cat.id);
  });

  // Categoria padrão caso a linha não informe nenhuma
  let defaultCategoryId: number;
  if (categoryMap.has("outros")) {
    defaultCategoryId = categoryMap.get("outros")!;
  } else if (existingCategories.length > 0) {
    defaultCategoryId = existingCategories[0].id;
  } else {
    try {
      const createdDefault = await prisma.expenseCategory.create({
        data: { name: "Outros" }
      });
      defaultCategoryId = createdDefault.id;
      categoryMap.set("outros", createdDefault.id);
    } catch (e: any) {
      if (e?.code === "P2002") {
        await syncExpenseCategorySequence();
        const retryDefault = await prisma.expenseCategory.create({
          data: { name: "Outros" }
        });
        defaultCategoryId = retryDefault.id;
        categoryMap.set("outros", retryDefault.id);
      } else {
        throw e;
      }
    }
  }

  // 2. Carregar veículos para matching por placa
  const vehicles = await prisma.vehicle.findMany();
  const vehicleMap = new Map<string, number>();
  vehicles.forEach((v) => {
    const cleanPlate = v.plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleanPlate) vehicleMap.set(cleanPlate, v.id);
  });

  // 3. Carregar caixas para matching por nome
  const cashPoints = await prisma.cashPoint.findMany();
  const cashPointMap = new Map<string, number>();
  cashPoints.forEach((cp) => {
    cashPointMap.set(cp.name.trim().toLowerCase(), cp.id);
  });

  // 4. Processar itens e resolver IDs
  const toCreate: Array<{
    description: string;
    categoryId: number;
    amount: number;
    due_date: Date;
    vehicleId: number | null;
    cashPointId: number | null;
    responsible: string | null;
    status: string;
  }> = [];

  for (const item of items) {
    if (!item.description || !item.description.trim()) continue;

    // Categoria
    let catId = defaultCategoryId;
    const rawCat = (item.categoryName || "").trim();
    if (rawCat) {
      const catKey = rawCat.toLowerCase();
      if (categoryMap.has(catKey)) {
        catId = categoryMap.get(catKey)!;
      } else {
        try {
          const newCat = await prisma.expenseCategory.create({
            data: { name: rawCat }
          });
          catId = newCat.id;
          categoryMap.set(catKey, newCat.id);
        } catch (catErr: any) {
          if (catErr?.code === "P2002") {
            await syncExpenseCategorySequence();
            const retryCat = await prisma.expenseCategory.create({
              data: { name: rawCat }
            });
            catId = retryCat.id;
            categoryMap.set(catKey, retryCat.id);
          } else {
            throw catErr;
          }
        }
      }
    }

    // Veículo
    let vId: number | null = null;
    if (item.vehiclePlate) {
      const cleanPlate = item.vehiclePlate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (cleanPlate && vehicleMap.has(cleanPlate)) {
        vId = vehicleMap.get(cleanPlate)!;
      }
    }

    // Caixa / Ponto de Pagamento (opcional, fica null se não informado ou não encontrado)
    let cpId: number | null = null;
    if (item.cashPointName) {
      const cpKey = item.cashPointName.trim().toLowerCase();
      if (cpKey && cashPointMap.has(cpKey)) {
        cpId = cashPointMap.get(cpKey)!;
      }
    }

    // Data de vencimento
    let parsedDate: Date;
    if (item.due_date instanceof Date) {
      parsedDate = item.due_date;
    } else if (typeof item.due_date === "string") {
      const d = new Date(item.due_date);
      parsedDate = isNaN(d.getTime()) ? new Date() : d;
    } else {
      parsedDate = new Date();
    }

    // Status
    let normalizedStatus = "Pendente";
    const stClean = (item.status || "").trim().toLowerCase();
    if (stClean.includes("pago") || stClean.includes("liquid") || stClean.includes("quitat")) {
      normalizedStatus = "Pago";
    } else if (stClean.includes("canc")) {
      normalizedStatus = "Cancelado";
    }

    toCreate.push({
      description: item.description.trim(),
      categoryId: catId,
      amount: Math.abs(Number(item.amount)) || 0,
      due_date: parsedDate,
      vehicleId: vId,
      cashPointId: cpId,
      responsible: item.responsible ? item.responsible.trim() : null,
      status: normalizedStatus
    });
  }

  if (toCreate.length === 0) {
    throw new Error("Nenhum dado válido encontrado para importar.");
  }

  await prisma.accountsPayable.createMany({
    data: toCreate
  });

  await createLog(
    "CRIOU",
    "Financeiro",
    `Importação concluída: ${toCreate.length} conta(s) a pagar importada(s) via planilha Excel.`
  );

  revalidateFinanceiro();
  return { success: true, count: toCreate.length };
}
