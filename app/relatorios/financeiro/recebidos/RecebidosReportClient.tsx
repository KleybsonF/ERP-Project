"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  Wallet, 
  DollarSign, 
  CreditCard,
  Building2
} from "lucide-react";
import ReportHeader from "../components/ReportHeader";
import ReportFilters, { FilterState } from "../components/ReportFilters";
import ReportCharts from "../components/ReportCharts";
import ReportTable, { TableColumn } from "../components/ReportTable";
import { exportToExcel, exportToPdf, formatCurrency, formatDateBr } from "../utils/exportUtils";

interface RecebidosReportClientProps {
  initialData: {
    items: any[];
    customers: any[];
    revenueCategories: any[];
    paymentMethods: any[];
    cashPoints: any[];
    company: any;
  };
}

export default function RecebidosReportClient({ initialData }: RecebidosReportClientProps) {
  const { items, customers, revenueCategories, paymentMethods, cashPoints, company } = initialData;

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    period: "todos",
    startDate: "",
    endDate: "",
    dateField: "payment_date",
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

  const topMethodInfo = useMemo(() => {
    const map: { [m: string]: number } = {};
    filteredData.forEach(item => {
      const m = item.paymentMethodName || "Outros";
      map[m] = (map[m] || 0) + item.amount;
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { name: "N/A", pct: "0%" };
    const pct = totalAmount > 0 ? ((entries[0][1] / totalAmount) * 100).toFixed(0) + "%" : "0%";
    return { name: entries[0][0], pct };
  }, [filteredData, totalAmount]);

  // Chart data calculations
  const timeSeriesData = useMemo(() => {
    const map: { [month: string]: { value: number; count: number } } = {};
    filteredData.forEach(item => {
      const rawDate = item.paymentDate || item.dueDate;
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
      render: row => (
        <span style={{ fontWeight: 700, color: "var(--primary-color)", fontSize: "12px" }}>
          #{row.id}
        </span>
      )
    },
    {
      header: "Cliente / Pagador",
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
        <span style={{
          background: "rgba(16, 185, 129, 0.1)",
          color: "#10b981",
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
      header: "Data Pagamento",
      dataKey: "paymentDate",
      render: row => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={13} style={{ color: "#10b981" }} />
          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
            {formatDateBr(row.paymentDate || row.dueDate)}
          </span>
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
      header: "Forma Pgto",
      dataKey: "paymentMethodName"
    },
    {
      header: "Caixa Entrada",
      dataKey: "cashPointName"
    },
    {
      header: "Valor Recebido (R$)",
      dataKey: "amount",
      align: "right",
      render: row => (
        <span style={{ fontWeight: 800, color: "#10b981", fontSize: "13px" }}>
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
          background: "rgba(16, 185, 129, 0.15)",
          color: "#10b981",
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 700
        }}>
          {row.status || "Recebido"}
        </span>
      )
    }
  ];

  // Export handlers
  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportToExcel({
        reportTitle: "Pagamentos Recebidos",
        filename: "relatorio_pagamentos_recebidos",
        columns: [
          { header: "ID", dataKey: "id" },
          { header: "Cliente", dataKey: "customerName" },
          { header: "Documento", dataKey: "customerDocument" },
          { header: "Telefone", dataKey: "customerPhone" },
          { header: "Descrição", dataKey: "description" },
          { header: "OS Vinculada", dataKey: "occurrenceNumber" },
          { header: "Categoria", dataKey: "categoryName" },
          { header: "Data Recebimento", dataKey: "paymentDateFormatted" },
          { header: "Vencimento", dataKey: "dueDateFormatted" },
          { header: "Forma Pgto", dataKey: "paymentMethodName" },
          { header: "Caixa de Entrada", dataKey: "cashPointName" },
          { header: "Valor Recebido (R$)", dataKey: "amountFormatted" },
          { header: "Status", dataKey: "status" }
        ],
        rows: filteredData.map(r => ({
          ...r,
          paymentDateFormatted: formatDateBr(r.paymentDate || r.dueDate),
          dueDateFormatted: formatDateBr(r.dueDate),
          amountFormatted: r.amount?.toFixed(2).replace(".", ",")
        })),
        filtersSummary: [
          { label: "Período", value: filters.period },
          { label: "Considerando Data de", value: filters.dateField === "payment_date" ? "Pagamento" : "Vencimento" },
          { label: "Limite de Linhas", value: String(filters.limit) },
          { label: "Registros Filtrados", value: String(filteredData.length) }
        ],
        kpiSummary: [
          { label: "Total Recebido", value: formatCurrency(totalAmount) },
          { label: "Títulos Liquidados", value: String(filteredData.length) },
          { label: "Ticket Médio", value: formatCurrency(averageTicket) },
          { label: "Principal Meio", value: `${topMethodInfo.name} (${topMethodInfo.pct})` }
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
        reportTitle: "Relatório Financeiro: Pagamentos Recebidos (Realizado)",
        filename: "relatorio_pagamentos_recebidos",
        columns: [
          { header: "#ID", dataKey: "id" },
          { header: "Cliente / Pagador", dataKey: "customerName" },
          { header: "Descrição / OS", dataKey: "description" },
          { header: "Categoria", dataKey: "categoryName" },
          { header: "Data Pgto", dataKey: "paymentDateFormatted" },
          { header: "Forma Pgto", dataKey: "paymentMethodName" },
          { header: "Caixa Entrada", dataKey: "cashPointName" },
          { header: "Valor Recebido (R$)", dataKey: "amountFormatted", align: "right" },
          { header: "Status", dataKey: "status", align: "center" }
        ],
        rows: filteredData.map(r => ({
          ...r,
          paymentDateFormatted: formatDateBr(r.paymentDate || r.dueDate),
          amountFormatted: formatCurrency(r.amount)
        })),
        filtersSummary: [
          { label: "Período", value: filters.period },
          { label: "Limite", value: `${filters.limit} linhas` },
          { label: "Registros", value: String(filteredData.length) }
        ],
        kpiSummary: [
          { label: "Total Recebido", value: formatCurrency(totalAmount) },
          { label: "Liquidados", value: String(filteredData.length) },
          { label: "Ticket Médio", value: formatCurrency(averageTicket) },
          { label: "Top Forma", value: `${topMethodInfo.name} (${topMethodInfo.pct})` }
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
        title="Pagamentos Recebidos"
        description="Histórico consolidado de todas as receitas recebidas e baixadas no caixa"
        badgeText="Entradas Liquidadas"
        icon={CheckCircle2}
        iconColor="#10b981"
        kpiCards={[
          {
            label: "Total Recebido",
            value: totalAmount,
            isCurrency: true,
            color: "#10b981",
            icon: DollarSign,
            subValue: "Entradas efetivas no caixa"
          },
          {
            label: "Títulos Liquidados",
            value: filteredData.length,
            color: "var(--text-main)",
            icon: CheckCircle2,
            subValue: "Pagamentos confirmados"
          },
          {
            label: "Ticket Médio",
            value: averageTicket,
            isCurrency: true,
            color: "#3b82f6",
            icon: TrendingUp,
            subValue: "Valor médio por pagamento"
          },
          {
            label: "Principal Meio de Pgto",
            value: topMethodInfo.name,
            color: "#f59e0b",
            icon: CreditCard,
            subValue: `${topMethodInfo.pct} do montante total`
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
          dateField: "payment_date",
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
        title="Painel de Inteligência - Pagamentos Recebidos"
        timeSeriesData={timeSeriesData}
        timeSeriesTitle="1. Histórico Mensal de Recebimentos Realizados"
        categoryData={categoryChartData}
        categoryTitle="2. Recebimentos por Categoria"
        secondarySliceData={paymentMethodChartData}
        secondarySliceTitle="3. Recebimentos por Meio de Pagamento"
        rankingData={rankingChartData}
        rankingTitle="4. Top 5 Clientes com Maior Volume Pago"
      />

      <ReportTable
        columns={columns}
        data={filteredData}
        totalAmount={totalAmount}
        totalAmountLabel="Total Recebido"
        defaultSortKey="paymentDate"
        defaultSortDir="desc"
        emptyMessage="Nenhum pagamento recebido encontrado para os filtros aplicados."
      />
    </div>
  );
}
