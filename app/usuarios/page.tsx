import { getUsers } from "@/app/actions/usuarios";
import UsuariosClient from "./UsuariosClient";

export default async function UsuariosPage() {
  const users = await getUsers();
  return <UsuariosClient initialUsers={users} />;
}
