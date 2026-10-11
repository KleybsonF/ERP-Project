import { getOcorrenciasData } from "@/app/actions/ocorrencias";
import OsClient from "@/app/os/OsClient";
import { parseDateFilter } from "@/app/lib/utils";

export default async function OcorrenciasPage(props: { searchParams?: Promise<{ period?: string, start?: string, end?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { startDate, endDate } = parseDateFilter(sp.period, sp.start, sp.end);
  const data = await getOcorrenciasData(startDate, endDate);
  
  return (
    <div>
      <OsClient data={data} currentPeriod={sp.period || 'mes'} currentStart={sp.start || ''} currentEnd={sp.end || ''} />
    </div>
  );
}
