"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Truck, 
  Plus, 
  Search, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  User, 
  Boxes, 
  Layers, 
  ArrowLeft,
  X,
  Package,
  ArrowUpDown
} from "lucide-react";
import { createWarehouse, updateWarehouse, toggleWarehouseActive } from "@/app/actions/estoque";

interface Warehouse {
  id: number;
  nome: string;
  codigo: string | null;
  tipo: string;
  responsavel: string | null;
  localizacao: string | null;
  descricao: string | null;
  ativo: boolean;
  balances?: Array<{
    id: number;
    quantidade: number;
    stockItem: {
      id: number;
      nome: string;
      unidade: string;
    };
  }>;
}

export default function ArmazensClient({ initialWarehouses }: { initialWarehouses: Warehouse[] }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("TODOS");

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    tipo: "Fixo",
    responsavel: "",
    localizacao: "",
    descricao: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredWarehouses = warehouses.filter(wh => {
    const q = searchTerm.toLowerCase().trim();
    const matchText = 
      !q || 
      wh.nome.toLowerCase().includes(q) || 
      (wh.codigo && wh.codigo.toLowerCase().includes(q)) ||
      (wh.responsavel && wh.responsavel.toLowerCase().includes(q)) ||
      (wh.localizacao && wh.localizacao.toLowerCase().includes(q));

    const matchType = typeFilter === "TODOS" || wh.tipo === typeFilter;

    return matchText && matchType;
  });

  const handleOpenCreateModal = () => {
    setEditingWarehouse(null);
    setFormData({
      nome: "",
      codigo: "",
      tipo: "Fixo",
      responsavel: "",
      localizacao: "",
      descricao: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setFormData({
      nome: wh.nome,
      codigo: wh.codigo || "",
      tipo: wh.tipo || "Fixo",
      responsavel: wh.responsavel || "",
      localizacao: wh.localizacao || "",
      descricao: wh.descricao || ""
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      alert("O nome do armazém é obrigatório.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingWarehouse) {
        const res = await updateWarehouse(editingWarehouse.id, {
          nome: formData.nome.trim(),
          codigo: formData.codigo.trim() || undefined,
          tipo: formData.tipo,
          responsavel: formData.responsavel.trim() || undefined,
          localizacao: formData.localizacao.trim() || undefined,
          descricao: formData.descricao.trim() || undefined,
        });
        if (res.success && res.warehouse) {
          setWarehouses(prev => prev.map(w => w.id === res.warehouse.id ? { ...w, ...res.warehouse } : w));
        }
      } else {
        const res = await createWarehouse({
          nome: formData.nome.trim(),
          codigo: formData.codigo.trim() || undefined,
          tipo: formData.tipo,
          responsavel: formData.responsavel.trim() || undefined,
          localizacao: formData.localizacao.trim() || undefined,
          descricao: formData.descricao.trim() || undefined,
        });
        if (res.success && res.warehouse) {
          setWarehouses(prev => [...prev, { ...res.warehouse, balances: [] }]);
        }
      }
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar armazém.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (wh: Warehouse) => {
    const actionName = wh.ativo ? "desativar" : "reativar";
    if (!confirm(`Deseja realmente ${actionName} o armazém "${wh.nome}"?`)) return;

    try {
      const res = await toggleWarehouseActive(wh.id);
      if (res.success) {
        setWarehouses(prev => prev.map(w => w.id === wh.id ? { ...w, ativo: res.ativo } : w));
      }
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar status do armazém.");
    }
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
            <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Armazéns</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Building2 size={26} color="var(--primary-color)" /> Cadastro de Armazéns & Depósitos
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            Cadastre almoxarifados fixos, depósitos e viaturas técnicas para armazenar e rastrear os produtos.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          id="btn-novo-armazem"
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
          <Plus size={18} /> Cadastrar Armazém
        </button>
      </div>

      {/* ABAS SUPERIORES DO MÓDULO DE ESTOQUE */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "24px", flexWrap: "wrap" }}>
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
            fontWeight: 600,
            color: "var(--primary-color)",
            textDecoration: "none",
            borderBottom: "2px solid var(--primary-color)",
            marginBottom: "-2px"
          }}
        >
          <Building2 size={17} /> Cadastro de Armazéns
        </Link>
      </div>

      {/* FILTROS E BUSCA */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "450px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Buscar por nome, código, responsável ou localização..."
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

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>Tipo de Local:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
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
            <option value="TODOS">Todos os Tipos</option>
            <option value="Fixo">Fixo (Almoxarifado / Depósito)</option>
            <option value="Móvel">Móvel (Viatura Técnica)</option>
            <option value="Quarentena">Quarentena / Descarte</option>
          </select>
        </div>
      </div>

      {/* GRID DE ARMAZÉNS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {filteredWarehouses.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", background: "#ffffff", padding: "48px 24px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", color: "#64748b" }}>
            <Building2 size={40} color="#cbd5e1" style={{ margin: "0 auto 12px auto", display: "block" }} />
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>Nenhum armazém encontrado</div>
            <div style={{ fontSize: "13px" }}>Cadastre seu primeiro local de estoque ou ajuste a pesquisa.</div>
          </div>
        ) : (
          filteredWarehouses.map(wh => {
            const isMovel = wh.tipo === "Móvel";
            const itemCount = wh.balances ? wh.balances.filter(b => b.quantidade > 0).length : 0;

            return (
              <div
                key={wh.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: wh.ativo ? 1 : 0.65
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        backgroundColor: isMovel ? "rgba(2, 132, 199, 0.1)" : "rgba(16, 185, 129, 0.1)",
                        color: isMovel ? "#0284c7" : "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {isMovel ? <Truck size={22} /> : <Building2 size={22} />}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>{wh.nome}</h3>
                        {wh.codigo && (
                          <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#64748b", fontWeight: 600 }}>
                            Código: {wh.codigo}
                          </span>
                        )}
                      </div>
                    </div>

                    <span style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor: isMovel ? "#e0f2fe" : "#ecfdf5",
                      color: isMovel ? "#0369a1" : "#065f46"
                    }}>
                      {wh.tipo}
                    </span>
                  </div>

                  {wh.descricao && (
                    <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>
                      {wh.descricao}
                    </p>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#475569", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                    {wh.responsavel && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <User size={14} color="#94a3b8" />
                        <span>Responsável: <strong>{wh.responsavel}</strong></span>
                      </div>
                    )}
                    {wh.localizacao && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MapPin size={14} color="#94a3b8" />
                        <span>Localização: {wh.localizacao}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Boxes size={14} color="#94a3b8" />
                      <span>Produtos armazenados: <strong style={{ color: itemCount > 0 ? "#059669" : "#64748b" }}>{itemCount} tipos de item</strong></span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    onClick={() => handleToggleActive(wh)}
                    style={{
                      border: "none",
                      background: "none",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: wh.ativo ? "#dc2626" : "#059669",
                      cursor: "pointer",
                      padding: "4px 0"
                    }}
                  >
                    {wh.ativo ? "Desativar Armazém" : "Reativar Armazém"}
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(wh)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                  >
                    <Edit3 size={14} /> Editar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO DE ARMAZÉM */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "480px", border: "1px solid #e2e8f0", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 size={20} color="var(--primary-color)" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  {editingWarehouse ? "Editar Armazém" : "Cadastrar Novo Armazém"}
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
                  Nome do Armazém / Local: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Almoxarifado Central, Viatura 01 - Fiorino, Depósito de Químicos..."
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", color: "#0f172a" }}
                />
              </div>

              {/* Código & Tipo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Código / Sigla:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: ALM-01, VT-01"
                    value={formData.codigo}
                    onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Tipo de Local: *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a", cursor: "pointer" }}
                  >
                    <option value="Fixo">Fixo (Almoxarifado / Depósito)</option>
                    <option value="Móvel">Móvel (Viatura Técnica)</option>
                    <option value="Quarentena">Quarentena / Descarte</option>
                  </select>
                </div>
              </div>

              {/* Responsável */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Responsável:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Técnico Aplicador 01, Gerente de Operações..."
                  value={formData.responsavel}
                  onChange={e => setFormData({ ...formData, responsavel: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a" }}
                />
              </div>

              {/* Localização / Endereço */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Localização / Referência:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sede - Sala 2, Fiat Fiorino Placa ABC-1234..."
                  value={formData.localizacao}
                  onChange={e => setFormData({ ...formData, localizacao: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a" }}
                />
              </div>

              {/* Descrição */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Descrição / Finalidade:
                </label>
                <textarea
                  rows={2}
                  placeholder="Notas sobre o que é armazenado neste local..."
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
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
                  {isSubmitting ? "Salvando..." : editingWarehouse ? "Salvar Alterações" : "Cadastrar Armazém"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
