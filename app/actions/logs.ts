"use server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/app/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
      const first = forwardedFor.split(",")[0].trim();
      if (first) return first;
    }
    const realIp = headersList.get("x-real-ip");
    if (realIp) return realIp.trim();
    const cfIp = headersList.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();
    return "127.0.0.1";
  } catch (e) {
    return "127.0.0.1";
  }
}

export async function createLog(action: string, resource: string, details: string) {
  try {
    const session = await getSession();
    if (!session || !session.userId) return;

    const ipAddress = await getClientIp();

    await prisma.systemLog.create({
      data: {
        userId: session.userId,
        action,
        resource,
        details,
        ipAddress
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

