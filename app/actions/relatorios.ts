"use server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getDesempenhoTecnicosData(startDate?: Date, endDate?: Date) {
  const employees = await prisma.employee.findMany({
    include: {
      assignments: {
        include: {
          serviceOrder: true
        }
      }
    }
  });

  return employees.map(emp => {
    let orders = emp.assignments.map(a => a.serviceOrder).filter(os => !os.isHidden);
    if (startDate && endDate) {
      orders = orders.filter(os => {
        const d = new Date(os.scheduled_date);
        return d >= startDate && d <= endDate;
      });
    }
    
    const concluidaCount = orders.filter(os => os.status === "Concluída").length;
    const emExecucaoCount = orders.filter(os => os.status === "Em execução").length;
    const outrasCount = orders.filter(os => !["Concluída", "Em execução"].includes(os.status)).length;
    
    const faturamento = orders
      .filter(os => os.status === "Concluída")
      .reduce((sum, os) => sum + (os.total_amount || 0), 0);

    return {
      id: emp.id,
      name: emp.name,
      cargo: emp.cargo,
      concluidaCount,
      emExecucaoCount,
      outrasCount,
      totalCount: orders.length,
      faturamento
    };
  });
}

export async function getFluxoCaixaData(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate && endDate ? { due_date: { gte: startDate, lte: endDate } } : {};
  const receivables = await prisma.accountsReceivable.findMany({
    where: {
      ...dateFilter,
      OR: [
        { orderId: null },
        { serviceOrder: { isHidden: false } }
      ]
    },
    include: { paymentMethod: true }
  });
  
  const payables = await prisma.accountsPayable.findMany({
    where: dateFilter
  });

  return { receivables, payables };
}
