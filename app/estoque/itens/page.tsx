import { getStockItems } from "@/app/actions/estoque";
import ItensClient from "./ItensClient";

export const dynamic = "force-dynamic";

export default async function ItensPage() {
  const items = await getStockItems();

  return (
    <div>
      <ItensClient initialItems={items} />
    </div>
  );
}
