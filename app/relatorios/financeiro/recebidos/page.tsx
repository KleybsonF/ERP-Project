import { getRelatorioRecebidosData } from "@/app/actions/relatoriosFinanceiros";
import RecebidosReportClient from "./RecebidosReportClient";

export const dynamic = "force-dynamic";

export default async function RecebidosPage() {
  const data = await getRelatorioRecebidosData(5000);
  return <RecebidosReportClient initialData={data} />;
}
