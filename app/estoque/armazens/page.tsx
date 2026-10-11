import { getWarehouses } from "@/app/actions/estoque";
import ArmazensClient from "./ArmazensClient";

export const dynamic = "force-dynamic";

export default async function ArmazensPage() {
  const warehouses = await getWarehouses();

  return (
    <div>
      <ArmazensClient initialWarehouses={warehouses} />
    </div>
  );
}
