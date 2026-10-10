"use client";

import { useState, useMemo } from "react";
import { 
  Clock, 
  User, 
  Activity, 
  Database, 
  Search, 
  Globe, 
  Copy, 
  Check, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  AlertTriangle, 
  KeyRound, 
  Wrench, 
  Users, 
  DollarSign, 
  X, 
  ShieldAlert,
  ShieldCheck,
  Layers,
  Sparkles
} from "lucide-react";

type SystemLogItem = {
  id: number;
  userId: number | null;
  action: string;
  resource: string;
  details: string | null;
  ipAddress?: string | null;
  createdAt: string | Date;
  user?: {
    username: string | null;
    email: string;
    role: string;
  } | null;
};

export default function LogsClient({ initialLogs }: { initialLogs: SystemLogItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>("ALL");
  const [selectedResourceFilter, setSelectedResourceFilter] = useState<string>("ALL");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("ALL");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [activeLogModal, setActiveLogModal] = useState<SystemLogItem | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Copiar IP
  const handleCopyIp = (ip: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Formatação de data
  const formatDate = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${day}/${month}/${year} às ${time}`;
  };

  const formatRelativeTime = (dateVal: string | Date) => {
    const diffMs = Date.now() - new Date(dateVal).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Agora há pouco";
    if (diffMin < 60) return `Há ${diffMin} min`;
    if (diffHour < 24) return `Há ${diffHour}h`;
    if (diffDays === 1) return "Ontem";
    return `Há ${diffDays} dias`;
  };

  // Cores e ícones de ação
  const getActionBadge = (action: string) => {
    const act = (action || "").toUpperCase();
    if (act.includes("EXCLU") || act.includes("DELETE") || act.includes("REMOVER")) {
      return {
        bg: "rgba(239, 68, 68, 0.12)",
        color: "#ef4444",
        border: "rgba(239, 68, 68, 0.25)",
        icon: ShieldAlert
      };
    }
    if (act.includes("CRIOU") || act.includes("CREATE") || act.includes("NOVO") || act.includes("CADASTRO")) {
      return {
        bg: "rgba(34, 197, 94, 0.12)",
        color: "#22c55e",
        border: "rgba(34, 197, 94, 0.25)",
        icon: Sparkles
      };
    }
    if (act.includes("EDITOU") || act.includes("UPDATE") || act.includes("ALTERAR")) {
      return {
        bg: "rgba(245, 158, 11, 0.12)",
        color: "#f59e0b",
        border: "rgba(245, 158, 11, 0.25)",
        icon: Activity
      };
    }
    if (act.includes("LOGIN") || act.includes("LOGOUT") || act.includes("AUTH")) {
      return {
        bg: "rgba(2, 132, 199, 0.12)",
        color: "#0284c7",
        border: "rgba(2, 132, 199, 0.25)",
        icon: KeyRound
      };
    }
    return {
      bg: "rgba(139, 92, 246, 0.12)",
      color: "#8b5cf6",
      border: "rgba(139, 92, 246, 0.25)",
      icon: Activity
    };
  };

  // Ícone por recurso
  const getResourceIcon = (resource: string) => {
    const r = (resource || "").toLowerCase();
    if (r.includes("cliente")) return Users;
    if (r.includes("ocorrência") || r.includes("os") || r.includes("ordem")) return Wrench;
    if (r.includes("autenticação") || r.includes("auth") || r.includes("login")) return KeyRound;
    if (r.includes("financeiro") || r.includes("conta")) return DollarSign;
    return Database;
  };

  // Formatação do IP
  const formatIpDisplay = (ip?: string | null) => {
    if (!ip || ip.trim() === "") return { ip: "Não registrado", isLocal: false };
    const clean = ip.trim();
    if (clean === "::1" || clean === "127.0.0.1" || clean === "localhost") {
      return { ip: "127.0.0.1", isLocal: true };
    }
    return { ip: clean, isLocal: false };
  };

  // Lista única de recursos e usuários para os filtros
  const uniqueResources = useMemo(() => {
    const set = new Set<string>();
    initialLogs.forEach(l => { if (l.resource) set.add(l.resource); });
    return Array.from(set).sort();
  }, [initialLogs]);

  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    initialLogs.forEach(l => {
      const u = l.user?.username || l.user?.email;
      if (u) set.add(u);
    });
    return Array.from(set).sort();
  }, [initialLogs]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = initialLogs.length;
    let critical = 0;
    let updates = 0;
    let creations = 0;
    const ipSet = new Set<string>();
    const userSet = new Set<string>();

    initialLogs.forEach(l => {
      const act = (l.action || "").toUpperCase();
      if (act.includes("EXCLU") || act.includes("DELETE")) critical++;
      if (act.includes("EDITOU") || act.includes("UPDATE") || act.includes("ALTERAR")) updates++;
      if (act.includes("CRIOU") || act.includes("CREATE")) creations++;
      if (l.ipAddress) ipSet.add(l.ipAddress);
      if (l.user?.username || l.user?.email) userSet.add(l.user.username || l.user.email);
    });

    return { total, critical, updates, creations, uniqueIps: ipSet.size, uniqueUsers: userSet.size };
  }, [initialLogs]);

  // Filtragem dos logs
  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      // Busca geral
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const searchString = `${log.action} ${log.resource} ${log.details || ''} ${log.user?.username || ''} ${log.user?.email || ''} ${log.ipAddress || ''}`.toLowerCase();
        if (!searchString.includes(term)) return false;
      }

      // Filtro de Ação
      if (selectedActionFilter !== "ALL") {
        const act = (log.action || "").toUpperCase();
        if (selectedActionFilter === "DELETE" && !act.includes("EXCLU") && !act.includes("DELETE")) return false;
        if (selectedActionFilter === "CREATE" && !act.includes("CRIOU") && !act.includes("CREATE")) return false;
        if (selectedActionFilter === "UPDATE" && !act.includes("EDITOU") && !act.includes("UPDATE") && !act.includes("STATUS")) return false;
        if (selectedActionFilter === "AUTH" && !act.includes("LOGIN") && !act.includes("LOGOUT")) return false;
      }

      // Filtro de Recurso
      if (selectedResourceFilter !== "ALL" && log.resource !== selectedResourceFilter) {
        return false;
      }

      // Filtro de Usuário
      if (selectedUserFilter !== "ALL") {
        const userIdentifier = log.user?.username || log.user?.email;
        if (userIdentifier !== selectedUserFilter) return false;
      }

      return true;
    });
  }, [initialLogs, searchTerm, selectedActionFilter, selectedResourceFilter, selectedUserFilter]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = ["ID", "Data/Hora", "Usuario", "Email", "Cargo", "Acao", "Recurso", "IP", "Detalhes"];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.createdAt).toLocaleString('pt-BR'),
      l.user?.username || "Sistema",
      l.user?.email || "-",
      l.user?.role || "-",
      l.action,
      l.resource,
      l.ipAddress || "Local",
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `logs_sistema_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Cards de Métricas / KPI */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px' 
      }}>
        {/* Total de Logs */}
        <div style={{
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--primary-glow)',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total de Ações
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.total.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Criações */}
        <div style={{
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Cadastros / Criações
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#22c55e', marginTop: '2px' }}>
              {stats.creations.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Modificações */}
        <div style={{
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Edições / Updates
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
              {stats.updates.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Ações Críticas */}
        <div style={{
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Exclusões Críticas
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--danger)', marginTop: '2px' }}>
              {stats.critical.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Origens de IP */}
        <div style={{
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.12)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Globe size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              IPs Registrados
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>
              {stats.uniqueIps} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>origens</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div style={{
        background: 'var(--bg-color-soft)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        {/* Linha 1: Input de Pesquisa + Selects de Filtro + Botão Exportar */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, minWidth: '320px' }}>
            {/* Campo de Busca */}
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search 
                size={17} 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
              <input 
                type="text" 
                placeholder="Buscar por usuário, ação, detalhe ou endereço IP..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  height: '42px',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  paddingLeft: '42px',
                  paddingRight: searchTerm ? '38px' : '14px',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex'
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filtro por Recurso */}
            <select
              value={selectedResourceFilter}
              onChange={(e) => {
                setSelectedResourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                height: '42px',
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                padding: '0 14px',
                color: 'var(--text-main)',
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none',
                minWidth: '150px'
              }}
            >
              <option value="ALL">Todos os Recursos</option>
              {uniqueResources.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {/* Filtro por Usuário */}
            <select
              value={selectedUserFilter}
              onChange={(e) => {
                setSelectedUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                height: '42px',
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                padding: '0 14px',
                color: 'var(--text-main)',
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none',
                minWidth: '160px'
              }}
            >
              <option value="ALL">Todos os Usuários</option>
              {uniqueUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Botão Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            style={{
              height: '42px',
              padding: '0 16px',
              borderRadius: '10px',
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: filteredLogs.length === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              opacity: filteredLogs.length === 0 ? 0.5 : 1
            }}
            onMouseEnter={e => { if (filteredLogs.length > 0) e.currentTarget.style.background = 'var(--glass-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-color)'; }}
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>

        {/* Linha 2: Badges / Quick Filter por Ação */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>
            Filtrar Ação:
          </span>

          {[
            { id: "ALL", label: "Todas as Ações" },
            { id: "CREATE", label: "Criações" },
            { id: "UPDATE", label: "Edições" },
            { id: "DELETE", label: "Exclusões" },
            { id: "AUTH", label: "Sessões / Auth" }
          ].map(f => {
            const isSelected = selectedActionFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSelectedActionFilter(f.id);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)',
                  background: isSelected ? 'var(--primary-glow)' : 'transparent',
                  color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                {f.label}
              </button>
            );
          })}

          {(selectedActionFilter !== "ALL" || selectedResourceFilter !== "ALL" || selectedUserFilter !== "ALL" || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedActionFilter("ALL");
                setSelectedResourceFilter("ALL");
                setSelectedUserFilter("ALL");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                color: 'var(--danger)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={13} />
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Logs */}
      <div style={{
        background: 'var(--bg-color-soft)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ 
                borderBottom: '1px solid var(--glass-border)', 
                background: 'rgba(255,255,255,0.02)' 
              }}>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Data / Hora
                </th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Usuário
                </th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Endereço IP
                </th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Ação
                </th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Recurso
                </th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Detalhes
                </th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                  Ver
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={32} color="var(--text-muted)" />
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>Nenhum log encontrado</div>
                      <div style={{ fontSize: '13px' }}>Tente alterar os filtros de busca ou o período selecionado.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const BadgeIcon = badge.icon;
                  const ResourceIcon = getResourceIcon(log.resource);
                  const ipInfo = formatIpDisplay(log.ipAddress);
                  const isCopied = copiedIp === ipInfo.ip;

                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => setActiveLogModal(log)}
                      style={{ 
                        borderBottom: '1px solid var(--glass-border)', 
                        transition: 'background 0.15s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Data / Hora */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                            <Clock size={13} color="var(--text-secondary)" />
                            {formatDate(log.createdAt)}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '19px' }}>
                            {formatRelativeTime(log.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Usuário */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: log.user ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'var(--glass-border)', 
                            color: '#fff',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {log.user?.username ? log.user.username[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                              {log.user?.username || log.user?.email || 'Sistema'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {log.user?.role || 'Automação'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Endereço IP */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            background: 'var(--bg-color)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            color: 'var(--text-main)'
                          }}
                        >
                          {ipInfo.isLocal ? (
                            <ShieldCheck size={13} color="var(--primary-color)" />
                          ) : (
                            <Globe size={13} color="#06b6d4" />
                          )}
                          <span>{ipInfo.ip}</span>
                          
                          {ipInfo.ip !== "Não registrado" && (
                            <button
                              type="button"
                              onClick={(e) => handleCopyIp(ipInfo.ip, e)}
                              title="Copiar IP"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isCopied ? '#22c55e' : 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {isCopied ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Ação */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          fontWeight: 700, 
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          letterSpacing: '0.03em'
                        }}>
                          <BadgeIcon size={12} />
                          {log.action}
                        </span>
                      </td>

                      {/* Recurso */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600 }}>
                          <ResourceIcon size={14} color="var(--primary-color)" />
                          {log.resource}
                        </div>
                      </td>

                      {/* Detalhes (Snippet) */}
                      <td style={{ 
                        padding: '14px 18px', 
                        color: 'var(--text-secondary)', 
                        fontSize: '13px', 
                        maxWidth: '320px', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {log.details || "-"}
                      </td>

                      {/* Botão Ver */}
                      <td style={{ padding: '14px 18px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveLogModal(log);
                          }}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            padding: '6px 8px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = 'var(--primary-color)';
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                          }}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela: Paginação */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Exibindo <strong>{paginatedLogs.length}</strong> de <strong>{filteredLogs.length}</strong> logs</span>
            <span>•</span>
            <span>Itens por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                padding: '2px 8px',
                color: 'var(--text-main)',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ marginRight: '8px' }}>
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--text-main)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.4 : 1,
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--text-main)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.4 : 1,
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes Completo do Log */}
      {activeLogModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveLogModal(null);
          }}
        >
          <div style={{
            background: 'var(--bg-color-soft)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header do Modal */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'var(--primary-glow)',
                  color: 'var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Activity size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Detalhes da Auditoria #{activeLogModal.id}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {formatDate(activeLogModal.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveLogModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid de Informações */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Usuário Responsável
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  {activeLogModal.user?.username || activeLogModal.user?.email || 'Sistema Automático'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Cargo: {activeLogModal.user?.role || 'Automação'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Endereço IP de Origem
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-main)' }}>
                    {formatIpDisplay(activeLogModal.ipAddress).ip}
                  </span>
                  {activeLogModal.ipAddress && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyIp(formatIpDisplay(activeLogModal.ipAddress).ip, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedIp === formatIpDisplay(activeLogModal.ipAddress).ip ? '#22c55e' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex'
                      }}
                    >
                      {copiedIp === formatIpDisplay(activeLogModal.ipAddress).ip ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {formatIpDisplay(activeLogModal.ipAddress).isLocal ? 'Acesso Local / Loopback' : 'Rede Externa'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Ação Executada
                </span>
                <div style={{ marginTop: '4px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: getActionBadge(activeLogModal.action).bg,
                    color: getActionBadge(activeLogModal.action).color,
                    border: `1px solid ${getActionBadge(activeLogModal.action).border}`,
                    fontWeight: 700,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    padding: '3px 10px',
                    borderRadius: '20px'
                  }}>
                    {activeLogModal.action}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Módulo / Recurso
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                  {activeLogModal.resource}
                </div>
              </div>
            </div>

            {/* Texto Descritivo Completo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Descrição Detalhada do Evento:
              </span>
              <div style={{
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                padding: '14px 16px',
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--text-main)',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                {activeLogModal.details || "Nenhum detalhe adicional informado."}
              </div>
            </div>

            {/* Botão Fechar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveLogModal(null)}
                style={{
                  background: 'var(--primary-color)',
                  border: 'none',
                  color: '#fff',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px var(--primary-glow)'
                }}
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
