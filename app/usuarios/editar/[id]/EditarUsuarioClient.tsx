"use client";

import { useState } from "react";
import { updateUser } from "@/app/actions/usuarios";
import { UserPlus, ShieldAlert, Phone, Briefcase, ArrowLeft, Eye, EyeOff, Mail, Lock, User as UserIcon, Check, AtSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/app/lib/utils";

export default function EditarUsuarioClient({ user }: { user: any }) {
  const router = useRouter();
  const [login, setLogin] = useState(user.username || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(user.employee?.name || "");
  const [cargo, setCargo] = useState(user.employee?.cargo || "");
  const [email, setEmail] = useState(user.email || "");
  const [numero, setNumero] = useState(formatPhone(user.employee?.phone || ""));
  const [permissions, setPermissions] = useState(user.role || "Operador");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await updateUser(user.id, { login, password, name, cargo, email, numero, permissions });
    router.push("/usuarios");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
        <button onClick={() => router.back()} className="btn-secondary" style={{ padding: '10px', borderRadius: '12px' }} title="Voltar">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '24px' }}>Editar Usuário</h1>
          <p className="page-description" style={{ margin: 0, marginTop: '4px' }}>Atualize os dados e acessos de {user.employee?.name || user.username}.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Seção: Perfil Pessoal */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: 'var(--primary-color)' }}>
              <UserIcon size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Dados Pessoais e Contato</h3>
          </div>
          
          <div className="form-grid mb-6">
            <div className="input-group">
              <label>Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input placeholder="João da Silva" value={name} onChange={e => setName(e.target.value)} required style={{ paddingLeft: '44px', background: 'rgba(0,0,0,0.2)' }} />
              </div>
            </div>
            <div className="input-group">
              <label>Email Corporativo / Pessoal</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" placeholder="joao@empresa.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: '44px', background: 'rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>Cargo / Função na Empresa</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input placeholder="Ex: Técnico Sr" value={cargo} onChange={e => setCargo(e.target.value)} required style={{ paddingLeft: '44px', background: 'rgba(0,0,0,0.2)' }} />
              </div>
            </div>
            <div className="input-group">
              <label>WhatsApp / Telefone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input placeholder="(11) 90000-0000" value={numero} onChange={e => setNumero(formatPhone(e.target.value))} required style={{ paddingLeft: '44px', background: 'rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Seção: Autenticação */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: '#8b5cf6' }}>
              <Lock size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Credenciais e Acesso</h3>
          </div>
          
          <div className="form-grid mb-6">
            <div className="input-group">
              <label>Username (Login)</label>
              <div style={{ position: 'relative' }}>
                <AtSign size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input placeholder="Ex: jsilva" value={login} onChange={e => setLogin(e.target.value)} required style={{ paddingLeft: '44px', background: 'rgba(0,0,0,0.2)' }} />
              </div>
            </div>
            <div className="input-group">
              <label>Nova Senha (Deixe em branco para manter)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '44px', paddingRight: '48px', background: 'rgba(0,0,0,0.2)' }} />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>Nível de Permissão no Sistema</label>
            <div style={{ position: 'relative' }}>
              <ShieldAlert size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select value={permissions} onChange={e => setPermissions(e.target.value)} required style={{ paddingLeft: '44px', background: 'rgba(0,0,0,0.2)' }}>
                <option value="Sem Acesso">Nenhum Acesso (Apenas cadastro histórico)</option>
                <option value="Operador">Operador (Visualiza/Edita apenas as próprias O.S.)</option>
                <option value="Gestor">Gestor (Acesso completo a Cadastros e O.S.)</option>
                <option value="Financeiro">Financeiro (Acesso a Dashboard Financeiro e Contas)</option>
                <option value="Administrador">Administrador (Acesso Total ao Sistema)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn-primary" type="submit" disabled={isSubmitting} style={{ padding: '12px 32px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSubmitting ? 'Salvando...' : <><Check size={18} /> Salvar Alterações</>}
          </button>
        </div>
      </form>
    </div>
  );
}
