"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Truck, 
  Users, 
  X, 
  AlertTriangle,
  Lock,
  Unlock,
  Trash2,
  Phone,
  Mail,
  FileText,
  Calendar,
  AlertOctagon,
  Ban,
  ShieldCheck
} from "lucide-react";
import { 
  createBlacklistEntry, 
  updateBlacklistEntry, 
  toggleBlacklistActive, 
  deleteBlacklistEntry,
  BlacklistFormData 
} from "@/app/actions/blacklist";

interface BlacklistEntry {
  id: number;
  nome: string;
  documento: string | null;
  tipo: string;
  motivo: string;
  telefone: string | null;
  email: string | null;
  bloquearAgendamento: boolean;
  bloquearVenda: boolean;
  cadastradoPor: string | null;
  ativo: boolean;
  dataDesbloqueio: Date | string | null;
  motivoDesbloqueio: string | null;
  observacoes: string | null;
  createdAt: Date | string;
}

export default function BlacklistClient({ initialList }: { initialList: BlacklistEntry[] }) {
  const [entries, setEntries] = useState<BlacklistEntry[]>(initialList);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BlacklistEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    documento: "",
    tipo: "Inadimplência",
    motivo: "",
    telefone: "",
    email: "",
    bloquearAgendamento: true,
    bloquearVenda: true,
    cadastradoPor: "Administrador",
    observacoes: ""
  });

  // Modal de Desbloqueio
  const [unblockingEntry, setUnblockingEntry] = useState<BlacklistEntry | null>(null);
  const [motivoDesbloqueioInput, setMotivoDesbloqueioInput] = useState("");

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const q = searchTerm.toLowerCase().trim();
      const matchText = 
        !q ||
        e.nome.toLowerCase().includes(q) ||
        (e.documento && e.documento.toLowerCase().includes(q)) ||
        (e.telefone && e.telefone.toLowerCase().includes(q)) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        e.motivo.toLowerCase().includes(q);

      const matchType = typeFilter === "TODOS" || e.tipo === typeFilter;
      const matchStatus = 
        statusFilter === "TODOS" ||
        (statusFilter === "ATIVOS" ? e.ativo : !e.ativo);

      return matchText && matchType && matchStatus;
    });
  }, [entries, searchTerm, typeFilter, statusFilter]);

  // KPIs
  const stats = useMemo(() => {
    let ativos = 0;
    let inadimplencia = 0;
    let fraudeRisco = 0;
    let desbloqueados = 0;

    entries.forEach(e => {
      if (e.ativo) {
        ativos++;
        if (e.tipo === "Inadimplência") inadimplencia++;
        else if (e.tipo === "Fraude" || e.tipo === "Risco de Segurança") fraudeRisco++;
      } else {
        desbloqueados++;
      }
    });

    return { total: entries.length, ativos, inadimplencia, fraudeRisco, desbloqueados };
  }, [entries]);

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setFormData({
      nome: "",
      documento: "",
      tipo: "Inadimplência",
      motivo: "",
      telefone: "",
      email: "",
      bloquearAgendamento: true,
      bloquearVenda: true,
      cadastradoPor: "Administrador",
      observacoes: ""
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: BlacklistEntry) => {
    setEditingEntry(e);
    setFormData({
      nome: e.nome,
      documento: e.documento || "",
      tipo: e.tipo || "Inadimplência",
      motivo: e.motivo,
      telefone: e.telefone || "",
      email: e.email || "",
      bloquearAgendamento: e.bloquearAgendamento,
      bloquearVenda: e.bloquearVenda,
      cadastradoPor: e.cadastradoPor || "Administrador",
      observacoes: e.observacoes || ""
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.nome.trim()) {
      setErrorMsg("O nome ou razão social é obrigatório.");
      return;
    }
    if (!formData.motivo.trim()) {
      setErrorMsg("O motivo do bloqueio é obrigatório.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: BlacklistFormData = {
        nome: formData.nome.trim(),
        documento: formData.documento.trim() || undefined,
        tipo: formData.tipo,
        motivo: formData.motivo.trim(),
        telefone: formData.telefone.trim() || undefined,
        email: formData.email.trim() || undefined,
        bloquearAgendamento: formData.bloquearAgendamento,
        bloquearVenda: formData.bloquearVenda,
        cadastradoPor: formData.cadastradoPor,
        observacoes: formData.observacoes.trim() || undefined
      };

      if (editingEntry) {
        const res = await updateBlacklistEntry(editingEntry.id, payload);
        if (res.success && res.entry) {
          setEntries(prev => prev.map(item => item.id === res.entry.id ? (res.entry as any) : item));
        }
      } else {
        const res = await createBlacklistEntry(payload);
        if (res.success && res.entry) {
          setEntries(prev => [res.entry as any, ...prev]);
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao salvar na blacklist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmToggleActive = async () => {
    if (!unblockingEntry) return;

    try {
      const res = await toggleBlacklistActive(unblockingEntry.id, motivoDesbloqueioInput);
      if (res.success) {
        setEntries(prev => prev.map(item => 
          item.id === unblockingEntry.id 
            ? { 
                ...item, 
                ativo: res.ativo, 
                dataDesbloqueio: res.ativo ? null : new Date(), 
                motivoDesbloqueio: res.ativo ? null : motivoDesbloqueioInput 
              } 
            : item
        ));
      }
      setUnblockingEntry(null);
      setMotivoDesbloqueioInput("");
    } catch (err: any) {
      alert(err.message || "Erro ao alterar status do bloqueio.");
    }
  };

  const handleDelete = async (e: BlacklistEntry) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente "${e.nome}" da Blacklist?`)) return;

    try {
      const res = await deleteBlacklistEntry(e.id);
      if (res.success) {
        setEntries(prev => prev.filter(item => item.id !== e.id));
      }
    } catch (err: any) {
      alert(err.message || "Erro ao excluir registro.");
    }
  };

  const getTypeBadge = (tipo: string) => {
    switch (tipo) {
      case "Inadimplência":
        return { bg: "#fef3c7", color: "#b45309", border: "#fde68a" };
      case "Fraude":
        return { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" };
      case "Risco de Segurança":
        return { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" };
      case "Conflito Jurídico":
        return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
      case "Endereço de Risco":
        return { bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" };
      default:
        return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
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
            <span>Administração</span>
            <span>/</span>
            <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Blacklist</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldAlert size={26} color="#dc2626" /> Blacklist & Restrições de Atendimento
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            Controle de clientes, fornecedores e pessoas bloqueadas por inadimplência, fraudes ou riscos operacionais.
          </p>
        </div>
      </div>

      {/* ABAS SUPERIORES DE ADMINISTRAÇÃO */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px", flexWrap: "wrap" }}>
        <Link
          href="/administracao/empresa"
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
          <Building2 size={17} /> Empresa & Filiais
        </Link>
        <Link
          href="/administracao/veiculos"
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
          <Truck size={17} /> Veículos da Frota
        </Link>
        <Link
          href="/administracao/blacklist"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#dc2626",
            textDecoration: "none",
            borderBottom: "2px solid #dc2626",
            marginBottom: "-2px"
          }}
        >
          <ShieldAlert size={17} /> Blacklist
        </Link>
        <Link
          href="/usuarios"
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
          <Users size={17} /> Equipe e Acessos
        </Link>
      </div>

      {/* CARDS DE RESUMO (KPIS) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#dc2626", fontSize: "13px", fontWeight: 500 }}>
            <span>Bloqueios Ativos</span>
            <Lock size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#dc2626", marginTop: "8px" }}>
            {stats.ativos}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Impedidos de atendimento</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#b45309", fontSize: "13px", fontWeight: 500 }}>
            <span>Inadimplência</span>
            <Ban size={18} color="#b45309" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#b45309", marginTop: "8px" }}>
            {stats.inadimplencia}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Débitos e cobranças pendentes</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#6d28d9", fontSize: "13px", fontWeight: 500 }}>
            <span>Fraude & Risco</span>
            <AlertOctagon size={18} color="#6d28d9" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#6d28d9", marginTop: "8px" }}>
            {stats.fraudeRisco}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Segurança da equipe / Golpe</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#047857", fontSize: "13px", fontWeight: 500 }}>
            <span>Desbloqueados</span>
            <Unlock size={18} color="#047857" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#047857", marginTop: "8px" }}>
            {stats.desbloqueados}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Situação regularizada</div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Buscar por nome, CPF/CNPJ, telefone ou motivo do bloqueio..."
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
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{
                padding: "9px 12px",
                fontSize: "14px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#334155"
              }}
            >
              <option value="TODOS">Todos os Motivos</option>
              <option value="Inadimplência">Inadimplência</option>
              <option value="Fraude">Fraude / Golpe</option>
              <option value="Risco de Segurança">Risco de Segurança</option>
              <option value="Conflito Jurídico">Conflito Jurídico</option>
              <option value="Endereço de Risco">Endereço de Risco</option>
              <option value="Outro">Outro</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
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
              <option value="ATIVOS">Bloqueios Ativos</option>
              <option value="DESBLOQUEADOS">Desbloqueados / Regularizados</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE BLACKLIST */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "12px 16px" }}>Nome / Razão Social</th>
                <th style={{ padding: "12px 16px" }}>Documento</th>
                <th style={{ padding: "12px 16px" }}>Tipo</th>
                <th style={{ padding: "12px 16px" }}>Motivo do Bloqueio</th>
                <th style={{ padding: "12px 16px" }}>Restrições</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <ShieldCheck size={32} color="#10b981" />
                      <div style={{ fontWeight: 600, color: "#334155" }}>Nenhum registro restrito na Blacklist</div>
                      <div style={{ fontSize: "13px", maxWidth: "480px", color: "#64748b" }}>
                        O bloqueio de clientes é realizado diretamente na tela de{" "}
                        <Link href="/clientes/novo" style={{ fontWeight: 600, color: "var(--primary-color)", textDecoration: "underline" }}>
                          Cadastro de Clientes
                        </Link>{" "}
                        ou nos detalhes do cliente para restringir agendamentos e vendas.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map(e => {
                  const badge = getTypeBadge(e.tipo);
                  return (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* Nome e Contatos */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{e.nome}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                          {e.telefone && <span>Tel: {e.telefone}</span>}
                          {e.email && <span>Email: {e.email}</span>}
                        </div>
                      </td>

                      {/* Documento */}
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#334155" }}>
                        {e.documento ? (
                          <strong style={{ letterSpacing: "0.5px" }}>{e.documento}</strong>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>Não informado</span>
                        )}
                      </td>

                      {/* Tipo */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {e.tipo}
                        </span>
                      </td>

                      {/* Motivo */}
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#334155", maxWidth: "280px" }}>
                        <div style={{ fontWeight: 500 }}>{e.motivo}</div>
                        {e.observacoes && (
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Obs: {e.observacoes}</div>
                        )}
                        {!e.ativo && e.motivoDesbloqueio && (
                          <div style={{ fontSize: "11px", color: "#047857", marginTop: "2px" }}>
                            Desbloqueio: {e.motivoDesbloqueio}
                          </div>
                        )}
                      </td>

                      {/* Restrições */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {e.bloquearAgendamento && (
                            <span style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: "#fee2e2",
                              color: "#b91c1c",
                              fontWeight: 600
                            }}>
                              O.S. Bloqueada
                            </span>
                          )}
                          {e.bloquearVenda && (
                            <span style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: "#fef3c7",
                              color: "#b45309",
                              fontWeight: 600
                            }}>
                              Venda Bloqueada
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor: e.ativo ? "#fee2e2" : "#ecfdf5",
                          color: e.ativo ? "#b91c1c" : "#047857",
                          border: `1px solid ${e.ativo ? "#fecaca" : "#a7f3d0"}`
                        }}>
                          {e.ativo ? <Lock size={11} /> : <Unlock size={11} />}
                          {e.ativo ? "Bloqueado" : "Desbloqueado"}
                        </span>
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            onClick={() => handleOpenEdit(e)}
                            title="Editar Registro"
                            style={{
                              padding: "6px 8px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              borderRadius: "6px",
                              color: "#334155",
                              cursor: "pointer"
                            }}
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            onClick={() => {
                              if (e.ativo) {
                                setUnblockingEntry(e);
                                setMotivoDesbloqueioInput("");
                              } else {
                                if (confirm(`Reativar bloqueio de "${e.nome}"?`)) {
                                  toggleBlacklistActive(e.id).then(res => {
                                    if (res.success) {
                                      setEntries(prev => prev.map(it => it.id === e.id ? { ...it, ativo: res.ativo } : it));
                                    }
                                  });
                                }
                              }
                            }}
                            title={e.ativo ? "Desbloquear" : "Reativar Bloqueio"}
                            style={{
                              padding: "6px 8px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              borderRadius: "6px",
                              color: e.ativo ? "#047857" : "#b91c1c",
                              cursor: "pointer"
                            }}
                          >
                            {e.ativo ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>

                          <button
                            onClick={() => handleDelete(e)}
                            title="Excluir Permanentemente"
                            style={{
                              padding: "6px 8px",
                              border: "1px solid #fee2e2",
                              background: "#ffffff",
                              borderRadius: "6px",
                              color: "#b91c1c",
                              cursor: "pointer"
                            }}
                          >
                            <Trash2 size={14} />
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

      {/* MODAL DE CADASTRO / EDIÇÃO */}
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
                  <ShieldAlert size={20} color="#dc2626" />
                  {editingEntry ? `Editar Registro: ${editingEntry.nome}` : "Adicionar à Blacklist"}
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                  Defina o motivo e as restrições operacionais aplicadas a esta pessoa ou empresa.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
              {errorMsg && (
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
                  <AlertTriangle size={16} /> {errorMsg}
                </div>
              )}

              {/* NOME E DOCUMENTO */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Nome ou Razão Social: <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva / Restaurante Exemplo ME"
                    value={formData.nome}
                    onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 500
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    CPF ou CNPJ:
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.documento}
                    onChange={e => setFormData(p => ({ ...p, documento: e.target.value }))}
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

              {/* TIPO E CONTATOS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Tipo de Ocorrência: <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={e => setFormData(p => ({ ...p, tipo: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: "#ffffff"
                    }}
                  >
                    <option value="Inadimplência">Inadimplência (Falta de Pagamento)</option>
                    <option value="Fraude">Fraude / Golpe</option>
                    <option value="Risco de Segurança">Risco de Segurança para Equipe</option>
                    <option value="Conflito Jurídico">Conflito Jurídico / Processo</option>
                    <option value="Endereço de Risco">Endereço de Risco / Inacessível</option>
                    <option value="Outro">Outro Motivo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Telefone:
                  </label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={e => setFormData(p => ({ ...p, telefone: e.target.value }))}
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
                    E-mail:
                  </label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
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

              {/* MOTIVO DETALHADO */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Motivo Detalhado do Bloqueio: <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva detalhadamente o ocorrido (ex: Ocorrência O.S. 238 não quitada após 3 cobranças, cliente agressivo com técnico aplicador...)"
                  value={formData.motivo}
                  onChange={e => setFormData(p => ({ ...p, motivo: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* RESTRIÇÕES DO BLOQUEIO */}
              <div style={{
                background: "#f8fafc",
                padding: "14px 16px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                marginBottom: "16px"
              }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>
                  Restrições Automáticas no Sistema:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.bloquearAgendamento}
                      onChange={e => setFormData(p => ({ ...p, bloquearAgendamento: e.target.checked }))}
                    />
                    <span><strong>Bloquear Agendamento:</strong> Impedir abertura de novas Ordens de Serviço (O.S.)</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.bloquearVenda}
                      onChange={e => setFormData(p => ({ ...p, bloquearVenda: e.target.checked }))}
                    />
                    <span><strong>Bloquear Vendas:</strong> Impedir emissão de novos contratos e propostas comerciais</span>
                  </label>
                </div>
              </div>

              {/* OBSERVAÇÕES */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Observações Internas Adicionais:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Liberar somente mediante autorização da gerência e pagamento antecipado à vista."
                  value={formData.observacoes}
                  onChange={e => setFormData(p => ({ ...p, observacoes: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px"
                  }}
                />
              </div>

              {/* BOTÕES */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <Lock size={16} />
                  {isSubmitting ? "Salvando..." : editingEntry ? "Salvar Alterações" : "Confirmar Bloqueio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE JUSTIFICATIVA DE DESBLOQUEIO */}
      {unblockingEntry && (
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
            maxWidth: "500px",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            padding: "24px"
          }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <Unlock size={20} color="#047857" /> Desbloquear "{unblockingEntry.nome}"
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
              Informe a justificativa ou acordo realizado para registrar no histórico da empresa.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Justificativa do Desbloqueio:
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Débito quitado integralmente via PIX comprovado pelo financeiro..."
                value={motivoDesbloqueioInput}
                onChange={e => setMotivoDesbloqueioInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "13px",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setUnblockingEntry(null)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  borderRadius: "8px",
                  color: "#475569",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleActive}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  backgroundColor: "#047857",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <CheckCircle2 size={16} /> Confirmar Desbloqueio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
