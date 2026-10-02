"use client";

import { useEffect } from "react";
import { updateEmployeeLocation } from "@/app/actions/minhas-os";

export default function LocationTracker() {
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    
    // Inicia o rastreamento
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        updateEmployeeLocation(pos.coords.latitude, pos.coords.longitude).catch(err => {
          console.error("Erro ao enviar localização", err);
        });
      },
      (err) => {
        console.warn("Location tracking disabled or error", err);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return null;
}
