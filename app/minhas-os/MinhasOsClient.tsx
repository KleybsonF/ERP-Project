"use client";
import { Calendar, MapPin, Wrench, Eye, CalendarDays, ArrowLeft, ArrowRight, Clock, Activity } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function MinhasOsClient({ data }: { data: any }) {
  const { orders } = data;
  
  const [view, setView] = useState<"dashboard" | "agenda">("dashboard");
  const [timeFilter, setTimeFilter] = useState("mes");
  const [statusFilter, setStatusFilter] = useState("todos");

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const timeFilteredOrders = orders.filter((os: any) => {
    if (timeFilter === "todas") return true;
    const osDate = new Date(os.scheduled_date);
    const normalizedOsDate = new Date(osDate.getUTCFullYear(), osDate.getUTCMonth(), osDate.getUTCDate());
    
    if (timeFilter === "hoje") return normalizedOsDate.getTime() === today.getTime();
    if (timeFilter === "semana") return normalizedOsDate >= startOfWeek && normalizedOsDate <= endOfWeek;
    if (timeFilter === "mes") return normalizedOsDate >= startOfMonth && normalizedOsDate <= endOfMonth;
    return true;
  });

  const countAgendada = timeFilteredOrders.filter((os: any) => os.status === "Agendada").length;
  const countExecucao = timeFilteredOrders.filter((os: any) => os.status === "Em execução").length;
  const countConcluida = timeFilteredOrders.filter((os: any) => os.status === "Concluída").length;
  const countOutros = timeFilteredOrders.filter((os: any) => ["Adiada", "Cancelada"].includes(os.status)).length;
  const countTodos = timeFilteredOrders.length;

  const finalOrders = timeFilteredOrders.filter((os: any) => {
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

  const renderDashboard = () => (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Olá, Técnico!
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
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(0,0,0,0) 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'var(--primary-color)', opacity: 0.1, borderRadius: '50%', filter: 'blur(30px)', transform: 'translate(30%, -30%)' }}></div>
            
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <span className="badge badge-primary" style={{ fontSize: '12px' }}>Ocorrência #{upcomingOrder.id}</span>
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => setView("dashboard")}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', margin: 0 }}>Minha Agenda</h1>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '12px', marginBottom: '24px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {["hoje", "semana", "mes", "todas"].map(tf => (
          <button 
            key={tf}
            className={`badge ${timeFilter === tf ? 'badge-primary' : ''}`}
            style={{ 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '13px', 
              padding: '8px 16px',
              background: timeFilter === tf ? 'var(--primary-color)' : 'transparent',
              color: timeFilter === tf ? 'white' : 'var(--text-secondary)',
              flexShrink: 0
            }}
            onClick={() => setTimeFilter(tf)}
          >
            {tf === "hoje" ? "Hoje" : tf === "semana" ? "Esta Semana" : tf === "mes" ? "Este Mês" : "Todas"}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
        {[
          { id: "todos", label: "Todas", count: countTodos, color: 'var(--primary-color)' },
          { id: "Agendada", label: "Agendadas", count: countAgendada, color: 'var(--text-main)' },
          { id: "Em execução", label: "Em Execução", count: countExecucao, color: 'var(--warning)' },
          { id: "Concluída", label: "Concluídas", count: countConcluida, color: 'var(--success)' },
        ].map(filter => (
          <div 
            key={filter.id}
            className="glass-panel" 
            style={{ 
              padding: '12px 16px', 
              cursor: 'pointer', 
              border: statusFilter === filter.id ? `2px solid ${filter.color}` : '1px solid var(--glass-border)', 
              transition: 'all 0.2s',
              minWidth: '120px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
            onClick={() => setStatusFilter(filter.id)}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{filter.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: filter.color }}>{filter.count}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {finalOrders.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma ocorrência encontrada.
          </div>
        ) : (
          finalOrders.map((os: any) => {
            const isDone = os.status === "Concluída";
            return (
              <div key={os.id} className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', opacity: isDone ? 0.7 : 1, overflow: 'hidden', border: os.status === 'Em execução' ? '1px solid var(--warning)' : '1px solid var(--glass-border)' }}>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  <div className="flex-between">
                    <span className="badge badge-primary" style={{ fontSize: '12px' }}>#{os.id}</span>
                    <span className={`badge ${isDone ? 'badge-success' : (os.status === 'Em execução' ? 'badge-warning' : 'badge-neutral')}`}>{os.status}</span>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px', lineHeight: 1.2 }}>{os.customer.name}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                      <Wrench size={14} /> {os.serviceType.name}
                    </div>
                  </div>
                  
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ background: 'rgba(14, 165, 233, 0.15)', padding: '8px', borderRadius: '8px' }}>
                        <MapPin size={16} color="var(--primary-color)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500, lineHeight: 1.4 }}>{os.location.street}, {os.location.neighborhood}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{os.location.city}</div>
                      </div>
                    </div>
                    
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '8px', borderRadius: '8px' }}>
                        <Calendar size={16} color="var(--warning)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 700 }}>{formatDate(os.scheduled_date)} <span style={{ color: 'var(--warning)' }}>às {os.scheduled_time || "--:--"}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/minhas-os/${os.id}`} 
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center', 
                    padding: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: 'rgba(255,255,255,0.03)',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <Eye size={16} />
                  Acessar Detalhes
                </Link>
              </div>
            )
          })
        )}
      </div>
    </div>
  );

  return view === "dashboard" ? renderDashboard() : renderAgenda();
}
