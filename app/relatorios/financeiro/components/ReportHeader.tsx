"use client";

import React from "react";
import Link from "next/link";
import { 
  FileSpreadsheet, 
  FileText, 
  ChevronRight, 
  ArrowLeft,
  LucideIcon
} from "lucide-react";
import { formatCurrency } from "../utils/exportUtils";

export interface KpiCardItem {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  color?: string;
  isCurrency?: boolean;
}

interface ReportHeaderProps {
  title: string;
  description: string;
  badgeText?: string;
  icon: LucideIcon;
  iconColor?: string;
  kpiCards: KpiCardItem[];
  onExportExcel: () => void;
  onExportPdf: () => void;
  isExportingExcel?: boolean;
  isExportingPdf?: boolean;
  totalFilteredCount: number;
  totalRawCount: number;
}

export default function ReportHeader({
  title,
  description,
  badgeText = "Financeiro",
  icon: HeaderIcon,
  iconColor = "var(--primary-color)",
  kpiCards,
  onExportExcel,
  onExportPdf,
  isExportingExcel = false,
  isExportingPdf = false,
  totalFilteredCount,
  totalRawCount
}: ReportHeaderProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
        <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          Início
        </Link>
        <ChevronRight size={12} />
        <span style={{ color: "var(--text-secondary)" }}>
          Relatórios
        </span>
        <ChevronRight size={12} />
        <span style={{ color: "var(--text-secondary)" }}>
          Financeiro
        </span>
        <ChevronRight size={12} />
        <span style={{ color: "var(--primary-color)", fontWeight: 600 }}>{title}</span>
      </div>

      {/* Main Title & Action Buttons */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{
            background: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            padding: "12px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "2px"
          }}>
            <HeaderIcon size={26} color={iconColor} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h1 className="page-title" style={{ margin: 0, fontSize: "24px", fontWeight: 800 }}>
                {title}
              </h1>
              <span style={{
                background: "rgba(59, 130, 246, 0.15)",
                color: "var(--primary-color)",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.03em"
              }}>
                {badgeText}
              </span>
            </div>
            <p className="page-description" style={{ margin: 0 }}>
              {description} •{" "}
              <span style={{ color: "var(--text-main)", fontWeight: 600 }}>
                {totalFilteredCount} {totalFilteredCount === 1 ? "registro exibido" : "registros exibidos"}
              </span>{" "}
              {totalFilteredCount !== totalRawCount && (
                <span style={{ color: "var(--text-muted)" }}>
                  (filtrado de {totalRawCount})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={onExportExcel}
            disabled={isExportingExcel || totalFilteredCount === 0}
            className="btn-excel"
            style={{
              cursor: totalFilteredCount === 0 ? "not-allowed" : "pointer"
            }}
            title="Exportar dados filtrados para planilha Excel (.xlsx)"
          >
            <FileSpreadsheet size={17} />
            {isExportingExcel ? "Gerando Excel..." : "Exportar EXCEL"}
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExportingPdf || totalFilteredCount === 0}
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: totalFilteredCount === 0 ? "not-allowed" : "pointer"
            }}
            title="Exportar relatório formatado em PDF para impressão"
          >
            <FileText size={17} />
            {isExportingPdf ? "Gerando PDF..." : "Imprimir / PDF"}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "14px"
      }}>
        {kpiCards.map((kpi, idx) => {
          const KpiIcon = kpi.icon;
          const displayValue = kpi.isCurrency && typeof kpi.value === "number"
            ? formatCurrency(kpi.value)
            : String(kpi.value);

          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                borderLeft: `4px solid ${kpi.color || "var(--primary-color)"}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: "0.05em"
                }}>
                  {kpi.label}
                </span>
                {KpiIcon && (
                  <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "6px",
                    borderRadius: "8px"
                  }}>
                    <KpiIcon size={16} color={kpi.color || "var(--text-secondary)"} />
                  </div>
                )}
              </div>

              <div>
                <div style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: kpi.color ? kpi.color : "var(--text-main)",
                  lineHeight: 1.2
                }}>
                  {displayValue}
                </div>
                {kpi.subValue && (
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {kpi.subValue}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
