import { getDashboards, getDashboardUsersList } from "@/app/actions/dashboards";
import DashboardsAdminClient from "./DashboardsAdminClient";

export const metadata = {
  title: "Gestão de Dashboards | Administração - Sistema ERP",
  description: "Criação, personalização de widgets, layouts e controle de permissões de dashboards"
};

export default async function DashboardsAdminPage() {
  const dashboards = await getDashboards();
  const users = await getDashboardUsersList();

  return <DashboardsAdminClient initialDashboards={dashboards} users={users} />;
}
