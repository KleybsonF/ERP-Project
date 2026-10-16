"use client";

import React, { useState, useMemo } from "react";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  FileQuestion,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateBr, ColumnDef } from "../utils/exportUtils";

export interface TableColumn<T = any> extends ColumnDef {
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

interface ReportTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  totalAmount?: number;
  totalAmountLabel?: string;
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
  itemsPerPageDefault?: number;
  emptyMessage?: string;
}

export default function ReportTable<T = any>({
  columns,
  data,
  totalAmount,
  totalAmountLabel = "Total Consolidado",
  defaultSortKey,
  defaultSortDir = "asc",
  itemsPerPageDefault = 50,
  emptyMessage = "Nenhum registro encontrado para os filtros selecionados."
}: ReportTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(itemsPerPageDefault);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a: any, b: any) => {
      let va = a[sortKey];
      let vb = b[sortKey];

      // Handle nulls
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;

      // Handle strings
      if (typeof va === "string") {
        const cmp = va.localeCompare(String(vb), "pt-BR", { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      }

      // Handle numbers / dates
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  // Paginated data
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const validPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, validPage, pageSize]);

  return (
    <div className="glass-panel" style={{ padding: "0", overflow: "hidden", marginBottom: "32px" }}>
      {/* Table Container */}
      <div style={{ overflowX: "auto" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--glass-border)" }}>
              {columns.map((col, idx) => {
                const isSorted = sortKey === col.dataKey;
                const canSort = col.sortable !== false;
                return (
                  <th
                    key={idx}
                    onClick={() => canSort && handleSort(col.dataKey)}
                    style={{
                      padding: "12px 16px",
                      textAlign: col.align || "left",
                      color: isSorted ? "var(--primary-color)" : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      cursor: canSort ? "pointer" : "default",
                      userSelect: "none",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      justifyContent: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start",
                      width: "100%"
                    }}>
                      <span>{col.header}</span>
                      {canSort && (
                        isSorted ? (
                          sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.3 }} />
                        )
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "48px 16px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <FileQuestion size={36} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>
                      {emptyMessage}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Tente alterar as datas ou limpar alguns filtros para visualizar os dados.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row: any, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  style={{
                    borderBottom: "1px solid var(--glass-border)",
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--glass-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      style={{
                        padding: "12px 16px",
                        textAlign: col.align || "left",
                        color: "var(--text-main)",
                        verticalAlign: "middle"
                      }}
                    >
                      {col.render ? col.render(row, rIdx) : (row[col.dataKey] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>

          {/* Table Footer with Totals */}
          {totalAmount !== undefined && sortedData.length > 0 && (
            <tfoot>
              <tr style={{
                background: "rgba(255, 255, 255, 0.04)",
                borderTop: "2px solid var(--glass-border)",
                fontWeight: 700
              }}>
                <td
                  colSpan={Math.max(1, columns.length - 2)}
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em"
                  }}
                >
                  {totalAmountLabel} ({sortedData.length} registros)
                </td>
                <td
                  colSpan={2}
                  style={{
                    padding: "14px 16px",
                    textAlign: "right",
                    color: "var(--primary-color)",
                    fontSize: "16px",
                    fontWeight: 800
                  }}
                >
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Controls */}
      {sortedData.length > 0 && (
        <div style={{
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderTop: "1px solid var(--glass-border)",
          background: "rgba(255, 255, 255, 0.01)",
          fontSize: "12px",
          color: "var(--text-secondary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--text-secondary)" }}>
              Mostrando <strong>{Math.min((validPage - 1) * pageSize + 1, sortedData.length)}–{Math.min(validPage * pageSize, sortedData.length)}</strong> de <strong>{sortedData.length}</strong> registros
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(validPage - 1, 1))}
              disabled={validPage === 1}
              style={{
                height: "32px",
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                background: "var(--bg-color-soft)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-main)",
                borderRadius: "6px",
                cursor: validPage === 1 ? "not-allowed" : "pointer",
                opacity: validPage === 1 ? 0.35 : 1,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={e => {
                if (validPage > 1) {
                  e.currentTarget.style.borderColor = "var(--primary-color)";
                  e.currentTarget.style.color = "var(--primary-color)";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--glass-border)";
                e.currentTarget.style.color = "var(--text-main)";
              }}
            >
              <ChevronLeft size={14} /> Anterior
            </button>

            <span style={{ padding: "0 8px", fontWeight: 600, color: "var(--text-secondary)" }}>
              Página {validPage} de {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(validPage + 1, totalPages))}
              disabled={validPage === totalPages}
              style={{
                height: "32px",
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                background: "var(--bg-color-soft)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-main)",
                borderRadius: "6px",
                cursor: validPage === totalPages ? "not-allowed" : "pointer",
                opacity: validPage === totalPages ? 0.35 : 1,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={e => {
                if (validPage < totalPages) {
                  e.currentTarget.style.borderColor = "var(--primary-color)";
                  e.currentTarget.style.color = "var(--primary-color)";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--glass-border)";
                e.currentTarget.style.color = "var(--text-main)";
              }}
            >
              Próxima <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
