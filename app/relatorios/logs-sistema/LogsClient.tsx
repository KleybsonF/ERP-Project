"use client";
import { Clock, User, Activity, Database, Search } from "lucide-react";
import { useState } from "react";

export default function LogsClient({ initialLogs }: { initialLogs: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredLogs = initialLogs.filter((log: any) => {
    const term = searchTerm.toLowerCase();
    const searchString = `${log.action} ${log.resource} ${log.details} ${log.user?.username || ''} ${log.user?.email || ''}`.toLowerCase();
    return searchString.includes(term);
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${day}/${month}/${year} às ${time}`;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CRIOU": return "var(--success)";
      case "EDITOU": return "var(--warning)";
      case "EXCLUIU": return "var(--danger)";
      case "LOGIN": return "var(--primary-color)";
      case "STATUS": return "var(--secondary-color)";
      default: return "var(--text-main)";
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="flex-between" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por usuário, ação ou recurso..." 
            className="input-field"
            style={{ paddingLeft: '40px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data/Hora</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuário</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ação</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recurso</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum log encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={14} color="var(--text-main)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{log.user?.username || log.user?.email || 'Sistema'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.user?.role || 'Automação'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getActionColor(log.action), fontWeight: 700, fontSize: '13px' }}>
                        <Activity size={14} />
                        {log.action}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 500 }}>
                        <Database size={14} color="var(--text-secondary)" />
                        {log.resource}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '14px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
