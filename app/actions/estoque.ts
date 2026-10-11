"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

// ==========================================
// 1. CATÁLOGO DE ITENS (Pré-estabelecidos)
// Obs: O cadastro do item NÃO alimenta estoque!
// ==========================================

export async function clearAllStockData() {
  await prisma.stockMovement.deleteMany({});
  await prisma.stockBalance.deleteMany({});
  await prisma.stockItem.deleteMany({});
  await prisma.warehouse.deleteMany({});

  await createLog("DELETOU", "Estoque", "Limpou e zerou todos os registros de estoque, catálogo e armazéns.");

  revalidatePath("/estoque");
  revalidatePath("/estoque/movimentacoes");
  revalidatePath("/estoque/itens");
  revalidatePath("/estoque/armazens");

  return { success: true };
}

// ------------------------------------------
// Funções de Itens (Catálogo)
// ------------------------------------------
export async function getStockItems() {
  return await prisma.stockItem.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
    include: {
      balances: {
        include: { warehouse: true }
      }
    }
  });
}

export async function getStockItemById(id: number) {
  return await prisma.stockItem.findUnique({
    where: { id },
    include: {
      balances: {
        include: { warehouse: true }
      },
      movements: {
        include: {
          warehouseOrigin: true,
          warehouseDestination: true
        },
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
  estoqueMinimo?: number;
  precoCustoPadrao?: number;
  precoVendaPadrao?: number;
  fornecedorPadrao?: string;
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
      estoqueMinimo: Number(formData.estoqueMinimo) || 0,
      precoCustoPadrao: formData.precoCustoPadrao ? Number(formData.precoCustoPadrao) : null,
      precoVendaPadrao: formData.precoVendaPadrao ? Number(formData.precoVendaPadrao) : null,
      fornecedorPadrao: formData.fornecedorPadrao || null,
      observacoes: formData.observacoes || null,
      ativo: true,
    }
  });

  await createLog("CRIOU", "Estoque", `Cadastrou o item "${item.nome}" (${item.unidade}) no catálogo de estoque.`);

  revalidatePath("/estoque");
  revalidatePath("/estoque/itens");
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
  estoqueMinimo?: number;
  precoCustoPadrao?: number;
  precoVendaPadrao?: number;
  fornecedorPadrao?: string;
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
      estoqueMinimo: Number(formData.estoqueMinimo) || 0,
      precoCustoPadrao: formData.precoCustoPadrao ? Number(formData.precoCustoPadrao) : null,
      precoVendaPadrao: formData.precoVendaPadrao ? Number(formData.precoVendaPadrao) : null,
      fornecedorPadrao: formData.fornecedorPadrao || null,
      observacoes: formData.observacoes || null,
    }
  });

  await createLog("EDITOU", "Estoque", `Atualizou os dados cadastrais do item "${item.nome}".`);

  revalidatePath("/estoque");
  revalidatePath("/estoque/itens");
  return { success: true, item };
}

export async function toggleStockItemActive(id: number) {
  const item = await prisma.stockItem.findUnique({ where: { id } });
  if (!item) throw new Error("Item não encontrado.");

  const novoStatus = !item.ativo;
  await prisma.stockItem.update({
    where: { id },
    data: { ativo: novoStatus }
  });

  await createLog("EDITOU", "Estoque", `${novoStatus ? "Reativou" : "Desativou"} o item "${item.nome}".`);

  revalidatePath("/estoque");
  revalidatePath("/estoque/itens");
  return { success: true, ativo: novoStatus };
}

// ------------------------------------------
// 2. ARMAZÉNS / LOCAIS DE ESTOQUE
// ------------------------------------------
export async function getWarehouses() {
  return await prisma.warehouse.findMany({
    orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    include: {
      balances: {
        include: { stockItem: true }
      }
    }
  });
}

export async function getWarehouseById(id: number) {
  return await prisma.warehouse.findUnique({
    where: { id },
    include: {
      balances: {
        include: { stockItem: true }
      }
    }
  });
}

export async function createWarehouse(data: {
  nome: string;
  codigo?: string;
  tipo: string;
  responsavel?: string;
  localizacao?: string;
  descricao?: string;
}) {
  const warehouse = await prisma.warehouse.create({
    data: {
      nome: data.nome,
      codigo: data.codigo || null,
      tipo: data.tipo || "Fixo",
      responsavel: data.responsavel || null,
      localizacao: data.localizacao || null,
      descricao: data.descricao || null,
      ativo: true,
    }
  });

  await createLog("CRIOU", "Estoque", `Cadastrou o armazém/local "${warehouse.nome}" (${warehouse.tipo}).`);

  revalidatePath("/estoque");
  revalidatePath("/estoque/armazens");
  return { success: true, warehouse };
}

export async function updateWarehouse(id: number, data: {
  nome: string;
  codigo?: string;
  tipo: string;
  responsavel?: string;
  localizacao?: string;
  descricao?: string;
}) {
  const warehouse = await prisma.warehouse.update({
    where: { id },
    data: {
      nome: data.nome,
      codigo: data.codigo || null,
      tipo: data.tipo,
      responsavel: data.responsavel || null,
      localizacao: data.localizacao || null,
      descricao: data.descricao || null,
    }
  });

  await createLog("EDITOU", "Estoque", `Atualizou os dados do armazém "${warehouse.nome}".`);

  revalidatePath("/estoque");
  revalidatePath("/estoque/armazens");
  return { success: true, warehouse };
}

export async function toggleWarehouseActive(id: number) {
  const wh = await prisma.warehouse.findUnique({ where: { id } });
  if (!wh) throw new Error("Armazém não encontrado.");

  const novoStatus = !wh.ativo;
  await prisma.warehouse.update({
    where: { id },
    data: { ativo: novoStatus }
  });

  await createLog("EDITOU", "Estoque", `${novoStatus ? "Reativou" : "Desativou"} o armazém "${wh.nome}".`);

  revalidatePath("/estoque");
  revalidatePath("/estoque/armazens");
  return { success: true, ativo: novoStatus };
}

// ------------------------------------------
// 3. MOVIMENTAÇÕES DE ESTOQUE
// (Compra, Venda, Comodato, Saída OS, etc)
// ------------------------------------------
export async function getStockMovements(limit = 100) {
  return await prisma.stockMovement.findMany({
    include: {
      stockItem: true,
      warehouseOrigin: true,
      warehouseDestination: true
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}

export async function createStockMovement(data: {
  stockItemId: number;
  tipo: "COMPRA" | "VENDA" | "SAIDA_SERVICO" | "COMODATO" | "TRANSFERENCIA" | "DEVOLUCAO" | "AJUSTE" | "DESCARTE";
  quantidade: number;
  warehouseOriginId?: number;
  warehouseDestinationId?: number;
  valorUnitario?: number;
  lote?: string;
  dataValidade?: string | null;
  clienteNome?: string;
  fornecedorNome?: string;
  documentoRef?: string;
  motivo?: string;
  responsavel?: string;
}) {
  const qtd = Math.abs(Number(data.quantidade));
  if (!qtd || qtd <= 0) throw new Error("A quantidade movimentada deve ser maior que zero.");

  const item = await prisma.stockItem.findUnique({ where: { id: data.stockItemId } });
  if (!item) throw new Error("Produto/Item não encontrado.");

  const valorUnit = data.valorUnitario ? Number(data.valorUnitario) : (item.precoCustoPadrao || 0);
  const valorTot = valorUnit * qtd;

  // Atualização de saldos de acordo com o tipo:
  // COMPRA ou DEVOLUCAO: aumenta o saldo no armazém de destino
  if (data.tipo === "COMPRA" || data.tipo === "DEVOLUCAO") {
    if (!data.warehouseDestinationId) throw new Error("Selecione o armazém de destino para a entrada.");
    
    await prisma.stockBalance.upsert({
      where: {
        stockItemId_warehouseId: {
          stockItemId: item.id,
          warehouseId: data.warehouseDestinationId
        }
      },
      create: {
        stockItemId: item.id,
        warehouseId: data.warehouseDestinationId,
        quantidade: qtd
      },
      update: {
        quantidade: { increment: qtd }
      }
    });
  }

  // VENDA, SAIDA_SERVICO, COMODATO ou DESCARTE: subtrai saldo do armazém de origem
  else if (data.tipo === "VENDA" || data.tipo === "SAIDA_SERVICO" || data.tipo === "COMODATO" || data.tipo === "DESCARTE") {
    if (!data.warehouseOriginId) throw new Error("Selecione o armazém de origem para a saída.");
    
    // Verifica saldo atual no armazém de origem
    const balance = await prisma.stockBalance.findUnique({
      where: {
        stockItemId_warehouseId: {
          stockItemId: item.id,
          warehouseId: data.warehouseOriginId
        }
      }
    });

    const saldoDisponivel = balance?.quantidade || 0;
    if (saldoDisponivel < qtd) {
      // Deduz mesmo assim permitindo controle de saldo em tempo real
    }

    await prisma.stockBalance.upsert({
      where: {
        stockItemId_warehouseId: {
          stockItemId: item.id,
          warehouseId: data.warehouseOriginId
        }
      },
      create: {
        stockItemId: item.id,
        warehouseId: data.warehouseOriginId,
        quantidade: -qtd
      },
      update: {
        quantidade: { decrement: qtd }
      }
    });
  }

  // TRANSFERENCIA: subtrai de Origem e incrementa em Destino
  else if (data.tipo === "TRANSFERENCIA") {
    if (!data.warehouseOriginId || !data.warehouseDestinationId) {
      throw new Error("Para transferência, informe tanto o armazém de origem quanto o de destino.");
    }
    if (data.warehouseOriginId === data.warehouseDestinationId) {
      throw new Error("O armazém de origem e destino devem ser diferentes.");
    }

    // Subtrai da origem
    await prisma.stockBalance.upsert({
      where: {
        stockItemId_warehouseId: {
          stockItemId: item.id,
          warehouseId: data.warehouseOriginId
        }
      },
      create: {
        stockItemId: item.id,
        warehouseId: data.warehouseOriginId,
        quantidade: -qtd
      },
      update: {
        quantidade: { decrement: qtd }
      }
    });

    // Incrementa no destino
    await prisma.stockBalance.upsert({
      where: {
        stockItemId_warehouseId: {
          stockItemId: item.id,
          warehouseId: data.warehouseDestinationId
        }
      },
      create: {
        stockItemId: item.id,
        warehouseId: data.warehouseDestinationId,
        quantidade: qtd
      },
      update: {
        quantidade: { increment: qtd }
      }
    });
  }

  // AJUSTE: define diretamente o novo saldo físico apurado no armazém
  else if (data.tipo === "AJUSTE") {
    const targetWhId = data.warehouseDestinationId || data.warehouseOriginId;
    if (!targetWhId) throw new Error("Selecione o armazém a ser ajustado.");

    await prisma.stockBalance.upsert({
      where: {
        stockItemId_warehouseId: {
          stockItemId: item.id,
          warehouseId: targetWhId
        }
      },
      create: {
        stockItemId: item.id,
        warehouseId: targetWhId,
        quantidade: qtd // no ajuste a quantidade informada é o saldo físico real
      },
      update: {
        quantidade: qtd
      }
    });
  }

  // Cria o registro da movimentação
  const movement = await prisma.stockMovement.create({
    data: {
      stockItemId: item.id,
      tipo: data.tipo,
      quantidade: qtd,
      warehouseOriginId: data.warehouseOriginId || null,
      warehouseDestinationId: data.warehouseDestinationId || null,
      valorUnitario: valorUnit,
      valorTotal: valorTot,
      lote: data.lote || null,
      dataValidade: data.dataValidade ? new Date(data.dataValidade) : null,
      clienteNome: data.clienteNome || null,
      fornecedorNome: data.fornecedorNome || null,
      documentoRef: data.documentoRef || null,
      motivo: data.motivo || null,
      responsavel: data.responsavel || "Usuário Logado"
    }
  });

  await createLog(
    "CRIOU",
    "Estoque",
    `Lançou movimentação [${data.tipo}] de ${qtd} ${item.unidade} do item "${item.nome}".`
  );

  revalidatePath("/estoque");
  revalidatePath("/estoque/movimentacoes");
  revalidatePath("/estoque/itens");
  revalidatePath("/estoque/armazens");

  return { success: true, movement };
}

// ------------------------------------------
// 4. POSIÇÃO GERAL DE ESTOQUE (Visão Consolidada)
// ------------------------------------------
export async function getStockOverviewData() {
  const [items, warehouses, movements] = await Promise.all([
    prisma.stockItem.findMany({
      where: { ativo: true },
      include: {
        balances: {
          include: { warehouse: true }
        }
      },
      orderBy: [{ categoria: "asc" }, { nome: "asc" }]
    }),
    prisma.warehouse.findMany({
      where: { ativo: true },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }]
    }),
    prisma.stockMovement.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        stockItem: true,
        warehouseOrigin: true,
        warehouseDestination: true
      }
    })
  ]);

  // Cálculos de KPIs
  let valorTotalPatrimonio = 0;
  let itensAbaixoMinimo = 0;
  let itensSemEstoque = 0;

  const itemsComSaldo = items.map(item => {
    const totalQty = item.balances.reduce((acc, b) => acc + b.quantidade, 0);
    const custo = item.precoCustoPadrao || 0;
    const valorItem = totalQty > 0 ? totalQty * custo : 0;
    valorTotalPatrimonio += valorItem;

    if (totalQty <= 0) {
      itensSemEstoque++;
    } else if (item.estoqueMinimo > 0 && totalQty <= item.estoqueMinimo) {
      itensAbaixoMinimo++;
    }

    return {
      ...item,
      saldoTotal: totalQty,
      valorTotal: valorItem
    };
  });

  return {
    items: itemsComSaldo,
    warehouses,
    recentMovements: movements,
    kpis: {
      totalItensCatalogo: items.length,
      totalArmazens: warehouses.length,
      valorTotalPatrimonio,
      itensAbaixoMinimo,
      itensSemEstoque
    }
  };
}
