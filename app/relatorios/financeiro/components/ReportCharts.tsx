"use client";

import React, { useState } from "react";
import { formatCurrency } from "../utils/exportUtils";
import { 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  PieChart as PieIcon, 
  Layers, 
  Award,
  Crown,
  Medal,
  Sparkles,
  TrendingUp,
  Percent
} from "lucide-react";

export interface ChartBarData {
  label: string;
  value: number;
  secondaryValue?: number;
  count?: number;
}

export interface ChartSliceData {
  label: string;
  value: number;
  color?: string;
  count?: number;
}

export interface ReportChartsProps {
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
  "#3b82f6", // Azul Safira
  "#10b981", // Esmeralda
  "#f59e0b", // Âmbar
  "#8b5cf6", // Violeta
  "#ec4899", // Rosa Carmim
  "#06b6d4", // Ciano
  "#f97316", // Laranja
  "#64748b"  // Ardósia
];

/**
 * Componente DonutChart SVG nativo com suporte a hover interativo
 * e exibição centralizada de indicadores.
 */
function DonutChart({
  data,
  total,
  size = 160,
  strokeWidth = 20,
  palette = PALETTE
}: {
  data: ChartSliceData[];
  total: number;
  size?: number;
  strokeWidth?: number;
  palette?: string[];
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (total <= 0 || data.length === 0) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px dashed var(--glass-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: "11px",
        textAlign: "center",
        padding: "10px"
      }}>
        Sem dados
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  const slices = data.map((item, index) => {
    const fraction = total > 0 ? item.value / total : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference * (1 - fraction)}`;
    const strokeDashoffset = -(accumulatedPercent * circumference);
    const color = item.color || palette[index % palette.length];
    accumulatedPercent += fraction;

    return {
      ...item,
      fraction,
      percentage: (fraction * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
      color,
      index
    };
  });

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)", overflow: "visible" }}
      >
        {/* Trilho de fundo circular */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
        />

        {/* Fatias do Donut */}
        {slices.map((slice) => {
          const isHovered = hoveredIndex === slice.index;
          return (
            <circle
              key={slice.index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              strokeLinecap="butt"
              style={{
                transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                opacity: hoveredIndex === null || isHovered ? 1 : 0.45,
                cursor: "pointer"
              }}
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}
      </svg>

      {/* Conteúdo Centralizador */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: size,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          padding: "16px",
          textAlign: "center"
        }}
      >
        {activeSlice ? (
          <>
            <span style={{
              fontSize: "10px",
              color: activeSlice.color,
              fontWeight: 700,
              maxWidth: "100px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {activeSlice.label}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-main)" }}>
              {activeSlice.percentage}%
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              {formatCurrency(activeSlice.value)}
            </span>
          </>
        ) : (
          <>
            <PieIcon size={18} style={{ color: "var(--text-muted)", marginBottom: "2px", opacity: 0.8 }} />
            <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-main)" }}>
              {data.length}
            </span>
            <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Grupos
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function ReportCharts({
  title = "Painel de Inteligência Financeira",
  timeSeriesData = [],
  timeSeriesTitle = "1. Evolução & Projeção Temporal",
  categoryData = [],
  categoryTitle = "2. Distribuição por Categoria",
  secondarySliceData = [],
  secondarySliceTitle = "3. Análise Operacional & Meios",
  rankingData = [],
  rankingTitle = "4. Classificação dos Principais Títulos"
}: ReportChartsProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Totais e cálculos do Widget 1 (Evolução Temporal)
  const totalTimeSeries = timeSeriesData.reduce((acc, d) => acc + d.value, 0);
  const maxTimeSeries = Math.max(...timeSeriesData.map(d => d.value), 1);
  const avgTimeSeries = timeSeriesData.length > 0 ? totalTimeSeries / timeSeriesData.length : 0;
  const peakTimeItem = [...timeSeriesData].sort((a, b) => b.value - a.value)[0];

  // Totais e cálculos do Widget 2 (Categorias)
  const totalCategory = categoryData.reduce((acc, d) => acc + d.value, 0);
  const topCategory = categoryData.length > 0 ? categoryData[0] : null;

  // Totais e cálculos do Widget 3 (Distribuição Secundária / Formas / Aging / Caixas)
  const totalSecondary = secondarySliceData.reduce((acc, d) => acc + d.value, 0);
  const topSecondary = secondarySliceData.length > 0 ? secondarySliceData[0] : null;

  // Totais e cálculos do Widget 4 (Ranking Executivo)
  const totalRanking = rankingData.reduce((acc, d) => acc + d.value, 0);
  const maxRanking = Math.max(...rankingData.map(d => d.value), 1);
  const topItem = rankingData.length > 0 ? rankingData[0] : null;

  return (
    <div className="glass-panel" style={{ padding: "24px", marginBottom: "28px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isOpen ? "24px" : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(13, 148, 136, 0.2) 100%)",
            border: "1px solid rgba(2, 132, 199, 0.35)",
            padding: "10px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <BarChart3 size={22} color="var(--primary-color)" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--text-main)" }}>
                {title}
              </h3>
              <span style={{
                background: "rgba(2, 132, 199, 0.12)",
                color: "var(--primary-color)",
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "11px",
                fontWeight: 700
              }}>
                Layout 2x2 Expandido
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Visão analítica gerencial estruturada em 4 quadrantes operacionais
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: "var(--bg-color-soft)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-secondary)",
            padding: "8px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 600,
            transition: "all 0.2s"
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--primary-color)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--glass-border)")}
          title={isOpen ? "Recolher painel de análise" : "Expandir painel de análise"}
        >
          <span>{isOpen ? "Recolher Análise" : "Expandir Análise"}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isOpen && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
          gap: "24px"
        }}>
          {/* ============================================================== */}
          {/* WIDGET 1 (Top-Left): Evolução / Projeção Temporal */}
          {/* ============================================================== */}
          <div style={{
            background: "var(--bg-color-soft)",
            border: "1px solid var(--glass-border)",
            borderRadius: "14px",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            minHeight: "360px"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{
                      background: "rgba(59, 130, 246, 0.15)",
                      color: "#3b82f6",
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "6px"
                    }}>
                      1
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                      {timeSeriesTitle}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {timeSeriesData.length} períodos avaliados • Média: {formatCurrency(avgTimeSeries)}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--primary-color)" }}>
                    {formatCurrency(totalTimeSeries)}
                  </span>
                  {peakTimeItem && (
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Pico: {peakTimeItem.label} ({formatCurrency(peakTimeItem.value)})
                    </div>
                  )}
                </div>
              </div>

              {/* Bar visualization */}
              {timeSeriesData.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  Sem dados suficientes no período selecionado.
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "12px",
                  height: "170px",
                  paddingTop: "24px",
                  paddingBottom: "24px",
                  borderBottom: "1px solid var(--glass-border)",
                  overflowX: "auto"
                }}>
                  {timeSeriesData.map((d, i) => {
                    const pct = Math.max(Math.round((d.value / maxTimeSeries) * 100), 5);
                    const isPeak = peakTimeItem && d.label === peakTimeItem.label;
                    return (
                      <div
                        key={i}
                        style={{
                          flex: "1 0 42px",
                          minWidth: "42px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          height: "100%",
                          justifyContent: "flex-end",
                          position: "relative"
                        }}
                        title={`${d.label}: ${formatCurrency(d.value)}${d.count ? ` (${d.count} lançamentos)` : ""}`}
                      >
                        <div style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: isPeak ? "var(--primary-color)" : "var(--text-muted)",
                          marginBottom: "4px",
                          whiteSpace: "nowrap"
                        }}>
                          {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value.toFixed(0)}
                        </div>
                        <div style={{
                          width: "100%",
                          height: `${pct}%`,
                          background: isPeak 
                            ? "linear-gradient(180deg, #0284c7 0%, #0369a1 100%)"
                            : "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
                          borderRadius: "6px 6px 2px 2px",
                          transition: "height 0.4s ease",
                          boxShadow: isPeak ? "0 4px 14px rgba(2, 132, 199, 0.4)" : "0 2px 8px rgba(59, 130, 246, 0.25)"
                        }} />
                        <span style={{
                          position: "absolute",
                          bottom: "-22px",
                          fontSize: "11px",
                          fontWeight: isPeak ? 700 : 500,
                          color: isPeak ? "var(--primary-color)" : "var(--text-secondary)",
                          whiteSpace: "nowrap"
                        }}>
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom mini-summary tags */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: "1px dashed var(--glass-border)",
              fontSize: "11px"
            }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Volume Total</span>
                <strong style={{ color: "var(--text-main)", fontSize: "12px" }}>{formatCurrency(totalTimeSeries)}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Média / Mês</span>
                <strong style={{ color: "var(--text-main)", fontSize: "12px" }}>{formatCurrency(avgTimeSeries)}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Maior Concentração</span>
                <strong style={{ color: "var(--primary-color)", fontSize: "12px" }}>{peakTimeItem?.label || "-"}</strong>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* WIDGET 2 (Top-Right): Distribuição por Categoria (Gráfico Pizza + Lista) */}
          {/* ============================================================== */}
          <div style={{
            background: "var(--bg-color-soft)",
            border: "1px solid var(--glass-border)",
            borderRadius: "14px",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            minHeight: "360px"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "6px"
                    }}>
                      2
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                      {categoryTitle}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {categoryData.length} categorias identificadas • Proporção setorial
                  </span>
                </div>
                {topCategory && (
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: "11px",
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#10b981",
                      padding: "3px 8px",
                      borderRadius: "10px",
                      fontWeight: 700
                    }}>
                      Líder: {topCategory.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Layout Donut + Lista de Categorias */}
              {categoryData.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  Sem categorias vinculadas no filtro atual.
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  flexWrap: "wrap",
                  minHeight: "190px"
                }}>
                  {/* Gráfico Donut/Pizza Interativo */}
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4px" }}>
                    <DonutChart
                      data={categoryData}
                      total={totalCategory}
                      size={155}
                      strokeWidth={20}
                      palette={PALETTE}
                    />
                  </div>

                  {/* Listagem Detalhada das Categorias */}
                  <div style={{
                    flex: "1 1 220px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                    overflowY: "auto",
                    maxHeight: "190px",
                    paddingRight: "6px"
                  }}>
                    {categoryData.slice(0, 6).map((c, i) => {
                      const pct = totalCategory > 0 ? ((c.value / totalCategory) * 100).toFixed(1) : "0";
                      const color = c.color || PALETTE[i % PALETTE.length];
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                            <span style={{ color: "var(--text-main)", fontWeight: 600, display: "flex", alignItems: "center", gap: "7px" }}>
                              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                              <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.label}>
                                {c.label}
                              </span>
                            </span>
                            <span style={{ color: "var(--text-main)", fontWeight: 700, whiteSpace: "nowrap" }}>
                              {formatCurrency(c.value)}{" "}
                              <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 500 }}>
                                ({pct}%)
                              </span>
                            </span>
                          </div>
                          <div style={{ height: "5px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: color,
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
            </div>

            {/* Bottom summary */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: "1px dashed var(--glass-border)",
              fontSize: "12px"
            }}>
              <span style={{ color: "var(--text-secondary)" }}>
                Total Consolidado das Categorias:
              </span>
              <strong style={{ color: "#10b981", fontSize: "13px" }}>
                {formatCurrency(totalCategory)}
              </strong>
            </div>
          </div>

          {/* ============================================================== */}
          {/* WIDGET 3 (Bottom-Left): Análise Operacional (Gráfico Pizza + Detalhamento) */}
          {/* ============================================================== */}
          <div style={{
            background: "var(--bg-color-soft)",
            border: "1px solid var(--glass-border)",
            borderRadius: "14px",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            minHeight: "360px"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#f59e0b",
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "6px"
                    }}>
                      3
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                      {secondarySliceTitle}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Canais operacionais, formas de liquidação e distribuição
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#f59e0b" }}>
                    {formatCurrency(totalSecondary)}
                  </span>
                </div>
              </div>

              {/* Layout Donut + Lista de Formas/Canais */}
              {secondarySliceData.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  Sem detalhamento secundário para os dados atuais.
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  flexWrap: "wrap",
                  minHeight: "190px"
                }}>
                  {/* Gráfico Donut/Pizza Interativo */}
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4px" }}>
                    <DonutChart
                      data={secondarySliceData}
                      total={totalSecondary}
                      size={155}
                      strokeWidth={20}
                      palette={["#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#3b82f6"]}
                    />
                  </div>

                  {/* Listagem Detalhada */}
                  <div style={{
                    flex: "1 1 220px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                    overflowY: "auto",
                    maxHeight: "190px",
                    paddingRight: "6px"
                  }}>
                    {secondarySliceData.slice(0, 6).map((c, i) => {
                      const pct = totalSecondary > 0 ? ((c.value / totalSecondary) * 100).toFixed(1) : "0";
                      const color = c.color || PALETTE[(i + 2) % PALETTE.length];
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                            <span style={{ color: "var(--text-main)", fontWeight: 600, display: "flex", alignItems: "center", gap: "7px" }}>
                              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                              <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.label}>
                                {c.label}
                              </span>
                            </span>
                            <span style={{ color: "var(--text-main)", fontWeight: 700, whiteSpace: "nowrap" }}>
                              {formatCurrency(c.value)}{" "}
                              <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 500 }}>
                                ({pct}%)
                              </span>
                            </span>
                          </div>
                          <div style={{ height: "5px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: color,
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
            </div>

            {/* Bottom summary */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: "1px dashed var(--glass-border)",
              fontSize: "12px"
            }}>
              <span style={{ color: "var(--text-secondary)" }}>
                Principal Representante:
              </span>
              <strong style={{ color: "#f59e0b", fontSize: "12px" }}>
                {topSecondary ? `${topSecondary.label} (${totalSecondary > 0 ? ((topSecondary.value / totalSecondary) * 100).toFixed(0) : 0}%)` : "-"}
              </strong>
            </div>
          </div>

          {/* ============================================================== */}
          {/* WIDGET 4 (Bottom-Right): Classificação dos Principais Títulos */}
          {/* ============================================================== */}
          <div style={{
            background: "var(--bg-color-soft)",
            border: "1px solid var(--glass-border)",
            borderRadius: "14px",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            minHeight: "360px"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{
                      background: "rgba(168, 85, 247, 0.15)",
                      color: "#a855f7",
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "6px"
                    }}>
                      4
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                      {rankingTitle}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Lançamentos de maior relevância financeira na carteira
                  </span>
                </div>
                {totalRanking > 0 && (
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: "11px",
                      background: "rgba(168, 85, 247, 0.12)",
                      color: "#c084fc",
                      border: "1px solid rgba(168, 85, 247, 0.25)",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px"
                    }}>
                      <Sparkles size={12} color="#c084fc" />
                      Soma das 5 Posições: {formatCurrency(totalRanking)}
                    </span>
                  </div>
                )}
              </div>

              {rankingData.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  Sem registros para ranquear no momento.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "205px", paddingRight: "4px" }}>
                  {rankingData.slice(0, 5).map((r, i) => {
                    const relativePct = maxRanking > 0 ? Math.round((r.value / maxRanking) * 100) : 0;
                    const sharePct = totalRanking > 0 ? ((r.value / totalRanking) * 100).toFixed(1) : "0";

                    // Configuração de medalhas e insignias formais
                    const rankConfig = [
                      {
                        badgeText: "1º",
                        badgeBg: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
                        badgeColor: "#ffffff",
                        barBg: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
                        border: "rgba(245, 158, 11, 0.3)",
                        icon: <Crown size={12} color="#ffffff" />
                      },
                      {
                        badgeText: "2º",
                        badgeBg: "linear-gradient(135deg, #94a3b8 0%, #475569 100%)",
                        badgeColor: "#ffffff",
                        barBg: "linear-gradient(90deg, #64748b 0%, #94a3b8 100%)",
                        border: "rgba(148, 163, 184, 0.3)",
                        icon: <Medal size={12} color="#ffffff" />
                      },
                      {
                        badgeText: "3º",
                        badgeBg: "linear-gradient(135deg, #b45309 0%, #78350f 100%)",
                        badgeColor: "#ffffff",
                        barBg: "linear-gradient(90deg, #b45309 0%, #d97706 100%)",
                        border: "rgba(180, 83, 9, 0.3)",
                        icon: <Medal size={12} color="#ffffff" />
                      },
                      {
                        badgeText: "4º",
                        badgeBg: "rgba(255, 255, 255, 0.08)",
                        badgeColor: "var(--text-secondary)",
                        barBg: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
                        border: "var(--glass-border)",
                        icon: null
                      },
                      {
                        badgeText: "5º",
                        badgeBg: "rgba(255, 255, 255, 0.08)",
                        badgeColor: "var(--text-secondary)",
                        barBg: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
                        border: "var(--glass-border)",
                        icon: null
                      }
                    ][i] || {
                      badgeText: `${i + 1}º`,
                      badgeBg: "rgba(255, 255, 255, 0.08)",
                      badgeColor: "var(--text-secondary)",
                      barBg: "var(--primary-color)",
                      border: "var(--glass-border)",
                      icon: null
                    };

                    return (
                      <div
                        key={i}
                        style={{
                          background: "var(--bg-card)",
                          border: `1px solid ${rankConfig.border}`,
                          borderRadius: "10px",
                          padding: "9px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {/* Identificação e Posição Formal */}
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                            <div style={{
                              background: rankConfig.badgeBg,
                              color: rankConfig.badgeColor,
                              fontSize: "11px",
                              fontWeight: 800,
                              borderRadius: "6px",
                              padding: "3px 7px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              flexShrink: 0,
                              boxShadow: i < 3 ? "0 2px 6px rgba(0,0,0,0.2)" : "none"
                            }}>
                              {rankConfig.icon}
                              <span>{rankConfig.badgeText}</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "var(--text-main)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "230px"
                                }}
                                title={r.label}
                              >
                                {r.label}
                              </span>
                              {r.secondary && (
                                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>
                                  {r.secondary}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Valor e Proporção */}
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "10px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-main)" }}>
                              {formatCurrency(r.value)}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>
                              {sharePct}% da concentração
                            </div>
                          </div>
                        </div>

                        {/* Barra de Progresso Proporcional */}
                        <div style={{ height: "4px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${relativePct}%`,
                            background: rankConfig.barBg,
                            borderRadius: "3px",
                            transition: "width 0.4s ease"
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom summary */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: "1px dashed var(--glass-border)",
              fontSize: "12px"
            }}>
              <span style={{ color: "var(--text-secondary)" }}>
                Título de Maior Expressividade:
              </span>
              <strong style={{ color: "var(--primary-color)", fontSize: "12px" }}>
                {topItem ? `${topItem.label} (${formatCurrency(topItem.value)})` : "-"}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

