"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Package, 
  Save, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  FlaskConical, 
  DollarSign, 
  Boxes, 
  Info,
  FileText 
} from "lucide-react";
import { createStockItem } from "@/app/actions/estoque";

export default function NovoItemClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    categoria: "Químicos / Inseticidas",
    unidade: "L",
    estoqueMinimo: "5",
    precoCustoPadrao: "",
    precoVendaPadrao: "",
    fornecedorPadrao: "",
    principioAtivo: "",
    grupoQuimico: "",
    registroMS: "",
    observacoes: ""
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
      const res = await createStockItem({
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
      setErrorMessage(err.message || "Erro ao cadastrar item no catálogo.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Novo Item</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <Package size={26} color="var(--primary-color)" /> Cadastrar Item no Catálogo
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
              Item pré-estabelecido para seleção nas movimentações (compras, baixas de O.S., comodatos).
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

      {/* AVISO DIDÁTICO */}
      <div style={{
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "13px",
        color: "#1e40af"
      }}>
        <Info size={20} color="#2563eb" style={{ flexShrink: 0 }} />
        <div>
          <strong>Atenção:</strong> O cadastro do item <u>não alimenta quantidade de estoque</u>. Ele serve como pré-cadastro para padronização. Para dar entrada de saldo em armazéns ou viaturas, utilize a aba de <strong>Movimentações (Compra/Entrada)</strong> após criar o item.
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
                placeholder="Ex: K-Othrine 250 SC, Raticida Bloco Parafinado, Pulverizador Costal..."
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
                placeholder="Ex: QUIM-001, EQP-005"
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
                  color: "#0f172a"
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

            {/* Unidade */}
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
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  color: "#0f172a"
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

            {/* Estoque Mínimo */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Estoque Mínimo de Alerta:
              </label>
              <input
                type="number"
                step="0.01"
                name="estoqueMinimo"
                placeholder="Ex: 5"
                value={formData.estoqueMinimo}
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

        {/* CARD 2: DADOS TÉCNICOS & QUÍMICOS */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
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
                placeholder="Ex: Deltametrina 2,5%, Fipronil 0,05%"
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
                placeholder="Ex: Piretroide, Neonicotinoide"
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
                Registro Ministério da Saúde (MS / ANVISA):
              </label>
              <input
                type="text"
                name="registroMS"
                placeholder="Ex: 3.2345.0012"
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
          </div>
        </div>

        {/* CARD 3: PREÇOS & FORNECEDOR */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
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
                placeholder="0,00"
                value={formData.precoCustoPadrao}
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
                Preço de Venda Padrão (R$):
              </label>
              <input
                type="number"
                step="0.01"
                name="precoVendaPadrao"
                placeholder="0,00"
                value={formData.precoVendaPadrao}
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
                Fornecedor Principal:
              </label>
              <input
                type="text"
                name="fornecedorPadrao"
                placeholder="Ex: Bayer, Syngenta, Envu..."
                value={formData.fornecedorPadrao}
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
            <FileText size={18} color="var(--primary-color)" /> Observações Adicionais
          </h2>

          <div>
            <textarea
              name="observacoes"
              rows={3}
              placeholder="Instruções de aplicação, dosagem recomendada, compatibilidade..."
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
        </div>

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
            {isSubmitting ? "Cadastrando Item..." : "Cadastrar no Catálogo"}
          </button>
        </div>
      </form>
    </div>
  );
}
