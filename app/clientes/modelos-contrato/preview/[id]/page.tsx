import { getContractTemplateById } from "@/app/actions/contratos";
import PreviewClient from "./PreviewClient";

export const metadata = {
  title: "Pré-visualização do Modelo de Contrato | Sistema ERP",
  description: "Visualização e impressão em PDF de modelo de contrato"
};

interface PageProps {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function PreviewModeloPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const idStr = resolvedParams.id;
  const idNum = parseInt(idStr, 10);

  let template = null;
  if (!isNaN(idNum)) {
    template = await getContractTemplateById(idNum);
  }

  return (
    <PreviewClient
      initialTemplate={
        template
          ? {
              id: template.id,
              title: template.title,
              category: template.category,
              description: template.description,
              content: template.content
            }
          : null
      }
    />
  );
}
