"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

export async function getOsData(startDate?: Date, endDate?: Date) {
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

  const orders = await prisma.serviceOrder.findMany({
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

  return { orders, customers, serviceTypes, paymentMethods, employees };
}

export async function createOS(data: {
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
}) {
  const os = await prisma.serviceOrder.create({
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
      assignments: {
        create: data.employeeIds.map(empId => ({
          employeeId: empId
        }))
      }
    }
  });

  // Automagically create a Receivable entry
  await prisma.accountsReceivable.create({
    data: {
      orderId: os.id,
      clientId: data.customerId,
      amount: data.total_amount,
      due_date: data.due_date,
      status: "Pendente",
      paymentMethodId: data.paymentMethodId,
    }
  });

  await createLog("CRIOU", "Ordem de Serviço", `O.S. #${os.id} agendada para ${data.scheduled_date.toISOString().split('T')[0]}`);

  revalidatePath("/os");
}

export async function updateOS(id: number, data: {
  status: string;
  scheduled_date: Date;
  scheduled_time: string;
  total_amount: number;
  payment_status: string;
  notes: string;
  employeeIds: number[];
  due_date: Date;
  paymentMethodId: number;
}) {
  await prisma.serviceOrder.update({
    where: { id },
    data: {
      status: data.status,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      total_amount: data.total_amount,
      paymentMethodId: data.paymentMethodId,
      payment_status: data.payment_status,
      notes: data.notes
    }
  });

  // Sync assignments
  await prisma.serviceOrderAssignment.deleteMany({
    where: { serviceOrderId: id }
  });
  if (data.employeeIds.length > 0) {
    await prisma.serviceOrderAssignment.createMany({
      data: data.employeeIds.map(empId => ({
        serviceOrderId: id,
        employeeId: empId
      }))
    });
  }

  // Update associated accountsReceivable
  const receivable = await prisma.accountsReceivable.findFirst({ where: { orderId: id } });
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


  await createLog("EDITOU", "Ordem de Serviço", `O.S. #${id} editada (Status: ${data.status})`);

  revalidatePath("/os");
  revalidatePath("/relatorios/mapa-os");
}

export async function hideOS(id: number) {
  await prisma.serviceOrder.update({
    where: { id },
    data: {
      isHidden: true
    }
  });
  revalidatePath("/os");
}
