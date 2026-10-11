import { getCompanies } from "@/app/actions/empresas";
import EmpresasClient from "./EmpresasClient";

export const metadata = {
  title: "Empresas | Administração - Sistema ERP",
  description: "Cadastro e gerenciamento de empresas, filiais e dados regulatórios"
};

export default async function EmpresaPage() {
  const companies = await getCompanies();
  return <EmpresasClient initialCompanies={companies} />;
}
