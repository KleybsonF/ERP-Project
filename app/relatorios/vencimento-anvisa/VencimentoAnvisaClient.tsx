"use client";

import PeriodSelector from "@/app/components/PeriodSelector";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Download, AlertTriangle, FileText } from "lucide-react";

export default function VencimentoAnvisaClient({ 
  data, currentPeriod, currentStart, currentEnd 
}: { 
  data: any[], currentPeriod: string, currentStart: string, currentEnd: string 
}) {

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Relatório - Vencimento Anvisa", 14, 15);
    
    const tableColumn = ["Ocorrência", "Cliente", "Cidade", "Status Ocorrência", "Venc. Anvisa", "Situação"];
    const tableRows: any[] = [];

    const now = new Date();

    data.forEach(item => {
      const anvisaDate = new Date(item.anvisaExpiry);
      const isExpired = anvisaDate < now;
      const daysDiff = Math.ceil((anvisaDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      let situacao = "";
      if (isExpired) situacao = "Expirado";
      else if (daysDiff <= 30) situacao = `Vence em ${daysDiff} dias`;
      else situacao = "No prazo";

      const row = [
        `#${item.id}`,
        item.customer.name,
        item.location?.city || "-",
        item.status,
        anvisaDate.toLocaleDateString("pt-BR", { timeZone: "UTC" }),
        situacao
      ];
      tableRows.push(row);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save("vencimento_anvisa.pdf");
  };

  const exportExcel = () => {
    const now = new Date();
    const rows = data.map(item => {
      const anvisaDate = new Date(item.anvisaExpiry);
      const daysDiff = Math.ceil((anvisaDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      const isExpired = daysDiff < 0;
      let situacao = "";
      if (isExpired) situacao = `Expirado há ${Math.abs(daysDiff)} dias`;
      else situacao = `Faltam ${daysDiff} dias`;

      return {
        "Ocorrência": `#${item.id}`,
        "Cliente": item.customer.name,
        "Cidade": item.location?.city || "-",
        "Status Ocorrência": item.status,
        "Vencimento Anvisa": anvisaDate.toLocaleDateString("pt-BR", { timeZone: "UTC" }),
        "Situação": situacao
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vencimentos");
    XLSX.writeFile(workbook, "vencimento_anvisa.xlsx");
  };

  const now = new Date();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="flex-between">
        <h1 className="page-title" style={{ margin: 0 }}>Relatório - Vencimento Anvisa</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={exportExcel} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} /> Excel
          </button>
          <button onClick={exportPDF} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="card">
        <PeriodSelector 
          currentPeriod={currentPeriod}
          currentStart={currentStart}
          currentEnd={currentEnd}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Ocorrência</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Cliente</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Cidade</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Venc. Anvisa</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Situação</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status Ocorrência</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum vencimento encontrado para o período selecionado.
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const anvisaDate = new Date(item.anvisaExpiry);
                  const daysDiff = Math.ceil((anvisaDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  const isExpired = daysDiff < 0;
                  
                  let badgeClass = "badge-success";
                  let situacao = `Faltam ${daysDiff} dias`;
                  
                  if (isExpired) {
                    badgeClass = "badge-danger";
                    situacao = `Expirado há ${Math.abs(daysDiff)} dias`;
                  } else if (daysDiff <= 30) {
                    badgeClass = "badge-warning";
                  }

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px', fontWeight: 600 }}>#{item.id}</td>
                      <td style={{ padding: '16px', fontWeight: 500 }}>{item.customer.name}</td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{item.location?.city || "-"}</td>
                      <td style={{ padding: '16px', fontWeight: 500 }}>{anvisaDate.toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {(isExpired || daysDiff <= 30) && <AlertTriangle size={12} />}
                          {situacao}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{item.status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
