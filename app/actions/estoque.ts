"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

const DEFAULT_STOCK_ITEMS = [
  {
    nome: "K-Othrine 250 SC",
    codigo: "QUIM-001",
    categoria: "Químicos / Inseticidas",
    principioAtivo: "Deltametrina 2,5%",
    grupoQuimico: "Piretroide",
    registroMS: "3.2345.0012",
    unidade: "L",
    quantidadeAtual: 14.5,
    quantidadeMinima: 5.0,
    localizacao: "Almoxarifado Central - Prateleira A1",
    lote: "LT-2026/04",
    dataValidade: new Date("2027-08-15"),
    precoCusto: 185.0,
    precoVenda: 0.0,
    fornecedor: "Bayer Environmental Science",
    observacoes: "Inseticida piretroide concentrado para controle de baratas, moscas e mosquitos.",
    isHidden: false,
  },
  {
    nome: "Maxforce Forte Gel Baraticida",
    codigo: "QUIM-002",
    categoria: "Químicos / Inseticidas",
    principioAtivo: "Fipronil 0,05%",
    grupoQuimico: "Fenilpirazol",
    registroMS: "3.2345.0089",
    unidade: "UN",
    quantidadeAtual: 28.0,
    quantidadeMinima: 10.0,
    localizacao: "Almoxarifado Central - Gaveta B2",
    lote: "LT-2026/08",
    dataValidade: new Date("2027-11-20"),
    precoCusto: 42.5,
    precoVenda: 0.0,
    fornecedor: "Envu Saúde Ambiental",
    observacoes: "Gel isca pronto para uso, alta atratividade para baratas germânicas e americanas.",
    isHidden: false,
  },
  {
    nome: "Ratimor Bloco Parafinado Extrudado",
    codigo: "QUIM-003",
    categoria: "Raticidas",
    principioAtivo: "Brodifacoum 0,005%",
    grupoQuimico: "Cumarínico / Anticoagulante",
    registroMS: "3.4512.0034",
    unidade: "KG",
    quantidadeAtual: 3.5,
    quantidadeMinima: 8.0, // Alerta: estoque baixo!
    localizacao: "Almoxarifado Central - Pallet 02",
    lote: "RT-8841",
    dataValidade: new Date("2027-03-30"),
    precoCusto: 38.0,
    precoVenda: 0.0,
    fornecedor: "Unichem Agroquímica",
    observacoes: "Raticida dose única de alta resistência à umidade para bueiros e áreas externas.",
    isHidden: false,
  },
  {
    nome: "Pulverizador Costal de Alavanca 20L",
    codigo: "EQP-001",
    categoria: "Equipamentos / Máquinas",
    principioAtivo: null,
    grupoQuimico: null,
    registroMS: null,
    unidade: "UN",
    quantidadeAtual: 6.0,
    quantidadeMinima: 2.0,
    localizacao: "Oficina Técnica - Prateleira Máquinas",
    lote: null,
    dataValidade: null,
    precoCusto: 340.0,
    precoVenda: 0.0,
    fornecedor: "Guarany Indústria",
    observacoes: "Equipamento com câmara de pressão de latão e bico cônico regulável.",
    isHidden: false,
  },
  {
    nome: "Respirador Semifacial PFF2 com Válvula",
    codigo: "EPI-001",
    categoria: "EPIs",
    principioAtivo: null,
    grupoQuimico: null,
    registroMS: null,
    unidade: "CX",
    quantidadeAtual: 12.0,
    quantidadeMinima: 5.0,
    localizacao: "Armário de EPIs - Sala Técnica",
    lote: "CA-38504",
    dataValidade: new Date("2028-01-10"),
    precoCusto: 65.0,
    precoVenda: 0.0,
    fornecedor: "3M do Brasil",
    observacoes: "Caixa com 20 unidades. Certificado de Aprovação CA ativo.",
    isHidden: false,
  },
  {
    nome: "Porta Isca Raticida Túnel Plástico",
    codigo: "ACS-001",
    categoria: "Acessórios e Armadilhas",
    principioAtivo: null,
    grupoQuimico: null,
    registroMS: null,
    unidade: "UN",
    quantidadeAtual: 45.0,
    quantidadeMinima: 20.0,
    localizacao: "Almoxarifado Central - Prateleira D3",
    lote: null,
    dataValidade: null,
    precoCusto: 14.8,
    precoVenda: 25.0,
    fornecedor: "PlastBox Soluções",
    observacoes: "Caixa porta-isca com chave de segurança para proteção de crianças e animais.",
    isHidden: false,
  }
];

export async function getStockData() {
  const count = await prisma.stockItem.count();
  if (count === 0) {
    for (const item of DEFAULT_STOCK_ITEMS) {
      const created = await prisma.stockItem.create({ data: item });
      await prisma.stockMovement.create({
        data: {
          stockItemId: created.id,
          tipo: "ENTRADA",
          quantidade: created.quantidadeAtual,
          saldoApos: created.quantidadeAtual,
          motivo: "Implantação de Saldo Inicial de Estoque",
          origemDestino: "Inventário Inicial",
          responsavel: "Sistema ERP"
        }
      });
    }
  }

  const items = await prisma.stockItem.findMany({
    where: { isHidden: false },
    orderBy: [
      { categoria: "asc" },
      { nome: "asc" }
    ]
  });

  const now = new Date();
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

  let valorTotalEstoque = 0;
  let itensEstoqueBaixo = 0;
  let itensEsgotados = 0;
  let itensVencendo = 0;

  items.forEach(item => {
    if (item.precoCusto && item.quantidadeAtual > 0) {
      valorTotalEstoque += item.precoCusto * item.quantidadeAtual;
    }

    if (item.quantidadeAtual <= 0) {
      itensEsgotados++;
    } else if (item.quantidadeMinima > 0 && item.quantidadeAtual <= item.quantidadeMinima) {
      itensEstoqueBaixo++;
    }

    if (item.dataValidade && item.dataValidade <= thirtyDaysAhead) {
      itensVencendo++;
    }
  });

  return {
    items,
    kpis: {
      totalItens: items.length,
      valorTotalEstoque,
      itensEstoqueBaixo,
      itensEsgotados,
      itensVencendo
    }
  };
}

export async function getStockItemById(id: number) {
  return await prisma.stockItem.findUnique({
    where: { id },
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: 50
      }
    }
  });
}

export async function createStockItem(formData: {
  nome: string;
  codigo?: string;
  categoria: string;
  principioAtivo?: string;
  grupoQuimico?: string;
  registroMS?: string;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  localizacao?: string;
  lote?: string;
  dataValidade?: string | null;
  precoCusto?: number;
  precoVenda?: number;
  fornecedor?: string;
  observacoes?: string;
}) {
  const item = await prisma.stockItem.create({
    data: {
      nome: formData.nome,
      codigo: formData.codigo || null,
      categoria: formData.categoria || "Químicos / Inseticidas",
      principioAtivo: formData.principioAtivo || null,
      grupoQuimico: formData.grupoQuimico || null,
      registroMS: formData.registroMS || null,
      unidade: formData.unidade || "UN",
      quantidadeAtual: Number(formData.quantidadeAtual) || 0,
      quantidadeMinima: Number(formData.quantidadeMinima) || 0,
      localizacao: formData.localizacao || null,
      lote: formData.lote || null,
      dataValidade: formData.dataValidade ? new Date(formData.dataValidade) : null,
      precoCusto: formData.precoCusto ? Number(formData.precoCusto) : null,
      precoVenda: formData.precoVenda ? Number(formData.precoVenda) : null,
      fornecedor: formData.fornecedor || null,
      observacoes: formData.observacoes || null,
      isHidden: false,
    }
  });

  if (item.quantidadeAtual > 0) {
    await prisma.stockMovement.create({
      data: {
        stockItemId: item.id,
        tipo: "ENTRADA",
        quantidade: item.quantidadeAtual,
        saldoApos: item.quantidadeAtual,
        motivo: "Saldo Inicial de Cadastro",
        origemDestino: "Cadastro Novo",
        responsavel: "Usuário Logado"
      }
    });
  }

  await createLog("CRIOU", "Estoque", `Cadastrou o item "${item.nome}" (${item.unidade}) no estoque.`);

  revalidatePath("/estoque");
  return { success: true, item };
}

export async function updateStockItem(id: number, formData: {
  nome: string;
  codigo?: string;
  categoria: string;
  principioAtivo?: string;
  grupoQuimico?: string;
  registroMS?: string;
  unidade: string;
  quantidadeMinima: number;
  localizacao?: string;
  lote?: string;
  dataValidade?: string | null;
  precoCusto?: number;
  precoVenda?: number;
  fornecedor?: string;
  observacoes?: string;
}) {
  const item = await prisma.stockItem.update({
    where: { id },
    data: {
      nome: formData.nome,
      codigo: formData.codigo || null,
      categoria: formData.categoria,
      principioAtivo: formData.principioAtivo || null,
      grupoQuimico: formData.grupoQuimico || null,
      registroMS: formData.registroMS || null,
      unidade: formData.unidade,
      quantidadeMinima: Number(formData.quantidadeMinima) || 0,
      localizacao: formData.localizacao || null,
      lote: formData.lote || null,
      dataValidade: formData.dataValidade ? new Date(formData.dataValidade) : null,
      precoCusto: formData.precoCusto ? Number(formData.precoCusto) : null,
      precoVenda: formData.precoVenda ? Number(formData.precoVenda) : null,
      fornecedor: formData.fornecedor || null,
      observacoes: formData.observacoes || null,
    }
  });

  await createLog("EDITOU", "Estoque", `Atualizou os dados cadastrais do item "${item.nome}".`);

  revalidatePath("/estoque");
  return { success: true, item };
}

export async function adjustStock(
  itemId: number,
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE" | "DESCARTE",
  quantidade: number,
  motivo: string,
  origemDestino?: string,
  responsavel?: string
) {
  const currentItem = await prisma.stockItem.findUnique({ where: { id: itemId } });
  if (!currentItem) throw new Error("Item não encontrado no estoque.");

  let novoSaldo = currentItem.quantidadeAtual;
  const qtd = Math.abs(Number(quantidade));

  if (tipo === "ENTRADA") {
    novoSaldo += qtd;
  } else if (tipo === "SAIDA" || tipo === "DESCARTE") {
    novoSaldo = Math.max(0, novoSaldo - qtd);
  } else if (tipo === "AJUSTE") {
    novoSaldo = qtd; // no ajuste, a quantidade informada é o novo saldo real apurado
  }

  const updatedItem = await prisma.stockItem.update({
    where: { id: itemId },
    data: { quantidadeAtual: novoSaldo }
  });

  await prisma.stockMovement.create({
    data: {
      stockItemId: itemId,
      tipo,
      quantidade: tipo === "AJUSTE" ? Math.abs(novoSaldo - currentItem.quantidadeAtual) : qtd,
      saldoApos: novoSaldo,
      motivo: motivo || `Movimentação de ${tipo}`,
      origemDestino: origemDestino || null,
      responsavel: responsavel || "Operador"
    }
  });

  await createLog(
    "EDITOU",
    "Estoque",
    `Lançou movimentação [${tipo}] de ${qtd} ${currentItem.unidade} para o item "${currentItem.nome}". Novo saldo: ${novoSaldo}.`
  );

  revalidatePath("/estoque");
  return { success: true, item: updatedItem };
}

export async function toggleHideStockItem(id: number) {
  const item = await prisma.stockItem.findUnique({ where: { id } });
  if (!item) throw new Error("Item não encontrado.");

  const newStatus = !item.isHidden;
  await prisma.stockItem.update({
    where: { id },
    data: { isHidden: newStatus }
  });

  await createLog("EDITOU", "Estoque", `${newStatus ? "Ocultou" : "Reativou"} o item "${item.nome}" do estoque.`);

  revalidatePath("/estoque");
  return { success: true, isHidden: newStatus };
}
