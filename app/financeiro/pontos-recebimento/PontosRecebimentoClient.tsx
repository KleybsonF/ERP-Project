"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Wallet, 
  Plus, 
  Building2, 
  Landmark, 
  CreditCard, 
  Lock, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  Trash2, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  LayoutDashboard, 
  X, 
  Receipt, 
  Calendar,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  Filter
} from "lucide-react";
import { 
  createCashPoint, 
  updateCashPoint, 
  toggleCashPointActive, 
  deleteCashPoint,
  getCashPoints
} from "@/app/actions/pontos-recebimento";

interface CashPoint {
  id: number;
  name: string;
  type: string;
  initialBalance: number;
  description: string | null;
  ativo: boolean;
  totalEntradas: number;
  totalSaidas: number;
  totalPendenteEntrada: number;
  totalPendenteSaida: number;
  currentBalance: number;
  receivables?: any[];
  payables?: any[];
}

export default function PontosRecebimentoClient({ initialCashPoints }: { initialCashPoints: CashPoint[] }) {
  const [cashPoints, setCashPoints] = useState<CashPoint[]>(initialCashPoints);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS"); // TODOS, ATIVO, INATIVO
  const [balanceFilter, setBalanceFilter] = useState("TODOS"); // TODOS, POSITIVO, NEGATIVO, ZERADO
  const [sortBy, setSortBy] = useState("name_asc"); // name_asc, name_desc, balance_desc, balance_asc, inflow_desc, outflow_desc

  // Modal Form (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCp, setSelectedCp] = useState<CashPoint | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("Caixa Físico");
  const [initialBalance, setInitialBalance] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Extrato & its integrated filters
  const [extratoCp, setExtratoCp] = useState<CashPoint | null>(null);
  const [extratoSearch, setExtratoSearch] = useState("");
  const [extratoTypeFilter, setExtratoTypeFilter] = useState("TODOS"); // TODOS, ENTRADAS, SAIDAS
  const [extratoStatusFilter, setExtratoStatusFilter] = useState("TODOS"); // TODOS, CONCLUIDOS, PENDENTES

  const reloadData = async () => {
    const updated = await getCashPoints();
    setCashPoints(updated);
  };

  // Metrics
  const metrics = useMemo(() => {
    let saldoTotal = 0;
    let totalFisico = 0;
    let totalBancario = 0;
    let totalAtivos = 0;

    cashPoints.forEach((cp) => {
      if (cp.ativo) {
        saldoTotal += cp.currentBalance;
        totalAtivos++;
        if (cp.type === "Caixa Físico" || cp.type === "Cofre") {
          totalFisico += cp.currentBalance;
        } else if (cp.type === "Conta Bancária") {
          totalBancario += cp.currentBalance;
        }
      }
    });

    return { saldoTotal, totalFisico, totalBancario, totalAtivos };
  }, [cashPoints]);

  const isFiltered = searchTerm !== "" || typeFilter !== "TODOS" || statusFilter !== "TODOS" || balanceFilter !== "TODOS" || sortBy !== "name_asc";

  const handleResetFilters = () => {
    setSearchTerm("");
    setTypeFilter("TODOS");
    setStatusFilter("TODOS");
    setBalanceFilter("TODOS");
    setSortBy("name_asc");
  };

  // Filtered and Sorted list of Cash Points
  const filteredList = useMemo(() => {
    return cashPoints
      .filter((cp) => {
        const search = searchTerm.toLowerCase();
        const matchName = cp.name.toLowerCase().includes(search);
        const matchDesc = cp.description ? cp.description.toLowerCase().includes(search) : false;
        if (search && !matchName && !matchDesc) return false;

        if (typeFilter !== "TODOS" && cp.type !== typeFilter) return false;

        if (statusFilter === "ATIVO" && !cp.ativo) return false;
        if (statusFilter === "INATIVO" && cp.ativo) return false;

        if (balanceFilter === "POSITIVO" && cp.currentBalance <= 0) return false;
        if (balanceFilter === "NEGATIVO" && cp.currentBalance >= 0) return false;
        if (balanceFilter === "ZERADO" && cp.currentBalance !== 0) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name_desc":
            return b.name.localeCompare(a.name);
          case "balance_desc":
            return b.currentBalance - a.currentBalance;
          case "balance_asc":
            return a.currentBalance - b.currentBalance;
          case "inflow_desc":
            return b.totalEntradas - a.totalEntradas;
          case "outflow_desc":
            return b.totalSaidas - a.totalSaidas;
          case "name_asc":
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [cashPoints, searchTerm, typeFilter, statusFilter, balanceFilter, sortBy]);

  const filteredBalanceSum = useMemo(() => {
    return filteredList.reduce((acc, cp) => acc + (cp.ativo ? cp.currentBalance : 0), 0);
  }, [filteredList]);

  // Movements inside the Extrato Modal with active filters
  const extratoMovements = useMemo(() => {
    if (!extratoCp) return [];
    const list = [
      ...(extratoCp.receivables || []).map((r) => ({
        id: r.id,
        date: r.due_date,
        paymentDate: r.payment_date,
        type: "Entrada (Receita)",
        desc: r.description || (r.customer ? `Receita de ${r.customer.name}` : "Receita Avulsa"),
        customerOrVendor: r.customer?.name || null,
        category: r.category?.name || "Receitas Gerais",
        paymentMethod: r.paymentMethod?.name || null,
        occurrenceId: r.occurrenceId || null,
        amount: r.amount,
        status: r.status,
        isEntrada: true
      })),
      ...(extratoCp.payables || []).map((p) => ({
        id: p.id,
        date: p.due_date,
        paymentDate: p.payment_date,
        type: "Saída (Despesa)",
        desc: p.description,
        customerOrVendor: p.responsible || (p.vehicle ? `Veículo ${p.vehicle.plate}` : null),
        category: p.category?.name || "Despesas Gerais",
        paymentMethod: null,
        occurrenceId: null,
        amount: p.amount,
        status: p.status,
        isEntrada: false
      }))
    ];

    return list
      .filter((mov) => {
        const s = extratoSearch.toLowerCase();
        if (s) {
          const matchDesc = mov.desc.toLowerCase().includes(s);
          const matchParty = mov.customerOrVendor ? mov.customerOrVendor.toLowerCase().includes(s) : false;
          const matchCat = mov.category.toLowerCase().includes(s);
          const matchOcc = mov.occurrenceId ? String(mov.occurrenceId).includes(s) : false;
          if (!matchDesc && !matchParty && !matchCat && !matchOcc) return false;
        }

        if (extratoTypeFilter === "ENTRADAS" && !mov.isEntrada) return false;
        if (extratoTypeFilter === "SAIDAS" && mov.isEntrada) return false;

        const isConcluido = mov.status === "Recebido" || mov.status === "Pago";
        if (extratoStatusFilter === "CONCLUIDOS" && !isConcluido) return false;
        if (extratoStatusFilter === "PENDENTES" && isConcluido) return false;

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [extratoCp, extratoSearch, extratoTypeFilter, extratoStatusFilter]);

  const extratoTotals = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    extratoMovements.forEach((m) => {
      if (m.isEntrada) entradas += m.amount;
      else saidas += m.amount;
    });
    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      count: extratoMovements.length
    };
  }, [extratoMovements]);

  // Modal handlers
  const handleOpenCreate = () => {
    setSelectedCp(null);
    setName("");
    setType("Caixa Físico");
    setInitialBalance("0");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cp: CashPoint) => {
    setSelectedCp(cp);
    setName(cp.name);
    setType(cp.type);
    setInitialBalance(String(cp.initialBalance));
    setDescription(cp.description || "");
    setIsModalOpen(true);
  };

  const handleOpenExtrato = (cp: CashPoint) => {
    setExtratoCp(cp);
    setExtratoSearch("");
    setExtratoTypeFilter("TODOS");
    setExtratoStatusFilter("TODOS");
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Por favor, informe o nome do caixa/ponto de recebimento.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedCp) {
        await updateCashPoint(selectedCp.id, {
          name: name.trim(),
          type,
          initialBalance: Number(initialBalance) || 0,
          description: description.trim()
        });
      } else {
        await createCashPoint({
          name: name.trim(),
          type,
          initialBalance: Number(initialBalance) || 0,
          description: description.trim()
        });
      }
      await reloadData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Erro ao salvar ponto de recebimento: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAtivo = async (cp: CashPoint) => {
    try {
      await toggleCashPointActive(cp.id, !cp.ativo);
      await reloadData();
    } catch (err: any) {
      alert("Erro ao alterar status: " + err.message);
    }
  };

  const handleDelete = async (cp: CashPoint) => {
    if (confirm(`Deseja realmente excluir o ponto de recebimento "${cp.name}"?`)) {
      try {
        await deleteCashPoint(cp.id);
        await reloadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case "Conta Bancária":
        return <Landmark size={18} color="#2563eb" />;
      case "Carteira Digital":
        return <CreditCard size={18} color="#9333ea" />;
      case "Cofre":
        return <Lock size={18} color="#d97706" />;
      default:
        return <Wallet size={18} color="#10b981" />;
    }
  };

  const getTypeBadgeColor = (t: string) => {
    switch (t) {
      case "Conta Bancária":
        return { bg: "rgba(37, 99, 235, 0.12)", text: "#2563eb" };
      case "Carteira Digital":
        return { bg: "rgba(147, 51, 234, 0.12)", text: "#9333ea" };
      case "Cofre":
        return { bg: "rgba(217, 119, 6, 0.12)", text: "#d97706" };
      default:
        return { bg: "rgba(16, 185, 129, 0.12)", text: "#10b981" };
    }
  };

  // Helper date
  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getUTCDate().toString().padStart(2, "0");
    const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ABAS SUPERIORES FINANCEIRAS */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "8px", flexWrap: "wrap" }}>
        <Link
          href="/financeiro"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#64748b",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            marginBottom: "-2px"
          }}
        >
          <LayoutDashboard size={17} /> Histórico de Caixas
        </Link>
        <Link
          href="/financeiro/receitas"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#64748b",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            marginBottom: "-2px"
          }}
        >
          <TrendingUp size={17} /> Contas a Receber
        </Link>
        <Link
          href="/financeiro/despesas"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#64748b",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            marginBottom: "-2px"
          }}
        >
          <TrendingDown size={17} /> Contas a Pagar
        </Link>
        <Link
          href="/financeiro/pontos-recebimento"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--primary-color)",
            textDecoration: "none",
            borderBottom: "2px solid var(--primary-color)",
            marginBottom: "-2px"
          }}
        >
          <Wallet size={17} /> Pontos de Recebimento
        </Link>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {/* Saldo Total Consolidado */}
        <div style={{
          background: "var(--bg-color-soft)",
          border: metrics.saldoTotal >= 0 ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Saldo Total (Todos os Caixas)</span>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: metrics.saldoTotal >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: metrics.saldoTotal >= 0 ? "#10b981" : "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: metrics.saldoTotal >= 0 ? "#10b981" : "#ef4444" }}>
            R$ {metrics.saldoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Disponível somando todos os pontos ativos
          </span>
        </div>

        {/* Caixas Físicos */}
        <div style={{
          background: "var(--bg-color-soft)",
          border: "1px solid var(--glass-border)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Caixas Físicos / Balcão</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={19} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)" }}>
            R$ {metrics.totalFisico.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Dinheiro em caixa físico e cofres
          </span>
        </div>

        {/* Contas Bancárias */}
        <div style={{
          background: "var(--bg-color-soft)",
          border: "1px solid var(--glass-border)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Contas Bancárias</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(37, 99, 235, 0.15)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Landmark size={19} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)" }}>
            R$ {metrics.totalBancario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Saldos em contas correntes e aplicações
          </span>
        </div>

        {/* Caixas Cadastrados */}
        <div style={{
          background: "var(--bg-color-soft)",
          border: "1px solid var(--glass-border)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Pontos Ativos</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(100, 116, 139, 0.15)", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={19} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)" }}>
            {metrics.totalAtivos} ponto(s)
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {cashPoints.length} cadastrados no total
          </span>
        </div>
      </div>

      {/* TOOLBAR COM FILTROS COMPLETOS */}
      <div style={{
        background: "var(--bg-color-soft)",
        border: "1px solid var(--glass-border)",
        borderRadius: "14px",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
      }}>
        {/* Linha 1: Busca e Botão Novo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "460px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar por nome ou dados do caixa/banco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sgp-input"
              style={{ paddingLeft: "36px", width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  borderRadius: "8px",
                  color: "#ef4444"
                }}
              >
                <RotateCcw size={14} /> Limpar Filtros
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "8px",
                boxShadow: "0 4px 12px var(--primary-glow)"
              }}
            >
              <Plus size={18} /> Novo Ponto de Recebimento
            </button>
          </div>
        </div>

        {/* Linha 2: Filtros avançados (Tipo, Status, Saldo, Ordenação) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          borderTop: "1px solid var(--glass-border)",
          paddingTop: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Tipo */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Tipo:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="sgp-input"
                style={{ padding: "5px 10px", fontSize: "12px", minWidth: "140px" }}
              >
                <option value="TODOS">Todos os tipos</option>
                <option value="Caixa Físico">Caixa Físico</option>
                <option value="Conta Bancária">Conta Bancária</option>
                <option value="Carteira Digital">Carteira Digital</option>
                <option value="Cofre">Cofre</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Status (Ativo / Inativo) */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="sgp-input"
                style={{ padding: "5px 10px", fontSize: "12px", minWidth: "120px" }}
              >
                <option value="TODOS">Todos</option>
                <option value="ATIVO">Apenas Ativos</option>
                <option value="INATIVO">Apenas Inativos</option>
              </select>
            </div>

            {/* Saldo (Positivo / Negativo / Zerado) */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Faixa de Saldo:</span>
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value)}
                className="sgp-input"
                style={{ padding: "5px 10px", fontSize: "12px", minWidth: "135px" }}
              >
                <option value="TODOS">Todos os saldos</option>
                <option value="POSITIVO">Saldo Positivo (&gt; 0)</option>
                <option value="NEGATIVO">Saldo Negativo (&lt; 0)</option>
                <option value="ZERADO">Saldo Zerado (R$ 0,00)</option>
              </select>
            </div>

            {/* Ordenação */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sgp-input"
                style={{ padding: "5px 10px", fontSize: "12px", minWidth: "155px" }}
              >
                <option value="name_asc">Nome (A - Z)</option>
                <option value="name_desc">Nome (Z - A)</option>
                <option value="balance_desc">Maior Saldo Atual</option>
                <option value="balance_asc">Menor Saldo Atual</option>
                <option value="inflow_desc">Maior Volume de Entradas</option>
                <option value="outflow_desc">Maior Volume de Saídas</option>
              </select>
            </div>
          </div>

          {/* Contador de itens e saldo filtrado */}
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Exibindo <strong>{filteredList.length}</strong> de {cashPoints.length} ponto(s)
            {isFiltered && (
              <span style={{ marginLeft: "8px", color: "var(--primary-color)", fontWeight: 600 }}>
                • Saldo da seleção: R$ {filteredBalanceSum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* LISTA DE PONTOS DE RECEBIMENTO (TABELA) */}
      <div style={{
        background: "var(--bg-color-soft)",
        border: "1px solid var(--glass-border)",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Ponto / Caixa</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Tipo</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Saldo Inicial</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Total Entradas</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Total Saídas</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Saldo Atual</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "14px 16px", fontWeight: 600, textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((cp) => {
                const badgeStyle = getTypeBadgeColor(cp.type);
                const isNegative = cp.currentBalance < 0;

                return (
                  <tr
                    key={cp.id}
                    style={{
                      borderBottom: "1px solid var(--glass-border)",
                      transition: "background 0.15s",
                      opacity: cp.ativo ? 1 : 0.65
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.015)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Ponto / Caixa */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: badgeStyle.bg,
                          color: badgeStyle.text,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          {getTypeIcon(cp.type)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "14px" }}>
                            {cp.name}
                          </div>
                          {cp.description && (
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", maxWidth: "280px" }}>
                              {cp.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tipo */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: "999px",
                        background: badgeStyle.bg,
                        color: badgeStyle.text
                      }}>
                        {cp.type}
                      </span>
                    </td>

                    {/* Saldo Inicial */}
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontWeight: 500 }}>
                      R$ {cp.initialBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Total Entradas */}
                    <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <ArrowUpRight size={14} />
                        R$ {cp.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Total Saídas */}
                    <td style={{ padding: "14px 16px", color: "#ef4444", fontWeight: 700 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <ArrowDownRight size={14} />
                        R$ {cp.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Saldo Atual */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: isNegative ? "#ef4444" : "#10b981"
                      }}>
                        R$ {cp.currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: "999px",
                        background: cp.ativo ? "rgba(16, 185, 129, 0.12)" : "rgba(100, 116, 139, 0.12)",
                        color: cp.ativo ? "#10b981" : "#64748b"
                      }}>
                        {cp.ativo ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {cp.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    {/* Ações */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenExtrato(cp)}
                          title="Extrato / Movimentações"
                          className="btn btn-secondary"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 10px",
                            fontSize: "12px",
                            fontWeight: 600,
                            borderRadius: "6px"
                          }}
                        >
                          <Receipt size={13} /> Extrato
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cp)}
                          title="Editar Caixa"
                          className="btn btn-secondary"
                          style={{ padding: "6px 8px", borderRadius: "6px" }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAtivo(cp)}
                          title={cp.ativo ? "Desativar" : "Reativar"}
                          className="btn btn-secondary"
                          style={{
                            padding: "6px 8px",
                            borderRadius: "6px",
                            color: cp.ativo ? "#d97706" : "#10b981"
                          }}
                        >
                          {cp.ativo ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cp)}
                          title="Excluir Caixa"
                          className="btn btn-secondary"
                          style={{ padding: "6px 8px", borderRadius: "6px", color: "#ef4444" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <Wallet size={36} color="var(--text-muted)" />
                      <div style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "14px" }}>
                        Nenhum ponto de recebimento cadastrado
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Clique no botão acima para cadastrar seu primeiro caixa ou conta bancária.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO / EDITAR PONTO DE RECEBIMENTO */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
            padding: "16px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.35)",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-main)" }}>
                  {selectedCp ? "Editar Ponto de Recebimento" : "Novo Ponto de Recebimento (Caixa)"}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Cadastre caixas físicos, contas bancárias ou carteiras de cobrança.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                  Nome do Caixa / Ponto: <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Caixa Geral, Conta Itaú PJ, Cofre Loja..."
                  className="sgp-input"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                    Tipo: <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="sgp-input"
                    style={{ width: "100%" }}
                  >
                    <option value="Caixa Físico">Caixa Físico</option>
                    <option value="Conta Bancária">Conta Bancária</option>
                    <option value="Carteira Digital">Carteira Digital</option>
                    <option value="Cofre">Cofre</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                    Saldo Inicial (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="0,00"
                    className="sgp-input"
                    style={{ width: "100%", fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                  Descrição / Dados da Conta (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Agência 1234, Conta 56789-0, Chave Pix cnpj@empresa.com..."
                  className="sgp-input"
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              {/* Botões */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="btn btn-secondary"
                  style={{ padding: "9px 16px", borderRadius: "8px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    padding: "9px 20px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    boxShadow: "0 4px 12px var(--primary-glow)"
                  }}
                >
                  {isSubmitting ? "Salvando..." : selectedCp ? "Salvar Alterações" : "Cadastrar Ponto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXTRATO DO CAIXA COM FILTROS COMPLETOS */}
      {extratoCp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
            padding: "16px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setExtratoCp(null);
          }}
        >
          <div
            style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "880px",
              maxHeight: "88vh",
              overflowY: "auto",
              boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.35)",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
          >
            {/* Header do Extrato */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "var(--primary-glow)",
                  color: "var(--primary-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {getTypeIcon(extratoCp.type)}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "var(--text-main)" }}>
                      {extratoCp.name}
                    </h3>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: getTypeBadgeColor(extratoCp.type).bg,
                      color: getTypeBadgeColor(extratoCp.type).text
                    }}>
                      {extratoCp.type}
                    </span>
                  </div>
                  <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                    Saldo Inicial: <strong>R$ {extratoCp.initialBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong> • Saldo Atual em Caixa: <strong style={{ color: extratoCp.currentBalance >= 0 ? "#10b981" : "#ef4444" }}>R$ {extratoCp.currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExtratoCp(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick KPI Cards do Extrato Filtrado */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <div style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#10b981" }}>Entradas da Seleção</span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#10b981" }}>
                  + R$ {extratoTotals.entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#ef4444" }}>Saídas da Seleção</span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#ef4444" }}>
                  - R$ {extratoTotals.saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{
                background: extratoTotals.saldo >= 0 ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
                border: extratoTotals.saldo >= 0 ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: extratoTotals.saldo >= 0 ? "#10b981" : "#ef4444" }}>
                  Fluxo Líquido Filtrado
                </span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: extratoTotals.saldo >= 0 ? "#10b981" : "#ef4444" }}>
                  R$ {extratoTotals.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{
                background: "rgba(0,0,0,0.02)",
                border: "1px solid var(--glass-border)",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Movimentações</span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)" }}>
                  {extratoTotals.count} registro(s)
                </span>
              </div>
            </div>

            {/* BARRA DE FILTROS DO EXTRATO */}
            <div style={{
              background: "rgba(0,0,0,0.02)",
              border: "1px solid var(--glass-border)",
              borderRadius: "12px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px"
            }}>
              {/* Busca no extrato */}
              <div style={{ position: "relative", flex: "1 1 200px", maxWidth: "340px" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Filtrar descrição, cliente ou categoria..."
                  value={extratoSearch}
                  onChange={(e) => setExtratoSearch(e.target.value)}
                  className="sgp-input"
                  style={{ paddingLeft: "32px", width: "100%", fontSize: "12px", padding: "6px 10px 6px 30px" }}
                />
              </div>

              {/* Filtros de Tipo e Status */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <select
                  value={extratoTypeFilter}
                  onChange={(e) => setExtratoTypeFilter(e.target.value)}
                  className="sgp-input"
                  style={{ padding: "5px 8px", fontSize: "12px", minWidth: "135px" }}
                >
                  <option value="TODOS">Todas Movimentações</option>
                  <option value="ENTRADAS">Apenas Entradas</option>
                  <option value="SAIDAS">Apenas Saídas</option>
                </select>

                <select
                  value={extratoStatusFilter}
                  onChange={(e) => setExtratoStatusFilter(e.target.value)}
                  className="sgp-input"
                  style={{ padding: "5px 8px", fontSize: "12px", minWidth: "125px" }}
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="CONCLUIDOS">Recebido / Pago</option>
                  <option value="PENDENTES">Pendentes</option>
                </select>

                {(extratoSearch || extratoTypeFilter !== "TODOS" || extratoStatusFilter !== "TODOS") && (
                  <button
                    type="button"
                    onClick={() => {
                      setExtratoSearch("");
                      setExtratoTypeFilter("TODOS");
                      setExtratoStatusFilter("TODOS");
                    }}
                    className="btn btn-secondary"
                    style={{ padding: "5px 10px", fontSize: "11px", color: "#ef4444" }}
                  >
                    <RotateCcw size={12} /> Limpar
                  </button>
                )}
              </div>
            </div>

            {/* List of movements */}
            <div style={{ border: "1px solid var(--glass-border)", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px 12px" }}>Data / Venc.</th>
                    <th style={{ padding: "10px 12px" }}>Tipo</th>
                    <th style={{ padding: "10px 12px" }}>Descrição / Favorecido</th>
                    <th style={{ padding: "10px 12px" }}>Categoria</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {extratoMovements.map((mov, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid var(--glass-border)",
                        transition: "background 0.1s"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.015)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <div>{formatDate(mov.date)}</div>
                        {mov.paymentDate && (
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                            Efetivado: {formatDate(mov.paymentDate)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "999px",
                          background: mov.isEntrada ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                          color: mov.isEntrada ? "#10b981" : "#ef4444"
                        }}>
                          {mov.type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{mov.desc}</div>
                        {mov.customerOrVendor && (
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {mov.customerOrVendor}
                          </div>
                        )}
                        {mov.occurrenceId && (
                          <div style={{ fontSize: "10px", color: "var(--primary-color)", marginTop: "2px" }}>
                            O.S. #{mov.occurrenceId}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>
                        {mov.category}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background: mov.status === "Recebido" || mov.status === "Pago" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: mov.status === "Recebido" || mov.status === "Pago" ? "#10b981" : "#d97706"
                        }}>
                          {mov.status}
                        </span>
                      </td>
                      <td style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: mov.isEntrada ? "#10b981" : "#ef4444",
                        whiteSpace: "nowrap"
                      }}>
                        {mov.isEntrada ? "+ " : "- "}R$ {mov.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}

                  {extratoMovements.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                          <Receipt size={28} color="var(--text-muted)" />
                          <div style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                            Nenhuma movimentação encontrada
                          </div>
                          <div style={{ fontSize: "12px" }}>
                            {extratoSearch || extratoTypeFilter !== "TODOS" || extratoStatusFilter !== "TODOS"
                              ? "Nenhum lançamento corresponde aos filtros aplicados."
                              : "Nenhuma movimentação registrada para este ponto de recebimento ainda."}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setExtratoCp(null)}
                className="btn btn-secondary"
                style={{ padding: "8px 18px", borderRadius: "8px", fontSize: "13px" }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
