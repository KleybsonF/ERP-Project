import { getOsData } from "@/app/actions/os";
import OsClient from "./OsClient";
import { parseDateFilter } from "@/app/lib/utils";

export default async function OsPage(props: { searchParams?: Promise<{ period?: string, start?: string, end?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { startDate, endDate } = parseDateFilter(sp.period, sp.start, sp.end);
  const data = await getOsData(startDate, endDate);
  
  return (
    <div>
      <OsClient data={data} currentPeriod={sp.period || 'mes'} currentStart={sp.start || ''} currentEnd={sp.end || ''} />
    </div>
  );
}
