"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Building2, 
  ArrowUpDown, 
  FlaskConical, 
  DollarSign, 
  Boxes, 
  X,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { createStockItem, updateStockItem, toggleStockItemActive } from "@/app/actions/estoque";

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
  balances?: Array<{
    quantidade: number;
    warehouse: {
      nome: string;
    };
  }>;
}

export default function ItensClient({ initialItems }: { initialItems: StockItem[] }) {
  const [items, setItems] = useState<StockItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    categoria: "Químicos / Inseticidas",
    unidade: "L",
    estoqueMinimo: "5",
    precoCustoPadrao: "",
    precoVendaPadrao: "",
    fornecedorPadrao: "",
    principioAtivo: "",
    grupoQuimico: "",
    registroMS: "",
    observacoes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.categoria) set.add(i.categoria);
    });
    return ["TODAS", ...Array.from(set)];
  }, [items]);

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
      const matchStatus = statusFilter === "TODOS" || (statusFilter === "ATIVOS" ? it.ativo : !it.ativo);

      return matchText && matchCategory && matchStatus;
    });
  }, [items, searchTerm, selectedCategory, statusFilter]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      nome: "",
      codigo: "",
      categoria: "Químicos / Inseticidas",
      unidade: "L",
      estoqueMinimo: "5",
      precoCustoPadrao: "",
      precoVendaPadrao: "",
      fornecedorPadrao: "",
      principioAtivo: "",
      grupoQuimico: "",
      registroMS: "",
      observacoes: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (it: StockItem) => {
    setEditingItem(it);
    setFormData({
      nome: it.nome,
      codigo: it.codigo || "",
      categoria: it.categoria || "Químicos / Inseticidas",
      unidade: it.unidade || "UN",
      estoqueMinimo: String(it.estoqueMinimo || 0),
      precoCustoPadrao: it.precoCustoPadrao ? String(it.precoCustoPadrao) : "",
      precoVendaPadrao: it.precoVendaPadrao ? String(it.precoVendaPadrao) : "",
      fornecedorPadrao: it.fornecedorPadrao || "",
      principioAtivo: it.principioAtivo || "",
      grupoQuimico: it.grupoQuimico || "",
      registroMS: it.registroMS || "",
      observacoes: it.observacoes || ""
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      alert("O nome do item é obrigatório.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const res = await updateStockItem(editingItem.id, {
          nome: formData.nome.trim(),
          codigo: formData.codigo.trim() || undefined,
          categoria: formData.categoria,
          unidade: formData.unidade,
          estoqueMinimo: Number(formData.estoqueMinimo) || 0,
          precoCustoPadrao: formData.precoCustoPadrao ? Number(formData.precoCustoPadrao) : undefined,
          precoVendaPadrao: formData.precoVendaPadrao ? Number(formData.precoVendaPadrao) : undefined,
          fornecedorPadrao: formData.fornecedorPadrao.trim() || undefined,
          principioAtivo: formData.principioAtivo.trim() || undefined,
          grupoQuimico: formData.grupoQuimico.trim() || undefined,
          registroMS: formData.registroMS.trim() || undefined,
          observacoes: formData.observacoes.trim() || undefined
        });

        if (res.success && res.item) {
          setItems(prev => prev.map(i => i.id === res.item.id ? { ...i, ...res.item } : i));
        }
      } else {
        const res = await createStockItem({
          nome: formData.nome.trim(),
          codigo: formData.codigo.trim() || undefined,
          categoria: formData.categoria,
          unidade: formData.unidade,
          estoqueMinimo: Number(formData.estoqueMinimo) || 0,
          precoCustoPadrao: formData.precoCustoPadrao ? Number(formData.precoCustoPadrao) : undefined,
          precoVendaPadrao: formData.precoVendaPadrao ? Number(formData.precoVendaPadrao) : undefined,
          fornecedorPadrao: formData.fornecedorPadrao.trim() || undefined,
          principioAtivo: formData.principioAtivo.trim() || undefined,
          grupoQuimico: formData.grupoQuimico.trim() || undefined,
          registroMS: formData.registroMS.trim() || undefined,
          observacoes: formData.observacoes.trim() || undefined
        });

        if (res.success && res.item) {
          setItems(prev => [...prev, { ...res.item, balances: [] }]);
        }
      }
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (it: StockItem) => {
    const actionName = it.ativo ? "desativar" : "reativar";
    if (!confirm(`Deseja realmente ${actionName} o item "${it.nome}"?`)) return;

    try {
      const res = await toggleStockItemActive(it.id);
      if (res.success) {
        setItems(prev => prev.map(i => i.id === it.id ? { ...i, ativo: res.ativo } : i));
      }
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar status do item.");
    }
  };

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return "-";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 16px" }}>
      {/* CABEÇALHO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Início</Link>
            <span>/</span>
            <Link href="/estoque" style={{ color: "inherit", textDecoration: "none" }}>Estoque</Link>
            <span>/</span>
            <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Itens</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Package size={26} color="var(--primary-color)" /> Catálogo de Itens & Produtos
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            Listagem de itens pré-estabelecidos para seleção rápida nas movimentações (compras, vendas, OS e comodatos).
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          id="btn-cadastrar-novo-item-catalogo"
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
          <Plus size={18} /> Cadastrar Item
        </button>
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
            fontWeight: 500,
            color: "#64748b",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            marginBottom: "-2px"
          }}
        >
          <Layers size={17} /> Posição de Estoque
        </Link>
        <Link
          href="/estoque/itens"
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
      </div>

      {/* AVISO INFORMATIVO DE ARQUITETURA */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1", fontSize: "13px", marginBottom: "20px" }}>
        <Info size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Como funciona:</strong> Este cadastro define apenas as características dos produtos. O estoque não é alimentado aqui; a entrada de saldo é lançada exclusivamente pela aba de <strong>Movimentações</strong> (ex: Compras ou Ajustes de Inventário).
        </span>
      </div>

      {/* FILTROS E BUSCA */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ position: "relative", flex: "1 1 320px", maxWidth: "450px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Buscar por nome, código, princípio ativo ou fornecedor..."
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
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>Categoria:</span>
            <select
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

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
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
              <option value="TODOS">Todos</option>
              <option value="ATIVOS">Apenas Ativos</option>
              <option value="INATIVOS">Apenas Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE ITENS PRÉ-ESTABELECIDOS */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 16px" }}>Código</th>
                <th style={{ padding: "14px 16px" }}>Produto / Princípio Ativo</th>
                <th style={{ padding: "14px 16px" }}>Categoria</th>
                <th style={{ padding: "14px 16px", textAlign: "center" }}>Unidade</th>
                <th style={{ padding: "14px 16px" }}>Estoque Mínimo</th>
                <th style={{ padding: "14px 16px" }}>Preço Custo Padrão</th>
                <th style={{ padding: "14px 16px" }}>Preço Venda Padrão</th>
                <th style={{ padding: "14px 16px" }}>Fornecedor</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "48px 16px", textAlign: "center", color: "#64748b" }}>
                    <Package size={40} color="#cbd5e1" style={{ margin: "0 auto 12px auto", display: "block" }} />
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>Nenhum item encontrado</div>
                    <div style={{ fontSize: "13px" }}>Cadastre um novo item ou ajuste os filtros de pesquisa.</div>
                  </td>
                </tr>
              ) : (
                filteredItems.map(it => (
                  <tr 
                    key={it.id} 
                    style={{ 
                      borderBottom: "1px solid #f1f5f9", 
                      opacity: it.ativo ? 1 : 0.6,
                      backgroundColor: it.ativo ? "transparent" : "#f8fafc"
                    }}
                  >
                    <td style={{ padding: "14px 16px", fontFamily: "monospace", fontWeight: 600, color: "#475569" }}>
                      {it.codigo || `PRD-${String(it.id).padStart(3, "0")}`}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>{it.nome}</div>
                      {it.principioAtivo && (
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          <span style={{ fontWeight: 500 }}>Ativo:</span> {it.principioAtivo}
                        </div>
                      )}
                      {it.registroMS && (
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          MS / ANVISA: {it.registroMS}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 500, backgroundColor: "#f1f5f9", color: "#334155" }}>
                        {it.categoria}
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 600, color: "#0284c7" }}>
                      {it.unidade}
                    </td>

                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      {it.estoqueMinimo > 0 ? `${it.estoqueMinimo} ${it.unidade}` : "-"}
                    </td>

                    <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 500 }}>
                      {formatCurrency(it.precoCustoPadrao)}
                    </td>

                    <td style={{ padding: "14px 16px", color: "#059669", fontWeight: 500 }}>
                      {formatCurrency(it.precoVendaPadrao)}
                    </td>

                    <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "12px" }}>
                      {it.fornecedorPadrao || "-"}
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <button
                          onClick={() => handleOpenEditModal(it)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            color: "#0f172a",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12px"
                          }}
                        >
                          <Edit3 size={14} /> Editar
                        </button>

                        <button
                          onClick={() => handleToggleActive(it)}
                          title={it.ativo ? "Desativar Item" : "Reativar Item"}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            color: it.ativo ? "#dc2626" : "#059669",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          {it.ativo ? "Desativar" : "Reativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "12px 20px", backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", fontSize: "13px", color: "#64748b" }}>
          Total de <strong>{filteredItems.length}</strong> itens no catálogo
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO DE ITEM */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", border: "1px solid #e2e8f0", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Package size={20} color="var(--primary-color)" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  {editingItem ? "Editar Item do Catálogo" : "Cadastrar Item no Catálogo"}
                </h3>
              </div>
              <button onClick={handleCloseModal} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
              {/* Nome */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Nome do Item / Produto: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: K-Othrine 250 SC, Raticida Bloco, Porta Iscas..."
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", color: "#0f172a" }}
                />
              </div>

              {/* Código & Categoria */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Código / SKU:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: QUIM-001, EQP-01"
                    value={formData.codigo}
                    onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Categoria: *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a", cursor: "pointer" }}
                  >
                    <option value="Químicos / Inseticidas">Químicos / Inseticidas</option>
                    <option value="Raticidas">Raticidas</option>
                    <option value="Equipamentos / Máquinas">Equipamentos / Máquinas</option>
                    <option value="EPIs">EPIs</option>
                    <option value="Acessórios e Armadilhas">Acessórios e Armadilhas</option>
                    <option value="Produtos de Limpeza">Produtos de Limpeza</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              {/* Unidade & Estoque Mínimo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Unidade de Medida: *
                  </label>
                  <select
                    value={formData.unidade}
                    onChange={e => setFormData({ ...formData, unidade: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a", cursor: "pointer" }}
                  >
                    <option value="L">Litros (L)</option>
                    <option value="mL">Mililitros (mL)</option>
                    <option value="KG">Quilos (KG)</option>
                    <option value="G">Gramas (G)</option>
                    <option value="UN">Unidade (UN)</option>
                    <option value="CX">Caixa (CX)</option>
                    <option value="GL">Galão (GL)</option>
                    <option value="PCT">Pacote (PCT)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Estoque Mínimo (Alerta de Reposição):
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={formData.estoqueMinimo}
                    onChange={e => setFormData({ ...formData, estoqueMinimo: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a" }}
                  />
                </div>
              </div>

              {/* Preços Padrão */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Preço de Custo Padrão (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.precoCustoPadrao}
                    onChange={e => setFormData({ ...formData, precoCustoPadrao: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Preço de Venda / Comodato (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.precoVendaPadrao}
                    onChange={e => setFormData({ ...formData, precoVendaPadrao: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a" }}
                  />
                </div>
              </div>

              {/* Dados Químicos / Sanitários */}
              <div style={{ backgroundColor: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "8px" }}>
                  Dados Químicos & ANVISA (Opcional)
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#475569", marginBottom: "4px" }}>Princípio Ativo:</label>
                    <input
                      type="text"
                      placeholder="Ex: Deltametrina 2,5%"
                      value={formData.principioAtivo}
                      onChange={e => setFormData({ ...formData, principioAtivo: e.target.value })}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#fff" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#475569", marginBottom: "4px" }}>Grupo Químico:</label>
                    <input
                      type="text"
                      placeholder="Ex: Piretroide"
                      value={formData.grupoQuimico}
                      onChange={e => setFormData({ ...formData, grupoQuimico: e.target.value })}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#fff" }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "12px", color: "#475569", marginBottom: "4px" }}>Registro MS / ANVISA:</label>
                    <input
                      type="text"
                      placeholder="Ex: 3.2345.0012"
                      value={formData.registroMS}
                      onChange={e => setFormData({ ...formData, registroMS: e.target.value })}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#fff" }}
                    />
                  </div>
                </div>
              </div>

              {/* Fornecedor */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Fornecedor Padrão:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Bayer, Syngenta, 3M..."
                  value={formData.fornecedorPadrao}
                  onChange={e => setFormData({ ...formData, fornecedorPadrao: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a" }}
                />
              </div>

              {/* Observações */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Observações:
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruções gerais, especificações do fabricante..."
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  style={{ padding: "9px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: "9px 20px", borderRadius: "6px", border: "none", backgroundColor: "var(--primary-color)", color: "#ffffff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  {isSubmitting ? "Salvando..." : editingItem ? "Salvar Alterações" : "Cadastrar Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
