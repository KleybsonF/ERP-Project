"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Banknote,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarClock,
  MapPin,
  Users,
  Wrench,
  Truck,
  Building2,
  Star,
  Activity,
  ChevronRight,
  Plus,
  Settings,
  ShieldCheck,
  Layers,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  BarChart3,
  PieChart,
  Crown,
  Briefcase,
  Sliders,
  ExternalLink,
  ChevronDown,
  Zap
} from "lucide-react";
import PeriodSelector from "@/app/components/PeriodSelector";

interface DashboardItem {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  isDefault: boolean;
  isPublic: boolean;
  parsedWidgets: {
    id: string;
    widgetKey: string;
    title: string;
    colSpan: number;
    order: number;
    visible?: boolean;
  }[];
}

interface DashboardClientProps {
  accessibleDashboards: DashboardItem[];
  currentDashboard: DashboardItem | null;
  richData: any;
  userRole: string;
  currentPeriod: string;
  currentStart: string;
  currentEnd: string;
}

export default function DashboardClient({
  accessibleDashboards,
  currentDashboard,
  richData,
  userRole,
  currentPeriod,
  currentStart,
  currentEnd
}: DashboardClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonthTab, setSelectedMonthTab] = useState("10/2026");

  const { kpis, charts, tables } = richData;

  const handleSwitchDashboard = (id: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("dashboardId", id.toString());
    router.push(`/?${params.toString()}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const widgets = (currentDashboard?.parsedWidgets || [])
    .filter((w) => w.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const formatBRL = (val: number) => {
    return (val || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const formatCompactBRL = (val: number) => {
    if (Math.abs(val) >= 1_000_000) {
      return `R$ ${(val / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(val) >= 1_000) {
      return `R$ ${(val / 1_000).toFixed(1)}k`;
    }
    return formatBRL(val);
  };

  // Render individual widget based on widgetKey
  const renderWidget = (w: DashboardItem["parsedWidgets"][0]) => {
    switch (w.widgetKey) {
      case "widget_status_geral": {
        const sg = richData.statusGeral || {
          pieSlices: [
            { label: "Vigentes (Em Dia)", count: 342, color: "#10b981", percentage: 24.8 },
            { label: "Renovação (30d)", count: 68, color: "#38bdf8", percentage: 4.9 },
            { label: "Propostas Abertas", count: 124, color: "#f59e0b", percentage: 9.0 },
            { label: "Suspensos", count: 45, color: "#ea580c", percentage: 3.3 },
            { label: "Bloqueio Inadimplência", count: 31, color: "#ef4444", percentage: 2.2 },
            { label: "Encerrados / Rescindidos", count: 768, color: "#64748b", percentage: 55.7 }
          ],
          clientesAtivos: 315,
          contratosAtivos: 410,
          serviceBadges: [
            { label: "Dedetização", count: 164, color: "#059669" },
            { label: "Desratização", count: 112, color: "#0284c7" },
            { label: "Controle de Pragas", count: 88, color: "#d97706" },
            { label: "Limpeza Caixas D'Água", count: 46, color: "#7c3aed" },
            { label: "Sanitização Ambientes", count: 32, color: "#0f766e" },
            { label: "Laudos ANVISA", count: 24, color: "#475569" },
            { label: "Expurgo de Grãos", count: 14, color: "#b91c1c" }
          ],
          renovacao30d: 68,
          propostasAbertas: 124,
          suspensos: 45,
          inadimplentes: 31,
          encerrados: 768,
          totalCarteira: 1378
        };

        // Pie chart calculation
        let currentAngle = -Math.PI / 2;
        const totalPieCount = sg.pieSlices.reduce((a: number, s: any) => a + s.count, 0) || 1;
        const piePaths = sg.pieSlices.map((slice: any) => {
          const sliceAngle = (slice.count / totalPieCount) * 2 * Math.PI;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sliceAngle;
          currentAngle = endAngle;

          const cx = 95;
          const cy = 95;
          const r = 80;

          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);

          const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
          const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          return { ...slice, pathData };
        });

        return (
          <div
            key={w.id}
            className="glass-panel"
            style={{
              gridColumn: `span ${w.colSpan || 6}`,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              color: "#1e293b"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  {w.title || "Status Geral da Carteira de Contratos"}
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                  Vigência, renovações e retenção de clientes
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={handleRefresh}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748b"
                  }}
                  title="Atualizar"
                >
                  <RefreshCw size={13} className={isRefreshing ? "spin-animation" : ""} />
                </button>
                <Link
                  href="/clientes/novo"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#facc15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    color: "#0f172a",
                    boxShadow: "0 1px 3px rgba(250, 204, 21, 0.4)"
                  }}
                  title="Novo Contrato / Cliente"
                >
                  <Zap size={14} fill="#0f172a" />
                </Link>
              </div>
            </div>

            {/* Top area: Legend on Left, Pie Chart on Right */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              {/* Vertical Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "140px" }}>
                {sg.pieSlices.map((s: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <span style={{ color: "#475569", fontWeight: 500 }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Pie Chart */}
              <div style={{ position: "relative", width: "180px", height: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="180" height="180" viewBox="0 0 190 190">
                  {piePaths.map((slice: any, idx: number) => (
                    <path
                      key={idx}
                      d={slice.pathData}
                      fill={slice.color}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    >
                      <title>{`${slice.label}: ${slice.count} (${slice.percentage}%)`}</title>
                    </path>
                  ))}
                </svg>
              </div>
            </div>

            {/* Metrics List Below */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "2px" }}>
              {/* Clientes ativos */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ fontWeight: 700, color: "#16a34a" }}>Clientes ativos na carteira</span>
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "15px" }}>{sg.clientesAtivos}</span>
              </div>

              {/* Contratos ativos */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ fontWeight: 700, color: "#0284c7" }}>Contratos de manutenção vigentes</span>
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "15px" }}>{sg.contratosAtivos}</span>
              </div>

              {/* Service Badges Row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "2px 0 4px 0" }}>
                {sg.serviceBadges.map((badge: any, bIdx: number) => (
                  <span
                    key={bIdx}
                    style={{
                      background: badge.color,
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "3px 9px",
                      borderRadius: "12px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.08)"
                    }}
                  >
                    {badge.label} ({badge.count})
                  </span>
                ))}
              </div>

              {/* Contratos em Renovação (30d) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ fontWeight: 600, color: "#0284c7" }}>Contratos em renovação (30 dias)</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{sg.renovacao30d}</span>
              </div>

              {/* Propostas & Orçamentos em Aberto */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ fontWeight: 600, color: "#d97706" }}>Propostas & orçamentos abertos</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{sg.propostasAbertas}</span>
              </div>

              {/* Contratos Suspensos Temporários */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ fontWeight: 600, color: "#ea580c" }}>Contratos suspensos temporariamente</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{sg.suspensos}</span>
              </div>

              {/* Bloqueio por Inadimplência */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ fontWeight: 600, color: "#dc2626" }}>Atendimento bloqueado (Inadimplência)</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{sg.inadimplentes}</span>
              </div>

              {/* Contratos Encerrados / Rescindidos */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ fontWeight: 600, color: "#64748b" }}>Contratos encerrados / rescindidos</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{sg.encerrados}</span>
              </div>

              {/* Total Geral da Carteira */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
                <span style={{ fontWeight: 800, color: "#0f172a" }}>Total da base histórica de contratos</span>
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "16px" }}>{sg.totalCarteira}</span>
              </div>
            </div>

            {/* Footer Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "10px", marginTop: "auto" }}>
              <Link
                href="/clientes"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#334155",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                Gerenciar Clientes & Contratos <ChevronRight size={13} />
              </Link>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={handleRefresh}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748b"
                  }}
                  title="Atualizar"
                >
                  <RefreshCw size={12} className={isRefreshing ? "spin-animation" : ""} />
                </button>
                <Link
                  href="/ocorrencias/nova"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#facc15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    color: "#0f172a"
                  }}
                  title="Nova O.S. / Orçamento"
                >
                  <Zap size={13} fill="#0f172a" />
                </Link>
              </div>
            </div>
          </div>
        );
      }

      case "widget_pontos_recebimento": {
        const pr = richData.pontosRecebimento || {
          meses: ["10/2026", "09/2026", "08/2026", "07/2026", "06/2026", "05/2026"],
          mesSelecionado: "10/2026",
          dadosPorMes: {},
          linhas: [],
          total: { saldoAnterior: 0, entradas: 0, saidas: 0, saldoAtual: 0 },
          totalPagoViaTitulo: 0,
          quantidadeTitulos: 0,
          titulosDiarios: []
        };

        const activeMesKey = selectedMonthTab === "todo" ? (pr.meses?.[0] || "10/2026") : selectedMonthTab;
        const dadosMes = pr.dadosPorMes?.[activeMesKey] || {
          linhas: pr.linhas || [],
          total: pr.total || { saldoAnterior: 0, entradas: 0, saidas: 0, saldoAtual: 0 },
          totalPagoViaTitulo: pr.totalPagoViaTitulo || 0,
          quantidadeTitulos: pr.quantidadeTitulos || 0,
          titulosDiarios: pr.titulosDiarios || []
        };

        const chartWidth = 620;
        const chartHeight = 150;
        const leftPad = 38;
        const rightPad = 48;
        const topPad = 22;
        const bottomPad = 24;
        const plotW = chartWidth - leftPad - rightPad;
        const plotH = chartHeight - topPad - bottomPad;

        const dias = dadosMes.titulosDiarios || [];
        const maxValor = Math.max(100, ...dias.map((d: any) => d.valor || 0));
        const maxQtd = Math.max(5, ...dias.map((d: any) => d.quantidade || 0));

        const numDays = Math.max(1, dias.length);
        const stepX = plotW / numDays;

        // Compute points for line (Quantidade)
        const linePoints = dias.map((d: any, idx: number) => {
          const x = leftPad + (idx + 0.5) * stepX;
          const y = topPad + plotH - (Math.min(maxQtd, d.quantidade) / maxQtd) * plotH;
          return { x, y, ...d };
        });

        const linePath = linePoints.reduce((acc: string, pt: any, idx: number) => {
          return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
        }, "");

        const ticketMedio = dadosMes.quantidadeTitulos > 0 
          ? dadosMes.totalPagoViaTitulo / dadosMes.quantidadeTitulos 
          : 0;

        return (
          <div
            key={w.id}
            className="glass-panel"
            style={{
              gridColumn: `span ${w.colSpan || 6}`,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              color: "#1e293b"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  {w.title || "Pontos de Recebimento & Movimentação Diária"}
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                  Saldos por conta/caixa e conciliação de faturas baixadas
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={handleRefresh}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748b"
                  }}
                  title="Atualizar"
                >
                  <RefreshCw size={13} className={isRefreshing ? "spin-animation" : ""} />
                </button>
                <Link
                  href="/financeiro/receitas"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#facc15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    color: "#0f172a",
                    boxShadow: "0 1px 3px rgba(250, 204, 21, 0.4)"
                  }}
                  title="Novo Recebimento"
                >
                  <Zap size={14} fill="#0f172a" />
                </Link>
              </div>
            </div>

            {/* Filter Tabs Row */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <button
                onClick={() => setSelectedMonthTab("todo")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "5px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: selectedMonthTab === "todo" ? "#0284c7" : "#ffffff",
                  color: selectedMonthTab === "todo" ? "#ffffff" : "#475569",
                  border: "1px solid #cbd5e1"
                }}
              >
                Todo Período
              </button>
              <div style={{ display: "flex", gap: "4px", overflowX: "auto" }}>
                {(pr.meses || []).map((mes: string) => {
                  const isActive = selectedMonthTab === mes;
                  return (
                    <button
                      key={mes}
                      onClick={() => setSelectedMonthTab(mes)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: isActive ? "#2563eb" : "#ffffff",
                        color: isActive ? "#ffffff" : "#475569",
                        border: isActive ? "1px solid #2563eb" : "1px solid #cbd5e1"
                      }}
                    >
                      {mes}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: "10px", fontWeight: 700 }}>
                    <th style={{ padding: "6px 10px" }}>PONTO DE RECEBIMENTO</th>
                    <th style={{ padding: "6px 10px", textAlign: "right" }}>SALDO ANTERIOR</th>
                    <th style={{ padding: "6px 10px", textAlign: "right" }}>ENTRADAS</th>
                    <th style={{ padding: "6px 10px", textAlign: "right" }}>SAÍDAS</th>
                    <th style={{ padding: "6px 10px", textAlign: "right" }}>SALDO ATUAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(dadosMes.linhas || []).map((row: any, rIdx: number) => (
                    <tr key={row.id || rIdx} style={{ borderBottom: "1px solid #f1f5f9", background: rIdx % 2 === 0 ? "#ffffff" : "#fbfcfe" }}>
                      <td style={{ padding: "6px 10px", fontWeight: 500, color: "#334155" }}>{row.nome}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", color: "#475569" }}>{formatBRL(row.saldoAnterior)}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", color: "#16a34a" }}>{formatBRL(row.entradas)}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", color: "#dc2626" }}>{formatBRL(row.saidas)}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>{formatBRL(row.saldoAtual)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#f8fafc", fontWeight: 800, borderTop: "2px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 10px", color: "#0f172a" }}>Total Consolidado</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#0f172a" }}>{formatBRL(dadosMes.total.saldoAnterior)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#16a34a" }}>{formatBRL(dadosMes.total.entradas)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#dc2626" }}>{formatBRL(dadosMes.total.saidas)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#0f172a" }}>{formatBRL(dadosMes.total.saldoAtual)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary strip */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#475569", fontWeight: 600, padding: "2px 2px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                Total Baixado no Mês: <span style={{ color: "#16a34a", fontWeight: 700 }}>{formatBRL(dadosMes.totalPagoViaTitulo)}</span> | Títulos Baixados: <span style={{ color: "#0f172a", fontWeight: 700 }}>{dadosMes.quantidadeTitulos}</span>
              </div>
              <div style={{ color: "#0284c7" }}>
                Ticket Médio: <span style={{ fontWeight: 700 }}>{formatBRL(ticketMedio)}</span>
              </div>
            </div>

            {/* Sub-section: Títulos Recebidos */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>Faturas & Títulos Recebidos por Dia ({activeMesKey})</span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#38bdf8" }} />
                    <span style={{ color: "#64748b" }}>Valor (R$)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "10px", height: "2px", background: "#f97316", position: "relative" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f97316", position: "absolute", top: "-1.5px", left: "2.5px" }} />
                    </span>
                    <span style={{ color: "#64748b" }}>Quantidade</span>
                  </div>
                </div>
              </div>

              {/* Dual-axis SVG Chart */}
              <div style={{ width: "100%", height: "155px", position: "relative", border: "1px solid #f1f5f9", borderRadius: "6px", background: "#fafbfc", padding: "4px" }}>
                <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 0.33, 0.66, 1].map((ratio, i) => {
                    const y = topPad + plotH - ratio * plotH;
                    return (
                      <line
                        key={i}
                        x1={leftPad}
                        y1={y}
                        x2={chartWidth - rightPad}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="2,2"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Left Y Axis (Quantidade em laranja) */}
                  {[0, Math.round(maxQtd / 3), Math.round((2 * maxQtd) / 3), maxQtd].map((q, i) => {
                    const y = topPad + plotH - (q / maxQtd) * plotH;
                    return (
                      <text key={i} x={leftPad - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#f97316" fontWeight="600">
                        {q}
                      </text>
                    );
                  })}

                  {/* Right Y Axis (Valor em azul) */}
                  {[0, Math.round(maxValor / 3), Math.round((2 * maxValor) / 3), Math.round(maxValor)].map((v, i) => {
                    const y = topPad + plotH - (v / maxValor) * plotH;
                    return (
                      <text key={i} x={chartWidth - rightPad + 6} y={y + 3} textAnchor="start" fontSize="9" fill="#0284c7" fontWeight="600">
                        {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                      </text>
                    );
                  })}

                  {/* Bars (Valor) */}
                  {dias.map((d: any, idx: number) => {
                    if (!d.valor || d.valor <= 0) return null;
                    const x = leftPad + idx * stepX + 2;
                    const barH = (Math.min(maxValor, d.valor) / maxValor) * plotH;
                    const y = topPad + plotH - barH;
                    const barW = Math.max(4, stepX - 4);

                    return (
                      <g key={idx}>
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={barH}
                          fill="#38bdf8"
                          rx="2"
                        >
                          <title>{`Dia ${d.dia}: ${formatBRL(d.valor)} (${d.quantidade} baixas)`}</title>
                        </rect>
                        {d.valor > (maxValor * 0.15) && (
                          <text
                            x={x + barW / 2}
                            y={y - 3}
                            textAnchor="middle"
                            fontSize="8"
                            fill="#0369a1"
                            fontWeight="700"
                          >
                            {d.valor >= 1000 ? `${(d.valor / 1000).toFixed(1)}k` : Math.round(d.valor)}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Line Path (Quantidade) */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="1.8"
                  />

                  {/* Points (Quantidade) */}
                  {linePoints.map((pt: any, idx: number) => {
                    return (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={pt.quantidade > 0 ? "3" : "1.5"}
                          fill="#f97316"
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                        {pt.quantidade > 0 && (
                          <text
                            x={pt.x}
                            y={pt.y - 4}
                            textAnchor="middle"
                            fontSize="8"
                            fill="#ea580c"
                            fontWeight="800"
                          >
                            {pt.quantidade}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* X-Axis Days Labels */}
                  {dias.map((d: any, idx: number) => {
                    const x = leftPad + (idx + 0.5) * stepX;
                    const isVisible = idx % 2 === 0 || idx === dias.length - 1;
                    if (!isVisible) return null;

                    return (
                      <text
                        key={idx}
                        x={x}
                        y={chartHeight - 6}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#64748b"
                      >
                        {d.dia}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        );
      }

      case "kpi_financial_pulse":
        return (
          <div
            key={w.id}
            style={{
              gridColumn: `span ${w.colSpan || 12}`,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px"
            }}
          >
            {/* Card 1: Saldo Consolidado em Caixa */}
            <div
              className="glass-panel"
              style={{
                padding: "22px",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.08)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", color: "#10b981" }}>
                    Saldo em Caixa Consolidado
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Liquidez imediata (Caixas ativos)
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(16, 185, 129, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10b981",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                  }}
                >
                  <Wallet size={22} />
                </div>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                {formatBRL(kpis.saldoCaixaConsolidado)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "12px", color: "#10b981" }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
                Disponível para movimentação
              </div>
            </div>

            {/* Card 2: Receitas Realizadas */}
            <div
              className="glass-panel"
              style={{
                padding: "22px",
                position: "relative",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
                boxShadow: "0 8px 24px rgba(59, 130, 246, 0.08)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", color: "#3b82f6" }}>
                    Receitas Realizadas
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    + {formatBRL(kpis.receitasPendentes)} a receber
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(59, 130, 246, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3b82f6",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
                  }}
                >
                  <TrendingUp size={22} />
                </div>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                {formatBRL(kpis.receitasRealizadas)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "12px", color: kpis.receitasAtrasadas > 0 ? "#ef4444" : "#64748b" }}>
                {kpis.receitasAtrasadas > 0 ? (
                  <>
                    <AlertTriangle size={14} color="#ef4444" />
                    <span style={{ fontWeight: 600 }}>{formatBRL(kpis.receitasAtrasadas)} em atraso</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} color="#10b981" />
                    <span>Inadimplência sob controle</span>
                  </>
                )}
              </div>
            </div>

            {/* Card 3: Despesas Pagas */}
            <div
              className="glass-panel"
              style={{
                padding: "22px",
                position: "relative",
                border: "1px solid rgba(244, 63, 94, 0.25)",
                background: "linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
                boxShadow: "0 8px 24px rgba(244, 63, 94, 0.08)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", color: "#f43f5e" }}>
                    Despesas Quitadas
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    + {formatBRL(kpis.despesasPendentes)} a liquidar
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(244, 63, 94, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f43f5e",
                    boxShadow: "0 4px 12px rgba(244, 63, 94, 0.2)"
                  }}
                >
                  <TrendingDown size={22} />
                </div>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                {formatBRL(kpis.despesasPagas)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "12px", color: kpis.despesasAtrasadas > 0 ? "#ef4444" : "#64748b" }}>
                {kpis.despesasAtrasadas > 0 ? (
                  <>
                    <AlertTriangle size={14} color="#ef4444" />
                    <span style={{ fontWeight: 600 }}>{formatBRL(kpis.despesasAtrasadas)} contas vencidas</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} color="#10b981" />
                    <span>Contas a pagar em dia</span>
                  </>
                )}
              </div>
            </div>

            {/* Card 4: Lucro & Margem Operacional */}
            <div
              className="glass-panel"
              style={{
                padding: "22px",
                position: "relative",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
                boxShadow: "0 8px 24px rgba(99, 102, 241, 0.08)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", color: "#6366f1" }}>
                    Resultado Operacional
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Lucro líquido no período
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(99, 102, 241, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6366f1",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)"
                  }}
                >
                  <DollarSign size={22} />
                </div>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: kpis.lucroOperacional >= 0 ? "#10b981" : "#ef4444", letterSpacing: "-0.02em" }}>
                {formatBRL(kpis.lucroOperacional)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "12px" }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "11px",
                    background: kpis.margemLucro >= 20 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: kpis.margemLucro >= 20 ? "#10b981" : "#f59e0b"
                  }}
                >
                  Margem: {kpis.margemLucro.toFixed(1)}%
                </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {kpis.lucroOperacional >= 0 ? "Superávit" : "Déficit"}
                </span>
              </div>
            </div>
          </div>
        );

      case "kpi_operations_pulse":
        return (
          <div
            key={w.id}
            style={{
              gridColumn: `span ${w.colSpan || 12}`,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px"
            }}
          >
            {/* Total OS */}
            <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
                <Wrench size={24} />
              </div>
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--text-secondary)" }}>Total O.S. Período</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)" }}>{kpis.totalOs}</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Atendimentos gerados</div>
              </div>
            </div>

            {/* O.S Concluídas */}
            <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--text-secondary)" }}>O.S. Concluídas</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981" }}>{kpis.osConcluidas}</div>
                <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>{kpis.taxaSucesso}% taxa de sucesso</div>
              </div>
            </div>

            {/* O.S Agendadas & Em Andamento */}
            <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
                <Clock size={24} />
              </div>
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--text-secondary)" }}>Fila de Atendimento</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)" }}>{kpis.osAgendadas + kpis.osEmAndamento}</div>
                <div style={{ fontSize: "11px", color: "#f59e0b" }}>{kpis.osAgendadas} agendadas / {kpis.osEmAndamento} em campo</div>
              </div>
            </div>

            {/* Clientes Atendidos */}
            <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(168, 85, 247, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7" }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--text-secondary)" }}>Clientes Atendidos</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)" }}>{kpis.totalClientesAtendidos}</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>De {kpis.totalClientes} clientes na base</div>
              </div>
            </div>
          </div>
        );

      case "quick_actions_bar":
        return (
          <div
            key={w.id}
            style={{
              gridColumn: `span ${w.colSpan || 12}`,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px"
            }}
          >
            <Link
              href="/ocorrencias/nova"
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 18px",
                textDecoration: "none",
                borderRadius: "12px",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.03) 100%)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={20} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>Nova O.S.</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Agendar serviço</div>
              </div>
            </Link>

            <Link
              href="/financeiro/receitas"
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 18px",
                textDecoration: "none",
                borderRadius: "12px",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Banknote size={20} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>Recebimento</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Lançar entrada</div>
              </div>
            </Link>

            <Link
              href="/financeiro/despesas"
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 18px",
                textDecoration: "none",
                borderRadius: "12px",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                background: "linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(244, 63, 94, 0.03) 100%)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f43f5e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingDown size={20} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>Nova Despesa</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Lançar saída</div>
              </div>
            </Link>

            <Link
              href="/clientes"
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 18px",
                textDecoration: "none",
                borderRadius: "12px",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.03) 100%)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>Clientes</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Base e contratos</div>
              </div>
            </Link>

            <Link
              href="/estoque/itens"
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 18px",
                textDecoration: "none",
                borderRadius: "12px",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f59e0b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Layers size={20} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>Estoque</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Saldos & insumos</div>
              </div>
            </Link>

            <Link
              href="/administracao/dashboards"
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 18px",
                textDecoration: "none",
                borderRadius: "12px",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.03) 100%)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#a855f7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sliders size={20} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>Dashboards</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Criar & personalizar</div>
              </div>
            </Link>
          </div>
        );

      case "chart_financial_cashflow":
        const monthlyData = (charts.monthlyCashflow || []) as { mes: string; receitas: number; despesas: number; saldo: number }[];
        const maxVal = Math.max(
          1000,
          ...monthlyData.map((m) => Math.max(m.receitas, m.despesas))
        );
        const total6mReceitas = monthlyData.reduce((acc, m) => acc + m.receitas, 0);
        const total6mDespesas = monthlyData.reduce((acc, m) => acc + m.despesas, 0);
        const total6mSaldo = total6mReceitas - total6mDespesas;

        return (
          <div
            key={w.id}
            className="glass-panel"
            style={{
              gridColumn: `span ${w.colSpan || 8}`,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BarChart3 size={20} color="#10b981" />
                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                    {w.title || "Fluxo de Caixa Mensal (Histórico 6 Meses)"}
                  </h3>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Comparativo de entradas realizadas versus saídas quitadas
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#10b981" }} />
                  <span style={{ color: "var(--text-secondary)" }}>Entradas</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#f43f5e" }} />
                  <span style={{ color: "var(--text-secondary)" }}>Saídas</span>
                </div>
              </div>
            </div>

            {/* Bars container */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "14px", height: "200px", paddingTop: "20px" }}>
              {monthlyData.map((m, idx) => {
                const recHeight = maxVal > 0 ? (m.receitas / maxVal) * 160 : 4;
                const payHeight = maxVal > 0 ? (m.despesas / maxVal) * 160 : 4;

                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      height: "100%",
                      justifyContent: "flex-end"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "160px" }}>
                      {/* Entradas Bar */}
                      <div
                        title={`Receitas: ${formatBRL(m.receitas)}`}
                        style={{
                          width: "20px",
                          height: `${Math.max(6, recHeight)}px`,
                          borderRadius: "4px 4px 0 0",
                          background: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
                          boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
                          transition: "height 0.4s ease"
                        }}
                      />
                      {/* Saídas Bar */}
                      <div
                        title={`Despesas: ${formatBRL(m.despesas)}`}
                        style={{
                          width: "20px",
                          height: `${Math.max(6, payHeight)}px`,
                          borderRadius: "4px 4px 0 0",
                          background: "linear-gradient(180deg, #f43f5e 0%, #e11d48 100%)",
                          boxShadow: "0 2px 6px rgba(244, 63, 94, 0.3)",
                          transition: "height 0.4s ease"
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>
                      {m.mes}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom 6M Summary Strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                padding: "14px",
                borderRadius: "10px",
                background: "rgba(0, 0, 0, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.04)"
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Total Entradas 6M</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#10b981" }}>{formatBRL(total6mReceitas)}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Total Saídas 6M</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#f43f5e" }}>{formatBRL(total6mDespesas)}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Resultado 6M</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: total6mSaldo >= 0 ? "#10b981" : "#ef4444" }}>
                  {formatBRL(total6mSaldo)}
                </div>
              </div>
            </div>
          </div>
        );

      case "chart_os_by_status":
        const dist = (charts.osStatusDistribution || []) as { label: string; count: number; color: string }[];
        const totalOsDist = dist.reduce((acc, d) => acc + d.count, 0);

        return (
          <div
            key={w.id}
            className="glass-panel"
            style={{
              gridColumn: `span ${w.colSpan || 4}`,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <PieChart size={20} color="#3b82f6" />
                <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                  {w.title || "Status das O.S."}
                </h3>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Distribuição no período ({totalOsDist} total)
              </p>
            </div>

            {/* Segmented bar */}
            <div style={{ display: "flex", height: "14px", borderRadius: "7px", overflow: "hidden", background: "rgba(255, 255, 255, 0.05)" }}>
              {dist.map((d, i) => {
                const pct = totalOsDist > 0 ? (d.count / totalOsDist) * 100 : 0;
                if (pct <= 0) return null;
                return (
                  <div
                    key={i}
                    title={`${d.label}: ${d.count} (${pct.toFixed(0)}%)`}
                    style={{
                      width: `${pct}%`,
                      background: d.color,
                      transition: "width 0.4s ease"
                    }}
                  />
                );
              })}
            </div>

            {/* Details list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {dist.map((d, i) => {
                const pct = totalOsDist > 0 ? Math.round((d.count / totalOsDist) * 100) : 0;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: d.color }} />
                      <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{d.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{d.count}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", width: "36px", textAlign: "right" }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              href="/ocorrencias"
              style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
                borderRadius: "8px",
                background: "rgba(59, 130, 246, 0.1)",
                color: "#3b82f6",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: 600,
                border: "1px solid rgba(59, 130, 246, 0.2)"
              }}
            >
              Ver Painel de Ocorrências <ChevronRight size={14} />
            </Link>
          </div>
        );

      case "chart_productivity_ranking":
        const rankings = (charts.rankingTecnicos || []) as any[];

        return (
          <div
            key={w.id}
            className="glass-panel"
            style={{
              gridColumn: `span ${w.colSpan || 6}`,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Crown size={20} color="#f59e0b" />
                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                    {w.title || "Ranking de Produtividade dos Técnicos"}
                  </h3>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Técnicos com maior volume de ordens concluídas e faturamento gerado
                </p>
              </div>
            </div>

            {rankings.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                Nenhum técnico com serviços concluídos no período selecionado.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {rankings.map((tec, idx) => {
                  const medalColors = ["#f59e0b", "#94a3b8", "#cd7f32"];
                  const isTop3 = idx < 3;

                  return (
                    <div
                      key={tec.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.04)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            background: isTop3 ? `${medalColors[idx]}20` : "rgba(255, 255, 255, 0.05)",
                            color: isTop3 ? medalColors[idx] : "var(--text-secondary)",
                            fontWeight: 800,
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: isTop3 ? `1px solid ${medalColors[idx]}40` : "1px solid transparent"
                          }}
                        >
                          {idx + 1}º
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
                            {tec.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <CheckCircle2 size={11} color="#10b981" />
                            {tec.osFeitas} O.S. concluídas
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "#10b981" }}>
                          {formatBRL(tec.faturamento)}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                          Faturado
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Link
              href="/relatorios/desempenho-tecnicos"
              style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
                borderRadius: "8px",
                background: "rgba(245, 158, 11, 0.1)",
                color: "#f59e0b",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: 600,
                border: "1px solid rgba(245, 158, 11, 0.2)"
              }}
            >
              Relatório Completo de Produtividade <ChevronRight size={14} />
            </Link>
          </div>
        );

      case "chart_revenue_by_category":
        const categories = (charts.receitasPorCategoria || []) as { categoria: string; valor: number; porcentagem: number }[];

        return (
          <div
            key={w.id}
            className="glass-panel"
            style={{
              gridColumn: `span ${w.colSpan || 6}`,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Banknote size={20} color="#6366f1" />
                <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                  {w.title || "Receitas por Categoria"}
                </h3>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Distribuição das fontes de faturamento da empresa
              </p>
            </div>

            {categories.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                Nenhuma receita categorizada no período selecionado.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {categories.map((cat, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{cat.categoria}</span>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <span style={{ fontWeight: 700, color: "#10b981" }}>{formatBRL(cat.valor)}</span>
                        <span style={{ color: "var(--text-secondary)", fontSize: "12px", width: "36px", textAlign: "right" }}>
                          {cat.porcentagem}%
                        </span>
                      </div>
                    </div>
                    <div style={{ height: "8px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.05)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${cat.porcentagem}%`,
                          borderRadius: "4px",
                          background: "linear-gradient(90deg, #6366f1 0%, #a855f7 100%)"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/financeiro/receitas"
              style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.1)",
                color: "#6366f1",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: 600,
                border: "1px solid rgba(99, 102, 241, 0.2)"
              }}
            >
              Consultar Todas as Receitas <ChevronRight size={14} />
            </Link>
          </div>
        );

      case "table_upcoming_agenda":
        const upcoming = (tables.upcomingOs || []) as any[];

        return (
          <div
            key={w.id}
            className="glass-panel"
            style={{
              gridColumn: `span ${w.colSpan || 8}`,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CalendarClock size={20} color="#3b82f6" />
                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                    {w.title || "Agenda de Ocorrências Imediatas"}
                  </h3>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Próximos atendimentos e manutenções programadas
                </p>
              </div>

              <Link
                href="/ocorrencias"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#3b82f6",
                  textDecoration: "none"
                }}
              >
                Ver Todas <ChevronRight size={14} />
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div style={{ padding: "36px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                Nenhuma ocorrência agendada pendente para os próximos dias.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {upcoming.map((os) => {
                  const dt = new Date(os.scheduled_date);
                  const dia = dt.getUTCDate();
                  const mes = dt.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "");

                  return (
                    <div
                      key={os.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.04)",
                        flexWrap: "wrap",
                        gap: "12px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "10px",
                            background: "rgba(59, 130, 246, 0.12)",
                            color: "#3b82f6",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(59, 130, 246, 0.2)"
                          }}
                        >
                          <span style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1 }}>{dia}</span>
                          <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>{mes}</span>
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>
                              {os.customer?.name || "Cliente não informado"}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontWeight: 700,
                                background: os.status === "Em Andamento" ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                                color: os.status === "Em Andamento" ? "#f59e0b" : "#3b82f6"
                              }}
                            >
                              {os.status}
                            </span>
                          </div>

                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                            <MapPin size={12} color="#94a3b8" />
                            {os.location ? `${os.location.street || ""}, ${os.location.city || ""}` : "Endereço principal"}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "#3b82f6" }}>
                          {os.scheduled_time || "Horário livre"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          O.S. #{os.id} {os.serviceType?.name ? `• ${os.serviceType.name}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "table_recent_activity":
        const logs = (tables.recentLogs || []) as any[];

        return (
          <div
            key={w.id}
            className="glass-panel"
            style={{
              gridColumn: `span ${w.colSpan || 4}`,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={20} color="#10b981" />
                <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                  {w.title || "Feed de Atividades ao Vivo"}
                </h3>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Auditoria de ações em tempo real no sistema
              </p>
            </div>

            {logs.length === 0 ? (
              <div style={{ padding: "36px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                Nenhuma atividade recente registrada nos logs.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {logs.map((log) => {
                  const dt = new Date(log.createdAt);
                  const timeStr = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div
                      key={log.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        fontSize: "12px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                        paddingBottom: "8px"
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#10b981",
                          marginTop: "5px",
                          flexShrink: 0,
                          boxShadow: "0 0 6px #10b981"
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {log.action}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {log.details || "Ação executada com sucesso"}
                        </div>
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", flexShrink: 0 }}>
                        {timeStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "table_critical_stock":
        const critItems = (tables.itensCriticos || []) as any[];

        return (
          <div
            key={w.id}
            className="glass-panel"
            style={{
              gridColumn: `span ${w.colSpan || 6}`,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={20} color="#ef4444" />
                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                    {w.title || "Alerta de Estoque Crítico"}
                  </h3>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Insumos e produtos abaixo do estoque mínimo de segurança
                </p>
              </div>

              <Link
                href="/estoque/itens"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ef4444",
                  textDecoration: "none"
                }}
              >
                Gerenciar Estoque <ChevronRight size={14} />
              </Link>
            </div>

            {critItems.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#10b981", fontSize: "13px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={24} color="#10b981" />
                <span>Excelente! Todos os itens do almoxarifado estão acima do nível mínimo.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {critItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(239, 68, 68, 0.05)",
                      border: "1px solid rgba(239, 68, 68, 0.15)"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-main)" }}>
                        {item.nome}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        Categoria: {item.categoria || "Geral"} • Mínimo: {item.estoqueMinimo} {item.unidade}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: "15px", color: "#ef4444" }}>
                        {item.estoqueAtual} {item.unidade}
                      </div>
                      <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: 700, textTransform: "uppercase" }}>
                        Repor Estoque
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "table_top_clients":
        const clients = (tables.topClientes || []) as any[];

        return (
          <div
            key={w.id}
            className="glass-panel"
            style={{
              gridColumn: `span ${w.colSpan || 6}`,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Star size={20} color="#f59e0b" />
                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                    {w.title || "Top Clientes por Faturamento"}
                  </h3>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Clientes com maior volume faturado no período selecionado
                </p>
              </div>

              <Link
                href="/clientes"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#f59e0b",
                  textDecoration: "none"
                }}
              >
                Ver Clientes <ChevronRight size={14} />
              </Link>
            </div>

            {clients.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                Nenhum faturamento registrado para clientes no período.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {clients.map((cli, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.04)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "rgba(245, 158, 11, 0.12)",
                          color: "#f59e0b",
                          fontWeight: 700,
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        #{idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-main)" }}>
                          {cli.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          {cli.document || "CPF/CNPJ não informado"} • {cli.osCount} O.S. no período
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: "14px", color: "#10b981" }}>
                        {formatBRL(cli.total)}
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                        Total Faturado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "kpi_fleet_stock":
        return (
          <div
            key={w.id}
            style={{
              gridColumn: `span ${w.colSpan || 12}`,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px"
            }}
          >
            <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                <Truck size={24} />
              </div>
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--text-secondary)" }}>Frota Operacional</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)" }}>{kpis.veiculosAtivos} veículos</div>
                <div style={{ fontSize: "11px", color: "#10b981" }}>100% ativos em campo</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
                <Building2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--text-secondary)" }}>Almoxarifados</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)" }}>{kpis.armazensAtivos} depósitos</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Armazenamento central</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(168, 85, 247, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7" }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--text-secondary)" }}>Conformidade ANVISA</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981" }}>Regular</div>
                <div style={{ fontSize: "11px", color: "#10b981" }}>Laudos e registros em dia</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px", padding: "8px 4px" }}>
      {/* EXECUTIVE HEADER */}
      <div
        className="glass-panel"
        style={{
          padding: "24px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
          border: "1px solid var(--glass-border, rgba(255, 255, 255, 0.08))",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 6px 20px rgba(79, 70, 229, 0.35)"
            }}
          >
            <Sparkles size={28} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                {currentDashboard ? currentDashboard.name : "Painel Executivo"}
              </h1>

              {currentDashboard?.isDefault && (
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.3)"
                  }}
                >
                  Principal
                </span>
              )}

              {/* Selector de Dashboard Dropdown */}
              {accessibleDashboards.length > 1 && (
                <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                  <select
                    value={currentDashboard?.id || ""}
                    onChange={(e) => handleSwitchDashboard(Number(e.target.value))}
                    style={{
                      appearance: "none",
                      padding: "6px 28px 6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--glass-border, rgba(255, 255, 255, 0.1))",
                      color: "var(--text-main)",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    {accessibleDashboards.map((dash) => (
                      <option key={dash.id} value={dash.id} style={{ background: "#1e293b", color: "#fff" }}>
                        {dash.name} {dash.isDefault ? "(Padrão)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: "8px", pointerEvents: "none", color: "var(--text-secondary)" }} />
                </div>
              )}
            </div>

            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
              {currentDashboard?.description || "Visão 360º de faturamento, rentabilidade e operações em tempo real."}
            </p>
          </div>
        </div>

        {/* Right Controls: Period Selector & Quick Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <PeriodSelector currentPeriod={currentPeriod} currentStart={currentStart} currentEnd={currentEnd} />

          <button
            onClick={handleRefresh}
            title="Atualizar dados do painel"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              background: "rgba(255, 255, 255, 0.05)",
              color: "var(--text-main)",
              border: "1px solid var(--glass-border, rgba(255, 255, 255, 0.1))",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <RefreshCw size={15} className={isRefreshing ? "spin-animation" : ""} />
            <span className="hidden-mobile">Atualizar</span>
          </button>

          {(userRole === "Administrador" || userRole === "Gestor") && (
            <Link
              href="/administracao/dashboards"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                color: "#ffffff",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)",
                transition: "all 0.2s ease"
              }}
            >
              <Settings size={15} />
              <span>Personalizar Dashboards</span>
            </Link>
          )}
        </div>
      </div>

      {/* DASHBOARDS TABS (IF MULTIPLE ACCESSIBLE) */}
      {accessibleDashboards.length > 1 && (
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {accessibleDashboards.map((dash) => {
            const isActive = currentDashboard?.id === dash.id;
            return (
              <button
                key={dash.id}
                onClick={() => handleSwitchDashboard(dash.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? "rgba(99, 102, 241, 0.18)" : "rgba(255, 255, 255, 0.03)",
                  color: isActive ? "#6366f1" : "var(--text-secondary)",
                  border: isActive ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid var(--glass-border, rgba(255, 255, 255, 0.05))",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease"
                }}
              >
                <span>{dash.name}</span>
                {dash.isDefault && <span style={{ fontSize: "10px", opacity: 0.7 }}>★</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* MAIN DYNAMIC GRID OF WIDGETS */}
      {widgets.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: "60px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6366f1"
            }}
          >
            <Sliders size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
              Nenhum widget configurado para este painel
            </h3>
            <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "var(--text-secondary)", maxWidth: "500px" }}>
              Personalize esta dashboard adicionando gráficos, cards de KPIs financeiros, indicadores de frota ou tabelas em tempo real.
            </p>
          </div>
          <Link
            href="/administracao/dashboards"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              background: "#4f46e5",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600
            }}
          >
            <Plus size={16} /> Adicionar Widgets
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: "20px"
          }}
        >
          {widgets.map((w) => renderWidget(w))}
        </div>
      )}
    </div>
  );
}
