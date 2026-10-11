"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Printer, 
  ArrowLeft, 
  Copy, 
  Check, 
  FileText, 
  Sparkles, 
  Code2,
  Maximize2
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // If no initial template (or previewing draft from editor)
    if (!initialTemplate || (typeof window !== "undefined" && window.location.search.includes("draft=true"))) {
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

  // Adjust iframe height automatically based on its content
  const handleIframeLoad = () => {
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow?.document?.body) {
        const bodyHeight = iframe.contentWindow.document.body.scrollHeight;
        const htmlHeight = iframe.contentWindow.document.documentElement.scrollHeight;
        const totalHeight = Math.max(bodyHeight, htmlHeight, 1120);
        iframe.style.height = `${totalHeight + 40}px`;
      }
    } catch (e) {
      // Ignored if cross-origin (same origin in srcDoc)
    }
  };

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

  const renderedContent = useSampleData
    ? replaceContractVariables(template.content)
    : template.content;

  // Build isolated HTML document
  const isFullHtml = renderedContent.trim().toLowerCase().startsWith("<!doctype") || 
                     renderedContent.trim().toLowerCase().startsWith("<html");

  const srcDocHtml = isFullHtml
    ? renderedContent
    : `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${template.title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #ffffff;
      color: #1e293b;
      line-height: 1.6;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
    }
  </style>
</head>
<body>
  ${renderedContent}
</body>
</html>`;

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      window.print();
    }
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(renderedContent);
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
    <div style={{ minHeight: "100vh", background: "#1e2124", color: "#f8fafc", display: "flex", flexDirection: "column" }}>
      {/* Top Floating Action Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#181a1d",
          borderBottom: "1px solid #33363d",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            type="button"
            onClick={handleClose}
            title="Voltar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "6px",
              background: "#2b2d31",
              border: "1px solid #3f4248",
              color: "#cbd5e1",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                {template.title}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "10px",
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
              Visualizador Oficial de Documentos & Impressão Online
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Toggle Dados Reais vs Tags */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#111215",
              padding: "3px",
              borderRadius: "8px",
              border: "1px solid #33363d"
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
                transition: "all 0.15s"
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
                transition: "all 0.15s"
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
              padding: "7px 14px",
              borderRadius: "6px",
              background: "#2b2d31",
              border: "1px solid #3f4248",
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
              padding: "8px 22px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #0284c7, #2563eb)",
              border: "1px solid #60a5fa",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)"
            }}
          >
            <Printer size={16} /> Imprimir / Salvar em PDF
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main
        style={{
          flex: 1,
          padding: "30px 16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          overflowY: "auto"
        }}
      >
        {/* Isolated Iframe Simulator (Exact A4 Document Dimensions) */}
        <iframe
          ref={iframeRef}
          id="preview-iframe"
          srcDoc={srcDocHtml}
          onLoad={handleIframeLoad}
          title="Document Preview"
          style={{
            width: "210mm",
            maxWidth: "100%",
            minHeight: "297mm",
            border: "none",
            backgroundColor: "#ffffff",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6), 0 0 1px rgba(0,0,0,0.4)",
            borderRadius: "2px"
          }}
        />
      </main>
    </div>
  );
}
