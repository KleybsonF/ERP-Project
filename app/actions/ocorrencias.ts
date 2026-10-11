"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

export async function getOcorrenciasData(startDate?: Date, endDate?: Date) {
  // Auto-seed if empty
  const stCount = await prisma.serviceType.count();
  if (stCount === 0) {
    await prisma.serviceType.createMany({
      data: [{ name: "Normal" }, { name: "Reforço" }, { name: "Cortesia" }, { name: "Retorno" }]
    });
    await prisma.paymentMethod.createMany({
      data: [{ name: "Conta" }, { name: "Dinheiro" }, { name: "Pix" }, { name: "Cartão" }, { name: "Transferência" }]
    });
  }

  const dateFilter = startDate && endDate ? { scheduled_date: { gte: startDate, lte: endDate } } : {};

  const occurrences = await prisma.occurrence.findMany({
    where: dateFilter,
    include: {
      customer: true,
      location: true,
      serviceType: true,
      assignments: { include: { employee: true } },
      visits: true,
      receivables: true,
    },
    orderBy: { scheduled_date: "desc" }
  });

  const customers = await prisma.customer.findMany({ include: { locations: true } });
  const serviceTypes = await prisma.serviceType.findMany();
  const paymentMethods = await prisma.paymentMethod.findMany();
  const employees = await prisma.employee.findMany();

  return { 
    orders: occurrences, 
    occurrences, 
    customers, 
    serviceTypes, 
    paymentMethods, 
    employees 
  };
}

// Alias for backwards compatibility
export const getOsData = getOcorrenciasData;

export async function createOcorrencia(data: {
  customerId: number;
  locationId: number;
  serviceTypeId: number;
  scheduled_date: Date;
  scheduled_time: string;
  paymentMethodId: number;
  notes: string;
  employeeIds: number[];
  due_date: Date;
  total_amount: number;
  anvisaExpiry?: Date | null;
}) {
  const occ = await prisma.occurrence.create({
    data: {
      customerId: data.customerId,
      locationId: data.locationId,
      serviceTypeId: data.serviceTypeId,
      status: "Agendada",
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      total_amount: data.total_amount,
      paymentMethodId: data.paymentMethodId,
      payment_status: "Pendente",
      notes: data.notes,
      anvisaExpiry: data.anvisaExpiry,
      assignments: {
        create: data.employeeIds.map(empId => ({
          employeeId: empId
        }))
      }
    }
  });

  // Criar entrada em Contas a Receber vinculada à ocorrência
  await prisma.accountsReceivable.create({
    data: {
      occurrenceId: occ.id,
      clientId: data.customerId,
      amount: data.total_amount,
      due_date: data.due_date,
      status: "Pendente",
      paymentMethodId: data.paymentMethodId,
    }
  });

  await createLog("CRIOU", "Ocorrência", `Ocorrência #${occ.id} agendada para ${data.scheduled_date.toISOString().split('T')[0]}`);

  revalidatePath("/ocorrencias");
  revalidatePath("/os");
  return occ;
}

// Alias for backwards compatibility
export const createOS = createOcorrencia;

export async function updateOcorrencia(id: number, data: {
  status: string;
  scheduled_date: Date;
  scheduled_time: string;
  total_amount: number;
  payment_status: string;
  notes: string;
  employeeIds: number[];
  due_date: Date;
  paymentMethodId: number;
  anvisaExpiry?: Date | null;
}) {
  await prisma.occurrence.update({
    where: { id },
    data: {
      status: data.status,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      total_amount: data.total_amount,
      paymentMethodId: data.paymentMethodId,
      payment_status: data.payment_status,
      notes: data.notes,
      anvisaExpiry: data.anvisaExpiry
    }
  });

  // Sincronizar atribuições
  await prisma.occurrenceAssignment.deleteMany({
    where: { occurrenceId: id }
  });
  if (data.employeeIds.length > 0) {
    await prisma.occurrenceAssignment.createMany({
      data: data.employeeIds.map(empId => ({
        occurrenceId: id,
        employeeId: empId
      }))
    });
  }

  // Atualizar contas a receber associadas
  const receivable = await prisma.accountsReceivable.findFirst({ where: { occurrenceId: id } });
  if (receivable) {
    await prisma.accountsReceivable.update({
      where: { id: receivable.id },
      data: {
        amount: data.total_amount,
        due_date: data.due_date,
        paymentMethodId: data.paymentMethodId,
        status: data.payment_status === "Recebido" ? "Pago" : "Pendente"
      }
    });
  }

  await createLog("EDITOU", "Ocorrência", `Ocorrência #${id} editada (Status: ${data.status})`);

  revalidatePath("/ocorrencias");
  revalidatePath("/os");
  revalidatePath("/relatorios/mapa-ocorrencias");
  revalidatePath("/relatorios/mapa-os");
}

// Alias for backwards compatibility
export const updateOS = updateOcorrencia;

export async function hideOcorrencia(id: number) {
  await prisma.occurrence.update({
    where: { id },
    data: {
      isHidden: true
    }
  });
  revalidatePath("/ocorrencias");
  revalidatePath("/os");
  revalidatePath("/relatorios/mapa-ocorrencias");
  revalidatePath("/relatorios/mapa-os");
}

// Alias for backwards compatibility
export const hideOS = hideOcorrencia;
