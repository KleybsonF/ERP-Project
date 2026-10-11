"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowUpDown, 
  Plus, 
  Search, 
  Layers, 
  Package, 
  Building2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Calendar, 
  User, 
  FileText, 
  Truck, 
  DollarSign, 
  X,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  RefreshCw,
  Handshake,
  Wrench,
  AlertTriangle
} from "lucide-react";
import { createStockMovement } from "@/app/actions/estoque";

type MovementType = 
  | "COMPRA" 
  | "VENDA" 
  | "SAIDA_SERVICO" 
  | "COMODATO" 
  | "TRANSFERENCIA" 
  | "DEVOLUCAO" 
  | "AJUSTE" 
  | "DESCARTE";

interface StockItem {
  id: number;
  nome: string;
  codigo: string | null;
  categoria: string;
  unidade: string;
  estoqueMinimo: number;
  precoCustoPadrao: number | null;
  precoVendaPadrao: number | null;
  fornecedorPadrao: string | null;
  ativo: boolean;
  balances?: Array<{
    warehouseId: number;
    quantidade: number;
    warehouse: {
      id: number;
      nome: string;
    };
  }>;
}

interface Warehouse {
  id: number;
  nome: string;
  codigo: string | null;
  tipo: string;
  responsavel: string | null;
  ativo: boolean;
}

interface StockMovement {
  id: number;
  stockItemId: number;
  tipo: string;
  quantidade: number;
  warehouseOriginId: number | null;
  warehouseDestinationId: number | null;
  valorUnitario: number | null;
  valorTotal: number | null;
  lote: string | null;
  dataValidade: Date | string | null;
  clienteNome: string | null;
  fornecedorNome: string | null;
  documentoRef: string | null;
  motivo: string | null;
  responsavel: string | null;
  createdAt: Date | string;
  stockItem: {
    id: number;
    nome: string;
    codigo: string | null;
    unidade: string;
    categoria: string;
  };
  warehouseOrigin: {
    id: number;
    nome: string;
    tipo: string;
  } | null;
  warehouseDestination: {
    id: number;
    nome: string;
    tipo: string;
  } | null;
}

interface MovimentacoesClientProps {
  initialMovements: StockMovement[];
  stockItems: StockItem[];
  warehouses: Warehouse[];
}

export default function MovimentacoesClient({
  initialMovements,
  stockItems,
  warehouses
}: MovimentacoesClientProps) {
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("TODOS");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("TODOS");

  // Modal de Nova Movimentação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    stockItemId: stockItems[0]?.id ? String(stockItems[0].id) : "",
    tipo: "COMPRA" as MovementType,
    quantidade: "1",
    warehouseOriginId: "",
    warehouseDestinationId: warehouses[0]?.id ? String(warehouses[0].id) : "",
    valorUnitario: "",
    lote: "",
    dataValidade: "",
    clienteNome: "",
    fornecedorNome: "",
    documentoRef: "",
    motivo: "",
    responsavel: "Operador de Estoque"
  });

  // Atualiza valor padrão ao trocar o produto selecionado
  const handleItemChange = (itemIdStr: string) => {
    const selected = stockItems.find(i => i.id === Number(itemIdStr));
    setFormData(prev => ({
      ...prev,
      stockItemId: itemIdStr,
      valorUnitario: selected?.precoCustoPadrao ? String(selected.precoCustoPadrao) : prev.valorUnitario,
      fornecedorNome: selected?.fornecedorPadrao || prev.fornecedorNome
    }));
  };

  const handleOpenModal = (presetItemId?: number, presetTipo?: MovementType) => {
    setErrorMessage("");
    const defaultItem = presetItemId ? stockItems.find(i => i.id === presetItemId) : stockItems[0];
    const itemStr = defaultItem ? String(defaultItem.id) : (stockItems[0]?.id ? String(stockItems[0].id) : "");
    const tipo = presetTipo || "COMPRA";

    setFormData({
      stockItemId: itemStr,
      tipo,
      quantidade: "1",
      warehouseOriginId: (tipo === "COMPRA" || tipo === "DEVOLUCAO") ? "" : (warehouses[0]?.id ? String(warehouses[0].id) : ""),
      warehouseDestinationId: (tipo === "COMPRA" || tipo === "DEVOLUCAO" || tipo === "TRANSFERENCIA") ? (warehouses[0]?.id ? String(warehouses[0].id) : "") : "",
      valorUnitario: defaultItem?.precoCustoPadrao ? String(defaultItem.precoCustoPadrao) : "",
      lote: "",
      dataValidade: "",
      clienteNome: "",
      fornecedorNome: defaultItem?.fornecedorPadrao || "",
      documentoRef: "",
      motivo: "",
      responsavel: "Operador de Estoque"
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const itemId = Number(formData.stockItemId);
    const qtd = Number(formData.quantidade);

    if (!itemId) {
      setErrorMessage("Selecione um produto do catálogo.");
      return;
    }
    if (!qtd || qtd <= 0) {
      setErrorMessage("Informe uma quantidade válida e maior que zero.");
      return;
    }

    if (formData.tipo === "COMPRA" || formData.tipo === "DEVOLUCAO") {
      if (!formData.warehouseDestinationId) {
        setErrorMessage("Selecione o armazém de destino para a entrada.");
        return;
      }
    } else if (["VENDA", "SAIDA_SERVICO", "COMODATO", "DESCARTE"].includes(formData.tipo)) {
      if (!formData.warehouseOriginId) {
        setErrorMessage("Selecione o armazém de origem para a saída.");
        return;
      }
    } else if (formData.tipo === "TRANSFERENCIA") {
      if (!formData.warehouseOriginId || !formData.warehouseDestinationId) {
        setErrorMessage("Informe o armazém de origem e o armazém de destino.");
        return;
      }
      if (formData.warehouseOriginId === formData.warehouseDestinationId) {
        setErrorMessage("O armazém de origem e destino não podem ser o mesmo.");
        return;
      }
    } else if (formData.tipo === "AJUSTE") {
      if (!formData.warehouseDestinationId && !formData.warehouseOriginId) {
        setErrorMessage("Selecione o armazém que passará pelo ajuste.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await createStockMovement({
        stockItemId: itemId,
        tipo: formData.tipo,
        quantidade: qtd,
        warehouseOriginId: formData.warehouseOriginId ? Number(formData.warehouseOriginId) : undefined,
        warehouseDestinationId: formData.warehouseDestinationId ? Number(formData.warehouseDestinationId) : undefined,
        valorUnitario: formData.valorUnitario ? Number(formData.valorUnitario) : undefined,
        lote: formData.lote.trim() || undefined,
        dataValidade: formData.dataValidade || null,
        clienteNome: formData.clienteNome.trim() || undefined,
        fornecedorNome: formData.fornecedorNome.trim() || undefined,
        documentoRef: formData.documentoRef.trim() || undefined,
        motivo: formData.motivo.trim() || undefined,
        responsavel: formData.responsavel.trim() || undefined
      });

      if (res.success && res.movement) {
        const itemObj = stockItems.find(i => i.id === itemId);
        const whOrig = warehouses.find(w => w.id === Number(formData.warehouseOriginId));
        const whDest = warehouses.find(w => w.id === Number(formData.warehouseDestinationId));

        const newMovementWithRelations: StockMovement = {
          ...res.movement,
          stockItem: itemObj ? {
            id: itemObj.id,
            nome: itemObj.nome,
            codigo: itemObj.codigo,
            unidade: itemObj.unidade,
            categoria: itemObj.categoria
          } : {
            id: itemId,
            nome: "Item",
            codigo: null,
            unidade: "UN",
            categoria: "Geral"
          },
          warehouseOrigin: whOrig ? { id: whOrig.id, nome: whOrig.nome, tipo: whOrig.tipo } : null,
          warehouseDestination: whDest ? { id: whDest.id, nome: whDest.nome, tipo: whDest.tipo } : null
        };

        setMovements(prev => [newMovementWithRelations, ...prev]);
        handleCloseModal();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao registrar movimentação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtragem de movimentações
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const q = searchTerm.toLowerCase().trim();
      const matchText = 
        !q ||
        m.stockItem.nome.toLowerCase().includes(q) ||
        (m.stockItem.codigo && m.stockItem.codigo.toLowerCase().includes(q)) ||
        (m.documentoRef && m.documentoRef.toLowerCase().includes(q)) ||
        (m.clienteNome && m.clienteNome.toLowerCase().includes(q)) ||
        (m.fornecedorNome && m.fornecedorNome.toLowerCase().includes(q)) ||
        (m.lote && m.lote.toLowerCase().includes(q)) ||
        (m.motivo && m.motivo.toLowerCase().includes(q));

      const matchType = selectedType === "TODOS" || m.tipo === selectedType;
      
      const whIdNum = Number(selectedWarehouseId);
      const matchWarehouse = 
        selectedWarehouseId === "TODOS" ||
        m.warehouseOriginId === whIdNum ||
        m.warehouseDestinationId === whIdNum;

      return matchText && matchType && matchWarehouse;
    });
  }, [movements, searchTerm, selectedType, selectedWarehouseId]);

  // Estatísticas rápidas
  const stats = useMemo(() => {
    let compras = 0;
    let saidasServico = 0;
    let comodatos = 0;
    let transferencias = 0;

    movements.forEach(m => {
      if (m.tipo === "COMPRA") compras++;
      else if (m.tipo === "SAIDA_SERVICO" || m.tipo === "VENDA") saidasServico++;
      else if (m.tipo === "COMODATO") comodatos++;
      else if (m.tipo === "TRANSFERENCIA") transferencias++;
    });

    return { total: movements.length, compras, saidasServico, comodatos, transferencias };
  }, [movements]);

  const getTypeBadge = (tipo: string) => {
    switch (tipo) {
      case "COMPRA":
        return {
          label: "Entrada (Compra)",
          icon: <ArrowDownLeft size={13} />,
          bgColor: "#ecfdf5",
          textColor: "#047857",
          borderColor: "#a7f3d0"
        };
      case "VENDA":
        return {
          label: "Saída (Venda)",
          icon: <ArrowUpRight size={13} />,
          bgColor: "#eff6ff",
          textColor: "#1d4ed8",
          borderColor: "#bfdbfe"
        };
      case "SAIDA_SERVICO":
        return {
          label: "Saída p/ O.S.",
          icon: <Wrench size={13} />,
          bgColor: "#f5f3ff",
          textColor: "#6d28d9",
          borderColor: "#ddd6fe"
        };
      case "COMODATO":
        return {
          label: "Comodato Cliente",
          icon: <Handshake size={13} />,
          bgColor: "#fffbeb",
          textColor: "#b45309",
          borderColor: "#fde68a"
        };
      case "TRANSFERENCIA":
        return {
          label: "Transferência",
          icon: <ArrowRightLeft size={13} />,
          bgColor: "#eef2ff",
          textColor: "#4338ca",
          borderColor: "#c7d2fe"
        };
      case "DEVOLUCAO":
        return {
          label: "Devolução",
          icon: <RefreshCw size={13} />,
          bgColor: "#f0fdf4",
          textColor: "#15803d",
          borderColor: "#bbf7d0"
        };
      case "AJUSTE":
        return {
          label: "Ajuste / Balanço",
          icon: <SlidersHorizontal size={13} />,
          bgColor: "#ecfeff",
          textColor: "#0e7490",
          borderColor: "#a5f3fc"
        };
      case "DESCARTE":
        return {
          label: "Descarte / Avaria",
          icon: <AlertTriangle size={13} />,
          bgColor: "#fef2f2",
          textColor: "#b91c1c",
          borderColor: "#fecaca"
        };
      default:
        return {
          label: tipo,
          icon: <ArrowUpDown size={13} />,
          bgColor: "#f1f5f9",
          textColor: "#475569",
          borderColor: "#cbd5e1"
        };
    }
  };

  const formatDate = (val: Date | string | null) => {
    if (!val) return "-";
    const d = new Date(val);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 16px" }}>
      {/* CABEÇALHO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Início</Link>
            <span>/</span>
            <Link href="/estoque" style={{ color: "inherit", textDecoration: "none" }}>Estoque</Link>
            <span>/</span>
            <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Movimentações</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <ArrowUpDown size={26} color="var(--primary-color)" /> Movimentações de Estoque
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            Controle de fluxo físico: compras, baixas para ordens de serviço, comodato de armadilhas, transferências e vendas.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          id="btn-lancar-nova-movimentacao"
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
          <Plus size={18} /> Nova Movimentação
        </button>
      </div>

      {/* ABAS SUPERIORES */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px", flexWrap: "wrap" }}>
        <Link
          href="/estoque"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#64748b",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            marginBottom: "-2px"
          }}
        >
          <Layers size={17} /> Posição de Estoque
        </Link>
        <Link
          href="/estoque/movimentacoes"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--primary-color)",
            textDecoration: "none",
            borderBottom: "2px solid var(--primary-color)",
            marginBottom: "-2px"
          }}
        >
          <ArrowUpDown size={17} /> Movimentações
        </Link>
        <Link
          href="/estoque/itens"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#64748b",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            marginBottom: "-2px"
          }}
        >
          <Package size={17} /> Cadastro de Itens
        </Link>
        <Link
          href="/estoque/armazens"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#64748b",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            marginBottom: "-2px"
          }}
        >
          <Building2 size={17} /> Cadastro de Armazéns
        </Link>
      </div>

      {/* AVISO DIDÁTICO */}
      <div style={{
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "13px",
        color: "#166534"
      }}>
        <Info size={20} color="#16a34a" style={{ flexShrink: 0 }} />
        <div>
          <strong>Fluxo de Estoque em Tempo Real:</strong> O cadastro do item define o catálogo padronizado. As movimentações registradas abaixo são as únicas responsáveis por alimentar entradas de fornecedores, carregar viaturas dos técnicos e registrar instalações em clientes.
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
            <span>Total Registros</span>
            <ArrowUpDown size={18} color="#64748b" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "8px" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Histórico de operações</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#047857", fontSize: "13px", fontWeight: 500 }}>
            <span>Entradas (Compras)</span>
            <ArrowDownLeft size={18} color="#047857" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#047857", marginTop: "8px" }}>
            {stats.compras}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Notas fiscais e compras</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#6d28d9", fontSize: "13px", fontWeight: 500 }}>
            <span>Saídas para O.S. / Venda</span>
            <Wrench size={18} color="#6d28d9" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#6d28d9", marginTop: "8px" }}>
            {stats.saidasServico}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Aplicação em serviços de campo</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#b45309", fontSize: "13px", fontWeight: 500 }}>
            <span>Comodatos Ativos</span>
            <Handshake size={18} color="#b45309" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#b45309", marginTop: "8px" }}>
            {stats.comodatos}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Armadilhas em clientes</div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#4338ca", fontSize: "13px", fontWeight: 500 }}>
            <span>Transferências</span>
            <ArrowRightLeft size={18} color="#4338ca" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#4338ca", marginTop: "8px" }}>
            {stats.transferencias}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Almoxarifado &harr; Viaturas</div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Buscar por produto, lote, O.S., NF, cliente ou fornecedor..."
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
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              style={{
                padding: "9px 12px",
                fontSize: "14px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#334155"
              }}
            >
              <option value="TODOS">Todos os Tipos de Movimentação</option>
              <option value="COMPRA">Entrada (Compra)</option>
              <option value="SAIDA_SERVICO">Saída p/ Ordem de Serviço</option>
              <option value="COMODATO">Comodato em Cliente</option>
              <option value="TRANSFERENCIA">Transferência entre Locais</option>
              <option value="VENDA">Saída (Venda)</option>
              <option value="DEVOLUCAO">Devolução</option>
              <option value="AJUSTE">Ajuste de Balanço</option>
              <option value="DESCARTE">Descarte / Avaria</option>
            </select>

            <select
              value={selectedWarehouseId}
              onChange={e => setSelectedWarehouseId(e.target.value)}
              style={{
                padding: "9px 12px",
                fontSize: "14px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#334155"
              }}
            >
              <option value="TODOS">Todos os Armazéns / Viaturas</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.nome} ({w.tipo})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE MOVIMENTAÇÕES */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "12px 16px" }}>Data / Hora</th>
                <th style={{ padding: "12px 16px" }}>Tipo</th>
                <th style={{ padding: "12px 16px" }}>Produto (Catálogo)</th>
                <th style={{ padding: "12px 16px" }}>Quantidade</th>
                <th style={{ padding: "12px 16px" }}>Origem &rarr; Destino</th>
                <th style={{ padding: "12px 16px" }}>Documento / Ref</th>
                <th style={{ padding: "12px 16px" }}>Lote / Validade</th>
                <th style={{ padding: "12px 16px" }}>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <ArrowUpDown size={32} color="#cbd5e1" />
                      <div style={{ fontWeight: 600, color: "#334155" }}>Nenhuma movimentação encontrada</div>
                      <div style={{ fontSize: "13px" }}>
                        Clique em <strong>"Nova Movimentação"</strong> acima para registrar entradas ou saídas.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => {
                  const badge = getTypeBadge(m.tipo);
                  return (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", color: "#334155", fontSize: "13px", whiteSpace: "nowrap" }}>
                        {formatDate(m.createdAt)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "4px 9px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor: badge.bgColor,
                          color: badge.textColor,
                          border: `1px solid ${badge.borderColor}`,
                          whiteSpace: "nowrap"
                        }}>
                          {badge.icon} {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{m.stockItem.nome}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "8px" }}>
                          {m.stockItem.codigo && <span>Cód: {m.stockItem.codigo}</span>}
                          <span>Cat: {m.stockItem.categoria}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: "15px",
                          color: m.tipo === "COMPRA" || m.tipo === "DEVOLUCAO" ? "#047857" : "#0f172a"
                        }}>
                          {m.tipo === "COMPRA" || m.tipo === "DEVOLUCAO" ? `+${m.quantidade}` : `-${m.quantidade}`} {m.stockItem.unidade}
                        </span>
                        {m.valorTotal ? (
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {m.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#334155" }}>
                        {m.tipo === "TRANSFERENCIA" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "#b91c1c" }}>{m.warehouseOrigin?.nome || "Origem"}</span>
                            <span>&rarr;</span>
                            <span style={{ color: "#047857", fontWeight: 600 }}>{m.warehouseDestination?.nome || "Destino"}</span>
                          </div>
                        ) : m.tipo === "COMPRA" || m.tipo === "DEVOLUCAO" ? (
                          <div>
                            <span style={{ color: "#64748b", fontSize: "12px" }}>Destino: </span>
                            <strong style={{ color: "#047857" }}>{m.warehouseDestination?.nome || "Almoxarifado"}</strong>
                          </div>
                        ) : (
                          <div>
                            <span style={{ color: "#64748b", fontSize: "12px" }}>Origem: </span>
                            <strong style={{ color: "#334155" }}>{m.warehouseOrigin?.nome || "-"}</strong>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                        {m.documentoRef && (
                          <div style={{ fontWeight: 500, color: "#0f172a" }}>Doc/OS: {m.documentoRef}</div>
                        )}
                        {m.clienteNome && (
                          <div style={{ color: "#4338ca", fontSize: "12px" }}>Cliente: {m.clienteNome}</div>
                        )}
                        {m.fornecedorNome && (
                          <div style={{ color: "#047857", fontSize: "12px" }}>Forn: {m.fornecedorNome}</div>
                        )}
                        {m.motivo && !m.documentoRef && !m.clienteNome && !m.fornecedorNome && (
                          <div style={{ color: "#64748b", fontSize: "12px" }}>{m.motivo}</div>
                        )}
                        {!m.documentoRef && !m.clienteNome && !m.fornecedorNome && !m.motivo && (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#475569" }}>
                        {m.lote && <div>Lote: <strong>{m.lote}</strong></div>}
                        {m.dataValidade && <div>Val: {formatDate(m.dataValidade).split(" ")[0]}</div>}
                        {!m.lote && !m.dataValidade && <span style={{ color: "#94a3b8" }}>-</span>}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                        {m.responsavel || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE NOVA MOVIMENTAÇÃO */}
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
            maxWidth: "700px",
            maxHeight: "92vh",
            overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            border: "1px solid #e2e8f0"
          }}>
            {/* Cabeçalho do Modal */}
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
                  <ArrowUpDown size={20} color="var(--primary-color)" /> Registrar Movimentação de Estoque
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                  Selecione o produto pré-cadastrado no catálogo e o tipo de movimentação.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                  borderRadius: "6px"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
              {errorMessage && (
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
                  <AlertTriangle size={16} /> {errorMessage}
                </div>
              )}

              {/* SELEÇÃO DO PRODUTO (CATÁLOGO PRÉ-ESTABELECIDO) */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Produto / Insumo do Catálogo <span style={{ color: "#ef4444" }}>*</span>
                </label>
                {stockItems.length === 0 ? (
                  <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "13px" }}>
                    Nenhum item cadastrado no catálogo ainda.{" "}
                    <Link href="/estoque/itens" style={{ fontWeight: 700, textDecoration: "underline", color: "#b91c1c" }}>
                      Cadastre um item primeiro no Catálogo &rarr;
                    </Link>
                  </div>
                ) : (
                  <select
                    value={formData.stockItemId}
                    onChange={e => handleItemChange(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                      background: "#ffffff",
                      fontWeight: 500
                    }}
                  >
                    <option value="">Selecione o produto do catálogo...</option>
                    {stockItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nome} {item.codigo ? `(${item.codigo})` : ""} - {item.categoria} [{item.unidade}]
                      </option>
                    ))}
                  </select>
                )}
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                  Item pré-cadastrado no catálogo. A movimentação alimentará o saldo nos armazéns.
                </div>
              </div>

              {/* TIPO DE MOVIMENTAÇÃO */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Tipo de Movimentação <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
                  {[
                    { id: "COMPRA", label: "Compra (Entrada)", icon: <ArrowDownLeft size={14} color="#047857" /> },
                    { id: "SAIDA_SERVICO", label: "Saída O.S. / Serviço", icon: <Wrench size={14} color="#6d28d9" /> },
                    { id: "COMODATO", label: "Comodato Cliente", icon: <Handshake size={14} color="#b45309" /> },
                    { id: "TRANSFERENCIA", label: "Transferência", icon: <ArrowRightLeft size={14} color="#4338ca" /> },
                    { id: "VENDA", label: "Venda Direta", icon: <ArrowUpRight size={14} color="#1d4ed8" /> },
                    { id: "DEVOLUCAO", label: "Devolução", icon: <RefreshCw size={14} color="#15803d" /> },
                    { id: "AJUSTE", label: "Ajuste / Balanço", icon: <SlidersHorizontal size={14} color="#0e7490" /> },
                    { id: "DESCARTE", label: "Descarte / Avaria", icon: <AlertTriangle size={14} color="#b91c1c" /> },
                  ].map(tipoOpt => (
                    <button
                      key={tipoOpt.id}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, tipo: tipoOpt.id as MovementType }))}
                      style={{
                        padding: "8px 10px",
                        fontSize: "12px",
                        fontWeight: formData.tipo === tipoOpt.id ? 700 : 500,
                        border: formData.tipo === tipoOpt.id ? "2px solid var(--primary-color)" : "1px solid #cbd5e1",
                        background: formData.tipo === tipoOpt.id ? "rgba(2, 132, 199, 0.08)" : "#ffffff",
                        color: formData.tipo === tipoOpt.id ? "var(--primary-color)" : "#334155",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        justifyContent: "center"
                      }}
                    >
                      {tipoOpt.icon} {tipoOpt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ARMAZÉNS (ORIGEM / DESTINO CONFORME O TIPO) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                {/* Armazém de Origem (necessário para saídas, comodato, transferência e descarte) */}
                {["VENDA", "SAIDA_SERVICO", "COMODATO", "TRANSFERENCIA", "DESCARTE"].includes(formData.tipo) && (
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Armazém de Origem (Sai de) <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      value={formData.warehouseOriginId}
                      onChange={e => setFormData(p => ({ ...p, warehouseOriginId: e.target.value }))}
                      required
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        background: "#ffffff"
                      }}
                    >
                      <option value="">Selecione o armazém/viatura...</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.nome} ({w.tipo})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Armazém de Destino (necessário para compra, devolução, transferência e ajuste) */}
                {["COMPRA", "DEVOLUCAO", "TRANSFERENCIA", "AJUSTE"].includes(formData.tipo) && (
                  <div style={{ gridColumn: (formData.tipo === "COMPRA" || formData.tipo === "DEVOLUCAO" || formData.tipo === "AJUSTE") ? "1 / -1" : "auto" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Armazém de Destino (Entra em) <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      value={formData.warehouseDestinationId}
                      onChange={e => setFormData(p => ({ ...p, warehouseDestinationId: e.target.value }))}
                      required
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        background: "#ffffff"
                      }}
                    >
                      <option value="">Selecione o armazém/viatura...</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.nome} ({w.tipo})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* QUANTIDADE E VALOR */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {formData.tipo === "AJUSTE" ? "Novo Saldo Apurado (Real)" : "Quantidade Movimentada"} <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.quantidade}
                    onChange={e => setFormData(p => ({ ...p, quantidade: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Valor Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valorUnitario}
                    onChange={e => setFormData(p => ({ ...p, valorUnitario: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>
              </div>

              {/* CAMPOS ESPECÍFICOS POR TIPO */}
              {formData.tipo === "COMPRA" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Fornecedor
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Bayer, Syngenta, Envu..."
                      value={formData.fornecedorNome}
                      onChange={e => setFormData(p => ({ ...p, fornecedorNome: e.target.value }))}
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
                      Nota Fiscal / Pedido de Compra
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: NF-e 12458"
                      value={formData.documentoRef}
                      onChange={e => setFormData(p => ({ ...p, documentoRef: e.target.value }))}
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
              )}

              {(formData.tipo === "SAIDA_SERVICO" || formData.tipo === "COMODATO" || formData.tipo === "VENDA") && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Cliente
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Restaurante Bom Sabor / Condomínio Sol"
                      value={formData.clienteNome}
                      onChange={e => setFormData(p => ({ ...p, clienteNome: e.target.value }))}
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
                      {formData.tipo === "SAIDA_SERVICO" ? "Ordem de Serviço (O.S.)" : formData.tipo === "COMODATO" ? "Contrato de Comodato" : "Pedido / Cupom"}
                    </label>
                    <input
                      type="text"
                      placeholder={formData.tipo === "SAIDA_SERVICO" ? "Ex: OS-2026-089" : "Ex: Contrato nº 44"}
                      value={formData.documentoRef}
                      onChange={e => setFormData(p => ({ ...p, documentoRef: e.target.value }))}
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
              )}

              {/* LOTE E VALIDADE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Lote do Fabricante
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: LOTE-8942A"
                    value={formData.lote}
                    onChange={e => setFormData(p => ({ ...p, lote: e.target.value }))}
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
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    value={formData.dataValidade}
                    onChange={e => setFormData(p => ({ ...p, dataValidade: e.target.value }))}
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

              {/* RESPONSÁVEL E MOTIVO */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Responsável pelo Lançamento
                  </label>
                  <input
                    type="text"
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
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Motivo / Observações
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Reposição semanal, aplicação preventiva..."
                    value={formData.motivo}
                    onChange={e => setFormData(p => ({ ...p, motivo: e.target.value }))}
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

              {/* Botões do Rodapé */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  style={{
                    padding: "9px 16px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    borderRadius: "8px",
                    color: "#475569",
                    fontSize: "14px",
                    fontWeight: 500,
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
                  {isSubmitting ? "Lançando..." : "Confirmar Movimentação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
