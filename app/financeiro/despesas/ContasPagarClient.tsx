"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  TrendingDown, 
  TrendingUp,
  LayoutDashboard,
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Truck, 
  User, 
  Tag, 
  X,
  Wallet 
} from "lucide-react";
import { 
  payPayable, 
  createPayable, 
  updatePayable, 
  deletePayable,
  createExpenseCategory 
} from "@/app/actions/financeiro";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ContasPagarClientProps {
  data: {
    payables: any[];
    expenseCategories: any[];
    vehicles: any[];
    cashPoints?: any[];
  };
}

export default function ContasPagarClient({ data }: ContasPagarClientProps) {
  const { payables, expenseCategories: initialCategories, vehicles, cashPoints = [] } = data;

  const [categories, setCategories] = useState<any[]>(initialCategories);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS"); // TODOS, PENDENTES, PAGOS, VENCIDOS
  const [categoryFilter, setCategoryFilter] = useState("TODOS");
  const [vehicleFilter, setVehicleFilter] = useState("TODOS");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [cashPointId, setCashPointId] = useState("");
  const [responsible, setResponsible] = useState("");
  const [status, setStatus] = useState("Pendente");

  // Quick category creation
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Modal Baixa
  const [baixaItem, setBaixaItem] = useState<any>(null);
  const [baixaCashPointId, setBaixaCashPointId] = useState("");
  const [isBaixando, setIsBaixando] = useState(false);

  // Helper date formatter
  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getUTCDate().toString().padStart(2, "0");
    const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper is overdue
  const isOverdue = (pay: any) => {
    if (pay.status === "Pago" || pay.status === "Cancelado") return false;
    const due = new Date(pay.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    let totalPendente = 0;
    let totalPago = 0;
    let totalVencido = 0;
    let totalGeral = 0;
    let countPendente = 0;
    let countPago = 0;
    let countVencido = 0;

    payables.forEach((p) => {
      totalGeral += p.amount;
      if (p.status === "Pago") {
        totalPago += p.amount;
        countPago++;
      } else if (p.status !== "Cancelado") {
        if (isOverdue(p)) {
          totalVencido += p.amount;
          countVencido++;
        }
        totalPendente += p.amount;
        countPendente++;
      }
    });

    return {
      totalPendente,
      totalPago,
      totalVencido,
      totalGeral,
      countPendente,
      countPago,
      countVencido,
      countTotal: payables.length
    };
  }, [payables]);

  // Filtered List
  const filteredList = useMemo(() => {
    return payables.filter((p) => {
      // Search
      const search = searchTerm.toLowerCase();
      const desc = p.description?.toLowerCase() || "";
      const resp = p.responsible?.toLowerCase() || "";
      const cat = p.category?.name?.toLowerCase() || "";
      const plate = p.vehicle?.plate?.toLowerCase() || "";
      const matchesSearch = desc.includes(search) || resp.includes(search) || cat.includes(search) || plate.includes(search);
      if (!matchesSearch) return false;

      // Status
      if (statusFilter === "PENDENTES" && (p.status === "Pago" || p.status === "Cancelado")) return false;
      if (statusFilter === "PAGOS" && p.status !== "Pago") return false;
      if (statusFilter === "VENCIDOS" && !isOverdue(p)) return false;

      // Category
      if (categoryFilter !== "TODOS" && String(p.categoryId) !== categoryFilter) return false;

      // Vehicle
      if (vehicleFilter !== "TODOS" && String(p.vehicleId) !== vehicleFilter) return false;

      return true;
    });
  }, [payables, searchTerm, statusFilter, categoryFilter, vehicleFilter]);

  // Form Modal Handlers
  const handleOpenCreate = () => {
    setSelectedPayable(null);
    setDescription("");
    setCategoryId(categories.length > 0 ? String(categories[0].id) : "");
    setAmount("");
    setDueDate(new Date().toISOString().split("T")[0]);
    setVehicleId("");
    setCashPointId(cashPoints.length > 0 ? String(cashPoints[0].id) : "");
    setResponsible("");
    setStatus("Pendente");
    setShowNewCatInput(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pay: any) => {
    setSelectedPayable(pay);
    setDescription(pay.description);
    setCategoryId(String(pay.categoryId));
    setAmount(String(pay.amount));
    setDueDate(new Date(pay.due_date).toISOString().split("T")[0]);
    setVehicleId(pay.vehicleId ? String(pay.vehicleId) : "");
    setCashPointId(pay.cashPointId ? String(pay.cashPointId) : (cashPoints[0]?.id ? String(cashPoints[0].id) : ""));
    setResponsible(pay.responsible || "");
    setStatus(pay.status);
    setShowNewCatInput(false);
    setIsModalOpen(true);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setIsCreatingCat(true);
    try {
      const created = await createExpenseCategory(newCatName.trim());
      setCategories((prev) => [...prev, created]);
      setCategoryId(String(created.id));
      setNewCatName("");
      setShowNewCatInput(false);
    } catch (err: any) {
      alert("Erro ao criar categoria: " + err.message);
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleConfirmBaixa = async () => {
    if (!baixaItem) return;
    setIsBaixando(true);
    try {
      const cpId = baixaCashPointId ? Number(baixaCashPointId) : null;
      await payPayable(baixaItem.id, cpId);
      setBaixaItem(null);
    } catch (err: any) {
      alert("Erro ao dar baixa no pagamento: " + err.message);
    } finally {
      setIsBaixando(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Por favor, preencha a descrição da despesa.");
      return;
    }
    if (!categoryId) {
      alert("Selecione uma categoria de despesa.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert("Informe um valor válido.");
      return;
    }
    if (!dueDate) {
      alert("Informe a data de vencimento.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedPayable) {
        await updatePayable(selectedPayable.id, {
          description: description.trim(),
          categoryId: Number(categoryId),
          amount: Number(amount),
          due_date: new Date(dueDate),
          vehicleId: vehicleId ? Number(vehicleId) : null,
          cashPointId: cashPointId ? Number(cashPointId) : null,
          responsible: responsible.trim(),
          status
        });
      } else {
        await createPayable({
          description: description.trim(),
          categoryId: Number(categoryId),
          amount: Number(amount),
          due_date: new Date(dueDate),
          vehicleId: vehicleId ? Number(vehicleId) : null,
          cashPointId: cashPointId ? Number(cashPointId) : null,
          responsible: responsible.trim(),
          status
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Erro ao salvar conta a pagar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (pay: any) => {
    if (confirm(`Deseja realmente excluir a despesa "${pay.description}" no valor de R$ ${pay.amount.toFixed(2)}?`)) {
      try {
        await deletePayable(pay.id);
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  // Export handlers
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Contas a Pagar", 14, 15);
    const tableColumn = ["ID", "Descrição", "Categoria", "Veículo", "Responsável", "Vencimento", "Valor (R$)", "Status"];
    const tableRows: any[] = [];
    filteredList.forEach((p: any) => {
      tableRows.push([
        `#${p.id}`,
        p.description || "-",
        p.category?.name || "-",
        p.vehicle ? `${p.vehicle.model || ""} (${p.vehicle.plate})` : "-",
        p.responsible || "-",
        formatDate(p.due_date),
        p.amount.toFixed(2),
        isOverdue(p) ? "Vencido" : p.status
      ]);
    });
    autoTable(doc, { 
      head: [tableColumn], 
      body: tableRows, 
      startY: 22, 
      styles: { fontSize: 8 }, 
      headStyles: { fillColor: [15, 23, 42] } 
    });
    doc.save("contas_a_pagar.pdf");
  };

  const exportExcel = () => {
    const exportData = filteredList.map((p: any) => ({
      ID: p.id,
      Descricao: p.description || "-",
      Categoria: p.category?.name || "-",
      Veiculo: p.vehicle ? `${p.vehicle.model || ""} (${p.vehicle.plate})` : "-",
      Responsavel: p.responsible || "-",
      Vencimento: formatDate(p.due_date),
      Valor: p.amount,
      Status: isOverdue(p) ? "Vencido" : p.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ContasAPagar");
    XLSX.writeFile(workbook, "contas_a_pagar.xlsx");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ABAS SUPERIORES FINANCEIRAS */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "8px", flexWrap: "wrap" }}>
        <Link
          href="/financeiro"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#64748b",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            marginBottom: "-2px"
          }}
        >
          <LayoutDashboard size={17} /> Painel Geral
        </Link>
        <Link
          href="/financeiro/receitas"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#64748b",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            marginBottom: "-2px"
          }}
        >
          <TrendingUp size={17} /> Contas a Receber
        </Link>
        <Link
          href="/financeiro/despesas"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--primary-color)",
            textDecoration: "none",
            borderBottom: "2px solid var(--primary-color)",
            marginBottom: "-2px"
          }}
        >
          <TrendingDown size={17} /> Contas a Pagar
        </Link>
        <Link
          href="/financeiro/pontos-recebimento"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#64748b",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            marginBottom: "-2px"
          }}
        >
          <Wallet size={17} /> Pontos de Recebimento
        </Link>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {/* Total a Pagar (Pendente) */}
        <div style={{
          background: "var(--bg-color-soft)",
          border: "1px solid var(--glass-border)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>A Pagar (Pendente)</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={19} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#ef4444" }}>
            R$ {metrics.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {metrics.countPendente} despesa(s) pendente(s)
          </span>
        </div>

        {/* Total Pago */}
        <div style={{
          background: "var(--bg-color-soft)",
          border: "1px solid var(--glass-border)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Total Pago</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={19} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#10b981" }}>
            R$ {metrics.totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {metrics.countPago} despesa(s) quitada(s)
          </span>
        </div>

        {/* Vencidas */}
        <div style={{
          background: "var(--bg-color-soft)",
          border: "1px solid var(--glass-border)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Despesas Vencidas</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(220, 38, 38, 0.15)", color: "#b91c1c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle size={19} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#b91c1c" }}>
            R$ {metrics.totalVencido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {metrics.countVencido} conta(s) em atraso
          </span>
        </div>

        {/* Total do Período */}
        <div style={{
          background: "var(--bg-color-soft)",
          border: "1px solid var(--glass-border)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Total Lançado</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(100, 116, 139, 0.15)", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={19} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)" }}>
            R$ {metrics.totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {metrics.countTotal} contas no período
          </span>
        </div>
      </div>

      {/* TOOLBAR: SEARCH, FILTERS & ACTION BUTTONS */}
      <div style={{
        background: "var(--bg-color-soft)",
        border: "1px solid var(--glass-border)",
        borderRadius: "14px",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          {/* Search Bar */}
          <div style={{ position: "relative", flex: "1 1 280px", maxWidth: "420px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar despesa, responsável ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sgp-input"
              style={{ paddingLeft: "36px", width: "100%" }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={exportPDF}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px", borderRadius: "8px" }}
            >
              <Download size={15} color="#ef4444" /> PDF
            </button>
            <button
              type="button"
              onClick={exportExcel}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px", borderRadius: "8px" }}
            >
              <Download size={15} color="#10b981" /> Excel
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "8px",
                backgroundColor: "#dc2626",
                borderColor: "#dc2626",
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)"
              }}
            >
              <Plus size={18} /> Nova Conta a Pagar
            </button>
          </div>
        </div>

        {/* Filter Pills & Selects */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderTop: "1px solid var(--glass-border)", paddingTop: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginRight: "4px" }}>Status:</span>
            {[
              { id: "TODOS", label: "Todas" },
              { id: "PENDENTES", label: "Pendentes" },
              { id: "PAGOS", label: "Pagas" },
              { id: "VENCIDOS", label: "Vencidas" }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  background: statusFilter === st.id ? "#dc2626" : "rgba(0,0,0,0.04)",
                  color: statusFilter === st.id ? "#ffffff" : "var(--text-secondary)",
                  transition: "all 0.15s"
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Categoria */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Categoria:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="sgp-input"
                style={{ padding: "4px 10px", fontSize: "12px", minWidth: "130px" }}
              >
                <option value="TODOS">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Veículo */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Veículo:</span>
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="sgp-input"
                style={{ padding: "4px 10px", fontSize: "12px", minWidth: "130px" }}
              >
                <option value="TODOS">Todos</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={String(v.id)}>
                    {v.plate} ({v.model || "Sem mod."})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div style={{
        background: "var(--bg-color-soft)",
        border: "1px solid var(--glass-border)",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Descrição</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Categoria</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Caixa / Origem</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Veículo</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Responsável</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Vencimento</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Valor</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "14px 16px", fontWeight: 600, textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((pay) => {
                const overdue = isOverdue(pay);
                const isPago = pay.status === "Pago";

                return (
                  <tr 
                    key={pay.id} 
                    style={{ 
                      borderBottom: "1px solid var(--glass-border)",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.015)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Descrição */}
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-main)" }}>
                      {pay.description}
                    </td>

                    {/* Categoria */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "rgba(100, 116, 139, 0.1)",
                        color: "#475569",
                        fontSize: "11px",
                        fontWeight: 600
                      }}>
                        <Tag size={11} /> {pay.category?.name || "Geral"}
                      </span>
                    </td>

                    {/* Caixa Origem */}
                    <td style={{ padding: "14px 16px" }}>
                      {pay.cashPoint ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: "rgba(0,0,0,0.04)",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--text-secondary)"
                        }}>
                          <Wallet size={11} color="#ef4444" /> {pay.cashPoint.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>-</span>
                      )}
                    </td>

                    {/* Veículo */}
                    <td style={{ padding: "14px 16px" }}>
                      {pay.vehicle ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--text-main)"
                        }}>
                          <Truck size={13} color="var(--primary-color)" />
                          {pay.vehicle.plate}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>-</span>
                      )}
                    </td>

                    {/* Responsável */}
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                      {pay.responsible ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <User size={13} color="var(--text-muted)" />
                          {pay.responsible}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>-</span>
                      )}
                    </td>

                    {/* Vencimento */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 500, color: overdue ? "#ef4444" : "var(--text-main)" }}>
                          {formatDate(pay.due_date)}
                        </span>
                        {overdue && (
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#ef4444" }}>
                            VENCIDA
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Valor */}
                    <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: "14px", color: isPago ? "var(--text-main)" : "#ef4444" }}>
                      R$ {pay.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      {isPago ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontSize: "11px", fontWeight: 700 }}>
                          <CheckCircle2 size={12} /> Pago
                        </span>
                      ) : overdue ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", fontSize: "11px", fontWeight: 700 }}>
                          <AlertCircle size={12} /> Vencida
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "rgba(245, 158, 11, 0.15)", color: "#d97706", fontSize: "11px", fontWeight: 700 }}>
                          <Clock size={12} /> Pendente
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        {!isPago && (
                          <button
                            type="button"
                            onClick={() => {
                              setBaixaCashPointId(pay.cashPointId ? String(pay.cashPointId) : (cashPoints[0]?.id ? String(cashPoints[0].id) : ""));
                              setBaixaItem(pay);
                            }}
                            title="Confirmar Pagamento (Quitar)"
                            style={{
                              background: "#dc2626",
                              border: "none",
                              color: "#ffffff",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <CheckCircle2 size={13} /> Pagar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(pay)}
                          title="Editar Despesa"
                          className="btn btn-secondary"
                          style={{ padding: "6px 8px", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pay)}
                          title="Excluir Conta a Pagar"
                          className="btn btn-secondary"
                          style={{ padding: "6px 8px", borderRadius: "6px", color: "#ef4444", cursor: "pointer" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <TrendingDown size={36} color="var(--text-muted)" />
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-secondary)" }}>
                        Nenhuma conta a pagar encontrada
                      </div>
                      <div style={{ fontSize: "12px" }}>
                        Ajuste os filtros ou utilize o botão "+ Nova Conta a Pagar" para registrar despesas.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVA / EDITAR CONTA A PAGAR */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
            padding: "16px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "560px",
              boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.35)",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-main)" }}>
                  {selectedPayable ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Cadastre obrigações com fornecedores, custos operacionais e manutenções.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Descrição */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                  Descrição da Despesa: <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Fornecedor de Inseticidas, Manutenção Freios..."
                  className="sgp-input"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              {/* Categoria com opção de adicionar nova */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
                    Categoria: <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(!showNewCatInput)}
                    style={{ background: "none", border: "none", color: "var(--primary-color)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    {showNewCatInput ? "Selecionar Existente" : "+ Nova Categoria"}
                  </button>
                </div>

                {showNewCatInput ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Nome da nova categoria..."
                      className="sgp-input"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={isCreatingCat}
                      className="btn btn-primary"
                      style={{ padding: "6px 14px", fontSize: "12px" }}
                    >
                      {isCreatingCat ? "Criando..." : "Adicionar"}
                    </button>
                  </div>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="sgp-input"
                    style={{ width: "100%" }}
                    required
                  >
                    <option value="" disabled>Selecione uma categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Grid: Valor e Vencimento */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                    Valor (R$): <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="sgp-input"
                    style={{ width: "100%", fontWeight: 700 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                    Vencimento: <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="sgp-input"
                    style={{ width: "100%" }}
                    required
                  />
                </div>
              </div>

              {/* Grid: Veículo e Caixa de Saída */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                    Veículo Vinculado (Opcional):
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="sgp-input"
                    style={{ width: "100%" }}
                  >
                    <option value="">Nenhum veículo</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} - {v.model || "Utilitário"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                    Caixa / Ponto de Pagamento: <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={cashPointId}
                    onChange={(e) => setCashPointId(e.target.value)}
                    className="sgp-input"
                    style={{ width: "100%" }}
                    required
                  >
                    <option value="" disabled>Selecione o caixa</option>
                    {cashPoints.map((cp) => (
                      <option key={cp.id} value={String(cp.id)}>
                        {cp.name} ({cp.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Favorecido e Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                    Favorecido / Fornecedor:
                  </label>
                  <input
                    type="text"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    placeholder="Ex: Petrobras, Mecânica Silva..."
                    className="sgp-input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                    Status:
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="sgp-input"
                    style={{ width: "100%" }}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="btn btn-secondary"
                  style={{ padding: "9px 16px", borderRadius: "8px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    padding: "9px 20px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    backgroundColor: "#dc2626",
                    borderColor: "#dc2626",
                    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)"
                  }}
                >
                  {isSubmitting ? "Salvando..." : selectedPayable ? "Salvar Alterações" : "Cadastrar Despesa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR PAGAMENTO */}
      {baixaItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
            padding: "16px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isBaixando) setBaixaItem(null);
          }}
        >
          <div
            style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.35)",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(220, 38, 38, 0.15)",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <CheckCircle2 size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-main)" }}>
                  Confirmar Pagamento?
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                  Deseja registrar o pagamento desta despesa e atualizar o status para <strong>Pago</strong>?
                </p>
              </div>
            </div>

            <div style={{
              background: "rgba(0,0,0,0.03)",
              border: "1px solid var(--glass-border)",
              borderRadius: "10px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "13px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Descrição:</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{baixaItem.description}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Categoria:</span>
                <span style={{ fontWeight: 500 }}>{baixaItem.category?.name || "Geral"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Valor a Pagar:</span>
                <span style={{ fontWeight: 700, color: "#dc2626", fontSize: "15px" }}>
                  R$ {baixaItem.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Vencimento:</span>
                <span>{formatDate(baixaItem.due_date)}</span>
              </div>

              {/* Caixa Origem */}
              <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "10px", marginTop: "4px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                  Caixa de Origem (De onde o valor sai): <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={baixaCashPointId}
                  onChange={(e) => setBaixaCashPointId(e.target.value)}
                  className="sgp-input"
                  style={{ width: "100%", fontSize: "13px" }}
                  required
                >
                  <option value="" disabled>Selecione o caixa</option>
                  {cashPoints.map((cp: any) => (
                    <option key={cp.id} value={String(cp.id)}>
                      {cp.name} ({cp.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setBaixaItem(null)}
                disabled={isBaixando}
                className="btn btn-secondary"
                style={{ padding: "9px 16px", borderRadius: "8px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBaixa}
                disabled={isBaixando}
                style={{
                  background: "#dc2626",
                  border: "none",
                  color: "#ffffff",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: isBaixando ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)"
                }}
              >
                <CheckCircle2 size={15} />
                {isBaixando ? "Processando..." : "Confirmar Pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
