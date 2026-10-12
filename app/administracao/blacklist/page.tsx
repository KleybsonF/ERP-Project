import { getBlacklist } from "@/app/actions/blacklist";
import BlacklistClient from "./BlacklistClient";

export const metadata = {
  title: "Blacklist | Administração - Sistema ERP",
  description: "Gerenciamento de restrições, bloqueios de inadimplência e clientes em blacklist"
};

export const dynamic = "force-dynamic";

export default async function BlacklistPage() {
  const blacklist = await getBlacklist();
  return <BlacklistClient initialList={blacklist} />;
}
