"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  DollarSign,
  Activity,
  PieChart,
  Shield,
  TrendingUp,
  Zap,
  BarChart3,
  Award,
  Layers,
  CalendarClock,
  AlertTriangle,
  Star,
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Users,
  Lock,
  Unlock,
  Settings2,
  ExternalLink,
  ShieldAlert,
  Building2,
  SlidersHorizontal
} from "lucide-react";
import {
  createDashboard,
  updateDashboard,
  deleteDashboard,
  duplicateDashboard,
  getDashboards
} from "@/app/actions/dashboards";
import {
  WIDGET_CATALOG,
  WidgetConfig,
  WidgetDefinition
} from "@/app/lib/dashboardCatalog";

interface UserItem {
  id: number;
  email: string;
  username: string | null;
  role: string;
  employee?: { name: string } | null;
}

interface DashboardItem {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  isDefault: boolean;
  isPublic: boolean;
  widgets: string;
  parsedWidgets: WidgetConfig[];
  allowedUsers: { id: number; email: string; username: string | null; role: string }[];
}

export default function DashboardsAdminClient({
  initialDashboards,
  users
}: {
  initialDashboards: DashboardItem[];
  users: UserItem[];
}) {
  const [dashboards, setDashboards] = useState<DashboardItem[]>(initialDashboards);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"info" | "widgets" | "permissions">("widgets");

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("LayoutDashboard");
  const [isDefault, setIsDefault] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetConfig[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [widgetFilterCategory, setWidgetFilterCategory] = useState<string>("TODAS");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reloadDashboards = async () => {
    const updated = await getDashboards();
    setDashboards(updated as any);
  };

  const getDashboardIcon = (iconName?: string | null) => {
    switch (iconName) {
      case "Briefcase":
        return <Briefcase size={20} />;
      case "DollarSign":
        return <DollarSign size={20} />;
      case "Activity":
        return <Activity size={20} />;
      case "PieChart":
        return <PieChart size={20} />;
      case "Shield":
        return <Shield size={20} />;
      case "TrendingUp":
        return <TrendingUp size={20} />;
      case "Zap":
        return <Zap size={20} />;
      case "BarChart3":
        return <BarChart3 size={20} />;
      case "Award":
        return <Award size={20} />;
      case "Layers":
        return <Layers size={20} />;
      case "CalendarClock":
        return <CalendarClock size={20} />;
      case "Truck":
        return <Truck size={20} />;
      case "Star":
        return <Star size={20} />;
      default:
        return <LayoutDashboard size={20} />;
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setIcon("LayoutDashboard");
    setIsDefault(false);
    setIsPublic(true);
    // Pre-populate with standard top widgets
    setSelectedWidgets([
      { id: `w-${Date.now()}-1`, widgetKey: "kpi_financial_pulse", title: "Pulso Financeiro Executivo", colSpan: 12, order: 1, visible: true },
      { id: `w-${Date.now()}-2`, widgetKey: "quick_actions_bar", title: "Ações Rápidas", colSpan: 12, order: 2, visible: true },
      { id: `w-${Date.now()}-3`, widgetKey: "chart_financial_cashflow", title: "Fluxo de Caixa Mensal", colSpan: 8, order: 3, visible: true },
      { id: `w-${Date.now()}-4`, widgetKey: "chart_os_by_status", title: "Distribuição de Ocorrências", colSpan: 4, order: 4, visible: true }
    ]);
    setSelectedUserIds(users.map(u => u.id));
    setActiveModalTab("widgets");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dash: DashboardItem) => {
    setEditingId(dash.id);
    setName(dash.name);
    setDescription(dash.description || "");
    setIcon(dash.icon || "LayoutDashboard");
    setIsDefault(dash.isDefault);
    setIsPublic(dash.isPublic);
    setSelectedWidgets(dash.parsedWidgets || []);
    setSelectedUserIds(dash.allowedUsers ? dash.allowedUsers.map(u => u.id) : []);
    setActiveModalTab("widgets");
    setIsModalOpen(true);
  };

  // Duplicate Dashboard
  const handleDuplicate = async (dash: DashboardItem) => {
    try {
      await duplicateDashboard(dash.id);
      await reloadDashboards();
    } catch (err: any) {
      alert("Erro ao duplicar dashboard: " + err.message);
    }
  };

  // Delete Dashboard
  const handleDelete = async (dash: DashboardItem) => {
    if (dash.isDefault) {
      alert("Este é o dashboard padrão do sistema e não pode ser excluído diretamente. Defina outro dashboard como padrão primeiro.");
      return;
    }
    if (confirm(`Tem certeza que deseja excluir o dashboard "${dash.name}"?`)) {
      try {
        await deleteDashboard(dash.id);
        await reloadDashboards();
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  // Set as Default
  const handleSetDefault = async (dash: DashboardItem) => {
    try {
      await updateDashboard(dash.id, { isDefault: true });
      await reloadDashboards();
    } catch (err: any) {
      alert("Erro ao definir como padrão: " + err.message);
    }
  };

  // Widget management inside form
  const handleAddWidget = (def: WidgetDefinition) => {
    const newWidget: WidgetConfig = {
      id: `w-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      widgetKey: def.key,
      title: def.title,
      colSpan: def.defaultColSpan,
      order: selectedWidgets.length + 1,
      visible: true
    };
    setSelectedWidgets(prev => [...prev, newWidget]);
  };

  const handleRemoveWidget = (id: string) => {
    setSelectedWidgets(prev => prev.filter(w => w.id !== id).map((w, idx) => ({ ...w, order: idx + 1 })));
  };

  const handleMoveWidget = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === selectedWidgets.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...selectedWidgets];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setSelectedWidgets(reordered.map((w, idx) => ({ ...w, order: idx + 1 })));
  };

  const handleUpdateWidgetColSpan = (id: string, colSpan: 12 | 8 | 6 | 4) => {
    setSelectedWidgets(prev => prev.map(w => w.id === id ? { ...w, colSpan } : w));
  };

  const handleUpdateWidgetTitle = (id: string, title: string) => {
    setSelectedWidgets(prev => prev.map(w => w.id === id ? { ...w, title } : w));
  };

  const handleToggleWidgetVisible = (id: string) => {
    setSelectedWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  // Submit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Por favor, informe o nome do dashboard.");
      setActiveModalTab("info");
      return;
    }
    if (selectedWidgets.length === 0) {
      alert("Por favor, adicione pelo menos um widget ao dashboard.");
      setActiveModalTab("widgets");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDashboard(editingId, {
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          isDefault,
          isPublic,
          widgets: selectedWidgets,
          userIds: selectedUserIds
        });
      } else {
        await createDashboard({
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          isDefault,
          isPublic,
          widgets: selectedWidgets,
          userIds: selectedUserIds
        });
      }

      await reloadDashboards();
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Erro ao salvar dashboard: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDashboards = dashboards.filter(d => {
    const s = searchTerm.toLowerCase();
    return d.name.toLowerCase().includes(s) || (d.description && d.description.toLowerCase().includes(s));
  });

  const availableCatalog = WIDGET_CATALOG.filter(def => {
    if (widgetFilterCategory === "TODAS") return true;
    return def.category === widgetFilterCategory;
  });

  const filteredUsers = users.filter(u => {
    const s = userSearchTerm.toLowerCase();
    const nameMatch = u.employee?.name ? u.employee.name.toLowerCase().includes(s) : false;
    const emailMatch = u.email.toLowerCase().includes(s);
    const userMatch = u.username ? u.username.toLowerCase().includes(s) : false;
    const roleMatch = u.role.toLowerCase().includes(s);
    return nameMatch || emailMatch || userMatch || roleMatch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header & Breadcrumb Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--glass-border)",
          paddingBottom: "16px",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link
            href="/administracao/dashboards"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#6366f1",
              border: "1px solid rgba(99, 102, 241, 0.35)",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.12)"
            }}
          >
            <LayoutDashboard size={16} /> Dashboards Personalizadas
          </Link>

          <Link
            href="/administracao/empresa"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              background: "var(--bg-color-soft, #ffffff)",
              color: "var(--text-secondary, #475569)",
              border: "1px solid var(--glass-border, #e2e8f0)",
              transition: "all 0.2s ease"
            }}
          >
            <Building2 size={16} /> Dados da Empresa
          </Link>

          <Link
            href="/administracao/veiculos"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              background: "var(--bg-color-soft, #ffffff)",
              color: "var(--text-secondary, #475569)",
              border: "1px solid var(--glass-border, #e2e8f0)",
              transition: "all 0.2s ease"
            }}
          >
            <Truck size={16} /> Veículos da Frota
          </Link>

          <Link
            href="/administracao/blacklist"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              background: "var(--bg-color-soft, #ffffff)",
              color: "var(--text-secondary, #475569)",
              border: "1px solid var(--glass-border, #e2e8f0)",
              transition: "all 0.2s ease"
            }}
          >
            <ShieldAlert size={16} /> Blacklist
          </Link>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 700,
            borderRadius: "10px",
            boxShadow: "0 4px 14px var(--primary-glow)"
          }}
        >
          <Plus size={18} /> Criar Novo Dashboard
        </button>
      </div>

      {/* Hero Explainer & Search */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)",
        border: "1px solid rgba(99, 102, 241, 0.2)",
        borderRadius: "16px",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
            <SlidersHorizontal size={20} color="#6366f1" /> Gerenciador de Dashboards & Widgets
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)", maxWidth: "700px" }}>
            Construa painéis sob medida com indicadores financeiros, gráficos interativos e rankings. Controle exatamente quais usuários ou equipes têm acesso a cada visão estratégica do sistema.
          </p>
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar painel por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sgp-input"
            style={{ paddingLeft: "34px", width: "100%", fontSize: "13px" }}
          />
        </div>
      </div>

      {/* Grid de Dashboards Cadastrados */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
        {filteredDashboards.map((dash) => {
          const widgetCount = dash.parsedWidgets ? dash.parsedWidgets.filter(w => w.visible).length : 0;

          return (
            <div
              key={dash.id}
              style={{
                background: "var(--bg-color-soft)",
                border: dash.isDefault ? "2px solid #6366f1" : "1px solid var(--glass-border)",
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                position: "relative",
                boxShadow: dash.isDefault ? "0 8px 24px rgba(99, 102, 241, 0.15)" : "0 2px 10px rgba(0,0,0,0.03)",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
            >
              {/* Header do Card */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "12px",
                    background: dash.isDefault ? "rgba(99, 102, 241, 0.15)" : "var(--primary-glow)",
                    color: dash.isDefault ? "#6366f1" : "var(--primary-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {getDashboardIcon(dash.icon)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-main)" }}>
                      {dash.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      {dash.isDefault && (
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: "rgba(99, 102, 241, 0.15)",
                          color: "#6366f1",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px"
                        }}>
                          <Check size={11} /> Padrão do Sistema
                        </span>
                      )}
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: dash.isPublic ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                        color: dash.isPublic ? "#10b981" : "#d97706",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px"
                      }}>
                        {dash.isPublic ? <Unlock size={11} /> : <Lock size={11} />}
                        {dash.isPublic ? "Acesso Público" : `${dash.allowedUsers?.length || 0} usuário(s)`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {dash.description && (
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {dash.description}
                </p>
              )}

              {/* Resumo de Widgets */}
              <div style={{
                background: "rgba(0,0,0,0.02)",
                border: "1px solid var(--glass-border)",
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                  <span>Widgets Ativos ({widgetCount})</span>
                  <span>Grid Responsivo</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {dash.parsedWidgets && dash.parsedWidgets.filter(w => w.visible).slice(0, 4).map((w, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "var(--bg-color-soft)",
                        border: "1px solid var(--glass-border)",
                        color: "var(--text-main)"
                      }}
                    >
                      {w.title}
                    </span>
                  ))}
                  {widgetCount > 4 && (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", alignSelf: "center" }}>
                      +{widgetCount - 4} mais
                    </span>
                  )}
                </div>
              </div>

              {/* Permissões: Avatares dos Usuários Autorizados */}
              {!dash.isPublic && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
                  <Users size={14} />
                  <span>
                    Permissão concedida a:{" "}
                    <strong style={{ color: "var(--text-main)" }}>
                      {dash.allowedUsers && dash.allowedUsers.length > 0
                        ? dash.allowedUsers.map(u => u.username || u.email.split("@")[0]).slice(0, 3).join(", ") + (dash.allowedUsers.length > 3 ? ` +${dash.allowedUsers.length - 3}` : "")
                        : "Nenhum usuário selecionado"}
                    </strong>
                  </span>
                </div>
              )}

              {/* Botões de Ação */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--glass-border)", paddingTop: "14px", marginTop: "auto", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Link
                    href={`/?dashboardId=${dash.id}`}
                    className="btn btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      borderRadius: "8px",
                      textDecoration: "none"
                    }}
                  >
                    <ExternalLink size={13} /> Abrir Painel
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(dash)}
                    className="btn btn-secondary"
                    title="Editar Layout e Permissões"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      borderRadius: "8px"
                    }}
                  >
                    <Edit2 size={13} /> Editar
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(dash)}
                    className="btn btn-secondary"
                    title="Duplicar este dashboard"
                    style={{ padding: "7px 9px", borderRadius: "8px" }}
                  >
                    <Copy size={13} />
                  </button>

                  {!dash.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(dash)}
                      className="btn btn-secondary"
                      title="Definir como Dashboard Padrão"
                      style={{ padding: "7px 9px", borderRadius: "8px", color: "#6366f1" }}
                    >
                      <Star size={13} />
                    </button>
                  )}

                  {!dash.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDelete(dash)}
                      className="btn btn-secondary"
                      title="Excluir Dashboard"
                      style={{ padding: "7px 9px", borderRadius: "8px", color: "#ef4444" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL COMPLETO DE CRIAÇÃO / EDIÇÃO DE DASHBOARD */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            padding: "20px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "20px",
              padding: "24px 28px",
              width: "100%",
              maxWidth: "1050px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid var(--glass-border)", paddingBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "#6366f1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {getDashboardIcon(icon)}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "var(--text-main)" }}>
                    {editingId ? `Editar: ${name || "Dashboard"}` : "Criar Novo Dashboard Personalizado"}
                  </h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                    Configure o layout, selecione os widgets, ajuste colunas e determine as permissões de acesso.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>
              {[
                { id: "widgets", label: "Widgets & Layout do Painel", icon: <Layers size={15} /> },
                { id: "info", label: "Dados Gerais & Ícone", icon: <Settings2 size={15} /> },
                { id: "permissions", label: `Permissões de Usuários (${isPublic ? "Público" : selectedUserIds.length})`, icon: <Users size={15} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveModalTab(tab.id as any)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    background: activeModalTab === tab.id ? "var(--primary-color)" : "transparent",
                    color: activeModalTab === tab.id ? "#ffffff" : "var(--text-secondary)",
                    transition: "all 0.15s"
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSubmitForm} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* TAB 1: SELEÇÃO E ORDENAÇÃO DE WIDGETS */}
              {activeModalTab === "widgets" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Seção 1: Widgets Configurados no Dashboard */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                        Widgets no Painel ({selectedWidgets.length}) • Arraste ou use as setas para ordenar
                      </h4>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Cada linha suporta até 12 colunas no grid responsivo
                      </span>
                    </div>

                    {selectedWidgets.length === 0 ? (
                      <div style={{
                        padding: "32px",
                        textAlign: "center",
                        border: "2px dashed var(--glass-border)",
                        borderRadius: "12px",
                        color: "var(--text-muted)"
                      }}>
                        Nenhum widget adicionado ainda. Escolha widgets do catálogo abaixo para compor este dashboard!
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {selectedWidgets.map((widget, index) => {
                          const catalogDef = WIDGET_CATALOG.find(c => c.key === widget.widgetKey);

                          return (
                            <div
                              key={widget.id}
                              style={{
                                background: "rgba(0,0,0,0.02)",
                                border: "1px solid var(--glass-border)",
                                borderRadius: "12px",
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "14px",
                                flexWrap: "wrap",
                                opacity: widget.visible ? 1 : 0.6
                              }}
                            >
                              {/* Lado Esquerdo: Posição, Ícone e Título */}
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 300px" }}>
                                <div style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "8px",
                                  background: "var(--primary-glow)",
                                  color: "var(--primary-color)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  fontSize: "12px",
                                  flexShrink: 0
                                }}>
                                  #{index + 1}
                                </div>

                                <div style={{ flex: "1" }}>
                                  <input
                                    type="text"
                                    value={widget.title}
                                    onChange={(e) => handleUpdateWidgetTitle(widget.id, e.target.value)}
                                    placeholder="Título do widget..."
                                    className="sgp-input"
                                    style={{ width: "100%", fontSize: "13px", fontWeight: 600, padding: "5px 10px" }}
                                  />
                                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                    Tipo: <strong>{catalogDef?.title || widget.widgetKey}</strong> ({catalogDef?.category})
                                  </div>
                                </div>
                              </div>

                              {/* Lado Direito: Seletor de Largura e Controles de Ordem/Visibilidade */}
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                {/* Seletor de Largura (colSpan) */}
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Largura:</span>
                                  <select
                                    value={widget.colSpan}
                                    onChange={(e) => handleUpdateWidgetColSpan(widget.id, Number(e.target.value) as any)}
                                    className="sgp-input"
                                    style={{ padding: "4px 8px", fontSize: "12px", minWidth: "130px" }}
                                  >
                                    <option value={12}>100% (12 Colunas)</option>
                                    <option value={8}>66% (8 Colunas)</option>
                                    <option value={6}>50% (6 Colunas)</option>
                                    <option value={4}>33% (4 Colunas)</option>
                                  </select>
                                </div>

                                {/* Botões Mover */}
                                <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveWidget(index, "up")}
                                    disabled={index === 0}
                                    className="btn btn-secondary"
                                    title="Mover para cima"
                                    style={{ padding: "5px 7px", borderRadius: "6px" }}
                                  >
                                    <ArrowUp size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveWidget(index, "down")}
                                    disabled={index === selectedWidgets.length - 1}
                                    className="btn btn-secondary"
                                    title="Mover para baixo"
                                    style={{ padding: "5px 7px", borderRadius: "6px" }}
                                  >
                                    <ArrowDown size={13} />
                                  </button>
                                </div>

                                {/* Visibilidade Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleWidgetVisible(widget.id)}
                                  className="btn btn-secondary"
                                  title={widget.visible ? "Ocultar Widget" : "Exibir Widget"}
                                  style={{ padding: "5px 8px", borderRadius: "6px", color: widget.visible ? "var(--text-main)" : "#ef4444" }}
                                >
                                  {widget.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                                </button>

                                {/* Remover */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWidget(widget.id)}
                                  className="btn btn-secondary"
                                  title="Remover Widget do Painel"
                                  style={{ padding: "5px 8px", borderRadius: "6px", color: "#ef4444" }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Seção 2: Catálogo de Widgets Disponíveis */}
                  <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>
                          Catálogo de Widgets Disponíveis
                        </h4>
                        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                          Clique em &quot;+ Adicionar&quot; para incluir o widget no seu dashboard.
                        </p>
                      </div>

                      {/* Filtros de Categoria do Catálogo */}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {["TODAS", "Finanças", "Operações", "Gráficos", "Tabelas & Agenda", "Estoque & Frota"].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setWidgetFilterCategory(cat)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "16px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              border: "none",
                              background: widgetFilterCategory === cat ? "var(--primary-color)" : "rgba(0,0,0,0.04)",
                              color: widgetFilterCategory === cat ? "#ffffff" : "var(--text-secondary)"
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                      {availableCatalog.map((def) => {
                        const isAlreadyAdded = selectedWidgets.some(w => w.widgetKey === def.key);

                        return (
                          <div
                            key={def.key}
                            style={{
                              background: "var(--bg-color-soft)",
                              border: "1px solid var(--glass-border)",
                              borderRadius: "12px",
                              padding: "14px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: "999px",
                                background: "var(--primary-glow)",
                                color: "var(--primary-color)"
                              }}>
                                {def.category}
                              </span>
                              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                Padrão: {def.defaultColSpan === 12 ? "100%" : def.defaultColSpan === 8 ? "66%" : def.defaultColSpan === 6 ? "50%" : "33%"}
                              </span>
                            </div>

                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>
                                {def.title}
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px", lineHeight: 1.4 }}>
                                {def.description}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddWidget(def)}
                              className="btn btn-secondary"
                              style={{
                                marginTop: "auto",
                                padding: "6px 12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                color: "var(--primary-color)"
                              }}
                            >
                              <Plus size={14} /> Adicionar ao Painel
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DADOS GERAIS DO DASHBOARD */}
              {activeModalTab === "info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                      Nome do Dashboard: <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Visão Executiva, Faturamento Master, Diretoria de Operações..."
                      className="sgp-input"
                      style={{ width: "100%", fontSize: "14px" }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                      Descrição Breve (Opcional):
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Painel executivo consolidado com foco em rentabilidade e faturamento."
                      className="sgp-input"
                      style={{ width: "100%", fontSize: "13px", resize: "vertical" }}
                    />
                  </div>

                  {/* Seletor de Ícone */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>
                      Ícone Representativo:
                    </label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        { name: "LayoutDashboard", label: "Painel" },
                        { name: "Briefcase", label: "Operações" },
                        { name: "DollarSign", label: "Finanças" },
                        { name: "Activity", label: "Atividade" },
                        { name: "PieChart", label: "Gráficos" },
                        { name: "Shield", label: "Segurança" },
                        { name: "TrendingUp", label: "Crescimento" },
                        { name: "Zap", label: "Agilidade" },
                        { name: "Truck", label: "Frota" },
                        { name: "Award", label: "Desempenho" },
                        { name: "Star", label: "Destaque" }
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setIcon(item.name)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: icon === item.name ? "2px solid #6366f1" : "1px solid var(--glass-border)",
                            background: icon === item.name ? "rgba(99, 102, 241, 0.15)" : "rgba(0,0,0,0.02)",
                            color: icon === item.name ? "#6366f1" : "var(--text-secondary)"
                          }}
                        >
                          {getDashboardIcon(item.name)}
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "10px" }}>
                    <div style={{
                      background: "rgba(0,0,0,0.02)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-main)" }}>
                          Dashboard Padrão
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Será carregado automaticamente como a tela inicial padrão.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#6366f1" }}
                      />
                    </div>

                    <div style={{
                      background: "rgba(0,0,0,0.02)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-main)" }}>
                          Acesso Público Total
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Todos os usuários do sistema poderão visualizar este dashboard.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#10b981" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PERMISSÕES DE ACESSO DOS USUÁRIOS */}
              {activeModalTab === "permissions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>
                        Usuários com Permissão para Visualizar este Dashboard
                      </h4>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                        {isPublic
                          ? "O dashboard está marcado como público, logo todos os usuários autenticados têm acesso."
                          : "Marque os usuários específicos que terão acesso a este painel."}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds(users.map(u => u.id))}
                        className="btn btn-secondary"
                        style={{ padding: "5px 10px", fontSize: "12px" }}
                      >
                        Marcar Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds([])}
                        className="btn btn-secondary"
                        style={{ padding: "5px 10px", fontSize: "12px" }}
                      >
                        Desmarcar Todos
                      </button>
                    </div>
                  </div>

                  {/* Busca de Usuário */}
                  <div style={{ position: "relative", maxWidth: "340px" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      placeholder="Filtrar por nome, email ou cargo..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="sgp-input"
                      style={{ paddingLeft: "30px", width: "100%", fontSize: "12px" }}
                    />
                  </div>

                  {/* Lista de Usuários */}
                  <div style={{
                    border: "1px solid var(--glass-border)",
                    borderRadius: "12px",
                    maxHeight: "320px",
                    overflowY: "auto"
                  }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                          <th style={{ padding: "10px 14px", width: "40px" }}>
                            <input
                              type="checkbox"
                              checked={users.length > 0 && selectedUserIds.length === users.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedUserIds(users.map(u => u.id));
                                else setSelectedUserIds([]);
                              }}
                              style={{ cursor: "pointer" }}
                            />
                          </th>
                          <th style={{ padding: "10px 14px" }}>Usuário / Colaborador</th>
                          <th style={{ padding: "10px 14px" }}>E-mail</th>
                          <th style={{ padding: "10px 14px" }}>Perfil / Cargo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => {
                          const isChecked = selectedUserIds.includes(u.id);

                          return (
                            <tr
                              key={u.id}
                              style={{
                                borderBottom: "1px solid var(--glass-border)",
                                background: isChecked ? "rgba(99, 102, 241, 0.04)" : "transparent",
                                cursor: "pointer"
                              }}
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                                } else {
                                  setSelectedUserIds(prev => [...prev, u.id]);
                                }
                              }}
                            >
                              <td style={{ padding: "10px 14px" }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUserIds(prev => [...prev, u.id]);
                                    } else {
                                      setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                                    }
                                  }}
                                  style={{ cursor: "pointer" }}
                                />
                              </td>
                              <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                                {u.employee?.name || u.username || u.email.split("@")[0]}
                              </td>
                              <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>
                                {u.email}
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "999px",
                                  background: u.role === "Administrador" ? "rgba(99, 102, 241, 0.15)" : "rgba(100, 116, 139, 0.15)",
                                  color: u.role === "Administrador" ? "#6366f1" : "var(--text-secondary)"
                                }}>
                                  {u.role}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--glass-border)", paddingTop: "16px", marginTop: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {selectedWidgets.length} widget(s) selecionados • Acesso: {isPublic ? "Público para todos" : `${selectedUserIds.length} usuário(s)`}
                </span>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="btn btn-secondary"
                    style={{ padding: "9px 18px", borderRadius: "8px" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{
                      padding: "9px 22px",
                      borderRadius: "8px",
                      fontWeight: 700,
                      boxShadow: "0 4px 14px var(--primary-glow)"
                    }}
                  >
                    {isSubmitting ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Dashboard"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
