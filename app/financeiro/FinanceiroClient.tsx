"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter, 
  Download, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  LayoutDashboard, 
  ExternalLink, 
  X, 
  CreditCard,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { receivePayment, payPayable } from "@/app/actions/financeiro";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface FinanceiroClientProps {
  data: {
    receivables: any[];
    payables: any[];
    customers: any[];
    paymentMethods: any[];
    expenseCategories: any[];
    vehicles: any[];
  };
}

export default function FinanceiroClient({ data }: FinanceiroClientProps) {
  const { receivables, payables } = data;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("TODOS"); // TODOS, RECEITAS, DESPESAS
  const [filterStatus, setFilterStatus] = useState("TODOS"); // TODOS, PENDENTES, CONCLUIDOS

  // Modal de Baixa Rápida
  const [baixaItem, setBaixaItem] = useState<{ id: number; type: "Receita" | "Despesa"; title: string; amount: number; occurrenceId?: number | null } | null>(null);
  const [isBaixando, setIsBaixando] = useState(false);

  // Helper date formatter
  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getUTCDate().toString().padStart(2, "0");
    const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  // Metrics calculations
  const metrics = useMemo(() => {
    // Receitas
    const totalReceitasPagas = receivables
      .filter((r) => r.status === "Recebido")
      .reduce((acc, cur) => acc + cur.amount, 0);

    const totalReceitasPendentes = receivables
      .filter((r) => r.status !== "Recebido" && r.status !== "Cancelado")
      .reduce((acc, cur) => acc + cur.amount, 0);

    const countReceitasPendentes = receivables.filter((r) => r.status !== "Recebido" && r.status !== "Cancelado").length;

    // Despesas
    const totalDespesasPagas = payables
      .filter((p) => p.status === "Pago")
      .reduce((acc, cur) => acc + cur.amount, 0);

    const totalDespesasPendentes = payables
      .filter((p) => p.status !== "Pago" && p.status !== "Cancelado")
      .reduce((acc, cur) => acc + cur.amount, 0);

    const countDespesasPendentes = payables.filter((p) => p.status !== "Pago" && p.status !== "Cancelado").length;

    // Saldo Realizado (Caixa Real)
    const saldoRealizado = totalReceitasPagas - totalDespesasPagas;

    // Saldo Projetado (Total Receitas Previstas - Total Despesas Previstas)
    const saldoProjetado = (totalReceitasPagas + totalReceitasPendentes) - (totalDespesasPagas + totalDespesasPendentes);

    return {
      totalReceitasPagas,
      totalReceitasPendentes,
      countReceitasPendentes,
      totalDespesasPagas,
      totalDespesasPendentes,
      countDespesasPendentes,
      saldoRealizado,
      saldoProjetado
    };
  }, [receivables, payables]);

  // Unified Transactions List
  const transactions = useMemo(() => {
    const list: any[] = [];

    receivables.forEach((r) => {
      const isConcluido = r.status === "Recebido";
      const due = new Date(r.due_date);
      const isOverdue = !isConcluido && r.status !== "Cancelado" && due < new Date();

      list.push({
        id: r.id,
        type: "Receita",
        title: r.customer?.name || "Cliente Avulso",
        subtitle: r.customer?.document || "Sem documento",
        category: "Receita de Cliente",
        occurrenceId: r.occurrenceId,
        clientId: r.clientId,
        paymentMethod: r.paymentMethod?.name || "Não definida",
        due_date: r.due_date,
        amount: r.amount,
        status: isConcluido ? "Recebido" : isOverdue ? "Atrasado" : r.status,
        isConcluido,
        isOverdue,
        rawObj: r
      });
    });

    payables.forEach((p) => {
      const isConcluido = p.status === "Pago";
      const due = new Date(p.due_date);
      const isOverdue = !isConcluido && p.status !== "Cancelado" && due < new Date();

      list.push({
        id: p.id,
        type: "Despesa",
        title: p.description,
        subtitle: p.responsible ? `Favorecido: ${p.responsible}` : p.vehicle ? `Veículo: ${p.vehicle.plate}` : "Despesa Operacional",
        category: p.category?.name || "Geral",
        occurrenceId: null,
        vehicle: p.vehicle,
        due_date: p.due_date,
        amount: p.amount,
        status: isConcluido ? "Pago" : isOverdue ? "Vencida" : p.status,
        isConcluido,
        isOverdue,
        rawObj: p
      });
    });

    return list.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
  }, [receivables, payables]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        t.title.toLowerCase().includes(search) || 
        t.subtitle.toLowerCase().includes(search) || 
        t.category.toLowerCase().includes(search) ||
        (t.occurrenceId && String(t.occurrenceId).includes(search));
      if (!matchesSearch) return false;

      // Tipo
      if (filterType === "RECEITAS" && t.type !== "Receita") return false;
      if (filterType === "DESPESAS" && t.type !== "Despesa") return false;

      // Status
      if (filterStatus === "PENDENTES" && t.isConcluido) return false;
      if (filterStatus === "CONCLUIDOS" && !t.isConcluido) return false;

      return true;
    });
  }, [transactions, searchTerm, filterType, filterStatus]);

  // Modal Baixa Confirmation
  const handleConfirmBaixa = async () => {
    if (!baixaItem) return;
    setIsBaixando(true);
    try {
      if (baixaItem.type === "Receita") {
        await receivePayment(baixaItem.id, baixaItem.occurrenceId || null);
      } else {
        await payPayable(baixaItem.id);
      }
      setBaixaItem(null);
    } catch (err: any) {
      alert("Erro ao confirmar baixa: " + err.message);
    } finally {
      setIsBaixando(false);
    }
  };

  // Export handlers
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Fluxo de Caixa Geral - Relatório Consolidado", 14, 15);
    const tableColumn = ["Tipo", "Descrição / Titular", "Categoria", "Vencimento", "Valor (R$)", "Status"];
    const tableRows: any[] = [];
    filteredTransactions.forEach((t) => {
      tableRows.push([
        t.type,
        t.title,
        t.category,
        formatDate(t.due_date),
        t.amount.toFixed(2),
        t.status
      ]);
    });
    autoTable(doc, { 
      head: [tableColumn], 
      body: tableRows, 
      startY: 22, 
      styles: { fontSize: 8 }, 
      headStyles: { fillColor: [15, 23, 42] } 
    });
    doc.save("fluxo_de_caixa_geral.pdf");
  };

  const exportExcel = () => {
    const exportData = filteredTransactions.map((t) => ({
      Tipo: t.type,
      Titulo: t.title,
      Detalhes: t.subtitle,
      Categoria: t.category,
      Vencimento: formatDate(t.due_date),
      Valor: t.amount,
      Status: t.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FluxoDeCaixa");
    XLSX.writeFile(workbook, "fluxo_de_caixa_geral.xlsx");
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
            fontWeight: 600,
            color: "var(--primary-color)",
            textDecoration: "none",
            borderBottom: "2px solid var(--primary-color)",
            marginBottom: "-2px"
          }}
        >
          <LayoutDashboard size={17} /> Painel Geral
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
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "16px" }}>
        {/* Saldo Líquido Realizado */}
        <div style={{
          background: "var(--bg-color-soft)",
          border: metrics.saldoRealizado >= 0 ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Saldo Realizado (Caixa)</span>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: metrics.saldoRealizado >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: metrics.saldoRealizado >= 0 ? "#10b981" : "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: metrics.saldoRealizado >= 0 ? "#10b981" : "#ef4444" }}>
            R$ {metrics.saldoRealizado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Saldo Projetado: <strong>R$ {metrics.saldoProjetado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
          </span>
        </div>

        {/* Receitas Realizadas */}
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
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Receitas Realizadas</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#10b981" }}>
            R$ {metrics.totalReceitasPagas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            + R$ {metrics.totalReceitasPendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} a receber
          </span>
        </div>

        {/* Despesas Pagas */}
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
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Despesas Pagas</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#ef4444" }}>
            R$ {metrics.totalDespesasPagas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            - R$ {metrics.totalDespesasPendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} a pagar
          </span>
        </div>
      </div>

      {/* QUICK ACTION CARDS (CENTRAL DE ACESSO RÁPIDO) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {/* Card Contas a Receber */}
        <div style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          borderRadius: "14px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#10b981",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
            }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
                Contas a Receber
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                {metrics.countReceitasPendentes} título(s) pendente(s) • Total: <strong>R$ {metrics.totalReceitasPendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </p>
            </div>
          </div>
          <Link
            href="/financeiro/receitas"
            className="btn btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              backgroundColor: "#10b981",
              borderColor: "#10b981"
            }}
          >
            Acessar Contas a Receber <ChevronRight size={15} />
          </Link>
        </div>

        {/* Card Contas a Pagar */}
        <div style={{
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.03) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
          borderRadius: "14px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#ef4444",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
            }}>
              <TrendingDown size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
                Contas a Pagar
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                {metrics.countDespesasPendentes} conta(s) pendente(s) • Total: <strong>R$ {metrics.totalDespesasPendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </p>
            </div>
          </div>
          <Link
            href="/financeiro/despesas"
            className="btn btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              backgroundColor: "#dc2626",
              borderColor: "#dc2626"
            }}
          >
            Acessar Contas a Pagar <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* RELATÓRIO FINANCEIRO CONSOLIDADO */}
      <div style={{
        background: "var(--bg-color-soft)",
        border: "1px solid var(--glass-border)",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        {/* Header do Relatório */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
              Fluxo Consolidado de Lançamentos
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
              Visão unificada de receitas e despesas registradas no período.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={exportPDF}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px", borderRadius: "8px" }}
            >
              <Download size={15} color="#ef4444" /> PDF
            </button>
            <button
              type="button"
              onClick={exportExcel}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px", borderRadius: "8px" }}
            >
              <Download size={15} color="#10b981" /> Excel
            </button>
          </div>
        </div>

        {/* Toolbar de Filtros do Relatório */}
        <div style={{
          padding: "14px 20px",
          background: "rgba(0,0,0,0.015)",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          {/* Busca */}
          <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "380px" }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar por descrição, cliente ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sgp-input"
              style={{ paddingLeft: "34px", width: "100%", fontSize: "13px" }}
            />
          </div>

          {/* Filtros Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            {/* Tipo */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Tipo:</span>
              {[
                { id: "TODOS", label: "Todos" },
                { id: "RECEITAS", label: "Receitas" },
                { id: "DESPESAS", label: "Despesas" }
              ].map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => setFilterType(tp.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    background: filterType === tp.id ? "var(--primary-color)" : "rgba(0,0,0,0.04)",
                    color: filterType === tp.id ? "#ffffff" : "var(--text-secondary)",
                    transition: "all 0.15s"
                  }}
                >
                  {tp.label}
                </button>
              ))}
            </div>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Status:</span>
              {[
                { id: "TODOS", label: "Todos" },
                { id: "PENDENTES", label: "Pendentes" },
                { id: "CONCLUIDOS", label: "Realizados" }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setFilterStatus(st.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    background: filterStatus === st.id ? "var(--text-main)" : "rgba(0,0,0,0.04)",
                    color: filterStatus === st.id ? "#ffffff" : "var(--text-secondary)",
                    transition: "all 0.15s"
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela de Lançamentos */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Tipo</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Descrição / Titular</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Categoria / Detalhe</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Vencimento</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Valor</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "14px 16px", fontWeight: 600, textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => {
                const isReceita = t.type === "Receita";

                return (
                  <tr 
                    key={`${t.type}-${t.id}`} 
                    style={{ 
                      borderBottom: "1px solid var(--glass-border)",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.015)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Tipo */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: isReceita ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        color: isReceita ? "#10b981" : "#ef4444"
                      }}>
                        {isReceita ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {t.type}
                      </span>
                    </td>

                    {/* Descrição / Titular */}
                    <td style={{ padding: "14px 16px" }}>
                      <div>
                        {isReceita && t.clientId ? (
                          <Link
                            href={`/clientes/${t.clientId}`}
                            style={{ fontWeight: 600, color: "var(--text-main)", textDecoration: "none" }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                          >
                            {t.title}
                          </Link>
                        ) : (
                          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                            {t.title}
                          </span>
                        )}
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {t.subtitle}
                        </div>
                      </div>
                    </td>

                    {/* Categoria / Detalhe */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {t.category}
                      </span>
                      {t.occurrenceId && (
                        <div style={{ fontSize: "11px", color: "var(--primary-color)" }}>
                          Ref. O.S. #{t.occurrenceId}
                        </div>
                      )}
                    </td>

                    {/* Vencimento */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ color: t.isOverdue ? "#ef4444" : "var(--text-main)", fontWeight: t.isOverdue ? 700 : 500 }}>
                        {formatDate(t.due_date)}
                      </span>
                      {t.isOverdue && (
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#ef4444" }}>
                          ATRASADO
                        </div>
                      )}
                    </td>

                    {/* Valor */}
                    <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: "14px", color: isReceita ? "#10b981" : "#ef4444" }}>
                      {isReceita ? "+ " : "- "}R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      {t.isConcluido ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontSize: "11px", fontWeight: 700 }}>
                          <CheckCircle2 size={12} /> {t.status}
                        </span>
                      ) : t.isOverdue ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", fontSize: "11px", fontWeight: 700 }}>
                          <AlertCircle size={12} /> {t.status}
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "rgba(245, 158, 11, 0.15)", color: "#d97706", fontSize: "11px", fontWeight: 700 }}>
                          <Clock size={12} /> {t.status}
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        {!t.isConcluido && (
                          <button
                            type="button"
                            onClick={() => setBaixaItem({
                              id: t.id,
                              type: t.type,
                              title: t.title,
                              amount: t.amount,
                              occurrenceId: t.occurrenceId
                            })}
                            title={isReceita ? "Confirmar Recebimento" : "Confirmar Pagamento"}
                            style={{
                              background: isReceita ? "#10b981" : "#dc2626",
                              border: "none",
                              color: "#ffffff",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <CheckCircle2 size={13} /> {isReceita ? "Receber" : "Pagar"}
                          </button>
                        )}
                        <Link
                          href={isReceita ? "/financeiro/receitas" : "/financeiro/despesas"}
                          title="Gerenciar nesta tela"
                          className="btn btn-secondary"
                          style={{ padding: "5px 8px", borderRadius: "6px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                        >
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <LayoutDashboard size={36} color="var(--text-muted)" />
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-secondary)" }}>
                        Nenhum lançamento financeiro encontrado
                      </div>
                      <div style={{ fontSize: "12px" }}>
                        Tente ajustar os filtros de busca ou o período selecionado.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CONFIRMAR BAIXA (RECEBER / PAGAR) */}
      {baixaItem && (
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
            if (e.target === e.currentTarget && !isBaixando) setBaixaItem(null);
          }}
        >
          <div
            style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.35)",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: baixaItem.type === "Receita" ? "rgba(16, 185, 129, 0.15)" : "rgba(220, 38, 38, 0.15)",
                color: baixaItem.type === "Receita" ? "#10b981" : "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <CheckCircle2 size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-main)" }}>
                  {baixaItem.type === "Receita" ? "Confirmar Recebimento?" : "Confirmar Pagamento?"}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                  Deseja dar baixa neste lançamento e atualizar o status para <strong>{baixaItem.type === "Receita" ? "Recebido" : "Pago"}</strong>?
                </p>
              </div>
            </div>

            <div style={{
              background: "rgba(0,0,0,0.03)",
              border: "1px solid var(--glass-border)",
              borderRadius: "10px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "13px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Titular / Item:</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{baixaItem.title}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Valor a Baixar:</span>
                <span style={{ fontWeight: 700, color: baixaItem.type === "Receita" ? "#10b981" : "#dc2626", fontSize: "15px" }}>
                  R$ {baixaItem.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {baixaItem.occurrenceId && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Ordem de Serviço:</span>
                  <span style={{ fontWeight: 600 }}>#{baixaItem.occurrenceId}</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setBaixaItem(null)}
                disabled={isBaixando}
                className="btn btn-secondary"
                style={{ padding: "9px 16px", borderRadius: "8px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBaixa}
                disabled={isBaixando}
                style={{
                  background: baixaItem.type === "Receita" ? "#10b981" : "#dc2626",
                  border: "none",
                  color: "#ffffff",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: isBaixando ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <CheckCircle2 size={15} />
                {isBaixando ? "Processando..." : (baixaItem.type === "Receita" ? "Confirmar Recebimento" : "Confirmar Pagamento")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
