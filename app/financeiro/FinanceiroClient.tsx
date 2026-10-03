"use client";

import { useState } from "react";
import { receivePayment, createReceivable, createPayable, payPayable, updateReceivable, updatePayable, deleteReceivable, deletePayable } from "@/app/actions/financeiro";
import { CheckCircle, DollarSign, Plus, TrendingDown, TrendingUp, Search, Calendar, Edit2, Filter, Download, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function FinanceiroClient({ data }: { data: any }) {
  const { receivables, payables, customers, paymentMethods, expenseCategories, vehicles } = data;

  const [isReceitaModalOpen, setIsReceitaModalOpen] = useState(false);
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false);
  const [selectedReceita, setSelectedReceita] = useState<any>(null);
  const [selectedDespesa, setSelectedDespesa] = useState<any>(null);

  // Form States - Receita
  const [recClientId, setRecClientId] = useState("");
  const [recSearchTerm, setRecSearchTerm] = useState("");
  const [recShowDropdown, setRecShowDropdown] = useState(false);
  const [recAmount, setRecAmount] = useState("");
  const [recDueDate, setRecDueDate] = useState("");
  const [recPaymentMethodId, setRecPaymentMethodId] = useState("");
  const [recStatus, setRecStatus] = useState("Pendente");
  const [isSubmittingRec, setIsSubmittingRec] = useState(false);

  // Form States - Despesa
  const [payDesc, setPayDesc] = useState("");
  const [payCategoryId, setPayCategoryId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDueDate, setPayDueDate] = useState("");
  const [payVehicleId, setPayVehicleId] = useState("");
  const [payResponsible, setPayResponsible] = useState("");
  const [payStatus, setPayStatus] = useState("Pendente");
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Filter States
  const [filterType, setFilterType] = useState("todos"); // todos, Receita, Despesa
  const [filterStatus, setFilterStatus] = useState("todos"); // todos, pendentes, concluidos
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const openNewReceita = () => {
    setSelectedReceita(null);
    setRecClientId(""); setRecSearchTerm(""); setRecAmount(""); setRecDueDate(""); setRecPaymentMethodId(""); setRecStatus("Pendente");
    setIsReceitaModalOpen(true);
  };

  const openEditReceita = (rec: any) => {
    setSelectedReceita(rec);
    setRecClientId(rec.customerId.toString());
    setRecSearchTerm(rec.customer.name);
    setRecAmount(rec.amount.toString());
    setRecDueDate(new Date(rec.due_date).toISOString().split('T')[0]);
    setRecPaymentMethodId(rec.paymentMethodId?.toString() || "");
    setRecStatus(rec.status);
    setIsReceitaModalOpen(true);
  };

  const openNewDespesa = () => {
    setSelectedDespesa(null);
    setPayDesc(""); setPayCategoryId(""); setPayAmount(""); setPayDueDate(""); setPayVehicleId(""); setPayResponsible(""); setPayStatus("Pendente");
    setIsDespesaModalOpen(true);
  };

  const openEditDespesa = (pay: any) => {
    setSelectedDespesa(pay);
    setPayDesc(pay.description);
    setPayCategoryId(pay.categoryId.toString());
    setPayAmount(pay.amount.toString());
    setPayDueDate(new Date(pay.due_date).toISOString().split('T')[0]);
    setPayVehicleId(pay.vehicleId?.toString() || "");
    setPayResponsible(pay.responsible || "");
    setPayStatus(pay.status);
    setIsDespesaModalOpen(true);
  };

  const handleReceive = async (id: number, orderId: number | null) => {
    if (confirm("Confirmar baixa deste título (Pendente -> Recebido)?")) {
      await receivePayment(id, orderId);
    }
  };

  const handlePay = async (id: number) => {
    if (confirm("Confirmar pagamento desta despesa (Pendente -> Pago)?")) {
      await payPayable(id);
    }
  };

  const handleSubmitReceita = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRec(true);
    
    if (selectedReceita) {
      await updateReceivable(selectedReceita.id, {
        clientId: Number(recClientId),
        amount: Number(recAmount),
        due_date: new Date(recDueDate),
        paymentMethodId: recPaymentMethodId ? Number(recPaymentMethodId) : null,
        status: recStatus
      });
    } else {
      await createReceivable({
        clientId: Number(recClientId),
        amount: Number(recAmount),
        due_date: new Date(recDueDate),
        paymentMethodId: recPaymentMethodId ? Number(recPaymentMethodId) : null
      });
    }
    
    setIsSubmittingRec(false);
    setIsReceitaModalOpen(false);
  };

  const handleSubmitDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPay(true);

    if (selectedDespesa) {
      await updatePayable(selectedDespesa.id, {
        description: payDesc,
        categoryId: Number(payCategoryId),
        amount: Number(payAmount),
        due_date: new Date(payDueDate),
        vehicleId: payVehicleId ? Number(payVehicleId) : null,
        responsible: payResponsible,
        status: payStatus
      });
    } else {
      await createPayable({
        description: payDesc,
        categoryId: Number(payCategoryId),
        amount: Number(payAmount),
        due_date: new Date(payDueDate),
        vehicleId: payVehicleId ? Number(payVehicleId) : null,
        responsible: payResponsible
      });
    }

    setIsSubmittingPay(false);
    setIsDespesaModalOpen(false);
  };

  const handleDelete = async (id: number, type: string) => {
    if (confirm("Tem certeza que deseja remover este lançamento?")) {
      try {
        if (type === "Receita") {
          await deleteReceivable(id);
        } else {
          await deletePayable(id);
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredCustomerOptions = customers.filter((c: any) => c.name.toLowerCase().includes(recSearchTerm.toLowerCase()));

  // Totals calculations
  const totalReceitas = receivables.filter((r: any) => r.status === "Recebido").reduce((acc: number, cur: any) => acc + cur.amount, 0);
  const totalPendentesRec = receivables.filter((r: any) => r.status !== "Recebido" && r.status !== "Cancelado").reduce((acc: number, cur: any) => acc + cur.amount, 0);

  const totalDespesas = payables.filter((p: any) => p.status === "Pago").reduce((acc: number, cur: any) => acc + cur.amount, 0);
  const totalPendentesPag = payables.filter((p: any) => p.status !== "Pago" && p.status !== "Cancelado").reduce((acc: number, cur: any) => acc + cur.amount, 0);

  // Unified Transactions
  const transactions = [
    ...receivables.map((r: any) => ({
      ...r,
      type: "Receita",
      dateObj: new Date(r.due_date),
      displayDesc: r.customer.name,
      displayCat: "Receita de Cliente"
    })),
    ...payables.map((p: any) => ({
      ...p,
      type: "Despesa",
      dateObj: new Date(p.due_date),
      displayDesc: p.description,
      displayCat: p.category.name
    }))
  ];

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== "todos" && t.type !== filterType) return false;
    
    if (filterStatus === "pendentes") {
      if (t.type === "Receita" && t.status === "Recebido") return false;
      if (t.type === "Receita" && t.status === "Cancelado") return false;
      if (t.type === "Despesa" && t.status === "Pago") return false;
      if (t.type === "Despesa" && t.status === "Cancelado") return false;
    }
    
    if (filterStatus === "concluidos") {
      if (t.type === "Receita" && t.status !== "Recebido") return false;
      if (t.type === "Despesa" && t.status !== "Pago") return false;
    }

    if (filterStart) {
      const start = new Date(filterStart);
      const tzOffset = start.getTimezoneOffset() * 60000;
      const localStart = new Date(start.getTime() + tzOffset);
      if (t.dateObj < localStart) return false;
    }
    
    if (filterEnd) {
      const end = new Date(filterEnd);
      const tzOffset = end.getTimezoneOffset() * 60000;
      const localEnd = new Date(end.getTime() + tzOffset);
      localEnd.setHours(23, 59, 59, 999);
      if (t.dateObj > localEnd) return false;
    }

    return true;
  }).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório Financeiro", 14, 15);
    const tableColumn = ["Tipo", "Descrição / Cliente", "Categoria", "Vencimento", "Valor (R$)", "Status"];
    const tableRows: any[] = [];
    filteredTransactions.forEach((t: any) => {
      tableRows.push([
        t.type, t.displayDesc, t.displayCat, formatDate(t.due_date),
        t.amount.toFixed(2), t.status
      ]);
    });
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20, styles: { fontSize: 8 }, headStyles: { fillColor: [15, 23, 42] } });
    doc.save("relatorio_financeiro.pdf");
  };

  const exportExcel = () => {
    const data = filteredTransactions.map((t: any) => ({
      Tipo: t.type,
      Descricao: t.displayDesc,
      Categoria: t.displayCat,
      Vencimento: formatDate(t.due_date),
      Valor: t.amount,
      Status: t.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financeiro");
    XLSX.writeFile(workbook, "relatorio_financeiro.xlsx");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Cards de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success)', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px' }}>
              <TrendingUp size={24} />
            </div>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Receitas (Pagas)</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>R$ {totalPendentesRec.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber</div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger)', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
              <TrendingDown size={24} />
            </div>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Despesas (Pagas)</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>R$ {totalPendentesPag.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a pagar</div>
        </div>
        
        <div className="glass-panel" style={{ padding: '24px', background: (totalReceitas - totalDespesas) >= 0 ? 'var(--primary-glow)' : 'rgba(239, 68, 68, 0.05)', border: (totalReceitas - totalDespesas) >= 0 ? '1px solid var(--primary-color)' : '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: (totalReceitas - totalDespesas) >= 0 ? 'var(--primary-color)' : 'var(--danger)', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px' }}>
              <DollarSign size={24} />
            </div>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Saldo Líquido</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>R$ {(totalReceitas - totalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="flex-between" style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ margin: 0 }}>Relatório Financeiro Geral</h3>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" onClick={exportPDF} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <Download size={16} /> PDF
            </button>
            <button type="button" onClick={exportExcel} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <Download size={16} /> Excel
            </button>
            <button 
              className="btn-secondary" 
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} /> Filtros
            </button>
            <button className="btn-primary" onClick={openNewReceita}>
              <Plus size={18} /> Nova Receita
            </button>
            <button 
              className="btn-primary" 
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', border: 'none' }} 
              onClick={openNewDespesa}
            >
              <Plus size={18} /> Nova Despesa
            </button>
          </div>
        </div>

        {showFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Tipo de Lançamento</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="Receita">Apenas Receitas</option>
                <option value="Despesa">Apenas Despesas</option>
              </select>
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="pendentes">Pendentes</option>
                <option value="concluidos">Recebidos / Pagos</option>
              </select>
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Data Início</label>
              <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label>Data Fim</label>
              <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
            </div>
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descrição / Cliente</th>
                <th>Categoria</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t: any) => {
                const isReceita = t.type === "Receita";
                const isConcluido = isReceita ? (t.status === "Recebido") : (t.status === "Pago");
                
                return (
                  <tr key={`${t.type}-${t.id}`}>
                    <td>
                      <span className={`badge ${isReceita ? 'badge-primary' : 'badge-neutral'}`} style={{ border: isReceita ? 'none' : '1px solid rgba(239, 68, 68, 0.3)', color: isReceita ? 'white' : '#ef4444', background: isReceita ? undefined : 'rgba(239, 68, 68, 0.1)' }}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {t.displayDesc}
                      {t.orderId && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ref: Ocorrência #{t.orderId}</div>}
                    </td>
                    <td><span className="badge badge-neutral">{t.displayCat}</span></td>
                    <td>{formatDate(t.due_date)}</td>
                    <td style={{ fontWeight: 'bold', color: isConcluido ? 'var(--text-main)' : (isReceita ? 'var(--warning)' : 'var(--danger)') }}>
                      R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={isConcluido ? 'badge badge-success' : 'badge badge-warning'}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!isConcluido && t.status !== "Cancelado" && (
                          <button 
                            className="btn-primary btn-sm" 
                            style={isReceita ? {} : { background: 'var(--danger)', borderColor: 'transparent' }} 
                            onClick={() => isReceita ? handleReceive(t.id, t.orderId) : handlePay(t.id)}
                            title={isReceita ? "Dar Baixa" : "Quitar"}
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button 
                          className="btn-secondary btn-sm"
                          style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                          onClick={() => isReceita ? openEditReceita(t) : openEditDespesa(t)}
                          title="Editar Lançamento"
                        >
                          <Edit2 size={14} />
                        </button>
                        {!t.orderId && (
                          <button 
                            className="btn-secondary btn-sm"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                            onClick={() => handleDelete(t.id, t.type)}
                            title="Remover Lançamento"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum lançamento encontrado para os filtros selecionados.</div>
          )}
        </div>
      </div>

      {/* Modal Nova/Editar Receita */}
      {isReceitaModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="panel-header" style={{ margin: 0 }}>{selectedReceita ? "Editar Receita" : "Nova Receita Avulsa"}</h3>
              <button onClick={() => setIsReceitaModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmitReceita}>
              <div className="input-group mb-6" style={{ position: 'relative' }}>
                <label>Cliente</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    type="text"
                    value={recSearchTerm}
                    onChange={e => {
                      setRecSearchTerm(e.target.value);
                      setRecClientId("");
                      setRecShowDropdown(true);
                    }}
                    onFocus={() => setRecShowDropdown(true)}
                    onBlur={() => setTimeout(() => setRecShowDropdown(false), 200)}
                    placeholder="Buscar cliente..."
                    required={!recClientId}
                    style={{ paddingLeft: '36px', width: '100%' }}
                  />
                </div>
                {recShowDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', backdropFilter: 'blur(10px)' }}>
                    {filteredCustomerOptions.map((c: any) => (
                      <div 
                        key={c.id} 
                        style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        onMouseDown={() => {
                          setRecSearchTerm(c.name);
                          setRecClientId(c.id.toString());
                          setRecShowDropdown(false);
                        }}
                      >
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-grid mb-6">
                <div className="input-group">
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" value={recAmount} onChange={e => setRecAmount(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Data de Vencimento</label>
                  <input type="date" value={recDueDate} onChange={e => setRecDueDate(e.target.value)} required />
                </div>
              </div>
              <div className="form-grid mb-6">
                <div className="input-group">
                  <label>Método de Pagamento</label>
                  <select value={recPaymentMethodId} onChange={e => setRecPaymentMethodId(e.target.value)}>
                    <option value="">Não definido</option>
                    {paymentMethods.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {selectedReceita && (
                  <div className="input-group">
                    <label>Status</label>
                    <select value={recStatus} onChange={e => setRecStatus(e.target.value)} required>
                      <option value="Pendente">Pendente</option>
                      <option value="Recebido">Recebido</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button type="button" onClick={() => setIsReceitaModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmittingRec}>{isSubmittingRec ? 'Salvando...' : 'Salvar Receita'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova/Editar Despesa */}
      {isDespesaModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="panel-header" style={{ margin: 0, color: 'var(--danger)' }}>{selectedDespesa ? "Editar Despesa" : "Nova Despesa a Pagar"}</h3>
              <button onClick={() => setIsDespesaModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmitDespesa}>
              <div className="input-group mb-6">
                <label>Descrição da Despesa</label>
                <input type="text" value={payDesc} onChange={e => setPayDesc(e.target.value)} required placeholder="Ex: Conta de Luz" />
              </div>
              <div className="form-grid mb-6">
                <div className="input-group">
                  <label>Categoria</label>
                  <select value={payCategoryId} onChange={e => setPayCategoryId(e.target.value)} required>
                    <option value="" disabled>Selecione</option>
                    {expenseCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} required />
                </div>
              </div>
              <div className="form-grid mb-6">
                <div className="input-group">
                  <label>Data de Vencimento</label>
                  <input type="date" value={payDueDate} onChange={e => setPayDueDate(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Veículo Associado (Opcional)</label>
                  <select value={payVehicleId} onChange={e => setPayVehicleId(e.target.value)}>
                    <option value="">Nenhum</option>
                    {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid mb-6">
                <div className="input-group">
                  <label>Responsável / Beneficiário (Opcional)</label>
                  <input type="text" value={payResponsible} onChange={e => setPayResponsible(e.target.value)} placeholder="Nome da pessoa/empresa" />
                </div>
                {selectedDespesa && (
                  <div className="input-group">
                    <label>Status</label>
                    <select value={payStatus} onChange={e => setPayStatus(e.target.value)} required>
                      <option value="Pendente">Pendente</option>
                      <option value="Pago">Pago</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button type="button" onClick={() => setIsDespesaModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none' }} disabled={isSubmittingPay}>
                  {isSubmittingPay ? 'Salvando...' : 'Salvar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
