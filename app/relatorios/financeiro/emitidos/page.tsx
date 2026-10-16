import { getRelatorioEmitidosData } from "@/app/actions/relatoriosFinanceiros";
import EmitidosReportClient from "./EmitidosReportClient";

export const dynamic = "force-dynamic";

export default async function EmitidosPage() {
  const data = await getRelatorioEmitidosData(5000);
  return <EmitidosReportClient initialData={data} />;
}
