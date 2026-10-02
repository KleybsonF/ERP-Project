import LogsClient from "./LogsClient";
import { getSystemLogs } from "@/app/actions/logs";
import { parseDateFilter } from "@/app/lib/utils";
import PeriodSelector from "@/app/components/PeriodSelector";

export default async function LogsPage(props: { searchParams?: Promise<{ period?: string, start?: string, end?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { startDate, endDate } = parseDateFilter(sp.period, sp.start, sp.end);
  const logs = await getSystemLogs(startDate, endDate);
  
  return (
    <div>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Logs do Sistema</h1>
          <p className="page-description" style={{ margin: 0, marginTop: '4px' }}>Histórico completo de ações de todos os usuários na plataforma.</p>
        </div>
        <PeriodSelector currentPeriod={sp.period || 'mes'} currentStart={sp.start || ''} currentEnd={sp.end || ''} />
      </div>
      <LogsClient initialLogs={logs} />
    </div>
  );
}
