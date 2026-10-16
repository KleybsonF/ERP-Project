"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Phone, 
  DollarSign, 
  Percent, 
  ShieldAlert, 
  Copy, 
  Check
} from "lucide-react";
import ReportHeader from "../components/ReportHeader";
import ReportFilters, { FilterState } from "../components/ReportFilters";
import ReportCharts from "../components/ReportCharts";
import ReportTable, { TableColumn } from "../components/ReportTable";
import { exportToExcel, exportToPdf, formatCurrency, formatDateBr } from "../utils/exportUtils";

interface EmAtrasoReportClientProps {
  initialData: {
    items: any[];
    customers: any[];
    revenueCategories: any[];
    expenseCategories: any[];
    cashPoints: any[];
    company: any;
  };
}

export default function EmAtrasoReportClient({ initialData }: EmAtrasoReportClientProps) {
  const { items, customers, revenueCategories, expenseCategories, cashPoints, company } = initialData;

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    period: "todos",
    startDate: "",
    endDate: "",
    dateField: "due_date",
    clientId: "",
    categoryId: "",
    paymentMethodId: "",
    cashPointId: "",
    minAmount: "",
    maxAmount: "",
    limit: 5000,
    originFilter: "TODOS",
    agingFilter: "TODOS"
  });

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyCobrança = (row: any) => {
    const text = `Olá ${row.debtorName}, identificamos uma pendência no valor de ${formatCurrency(row.amount)} vencida em ${formatDateBr(row.dueDate)} (${row.daysOverdue} dias de atraso). Solicitamos a gentileza de entrar em contato para regularização. Obrigado!`;
    navigator.clipboard.writeText(text);
    setCopiedId(row.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Combine categories
  const allCategories = useMemo(() => {
    const list = [...revenueCategories, ...expenseCategories];
    const uniqueMap = new Map();
    list.forEach(c => uniqueMap.set(c.name, c));
    return Array.from(uniqueMap.values());
  }, [revenueCategories, expenseCategories]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    let result = items;

    // Search query
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(item => {
        return (
          String(item.id).includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.debtorName?.toLowerCase().includes(q) ||
          item.debtorDocument?.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q) ||
          item.occurrenceNumber?.toLowerCase().includes(q)
        );
      });
    }

    // Origin filter (Receber vs Pagar)
    if (filters.originFilter && filters.originFilter !== "TODOS") {
      result = result.filter(item => item.origin === filters.originFilter);
    }

    // Aging filter
    if (filters.agingFilter && filters.agingFilter !== "TODOS") {
      result = result.filter(item => item.agingRange === filters.agingFilter);
    }

    // Date range filter (Vencimento)
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate + "T00:00:00") : null;
      const end = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;

      result = result.filter(item => {
        if (!item.dueDate) return false;
        const itemDate = new Date(item.dueDate);
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
      });
    }

    // Amount range
    if (filters.minAmount) {
      const min = Number(filters.minAmount);
      result = result.filter(item => item.amount >= min);
    }
    if (filters.maxAmount) {
      const max = Number(filters.maxAmount);
      result = result.filter(item => item.amount <= max);
    }

    // Limit applied
    return result.slice(0, filters.limit);
  }, [items, filters]);

  // KPIs
  const totalAmount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredData]);

  const totalEstimatedAmount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.estimatedTotal || item.amount || 0), 0);
  }, [filteredData]);

  const averageDays = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const sumDays = filteredData.reduce((acc, item) => acc + (item.daysOverdue || 0), 0);
    return Math.round(sumDays / filteredData.length);
  }, [filteredData]);

  const criticalCount = useMemo(() => {
    return filteredData.filter(item => item.daysOverdue > 60).length;
  }, [filteredData]);

  // Aging distribution chart
  const agingChartData = useMemo(() => {
    const map: { [range: string]: number } = {
      "1 a 15 dias": 0,
      "16 a 30 dias": 0,
      "31 a 60 dias": 0,
      "61 a 90 dias": 0,
      "Mais de 90 dias": 0
    };
    filteredData.forEach(item => {
      const r = item.agingRange || "1 a 15 dias";
      map[r] = (map[r] || 0) + item.amount;
    });

    const colors: { [key: string]: string } = {
      "1 a 15 dias": "#facc15",
      "16 a 30 dias": "#f59e0b",
      "31 a 60 dias": "#f97316",
      "61 a 90 dias": "#ef4444",
      "Mais de 90 dias": "#9333ea"
    };

    return Object.entries(map).map(([label, value]) => ({
      label,
      value,
      color: colors[label]
    }));
  }, [filteredData]);

  const timeSeriesData = useMemo(() => {
    const map: { [month: string]: { value: number; count: number } } = {};
    filteredData.forEach(item => {
      if (!item.dueDate) return;
      const d = new Date(item.dueDate);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { value: 0, count: 0 };
      map[key].value += item.amount;
      map[key].count += 1;
    });

    return Object.keys(map).sort().slice(-8).map(key => {
      const [year, month] = key.split("-");
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const label = `${monthNames[Number(month) - 1]}/${year.slice(2)}`;
      return {
        label,
        value: map[key].value,
        count: map[key].count
      };
    });
  }, [filteredData]);

  const categoryChartData = useMemo(() => {
    const map: { [cat: string]: number } = {};
    filteredData.forEach(item => {
      const cat = item.categoryName || "Geral";
      map[cat] = (map[cat] || 0) + item.amount;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const rankingChartData = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(item => ({
        label: item.debtorName || item.description,
        value: item.amount,
        secondary: `${item.daysOverdue} dias de atraso`
      }));
  }, [filteredData]);

  // Table Columns
  const columns: TableColumn<any>[] = [
    {
      header: "#ID",
      dataKey: "id",
      render: row => (
        <span style={{ fontWeight: 700, color: "var(--primary-color)", fontSize: "12px" }}>
          #{row.id}
        </span>
      )
    },
    {
      header: "Origem",
      dataKey: "origin",
      render: row => (
        <span style={{
          background: row.origin === "RECEBER" ? "rgba(59, 130, 246, 0.15)" : "rgba(239, 68, 68, 0.15)",
          color: row.origin === "RECEBER" ? "#3b82f6" : "#ef4444",
          padding: "3px 8px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 700
        }}>
          {row.origin === "RECEBER" ? "A Receber" : "A Pagar"}
        </span>
      )
    },
    {
      header: "Devedor / Responsável",
      dataKey: "debtorName",
      render: row => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
            {row.debtorName}
          </span>
          {row.debtorPhone && (
            <span style={{ fontSize: "11px", color: "var(--primary-color)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Phone size={10} /> {row.debtorPhone}
            </span>
          )}
        </div>
      )
    },
    {
      header: "Descrição / OS",
      dataKey: "description",
      render: row => (
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "220px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.description}
          </span>
          {row.occurrenceNumber && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              OS: <strong>{row.occurrenceNumber}</strong>
            </span>
          )}
        </div>
      )
    },
    {
      header: "Vencimento",
      dataKey: "dueDate",
      render: row => (
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {formatDateBr(row.dueDate)}
        </span>
      )
    },
    {
      header: "Atraso",
      dataKey: "daysOverdue",
      align: "center",
      render: row => {
        const bg = row.gravity === "critical" ? "rgba(147, 51, 234, 0.2)" :
                   row.gravity === "high" ? "rgba(239, 68, 68, 0.2)" :
                   row.gravity === "medium" ? "rgba(245, 158, 11, 0.2)" : "rgba(250, 204, 21, 0.2)";
        const color = row.gravity === "critical" ? "#a855f7" :
                      row.gravity === "high" ? "#ef4444" :
                      row.gravity === "medium" ? "#f59e0b" : "#eab308";
        return (
          <span style={{
            background: bg,
            color: color,
            padding: "3px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: 800,
            whiteSpace: "nowrap"
          }}>
            {row.daysOverdue} dias
          </span>
        );
      }
    },
    {
      header: "Faixa Aging",
      dataKey: "agingRange",
      render: row => (
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {row.agingRange}
        </span>
      )
    },
    {
      header: "Valor Original",
      dataKey: "amount",
      align: "right",
      render: row => (
        <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "13px" }}>
          {formatCurrency(row.amount)}
        </span>
      )
    },
    {
      header: "Com Multa/Juros",
      dataKey: "estimatedTotal",
      align: "right",
      render: row => (
        <span style={{ fontWeight: 800, color: "var(--danger)", fontSize: "13px" }} title="Inclui estimativa de 2% multa + 1% ao mês pro rata">
          {formatCurrency(row.estimatedTotal)}
        </span>
      )
    },
    {
      header: "Cobrança",
      dataKey: "actions",
      align: "center",
      sortable: false,
      render: row => (
        <button
          type="button"
          onClick={() => handleCopyCobrança(row)}
          className="btn btn-secondary"
          style={{
            padding: "4px 8px",
            fontSize: "11px",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
          title="Copiar texto padrão de cobrança amigável"
        >
          {copiedId === row.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
          <span>{copiedId === row.id ? "Copiado!" : "Copiar"}</span>
        </button>
      )
    }
  ];

  // Export handlers
  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportToExcel({
        reportTitle: "Pagamentos Em Atraso (Inadimplência)",
        filename: "relatorio_pagamentos_em_atraso",
        columns: [
          { header: "ID", dataKey: "id" },
          { header: "Origem", dataKey: "origin" },
          { header: "Devedor / Responsável", dataKey: "debtorName" },
          { header: "Telefone", dataKey: "debtorPhone" },
          { header: "Descrição", dataKey: "description" },
          { header: "OS Vinculada", dataKey: "occurrenceNumber" },
          { header: "Categoria", dataKey: "categoryName" },
          { header: "Vencimento", dataKey: "dueDateFormatted" },
          { header: "Dias de Atraso", dataKey: "daysOverdue" },
          { header: "Faixa de Aging", dataKey: "agingRange" },
          { header: "Valor Original (R$)", dataKey: "amountFormatted" },
          { header: "Valor Atualizado (R$)", dataKey: "estimatedTotalFormatted" },
          { header: "Status", dataKey: "status" }
        ],
        rows: filteredData.map(r => ({
          ...r,
          dueDateFormatted: formatDateBr(r.dueDate),
          amountFormatted: r.amount?.toFixed(2).replace(".", ","),
          estimatedTotalFormatted: r.estimatedTotal?.toFixed(2).replace(".", ",")
        })),
        filtersSummary: [
          { label: "Período", value: filters.period },
          { label: "Origem", value: filters.originFilter || "TODOS" },
          { label: "Faixa Aging", value: filters.agingFilter || "TODAS" },
          { label: "Limite de Linhas", value: String(filters.limit) },
          { label: "Registros Filtrados", value: String(filteredData.length) }
        ],
        kpiSummary: [
          { label: "Total em Atraso", value: formatCurrency(totalAmount) },
          { label: "Com Multa/Juros", value: formatCurrency(totalEstimatedAmount) },
          { label: "Qtd Títulos Vencidos", value: String(filteredData.length) },
          { label: "Média de Atraso", value: `${averageDays} dias` }
        ],
        companyInfo: company
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      exportToPdf({
        reportTitle: "Relatório Financeiro: Pagamentos Em Atraso / Inadimplência",
        filename: "relatorio_pagamentos_em_atraso",
        columns: [
          { header: "#ID", dataKey: "id" },
          { header: "Origem", dataKey: "origin" },
          { header: "Devedor / Responsável", dataKey: "debtorName" },
          { header: "Descrição / OS", dataKey: "description" },
          { header: "Vencimento", dataKey: "dueDateFormatted" },
          { header: "Dias Atraso", dataKey: "daysOverdueFormatted", align: "center" },
          { header: "Faixa Aging", dataKey: "agingRange" },
          { header: "Valor Original", dataKey: "amountFormatted", align: "right" },
          { header: "Atualizado", dataKey: "estimatedTotalFormatted", align: "right" }
        ],
        rows: filteredData.map(r => ({
          ...r,
          dueDateFormatted: formatDateBr(r.dueDate),
          daysOverdueFormatted: `${r.daysOverdue} dias`,
          amountFormatted: formatCurrency(r.amount),
          estimatedTotalFormatted: formatCurrency(r.estimatedTotal)
        })),
        filtersSummary: [
          { label: "Período", value: filters.period },
          { label: "Origem", value: filters.originFilter || "TODOS" },
          { label: "Faixa Aging", value: filters.agingFilter || "TODAS" },
          { label: "Limite", value: `${filters.limit} linhas` },
          { label: "Registros", value: String(filteredData.length) }
        ],
        kpiSummary: [
          { label: "Total Atrasado", value: formatCurrency(totalAmount) },
          { label: "Com Juros/Multa", value: formatCurrency(totalEstimatedAmount) },
          { label: "Títulos Vencidos", value: String(filteredData.length) },
          { label: "Média Dias", value: `${averageDays} dias` }
        ],
        companyInfo: company
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "40px" }}>
      <ReportHeader
        title="Pagamentos Em Atraso"
        description="Gestão de cobrança, aging de inadimplência e projeção de encargos moratórios"
        badgeText="Inadimplência"
        icon={AlertTriangle}
        iconColor="#f59e0b"
        kpiCards={[
          {
            label: "Total Vencido em Atraso",
            value: totalAmount,
            isCurrency: true,
            color: "#ef4444",
            icon: DollarSign,
            subValue: "Valor principal em inadimplência"
          },
          {
            label: "Com Encargos (Multa+Juros)",
            value: totalEstimatedAmount,
            isCurrency: true,
            color: "#a855f7",
            icon: Percent,
            subValue: "Estimativa comercial atualizada"
          },
          {
            label: "Média de Atraso",
            value: `${averageDays} dias`,
            color: "var(--text-main)",
            icon: Clock,
            subValue: `${criticalCount} títulos acima de 60 dias`
          },
          {
            label: "Títulos Vencidos",
            value: filteredData.length,
            color: "#f59e0b",
            icon: ShieldAlert,
            subValue: "Pendências de cobrança ativa"
          }
        ]}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        isExportingExcel={isExportingExcel}
        isExportingPdf={isExportingPdf}
        totalFilteredCount={filteredData.length}
        totalRawCount={items.length}
      />

      <ReportFilters
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={() => setFilters({
          search: "",
          period: "todos",
          startDate: "",
          endDate: "",
          dateField: "due_date",
          clientId: "",
          categoryId: "",
          paymentMethodId: "",
          cashPointId: "",
          minAmount: "",
          maxAmount: "",
          limit: 5000,
          originFilter: "TODOS",
          agingFilter: "TODOS"
        })}
        categories={allCategories}
        showOriginFilter={true}
        showAgingFilter={true}
        showDateFieldSelector={false}
        totalFiltered={filteredData.length}
        totalLimitApplied={filters.limit}
      />

      <ReportCharts
        title="Análise de Aging e Inadimplência"
        timeSeriesData={timeSeriesData}
        timeSeriesTitle="Volume Vencido por Mês de Origem"
        categoryData={agingChartData}
        categoryTitle="Montante por Faixa de Atraso (Aging)"
        secondarySliceData={categoryChartData}
        secondarySliceTitle="Inadimplência por Categoria"
        rankingData={rankingChartData}
        rankingTitle="Top 5 Maiores Inadimplentes"
      />

      <ReportTable
        columns={columns}
        data={filteredData}
        totalAmount={totalAmount}
        totalAmountLabel="Total Vencido em Atraso"
        defaultSortKey="daysOverdue"
        defaultSortDir="desc"
        emptyMessage="Nenhum título em atraso encontrado para os filtros aplicados. Parabéns pela pontualidade!"
      />
    </div>
  );
}
