"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  TrendingUp, 
  ArrowUpDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Edit3, 
  EyeOff, 
  Layers, 
  DollarSign, 
  ShieldCheck, 
  SlidersHorizontal,
  X,
  CheckCircle2,
  RefreshCw,
  Archive,
  AlertCircle
} from "lucide-react";
import { adjustStock, toggleHideStockItem } from "@/app/actions/estoque";

interface StockItem {
  id: number;
  nome: string;
  codigo: string | null;
  categoria: string;
  principioAtivo: string | null;
  grupoQuimico: string | null;
  registroMS: string | null;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  localizacao: string | null;
  lote: string | null;
  dataValidade: Date | string | null;
  precoCusto: number | null;
  precoVenda: number | null;
  fornecedor: string | null;
  observacoes: string | null;
  isHidden: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface EstoqueClientProps {
  initialData: {
    items: StockItem[];
    kpis: {
      totalItens: number;
      valorTotalEstoque: number;
      itensEstoqueBaixo: number;
      itensEsgotados: number;
      itensVencendo: number;
    };
  };
}

export default function EstoqueClient({ initialData }: EstoqueClientProps) {
  const [items, setItems] = useState<StockItem[]>(initialData.items);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");

  // Modal de Movimentação Rápida
  const [movementModalItem, setMovementModalItem] = useState<StockItem | null>(null);
  const [movementType, setMovementType] = useState<"ENTRADA" | "SAIDA" | "AJUSTE" | "DESCARTE">("ENTRADA");
  const [movementQuantity, setMovementQuantity] = useState<number | string>("");
  const [movementReason, setMovementReason] = useState("");
  const [movementDestiny, setMovementDestiny] = useState("");
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.categoria) set.add(i.categoria);
    });
    return ["TODAS", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    return items.filter(item => {
      // Filtro de Texto
      const q = searchTerm.toLowerCase().trim();
      const matchText = 
        !q ||
        item.nome.toLowerCase().includes(q) ||
        (item.codigo && item.codigo.toLowerCase().includes(q)) ||
        (item.principioAtivo && item.principioAtivo.toLowerCase().includes(q)) ||
        (item.lote && item.lote.toLowerCase().includes(q)) ||
        (item.fornecedor && item.fornecedor.toLowerCase().includes(q));

      // Filtro de Categoria
      const matchCategory = selectedCategory === "TODAS" || item.categoria === selectedCategory;

      // Filtro de Status
      let matchStatus = true;
      if (selectedStatus === "ESGOTADO") {
        matchStatus = item.quantidadeAtual <= 0;
      } else if (selectedStatus === "BAIXO") {
        matchStatus = item.quantidadeAtual > 0 && item.quantidadeMinima > 0 && item.quantidadeAtual <= item.quantidadeMinima;
      } else if (selectedStatus === "NORMAL") {
        matchStatus = item.quantidadeAtual > item.quantidadeMinima;
      } else if (selectedStatus === "VENCENDO") {
        if (!item.dataValidade) {
          matchStatus = false;
        } else {
          const valDate = new Date(item.dataValidade);
          matchStatus = valDate <= thirtyDaysAhead;
        }
      }

      return matchText && matchCategory && matchStatus;
    });
  }, [items, searchTerm, selectedCategory, selectedStatus]);

  // KPIs calculados
  const kpis = useMemo(() => {
    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    let valorTotal = 0;
    let baixo = 0;
    let esgotado = 0;
    let vencendo = 0;

    items.forEach(i => {
      if (i.precoCusto && i.quantidadeAtual > 0) {
        valorTotal += i.precoCusto * i.quantidadeAtual;
      }
      if (i.quantidadeAtual <= 0) {
        esgotado++;
      } else if (i.quantidadeMinima > 0 && i.quantidadeAtual <= i.quantidadeMinima) {
        baixo++;
      }
      if (i.dataValidade) {
        const d = new Date(i.dataValidade);
        if (d <= thirtyDaysAhead) vencendo++;
      }
    });

    return {
      total: items.length,
      valorTotal,
      baixo,
      esgotado,
      vencendo
    };
  }, [items]);

  const handleOpenMovementModal = (item: StockItem, defaultType: "ENTRADA" | "SAIDA" = "ENTRADA") => {
    setMovementModalItem(item);
    setMovementType(defaultType);
    setMovementQuantity("");
    setMovementReason(defaultType === "ENTRADA" ? "Recebimento de Mercadoria" : "Aplicação / Ocorrência");
    setMovementDestiny("");
    setFeedbackMessage(null);
  };

  const handleCloseMovementModal = () => {
    setMovementModalItem(null);
    setMovementQuantity("");
    setMovementReason("");
    setMovementDestiny("");
  };

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModalItem) return;

    const qtd = Number(movementQuantity);
    if (isNaN(qtd) || qtd <= 0) {
      alert("Por favor, informe uma quantidade válida maior que zero.");
      return;
    }

    try {
      setIsSubmittingMovement(true);
      const res = await adjustStock(
        movementModalItem.id,
        movementType,
        qtd,
        movementReason || `Movimentação de ${movementType}`,
        movementDestiny,
        "Usuário Logado"
      );

      if (res.success && res.item) {
        setItems(prev => prev.map(it => it.id === res.item.id ? { ...it, quantidadeAtual: res.item.quantidadeAtual } : it));
        setFeedbackMessage({ text: `Estoque de "${movementModalItem.nome}" atualizado com sucesso!`, type: "success" });
        setTimeout(() => {
          handleCloseMovementModal();
        }, 800);
      }
    } catch (err: any) {
      alert(err.message || "Erro ao processar movimentação de estoque.");
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  const handleToggleHide = async (item: StockItem) => {
    if (!confirm(`Deseja realmente ocultar o item "${item.nome}" do estoque?`)) return;

    try {
      await toggleHideStockItem(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err: any) {
      alert(err.message || "Erro ao ocultar item.");
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR");
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 16px" }}>
      {/* CABEÇALHO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Início</Link>
            <span>/</span>
            <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Estoque</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Package size={26} color="var(--primary-color)" /> Controle de Estoque & Insumos
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            Acompanhe saldos, pontos de reposição, lotes químicos, EPIs e movimentações em tempo real.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link
            href="/estoque/novo"
            id="btn-cadastrar-item-estoque"
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              textDecoration: "none",
              boxShadow: "0 2px 4px rgba(2, 132, 199, 0.2)"
            }}
          >
            <Plus size={18} /> Cadastrar Item
          </Link>
        </div>
      </div>

      {/* CARDS DE INDICADORES / KPIS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* Total Itens */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: "rgba(2, 132, 199, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7" }}>
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, textTransform: "uppercase" }}>Total de Itens</span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>{kpis.total}</div>
          </div>
        </div>

        {/* Valor Total */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
            <DollarSign size={22} />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, textTransform: "uppercase" }}>Valor em Estoque</span>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#059669" }}>{formatCurrency(kpis.valorTotal)}</div>
          </div>
        </div>

        {/* Estoque Baixo */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: "rgba(217, 119, 6, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, textTransform: "uppercase" }}>Estoque Baixo</span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: kpis.baixo > 0 ? "#d97706" : "#0f172a" }}>
              {kpis.baixo}
            </div>
          </div>
        </div>

        {/* Esgotados */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: "rgba(220, 38, 38, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
            <XCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, textTransform: "uppercase" }}>Esgotados</span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: kpis.esgotado > 0 ? "#dc2626" : "#0f172a" }}>
              {kpis.esgotado}
            </div>
          </div>
        </div>

        {/* Vencendo / Vencidos */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
            <Calendar size={22} />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, textTransform: "uppercase" }}>Vencendo em 30d</span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: kpis.vencendo > 0 ? "#7c3aed" : "#0f172a" }}>
              {kpis.vencendo}
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", justifyContent: "space-between" }}>
        {/* Campo de Busca */}
        <div style={{ position: "relative", flex: "1 1 320px", maxWidth: "500px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            id="search-stock-input"
            type="text"
            placeholder="Buscar por nome, código, princípio ativo, lote ou fornecedor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              fontSize: "14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              outline: "none",
              color: "#0f172a",
              backgroundColor: "#f8fafc"
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtros Dropdown */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {/* Categoria */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>Categoria:</span>
            <select
              id="filter-category-select"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                cursor: "pointer"
              }}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === "TODAS" ? "Todas as Categorias" : c}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>Status:</span>
            <select
              id="filter-status-select"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                cursor: "pointer"
              }}
            >
              <option value="TODOS">Todos os Status</option>
              <option value="NORMAL">Estoque Normal</option>
              <option value="BAIXO">Estoque Baixo</option>
              <option value="ESGOTADO">Esgotado</option>
              <option value="VENCENDO">Vencendo em 30d</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE ITENS */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                <th style={{ padding: "14px 16px" }}>Código</th>
                <th style={{ padding: "14px 16px" }}>Item / Produto</th>
                <th style={{ padding: "14px 16px" }}>Categoria</th>
                <th style={{ padding: "14px 16px", textAlign: "center" }}>Saldo em Estoque</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px" }}>Lote / Validade</th>
                <th style={{ padding: "14px 16px" }}>Custo Unit.</th>
                <th style={{ padding: "14px 16px" }}>Localização</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "48px 16px", textAlign: "center", color: "#64748b" }}>
                    <Package size={40} color="#cbd5e1" style={{ margin: "0 auto 12px auto", display: "block" }} />
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>Nenhum item encontrado</div>
                    <div style={{ fontSize: "13px" }}>Tente ajustar a busca ou os filtros de categoria/status.</div>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isEsgotado = item.quantidadeAtual <= 0;
                  const isBaixo = !isEsgotado && item.quantidadeMinima > 0 && item.quantidadeAtual <= item.quantidadeMinima;
                  
                  const now = new Date();
                  const thirtyDaysAhead = new Date();
                  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
                  const isVencendo = item.dataValidade && new Date(item.dataValidade) <= thirtyDaysAhead;

                  return (
                    <tr 
                      key={item.id} 
                      style={{ 
                        borderBottom: "1px solid #f1f5f9", 
                        transition: "background-color 0.15s ease",
                        backgroundColor: isEsgotado ? "#fff5f5" : isBaixo ? "#fffdf5" : "transparent"
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = isEsgotado ? "#fee2e2" : isBaixo ? "#fef3c7" : "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = isEsgotado ? "#fff5f5" : isBaixo ? "#fffdf5" : "transparent")}
                    >
                      {/* Código */}
                      <td style={{ padding: "14px 16px", fontFamily: "monospace", fontWeight: 600, color: "#475569" }}>
                        {item.codigo || `PRD-${String(item.id).padStart(3, "0")}`}
                      </td>

                      {/* Nome e Princípio Ativo */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>{item.nome}</div>
                        {item.principioAtivo && (
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            <span style={{ fontWeight: 500 }}>Ativo:</span> {item.principioAtivo}
                          </div>
                        )}
                        {item.registroMS && (
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                            MS: {item.registroMS}
                          </div>
                        )}
                      </td>

                      {/* Categoria */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 500,
                          backgroundColor: "#f1f5f9",
                          color: "#334155"
                        }}>
                          {item.categoria}
                        </span>
                      </td>

                      {/* Saldo / Quantidade */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ fontWeight: 700, fontSize: "15px", color: isEsgotado ? "#dc2626" : isBaixo ? "#d97706" : "#059669" }}>
                          {item.quantidadeAtual.toLocaleString("pt-BR")} <span style={{ fontSize: "12px", fontWeight: 500 }}>{item.unidade}</span>
                        </div>
                        {item.quantidadeMinima > 0 && (
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                            Mín: {item.quantidadeMinima} {item.unidade}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        {isEsgotado ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#fee2e2", color: "#b91c1c" }}>
                            <XCircle size={12} /> Esgotado
                          </span>
                        ) : isBaixo ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#fef3c7", color: "#b45309" }}>
                            <AlertTriangle size={12} /> Estoque Baixo
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#d1fae5", color: "#047857" }}>
                            <CheckCircle2 size={12} /> Normal
                          </span>
                        )}
                      </td>

                      {/* Lote / Validade */}
                      <td style={{ padding: "14px 16px" }}>
                        {item.lote && (
                          <div style={{ fontWeight: 500, color: "#334155" }}>
                            Lote: {item.lote}
                          </div>
                        )}
                        {item.dataValidade ? (
                          <div style={{ fontSize: "12px", color: isVencendo ? "#dc2626" : "#64748b", fontWeight: isVencendo ? 600 : 400, display: "flex", alignItems: "center", gap: "4px" }}>
                            {isVencendo && <AlertCircle size={12} />}
                            Val: {formatDate(item.dataValidade)}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                      </td>

                      {/* Preço de Custo */}
                      <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 500 }}>
                        {item.precoCusto ? formatCurrency(item.precoCusto) : "-"}
                      </td>

                      {/* Localização */}
                      <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "12px" }}>
                        {item.localizacao || "Sede"}
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {/* Entrada Rápida */}
                          <button
                            title="Lançar Entrada (+)"
                            onClick={() => handleOpenMovementModal(item, "ENTRADA")}
                            style={{
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#059669",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                              fontSize: "12px",
                              fontWeight: 600
                            }}
                          >
                            <ArrowDownLeft size={14} /> +
                          </button>

                          {/* Saída Rápida */}
                          <button
                            title="Lançar Saída (-)"
                            onClick={() => handleOpenMovementModal(item, "SAIDA")}
                            style={{
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#dc2626",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                              fontSize: "12px",
                              fontWeight: 600
                            }}
                          >
                            <ArrowUpRight size={14} /> -
                          </button>

                          {/* Editar */}
                          <Link
                            href={`/estoque/editar/${item.id}`}
                            title="Editar Item"
                            style={{
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#0284c7",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              textDecoration: "none"
                            }}
                          >
                            <Edit3 size={14} />
                          </Link>

                          {/* Ocultar */}
                          <button
                            title="Ocultar do Estoque"
                            onClick={() => handleToggleHide(item)}
                            style={{
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#64748b",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center"
                            }}
                          >
                            <EyeOff size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela com totais */}
        <div style={{ padding: "12px 20px", backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#64748b" }}>
          <div>
            Mostrando <strong>{filteredItems.length}</strong> de <strong>{items.length}</strong> itens cadastrados
          </div>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>
            Total Filtrado em Patrimônio: {formatCurrency(filteredItems.reduce((acc, it) => acc + ((it.precoCusto || 0) * (it.quantidadeAtual || 0)), 0))}
          </div>
        </div>
      </div>

      {/* MODAL DE MOVIMENTAÇÃO RÁPIDA (ENTRADA / SAÍDA / AJUSTE) */}
      {movementModalItem && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "480px", border: "1px solid #e2e8f0", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", overflow: "hidden" }}>
            {/* Header Modal */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ArrowUpDown size={20} color="var(--primary-color)" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Movimentação de Estoque</h3>
              </div>
              <button onClick={handleCloseMovementModal} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitMovement} style={{ padding: "20px" }}>
              {/* Info do Item */}
              <div style={{ backgroundColor: "#f1f5f9", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{movementModalItem.nome}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#475569", marginTop: "4px" }}>
                  <span>Código: <strong>{movementModalItem.codigo || "-"}</strong></span>
                  <span>Saldo Atual: <strong style={{ color: "#0284c7" }}>{movementModalItem.quantidadeAtual} {movementModalItem.unidade}</strong></span>
                </div>
              </div>

              {/* Seletor de Tipo */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Tipo de Movimentação:</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setMovementType("ENTRADA")}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: movementType === "ENTRADA" ? "2px solid #059669" : "1px solid #cbd5e1",
                      backgroundColor: movementType === "ENTRADA" ? "#ecfdf5" : "#ffffff",
                      color: movementType === "ENTRADA" ? "#065f46" : "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <ArrowDownLeft size={16} /> Entrada (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType("SAIDA")}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: movementType === "SAIDA" ? "2px solid #dc2626" : "1px solid #cbd5e1",
                      backgroundColor: movementType === "SAIDA" ? "#fef2f2" : "#ffffff",
                      color: movementType === "SAIDA" ? "#991b1b" : "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <ArrowUpRight size={16} /> Saída (-)
                  </button>
                </div>
              </div>

              {/* Quantidade */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Quantidade ({movementModalItem.unidade}): *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  required
                  placeholder={`Informe a quantidade em ${movementModalItem.unidade}...`}
                  value={movementQuantity}
                  onChange={e => setMovementQuantity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "15px",
                    fontWeight: 600,
                    outline: "none",
                    color: "#0f172a"
                  }}
                />
              </div>

              {/* Motivo */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Motivo / Justificativa:</label>
                <input
                  type="text"
                  placeholder="Ex: Compra NF 1234, Abastecimento de viatura, etc."
                  value={movementReason}
                  onChange={e => setMovementReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    color: "#0f172a"
                  }}
                />
              </div>

              {/* Origem / Destino */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Origem ou Destino:</label>
                <input
                  type="text"
                  placeholder="Ex: Fornecedor Bayer, Viatura 02, Almoxarifado Central"
                  value={movementDestiny}
                  onChange={e => setMovementDestiny(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    color: "#0f172a"
                  }}
                />
              </div>

              {feedbackMessage && (
                <div style={{ padding: "10px 14px", borderRadius: "6px", backgroundColor: "#ecfdf5", color: "#065f46", fontSize: "13px", marginBottom: "16px" }}>
                  {feedbackMessage.text}
                </div>
              )}

              {/* Botões */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleCloseMovementModal}
                  disabled={isSubmittingMovement}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#475569",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMovement}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: movementType === "ENTRADA" ? "#059669" : "#dc2626",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {isSubmittingMovement ? "Salvando..." : `Confirmar ${movementType === "ENTRADA" ? "Entrada" : "Saída"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
