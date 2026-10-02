"use server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getDashboardStats(startDate?: Date, endDate?: Date) {
  const whereFilter = startDate && endDate ? { scheduled_date: { gte: startDate, lte: endDate } } : {};
  const receivableFilter = startDate && endDate ? { due_date: { gte: startDate, lte: endDate } } : {};

  const osCount = await prisma.serviceOrder.count({ where: { ...whereFilter, isHidden: false } });
  const agendadas = await prisma.serviceOrder.count({ where: { status: "Agendada", ...whereFilter, isHidden: false }});
  
  const receivables = await prisma.accountsReceivable.findMany({
    select: { amount: true, status: true },
    where: {
      ...receivableFilter,
      OR: [
        { orderId: null },
        { serviceOrder: { isHidden: false } }
      ]
    }
  });

  const totalRevenue = receivables.reduce((acc, r) => acc + r.amount, 0);
  const received = receivables.filter(r => r.status === "Recebido").reduce((acc, r) => acc + r.amount, 0);
  const pending = totalRevenue - received;

  return { osCount, agendadas, totalRevenue, received, pending };
}
