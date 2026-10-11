import { getDashboardStats } from "@/app/actions/dashboard";
import { getFluxoCaixaData, getDesempenhoTecnicosData } from "@/app/actions/relatorios";
import { PrismaClient } from "@prisma/client";
import DashboardClient from "./DashboardClient";
import { parseDateFilter } from "@/app/lib/utils";

export default async function Home(props: { searchParams?: Promise<{ period?: string, start?: string, end?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { startDate, endDate } = parseDateFilter(sp.period, sp.start, sp.end);

  const stats = await getDashboardStats(startDate, endDate);
  const fluxo = await getFluxoCaixaData(startDate, endDate);
  const desempenho = await getDesempenhoTecnicosData(startDate, endDate);

  const prisma = new PrismaClient();
  const upcomingOs = await prisma.occurrence.findMany({
    where: { 
      status: "Agendada",
      isHidden: false,
      ...(startDate && endDate ? { scheduled_date: { gte: startDate, lte: endDate } } : {})
    },
    include: { customer: true, location: true },
    orderBy: [
      { scheduled_date: "asc" },
      { scheduled_time: "asc" }
    ],
    take: 5
  });

  return (
    <DashboardClient 
      stats={stats} 
      fluxo={fluxo} 
      desempenho={desempenho} 
      upcomingOs={upcomingOs}
      currentPeriod={sp.period || 'mes'}
      currentStart={sp.start || ''}
      currentEnd={sp.end || ''}
    />
  );
}
