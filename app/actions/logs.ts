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

    let cleanResource = resource;
    if (
      cleanResource === "Minhas O.S." ||
      cleanResource === "Minhas OS" ||
      cleanResource === "Minhas Ocorrências" ||
      cleanResource === "Ordem de Serviço" ||
      cleanResource === "Ordens de Serviço" ||
      cleanResource === "OS" ||
      cleanResource === "O.S."
    ) {
      cleanResource = "Ocorrência";
    }

    let cleanDetails = details;
    if (cleanDetails) {
      cleanDetails = cleanDetails
        .replace(/Status da O\.S\.\s*/gi, 'Status da Ocorrência ')
        .replace(/Status da OS\s*/gi, 'Status da Ocorrência ')
        .replace(/O\.S\.\s*#/gi, 'Ocorrência #')
        .replace(/OS\s*#/gi, 'Ocorrência #')
        .replace(/Ordem de Serviço\s*#/gi, 'Ocorrência #')
        .replace(/Ordem de Serviço/gi, 'Ocorrência')
        .replace(/Ordens de Serviço/gi, 'Ocorrências');
    }

    const ipAddress = await getClientIp();

    await prisma.systemLog.create({
      data: {
        userId: session.userId,
        action,
        resource: cleanResource,
        details: cleanDetails,
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

