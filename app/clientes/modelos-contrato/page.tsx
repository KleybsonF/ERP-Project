import { getContractTemplates } from "@/app/actions/contratos";
import ModelosContratoClient from "./ModelosContratoClient";

export default async function ModelosContratoPage() {
  const templates = await getContractTemplates();
  return <ModelosContratoClient initialTemplates={templates} />;
}
