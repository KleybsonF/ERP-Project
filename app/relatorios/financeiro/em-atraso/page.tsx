import { getRelatorioEmAtrasoData } from "@/app/actions/relatoriosFinanceiros";
import EmAtrasoReportClient from "./EmAtrasoReportClient";

export const dynamic = "force-dynamic";

export default async function EmAtrasoPage() {
  const data = await getRelatorioEmAtrasoData(5000);
  return <EmAtrasoReportClient initialData={data} />;
}
