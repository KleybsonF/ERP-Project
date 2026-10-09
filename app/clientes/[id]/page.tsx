import { notFound } from "next/navigation";
import { getCustomerById } from "@/app/actions/clientes";
import ClienteDetailClient from "./ClienteDetailClient";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const customerId = parseInt(resolvedParams.id, 10);
  
  if (isNaN(customerId)) {
    notFound();
  }

  const customer = await getCustomerById(customerId);

  if (!customer) {
    notFound();
  }

  return (
    <div>
      <ClienteDetailClient customer={customer as any} />
    </div>
  );
}
