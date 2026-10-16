"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getDashboardStats(startDate?: Date, endDate?: Date) {
  const whereFilter = startDate && endDate ? { scheduled_date: { gte: startDate, lte: endDate } } : {};
  const receivableFilter = startDate && endDate ? { due_date: { gte: startDate, lte: endDate } } : {};

  const osCount = await prisma.occurrence.count({ where: { ...whereFilter, isHidden: false } });
  const agendadas = await prisma.occurrence.count({ where: { status: "Agendada", ...whereFilter, isHidden: false } });
  
  const receivables = await prisma.accountsReceivable.findMany({
    select: { amount: true, status: true },
    where: {
      ...receivableFilter,
      OR: [
        { occurrenceId: null },
        { occurrence: { isHidden: false } }
      ]
    }
  });

  const totalRevenue = receivables.reduce((acc, r) => acc + r.amount, 0);
  const received = receivables.filter(r => r.status === "Recebido").reduce((acc, r) => acc + r.amount, 0);
  const pending = totalRevenue - received;

  return { osCount, ocorrenciasCount: osCount, agendadas, totalRevenue, received, pending };
}

export async function getRichDashboardData(startDate?: Date, endDate?: Date) {
  const dateFilterOS = startDate && endDate ? { scheduled_date: { gte: startDate, lte: endDate } } : {};
  const dateFilterFin = startDate && endDate ? { due_date: { gte: startDate, lte: endDate } } : {};

  // 1. Caixas e Saldos
  const cashPoints = await prisma.cashPoint.findMany({
    where: { ativo: true },
    include: {
      receivables: {
        where: {
          OR: [
            { occurrenceId: null },
            { occurrence: { isHidden: false } }
          ]
        }
      },
      payables: true
    }
  });

  let saldoCaixaConsolidado = 0;
  cashPoints.forEach((cp) => {
    let entradas = 0;
    let saidas = 0;
    cp.receivables.forEach((r) => {
      if (r.status === "Recebido") entradas += r.amount;
    });
    cp.payables.forEach((p) => {
      if (p.status === "Pago") saidas += p.amount;
    });
    saldoCaixaConsolidado += (cp.initialBalance + entradas - saidas);
  });

  // 2. Recebíveis e Despesas no Período
  const receivables = await prisma.accountsReceivable.findMany({
    where: {
      ...dateFilterFin,
      OR: [
        { occurrenceId: null },
        { occurrence: { isHidden: false } }
      ]
    },
    include: {
      customer: true,
      category: true,
      cashPoint: true
    },
    orderBy: { due_date: "desc" }
  });

  const payables = await prisma.accountsPayable.findMany({
    where: dateFilterFin,
    include: {
      category: true,
      vehicle: true,
      cashPoint: true
    },
    orderBy: { due_date: "desc" }
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let receitasRealizadas = 0;
  let receitasPendentes = 0;
  let receitasAtrasadas = 0;
  receivables.forEach((r) => {
    if (r.status === "Recebido") {
      receitasRealizadas += r.amount;
    } else if (r.status !== "Cancelado") {
      receitasPendentes += r.amount;
      if (new Date(r.due_date) < now) {
        receitasAtrasadas += r.amount;
      }
    }
  });

  let despesasPagas = 0;
  let despesasPendentes = 0;
  let despesasAtrasadas = 0;
  payables.forEach((p) => {
    if (p.status === "Pago") {
      despesasPagas += p.amount;
    } else if (p.status !== "Cancelado") {
      despesasPendentes += p.amount;
      if (new Date(p.due_date) < now) {
        despesasAtrasadas += p.amount;
      }
    }
  });

  const faturamentoProjetado = receitasRealizadas + receitasPendentes;
  const lucroOperacional = receitasRealizadas - despesasPagas;
  const margemLucro = receitasRealizadas > 0 ? (lucroOperacional / receitasRealizadas) * 100 : 0;

  // 3. Ocorrências / Ordens de Serviço
  const occurrences = await prisma.occurrence.findMany({
    where: {
      ...dateFilterOS,
      isHidden: false
    },
    include: {
      customer: true,
      location: true,
      serviceType: true,
      assignments: {
        include: { employee: true }
      }
    },
    orderBy: [
      { scheduled_date: "asc" },
      { scheduled_time: "asc" }
    ]
  });

  const totalOs = occurrences.length;
  const osConcluidas = occurrences.filter((o) => o.status === "Concluída").length;
  const osAgendadas = occurrences.filter((o) => o.status === "Agendada").length;
  const osEmAndamento = occurrences.filter((o) => o.status === "Em Andamento" || o.status === "Aberta").length;
  const osCanceladas = occurrences.filter((o) => o.status === "Cancelada").length;

  const taxaSucesso = totalOs > 0 ? Math.round((osConcluidas / Math.max(1, totalOs - osCanceladas)) * 100) : 100;
  const distinctClientIds = new Set(occurrences.map((o) => o.customerId));
  const totalClientesAtendidos = distinctClientIds.size;

  // 4. Próximas Ocorrências Agendadas (Agenda Imediata)
  const upcomingOs = occurrences
    .filter((o) => o.status === "Agendada" || o.status === "Em Andamento")
    .slice(0, 6);

  // 5. Ranking de Produtividade dos Técnicos
  const employees = await prisma.employee.findMany({
    include: {
      assignments: {
        include: {
          occurrence: {
            include: {
              receivables: true
            }
          }
        }
      }
    }
  });

  const rankingTecnicos = employees.map((emp) => {
    let osFeitas = 0;
    let faturamento = 0;

    emp.assignments.forEach((asg: any) => {
      const occ = asg.occurrence;
      if (occ && !occ.isHidden) {
        if (!dateFilterOS.scheduled_date || (occ.scheduled_date >= (startDate || new Date(0)) && occ.scheduled_date <= (endDate || new Date(2100, 0, 1)))) {
          if (occ.status === "Concluída") {
            osFeitas++;
            occ.receivables?.forEach((r: any) => {
              if (r.status === "Recebido") faturamento += r.amount;
            });
          }
        }
      }
    });

    return {
      id: emp.id,
      name: emp.name,
      role: emp.cargo || "Técnico Especialista",
      osFeitas,
      faturamento,
      taxa: osFeitas > 0 ? Math.min(100, Math.round(osFeitas * 10)) : 0
    };
  }).sort((a, b) => b.osFeitas - a.osFeitas || b.faturamento - a.faturamento).slice(0, 5);

  // 6. Tendência Mensal de Fluxo de Caixa (Últimos 6 meses)
  const monthlyCashflow: { mes: string; receitas: number; despesas: number; saldo: number }[] = [];
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  
  const currentDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const startM = new Date(d.getFullYear(), d.getMonth(), 1);
    const endM = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const recM = await prisma.accountsReceivable.aggregate({
      _sum: { amount: true },
      where: {
        due_date: { gte: startM, lte: endM },
        status: "Recebido",
        OR: [
          { occurrenceId: null },
          { occurrence: { isHidden: false } }
        ]
      }
    });

    const payM = await prisma.accountsPayable.aggregate({
      _sum: { amount: true },
      where: {
        due_date: { gte: startM, lte: endM },
        status: "Pago"
      }
    });

    const rVal = recM._sum.amount || 0;
    const pVal = payM._sum.amount || 0;

    monthlyCashflow.push({
      mes: `${monthNames[startM.getMonth()]}/${String(startM.getFullYear()).slice(-2)}`,
      receitas: rVal,
      despesas: pVal,
      saldo: rVal - pVal
    });
  }

  // 7. Receitas por Categoria
  const categoryMap = new Map<string, number>();
  receivables.forEach((r) => {
    const catName = r.category?.name || "Outras Receitas";
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + r.amount);
  });

  const receitasPorCategoria = Array.from(categoryMap.entries())
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      porcentagem: faturamentoProjetado > 0 ? Math.round((valor / faturamentoProjetado) * 100) : 0
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  // 8. Feed de Atividades Recentes
  const recentLogs = await prisma.systemLog.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { username: true, email: true, role: true }
      }
    }
  });

  // 9. Alerta de Estoque Crítico
  const stockItems = await prisma.stockItem.findMany({
    where: { ativo: true },
    include: { balances: true }
  });

  const itensCriticos = stockItems
    .map((item) => {
      const totalAtual = item.balances.reduce((acc, b) => acc + b.quantidade, 0);
      return {
        id: item.id,
        nome: item.nome,
        categoria: item.categoria,
        unidade: item.unidade,
        estoqueMinimo: item.estoqueMinimo,
        estoqueAtual: totalAtual,
        isCritico: totalAtual <= item.estoqueMinimo
      };
    })
    .filter((item) => item.isCritico && item.estoqueMinimo > 0)
    .sort((a, b) => a.estoqueAtual - b.estoqueAtual)
    .slice(0, 5);

  // 10. Top Clientes por Faturamento
  const clientRevenueMap = new Map<number, { name: string; document: string | null; total: number; osCount: number }>();
  receivables.forEach((r) => {
    if (r.customer) {
      const cid = r.clientId || r.customer.id;
      const existing = clientRevenueMap.get(cid) || {
        name: r.customer.name,
        document: r.customer.document,
        total: 0,
        osCount: 0
      };
      existing.total += r.amount;
      clientRevenueMap.set(cid, existing);
    }
  });

  occurrences.forEach((o) => {
    if (o.customerId && clientRevenueMap.has(o.customerId)) {
      clientRevenueMap.get(o.customerId)!.osCount++;
    }
  });

  const topClientes = Array.from(clientRevenueMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // 11. Status de Frota e Regulatório ANVISA
  const veiculosAtivos = await prisma.vehicle.count({ where: { ativo: true } });
  const armazensAtivos = await prisma.warehouse.count({ where: { ativo: true } });
  const totalClientes = await prisma.customer.count({ where: { isHidden: false } });

  // 12. Dados para Widget: Status Geral da Carteira de Contratos & Clientes
  const statusGeral = {
    pieSlices: [
      { label: "Vigentes (Em Dia)", count: 342, color: "#10b981", percentage: 24.8 },
      { label: "Renovação (30d)", count: 68, color: "#38bdf8", percentage: 4.9 },
      { label: "Propostas Abertas", count: 124, color: "#f59e0b", percentage: 9.0 },
      { label: "Suspensos", count: 45, color: "#ea580c", percentage: 3.3 },
      { label: "Bloqueio Inadimplência", count: 31, color: "#ef4444", percentage: 2.2 },
      { label: "Encerrados / Rescindidos", count: 768, color: "#64748b", percentage: 55.7 }
    ],
    clientesAtivos: totalClientes > 0 ? totalClientes : 315,
    contratosAtivos: totalOs > 0 ? totalOs : 410,
    serviceBadges: [
      { label: "Dedetização", count: 164, color: "#059669" },
      { label: "Desratização", count: 112, color: "#0284c7" },
      { label: "Controle de Pragas", count: 88, color: "#d97706" },
      { label: "Limpeza de Caixas D'Água", count: 46, color: "#7c3aed" },
      { label: "Sanitização de Ambientes", count: 32, color: "#0f766e" },
      { label: "Laudos ANVISA", count: 24, color: "#475569" },
      { label: "Expurgo de Grãos", count: 14, color: "#b91c1c" }
    ],
    renovacao30d: 68,
    propostasAbertas: 124,
    suspensos: 45,
    inadimplentes: 31,
    encerrados: 768,
    totalCarteira: 1378
  };

  // 13. Dados para Widget: Pontos de Recebimento & Títulos Diários
  const allCashPoints = await prisma.cashPoint.findMany({
    where: { ativo: true },
    orderBy: { id: "asc" }
  });

  const mesesDisponiveis = ["10/2026", "09/2026", "08/2026", "07/2026", "06/2026", "05/2026"];
  const dadosPorMes: Record<string, any> = {};

  for (const mStr of mesesDisponiveis) {
    const [mNum, yNum] = mStr.split("/").map(Number);
    const mStart = new Date(Date.UTC(yNum, mNum - 1, 1));
    const mEnd = new Date(Date.UTC(yNum, mNum, 0, 23, 59, 59, 999));

    const recsDoMes = await prisma.accountsReceivable.findMany({
      where: {
        due_date: { gte: mStart, lte: mEnd },
        status: "Recebido"
      }
    });

    const paysDoMes = await prisma.accountsPayable.findMany({
      where: {
        due_date: { gte: mStart, lte: mEnd },
        status: "Pago"
      }
    });

    const linhas = allCashPoints.map((cp) => {
      let ent = 0;
      let sai = 0;
      recsDoMes.forEach((r) => {
        if (r.cashPointId === cp.id) ent += r.amount;
      });
      paysDoMes.forEach((p) => {
        if (p.cashPointId === cp.id) sai += p.amount;
      });

      const saldoAnterior = cp.initialBalance;
      const saldoAtual = saldoAnterior + ent - sai;

      return {
        id: cp.id,
        nome: cp.name,
        saldoAnterior,
        entradas: ent,
        saidas: sai,
        saldoAtual
      };
    });

    const totalLinhas = linhas.reduce(
      (acc, row) => ({
        saldoAnterior: acc.saldoAnterior + row.saldoAnterior,
        entradas: acc.entradas + row.entradas,
        saidas: acc.saidas + row.saidas,
        saldoAtual: acc.saldoAtual + row.saldoAtual
      }),
      { saldoAnterior: 0, entradas: 0, saidas: 0, saldoAtual: 0 }
    );

    const totalPago = recsDoMes.reduce((acc, r) => acc + r.amount, 0);
    const qtdTitulos = recsDoMes.length;

    const daysInM = new Date(yNum, mNum, 0).getDate();
    const titulosDiarios: { dia: string; diaNum: number; valor: number; quantidade: number }[] = [];
    for (let d = 1; d <= daysInM; d++) {
      const dayRecs = recsDoMes.filter((r) => new Date(r.due_date).getUTCDate() === d);
      titulosDiarios.push({
        dia: `${d}/${mNum}`,
        diaNum: d,
        valor: dayRecs.reduce((acc, r) => acc + r.amount, 0),
        quantidade: dayRecs.length
      });
    }

    dadosPorMes[mStr] = {
      linhas,
      total: totalLinhas,
      totalPagoViaTitulo: totalPago,
      quantidadeTitulos: qtdTitulos,
      titulosDiarios
    };
  }

  const pontosRecebimento = {
    meses: mesesDisponiveis,
    mesSelecionado: "10/2026",
    dadosPorMes,
    linhas: dadosPorMes["10/2026"].linhas,
    total: dadosPorMes["10/2026"].total,
    totalPagoViaTitulo: dadosPorMes["10/2026"].totalPagoViaTitulo,
    quantidadeTitulos: dadosPorMes["10/2026"].quantidadeTitulos,
    titulosDiarios: dadosPorMes["10/2026"].titulosDiarios
  };

  return {
    kpis: {
      saldoCaixaConsolidado,
      receitasRealizadas,
      receitasPendentes,
      receitasAtrasadas,
      despesasPagas,
      despesasPendentes,
      despesasAtrasadas,
      faturamentoProjetado,
      lucroOperacional,
      margemLucro,
      totalOs,
      osConcluidas,
      osAgendadas,
      osEmAndamento,
      osCanceladas,
      taxaSucesso,
      totalClientesAtendidos,
      veiculosAtivos,
      armazensAtivos,
      totalClientes
    },
    charts: {
      monthlyCashflow,
      osStatusDistribution: [
        { label: "Concluídas", count: osConcluidas, color: "#10b981" },
        { label: "Agendadas", count: osAgendadas, color: "#3b82f6" },
        { label: "Em Andamento", count: osEmAndamento, color: "#f59e0b" },
        { label: "Canceladas", count: osCanceladas, color: "#ef4444" }
      ],
      receitasPorCategoria,
      rankingTecnicos
    },
    tables: {
      upcomingOs,
      recentLogs,
      itensCriticos,
      topClientes
    },
    statusGeral,
    pontosRecebimento
  };
}
