"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

function revalidateAll() {
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/receitas");
  revalidatePath("/financeiro/despesas");
  revalidatePath("/financeiro/pontos-recebimento");
  revalidatePath("/");
}

export async function getCashPoints() {
  const cashPoints = await prisma.cashPoint.findMany({
    include: {
      receivables: {
        where: {
          OR: [
            { occurrenceId: null },
            { occurrence: { isHidden: false } }
          ]
        },
        include: { customer: true }
      },
      payables: {
        include: { category: true }
      }
    },
    orderBy: { id: "asc" }
  });

  return cashPoints.map((cp) => {
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalPendenteEntrada = 0;
    let totalPendenteSaida = 0;

    cp.receivables.forEach((r) => {
      if (r.status === "Recebido") {
        totalEntradas += r.amount;
      } else if (r.status !== "Cancelado") {
        totalPendenteEntrada += r.amount;
      }
    });

    cp.payables.forEach((p) => {
      if (p.status === "Pago") {
        totalSaidas += p.amount;
      } else if (p.status !== "Cancelado") {
        totalPendenteSaida += p.amount;
      }
    });

    const currentBalance = cp.initialBalance + totalEntradas - totalSaidas;

    return {
      ...cp,
      totalEntradas,
      totalSaidas,
      totalPendenteEntrada,
      totalPendenteSaida,
      currentBalance
    };
  });
}

export async function createCashPoint(data: {
  name: string;
  type: string;
  initialBalance: number;
  description?: string;
}) {
  const cp = await prisma.cashPoint.create({
    data: {
      name: data.name.trim(),
      type: data.type || "Caixa Físico",
      initialBalance: Number(data.initialBalance) || 0,
      description: data.description?.trim() || null,
      ativo: true
    }
  });

  await createLog("CRIOU", "Financeiro", `Criou o ponto de recebimento/caixa "${cp.name}" (${cp.type}) com saldo inicial de R$ ${cp.initialBalance.toFixed(2)}.`);

  revalidateAll();
  return cp;
}

export async function updateCashPoint(id: number, data: {
  name: string;
  type: string;
  initialBalance: number;
  description?: string;
  ativo?: boolean;
}) {
  const cp = await prisma.cashPoint.update({
    where: { id },
    data: {
      name: data.name.trim(),
      type: data.type,
      initialBalance: Number(data.initialBalance) || 0,
      description: data.description?.trim() || null,
      ativo: data.ativo !== undefined ? data.ativo : true
    }
  });

  await createLog("EDITOU", "Financeiro", `Atualizou os dados do ponto de recebimento/caixa #${id} ("${cp.name}").`);

  revalidateAll();
  return cp;
}

export async function toggleCashPointActive(id: number, ativo: boolean) {
  const cp = await prisma.cashPoint.update({
    where: { id },
    data: { ativo }
  });

  await createLog("STATUS", "Financeiro", `${ativo ? "Reativou" : "Desativou"} o ponto de recebimento/caixa "${cp.name}".`);

  revalidateAll();
  return cp;
}

export async function deleteCashPoint(id: number) {
  const countRec = await prisma.accountsReceivable.count({ where: { cashPointId: id } });
  const countPay = await prisma.accountsPayable.count({ where: { cashPointId: id } });

  if (countRec > 0 || countPay > 0) {
    throw new Error(`Não é possível excluir este ponto de recebimento pois existem ${countRec + countPay} movimentação(ões) vinculadas a ele. Você pode desativá-lo.`);
  }

  const cp = await prisma.cashPoint.delete({ where: { id } });

  await createLog("EXCLUIU", "Financeiro", `Excluiu o ponto de recebimento/caixa #${id} ("${cp.name}").`);

  revalidateAll();
  return cp;
}
