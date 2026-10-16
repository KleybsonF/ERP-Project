import Link from "next/link";
import { 
  Banknote, 
  CheckCircle2, 
  Send, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  FileSpreadsheet, 
  FileText, 
  BarChart3,
  TrendingUp,
  DollarSign
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function RelatoriosFinanceirosHubPage() {
  const reports = [
    {
      title: "Pagamentos A Receber",
      href: "/relatorios/financeiro/a-receber",
      description: "Controle e projeção de receitas em aberto, prazos de vencimento e fluxo previsto.",
      icon: Banknote,
      color: "#3b82f6",
      tag: "Receitas Pendentes",
      features: ["Filtros por cliente e forma de pgto", "Gráficos de projeção mensal", "Exportação PDF e Excel (até 5.000 linhas)"]
    },
    {
      title: "Pagamentos Recebidos",
      href: "/relatorios/financeiro/recebidos",
      description: "Histórico completo de receitas recebidas, liquidadas e baixadas nas contas.",
      icon: CheckCircle2,
      color: "#10b981",
      tag: "Entradas Realizadas",
      features: ["Filtro por caixa e forma de recebimento", "Evolução temporal e ticket médio", "Exportação PDF e Excel"]
    },
    {
      title: "Pagamentos Emitidos",
      href: "/relatorios/financeiro/emitidos",
      description: "Contas a pagar e despesas operacionais da empresa, custos por veículo e equipe.",
      icon: Send,
      color: "#ef4444",
      tag: "Contas a Pagar",
      features: ["Despesas por categoria e fornecedor", "Gastos por veículo da frota", "Exportação PDF e Excel"]
    },
    {
      title: "Pagamentos Cancelados",
      href: "/relatorios/financeiro/cancelados",
      description: "Auditoria de títulos cancelados, abortados ou estornados no financeiro.",
      icon: XCircle,
      color: "#f59e0b",
      tag: "Cancelamentos",
      features: ["Separação por Receitas e Despesas", "Gráficos de perdas e motivos", "Exportação PDF e Excel"]
    },
    {
      title: "Pagamentos Em atraso",
      href: "/relatorios/financeiro/em-atraso",
      description: "Aging de inadimplência, ranking de devedores e cálculo de juros/multa moratórios.",
      icon: AlertTriangle,
      color: "#a855f7",
      tag: "Inadimplência & Cobrança",
      features: ["Classificação por faixas de atraso (1-15d, 16-30d, 90+d)", "Cálculo de encargos e texto para cobrança", "Exportação PDF e Excel"]
    },
    {
      title: "Demonstrativo de Resultado (DRE)",
      href: "/relatorios/financeiro/dre",
      description: "Demonstração do Resultado do Exercício consolidada mês a mês, receitas, custos, margem bruta e resultado líquido.",
      icon: FileSpreadsheet,
      color: "#06b6d4",
      tag: "DRE Gerencial",
      features: ["Matriz mensal de Jan a Dez + Total", "Análise Vertical (% ROL) e regime de Competência/Caixa", "Exportação completa em Excel e PDF"]
    }
  ];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{
            background: "rgba(59, 130, 246, 0.15)",
            padding: "8px",
            borderRadius: "10px",
            display: "inline-flex"
          }}>
            <BarChart3 size={24} color="#3b82f6" />
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Central de Relatórios Financeiros
          </h1>
        </div>
        <p className="page-description" style={{ margin: 0 }}>
          Selecione uma das opções abaixo para acessar relatórios analíticos completos, com filtros avançados, análise gráfica e emissão em PDF e Excel.
        </p>
      </div>

      {/* Grid of Report Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: "24px"
      }}>
        {reports.map((rep, idx) => {
          const Icon = rep.icon;
          return (
            <Link
              key={idx}
              href={rep.href}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="glass-panel"
                style={{
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "20px",
                  borderTop: `4px solid ${rep.color}`,
                  cursor: "pointer",
                  transition: "all 0.25s ease"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = rep.color;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--glass-border)";
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{
                      background: `rgba(255, 255, 255, 0.05)`,
                      border: `1px solid ${rep.color}40`,
                      padding: "10px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Icon size={24} color={rep.color} />
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      background: `${rep.color}18`,
                      color: rep.color,
                      padding: "3px 8px",
                      borderRadius: "12px"
                    }}>
                      {rep.tag}
                    </span>
                  </div>

                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>
                    {rep.title}
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
                    {rep.description}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {rep.features.map((feat, fIdx) => (
                      <div key={fIdx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
                        <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: rep.color }} />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  paddingTop: "16px",
                  borderTop: "1px solid var(--glass-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: rep.color
                }}>
                  <span>Acessar Relatório</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
