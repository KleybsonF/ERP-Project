"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  DollarSign, 
  Tag, 
  Layers, 
  CreditCard,
  User,
  Wallet,
  Calendar,
  Check,
  RefreshCw
} from "lucide-react";
import { importReceivables, ImportReceivableItem } from "@/app/actions/financeiro";

export default function ImportarReceitasClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [items, setItems] = useState<ImportReceivableItem[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(5000);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; batch: number; totalBatches: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Normalizador de cabeçalho
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

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    setImportError(null);
    setImportSuccessCount(null);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + " KB");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: "yyyy-mm-dd" });

        if (jsonRows.length < 2) {
          setImportError("O arquivo Excel selecionado está vazio ou não contém registros com dados.");
          setIsProcessingFile(false);
          return;
        }

        const headers: string[] = jsonRows[0].map((h: any) => normalizeHeader(String(h || "")));
        const dataRows = jsonRows.slice(1, 5001); // Limite de até 5.000 registros

        const parsedItems: ImportReceivableItem[] = [];

        for (const row of dataRows) {
          if (!row || row.length === 0) continue;

          let desc = "";
          let cat = "";
          let valRaw: any = 0;
          let dueRaw: any = "";
          let pm = "";
          let cx = "";
          let client = "";
          let st = "";

          headers.forEach((h, idx) => {
            const val = row[idx];
            if (val === undefined || val === null || String(val).trim() === "") return;

            if (h.includes("descricao") || h.includes("historico") || h.includes("item") || h.includes("detalhe") || h.includes("servico")) {
              desc = String(val).trim();
            } else if (h.includes("categoria") || h.includes("tipo") || h.includes("plano")) {
              cat = String(val).trim();
            } else if (h.includes("valor") || h.includes("total") || h.includes("preco") || h.includes("quantia")) {
              valRaw = val;
            } else if (h.includes("vencimento") || h.includes("data")) {
              dueRaw = val;
            } else if (h.includes("formadepagamento") || h.includes("formapagto") || h.includes("formapagamento") || h.includes("formadepagto") || h.includes("meiodepagamento") || (h.includes("forma") && !h.includes("caixa")) || h.includes("metodopagamento")) {
              pm = String(val).trim();
            } else if (h.includes("caixa") || h.includes("pontodepagamento") || h.includes("pontorecebimento") || h.includes("origem") || h.includes("destino") || h.includes("pontopagamento")) {
              cx = String(val).trim();
            } else if (h.includes("favorecido") || h.includes("fornecedor") || h.includes("cliente") || h.includes("tomador") || h.includes("pagador")) {
              client = String(val).trim();
            } else if (h.includes("pagamento") && !h.includes("caixa") && !h.includes("ponto")) {
              pm = String(val).trim();
            } else if (h.includes("status")) {
              st = String(val).trim();
            }
          });

          if (!desc && !valRaw) continue;

          let amount = parseExcelAmount(valRaw);
          if (amount === 0) amount = 0;

          // Parse de data
          let dueDateStr = new Date().toISOString().split("T")[0];
          if (dueRaw) {
            if (dueRaw instanceof Date && !isNaN(dueRaw.getTime())) {
              dueDateStr = dueRaw.toISOString().split("T")[0];
            } else {
              const strDate = String(dueRaw).trim();
              if (strDate.includes("/")) {
                const parts = strDate.split("/");
                if (parts.length === 3) {
                  const d = parts[0].padStart(2, "0");
                  const m = parts[1].padStart(2, "0");
                  const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                  dueDateStr = `${y}-${m}-${d}`;
                }
              } else if (strDate.includes("-")) {
                dueDateStr = strDate;
              }
            }
          }

          parsedItems.push({
            description: desc || "Receita Importada",
            categoryName: cat || "Outras Receitas",
            amount: Math.abs(amount),
            due_date: dueDateStr,
            cashPointName: cx || undefined,
            clientName: client || undefined,
            paymentMethodName: pm || undefined,
            status: st || "Pendente"
          });
        }

        if (parsedItems.length === 0) {
          setImportError("Não foi possível identificar linhas com dados válidos na planilha.");
          setIsProcessingFile(false);
          return;
        }

        setItems(parsedItems);
        setCurrentPage(1);
      } catch (err: any) {
        setImportError("Falha ao ler a planilha: " + (err?.message || "formato inválido"));
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleClear = () => {
    setItems([]);
    setFileName("");
    setFileSize("");
    setImportError(null);
    setImportSuccessCount(null);
    setImportProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Estatísticas calculadas
  const stats = useMemo(() => {
    if (items.length === 0) return null;
    let totalSum = 0;
    const catSet = new Set<string>();
    let recebidos = 0;
    let pendentes = 0;

    items.forEach((it) => {
      totalSum += it.amount || 0;
      if (it.categoryName) catSet.add(it.categoryName);
      const st = (it.status || "").toLowerCase();
      if (st.includes("receb") || st.includes("pago")) recebidos++;
      else pendentes++;
    });

    return {
      totalCount: items.length,
      totalSum,
      totalCategories: catSet.size,
      recebidos,
      pendentes
    };
  }, [items]);

  // Filtro de busca na prévia
  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return items;
    const q = searchFilter.toLowerCase();
    return items.filter((it) => 
      it.description.toLowerCase().includes(q) ||
      (it.categoryName && it.categoryName.toLowerCase().includes(q)) ||
      (it.clientName && it.clientName.toLowerCase().includes(q)) ||
      (it.paymentMethodName && it.paymentMethodName.toLowerCase().includes(q)) ||
      (it.cashPointName && it.cashPointName.toLowerCase().includes(q))
    );
  }, [items, searchFilter]);

  // Paginação / Exibição ampliada
  const displayedItems = useMemo(() => {
    if (pageSize >= 5000) return filteredItems;
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;

  // Processo de importação em lotes
  const handleConfirmImport = async () => {
    if (items.length === 0) return;
    setIsImporting(true);
    setImportError(null);

    const BATCH_SIZE = 150;
    const totalItems = items.length;
    const totalBatches = Math.ceil(totalItems / BATCH_SIZE);
    let totalImported = 0;

    try {
      for (let i = 0; i < totalItems; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

        setImportProgress({
          current: Math.min(i + chunk.length, totalItems),
          total: totalItems,
          batch: batchNum,
          totalBatches
        });

        const res = await importReceivables(chunk);
        totalImported += (res.count || chunk.length);
      }

      setImportSuccessCount(totalImported);
    } catch (err: any) {
      setImportError("Erro ao processar importação: " + (err?.message || "falha na gravação do lote"));
    } finally {
      setIsImporting(false);
    }
  };

  const progressPercent = importProgress 
    ? Math.round((importProgress.current / importProgress.total) * 100) 
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1500px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* CABEÇALHO DA TELA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <Link
              href="/financeiro/receitas"
              className="btn btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                textDecoration: "none"
              }}
            >
              <ArrowLeft size={14} /> Voltar para Contas a Receber
            </Link>
            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>/</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--primary-color)" }}>Importação em Lote</span>
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: "24px" }}>
            Importar Contas a Receber
          </h1>
          <p className="page-description" style={{ margin: "4px 0 0 0" }}>
            Carregue sua planilha Excel (.xlsx, .xls) com até 5.000 lançamentos. Visualize e valide todos os registros antes de confirmar.
          </p>
        </div>

        {/* BOTÃO BAIXAR MODELO OFICIAL */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <a
            href="/api/modelos/contas-a-receber"
            download
            className="btn btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              border: "1px dashed var(--primary-color)",
              color: "var(--primary-color)",
              background: "rgba(14, 165, 233, 0.05)"
            }}
          >
            <Download size={16} /> Baixar Planilha Modelo (.xlsx)
          </a>
        </div>
      </div>

      {/* TELA DE SUCESSO APÓS IMPORTAÇÃO */}
      {importSuccessCount !== null ? (
        <div style={{
          background: "var(--bg-color-soft)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "16px",
          padding: "48px 32px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(16, 185, 129, 0.1)"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.15)",
            color: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px"
          }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 8px 0" }}>
            Importação Concluída com Sucesso!
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "550px", margin: "0 auto 24px" }}>
            Foram registradas e salvas com sucesso <strong>{importSuccessCount} contas a receber</strong> no banco de dados.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={handleClear}
              className="btn btn-secondary"
              style={{ padding: "10px 20px", borderRadius: "10px", fontWeight: 600 }}
            >
              Importar Nova Planilha
            </button>
            <button
              onClick={() => router.push("/financeiro/receitas?period=todos")}
              className="btn btn-primary"
              style={{ padding: "10px 24px", borderRadius: "10px", fontWeight: 600 }}
            >
              Ver Títulos no Contas a Receber
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* SEÇÃO DE UPLOAD */}
          {items.length === 0 ? (
            <div
              style={{
                background: "var(--bg-color-soft)",
                border: "2px dashed var(--glass-border)",
                borderRadius: "16px",
                padding: "60px 24px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--primary-color)";
                e.currentTarget.style.background = "rgba(14, 165, 233, 0.04)";
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--glass-border)";
                e.currentTarget.style.background = "var(--bg-color-soft)";
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--glass-border)";
                e.currentTarget.style.background = "var(--bg-color-soft)";
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "var(--primary-glow)",
                color: "var(--primary-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px"
              }}>
                <FileSpreadsheet size={28} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px 0" }}>
                {isProcessingFile ? "Lendo e validando planilha..." : "Selecione ou arraste seu arquivo Excel"}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", maxWidth: "480px", margin: "0 auto 18px" }}>
                Formatos aceitos: <strong>.xlsx</strong> e <strong>.xls</strong>. Suporta colunas de Descrição, Categoria, Valor, Vencimento, Forma de Pagamento, Caixa/Origem, Cliente e Status.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isProcessingFile}
                style={{ padding: "10px 24px", borderRadius: "10px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <Upload size={16} />
                {isProcessingFile ? "Processando..." : "Escolher Arquivo do Computador"}
              </button>
            </div>
          ) : (
            /* BARRA DE INFORMAÇÕES DO ARQUIVO CARREGADO */
            <div style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "14px",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>
                    {fileName}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Tamanho: {fileSize} • <strong>{items.length}</strong> registro(s) carregado(s)
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isImporting}
                  className="btn btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#ef4444"
                  }}
                >
                  <Trash2 size={14} /> Trocar Arquivo
                </button>
              </div>
            </div>
          )}

          {/* MENSAGEM DE ERRO SE HOUVER */}
          {importError && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#ef4444",
              fontSize: "13px"
            }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div>{importError}</div>
            </div>
          )}

          {/* PAINEL DE PROGRESSO DE IMPORTAÇÃO EM TEMPO REAL */}
          {isImporting && importProgress && (
            <div style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--primary-color)",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              boxShadow: "0 8px 24px var(--primary-glow)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: 600 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <RefreshCw size={15} className="spin" />
                  Importando Lote {importProgress.batch} de {importProgress.totalBatches}...
                </span>
                <span style={{ color: "var(--primary-color)" }}>
                  {importProgress.current} de {importProgress.total} registros ({progressPercent}%)
                </span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "rgba(0,0,0,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "var(--primary-color)",
                  transition: "width 0.25s ease"
                }} />
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Por favor, aguarde. Os registros estão sendo processados e salvos de forma segura no banco de dados.
              </span>
            </div>
          )}

          {/* SEÇÃO PRINCIPAL DA PRÉVIA AMPLIADA */}
          {items.length > 0 && stats && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* CARDS DE RESUMO (KPIs) */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px"
              }}>
                <div style={{
                  background: "var(--bg-color-soft)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "14px",
                  padding: "16px 20px"
                }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Layers size={14} color="var(--primary-color)" /> Total de Registros
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)" }}>
                    {stats.totalCount.toLocaleString("pt-BR")}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Prontos para importação
                  </div>
                </div>

                <div style={{
                  background: "var(--bg-color-soft)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "14px",
                  padding: "16px 20px"
                }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <DollarSign size={14} color="#10b981" /> Valor Total Somado
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981" }}>
                    R$ {stats.totalSum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Média de R$ {(stats.totalSum / stats.totalCount).toFixed(2)} por título
                  </div>
                </div>

                <div style={{
                  background: "var(--bg-color-soft)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "14px",
                  padding: "16px 20px"
                }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Tag size={14} color="#8b5cf6" /> Categorias Detectadas
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)" }}>
                    {stats.totalCategories}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Serão vinculadas automaticamente
                  </div>
                </div>

                <div style={{
                  background: "var(--bg-color-soft)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "14px",
                  padding: "16px 20px"
                }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={14} color="#3b82f6" /> Status da Cobrança
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#f59e0b" }}>
                      {stats.pendentes} <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)" }}>Pend.</span>
                    </span>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#10b981" }}>
                      {stats.recebidos} <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)" }}>Rec.</span>
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Classificados pela coluna Status
                  </div>
                </div>
              </div>

              {/* BARRA DE CONTROLE DA TABELA: BUSCA E PAGINAÇÃO */}
              <div style={{
                background: "var(--bg-color-soft)",
                border: "1px solid var(--glass-border)",
                borderRadius: "14px",
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1", minWidth: "260px" }}>
                  <div style={{ position: "relative", width: "100%", maxWidth: "380px" }}>
                    <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      placeholder="Pesquisar por descrição, categoria, cliente..."
                      value={searchFilter}
                      onChange={(e) => {
                        setSearchFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="sgp-input"
                      style={{ paddingLeft: "36px", width: "100%", fontSize: "13px" }}
                    />
                  </div>
                  {searchFilter && (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {filteredItems.length} resultado(s)
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Exibição:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="sgp-input"
                      style={{ fontSize: "12px", padding: "6px 10px" }}
                    >
                      <option value={100}>100 por página</option>
                      <option value={500}>500 por página</option>
                      <option value={1000}>1.000 por página</option>
                      <option value={5000}>Todos até 5.000</option>
                    </select>
                  </div>

                  {pageSize < 5000 && totalPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="btn btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "12px" }}
                      >
                        Anterior
                      </button>
                      <span style={{ color: "var(--text-muted)" }}>
                        {currentPage} de {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="btn btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "12px" }}
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* TABELA DE PRÉ-VISUALIZAÇÃO AMPLIADA */}
              <div style={{
                background: "var(--bg-color-soft)",
                border: "1px solid var(--glass-border)",
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
              }}>
                <div style={{ maxHeight: "65vh", overflowY: "auto", position: "relative" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg-color-soft)" }}>
                      <tr style={{ borderBottom: "2px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "12px 14px", fontWeight: 700, width: "50px", textAlign: "center" }}>#</th>
                        <th style={{ padding: "12px 14px", fontWeight: 700 }}>Descrição</th>
                        <th style={{ padding: "12px 14px", fontWeight: 700 }}>Categoria</th>
                        <th style={{ padding: "12px 14px", fontWeight: 700 }}>Cliente</th>
                        <th style={{ padding: "12px 14px", fontWeight: 700 }}>Forma Pagto.</th>
                        <th style={{ padding: "12px 14px", fontWeight: 700 }}>Caixa / Origem</th>
                        <th style={{ padding: "12px 14px", fontWeight: 700 }}>Vencimento</th>
                        <th style={{ padding: "12px 14px", fontWeight: 700 }}>Valor</th>
                        <th style={{ padding: "12px 14px", fontWeight: 700 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedItems.map((item, idx) => {
                        const globalIndex = pageSize >= 5000 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                        const isRecebido = (item.status || "").toLowerCase().includes("receb") || (item.status || "").toLowerCase().includes("pago");

                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: "1px solid var(--glass-border)",
                              transition: "background 0.1s"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.015)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>
                              {globalIndex}
                            </td>
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-main)" }}>
                              {item.description}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: "rgba(14, 165, 233, 0.1)",
                                color: "var(--primary-color)",
                                fontSize: "11px",
                                fontWeight: 600
                              }}>
                                <Tag size={10} /> {item.categoryName}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px", color: item.clientName ? "var(--text-main)" : "var(--text-muted)", fontStyle: item.clientName ? "normal" : "italic" }}>
                              {item.clientName ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                  <User size={12} color="var(--text-muted)" /> {item.clientName}
                                </span>
                              ) : (
                                "Sem cliente (avulso)"
                              )}
                            </td>
                            <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <CreditCard size={12} color="var(--text-muted)" />
                                {item.paymentMethodName || "Padrão / Não definida"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <Wallet size={12} color="var(--text-muted)" />
                                {item.cashPointName || "Padrão"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--text-secondary)" }}>
                                <Calendar size={12} color="var(--text-muted)" />
                                {item.due_date ? String(item.due_date).split("T")[0] : "-"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px", fontWeight: 700, color: "#10b981", whiteSpace: "nowrap" }}>
                              R$ {Number(item.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                background: isRecebido ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                                color: isRecebido ? "#10b981" : "#f59e0b"
                              }}>
                                {isRecebido ? <Check size={10} /> : null}
                                {item.status || "Pendente"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* BARRA INFERIOR DA TABELA COM TOTAIS */}
                <div style={{
                  padding: "14px 20px",
                  borderTop: "1px solid var(--glass-border)",
                  background: "rgba(0,0,0,0.015)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px"
                }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    Exibindo <strong>{displayedItems.length}</strong> de <strong>{filteredItems.length}</strong> registros verificados
                  </span>
                  <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      Subtotal Exibido: <strong style={{ color: "var(--text-main)" }}>
                        R$ {displayedItems.reduce((acc, it) => acc + (it.amount || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTÕES DE AÇÃO PRINCIPAL NO RODAPÉ */}
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "14px",
                marginTop: "10px",
                position: "sticky",
                bottom: "16px",
                background: "var(--bg-color-soft)",
                padding: "16px 20px",
                borderRadius: "14px",
                border: "1px solid var(--glass-border)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
              }}>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isImporting}
                  className="btn btn-secondary"
                  style={{ padding: "11px 20px", borderRadius: "10px", fontWeight: 600 }}
                >
                  Cancelar e Limpar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImporting || items.length === 0}
                  className="btn btn-primary"
                  style={{
                    padding: "11px 32px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 6px 18px var(--primary-glow)"
                  }}
                >
                  <Upload size={18} />
                  {isImporting 
                    ? `Importando... (${importProgress ? importProgress.current : 0}/${items.length})` 
                    : `Confirmar e Importar ${items.length.toLocaleString("pt-BR")} Contas a Receber`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
