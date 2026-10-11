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
  ChevronDown, 
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

export default function LogsClient({ 
  initialLogs, 
  periodSelectorSlot 
}: { 
  initialLogs: SystemLogItem[]; 
  periodSelectorSlot?: React.ReactNode; 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  // Normalização de logs para garantir que termos legados nunca apareçam
  const logs = useMemo(() => {
    return initialLogs.map(l => {
      let resource = l.resource;
      let details = l.details;
      if (
        resource === "Minhas O.S." || 
        resource === "Minhas OS" || 
        resource === "Minhas Ocorrências" ||
        resource === "Ordem de Serviço" || 
        resource === "Ordens de Serviço" || 
        resource === "OS" || 
        resource === "O.S."
      ) {
        resource = "Ocorrência";
      }
      if (details) {
        details = details
          .replace(/Status da O\.S\.\s*/gi, 'Status da Ocorrência ')
          .replace(/Status da OS\s*/gi, 'Status da Ocorrência ')
          .replace(/O\.S\.\s*#/gi, 'Ocorrência #')
          .replace(/OS\s*#/gi, 'Ocorrência #')
          .replace(/Ordem de Serviço\s*#/gi, 'Ocorrência #')
          .replace(/Ordem de Serviço/gi, 'Ocorrência')
          .replace(/Ordens de Serviço/gi, 'Ocorrências');
      }
      return { ...l, resource, details };
    });
  }, [initialLogs]);

  // Lista única de recursos e usuários para os filtros
  const uniqueResources = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.resource) set.add(l.resource); });
    return Array.from(set).sort();
  }, [logs]);

  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      const u = l.user?.username || l.user?.email;
      if (u) set.add(u);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtragem dos logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
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
  }, [logs, searchTerm, selectedActionFilter, selectedResourceFilter, selectedUserFilter]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Helper para extrair o Objeto (compacto) e os Detalhes da ação (completos e informativos)
  const parseLogTargetAndDetails = (resource: string, action: string, details: string | null) => {
    if (!details || !details.trim()) {
      return {
        target: resource || "Geral",
        details: "Ação registrada no sistema."
      };
    }

    const text = details.trim();
    const act = (action || "").toUpperCase();

    // 1. Caso: Cliente #11 (Bruno Gomes) ...
    const clientMatch = text.match(/^Cliente\s+#(\d+)(?:\s*\(([^)]+)\))?\s*(.*)$/i);
    if (clientMatch) {
      const id = clientMatch[1];
      const name = clientMatch[2] ? clientMatch[2].trim() : "";
      const rest = clientMatch[3] ? clientMatch[3].trim() : "";
      
      // Objeto compacto: "#11 • Nome" ou "#11"
      const target = name ? `#${id} • ${name}` : `#${id}`;

      // Informação detalhada e completa da edição / ação
      let richDetails = rest;
      if (!rest || rest.toLowerCase() === "atualizado." || rest.toLowerCase() === "atualizado") {
        richDetails = "Edição e atualização cadastral dos dados do cliente (informações gerais, contatos ou endereços).";
      } else if (rest.toLowerCase().startsWith("atualizado:")) {
        richDetails = "Alterações realizadas: " + rest.replace(/^atualizado:\s*/i, "");
      } else if (rest.toLowerCase().includes("cadastrado")) {
        richDetails = "Novo cliente inserido com sucesso na base de dados.";
      } else if (rest.toLowerCase().includes("excluído")) {
        richDetails = "Exclusão permanente do cliente e remoção de todos os vínculos associados.";
      }

      return { target, details: richDetails };
    }

    // 2. Caso: Ocorrência #1
    const osMatch = text.match(/^(?:Ocorrência|O\.?S\.?)\s*#(\d+)\s*(.*)$/i);
    if (osMatch) {
      const id = osMatch[1];
      const rest = osMatch[2] ? osMatch[2].trim() : "";
      const target = `#${id} (Ocorrência)`;

      let richDetails = rest;
      if (rest.toLowerCase().includes("agendada para")) {
        richDetails = "Abertura e programação da ocorrência: " + rest;
      } else if (rest.toLowerCase().includes("editada")) {
        richDetails = "Edição dos parâmetros da ocorrência • " + rest.replace(/^editada\s*/i, "");
      } else if (!rest) {
        richDetails = "Ocorrência atualizada no sistema.";
      }

      return { target, details: richDetails };
    }

    // 3. Caso: Status da Ocorrência #1 alterado para ...
    const statusMatch = text.match(/^Status da (?:Ocorrência|O\.?S\.?)\s*#(\d+)\s*(.*)$/i);
    if (statusMatch) {
      const id = statusMatch[1];
      const rest = statusMatch[2].trim();
      return {
        target: `#${id} (Ocorrência)`,
        details: `Atualização de fluxo operacional • ${rest}.`
      };
    }

    // 4. Caso: Observações do técnico atualizadas na Ocorrência #1
    const obsMatch = text.match(/^(.*?)\s+na (?:Ocorrência|O\.?S\.?)\s*#(\d+)$/i);
    if (obsMatch) {
      const id = obsMatch[2];
      const rest = obsMatch[1].trim();
      return {
        target: `#${id} (Ocorrência)`,
        details: `${rest} registradas na ocorrência.`
      };
    }

    // 5. Caso: Sessão iniciada / encerrada
    if (text.toLowerCase().startsWith("sessão") || text.toLowerCase().startsWith("sessao")) {
      const isLogin = text.toLowerCase().includes("iniciada") || act.includes("LOGIN");
      return {
        target: "Sessão",
        details: isLogin 
          ? "Autenticação bem-sucedida e início de sessão ativa no sistema."
          : "Encerramento de sessão e desconexão do usuário do sistema."
      };
    }

    // 6. Caso com chave: valor
    if (text.includes(":") && !text.startsWith("http")) {
      const parts = text.split(/:\s*(.+)/);
      if (parts[0].length <= 25) {
        return {
          target: parts[0].trim(),
          details: parts[1] ? parts[1].trim() : text
        };
      }
    }

    // 7. Genérico com hashtag #ID
    const hashMatch = text.match(/^([A-Za-zÀ-ÿ\.\s]+#\d+)\s*(.*)$/);
    if (hashMatch) {
      return {
        target: hashMatch[1].trim(),
        details: hashMatch[2].trim() || text
      };
    }

    return {
      target: resource || "Geral",
      details: text
    };
  };

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = ["Recurso", "Usuário", "Objeto", "Detalhes", "Ação", "Endereço IP", "Data/Hora", "ID"];
    const rows = filteredLogs.map(l => {
      const parsed = parseLogTargetAndDetails(l.resource, l.action, l.details);
      return [
        `"${(l.resource || '').replace(/"/g, '""')}"`,
        `"${(l.user?.username || l.user?.email || 'Sistema').replace(/"/g, '""')}"`,
        `"${parsed.target.replace(/"/g, '""')}"`,
        `"${parsed.details.replace(/"/g, '""')}"`,
        `"${(l.action || '').replace(/"/g, '""')}"`,
        `"${formatIpDisplay(l.ipAddress).ip.replace(/"/g, '""')}"`,
        `"${new Date(l.createdAt).toLocaleString('pt-BR')}"`,
        l.id
      ];
    });

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
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Controles do Topo: Card de Filtros à Esquerda e Controles à Direita */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Card de Filtros à Esquerda (Esticado para 560px para manter ações em uma linha) */}
        <div style={{
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          {/* 1. Campo de Busca */}
          <div style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              position: 'absolute',
              left: '12px',
              color: isSearchFocused ? 'var(--primary-color)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              transition: 'color 0.2s ease'
            }}>
              <Search size={15} />
            </div>

            <input 
              type="text" 
              placeholder="Buscar em tempo real por recurso, usuário, objeto, detalhes ou IP..." 
              value={searchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                height: '38px',
                background: 'var(--bg-color)',
                border: isSearchFocused ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)',
                boxShadow: isSearchFocused ? '0 0 0 3px var(--primary-glow)' : 'none',
                borderRadius: '10px',
                paddingLeft: '38px',
                paddingRight: searchTerm ? '34px' : '12px',
                color: 'var(--text-main)',
                fontSize: '12.5px',
                fontWeight: 500,
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                title="Limpar busca"
                style={{
                  position: 'absolute',
                  right: '8px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* 2. Dropdown de Recurso com cara de botão (Sem corte de texto) */}
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              height: '38px',
              borderRadius: '10px',
              background: 'var(--bg-color)',
              border: selectedResourceFilter !== 'ALL' ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = selectedResourceFilter !== 'ALL' ? 'var(--primary-color)' : 'var(--glass-border)';
            }}
          >
            <div style={{
              marginRight: '10px',
              color: selectedResourceFilter !== 'ALL' ? 'var(--primary-color)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <Layers size={15} />
            </div>

            <span style={{
              flex: 1,
              fontSize: '13px',
              fontWeight: 600,
              color: selectedResourceFilter !== 'ALL' ? 'var(--primary-color)' : 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none'
            }}>
              {selectedResourceFilter === 'ALL' ? 'Todos os Recursos' : selectedResourceFilter}
            </span>

            <div style={{
              marginLeft: '10px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <ChevronDown size={14} />
            </div>

            <select
              value={selectedResourceFilter}
              onChange={(e) => {
                setSelectedResourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Todos os Recursos</option>
              {uniqueResources.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* 3. Dropdown de Usuário com cara de botão (Sem corte de texto) */}
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              height: '38px',
              borderRadius: '10px',
              background: 'var(--bg-color)',
              border: selectedUserFilter !== 'ALL' ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = selectedUserFilter !== 'ALL' ? 'var(--primary-color)' : 'var(--glass-border)';
            }}
          >
            <div style={{
              marginRight: '10px',
              color: selectedUserFilter !== 'ALL' ? 'var(--primary-color)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <User size={15} />
            </div>

            <span style={{
              flex: 1,
              fontSize: '13px',
              fontWeight: 600,
              color: selectedUserFilter !== 'ALL' ? 'var(--primary-color)' : 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none'
            }}>
              {selectedUserFilter === 'ALL' ? 'Todos os Usuários' : selectedUserFilter}
            </span>

            <div style={{
              marginLeft: '10px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <ChevronDown size={14} />
            </div>

            <select
              value={selectedUserFilter}
              onChange={(e) => {
                setSelectedUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Todos os Usuários</option>
              {uniqueUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* 4. Pills de Ações (Em uma linha só) */}
          <div style={{ 
            display: 'flex', 
            gap: '6px', 
            alignItems: 'center', 
            marginTop: '2px',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}>
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
                    padding: '5px 11px',
                    borderRadius: '14px',
                    fontSize: '11.5px',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)',
                    background: isSelected ? 'var(--primary-glow)' : 'transparent',
                    color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
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
                  marginLeft: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <X size={12} />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Lado Direito: Linha 1 (Exportar CSV + Período) e Linha 2 (Itens por Página) exatamente como na imagem */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          gap: '10px',
          flex: '1 1 auto',
          minWidth: 'fit-content'
        }}>
          {/* Linha 1: Exportar CSV + Período */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            flexWrap: 'nowrap', 
            whiteSpace: 'nowrap' 
          }}>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredLogs.length === 0}
              style={{
                height: '38px',
                padding: '0 16px',
                borderRadius: '10px',
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-main)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: filteredLogs.length === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                opacity: filteredLogs.length === 0 ? 0.5 : 1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={e => { if (filteredLogs.length > 0) e.currentTarget.style.background = 'var(--glass-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-color)'; }}
            >
              <Download size={15} />
              Exportar CSV
            </button>

            {periodSelectorSlot}
          </div>

          {/* Linha 2: Cápsula Exibindo X de Y logs • Itens por página */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            padding: '0 14px',
            height: '38px',
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              Exibindo <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>{paginatedLogs.length}</strong> de <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>{filteredLogs.length}</strong> logs
            </span>
            <span style={{ color: 'var(--glass-border)' }}>•</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <span>Itens por página:</span>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <span style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: 'var(--primary-color)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  padding: '2px 20px 2px 8px',
                  height: '26px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  {itemsPerPage}
                </span>
                <ChevronDown size={12} color="var(--primary-color)" style={{ position: 'absolute', right: '5px', pointerEvents: 'none' }} />
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
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
                <th style={{ width: '130px', padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Recurso
                </th>
                <th style={{ width: '150px', padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Usuário
                </th>
                <th style={{ width: '150px', padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Objeto
                </th>
                <th style={{ width: 'auto', padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Detalhes
                </th>
                <th style={{ width: '110px', padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Ação
                </th>
                <th style={{ width: '135px', padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Endereço IP
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                  const parsed = parseLogTargetAndDetails(log.resource, log.action, log.details);

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
                      {/* 1. Recurso (compacto) */}
                      <td style={{ padding: '12px 16px', width: '130px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600 }}>
                            <ResourceIcon size={14} color="var(--primary-color)" />
                            <span>{log.resource}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }} title={formatDate(log.createdAt)}>
                            <Clock size={10} color="var(--text-secondary)" />
                            <span>{formatRelativeTime(log.createdAt)}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Usuário (compacto) */}
                      <td style={{ padding: '12px 16px', width: '150px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            background: log.user ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'var(--glass-border)', 
                            color: '#fff',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {log.user?.username ? log.user.username[0].toUpperCase() : 'S'}
                          </div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.user?.username || log.user?.email || 'Sistema'}
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {log.user?.role || 'Automação'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Objeto (compacto) */}
                      <td style={{ padding: '12px 16px', width: '150px' }}>
                        <span 
                          title={parsed.target}
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            maxWidth: '145px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          <Layers size={12} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{parsed.target}</span>
                        </span>
                      </td>

                      {/* 4. Detalhes (aba maior, informativa e completa) */}
                      <td style={{ 
                        padding: '12px 16px', 
                        color: 'var(--text-secondary)', 
                        fontSize: '12.5px', 
                        lineHeight: '1.45',
                        wordBreak: 'break-word',
                        minWidth: '280px'
                      }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 450 }}>
                          {parsed.details}
                        </span>
                      </td>

                      {/* 5. Ação (compacto) */}
                      <td style={{ padding: '12px 16px', width: '110px', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '5px', 
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          fontWeight: 700, 
                          fontSize: '10.5px',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '16px',
                          letterSpacing: '0.02em'
                        }}>
                          <BadgeIcon size={11} />
                          {log.action}
                        </span>
                      </td>

                      {/* 6. Endereço IP (compacto) */}
                      <td style={{ padding: '12px 16px', width: '135px', whiteSpace: 'nowrap' }}>
                        <div 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '5px',
                            background: 'var(--bg-color)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            padding: '3px 7px',
                            fontSize: '11.5px',
                            fontFamily: 'monospace',
                            color: 'var(--text-main)'
                          }}
                        >
                          {ipInfo.isLocal ? (
                            <ShieldCheck size={12} color="var(--primary-color)" />
                          ) : (
                            <Globe size={12} color="#06b6d4" />
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
                                padding: '1px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {isCopied ? <Check size={11} /> : <Copy size={11} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela: Apenas Paginação */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          <span style={{ marginRight: '6px' }}>
            Página <strong style={{ color: 'var(--text-main)' }}>{currentPage}</strong> de <strong style={{ color: 'var(--text-main)' }}>{totalPages}</strong>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                opacity: currentPage === 1 ? 0.35 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'all 0.15s'
              }}
              title="Página anterior"
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
                opacity: currentPage === totalPages ? 0.35 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'all 0.15s'
              }}
              title="Próxima página"
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
                  Recurso
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                  {activeLogModal.resource}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Usuário Responsável
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                  {activeLogModal.user?.username || activeLogModal.user?.email || 'Sistema Automático'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Cargo: {activeLogModal.user?.role || 'Automação'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Objeto Afetado
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                  {parseLogTargetAndDetails(activeLogModal.resource, activeLogModal.action, activeLogModal.details).target}
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

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Endereço IP de Origem
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
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
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                    ({formatIpDisplay(activeLogModal.ipAddress).isLocal ? 'Acesso Local / Loopback' : 'Rede Externa'})
                  </span>
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
                <div style={{ fontWeight: 500 }}>
                  {parseLogTargetAndDetails(activeLogModal.resource, activeLogModal.action, activeLogModal.details).details}
                </div>
                {activeLogModal.details && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Registro original do sistema: <code>{activeLogModal.details}</code>
                  </div>
                )}
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
