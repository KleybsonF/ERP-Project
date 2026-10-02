import FinanceiroClient from "./FinanceiroClient";
import { getFinanceiroData } from "@/app/actions/financeiro";
import { parseDateFilter } from "@/app/lib/utils";
import PeriodSelector from "@/app/components/PeriodSelector";

export default async function FinanceiroPage(props: { searchParams?: Promise<{ period?: string, start?: string, end?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { startDate, endDate } = parseDateFilter(sp.period, sp.start, sp.end);
  const data = await getFinanceiroData(startDate, endDate);
  
  return (
    <div>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Gestão Financeira</h1>
          <p className="page-description" style={{ margin: 0, marginTop: '4px' }}>Controle de receitas, despesas e emissões de títulos.</p>
        </div>
        <PeriodSelector currentPeriod={sp.period || 'mes'} currentStart={sp.start || ''} currentEnd={sp.end || ''} />
      </div>
      <FinanceiroClient data={data} />
    </div>
  );
}
