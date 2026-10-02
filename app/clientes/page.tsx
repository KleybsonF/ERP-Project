import { getCustomers } from "@/app/actions/clientes";
import ClienteClient from "./ClienteClient";

export default async function ClientesPage() {
  const customers = await getCustomers();
  return (
    <div>
      <ClienteClient initialCustomers={customers} />
    </div>
  );
}
