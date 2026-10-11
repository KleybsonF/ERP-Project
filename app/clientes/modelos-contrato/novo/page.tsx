import ContratoForm from "../ContratoForm";

export const metadata = {
  title: "Cadastrar Modelo de Contrato | Sistema ERP",
  description: "Crie um novo modelo de contrato ou certificado técnico"
};

export default function NovoModeloContratoPage() {
  return <ContratoForm mode="create" />;
}
