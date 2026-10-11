"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X, 
  Save, 
  Code2, 
  Eye, 
  Edit3, 
  Sparkles, 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  FileCode,
  FileText,
  RotateCcw,
  Check,
  AlertCircle
} from "lucide-react";
import VariablesModal from "./VariablesModal";
import { replaceContractVariables } from "./contractVariables";
import { createContractTemplate, updateContractTemplate } from "@/app/actions/contratos";

interface ContractEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  templateToEdit?: {
    id: number;
    title: string;
    description: string | null;
    category: string;
    content: string;
    isDefault: boolean;
  } | null;
}

export default function ContractEditorModal({
  isOpen,
  onClose,
  onSaved,
  templateToEdit
}: ContractEditorModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Controle de Pragas");
  const [isDefault, setIsDefault] = useState(false);
  const [content, setContent] = useState("");
  
  // Tabs do editor: 'visual' | 'html' | 'preview'
  const [activeTab, setActiveTab] = useState<"visual" | "html" | "preview">("visual");
  const [isVariablesModalOpen, setIsVariablesModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const visualEditorRef = useRef<HTMLDivElement>(null);
  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (templateToEdit) {
      setTitle(templateToEdit.title);
      setDescription(templateToEdit.description || "");
      setCategory(templateToEdit.category || "Geral");
      setIsDefault(templateToEdit.isDefault);
      setContent(templateToEdit.content);
    } else {
      setTitle("");
      setDescription("");
      setCategory("Controle de Pragas");
      setIsDefault(false);
      setContent(`<div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 24px;">
  <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
    <h1 style="font-size: 20px; text-transform: uppercase; margin: 0; color: #0f172a;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
  </div>
  <p>Pelo presente instrumento, de um lado <strong>{{empresa.razao_social}}</strong> (CNPJ {{empresa.cnpj}}) e de outro <strong>{{cliente.nome}}</strong> (Doc: {{cliente.documento}})...</p>
  <p>Local de Execução: {{local.endereco_completo}}</p>
  <p>Valor acordado: <strong>{{servico.valor}}</strong> ({{servico.valor_extenso}})</p>
  <div style="margin-top: 40px; text-align: center;">
    <p>{{data.cidade_data}}</p>
  </div>
</div>`);
    }
    setActiveTab("visual");
    setErrorMessage(null);
  }, [templateToEdit, isOpen]);

  // Sincronizar o visualEditor quando mudar o content
  useEffect(() => {
    if (activeTab === "visual" && visualEditorRef.current) {
      if (visualEditorRef.current.innerHTML !== content) {
        visualEditorRef.current.innerHTML = content;
      }
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      setContent(visualEditorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (visualEditorRef.current) {
      setContent(visualEditorRef.current.innerHTML);
    }
  };

  const handleInsertTag = (tag: string) => {
    if (activeTab === "visual") {
      // Inserir no editor visual
      if (visualEditorRef.current) {
        visualEditorRef.current.focus();
        document.execCommand("insertText", false, tag);
        setContent(visualEditorRef.current.innerHTML);
      }
    } else {
      // Inserir no textarea HTML
      if (htmlTextareaRef.current) {
        const textarea = htmlTextareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.substring(0, start) + tag + content.substring(end);
        setContent(newContent);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + tag.length, start + tag.length);
        }, 50);
      } else {
        setContent(prev => prev + tag);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Por favor, informe o título do modelo.");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("O conteúdo do modelo não pode estar vazio.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (templateToEdit) {
        await updateContractTemplate(templateToEdit.id, {
          title,
          description,
          category,
          content,
          isDefault
        });
      } else {
        await createContractTemplate({
          title,
          description,
          category,
          content,
          isDefault
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar modelo de contrato.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.88)',
          backdropFilter: 'blur(8px)',
          zIndex: 9000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        <div 
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '1200px',
            height: '94vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} className="text-primary" />
                {templateToEdit ? `Editar Modelo: ${templateToEdit.title}` : "Novo Modelo de Contrato"}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Edite manualmente no editor visual ou altere o código HTML diretamente. Use as variáveis para preenchimento dinâmico.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsVariablesModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#c084fc',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Code2 size={16} /> Variáveis do Sistema
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Form Top Section: Metadados do Modelo */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(0, 0, 0, 0.15)',
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr auto',
            gap: '16px',
            alignItems: 'center'
          }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Título do Modelo *
              </label>
              <input 
                type="text"
                placeholder="Ex: Contrato de Desinsetização Residencial"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-color-soft)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-color-soft)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="Controle de Pragas">Controle de Pragas</option>
                <option value="Manutenção Mensal">Manutenção Mensal</option>
                <option value="Garantia / Certificado">Garantia / Certificado</option>
                <option value="Desratização / Descupinização">Desratização / Descupinização</option>
                <option value="Comercial / Condomínio">Comercial / Condomínio</option>
                <option value="Geral">Geral</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Descrição Breve
              </label>
              <input 
                type="text"
                placeholder="Ex: Para atendimento avulso..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-color-soft)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ paddingTop: '18px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)' }}>
                <input 
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                />
                <span style={{ fontWeight: 600 }}>Modelo Padrão</span>
              </label>
            </div>
          </div>

          {/* Mode Switch Tabs & Toolbar */}
          <div style={{
            padding: '10px 24px',
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* View Mode Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "html" && visualEditorRef.current) {
                    visualEditorRef.current.innerHTML = content;
                  }
                  setActiveTab("visual");
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === "visual" ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === "visual" ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Edit3 size={15} /> Editor Visual (Manual)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeTab === "visual" && visualEditorRef.current) {
                    setContent(visualEditorRef.current.innerHTML);
                  }
                  setActiveTab("html");
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === "html" ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === "html" ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <FileCode size={15} /> Código HTML
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeTab === "visual" && visualEditorRef.current) {
                    setContent(visualEditorRef.current.innerHTML);
                  }
                  setActiveTab("preview");
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === "preview" ? '#059669' : 'transparent',
                  color: activeTab === "preview" ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Eye size={15} /> Pré-visualizar (A4 com dados de teste)
              </button>
            </div>

            {/* Visual Formatting Toolbar (Active only in visual mode) */}
            {activeTab === "visual" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => executeCommand('bold')} title="Negrito" style={toolbarBtnStyle}><Bold size={15} /></button>
                <button type="button" onClick={() => executeCommand('italic')} title="Itálico" style={toolbarBtnStyle}><Italic size={15} /></button>
                <button type="button" onClick={() => executeCommand('underline')} title="Sublinhado" style={toolbarBtnStyle}><Underline size={15} /></button>
                <span style={{ width: '1px', height: '18px', background: 'var(--glass-border)', margin: '0 4px' }} />
                <button type="button" onClick={() => executeCommand('formatBlock', '<h1>')} title="Título H1" style={toolbarBtnStyle}><Heading1 size={15} /></button>
                <button type="button" onClick={() => executeCommand('formatBlock', '<h2>')} title="Título H2" style={toolbarBtnStyle}><Heading2 size={15} /></button>
                <span style={{ width: '1px', height: '18px', background: 'var(--glass-border)', margin: '0 4px' }} />
                <button type="button" onClick={() => executeCommand('insertUnorderedList')} title="Lista" style={toolbarBtnStyle}><List size={15} /></button>
                <button type="button" onClick={() => executeCommand('insertOrderedList')} title="Lista Numerada" style={toolbarBtnStyle}><ListOrdered size={15} /></button>
                <span style={{ width: '1px', height: '18px', background: 'var(--glass-border)', margin: '0 4px' }} />
                <button type="button" onClick={() => executeCommand('justifyLeft')} title="Alinhar à Esquerda" style={toolbarBtnStyle}><AlignLeft size={15} /></button>
                <button type="button" onClick={() => executeCommand('justifyCenter')} title="Centralizar" style={toolbarBtnStyle}><AlignCenter size={15} /></button>
                <button type="button" onClick={() => executeCommand('justifyRight')} title="Alinhar à Direita" style={toolbarBtnStyle}><AlignRight size={15} /></button>
                <button type="button" onClick={() => executeCommand('justifyFull')} title="Justificar" style={toolbarBtnStyle}><AlignJustify size={15} /></button>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div style={{
              margin: '12px 24px 0 24px',
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          {/* Main Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'rgba(0, 0, 0, 0.25)' }}>
            {/* 1. VISUAL EDITOR */}
            {activeTab === "visual" && (
              <div 
                style={{
                  maxWidth: '850px',
                  margin: '0 auto',
                  minHeight: '600px',
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: '10px',
                  padding: '48px 56px',
                  boxShadow: '0 10px 35px rgba(0, 0, 0, 0.4)',
                  outline: 'none',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}
                ref={visualEditorRef}
                contentEditable
                onInput={handleVisualInput}
                suppressContentEditableWarning
              />
            )}

            {/* 2. HTML SOURCE CODE EDITOR */}
            {activeTab === "html" && (
              <div style={{ maxWidth: '1000px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <textarea
                  ref={htmlTextareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Insira o código HTML do contrato aqui..."
                  style={{
                    width: '100%',
                    minHeight: '550px',
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    padding: '20px',
                    background: '#090d16',
                    color: '#e2e8f0',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}

            {/* 3. PREVIEW MODE (Simulating realistic printed A4 sheet) */}
            {activeTab === "preview" && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  padding: '8px 18px',
                  borderRadius: '99px',
                  background: 'rgba(5, 150, 105, 0.15)',
                  border: '1px solid rgba(5, 150, 105, 0.3)',
                  color: '#34d399',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Sparkles size={14} /> Pré-visualização com dados reais de teste preenchidos
                </div>

                <div 
                  style={{
                    width: '100%',
                    maxWidth: '850px',
                    minHeight: '800px',
                    background: '#ffffff',
                    color: '#0f172a',
                    borderRadius: '8px',
                    padding: '54px 64px',
                    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5)',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: replaceContractVariables(content)
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 700
              }}
            >
              <Save size={16} />
              {isSaving ? "Salvando Modelo..." : (templateToEdit ? "Salvar Alterações" : "Criar Modelo de Contrato")}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Variáveis */}
      <VariablesModal
        isOpen={isVariablesModalOpen}
        onClose={() => setIsVariablesModalOpen(false)}
        onInsertTag={handleInsertTag}
      />
    </>
  );
}

const toolbarBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  color: 'var(--text-main)',
  borderRadius: '6px',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};
