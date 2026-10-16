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

export interface DRERowData {
  id: string;
  code?: string;
  description: string;
  type: "header" | "item" | "total" | "subtotal";
  level: number;
  jan: number;
  fev: number;
  mar: number;
  abr: number;
  mai: number;
  jun: number;
  jul: number;
  ago: number;
  set: number;
  out: number;
  nov: number;
  dez: number;
  total: number;
  percentage?: number; // % sobre a Receita Operacional Líquida
  isPositive?: boolean;
}

export interface DREKpis {
  receitaBrutaAnual: number;
  receitaLiquidaAnual: number;
  custosTotaisAnual: number;
  lucroBrutoAnual: number;
  margemBrutaPercent: number;
  despesasOperacionaisAnual: number;
  resultadoOperacionalAnual: number;
  resultadoLiquidoAnual: number;
  margemLiquidaPercent: number;
  mesMelhorResultado: { mes: string; valor: number } | null;
}

export async function getDREReportData(params?: {
  year?: number;
  regime?: "competencia" | "caixa";
  consider?: "realizado" | "projetado";
}) {
  const year = params?.year || new Date().getFullYear();
  const regime = params?.regime || "competencia";
  const consider = params?.consider || "projetado";

  const companyInfo = await getCompanyInfo();

  // Buscar todas as contas a receber
  const receivables = await prisma.accountsReceivable.findMany({
    include: {
      category: true,
      paymentMethod: true
    }
  });

  // Buscar todas as contas a pagar
  const payables = await prisma.accountsPayable.findMany({
    include: {
      category: true,
      vehicle: true
    }
  });

  // 12 meses (0 a 11)
  const initMonths = () => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // Matrizes de acumulação por categoria
  const revenueByCat: { [cat: string]: number[] } = {};
  const cancelamentosMes: number[] = initMonths();
  const descontosMes: number[] = initMonths();
  const impostosVendasMes: number[] = initMonths();

  const costsByCat: { [cat: string]: number[] } = {};
  const expensesByCat: { [cat: string]: number[] } = {};
  const financialDespesasMes: number[] = initMonths();
  const financialReceitasMes: number[] = initMonths();
  const impostosLucroMes: number[] = initMonths();

  // Processar Receitas
  for (const r of receivables) {
    let dateToUse: Date | null = null;

    if (regime === "caixa") {
      if (r.status !== "Pago" && r.status !== "Recebido") continue;
      dateToUse = r.payment_date ? new Date(r.payment_date) : (r.due_date ? new Date(r.due_date) : null);
    } else {
      // Competência
      dateToUse = r.due_date ? new Date(r.due_date) : null;
      if (r.status === "Cancelado") {
        if (dateToUse && dateToUse.getFullYear() === year) {
          const m = dateToUse.getMonth();
          cancelamentosMes[m] += r.amount;
        }
        continue;
      }
      if (consider === "realizado" && (r.status !== "Pago" && r.status !== "Recebido")) {
        continue;
      }
    }

    if (!dateToUse || dateToUse.getFullYear() !== year) continue;
    const m = dateToUse.getMonth();

    const catName = r.category?.name?.trim() || "Serviços Operacionais & Contratos";
    if (!revenueByCat[catName]) revenueByCat[catName] = initMonths();
    revenueByCat[catName][m] += r.amount;
  }

  // Processar Despesas / Custos
  for (const p of payables) {
    let dateToUse: Date | null = null;

    if (regime === "caixa") {
      if (p.status !== "Pago") continue;
      dateToUse = p.payment_date ? new Date(p.payment_date) : (p.due_date ? new Date(p.due_date) : null);
    } else {
      // Competência
      if (p.status === "Cancelado") continue;
      if (consider === "realizado" && p.status !== "Pago") continue;
      dateToUse = p.due_date ? new Date(p.due_date) : null;
    }

    if (!dateToUse || dateToUse.getFullYear() !== year) continue;
    const m = dateToUse.getMonth();

    const catName = p.category?.name?.trim() || "Despesas Gerais";
    const catLower = catName.toLowerCase();

    // 1. Custos Diretos dos Serviços (Insumos, Químicos, Combustível, Diárias, Frota)
    const isDirectCost = 
      p.vehicleId != null ||
      /quimic|inseticid|raticid|insumo|veneno|material|epi|peça|produto|combustivel|gasolina|diesel|veiculo|frota|diaria|tecnico|operacional/i.test(catLower);

    // 2. Despesas Financeiras
    const isFinancial = /banco|tarifa|taxa|juros|iof|cobranca|cartao|pix/i.test(catLower);

    // 3. Tributos sobre o Lucro
    const isTaxOnProfit = /irpj|csll|imposto de renda/i.test(catLower);

    // 4. Impostos Diretos sobre Serviços
    const isDirectTax = /iss|simples nacional|tributo/i.test(catLower);

    if (isFinancial) {
      financialDespesasMes[m] += p.amount;
    } else if (isTaxOnProfit) {
      impostosLucroMes[m] += p.amount;
    } else if (isDirectTax) {
      impostosVendasMes[m] += p.amount;
    } else if (isDirectCost) {
      const formattedCostCat = p.vehicleId != null && !catLower.includes("veic")
        ? `${catName} (Frota / Veículos)`
        : catName;
      if (!costsByCat[formattedCostCat]) costsByCat[formattedCostCat] = initMonths();
      costsByCat[formattedCostCat][m] += p.amount;
    } else {
      // Despesas Operacionais Gerais
      if (!expensesByCat[catName]) expensesByCat[catName] = initMonths();
      expensesByCat[catName][m] += p.amount;
    }
  }

  // Se não houver categorias de receita no período, adicionar linha padrão com zeros
  if (Object.keys(revenueByCat).length === 0) {
    revenueByCat["Serviços de Dedetização & Sanitização"] = initMonths();
    revenueByCat["Contratos Mensais Recorrentes"] = initMonths();
  }

  // Se não houver categorias de custos no período, adicionar linhas com zeros
  if (Object.keys(costsByCat).length === 0) {
    costsByCat["Insumos Químicos, Praguicidas & Raticidas"] = initMonths();
    costsByCat["Combustível & Manutenção da Frota Operacional"] = initMonths();
    costsByCat["Mão de Obra Operacional & Diárias Técnicas"] = initMonths();
  }

  // Se não houver despesas operacionais no período, adicionar linhas com zeros
  if (Object.keys(expensesByCat).length === 0) {
    expensesByCat["Despesas Administrativas & Instalações"] = initMonths();
    expensesByCat["Softwares, Sistemas & Telefonia"] = initMonths();
    expensesByCat["Comercial & Marketing"] = initMonths();
  }

  // Helpers de cálculo por mês
  const sumMonthArrays = (...arrays: number[][]): number[] => {
    const res = initMonths();
    for (let i = 0; i < 12; i++) {
      for (const arr of arrays) {
        res[i] += arr[i] || 0;
      }
    }
    return res;
  };

  const subtractMonthArrays = (a: number[], b: number[]): number[] => {
    const res = initMonths();
    for (let i = 0; i < 12; i++) {
      res[i] = (a[i] || 0) - (b[i] || 0);
    }
    return res;
  };

  // 1. Total Receita Bruta
  const receitaBrutaMes = sumMonthArrays(...Object.values(revenueByCat));

  // 2. Deduções
  const totalDeducoesMes = sumMonthArrays(cancelamentosMes, descontosMes, impostosVendasMes);

  // 3. Receita Operacional Líquida
  const receitaLiquidaMes = subtractMonthArrays(receitaBrutaMes, totalDeducoesMes);

  // 4. Custos dos Serviços
  const totalCustosMes = sumMonthArrays(...Object.values(costsByCat));

  // 5. Lucro Bruto
  const lucroBrutoMes = subtractMonthArrays(receitaLiquidaMes, totalCustosMes);

  // 6. Despesas Operacionais
  const totalDespesasOperacionaisMes = sumMonthArrays(...Object.values(expensesByCat));

  // 7. Resultado Operacional (EBITDA)
  const resultadoOperacionalMes = subtractMonthArrays(lucroBrutoMes, totalDespesasOperacionaisMes);

  // 8. Resultado Financeiro Líquido
  const resultadoFinanceiroMes = subtractMonthArrays(financialReceitasMes, financialDespesasMes);

  // 9. LAIR (Resultado Antes dos Tributos)
  const lairMes = sumMonthArrays(resultadoOperacionalMes, resultadoFinanceiroMes);

  // 10. Provisão de Tributos
  const tributosMes = impostosLucroMes;

  // 11. Resultado Líquido do Exercício
  const resultadoLiquidoMes = subtractMonthArrays(lairMes, tributosMes);

  // Função auxiliar para montar objeto DRERowData
  const createRow = (
    id: string,
    description: string,
    months: number[],
    type: "header" | "item" | "total" | "subtotal",
    level: number,
    code?: string
  ): DRERowData => {
    const total = months.reduce((acc, v) => acc + v, 0);
    const totalRecLiquida = receitaLiquidaMes.reduce((acc, v) => acc + v, 0);
    const percentage = totalRecLiquida > 0 ? (total / totalRecLiquida) * 100 : undefined;

    return {
      id,
      code,
      description,
      type,
      level,
      jan: months[0] || 0,
      fev: months[1] || 0,
      mar: months[2] || 0,
      abr: months[3] || 0,
      mai: months[4] || 0,
      jun: months[5] || 0,
      jul: months[6] || 0,
      ago: months[7] || 0,
      set: months[8] || 0,
      out: months[9] || 0,
      nov: months[10] || 0,
      dez: months[11] || 0,
      total,
      percentage,
      isPositive: total >= 0
    };
  };

  // Construir matriz de linhas da DRE seguindo o padrão contábil executivo
  const rows: DRERowData[] = [];

  // ==========================================
  // 1. RECEITA OPERACIONAL BRUTA
  // ==========================================
  rows.push(createRow("rec_bruta", "RECEITA OPERACIONAL BRUTA", receitaBrutaMes, "header", 0, "1"));
  Object.entries(revenueByCat).forEach(([cat, months], idx) => {
    rows.push(createRow(`rec_cat_${idx}`, cat, months, "item", 1, `1.${idx + 1}`));
  });

  // ==========================================
  // 2. DEDUÇÕES DA RECEITA BRUTA
  // ==========================================
  rows.push(createRow("deducoes", "DEDUÇÕES SOBRE VENDAS E SERVIÇOS", totalDeducoesMes, "header", 0, "2"));
  rows.push(createRow("ded_canc", "Cancelamentos e Estornos de Títulos", cancelamentosMes, "item", 1, "2.1"));
  rows.push(createRow("ded_desc", "Descontos Concedidos e Abatimentos", descontosMes, "item", 1, "2.2"));
  rows.push(createRow("ded_imp", "Impostos Incidentes sobre Serviços (ISS / Simples)", impostosVendasMes, "item", 1, "2.3"));

  // ==========================================
  // 3. RECEITA OPERACIONAL LÍQUIDA
  // ==========================================
  rows.push(createRow("rec_liquida", "RECEITA OPERACIONAL LÍQUIDA", receitaLiquidaMes, "total", 0, "3"));

  // ==========================================
  // 4. CUSTOS DOS SERVIÇOS PRESTADOS (CSP / CMV)
  // ==========================================
  rows.push(createRow("custos_servicos", "CUSTO DOS SERVIÇOS PRESTADOS (CSP / CMV)", totalCustosMes, "header", 0, "4"));
  Object.entries(costsByCat).forEach(([cat, months], idx) => {
    rows.push(createRow(`custo_cat_${idx}`, cat, months, "item", 1, `4.${idx + 1}`));
  });

  // ==========================================
  // 5. LUCRO BRUTO (MARGEM BRUTA)
  // ==========================================
  rows.push(createRow("lucro_bruto", "LUCRO BRUTO OPERACIONAL", lucroBrutoMes, "total", 0, "5"));

  // ==========================================
  // 6. DESPESAS OPERACIONAIS
  // ==========================================
  rows.push(createRow("desp_operacionais", "DESPESAS OPERACIONAIS", totalDespesasOperacionaisMes, "header", 0, "6"));
  Object.entries(expensesByCat).forEach(([cat, months], idx) => {
    rows.push(createRow(`desp_cat_${idx}`, cat, months, "item", 1, `6.${idx + 1}`));
  });

  // ==========================================
  // 7. RESULTADO OPERACIONAL (EBITDA / LAJIDA)
  // ==========================================
  rows.push(createRow("ebitda", "RESULTADO OPERACIONAL (EBITDA)", resultadoOperacionalMes, "total", 0, "7"));

  // ==========================================
  // 8. RESULTADO FINANCEIRO
  // ==========================================
  rows.push(createRow("res_financeiro", "RESULTADO FINANCEIRO LÍQUIDO", resultadoFinanceiroMes, "header", 0, "8"));
  rows.push(createRow("fin_rec", "(+) Receitas Financeiras (Rendimentos / Juros)", financialReceitasMes, "item", 1, "8.1"));
  rows.push(createRow("fin_desp", "(-) Despesas Bancárias, Juros e Taxas de Cartão/Pix", financialDespesasMes, "item", 1, "8.2"));

  // ==========================================
  // 9. RESULTADO ANTES DOS TRIBUTOS (LAIR)
  // ==========================================
  rows.push(createRow("lair", "RESULTADO ANTES DOS TRIBUTOS (LAIR)", lairMes, "total", 0, "9"));

  // ==========================================
  // 10. TRIBUTOS SOBRE O LUCRO
  // ==========================================
  rows.push(createRow("tributos_lucro", "Provisão para IRPJ e CSLL", tributosMes, "item", 0, "10"));

  // ==========================================
  // 11. RESULTADO LÍQUIDO DO EXERCÍCIO
  // ==========================================
  rows.push(createRow("resultado_liquido", "RESULTADO LÍQUIDO DO EXERCÍCIO", resultadoLiquidoMes, "total", 0, "11"));

  // KPIs Executivos
  const totalRecBrutaAnual = receitaBrutaMes.reduce((a, b) => a + b, 0);
  const totalRecLiquidaAnual = receitaLiquidaMes.reduce((a, b) => a + b, 0);
  const totalCustosAnual = totalCustosMes.reduce((a, b) => a + b, 0);
  const totalLucroBrutoAnual = lucroBrutoMes.reduce((a, b) => a + b, 0);
  const totalDespesasOpAnual = totalDespesasOperacionaisMes.reduce((a, b) => a + b, 0);
  const totalResultadoOpAnual = resultadoOperacionalMes.reduce((a, b) => a + b, 0);
  const totalResultadoLiqAnual = resultadoLiquidoMes.reduce((a, b) => a + b, 0);

  const margemBrutaPercent = totalRecLiquidaAnual > 0 
    ? (totalLucroBrutoAnual / totalRecLiquidaAnual) * 100 
    : 0;

  const margemLiquidaPercent = totalRecLiquidaAnual > 0 
    ? (totalResultadoLiqAnual / totalRecLiquidaAnual) * 100 
    : 0;

  // Melhor mês
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  let bestMonth = { mes: "Nenhum", valor: 0 };
  let maxLiq = -Infinity;
  resultadoLiquidoMes.forEach((val, idx) => {
    if (val > maxLiq) {
      maxLiq = val;
      bestMonth = { mes: monthNames[idx], valor: val };
    }
  });

  const kpis: DREKpis = {
    receitaBrutaAnual: totalRecBrutaAnual,
    receitaLiquidaAnual: totalRecLiquidaAnual,
    custosTotaisAnual: totalCustosAnual,
    lucroBrutoAnual: totalLucroBrutoAnual,
    margemBrutaPercent,
    despesasOperacionaisAnual: totalDespesasOpAnual,
    resultadoOperacionalAnual: totalResultadoOpAnual,
    resultadoLiquidoAnual: totalResultadoLiqAnual,
    margemLiquidaPercent,
    mesMelhorResultado: bestMonth.valor > 0 ? bestMonth : null
  };

  // Evolução mensal para gráficos
  const monthlyChartData = monthNames.map((name, i) => ({
    label: name.slice(0, 3),
    fullName: name,
    receitaLiquida: receitaLiquidaMes[i],
    custosEDespesas: totalCustosMes[i] + totalDespesasOperacionaisMes[i],
    lucroBruto: lucroBrutoMes[i],
    resultadoLiquido: resultadoLiquidoMes[i]
  }));

  // Distribuição de custos e despesas para gráfico Donut
  const expenseSlices = [
    ...Object.entries(costsByCat).map(([label, months]) => ({
      label: `Custo: ${label}`,
      value: months.reduce((a, b) => a + b, 0)
    })),
    ...Object.entries(expensesByCat).map(([label, months]) => ({
      label: `Despesa: ${label}`,
      value: months.reduce((a, b) => a + b, 0)
    })),
    {
      label: "Despesas Financeiras",
      value: financialDespesasMes.reduce((a, b) => a + b, 0)
    }
  ].filter(s => s.value > 0).sort((a, b) => b.value - a.value);

  return {
    year,
    regime,
    consider,
    companyInfo,
    rows,
    kpis,
    monthlyChartData,
    expenseSlices
  };
}
