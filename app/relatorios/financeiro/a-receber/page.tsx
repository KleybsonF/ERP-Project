import { getRelatorioAReceberData } from "@/app/actions/relatoriosFinanceiros";
import AReceberReportClient from "./AReceberReportClient";

export const dynamic = "force-dynamic";

export default async function AReceberPage() {
  const data = await getRelatorioAReceberData(5000);
  return <AReceberReportClient initialData={data} />;
}
