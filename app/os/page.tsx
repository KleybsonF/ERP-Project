import { redirect } from "next/navigation";

export default async function OsPage(props: { searchParams?: Promise<{ period?: string, start?: string, end?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const params = new URLSearchParams();
  if (sp.period) params.set("period", sp.period);
  if (sp.start) params.set("start", sp.start);
  if (sp.end) params.set("end", sp.end);
  const qs = params.toString();
  redirect(`/ocorrencias${qs ? `?${qs}` : ''}`);
}
