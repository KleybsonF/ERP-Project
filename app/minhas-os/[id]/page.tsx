import MinhasOsDetailClient from "./MinhasOsDetailClient";
import { getMinhasOsById } from "@/app/actions/minhas-os";
import { redirect } from "next/navigation";

export default async function MinhasOsDetailPage({ params }: { params: any }) {
  const resolvedParams = await Promise.resolve(params);
  const osId = parseInt(resolvedParams.id, 10);
  if (isNaN(osId)) redirect("/minhas-os");

  const os = await getMinhasOsById(osId);
  if (!os) redirect("/minhas-os");

  return <MinhasOsDetailClient os={os} />;
}
