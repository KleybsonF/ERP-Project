"use server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

export async function getMinhasOsData() {
  const session = await getSession();
  if (!session || !session.userId) return { orders: [] };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { employeeId: true, name: true }
  });

  if (!user || !user.employeeId) return { orders: [], userName: user?.name || "Técnico" };

  const orders = await prisma.serviceOrder.findMany({
    where: {
      assignments: {
        some: { employeeId: user.employeeId }
      },
      isHidden: false
    },
    include: {
      customer: true,
      location: true,
      serviceType: true,
    },
    orderBy: { scheduled_date: "desc" }
  });

  return { orders, userName: user.name };
}

export async function getMinhasOsById(id: number) {
  const session = await getSession();
  if (!session || !session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { employeeId: true }
  });

  if (!user || !user.employeeId) return null;

  const os = await prisma.serviceOrder.findFirst({
    where: {
      id,
      assignments: { some: { employeeId: user.employeeId } }
    },
    include: {
      customer: true,
      location: true,
      serviceType: true,
      paymentMethod: true,
      assignments: { include: { employee: true } },
    }
  });

  return os;
}

export async function updateMinhasOsStatus(id: number, status: string) {
  await prisma.serviceOrder.update({
    where: { id },
    data: { status }
  });
  
  await createLog("STATUS", "Minhas Ocorrências", `Status da Ocorrência #${id} alterado para '${status}'`);
  
  revalidatePath("/minhas-os", "layout");
}

export async function updateEmployeeLocation(lat: number, lng: number) {
  const session = await getSession();
  if (!session || !session.userId) return;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { employeeId: true }
  });

  if (!user || !user.employeeId) return;

  await prisma.employee.update({
    where: { id: user.employeeId },
    data: {
      last_lat: lat,
      last_lng: lng,
      last_location_at: new Date()
    }
  });
}

export async function updateTechnicianNotes(id: number, technicianNotes: string | null) {
  await prisma.serviceOrder.update({
    where: { id },
    data: { technicianNotes }
  });
  
  await createLog("UPDATE", "Minhas Ocorrências", `Observações do técnico atualizadas na Ocorrência #${id}`);
  
  revalidatePath("/minhas-os", "layout");
}
