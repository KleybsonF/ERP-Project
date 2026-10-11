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
  
  const [isVariablesModalOpen, setIsVariablesModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  const categories = ["TODAS", "Controle de Pragas", "Manutenção Mensal", "Garantia / Certificado", "Ordem de Serviço", "Geral"];

  const filteredTemplates = templates.filter(t => {
    const matchCategory = selectedCategory === "TODAS" || t.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      t.title.toLowerCase().includes(term) ||
      (t.description || "").toLowerCase().includes(term);
    return matchCategory && matchSearch;
  });

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

          <Link
            href="/clientes/modelos-contrato/novo"
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <Plus size={18} /> Novo Modelo de Contrato
          </Link>
        </div>
      </div>

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '24px' }}>Modelos de Contrato</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0 0', fontSize: '14px' }}>
            Crie e personalize minutas de contratos e certificados técnicos com o editor padrão SGP e visualização online / PDF.
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
              type="button" 
              onClick={() => setSearchTerm("")}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginRight: '4px' }}>
          Categorias:
        </span>
        {categories.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isSelected ? 'var(--primary-color)' : 'var(--glass-border)',
                background: isSelected ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))' : 'rgba(255, 255, 255, 0.03)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '60px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={32} color="#818cf8" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
              Nenhum modelo de contrato encontrado
            </h3>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              {searchTerm ? "Tente alterar os termos da busca ou selecione outra categoria." : "Crie seu primeiro modelo de contrato personalizado."}
            </p>
          </div>
          <Link
            href="/clientes/modelos-contrato/novo"
            className="btn-primary"
            style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              padding: '10px 20px',
              textDecoration: 'none'
            }}
          >
            <Plus size={16} /> Criar Novo Modelo
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="glass-panel"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                position: 'relative'
              }}
            >
              <div>
                {/* Card Top: Category and Default Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}>
                    {template.category}
                  </span>

                  {template.isDefault && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#4ade80',
                      background: 'rgba(74, 222, 128, 0.1)',
                      border: '1px solid rgba(74, 222, 128, 0.3)',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      <CheckCircle2 size={12} /> Padrão
                    </span>
                  )}
                </div>

                {/* Card Title */}
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  margin: '0 0 8px 0',
                  lineHeight: '1.4'
                }}>
                  {template.title}
                </h3>

                {/* Card Description */}
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  margin: '0 0 16px 0',
                  lineHeight: '1.5',
                  minHeight: '38px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {template.description || "Sem descrição informada."}
                </p>

                {/* Mini Preview Box: Clicar abre em nova aba */}
                <a
                  href={`/clientes/modelos-contrato/preview/${template.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    height: '110px',
                    background: '#ffffff',
                    color: '#334155',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    overflow: 'hidden',
                    fontSize: '10px',
                    lineHeight: '1.4',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                    position: 'relative',
                    marginBottom: '18px',
                    cursor: 'pointer'
                  }}
                  title="Abrir pré-visualização completa em nova aba"
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
                      <ExternalLink size={12} /> Abrir em Nova Aba
                    </span>
                  </div>
                </a>
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
                <a
                  href={`/clientes/modelos-contrato/preview/${template.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '6px 8px',
                    borderRadius: '6px'
                  }}
                >
                  <Eye size={14} /> Prévia (PDF/HTML)
                </a>

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

                  <Link
                    href={`/clientes/modelos-contrato/editar/${template.id}`}
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
                      textDecoration: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Edit3 size={14} /> Editar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Variables Dictionary Modal */}
      <VariablesModal
        isOpen={isVariablesModalOpen}
        onClose={() => setIsVariablesModalOpen(false)}
      />
    </div>
  );
}
