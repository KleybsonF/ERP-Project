"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Layers, 
  Plus, 
  Search, 
  ArrowUpDown, 
  Package, 
  Building2, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle2, 
  X, 
  Info,
  Wrench,
  Handshake,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Truck
} from "lucide-react";
import { createStockMovement } from "@/app/actions/estoque";

type MovementType = 
  | "COMPRA" 
  | "VENDA" 
  | "SAIDA_SERVICO" 
  | "COMODATO" 
  | "TRANSFERENCIA" 
  | "DEVOLUCAO" 
  | "AJUSTE" 
  | "DESCARTE";

interface StockBalance {
  id: number;
  stockItemId: number;
  warehouseId: number;
  quantidade: number;
  warehouse: {
    id: number;
    nome: string;
    tipo: string;
  };
}

interface StockItem {
  id: number;
  nome: string;
  codigo: string | null;
  categoria: string;
  principioAtivo: string | null;
  grupoQuimico: string | null;
  registroMS: string | null;
  unidade: string;
  estoqueMinimo: number;
  precoCustoPadrao: number | null;
  precoVendaPadrao: number | null;
  fornecedorPadrao: string | null;
  observacoes: string | null;
  ativo: boolean;
  balances: StockBalance[];
  saldoTotal: number;
  valorTotal: number;
}

interface Warehouse {
  id: number;
  nome: string;
  codigo: string | null;
  tipo: string;
  responsavel: string | null;
  ativo: boolean;
}

interface EstoqueOverviewProps {
  initialData: {
    items: StockItem[];
    warehouses: Warehouse[];
    recentMovements: any[];
    kpis: {
      totalItensCatalogo: number;
      totalArmazens: number;
      valorTotalPatrimonio: number;
      itensAbaixoMinimo: number;
      itensSemEstoque: number;
    };
  };
}

export default function EstoqueClient({ initialData }: EstoqueOverviewProps) {
  const [items, setItems] = useState<StockItem[]>(initialData.items);
  const [warehouses] = useState<Warehouse[]>(initialData.warehouses);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState("TODOS");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("TODOS");

  // Modal de Movimentação Rápida
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    stockItemId: items[0]?.id ? String(items[0].id) : "",
    tipo: "COMPRA" as MovementType,
    quantidade: "1",
    warehouseOriginId: "",
    warehouseDestinationId: warehouses[0]?.id ? String(warehouses[0].id) : "",
    valorUnitario: "",
    lote: "",
    dataValidade: "",
    clienteNome: "",
    fornecedorNome: "",
    documentoRef: "",
    motivo: "",
    responsavel: "Operador de Estoque"
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.categoria) set.add(i.categoria);
    });
    return ["TODAS", ...Array.from(set)];
  }, [items]);

  const handleOpenMovementModal = (presetItem?: StockItem, defaultTipo?: MovementType) => {
    setErrorMessage("");
    const targetItem = presetItem || items[0];
    const tipo = defaultTipo || "COMPRA";

    setFormData({
      stockItemId: targetItem ? String(targetItem.id) : "",
      tipo,
      quantidade: "1",
      warehouseOriginId: (tipo === "COMPRA" || tipo === "DEVOLUCAO") ? "" : (warehouses[0]?.id ? String(warehouses[0].id) : ""),
      warehouseDestinationId: (tipo === "COMPRA" || tipo === "DEVOLUCAO" || tipo === "TRANSFERENCIA") ? (warehouses[0]?.id ? String(warehouses[0].id) : "") : "",
      valorUnitario: targetItem?.precoCustoPadrao ? String(targetItem.precoCustoPadrao) : "",
      lote: "",
      dataValidade: "",
      clienteNome: "",
      fornecedorNome: targetItem?.fornecedorPadrao || "",
      documentoRef: "",
      motivo: "",
      responsavel: "Operador de Estoque"
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrorMessage("");
  };

  const handleItemSelectInModal = (itemIdStr: string) => {
    const it = items.find(i => i.id === Number(itemIdStr));
    setFormData(p => ({
      ...p,
      stockItemId: itemIdStr,
      valorUnitario: it?.precoCustoPadrao ? String(it.precoCustoPadrao) : p.valorUnitario,
      fornecedorNome: it?.fornecedorPadrao || p.fornecedorNome
    }));
  };

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const itemId = Number(formData.stockItemId);
    const qtd = Number(formData.quantidade);

    if (!itemId) {
      setErrorMessage("Selecione um produto.");
      return;
    }
    if (!qtd || qtd <= 0) {
      setErrorMessage("Informe uma quantidade válida.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createStockMovement({
        stockItemId: itemId,
        tipo: formData.tipo,
        quantidade: qtd,
        warehouseOriginId: formData.warehouseOriginId ? Number(formData.warehouseOriginId) : undefined,
        warehouseDestinationId: formData.warehouseDestinationId ? Number(formData.warehouseDestinationId) : undefined,
        valorUnitario: formData.valorUnitario ? Number(formData.valorUnitario) : undefined,
        lote: formData.lote.trim() || undefined,
        dataValidade: formData.dataValidade || null,
        clienteNome: formData.clienteNome.trim() || undefined,
        fornecedorNome: formData.fornecedorNome.trim() || undefined,
        documentoRef: formData.documentoRef.trim() || undefined,
        motivo: formData.motivo.trim() || undefined,
        responsavel: formData.responsavel.trim() || undefined
      });

      if (res.success) {
        // Atualiza saldos em tela localmente
        setItems(prev => prev.map(item => {
          if (item.id !== itemId) return item;

          let newBalances = [...item.balances];
          const destId = Number(formData.warehouseDestinationId);
          const origId = Number(formData.warehouseOriginId);

          if (formData.tipo === "COMPRA" || formData.tipo === "DEVOLUCAO") {
            const idx = newBalances.findIndex(b => b.warehouseId === destId);
            if (idx >= 0) {
              newBalances[idx] = { ...newBalances[idx], quantidade: newBalances[idx].quantidade + qtd };
            } else {
              const wh = warehouses.find(w => w.id === destId);
              if (wh) {
                newBalances.push({ id: Date.now(), stockItemId: item.id, warehouseId: destId, quantidade: qtd, warehouse: wh });
              }
            }
          } else if (["VENDA", "SAIDA_SERVICO", "COMODATO", "DESCARTE"].includes(formData.tipo)) {
            const idx = newBalances.findIndex(b => b.warehouseId === origId);
            if (idx >= 0) {
              newBalances[idx] = { ...newBalances[idx], quantidade: newBalances[idx].quantidade - qtd };
            }
          } else if (formData.tipo === "TRANSFERENCIA") {
            // origem
            const origIdx = newBalances.findIndex(b => b.warehouseId === origId);
            if (origIdx >= 0) {
              newBalances[origIdx] = { ...newBalances[origIdx], quantidade: newBalances[origIdx].quantidade - qtd };
            }
            // destino
            const destIdx = newBalances.findIndex(b => b.warehouseId === destId);
            if (destIdx >= 0) {
              newBalances[destIdx] = { ...newBalances[destIdx], quantidade: newBalances[destIdx].quantidade + qtd };
            } else {
              const wh = warehouses.find(w => w.id === destId);
              if (wh) {
                newBalances.push({ id: Date.now(), stockItemId: item.id, warehouseId: destId, quantidade: qtd, warehouse: wh });
              }
            }
          } else if (formData.tipo === "AJUSTE") {
            const targetId = destId || origId;
            const idx = newBalances.findIndex(b => b.warehouseId === targetId);
            if (idx >= 0) {
              newBalances[idx] = { ...newBalances[idx], quantidade: qtd };
            }
          }

          const novoSaldoTotal = newBalances.reduce((acc, b) => acc + b.quantidade, 0);
          const novoValorTotal = novoSaldoTotal * (item.precoCustoPadrao || 0);

          return {
            ...item,
            balances: newBalances,
            saldoTotal: novoSaldoTotal,
            valorTotal: novoValorTotal
          };
        }));

        handleCloseModal();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar movimentação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Itens filtrados
  const filteredItems = useMemo(() => {
    return items.filter(it => {
      const q = searchTerm.toLowerCase().trim();
      const matchText = 
        !q ||
        it.nome.toLowerCase().includes(q) ||
        (it.codigo && it.codigo.toLowerCase().includes(q)) ||
        (it.principioAtivo && it.principioAtivo.toLowerCase().includes(q)) ||
        (it.fornecedorPadrao && it.fornecedorPadrao.toLowerCase().includes(q));

      const matchCategory = selectedCategory === "TODAS" || it.categoria === selectedCategory;

      let matchWarehouse = true;
      if (selectedWarehouseFilter !== "TODOS") {
        const whId = Number(selectedWarehouseFilter);
        const bal = it.balances.find(b => b.warehouseId === whId);
        matchWarehouse = !!bal && bal.quantidade > 0;
      }

      let matchStatus = true;
      if (selectedStatusFilter === "ZERADO") {
        matchStatus = it.saldoTotal <= 0;
      } else if (selectedStatusFilter === "ABAIXO_MINIMO") {
        matchStatus = it.saldoTotal > 0 && it.estoqueMinimo > 0 && it.saldoTotal <= it.estoqueMinimo;
      } else if (selectedStatusFilter === "NORMAL") {
        matchStatus = it.saldoTotal > it.estoqueMinimo;
      }

      return matchText && matchCategory && matchWarehouse && matchStatus;
    });
  }, [items, searchTerm, selectedCategory, selectedWarehouseFilter, selectedStatusFilter]);

  // Recalcula KPIs dinamicamente
  const dynamicKpis = useMemo(() => {
    let valorTotal = 0;
    let abaixoMin = 0;
    let zerado = 0;

    items.forEach(it => {
      valorTotal += it.valorTotal > 0 ? it.valorTotal : 0;
      if (it.saldoTotal <= 0) {
        zerado++;
      } else if (it.estoqueMinimo > 0 && it.saldoTotal <= it.estoqueMinimo) {
        abaixoMin++;
      }
    });

    return {
      totalItens: items.length,
      totalArmazens: warehouses.length,
      valorTotal,
      abaixoMin,
      zerado
    };
  }, [items, warehouses]);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 16px" }}>
      {/* CABEÇALHO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Início</Link>
            <span>/</span>
            <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Estoque</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Layers size={26} color="var(--primary-color)" /> Posição Geral de Estoque
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            Visão consolidada de saldo por armazém, viaturas técnicas e controle de estoque mínimo.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => handleOpenMovementModal()}
            id="btn-lancar-movimentacao-topo"
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(2, 132, 199, 0.2)",
              cursor: "pointer"
            }}
          >
            <Plus size={18} /> Nova Movimentação
          </button>
        </div>
      </div>

      {/* ABAS SUPERIORES */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px", flexWrap: "wrap" }}>
        <Link
          href="/estoque"
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
          <Layers size={17} /> Posição de Estoque
        </Link>
        <Link
          href="/estoque/movimentacoes"
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
          <ArrowUpDown size={17} /> Movimentações
        </Link>
        <Link
          href="/estoque/itens"
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
          <Package size={17} /> Cadastro de Itens
        </Link>
        <Link
          href="/estoque/armazens"
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
          <Building2 size={17} /> Cadastro de Armazéns
        </Link>
      </div>

      {/* AVISO DIDÁTICO */}
      <div style={{
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "13px",
        color: "#1e40af"
      }}>
        <Info size={20} color="#2563eb" style={{ flexShrink: 0 }} />
        <div>
          <strong>Arquitetura Operacional do Estoque:</strong> O cadastro de itens não alimenta saldo. O saldo de cada produto é calculado estritamente pelas movimentações de compra, transferência entre almoxarifado/viaturas, saídas em O.S. e comodatos.
        </div>
      </div>

      {/* CARDS DE RESUMO (KPIS) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
            <span>Itens no Catálogo</span>
            <Package size={18} color="#64748b" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "8px" }}>
            {dynamicKpis.totalItens}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Produtos padronizados</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
            <span>Armazéns & Viaturas</span>
            <Building2 size={18} color="#64748b" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "8px" }}>
            {dynamicKpis.totalArmazens}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Locais de armazenagem ativos</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#047857", fontSize: "13px", fontWeight: 500 }}>
            <span>Valor em Estoque</span>
            <DollarSign size={18} color="#047857" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#047857", marginTop: "8px" }}>
            {dynamicKpis.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Custo total dos saldos físicos</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#b45309", fontSize: "13px", fontWeight: 500 }}>
            <span>Abaixo do Mínimo</span>
            <AlertTriangle size={18} color="#b45309" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#b45309", marginTop: "8px" }}>
            {dynamicKpis.abaixoMin}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Necessitam reposição urgente</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#b91c1c", fontSize: "13px", fontWeight: 500 }}>
            <span>Itens Zerados</span>
            <AlertTriangle size={18} color="#b91c1c" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#b91c1c", marginTop: "8px" }}>
            {dynamicKpis.zerado}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Sem nenhum saldo registrado</div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Buscar por produto, código, princípio ativo ou fornecedor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                fontSize: "14px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                padding: "9px 12px",
                fontSize: "14px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#334155"
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === "TODAS" ? "Todas as Categorias" : cat}
                </option>
              ))}
            </select>

            <select
              value={selectedWarehouseFilter}
              onChange={e => setSelectedWarehouseFilter(e.target.value)}
              style={{
                padding: "9px 12px",
                fontSize: "14px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#334155"
              }}
            >
              <option value="TODOS">Todos os Armazéns</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.nome} ({w.tipo})</option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              style={{
                padding: "9px 12px",
                fontSize: "14px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#334155"
              }}
            >
              <option value="TODOS">Todos os Status</option>
              <option value="NORMAL">Estoque Normal</option>
              <option value="ABAIXO_MINIMO">Abaixo do Mínimo</option>
              <option value="ZERADO">Zerados (Sem Saldo)</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE POSIÇÃO DE ESTOQUE */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "12px 16px" }}>Produto / Insumo</th>
                <th style={{ padding: "12px 16px" }}>Estoque Mínimo</th>
                <th style={{ padding: "12px 16px" }}>Saldo Total Geral</th>
                <th style={{ padding: "12px 16px" }}>Distribuição por Armazém / Viatura</th>
                <th style={{ padding: "12px 16px" }}>Valor Total</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <Package size={32} color="#cbd5e1" />
                      <div style={{ fontWeight: 600, color: "#334155" }}>Nenhum produto encontrado</div>
                      <div style={{ fontSize: "13px" }}>
                        Cadastre itens no catálogo ou lance movimentações de compra para alimentar os armazéns.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isZerado = item.saldoTotal <= 0;
                  const isAbaixoMin = !isZerado && item.estoqueMinimo > 0 && item.saldoTotal <= item.estoqueMinimo;

                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* Produto */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.nome}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                          {item.codigo && <span>Cód: <strong>{item.codigo}</strong></span>}
                          <span>Cat: {item.categoria}</span>
                          {item.principioAtivo && <span>({item.principioAtivo})</span>}
                        </div>
                      </td>

                      {/* Estoque Mínimo */}
                      <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                        {item.estoqueMinimo} {item.unidade}
                      </td>

                      {/* Saldo Total Geral */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: isZerado ? "#b91c1c" : isAbaixoMin ? "#b45309" : "#0f172a"
                        }}>
                          {item.saldoTotal} {item.unidade}
                        </span>
                      </td>

                      {/* Distribuição por Armazém */}
                      <td style={{ padding: "14px 16px" }}>
                        {item.balances && item.balances.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {item.balances.map(b => (
                              <span
                                key={b.warehouseId}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  background: b.quantidade > 0 ? "#f8fafc" : "#fef2f2",
                                  border: "1px solid #e2e8f0",
                                  color: b.quantidade > 0 ? "#334155" : "#b91c1c"
                                }}
                              >
                                {b.warehouse?.tipo === "Móvel" ? <Truck size={12} color="#64748b" /> : <Building2 size={12} color="#64748b" />}
                                <span>{b.warehouse?.nome}:</span>
                                <strong>{b.quantidade} {item.unidade}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                            Nenhum saldo alocado em armazéns
                          </span>
                        )}
                      </td>

                      {/* Valor Total */}
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#0f172a", fontWeight: 500 }}>
                        {item.valorTotal > 0 ? (
                          item.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        ) : (
                          <span style={{ color: "#94a3b8" }}>R$ 0,00</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        {isZerado ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: "#fef2f2",
                            color: "#b91c1c",
                            border: "1px solid #fecaca"
                          }}>
                            <AlertTriangle size={11} /> Sem Saldo
                          </span>
                        ) : isAbaixoMin ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: "#fffbeb",
                            color: "#b45309",
                            border: "1px solid #fde68a"
                          }}>
                            <AlertTriangle size={11} /> Abaixo Mínimo
                          </span>
                        ) : (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: "#ecfdf5",
                            color: "#047857",
                            border: "1px solid #a7f3d0"
                          }}>
                            <CheckCircle2 size={11} /> Normal
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            onClick={() => handleOpenMovementModal(item, "COMPRA")}
                            title="Lançar Compra / Entrada"
                            style={{
                              padding: "6px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#047857",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <ArrowDownLeft size={13} /> Entrada
                          </button>

                          <button
                            onClick={() => handleOpenMovementModal(item, "SAIDA_SERVICO")}
                            title="Lançar Saída p/ Serviço ou Comodato"
                            style={{
                              padding: "6px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#6d28d9",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Wrench size={13} /> Saída OS
                          </button>

                          <button
                            onClick={() => handleOpenMovementModal(item, "TRANSFERENCIA")}
                            title="Transferir entre armazéns ou viaturas"
                            style={{
                              padding: "6px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#4338ca",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <ArrowRightLeft size={13} />
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
      </div>

      {/* MODAL DE MOVIMENTAÇÃO RÁPIDA */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "680px",
            maxHeight: "92vh",
            overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 24px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ArrowUpDown size={20} color="var(--primary-color)" /> Movimentar Estoque
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                  Alimenta ou deduz saldo do produto nos armazéns e viaturas.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px"
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitMovement} style={{ padding: "20px 24px" }}>
              {errorMessage && (
                <div style={{
                  padding: "10px 14px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#b91c1c",
                  fontSize: "13px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <AlertTriangle size={16} /> {errorMessage}
                </div>
              )}

              {/* SELEÇÃO DO PRODUTO */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Produto Selecionado <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={formData.stockItemId}
                  onChange={e => handleItemSelectInModal(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#ffffff",
                    fontWeight: 500
                  }}
                >
                  {items.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.nome} {it.codigo ? `(${it.codigo})` : ""} - Cat: {it.categoria} [{it.unidade}]
                    </option>
                  ))}
                </select>
              </div>

              {/* TIPO DE MOVIMENTAÇÃO */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Tipo de Movimentação <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
                  {[
                    { id: "COMPRA", label: "Compra (Entrada)", icon: <ArrowDownLeft size={14} color="#047857" /> },
                    { id: "SAIDA_SERVICO", label: "Saída p/ O.S.", icon: <Wrench size={14} color="#6d28d9" /> },
                    { id: "COMODATO", label: "Comodato", icon: <Handshake size={14} color="#b45309" /> },
                    { id: "TRANSFERENCIA", label: "Transferência", icon: <ArrowRightLeft size={14} color="#4338ca" /> },
                    { id: "VENDA", label: "Venda Direta", icon: <ArrowUpRight size={14} color="#1d4ed8" /> },
                    { id: "AJUSTE", label: "Ajuste Físico", icon: <Layers size={14} color="#0e7490" /> },
                  ].map(tipoOpt => (
                    <button
                      key={tipoOpt.id}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, tipo: tipoOpt.id as MovementType }))}
                      style={{
                        padding: "8px 10px",
                        fontSize: "12px",
                        fontWeight: formData.tipo === tipoOpt.id ? 700 : 500,
                        border: formData.tipo === tipoOpt.id ? "2px solid var(--primary-color)" : "1px solid #cbd5e1",
                        background: formData.tipo === tipoOpt.id ? "rgba(2, 132, 199, 0.08)" : "#ffffff",
                        color: formData.tipo === tipoOpt.id ? "var(--primary-color)" : "#334155",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        justifyContent: "center"
                      }}
                    >
                      {tipoOpt.icon} {tipoOpt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ARMAZÉNS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                {["VENDA", "SAIDA_SERVICO", "COMODATO", "TRANSFERENCIA", "DESCARTE"].includes(formData.tipo) && (
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Armazém de Origem (Sai de) <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      value={formData.warehouseOriginId}
                      onChange={e => setFormData(p => ({ ...p, warehouseOriginId: e.target.value }))}
                      required
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        background: "#ffffff"
                      }}
                    >
                      <option value="">Selecione o armazém/viatura...</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.nome} ({w.tipo})</option>
                      ))}
                    </select>
                  </div>
                )}

                {["COMPRA", "DEVOLUCAO", "TRANSFERENCIA", "AJUSTE"].includes(formData.tipo) && (
                  <div style={{ gridColumn: (formData.tipo === "COMPRA" || formData.tipo === "DEVOLUCAO" || formData.tipo === "AJUSTE") ? "1 / -1" : "auto" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Armazém de Destino (Entra em) <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      value={formData.warehouseDestinationId}
                      onChange={e => setFormData(p => ({ ...p, warehouseDestinationId: e.target.value }))}
                      required
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        background: "#ffffff"
                      }}
                    >
                      <option value="">Selecione o armazém/viatura...</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.nome} ({w.tipo})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* QUANTIDADE E VALOR */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Quantidade <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.quantidade}
                    onChange={e => setFormData(p => ({ ...p, quantidade: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Valor Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valorUnitario}
                    onChange={e => setFormData(p => ({ ...p, valorUnitario: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>
              </div>

              {/* CLIENTE / FORNECEDOR / DOC */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {formData.tipo === "COMPRA" ? "Fornecedor" : "Cliente / Beneficiário"}
                  </label>
                  <input
                    type="text"
                    value={formData.tipo === "COMPRA" ? formData.fornecedorNome : formData.clienteNome}
                    onChange={e => {
                      const val = e.target.value;
                      if (formData.tipo === "COMPRA") setFormData(p => ({ ...p, fornecedorNome: val }));
                      else setFormData(p => ({ ...p, clienteNome: val }));
                    }}
                    placeholder={formData.tipo === "COMPRA" ? "Ex: Bayer" : "Ex: Restaurante Bom Sabor"}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Documento / O.S. Ref
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: OS-2026-089 ou NF-1234"
                    value={formData.documentoRef}
                    onChange={e => setFormData(p => ({ ...p, documentoRef: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>
              </div>

              {/* LOTE E VALIDADE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Lote
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: LOTE-8942A"
                    value={formData.lote}
                    onChange={e => setFormData(p => ({ ...p, lote: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Validade
                  </label>
                  <input
                    type="date"
                    value={formData.dataValidade}
                    onChange={e => setFormData(p => ({ ...p, dataValidade: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>
              </div>

              {/* BOTÕES */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  style={{
                    padding: "9px 16px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    borderRadius: "8px",
                    color: "#475569",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  <CheckCircle2 size={16} />
                  {isSubmitting ? "Gravando..." : "Confirmar Movimentação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
