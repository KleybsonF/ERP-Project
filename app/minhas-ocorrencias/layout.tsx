import LocationTracker from "@/app/minhas-os/LocationTracker";

export default function MinhasOcorrenciasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LocationTracker />
      {children}
    </>
  );
}
