import { getUsers } from "@/app/actions/usuarios";
import UsuariosClient from "./UsuariosClient";

export default async function UsuariosPage() {
  const users = await getUsers();
  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>Gestão de Usuários</h1>
      <UsuariosClient initialUsers={users} />
    </div>
  );
}
