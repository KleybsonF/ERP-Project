"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
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
  User, 
  UserX,
  Tag,
  CreditCard, 
  ExternalLink, 
  X, 
  TrendingDown,
  LayoutDashboard,
  Wallet,
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { 
  receivePayment, 
  createReceivable, 
  updateReceivable, 
  deleteReceivable,
  createRevenueCategory,
  importReceivables
} from "@/app/actions/financeiro";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ContasReceberClientProps {
  data: {
    receivables: any[];
    customers: any[];
    paymentMethods: any[];
    revenueCategories?: any[];
    cashPoints?: any[];
  };
}

export default function ContasReceberClient({ data }: ContasReceberClientProps) {
  const { receivables, customers, paymentMethods, revenueCategories: initialCategories = [], cashPoints = [] } = data;

  const [categories, setCategories] = useState<any[]>(initialCategories);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS"); // TODOS, PENDENTES, RECEBIDOS, ATRASADOS
  const [categoryFilter, setCategoryFilter] = useState("TODOS");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("TODOS");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [cashPointId, setCashPointId] = useState("");
  const [status, setStatus] = useState("Pendente");

  // Quick category creation
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Modal Baixa
  const [baixaItem, setBaixaItem] = useState<any>(null);
  const [baixaCashPointId, setBaixaCashPointId] = useState("");
  const [isBaixando, setIsBaixando] = useState(false);

  // Modal Importação Excel
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [importStats, setImportStats] = useState<{ total: number; sum: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Helpers para importação Excel
  const normalizeHeader = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  };

  const parseExcelAmount = (val: any): number => {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const str = String(val).replace(/R\$/g, "").replace(/\s/g, "").trim();
    if (str.includes(",") && str.includes(".")) {
      return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
    }
    if (str.includes(",")) {
      return parseFloat(str.replace(",", ".")) || 0;
    }
    return parseFloat(str) || 0;
  };

  const parseExcelDate = (val: any): Date => {
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val;
    }
    if (typeof val === "number") {
      const utcDays = Math.floor(val - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      return new Date(dateInfo.getFullYear(), dateInfo.getMonth(), dateInfo.getDate() + 1);
    }
    if (typeof val === "string") {
      const str = val.trim();
      const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (ddmmyyyy) {
        const day = parseInt(ddmmyyyy[1], 10);
        const month = parseInt(ddmmyyyy[2], 10) - 1;
        const year = parseInt(ddmmyyyy[3], 10);
        return new Date(year, month, day);
      }
      const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (yyyymmdd) {
        const year = parseInt(yyyymmdd[1], 10);
        const month = parseInt(yyyymmdd[2], 10) - 1;
        const day = parseInt(yyyymmdd[3], 10);
        return new Date(year, month, day);
      }
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const handleProcessFile = (file: File) => {
    setImportFile(file);
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows || rows.length === 0) {
          setImportError("Nenhum dado encontrado na planilha selecionada.");
          setImportPreviewData([]);
          setImportStats(null);
          return;
        }

        const parsed: any[] = [];
        let totalSum = 0;

        rows.forEach((row, idx) => {
          let desc = "";
          let cat = "";
          let valRaw: any = "";
          let dueRaw: any = "";
          let cx = "";
          let client = "";
          let pm = "";
          let st = "";

          Object.keys(row).forEach((key) => {
            const norm = normalizeHeader(key);
            const val = row[key];
            if (norm.includes("descricao") || norm.includes("despesa") || norm.includes("receita") || norm.includes("servico") || norm.includes("produto")) {
              desc = String(val).trim();
            } else if (norm.includes("categoria")) {
              cat = String(val).trim();
            } else if (norm.includes("valor")) {
              valRaw = val;
            } else if (norm.includes("vencimento") || norm.includes("data")) {
              dueRaw = val;
            } else if (norm.includes("formadepagamento") || norm.includes("formapagto") || norm.includes("formapagamento") || norm.includes("formadepagto") || norm.includes("meiodepagamento") || (norm.includes("forma") && !norm.includes("caixa")) || norm.includes("metodopagamento")) {
              pm = String(val).trim();
            } else if (norm.includes("caixa") || norm.includes("pontodepagamento") || norm.includes("pontorecebimento") || norm.includes("origem") || norm.includes("destino") || norm.includes("pontopagamento")) {
              cx = String(val).trim();
            } else if (norm.includes("favorecido") || norm.includes("fornecedor") || norm.includes("cliente") || norm.includes("tomador") || norm.includes("pagador")) {
              client = String(val).trim();
            } else if (norm.includes("pagamento") && !norm.includes("caixa") && !norm.includes("ponto")) {
              pm = String(val).trim();
            } else if (norm.includes("status")) {
              st = String(val).trim();
            }
          });

          // Pular linhas totalmente vazias
          if (!desc && !valRaw && !dueRaw) return;

          if (!desc) {
            desc = `Receita #${idx + 1}`;
          }

          const parsedAmt = parseExcelAmount(valRaw);
          const parsedDt = parseExcelDate(dueRaw);
          totalSum += parsedAmt;

          parsed.push({
            description: desc,
            categoryName: cat || "Outras Receitas",
            amount: parsedAmt,
            due_date: parsedDt.toISOString(),
            dueDateFormatted: parsedDt.toLocaleDateString("pt-BR"),
            cashPointName: cx,
            clientName: client,
            paymentMethodName: pm,
            status: st || "Pendente"
          });
        });

        if (parsed.length === 0) {
          setImportError("Não foi possível identificar registros válidos na planilha.");
          setImportPreviewData([]);
          setImportStats(null);
          return;
        }

        setImportPreviewData(parsed);
        setImportStats({ total: parsed.length, sum: totalSum });
      } catch (err: any) {
        setImportError("Erro ao processar arquivo Excel: " + (err?.message || "formato inválido"));
        setImportPreviewData([]);
        setImportStats(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (importPreviewData.length === 0) return;
    setIsImporting(true);
    setImportError(null);
    setImportProgress("Iniciando importação...");

    try {
      const BATCH_SIZE = 150;
      let totalImported = 0;
      const totalItems = importPreviewData.length;
      const totalBatches = Math.ceil(totalItems / BATCH_SIZE);

      for (let i = 0; i < totalItems; i += BATCH_SIZE) {
        const chunk = importPreviewData.slice(i, i + BATCH_SIZE);
        const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
        setImportProgress(`Importando lote ${currentBatch} de ${totalBatches} (${Math.min(i + chunk.length, totalItems)}/${totalItems})...`);
        const res = await importReceivables(chunk);
        totalImported += (res.count || chunk.length);
      }

      alert(`${totalImported} conta(s) a receber importada(s) com sucesso!`);
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportPreviewData([]);
      setImportStats(null);
      setImportProgress(null);
      window.location.href = window.location.pathname + "?period=todos";
    } catch (err: any) {
      setImportError("Erro ao salvar importação: " + (err?.message || "falha desconhecida"));
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

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
  const isOverdue = (rec: any) => {
    if (rec.status === "Recebido" || rec.status === "Cancelado") return false;
    const due = new Date(rec.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    let totalPendente = 0;
    let totalRecebido = 0;
    let totalAtrasado = 0;
    let totalGeral = 0;
    let countPendente = 0;
    let countRecebido = 0;
    let countAtrasado = 0;

    receivables.forEach((r) => {
      totalGeral += r.amount;
      if (r.status === "Recebido") {
        totalRecebido += r.amount;
        countRecebido++;
      } else if (r.status !== "Cancelado") {
        if (isOverdue(r)) {
          totalAtrasado += r.amount;
          countAtrasado++;
        }
        totalPendente += r.amount;
        countPendente++;
      }
    });

    return {
      totalPendente,
      totalRecebido,
      totalAtrasado,
      totalGeral,
      countPendente,
      countRecebido,
      countAtrasado,
      countTotal: receivables.length
    };
  }, [receivables]);

  // Filtered List
  const filteredList = useMemo(() => {
    return receivables.filter((r) => {
      // Search
      const search = searchTerm.toLowerCase();
      const desc = r.description?.toLowerCase() || "";
      const clientName = r.customer?.name?.toLowerCase() || "";
      const doc = r.customer?.document?.toLowerCase() || "";
      const occId = r.occurrenceId ? String(r.occurrenceId) : "";
      const cat = r.category?.name?.toLowerCase() || "";
      const matchesSearch = desc.includes(search) || clientName.includes(search) || doc.includes(search) || occId.includes(search) || cat.includes(search);
      if (!matchesSearch) return false;

      // Status
      if (statusFilter === "PENDENTES" && (r.status === "Recebido" || r.status === "Cancelado")) return false;
      if (statusFilter === "RECEBIDOS" && r.status !== "Recebido") return false;
      if (statusFilter === "ATRASADOS" && !isOverdue(r)) return false;

      // Categoria
      if (categoryFilter !== "TODOS" && String(r.categoryId) !== categoryFilter) return false;

      // Forma de pagamento
      const effPmId = r.paymentMethodId ?? r.occurrence?.paymentMethodId;
      if (paymentMethodFilter !== "TODOS" && String(effPmId) !== paymentMethodFilter) return false;

      return true;
    });
  }, [receivables, searchTerm, statusFilter, categoryFilter, paymentMethodFilter]);

  // Autocomplete clients
  const filteredCustomers = useMemo(() => {
    if (!clientSearchTerm) return customers.slice(0, 10);
    return customers
      .filter((c) => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) || (c.document && c.document.includes(clientSearchTerm)))
      .slice(0, 10);
  }, [customers, clientSearchTerm]);

  // Quick category creation
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setIsCreatingCat(true);
    try {
      const created = await createRevenueCategory(newCatName.trim());
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

  // Modal handlers
  const handleOpenCreate = () => {
    setSelectedReceivable(null);
    setDescription("");
    setCategoryId(categories.length > 0 ? String(categories[0].id) : "");
    setClientId("");
    setClientSearchTerm("");
    setAmount("");
    setDueDate(new Date().toISOString().split("T")[0]);
    setPaymentMethodId("");
    setCashPointId(cashPoints.length > 0 ? String(cashPoints[0].id) : "");
    setStatus("Pendente");
    setShowNewCatInput(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: any) => {
    setSelectedReceivable(rec);
    setDescription(rec.description || "");
    setCategoryId(rec.categoryId ? String(rec.categoryId) : (categories[0]?.id ? String(categories[0].id) : ""));
    setClientId(rec.clientId ? String(rec.clientId) : "");
    setClientSearchTerm(rec.customer?.name || "");
    setAmount(String(rec.amount));
    setDueDate(new Date(rec.due_date).toISOString().split("T")[0]);
    setPaymentMethodId(rec.paymentMethodId ? String(rec.paymentMethodId) : (rec.occurrence?.paymentMethodId ? String(rec.occurrence.paymentMethodId) : ""));
    setCashPointId(rec.cashPointId ? String(rec.cashPointId) : (cashPoints[0]?.id ? String(cashPoints[0].id) : ""));
    setStatus(rec.status);
    setShowNewCatInput(false);
    setIsModalOpen(true);
  };

  const handleConfirmBaixa = async () => {
    if (!baixaItem) return;
    setIsBaixando(true);
    try {
      const cpId = baixaCashPointId ? Number(baixaCashPointId) : null;
      await receivePayment(baixaItem.id, baixaItem.occurrenceId, cpId);
      setBaixaItem(null);
    } catch (err: any) {
      alert("Erro ao dar baixa: " + err.message);
    } finally {
      setIsBaixando(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Por favor, informe a descrição da conta a receber.");
      return;
    }
    if (!categoryId) {
      alert("Por favor, selecione uma categoria.");
      return;
    }
    if (!cashPointId) {
      alert("Por favor, selecione o caixa / origem.");
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
      if (selectedReceivable) {
        await updateReceivable(selectedReceivable.id, {
          description: description.trim(),
          categoryId: Number(categoryId),
          cashPointId: Number(cashPointId),
          clientId: clientId ? Number(clientId) : null,
          amount: Number(amount),
          due_date: new Date(dueDate),
          paymentMethodId: paymentMethodId ? Number(paymentMethodId) : null,
          status
        });
      } else {
        await createReceivable({
          description: description.trim(),
          categoryId: Number(categoryId),
          cashPointId: Number(cashPointId),
          clientId: clientId ? Number(clientId) : null,
          amount: Number(amount),
          due_date: new Date(dueDate),
          paymentMethodId: paymentMethodId ? Number(paymentMethodId) : null,
          status
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Erro ao salvar conta a receber: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rec: any) => {
    if (rec.occurrenceId) {
      alert("Este lançamento está vinculado à Ocorrência/O.S. #" + rec.occurrenceId + " e não pode ser excluído diretamente aqui.");
      return;
    }
    const label = rec.description || (rec.customer?.name ? `do cliente ${rec.customer.name}` : "avulsa");
    if (confirm(`Deseja realmente excluir a conta a receber "${label}" no valor de R$ ${rec.amount.toFixed(2)}?`)) {
      try {
        await deleteReceivable(rec.id);
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  // Export handlers
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Contas a Receber", 14, 15);
    const tableColumn = ["ID", "Descrição", "Categoria", "Cliente", "Caixa/Origem", "Vencimento", "Forma Pagto.", "Valor (R$)", "Status"];
    const tableRows: any[] = [];
    filteredList.forEach((r: any) => {
      tableRows.push([
        `#${r.id}`,
        r.description || "-",
        r.category?.name || "Sem categoria",
        r.customer?.name || "Sem cliente",
        r.cashPoint?.name || "-",
        formatDate(r.due_date),
        r.paymentMethod?.name || r.occurrence?.paymentMethod?.name || "Não informado",
        r.amount.toFixed(2),
        isOverdue(r) ? "Atrasado" : r.status
      ]);
    });
    autoTable(doc, { 
      head: [tableColumn], 
      body: tableRows, 
      startY: 22, 
      styles: { fontSize: 7 }, 
      headStyles: { fillColor: [15, 23, 42] } 
    });
    doc.save("contas_a_receber.pdf");
  };

  const exportExcel = () => {
    const exportData = filteredList.map((r: any) => ({
      ID: r.id,
      Descricao: r.description || "-",
      Categoria: r.category?.name || "Sem categoria",
      Cliente: r.customer?.name || "Sem cliente vinculado",
      Documento: r.customer?.document || "-",
      CaixaOrigem: r.cashPoint?.name || "-",
      Ocorrencia: r.occurrenceId ? `#${r.occurrenceId}` : "Avulso",
      Vencimento: formatDate(r.due_date),
      FormaPagamento: r.paymentMethod?.name || r.occurrence?.paymentMethod?.name || "Não informado",
      Valor: r.amount,
      Status: isOverdue(r) ? "Atrasado" : r.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ContasAReceber");
    XLSX.writeFile(workbook, "contas_a_receber.xlsx");
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
          <LayoutDashboard size={17} /> Histórico de Caixas
        </Link>
        <Link
          href="/financeiro/receitas"
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
            fontWeight: 500,
            color: "#64748b",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
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
        {/* Total a Receber */}
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
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>A Receber (Pendente)</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={19} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#d97706" }}>
            R$ {metrics.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {metrics.countPendente} título(s) pendente(s)
          </span>
        </div>

        {/* Total Recebido */}
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
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Total Recebido</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={19} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#10b981" }}>
            R$ {metrics.totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {metrics.countRecebido} recebimento(s) confirmado(s)
          </span>
        </div>

        {/* Em Atraso */}
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
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Títulos em Atraso</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle size={19} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#ef4444" }}>
            R$ {metrics.totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {metrics.countAtrasado} título(s) vencido(s)
          </span>
        </div>

        {/* Total Previsto */}
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
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Total Faturado</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={19} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)" }}>
            R$ {metrics.totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {metrics.countTotal} títulos no período
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
              placeholder="Buscar cliente, documento ou Nº O.S..."
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
              onClick={() => {
                setIsImportModalOpen(true);
                setImportFile(null);
                setImportPreviewData([]);
                setImportStats(null);
                setImportError(null);
              }}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px", borderRadius: "8px" }}
            >
              <Upload size={15} color="var(--primary-color)" /> Importar Excel
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
                boxShadow: "0 4px 12px var(--primary-glow)"
              }}
            >
              <Plus size={18} /> Nova Conta a Receber
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderTop: "1px solid var(--glass-border)", paddingTop: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginRight: "4px" }}>Status:</span>
            {[
              { id: "TODOS", label: "Todos" },
              { id: "PENDENTES", label: "Pendentes" },
              { id: "RECEBIDOS", label: "Recebidos" },
              { id: "ATRASADOS", label: "Em Atraso" }
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
                  background: statusFilter === st.id ? "var(--primary-color)" : "rgba(0,0,0,0.04)",
                  color: statusFilter === st.id ? "#ffffff" : "var(--text-secondary)",
                  transition: "all 0.15s"
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Categoria:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="sgp-input"
                style={{ padding: "4px 10px", fontSize: "12px", minWidth: "140px" }}
              >
                <option value="TODOS">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Forma de Pagto:</span>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="sgp-input"
                style={{ padding: "4px 10px", fontSize: "12px", minWidth: "140px" }}
              >
                <option value="TODOS">Todas</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={String(pm.id)}>
                    {pm.name}
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
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Descrição / Categoria</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Cliente</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Caixa / Origem</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Origem / O.S.</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Forma Pagto.</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Vencimento</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Valor</th>
                <th style={{ padding: "14px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "14px 16px", fontWeight: 600, textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((rec) => {
                const overdue = isOverdue(rec);
                const isRecebido = rec.status === "Recebido";

                return (
                  <tr 
                    key={rec.id} 
                    style={{ 
                      borderBottom: "1px solid var(--glass-border)",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.015)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Descrição e Categoria */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "13px" }}>
                          {rec.description || (rec.occurrenceId ? `Receita de O.S. #${rec.occurrenceId}` : "Receita Avulsa")}
                        </span>
                        {rec.category ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            width: "fit-content",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--primary-color)",
                            background: "rgba(14, 165, 233, 0.1)",
                            padding: "2px 8px",
                            borderRadius: "6px"
                          }}>
                            <Tag size={11} /> {rec.category.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sem categoria</span>
                        )}
                      </div>
                    </td>

                    {/* Cliente (Opcional) */}
                    <td style={{ padding: "14px 16px" }}>
                      {rec.customer ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "8px",
                            background: "var(--primary-glow)",
                            color: "var(--primary-color)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "11px",
                            flexShrink: 0
                          }}>
                            {rec.customer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link 
                              href={`/clientes/${rec.clientId}`}
                              style={{ fontWeight: 600, color: "var(--text-main)", textDecoration: "none", fontSize: "12px" }}
                              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                            >
                              {rec.customer.name}
                            </Link>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              {rec.customer.document || "Sem documento"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          fontStyle: "italic"
                        }}>
                          <UserX size={13} /> Sem cliente vinculado
                        </span>
                      )}
                    </td>

                    {/* Caixa / Origem */}
                    <td style={{ padding: "14px 16px" }}>
                      {rec.cashPoint ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "rgba(0,0,0,0.04)",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--text-secondary)"
                        }}>
                          <Wallet size={12} color="var(--primary-color)" /> {rec.cashPoint.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>-</span>
                      )}
                    </td>

                    {/* Origem */}
                    <td style={{ padding: "14px 16px" }}>
                      {rec.occurrenceId ? (
                        <Link 
                          href={`/os/${rec.occurrenceId}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(59, 130, 246, 0.1)",
                            color: "#2563eb",
                            fontSize: "11px",
                            fontWeight: 600,
                            textDecoration: "none"
                          }}
                        >
                          O.S. #{rec.occurrenceId} <ExternalLink size={10} />
                        </Link>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "rgba(0,0,0,0.04)", padding: "3px 8px", borderRadius: "6px" }}>
                          Avulso
                        </span>
                      )}
                    </td>

                    {/* Forma Pagto */}
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <CreditCard size={14} color="var(--text-muted)" />
                        {rec.paymentMethod?.name || rec.occurrence?.paymentMethod?.name || "Não definida"}
                      </span>
                    </td>

                    {/* Vencimento */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 500, color: overdue ? "#ef4444" : "var(--text-main)" }}>
                          {formatDate(rec.due_date)}
                        </span>
                        {overdue && (
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#ef4444" }}>
                            VENCIDO
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Valor */}
                    <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: "14px", color: isRecebido ? "var(--text-main)" : "#d97706" }}>
                      R$ {rec.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      {isRecebido ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontSize: "11px", fontWeight: 700 }}>
                          <CheckCircle2 size={12} /> Recebido
                        </span>
                      ) : overdue ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", fontSize: "11px", fontWeight: 700 }}>
                          <AlertCircle size={12} /> Em Atraso
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
                        {!isRecebido && (
                          <button
                            type="button"
                            onClick={() => {
                              setBaixaCashPointId(rec.cashPointId ? String(rec.cashPointId) : (cashPoints[0]?.id ? String(cashPoints[0].id) : ""));
                              setBaixaItem(rec);
                            }}
                            title="Confirmar Recebimento (Dar Baixa)"
                            style={{
                              background: "#10b981",
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
                            <CheckCircle2 size={13} /> Baixar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          title="Editar Título"
                          className="btn btn-secondary"
                          style={{ padding: "6px 8px", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <Edit2 size={13} />
                        </button>
                        {!rec.occurrenceId && (
                          <button
                            type="button"
                            onClick={() => handleDelete(rec)}
                            title="Excluir Lançamento Avulso"
                            className="btn btn-secondary"
                            style={{ padding: "6px 8px", borderRadius: "6px", color: "#ef4444", cursor: "pointer" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <TrendingUp size={36} color="var(--text-muted)" />
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-secondary)" }}>
                        Nenhuma conta a receber encontrada
                      </div>
                      <div style={{ fontSize: "12px" }}>
                        Ajuste os filtros ou utilize o botão "+ Nova Conta a Receber" para registrar faturamentos.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVA / EDITAR CONTA A RECEBER */}
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
              maxWidth: "540px",
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
                  {selectedReceivable ? "Editar Conta a Receber" : "Nova Conta a Receber"}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Preencha os dados do faturamento ou cobrança do cliente.
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
              {/* Descrição (Obrigatório) */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                  Descrição da Conta a Receber: <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Pagamento referente a serviço, venda de insumos, contrato..."
                  className="sgp-input"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              {/* Categoria com criação rápida (Obrigatório) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
                    Categoria da Receita: <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(!showNewCatInput)}
                    style={{ background: "none", border: "none", color: "var(--primary-color)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                  >
                    {showNewCatInput ? "Selecionar existente" : "+ Nova Categoria"}
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
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={isCreatingCat || !newCatName.trim()}
                      className="btn btn-primary"
                      style={{ padding: "0 14px", fontSize: "12px", whiteSpace: "nowrap" }}
                    >
                      {isCreatingCat ? "..." : "Adicionar"}
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
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Caixa / Origem (Ponto de Recebimento) (Obrigatório) */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                  Caixa / Origem (Destino): <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={cashPointId}
                  onChange={(e) => setCashPointId(e.target.value)}
                  className="sgp-input"
                  style={{ width: "100%" }}
                  required
                >
                  <option value="" disabled>Selecione o caixa / origem</option>
                  {cashPoints.map((cp) => (
                    <option key={cp.id} value={String(cp.id)}>
                      {cp.name} ({cp.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cliente com busca (Opcional) */}
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
                    Cliente: <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>(Opcional)</span>
                  </label>
                  {clientId && (
                    <button
                      type="button"
                      onClick={() => {
                        setClientId("");
                        setClientSearchTerm("");
                      }}
                      style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}
                    >
                      Remover cliente
                    </button>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setClientId("");
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Opcional: busque pelo nome ou CPF/CNPJ..."
                    className="sgp-input"
                    style={{ paddingLeft: "36px", paddingRight: clientId ? "85px" : "12px", width: "100%" }}
                  />
                  {clientId && (
                    <span style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "11px",
                      color: "#10b981",
                      fontWeight: 600,
                      background: "rgba(16, 185, 129, 0.1)",
                      padding: "2px 8px",
                      borderRadius: "4px"
                    }}>
                      Vinculado
                    </span>
                  )}
                </div>

                {showClientDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "var(--bg-color-soft)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "8px",
                      zIndex: 100,
                      maxHeight: "180px",
                      overflowY: "auto",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                    }}
                  >
                    <div
                      onMouseDown={() => {
                        setClientId("");
                        setClientSearchTerm("");
                        setShowClientDropdown(false);
                      }}
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--glass-border)",
                        fontSize: "13px",
                        color: "var(--text-muted)",
                        fontStyle: "italic"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      Nenhum cliente (Receita sem vínculo com cliente)
                    </div>
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setClientId(String(c.id));
                          setClientSearchTerm(c.name);
                          setShowClientDropdown(false);
                        }}
                        style={{
                          padding: "10px 14px",
                          cursor: "pointer",
                          borderBottom: "1px solid var(--glass-border)",
                          fontSize: "13px"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-hover)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{c.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.document || "Sem documento"}</div>
                      </div>
                    ))}
                  </div>
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

              {/* Grid: Forma de Pagamento e Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                    Forma de Pagamento:
                  </label>
                  <select
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    className="sgp-input"
                    style={{ width: "100%" }}
                  >
                    <option value="">Não definido</option>
                    {paymentMethods.map((pm: any) => (
                      <option key={pm.id} value={String(pm.id)}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                    Status da Cobrança:
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="sgp-input"
                    style={{ width: "100%" }}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Recebido">Recebido</option>
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
                    boxShadow: "0 4px 12px var(--primary-glow)"
                  }}
                >
                  {isSubmitting ? "Salvando..." : selectedReceivable ? "Salvar Alterações" : "Cadastrar Receita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR BAIXA */}
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
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <CheckCircle2 size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-main)" }}>
                  Confirmar Recebimento?
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                  Deseja dar baixa neste recebível e atualizar o status para <strong>Recebido</strong>?
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
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                  {baixaItem.description || (baixaItem.occurrenceId ? `O.S. #${baixaItem.occurrenceId}` : "Receita")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Cliente:</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                  {baixaItem.customer?.name || "Sem cliente vinculado"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Valor a Baixar:</span>
                <span style={{ fontWeight: 700, color: "#10b981", fontSize: "15px" }}>
                  R$ {baixaItem.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Vencimento:</span>
                <span>{formatDate(baixaItem.due_date)}</span>
              </div>
              {baixaItem.occurrenceId && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Ordem de Serviço:</span>
                  <span style={{ fontWeight: 600 }}>#{baixaItem.occurrenceId} (Será marcada como Recebida)</span>
                </div>
              )}

              {/* Caixa Destino */}
              <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "10px", marginTop: "4px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                  Caixa de Destino (Onde o valor entra): <span style={{ color: "#ef4444" }}>*</span>
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
                  background: "#10b981",
                  border: "none",
                  color: "#ffffff",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: isBaixando ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <CheckCircle2 size={15} />
                {isBaixando ? "Processando..." : "Confirmar Baixa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAR EXCEL */}
      {isImportModalOpen && (
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
            if (e.target === e.currentTarget && !isImporting) setIsImportModalOpen(false);
          }}
        >
          <div
            style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.35)",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(37, 99, 235, 0.12)",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Upload size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-main)" }}>
                    Importar Contas a Receber em Lote
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                    Suba uma planilha Excel (.xlsx) contendo seus faturamentos e recebíveis.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isImporting && setIsImportModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Download Modelo */}
            <div style={{
              background: "rgba(59, 130, 246, 0.06)",
              border: "1px dashed rgba(59, 130, 246, 0.4)",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px"
            }}>
              <div style={{ flex: "1 1 320px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px", color: "#1d4ed8" }}>
                  <FileSpreadsheet size={18} /> Planilha Modelo Oficial
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                  Baixe o modelo oficial com as colunas padronizadas. 
                  <strong> O campo Cliente é opcional</strong> e pode ser deixado em branco.
                </p>
              </div>
              <a
                href="/api/modelos/contas-a-receber"
                download="Contas_a_Receber_Modelo.xlsx"
                className="btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)"
                }}
              >
                <Download size={16} /> Baixar Modelo Excel (.xlsx)
              </a>
            </div>

            {/* Upload Dropzone */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>
                Selecione o arquivo preenchido:
              </label>
              <label style={{
                border: "2px dashed var(--glass-border)",
                borderRadius: "12px",
                padding: "26px 20px",
                textAlign: "center",
                cursor: isImporting ? "not-allowed" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                background: importFile ? "rgba(16, 185, 129, 0.04)" : "rgba(0,0,0,0.015)",
                transition: "all 0.15s"
              }}>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                  disabled={isImporting}
                  style={{ display: "none" }}
                />
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: importFile ? "rgba(16, 185, 129, 0.15)" : "rgba(0,0,0,0.04)",
                  color: importFile ? "#10b981" : "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {importFile ? <CheckCircle2 size={24} /> : <Upload size={22} />}
                </div>
                <div>
                  <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
                    {importFile ? importFile.name : "Clique para selecionar o arquivo Excel"}
                  </span>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Formatos suportados: .xlsx ou .xls
                  </div>
                </div>
              </label>
            </div>

            {/* Erro de importação */}
            {importError && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#dc2626",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <AlertCircle size={18} />
                <span>{importError}</span>
              </div>
            )}

            {/* Preview da Importação */}
            {importStats && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-main)" }}>
                      Prévia dos Dados Detectados:
                    </span>
                    <span style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#059669",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 700
                    }}>
                      {importStats.total} lançamento(s)
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>
                    Total: <span style={{ color: "#10b981" }}>R$ {importStats.sum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div style={{
                  border: "1px solid var(--glass-border)",
                  borderRadius: "10px",
                  overflow: "hidden",
                  maxHeight: "220px",
                  overflowY: "auto"
                }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>Descrição</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>Categoria</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>Cliente</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>Forma Pagto.</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>Caixa / Origem</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>Vencimento</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>Valor</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreviewData.slice(0, 10).map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 600 }}>{row.description}</td>
                          <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{row.categoryName}</td>
                          <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{row.clientName || "Sem cliente"}</td>
                          <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{row.paymentMethodName || "Padrão / Não definida"}</td>
                          <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{row.cashPointName || "Padrão"}</td>
                          <td style={{ padding: "8px 12px" }}>{row.dueDateFormatted}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: "#10b981" }}>
                            R$ {Number(row.amount).toFixed(2)}
                          </td>
                          <td style={{ padding: "8px 12px" }}>{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importPreviewData.length > 10 && (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center" }}>
                    Mostrando os primeiros 10 de {importPreviewData.length} registros...
                  </span>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                disabled={isImporting}
                className="btn btn-secondary"
                style={{ padding: "9px 18px", borderRadius: "8px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting || !importStats || importStats.total === 0}
                className="btn btn-primary"
                style={{
                  padding: "9px 24px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: (!importStats || importStats.total === 0) ? 0.6 : 1,
                  boxShadow: "0 4px 12px var(--primary-glow)"
                }}
              >
                <Upload size={16} />
                {isImporting ? (importProgress || "Importando registros...") : `Importar ${importStats ? importStats.total : 0} Receita(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
