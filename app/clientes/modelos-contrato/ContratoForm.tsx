"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Printer,
  Code2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  RemoveFormatting,
  List,
  ListOrdered,
  Outdent,
  Indent,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table,
  Minus,
  Maximize2,
  Minimize2,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  FilePlus2,
  Scissors,
  Copy,
  ClipboardPaste,
  HelpCircle
} from "lucide-react";
import VariablesModal from "./VariablesModal";
import { createContractTemplate, updateContractTemplate } from "@/app/actions/contratos";

interface ContratoFormProps {
  initialData?: {
    id: number;
    title: string;
    description: string | null;
    category: string;
    content: string;
    isDefault: boolean;
  };
  mode: "create" | "edit";
}

const CATEGORIES = [
  "Controle de Pragas",
  "Manutenção Mensal",
  "Garantia / Certificado",
  "Ordem de Serviço",
  "Geral"
];

const FONT_FAMILIES = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Verdana", value: "Verdana, sans-serif" }
];

const FONT_SIZES = [
  { label: "10px", value: "1" },
  { label: "12px", value: "2" },
  { label: "14px (Normal)", value: "3" },
  { label: "16px (Médio)", value: "4" },
  { label: "18px (Grande)", value: "5" },
  { label: "24px (Título)", value: "6" },
  { label: "32px (Destaque)", value: "7" }
];

export default function ContratoForm({ initialData, mode }: ContratoFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [category, setCategory] = useState(initialData?.category || "Controle de Pragas");
  const [content, setContent] = useState(initialData?.content || "");
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);

  const [isCodeMode, setIsCodeMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVariablesModalOpen, setIsVariablesModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync initial content to visual editor
  useEffect(() => {
    if (editorRef.current && !isCodeMode) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  // When switching between visual and code mode
  const handleToggleCodeMode = () => {
    if (isCodeMode) {
      // Switching from code to visual: update visual editor DOM
      setIsCodeMode(false);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = content;
        }
      }, 50);
    } else {
      // Switching from visual to code: grab latest innerHTML
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }
      setIsCodeMode(true);
    }
  };

  const handleVisualInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    if (isCodeMode) {
      alert("Para usar as ferramentas de formatação visual, saia do modo 'Código-Fonte'.");
      return;
    }
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(cmd, false, val);
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleInsertTag = (tag: string) => {
    if (isCodeMode) {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const nextVal = before + tag + after;
        setContent(nextVal);
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + tag.length;
        }, 10);
      } else {
        setContent(prev => prev + tag);
      }
    } else {
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand("insertHTML", false, tag);
        setContent(editorRef.current.innerHTML);
      }
    }
  };

  const handleInsertLink = () => {
    const url = prompt("Digite a URL do link (ex: https://seusite.com.br):");
    if (url) execCmd("createLink", url);
  };

  const handleInsertImage = () => {
    const url = prompt("Digite a URL da imagem (ou cole uma imagem em base64):");
    if (url) execCmd("insertImage", url);
  };

  const handleInsertTable = () => {
    const rows = parseInt(prompt("Número de linhas da tabela:", "3") || "3", 10);
    const cols = parseInt(prompt("Número de colunas da tabela:", "2") || "2", 10);
    if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) return;

    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #cbd5e1;">\n`;
    for (let r = 0; r < rows; r++) {
      tableHtml += `  <tr>\n`;
      for (let c = 0; c < cols; c++) {
        if (r === 0) {
          tableHtml += `    <th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; text-align: left; font-weight: bold;">Coluna ${c + 1}</th>\n`;
        } else {
          tableHtml += `    <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Item ${r}-${c + 1}</td>\n`;
        }
      }
      tableHtml += `  </tr>\n`;
    }
    tableHtml += `</table><p><br/></p>`;

    if (isCodeMode) {
      setContent(prev => prev + "\n" + tableHtml);
    } else if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("insertHTML", false, tableHtml);
      setContent(editorRef.current.innerHTML);
    }
  };

  const handlePreview = () => {
    const currentHtml = isCodeMode
      ? content
      : editorRef.current?.innerHTML || content;

    const draftData = {
      title: title || "Modelo de Contrato (Prévia)",
      description: description,
      category: category,
      content: currentHtml,
      isDefault: isDefault
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("preview_contract_draft", JSON.stringify(draftData));
      const targetId = initialData?.id ? initialData.id : "draft";
      window.open(`/clientes/modelos-contrato/preview/${targetId}?draft=true`, "_blank");
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Por favor, preencha o título do modelo de contrato.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const currentHtml = isCodeMode
      ? content
      : editorRef.current?.innerHTML || content;

    if (!currentHtml.trim()) {
      setErrorMessage("O conteúdo do contrato não pode estar em branco.");
      return;
    }

    setIsSaving(true);
    try {
      if (mode === "edit" && initialData?.id) {
        await updateContractTemplate(initialData.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          category: category.trim(),
          content: currentHtml,
          isDefault: isDefault
        });
      } else {
        await createContractTemplate({
          title: title.trim(),
          description: description.trim() || undefined,
          category: category.trim(),
          content: currentHtml,
          isDefault: isDefault
        });
      }

      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/clientes/modelos-contrato");
        router.refresh();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar o modelo de contrato.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        paddingBottom: "80px",
        maxWidth: isFullscreen ? "100%" : "1400px",
        margin: "0 auto",
        width: "100%"
      }}
    >
      {/* Top Header / Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/clientes/modelos-contrato"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s"
            }}
          >
            <ArrowLeft size={16} /> Voltar para Modelos
          </Link>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text-main)",
              margin: 0
            }}
          >
            Contrato - {mode === "edit" ? "Edição Contrato" : "Cadastro Contrato"}
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handlePreview}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 18px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-main)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <Eye size={16} color="#38bdf8" /> Pré-visualizar em Nova Aba
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 24px",
              fontSize: "13px",
              fontWeight: 700
            }}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 size={16} color="#4ade80" /> Salvo com Sucesso!
              </>
            ) : isSaving ? (
              <>Salvando...</>
            ) : (
              <>
                <Save size={16} /> Salvar Modelo
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 18px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "13px"
          }}
        >
          <AlertCircle size={18} /> {errorMessage}
        </div>
      )}

      {/* Main SGP Form Card */}
      <div
        style={{
          background: "#1f2125",
          border: "1px solid #33363d",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)"
        }}
      >
        {/* SGP Sub-header Tab: "Dados do Contrato" */}
        <div
          style={{
            padding: "12px 20px",
            background: "#26282e",
            borderBottom: "1px solid #33363d",
            fontSize: "13px",
            fontWeight: 700,
            color: "#e2e8f0",
            letterSpacing: "0.3px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <span>Dados do Contrato</span>
          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 400 }}>
            Editor Padrão SGP
          </span>
        </div>

        {/* Form Body */}
        <div style={{ padding: "24px 24px 32px 24px", display: "flex", flexDirection: "column", gap: "22px" }}>
          
          {/* Campo: Titulo do Modelo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="model-title"
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#f1f5f9",
                letterSpacing: "-0.2px"
              }}
            >
              titulo do modelo
            </label>
            <input
              id="model-title"
              type="text"
              placeholder="Ex: Contrato de Prestação de Serviços de Dedetização e Controle de Pragas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "800px",
                background: "#2a2c31",
                border: "1px solid #3e4147",
                borderRadius: "6px",
                padding: "10px 14px",
                color: "#f8fafc",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>

          {/* Campo: Descrição */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="model-desc"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#cbd5e1"
              }}
            >
              Descrição:
            </label>
            <input
              id="model-desc"
              type="text"
              placeholder="Ex: Minuta completa com cláusulas de garantia, formas de pagamento e responsabilidades sanitárias."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "800px",
                background: "#2a2c31",
                border: "1px solid #3e4147",
                borderRadius: "6px",
                padding: "8px 14px",
                color: "#f8fafc",
                fontSize: "13px",
                outline: "none"
              }}
            />
          </div>

          {/* Campo: Categoria */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="model-category"
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#f1f5f9",
                letterSpacing: "-0.2px"
              }}
            >
              Categoria
            </label>
            <div style={{ display: "flex", gap: "10px", maxWidth: "800px" }}>
              <select
                id="model-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "320px",
                  background: "#2a2c31",
                  border: "1px solid #3e4147",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  color: "#f8fafc",
                  fontSize: "13px",
                  outline: "none"
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo: Contrato (Editor SGP) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#cbd5e1"
                }}
              >
                Contrato:
              </label>

              <button
                type="button"
                onClick={() => setIsVariablesModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))",
                  border: "1px solid rgba(168, 85, 247, 0.5)",
                  color: "#e9d5ff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(168, 85, 247, 0.2)"
                }}
              >
                <Sparkles size={14} color="#c084fc" /> Variáveis do Sistema
              </button>
            </div>

            {/* SGP Classic Toolbar Container */}
            <div
              style={{
                background: "#2a2d32",
                border: "1px solid #3f4249",
                borderRadius: "6px 6px 0 0",
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              {/* Row 1 of SGP Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "4px"
                }}
              >
                {/* Código-Fonte Button */}
                <button
                  type="button"
                  onClick={handleToggleCodeMode}
                  title="Código-Fonte (HTML)"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    background: isCodeMode ? "#3b82f6" : "#383a40",
                    border: "1px solid",
                    borderColor: isCodeMode ? "#60a5fa" : "#4b4d54",
                    color: isCodeMode ? "#ffffff" : "#e2e8f0",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginRight: "4px"
                  }}
                >
                  <Code2 size={14} />
                  <span>Código-Fonte</span>
                </button>

                <div style={{ width: "1px", height: "20px", background: "#4a4c54", margin: "0 4px" }} />

                {/* File actions */}
                <button
                  type="button"
                  onClick={() => handleSave()}
                  title="Salvar Modelo"
                  style={toolbarBtnStyle}
                >
                  <Save size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Deseja limpar todo o texto do contrato?")) {
                      setContent("");
                      if (editorRef.current) editorRef.current.innerHTML = "";
                    }
                  }}
                  title="Novo / Limpar Documento"
                  style={toolbarBtnStyle}
                >
                  <FilePlus2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={handlePreview}
                  title="Imprimir / Visualizar PDF"
                  style={toolbarBtnStyle}
                >
                  <Printer size={14} />
                </button>

                <div style={{ width: "1px", height: "20px", background: "#4a4c54", margin: "0 4px" }} />

                {/* Clipboard */}
                <button
                  type="button"
                  onClick={() => execCmd("cut")}
                  title="Recortar"
                  style={toolbarBtnStyle}
                >
                  <Scissors size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("copy")}
                  title="Copiar"
                  style={toolbarBtnStyle}
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) handleInsertTag(text);
                    } catch {
                      alert("Pressione Ctrl+V dentro do texto para colar.");
                    }
                  }}
                  title="Colar"
                  style={toolbarBtnStyle}
                >
                  <ClipboardPaste size={14} />
                </button>

                <div style={{ width: "1px", height: "20px", background: "#4a4c54", margin: "0 4px" }} />

                {/* Insert elements */}
                <button
                  type="button"
                  onClick={handleInsertLink}
                  title="Inserir Link"
                  style={toolbarBtnStyle}
                >
                  <LinkIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("unlink")}
                  title="Remover Link"
                  style={toolbarBtnStyle}
                >
                  <Unlink size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleInsertImage}
                  title="Inserir Imagem (URL ou Base64)"
                  style={toolbarBtnStyle}
                >
                  <ImageIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleInsertTable}
                  title="Inserir Tabela"
                  style={toolbarBtnStyle}
                >
                  <Table size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("insertHorizontalRule")}
                  title="Inserir Linha Horizontal"
                  style={toolbarBtnStyle}
                >
                  <Minus size={14} />
                </button>

                <div style={{ width: "1px", height: "20px", background: "#4a4c54", margin: "0 4px" }} />

                {/* Maximize */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Restaurar Janela" : "Maximizar"}
                  style={{
                    ...toolbarBtnStyle,
                    marginLeft: "auto",
                    color: isFullscreen ? "#38bdf8" : "#cbd5e1"
                  }}
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>

              {/* Row 2 of SGP Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "4px"
                }}
              >
                {/* Text Formatting */}
                <button
                  type="button"
                  onClick={() => execCmd("bold")}
                  title="Negrito (Ctrl+B)"
                  style={{ ...toolbarBtnStyle, fontWeight: "bold" }}
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("italic")}
                  title="Itálico (Ctrl+I)"
                  style={{ ...toolbarBtnStyle, fontStyle: "italic" }}
                >
                  <Italic size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("underline")}
                  title="Sublinhado (Ctrl+U)"
                  style={toolbarBtnStyle}
                >
                  <Underline size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("strikeThrough")}
                  title="Tachado"
                  style={toolbarBtnStyle}
                >
                  <Strikethrough size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("subscript")}
                  title="Subscrito"
                  style={toolbarBtnStyle}
                >
                  <Subscript size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("superscript")}
                  title="Sobrescrito"
                  style={toolbarBtnStyle}
                >
                  <Superscript size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("removeFormat")}
                  title="Limpar Formatação"
                  style={toolbarBtnStyle}
                >
                  <RemoveFormatting size={14} />
                </button>

                <div style={{ width: "1px", height: "20px", background: "#4a4c54", margin: "0 4px" }} />

                {/* Lists & Indentation */}
                <button
                  type="button"
                  onClick={() => execCmd("insertOrderedList")}
                  title="Lista Numerada"
                  style={toolbarBtnStyle}
                >
                  <ListOrdered size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("insertUnorderedList")}
                  title="Lista com Marcadores"
                  style={toolbarBtnStyle}
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("outdent")}
                  title="Diminuir Recuo"
                  style={toolbarBtnStyle}
                >
                  <Outdent size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("indent")}
                  title="Aumentar Recuo"
                  style={toolbarBtnStyle}
                >
                  <Indent size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("formatBlock", "<blockquote>")}
                  title="Citação"
                  style={toolbarBtnStyle}
                >
                  <Quote size={14} />
                </button>

                <div style={{ width: "1px", height: "20px", background: "#4a4c54", margin: "0 4px" }} />

                {/* Alignment */}
                <button
                  type="button"
                  onClick={() => execCmd("justifyLeft")}
                  title="Alinhar à Esquerda"
                  style={toolbarBtnStyle}
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("justifyCenter")}
                  title="Centralizar"
                  style={toolbarBtnStyle}
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("justifyRight")}
                  title="Alinhar à Direita"
                  style={toolbarBtnStyle}
                >
                  <AlignRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("justifyFull")}
                  title="Justificar"
                  style={toolbarBtnStyle}
                >
                  <AlignJustify size={14} />
                </button>

                <div style={{ width: "1px", height: "20px", background: "#4a4c54", margin: "0 4px" }} />

                {/* Styles / Format Dropdown */}
                <select
                  onChange={(e) => {
                    const tag = e.target.value;
                    if (tag) execCmd("formatBlock", `<${tag}>`);
                  }}
                  defaultValue=""
                  title="Formatação de Cabeçalho / Parágrafo"
                  style={toolbarSelectStyle}
                >
                  <option value="" disabled>
                    Formata...
                  </option>
                  <option value="p">Normal (Parágrafo)</option>
                  <option value="h1">Título 1 (H1)</option>
                  <option value="h2">Título 2 (H2)</option>
                  <option value="h3">Título 3 (H3)</option>
                  <option value="h4">Título 4 (H4)</option>
                </select>

                {/* Font Family Dropdown */}
                <select
                  onChange={(e) => {
                    const font = e.target.value;
                    if (font) execCmd("fontName", font);
                  }}
                  defaultValue=""
                  title="Fonte"
                  style={toolbarSelectStyle}
                >
                  <option value="" disabled>
                    Fonte
                  </option>
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>

                {/* Font Size Dropdown */}
                <select
                  onChange={(e) => {
                    const sz = e.target.value;
                    if (sz) execCmd("fontSize", sz);
                  }}
                  defaultValue=""
                  title="Tamanho do Texto"
                  style={{ ...toolbarSelectStyle, width: "90px" }}
                >
                  <option value="" disabled>
                    Tamanho
                  </option>
                  {FONT_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <div style={{ width: "1px", height: "20px", background: "#4a4c54", margin: "0 4px" }} />

                {/* Text Color Picker */}
                <label
                  title="Cor do Texto"
                  style={{
                    ...toolbarBtnStyle,
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer"
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#f87171" }}>A</span>
                  <input
                    type="color"
                    onChange={(e) => execCmd("foreColor", e.target.value)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      left: 0,
                      top: 0,
                      width: "100%",
                      height: "100%",
                      cursor: "pointer"
                    }}
                  />
                </label>

                {/* Background Highlight Picker */}
                <label
                  title="Cor de Fundo / Destaque"
                  style={{
                    ...toolbarBtnStyle,
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer"
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "11px", background: "#fef08a", color: "#000", padding: "1px 3px", borderRadius: "2px" }}>
                    ab
                  </span>
                  <input
                    type="color"
                    defaultValue="#ffff00"
                    onChange={(e) => execCmd("hiliteColor", e.target.value)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      left: 0,
                      top: 0,
                      width: "100%",
                      height: "100%",
                      cursor: "pointer"
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Editable Canvas (White Background identical to SGP) */}
            {isCodeMode ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Cole ou digite aqui o código HTML do seu modelo de contrato..."
                style={{
                  width: "100%",
                  minHeight: "650px",
                  background: "#18191c",
                  color: "#38bdf8",
                  fontFamily: "'Consolas', 'Courier New', monospace",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  padding: "20px",
                  border: "1px solid #3f4249",
                  borderTop: "none",
                  borderRadius: "0 0 6px 6px",
                  outline: "none",
                  resize: "vertical"
                }}
              />
            ) : (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleVisualInput}
                style={{
                  width: "100%",
                  minHeight: "650px",
                  background: "#ffffff",
                  color: "#1e293b",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  padding: "40px",
                  border: "1px solid #d1d5db",
                  borderTop: "none",
                  borderRadius: "0 0 6px 6px",
                  outline: "none",
                  overflowY: "auto",
                  boxShadow: "inset 0 2px 6px rgba(0, 0, 0, 0.05)"
                }}
              />
            )}
          </div>

          {/* Model Options */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              background: "#26282e",
              border: "1px solid #33363d",
              borderRadius: "6px",
              marginTop: "8px"
            }}
          >
            <input
              type="checkbox"
              id="isDefaultTemplate"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label
              htmlFor="isDefaultTemplate"
              style={{
                fontSize: "13px",
                color: "#e2e8f0",
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Definir este modelo como padrão do sistema (marcado automaticamente ao gerar novos contratos)
            </label>
          </div>

          {/* Bottom Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #33363d",
              paddingTop: "20px",
              marginTop: "10px"
            }}
          >
            <Link
              href="/clientes/modelos-contrato"
              style={{
                padding: "10px 20px",
                borderRadius: "6px",
                background: "transparent",
                border: "1px solid #475569",
                color: "#94a3b8",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s"
              }}
            >
              Cancelar
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={handlePreview}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  background: "#2b2d33",
                  border: "1px solid #475569",
                  color: "#f1f5f9",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                <Eye size={16} color="#38bdf8" /> Pré-visualizar em Nova Aba
              </button>

              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving}
                className="btn-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 26px",
                  fontSize: "13px",
                  fontWeight: 700,
                  borderRadius: "6px"
                }}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 size={16} color="#4ade80" /> Salvo com Sucesso!
                  </>
                ) : isSaving ? (
                  <>Salvando...</>
                ) : (
                  <>
                    <Save size={16} /> Salvar Modelo de Contrato
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variables Modal */}
      <VariablesModal
        isOpen={isVariablesModalOpen}
        onClose={() => setIsVariablesModalOpen(false)}
        onInsertTag={handleInsertTag}
      />
    </div>
  );
}

const toolbarBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: "4px",
  background: "#383a40",
  border: "1px solid #4b4d54",
  color: "#cbd5e1",
  cursor: "pointer",
  transition: "all 0.15s ease",
  padding: 0
};

const toolbarSelectStyle: React.CSSProperties = {
  height: "28px",
  background: "#383a40",
  border: "1px solid #4b4d54",
  borderRadius: "4px",
  color: "#e2e8f0",
  fontSize: "12px",
  padding: "0 6px",
  outline: "none",
  cursor: "pointer"
};
