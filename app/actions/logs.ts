"use server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/app/lib/auth";

const prisma = new PrismaClient();

export async function createLog(action: string, resource: string, details: string) {
  try {
    const session = await getSession();
    if (!session || !session.userId) return;

    await prisma.systemLog.create({
      data: {
        userId: session.userId,
        action,
        resource,
        details
      }
    });
  } catch(e) {
    console.error("Failed to create log", e);
  }
}

export async function getSystemLogs(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate && endDate ? { createdAt: { gte: startDate, lte: endDate } } : {};
  return await prisma.systemLog.findMany({
    where: dateFilter,
    include: {
      user: {
        select: {
          username: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 500
  });
}
