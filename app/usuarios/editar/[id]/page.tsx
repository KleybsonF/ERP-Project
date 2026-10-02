import { getUser } from "@/app/actions/usuarios";
import EditarUsuarioClient from "./EditarUsuarioClient";
import { notFound } from "next/navigation";

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(Number(id));
  if (!user) notFound();

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>Editar Usuário</h1>
      <EditarUsuarioClient user={user} />
    </div>
  );
}
