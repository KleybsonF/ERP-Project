import { getVehicles } from "@/app/actions/veiculos";
import VeiculosClient from "./VeiculosClient";

export const metadata = {
  title: "Veículos da Frota | Administração - Sistema ERP",
  description: "Cadastro e controle de veículos e frotas da empresa"
};

export const dynamic = "force-dynamic";

export default async function VeiculosPage() {
  const vehicles = await getVehicles();
  return <VeiculosClient initialVehicles={vehicles} />;
}
