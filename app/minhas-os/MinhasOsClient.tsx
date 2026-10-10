"use client";
import { 
  Calendar, 
  MapPin, 
  Wrench, 
  CalendarDays, 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Activity, 
  Search, 
  Navigation, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  X 
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function MinhasOsClient({ data }: { data: any }) {
  const { orders } = data;
  
  const [view, setView] = useState<"dashboard" | "agenda">("dashboard");
  const [timeFilter, setTimeFilter] = useState("mes");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatScheduleHeader = (dateStr: any) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${days[d.getUTCDay()]}, ${d.getUTCDate()} de ${months[d.getUTCMonth()]}`;
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const isDateToday = (dateStr: any) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const normalized = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return normalized.getTime() === today.getTime();
  };

  const timeFilteredOrders = orders.filter((os: any) => {
    if (timeFilter === "todas") return true;
    const osDate = new Date(os.scheduled_date);
    const normalizedOsDate = new Date(osDate.getUTCFullYear(), osDate.getUTCMonth(), osDate.getUTCDate());
    
    if (timeFilter === "hoje") return normalizedOsDate.getTime() === today.getTime();
    if (timeFilter === "semana") return normalizedOsDate >= startOfWeek && normalizedOsDate <= endOfWeek;
    if (timeFilter === "mes") return normalizedOsDate >= startOfMonth && normalizedOsDate <= endOfMonth;
    return true;
  });

  const searchedOrders = timeFilteredOrders.filter((os: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const osId = String(os.id);
    const custName = (os.customer?.name || "").toLowerCase();
    const serviceName = (os.serviceType?.name || "").toLowerCase();
    const street = (os.location?.street || "").toLowerCase();
    const neighborhood = (os.location?.neighborhood || "").toLowerCase();
    const city = (os.location?.city || "").toLowerCase();
    return (
      osId.includes(term) || 
      custName.includes(term) || 
      serviceName.includes(term) || 
      street.includes(term) || 
      neighborhood.includes(term) || 
      city.includes(term)
    );
  });

  const countAgendada = timeFilteredOrders.filter((os: any) => os.status === "Agendada").length;
  const countExecucao = timeFilteredOrders.filter((os: any) => os.status === "Em execução").length;
  const countConcluida = timeFilteredOrders.filter((os: any) => os.status === "Concluída").length;
  const countTodos = timeFilteredOrders.length;

  const finalOrders = searchedOrders.filter((os: any) => {
    if (statusFilter === "todos") return true;
    if (statusFilter === "Outros") return ["Adiada", "Cancelada"].includes(os.status);
    return os.status === statusFilter;
  }).sort((a: any, b: any) => {
    const dateA = new Date(a.scheduled_date).getTime();
    const dateB = new Date(b.scheduled_date).getTime();
    if (dateA !== dateB) {
      return dateA - dateB; 
    }
    const timeA = a.scheduled_time || "00:00";
    const timeB = b.scheduled_time || "00:00";
    return timeA.localeCompare(timeB); 
  });

  const upcomingOrder = orders
    .filter((os: any) => os.status === "Agendada" || os.status === "Em execução")
    .sort((a: any, b: any) => {
      const dateA = new Date(a.scheduled_date).getTime();
      const dateB = new Date(b.scheduled_date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      const timeA = a.scheduled_time || "00:00";
      const timeB = b.scheduled_time || "00:00";
      return timeA.localeCompare(timeB);
    })[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Em execução":
        return {
          bg: "rgba(245, 158, 11, 0.12)",
          color: "#f59e0b",
          border: "rgba(245, 158, 11, 0.3)",
          accent: "#f59e0b",
          icon: <Activity size={13} />,
          label: "Em Execução",
          isPulse: true
        };
      case "Agendada":
        return {
          bg: "rgba(2, 132, 199, 0.12)",
          color: "var(--primary-color)",
          border: "rgba(2, 132, 199, 0.3)",
          accent: "var(--primary-color)",
          icon: <Clock size={13} />,
          label: "Agendada",
          isPulse: false
        };
      case "Concluída":
        return {
          bg: "rgba(16, 185, 129, 0.12)",
          color: "#10b981",
          border: "rgba(16, 185, 129, 0.3)",
          accent: "#10b981",
          icon: <CheckCircle2 size={13} />,
          label: "Concluída",
          isPulse: false
        };
      default:
        return {
          bg: "rgba(148, 163, 184, 0.12)",
          color: "var(--text-secondary)",
          border: "rgba(148, 163, 184, 0.3)",
          accent: "var(--text-secondary)",
          icon: <AlertCircle size={13} />,
          label: status,
          isPulse: false
        };
    }
  };

  const renderDashboard = () => (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
          Olá, {data.userName ? data.userName.split(" ")[0] : "Técnico"}!
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
          Aqui está o resumo das suas atividades.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(14, 165, 233, 0.2)', background: 'linear-gradient(180deg, rgba(14,165,233,0.05) 0%, rgba(0,0,0,0) 100%)' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{orders.filter((o:any) => o.status === 'Agendada').length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Agendadas</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', background: 'linear-gradient(180deg, rgba(245,158,11,0.05) 0%, rgba(0,0,0,0) 100%)' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--warning)', lineHeight: 1 }}>{orders.filter((o:any) => o.status === 'Em execução').length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Em Execução</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'linear-gradient(180deg, rgba(16,185,129,0.05) 0%, rgba(0,0,0,0) 100%)', gridColumn: 'span 2' }}>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>{orders.filter((o:any) => o.status === 'Concluída').length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Concluídas</div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
          <Activity size={20} color="var(--primary-color)" />
          Próxima Ocorrência
        </h2>
        {upcomingOrder ? (
          <Link 
            href={`/minhas-os/${upcomingOrder.id}`}
            className="glass-panel" 
            style={{ 
              padding: '20px', 
              display: 'block', 
              textDecoration: 'none',
              border: '1px solid var(--primary-color)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(0,0,0,0) 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'var(--primary-color)', opacity: 0.1, borderRadius: '50%', filter: 'blur(30px)', transform: 'translate(30%, -30%)' }}></div>
            
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.15)', color: 'var(--primary-color)', fontSize: '12px', fontWeight: 700 }}>Ocorrência #{upcomingOrder.id}</span>
              <span className={`badge ${upcomingOrder.status === 'Em execução' ? 'badge-warning' : 'badge-neutral'}`}>{upcomingOrder.status}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.2 }}>{upcomingOrder.customer.name}</div>
            
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Calendar size={16} color="var(--warning)" />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{formatDate(upcomingOrder.scheduled_date)}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Clock size={16} color="var(--warning)" />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{upcomingOrder.scheduled_time || "--:--"}</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma ocorrência pendente no momento.
          </div>
        )}
      </div>

      <button
        onClick={() => setView("agenda")}
        style={{
          width: '100%',
          padding: '20px',
          background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
          border: 'none',
          borderRadius: '16px',
          color: 'white',
          fontSize: '18px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          cursor: 'pointer',
          boxShadow: '0 10px 30px -10px var(--primary-color)',
          transition: 'transform 0.2s',
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <CalendarDays size={24} />
        Acessar Minha Agenda
        <ArrowRight size={20} />
      </button>
    </div>
  );

  const renderAgenda = () => (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={() => setView("dashboard")}
            style={{
              background: 'var(--bg-color-soft)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease'
            }}
            aria-label="Voltar para o Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
              Minha Agenda
            </h1>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {finalOrders.length} {finalOrders.length === 1 ? 'ordem de serviço' : 'ordens de serviço'}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '0 14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <Search size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input 
            type="text"
            placeholder="Buscar cliente, rua, bairro ou #OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 10px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-main)'
            }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Time Filter Segmented Control */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-color-soft)',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        marginBottom: '16px',
        gap: '4px'
      }}>
        {[
          { id: "hoje", label: "Hoje" },
          { id: "semana", label: "Esta Semana" },
          { id: "mes", label: "Este Mês" },
          { id: "todas", label: "Todas" }
        ].map(tf => {
          const active = timeFilter === tf.id;
          return (
            <button
              key={tf.id}
              onClick={() => setTimeFilter(tf.id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                background: active ? 'var(--primary-color)' : 'transparent',
                color: active ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: active ? '0 2px 8px var(--primary-glow)' : 'none'
              }}
            >
              {tf.label}
            </button>
          );
        })}
      </div>

      {/* Status Filter Horizontal Chips */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '20px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {[
          { id: "todos", label: "Todas", count: countTodos, color: "var(--primary-color)" },
          { id: "Agendada", label: "Agendadas", count: countAgendada, color: "var(--primary-color)" },
          { id: "Em execução", label: "Em Execução", count: countExecucao, color: "#f59e0b" },
          { id: "Concluída", label: "Concluídas", count: countConcluida, color: "#10b981" },
        ].map(st => {
          const active = statusFilter === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '9999px',
                border: active ? `1.5px solid ${st.color}` : '1px solid var(--glass-border)',
                background: active ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-color-soft)',
                color: active ? 'var(--text-main)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <span>{st.label}</span>
              <span style={{
                background: active ? st.color : 'rgba(148, 163, 184, 0.2)',
                color: active ? '#ffffff' : 'var(--text-secondary)',
                padding: '1px 7px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700
              }}>
                {st.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List of Service Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {finalOrders.length === 0 ? (
          <div style={{
            background: 'var(--bg-color-soft)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(2, 132, 199, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)'
            }}>
              <CalendarDays size={28} />
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
              Nenhuma ocorrência encontrada
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '280px' }}>
              {searchTerm ? `Nenhum resultado para "${searchTerm}".` : 'Não há ocorrências com os filtros selecionados.'}
            </p>
            {(searchTerm || timeFilter !== 'todas' || statusFilter !== 'todos') && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setTimeFilter("todas");
                  setStatusFilter("todos");
                }}
                style={{
                  marginTop: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-hover)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          finalOrders.map((os: any) => {
            const isDone = os.status === "Concluída";
            const badge = getStatusBadge(os.status);
            const todayScheduled = isDateToday(os.scheduled_date);
            const fullAddress = [
              os.location?.street,
              os.location?.numero,
              os.location?.neighborhood,
              os.location?.city
            ].filter(Boolean).join(" ");
            const mapsUrl = fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : null;

            return (
              <div 
                key={os.id} 
                style={{ 
                  background: 'var(--bg-color-soft)',
                  border: '1px solid var(--glass-border)',
                  borderLeft: `5px solid ${badge.accent}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                  opacity: isDone ? 0.75 : 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  {/* Top Bar: OS Number + Service + Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        background: 'rgba(2, 132, 199, 0.1)', 
                        color: 'var(--primary-color)', 
                        padding: '3px 8px', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        fontWeight: 700 
                      }}>
                        #{os.id}
                      </span>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        color: 'var(--text-secondary)',
                        background: 'rgba(148, 163, 184, 0.12)',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        <Wrench size={12} />
                        {os.serviceType?.name || 'Serviço'}
                      </span>
                    </div>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`
                    }}>
                      {badge.isPulse && (
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: badge.color,
                          boxShadow: `0 0 6px ${badge.color}`
                        }} />
                      )}
                      {badge.icon}
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: 800, 
                      color: 'var(--text-main)', 
                      margin: 0, 
                      lineHeight: 1.25 
                    }}>
                      {os.customer?.name}
                    </h3>
                  </div>

                  {/* Schedule Highlight Box */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(2, 132, 199, 0.05)',
                    border: '1px solid rgba(2, 132, 199, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="var(--primary-color)" />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {formatScheduleHeader(os.scheduled_date)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {todayScheduled && (
                        <span style={{
                          background: '#f59e0b',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          Hoje
                        </span>
                      )}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-main)'
                      }}>
                        <Clock size={14} color="var(--text-secondary)" />
                        {os.scheduled_time || "--:--"}
                      </div>
                    </div>
                  </div>

                  {/* Address Section with Maps Quick Action */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: 'var(--glass-hover)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    padding: '10px 12px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                      <MapPin size={16} color="var(--primary-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.4, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {os.location?.street || "Endereço não informado"}{os.location?.numero ? `, ${os.location.numero}` : ""}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {[os.location?.neighborhood, os.location?.city].filter(Boolean).join(" • ") || "-"}
                        </div>
                      </div>
                    </div>

                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir no Google Maps"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: 'rgba(2, 132, 199, 0.1)',
                          color: 'var(--primary-color)',
                          border: '1px solid rgba(2, 132, 199, 0.25)',
                          fontSize: '12px',
                          fontWeight: 600,
                          flexShrink: 0,
                          textDecoration: 'none'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation size={13} />
                        Rota
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Action Link */}
                <Link 
                  href={`/minhas-os/${os.id}`} 
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center', 
                    padding: '14px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderTop: '1px solid var(--glass-border)',
                    color: 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span>Acessar Detalhes da OS</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return view === "dashboard" ? renderDashboard() : renderAgenda();
}
