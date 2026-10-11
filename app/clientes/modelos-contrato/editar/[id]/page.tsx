import { notFound } from "next/navigation";
import { getContractTemplateById } from "@/app/actions/contratos";
import ContratoForm from "../../ContratoForm";

export const metadata = {
  title: "Editar Modelo de Contrato | Sistema ERP",
  description: "Edite o modelo de contrato e suas cláusulas"
};

interface PageProps {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function EditarModeloPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const idNum = parseInt(resolvedParams.id, 10);

  if (isNaN(idNum)) {
    notFound();
  }

  const template = await getContractTemplateById(idNum);

  if (!template) {
    notFound();
  }

  return (
    <ContratoForm
      mode="edit"
      initialData={{
        id: template.id,
        title: template.title,
        description: template.description,
        category: template.category,
        content: template.content,
        isDefault: template.isDefault
      }}
    />
  );
}
