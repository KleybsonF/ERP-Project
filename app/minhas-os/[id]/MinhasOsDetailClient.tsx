"use client";
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Wrench, 
  Calendar, 
  Clock, 
  FileText, 
  CreditCard, 
  Users, 
  CheckCircle2, 
  Edit3, 
  Navigation, 
  Phone, 
  MessageSquare, 
  Activity, 
  AlertCircle, 
  ExternalLink,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { updateMinhasOsStatus, updateTechnicianNotes } from "@/app/actions/minhas-os";
import { useState } from "react";

export default function MinhasOsDetailClient({ os }: { os: any }) {
  const [currentStatus, setCurrentStatus] = useState(os.status);
  const [selectedStatus, setSelectedStatus] = useState(os.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const [techNotes, setTechNotes] = useState(os.technicianNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesFeedback, setNotesFeedback] = useState<string | null>(null);

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatScheduleLong = (dateStr: any) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${days[d.getUTCDay()]}, ${d.getUTCDate()} de ${months[d.getUTCMonth()]}`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Em execução":
        return {
          label: "Em Execução",
          color: "#f59e0b",
          bg: "rgba(245, 158, 11, 0.12)",
          border: "rgba(245, 158, 11, 0.3)",
          accent: "#f59e0b",
          description: "Serviço em andamento no cliente",
          icon: <Activity size={15} />,
          isPulse: true
        };
      case "Agendada":
        return {
          label: "Agendada",
          color: "var(--primary-color)",
          bg: "rgba(2, 132, 199, 0.12)",
          border: "rgba(2, 132, 199, 0.3)",
          accent: "var(--primary-color)",
          description: "Aguardando início do atendimento",
          icon: <Clock size={15} />,
          isPulse: false
        };
      case "Concluída":
        return {
          label: "Concluída",
          color: "#10b981",
          bg: "rgba(16, 185, 129, 0.12)",
          border: "rgba(16, 185, 129, 0.3)",
          accent: "#10b981",
          description: "Atendimento concluído com sucesso",
          icon: <CheckCircle2 size={15} />,
          isPulse: false
        };
      case "Adiada":
        return {
          label: "Adiada",
          color: "#8b5cf6",
          bg: "rgba(139, 92, 246, 0.12)",
          border: "rgba(139, 92, 246, 0.3)",
          accent: "#8b5cf6",
          description: "Atendimento adiado para outra data",
          icon: <Clock size={15} />,
          isPulse: false
        };
      case "Cancelada":
        return {
          label: "Cancelada",
          color: "#ef4444",
          bg: "rgba(239, 68, 68, 0.12)",
          border: "rgba(239, 68, 68, 0.3)",
          accent: "#ef4444",
          description: "Atendimento cancelado",
          icon: <AlertCircle size={15} />,
          isPulse: false
        };
      default:
        return {
          label: status,
          color: "var(--text-secondary)",
          bg: "rgba(148, 163, 184, 0.12)",
          border: "var(--glass-border)",
          accent: "var(--text-secondary)",
          description: "Status da ocorrência",
          icon: <AlertCircle size={15} />,
          isPulse: false
        };
    }
  };

  const statusConfig = getStatusConfig(currentStatus);

  const handleUpdateStatus = async () => {
    if (selectedStatus === currentStatus) return;
    setIsUpdatingStatus(true);
    setStatusFeedback(null);
    try {
      await updateMinhasOsStatus(os.id, selectedStatus);
      setCurrentStatus(selectedStatus);
      setStatusFeedback("Status atualizado com sucesso!");
      setTimeout(() => setStatusFeedback(null), 3500);
    } catch {
      setStatusFeedback("Erro ao atualizar status. Tente novamente.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setNotesFeedback(null);
    try {
      await updateTechnicianNotes(os.id, techNotes);
      setNotesFeedback("Anotações salvas com sucesso!");
      setTimeout(() => setNotesFeedback(null), 3000);
    } catch {
      setNotesFeedback("Erro ao salvar anotações.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const fullAddress = [
    os.location?.street,
    os.location?.numero,
    os.location?.neighborhood,
    os.location?.city,
    os.location?.state
  ].filter(Boolean).join(", ");

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress || "")}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(fullAddress || "")}`;

  // Extract phone contacts if available
  const customerPhones = (os.customer?.contacts || [])
    .filter((c: any) => c.value)
    .map((c: any) => ({ name: c.name || "Cliente", phone: c.value }));
  
  const locationPhones = (os.location?.contacts || [])
    .filter((c: any) => c.value)
    .map((c: any) => ({ name: c.name || "Local", phone: c.value }));

  if (os.location?.contact && !locationPhones.some((p: any) => p.phone === os.location.contact)) {
    locationPhones.push({ name: "Contato do Local", phone: os.location.contact });
  }

  const allPhones = [...customerPhones, ...locationPhones];

  const cleanPhoneForWa = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }
    return digits;
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '90px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link 
            href="/minhas-os" 
            style={{
              background: 'var(--bg-color-soft)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              textDecoration: 'none',
              flexShrink: 0
            }}
            aria-label="Voltar para a agenda"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                Ocorrência #{os.id}
              </h1>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {os.customer?.name}
            </span>
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 700,
          background: statusConfig.bg,
          color: statusConfig.color,
          border: `1px solid ${statusConfig.border}`,
          flexShrink: 0
        }}>
          {statusConfig.isPulse && (
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: statusConfig.color,
              boxShadow: `0 0 6px ${statusConfig.color}`
            }} />
          )}
          {statusConfig.icon}
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Hero Status Banner */}
      <div style={{
        background: 'var(--bg-color-soft)',
        border: '1px solid var(--glass-border)',
        borderLeft: `5px solid ${statusConfig.accent}`,
        borderRadius: '16px',
        padding: '18px 20px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: statusConfig.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Status Atual: {statusConfig.label}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {formatScheduleLong(os.scheduled_date)} às {os.scheduled_time || "--:--"}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontWeight: 500 }}>
          {statusConfig.description}
        </p>
      </div>

      {/* Quick Status Update Section */}
      <div style={{
        background: 'var(--bg-color-soft)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Atualizar Status do Atendimento
          </span>
          {statusFeedback && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: statusFeedback.includes('Erro') ? 'var(--danger)' : '#10b981' }}>
              {statusFeedback}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {[
            { id: "Agendada", label: "Agendada", color: "var(--primary-color)" },
            { id: "Em execução", label: "Em Execução", color: "#f59e0b" },
            { id: "Concluída", label: "Concluída", color: "#10b981" },
            { id: "Adiada", label: "Adiada", color: "#8b5cf6" },
          ].map(st => {
            const isSelected = selectedStatus === st.id;
            const isCurrent = currentStatus === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                style={{
                  padding: '14px 12px',
                  borderRadius: '12px',
                  border: isSelected ? `2px solid ${st.color}` : '1px solid var(--glass-border)',
                  background: isSelected ? (isCurrent ? 'var(--glass-hover)' : 'rgba(2, 132, 199, 0.08)') : 'var(--bg-color-soft)',
                  color: isSelected ? st.color : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {isCurrent && (
                  <span style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: st.color
                  }} />
                )}
                {st.label}
              </button>
            );
          })}
        </div>

        {selectedStatus !== currentStatus && (
          <button
            onClick={handleUpdateStatus}
            disabled={isUpdatingStatus}
            style={{
              marginTop: '4px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px var(--primary-glow)',
              transition: 'opacity 0.2s ease'
            }}
          >
            {isUpdatingStatus ? (
              <span>Salvando alteração...</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Confirmar mudança para: {selectedStatus}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Customer Information Card */}
      <div style={{
        background: 'var(--bg-color-soft)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(2, 132, 199, 0.1)',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cliente
            </span>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {os.customer?.name}
            </div>
          </div>
        </div>

        {os.customer?.document && (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--glass-hover)', padding: '6px 12px', borderRadius: '8px', width: 'fit-content' }}>
            CPF/CNPJ: <strong style={{ color: 'var(--text-main)' }}>{os.customer.document}</strong>
          </div>
        )}

        {/* Contact buttons if phones exist */}
        {allPhones.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Contatos Rápidos:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {allPhones.map((p: any, idx: number) => {
                const clean = cleanPhoneForWa(p.phone);
                return (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--glass-hover)',
                      border: '1px solid var(--glass-border)',
                      padding: '6px 10px',
                      borderRadius: '10px',
                      fontSize: '13px'
                    }}
                  >
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{p.name}: {p.phone}</span>
                    <a
                      href={`tel:${p.phone.replace(/\D/g, '')}`}
                      style={{
                        padding: '4px 6px',
                        borderRadius: '6px',
                        background: 'rgba(2, 132, 199, 0.12)',
                        color: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none'
                      }}
                      title="Ligar"
                    >
                      <Phone size={13} />
                    </a>
                    {clean && (
                      <a
                        href={`https://wa.me/${clean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '4px 6px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          textDecoration: 'none'
                        }}
                        title="WhatsApp"
                      >
                        <MessageSquare size={13} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Location Card with Maps & Waze */}
      <div style={{
        background: 'var(--bg-color-soft)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(2, 132, 199, 0.1)',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MapPin size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Local do Atendimento
            </span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
              {os.location?.street || "Endereço não informado"}{os.location?.numero ? `, ${os.location.numero}` : ""}
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--glass-hover)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '13px'
        }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            <strong>Bairro / Cidade:</strong> {[os.location?.neighborhood, os.location?.city, os.location?.state].filter(Boolean).join(" - ")}
          </div>
          {os.location?.cep && (
            <div style={{ color: 'var(--text-secondary)' }}>
              <strong>CEP:</strong> {os.location.cep}
            </div>
          )}
          {os.location?.pontoReferencia && (
            <div style={{ color: 'var(--text-secondary)' }}>
              <strong>Ponto de Ref.:</strong> {os.location.pontoReferencia}
            </div>
          )}
          {os.location?.complemento && (
            <div style={{ color: 'var(--text-secondary)' }}>
              <strong>Complemento:</strong> {os.location.complemento}
            </div>
          )}
        </div>

        {/* GPS Quick Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(2, 132, 199, 0.12)',
              color: 'var(--primary-color)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <Navigation size={16} />
            Google Maps
          </a>

          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <ExternalLink size={16} />
            Waze
          </a>
        </div>
      </div>

      {/* Service Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {/* Service Type */}
        <div style={{
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
            <Wrench size={16} />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Serviço</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
            {os.serviceType?.name || "Serviço"}
          </div>
        </div>

        {/* Schedule */}
        <div style={{
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
            <Calendar size={16} />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Data & Hora</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
            {formatDate(os.scheduled_date)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            às {os.scheduled_time || "--:--"}
          </div>
        </div>

        {/* Payment & Amount */}
        <div style={{
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1' }}>
            <CreditCard size={16} />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Pagamento</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
            {os.paymentMethod?.name || "Não informado"}
          </div>
          {os.total_amount > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              R$ {Number(os.total_amount).toFixed(2)}
            </div>
          )}
        </div>

        {/* Team */}
        <div style={{
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)' }}>
            <Users size={16} />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Equipe</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {os.assignments && os.assignments.length > 0 ? (
              os.assignments.map((a: any) => (
                <span 
                  key={a.id} 
                  style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: 'var(--text-main)',
                    background: 'var(--glass-hover)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  {a.employee?.name}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Apenas você</span>
            )}
          </div>
        </div>
      </div>

      {/* Management Notes */}
      {os.notes && (
        <div style={{
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
            <FileText size={16} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
              Observações da Gestão
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
            {os.notes}
          </p>
        </div>
      )}

      {/* Technician Notes */}
      <div style={{
        background: 'var(--bg-color-soft)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
            <Edit3 size={16} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Suas Anotações de Campo
            </span>
          </div>
          {notesFeedback && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
              {notesFeedback}
            </span>
          )}
        </div>

        <textarea
          value={techNotes}
          onChange={(e) => setTechNotes(e.target.value)}
          placeholder="Descreva serviços realizados, peças substituídas, recomendações ou pendências..."
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            fontSize: '14px',
            color: 'var(--text-main)',
            outline: 'none',
            resize: 'vertical',
            lineHeight: 1.4
          }}
        />

        <button
          onClick={handleSaveNotes}
          disabled={isSavingNotes || techNotes === (os.technicianNotes || "")}
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            border: 'none',
            background: techNotes === (os.technicianNotes || "") ? 'var(--glass-hover)' : 'var(--primary-color)',
            color: techNotes === (os.technicianNotes || "") ? 'var(--text-muted)' : '#ffffff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: techNotes === (os.technicianNotes || "") ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            alignSelf: 'flex-end'
          }}
        >
          {isSavingNotes ? "Salvando..." : "Salvar Anotações"}
        </button>
      </div>

    </div>
  );
}
