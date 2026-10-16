"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Layers, 
  PieChart as PieIcon, 
  BarChart3, 
  ChevronRight, 
  Calendar, 
  Filter, 
  Search, 
  ArrowLeft,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Printer
} from "lucide-react";
import { 
  DRERowData, 
  DREKpis, 
  getDREReportData 
} from "@/app/actions/relatoriosFinanceiros";
import { 
  formatCurrency, 
  exportToExcel, 
  exportToPdf, 
  CompanyInfo, 
  ColumnDef 
} from "../utils/exportUtils";

interface DREClientProps {
  initialData: {
    year: number;
    regime: "competencia" | "caixa";
    consider: "realizado" | "projetado";
    companyInfo: CompanyInfo;
    rows: DRERowData[];
    kpis: DREKpis;
    monthlyChartData: {
      label: string;
      fullName: string;
      receitaLiquida: number;
      custosEDespesas: number;
      lucroBruto: number;
      resultadoLiquido: number;
    }[];
    expenseSlices: {
      label: string;
      value: number;
    }[];
  };
}

const MONTHS_HEADER = [
  { key: "jan", label: "JANEIRO" },
  { key: "fev", label: "FEVEREIRO" },
  { key: "mar", label: "MARÇO" },
  { key: "abr", label: "ABRIL" },
  { key: "mai", label: "MAIO" },
  { key: "jun", label: "JUNHO" },
  { key: "jul", label: "JULHO" },
  { key: "ago", label: "AGOSTO" },
  { key: "set", label: "SETEMBRO" },
  { key: "out", label: "OUTUBRO" },
  { key: "nov", label: "NOVEMBRO" },
  { key: "dez", label: "DEZEMBRO" }
];

export default function DREClient({ initialData }: DREClientProps) {
  const [data, setData] = useState(initialData);
  const [year, setYear] = useState<number>(initialData.year);
  const [regime, setRegime] = useState<"competencia" | "caixa">(initialData.regime);
  const [consider, setConsider] = useState<"realizado" | "projetado">(initialData.consider);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showPercentages, setShowPercentages] = useState<boolean>(false);
  const [showCharts, setShowCharts] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  const handleApplyFilter = (newYear: number, newRegime: "competencia" | "caixa", newConsider: "realizado" | "projetado") => {
    setYear(newYear);
    setRegime(newRegime);
    setConsider(newConsider);

    startTransition(async () => {
      try {
        const res = await getDREReportData({
          year: newYear,
          regime: newRegime,
          consider: newConsider
        });
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar dados do DRE:", err);
      }
    });
  };

  // Formatação compacta numérica (0,00) similar ao print do ERP
  const formatCellNumber = (val: number | undefined | null) => {
    if (val === undefined || val === null) return "0,00";
    return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Linhas filtradas pela busca
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return data.rows;
    const term = searchTerm.toLowerCase();
    return data.rows.filter(r => 
      r.description.toLowerCase().includes(term) || 
      (r.code && r.code.includes(term))
    );
  }, [data.rows, searchTerm]);

  // Exportação Excel
  const handleExportExcel = () => {
    const excelColumns: ColumnDef[] = [
      { header: "CÓD.", dataKey: "code", align: "left" },
      { header: "DESCRIÇÃO", dataKey: "description", align: "left" },
      { header: "JANEIRO", dataKey: "jan", align: "right" },
      { header: "FEVEREIRO", dataKey: "fev", align: "right" },
      { header: "MARÇO", dataKey: "mar", align: "right" },
      { header: "ABRIL", dataKey: "abr", align: "right" },
      { header: "MAIO", dataKey: "mai", align: "right" },
      { header: "JUNHO", dataKey: "jun", align: "right" },
      { header: "JULHO", dataKey: "jul", align: "right" },
      { header: "AGOSTO", dataKey: "ago", align: "right" },
      { header: "SETEMBRO", dataKey: "set", align: "right" },
      { header: "OUTUBRO", dataKey: "out", align: "right" },
      { header: "NOVEMBRO", dataKey: "nov", align: "right" },
      { header: "DEZEMBRO", dataKey: "dez", align: "right" },
      { header: "TOTAL", dataKey: "total", align: "right" },
      { header: "% ROL", dataKey: "percentageStr", align: "right" }
    ];

    const excelRows = data.rows.map(r => ({
      code: r.code || "",
      description: r.level > 0 ? `   ${r.description}` : r.description,
      jan: formatCellNumber(r.jan),
      fev: formatCellNumber(r.fev),
      mar: formatCellNumber(r.mar),
      abr: formatCellNumber(r.abr),
      mai: formatCellNumber(r.mai),
      jun: formatCellNumber(r.jun),
      jul: formatCellNumber(r.jul),
      ago: formatCellNumber(r.ago),
      set: formatCellNumber(r.set),
      out: formatCellNumber(r.out),
      nov: formatCellNumber(r.nov),
      dez: formatCellNumber(r.dez),
      total: formatCellNumber(r.total),
      percentageStr: r.percentage !== undefined ? `${r.percentage.toFixed(1)}%` : "-"
    }));

    exportToExcel({
      reportTitle: `Demonstração do Resultado do Exercício (DRE) - ${year}`,
      filename: `dre-gerencial-${year}-${regime}`,
      columns: excelColumns,
      rows: excelRows,
      filtersSummary: [
        { label: "Ano de Referência", value: String(year) },
        { label: "Regime", value: regime === "competencia" ? "Competência" : "Caixa" },
        { label: "Base de Dados", value: consider === "realizado" ? "Apenas Realizado" : "Realizado + Projetado" }
      ],
      kpiSummary: [
        { label: "Receita Bruta", value: formatCurrency(data.kpis.receitaBrutaAnual) },
        { label: "Receita Líquida", value: formatCurrency(data.kpis.receitaLiquidaAnual) },
        { label: "Lucro Bruto", value: `${formatCurrency(data.kpis.lucroBrutoAnual)} (${data.kpis.margemBrutaPercent.toFixed(1)}%)` },
        { label: "Despesas Operacionais", value: formatCurrency(data.kpis.despesasOperacionaisAnual) },
        { label: "Resultado Líquido", value: `${formatCurrency(data.kpis.resultadoLiquidoAnual)} (${data.kpis.margemLiquidaPercent.toFixed(1)}%)` }
      ],
      companyInfo: data.companyInfo
    });
  };

  // Exportação PDF
  const handleExportPdf = () => {
    const pdfColumns: ColumnDef[] = [
      { header: "Cód.", dataKey: "code", align: "left", width: 14 },
      { header: "Descrição da Conta", dataKey: "description", align: "left", width: 55 },
      { header: "Jan", dataKey: "jan", align: "right" },
      { header: "Fev", dataKey: "fev", align: "right" },
      { header: "Mar", dataKey: "mar", align: "right" },
      { header: "Abr", dataKey: "abr", align: "right" },
      { header: "Mai", dataKey: "mai", align: "right" },
      { header: "Jun", dataKey: "jun", align: "right" },
      { header: "Jul", dataKey: "jul", align: "right" },
      { header: "Ago", dataKey: "ago", align: "right" },
      { header: "Set", dataKey: "set", align: "right" },
      { header: "Out", dataKey: "out", align: "right" },
      { header: "Nov", dataKey: "nov", align: "right" },
      { header: "Dez", dataKey: "dez", align: "right" },
      { header: "Total Anual", dataKey: "total", align: "right" }
    ];

    const pdfRows = data.rows.map(r => ({
      code: r.code || "",
      description: r.level > 0 ? `  ${r.description}` : r.description.toUpperCase(),
      jan: formatCellNumber(r.jan),
      fev: formatCellNumber(r.fev),
      mar: formatCellNumber(r.mar),
      abr: formatCellNumber(r.abr),
      mai: formatCellNumber(r.mai),
      jun: formatCellNumber(r.jun),
      jul: formatCellNumber(r.jul),
      ago: formatCellNumber(r.ago),
      set: formatCellNumber(r.set),
      out: formatCellNumber(r.out),
      nov: formatCellNumber(r.nov),
      dez: formatCellNumber(r.dez),
      total: formatCellNumber(r.total)
    }));

    exportToPdf({
      reportTitle: `Demonstração do Resultado do Exercício (DRE) - Exercício ${year}`,
      filename: `dre-gerencial-${year}`,
      columns: pdfColumns,
      rows: pdfRows,
      filtersSummary: [
        { label: "Exercício", value: String(year) },
        { label: "Regime", value: regime === "competencia" ? "Competência" : "Caixa" },
        { label: "Critério", value: consider === "realizado" ? "Apenas Liquidados" : "Liquidados + Projetados" }
      ],
      kpiSummary: [
        { label: "Receita Líquida", value: formatCurrency(data.kpis.receitaLiquidaAnual) },
        { label: "Margem Bruta", value: `${data.kpis.margemBrutaPercent.toFixed(1)}%` },
        { label: "Despesas Op.", value: formatCurrency(data.kpis.despesasOperacionaisAnual) },
        { label: "Resultado Líquido", value: formatCurrency(data.kpis.resultadoLiquidoAnual) },
        { label: "Margem Líquida", value: `${data.kpis.margemLiquidaPercent.toFixed(1)}%` }
      ],
      companyInfo: data.companyInfo
    });
  };

  const maxMonthlyVal = Math.max(
    ...data.monthlyChartData.map(d => Math.max(d.receitaLiquida, d.custosEDespesas, Math.abs(d.resultadoLiquido))),
    1
  );

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Breadcrumb e Topo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
            <Link href="/relatorios/financeiro" style={{ color: "var(--primary-color)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <ArrowLeft size={13} /> Central Financeira
            </Link>
            <ChevronRight size={12} />
            <span style={{ color: "var(--text-main)", fontWeight: 600 }}>DRE Gerencial</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              padding: "10px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <FileSpreadsheet size={24} color="var(--primary-color)" />
            </div>
            <div>
              <h1 className="page-title" style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>
                Demonstração do Resultado do Exercício (DRE)
              </h1>
              <p className="page-description" style={{ margin: "3px 0 0 0", fontSize: "13px" }}>
                Visão mensal comparativa de receitas operacionais, custos diretos, despesas e apuração do resultado líquido.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação de Exportação */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="btn-excel"
            onClick={handleExportExcel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 15px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              borderRadius: "8px",
              border: "none"
            }}
            title="Exportar DRE em planilha Excel"
          >
            <FileSpreadsheet size={16} />
            <span>Exportar Excel</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportPdf}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 15px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: "8px"
            }}
            title="Exportar DRE formatado para PDF"
          >
            <FileText size={16} color="var(--primary-color)" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards de Resumo Executivo */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {/* Receita Operacional Bruta */}
        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Receita Bruta Total
            </span>
            <div style={{ background: "rgba(59, 130, 246, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <TrendingUp size={16} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>
            {formatCurrency(data.kpis.receitaBrutaAnual)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Faturamento acumulado em {year}
          </div>
        </div>

        {/* Receita Operacional Líquida */}
        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Receita Líquida (ROL)
            </span>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <DollarSign size={16} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#10b981" }}>
            {formatCurrency(data.kpis.receitaLiquidaAnual)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Após deduções, cancelamentos e taxas
          </div>
        </div>

        {/* Lucro Bruto Operacional */}
        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Lucro Bruto (Margem)
            </span>
            <div style={{ background: "rgba(245, 158, 11, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <Percent size={16} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>
            {formatCurrency(data.kpis.lucroBrutoAnual)}
          </div>
          <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px", fontWeight: 700 }}>
            Margem Bruta: {data.kpis.margemBrutaPercent.toFixed(1)}%
          </div>
        </div>

        {/* Despesas Operacionais Totais */}
        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Despesas Operacionais
            </span>
            <div style={{ background: "rgba(239, 68, 68, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <TrendingDown size={16} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>
            {formatCurrency(data.kpis.despesasOperacionaisAnual)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Administrativas, Pessoal & Comerciais
          </div>
        </div>

        {/* Resultado Líquido do Exercício */}
        <div className="glass-panel" style={{
          padding: "18px 20px",
          border: data.kpis.resultadoLiquidoAnual >= 0 ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
          background: data.kpis.resultadoLiquidoAnual >= 0 ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Resultado Líquido Anual
            </span>
            <div style={{
              background: data.kpis.resultadoLiquidoAnual >= 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              padding: "6px",
              borderRadius: "8px"
            }}>
              <Sparkles size={16} color={data.kpis.resultadoLiquidoAnual >= 0 ? "#10b981" : "#ef4444"} />
            </div>
          </div>
          <div style={{
            fontSize: "22px",
            fontWeight: 800,
            color: data.kpis.resultadoLiquidoAnual >= 0 ? "#10b981" : "#ef4444"
          }}>
            {formatCurrency(data.kpis.resultadoLiquidoAnual)}
          </div>
          <div style={{
            fontSize: "11px",
            color: data.kpis.resultadoLiquidoAnual >= 0 ? "#10b981" : "#ef4444",
            marginTop: "4px",
            fontWeight: 700
          }}>
            Margem Líquida: {data.kpis.margemLiquidaPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Controles Executivos */}
      <div className="glass-panel" style={{ padding: "16px 20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            {/* Seletor de Ano */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                Exercício:
              </span>
              <select
                value={year}
                onChange={e => handleApplyFilter(Number(e.target.value), regime, consider)}
                style={{
                  background: "var(--bg-color-soft)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-main)",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </div>

            {/* Regime Contábil */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                Regime:
              </span>
              <div style={{
                display: "inline-flex",
                background: "var(--bg-color-soft)",
                borderRadius: "8px",
                padding: "3px",
                border: "1px solid var(--glass-border)"
              }}>
                <button
                  type="button"
                  onClick={() => handleApplyFilter(year, "competencia", consider)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: regime === "competencia" ? "var(--primary-color)" : "transparent",
                    color: regime === "competencia" ? "#fff" : "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Competência (Vencimento)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyFilter(year, "caixa", consider)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: regime === "caixa" ? "var(--primary-color)" : "transparent",
                    color: regime === "caixa" ? "#fff" : "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Caixa (Liquidação)
                </button>
              </div>
            </div>

            {/* Critério de Lançamento */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                Base:
              </span>
              <select
                value={consider}
                onChange={e => handleApplyFilter(year, regime, e.target.value as any)}
                style={{
                  background: "var(--bg-color-soft)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-main)",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="projetado">Realizado + Projetado (Todos Ativos)</option>
                <option value="realizado">Apenas Realizado (Liquidados)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Campo de Busca Rápida de Linha */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Filtrar conta contábil..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  background: "var(--bg-color-soft)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-main)",
                  padding: "7px 12px 7px 30px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  width: "190px",
                  outline: "none"
                }}
              />
            </div>

            {/* Alternar exibição de % da ROL */}
            <button
              type="button"
              onClick={() => setShowPercentages(!showPercentages)}
              style={{
                background: showPercentages ? "rgba(59, 130, 246, 0.2)" : "var(--bg-color-soft)",
                border: showPercentages ? "1px solid var(--primary-color)" : "1px solid var(--glass-border)",
                color: showPercentages ? "var(--primary-color)" : "var(--text-secondary)",
                padding: "7px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
              title="Exibir coluna de Análise Vertical (% sobre a Receita Líquida)"
            >
              <Percent size={13} />
              <span>{showPercentages ? "% ROL Ativo" : "Ver % ROL"}</span>
            </button>

            {/* Alternar gráficos */}
            <button
              type="button"
              onClick={() => setShowCharts(!showCharts)}
              style={{
                background: "var(--bg-color-soft)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-secondary)",
                padding: "7px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <BarChart3 size={14} />
              <span>{showCharts ? "Ocultar Gráficos" : "Exibir Gráficos"}</span>
            </button>
          </div>
        </div>

        {isPending && (
          <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--primary-color)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="search-spin">⏳</span> Atualizando consolidação do DRE para o exercício selecionado...
          </div>
        )}
      </div>

      {/* Gráficos Analíticos de Apoio (Opcional) */}
      {showCharts && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
          gap: "20px",
          marginBottom: "24px"
        }}>
          {/* Gráfico 1: Evolução Mensal Comparativa */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                  Evolução Mensal: Receita Líquida vs Resultado
                </h4>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Desempenho operacional mês a mês no exercício {year}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#3b82f6", fontWeight: 600 }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6" }} /> Receita
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#10b981", fontWeight: 600 }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} /> Lucro
                </span>
              </div>
            </div>

            {/* Barras mensais */}
            <div style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              height: "150px",
              paddingTop: "20px",
              paddingBottom: "22px",
              borderBottom: "1px solid var(--glass-border)"
            }}>
              {data.monthlyChartData.map((d, i) => {
                const heightRec = maxMonthlyVal > 0 ? Math.max(Math.round((d.receitaLiquida / maxMonthlyVal) * 100), 4) : 4;
                const heightLucro = maxMonthlyVal > 0 ? Math.max(Math.round((Math.max(d.resultadoLiquido, 0) / maxMonthlyVal) * 100), 2) : 2;

                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", width: "100%", height: "100%", justifyContent: "center" }}>
                      {/* Barra Receita */}
                      <div
                        style={{
                          width: "45%",
                          height: `${heightRec}%`,
                          background: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
                          borderRadius: "4px 4px 1px 1px",
                          transition: "height 0.4s ease"
                        }}
                        title={`${d.fullName} - Receita Líquida: ${formatCurrency(d.receitaLiquida)}`}
                      />
                      {/* Barra Lucro */}
                      <div
                        style={{
                          width: "45%",
                          height: `${heightLucro}%`,
                          background: d.resultadoLiquido >= 0 ? "linear-gradient(180deg, #10b981 0%, #059669 100%)" : "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)",
                          borderRadius: "4px 4px 1px 1px",
                          transition: "height 0.4s ease"
                        }}
                        title={`${d.fullName} - Resultado Líquido: ${formatCurrency(d.resultadoLiquido)}`}
                      />
                    </div>
                    <span style={{ position: "absolute", bottom: "-20px", fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600 }}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico 2: Composição de Custos e Despesas */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                  Composição dos Gastos Operacionais
                </h4>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Principais centros de custos e categorias de despesa do exercício
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "9px", maxHeight: "155px", overflowY: "auto", paddingRight: "6px" }}>
              {data.expenseSlices.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  Sem despesas registradas no exercício.
                </div>
              ) : (
                data.expenseSlices.slice(0, 5).map((s, idx) => {
                  const totalExpenses = data.kpis.custosTotaisAnual + data.kpis.despesasOperacionaisAnual;
                  const pct = totalExpenses > 0 ? ((s.value / totalExpenses) * 100).toFixed(1) : "0";
                  const colors = ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#06b6d4"];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "var(--text-main)", fontWeight: 600, display: "flex", alignItems: "center", gap: "7px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                          <span style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.label}>
                            {s.label}
                          </span>
                        </span>
                        <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                          {formatCurrency(s.value)}{" "}
                          <span style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 500 }}>
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <div style={{ height: "4px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px" }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MATRIZ DRE (TABELA IDÊNTICA AO PADRÃO DA IMAGEM) */}
      {/* ============================================================== */}
      <div className="glass-panel" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--glass-border)" }}>
        <div style={{ overflowX: "auto", position: "relative", maxHeight: "720px", overflowY: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: "12px",
            minWidth: "1250px"
          }}>
            {/* Header da Tabela */}
            <thead>
              <tr style={{
                background: "var(--bg-color-soft)",
                borderBottom: "1px solid var(--glass-border)",
                position: "sticky",
                top: 0,
                zIndex: 20
              }}>
                {/* Coluna DESCRIÇÃO (Sticky Left) */}
                <th style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontWeight: 800,
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  position: "sticky",
                  left: 0,
                  background: "var(--bg-color-soft)",
                  zIndex: 21,
                  boxShadow: "2px 0 5px rgba(0,0,0,0.15)",
                  width: "280px",
                  minWidth: "260px"
                }}>
                  DESCRIÇÃO
                </th>

                {/* 12 Meses */}
                {MONTHS_HEADER.map(m => (
                  <th key={m.key} style={{
                    padding: "12px 10px",
                    textAlign: "right",
                    fontWeight: 800,
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    minWidth: "85px"
                  }}>
                    {m.label}
                  </th>
                ))}

                {/* Coluna TOTAL */}
                <th style={{
                  padding: "12px 14px",
                  textAlign: "right",
                  fontWeight: 800,
                  fontSize: "11px",
                  color: "var(--primary-color)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  minWidth: "100px",
                  background: "rgba(59, 130, 246, 0.05)"
                }}>
                  TOTAL
                </th>

                {/* Coluna Opcional % ROL */}
                {showPercentages && (
                  <th style={{
                    padding: "12px 10px",
                    textAlign: "right",
                    fontWeight: 800,
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    minWidth: "70px"
                  }}>
                    % ROL
                  </th>
                )}
              </tr>
            </thead>

            {/* Corpo da Tabela */}
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={showPercentages ? 15 : 14} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    Nenhuma conta contábil corresponde à busca informada.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isHeader = row.type === "header";
                  const isTotal = row.type === "total";

                  // Estilização hierárquica baseada no print
                  let rowBg = "transparent";
                  let fontColor = "var(--text-main)";
                  let fontWeight = 400;
                  let borderTop = "1px solid rgba(255, 255, 255, 0.03)";
                  let borderBottom = "none";

                  if (isHeader) {
                    rowBg = "rgba(255, 255, 255, 0.02)";
                    fontWeight = 800;
                    fontColor = "var(--text-main)";
                    borderTop = "1px solid var(--glass-border)";
                  } else if (isTotal) {
                    fontWeight = 800;
                    borderTop = "1px solid rgba(255, 255, 255, 0.12)";
                    borderBottom = "1px solid rgba(255, 255, 255, 0.12)";

                    if (row.id === "resultado_liquido") {
                      rowBg = row.total >= 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)";
                      fontColor = row.total >= 0 ? "#10b981" : "#ef4444";
                    } else if (row.id === "rec_liquida" || row.id === "lucro_bruto") {
                      rowBg = "rgba(59, 130, 246, 0.08)";
                      fontColor = "var(--primary-color)";
                    } else {
                      rowBg = "rgba(255, 255, 255, 0.04)";
                    }
                  } else {
                    // Item normal
                    fontColor = "var(--text-secondary)";
                    fontWeight = 500;
                  }

                  const stickyColBg = isHeader 
                    ? "var(--bg-color-soft)" 
                    : isTotal 
                      ? (row.id === "resultado_liquido" ? (row.total >= 0 ? "#062b1b" : "#301014") : "var(--bg-color-soft)")
                      : "var(--bg-card)";

                  return (
                    <tr
                      key={row.id}
                      style={{
                        background: rowBg,
                        borderTop,
                        borderBottom,
                        transition: "background 0.15s ease"
                      }}
                      className="dre-row-hover"
                    >
                      {/* Coluna Descrição (Sticky Left) */}
                      <td style={{
                        padding: isHeader || isTotal ? "10px 16px" : "8px 16px 8px 30px",
                        textAlign: "left",
                        fontWeight,
                        color: fontColor,
                        position: "sticky",
                        left: 0,
                        background: stickyColBg,
                        zIndex: 10,
                        boxShadow: "2px 0 5px rgba(0,0,0,0.15)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "280px"
                      }} title={row.description}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {row.code && (
                            <span style={{
                              fontSize: "10px",
                              color: isHeader || isTotal ? "var(--primary-color)" : "var(--text-muted)",
                              fontWeight: 700,
                              minWidth: "22px"
                            }}>
                              {row.code}
                            </span>
                          )}
                          <span style={{
                            fontSize: isHeader || isTotal ? "12px" : "11.5px",
                            letterSpacing: isHeader ? "0.2px" : "normal"
                          }}>
                            {row.description}
                          </span>
                        </div>
                      </td>

                      {/* 12 Meses */}
                      {MONTHS_HEADER.map(m => {
                        const val = (row as any)[m.key] as number;
                        const isValNegative = val < 0;

                        return (
                          <td
                            key={m.key}
                            style={{
                              padding: "8px 10px",
                              textAlign: "right",
                              fontWeight,
                              color: isValNegative ? "#ef4444" : fontColor,
                              whiteSpace: "nowrap",
                              fontVariantNumeric: "tabular-nums"
                            }}
                          >
                            {formatCellNumber(val)}
                          </td>
                        );
                      })}

                      {/* TOTAL Anual */}
                      <td style={{
                        padding: "8px 14px",
                        textAlign: "right",
                        fontWeight: 800,
                        color: isTotal 
                          ? fontColor 
                          : row.total < 0 
                            ? "#ef4444" 
                            : (isHeader ? "var(--text-main)" : "var(--text-secondary)"),
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                        background: "rgba(59, 130, 246, 0.03)"
                      }}>
                        {formatCellNumber(row.total)}
                      </td>

                      {/* % da ROL */}
                      {showPercentages && (
                        <td style={{
                          padding: "8px 10px",
                          textAlign: "right",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                          whiteSpace: "nowrap"
                        }}>
                          {row.percentage !== undefined ? `${row.percentage.toFixed(1)}%` : "-"}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota Explicativa Contábil */}
      <div style={{
        marginTop: "20px",
        padding: "16px 20px",
        borderRadius: "10px",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid var(--glass-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        fontSize: "12px",
        color: "var(--text-muted)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <HelpCircle size={16} color="var(--primary-color)" />
          <span>
            <strong>Critério Gerencial:</strong> A apuração por <em>Competência</em> considera os vencimentos gerados no exercício; o regime de <em>Caixa</em> reflete estritamente as liquidações efetivadas nas contas financeiras.
          </span>
        </div>
        <div>
          Empresa: <strong>{data.companyInfo?.nomeFantasia || data.companyInfo?.razaoSocial}</strong> • CNPJ: {data.companyInfo?.cnpj || "N/A"}
        </div>
      </div>
    </div>
  );
}
