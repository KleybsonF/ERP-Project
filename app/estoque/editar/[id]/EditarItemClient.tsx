"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Package, 
  Save, 
  ArrowLeft, 
  AlertCircle, 
  FlaskConical, 
  DollarSign, 
  Boxes, 
  FileText,
  History,
  Building2,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  Info
} from "lucide-react";
import { updateStockItem } from "@/app/actions/estoque";

interface Movement {
  id: number;
  tipo: string;
  quantidade: number;
  valorUnitario: number | null;
  valorTotal: number | null;
  lote: string | null;
  documentoRef: string | null;
  clienteNome: string | null;
  fornecedorNome: string | null;
  motivo: string | null;
  responsavel: string | null;
  createdAt: Date | string;
  warehouseOrigin?: { nome: string } | null;
  warehouseDestination?: { nome: string } | null;
}

interface StockBalance {
  id: number;
  quantidade: number;
  warehouse: {
    id: number;
    nome: string;
    tipo: string;
  };
}

interface StockItemWithRelations {
  id: number;
  nome: string;
  codigo: string | null;
  categoria: string;
  principioAtivo: string | null;
  grupoQuimico: string | null;
  registroMS: string | null;
  unidade: string;
  estoqueMinimo: number;
  precoCustoPadrao: number | null;
  precoVendaPadrao: number | null;
  fornecedorPadrao: string | null;
  observacoes: string | null;
  ativo: boolean;
  balances: StockBalance[];
  movements: Movement[];
}

export default function EditarItemClient({ item }: { item: StockItemWithRelations }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    nome: item.nome || "",
    codigo: item.codigo || "",
    categoria: item.categoria || "Químicos / Inseticidas",
    unidade: item.unidade || "UN",
    estoqueMinimo: String(item.estoqueMinimo || 0),
    precoCustoPadrao: item.precoCustoPadrao ? String(item.precoCustoPadrao) : "",
    precoVendaPadrao: item.precoVendaPadrao ? String(item.precoVendaPadrao) : "",
    fornecedorPadrao: item.fornecedorPadrao || "",
    principioAtivo: item.principioAtivo || "",
    grupoQuimico: item.grupoQuimico || "",
    registroMS: item.registroMS || "",
    observacoes: item.observacoes || ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.nome.trim()) {
      setErrorMessage("O nome do item é obrigatório.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateStockItem(item.id, {
        nome: formData.nome.trim(),
        codigo: formData.codigo.trim() || undefined,
        categoria: formData.categoria,
        unidade: formData.unidade,
        estoqueMinimo: Number(formData.estoqueMinimo) || 0,
        precoCustoPadrao: formData.precoCustoPadrao ? Number(formData.precoCustoPadrao) : undefined,
        precoVendaPadrao: formData.precoVendaPadrao ? Number(formData.precoVendaPadrao) : undefined,
        fornecedorPadrao: formData.fornecedorPadrao.trim() || undefined,
        principioAtivo: formData.principioAtivo.trim() || undefined,
        grupoQuimico: formData.grupoQuimico.trim() || undefined,
        registroMS: formData.registroMS.trim() || undefined,
        observacoes: formData.observacoes.trim() || undefined
      });

      if (res.success) {
        router.push("/estoque/itens");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao atualizar item do catálogo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSaldo = item.balances?.reduce((acc, b) => acc + b.quantidade, 0) || 0;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 16px" }}>
      {/* CABEÇALHO */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Início</Link>
          <span>/</span>
          <Link href="/estoque" style={{ color: "inherit", textDecoration: "none" }}>Estoque</Link>
          <span>/</span>
          <Link href="/estoque/itens" style={{ color: "inherit", textDecoration: "none" }}>Catálogo</Link>
          <span>/</span>
          <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Editar Item</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <Package size={26} color="var(--primary-color)" /> {item.nome}
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
              Edite as especificações cadastrais do item e consulte os saldos nos armazéns.
            </p>
          </div>
          <Link
            href="/estoque/itens"
            className="btn btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 500,
              borderRadius: "6px",
              textDecoration: "none"
            }}
          >
            <ArrowLeft size={16} /> Voltar ao Catálogo
          </Link>
        </div>
      </div>

      {/* PAINEL DE SALDOS ATUAIS NOS ARMAZÉNS */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={18} color="var(--primary-color)" /> Saldo Físico nos Armazéns (Total: {totalSaldo} {item.unidade})
          </h2>
          <Link
            href="/estoque/movimentacoes"
            className="btn btn-secondary"
            style={{ fontSize: "12px", padding: "6px 12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            Lançar Movimentação para este Item &rarr;
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {item.balances && item.balances.length > 0 ? (
            item.balances.map(b => (
              <div key={b.id} style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                  {b.warehouse?.tipo === "Móvel" ? <Truck size={14} /> : <Building2 size={14} />}
                  <span>{b.warehouse?.nome}</span>
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                  {b.quantidade} {item.unidade}
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: "1 / -1", fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
              Nenhum saldo registrado. O saldo é gerado através de Movimentações (Compras, Transferências).
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fee2e2", border: "1px solid #f87171", borderRadius: "8px", color: "#991b1b", fontSize: "14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      )}

      {/* FORMULÁRIO */}
      <form onSubmit={handleSubmit}>
        {/* CARD 1: DADOS GERAIS */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Boxes size={18} color="var(--primary-color)" /> Dados Cadastrais
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Nome do Item: *
              </label>
              <input
                type="text"
                name="nome"
                required
                value={formData.nome}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Código / SKU:
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Categoria: *
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              >
                <option value="Químicos / Inseticidas">Químicos / Inseticidas</option>
                <option value="Raticidas">Raticidas</option>
                <option value="Gel Baraticida / Formicida">Gel Baraticida / Formicida</option>
                <option value="Acessórios e Armadilhas">Acessórios e Armadilhas (Comodato)</option>
                <option value="Equipamentos / Máquinas">Equipamentos / Máquinas</option>
                <option value="EPIs">EPIs</option>
                <option value="Consumíveis / Diversos">Consumíveis / Diversos</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Unidade de Medida: *
              </label>
              <select
                name="unidade"
                value={formData.unidade}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              >
                <option value="L">Litro (L)</option>
                <option value="ML">Mililitro (ML)</option>
                <option value="KG">Quilo (KG)</option>
                <option value="G">Grama (G)</option>
                <option value="UN">Unidade (UN)</option>
                <option value="CX">Caixa (CX)</option>
                <option value="PCT">Pacote (PCT)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Estoque Mínimo de Alerta:
              </label>
              <input
                type="number"
                step="0.01"
                name="estoqueMinimo"
                value={formData.estoqueMinimo}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD 2: DADOS TÉCNICOS & QUÍMICOS */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FlaskConical size={18} color="var(--primary-color)" /> Dados Técnicos & Regulatórios
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Princípio Ativo:
              </label>
              <input
                type="text"
                name="principioAtivo"
                value={formData.principioAtivo}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Grupo Químico:
              </label>
              <input
                type="text"
                name="grupoQuimico"
                value={formData.grupoQuimico}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Registro Ministério da Saúde (MS / ANVISA):
              </label>
              <input
                type="text"
                name="registroMS"
                value={formData.registroMS}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD 3: VALORES & FORNECEDOR */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <DollarSign size={18} color="var(--primary-color)" /> Valores Padrão & Fornecedor
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Preço de Custo Padrão (R$):
              </label>
              <input
                type="number"
                step="0.01"
                name="precoCustoPadrao"
                value={formData.precoCustoPadrao}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Preço de Venda Padrão (R$):
              </label>
              <input
                type="number"
                step="0.01"
                name="precoVendaPadrao"
                value={formData.precoVendaPadrao}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Fornecedor Principal:
              </label>
              <input
                type="text"
                name="fornecedorPadrao"
                value={formData.fornecedorPadrao}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD 4: OBSERVAÇÕES */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={18} color="var(--primary-color)" /> Observações
          </h2>

          <div>
            <textarea
              name="observacoes"
              rows={3}
              value={formData.observacoes}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>
        </div>

        {/* HISTÓRICO DE MOVIMENTAÇÕES DESTE ITEM */}
        {item.movements && item.movements.length > 0 && (
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <History size={18} color="var(--primary-color)" /> Últimas Movimentações deste Item
            </h2>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px" }}>Data</th>
                    <th style={{ padding: "8px 12px" }}>Tipo</th>
                    <th style={{ padding: "8px 12px" }}>Qtd</th>
                    <th style={{ padding: "8px 12px" }}>Origem &rarr; Destino</th>
                    <th style={{ padding: "8px 12px" }}>Doc / O.S.</th>
                    <th style={{ padding: "8px 12px" }}>Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {item.movements.map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{m.tipo}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                        {m.tipo === "COMPRA" ? `+${m.quantidade}` : `-${m.quantidade}`} {item.unidade}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {m.warehouseOrigin?.nome || "-"} &rarr; {m.warehouseDestination?.nome || "-"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>{m.documentoRef || m.clienteNome || "-"}</td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>{m.responsavel || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BOTÕES DE SUBMIT */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <Link
            href="/estoque/itens"
            style={{
              padding: "10px 20px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              color: "#475569",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center"
            }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            <Save size={18} />
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
