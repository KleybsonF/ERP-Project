"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import L from "leaflet";
import { MapPin, Calendar, Clock, Banknote, User, FileText, Check } from "lucide-react";
import { updateOcorrencia } from "@/app/actions/ocorrencias";
import { useRouter } from "next/navigation";

// Geocode cache para não bater muito na API
const geocodeCache: Record<string, [number, number]> = {};

const statusColors: Record<string, string> = {
  "Agendada": "#3b82f6", // Blue
  "Em Andamento": "#eab308", // Yellow
  "Atrasada": "#ef4444", // Red
};

// Create custom icons based on status using a noticeable SVG teardrop
const createIcon = (color: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="40px" height="40px" stroke="white" stroke-width="1.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="white" stroke="none"></circle>
    </svg>
  `;
  return L.divIcon({
    className: "custom-pin",
    html: `<div style="display: flex; justify-content: center; align-items: center; filter: drop-shadow(0px 6px 8px rgba(0,0,0,0.6));">${svg}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36]
  });
};

const techIconUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="12" fill="#0ea5e9" stroke="#ffffff" stroke-width="3" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.4))" />
  <circle cx="16" cy="16" r="4" fill="#ffffff" />
</svg>
`);

const offlineTechIconUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="12" fill="#94a3b8" stroke="#ffffff" stroke-width="3" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.4))" />
  <circle cx="16" cy="16" r="4" fill="#ffffff" />
</svg>
`);

export default function MapClient({ initialOrders, allData }: { initialOrders: any[], allData: any }) {
  const router = useRouter();
  const { customers, serviceTypes, paymentMethods, employees } = allData || {};
  const [ordersWithCoords, setOrdersWithCoords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [osToEdit, setOsToEdit] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Agendada");
  const [paymentStatus, setPaymentStatus] = useState("Pendente");
  const [dueDate, setDueDate] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  const openEditModal = (os: any) => {
    setOsToEdit(os);
    setCustomerId(os.customerId.toString());
    setCustomerSearchTerm(os.customer.name);
    setLocationId(os.locationId.toString());
    setServiceTypeId(os.serviceTypeId.toString());
    setDate(new Date(os.scheduled_date).toISOString().split('T')[0]);
    setTime(os.scheduled_time || "");
    setAmount(os.total_amount.toString());
    setPaymentMethodId(os.paymentMethodId?.toString() || "");
    setNotes(os.notes || "");
    setStatus(os.status);
    setPaymentStatus(os.payment_status || "Pendente");
    setDueDate(os.receivables?.[0]?.due_date ? new Date(os.receivables[0].due_date).toISOString().split('T')[0] : new Date(os.scheduled_date).toISOString().split('T')[0]);
    setSelectedEmployeeIds(os.assignments?.map((a: any) => a.employeeId) || []);
  };

  useEffect(() => {
    // Auto-refresh the map data every 10 seconds to show live technician movements
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    const fetchCoords = async () => {
      const results = [];
      for (const os of initialOrders) {
        if (!os.location) continue;
        
        const loc = os.location;
        const query = `${loc.street}, ${loc.neighborhood}, ${loc.city}, ${loc.state}`;
        
        if (geocodeCache[query]) {
          results.push({ ...os, coords: geocodeCache[query] });
          continue;
        }

        try {
          // Nominatim OpenStreetMap API
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          const data = await res.json();
          
          if (data && data.length > 0) {
            const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            geocodeCache[query] = coords;
            results.push({ ...os, coords });
          } else {
            // Fallback (Somente cidade e estado se rua não encontrar)
            const fallbackQuery = `${loc.city}, ${loc.state}`;
            const resFallback = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`);
            const dataFallback = await resFallback.json();
            if (dataFallback && dataFallback.length > 0) {
              const coords: [number, number] = [parseFloat(dataFallback[0].lat), parseFloat(dataFallback[0].lon)];
              geocodeCache[query] = coords;
              results.push({ ...os, coords });
            }
          }
        } catch (e) {
          console.error("Geocode error", e);
        }
        
        // Timeout obrigatório para API pública grátis de geocoding
        await new Promise(r => setTimeout(r, 1100));
      }
      
      setOrdersWithCoords(results);
      setLoading(false);
    };
    
    fetchCoords();
  }, [initialOrders]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="flex-between">
          <h1 className="page-title" style={{ margin: 0 }}>Mapa de Ocorrências</h1>
        </div>
        <div className="glass-panel" style={{ height: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <div>Processando coordenadas e desenhando o mapa... (isso pode levar alguns segundos dependendo da quantidade)</div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}} />
        </div>
      </div>
    );
  }

  // Calculate bounds
  let center: [number, number] = [-5.79448, -35.211]; // Default (Natal, RN)
  if (ordersWithCoords.length > 0) {
    const sumLat = ordersWithCoords.reduce((sum, os) => sum + os.coords[0], 0);
    const sumLon = ordersWithCoords.reduce((sum, os) => sum + os.coords[1], 0);
    center = [sumLat / ordersWithCoords.length, sumLon / ordersWithCoords.length];
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="flex-between">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Mapa de Ocorrências</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Visualização geográfica das Ocorrências em aberto.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', background: 'rgba(15,23,42,0.6)', padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', border: '2px solid white' }}></div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Agendada</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308', border: '2px solid white' }}></div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Em Andamento</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', border: '2px solid white' }}></div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Atrasada</span>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', height: '650px', position: 'relative' }}>
        <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%', zIndex: 1 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />
          {ordersWithCoords.map(os => {
            const color = statusColors[os.status] || "#3b82f6";
            return (
              <Marker key={os.id} position={os.coords} icon={createIcon(color)}>
                <Popup className="custom-popup">
                  <div style={{ padding: '4px', minWidth: '220px' }}>
                    <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '12px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Ocorrência #{os.id} - {os.customer.name}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin size={16} color="#64748b" style={{ marginTop: '2px' }}/>
                        <span style={{ lineHeight: '1.4' }}>{os.location.street}, {os.location.neighborhood}<br/>{os.location.city} - {os.location.state}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="#64748b"/>
                        <span>{new Date(os.scheduled_date).toLocaleDateString('pt-BR')} às {os.scheduled_time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }}></div>
                        </div>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{os.status}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Banknote size={16} color={os.payment_status === 'Pago' ? '#22c55e' : '#ef4444'}/>
                        <span style={{ color: os.payment_status === 'Pago' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>Pagamento: {os.payment_status}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => openEditModal(os)}
                      style={{ 
                        display: 'block', 
                        width: '100%',
                        marginTop: '16px', 
                        padding: '10px', 
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', 
                        color: 'white', 
                        textAlign: 'center', 
                        borderRadius: '8px', 
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Abrir Ocorrências
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          {/* Técnicos */}
          {employees?.filter((emp: any) => emp.last_lat && emp.last_lng).map((emp: any) => {
            const lastDate = new Date(emp.last_location_at);
            const isOnline = (new Date().getTime() - lastDate.getTime()) < 300000; // 5 minutos
            
            const day = lastDate.getUTCDate().toString().padStart(2, '0');
            const month = (lastDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const timeStr = lastDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const isToday = new Date().toDateString() === lastDate.toDateString();
            const lastSeenStr = isToday ? `Hoje às ${timeStr}` : `${day}/${month} às ${timeStr}`;

            return (
              <Marker
                key={`emp-${emp.id}`}
                position={[emp.last_lat, emp.last_lng]}
                icon={L.icon({ iconUrl: isOnline ? techIconUrl : offlineTechIconUrl, iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] })}
              >
                <Popup className="custom-popup">
                  <div style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                      <User size={16} color={isOnline ? "#0ea5e9" : "#94a3b8"} />
                      <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{emp.name}</h4>
                    </div>
                    {isOnline ? (
                      <div style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: 600 }}>
                        🟢 Online agora
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        🔴 Desconectado<br/>Visto por último: {lastSeenStr}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        
        <style dangerouslySetInnerHTML={{__html: `
          .leaflet-container {
            background: #e5e7eb;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255,255,255,0.2);
          }
          .custom-popup .leaflet-popup-tip {
            background: rgba(255, 255, 255, 0.95);
          }
          .leaflet-popup-content {
            margin: 12px;
          }
        `}} />
      </div>

      {/* Edit Modal */}
      {osToEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2, 6, 23, 0.90)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', margin: 'auto', backgroundColor: 'rgba(15, 23, 42, 0.98)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="panel-header" style={{ margin: 0 }}>Gerenciar Ocorrência #{osToEdit.id}</h3>
              <button onClick={() => setOsToEdit(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>&times;</button>
            </div>
            
            <div className="form-grid mb-6">
              <div className="input-group">
                <label>Cliente</label>
                <input type="text" value={customerSearchTerm} disabled />
              </div>
              <div className="input-group">
                <label>Local do Atendimento</label>
                <select value={locationId} disabled>
                  <option value={locationId}>{osToEdit.location.street}, {osToEdit.location.neighborhood}</option>
                </select>
              </div>
            </div>
            
            <div className="form-grid mb-6">
              <div className="input-group">
                <label>Tipo de Serviço</label>
                <select value={serviceTypeId} disabled>
                  {serviceTypes?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Data Agendada</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ paddingLeft: '36px' }} />
                </div>
              </div>
              <div className="input-group">
                <label>Hora Prevista</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-grid mb-6">
              <div className="input-group">
                <label>Valor Total (R$)</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Forma de Pagamento</label>
                <select value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)} required>
                  <option value="" disabled>Selecione</option>
                  {paymentMethods?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Data de Vencimento</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required style={{ paddingLeft: '36px' }} />
                </div>
              </div>
            </div>

            <div className="form-grid mb-6">
              <div className="input-group">
                <label>Status Operacional</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="Agendada">Agendada</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Em execução">Em execução</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="Adiada">Adiada</option>
                </select>
              </div>
              <div className="input-group">
                <label>Status Financeiro</label>
                <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                  <option value="Pendente">Pendente</option>
                  <option value="Recebido">Recebido</option>
                  <option value="Parcial">Parcial</option>
                  <option value="Atrasado">Atrasado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            
            <div className="input-group mb-6">
              <label>Técnicos Responsáveis</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                {employees?.map((emp: any) => (
                  <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', background: selectedEmployeeIds.includes(emp.id) ? 'var(--primary-glow)' : 'transparent', border: selectedEmployeeIds.includes(emp.id) ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)', borderRadius: '6px', fontSize: '13px', transition: 'all 0.2s' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedEmployeeIds.includes(emp.id)} 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedEmployeeIds([...selectedEmployeeIds, emp.id]);
                        else setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp.id));
                      }}
                      style={{ display: 'none' }}
                    />
                    <User size={14} /> {emp.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="input-group mb-6">
              <label>Observações</label>
              <div style={{ position: 'relative' }}>
                <FileText size={16} style={{ position: 'absolute', left: '12px', top: '16px', color: 'var(--text-secondary)' }} />
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ paddingLeft: '36px', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button onClick={() => setOsToEdit(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button 
                className="btn-primary" 
                onClick={async () => {
                  setIsSaving(true);
                  await updateOcorrencia(osToEdit.id, {
                    status: status,
                    scheduled_date: new Date(date),
                    scheduled_time: time,
                    total_amount: Number(amount),
                    paymentMethodId: Number(paymentMethodId),
                    payment_status: paymentStatus,
                    notes: notes,
                    employeeIds: selectedEmployeeIds,
                    due_date: new Date(dueDate || date)
                  });
                  setOsToEdit(null);
                  setIsSaving(false);
                  router.refresh();
                }} 
                disabled={isSaving}
                style={{ background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-color))', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isSaving ? "Salvando..." : <><Check size={18}/> Salvar Alterações</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
