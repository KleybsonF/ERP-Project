"use client";

import { useState } from "react";
import { Shield, Briefcase, Wrench, User as UserIcon, Plus, Edit2, EyeOff, Eye, Search, AtSign } from "lucide-react";
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
      case 'Administrador': return <Shield size={16} />;
      case 'Financeiro': return <Briefcase size={16} />;
      case 'Técnico': return <Wrench size={16} />;
      default: return <UserIcon size={16} />;
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
            placeholder="Buscar usuário..." 
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

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Usuários da Equipe</h3>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
            <button 
              onClick={() => setActiveTab('ativos')} 
              style={{ 
                background: activeTab === 'ativos' ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none', color: activeTab === 'ativos' ? '#fff' : 'var(--text-muted)',
                padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500
              }}
            >
              Ativos
            </button>
            <button 
              onClick={() => setActiveTab('ocultos')} 
              style={{ 
                background: activeTab === 'ocultos' ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none', color: activeTab === 'ocultos' ? '#fff' : 'var(--text-muted)',
                padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500
              }}
            >
              Ocultos
            </button>
          </div>
        </div>

        <div className="table-container" style={{ margin: 0, padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600 }}>Usuário</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600 }}>Contato</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600 }}>Nível de Acesso</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <UserIcon size={32} style={{ opacity: 0.2, marginBottom: '12px', display: 'block', margin: '0 auto' }} />
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : filteredUsers.map((u, i) => {
                const roleColor = getRoleColor(u.role);
                return (
                  <tr key={u.id} style={{ 
                    borderBottom: i !== filteredUsers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    opacity: activeTab === 'ocultos' ? 0.6 : 1,
                    transition: 'background 0.2s',
                  }} className="table-row-hover">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '10px', 
                          background: `rgba(${roleColor === 'var(--primary-color)' ? '0,112,243' : '255,255,255'}, 0.08)`, 
                          color: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                          {getRoleIcon(u.role)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '15px' }}>{u.employee?.name || "Administrador Master"}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
                            <AtSign size={12} /> {u.username || "admin"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ color: 'var(--text-main)', fontSize: '14px' }}>{u.email}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
                        {u.employee?.cargo || "Sem cargo"}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        backgroundColor: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}30`,
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}>
                        {getRoleIcon(u.role)} {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <Link href={`/usuarios/editar/${u.id}`} className="btn-secondary" style={{ padding: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', borderColor: 'rgba(234, 179, 8, 0.2)' }} title="Editar">
                          <Edit2 size={16} />
                        </Link>
                        {activeTab === 'ativos' ? (
                          <button onClick={() => handleHide(u.id)} className="btn-secondary" style={{ padding: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} title="Desativar">
                            <EyeOff size={16} />
                          </button>
                        ) : (
                          <button onClick={() => handleRestore(u.id)} className="btn-secondary" style={{ padding: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', borderColor: 'rgba(34, 197, 94, 0.2)' }} title="Reativar">
                            <Eye size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
