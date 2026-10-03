"use client";

import { useState, useEffect } from "react";
import { createOS, updateOS, hideOS } from "@/app/actions/os";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Plus, Filter, Download, ArrowUpDown, ChevronUp, ChevronDown, Search, Calendar, MapPin, CreditCard, FileText, User } from "lucide-react";

import PeriodSelector from "@/app/components/PeriodSelector";

export default function OsClient({ data, currentPeriod, currentStart, currentEnd }: { data: any, currentPeriod: string, currentStart: string, currentEnd: string }) {
  const { orders: initialOrders, customers, serviceTypes, paymentMethods, employees } = data;
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get('editId');
      if (editId) {
        const osToEdit = initialOrders.find((o: any) => o.id.toString() === editId);
        if (osToEdit) {
          setTimeout(() => openEditModal(osToEdit), 100);
          window.history.replaceState({}, '', '/os');
        }
      }
    }
  }, [initialOrders]);
  
  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedOs, setSelectedOs] = useState<any>(null);

  // Form State
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
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
  const [anvisaExpiry, setAnvisaExpiry] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  // Filters State
  const [filterId, setFilterId] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterVisibility, setFilterVisibility] = useState<"ativos" | "ocultos" | "todos">("ativos");

  // Sorting State
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openNewModal = () => {
    setSelectedOs(null);
    setCustomerId(""); setCustomerSearchTerm(""); setLocationId(""); setServiceTypeId("");
    setDate(""); setTime(""); setAmount(""); setPaymentMethodId(""); setNotes("");
    setStatus("Agendada"); setPaymentStatus("Pendente");
    setDueDate("");
    setAnvisaExpiry("");
    setSelectedEmployeeIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (os: any) => {
    setSelectedOs(os);
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
    setAnvisaExpiry(os.anvisaExpiry ? new Date(os.anvisaExpiry).toISOString().split('T')[0] : "");
    setSelectedEmployeeIds(os.assignments?.map((a: any) => a.employeeId) || []);
    setIsModalOpen(true);
  };

  const handleHideOs = async () => {
    if (!selectedOs) return;
    if (confirm("Tem certeza que deseja ocultar esta OS? Ela não aparecerá mais na listagem principal.")) {
      await hideOS(selectedOs.id);
      setIsModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedOs) {
        await updateOS(selectedOs.id, {
          status,
          scheduled_date: new Date(date),
          scheduled_time: time,
          total_amount: Number(amount),
          paymentMethodId: Number(paymentMethodId),
          payment_status: paymentStatus,
          notes,
          employeeIds: selectedEmployeeIds,
          due_date: new Date(dueDate || date),
          anvisaExpiry: anvisaExpiry ? new Date(anvisaExpiry) : null
        });
      } else {
        await createOS({
          customerId: Number(customerId),
          locationId: Number(locationId),
          serviceTypeId: Number(serviceTypeId),
          scheduled_date: new Date(date),
          scheduled_time: time,
          total_amount: Number(amount),
          paymentMethodId: Number(paymentMethodId),
          notes,
          employeeIds: selectedEmployeeIds,
          due_date: new Date(dueDate || date),
          anvisaExpiry: anvisaExpiry ? new Date(anvisaExpiry) : null
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setFilterId(""); setFilterCustomer(""); setFilterStatus(""); setFilterPayment(""); setFilterVisibility("ativos");
    setIsFilterModalOpen(false);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // derived data
  const selectedCustomer = customers.find((c: any) => c.id === Number(customerId));
  const filteredCustomerOptions = customers.filter((c: any) => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()));

  const filteredOrders = initialOrders.filter((os: any) => {
    if (filterVisibility === "ativos" && os.isHidden) return false;
    if (filterVisibility === "ocultos" && !os.isHidden) return false;

    if (filterId && !os.id.toString().includes(filterId)) return false;
    if (filterCustomer && !os.customer.name.toLowerCase().includes(filterCustomer.toLowerCase())) return false;
    if (filterStatus && os.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (filterPayment && os.payment_status?.toLowerCase() !== filterPayment.toLowerCase()) return false;
    
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a: any, b: any) => {
    let valA: any = "";
    let valB: any = "";

    switch (sortColumn) {
      case "id": valA = a.id; valB = b.id; break;
      case "customer": valA = a.customer.name.toLowerCase(); valB = b.customer.name.toLowerCase(); break;
      case "date": valA = new Date(a.scheduled_date).getTime(); valB = new Date(b.scheduled_date).getTime(); break;
      case "type": valA = a.serviceType.name.toLowerCase(); valB = b.serviceType.name.toLowerCase(); break;
      case "amount": valA = a.total_amount; valB = b.total_amount; break;
      case "status": valA = a.status.toLowerCase(); valB = b.status.toLowerCase(); break;
      case "payment": valA = a.payment_status?.toLowerCase() || ""; valB = b.payment_status?.toLowerCase() || ""; break;
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Ordens de Serviço", 14, 15);
    const tableColumn = ["ID", "Cliente", "Data", "Hora", "Tipo", "Valor (R$)", "Status", "Pagamento"];
    const tableRows: any[] = [];
    sortedOrders.forEach((os: any) => {
      tableRows.push([
        os.id, os.customer.name, formatDate(os.scheduled_date),
        os.scheduled_time || "-", os.serviceType.name, os.total_amount.toFixed(2),
        os.status, os.payment_status || "-"
      ]);
    });
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20, styles: { fontSize: 8 }, headStyles: { fillColor: [15, 23, 42] } });
    doc.save("ordens_de_servico.pdf");
  };

  const exportExcel = () => {
    const data = sortedOrders.map((os: any) => ({
      ID: os.id,
      Cliente: os.customer.name,
      Local: os.location?.street + ", " + os.location?.neighborhood,
      Data: formatDate(os.scheduled_date),
      Hora: os.scheduled_time || "-",
      Tipo: os.serviceType.name,
      Valor: os.total_amount,
      Status: os.status,
      Pagamento: os.payment_status || "-",
      Observacoes: os.notes || ""
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ordens");
    XLSX.writeFile(workbook, "ordens_de_servico.xlsx");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Ordens de Serviço</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <PeriodSelector currentPeriod={currentPeriod} currentStart={currentStart} currentEnd={currentEnd} />
          <button className="btn-primary" onClick={() => setIsFilterModalOpen(true)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: 'white', height: '44px' }}>
            <Filter size={18} /> Filtrar
          </button>
        </div>
      </div>

      {isFilterModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="panel-header" style={{ margin: 0 }}><Filter size={20} className="text-primary" /> Filtros de OS</h3>
              <button onClick={() => setIsFilterModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>&times;</button>
            </div>
            <div className="form-grid mb-6">
              <div className="input-group">
                <label>Número (ID)</label>
                <input value={filterId} onChange={e => setFilterId(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Cliente</label>
                <input value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Status Operacional</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="Agendada">Agendada</option>
                  <option value="Em execução">Em execução</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Adiada">Adiada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>
              <div className="input-group">
                <label>Status Financeiro</label>
                <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Recebido">Recebido</option>
                  <option value="Parcial">Parcial</option>
                  <option value="Atrasado">Atrasado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
              <div className="input-group">
                <label>Visibilidade</label>
                <select value={filterVisibility} onChange={e => setFilterVisibility(e.target.value as any)}>
                  <option value="ativos">Ativos</option>
                  <option value="ocultos">Ocultos</option>
                  <option value="todos">Todos</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button onClick={handleClearFilters} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Limpar</button>
              <button onClick={() => setIsFilterModalOpen(false)} className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--secondary-color), #d946ef)' }}>Aplicar Filtros</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', margin: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="panel-header" style={{ margin: 0 }}>
                {selectedOs ? `Editar Ordem de Serviço #${selectedOs.id}` : "Nova Ordem de Serviço"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid mb-6">
                <div className="input-group" style={{ position: 'relative' }}>
                  <label>Cliente (Buscar por Nome)</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text"
                      value={customerSearchTerm}
                      onChange={e => {
                        setCustomerSearchTerm(e.target.value);
                        setCustomerId("");
                        setLocationId("");
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      placeholder="Digite o nome..."
                      required={!customerId} // Must select a valid customer
                      disabled={!!selectedOs}
                      style={{ paddingLeft: '36px', width: '100%' }}
                    />
                  </div>
                  {showCustomerDropdown && !selectedOs && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', backdropFilter: 'blur(10px)', marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
                      {filteredCustomerOptions.length > 0 ? (
                        filteredCustomerOptions.map((c: any) => (
                          <div 
                            key={c.id} 
                            style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                            onMouseDown={() => {
                              setCustomerSearchTerm(c.name);
                              setCustomerId(c.id.toString());
                              setLocationId("");
                              setShowCustomerDropdown(false);
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ fontWeight: 600 }}>{c.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.document || "Sem documento"}</div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '10px 16px', color: 'var(--text-muted)', textAlign: 'center' }}>Nenhum cliente encontrado</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="input-group">
                  <label>Local do Atendimento</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <select value={locationId} onChange={e => setLocationId(e.target.value)} required disabled={!selectedCustomer || !!selectedOs} style={{ paddingLeft: '36px' }}>
                      <option value="" disabled>Selecione o Local</option>
                      {selectedCustomer?.locations.map((l: any) => <option key={l.id} value={l.id}>{l.street}, {l.neighborhood}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-grid mb-6">
                <div className="input-group">
                  <label>Tipo de Serviço</label>
                  <select value={serviceTypeId} onChange={e => setServiceTypeId(e.target.value)} required disabled={!!selectedOs}>
                    <option value="" disabled>Selecione</option>
                    {serviceTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
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
                  <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Forma de Pagamento</label>
                  <div style={{ position: 'relative' }}>
                    <CreditCard size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <select value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)} required style={{ paddingLeft: '36px' }}>
                      <option value="" disabled>Selecione</option>
                      {paymentMethods.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label>Data de Vencimento</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required style={{ paddingLeft: '36px' }} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Vencimento Anvisa (Opcional)</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input type="date" value={anvisaExpiry} onChange={e => setAnvisaExpiry(e.target.value)} style={{ paddingLeft: '36px' }} />
                  </div>
                </div>
              </div>
              
              {selectedOs && (
                <div className="form-grid mb-6">
                  <div className="input-group">
                    <label>Status Operacional</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} required>
                      <option value="Agendada">Agendada</option>
                      <option value="Em execução">Em execução</option>
                      <option value="Concluída">Concluída</option>
                      <option value="Adiada">Adiada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Status Financeiro</label>
                    <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} required>
                      <option value="Pendente">Pendente</option>
                      <option value="Recebido">Recebido</option>
                      <option value="Parcial">Parcial</option>
                      <option value="Atrasado">Atrasado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="input-group mb-6">
                <label>Técnicos Responsáveis</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                  {employees.map((emp: any) => (
                    <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', background: selectedEmployeeIds.includes(emp.id) ? 'rgba(217, 70, 239, 0.2)' : 'transparent', border: selectedEmployeeIds.includes(emp.id) ? '1px solid #d946ef' : '1px solid var(--glass-border)', borderRadius: '6px', fontSize: '13px', transition: 'all 0.2s' }}>
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
                  {employees.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Nenhum técnico cadastrado.</div>}
                </div>
              </div>

              <div className="input-group mb-6">
                <label>Observações Adicionais</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={16} style={{ position: 'absolute', left: '12px', top: '16px', color: 'var(--text-secondary)' }} />
                  <textarea placeholder="Detalhes do serviço..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ paddingLeft: '36px', resize: 'vertical' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                {selectedOs ? (
                  <button type="button" onClick={handleHideOs} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Ocultar OS</button>
                ) : <div />}
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                  <button className="btn-primary" type="submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, var(--secondary-color), #d946ef)' }}>
                    {isSubmitting ? 'Salvando...' : (selectedOs ? "Salvar Alterações" : "Gerar Ordem de Serviço")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="glass-panel">
        <div className="flex-between panel-header" style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Lista de Ordens</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" onClick={exportPDF} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <Download size={16} /> PDF
            </button>
            <button type="button" onClick={exportExcel} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <Download size={16} /> Excel
            </button>
            <button className="btn-primary" onClick={openNewModal}>
              <Plus size={18} /> Nova OS
            </button>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th onClick={() => handleSort('id')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  OS # {sortColumn === 'id' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th onClick={() => handleSort('customer')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Cliente / Local {sortColumn === 'customer' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th onClick={() => handleSort('date')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Data/Hora {sortColumn === 'date' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th onClick={() => handleSort('type')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Tipo {sortColumn === 'type' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th onClick={() => handleSort('amount')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Valor {sortColumn === 'amount' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th onClick={() => handleSort('status')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Status Operacional {sortColumn === 'status' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th onClick={() => handleSort('payment')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Status Financeiro {sortColumn === 'payment' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhuma Ordem de Serviço encontrada.
                  </td>
                </tr>
              ) : (
                sortedOrders.map((os: any) => (
                  <tr key={os.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'default' }}>
                    <td style={{ padding: '16px', fontWeight: 800, color: 'var(--primary-color)' }}>
                      #{os.id}
                      {os.isHidden && <span className="badge" style={{ marginLeft: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Oculto</span>}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600 }}>{os.customer.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{os.location?.street}, {os.location?.neighborhood}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div>{formatDate(os.scheduled_date)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{os.scheduled_time || "-"}</div>
                    </td>
                    <td style={{ padding: '16px' }}><span className="badge badge-neutral">{os.serviceType.name}</span></td>
                    <td style={{ padding: '16px', fontWeight: 'bold' }}>R$ {os.total_amount.toFixed(2)}</td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge badge-warning" style={{
                        background: os.status === 'Concluída' ? 'rgba(34, 197, 94, 0.1)' : 
                                    os.status === 'Cancelada' ? 'rgba(239, 68, 68, 0.1)' : undefined,
                        color: os.status === 'Concluída' ? '#22c55e' : 
                               os.status === 'Cancelada' ? '#ef4444' : undefined,
                        border: os.status === 'Concluída' ? '1px solid rgba(34, 197, 94, 0.3)' : 
                                os.status === 'Cancelada' ? '1px solid rgba(239, 68, 68, 0.3)' : undefined
                      }}>{os.status}</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className={os.payment_status === 'Recebido' ? 'badge badge-success' : 'badge badge-warning'}>
                        {os.payment_status || "Pendente"}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => openEditModal(os)}
                        style={{ background: 'rgba(217, 70, 239, 0.15)', color: '#d946ef', border: '1px solid rgba(217, 70, 239, 0.3)', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(217, 70, 239, 0.25)' }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(217, 70, 239, 0.15)' }}
                      >
                        Ver Mais
                      </button>
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
