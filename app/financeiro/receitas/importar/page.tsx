import ImportarReceitasClient from "./ImportarReceitasClient";

export const metadata = {
  title: "Importar Contas a Receber | Sistema ERP",
  description: "Importação em lote de contas a receber via planilha Excel com prévia ampliada de até 5.000 registros."
};

export default function ImportarReceitasPage() {
  return <ImportarReceitasClient />;
}
