export interface WidgetConfig {
  id: string;
  widgetKey: string;
  title: string;
  colSpan: 12 | 8 | 6 | 4;
  order: number;
  visible: boolean;
}

export interface WidgetDefinition {
  key: string;
  title: string;
  category: "Finanças" | "Operações" | "Gráficos" | "Tabelas & Agenda" | "Estoque & Frota";
  description: string;
  defaultColSpan: 12 | 8 | 6 | 4;
  iconName: string;
}

export const WIDGET_CATALOG: WidgetDefinition[] = [
  {
    key: "kpi_financial_pulse",
    title: "Pulso Financeiro Executivo",
    category: "Finanças",
    description: "Saldo em caixa, entradas realizadas, despesas e faturamento projetado com badges de variação.",
    defaultColSpan: 12,
    iconName: "DollarSign"
  },
  {
    key: "kpi_operations_pulse",
    title: "Pulso Operacional & O.S.",
    category: "Operações",
    description: "Total de O.S., concluídas, agendadas, taxa de sucesso operacional e clientes ativos.",
    defaultColSpan: 12,
    iconName: "Briefcase"
  },
  {
    key: "quick_actions_bar",
    title: "Barra de Ações Rápidas",
    category: "Operações",
    description: "Atalhos instantâneos para nova O.S., nova receita, despesa, cliente e relatórios.",
    defaultColSpan: 12,
    iconName: "Zap"
  },
  {
    key: "chart_financial_cashflow",
    title: "Gráfico: Fluxo de Caixa Mensal",
    category: "Gráficos",
    description: "Demonstrativo visual comparativo de receitas realizadas versus despesas pagas ao longo do tempo.",
    defaultColSpan: 8,
    iconName: "BarChart3"
  },
  {
    key: "chart_os_by_status",
    title: "Gráfico: Distribuição de Ocorrências",
    category: "Gráficos",
    description: "Gráfico donut com divisão percentual de O.S. (Concluídas, Agendadas, Em Andamento, Canceladas).",
    defaultColSpan: 4,
    iconName: "PieChart"
  },
  {
    key: "chart_productivity_ranking",
    title: "Ranking de Produtividade dos Técnicos",
    category: "Gráficos",
    description: "Classificação da equipe com barras de progresso, O.S. concluídas e faturamento gerado.",
    defaultColSpan: 6,
    iconName: "Award"
  },
  {
    key: "chart_revenue_by_category",
    title: "Gráfico: Receitas por Categoria",
    category: "Gráficos",
    description: "Distribuição das origens de receita (Serviços, Vendas, Contratos Recorrentes).",
    defaultColSpan: 6,
    iconName: "Layers"
  },
  {
    key: "table_upcoming_agenda",
    title: "Agenda das Próximas Ocorrências",
    category: "Tabelas & Agenda",
    description: "Lista dinâmica das próximas ordens de serviço agendadas com cliente, horário e endereço.",
    defaultColSpan: 8,
    iconName: "CalendarClock"
  },
  {
    key: "table_recent_activity",
    title: "Feed de Atividades em Tempo Real",
    category: "Tabelas & Agenda",
    description: "Stream ao vivo dos últimos recebimentos, baixas de despesas e finalizações de O.S.",
    defaultColSpan: 4,
    iconName: "Activity"
  },
  {
    key: "table_critical_stock",
    title: "Alerta de Estoque Crítico",
    category: "Estoque & Frota",
    description: "Monitor inteligente de insumos e produtos com estoque abaixo do nível de segurança.",
    defaultColSpan: 6,
    iconName: "AlertTriangle"
  },
  {
    key: "table_top_clients",
    title: "Top Clientes por Faturamento",
    category: "Finanças",
    description: "Lista dos clientes mais rentáveis do período com volume faturado e ticket médio.",
    defaultColSpan: 6,
    iconName: "Star"
  },
  {
    key: "kpi_fleet_stock",
    title: "Status de Frota & Regulatório",
    category: "Estoque & Frota",
    description: "Veículos ativos em campo, armazéns operacionais e controle de conformidade ANVISA.",
    defaultColSpan: 12,
    iconName: "Truck"
  }
];
