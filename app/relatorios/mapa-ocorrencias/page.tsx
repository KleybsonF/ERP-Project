import { getOcorrenciasData } from "@/app/actions/ocorrencias";
import MapWrapper from "@/app/relatorios/mapa-os/MapWrapper";

export default async function MapaOcorrenciasPage() {
  const data = await getOcorrenciasData();
  const { orders } = data;
  
  // Filtrar apenas as Ocorrências que estão em aberto/pendentes
  const activeOrders = orders.filter(oc => 
    !oc.isHidden && 
    (oc.status !== "Concluída" && oc.status !== "Cancelada")
  );

  return (
    <div style={{ padding: '24px' }}>
      <MapWrapper initialOrders={activeOrders} allData={data} />
    </div>
  );
}
