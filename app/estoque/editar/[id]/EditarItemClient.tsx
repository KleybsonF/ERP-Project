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
  Calendar, 
  FileText,
  History,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import { updateStockItem } from "@/app/actions/estoque";

interface Movement {
  id: number;
  tipo: string;
  quantidade: number;
  saldoApos: number;
  motivo: string | null;
  origemDestino: string | null;
  responsavel: string | null;
  createdAt: Date | string;
}

interface StockItemWithMovements {
  id: number;
  nome: string;
  codigo: string | null;
  categoria: string;
  principioAtivo: string | null;
  grupoQuimico: string | null;
  registroMS: string | null;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  localizacao: string | null;
  lote: string | null;
  dataValidade: Date | string | null;
  precoCusto: number | null;
  precoVenda: number | null;
  fornecedor: string | null;
  observacoes: string | null;
  isHidden: boolean;
  movements: Movement[];
}

export default function EditarItemClient({ item }: { item: StockItemWithMovements }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const formatDateForInput = (d: Date | string | null) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    nome: item.nome || "",
    codigo: item.codigo || "",
    categoria: item.categoria || "Químicos / Inseticidas",
    unidade: item.unidade || "UN",
    localizacao: item.localizacao || "",
    quantidadeMinima: String(item.quantidadeMinima || 0),
    precoCusto: item.precoCusto ? String(item.precoCusto) : "",
    precoVenda: item.precoVenda ? String(item.precoVenda) : "",
    fornecedor: item.fornecedor || "",
    principioAtivo: item.principioAtivo || "",
    grupoQuimico: item.grupoQuimico || "",
    registroMS: item.registroMS || "",
    lote: item.lote || "",
    dataValidade: formatDateForInput(item.dataValidade),
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
        localizacao: formData.localizacao.trim() || undefined,
        quantidadeMinima: Number(formData.quantidadeMinima) || 0,
        precoCusto: formData.precoCusto ? Number(formData.precoCusto) : undefined,
        precoVenda: formData.precoVenda ? Number(formData.precoVenda) : undefined,
        fornecedor: formData.fornecedor.trim() || undefined,
        principioAtivo: formData.principioAtivo.trim() || undefined,
        grupoQuimico: formData.grupoQuimico.trim() || undefined,
        registroMS: formData.registroMS.trim() || undefined,
        lote: formData.lote.trim() || undefined,
        dataValidade: formData.dataValidade || null,
        observacoes: formData.observacoes.trim() || undefined
      });

      if (res.success) {
        router.push("/estoque");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao atualizar item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 16px" }}>
      {/* CABEÇALHO */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Início</Link>
          <span>/</span>
          <Link href="/estoque" style={{ color: "inherit", textDecoration: "none" }}>Estoque</Link>
          <span>/</span>
          <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Editar Item</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <Package size={26} color="var(--primary-color)" /> Editar: {item.nome}
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
              Atualize as informações cadastrais e confira o histórico de movimentações.
            </p>
          </div>
          <Link
            href="/estoque"
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
            <ArrowLeft size={16} /> Voltar ao Estoque
          </Link>
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
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Boxes size={18} color="var(--primary-color)" /> Identificação do Produto / Item
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {/* Nome */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Nome do Item / Produto: *
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
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
                }}
              />
            </div>

            {/* Código / SKU */}
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
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
                }}
              />
            </div>

            {/* Categoria */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Categoria: *
              </label>
              <select
                name="categoria"
                required
                value={formData.categoria}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  cursor: "pointer"
                }}
              >
                <option value="Químicos / Inseticidas">Químicos / Inseticidas</option>
                <option value="Raticidas">Raticidas</option>
                <option value="Equipamentos / Máquinas">Equipamentos / Máquinas</option>
                <option value="EPIs">EPIs (Equipamentos de Proteção)</option>
                <option value="Acessórios e Armadilhas">Acessórios e Armadilhas</option>
                <option value="Produtos de Limpeza">Produtos de Limpeza</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            {/* Unidade de Medida */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Unidade de Medida: *
              </label>
              <select
                name="unidade"
                required
                value={formData.unidade}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  cursor: "pointer"
                }}
              >
                <option value="L">Litros (L)</option>
                <option value="mL">Mililitros (mL)</option>
                <option value="KG">Quilogramas (KG)</option>
                <option value="G">Gramas (G)</option>
                <option value="UN">Unidade (UN)</option>
                <option value="CX">Caixa (CX)</option>
                <option value="GL">Galão (GL)</option>
                <option value="PCT">Pacote (PCT)</option>
              </select>
            </div>

            {/* Localização / Almoxarifado */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Localização / Armazenamento:
              </label>
              <input
                type="text"
                name="localizacao"
                value={formData.localizacao}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD 2: ESTOQUE E VALORES */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <DollarSign size={18} color="var(--primary-color)" /> Saldos & Valores Financeiros
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {/* Saldo Atual (Apenas Leitura aqui, movimentações são feitas por lançamentos rastreados) */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Saldo Atual em Estoque:
              </label>
              <div style={{ padding: "10px 14px", backgroundColor: "#f1f5f9", borderRadius: "6px", fontSize: "15px", fontWeight: 700, color: "#0284c7" }}>
                {item.quantidadeAtual} {item.unidade}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Para alterar o saldo, lance uma Entrada ou Saída.</span>
            </div>

            {/* Quantidade Mínima */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Estoque Mínimo (Alerta): *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                name="quantidadeMinima"
                value={formData.quantidadeMinima}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  fontWeight: 600,
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
                }}
              />
            </div>

            {/* Preço de Custo */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Preço de Custo (R$):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="precoCusto"
                value={formData.precoCusto}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
                }}
              />
            </div>

            {/* Preço de Venda / Comodato */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Preço de Venda / Comodato (R$):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="precoVenda"
                value={formData.precoVenda}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
                }}
              />
            </div>

            {/* Fornecedor */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Fornecedor Principal:
              </label>
              <input
                type="text"
                name="fornecedor"
                value={formData.fornecedor}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD 3: DADOS TÉCNICOS & SANITÁRIOS */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FlaskConical size={18} color="var(--primary-color)" /> Dados Técnicos, Lote & Validade
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
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
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
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
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Registro MS / ANVISA:
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
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Número do Lote:
              </label>
              <input
                type="text"
                name="lote"
                value={formData.lote}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Data de Validade:
              </label>
              <input
                type="date"
                name="dataValidade"
                value={formData.dataValidade}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD 4: OBSERVAÇÕES */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={18} color="var(--primary-color)" /> Observações e Instruções
          </h2>

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
              backgroundColor: "#ffffff",
              color: "#0f172a",
              resize: "vertical"
            }}
          />
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginBottom: "32px" }}>
          <Link
            href="/estoque"
            className="btn btn-secondary"
            style={{
              padding: "11px 20px",
              fontSize: "14px",
              fontWeight: 500,
              borderRadius: "8px",
              textDecoration: "none"
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
              padding: "11px 24px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(2, 132, 199, 0.2)"
            }}
          >
            <Save size={18} /> {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>

      {/* CARD 5: HISTÓRICO DE MOVIMENTAÇÕES DO ITEM */}
      {item.movements && item.movements.length > 0 && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <History size={18} color="var(--primary-color)" /> Histórico Recente de Movimentações ({item.movements.length})
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600, textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Data / Hora</th>
                  <th style={{ padding: "10px 12px" }}>Tipo</th>
                  <th style={{ padding: "10px 12px" }}>Qtd. Movimentada</th>
                  <th style={{ padding: "10px 12px" }}>Saldo Resultante</th>
                  <th style={{ padding: "10px 12px" }}>Motivo / Referência</th>
                  <th style={{ padding: "10px 12px" }}>Origem / Destino</th>
                  <th style={{ padding: "10px 12px" }}>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {item.movements.map(m => {
                  const isEntrada = m.tipo === "ENTRADA";
                  return (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>
                        {new Date(m.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor: isEntrada ? "#d1fae5" : "#fee2e2",
                          color: isEntrada ? "#065f46" : "#991b1b"
                        }}>
                          {isEntrada ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {m.tipo}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: isEntrada ? "#059669" : "#dc2626" }}>
                        {isEntrada ? `+${m.quantidade}` : `-${m.quantidade}`} {item.unidade}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>
                        {m.saldoApos} {item.unidade}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#334155" }}>
                        {m.motivo || "-"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>
                        {m.origemDestino || "-"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>
                        {m.responsavel || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
