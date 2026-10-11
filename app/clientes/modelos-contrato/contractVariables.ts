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
    tag: "{{empresa.inscricao_estadual}}",
    label: "Inscrição Estadual da Empresa",
    description: "Inscrição Estadual (I.E.) da empresa prestadora",
    sample: "20.345.678-9",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.inscricao_municipal}}",
    label: "Inscrição Municipal da Empresa",
    description: "Inscrição Municipal (I.M.) da empresa prestadora",
    sample: "43210-9",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.endereco}}",
    label: "Endereço Completo da Empresa",
    description: "Endereço unificado da sede da sua empresa",
    sample: "Rua Treze de Maio, nº 34, Boa Esperança - Parnamirim/RN",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.endereco_completo}}",
    label: "Endereço Completo com CEP (Alias)",
    description: "Endereço completo da sede da sua empresa incluindo CEP",
    sample: "Rua Treze de Maio, nº 34, Boa Esperança - Parnamirim/RN, CEP 59140-460",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.rua}}",
    label: "Rua / Logradouro da Empresa",
    description: "Logradouro ou rua onde fica a sede da sua empresa",
    sample: "Rua Treze de Maio",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.logradouro}}",
    label: "Logradouro da Empresa (Alias)",
    description: "Logradouro da sede da sua empresa",
    sample: "Rua Treze de Maio",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.numero}}",
    label: "Número do Imóvel da Empresa",
    description: "Número predial ou comercial da sede da sua empresa",
    sample: "34",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.complemento}}",
    label: "Complemento da Empresa",
    description: "Complemento de endereço da empresa (sala, galpão, bloco)",
    sample: "Sala 102",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.bairro}}",
    label: "Bairro da Empresa",
    description: "Bairro onde fica localizada a sede da sua empresa",
    sample: "Boa Esperança",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.cidade}}",
    label: "Cidade da Empresa",
    description: "Município onde se localiza a sede da sua empresa",
    sample: "Parnamirim",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.estado}}",
    label: "Estado (UF) da Empresa",
    description: "Sigla do estado da empresa (ex: RN, SP, PB)",
    sample: "RN",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.uf}}",
    label: "UF da Empresa (Alias)",
    description: "Sigla da unidade federativa da empresa",
    sample: "RN",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.cep}}",
    label: "CEP da Empresa",
    description: "Código de Endereçamento Postal da empresa formatado",
    sample: "59140-460",
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
  {
    tag: "{{empresa.responsavel_legal}}",
    label: "Responsável Legal da Empresa",
    description: "Nome do sócio / administrador representante legal da empresa",
    sample: "Flavio H. Ariston Oliveira",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.cpf_responsavel_legal}}",
    label: "CPF do Responsável Legal",
    description: "CPF do sócio ou representante legal que assina pela empresa",
    sample: "123.456.789-00",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.logo}}",
    label: "Logomarca da Empresa (URL / Base64)",
    description: "URL ou Base64 da logo cadastrada da empresa (use em <img src=\"{{empresa.logo}}\">)",
    sample: "/contratos/logo_empresa.jpeg",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.logo_url}}",
    label: "URL da Logomarca (Alias)",
    description: "Caminho ou link da imagem do logotipo da empresa",
    sample: "/contratos/logo_empresa.jpeg",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.logo_tag}}",
    label: "Tag HTML da Logomarca",
    description: "Elemento de imagem completo da logomarca formatado",
    sample: "<img src=\"/contratos/logo_empresa.jpeg\" alt=\"Logo da Empresa\" style=\"max-height: 80px; object-fit: contain;\" />",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.qr_code_pix}}",
    label: "QR Code PIX da Empresa (URL)",
    description: "URL da imagem do QR Code para recebimento PIX (use em <img src=\"{{empresa.qr_code_pix}}\">)",
    sample: "https://quickchart.io/qr?size=150&text=00020126360014br.gov.bcb.pix0114113651230001425204000053039865802BR5925CONFIANCA%20DEDETIZADORA%20LT6008Brasilia62290525IE430413845516745026569126304322C",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.pix_qrcode}}",
    label: "QR Code PIX da Empresa (Alias)",
    description: "Caminho ou link da imagem do QR Code de pagamento PIX",
    sample: "https://quickchart.io/qr?size=150&text=00020126360014br.gov.bcb.pix0114113651230001425204000053039865802BR5925CONFIANCA%20DEDETIZADORA%20LT6008Brasilia62290525IE430413845516745026569126304322C",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.qr_code_pix_tag}}",
    label: "Tag HTML do QR Code PIX",
    description: "Elemento de imagem completo do QR Code PIX formatado",
    sample: "<img src=\"https://quickchart.io/qr?size=150&text=00020126360014br.gov.bcb.pix0114113651230001425204000053039865802BR5925CONFIANCA%20DEDETIZADORA%20LT6008Brasilia62290525IE430413845516745026569126304322C\" alt=\"QR Code PIX\" style=\"max-width: 70px; mix-blend-mode: multiply;\" />",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.pix_chave}}",
    label: "Chave PIX da Empresa",
    description: "Chave PIX cadastrada para recebimento",
    sample: "11.365.123/0001-42",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.pix_tipo}}",
    label: "Tipo de Chave PIX",
    description: "Tipo da chave cadastrada (CNPJ, Celular, E-mail, Aleatória)",
    sample: "CNPJ",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.assinatura}}",
    label: "Assinatura do Responsável Técnico (URL)",
    description: "URL ou Base64 da assinatura digital do responsável técnico (use em <img src=\"{{empresa.assinatura}}\">)",
    sample: "/contratos/assinatura_eletronica.jpeg",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.assinatura_tecnico}}",
    label: "Assinatura do Responsável Técnico (Alias)",
    description: "URL ou Base64 da assinatura do responsável técnico",
    sample: "/contratos/assinatura_eletronica.jpeg",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.assinatura_responsavel_tecnico}}",
    label: "Assinatura do Responsável Técnico (Completo)",
    description: "URL ou Base64 da assinatura digitalizada do RT",
    sample: "/contratos/assinatura_eletronica.jpeg",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.assinatura_digital}}",
    label: "Assinatura Digital (Alias)",
    description: "URL ou Base64 da assinatura digital do responsável técnico",
    sample: "/contratos/assinatura_eletronica.jpeg",
    category: "Sua Empresa"
  },
  {
    tag: "{{empresa.assinatura_tag}}",
    label: "Tag HTML da Assinatura Digital",
    description: "Elemento de imagem completo da assinatura do RT já estilizado",
    sample: "<img src=\"/contratos/assinatura_eletronica.jpeg\" alt=\"Assinatura do Responsável Técnico\" style=\"max-height: 80px; mix-blend-mode: multiply;\" />",
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

export function buildCompanyReplacements(company?: any): Record<string, string> {
  if (!company) return {};
  const rua = company.logradouro || "";
  const num = company.numero || "";
  const comp = company.complemento || "";
  const bairro = company.bairro || "";
  const cidade = company.cidade || "";
  const uf = company.estado || "";
  const cep = company.cep || "";
  const enderecoCompleto = [
    rua ? `${rua}${num ? `, nº ${num}` : ""}` : "",
    comp,
    bairro,
    cidade ? `${cidade}${uf ? `/${uf}` : ""}` : "",
    cep ? `CEP ${cep}` : ""
  ].filter(Boolean).join(", ");

  const pixKey = company.pixChave || "11.365.123/0001-42";
  const qrCodeUrl = `https://quickchart.io/qr?size=150&text=${encodeURIComponent(pixKey)}`;
  const logoUrl = company.logoUrl || "/contratos/logo_empresa.jpeg";
  const assinaturaUrl = company.assinaturaUrl || "/contratos/assinatura_eletronica.jpeg";

  return {
    "{{empresa.nome}}": company.nomeFantasia || company.razaoSocial || "",
    "{{empresa.razao_social}}": company.razaoSocial || "",
    "{{empresa.cnpj}}": company.cnpj || "",
    "{{empresa.inscricao_estadual}}": company.inscricaoEstadual || "",
    "{{empresa.inscricao_municipal}}": company.inscricaoMunicipal || "",
    "{{empresa.endereco}}": enderecoCompleto,
    "{{empresa.endereco_completo}}": enderecoCompleto,
    "{{empresa.rua}}": rua,
    "{{empresa.logradouro}}": rua,
    "{{empresa.numero}}": num,
    "{{empresa.complemento}}": comp,
    "{{empresa.bairro}}": bairro,
    "{{empresa.cidade}}": cidade,
    "{{empresa.estado}}": uf,
    "{{empresa.uf}}": uf,
    "{{empresa.cep}}": cep,
    "{{empresa.telefone}}": company.telefone || "",
    "{{empresa.whatsapp}}": company.whatsapp || "",
    "{{empresa.email}}": company.email || "",
    "{{empresa.alvara_sanitario}}": company.alvaraSanitario || "",
    "{{empresa.licenca_ambiental}}": company.licencaAmbiental || "",
    "{{empresa.responsavel_tecnico}}": company.responsavelTecnico || "",
    "{{empresa.responsavel_legal}}": company.responsavelLegal || "",
    "{{empresa.cpf_responsavel_legal}}": company.cpfResponsavelLegal || "",
    "{{empresa.pix_chave}}": pixKey,
    "{{empresa.pix_tipo}}": company.pixTipo || "CNPJ",
    "{{empresa.logo}}": logoUrl,
    "{{empresa.logo_url}}": logoUrl,
    "{{empresa.logo_tag}}": `<img src="${logoUrl}" alt="${company.razaoSocial || "Logo"}" style="max-height: 80px; object-fit: contain;" />`,
    "{{empresa.qr_code_pix}}": qrCodeUrl,
    "{{empresa.pix_qrcode}}": qrCodeUrl,
    "{{empresa.qr_code_pix_tag}}": `<img src="${qrCodeUrl}" alt="QR Code PIX" style="max-width: 70px; mix-blend-mode: multiply;" />`,
    "{{empresa.assinatura}}": assinaturaUrl,
    "{{empresa.assinatura_tecnico}}": assinaturaUrl,
    "{{empresa.assinatura_responsavel_tecnico}}": assinaturaUrl,
    "{{empresa.assinatura_digital}}": assinaturaUrl,
    "{{empresa.assinatura_tag}}": `<img src="${assinaturaUrl}" alt="Assinatura" style="max-height: 80px; mix-blend-mode: multiply;" />`,
  };
}
