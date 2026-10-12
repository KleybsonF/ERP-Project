import PontosRecebimentoClient from "./PontosRecebimentoClient";
import { getCashPoints } from "@/app/actions/pontos-recebimento";

export const metadata = {
  title: "Pontos de Recebimento (Caixas) | Sistema ERP",
  description: "Cadastro e gestão de caixas físicos, contas bancárias e pontos de recebimento da empresa"
};

export default async function PontosRecebimentoPage() {
  const cashPoints = await getCashPoints();

  return (
    <div>
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Pontos de Recebimento</h1>
          <p className="page-description" style={{ margin: 0, marginTop: "4px" }}>
            Cadastre seus caixas, contas bancárias e carteiras de recebimento. Toda movimentação é vinculada a um caixa.
          </p>
        </div>
      </div>
      <PontosRecebimentoClient initialCashPoints={cashPoints} />
    </div>
  );
}
