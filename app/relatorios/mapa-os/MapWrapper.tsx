"use client";

import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("./MapClient"), { ssr: false });

export default function MapWrapper({ initialOrders, allData }: { initialOrders: any[], allData: any }) {
  return <MapClient initialOrders={initialOrders} allData={allData} />;
}
