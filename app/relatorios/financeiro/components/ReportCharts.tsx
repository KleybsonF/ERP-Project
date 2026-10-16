"use client";

import React, { useState } from "react";
import { formatCurrency } from "../utils/exportUtils";
import { BarChart3, PieChart, ChevronDown, ChevronUp, Layers, TrendingUp } from "lucide-react";

interface ChartBarData {
  label: string;
  value: number;
  secondaryValue?: number;
  count?: number;
}

interface ChartSliceData {
  label: string;
  value: number;
  color?: string;
}

interface ReportChartsProps {
  title?: string;
  timeSeriesData?: ChartBarData[];
  timeSeriesTitle?: string;
  categoryData?: ChartSliceData[];
  categoryTitle?: string;
  secondarySliceData?: ChartSliceData[];
  secondarySliceTitle?: string;
  rankingData?: { label: string; value: number; secondary?: string }[];
  rankingTitle?: string;
}

const PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b"  // Slate
];

export default function ReportCharts({
  title = "Análise Gráfica",
  timeSeriesData = [],
  timeSeriesTitle = "Evolução Financeira",
  categoryData = [],
  categoryTitle = "Distribuição por Categoria",
  secondarySliceData = [],
  secondarySliceTitle = "Distribuição Secundária",
  rankingData = [],
  rankingTitle = "Ranking dos Principais Títulos"
}: ReportChartsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"todos" | "tempo" | "categorias" | "ranking">("todos");

  const totalTimeSeries = timeSeriesData.reduce((acc, d) => acc + d.value, 0);
  const maxTimeSeries = Math.max(...timeSeriesData.map(d => d.value), 1);

  const totalCategory = categoryData.reduce((acc, d) => acc + d.value, 0);
  const totalSecondary = secondarySliceData.reduce((acc, d) => acc + d.value, 0);

  const maxRanking = Math.max(...rankingData.map(d => d.value), 1);

  return (
    <div className="glass-panel" style={{ padding: "20px 24px", marginBottom: "24px" }}>
      {/* Top Header with collapse toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isOpen ? "20px" : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            background: "rgba(59, 130, 246, 0.15)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            padding: "8px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <BarChart3 size={20} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
              {title}
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Visão consolidada com base nos filtros selecionados
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isOpen && (
            <div style={{
              display: "flex",
              background: "var(--bg-color-soft)",
              padding: "3px",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              fontSize: "12px"
            }}>
              <button
                type="button"
                onClick={() => setActiveTab("todos")}
                style={{
                  background: activeTab === "todos" ? "var(--primary-color)" : "transparent",
                  color: activeTab === "todos" ? "#fff" : "var(--text-secondary)",
                  border: "none",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 0.2s"
                }}
              >
                Todos
              </button>
              {timeSeriesData.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("tempo")}
                  style={{
                    background: activeTab === "tempo" ? "var(--primary-color)" : "transparent",
                    color: activeTab === "tempo" ? "#fff" : "var(--text-secondary)",
                    border: "none",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s"
                  }}
                >
                  Evolução
                </button>
              )}
              {categoryData.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("categorias")}
                  style={{
                    background: activeTab === "categorias" ? "var(--primary-color)" : "transparent",
                    color: activeTab === "categorias" ? "#fff" : "var(--text-secondary)",
                    border: "none",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s"
                  }}
                >
                  Categorias
                </button>
              )}
              {rankingData.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("ranking")}
                  style={{
                    background: activeTab === "ranking" ? "var(--primary-color)" : "transparent",
                    color: activeTab === "ranking" ? "#fff" : "var(--text-secondary)",
                    border: "none",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s"
                  }}
                >
                  Ranking
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="icon-btn"
            style={{ width: "32px", height: "32px" }}
            title={isOpen ? "Recolher gráficos" : "Expandir gráficos"}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div style={{
          display: "grid",
          gridTemplateColumns: activeTab === "todos"
            ? (categoryData.length > 0 && rankingData.length > 0 ? "repeat(auto-fit, minmax(320px, 1fr))" : "repeat(auto-fit, minmax(400px, 1fr))")
            : "1fr",
          gap: "20px"
        }}>
          {/* Gráfico 1: Evolução Temporal */}
          {(activeTab === "todos" || activeTab === "tempo") && timeSeriesData.length > 0 && (
            <div style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {timeSeriesTitle}
                </span>
                <span style={{ fontSize: "12px", color: "var(--primary-color)", fontWeight: 700 }}>
                  Total: {formatCurrency(totalTimeSeries)}
                </span>
              </div>

              {/* Bar visualization */}
              <div style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "10px",
                height: "170px",
                paddingTop: "25px",
                paddingBottom: "25px",
                borderBottom: "1px solid var(--glass-border)",
                overflowX: "auto"
              }}>
                {timeSeriesData.map((d, i) => {
                  const pct = Math.max(Math.round((d.value / maxTimeSeries) * 100), 4);
                  return (
                    <div
                      key={i}
                      style={{
                        flex: "1 0 36px",
                        minWidth: "36px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100%",
                        justifyContent: "flex-end",
                        position: "relative"
                      }}
                      title={`${d.label}: ${formatCurrency(d.value)}${d.count ? ` (${d.count} títulos)` : ""}`}
                    >
                      <div style={{
                        fontSize: "9px",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        marginBottom: "4px",
                        whiteSpace: "nowrap"
                      }}>
                        {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value.toFixed(0)}
                      </div>
                      <div style={{
                        width: "100%",
                        height: `${pct}%`,
                        background: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
                        borderRadius: "6px 6px 2px 2px",
                        transition: "height 0.4s ease",
                        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.25)"
                      }} />
                      <span style={{
                        position: "absolute",
                        bottom: "-22px",
                        fontSize: "10px",
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap"
                      }}>
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gráfico 2: Donut / Distribuição por Categoria */}
          {(activeTab === "todos" || activeTab === "categorias") && categoryData.length > 0 && (
            <div style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {categoryTitle}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {categoryData.length} categorias
                </span>
              </div>

              {/* Progress bars list for crisp display */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "170px" }}>
                {categoryData.slice(0, 6).map((c, i) => {
                  const pct = totalCategory > 0 ? ((c.value / totalCategory) * 100).toFixed(1) : "0";
                  const color = c.color || PALETTE[i % PALETTE.length];
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "var(--text-main)", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                          {c.label}
                        </span>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                          {formatCurrency(c.value)} <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gráfico 3: Ranking Horizontal */}
          {(activeTab === "todos" || activeTab === "ranking") && rankingData.length > 0 && (
            <div style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {rankingTitle}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Top {Math.min(rankingData.length, 5)}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "170px" }}>
                {rankingData.slice(0, 5).map((r, i) => {
                  const pct = maxRanking > 0 ? Math.round((r.value / maxRanking) * 100) : 0;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "var(--text-main)", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#d97706" : "rgba(255,255,255,0.1)",
                            color: i < 3 ? "#000" : "var(--text-main)",
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            #{i + 1}
                          </span>
                          <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.label}
                          </span>
                        </span>
                        <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                          {formatCurrency(r.value)}
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: i === 0 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #3b82f6, #60a5fa)",
                          borderRadius: "3px",
                          transition: "width 0.4s ease"
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gráfico 4: Distribuição Secundária (Ex: Formas de Pagamento / Caixas) */}
          {activeTab === "todos" && secondarySliceData.length > 0 && (
            <div style={{
              background: "var(--bg-color-soft)",
              border: "1px solid var(--glass-border)",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {secondarySliceTitle}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Total: {formatCurrency(totalSecondary)}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "170px" }}>
                {secondarySliceData.slice(0, 6).map((c, i) => {
                  const pct = totalSecondary > 0 ? ((c.value / totalSecondary) * 100).toFixed(1) : "0";
                  const color = c.color || PALETTE[(i + 3) % PALETTE.length];
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "var(--text-main)", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                          {c.label}
                        </span>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                          {formatCurrency(c.value)} <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
