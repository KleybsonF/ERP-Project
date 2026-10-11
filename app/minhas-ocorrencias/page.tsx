import MinhasOsClient from "@/app/minhas-os/MinhasOsClient";
import { getMinhasOcorrenciasData } from "@/app/actions/minhas-ocorrencias";

export default async function MinhasOcorrenciasPage() {
  const data = await getMinhasOcorrenciasData();
  return <MinhasOsClient data={data} />;
}
