"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  TrendingDown, 
  DollarSign, 
  FileX2,
  Layers
} from "lucide-react";
import ReportHeader from "../components/ReportHeader";
import ReportFilters, { FilterState } from "../components/ReportFilters";
import ReportCharts from "../components/ReportCharts";
import ReportTable, { TableColumn } from "../components/ReportTable";
import { exportToExcel, exportToPdf, formatCurrency, formatDateBr } from "../utils/exportUtils";

interface CanceladosReportClientProps {
  initialData: {
    items: any[];
    customers: any[];
    revenueCategories: any[];
    expenseCategories: any[];
    cashPoints: any[];
    company: any;
  };
}

export default function CanceladosReportClient({ initialData }: CanceladosReportClientProps) {
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
    originFilter: "TODOS"
  });

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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
          item.partyName?.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q) ||
          item.occurrenceNumber?.toLowerCase().includes(q)
        );
      });
    }

    // Origin filter (Receita vs Despesa)
    if (filters.originFilter && filters.originFilter !== "TODOS") {
      result = result.filter(item => item.origin === filters.originFilter);
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate + "T00:00:00") : null;
      const end = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;

      result = result.filter(item => {
        const rawDate = item.dueDate || item.paymentDate;
        if (!rawDate) return false;
        const itemDate = new Date(rawDate);
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
  const totalReceitasCanceladas = useMemo(() => {
    return filteredData
      .filter(item => item.origin === "RECEITA")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredData]);

  const totalDespesasCanceladas = useMemo(() => {
    return filteredData
      .filter(item => item.origin === "DESPESA")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredData]);

  const totalGeral = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredData]);

  const averageTicket = useMemo(() => {
    return filteredData.length > 0 ? totalGeral / filteredData.length : 0;
  }, [filteredData, totalGeral]);

  // Chart data calculations
  const timeSeriesData = useMemo(() => {
    const map: { [month: string]: { value: number; count: number } } = {};
    filteredData.forEach(item => {
      const rawDate = item.dueDate || item.paymentDate;
      if (!rawDate) return;
      const d = new Date(rawDate);
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

  const originSliceData = useMemo(() => {
    return [
      { label: "Receitas Canceladas", value: totalReceitasCanceladas, color: "#ef4444" },
      { label: "Despesas Canceladas", value: totalDespesasCanceladas, color: "#64748b" }
    ].filter(d => d.value > 0);
  }, [totalReceitasCanceladas, totalDespesasCanceladas]);

  const categoryChartData = useMemo(() => {
    const map: { [cat: string]: number } = {};
    filteredData.forEach(item => {
      const cat = item.categoryName || "Outras";
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
        label: item.partyName || item.description,
        value: item.amount,
        secondary: item.origin === "RECEITA" ? "Receita" : "Despesa"
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
          background: row.origin === "RECEITA" ? "rgba(59, 130, 246, 0.15)" : "rgba(239, 68, 68, 0.15)",
          color: row.origin === "RECEITA" ? "#3b82f6" : "#ef4444",
          padding: "3px 8px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 700
        }}>
          {row.origin === "RECEITA" ? "Contas a Receber" : "Contas a Pagar"}
        </span>
      )
    },
    {
      header: "Cliente / Favorecido",
      dataKey: "partyName",
      render: row => (
        <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
          {row.partyName}
        </span>
      )
    },
    {
      header: "Descrição / Motivo",
      dataKey: "description",
      render: row => (
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "260px" }}>
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
      header: "Categoria",
      dataKey: "categoryName",
      render: row => (
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {row.categoryName}
        </span>
      )
    },
    {
      header: "Venc. Original",
      dataKey: "dueDate",
      render: row => (
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {formatDateBr(row.dueDate)}
        </span>
      )
    },
    {
      header: "Valor Cancelado (R$)",
      dataKey: "amount",
      align: "right",
      render: row => (
        <span style={{ fontWeight: 800, color: "var(--danger)", fontSize: "13px" }}>
          {formatCurrency(row.amount)}
        </span>
      )
    },
    {
      header: "Status",
      dataKey: "status",
      align: "center",
      render: () => (
        <span style={{
          background: "rgba(239, 68, 68, 0.15)",
          color: "#ef4444",
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 700
        }}>
          Cancelado
        </span>
      )
    }
  ];

  // Export handlers
  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportToExcel({
        reportTitle: "Pagamentos Cancelados",
        filename: "relatorio_pagamentos_cancelados",
        columns: [
          { header: "ID", dataKey: "id" },
          { header: "Origem", dataKey: "origin" },
          { header: "Cliente / Favorecido", dataKey: "partyName" },
          { header: "Descrição", dataKey: "description" },
          { header: "OS Vinculada", dataKey: "occurrenceNumber" },
          { header: "Categoria", dataKey: "categoryName" },
          { header: "Vencimento Original", dataKey: "dueDateFormatted" },
          { header: "Valor Cancelado (R$)", dataKey: "amountFormatted" },
          { header: "Status", dataKey: "status" }
        ],
        rows: filteredData.map(r => ({
          ...r,
          dueDateFormatted: formatDateBr(r.dueDate),
          amountFormatted: r.amount?.toFixed(2).replace(".", ",")
        })),
        filtersSummary: [
          { label: "Período", value: filters.period },
          { label: "Origem", value: filters.originFilter || "TODOS" },
          { label: "Limite de Linhas", value: String(filters.limit) },
          { label: "Registros Filtrados", value: String(filteredData.length) }
        ],
        kpiSummary: [
          { label: "Receitas Canceladas", value: formatCurrency(totalReceitasCanceladas) },
          { label: "Despesas Canceladas", value: formatCurrency(totalDespesasCanceladas) },
          { label: "Total Cancelado", value: formatCurrency(totalGeral) },
          { label: "Ticket Médio", value: formatCurrency(averageTicket) }
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
        reportTitle: "Relatório Financeiro: Lançamentos e Pagamentos Cancelados",
        filename: "relatorio_pagamentos_cancelados",
        columns: [
          { header: "#ID", dataKey: "id" },
          { header: "Origem", dataKey: "origin" },
          { header: "Cliente / Favorecido", dataKey: "partyName" },
          { header: "Descrição / Motivo", dataKey: "description" },
          { header: "Categoria", dataKey: "categoryName" },
          { header: "Venc. Original", dataKey: "dueDateFormatted" },
          { header: "Valor Cancelado (R$)", dataKey: "amountFormatted", align: "right" },
          { header: "Status", dataKey: "status", align: "center" }
        ],
        rows: filteredData.map(r => ({
          ...r,
          dueDateFormatted: formatDateBr(r.dueDate),
          amountFormatted: formatCurrency(r.amount)
        })),
        filtersSummary: [
          { label: "Período", value: filters.period },
          { label: "Origem", value: filters.originFilter || "TODOS" },
          { label: "Limite", value: `${filters.limit} linhas` },
          { label: "Registros", value: String(filteredData.length) }
        ],
        kpiSummary: [
          { label: "Receitas Canceladas", value: formatCurrency(totalReceitasCanceladas) },
          { label: "Despesas Canceladas", value: formatCurrency(totalDespesasCanceladas) },
          { label: "Total Geral", value: formatCurrency(totalGeral) },
          { label: "Ticket Médio", value: formatCurrency(averageTicket) }
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
        title="Pagamentos Cancelados"
        description="Auditoria de receitas e despesas canceladas, perdas operacionais e estornos"
        badgeText="Cancelamentos e Estornos"
        icon={XCircle}
        iconColor="#ef4444"
        kpiCards={[
          {
            label: "Receitas Canceladas",
            value: totalReceitasCanceladas,
            isCurrency: true,
            color: "#ef4444",
            icon: DollarSign,
            subValue: "Faturamento abortado / perdido"
          },
          {
            label: "Despesas Canceladas",
            value: totalDespesasCanceladas,
            isCurrency: true,
            color: "#64748b",
            icon: TrendingDown,
            subValue: "Gastos evitados / estornados"
          },
          {
            label: "Total de Cancelamentos",
            value: filteredData.length,
            color: "var(--text-main)",
            icon: FileX2,
            subValue: "Registros cancelados"
          },
          {
            label: "Ticket Médio",
            value: averageTicket,
            isCurrency: true,
            color: "#f59e0b",
            icon: AlertTriangle,
            subValue: "Média por lançamento cancelado"
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
          originFilter: "TODOS"
        })}
        categories={allCategories}
        showOriginFilter={true}
        showDateFieldSelector={false}
        totalFiltered={filteredData.length}
        totalLimitApplied={filters.limit}
      />

      <ReportCharts
        title="Painel de Inteligência - Pagamentos Cancelados"
        timeSeriesData={timeSeriesData}
        timeSeriesTitle="1. Evolução Temporal de Cancelamentos"
        categoryData={categoryChartData}
        categoryTitle="2. Cancelamentos por Categoria"
        secondarySliceData={originSliceData}
        secondarySliceTitle="3. Divisão por Tipo (Receita vs Despesa)"
        rankingData={rankingChartData}
        rankingTitle="4. Top 5 Maiores Lançamentos Cancelados"
      />

      <ReportTable
        columns={columns}
        data={filteredData}
        totalAmount={totalGeral}
        totalAmountLabel="Total Cancelado Consolidado"
        defaultSortKey="dueDate"
        defaultSortDir="desc"
        emptyMessage="Nenhum título ou pagamento cancelado encontrado para os filtros aplicados."
      />
    </div>
  );
}
