"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_COMPANY_INFO = {
  razaoSocial: "Confiança Dedetizadora LTDA ME",
  nomeFantasia: "Confiança Dedetizadora",
  cnpj: "11.365.123/0001-42",
  telefone: "(84) 3272-4289",
  email: "confianca_dedetizadora@hotmail.com",
  cidade: "Parnamirim",
  estado: "RN"
};

async function getCompanyInfo() {
  try {
    const comp = await prisma.company.findFirst({
      where: { isAtiva: true },
      orderBy: { isMatriz: "desc" }
    });
    if (comp) {
      return {
        razaoSocial: comp.razaoSocial || DEFAULT_COMPANY_INFO.razaoSocial,
        nomeFantasia: comp.nomeFantasia || comp.razaoSocial || DEFAULT_COMPANY_INFO.nomeFantasia,
        cnpj: comp.cnpj || DEFAULT_COMPANY_INFO.cnpj,
        telefone: comp.telefone || comp.whatsapp || DEFAULT_COMPANY_INFO.telefone,
        email: comp.email || DEFAULT_COMPANY_INFO.email,
        cidade: comp.cidade || DEFAULT_COMPANY_INFO.cidade,
        estado: comp.estado || DEFAULT_COMPANY_INFO.estado
      };
    }
  } catch (e) {
    console.error("Erro ao buscar dados da empresa:", e);
  }
  return DEFAULT_COMPANY_INFO;
}

async function getReferences() {
  const [customers, revenueCategories, expenseCategories, paymentMethods, cashPoints, vehicles, company] = await Promise.all([
    prisma.customer.findMany({
      where: { isHidden: false },
      select: { id: true, name: true, document: true, phone: true },
      orderBy: { name: "asc" }
    }),
    prisma.revenueCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.paymentMethod.findMany({ orderBy: { name: "asc" } }),
    prisma.cashPoint.findMany({ where: { ativo: true }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ where: { ativo: true }, select: { id: true, plate: true, model: true }, orderBy: { plate: "asc" } }),
    getCompanyInfo()
  ]);

  return {
    customers,
    revenueCategories,
    expenseCategories,
    paymentMethods,
    cashPoints,
    vehicles,
    company
  };
}

// 1. Relatório Pagamentos A Receber
export async function getRelatorioAReceberData(limit: number = 5000) {
  const safeLimit = Math.min(Math.max(limit, 50), 5000);

  const [receivables, refs] = await Promise.all([
    prisma.accountsReceivable.findMany({
      where: {
        status: { notIn: ["Recebido", "Pago", "Cancelado"] },
        OR: [
          { occurrenceId: null },
          { occurrence: { isHidden: false } }
        ]
      },
      include: {
        customer: true,
        category: true,
        paymentMethod: true,
        cashPoint: true,
        occurrence: true
      },
      orderBy: { due_date: "asc" },
      take: safeLimit
    }),
    getReferences()
  ]);

  return {
    items: receivables.map(r => ({
      id: r.id,
      tipo: "RECEBER" as const,
      description: r.description || "Receita sem descrição",
      clientId: r.clientId,
      customerName: r.customer?.name || (r.description?.split("|")[0]?.trim() || "Cliente não informado"),
      customerDocument: r.customer?.document || "",
      customerPhone: r.customer?.phone || "",
      categoryName: r.category?.name || "Sem Categoria",
      categoryId: r.categoryId,
      amount: r.amount,
      dueDate: r.due_date ? r.due_date.toISOString() : null,
      paymentDate: r.payment_date ? r.payment_date.toISOString() : null,
      status: r.status,
      paymentMethodName: r.paymentMethod?.name || (r.occurrence?.paymentMethodId ? "Definido na OS" : "Não informado"),
      paymentMethodId: r.paymentMethodId,
      cashPointName: r.cashPoint?.name || "Geral",
      cashPointId: r.cashPointId,
      occurrenceId: r.occurrenceId,
      occurrenceNumber: r.occurrence?.number || (r.occurrenceId ? `#${r.occurrenceId}` : null)
    })),
    ...refs
  };
}

// 2. Relatório Pagamentos Recebidos
export async function getRelatorioRecebidosData(limit: number = 5000) {
  const safeLimit = Math.min(Math.max(limit, 50), 5000);

  const [receivables, refs] = await Promise.all([
    prisma.accountsReceivable.findMany({
      where: {
        status: { in: ["Recebido", "Pago"] },
        OR: [
          { occurrenceId: null },
          { occurrence: { isHidden: false } }
        ]
      },
      include: {
        customer: true,
        category: true,
        paymentMethod: true,
        cashPoint: true,
        occurrence: true
      },
      orderBy: [{ payment_date: "desc" }, { due_date: "desc" }],
      take: safeLimit
    }),
    getReferences()
  ]);

  return {
    items: receivables.map(r => ({
      id: r.id,
      tipo: "RECEBIDO" as const,
      description: r.description || "Receita sem descrição",
      clientId: r.clientId,
      customerName: r.customer?.name || (r.description?.split("|")[0]?.trim() || "Cliente não informado"),
      customerDocument: r.customer?.document || "",
      customerPhone: r.customer?.phone || "",
      categoryName: r.category?.name || "Sem Categoria",
      categoryId: r.categoryId,
      amount: r.amount,
      dueDate: r.due_date ? r.due_date.toISOString() : null,
      paymentDate: r.payment_date ? r.payment_date.toISOString() : (r.due_date ? r.due_date.toISOString() : null),
      status: r.status,
      paymentMethodName: r.paymentMethod?.name || "Não informado",
      paymentMethodId: r.paymentMethodId,
      cashPointName: r.cashPoint?.name || "Caixa Geral",
      cashPointId: r.cashPointId,
      occurrenceId: r.occurrenceId,
      occurrenceNumber: r.occurrence?.number || (r.occurrenceId ? `#${r.occurrenceId}` : null)
    })),
    ...refs
  };
}

// 3. Relatório Pagamentos Emitidos (Contas a Pagar / Despesas)
export async function getRelatorioEmitidosData(limit: number = 5000) {
  const safeLimit = Math.min(Math.max(limit, 50), 5000);

  const [payables, refs] = await Promise.all([
    prisma.accountsPayable.findMany({
      include: {
        category: true,
        vehicle: true,
        cashPoint: true
      },
      orderBy: { due_date: "desc" },
      take: safeLimit
    }),
    getReferences()
  ]);

  return {
    items: payables.map(p => ({
      id: p.id,
      tipo: "EMITIDO" as const,
      description: p.description || "Despesa sem descrição",
      categoryName: p.category?.name || "Sem Categoria",
      categoryId: p.categoryId,
      responsible: p.responsible || "Não informado",
      vehiclePlate: p.vehicle?.plate ? `${p.vehicle.plate} - ${p.vehicle.model || ""}` : null,
      vehicleId: p.vehicleId,
      amount: p.amount,
      dueDate: p.due_date ? p.due_date.toISOString() : null,
      paymentDate: p.payment_date ? p.payment_date.toISOString() : null,
      status: p.status, // "Pago", "Pendente", "Cancelado"
      cashPointName: p.cashPoint?.name || "Caixa Geral",
      cashPointId: p.cashPointId
    })),
    ...refs
  };
}

// 4. Relatório Pagamentos Cancelados (Receitas e Despesas Canceladas)
export async function getRelatorioCanceladosData(limit: number = 5000) {
  const safeLimitPerType = Math.floor(Math.min(Math.max(limit, 50), 5000) / 2);

  const [cancelledReceivables, cancelledPayables, refs] = await Promise.all([
    prisma.accountsReceivable.findMany({
      where: { status: "Cancelado" },
      include: {
        customer: true,
        category: true,
        paymentMethod: true,
        cashPoint: true,
        occurrence: true
      },
      orderBy: { due_date: "desc" },
      take: safeLimitPerType
    }),
    prisma.accountsPayable.findMany({
      where: { status: "Cancelado" },
      include: {
        category: true,
        vehicle: true,
        cashPoint: true
      },
      orderBy: { due_date: "desc" },
      take: safeLimitPerType
    }),
    getReferences()
  ]);

  const items = [
    ...cancelledReceivables.map(r => ({
      id: r.id,
      origin: "RECEITA" as const,
      description: r.description || "Receita cancelada",
      partyName: r.customer?.name || (r.description?.split("|")[0]?.trim() || "Cliente não informado"),
      partyDocument: r.customer?.document || "",
      categoryName: r.category?.name || "Sem Categoria",
      amount: r.amount,
      dueDate: r.due_date ? r.due_date.toISOString() : null,
      paymentDate: r.payment_date ? r.payment_date.toISOString() : null,
      status: "Cancelado",
      paymentMethodName: r.paymentMethod?.name || "-",
      cashPointName: r.cashPoint?.name || "-",
      occurrenceId: r.occurrenceId,
      occurrenceNumber: r.occurrence?.number || (r.occurrenceId ? `#${r.occurrenceId}` : null)
    })),
    ...cancelledPayables.map(p => ({
      id: p.id,
      origin: "DESPESA" as const,
      description: p.description || "Despesa cancelada",
      partyName: p.responsible || "Fornecedor / Responsável não informado",
      partyDocument: "",
      categoryName: p.category?.name || "Sem Categoria",
      amount: p.amount,
      dueDate: p.due_date ? p.due_date.toISOString() : null,
      paymentDate: p.payment_date ? p.payment_date.toISOString() : null,
      status: "Cancelado",
      paymentMethodName: "-",
      cashPointName: p.cashPoint?.name || "-",
      occurrenceId: null,
      occurrenceNumber: null
    }))
  ];

  items.sort((a, b) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return db - da;
  });

  return {
    items,
    ...refs
  };
}

// 5. Relatório Pagamentos Em Atraso (Receitas e Despesas Vencidas)
export async function getRelatorioEmAtrasoData(limit: number = 5000) {
  const safeLimitPerType = Math.floor(Math.min(Math.max(limit, 50), 5000) / 2);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const [overdueReceivables, overduePayables, refs] = await Promise.all([
    prisma.accountsReceivable.findMany({
      where: {
        status: { notIn: ["Recebido", "Pago", "Cancelado"] },
        due_date: { lt: today },
        OR: [
          { occurrenceId: null },
          { occurrence: { isHidden: false } }
        ]
      },
      include: {
        customer: true,
        category: true,
        paymentMethod: true,
        cashPoint: true,
        occurrence: true
      },
      orderBy: { due_date: "asc" },
      take: safeLimitPerType
    }),
    prisma.accountsPayable.findMany({
      where: {
        status: { notIn: ["Pago", "Cancelado"] },
        due_date: { lt: today }
      },
      include: {
        category: true,
        vehicle: true,
        cashPoint: true
      },
      orderBy: { due_date: "asc" },
      take: safeLimitPerType
    }),
    getReferences()
  ]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const calculateAging = (dueDateStr: Date | null) => {
    if (!dueDateStr) return { days: 0, range: "1-15 dias", gravity: "low" };
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - due.getTime();
    const days = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    let range = "1-15 dias";
    let gravity: "low" | "medium" | "high" | "critical" = "low";

    if (days <= 15) {
      range = "1 a 15 dias";
      gravity = "low";
    } else if (days <= 30) {
      range = "16 a 30 dias";
      gravity = "medium";
    } else if (days <= 60) {
      range = "31 a 60 dias";
      gravity = "high";
    } else if (days <= 90) {
      range = "61 a 90 dias";
      gravity = "high";
    } else {
      range = "Mais de 90 dias";
      gravity = "critical";
    }

    return { days, range, gravity };
  };

  const items = [
    ...overdueReceivables.map(r => {
      const aging = calculateAging(r.due_date);
      // Estimativa comercial: Multa 2% + Juros 1% a.m pro rata (0.033% ao dia)
      const multa = r.amount * 0.02;
      const juros = r.amount * (0.01 / 30) * aging.days;
      const updatedAmount = r.amount + multa + juros;

      return {
        id: r.id,
        origin: "RECEBER" as const,
        description: r.description || "Recebível em atraso",
        debtorName: r.customer?.name || (r.description?.split("|")[0]?.trim() || "Cliente não informado"),
        debtorDocument: r.customer?.document || "",
        debtorPhone: r.customer?.phone || (r.description?.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/)?.[0] || ""),
        categoryName: r.category?.name || "Sem Categoria",
        categoryId: r.categoryId,
        amount: r.amount,
        estimatedTotal: updatedAmount,
        dueDate: r.due_date ? r.due_date.toISOString() : null,
        daysOverdue: aging.days,
        agingRange: aging.range,
        gravity: aging.gravity,
        status: r.status,
        paymentMethodName: r.paymentMethod?.name || "Não informado",
        cashPointName: r.cashPoint?.name || "Geral",
        occurrenceId: r.occurrenceId,
        occurrenceNumber: r.occurrence?.number || (r.occurrenceId ? `#${r.occurrenceId}` : null)
      };
    }),
    ...overduePayables.map(p => {
      const aging = calculateAging(p.due_date);
      const multa = p.amount * 0.02;
      const juros = p.amount * (0.01 / 30) * aging.days;
      const updatedAmount = p.amount + multa + juros;

      return {
        id: p.id,
        origin: "PAGAR" as const,
        description: p.description || "Despesa em atraso",
        debtorName: p.responsible || "Fornecedor / Responsável não informado",
        debtorDocument: "",
        debtorPhone: "",
        categoryName: p.category?.name || "Sem Categoria",
        categoryId: p.categoryId,
        amount: p.amount,
        estimatedTotal: updatedAmount,
        dueDate: p.due_date ? p.due_date.toISOString() : null,
        daysOverdue: aging.days,
        agingRange: aging.range,
        gravity: aging.gravity,
        status: p.status,
        paymentMethodName: "-",
        cashPointName: p.cashPoint?.name || "Geral",
        occurrenceId: null,
        occurrenceNumber: null
      };
    })
  ];

  // Ordenar pelos mais atrasados primeiro
  items.sort((a, b) => b.daysOverdue - a.daysOverdue);

  return {
    items,
    ...refs
  };
}
