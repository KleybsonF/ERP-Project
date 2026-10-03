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
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ marginBottom: '16px' }}>
        <Link 
          href="/minhas-os" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--text-secondary)', 
            textDecoration: 'none', 
            fontSize: '14px', 
            fontWeight: 600, 
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '24px',
            border: '1px solid var(--glass-border)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <ArrowLeft size={16} /> 
          Voltar para Lista
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', flexDirection: 'column', gap: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
            Detalhes da Ocorrência <span style={{ color: 'var(--primary-color)' }}>#{os.id}</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px', width: '100%' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status Atual:</span>
            <span className={`badge ${isDone ? 'badge-success' : (os.status === 'Em execução' ? 'badge-warning' : 'badge-primary')}`} style={{ fontSize: '14px', padding: '4px 12px', marginLeft: 'auto' }}>
              {os.status}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', marginBottom: '12px' }}>
              <User size={16} /> <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>{os.customer.name}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>{os.customer.document || "Sem documento"}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary-color)', marginBottom: '12px' }}>
              <MapPin size={16} /> <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endereço</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500 }}>{os.location.street}, {os.location.neighborhood}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>{os.location.city} - {os.location.state}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>CEP: {os.location.cep}</div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${os.location.street}, ${os.location.neighborhood}, ${os.location.city} - ${os.location.state}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: 'rgba(14, 165, 233, 0.15)',
                  color: 'var(--primary-color)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  transition: 'all 0.2s',
                  flex: 1
                }}
              >
                <MapPin size={14} /> Maps
              </a>
              <a 
                href={`https://waze.com/ul?q=${encodeURIComponent(`${os.location.street}, ${os.location.neighborhood}, ${os.location.city} - ${os.location.state}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  transition: 'all 0.2s',
                  flex: 1
                }}
              >
                <Navigation size={14} /> Waze
              </a>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '12px' }}>
              <Wrench size={16} /> <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Serviço Solicitado</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{os.serviceType.name}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '12px' }}>
              <Calendar size={16} /> <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agendamento</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{formatDate(os.scheduled_date)}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>às {os.scheduled_time || "--:--"}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', marginBottom: '12px' }}>
              <CreditCard size={16} /> <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pagamento</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500 }}>{os.paymentMethod?.name || "Não definido"}</div>
          </div>

          {os.assignments && os.assignments.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', marginBottom: '12px' }}>
                <Users size={16} /> <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Equipe Designada</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {os.assignments.map((a: any) => (
                  <span key={a.id} className="badge badge-neutral" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '13px' }}>
                    {a.employee.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {os.notes && (
          <div style={{ marginTop: '24px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              <FileText size={16} /> <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações da Gestão</span>
            </div>
            <div style={{ fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
              {os.notes}
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
            <Edit2 size={16} /> <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações do Técnico</span>
          </div>
          <textarea
            value={techNotes}
            onChange={(e) => setTechNotes(e.target.value)}
            placeholder="Adicione suas observações aqui..."
            rows={4}
            className="input-field"
            style={{ resize: 'vertical', width: '100%', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px' }}
          />
          <button 
            className="btn-primary" 
            style={{ alignSelf: 'flex-start' }}
            onClick={handleSaveNotes}
            disabled={isSavingNotes || techNotes === (os.technicianNotes || "")}
          >
            {isSavingNotes ? 'Salvando...' : 'Salvar Observações'}
          </button>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Alterar Status Operacional</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button 
              className={`badge ${newStatus === 'Agendada' ? 'badge-primary' : 'badge-neutral'}`} 
              style={{ padding: '14px 12px', cursor: 'pointer', border: newStatus === 'Agendada' ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)', fontSize: '14px', width: '100%', display: 'flex', justifyContent: 'center', transition: 'all 0.2s', background: newStatus === 'Agendada' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)' }}
              onClick={() => setNewStatus('Agendada')}
            >
              Agendada
            </button>
            <button 
              className={`badge ${newStatus === 'Em execução' ? 'badge-warning' : 'badge-neutral'}`} 
              style={{ padding: '14px 12px', cursor: 'pointer', border: newStatus === 'Em execução' ? '1px solid var(--warning)' : '1px solid var(--glass-border)', fontSize: '14px', width: '100%', display: 'flex', justifyContent: 'center', transition: 'all 0.2s', background: newStatus === 'Em execução' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.02)' }}
              onClick={() => setNewStatus('Em execução')}
            >
              Check-in
            </button>
            <button 
              className={`badge ${newStatus === 'Concluída' ? 'badge-success' : 'badge-neutral'}`} 
              style={{ padding: '14px 12px', cursor: 'pointer', border: newStatus === 'Concluída' ? '1px solid var(--success)' : '1px solid var(--glass-border)', fontSize: '14px', width: '100%', display: 'flex', justifyContent: 'center', transition: 'all 0.2s', background: newStatus === 'Concluída' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.02)' }}
              onClick={() => setNewStatus('Concluída')}
            >
              Concluída
            </button>
            <button 
              className={`badge ${newStatus === 'Adiada' || newStatus === 'Cancelada' ? 'badge-neutral' : 'badge-neutral'}`} 
              style={{ padding: '14px 12px', cursor: 'pointer', border: newStatus === 'Adiada' ? '1px solid var(--text-muted)' : '1px solid var(--glass-border)', fontSize: '14px', width: '100%', display: 'flex', justifyContent: 'center', transition: 'all 0.2s', background: newStatus === 'Adiada' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)' }}
              onClick={() => setNewStatus('Adiada')}
            >
              Adiada
            </button>
          </div>
          <button 
            className="btn-primary" 
            style={{ padding: '16px', fontSize: '15px', width: '100%', justifyContent: 'center', marginTop: '8px' }}
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
