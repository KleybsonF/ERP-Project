"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Users, 
  Shield, 
  Briefcase, 
  Wrench, 
  User as UserIcon, 
  Plus, 
  Edit3, 
  Key, 
  Search, 
  AtSign, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  ShieldAlert, 
  ShieldCheck,
  Sparkles,
  Sliders,
  DollarSign,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import AdminNavTabs from "@/app/components/AdminNavTabs";
import PermissionsMatrix from "@/app/components/PermissionsMatrix";
import { 
  createUser, 
  updateUser, 
  updateUserPermissions, 
  toggleUserStatus, 
  hideUser, 
  restoreUser 
} from "@/app/actions/usuarios";
import { 
  ROLE_PRESETS, 
  AVAILABLE_ROLES, 
  parseUserPermissions, 
  ALL_PERMISSION_IDS 
} from "@/app/lib/permissions";
import { formatPhone } from "@/app/lib/utils";

interface UserItem {
  id: number;
  username: string | null;
  email: string;
  role: string;
  permissions?: string | null;
  ativo: boolean;
  employee?: {
    id: number;
    name: string;
    cargo: string | null;
    phone: string | null;
    status?: string | null;
  } | null;
}

export default function UsuariosClient({ initialUsers }: { initialUsers: UserItem[] }) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<"ativos" | "inativos">("ativos");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("TODOS");

  // Modais
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPermsOpen, setIsPermsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Formulário de Criação / Edição
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cargo: "",
    phone: "",
    login: "",
    password: "",
    role: "Operador",
    permissions: ROLE_PRESETS["Operador"] || []
  });
  const [showPassword, setShowPassword] = useState(false);

  // Exibir toast temporário
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  // KPIs
  const stats = useMemo(() => {
    const total = users.length;
    const ativos = users.filter((u) => u.ativo).length;
    const inativos = total - ativos;
    const admins = users.filter((u) => u.ativo && u.role === "Administrador").length;
    const gestores = users.filter((u) => u.ativo && (u.role === "Gestor" || u.role === "Financeiro")).length;
    const operacionais = users.filter((u) => u.ativo && (u.role === "Operador" || u.role === "Técnico")).length;

    return { total, ativos, inativos, admins, gestores, operacionais };
  }, [users]);

  // Lista filtrada
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchTab = activeTab === "ativos" ? u.ativo : !u.ativo;
      const matchRole = roleFilter === "TODOS" || u.role === roleFilter;

      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        (u.employee?.name && u.employee.name.toLowerCase().includes(q)) ||
        (u.employee?.cargo && u.employee.cargo.toLowerCase().includes(q)) ||
        (u.employee?.phone && u.employee.phone.includes(q));

      return matchTab && matchRole && matchSearch;
    });
  }, [users, activeTab, roleFilter, searchTerm]);

  // Abrir Modal de Criação
  const handleOpenCreate = () => {
    setFormError("");
    setFormData({
      name: "",
      email: "",
      cargo: "Técnico Operacional",
      phone: "",
      login: "",
      password: "",
      role: "Operador",
      permissions: [...(ROLE_PRESETS["Operador"] || [])]
    });
    setShowPassword(false);
    setIsCreateOpen(true);
  };

  // Submeter Criação
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      if (!formData.name.trim()) throw new Error("Informe o nome completo.");
      if (!formData.email.trim()) throw new Error("Informe o e-mail.");
      if (!formData.login.trim()) throw new Error("Informe o login de acesso.");
      if (!formData.password || formData.password.length < 4) {
        throw new Error("A senha deve conter no mínimo 4 caracteres.");
      }

      const res = await createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        cargo: formData.cargo.trim() || "Colaborador",
        numero: formData.phone.trim(),
        login: formData.login.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        permissions: formData.permissions
      });

      if (!res.success || !res.user) {
        throw new Error(res.error || "Erro ao criar usuário.");
      }

      setUsers((prev) => [res.user as any, ...prev]);
      setIsCreateOpen(false);
      showToast("Usuário cadastrado com sucesso com permissões configuradas!");
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir Modal de Edição
  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setFormError("");
    const userPerms = parseUserPermissions(user.role, user.permissions);

    setFormData({
      name: user.employee?.name || "",
      email: user.email || "",
      cargo: user.employee?.cargo || "",
      phone: formatPhone(user.employee?.phone || ""),
      login: user.username || "",
      password: "",
      role: user.role,
      permissions: userPerms
    });
    setShowPassword(false);
    setIsEditOpen(true);
  };

  // Submeter Edição
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await updateUser(selectedUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        cargo: formData.cargo.trim() || "Colaborador",
        numero: formData.phone.trim(),
        login: formData.login.trim().toLowerCase(),
        password: formData.password.trim() || undefined,
        role: formData.role,
        permissions: formData.permissions
      });

      if (!res.success || !res.user) {
        throw new Error(res.error || "Erro ao atualizar usuário.");
      }

      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? (res.user as any) : u)));
      setIsEditOpen(false);
      showToast("Dados do usuário e permissões atualizados com sucesso!");
    } catch (err: any) {
      setFormError(err.message || "Erro ao atualizar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir Modal Rápido de Permissões
  const handleOpenPerms = (user: UserItem) => {
    setSelectedUser(user);
    const userPerms = parseUserPermissions(user.role, user.permissions);
    setFormData((prev) => ({
      ...prev,
      role: user.role,
      permissions: userPerms
    }));
    setIsPermsOpen(true);
  };

  // Salvar Modal Rápido de Permissões
  const handleSavePerms = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      const res = await updateUserPermissions(selectedUser.id, formData.role, formData.permissions);
      if (!res.success || !res.user) {
        throw new Error(res.error || "Erro ao salvar permissões.");
      }

      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? (res.user as any) : u)));
      setIsPermsOpen(false);
      showToast(`Permissões de ${selectedUser.employee?.name || selectedUser.username} salvas com sucesso!`);
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar permissões.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alternar Status Ativo / Inativo
  const handleToggleStatus = async (user: UserItem) => {
    const action = user.ativo ? "desativar" : "reativar";
    if (!confirm(`Deseja realmente ${action} o usuário ${user.employee?.name || user.username}?`)) return;

    try {
      const res = await toggleUserStatus(user.id);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, ativo: res.ativo! } : u))
        );
        showToast(`Usuário ${res.ativo ? "reativado" : "desativado"} com sucesso.`);
      }
    } catch (err: any) {
      alert(err.message || "Erro ao alterar status.");
    }
  };

  const getRoleBadge = (role: string) => {
    const found = AVAILABLE_ROLES.find((r) => r.value === role);
    const color = found ? found.color : "#94a3b8";
    const bg = found ? found.badgeBg : "rgba(148, 163, 184, 0.15)";

    let Icon = UserIcon;
    if (role === "Administrador") Icon = Shield;
    else if (role === "Gestor") Icon = Briefcase;
    else if (role === "Financeiro") Icon = DollarSign;
    else if (role === "Operador" || role === "Técnico") Icon = Wrench;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "14px",
          fontSize: "12px",
          fontWeight: 600,
          background: bg,
          color: color,
          border: `1px solid ${color}35`
        }}
      >
        <Icon size={13} /> {role}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Toast de Notificação */}
      {successToast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "rgba(16, 185, 129, 0.95)",
            color: "#ffffff",
            padding: "14px 20px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            zIndex: 9999,
            fontWeight: 600,
            fontSize: "14px",
            backdropFilter: "blur(8px)"
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* CABEÇALHO PADRÃO DE ADMINISTRAÇÃO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Início</Link>
            <span>/</span>
            <span>Administração</span>
            <span>/</span>
            <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Equipe e Acessos</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Users size={26} color="var(--primary-color)" /> Equipe & Gestão de Acessos
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            Controle de usuários, cargos da empresa e matriz de permissões granulares por módulo.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          id="btn-cadastrar-usuario"
          className="btn btn-primary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 600,
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(99, 102, 241, 0.25)",
            cursor: "pointer"
          }}
        >
          <Plus size={18} /> Cadastrar Novo Usuário
        </button>
      </div>

      {/* ABAS SUPERIORES DE ADMINISTRAÇÃO PADRONIZADAS */}
      <AdminNavTabs />

      {/* CARDS DE RESUMO (KPIS) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>Total de Usuários</span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--text-main)" }}>{stats.total}</div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {stats.ativos} ativos no sistema
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>Administradores</span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
              <Shield size={16} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "#6366f1" }}>{stats.admins}</div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Acesso irrestrito a configurações
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>Gestão & Financeiro</span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <Briefcase size={16} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "#10b981" }}>{stats.gestores}</div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Controladoria & operações
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>Operacional & Campo</span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
              <Wrench size={16} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "#f59e0b" }}>{stats.operacionais}</div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Técnicos aplicadores e fiscais
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS & PESQUISA */}
      <div className="glass-panel" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          {/* Campo de Busca */}
          <div style={{ position: "relative", minWidth: "280px", flex: 1, maxWidth: "450px" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar por nome, @login, cargo, e-mail..."
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "38px", width: "100%", background: "rgba(0, 0, 0, 0.15)" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Filtro por Perfil */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field"
              style={{ width: "auto", minWidth: "160px", background: "rgba(0, 0, 0, 0.15)" }}
            >
              <option value="TODOS">Todos os Perfis</option>
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.value}</option>
              ))}
            </select>

            {/* Alternador Ativos / Inativos */}
            <div style={{ display: "flex", gap: "4px", background: "rgba(0, 0, 0, 0.2)", padding: "4px", borderRadius: "10px" }}>
              <button
                type="button"
                onClick={() => setActiveTab("ativos")}
                style={{
                  background: activeTab === "ativos" ? "rgba(99, 102, 241, 0.2)" : "transparent",
                  color: activeTab === "ativos" ? "#6366f1" : "var(--text-secondary)",
                  border: activeTab === "ativos" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                Ativos ({stats.ativos})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("inativos")}
                style={{
                  background: activeTab === "inativos" ? "rgba(239, 68, 68, 0.15)" : "transparent",
                  color: activeTab === "inativos" ? "#ef4444" : "var(--text-secondary)",
                  border: activeTab === "inativos" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid transparent",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                Inativos ({stats.inativos})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA PADRONIZADA DE USUÁRIOS */}
      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid var(--glass-border)" }}>
                <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>
                  Colaborador & Login
                </th>
                <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>
                  Cargo & Contato
                </th>
                <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>
                  Perfil Base
                </th>
                <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>
                  Permissões Granulares
                </th>
                <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>
                  Status
                </th>
                <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", textAlign: "right" }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-secondary)" }}>
                    <Users size={36} style={{ opacity: 0.3, marginBottom: "12px", display: "block", margin: "0 auto" }} />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "15px", color: "var(--text-main)" }}>Nenhum usuário encontrado</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>Tente ajustar a busca ou os filtros de perfil.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const perms = parseUserPermissions(u.role, u.permissions);
                  const isPresetExact = JSON.stringify(perms.sort()) === JSON.stringify((ROLE_PRESETS[u.role] || []).sort());
                  const displayName = u.employee?.name || u.username || "Colaborador";
                  const initials = displayName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0].toUpperCase())
                    .join("");

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: idx !== filteredUsers.length - 1 ? "1px solid var(--glass-border)" : "none",
                        transition: "background 0.15s ease",
                        opacity: u.ativo ? 1 : 0.65
                      }}
                      className="table-row-hover"
                    >
                      {/* Usuário + Avatar */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              background: u.role === "Administrador" ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.05)",
                              color: u.role === "Administrador" ? "#6366f1" : "var(--text-main)",
                              fontWeight: 700,
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid var(--glass-border)",
                              position: "relative",
                              flexShrink: 0
                            }}
                          >
                            {initials || "U"}
                            <span
                              style={{
                                position: "absolute",
                                bottom: "-2px",
                                right: "-2px",
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                background: u.ativo ? "#10b981" : "#ef4444",
                                border: "2px solid #0f172a"
                              }}
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
                              {displayName}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                              <AtSign size={12} />
                              <span>{u.username || "sem login"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cargo & Contato */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-main)" }}>
                          {u.employee?.cargo || "Função não especificada"}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }} title={u.email}>
                            <Mail size={12} /> {u.email}
                          </span>
                          {u.employee?.phone && (
                            <a
                              href={`https://wa.me/55${u.employee.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10b981", textDecoration: "none", fontWeight: 500 }}
                              title="Conversar no WhatsApp"
                            >
                              <Phone size={12} /> {u.employee.phone}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Perfil Base */}
                      <td style={{ padding: "16px 20px" }}>
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Permissões Granulares */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenPerms(u)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid var(--glass-border)",
                              color: "var(--text-main)",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                            title="Clique para gerenciar permissões individuais"
                          >
                            <Sliders size={13} color="var(--primary-color)" />
                            <span>{perms.length}/{ALL_PERMISSION_IDS.length} caixas</span>
                          </button>
                          {!isPresetExact && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "rgba(245, 158, 11, 0.15)",
                                color: "#f59e0b",
                                border: "1px solid rgba(245, 158, 11, 0.3)"
                              }}
                              title="Permissões customizadas manualmente"
                            >
                              Customizado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: u.ativo ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            color: u.ativo ? "#10b981" : "#ef4444",
                            border: u.ativo ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)"
                          }}
                        >
                          {u.ativo ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {u.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenPerms(u)}
                            className="btn-secondary"
                            style={{
                              padding: "7px 12px",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              borderRadius: "8px"
                            }}
                            title="Editar Matriz de Permissões"
                          >
                            <Key size={14} color="#6366f1" /> Permissões
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="btn-secondary"
                            style={{
                              padding: "7px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "8px",
                              color: "var(--warning)"
                            }}
                            title="Editar Cadastro do Usuário"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className="btn-secondary"
                            style={{
                              padding: "7px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "8px",
                              color: u.ativo ? "var(--danger)" : "var(--success)"
                            }}
                            title={u.ativo ? "Desativar Acesso" : "Reativar Acesso"}
                          >
                            {u.ativo ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
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

      {/* MODAL 1: CADASTRAR NOVO USUÁRIO */}
      {isCreateOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "850px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)"
            }}
          >
            {/* Header Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--glass-border)", paddingBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Plus size={22} color="var(--primary-color)" /> Cadastrar Novo Usuário
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                  Crie o perfil do colaborador e selecione as permissões granulares de acesso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", fontSize: "13px" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Seção 1: Dados do Colaborador */}
              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--glass-border)", borderRadius: "12px", padding: "18px" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <UserIcon size={16} color="var(--primary-color)" /> Dados Pessoais & Função
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div className="input-group">
                    <label>Nome Completo *</label>
                    <input
                      required
                      placeholder="Ex: Carlos Eduardo de Souza"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label>E-mail Corporativo *</label>
                    <input
                      required
                      type="email"
                      placeholder="carlos@empresa.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label>Cargo / Função na Empresa</label>
                    <input
                      placeholder="Ex: Técnico de Campo Sr"
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label>WhatsApp / Telefone</label>
                    <input
                      placeholder="(21) 98888-7777"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Credenciais de Acesso */}
              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--glass-border)", borderRadius: "12px", padding: "18px" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Lock size={16} color="#8b5cf6" /> Credenciais de Login
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div className="input-group">
                    <label>Login de Usuário (@username) *</label>
                    <div style={{ position: "relative" }}>
                      <AtSign size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        required
                        placeholder="csouza"
                        value={formData.login}
                        onChange={(e) => setFormData({ ...formData, login: e.target.value.toLowerCase().replace(/\s+/g, "") })}
                        className="input-field"
                        style={{ paddingLeft: "36px" }}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Senha Inicial de Acesso *</label>
                    <div style={{ position: "relative" }}>
                      <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 4 caracteres"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-field"
                        style={{ paddingLeft: "36px", paddingRight: "40px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 3: Seletor de Permissões Granulares */}
              <div>
                <h4 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} color="var(--primary-color)" /> Configuração de Permissões por Módulo
                </h4>
                <PermissionsMatrix
                  selectedRole={formData.role}
                  onRoleChange={(newRole) => setFormData((prev) => ({ ...prev, role: newRole }))}
                  selectedPermissions={formData.permissions}
                  onPermissionsChange={(newPerms) => setFormData((prev) => ({ ...prev, permissions: newPerms }))}
                  disabled={isSubmitting}
                />
              </div>

              {/* Ações do Modal */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--glass-border)", paddingTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px" }}
                >
                  {isSubmitting ? "Criando Usuário..." : <><CheckCircle2 size={16} /> Salvar e Conceder Acesso</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CADASTRO COMPLETO DO USUÁRIO */}
      {isEditOpen && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "850px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)"
            }}
          >
            {/* Header Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--glass-border)", paddingBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Edit3 size={22} color="var(--primary-color)" /> Editar Usuário: {selectedUser.employee?.name || selectedUser.username}
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                  Atualize os dados cadastrais, redefina a senha ou personalize as permissões.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", fontSize: "13px" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Seção 1: Dados Pessoais */}
              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--glass-border)", borderRadius: "12px", padding: "18px" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <UserIcon size={16} color="var(--primary-color)" /> Dados Pessoais & Função
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div className="input-group">
                    <label>Nome Completo *</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label>E-mail Corporativo *</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label>Cargo / Função na Empresa</label>
                    <input
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label>WhatsApp / Telefone</label>
                    <input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Login e Senha Opcional */}
              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--glass-border)", borderRadius: "12px", padding: "18px" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Lock size={16} color="#8b5cf6" /> Login e Redefinição de Senha
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div className="input-group">
                    <label>Login de Usuário (@username) *</label>
                    <div style={{ position: "relative" }}>
                      <AtSign size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        required
                        value={formData.login}
                        onChange={(e) => setFormData({ ...formData, login: e.target.value.toLowerCase().replace(/\s+/g, "") })}
                        className="input-field"
                        style={{ paddingLeft: "36px" }}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Nova Senha (Deixe em branco para não alterar)</label>
                    <div style={{ position: "relative" }}>
                      <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Preencha apenas para alterar"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-field"
                        style={{ paddingLeft: "36px", paddingRight: "40px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 3: Permissões Granulares */}
              <div>
                <h4 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} color="var(--primary-color)" /> Matriz de Permissões
                </h4>
                <PermissionsMatrix
                  selectedRole={formData.role}
                  onRoleChange={(newRole) => setFormData((prev) => ({ ...prev, role: newRole }))}
                  selectedPermissions={formData.permissions}
                  onPermissionsChange={(newPerms) => setFormData((prev) => ({ ...prev, permissions: newPerms }))}
                  disabled={isSubmitting}
                />
              </div>

              {/* Ações do Modal */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--glass-border)", paddingTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px" }}
                >
                  {isSubmitting ? "Salvando..." : <><CheckCircle2 size={16} /> Salvar Alterações</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GERENCIADOR RÁPIDO DE PERMISSÕES */}
      {isPermsOpen && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "850px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)"
            }}
          >
            {/* Header Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--glass-border)", paddingBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Key size={22} color="var(--primary-color)" /> Permissões de {selectedUser.employee?.name || selectedUser.username}
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                  Ao alterar o cargo base, as caixinhas correspondentes são marcadas automaticamente. Você pode marcar ou desmarcar livremente qualquer item.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPermsOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <PermissionsMatrix
              selectedRole={formData.role}
              onRoleChange={(newRole) => setFormData((prev) => ({ ...prev, role: newRole }))}
              selectedPermissions={formData.permissions}
              onPermissionsChange={(newPerms) => setFormData((prev) => ({ ...prev, permissions: newPerms }))}
              disabled={isSubmitting}
            />

            {/* Ações do Modal */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--glass-border)", paddingTop: "18px" }}>
              <button
                type="button"
                onClick={() => setIsPermsOpen(false)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePerms}
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px" }}
              >
                {isSubmitting ? "Gravando Permissões..." : <><CheckCircle2 size={16} /> Aplicar Permissões</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
