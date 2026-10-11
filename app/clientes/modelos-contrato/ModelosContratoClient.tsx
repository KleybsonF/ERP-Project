"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Plus, 
  Code2, 
  Edit3, 
  Copy, 
  Trash2, 
  Eye, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Layers, 
  X,
  ExternalLink,
  Users
} from "lucide-react";
import ContractEditorModal from "./ContractEditorModal";
import VariablesModal from "./VariablesModal";
import { replaceContractVariables } from "./contractVariables";
import { deleteContractTemplate, duplicateContractTemplate } from "@/app/actions/contratos";

type TemplateItem = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  content: string;
  isDefault: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export default function ModelosContratoClient({
  initialTemplates
}: {
  initialTemplates: TemplateItem[];
}) {
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
  
  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<TemplateItem | null>(null);
  const [isVariablesModalOpen, setIsVariablesModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  const categories = ["TODAS", "Controle de Pragas", "Manutenção Mensal", "Garantia / Certificado", "Geral"];

  const filteredTemplates = templates.filter(t => {
    const matchCategory = selectedCategory === "TODAS" || t.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      t.title.toLowerCase().includes(term) ||
      (t.description || "").toLowerCase().includes(term);
    return matchCategory && matchSearch;
  });

  const handleOpenNew = () => {
    setTemplateToEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (template: TemplateItem) => {
    setTemplateToEdit(template);
    setIsEditorOpen(true);
  };

  const handleDelete = async (template: TemplateItem) => {
    if (confirm(`Tem certeza que deseja excluir o modelo "${template.title}"?`)) {
      setIsDeletingId(template.id);
      try {
        await deleteContractTemplate(template.id);
        setTemplates(prev => prev.filter(t => t.id !== template.id));
      } catch (err: any) {
        alert(err.message || "Erro ao excluir modelo.");
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  const handleDuplicate = async (template: TemplateItem) => {
    try {
      const clone = await duplicateContractTemplate(template.id);
      setTemplates(prev => [clone, ...prev]);
    } catch (err: any) {
      alert(err.message || "Erro ao duplicar modelo.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Tabs Bar: Navegação de Clientes */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--glass-border)',
        paddingBottom: '16px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/clientes"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--glass-border)',
              transition: 'all 0.2s ease'
            }}
          >
            <Users size={16} /> Lista de Clientes
          </Link>

          <Link
            href="/clientes/modelos-contrato"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.15)'
            }}
          >
            <FileText size={16} /> Modelos de Contrato
          </Link>

          <Link
            href="/clientes/novo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--glass-border)',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={16} /> Cadastrar Cliente
          </Link>
        </div>

        {/* Action Buttons Top Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsVariablesModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Code2 size={16} color="#c084fc" /> Ver Variáveis
          </button>

          <button
            type="button"
            onClick={handleOpenNew}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            <Plus size={18} /> Novo Modelo de Contrato
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '24px' }}>Modelos de Contrato</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0 0', fontSize: '14px' }}>
            Crie e personalize minutas de contratos e certificados técnicos com preenchimento automático das informações dos clientes.
          </p>
        </div>

        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          padding: '0 14px',
          height: '42px',
          width: '320px'
        }}>
          <Search size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar modelo por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0 10px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '13px'
            }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '7px 16px',
              borderRadius: '99px',
              fontSize: '13px',
              fontWeight: 600,
              border: selectedCategory === cat ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)',
              background: selectedCategory === cat ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'rgba(255,255,255,0.02)',
              color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '18px' }}>Nenhum modelo de contrato encontrado</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px' }}>
            {searchTerm ? `Nenhum resultado corresponde à busca "${searchTerm}".` : "Comece criando o seu primeiro modelo personalizado."}
          </p>
          <button type="button" onClick={handleOpenNew} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Adicionar Novo Modelo
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                borderRadius: '16px',
                border: template.isDefault ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--glass-border)',
                background: template.isDefault ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(0,0,0,0.2))' : 'var(--glass-bg)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {/* Card Top */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                      {template.category}
                    </span>
                    {template.isDefault && (
                      <span className="badge badge-success" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Padrão
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    #{template.id}
                  </span>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  {template.title}
                </h3>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  {template.description || "Modelo padrão sem descrição detalhada cadastrada."}
                </p>

                {/* Mini Preview Box */}
                <div 
                  onClick={() => setPreviewTemplate(template)}
                  style={{
                    height: '110px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#0f172a',
                    padding: '12px 14px',
                    overflow: 'hidden',
                    fontSize: '10px',
                    lineHeight: '1.4',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    position: 'relative',
                    marginBottom: '18px'
                  }}
                  title="Clique para visualizar o modelo em tamanho real"
                >
                  <div 
                    dangerouslySetInnerHTML={{
                      __html: replaceContractVariables(template.content.substring(0, 450))
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40px',
                    background: 'linear-gradient(to bottom, transparent, #ffffff)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    paddingBottom: '4px'
                  }}>
                    <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /> Clique para expandir
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '14px',
                marginTop: '6px'
              }}>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(template)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: '6px'
                  }}
                >
                  <Eye size={14} /> Prévia
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(template)}
                    title="Duplicar Modelo"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-secondary)',
                      padding: '7px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Copy size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(template)}
                    disabled={isDeletingId === template.id}
                    title="Excluir Modelo"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#ef4444',
                      padding: '7px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(template)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-color))',
                      border: 'none',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Edit3 size={14} /> Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Prévia em Tamanho Real */}
      {previewTemplate && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '920px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Prévia: {previewTemplate.title}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Variáveis preenchidas com dados de teste para simulação.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const temp = previewTemplate;
                    setPreviewTemplate(null);
                    handleOpenEdit(temp);
                  }}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
                >
                  <Edit3 size={14} /> Editar este Modelo
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content: Folha A4 Realista */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', background: '#0b0f19', display: 'flex', justifyContent: 'center' }}>
              <div 
                style={{
                  width: '100%',
                  maxWidth: '800px',
                  minHeight: '800px',
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: '6px',
                  padding: '48px 56px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}
                dangerouslySetInnerHTML={{
                  __html: replaceContractVariables(previewTemplate.content)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      <ContractEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaved={async () => {
          // Recarregar os templates locais
          const res = await fetch("/api/contract-templates").catch(() => null);
          window.location.reload();
        }}
        templateToEdit={templateToEdit}
      />

      {/* Variables Dictionary Modal */}
      <VariablesModal
        isOpen={isVariablesModalOpen}
        onClose={() => setIsVariablesModalOpen(false)}
      />
    </div>
  );
}
