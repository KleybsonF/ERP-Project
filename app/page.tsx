import { getRichDashboardData } from "@/app/actions/dashboard";
import { getUserAccessibleDashboards } from "@/app/actions/dashboards";
import { getSession } from "@/app/lib/auth";
import DashboardClient from "./DashboardClient";
import { parseDateFilter } from "@/app/lib/utils";

export default async function Home(props: { 
  searchParams?: Promise<{ 
    period?: string; 
    start?: string; 
    end?: string; 
    dashboardId?: string; 
  }> 
}) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { startDate, endDate } = parseDateFilter(sp.period, sp.start, sp.end);

  const [session, accessibleDashboards, richData] = await Promise.all([
    getSession(),
    getUserAccessibleDashboards(),
    getRichDashboardData(startDate, endDate)
  ]);

  const selectedDashboardId = sp.dashboardId ? Number(sp.dashboardId) : null;
  const currentDashboard = 
    (selectedDashboardId ? accessibleDashboards.find((d: any) => d.id === selectedDashboardId) : null) ||
    accessibleDashboards.find((d: any) => d.isDefault) ||
    accessibleDashboards[0] ||
    null;

  return (
    <DashboardClient 
      accessibleDashboards={accessibleDashboards}
      currentDashboard={currentDashboard}
      richData={richData}
      userRole={session?.role || "Usuário"}
      currentPeriod={sp.period || 'mes'}
      currentStart={sp.start || ''}
      currentEnd={sp.end || ''}
    />
  );
}
