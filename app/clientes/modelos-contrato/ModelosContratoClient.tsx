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
  Search, 
  CheckCircle2, 
  X,
  ExternalLink,
  Users,
  ShieldCheck,
  Calendar,
  Sparkles,
  Layers,
  Wrench,
  FileCheck
} from "lucide-react";
import VariablesModal from "./VariablesModal";
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

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Controle de Pragas":
        return { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.3)" };
      case "Manutenção Mensal":
        return { bg: "rgba(14, 165, 233, 0.15)", text: "#38bdf8", border: "rgba(14, 165, 233, 0.3)" };
      case "Garantia / Certificado":
        return { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" };
      case "Ordem de Serviço":
        return { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc", border: "rgba(168, 85, 247, 0.3)" };
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", text: "#cbd5e1", border: "rgba(148, 163, 184, 0.3)" };
    }
  };

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "Recente";
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Tabs Bar */}
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
            <Code2 size={16} color="#c084fc" /> Ver Variáveis do Sistema
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

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total de Modelos</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>{templates.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} color="#34d399" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Modelo Principal / Padrão</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
              {templates.find(t => t.isDefault)?.title || "Nenhum definido"}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={20} color="#c084fc" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Categorias Ativas</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
              {Array.from(new Set(templates.map(t => t.category))).length}
            </div>
          </div>
        </div>
      </div>

      {/* Header Info & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '22px' }}>Modelos de Contrato Cadastrados</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Gerencie os modelos de minutas, termos de garantia e ordens de serviço. Clique em "Visualizar" para abrir em PDF/HTML.
          </p>
        </div>

        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '10px',
          padding: '0 12px',
          height: '40px',
          width: '320px'
        }}>
          <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar modelo por título ou descrição..."
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
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px', fontWeight: 600 }}>
          Filtrar por:
        </span>
        {categories.map(cat => {
          const isSelected = selectedCategory === cat;
          const count = cat === "TODAS" ? templates.length : templates.filter(t => t.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isSelected ? 'var(--primary-color)' : 'var(--glass-border)',
                background: isSelected ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))' : 'rgba(255, 255, 255, 0.03)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{cat}</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: isSelected ? 'var(--primary-color)' : 'rgba(255,255,255,0.06)',
                color: '#fff'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Template Cards List - Clean & Professional (NO HTML PREVIEWS) */}
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
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              {searchTerm ? "Nenhum resultado corresponde à sua pesquisa." : "Cadastre seu primeiro modelo para começar a gerar contratos."}
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '20px'
        }}>
          {filteredTemplates.map((template) => {
            const catColors = getCategoryColor(template.category);
            return (
              <div
                key={template.id}
                className="glass-panel"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* Card Header: Category & Default badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      background: catColors.bg,
                      color: catColors.text,
                      border: `1px solid ${catColors.border}`
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
                        background: 'rgba(74, 222, 128, 0.12)',
                        border: '1px solid rgba(74, 222, 128, 0.35)',
                        padding: '3px 10px',
                        borderRadius: '6px'
                      }}>
                        <CheckCircle2 size={12} /> Padrão do Sistema
                      </span>
                    )}
                  </div>

                  {/* Card Title */}
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    margin: '0 0 10px 0',
                    lineHeight: '1.4'
                  }}>
                    {template.title}
                  </h3>

                  {/* Card Description */}
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    margin: '0 0 14px 0',
                    lineHeight: '1.5',
                    minHeight: '40px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {template.description || "Modelo padrão sem descrição detalhada cadastrada."}
                  </p>

                  {/* Card Metadata Pill */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.04)'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} /> Atualizado: {formatDate(template.updatedAt)}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c084fc' }}>
                      <Sparkles size={12} /> Tags Dinâmicas
                    </span>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '14px'
                }}>
                  {/* Botão de Visualização Online / PDF */}
                  <a
                    href={`/clientes/modelos-contrato/preview/${template.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '7px 12px',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    title="Abrir pré-visualização completa em nova aba"
                  >
                    <Eye size={14} /> Visualizar (PDF/HTML) <ExternalLink size={12} />
                  </a>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(template)}
                      title="Duplicar este Modelo"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)',
                        padding: '7px 9px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Copy size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(template)}
                      disabled={isDeletingId === template.id}
                      title="Excluir este Modelo"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        padding: '7px 9px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
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
            );
          })}
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
