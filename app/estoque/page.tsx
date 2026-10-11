import { getStockOverviewData } from "@/app/actions/estoque";
import EstoqueClient from "./EstoqueClient";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const stockData = await getStockOverviewData();

  return (
    <div>
      <EstoqueClient initialData={stockData} />
    </div>
  );
}
