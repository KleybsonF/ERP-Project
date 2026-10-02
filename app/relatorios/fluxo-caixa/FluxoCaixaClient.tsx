import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import PeriodSelector from "@/app/components/PeriodSelector";

export default function FluxoCaixaClient({ data, currentPeriod, currentStart, currentEnd }: { data: any, currentPeriod: string, currentStart: string, currentEnd: string }) {
  const { receivables, payables } = data;

  const totalReceitas = receivables
    .filter((r: any) => r.status === "Pago" || r.status === "Recebido")
    .reduce((sum: number, r: any) => sum + r.amount, 0);

  const totalReceitasPendentes = receivables
    .filter((r: any) => r.status !== "Pago" && r.status !== "Recebido" && r.status !== "Cancelado")
    .reduce((sum: number, r: any) => sum + r.amount, 0);

  const totalDespesas = payables
    .filter((p: any) => p.status === "Pago")
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  const totalDespesasPendentes = payables
    .filter((p: any) => p.status !== "Pago" && p.status !== "Cancelado")
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  const saldoAtual = totalReceitas - totalDespesas;
  const saldoProjetado = (totalReceitas + totalReceitasPendentes) - (totalDespesas + totalDespesasPendentes);

  // Agrupar formas de pagamento das receitas
  const metodosPagamento = receivables
    .filter((r: any) => r.status === "Pago" && r.paymentMethod)
    .reduce((acc: any, r: any) => {
      const name = r.paymentMethod.name;
      acc[name] = (acc[name] || 0) + r.amount;
      return acc;
    }, {});

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Fluxo de Caixa Simplificado</h1>
          <p className="page-description">Análise financeira de receitas, despesas e saldo projetado.</p>
        </div>
        <PeriodSelector currentPeriod={currentPeriod} currentStart={currentStart} currentEnd={currentEnd} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Saldo Atual */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Saldo em Caixa (Realizado)</span>
            <div style={{ background: saldoAtual >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', padding: '8px', borderRadius: '8px' }}>
              <Wallet size={20} color={saldoAtual >= 0 ? 'var(--success)' : 'var(--danger)'} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: saldoAtual >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Receitas pagas - Despesas pagas</div>
          </div>
        </div>

        {/* Saldo Projetado */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Saldo Projetado (Futuro)</span>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
              <DollarSign size={20} color="var(--text-main)" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-main)' }}>
              R$ {saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Considerando pendências a receber e a pagar</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Entradas */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <TrendingUp size={20} color="var(--success)" />
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>Entradas (Receitas)</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span style={{ fontWeight: 600 }}>Recebido (Pago)</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)' }}>R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} color="var(--warning)" />
                <span style={{ fontWeight: 600 }}>A Receber (Pendente)</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--warning)' }}>R$ {totalReceitasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '16px' }}>Origem dos Recebimentos</h3>
            {Object.keys(metodosPagamento).length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sem dados suficientes.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(metodosPagamento).map(([method, amount]: [string, any]) => {
                  const percentage = ((amount / totalReceitas) * 100).toFixed(1);
                  return (
                    <div key={method}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span>{method}</span>
                        <span style={{ fontWeight: 600 }}>R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({percentage}%)</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--primary-color)', width: percentage + '%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Saídas */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <TrendingDown size={20} color="var(--danger)" />
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>Saídas (Despesas)</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--danger)" />
                <span style={{ fontWeight: 600 }}>Pago (Realizado)</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--danger)' }}>R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} color="var(--warning)" />
                <span style={{ fontWeight: 600 }}>A Pagar (Pendente)</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--warning)' }}>R$ {totalDespesasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
