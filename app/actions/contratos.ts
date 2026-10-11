"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

const DEFAULT_TEMPLATES = [
  {
    title: "Contrato de Prestação de Serviços de Controle de Pragas",
    description: "Modelo padrão e completo para desinsetização, desratização e descupinização com cláusulas de garantia e pagamento.",
    category: "Controle de Pragas",
    isDefault: true,
    content: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="font-size: 20px; text-transform: uppercase; margin: 0; color: #0f172a;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONTROLE DE PRAGAS</h1>
    <p style="margin: 6px 0 0; font-size: 13px; color: #64748b;">Instrumento Particular de Prestação de Serviços Especializados</p>
  </div>

  <p>Pelo presente instrumento particular, de um lado:</p>
  
  <p><strong>CONTRATADA:</strong> <strong>{{empresa.razao_social}}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>{{empresa.cnpj}}</strong>, com sede em {{empresa.endereco}}, doravante denominada simplesmente <strong>CONTRATADA</strong>.</p>
  
  <p><strong>CONTRATANTE:</strong> <strong>{{cliente.nome}}</strong>, inscrito no CPF/CNPJ sob o nº <strong>{{cliente.documento}}</strong>, {{cliente.rg_ie}}, telefone {{cliente.telefone}}, doravante denominado(a) simplesmente <strong>CONTRATANTE</strong>.</p>

  <p>As partes acima identificadas acordam e ajustam o presente contrato mediante as seguintes cláusulas:</p>

  <h3 style="font-size: 15px; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px;">CLÁUSULA PRIMEIRA – DO OBJETO</h3>
  <p>O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços especializados de <strong>{{servico.tipo}}</strong> no imóvel situado no seguinte endereço:</p>
  
  <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 12px 0; border-radius: 4px;">
    <strong>Local do Atendimento:</strong> {{local.endereco_completo}}
  </div>

  <h3 style="font-size: 15px; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px;">CLÁUSULA SEGUNDA – DO VALOR E CONDIÇÕES DE PAGAMENTO</h3>
  <p>Pela prestação dos serviços objeto deste contrato, o(a) CONTRATANTE pagará à CONTRATADA o valor total de <strong>{{servico.valor}}</strong> ({{servico.valor_extenso}}), através da forma de pagamento acordada: <strong>{{servico.forma_pagamento}}</strong>.</p>

  <h3 style="font-size: 15px; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px;">CLÁUSULA TERCEIRA – DA GARANTIA E ASSISTÊNCIA TÉCNICA</h3>
  <p>A CONTRATADA assegura ao CONTRATANTE a garantia técnica dos serviços prestados pelo período de <strong>{{servico.garantia_dias}}</strong>, a contar da data de execução ({{servico.data_execucao}}), com validade do certificado sanitário até <strong>{{servico.validade_anvisa}}</strong>.</p>
  <p>Durante o prazo de garantia, constatada a persistência de focos ou infestações nos locais tratados, a CONTRATADA realizará vistorias e reforços técnicos sem ônus adicional ao CONTRATANTE, desde que respeitadas as recomendações sanitárias e de higiene orientadas pelos técnicos aplicadores ({{servico.tecnicos_responsaveis}}).</p>

  <h3 style="font-size: 15px; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px;">CLÁUSULA QUARTA – DAS OBRIGAÇÕES DAS PARTES</h3>
  <p><strong>4.1. Da CONTRATADA:</strong> Empregar produtos devidamente registrados junto ao Ministério da Saúde e ANVISA, munir seus técnicos com EPIs adequados e seguir rigorosamente as boas práticas operacionais.</p>
  <p><strong>4.2. Do(a) CONTRATANTE:</strong> Permitir o livre acesso dos técnicos ao local previamente agendado para o atendimento ({{servico.data_execucao}} às {{servico.hora_execucao}}), bem como manter o local arejado e desocupado pelo tempo mínimo recomendado de segurança.</p>

  <div style="margin-top: 40px; text-align: center;">
    <p>{{data.cidade_data}}</p>
  </div>

  <table style="width: 100%; margin-top: 60px; border-collapse: collapse;">
    <tr>
      <td style="width: 48%; text-align: center; border-top: 1px solid #0f172a; padding-top: 8px;">
        <strong>CONTRATADA</strong><br/>
        {{empresa.razao_social}}<br/>
        CNPJ: {{empresa.cnpj}}
      </td>
      <td style="width: 4%;"></td>
      <td style="width: 48%; text-align: center; border-top: 1px solid #0f172a; padding-top: 8px;">
        <strong>CONTRATANTE</strong><br/>
        {{cliente.nome}}<br/>
        Doc: {{cliente.documento}}
      </td>
    </tr>
  </table>
</div>`
  },
  {
    title: "Contrato de Manutenção Preventiva Mensal e Monitoramento Contínuo",
    description: "Indicado para condomínios, comércios e indústrias com vistorias programadas e reforços periódicos.",
    category: "Manutenção Mensal",
    isDefault: false,
    content: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="font-size: 20px; text-transform: uppercase; margin: 0; color: #065f46;">CONTRATO DE MANUTENÇÃO PREVENTIVA E CONTROLE SANITÁRIO</h1>
    <p style="margin: 6px 0 0; font-size: 13px; color: #64748b;">Programa de Monitoramento Integrado e Gestão de Pragas</p>
  </div>

  <p><strong>CONTRATANTE:</strong> <strong>{{cliente.nome}}</strong>, CNPJ/CPF <strong>{{cliente.documento}}</strong>, {{cliente.rg_ie}}, com sede/residência em {{local.endereco_completo}}, representado(a) por {{cliente.responsavel}}.</p>
  <p><strong>CONTRATADA:</strong> <strong>{{empresa.razao_social}}</strong>, CNPJ <strong>{{empresa.cnpj}}</strong>, com sede em {{empresa.endereco}}.</p>

  <h3 style="font-size: 15px; color: #059669; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px;">1. DO OBJETO E PROGRAMA DE ATENDIMENTO</h3>
  <p>Constitui objeto do presente instrumento a prestação de serviços continuados de controle de vetores e pragas urbanas ({{servico.tipo}}), incluindo vistorias preventivas periódicas, substituição de iscas, monitoramento de porta-iscas e relatórios técnicos de conformidade.</p>

  <h3 style="font-size: 15px; color: #059669; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px;">2. DO VALOR MENSAL E VENCIMENTO</h3>
  <p>O(A) CONTRATANTE remunerará a CONTRATADA pela quantia mensal de <strong>{{servico.valor}}</strong> ({{servico.valor_extenso}}), com vencimento estipulado via <strong>{{servico.forma_pagamento}}</strong>.</p>

  <h3 style="font-size: 15px; color: #059669; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px;">3. DOS REFORÇOS EMERGENCIAIS</h3>
  <p>Fica acordado que quaisquer chamados emergenciais dentro do mês decorrentes de reincidência de pragas serão atendidos pela CONTRATADA sem custos adicionais de mão de obra ou aplicação de produtos.</p>

  <h3 style="font-size: 15px; color: #059669; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px;">4. DA VIGÊNCIA E RESCISÃO</h3>
  <p>Este contrato possui vigência de 12 (doze) meses a partir de {{data.atual}}, podendo ser rescindido por qualquer das partes mediante aviso prévio por escrito com antecedência mínima de 30 (trinta) dias.</p>

  <div style="margin-top: 40px; text-align: center;">
    <p>{{data.cidade_data}}</p>
  </div>

  <table style="width: 100%; margin-top: 50px; border-collapse: collapse;">
    <tr>
      <td style="width: 48%; text-align: center; border-top: 1px solid #0f172a; padding-top: 8px;">
        <strong>CONTRATADA</strong><br/>
        {{empresa.razao_social}}
      </td>
      <td style="width: 4%;"></td>
      <td style="width: 48%; text-align: center; border-top: 1px solid #0f172a; padding-top: 8px;">
        <strong>CONTRATANTE</strong><br/>
        {{cliente.nome}}
      </td>
    </tr>
  </table>
</div>`
  },
  {
    title: "Termo de Garantia e Certificado Técnico de Aplicação",
    description: "Certificado objetivo para entrega ao cliente com prazos de garantia, dados da empresa e validações técnicas.",
    category: "Garantia / Certificado",
    isDefault: false,
    content: `<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 24px; border: 2px solid #0284c7; border-radius: 8px;">
  <div style="text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px;">
    <h1 style="font-size: 22px; text-transform: uppercase; margin: 0; color: #0284c7;">CERTIFICADO TÉCNICO E TERMO DE GARANTIA</h1>
    <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Comprovante Oficial de Execução Sanitária</p>
  </div>

  <div style="background-color: #f1f5f9; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px;">
    <p style="margin: 0 0 6px 0;"><strong>Cliente:</strong> {{cliente.nome}} ({{cliente.documento}})</p>
    <p style="margin: 0 0 6px 0;"><strong>Endereço do Imóvel:</strong> {{local.endereco_completo}}</p>
    <p style="margin: 0;"><strong>Serviço Executado:</strong> {{servico.tipo}} • Data: {{servico.data_execucao}}</p>
  </div>

  <p>Certificamos para os devidos fins que o imóvel acima qualificado recebeu tratamento técnico especializado de desinfestação e controle de vetores, executado por profissionais capacitados e produtos de linha profissional autorizados pelo Ministério da Saúde e ANVISA.</p>

  <div style="display: flex; gap: 16px; margin: 24px 0;">
    <div style="flex: 1; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; text-align: center;">
      <span style="font-size: 12px; color: #64748b; display: block;">Período de Garantia</span>
      <strong style="font-size: 18px; color: #0f172a;">{{servico.garantia_dias}}</strong>
    </div>
    <div style="flex: 1; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; text-align: center;">
      <span style="font-size: 12px; color: #64748b; display: block;">Validade do Certificado</span>
      <strong style="font-size: 18px; color: #0284c7;">{{servico.validade_anvisa}}</strong>
    </div>
  </div>

  <h4 style="font-size: 14px; margin: 16px 0 8px 0; color: #0f172a;">RECOMENDAÇÕES PÓS-APLICAÇÃO:</h4>
  <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 13px; color: #475569;">
    <li>Aguardar o período mínimo de 4 a 6 horas para reentrada de pessoas e animais no recinto.</li>
    <li>Não lavar o chão com desinfetantes fortes ou cloro nas primeiras 48 horas nas áreas tratadas para não remover a película residual protetora.</li>
    <li>Em caso de dúvidas ou necessidade de reforço dentro do prazo de garantia, entrar em contato pelos canais oficiais: {{empresa.telefone}}.</li>
  </ul>

  <div style="text-align: center; margin-top: 40px;">
    <p style="font-size: 13px; color: #64748b;">{{data.cidade_data}}</p>
    <div style="margin-top: 30px; display: inline-block; border-top: 1px solid #0f172a; padding-top: 6px; min-width: 280px;">
      <strong>{{empresa.razao_social}}</strong><br/>
      <span style="font-size: 12px; color: #64748b;">Responsável Técnico: {{empresa.responsavel_tecnico}}</span>
    </div>
  </div>
</div>`
  }
];

export async function getContractTemplates() {
  const count = await prisma.contractTemplate.count();
  if (count === 0) {
    // Semeia modelos iniciais de alta qualidade
    for (const t of DEFAULT_TEMPLATES) {
      await prisma.contractTemplate.create({ data: t });
    }
  }

  return await prisma.contractTemplate.findMany({
    orderBy: [
      { isDefault: "desc" },
      { title: "asc" }
    ]
  });
}

export async function getContractTemplateById(id: number) {
  return await prisma.contractTemplate.findUnique({
    where: { id }
  });
}

export async function createContractTemplate(data: {
  title: string;
  description?: string;
  category?: string;
  content: string;
  isDefault?: boolean;
}) {
  if (data.isDefault) {
    await prisma.contractTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    });
  }

  const template = await prisma.contractTemplate.create({
    data: {
      title: data.title,
      description: data.description || null,
      category: data.category || "Geral",
      content: data.content,
      isDefault: !!data.isDefault
    }
  });

  await createLog("CRIOU", "Modelos de Contrato", `Modelo de contrato '${template.title}' criado.`);
  revalidatePath("/clientes/modelos-contrato");
  return template;
}

export async function updateContractTemplate(id: number, data: {
  title: string;
  description?: string;
  category?: string;
  content: string;
  isDefault?: boolean;
}) {
  if (data.isDefault) {
    await prisma.contractTemplate.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false }
    });
  }

  const template = await prisma.contractTemplate.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      category: data.category || "Geral",
      content: data.content,
      isDefault: !!data.isDefault
    }
  });

  await createLog("EDITOU", "Modelos de Contrato", `Modelo de contrato '${template.title}' (#${id}) atualizado.`);
  revalidatePath("/clientes/modelos-contrato");
  return template;
}

export async function deleteContractTemplate(id: number) {
  const template = await prisma.contractTemplate.findUnique({ where: { id } });
  if (!template) throw new Error("Modelo não encontrado.");

  await prisma.contractTemplate.delete({ where: { id } });
  await createLog("EXCLUIU", "Modelos de Contrato", `Modelo de contrato '${template.title}' (#${id}) excluído.`);
  revalidatePath("/clientes/modelos-contrato");
}

export async function duplicateContractTemplate(id: number) {
  const source = await prisma.contractTemplate.findUnique({ where: { id } });
  if (!source) throw new Error("Modelo não encontrado.");

  const clone = await prisma.contractTemplate.create({
    data: {
      title: `${source.title} (Cópia)`,
      description: source.description,
      category: source.category,
      content: source.content,
      isDefault: false
    }
  });

  await createLog("CRIOU", "Modelos de Contrato", `Modelo duplicado a partir de '${source.title}': '${clone.title}'.`);
  revalidatePath("/clientes/modelos-contrato");
  return clone;
}
