import { getDREReportData } from "@/app/actions/relatoriosFinanceiros";
import DREClient from "./DREClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DRE Gerencial - Relatórios Financeiros | ERP",
  description: "Demonstração do Resultado do Exercício consolidada mês a mês"
};

export default async function DREPage() {
  const currentYear = new Date().getFullYear();
  const data = await getDREReportData({
    year: currentYear,
    regime: "competencia",
    consider: "projetado"
  });

  return <DREClient initialData={data} />;
}
