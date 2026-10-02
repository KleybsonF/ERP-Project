"use client";

import { useState } from "react";
import { createUser } from "@/app/actions/usuarios";
import { UserPlus, ShieldAlert, Phone, Briefcase, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NovoUsuarioClient() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [numero, setNumero] = useState("");
  const [permissions, setPermissions] = useState("Operador");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser({ login, password, name, cargo, email, numero, permissions });
    router.push("/usuarios");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <button onClick={() => router.back()} className="btn-secondary" style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={16} /> Voltar
      </button>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ maxWidth: '800px' }}>
        <h3 className="panel-header"><UserPlus size={20} className="text-primary" /> Novo Usuário de Sistema (Equipe)</h3>
        <p className="page-description">
          Ao preencher, o sistema criará tanto a conta de acesso quanto o perfil do funcionário associado para vínculo em ordens de serviço.
        </p>

        <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>Credenciais de Login</h4>
        <div className="form-grid mb-6">
          <div className="input-group">
            <label>Username (Login)</label>
            <input placeholder="Ex: jsilva" value={login} onChange={e => setLogin(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Senha de Acesso</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '40px' }} />
              <div 
                onClick={() => setShowPassword(!showPassword)} 
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>
        </div>
        
        <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>Perfil do Funcionário</h4>
        <div className="form-grid mb-6">
          <div className="input-group">
            <label>Nome Completo</label>
            <input placeholder="João da Silva" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Cargo / Função</label>
            <div style={{ position: 'relative' }}>
              <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input placeholder="Ex: Técnico Sr" value={cargo} onChange={e => setCargo(e.target.value)} required style={{ paddingLeft: '36px' }} />
            </div>
          </div>
        </div>

        <div className="form-grid mb-6">
          <div className="input-group">
            <label>Email Pessoal/Corporativo</label>
            <input type="email" placeholder="joao@empresa.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Telefone / WhatsApp</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input placeholder="(11) 90000-0000" value={numero} onChange={e => setNumero(e.target.value)} required style={{ paddingLeft: '36px' }} />
            </div>
          </div>
        </div>

        <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>Permissões</h4>

        <div className="input-group mb-6">
          <label>Nível de Acesso (RBAC)</label>
          <div style={{ position: 'relative' }}>
            <ShieldAlert size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <select value={permissions} onChange={e => setPermissions(e.target.value)} required style={{ paddingLeft: '36px' }}>
              <option value="" disabled>Permissões</option>
              <option value="Sem Acesso">Nenhum Acesso (Apenas histórico/cadastro)</option>
              <option value="Operador">Operador (Apenas leitura/edição das suas O.S.)</option>
              <option value="Gestor">Gestor (Acesso a cadastros e O.S.)</option>
              <option value="Financeiro">Financeiro (Acesso a Dashboard Financeiro e Contas)</option>
              <option value="Administrador">Administrador (Acesso Total)</option>
            </select>
          </div>
        </div>

        <button className="btn-primary" type="submit">Cadastrar Usuário</button>
      </form>
    </div>
  );
}
