import NovoUsuarioClient from "./NovoUsuarioClient";

export default function NovoUsuarioPage() {
  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>Adicionar Usuário</h1>
      <NovoUsuarioClient />
    </div>
  );
}
