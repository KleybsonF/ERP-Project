export type ContractVariable = {
  tag: string;
  label: string;
  description: string;
  sample: string;
  category: "Dados do Cliente" | "Local e Endereço" | "Serviço e Valores" | "Sua Empresa" | "Datas e Prazos";
};

export const CONTRACT_VARIABLES: ContractVariable[] = [
  // 1. Dados do Cliente
  {
    tag: "{{cliente.nome}}",
    label: "Nome ou Razão Social",
    description: "Nome completo do cliente pessoa física ou razão social da empresa",
    sample: "Restaurante e Buffet Sabor Tropical Ltda",
    category: "Dados do Cliente"
  },
  {
    tag: "{{cliente.nome_fantasia}}",
    label: "Nome Fantasia",
    description: "Nome fantasia para empresas (PJ)",
    sample: "Sabor Tropical Gastronomia",
    category: "Dados do Cliente"
  },
  {
    tag: "{{cliente.documento}}",
    label: "CPF ou CNPJ",
    description: "Número do CPF ou CNPJ formatado",
    sample: "12.345.678/0001-90",
    category: "Dados do Cliente"
  },
  {
    tag: "{{cliente.rg_ie}}",
    label: "RG ou Inscrição Estadual",
    description: "RG do titular ou Inscrição Estadual da empresa",
    sample: "IE: 20.345.678-9",
    category: "Dados do Cliente"
  },
  {
    tag: "{{cliente.telefone}}",
    label: "Telefone / Celular",
    description: "Telefone principal de contato cadastrado",
    sample: "(84) 98765-4321",
    category: "Dados do Cliente"
  },
  {
    tag: "{{cliente.responsavel}}",
    label: "Nome do Responsável",
    description: "Nome do sócio ou responsável legal da empresa",
    sample: "Carlos Eduardo Silva",
    category: "Dados do Cliente"
  },
  {
    tag: "{{cliente.cpf_responsavel}}",
    label: "CPF do Responsável",
    description: "CPF do representante legal que assina pelo cliente",
    sample: "123.456.789-00",
    category: "Dados do Cliente"
  },

  // 2. Local e Endereço
  {
    tag: "{{local.endereco_completo}}",
    label: "Endereço Completo",
    description: "Rua, número, bairro, cidade, UF e CEP formatados",
    sample: "Av. Engenheiro Roberto Freire, 1950, Ponta Negra - Natal/RN, CEP 59090-000",
    category: "Local e Endereço"
  },
  {
    tag: "{{local.rua}}",
    label: "Logradouro / Rua",
    description: "Nome da rua ou avenida",
    sample: "Av. Engenheiro Roberto Freire",
    category: "Local e Endereço"
  },
  {
    tag: "{{local.numero}}",
    label: "Número",
    description: "Número do imóvel",
    sample: "1950",
    category: "Local e Endereço"
  },
  {
    tag: "{{local.bairro}}",
    label: "Bairro",
    description: "Bairro do endereço",
    sample: "Ponta Negra",
    category: "Local e Endereço"
  },
  {
    tag: "{{local.cidade}}",
    label: "Cidade",
    description: "Município onde se localiza o imóvel",
    sample: "Natal",
    category: "Local e Endereço"
  },
  {
    tag: "{{local.estado}}",
    label: "UF / Estado",
    description: "Sigla do estado (ex: RN, SP, PB)",
    sample: "RN",
    category: "Local e Endereço"
  },
  {
    tag: "{{local.cep}}",
    label: "CEP",
    description: "Código de Endereçamento Postal",
    sample: "59090-000",
    category: "Local e Endereço"
  },
  {
    tag: "{{local.complemento}}",
    label: "Complemento",
    description: "Sala, bloco, apartamento ou galpão",
    sample: "Loja 04 - Térreo",
    category: "Local e Endereço"
  },
  {
    tag: "{{local.ponto_referencia}}",
    label: "Ponto de Referência",
    description: "Referência para localização física do imóvel",
    sample: "Em frente ao Shopping Praia Mar",
    category: "Local e Endereço"
  },

  // 3. Serviço e Valores
  {
    tag: "{{servico.tipo}}",
    label: "Tipo de Serviço",
    description: "Nome do serviço prestado (ex: Desinsetização, Desratização)",
    sample: "Controle Integrado de Pragas (Desinsetização e Desratização)",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.valor}}",
    label: "Valor Total",
    description: "Valor total do contrato em moeda (R$)",
    sample: "R$ 1.450,00",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.valor_extenso}}",
    label: "Valor por Extenso",
    description: "Valor monetário grafado por extenso",
    sample: "um mil quatrocentos e cinquenta reais",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.forma_pagamento}}",
    label: "Forma de Pagamento",
    description: "Condição combinada (Pix, Boleto Bancário 30 dias, Cartão)",
    sample: "Boleto Bancário (30 dias)",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.garantia_dias}}",
    label: "Prazo de Garantia",
    description: "Período de garantia contratual da assistência",
    sample: "90 (noventa) dias",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.validade_anvisa}}",
    label: "Vencimento Anvisa / Certificado",
    description: "Data de validade do comprovante sanitário",
    sample: "15/04/2027",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.data_execucao}}",
    label: "Data da Execução",
    description: "Data em que o serviço foi ou será executado",
    sample: "15/10/2026",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.hora_execucao}}",
    label: "Horário Agendado",
    description: "Horário da intervenção técnica",
    sample: "08:30",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.tecnicos_responsaveis}}",
    label: "Técnicos Responsáveis",
    description: "Nomes dos técnicos aplicadores escalados",
    sample: "Marcos Vinícius e Lucas Andrade",
    category: "Serviço e Valores"
  },

  {
    tag: "{{servico.numero}}",
    label: "Número da Ocorrência / OS",
    description: "Número identificador do atendimento",
    sample: "3581",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.pragas_alvo}}",
    label: "Pragas / Vetores Controlados",
    description: "Pragas-alvo combatidas na aplicação",
    sample: "CAIXA D'ÁGUA, BARATAS, FORMIGAS, ROEDORES",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.validade_garantia}}",
    label: "Validade da Garantia",
    description: "Data limite da cobertura de garantia",
    sample: "26/02/2027",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.observacoes}}",
    label: "Observações do Serviço",
    description: "Orientações operacionais e anotações técnicas",
    sample: "CAIXA D'ÁGUA DE 4.000LTS HIGIENIZADA E CLORADA",
    category: "Serviço e Valores"
  },
  {
    tag: "{{servico.detalhes_areas}}",
    label: "Dados da Área Tratada",
    description: "Locais internos ou externos abrangidos",
    sample: "Área interna do reservatório e periféricos",
    category: "Serviço e Valores"
  },

  // 4. Sua Empresa
  {
    tag: "{{empresa.nome}}",
    label: "Nome Fantasia da Empresa",
    description: "Nome comercial da sua empresa",
    sample: "Confiança Dedetizadora",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.razao_social}}",
    label: "Razão Social da Empresa",
    description: "Razão social oficial da sua empresa",
    sample: "Confiança Dedetizadora LTDA ME",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.cnpj}}",
    label: "CNPJ da Empresa",
    description: "CNPJ da sua empresa prestadora",
    sample: "11.365.123/0001-42",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.endereco}}",
    label: "Endereço da Empresa",
    description: "Endereço da sede da sua empresa",
    sample: "Rua Treze de Maio, nº 34, Boa Esperança - Parnamirim/RN",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.telefone}}",
    label: "Telefone da Empresa",
    description: "Telefone fixo da empresa",
    sample: "(84) 3272-4289",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.whatsapp}}",
    label: "WhatsApp da Empresa",
    description: "Contatos de WhatsApp de atendimento",
    sample: "(84) 99973-1210 / (84) 98848-4289",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.email}}",
    label: "Email da Empresa",
    description: "Email oficial da empresa",
    sample: "confianca_dedetizadora@hotmail.com",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.alvara_sanitario}}",
    label: "Alvará Sanitário",
    description: "Número e validade do alvará sanitário da empresa",
    sample: "014/2026 - VAL: 18/03/2027",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.licenca_ambiental}}",
    label: "Licença Ambiental",
    description: "Número e validade da licença ambiental",
    sample: "006/2024 - VAL: 12/07/2027",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.responsavel_tecnico}}",
    label: "Responsável Técnico",
    description: "Biólogo/Químico responsável e número do conselho",
    sample: "Dra. Juliana Mendes - CRBio 45.980/05",
    category: "Sua Empresa"
  },

  // 5. Produtos e Químicos
  {
    tag: "{{produto.grupo_quimico}}",
    label: "Grupo Químico",
    description: "Família química do princípio ativo aplicado",
    sample: "Inorgânico / Clorado",
    category: "Serviço e Valores"
  },
  {
    tag: "{{produto.concentracao}}",
    label: "Concentração de Uso",
    description: "Grau de concentração de uso da substância",
    sample: "1000 ppm",
    category: "Serviço e Valores"
  },
  {
    tag: "{{produto.diluente}}",
    label: "Diluente Utilizado",
    description: "Solvente empregado na calda",
    sample: "Água potável",
    category: "Serviço e Valores"
  },
  {
    tag: "{{produto.registro}}",
    label: "Registro MS / INEA",
    description: "Número de registro no órgão ambiental/sanitário",
    sample: "3263700140015",
    category: "Serviço e Valores"
  },
  {
    tag: "{{produto.volume}}",
    label: "Volume Aplicado",
    description: "Quantidade total aplicada no imóvel",
    sample: "1 Litro",
    category: "Serviço e Valores"
  },
  {
    tag: "{{produto.equipamento}}",
    label: "Equipamento Utilizado",
    description: "Identificação dos equipamentos empregados",
    sample: "Pulverizador Costal Pressurizado nº 2",
    category: "Serviço e Valores"
  },
  {
    tag: "{{produto.principio_ativo}}",
    label: "Princípio Ativo",
    description: "Composto químico ativo empregado",
    sample: "Hipoclorito de sódio",
    category: "Serviço e Valores"
  },
  {
    tag: "{{produto.praga_alvo}}",
    label: "Praga Alvo do Produto",
    description: "Finalidade sanitária do produto",
    sample: "Higienização e desinfecção de reservatório de água",
    category: "Serviço e Valores"
  },
  {
    tag: "{{produto.antidoto}}",
    label: "Antídoto / Tratamento Sintomático",
    description: "Conduta médica em caso de intoxicação acidental",
    sample: "Tratamento sintomático e suporte respiratório",
    category: "Serviço e Valores"
  },

  // 5. Datas e Prazos
  {
    tag: "{{data.atual}}",
    label: "Data Atual",
    description: "Data do dia em formato DD/MM/AAAA",
    sample: "10/10/2026",
    category: "Datas e Prazos"
  },
  {
    tag: "{{data.cidade_data}}",
    label: "Cidade e Data por Extenso",
    description: "Local e data formatados para fecho de contratos",
    sample: "Natal/RN, 10 de Outubro de 2026",
    category: "Datas e Prazos"
  },
  {
    tag: "{{data.dia}}",
    label: "Dia Atual",
    description: "Número do dia atual",
    sample: "10",
    category: "Datas e Prazos"
  },
  {
    tag: "{{data.mes_extenso}}",
    label: "Mês Atual por Extenso",
    description: "Nome do mês atual",
    sample: "Outubro",
    category: "Datas e Prazos"
  },
  {
    tag: "{{data.ano}}",
    label: "Ano Atual",
    description: "Ano atual com 4 dígitos",
    sample: "2026",
    category: "Datas e Prazos"
  }
];

export function replaceContractVariables(templateHtml: string, customReplacements?: Record<string, string>): string {
  let result = templateHtml;
  CONTRACT_VARIABLES.forEach(v => {
    const val = customReplacements?.[v.tag] ?? v.sample;
    result = result.split(v.tag).join(val);
  });
  return result;
}
