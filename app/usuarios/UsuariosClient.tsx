"use client";

import { useState } from "react";
import { ShieldAlert, Plus, Edit2, EyeOff, Eye } from "lucide-react";
import Link from "next/link";
import { hideUser, restoreUser } from "@/app/actions/usuarios";

export default function UsuariosClient({ initialUsers }: { initialUsers: any[] }) {
  const [activeTab, setActiveTab] = useState<'ativos' | 'ocultos'>('ativos');

  const filteredUsers = initialUsers.filter(u => activeTab === 'ativos' ? u.ativo : !u.ativo);

  const handleHide = async (id: number) => {
    if (confirm("Tem certeza que deseja ocultar/desativar este usuário?")) {
      await hideUser(id);
    }
  };

  const handleRestore = async (id: number) => {
    if (confirm("Tem certeza que deseja restaurar o acesso deste usuário?")) {
      await restoreUser(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-56px', marginBottom: '8px' }}>
        <Link href="/usuarios/novo" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Adicionar Usuário
        </Link>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="panel-header" style={{ marginBottom: 0 }}>Usuários da Equipe</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('ativos')} 
              className={`btn-secondary ${activeTab === 'ativos' ? 'active-tab' : ''}`}
              style={{ opacity: activeTab === 'ativos' ? 1 : 0.6 }}
            >
              Ativos
            </button>
            <button 
              onClick={() => setActiveTab('ocultos')} 
              className={`btn-secondary ${activeTab === 'ocultos' ? 'active-tab' : ''}`}
              style={{ opacity: activeTab === 'ocultos' ? 1 : 0.6 }}
            >
              Ocultos
            </button>
          </div>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Cargo</th>
                <th>Nível de Acesso</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    Nenhum usuário encontrado nesta lista.
                  </td>
                </tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} style={{ opacity: activeTab === 'ocultos' ? 0.7 : 1 }}>
                  <td style={{ fontWeight: 600 }}>@{u.username || "admin"}</td>
                  <td>{u.employee?.name || "Administrador Master"}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>{u.employee?.cargo || "-"}</td>
                  <td>
                    <span className={u.role === 'Administrador' ? 'badge badge-success' : (u.role === 'Sem Acesso' ? 'badge badge-error' : 'badge badge-warning')} style={{ backgroundColor: u.role === 'Sem Acesso' ? 'var(--error-color)' : undefined }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <Link href={`/usuarios/editar/${u.id}`} className="btn-secondary" style={{ padding: '6px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Editar">
                        <Edit2 size={16} />
                      </Link>
                      {activeTab === 'ativos' ? (
                        <button onClick={() => handleHide(u.id)} className="btn-secondary" style={{ padding: '6px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error-color)' }} title="Ocultar">
                          <EyeOff size={16} />
                        </button>
                      ) : (
                        <button onClick={() => handleRestore(u.id)} className="btn-primary" style={{ padding: '6px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Restaurar">
                          <Eye size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
