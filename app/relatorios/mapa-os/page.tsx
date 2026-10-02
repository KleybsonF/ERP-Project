import { getOsData } from "@/app/actions/os";
import MapWrapper from "./MapWrapper";

export default async function MapaOsPage() {
  const data = await getOsData();
  const { orders } = data;
  
  // Filtrar apenas as O.S. que estão em aberto/pendentes
  const activeOrders = orders.filter(os => 
    !os.isHidden && 
    (os.status !== "Concluída" && os.status !== "Cancelada")
  );

  return (
    <div style={{ padding: '24px' }}>
      <MapWrapper initialOrders={activeOrders} allData={data} />
    </div>
  );
}
