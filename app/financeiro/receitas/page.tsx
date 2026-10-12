import ContasReceberClient from "./ContasReceberClient";
import { getReceivablesData } from "@/app/actions/financeiro";
import { parseDateFilter } from "@/app/lib/utils";
import PeriodSelector from "@/app/components/PeriodSelector";

export const metadata = {
  title: "Contas a Receber | Sistema ERP",
  description: "Gestão e controle de contas a receber e faturamento de clientes"
};

export default async function ContasReceberPage(props: { searchParams?: Promise<{ period?: string, start?: string, end?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { startDate, endDate } = parseDateFilter(sp.period, sp.start, sp.end);
  const data = await getReceivablesData(startDate, endDate);

  return (
    <div>
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Contas a Receber</h1>
          <p className="page-description" style={{ margin: 0, marginTop: "4px" }}>
            Acompanhe títulos pendentes, pagamentos de clientes e baixas de ordens de serviço.
          </p>
        </div>
        <PeriodSelector currentPeriod={sp.period || "mes"} currentStart={sp.start || ""} currentEnd={sp.end || ""} />
      </div>
      <ContasReceberClient data={data} />
    </div>
  );
}
