"use client";

import { useState } from "react";
import { 
  X, 
  Search, 
  Copy, 
  Check, 
  PlusCircle, 
  Code2, 
  Sparkles,
  Layers,
  FileText
} from "lucide-react";
import { CONTRACT_VARIABLES, ContractVariable } from "./contractVariables";

interface VariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTag?: (tag: string) => void;
}

export default function VariablesModal({ isOpen, onClose, onInsertTag }: VariablesModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ["TODAS", "Dados do Cliente", "Local e Endereço", "Serviço e Valores", "Sua Empresa", "Datas e Prazos"];

  const filteredVariables = CONTRACT_VARIABLES.filter(v => {
    const matchCategory = selectedCategory === "TODAS" || v.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      v.tag.toLowerCase().includes(term) ||
      v.label.toLowerCase().includes(term) ||
      v.description.toLowerCase().includes(term) ||
      v.sample.toLowerCase().includes(term);

    return matchCategory && matchSearch;
  });

  const handleCopy = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleInsert = (tag: string) => {
    if (onInsertTag) {
      onInsertTag(tag);
      onClose();
    } else {
      navigator.clipboard.writeText(tag);
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 2000);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)'
            }}>
              <Code2 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Variáveis Dinâmicas do Sistema
                <span className="badge badge-info" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  {CONTRACT_VARIABLES.length} disponíveis
                </span>
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Estas tags são preenchidas automaticamente com os dados reais ao gerar o contrato de cada cliente.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Busca e Categorias */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(0,0,0,0.1)' }}>
          {/* Campo de Busca */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-color-soft)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '0 14px',
            height: '42px'
          }}>
            <Search size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input 
              type="text"
              placeholder="Buscar por tag, nome do campo ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0 10px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '14px'
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

          {/* Categorias Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '99px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: selectedCategory === cat ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)',
                  background: selectedCategory === cat ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'rgba(255,255,255,0.03)',
                  color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Variáveis */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredVariables.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              Nenhuma variável encontrada para "{searchTerm}".
            </div>
          ) : (
            filteredVariables.map((v) => {
              const isCopied = copiedTag === v.tag;
              return (
                <div
                  key={v.tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--glass-border)',
                    transition: 'all 0.2s ease',
                    gap: '16px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                  }}
                >
                  {/* Left: Tag + Label + Description */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <code style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#a78bfa',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '13px',
                        border: '1px solid rgba(168, 85, 247, 0.25)'
                      }}>
                        {v.tag}
                      </code>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                        {v.label}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px' }}>
                        {v.category}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {v.description}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Exemplo real:</span> 
                      <span style={{ fontStyle: 'italic', color: '#38bdf8' }}>"{v.sample}"</span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(v.tag, e)}
                      title="Copiar tag para a área de transferência"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: isCopied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: isCopied ? '1px solid #22c55e' : '1px solid var(--glass-border)',
                        color: isCopied ? '#22c55e' : 'var(--text-main)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      {isCopied ? "Copiado!" : "Copiar"}
                    </button>

                    {onInsertTag && (
                      <button
                        type="button"
                        onClick={() => handleInsert(v.tag)}
                        title="Inserir diretamente no modelo"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
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
                        <PlusCircle size={14} /> Inserir
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--glass-border)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            💡 Dica: Você pode colar essas variáveis livremente no código HTML ou no editor de texto.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{
              padding: '8px 20px',
              fontSize: '13px'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
