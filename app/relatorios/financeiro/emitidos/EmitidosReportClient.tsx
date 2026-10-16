"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Send, 
  TrendingDown, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Car,
  DollarSign
} from "lucide-react";
import ReportHeader from "../components/ReportHeader";
import ReportFilters, { FilterState } from "../components/ReportFilters";
import ReportCharts from "../components/ReportCharts";
import ReportTable, { TableColumn } from "../components/ReportTable";
import { exportToExcel, exportToPdf, formatCurrency, formatDateBr } from "../utils/exportUtils";

interface EmitidosReportClientProps {
  initialData: {
    items: any[];
    expenseCategories: any[];
    vehicles: any[];
    cashPoints: any[];
    company: any;
  };
}

export default function EmitidosReportClient({ initialData }: EmitidosReportClientProps) {
  const { items, expenseCategories, vehicles, cashPoints, company } = initialData;

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
    statusFilter: "TODOS",
    vehicleId: ""
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
          item.responsible?.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q) ||
          item.vehiclePlate?.toLowerCase().includes(q)
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

    // Category filter
    if (filters.categoryId) {
      const catId = Number(filters.categoryId);
      result = result.filter(item => item.categoryId === catId);
    }

    // Cash Point filter
    if (filters.cashPointId) {
      const cpid = Number(filters.cashPointId);
      result = result.filter(item => item.cashPointId === cpid);
    }

    // Vehicle filter
    if (filters.vehicleId) {
      const vid = Number(filters.vehicleId);
      result = result.filter(item => item.vehicleId === vid);
    }

    // Status filter
    if (filters.statusFilter && filters.statusFilter !== "TODOS") {
      result = result.filter(item => item.status === filters.statusFilter);
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

  const totalPago = useMemo(() => {
    return filteredData
      .filter(item => item.status === "Pago")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredData]);

  const totalPendente = useMemo(() => {
    return filteredData
      .filter(item => item.status !== "Pago" && item.status !== "Cancelado")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredData]);

  const averageTicket = useMemo(() => {
    return filteredData.length > 0 ? totalAmount / filteredData.length : 0;
  }, [filteredData, totalAmount]);

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

  const cashPointChartData = useMemo(() => {
    const map: { [cp: string]: number } = {};
    filteredData.forEach(item => {
      const cp = item.cashPointName || "Geral";
      map[cp] = (map[cp] || 0) + item.amount;
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
        label: item.description || "Despesa",
        value: item.amount,
        secondary: item.responsible || item.categoryName
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
      header: "Descrição da Despesa",
      dataKey: "description",
      render: row => (
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "260px" }}>
          <span style={{ fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.description}
          </span>
          {row.responsible && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Responsável / Favorecido: <strong>{row.responsible}</strong>
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
          background: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444",
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
      header: "Veículo",
      dataKey: "vehiclePlate",
      render: row => row.vehiclePlate ? (
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Car size={13} color="#f59e0b" />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-main)" }}>
            {row.vehiclePlate}
          </span>
        </div>
      ) : (
        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>-</span>
      )
    },
    {
      header: "Vencimento",
      dataKey: "dueDate",
      render: row => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={13} color="var(--text-muted)" />
          <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-main)" }}>
            {formatDateBr(row.dueDate)}
          </span>
        </div>
      )
    },
    {
      header: "Data Pgto",
      dataKey: "paymentDate",
      render: row => (
        <span style={{ fontSize: "12px", color: row.paymentDate ? "var(--success)" : "var(--text-muted)", fontWeight: row.paymentDate ? 600 : 400 }}>
          {formatDateBr(row.paymentDate)}
        </span>
      )
    },
    {
      header: "Caixa Pagador",
      dataKey: "cashPointName"
    },
    {
      header: "Valor (R$)",
      dataKey: "amount",
      align: "right",
      render: row => (
        <span style={{ fontWeight: 800, color: "#ef4444", fontSize: "13px" }}>
          {formatCurrency(row.amount)}
        </span>
      )
    },
    {
      header: "Status",
      dataKey: "status",
      align: "center",
      render: row => {
        const isPaid = row.status === "Pago";
        const isCancelled = row.status === "Cancelado";
        return (
          <span style={{
            background: isPaid ? "rgba(16, 185, 129, 0.15)" : isCancelled ? "rgba(148, 163, 184, 0.15)" : "rgba(245, 158, 11, 0.15)",
            color: isPaid ? "#10b981" : isCancelled ? "#94a3b8" : "#f59e0b",
            padding: "3px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: 700
          }}>
            {row.status || "Pendente"}
          </span>
        );
      }
    }
  ];

  // Export handlers
  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportToExcel({
        reportTitle: "Pagamentos Emitidos (Despesas)",
        filename: "relatorio_pagamentos_emitidos",
        columns: [
          { header: "ID", dataKey: "id" },
          { header: "Descrição", dataKey: "description" },
          { header: "Responsável", dataKey: "responsible" },
          { header: "Categoria", dataKey: "categoryName" },
          { header: "Veículo", dataKey: "vehiclePlate" },
          { header: "Vencimento", dataKey: "dueDateFormatted" },
          { header: "Data Pagamento", dataKey: "paymentDateFormatted" },
          { header: "Caixa Pagador", dataKey: "cashPointName" },
          { header: "Valor (R$)", dataKey: "amountFormatted" },
          { header: "Status", dataKey: "status" }
        ],
        rows: filteredData.map(r => ({
          ...r,
          dueDateFormatted: formatDateBr(r.dueDate),
          paymentDateFormatted: formatDateBr(r.paymentDate),
          amountFormatted: r.amount?.toFixed(2).replace(".", ",")
        })),
        filtersSummary: [
          { label: "Período", value: filters.period },
          { label: "Status", value: filters.statusFilter || "TODOS" },
          { label: "Limite de Linhas", value: String(filters.limit) },
          { label: "Registros Filtrados", value: String(filteredData.length) }
        ],
        kpiSummary: [
          { label: "Total Emitido", value: formatCurrency(totalAmount) },
          { label: "Total Pago", value: formatCurrency(totalPago) },
          { label: "Pendente a Pagar", value: formatCurrency(totalPendente) },
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
        reportTitle: "Relatório Financeiro: Pagamentos Emitidos (Contas a Pagar)",
        filename: "relatorio_pagamentos_emitidos",
        columns: [
          { header: "#ID", dataKey: "id" },
          { header: "Descrição da Despesa", dataKey: "description" },
          { header: "Responsável", dataKey: "responsible" },
          { header: "Categoria", dataKey: "categoryName" },
          { header: "Vencimento", dataKey: "dueDateFormatted" },
          { header: "Data Pgto", dataKey: "paymentDateFormatted" },
          { header: "Caixa Pagador", dataKey: "cashPointName" },
          { header: "Valor (R$)", dataKey: "amountFormatted", align: "right" },
          { header: "Status", dataKey: "status", align: "center" }
        ],
        rows: filteredData.map(r => ({
          ...r,
          dueDateFormatted: formatDateBr(r.dueDate),
          paymentDateFormatted: formatDateBr(r.paymentDate),
          amountFormatted: formatCurrency(r.amount)
        })),
        filtersSummary: [
          { label: "Período", value: filters.period },
          { label: "Status", value: filters.statusFilter || "TODOS" },
          { label: "Limite", value: `${filters.limit} linhas` },
          { label: "Registros", value: String(filteredData.length) }
        ],
        kpiSummary: [
          { label: "Total Emitido", value: formatCurrency(totalAmount) },
          { label: "Total Pago", value: formatCurrency(totalPago) },
          { label: "Pendente", value: formatCurrency(totalPendente) },
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
        title="Pagamentos Emitidos"
        description="Controle e prestação de contas de todas as despesas e pagamentos efetuados ou agendados"
        badgeText="Contas a Pagar"
        icon={Send}
        iconColor="#ef4444"
        kpiCards={[
          {
            label: "Total de Despesas",
            value: totalAmount,
            isCurrency: true,
            color: "#ef4444",
            icon: DollarSign,
            subValue: "Valor total emitido no período"
          },
          {
            label: "Total Pago (Quitado)",
            value: totalPago,
            isCurrency: true,
            color: "#10b981",
            icon: CheckCircle2,
            subValue: "Saídas de caixa confirmadas"
          },
          {
            label: "Pendente a Pagar",
            value: totalPendente,
            isCurrency: true,
            color: "#f59e0b",
            icon: Clock,
            subValue: "Compromissos futuros"
          },
          {
            label: "Ticket Médio",
            value: averageTicket,
            isCurrency: true,
            color: "#3b82f6",
            icon: TrendingDown,
            subValue: "Valor médio por despesa"
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
          statusFilter: "TODOS",
          vehicleId: ""
        })}
        categories={expenseCategories}
        cashPoints={cashPoints}
        vehicles={vehicles}
        showDateFieldSelector={true}
        showStatusFilter={true}
        statusOptions={[
          { value: "TODOS", label: "Todos os Status" },
          { value: "Pago", label: "Apenas Pagos" },
          { value: "Pendente", label: "Apenas Pendentes" },
          { value: "Cancelado", label: "Apenas Cancelados" }
        ]}
        showVehicleFilter={true}
        totalFiltered={filteredData.length}
        totalLimitApplied={filters.limit}
      />

      <ReportCharts
        title="Análise de Despesas e Pagamentos Emitidos"
        timeSeriesData={timeSeriesData}
        timeSeriesTitle="Evolução Temporal de Despesas"
        categoryData={categoryChartData}
        categoryTitle="Despesas por Categoria"
        secondarySliceData={cashPointChartData}
        secondarySliceTitle="Saídas por Caixa / Banco Pagador"
        rankingData={rankingChartData}
        rankingTitle="Top 5 Maiores Despesas Emitidas"
      />

      <ReportTable
        columns={columns}
        data={filteredData}
        totalAmount={totalAmount}
        totalAmountLabel="Total Emitido"
        defaultSortKey="dueDate"
        defaultSortDir="desc"
        emptyMessage="Nenhuma despesa ou pagamento emitido encontrado para os filtros aplicados."
      />
    </div>
  );
}
