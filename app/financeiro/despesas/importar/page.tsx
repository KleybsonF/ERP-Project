import ImportarDespesasClient from "./ImportarDespesasClient";

export const metadata = {
  title: "Importar Contas a Pagar | Sistema ERP",
  description: "Importação em lote de despesas e contas a pagar via planilha Excel com prévia ampliada de até 5.000 registros."
};

export default function ImportarDespesasPage() {
  return <ImportarDespesasClient />;
}
