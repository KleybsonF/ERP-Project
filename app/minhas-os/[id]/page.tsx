import { redirect } from "next/navigation";

export default async function MinhasOsDetailPage({ params }: { params: any }) {
  const resolvedParams = await Promise.resolve(params);
  redirect(`/minhas-ocorrencias/${resolvedParams.id}`);
}

