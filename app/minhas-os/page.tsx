import MinhasOsClient from "./MinhasOsClient";
import { getMinhasOsData } from "@/app/actions/minhas-os";

export default async function MinhasOsPage() {
  const data = await getMinhasOsData();
  return <MinhasOsClient data={data} />;
}
