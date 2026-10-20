export interface PermissionItem {
  id: string;
  label: string;
  description: string;
}

export interface PermissionModule {
  id: string;
  name: string;
  iconName: string;
  description: string;
  permissions: PermissionItem[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "clientes",
    name: "Clientes & Contratos",
    iconName: "Users",
    description: "Gestão cadastral, contratos de fidelidade e contatos",
    permissions: [
      { id: "clientes.view", label: "Visualizar Clientes", description: "Ver listagem, fichas e histórico da carteira" },
      { id: "clientes.create", label: "Cadastrar Clientes", description: "Adicionar novos clientes PF e PJ" },
      { id: "clientes.edit", label: "Editar Clientes", description: "Alterar dados, contatos e endereços" },
      { id: "clientes.delete", label: "Inativar / Excluir Clientes", description: "Ocultar ou remover clientes da base" },
      { id: "clientes.blacklist", label: "Gerenciar Blacklist", description: "Adicionar ou remover clientes da lista de bloqueio" }
    ]
  },
  {
    id: "ocorrencias",
    name: "Ordens de Serviço & Campo",
    iconName: "ClipboardCheck",
    description: "Agendamentos, execução técnica e certificação sanitária",
    permissions: [
      { id: "os.view", label: "Visualizar Ocorrências / OS", description: "Acessar cronograma, lista de OS e detalhes" },
      { id: "os.create", label: "Criar & Agendar OS", description: "Cadastrar e agendar novas ordens de serviço" },
      { id: "os.edit", label: "Editar & Lançar Execução", description: "Lançar técnicos, fotos e dosagem utilizada" },
      { id: "os.status", label: "Alterar Status / Concluir", description: "Avançar etapas de atendimento e finalizar OS" },
      { id: "os.print", label: "Emitir Vias & Certificados", description: "Imprimir via de execução e certificado ANVISA" }
    ]
  },
  {
    id: "financeiro",
    name: "Financeiro & Controladoria",
    iconName: "Wallet",
    description: "Contas a pagar/receber, pontos de recebimento e caixa",
    permissions: [
      { id: "financeiro.view", label: "Visualizar Financeiro", description: "Acessar painel e métricas de faturamento" },
      { id: "financeiro.receber", label: "Contas a Receber", description: "Gerenciar boletos, faturas e dar baixa em títulos" },
      { id: "financeiro.pagar", label: "Contas a Pagar", description: "Registrar despesas, custos fixos e fornecedores" },
      { id: "financeiro.caixas", label: "Pontos de Recebimento", description: "Controle de saldos bancários e histórico de caixas" },
      { id: "financeiro.dre", label: "DRE & Indicadores", description: "Acompanhar demonstrativo financeiro e balanço" }
    ]
  },
  {
    id: "estoque",
    name: "Estoque & Insumos",
    iconName: "Package",
    description: "Controle de praguicidas, dosagens, EPIs e equipamentos",
    permissions: [
      { id: "estoque.view", label: "Visualizar Estoque", description: "Consultar saldos, lotes e validade de produtos" },
      { id: "estoque.manage", label: "Entrada & Ajustes", description: "Lançar notas de entrada e movimentações de estoque" },
      { id: "estoque.consume", label: "Baixa de Consumo por OS", description: "Contabilizar produto gasto por dosagem de aplicação" }
    ]
  },
  {
    id: "relatorios",
    name: "Relatórios & Compliance",
    iconName: "BarChart3",
    description: "Monitoramento de licenças, mapa de ocorrências e logs",
    permissions: [
      { id: "relatorios.view", label: "Visualizar Relatórios", description: "Acesso a relatórios analíticos do sistema" },
      { id: "relatorios.anvisa", label: "Vencimentos ANVISA / INEA", description: "Monitorar prazos de garantia e licenças obrigatórias" },
      { id: "relatorios.logs", label: "Auditoria & Logs", description: "Ver rastreabilidade de ações executadas pelos usuários" }
    ]
  },
  {
    id: "administracao",
    name: "Administração & Parâmetros",
    iconName: "Settings",
    description: "Configurações da empresa, veículos da frota e permissões",
    permissions: [
      { id: "admin.dashboards", label: "Personalizar Dashboards", description: "Organizar e criar layouts de dashboards executivos" },
      { id: "admin.empresa", label: "Dados da Empresa & Filiais", description: "Editar CNPJ, RT, licenças sanitárias e matriz" },
      { id: "admin.veiculos", label: "Gestão de Veículos da Frota", description: "Cadastrar veículos, vencimento de IPVA e seguro" },
      { id: "admin.usuarios", label: "Gestão de Equipe & Acessos", description: "Cadastrar usuários e configurar matriz de permissões" }
    ]
  }
];

export const ALL_PERMISSION_IDS: string[] = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.id)
);

export const ROLE_PRESETS: Record<string, string[]> = {
  Administrador: [...ALL_PERMISSION_IDS],
  Gestor: [
    "clientes.view", "clientes.create", "clientes.edit", "clientes.blacklist",
    "os.view", "os.create", "os.edit", "os.status", "os.print",
    "financeiro.view", "financeiro.receber",
    "estoque.view", "estoque.manage", "estoque.consume",
    "relatorios.view", "relatorios.anvisa",
    "admin.veiculos"
  ],
  Financeiro: [
    "clientes.view",
    "os.view", "os.print",
    "financeiro.view", "financeiro.receber", "financeiro.pagar", "financeiro.caixas", "financeiro.dre",
    "relatorios.view"
  ],
  Operador: [
    "clientes.view",
    "os.view", "os.edit", "os.status", "os.print",
    "estoque.view", "estoque.consume"
  ],
  Atendente: [
    "clientes.view", "clientes.create", "clientes.edit",
    "os.view", "os.create", "os.print",
    "financeiro.view"
  ],
  "Sem Acesso": []
};

export const AVAILABLE_ROLES = [
  { value: "Administrador", label: "Administrador (Acesso Total)", color: "#6366f1", badgeBg: "rgba(99, 102, 241, 0.15)" },
  { value: "Gestor", label: "Gestor Operacional (Operações & Clientes)", color: "#38bdf8", badgeBg: "rgba(56, 189, 248, 0.15)" },
  { value: "Financeiro", label: "Financeiro (Controladoria & Caixas)", color: "#10b981", badgeBg: "rgba(16, 185, 129, 0.15)" },
  { value: "Operador", label: "Operador / Técnico (Execução de Campo)", color: "#f59e0b", badgeBg: "rgba(245, 158, 11, 0.15)" },
  { value: "Atendente", label: "Atendente / Comercial (Vendas & Atendimento)", color: "#ec4899", badgeBg: "rgba(236, 72, 153, 0.15)" },
  { value: "Sem Acesso", label: "Sem Acesso (Apenas Registro Histórico)", color: "#ef4444", badgeBg: "rgba(239, 68, 68, 0.15)" },
];

export function parseUserPermissions(role: string, permissionsJson?: string | null): string[] {
  if (permissionsJson) {
    try {
      const parsed = JSON.parse(permissionsJson);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback to role preset
    }
  }
  return ROLE_PRESETS[role] || ROLE_PRESETS["Operador"] || [];
}
