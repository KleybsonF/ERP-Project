"use client";
import { Calendar, MapPin, Wrench, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function MinhasOsClient({ data }: { data: any }) {
  const { orders } = data;
  
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
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Minhas Ordens de Serviço</h1>
          <p className="page-description">
            Lista de serviços designados a você.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '12px' }}>
          {["hoje", "semana", "mes", "todas"].map(tf => (
            <button 
              key={tf}
              className={`badge ${timeFilter === tf ? 'badge-primary' : ''}`}
              style={{ 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '13px', 
                padding: '6px 16px',
                background: timeFilter === tf ? 'var(--primary-color)' : 'transparent',
                color: timeFilter === tf ? 'white' : 'var(--text-secondary)'
              }}
              onClick={() => setTimeFilter(tf)}
            >
              {tf === "hoje" ? "Hoje" : tf === "semana" ? "Esta Semana" : tf === "mes" ? "Este Mês" : "Todas"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div 
          className="glass-panel" 
          style={{ padding: '16px', cursor: 'pointer', border: statusFilter === "todos" ? '2px solid var(--primary-color)' : '1px solid var(--glass-border)', transition: 'all 0.2s' }}
          onClick={() => setStatusFilter("todos")}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Todas</div>
          <div style={{ fontSize: '28px', fontWeight: 800 }}>{countTodos}</div>
        </div>
        
        <div 
          className="glass-panel" 
          style={{ padding: '16px', cursor: 'pointer', border: statusFilter === "Agendada" ? '2px solid var(--text-main)' : '1px solid var(--glass-border)', transition: 'all 0.2s' }}
          onClick={() => setStatusFilter("Agendada")}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Agendadas</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>{countAgendada}</div>
        </div>

        <div 
          className="glass-panel" 
          style={{ padding: '16px', cursor: 'pointer', border: statusFilter === "Em execução" ? '2px solid var(--warning)' : '1px solid var(--glass-border)', transition: 'all 0.2s' }}
          onClick={() => setStatusFilter("Em execução")}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Em Execução</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--warning)' }}>{countExecucao}</div>
        </div>

        <div 
          className="glass-panel" 
          style={{ padding: '16px', cursor: 'pointer', border: statusFilter === "Concluída" ? '2px solid var(--success)' : '1px solid var(--glass-border)', transition: 'all 0.2s' }}
          onClick={() => setStatusFilter("Concluída")}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Concluídas</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)' }}>{countConcluida}</div>
        </div>

        <div 
          className="glass-panel" 
          style={{ padding: '16px', cursor: 'pointer', border: statusFilter === "Outros" ? '2px solid var(--text-muted)' : '1px solid var(--glass-border)', transition: 'all 0.2s' }}
          onClick={() => setStatusFilter("Outros")}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Outras</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-muted)' }}>{countOutros}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {finalOrders.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
            Nenhuma Ordem de Serviço designada a você no momento.
          </div>
        ) : (
          finalOrders.map((os: any) => {
            const isDone = os.status === "Concluída";
            return (
              <div key={os.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', opacity: isDone ? 0.7 : 1 }}>
                <div className="flex-between">
                  <span className="badge badge-primary">O.S. #{os.id}</span>
                  <span className={`badge ${isDone ? 'badge-success' : 'badge-neutral'}`}>{os.status}</span>
                </div>
                
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>{os.customer.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <Wrench size={14} /> {os.serviceType.name}
                  </div>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <MapPin size={16} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Local</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{os.location.street}, {os.location.neighborhood} - {os.location.city}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Calendar size={16} color="var(--secondary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Agendamento</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(os.scheduled_date)} às {os.scheduled_time || "--:--"}</div>
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/minhas-os/${os.id}`} 
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center', 
                    padding: '12px', 
                    marginTop: isDone ? 'auto' : '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: 'rgba(217, 70, 239, 0.1)',
                    color: '#d946ef',
                    border: '1px solid rgba(217, 70, 239, 0.4)',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(217, 70, 239, 0.2)';
                    e.currentTarget.style.border = '1px solid rgba(217, 70, 239, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(217, 70, 239, 0.1)';
                    e.currentTarget.style.border = '1px solid rgba(217, 70, 239, 0.4)';
                  }}
                >
                  <Eye size={18} />
                  Acessar Detalhes da O.S.
                </Link>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
