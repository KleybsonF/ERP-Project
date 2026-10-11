import { getStockMovements, getStockItems, getWarehouses } from "@/app/actions/estoque";
import MovimentacoesClient from "./MovimentacoesClient";

export const dynamic = "force-dynamic";

export default async function MovimentacoesPage() {
  const [movements, items, warehouses] = await Promise.all([
    getStockMovements(200),
    getStockItems(),
    getWarehouses()
  ]);

  return (
    <div>
      <MovimentacoesClient
        initialMovements={movements}
        stockItems={items}
        warehouses={warehouses}
      />
    </div>
  );
}
