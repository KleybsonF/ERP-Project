"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import AdminNavTabs from "@/app/components/AdminNavTabs";
import { 
  Truck, 
  Plus, 
  Search, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  ShieldAlert, 
  Users, 
  X, 
  Calendar, 
  Gauge, 
  ShieldCheck, 
  AlertTriangle,
  FileText,
  Trash2,
  Car,
  LayoutDashboard
} from "lucide-react";
import { 
  createVehicle, 
  updateVehicle, 
  toggleVehicleActive, 
  deleteVehicle,
  VehicleFormData 
} from "@/app/actions/veiculos";

interface Vehicle {
  id: number;
  plate: string;
  model: string | null;
  brand: string | null;
  year: string | null;
  color: string | null;
  renavam: string | null;
  chassi: string | null;
  tipo: string | null;
  combustivel: string | null;
  quilometragem: number | null;
  status: string;
  responsavel: string | null;
  seguradora: string | null;
  apoliceSeguro: string | null;
  vencimentoSeguro: Date | string | null;
  vencimentoIpva: Date | string | null;
  observacoes: string | null;
  ativo: boolean;
  payables?: any[];
}

export default function VeiculosClient({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    plate: "",
    model: "",
    brand: "",
    year: "",
    color: "",
    renavam: "",
    chassi: "",
    tipo: "Utilitário",
    combustivel: "Flex",
    quilometragem: "0",
    status: "Ativo",
    responsavel: "",
    seguradora: "",
    apoliceSeguro: "",
    vencimentoSeguro: "",
    vencimentoIpva: "",
    observacoes: ""
  });

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const q = searchTerm.toLowerCase().trim();
      const matchText = 
        !q ||
        v.plate.toLowerCase().includes(q) ||
        (v.model && v.model.toLowerCase().includes(q)) ||
        (v.brand && v.brand.toLowerCase().includes(q)) ||
        (v.responsavel && v.responsavel.toLowerCase().includes(q)) ||
        (v.renavam && v.renavam.toLowerCase().includes(q));

      const matchType = typeFilter === "TODOS" || v.tipo === typeFilter;
      const matchStatus = statusFilter === "TODOS" || v.status === statusFilter;

      return matchText && matchType && matchStatus;
    });
  }, [vehicles, searchTerm, typeFilter, statusFilter]);

  // KPIs
  const stats = useMemo(() => {
    let ativos = 0;
    let manutencao = 0;
    let inativos = 0;

    vehicles.forEach(v => {
      if (v.status === "Ativo") ativos++;
      else if (v.status === "Em Manutenção") manutencao++;
      else inativos++;
    });

    return { total: vehicles.length, ativos, manutencao, inativos };
  }, [vehicles]);

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setFormData({
      plate: "",
      model: "",
      brand: "",
      year: "",
      color: "",
      renavam: "",
      chassi: "",
      tipo: "Utilitário",
      combustivel: "Flex",
      quilometragem: "0",
      status: "Ativo",
      responsavel: "",
      seguradora: "",
      apoliceSeguro: "",
      vencimentoSeguro: "",
      vencimentoIpva: "",
      observacoes: ""
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    const toDateStr = (d: Date | string | null) => {
      if (!d) return "";
      const date = new Date(d);
      return date.toISOString().split("T")[0];
    };

    setFormData({
      plate: v.plate,
      model: v.model || "",
      brand: v.brand || "",
      year: v.year || "",
      color: v.color || "",
      renavam: v.renavam || "",
      chassi: v.chassi || "",
      tipo: v.tipo || "Utilitário",
      combustivel: v.combustivel || "Flex",
      quilometragem: String(v.quilometragem || 0),
      status: v.status || "Ativo",
      responsavel: v.responsavel || "",
      seguradora: v.seguradora || "",
      apoliceSeguro: v.apoliceSeguro || "",
      vencimentoSeguro: toDateStr(v.vencimentoSeguro),
      vencimentoIpva: toDateStr(v.vencimentoIpva),
      observacoes: v.observacoes || ""
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.plate.trim()) {
      setErrorMsg("A placa do veículo é obrigatória.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: VehicleFormData = {
        plate: formData.plate.trim(),
        model: formData.model.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        year: formData.year.trim() || undefined,
        color: formData.color.trim() || undefined,
        renavam: formData.renavam.trim() || undefined,
        chassi: formData.chassi.trim() || undefined,
        tipo: formData.tipo,
        combustivel: formData.combustivel,
        quilometragem: Number(formData.quilometragem) || 0,
        status: formData.status,
        responsavel: formData.responsavel.trim() || undefined,
        seguradora: formData.seguradora.trim() || undefined,
        apoliceSeguro: formData.apoliceSeguro.trim() || undefined,
        vencimentoSeguro: formData.vencimentoSeguro || null,
        vencimentoIpva: formData.vencimentoIpva || null,
        observacoes: formData.observacoes.trim() || undefined
      };

      if (editingVehicle) {
        const res = await updateVehicle(editingVehicle.id, payload);
        if (res.success && res.vehicle) {
          setVehicles(prev => prev.map(v => v.id === res.vehicle.id ? (res.vehicle as any) : v));
        }
      } else {
        const res = await createVehicle(payload);
        if (res.success && res.vehicle) {
          setVehicles(prev => [res.vehicle as any, ...prev]);
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao salvar veículo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (v: Vehicle) => {
    const action = v.ativo ? "desativar" : "reativar";
    if (!confirm(`Deseja realmente ${action} o veículo placa ${v.plate}?`)) return;

    try {
      const res = await toggleVehicleActive(v.id);
      if (res.success) {
        setVehicles(prev => prev.map(item => item.id === v.id ? { ...item, ativo: res.ativo, status: res.ativo ? "Ativo" : "Inativo" } : item));
      }
    } catch (err: any) {
      alert(err.message || "Erro ao alterar status do veículo.");
    }
  };

  const handleDelete = async (v: Vehicle) => {
    if (!confirm(`Tem certeza que deseja excluir o veículo placa ${v.plate}? Esta ação não pode ser desfeita.`)) return;

    try {
      const res = await deleteVehicle(v.id);
      if (res.success) {
        setVehicles(prev => prev.filter(item => item.id !== v.id));
      }
    } catch (err: any) {
      alert(err.message || "Erro ao excluir veículo.");
    }
  };

  const formatDate = (val: Date | string | null) => {
    if (!val) return "-";
    return new Date(val).toLocaleDateString("pt-BR");
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 16px" }}>
      {/* CABEÇALHO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Início</Link>
            <span>/</span>
            <span>Administração</span>
            <span>/</span>
            <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Veículos</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Truck size={26} color="var(--primary-color)" /> Gestão de Frota & Veículos
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            Cadastro de viaturas técnicas, carros de apoio, motos e acompanhamento de documentação.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          id="btn-cadastrar-veiculo"
          className="btn btn-primary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 600,
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(2, 132, 199, 0.2)",
            cursor: "pointer"
          }}
        >
          <Plus size={18} /> Cadastrar Veículo
        </button>
      </div>

      {/* ABAS SUPERIORES DE ADMINISTRAÇÃO */}
      <AdminNavTabs />

      {/* CARDS DE RESUMO (KPIS) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
            <span>Total da Frota</span>
            <Truck size={18} color="#64748b" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "8px" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Veículos cadastrados</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#047857", fontSize: "13px", fontWeight: 500 }}>
            <span>Em Operação</span>
            <CheckCircle2 size={18} color="#047857" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#047857", marginTop: "8px" }}>
            {stats.ativos}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Prontos para atendimento</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#b45309", fontSize: "13px", fontWeight: 500 }}>
            <span>Em Manutenção</span>
            <AlertTriangle size={18} color="#b45309" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#b45309", marginTop: "8px" }}>
            {stats.manutencao}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Oficina / Revisão</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
            <span>Inativos / Reserva</span>
            <XCircle size={18} color="#64748b" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#64748b", marginTop: "8px" }}>
            {stats.inativos}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Parados ou desativados</div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Buscar por placa, modelo, marca, motorista ou renavam..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                fontSize: "14px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{
                padding: "9px 12px",
                fontSize: "14px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#334155"
              }}
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="Utilitário">Utilitário (Fiorino, Kangoo)</option>
              <option value="Furgão">Furgão / Van</option>
              <option value="Caminhonete">Caminhonete / Picape</option>
              <option value="Passeio">Passeio (Sedan / Hatch)</option>
              <option value="Moto">Moto</option>
              <option value="Caminhão">Caminhão</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: "9px 12px",
                fontSize: "14px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#334155"
              }}
            >
              <option value="TODOS">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Em Manutenção">Em Manutenção</option>
              <option value="Inativo">Inativo</option>
              <option value="Reserva">Reserva</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE VEÍCULOS */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "12px 16px" }}>Placa</th>
                <th style={{ padding: "12px 16px" }}>Veículo (Marca / Modelo)</th>
                <th style={{ padding: "12px 16px" }}>Tipo & Combustível</th>
                <th style={{ padding: "12px 16px" }}>Quilometragem</th>
                <th style={{ padding: "12px 16px" }}>Responsável</th>
                <th style={{ padding: "12px 16px" }}>Vencimentos (IPVA / Seguro)</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <Truck size={32} color="#cbd5e1" />
                      <div style={{ fontWeight: 600, color: "#334155" }}>Nenhum veículo encontrado</div>
                      <div style={{ fontSize: "13px" }}>
                        Clique em <strong>"Cadastrar Veículo"</strong> acima para registrar a frota da empresa.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(v => (
                  <tr key={v.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {/* Placa estilizada */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        border: "1px solid #0f172a",
                        backgroundColor: "#ffffff",
                        fontWeight: 700,
                        letterSpacing: "1px",
                        fontSize: "13px",
                        color: "#0f172a",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.06)"
                      }}>
                        {v.plate}
                      </div>
                    </td>

                    {/* Veículo */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {v.brand ? `${v.brand} ` : ""}{v.model || "Modelo não informado"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {v.year ? `Ano: ${v.year}` : ""} {v.color ? `• Cor: ${v.color}` : ""}
                      </div>
                    </td>

                    {/* Tipo & Combustível */}
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#334155" }}>
                      <div>{v.tipo || "Utilitário"}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{v.combustivel || "Flex"}</div>
                    </td>

                    {/* KM */}
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 500, color: "#0f172a" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Gauge size={14} color="#64748b" />
                        <span>{(v.quilometragem || 0).toLocaleString("pt-BR")} km</span>
                      </div>
                    </td>

                    {/* Responsável */}
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#334155" }}>
                      {v.responsavel ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Users size={14} color="#64748b" />
                          <span>{v.responsavel}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Não atribuído</span>
                      )}
                    </td>

                    {/* Vencimentos */}
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "#475569" }}>
                      {v.vencimentoIpva && (
                        <div>IPVA: <strong>{formatDate(v.vencimentoIpva)}</strong></div>
                      )}
                      {v.vencimentoSeguro && (
                        <div>Seguro: <strong>{formatDate(v.vencimentoSeguro)}</strong></div>
                      )}
                      {!v.vencimentoIpva && !v.vencimentoSeguro && (
                        <span style={{ color: "#94a3b8" }}>-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: v.status === "Ativo" ? "#ecfdf5" : v.status === "Em Manutenção" ? "#fffbeb" : "#f1f5f9",
                        color: v.status === "Ativo" ? "#047857" : v.status === "Em Manutenção" ? "#b45309" : "#475569",
                        border: `1px solid ${v.status === "Ativo" ? "#a7f3d0" : v.status === "Em Manutenção" ? "#fde68a" : "#cbd5e1"}`
                      }}>
                        {v.status === "Ativo" ? <CheckCircle2 size={11} /> : v.status === "Em Manutenção" ? <AlertTriangle size={11} /> : <XCircle size={11} />}
                        {v.status}
                      </span>
                    </td>

                    {/* Ações */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          onClick={() => handleOpenEdit(v)}
                          title="Editar Veículo"
                          style={{
                            padding: "6px 8px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            borderRadius: "6px",
                            color: "#334155",
                            cursor: "pointer"
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(v)}
                          title={v.ativo ? "Desativar Veículo" : "Reativar Veículo"}
                          style={{
                            padding: "6px 8px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            borderRadius: "6px",
                            color: v.ativo ? "#b45309" : "#047857",
                            cursor: "pointer"
                          }}
                        >
                          {v.ativo ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(v)}
                          title="Excluir Veículo"
                          style={{
                            padding: "6px 8px",
                            border: "1px solid #fee2e2",
                            background: "#ffffff",
                            borderRadius: "6px",
                            color: "#b91c1c",
                            cursor: "pointer"
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "760px",
            maxHeight: "92vh",
            overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 24px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Truck size={20} color="var(--primary-color)" />
                  {editingVehicle ? `Editar Veículo: ${editingVehicle.plate}` : "Cadastrar Novo Veículo"}
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                  Identificação do veículo, dados de frota e controle de vencimentos.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px"
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
              {errorMsg && (
                <div style={{
                  padding: "10px 14px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#b91c1c",
                  fontSize: "13px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <AlertTriangle size={16} /> {errorMsg}
                </div>
              )}

              {/* DADOS PRINCIPAIS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Placa: <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ABC-1D23"
                    value={formData.plate}
                    onChange={e => setFormData(p => ({ ...p, plate: e.target.value.toUpperCase() }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 700
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Modelo:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Fiorino Endurance, Kangoo"
                    value={formData.model}
                    onChange={e => setFormData(p => ({ ...p, model: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Marca:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Fiat, Renault, Chevrolet"
                    value={formData.brand}
                    onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>
              </div>

              {/* ESPECIFICAÇÕES */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Tipo de Veículo:
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={e => setFormData(p => ({ ...p, tipo: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: "#ffffff"
                    }}
                  >
                    <option value="Utilitário">Utilitário (Fiorino, Kangoo)</option>
                    <option value="Furgão">Furgão / Van</option>
                    <option value="Caminhonete">Caminhonete / Picape</option>
                    <option value="Passeio">Passeio (Sedan / Hatch)</option>
                    <option value="Moto">Moto</option>
                    <option value="Caminhão">Caminhão</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Combustível:
                  </label>
                  <select
                    value={formData.combustivel}
                    onChange={e => setFormData(p => ({ ...p, combustivel: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: "#ffffff"
                    }}
                  >
                    <option value="Flex">Flex (Gasolina / Álcool)</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Diesel">Diesel</option>
                    <option value="GNV">GNV</option>
                    <option value="Elétrico">Elétrico</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Status Operacional:
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: "#ffffff"
                    }}
                  >
                    <option value="Ativo">Ativo (Em Operação)</option>
                    <option value="Em Manutenção">Em Manutenção / Oficina</option>
                    <option value="Reserva">Reserva</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              {/* ANO, COR, KM E CONDUTOR */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.5fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Ano:
                  </label>
                  <input
                    type="text"
                    placeholder="2022/2023"
                    value={formData.year}
                    onChange={e => setFormData(p => ({ ...p, year: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Cor:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Branco"
                    value={formData.color}
                    onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    KM Atual:
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={formData.quilometragem}
                    onChange={e => setFormData(p => ({ ...p, quilometragem: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Responsável / Motorista:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Oliveira (Técnico 01)"
                    value={formData.responsavel}
                    onChange={e => setFormData(p => ({ ...p, responsavel: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>
              </div>

              {/* DOCUMENTOS / RENAVAM / CHASSI */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Renavam:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 01234567890"
                    value={formData.renavam}
                    onChange={e => setFormData(p => ({ ...p, renavam: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Chassi:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 9BD..."
                    value={formData.chassi}
                    onChange={e => setFormData(p => ({ ...p, chassi: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>
              </div>

              {/* SEGURO E VENCIMENTOS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Seguradora:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Porto Seguro"
                    value={formData.seguradora}
                    onChange={e => setFormData(p => ({ ...p, seguradora: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Nº Apólice:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: AP-88421"
                    value={formData.apoliceSeguro}
                    onChange={e => setFormData(p => ({ ...p, apoliceSeguro: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Vencimento Seguro:
                  </label>
                  <input
                    type="date"
                    value={formData.vencimentoSeguro}
                    onChange={e => setFormData(p => ({ ...p, vencimentoSeguro: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Vencimento IPVA:
                  </label>
                  <input
                    type="date"
                    value={formData.vencimentoIpva}
                    onChange={e => setFormData(p => ({ ...p, vencimentoIpva: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                </div>
              </div>

              {/* OBSERVAÇÕES */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Observações Gerais:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Viatura equipada com pulverizador motorizado fixo na caçamba..."
                  value={formData.observacoes}
                  onChange={e => setFormData(p => ({ ...p, observacoes: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* BOTÕES */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  style={{
                    padding: "9px 16px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    borderRadius: "8px",
                    color: "#475569",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  <CheckCircle2 size={16} />
                  {isSubmitting ? "Salvando..." : editingVehicle ? "Salvar Alterações" : "Cadastrar Veículo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
