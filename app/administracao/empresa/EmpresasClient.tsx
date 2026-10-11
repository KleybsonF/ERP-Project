"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Eye,
  EyeOff, 
  CheckCircle2, 
  Star, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  ShieldCheck, 
  Award, 
  FileText, 
  X, 
  Upload, 
  Image as ImageIcon, 
  AlertCircle,
  ExternalLink,
  QrCode,
  Users,
  Layers,
  ArrowRight
} from "lucide-react";
import { 
  createCompany, 
  updateCompany, 
  toggleHideCompany, 
  setCompanyAsMatriz,
  CompanyFormData 
} from "@/app/actions/empresas";

type Company = {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  inscricaoEstadual: string | null;
  inscricaoMunicipal: string | null;

  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;

  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;

  responsavelTecnico: string | null;
  conselhoClasse: string | null;
  alvaraSanitario: string | null;
  licencaAmbiental: string | null;
  registroConselho: string | null;

  pixChave: string | null;
  pixTipo: string | null;

  logoUrl: string | null;
  assinaturaUrl: string | null;

  isMatriz: boolean;
  isAtiva: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const formatCnpj = (val: string) => {
  const digits = val.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatPhone = (val: string) => {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatCep = (val: string) => {
  const digits = val.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export default function EmpresasClient({ initialCompanies }: { initialCompanies: Company[] }) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"dados" | "contato" | "endereco" | "tecnico" | "pix" | "visual">("dados");

  // Form Fields State
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState("");
  const [isMatriz, setIsMatriz] = useState(false);

  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("RN");

  const [responsavelTecnico, setResponsavelTecnico] = useState("");
  const [conselhoClasse, setConselhoClasse] = useState("");
  const [registroConselho, setRegistroConselho] = useState("");
  const [alvaraSanitario, setAlvaraSanitario] = useState("");
  const [licencaAmbiental, setLicencaAmbiental] = useState("");

  const [pixChave, setPixChave] = useState("");
  const [pixTipo, setPixTipo] = useState("CNPJ");

  const [logoUrl, setLogoUrl] = useState("");
  const [assinaturaUrl, setAssinaturaUrl] = useState("");

  // Action status
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isTogglingHideId, setIsTogglingHideId] = useState<number | null>(null);
  const [isSettingMatrizId, setIsSettingMatrizId] = useState<number | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"todas" | "ativas" | "ocultas">("todas");

  const filteredCompanies = companies.filter((c) => {
    if (filterStatus === "ativas" && !c.isAtiva) return false;
    if (filterStatus === "ocultas" && c.isAtiva) return false;

    const term = searchTerm.toLowerCase();
    return (
      c.razaoSocial.toLowerCase().includes(term) ||
      (c.nomeFantasia || "").toLowerCase().includes(term) ||
      (c.cnpj || "").toLowerCase().includes(term) ||
      (c.cidade || "").toLowerCase().includes(term)
    );
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setRazaoSocial("");
    setNomeFantasia("");
    setCnpj("");
    setInscricaoEstadual("");
    setInscricaoMunicipal("");
    setIsMatriz(companies.length === 0);

    setTelefone("");
    setWhatsapp("");
    setEmail("");
    setWebsite("");

    setCep("");
    setLogradouro("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("RN");

    setResponsavelTecnico("");
    setConselhoClasse("");
    setRegistroConselho("");
    setAlvaraSanitario("");
    setLicencaAmbiental("");

    setPixChave("");
    setPixTipo("CNPJ");

    setLogoUrl("");
    setAssinaturaUrl("");

    setErrorMsg("");
    setActiveTab("dados");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setEditingId(comp.id);
    setRazaoSocial(comp.razaoSocial);
    setNomeFantasia(comp.nomeFantasia || "");
    setCnpj(comp.cnpj || "");
    setInscricaoEstadual(comp.inscricaoEstadual || "");
    setInscricaoMunicipal(comp.inscricaoMunicipal || "");
    setIsMatriz(comp.isMatriz);

    setTelefone(comp.telefone || "");
    setWhatsapp(comp.whatsapp || "");
    setEmail(comp.email || "");
    setWebsite(comp.website || "");

    setCep(comp.cep || "");
    setLogradouro(comp.logradouro || "");
    setNumero(comp.numero || "");
    setComplemento(comp.complemento || "");
    setBairro(comp.bairro || "");
    setCidade(comp.cidade || "");
    setEstado(comp.estado || "RN");

    setResponsavelTecnico(comp.responsavelTecnico || "");
    setConselhoClasse(comp.conselhoClasse || "");
    setRegistroConselho(comp.registroConselho || "");
    setAlvaraSanitario(comp.alvaraSanitario || "");
    setLicencaAmbiental(comp.licencaAmbiental || "");

    setPixChave(comp.pixChave || "");
    setPixTipo(comp.pixTipo || "CNPJ");

    setLogoUrl(comp.logoUrl || "");
    setAssinaturaUrl(comp.assinaturaUrl || "");

    setErrorMsg("");
    setActiveTab("dados");
    setIsFormOpen(true);
  };

  const handleCepLookup = async (cepValue: string) => {
    const clean = cepValue.replace(/\D/g, "");
    if (clean.length === 8) {
      setIsLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (data.logradouro) setLogradouro(data.logradouro);
          if (data.bairro) setBairro(data.bairro);
          if (data.localidade) setCidade(data.localidade);
          if (data.uf) setEstado(data.uf);
        }
      } catch (err) {
        console.error("Erro na busca de CEP", err);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "logo" | "assinatura") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem selecionada é muito pesada (máximo 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (target === "logo") {
        setLogoUrl(base64);
      } else {
        setAssinaturaUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!razaoSocial.trim()) {
      setErrorMsg("A Razão Social da empresa é obrigatória.");
      setActiveTab("dados");
      return;
    }

    setIsSaving(true);
    const payload: CompanyFormData = {
      razaoSocial: razaoSocial.trim(),
      nomeFantasia: nomeFantasia.trim() || undefined,
      cnpj: cnpj.trim() || undefined,
      inscricaoEstadual: inscricaoEstadual.trim() || undefined,
      inscricaoMunicipal: inscricaoMunicipal.trim() || undefined,

      telefone: telefone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      email: email.trim() || undefined,
      website: website.trim() || undefined,

      cep: cep.trim() || undefined,
      logradouro: logradouro.trim() || undefined,
      numero: numero.trim() || undefined,
      complemento: complemento.trim() || undefined,
      bairro: bairro.trim() || undefined,
      cidade: cidade.trim() || undefined,
      estado: estado.trim() || undefined,

      responsavelTecnico: responsavelTecnico.trim() || undefined,
      conselhoClasse: conselhoClasse.trim() || undefined,
      alvaraSanitario: alvaraSanitario.trim() || undefined,
      licencaAmbiental: licencaAmbiental.trim() || undefined,
      registroConselho: registroConselho.trim() || undefined,

      pixChave: pixChave.trim() || undefined,
      pixTipo: pixTipo,

      logoUrl: logoUrl || undefined,
      assinaturaUrl: assinaturaUrl || undefined,

      isMatriz: isMatriz
    };

    try {
      if (editingId) {
        const updated = await updateCompany(editingId, payload);
        setCompanies(prev => prev.map(c => (c.id === editingId ? (updated as any) : (payload.isMatriz ? { ...c, isMatriz: false } : c))));
      } else {
        const created = await createCompany(payload);
        setCompanies(prev => [created as any, ...(payload.isMatriz ? prev.map(c => ({ ...c, isMatriz: false })) : prev)]);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao salvar empresa.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleHide = async (comp: Company) => {
    if (comp.isMatriz && comp.isAtiva) {
      alert("A empresa definida como Matriz principal não pode ser ocultada. Defina outra empresa como Matriz antes de ocultá-la.");
      return;
    }

    const action = comp.isAtiva ? "ocultar" : "reativar";
    if (confirm(`Tem certeza que deseja ${action} a empresa "${comp.razaoSocial}"?`)) {
      setIsTogglingHideId(comp.id);
      try {
        const updated = await toggleHideCompany(comp.id);
        setCompanies(prev => prev.map(c => (c.id === comp.id ? (updated as any) : c)));
      } catch (err: any) {
        alert(err.message || `Erro ao ${action} empresa.`);
      } finally {
        setIsTogglingHideId(null);
      }
    }
  };

  const handleSetMatriz = async (comp: Company) => {
    setIsSettingMatrizId(comp.id);
    try {
      await setCompanyAsMatriz(comp.id);
      setCompanies(prev =>
        prev.map(c => ({
          ...c,
          isMatriz: c.id === comp.id
        }))
      );
    } catch (err: any) {
      alert(err.message || "Erro ao definir Matriz.");
    } finally {
      setIsSettingMatrizId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header & Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--glass-border)",
          paddingBottom: "16px",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            href="/usuarios"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              background: "rgba(255, 255, 255, 0.03)",
              color: "var(--text-secondary)",
              border: "1px solid var(--glass-border)",
              transition: "all 0.2s ease"
            }}
          >
            <Users size={16} /> Equipe e Acessos
          </Link>

          <Link
            href="/administracao/empresa"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))",
              color: "#c084fc",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              boxShadow: "0 4px 12px rgba(168, 85, 247, 0.15)"
            }}
          >
            <Building2 size={16} /> Dados da Empresa
          </Link>

          <Link
            href="/clientes/modelos-contrato"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              background: "rgba(255, 255, 255, 0.03)",
              color: "var(--text-secondary)",
              border: "1px solid var(--glass-border)",
              transition: "all 0.2s ease"
            }}
          >
            <FileText size={16} /> Modelos de Contrato
          </Link>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "8px",
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
            transition: "all 0.2s ease"
          }}
        >
          <Plus size={18} /> Cadastrar Nova Empresa
        </button>
      </div>

      {/* Header Info & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: "22px" }}>Cadastro de Empresas</h1>
          <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0", fontSize: "13px" }}>
            Cadastre os dados fiscais, endereço, dados sanitários e identidade visual das suas empresas para emissão automática de contratos e O.S.
          </p>
        </div>

        {/* Search & Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{
              height: "40px",
              padding: "0 12px",
              borderRadius: "10px",
              background: "var(--bg-color-soft, #ffffff)",
              border: "1px solid var(--glass-border, #cbd5e1)",
              color: "var(--text-main, #0f172a)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="todas">Todas as Empresas ({companies.length})</option>
            <option value="ativas">Somente Ativas ({companies.filter(c => c.isAtiva).length})</option>
            <option value="ocultas">Somente Ocultas ({companies.filter(c => !c.isAtiva).length})</option>
          </select>

          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-color-soft, #ffffff)",
              border: "1px solid var(--glass-border, #cbd5e1)",
              borderRadius: "10px",
              padding: "0 12px",
              height: "40px",
              width: "300px"
            }}
          >
            <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar razão social, CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0 10px",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-main, #0f172a)",
                fontSize: "13px"
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Companies List */}
      {filteredCompanies.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: "60px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px"
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Building2 size={32} color="#818cf8" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-main)" }}>
              Nenhuma empresa encontrada
            </h3>
            <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: "13px" }}>
              {searchTerm ? "Tente alterar os termos da busca." : "Cadastre a primeira empresa para gerenciar o negócio."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNew}
            style={{
              marginTop: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 700,
              padding: "10px 22px",
              background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
              transition: "all 0.2s ease"
            }}
          >
            <Plus size={16} /> Cadastrar Empresa
          </button>
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{
            padding: 0,
            overflow: "hidden",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
            background: "var(--bg-color-soft)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)"
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--glass-border)",
                    background: "rgba(255, 255, 255, 0.02)",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.5px"
                  }}
                >
                  <th style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>Empresa / Razão Social</th>
                  <th style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>CNPJ & Inscrições</th>
                  <th style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>Contato & Localização</th>
                  <th style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>Responsável & Regulatório</th>
                  <th style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((comp, idx) => (
                  <tr
                    key={comp.id}
                    style={{
                      borderBottom: idx === filteredCompanies.length - 1 ? "none" : "1px solid var(--glass-border)",
                      transition: "background 0.15s ease",
                      background: comp.isMatriz ? "rgba(16, 185, 129, 0.02)" : "transparent"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--glass-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = comp.isMatriz ? "rgba(16, 185, 129, 0.02)" : "transparent";
                    }}
                  >
                    {/* Coluna 1: Empresa / Razão Social */}
                    <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {comp.logoUrl ? (
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "8px",
                              background: "#ffffff",
                              padding: "3px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid var(--glass-border)",
                              flexShrink: 0,
                              boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                            }}
                          >
                            <img
                              src={comp.logoUrl}
                              alt={comp.razaoSocial}
                              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "8px",
                              background: "rgba(99, 102, 241, 0.15)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid rgba(99, 102, 241, 0.3)",
                              flexShrink: 0
                            }}
                          >
                            <Building2 size={22} color="#818cf8" />
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "14px" }}>
                              {comp.razaoSocial}
                            </span>
                            {comp.isMatriz ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  color: "#34d399",
                                  background: "rgba(52, 211, 153, 0.15)",
                                  border: "1px solid rgba(52, 211, 153, 0.35)",
                                  padding: "2px 6px",
                                  borderRadius: "4px"
                                }}
                              >
                                <Star size={10} fill="#34d399" /> MATRIZ
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  color: "var(--text-muted)",
                                  background: "rgba(148, 163, 184, 0.1)",
                                  border: "1px solid rgba(148, 163, 184, 0.2)",
                                  padding: "2px 6px",
                                  borderRadius: "4px"
                                }}
                              >
                                FILIAL
                              </span>
                            )}
                          </div>
                          {comp.nomeFantasia && (
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                              {comp.nomeFantasia}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Coluna 2: CNPJ & Inscrições */}
                    <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-main)", fontFamily: "monospace", fontSize: "13px" }}>
                          {comp.cnpj ? formatCnpj(comp.cnpj) : "Sem CNPJ"}
                        </span>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {comp.inscricaoEstadual && <span>IE: {comp.inscricaoEstadual}</span>}
                          {comp.inscricaoMunicipal && <span>IM: {comp.inscricaoMunicipal}</span>}
                          {!comp.inscricaoEstadual && !comp.inscricaoMunicipal && <span style={{ color: "var(--text-muted)" }}>Isento / N.I.</span>}
                        </div>
                      </div>
                    </td>

                    {/* Coluna 3: Contato & Localização */}
                    <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)", fontWeight: 500 }}>
                          <MapPin size={13} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                          <span>
                            {[comp.logradouro, comp.numero, comp.bairro, comp.cidade, comp.estado]
                              .filter(Boolean)
                              .join(", ") || (comp.cidade ? `${comp.cidade} - ${comp.estado || "RN"}` : "Localidade não informada")}
                            {comp.cep ? ` (${formatCep(comp.cep)})` : ""}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                          {comp.whatsapp ? (
                            <a
                              href={`https://wa.me/55${comp.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#34d399", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 500 }}
                            >
                              <Phone size={11} /> {formatPhone(comp.whatsapp)} (Zap)
                            </a>
                          ) : comp.telefone ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Phone size={11} /> {formatPhone(comp.telefone)}
                            </span>
                          ) : null}

                          {comp.email && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
                              <Mail size={11} /> {comp.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Coluna 4: Responsável Técnico & Regulatório */}
                    <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-main)", fontWeight: 600 }}>
                          <ShieldCheck size={14} color="#a855f7" style={{ flexShrink: 0 }} />
                          <span>{comp.responsavelTecnico || "Não informado"}</span>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {(comp.conselhoClasse || comp.registroConselho) && (
                            <span>{comp.conselhoClasse || comp.registroConselho}</span>
                          )}
                          {comp.alvaraSanitario && <span>Alvará: {comp.alvaraSanitario}</span>}
                          {comp.licencaAmbiental && <span>Licença: {comp.licencaAmbiental}</span>}
                          {!comp.conselhoClasse && !comp.registroConselho && !comp.alvaraSanitario && (
                            <span style={{ color: "var(--text-muted)" }}>Sem registro informado</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Coluna 5: Status */}
                    <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "5px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: comp.isAtiva ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                          color: comp.isAtiva ? "#059669" : "#d97706",
                          border: comp.isAtiva ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)"
                        }}
                      >
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: comp.isAtiva ? "#10b981" : "#f59e0b" }} />
                        {comp.isAtiva ? "Ativa" : "Oculta"}
                      </span>
                    </td>

                    {/* Coluna 6: Ações */}
                    <td style={{ padding: "16px 18px", verticalAlign: "middle", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                        {!comp.isMatriz ? (
                          <button
                            type="button"
                            onClick={() => handleSetMatriz(comp)}
                            disabled={isSettingMatrizId === comp.id}
                            title="Definir como Matriz Principal"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "rgba(16, 185, 129, 0.12)",
                              border: "1px solid rgba(16, 185, 129, 0.35)",
                              color: "#059669",
                              padding: "6px 12px",
                              borderRadius: "7px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <Star size={13} /> Tornar Matriz
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(comp)}
                          title="Editar Empresa"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 14px",
                            borderRadius: "7px",
                            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                            border: "none",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <Edit3 size={13} /> Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleHide(comp)}
                          disabled={isTogglingHideId === comp.id || (comp.isMatriz && comp.isAtiva)}
                          title={
                            comp.isMatriz && comp.isAtiva
                              ? "A Matriz principal não pode ser ocultada"
                              : comp.isAtiva
                              ? "Ocultar Empresa"
                              : "Reativar Empresa"
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            borderRadius: "7px",
                            background: comp.isAtiva ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                            border: comp.isAtiva ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid rgba(16, 185, 129, 0.35)",
                            color: comp.isAtiva ? "#d97706" : "#059669",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: comp.isMatriz && comp.isAtiva ? "not-allowed" : "pointer",
                            opacity: comp.isMatriz && comp.isAtiva ? 0.45 : 1,
                            transition: "all 0.2s ease"
                          }}
                        >
                          {comp.isAtiva ? (
                            <>
                              <EyeOff size={13} /> Ocultar
                            </>
                          ) : (
                            <>
                              <Eye size={13} /> Reativar
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {isFormOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "860px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              padding: 0,
              overflow: "hidden",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid var(--glass-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255, 255, 255, 0.02)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building2 size={20} color="#818cf8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-main)" }}>
                    {editingId ? "Editar Dados da Empresa" : "Cadastrar Nova Empresa"}
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Preencha as informações da empresa prestadora
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div
                style={{
                  margin: "16px 24px 0",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {/* Modal Navigation Tabs */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                padding: "12px 24px 0",
                borderBottom: "1px solid var(--glass-border)",
                overflowX: "auto"
              }}
            >
              {[
                { id: "dados", label: "Dados Fiscais", icon: Building2 },
                { id: "contato", label: "Contatos", icon: Phone },
                { id: "endereco", label: "Endereço", icon: MapPin },
                { id: "tecnico", label: "Regulatório & Técnico", icon: ShieldCheck },
                { id: "pix", label: "Chave PIX", icon: QrCode },
                { id: "visual", label: "Logo & Assinatura", icon: ImageIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "8px 8px 0 0",
                      border: "none",
                      borderBottom: isActive ? "2px solid #4f46e5" : "2px solid transparent",
                      background: isActive ? "rgba(99, 102, 241, 0.12)" : "transparent",
                      color: isActive ? "#4f46e5" : "var(--text-secondary, #64748b)",
                      fontSize: "12px",
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <Icon size={14} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Form Content Area */}
            <form onSubmit={handleSave} style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* ABA 1: DADOS FISCAIS */}
              {activeTab === "dados" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Razão Social *</label>
                    <input
                      type="text"
                      placeholder="Ex: Confiança Dedetizadora LTDA ME"
                      value={razaoSocial}
                      onChange={(e) => setRazaoSocial(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Nome Fantasia</label>
                    <input
                      type="text"
                      placeholder="Ex: Confiança Dedetizadora"
                      value={nomeFantasia}
                      onChange={(e) => setNomeFantasia(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>CNPJ</label>
                      <input
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={cnpj}
                        onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Inscrição Estadual</label>
                      <input
                        type="text"
                        placeholder="Ex: 20.345.678-9"
                        value={inscricaoEstadual}
                        onChange={(e) => setInscricaoEstadual(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Inscrição Municipal</label>
                      <input
                        type="text"
                        placeholder="Ex: 43210-9"
                        value={inscricaoMunicipal}
                        onChange={(e) => setInscricaoMunicipal(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 16px",
                      background: "var(--bg-color, #f8fafc)",
                      border: "1px solid var(--glass-border, #e2e8f0)",
                      borderRadius: "8px",
                      marginTop: "6px"
                    }}
                  >
                    <input
                      type="checkbox"
                      id="isMatrizCheckbox"
                      checked={isMatriz}
                      onChange={(e) => setIsMatriz(e.target.checked)}
                      style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#4f46e5" }}
                    />
                    <label htmlFor="isMatrizCheckbox" style={{ fontSize: "13px", color: "var(--text-main, #0f172a)", fontWeight: 600, cursor: "pointer" }}>
                      Definir como Matriz / Empresa Principal do Sistema
                    </label>
                  </div>
                </div>
              )}

              {/* ABA 2: CONTATOS */}
              {activeTab === "contato" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>Telefone Fixo</label>
                      <input
                        type="text"
                        placeholder="(00) 0000-0000"
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhone(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>WhatsApp Comercial</label>
                      <input
                        type="text"
                        placeholder="(00) 90000-0000"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>E-mail Corporativo</label>
                    <input
                      type="email"
                      placeholder="contato@suaempresa.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Website / Página da Empresa</label>
                    <input
                      type="text"
                      placeholder="https://www.suaempresa.com.br"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* ABA 3: ENDEREÇO */}
              {activeTab === "endereco" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>CEP {isLoadingCep && "(Buscando...)"}</label>
                      <input
                        type="text"
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => {
                          const val = formatCep(e.target.value);
                          setCep(val);
                          handleCepLookup(val);
                        }}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Logradouro / Rua</label>
                      <input
                        type="text"
                        placeholder="Ex: Rua Treze de Maio"
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>Número</label>
                      <input
                        type="text"
                        placeholder="Ex: 34"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Complemento</label>
                      <input
                        type="text"
                        placeholder="Ex: Sala 102, Galpão B"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Bairro</label>
                      <input
                        type="text"
                        placeholder="Ex: Boa Esperança"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>Cidade</label>
                      <input
                        type="text"
                        placeholder="Ex: Parnamirim"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Estado (UF)</label>
                      <input
                        type="text"
                        placeholder="RN"
                        maxLength={2}
                        value={estado}
                        onChange={(e) => setEstado(e.target.value.toUpperCase())}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: REGULATÓRIO & TÉCNICO */}
              {activeTab === "tecnico" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Nome do Responsável Técnico</label>
                    <input
                      type="text"
                      placeholder="Ex: Flavio H. Ariston Oliveira"
                      value={responsavelTecnico}
                      onChange={(e) => setResponsavelTecnico(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>Conselho de Classe / Formação</label>
                      <input
                        type="text"
                        placeholder="Ex: Médico Veterinário"
                        value={conselhoClasse}
                        onChange={(e) => setConselhoClasse(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Registro no Conselho</label>
                      <input
                        type="text"
                        placeholder="Ex: CRMV/RN-0242"
                        value={registroConselho}
                        onChange={(e) => setRegistroConselho(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Alvará Sanitário (Identificação e Validade)</label>
                    <input
                      type="text"
                      placeholder="Ex: 014/2026 - VAL: 18/03/2027"
                      value={alvaraSanitario}
                      onChange={(e) => setAlvaraSanitario(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Licença Ambiental (Identificação e Validade)</label>
                    <input
                      type="text"
                      placeholder="Ex: 006/2024 - VAL: 12/07/2027"
                      value={licencaAmbiental}
                      onChange={(e) => setLicencaAmbiental(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* ABA 5: PIX */}
              {activeTab === "pix" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>Tipo de Chave PIX</label>
                      <select
                        value={pixTipo}
                        onChange={(e) => setPixTipo(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="CNPJ">CNPJ</option>
                        <option value="E-mail">E-mail</option>
                        <option value="Telefone">Telefone</option>
                        <option value="Aleatória">Chave Aleatória</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Chave PIX para Recebimentos</label>
                      <input
                        type="text"
                        placeholder="Informe a chave PIX da empresa..."
                        value={pixChave}
                        onChange={(e) => setPixChave(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 6: IDENTIDADE VISUAL & ASSINATURA */}
              {activeTab === "visual" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Logomarca */}
                  <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-color, #f8fafc)", border: "1px solid var(--glass-border, #e2e8f0)" }}>
                    <label style={{ ...labelStyle, fontSize: "14px", fontWeight: 700, color: "var(--text-main, #0f172a)" }}>
                      Logomarca da Empresa (Logo)
                    </label>
                    <p style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", margin: "2px 0 12px" }}>
                      Será inserida no cabeçalho dos contratos e certificados impressos.
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      {logoUrl ? (
                        <div style={{ width: "90px", height: "90px", background: "#ffffff", borderRadius: "8px", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", border: "1px solid var(--glass-border, #cbd5e1)" }}>
                          <img src={logoUrl} alt="Logo Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                          <button
                            type="button"
                            onClick={() => setLogoUrl("")}
                            style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div style={{ width: "90px", height: "90px", background: "var(--bg-color-soft, #ffffff)", border: "1px dashed var(--glass-border, #cbd5e1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ImageIcon size={28} color="var(--text-muted, #94a3b8)" />
                        </div>
                      )}

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            background: "rgba(79, 70, 229, 0.08)",
                            border: "1px solid rgba(79, 70, 229, 0.3)",
                            color: "#4338ca",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            width: "fit-content"
                          }}
                        >
                          <Upload size={14} /> Fazer Upload do Logo (JPG / PNG)
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "logo")} style={{ display: "none" }} />
                        </label>
                        <input
                          type="text"
                          placeholder="Ou informe uma URL/caminho: /contratos/logo_empresa.jpeg"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          style={{ ...inputStyle, fontSize: "12px", padding: "6px 10px" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Assinatura */}
                  <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-color, #f8fafc)", border: "1px solid var(--glass-border, #e2e8f0)" }}>
                    <label style={{ ...labelStyle, fontSize: "14px", fontWeight: 700, color: "var(--text-main, #0f172a)" }}>
                      Assinatura Digital do Responsável Técnico
                    </label>
                    <p style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", margin: "2px 0 12px" }}>
                      Assinatura digitalizada com fundo transparente ou branco para aposição nos contratos.
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      {assinaturaUrl ? (
                        <div style={{ width: "120px", height: "70px", background: "#ffffff", borderRadius: "8px", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", border: "1px solid var(--glass-border, #cbd5e1)" }}>
                          <img src={assinaturaUrl} alt="Assinatura Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", mixBlendMode: "multiply" }} />
                          <button
                            type="button"
                            onClick={() => setAssinaturaUrl("")}
                            style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div style={{ width: "120px", height: "70px", background: "var(--bg-color-soft, #ffffff)", border: "1px dashed var(--glass-border, #cbd5e1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ImageIcon size={28} color="var(--text-muted, #94a3b8)" />
                        </div>
                      )}

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            background: "rgba(147, 51, 234, 0.08)",
                            border: "1px solid rgba(147, 51, 234, 0.3)",
                            color: "#7e22ce",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            width: "fit-content"
                          }}
                        >
                          <Upload size={14} /> Fazer Upload da Assinatura (JPG / PNG)
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "assinatura")} style={{ display: "none" }} />
                        </label>
                        <input
                          type="text"
                          placeholder="Ou informe uma URL/caminho: /contratos/assinatura_eletronica.jpeg"
                          value={assinaturaUrl}
                          onChange={(e) => setAssinaturaUrl(e.target.value)}
                          style={{ ...inputStyle, fontSize: "12px", padding: "6px 10px" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Form Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid var(--glass-border)",
                  paddingTop: "16px",
                  marginTop: "8px"
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  Cancelar
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "9px 26px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: isSaving ? "not-allowed" : "pointer",
                      background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
                      opacity: isSaving ? 0.7 : 1,
                      transition: "all 0.2s ease"
                    }}
                  >
                    {isSaving ? "Salvando..." : editingId ? "Salvar Alterações" : "Cadastrar Empresa"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-main, #0f172a)",
  marginBottom: "6px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "8px",
  background: "var(--bg-color-soft, #ffffff)",
  border: "1px solid var(--glass-border, #cbd5e1)",
  color: "var(--text-main, #0f172a)",
  fontSize: "13px",
  outline: "none",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
};
