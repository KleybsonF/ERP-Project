import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ColumnDef {
  header: string;
  dataKey: string;
  align?: "left" | "right" | "center";
  width?: number;
}

export interface FilterBadge {
  label: string;
  value: string;
}

export interface KpiBadge {
  label: string;
  value: string;
}

export interface CompanyInfo {
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  estado?: string;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDateBr(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return "-";
  }
}

export function exportToExcel({
  reportTitle,
  filename,
  columns,
  rows,
  filtersSummary,
  kpiSummary,
  companyInfo
}: {
  reportTitle: string;
  filename: string;
  columns: ColumnDef[];
  rows: any[];
  filtersSummary: FilterBadge[];
  kpiSummary: KpiBadge[];
  companyInfo?: CompanyInfo;
}) {
  const companyName = companyInfo?.nomeFantasia || companyInfo?.razaoSocial || "KFX Tech";
  const nowStr = new Date().toLocaleString("pt-BR");

  // Matriz de dados para o Excel (AOA)
  const aoa: any[][] = [];

  // 1. Cabeçalho da Empresa e Relatório
  aoa.push([companyName.toUpperCase()]);
  aoa.push([`RELATÓRIO: ${reportTitle.toUpperCase()}`]);
  aoa.push([`Emitido em: ${nowStr}`]);
  aoa.push([]);

  // 2. Filtros Aplicados
  if (filtersSummary && filtersSummary.length > 0) {
    const filtersLine = filtersSummary.map(f => `${f.label}: ${f.value}`).join(" | ");
    aoa.push(["FILTROS APLICADOS:", filtersLine]);
    aoa.push([]);
  }

  // 3. Resumo dos Indicadores
  if (kpiSummary && kpiSummary.length > 0) {
    const kpiHeaders = kpiSummary.map(k => k.label);
    const kpiValues = kpiSummary.map(k => k.value);
    aoa.push(["RESUMO EXECUTIVO:"]);
    aoa.push(kpiHeaders);
    aoa.push(kpiValues);
    aoa.push([]);
  }

  // 4. Cabeçalho das Colunas
  const colHeaders = columns.map(c => c.header);
  aoa.push(colHeaders);

  // 5. Linhas de Dados
  rows.forEach(r => {
    const rowValues = columns.map(c => {
      const val = r[c.dataKey];
      if (val === null || val === undefined) return "";
      return val;
    });
    aoa.push(rowValues);
  });

  // Criar planilha
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Ajustar larguras das colunas
  const colWidths = columns.map(c => {
    const maxLen = Math.max(
      c.header.length,
      ...rows.map(r => (r[c.dataKey] ? String(r[c.dataKey]).length : 0))
    );
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");

  const finalName = `${filename.replace(/\.xlsx$/i, "")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, finalName);
}

export function exportToPdf({
  reportTitle,
  filename,
  columns,
  rows,
  filtersSummary,
  kpiSummary,
  companyInfo
}: {
  reportTitle: string;
  filename: string;
  columns: ColumnDef[];
  rows: any[];
  filtersSummary: FilterBadge[];
  kpiSummary: KpiBadge[];
  companyInfo?: CompanyInfo;
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const companyName = companyInfo?.nomeFantasia || companyInfo?.razaoSocial || "KFX Tech";
  const nowStr = new Date().toLocaleString("pt-BR");

  // Cabeçalho da Empresa
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(companyName.toUpperCase(), 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const companyMeta = [
    companyInfo?.cnpj ? `CNPJ: ${companyInfo.cnpj}` : "",
    companyInfo?.telefone ? `Tel: ${companyInfo.telefone}` : "",
    companyInfo?.cidade && companyInfo?.estado ? `${companyInfo.cidade}/${companyInfo.estado}` : ""
  ].filter(Boolean).join(" • ");
  if (companyMeta) {
    doc.text(companyMeta, 14, 16);
  }

  doc.text(`Emitido em: ${nowStr}`, 283, 12, { align: "right" });

  // Título do Relatório
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(reportTitle.toUpperCase(), 14, 23);

  // Linha divisória
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 25, 283, 25);

  let currentY = 28;

  // Box de Filtros
  if (filtersSummary && filtersSummary.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Filtros Aplicados: ", 14, currentY);

    doc.setFont("helvetica", "normal");
    const filtersLine = filtersSummary.map(f => `${f.label}: ${f.value}`).join("  |  ");
    const splitFilters = doc.splitTextToSize(filtersLine, 220);
    doc.text(splitFilters, 40, currentY);

    currentY += splitFilters.length * 4 + 2;
  }

  // Cards de Resumo Executivo (KPIs)
  if (kpiSummary && kpiSummary.length > 0) {
    const cardWidth = Math.min(55, (283 - 14 - (kpiSummary.length - 1) * 4) / kpiSummary.length);
    kpiSummary.slice(0, 5).forEach((kpi, idx) => {
      const cardX = 14 + idx * (cardWidth + 4);
      // Fundo do card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cardX, currentY, cardWidth, 11, 1.5, 1.5, "FD");

      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label.toUpperCase(), cardX + 3, currentY + 4);

      // Value
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(String(kpi.value), cardX + 3, currentY + 8.5);
    });

    currentY += 15;
  }

  // Tabela
  const tableHead = [columns.map(c => c.header)];
  const tableBody = rows.map(r =>
    columns.map(c => {
      const val = r[c.dataKey];
      return val === null || val === undefined ? "-" : String(val);
    })
  );

  const columnStylesObj: { [key: number]: any } = {};
  columns.forEach((c, i) => {
    if (c.align) {
      columnStylesObj[i] = { halign: c.align };
    }
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: "striped",
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: columnStylesObj,
    margin: { left: 14, right: 14, bottom: 14 },
    didDrawPage: data => {
      // Rodapé da página
      const pageNumber = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : (data as any).pageCount || 1;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${data.pageNumber} de ${pageNumber}`,
        283,
        202,
        { align: "right" }
      );
      doc.text(
        "KFX Tech ERP • Sistema de Gestão Empresarial",
        14,
        202
      );
    }
  });

  const finalName = `${filename.replace(/\.pdf$/i, "")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(finalName);
}
