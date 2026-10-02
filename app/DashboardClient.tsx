"use client";
import { 
  TrendingUp, Banknote, CalendarClock, BriefcaseBusiness, 
  Wallet, DollarSign, TrendingDown, Users, ChevronRight, MapPin, CheckCircle
} from "lucide-react";
import Link from "next/link";
import PeriodSelector from "@/app/components/PeriodSelector";

export default function DashboardClient({ 
  stats, fluxo, desempenho, upcomingOs, currentPeriod, currentStart, currentEnd 
}: { 
  stats: any, fluxo: any, desempenho: any, upcomingOs: any[], 
  currentPeriod: string, currentStart: string, currentEnd: string 
}) {
  
  const { receivables, payables } = fluxo;
  const totalReceitas = receivables.filter((r: any) => r.status === "Pago" || r.status === "Recebido").reduce((sum: number, r: any) => sum + r.amount, 0);
  const totalReceitasPendentes = receivables.filter((r: any) => r.status !== "Pago" && r.status !== "Recebido" && r.status !== "Cancelado").reduce((sum: number, r: any) => sum + r.amount, 0);
  const totalDespesas = payables.filter((p: any) => p.status === "Pago").reduce((sum: number, p: any) => sum + p.amount, 0);
  const totalDespesasPendentes = payables.filter((p: any) => p.status !== "Pago" && p.status !== "Cancelado").reduce((sum: number, p: any) => sum + p.amount, 0);
  
  const saldoAtual = totalReceitas - totalDespesas;
  
  const topTecnicos = [...desempenho].sort((a, b) => b.faturamento - a.faturamento).slice(0, 3);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Dashboard Operacional</h1>
          <p className="page-description">Visão 360º das suas operações, finanças e equipe.</p>
        </div>
        
        <PeriodSelector currentPeriod={currentPeriod} currentStart={currentStart} currentEnd={currentEnd} />
      </div>

      {/* Hero KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        
        {/* KPI: Saldo em Caixa */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid var(--primary-color)' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Saldo Realizado</span>
            <div style={{ background: 'var(--primary-glow)', padding: '8px', borderRadius: '8px' }}>
              <Wallet size={20} className="text-primary" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: saldoAtual >= 0 ? 'var(--text-main)' : 'var(--danger)' }}>
              R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={14} /> +R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} entradas
            </div>
          </div>
        </div>

        {/* KPI: O.S. Pendentes */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid var(--warning)' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>O.S. Agendadas</span>
            <div style={{ background: 'var(--warning-bg)', padding: '8px', borderRadius: '8px' }}>
              <CalendarClock size={20} className="text-warning" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)' }}>
              {stats.agendadas}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Ordens aguardando execução
            </div>
          </div>
        </div>

        {/* KPI: Inadimplência / A Receber */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid var(--success)' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>A Receber</span>
            <div style={{ background: 'var(--success-bg)', padding: '8px', borderRadius: '8px' }}>
              <Banknote size={20} className="text-success" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)' }}>
              R$ {totalReceitasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Faturas não pagas
            </div>
          </div>
        </div>

        {/* KPI: A Pagar */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid var(--danger)' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>A Pagar</span>
            <div style={{ background: 'var(--danger-bg)', padding: '8px', borderRadius: '8px' }}>
              <TrendingDown size={20} className="text-danger" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)' }}>
              R$ {totalDespesasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Despesas pendentes
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Próximas O.S. */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarClock size={20} color="var(--primary-color)" /> Próximas O.S. Agendadas
              </h2>
            </div>
            <Link href="/os" style={{ color: 'var(--primary-color)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              Ver Todas <ChevronRight size={14} />
            </Link>
          </div>
          
          {upcomingOs.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhuma O.S. agendada para os próximos dias.
            </div>
          ) : (
            <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              {upcomingOs.map(os => (
                <div key={os.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800 }}>{new Date(os.scheduled_date).getUTCDate()}</span>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>{new Date(os.scheduled_date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{os.customer?.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <MapPin size={12} /> {os.location?.street}, {os.location?.city}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--warning)' }}>{os.scheduled_time}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>O.S. #{os.id}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Técnicos */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--secondary-color)" /> Ranking de Produtividade
            </h2>
          </div>
          
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topTecnicos.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>Sem dados suficientes.</div>
            ) : (
              topTecnicos.map((tec, i) => (
                <div key={tec.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? 'var(--warning-bg)' : i === 1 ? 'rgba(148, 163, 184, 0.2)' : 'rgba(205, 127, 50, 0.2)', color: i === 0 ? 'var(--warning)' : i === 1 ? '#94a3b8' : '#cd7f32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{tec.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={10} color="var(--success)" /> {tec.concluidaCount} O.S. concluídas
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--success)' }}>
                    R$ {tec.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              ))
            )}

            <Link href="/relatorios/desempenho-tecnicos" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: 600, marginTop: '8px', transition: 'background 0.2s' }}>
              Ver Relatório Completo
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
