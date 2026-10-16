"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Banknote, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  DollarSign
} from "lucide-react";
import ReportHeader from "../components/ReportHeader";
import ReportFilters, { FilterState } from "../components/ReportFilters";
import ReportCharts from "../components/ReportCharts";
import ReportTable, { TableColumn } from "../components/ReportTable";
import { exportToExcel, exportToPdf, formatCurrency, formatDateBr } from "../utils/exportUtils";

interface AReceberReportClientProps {
  initialData: {
    items: any[];
    customers: any[];
    revenueCategories: any[];
    paymentMethods: any[];
    cashPoints: any[];
    company: any;
  };
}

export default function AReceberReportClient({ initialData }: AReceberReportClientProps) {
  const { items, customers, revenueCategories, paymentMethods, cashPoints, company } = initialData;

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
    limit: 5000
  });

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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
          item.customerName?.toLowerCase().includes(q) ||
          item.customerDocument?.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q) ||
          item.occurrenceNumber?.toLowerCase().includes(q)
        );
      });
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate + "T00:00:00") : null;
      const end = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;

      result = result.filter(item => {
        const rawDate = filters.dateField === "payment_date" ? item.paymentDate : item.dueDate;
        if (!rawDate) return false;
        const itemDate = new Date(rawDate);
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
      });
    }

    // Client filter
    if (filters.clientId) {
      const cid = Number(filters.clientId);
      result = result.filter(item => item.clientId === cid);
    }

    // Category filter
    if (filters.categoryId) {
      const catId = Number(filters.categoryId);
      result = result.filter(item => item.categoryId === catId);
    }

    // Payment Method filter
    if (filters.paymentMethodId) {
      const pmid = Number(filters.paymentMethodId);
      result = result.filter(item => item.paymentMethodId === pmid);
    }

    // Cash Point filter
    if (filters.cashPointId) {
      const cpid = Number(filters.cashPointId);
      result = result.filter(item => item.cashPointId === cpid);
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

  const averageTicket = useMemo(() => {
    return filteredData.length > 0 ? totalAmount / filteredData.length : 0;
  }, [filteredData, totalAmount]);

  const next30DaysAmount = useMemo(() => {
    const now = new Date();
    const in30 = new Date();
    in30.setDate(now.getDate() + 30);
    return filteredData
      .filter(item => {
        if (!item.dueDate) return false;
        const d = new Date(item.dueDate);
        return d >= now && d <= in30;
      })
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredData]);

  // Chart data calculations
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
      const cat = item.categoryName || "Outras";
      map[cat] = (map[cat] || 0) + item.amount;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const paymentMethodChartData = useMemo(() => {
    const map: { [m: string]: number } = {};
    filteredData.forEach(item => {
      const m = item.paymentMethodName || "Não Informado";
      map[m] = (map[m] || 0) + item.amount;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const rankingChartData = useMemo(() => {
    const map: { [cli: string]: number } = {};
    filteredData.forEach(item => {
      const cli = item.customerName || "Não Informado";
      map[cli] = (map[cli] || 0) + item.amount;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredData]);

  // Table Columns
  const columns: TableColumn<any>[] = [
    {
      header: "#ID",
      dataKey: "id",
      width: 10,
      render: row => (
        <span style={{ fontWeight: 700, color: "var(--primary-color)", fontSize: "12px" }}>
          #{row.id}
        </span>
      )
    },
    {
      header: "Cliente / Devedor",
      dataKey: "customerName",
      render: row => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
            {row.customerName}
          </span>
          {(row.customerDocument || row.customerPhone) && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {[row.customerDocument, row.customerPhone].filter(Boolean).join(" • ")}
            </span>
          )}
        </div>
      )
    },
    {
      header: "Descrição / OS",
      dataKey: "description",
      render: row => (
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "260px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.description}
          </span>
          {row.occurrenceNumber && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              OS Vinculada: <strong>{row.occurrenceNumber}</strong>
            </span>
          )}
        </div>
      )
    },
    {
      header: "Categoria",
      dataKey: "categoryName",
      render: row => (
        <span style={{
          background: "rgba(59, 130, 246, 0.1)",
          color: "#3b82f6",
          padding: "3px 8px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 600
        }}>
          {row.categoryName}
        </span>
      )
    },
    {
      header: "Vencimento",
      dataKey: "dueDate",
      render: row => {
        const isPast = row.dueDate && new Date(row.dueDate) < new Date();
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={13} style={{ color: isPast ? "var(--danger)" : "var(--text-muted)" }} />
            <span style={{ fontWeight: 600, color: isPast ? "var(--danger)" : "var(--text-main)" }}>
              {formatDateBr(row.dueDate)}
            </span>
          </div>
        );
      }
    },
    {
      header: "Forma Pgto",
      dataKey: "paymentMethodName"
    },
    {
      header: "Caixa Previsto",
      dataKey: "cashPointName"
    },
    {
      header: "Valor (R$)",
      dataKey: "amount",
      align: "right",
      render: row => (
        <span style={{ fontWeight: 800, color: "var(--primary-color)", fontSize: "13px" }}>
          {formatCurrency(row.amount)}
        </span>
      )
    },
    {
      header: "Status",
      dataKey: "status",
      align: "center",
      render: row => (
        <span style={{
          background: "rgba(245, 158, 11, 0.15)",
          color: "#f59e0b",
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 700
        }}>
          {row.status || "Pendente"}
        </span>
      )
    }
  ];

  // Export handlers
  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportToExcel({
        reportTitle: "Pagamentos A Receber",
        filename: "relatorio_pagamentos_a_receber",
        columns: [
          { header: "ID", dataKey: "id" },
          { header: "Cliente", dataKey: "customerName" },
          { header: "Documento", dataKey: "customerDocument" },
          { header: "Telefone", dataKey: "customerPhone" },
          { header: "Descrição", dataKey: "description" },
          { header: "OS Vinculada", dataKey: "occurrenceNumber" },
          { header: "Categoria", dataKey: "categoryName" },
          { header: "Vencimento", dataKey: "dueDateFormatted" },
          { header: "Forma de Pagamento", dataKey: "paymentMethodName" },
          { header: "Caixa", dataKey: "cashPointName" },
          { header: "Valor (R$)", dataKey: "amountFormatted" },
          { header: "Status", dataKey: "status" }
        ],
        rows: filteredData.map(r => ({
          ...r,
          dueDateFormatted: formatDateBr(r.dueDate),
          amountFormatted: r.amount?.toFixed(2).replace(".", ",")
        })),
        filtersSummary: [
          { label: "Período", value: filters.period },
          { label: "Limite de Linhas", value: String(filters.limit) },
          { label: "Registros Filtrados", value: String(filteredData.length) }
        ],
        kpiSummary: [
          { label: "Total A Receber", value: formatCurrency(totalAmount) },
          { label: "Qtd Títulos", value: String(filteredData.length) },
          { label: "Ticket Médio", value: formatCurrency(averageTicket) },
          { label: "Próximos 30 Dias", value: formatCurrency(next30DaysAmount) }
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
        reportTitle: "Relatório Financeiro: Pagamentos A Receber",
        filename: "relatorio_pagamentos_a_receber",
        columns: [
          { header: "#ID", dataKey: "id", width: 15 },
          { header: "Cliente / Devedor", dataKey: "customerName" },
          { header: "Descrição / OS", dataKey: "description" },
          { header: "Categoria", dataKey: "categoryName" },
          { header: "Vencimento", dataKey: "dueDateFormatted" },
          { header: "Forma Pgto", dataKey: "paymentMethodName" },
          { header: "Caixa", dataKey: "cashPointName" },
          { header: "Valor (R$)", dataKey: "amountFormatted", align: "right" },
          { header: "Status", dataKey: "status", align: "center" }
        ],
        rows: filteredData.map(r => ({
          ...r,
          dueDateFormatted: formatDateBr(r.dueDate),
          amountFormatted: formatCurrency(r.amount)
        })),
        filtersSummary: [
          { label: "Período", value: filters.period },
          { label: "Limite", value: `${filters.limit} linhas` },
          { label: "Registros", value: String(filteredData.length) }
        ],
        kpiSummary: [
          { label: "Total A Receber", value: formatCurrency(totalAmount) },
          { label: "Títulos", value: String(filteredData.length) },
          { label: "Ticket Médio", value: formatCurrency(averageTicket) },
          { label: "Próximos 30d", value: formatCurrency(next30DaysAmount) }
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
        title="Pagamentos A Receber"
        description="Acompanhamento detalhado de receitas pendentes e projeção de entradas futuras"
        badgeText="Contas a Receber"
        icon={Banknote}
        iconColor="#3b82f6"
        kpiCards={[
          {
            label: "Total a Receber",
            value: totalAmount,
            isCurrency: true,
            color: "#3b82f6",
            icon: DollarSign,
            subValue: "Valor bruto em aberto"
          },
          {
            label: "Títulos em Aberto",
            value: filteredData.length,
            color: "var(--text-main)",
            icon: Clock,
            subValue: "Cobranças ativas"
          },
          {
            label: "Ticket Médio",
            value: averageTicket,
            isCurrency: true,
            color: "#10b981",
            icon: CheckCircle2,
            subValue: "Média por recebível"
          },
          {
            label: "Vencendo em 30 Dias",
            value: next30DaysAmount,
            isCurrency: true,
            color: "#f59e0b",
            icon: Calendar,
            subValue: "Expectativa de caixa a curto prazo"
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
          limit: 5000
        })}
        customers={customers}
        categories={revenueCategories}
        paymentMethods={paymentMethods}
        cashPoints={cashPoints}
        showDateFieldSelector={true}
        totalFiltered={filteredData.length}
        totalLimitApplied={filters.limit}
      />

      <ReportCharts
        title="Análise Visual de Recebíveis"
        timeSeriesData={timeSeriesData}
        timeSeriesTitle="Projeção por Mês de Vencimento"
        categoryData={categoryChartData}
        categoryTitle="Receitas por Categoria"
        secondarySliceData={paymentMethodChartData}
        secondarySliceTitle="Receitas por Forma de Pagamento"
        rankingData={rankingChartData}
        rankingTitle="Top 5 Clientes a Receber"
      />

      <ReportTable
        columns={columns}
        data={filteredData}
        totalAmount={totalAmount}
        totalAmountLabel="Total a Receber"
        defaultSortKey="dueDate"
        defaultSortDir="asc"
        emptyMessage="Nenhuma receita a receber encontrada para os filtros aplicados."
      />
    </div>
  );
}
