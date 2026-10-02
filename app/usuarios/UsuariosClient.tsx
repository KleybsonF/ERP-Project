"use client";

import { useState } from "react";
import { Shield, Briefcase, Wrench, User as UserIcon, Plus, Edit2, EyeOff, Eye, Mail, Search, AtSign } from "lucide-react";
import Link from "next/link";
import { hideUser, restoreUser } from "@/app/actions/usuarios";

export default function UsuariosClient({ initialUsers }: { initialUsers: any[] }) {
  const [activeTab, setActiveTab] = useState<'ativos' | 'ocultos'>('ativos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = initialUsers.filter(u => {
    const isTabMatch = activeTab === 'ativos' ? u.ativo : !u.ativo;
    const searchString = `${u.username || ''} ${u.email} ${u.employee?.name || ''} ${u.role}`.toLowerCase();
    const isSearchMatch = searchString.includes(searchTerm.toLowerCase());
    return isTabMatch && isSearchMatch;
  });

  const handleHide = async (id: number) => {
    if (confirm("Tem certeza que deseja ocultar/desativar este usuário? Ele perderá acesso ao sistema.")) {
      await hideUser(id);
    }
  };

  const handleRestore = async (id: number) => {
    if (confirm("Tem certeza que deseja restaurar o acesso deste usuário?")) {
      await restoreUser(id);
    }
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'Administrador': return <Shield size={20} />;
      case 'Financeiro': return <Briefcase size={20} />;
      case 'Técnico': return <Wrench size={20} />;
      default: return <UserIcon size={20} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'Administrador': return 'var(--primary-color)';
      case 'Financeiro': return '#10b981'; // green
      case 'Técnico': return '#f59e0b'; // yellow
      case 'Sem Acesso': return 'var(--danger)';
      default: return '#8b5cf6'; // purple
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Top Actions */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou cargo..." 
            className="input-field"
            style={{ paddingLeft: '40px', background: 'rgba(0,0,0,0.2)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Link href="/usuarios/novo" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Adicionar Usuário
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('ativos')} 
          style={{ 
            background: 'none', border: 'none', color: activeTab === 'ativos' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'ativos' ? 600 : 400, fontSize: '15px', cursor: 'pointer', padding: '8px 16px',
            borderBottom: activeTab === 'ativos' ? '2px solid var(--primary-color)' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Equipe Ativa
        </button>
        <button 
          onClick={() => setActiveTab('ocultos')} 
          style={{ 
            background: 'none', border: 'none', color: activeTab === 'ocultos' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'ocultos' ? 600 : 400, fontSize: '15px', cursor: 'pointer', padding: '8px 16px',
            borderBottom: activeTab === 'ocultos' ? '2px solid var(--primary-color)' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Usuários Ocultos / Inativos
        </button>
      </div>

      {/* Grid de Usuários */}
      {filteredUsers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <UserIcon size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <p>Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredUsers.map(u => {
            const roleColor = getRoleColor(u.role);
            return (
              <div key={u.id} className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderTop: `4px solid ${roleColor}`, opacity: activeTab === 'ocultos' ? 0.6 : 1, transition: 'transform 0.2s', cursor: 'default' }}>
                
                {/* Header do Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '12px', 
                      background: `rgba(${roleColor === 'var(--primary-color)' ? '0,112,243' : '255,255,255'}, 0.1)`, 
                      color: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      {getRoleIcon(u.role)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{u.employee?.name || "Administrador Master"}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                        <AtSign size={12} /> {u.username || "admin"}
                      </div>
                    </div>
                  </div>
                  <span className="badge" style={{ backgroundColor: `${roleColor}20`, color: roleColor, border: `1px solid ${roleColor}40` }}>
                    {u.role}
                  </span>
                </div>

                {/* Infos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} /> {u.email}
                  </div>
                  {u.employee?.cargo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      <Briefcase size={14} style={{ color: 'var(--text-muted)' }} /> {u.employee.cargo}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <Link href={`/usuarios/editar/${u.id}`} className="btn-secondary" style={{ padding: '8px', color: 'var(--warning)', borderColor: 'rgba(234, 179, 8, 0.2)' }} title="Editar">
                    <Edit2 size={16} />
                  </Link>
                  {activeTab === 'ativos' ? (
                    <button onClick={() => handleHide(u.id)} className="btn-secondary" style={{ padding: '8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} title="Desativar">
                      <EyeOff size={16} />
                    </button>
                  ) : (
                    <button onClick={() => handleRestore(u.id)} className="btn-secondary" style={{ padding: '8px', color: 'var(--success)', borderColor: 'rgba(34, 197, 94, 0.2)' }} title="Reativar">
                      <Eye size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
