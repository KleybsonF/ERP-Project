"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Printer, 
  ArrowLeft, 
  X, 
  Copy, 
  Check, 
  FileText, 
  Sparkles, 
  Eye, 
  Code2,
  Download
} from "lucide-react";
import { replaceContractVariables } from "../../contractVariables";

interface TemplateData {
  id?: number;
  title: string;
  category: string;
  description?: string | null;
  content: string;
}

export default function PreviewClient({ initialTemplate }: { initialTemplate: TemplateData | null }) {
  const [template, setTemplate] = useState<TemplateData | null>(initialTemplate);
  const [useSampleData, setUseSampleData] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // If no initial template (or previewing draft from editor)
    if (!initialTemplate || typeof window !== "undefined" && window.location.search.includes("draft=true")) {
      const draft = sessionStorage.getItem("preview_contract_draft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setTemplate(parsed);
        } catch (e) {
          console.error("Erro ao carregar rascunho de prévia", e);
        }
      }
    }
  }, [initialTemplate]);

  if (!template) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#f8fafc",
        padding: "24px"
      }}>
        <FileText size={48} color="#64748b" style={{ marginBottom: "16px" }} />
        <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Modelo não encontrado</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "8px" }}>
          Não foi possível carregar a visualização deste modelo de contrato.
        </p>
        <Link
          href="/clientes/modelos-contrato"
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "#3b82f6",
            color: "#ffffff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "14px"
          }}
        >
          Voltar para Lista de Modelos
        </Link>
      </div>
    );
  }

  const renderedHtml = useSampleData
    ? replaceContractVariables(template.content)
    : template.content;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(renderedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      window.location.href = "/clientes/modelos-contrato";
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f19", color: "#f8fafc" }}>
      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .preview-paper {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
        }
      `}</style>

      {/* Floating Top Control Bar (Hidden on Print) */}
      <header
        className="no-print"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            type="button"
            onClick={handleClose}
            title="Voltar / Fechar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "6px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#cbd5e1",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#f8fafc"
                }}
              >
                {template.title}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  fontWeight: 600,
                  border: "1px solid rgba(56, 189, 248, 0.3)"
                }}
              >
                {template.category}
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Visualização Online de Contrato & Impressão PDF
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          
          {/* Real vs Raw tags toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(0, 0, 0, 0.4)",
              padding: "4px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            <button
              type="button"
              onClick={() => setUseSampleData(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                background: useSampleData ? "#3b82f6" : "transparent",
                color: useSampleData ? "#ffffff" : "#94a3b8",
                transition: "all 0.2s"
              }}
            >
              <Sparkles size={13} /> Dados Reais Simulados
            </button>
            <button
              type="button"
              onClick={() => setUseSampleData(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                background: !useSampleData ? "#3b82f6" : "transparent",
                color: !useSampleData ? "#ffffff" : "#94a3b8",
                transition: "all 0.2s"
              }}
            >
              <Code2 size={13} /> Variáveis {`{{tags}}`}
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyHtml}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "6px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#cbd5e1",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {copied ? <Check size={15} color="#4ade80" /> : <Copy size={15} />}
            <span>{copied ? "Copiado!" : "Copiar HTML"}</span>
          </button>

          {/* Print / Save to PDF */}
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #0284c7, #2563eb)",
              border: "1px solid #60a5fa",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)"
            }}
          >
            <Printer size={16} /> Imprimir / Salvar em PDF
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ padding: "32px 16px" }}>
        {/* Paper Container (Styled as A4 document) */}
        <div
          className="preview-paper"
          style={{
            maxWidth: "850px",
            margin: "0 auto",
            background: "#ffffff",
            color: "#1e293b",
            padding: "48px 56px",
            minHeight: "1050px",
            borderRadius: "4px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 1px rgba(0,0,0,0.2)",
            fontFamily: "Arial, sans-serif",
            lineHeight: "1.6"
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        </div>
      </main>
    </div>
  );
}
