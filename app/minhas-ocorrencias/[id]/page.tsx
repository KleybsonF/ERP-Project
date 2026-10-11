import MinhasOsDetailClient from "@/app/minhas-os/[id]/MinhasOsDetailClient";
import { getMinhasOcorrenciaById } from "@/app/actions/minhas-ocorrencias";
import { redirect } from "next/navigation";

export default async function MinhasOcorrenciasDetailPage({ params }: { params: any }) {
  const resolvedParams = await Promise.resolve(params);
  const ocorrenciaId = parseInt(resolvedParams.id, 10);
  if (isNaN(ocorrenciaId)) redirect("/minhas-ocorrencias");

  const ocorrencia = await getMinhasOcorrenciaById(ocorrenciaId);
  if (!ocorrencia) redirect("/minhas-ocorrencias");

  return <MinhasOsDetailClient os={ocorrencia} />;
}
