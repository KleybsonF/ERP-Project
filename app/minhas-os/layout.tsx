import LocationTracker from "./LocationTracker";

export default function MinhasOsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LocationTracker />
      {children}
    </>
  );
}
