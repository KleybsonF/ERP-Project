"use client";

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  DollarSign,
  Tag,
  CreditCard,
  Building2,
  User,
  X
} from "lucide-react";

export interface FilterState {
  search: string;
  period: string; // "todos" | "hoje" | "ontem" | "semana" | "mes" | "mes_anterior" | "ano" | "custom"
  startDate: string;
  endDate: string;
  dateField: "due_date" | "payment_date";
  clientId: string;
  categoryId: string;
  paymentMethodId: string;
  cashPointId: string;
  minAmount: string;
  maxAmount: string;
  limit: number;
  // Specific extras
  statusFilter?: string;
  originFilter?: string; // "TODOS" | "RECEITA" | "DESPESA"
  agingFilter?: string; // "TODOS" | "1-15" | "16-30" | "31-60" | "61-90" | "90+"
  vehicleId?: string;
}

interface ReportFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  customers?: { id: number; name: string }[];
  categories?: { id: number; name: string }[];
  paymentMethods?: { id: number; name: string }[];
  cashPoints?: { id: number; name: string }[];
  vehicles?: { id: number; plate: string; model?: string | null }[];
  showDateFieldSelector?: boolean;
  showOriginFilter?: boolean;
  showAgingFilter?: boolean;
  showStatusFilter?: boolean;
  statusOptions?: { value: string; label: string }[];
  showVehicleFilter?: boolean;
  totalFiltered: number;
  totalLimitApplied: number;
}

export default function ReportFilters({
  filters,
  onFilterChange,
  onResetFilters,
  customers = [],
  categories = [],
  paymentMethods = [],
  cashPoints = [],
  vehicles = [],
  showDateFieldSelector = true,
  showOriginFilter = false,
  showAgingFilter = false,
  showStatusFilter = false,
  statusOptions = [],
  showVehicleFilter = false,
  totalFiltered,
  totalLimitApplied
}: ReportFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const updateField = (field: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const handlePeriodChange = (periodKey: string) => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    let start = "";
    let end = "";

    if (periodKey === "hoje") {
      start = formatDate(today);
      end = formatDate(today);
    } else if (periodKey === "ontem") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      start = formatDate(yesterday);
      end = formatDate(yesterday);
    } else if (periodKey === "semana") {
      const firstDay = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      firstDay.setDate(diff);
      start = formatDate(firstDay);
      end = formatDate(today);
    } else if (periodKey === "mes") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      start = formatDate(firstDay);
      end = formatDate(lastDay);
    } else if (periodKey === "mes_anterior") {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      start = formatDate(firstDay);
      end = formatDate(lastDay);
    } else if (periodKey === "ano") {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      start = formatDate(firstDay);
      end = formatDate(lastDay);
    }

    onFilterChange({
      ...filters,
      period: periodKey,
      startDate: start,
      endDate: end
    });
  };

  const countActiveFilters = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.period !== "todos") count++;
    if (filters.clientId) count++;
    if (filters.categoryId) count++;
    if (filters.paymentMethodId) count++;
    if (filters.cashPointId) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    if (filters.originFilter && filters.originFilter !== "TODOS") count++;
    if (filters.agingFilter && filters.agingFilter !== "TODOS") count++;
    if (filters.statusFilter && filters.statusFilter !== "TODOS") count++;
    if (filters.vehicleId) count++;
    return count;
  };

  const activeCount = countActiveFilters();

  return (
    <div className="glass-panel" style={{ padding: "20px", marginBottom: "24px" }}>
      {/* Primary Filter Bar: Search + Quick Period + Row Limit + Advanced Toggle */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px",
        alignItems: "center"
      }}>
        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "240px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por descrição, cliente, documento..."
            value={filters.search}
            onChange={e => updateField("search", e.target.value)}
            className="input-field"
            style={{
              width: "100%",
              paddingLeft: "36px",
              paddingRight: filters.search ? "32px" : "12px",
              height: "40px",
              fontSize: "13px"
            }}
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => updateField("search", "")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px"
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick Period Select */}
        <div>
          <select
            value={filters.period}
            onChange={e => handlePeriodChange(e.target.value)}
            className="input-field"
            style={{ width: "100%", height: "40px", fontSize: "13px" }}
          >
            <option value="todos">Todo o Histórico</option>
            <option value="hoje">Hoje</option>
            <option value="ontem">Ontem</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="mes_anterior">Mês Anterior</option>
            <option value="ano">Este Ano</option>
            <option value="custom">Período Personalizado</option>
          </select>
        </div>

        {/* Limit Selector (Até 5 mil linhas) */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            Limite:
          </span>
          <select
            value={filters.limit}
            onChange={e => updateField("limit", Number(e.target.value))}
            className="input-field"
            style={{ width: "100%", height: "40px", fontSize: "13px" }}
          >
            <option value={50}>50 linhas</option>
            <option value={100}>100 linhas</option>
            <option value={250}>250 linhas</option>
            <option value={500}>500 linhas</option>
            <option value={1000}>1.000 linhas</option>
            <option value={2500}>2.500 linhas</option>
            <option value={5000}>5.000 linhas (Máx)</option>
          </select>
        </div>

        {/* Action Buttons: Toggle Advanced + Reset */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`btn ${isAdvancedOpen || activeCount > 0 ? "btn-secondary" : "btn-secondary"}`}
            style={{
              height: "40px",
              padding: "0 14px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderColor: activeCount > 0 ? "var(--primary-color)" : undefined
            }}
          >
            <SlidersHorizontal size={15} color={activeCount > 0 ? "var(--primary-color)" : undefined} />
            <span>Filtros</span>
            {activeCount > 0 && (
              <span style={{
                background: "var(--primary-color)",
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {activeCount}
              </span>
            )}
            {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="btn btn-secondary"
              style={{
                height: "40px",
                padding: "0 12px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "var(--danger)",
                borderColor: "rgba(239, 68, 68, 0.2)"
              }}
              title="Limpar todos os filtros"
            >
              <RotateCcw size={14} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Range Row (If period is custom) */}
      {filters.period === "custom" && (
        <div style={{
          marginTop: "16px",
          paddingTop: "14px",
          borderTop: "1px dashed var(--glass-border)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
            Intervalo de Datas:
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>De</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => updateField("startDate", e.target.value)}
              className="input-field"
              style={{ height: "36px", fontSize: "12px" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Até</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => updateField("endDate", e.target.value)}
              className="input-field"
              style={{ height: "36px", fontSize: "12px" }}
            />
          </div>

          {showDateFieldSelector && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Considerar data de:</span>
              <select
                value={filters.dateField}
                onChange={e => updateField("dateField", e.target.value as any)}
                className="input-field"
                style={{ height: "36px", fontSize: "12px" }}
              >
                <option value="due_date">Vencimento</option>
                <option value="payment_date">Pagamento / Baixa</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Advanced Filters Expandable Grid */}
      {isAdvancedOpen && (
        <div style={{
          marginTop: "16px",
          paddingTop: "16px",
          borderTop: "1px solid var(--glass-border)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px"
        }}>
          {/* Cliente / Devedor */}
          {customers.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "4px" }}>
                Cliente / Devedor
              </label>
              <select
                value={filters.clientId}
                onChange={e => updateField("clientId", e.target.value)}
                className="input-field"
                style={{ width: "100%", height: "38px", fontSize: "12px" }}
              >
                <option value="">Todos os Clientes</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Categoria */}
          {categories.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "4px" }}>
                Categoria
              </label>
              <select
                value={filters.categoryId}
                onChange={e => updateField("categoryId", e.target.value)}
                className="input-field"
                style={{ width: "100%", height: "38px", fontSize: "12px" }}
              >
                <option value="">Todas as Categorias</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Forma de Pagamento */}
          {paymentMethods.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "4px" }}>
                Forma de Pagamento
              </label>
              <select
                value={filters.paymentMethodId}
                onChange={e => updateField("paymentMethodId", e.target.value)}
                className="input-field"
                style={{ width: "100%", height: "38px", fontSize: "12px" }}
              >
                <option value="">Todas as Formas</option>
                {paymentMethods.map(pm => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conta / Caixa / Ponto de Recebimento */}
          {cashPoints.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "4px" }}>
                Conta / Caixa de Movimentação
              </label>
              <select
                value={filters.cashPointId}
                onChange={e => updateField("cashPointId", e.target.value)}
                className="input-field"
                style={{ width: "100%", height: "38px", fontSize: "12px" }}
              >
                <option value="">Todos os Caixas / Bancos</option>
                {cashPoints.map(cp => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Faixa de Valor (Min / Max) */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "4px" }}>
              Faixa de Valor (R$)
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="number"
                placeholder="Min R$"
                value={filters.minAmount}
                onChange={e => updateField("minAmount", e.target.value)}
                className="input-field"
                style={{ width: "50%", height: "38px", fontSize: "12px" }}
              />
              <input
                type="number"
                placeholder="Max R$"
                value={filters.maxAmount}
                onChange={e => updateField("maxAmount", e.target.value)}
                className="input-field"
                style={{ width: "50%", height: "38px", fontSize: "12px" }}
              />
            </div>
          </div>

          {/* Filtro de Status (quando aplicável) */}
          {showStatusFilter && statusOptions.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "4px" }}>
                Status do Título
              </label>
              <select
                value={filters.statusFilter || "TODOS"}
                onChange={e => updateField("statusFilter", e.target.value)}
                className="input-field"
                style={{ width: "100%", height: "38px", fontSize: "12px" }}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Origem (Receitas vs Despesas - Para Cancelados ou Atraso) */}
          {showOriginFilter && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "4px" }}>
                Origem / Tipo de Operação
              </label>
              <select
                value={filters.originFilter || "TODOS"}
                onChange={e => updateField("originFilter", e.target.value)}
                className="input-field"
                style={{ width: "100%", height: "38px", fontSize: "12px" }}
              >
                <option value="TODOS">Todas (Receitas e Despesas)</option>
                <option value="RECEITA">Apenas Receitas (Contas a Receber)</option>
                <option value="DESPESA">Apenas Despesas (Contas a Pagar)</option>
              </select>
            </div>
          )}

          {/* Filtro de Aging / Faixas de Atraso */}
          {showAgingFilter && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "4px" }}>
                Faixa de Atraso (Aging)
              </label>
              <select
                value={filters.agingFilter || "TODOS"}
                onChange={e => updateField("agingFilter", e.target.value)}
                className="input-field"
                style={{ width: "100%", height: "38px", fontSize: "12px" }}
              >
                <option value="TODOS">Todas as Faixas</option>
                <option value="1 a 15 dias">1 a 15 dias de atraso</option>
                <option value="16 a 30 dias">16 a 30 dias de atraso</option>
                <option value="31 a 60 dias">31 a 60 dias de atraso</option>
                <option value="61 a 90 dias">61 a 90 dias de atraso</option>
                <option value="Mais de 90 dias">Mais de 90 dias (Crítico)</option>
              </select>
            </div>
          )}

          {/* Filtro de Veículo (Para Emitidos / Despesas) */}
          {showVehicleFilter && vehicles.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "4px" }}>
                Veículo da Frota
              </label>
              <select
                value={filters.vehicleId || ""}
                onChange={e => updateField("vehicleId", e.target.value)}
                className="input-field"
                style={{ width: "100%", height: "38px", fontSize: "12px" }}
              >
                <option value="">Todos os Veículos</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.plate} {v.model ? `- ${v.model}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Info bar at the bottom */}
      <div style={{
        marginTop: "12px",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        fontSize: "12px",
        color: "var(--text-muted)"
      }}>
        <div>
          Total filtrado: <strong style={{ color: "var(--primary-color)" }}>{totalFiltered}</strong> {totalFiltered === 1 ? "registro" : "registros"}.
        </div>
      </div>
    </div>
  );
}
