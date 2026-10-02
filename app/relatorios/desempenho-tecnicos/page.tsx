import DesempenhoClient from "./DesempenhoClient";
import { getDesempenhoTecnicosData } from "@/app/actions/relatorios";
import { parseDateFilter } from "@/app/lib/utils";

export default async function DesempenhoTecnicosPage(props: { searchParams?: Promise<{ period?: string, start?: string, end?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { startDate, endDate } = parseDateFilter(sp.period, sp.start, sp.end);
  const data = await getDesempenhoTecnicosData(startDate, endDate);
  return <DesempenhoClient data={data} currentPeriod={sp.period || 'mes'} currentStart={sp.start || ''} currentEnd={sp.end || ''} />;
}
