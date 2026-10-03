"use client";
import { ArrowLeft, User, MapPin, Wrench, Calendar, FileText, CreditCard, Users, CheckCircle, Edit2, Navigation } from "lucide-react";
import Link from "next/link";
import { updateMinhasOsStatus, updateTechnicianNotes } from "@/app/actions/minhas-os";
import { useState } from "react";

export default function MinhasOsDetailClient({ os }: { os: any }) {
  const isDone = os.status === "Concluída";
  const [newStatus, setNewStatus] = useState(os.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [techNotes, setTechNotes] = useState(os.technicianNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await updateTechnicianNotes(os.id, techNotes);
    setIsSavingNotes(false);
  };

  const handleUpdateStatus = async () => {
    if (newStatus === os.status) return;
    if (confirm(`Deseja alterar o status para '${newStatus}'?`)) {
      setIsUpdating(true);
      await updateMinhasOsStatus(os.id, newStatus);
      setIsUpdating(false);
    }
  };
  
  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' }}>
      
      <div style={{ marginBottom: '8px' }}>
        <Link 
          href="/minhas-os" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--text-secondary)', 
            textDecoration: 'none', 
            fontSize: '15px', 
            fontWeight: 600, 
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <ArrowLeft size={18} /> 
          Voltar
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
              Ocorrência <span style={{ color: 'var(--primary-color)' }}>#{os.id}</span>
            </h1>
            <span className={`badge ${isDone ? 'badge-success' : (os.status === 'Em execução' ? 'badge-warning' : 'badge-primary')}`} style={{ fontSize: '13px', padding: '6px 12px', fontWeight: 700 }}>
              {os.status}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
              <User size={20} color="var(--primary-color)" />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>{os.customer.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{os.customer.document || "Sem documento"}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(14, 165, 233, 0.15)', padding: '12px', borderRadius: '12px' }}>
                <MapPin size={20} color="#0ea5e9" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endereço</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>{os.location.street}, {os.location.neighborhood}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{os.location.city} - {os.location.state}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>CEP: {os.location.cep}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${os.location.street}, ${os.location.neighborhood}, ${os.location.city} - ${os.location.state}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'rgba(14, 165, 233, 0.15)',
                  color: '#0ea5e9',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  flex: 1
                }}
              >
                <MapPin size={16} /> Maps
              </a>
              <a 
                href={`https://waze.com/ul?q=${encodeURIComponent(`${os.location.street}, ${os.location.neighborhood}, ${os.location.city} - ${os.location.state}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  flex: 1
                }}
              >
                <Navigation size={16} /> Waze
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '8px' }}>
                <Wrench size={16} /> <span style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Serviço</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>{os.serviceType.name}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '8px' }}>
                <Calendar size={16} /> <span style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Agendamento</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>{formatDate(os.scheduled_date)}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>às {os.scheduled_time || "--:--"}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', marginBottom: '8px' }}>
                <CreditCard size={16} /> <span style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Pagamento</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>{os.paymentMethod?.name || "Não definido"}</div>
            </div>

            {os.assignments && os.assignments.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', marginBottom: '8px' }}>
                  <Users size={16} /> <span style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Equipe</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {os.assignments.map((a: any) => (
                    <span key={a.id} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {a.employee.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {os.notes && (
          <div style={{ marginTop: '16px', background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <FileText size={16} /> <span style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Observações da Gestão</span>
            </div>
            <div style={{ fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
              {os.notes}
            </div>
          </div>
        )}

        <div style={{ marginTop: '16px', background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
            <Edit2 size={16} /> <span style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Suas Observações</span>
          </div>
          <textarea
            value={techNotes}
            onChange={(e) => setTechNotes(e.target.value)}
            placeholder="Digite aqui anotações, peças usadas, pendências..."
            rows={3}
            className="input-field"
            style={{ resize: 'vertical', width: '100%', padding: '12px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '10px', fontSize: '14px' }}
          />
          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px' }}
            onClick={handleSaveNotes}
            disabled={isSavingNotes || techNotes === (os.technicianNotes || "")}
          >
            {isSavingNotes ? 'Salvando...' : 'Salvar Observações'}
          </button>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textAlign: 'center' }}>Atualizar Status</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button 
              style={{ 
                padding: '16px 8px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
                background: newStatus === 'Agendada' ? 'var(--primary-color)' : 'rgba(255,255,255,0.03)',
                color: newStatus === 'Agendada' ? '#fff' : 'var(--text-secondary)',
                border: newStatus === 'Agendada' ? 'none' : '1px solid var(--glass-border)'
              }}
              onClick={() => setNewStatus('Agendada')}
            >
              Agendada
            </button>
            <button 
              style={{ 
                padding: '16px 8px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
                background: newStatus === 'Em execução' ? 'var(--warning)' : 'rgba(255,255,255,0.03)',
                color: newStatus === 'Em execução' ? '#000' : 'var(--text-secondary)',
                border: newStatus === 'Em execução' ? 'none' : '1px solid var(--glass-border)'
              }}
              onClick={() => setNewStatus('Em execução')}
            >
              Em Execução
            </button>
            <button 
              style={{ 
                padding: '16px 8px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
                background: newStatus === 'Concluída' ? 'var(--success)' : 'rgba(255,255,255,0.03)',
                color: newStatus === 'Concluída' ? '#000' : 'var(--text-secondary)',
                border: newStatus === 'Concluída' ? 'none' : '1px solid var(--glass-border)'
              }}
              onClick={() => setNewStatus('Concluída')}
            >
              Concluída
            </button>
            <button 
              style={{ 
                padding: '16px 8px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
                background: newStatus === 'Adiada' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                color: newStatus === 'Adiada' ? '#fff' : 'var(--text-secondary)',
                border: newStatus === 'Adiada' ? 'none' : '1px solid var(--glass-border)'
              }}
              onClick={() => setNewStatus('Adiada')}
            >
              Adiada
            </button>
          </div>
          <button 
            className="btn-primary" 
            style={{ 
              padding: '16px', fontSize: '16px', width: '100%', justifyContent: 'center', marginTop: '8px', borderRadius: '12px',
              background: newStatus === os.status ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
              color: newStatus === os.status ? 'var(--text-muted)' : '#fff',
              boxShadow: newStatus === os.status ? 'none' : '0 4px 12px var(--primary-glow)'
            }}
            onClick={handleUpdateStatus}
            disabled={isUpdating || newStatus === os.status}
          >
            {isUpdating ? 'Salvando...' : 'Confirmar Alteração'}
          </button>
        </div>

      </div>
    </div>
  );
}
