import { getServerSession } from "next-auth";
import { authOptions } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import VencimentoAnvisaClient from "./VencimentoAnvisaClient";

export default async function VencimentoAnvisaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;
  if (!["Administrador", "Gestor", "Financeiro"].includes(role)) {
    redirect("/");
  }

  return (
    <div className="layout">
      <Sidebar role={role} email={session.user.email} />
      <main className="main-content">
        <VencimentoAnvisaClient />
      </main>
    </div>
  );
}
