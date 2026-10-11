import { getStockItemById } from "@/app/actions/estoque";
import { notFound } from "next/navigation";
import EditarItemClient from "./EditarItemClient";

export default async function EditarItemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) return notFound();

  const item = await getStockItemById(id);
  if (!item) return notFound();

  return (
    <div>
      <EditarItemClient item={item} />
    </div>
  );
}
