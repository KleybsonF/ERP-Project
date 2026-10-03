import VencimentoAnvisaClient from "./VencimentoAnvisaClient";
import { getVencimentoAnvisaData } from "@/app/actions/relatorios";
import { parseDateFilter } from "@/app/lib/utils";

export default async function VencimentoAnvisaPage(props: { searchParams?: Promise<{ period?: string, start?: string, end?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { startDate, endDate } = parseDateFilter(sp.period, sp.start, sp.end);
  const data = await getVencimentoAnvisaData(startDate, endDate);
  
  return <VencimentoAnvisaClient data={data} currentPeriod={sp.period || 'mes'} currentStart={sp.start || ''} currentEnd={sp.end || ''} />;
}
