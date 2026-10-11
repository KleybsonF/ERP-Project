"use server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";
import { createLog } from "@/app/actions/logs";

const prisma = new PrismaClient();

export async function getMinhasOcorrenciasData() {
  const session = await getSession();
  if (!session || !session.userId) return { orders: [], occurrences: [] };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { employeeId: true, username: true, employee: { select: { name: true } } }
  });

  if (!user || !user.employeeId) return { orders: [], occurrences: [], userName: user?.employee?.name || user?.username || "Técnico" };

  const occurrences = await prisma.occurrence.findMany({
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

  return { orders: occurrences, occurrences, userName: user.employee?.name || user.username || "Técnico" };
}

export async function getMinhasOcorrenciaById(id: number) {
  const session = await getSession();
  if (!session || !session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { employeeId: true }
  });

  if (!user || !user.employeeId) return null;

  const occ = await prisma.occurrence.findFirst({
    where: {
      id,
      assignments: { some: { employeeId: user.employeeId } }
    },
    include: {
      customer: {
        include: {
          contacts: true,
        }
      },
      location: {
        include: {
          contacts: true,
        }
      },
      serviceType: true,
      paymentMethod: true,
      assignments: { include: { employee: true } },
    }
  });

  return occ;
}

export async function updateMinhasOcorrenciasStatus(id: number, status: string) {
  await prisma.occurrence.update({
    where: { id },
    data: { status }
  });
  
  await createLog("STATUS", "Ocorrência", `Status da Ocorrência #${id} alterado para '${status}'`);
  
  revalidatePath("/minhas-ocorrencias", "layout");
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
  await prisma.occurrence.update({
    where: { id },
    data: { technicianNotes }
  });
  
  await createLog("UPDATE", "Ocorrência", `Observações do técnico atualizadas na Ocorrência #${id}`);
  
  revalidatePath("/minhas-ocorrencias", "layout");
  revalidatePath("/minhas-os", "layout");
}
