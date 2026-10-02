"use client";
import { Wrench, CheckCircle, Clock, TrendingUp, User } from "lucide-react";
import PeriodSelector from "@/app/components/PeriodSelector";

export default function DesempenhoClient({ data, currentPeriod, currentStart, currentEnd }: { data: any[], currentPeriod: string, currentStart: string, currentEnd: string }) {
  // Sort by highest faturamento
  const sortedData = [...data].sort((a, b) => b.faturamento - a.faturamento);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Desempenho de Técnicos</h1>
          <p className="page-description">Ranking de produtividade e faturamento gerado por cada técnico.</p>
        </div>
        <PeriodSelector currentPeriod={currentPeriod} currentStart={currentStart} currentEnd={currentEnd} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {sortedData.map((emp, index) => (
          <div key={emp.id} className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            {index < 3 && (
              <div style={{ position: 'absolute', top: 0, right: 0, background: index === 0 ? 'var(--warning)' : index === 1 ? '#94a3b8' : '#cd7f32', color: '#000', padding: '4px 24px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', transform: 'translate(20px, 16px) rotate(45deg)' }}>
                Top {index + 1}
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                <User size={24} color="var(--primary-color)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>{emp.name}</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{emp.cargo || 'Técnico'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <TrendingUp size={16} /> Faturamento Gerado
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)' }}>
                  R$ {emp.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)', marginBottom: '4px' }}>{emp.concluidaCount}</div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Concluídas</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--warning)', marginBottom: '4px' }}>{emp.emExecucaoCount}</div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Em Execução</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>{emp.totalCount}</div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Atribuídas</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
