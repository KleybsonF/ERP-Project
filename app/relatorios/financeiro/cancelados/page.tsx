import { getRelatorioCanceladosData } from "@/app/actions/relatoriosFinanceiros";
import CanceladosReportClient from "./CanceladosReportClient";

export const dynamic = "force-dynamic";

export default async function CanceladosPage() {
  const data = await getRelatorioCanceladosData(5000);
  return <CanceladosReportClient initialData={data} />;
}
