"use client";

import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { Search, Printer, Save, MapPin, Phone, User, Building2, X, AlertTriangle, Trash2 } from "lucide-react";
import { updateCustomer, getCondominiums, createCondominium, deleteCustomer } from "@/app/actions/clientes";
import { useRouter } from "next/navigation";

type Customer = {
  id: number;
  name: string;
  type?: string;
  document: string | null;
  phone: string | null;
  
  nomeSocial?: string | null;
  dataNascimento?: string | null;
  rg?: string | null;
  rgEmissor?: string | null;
  rgDataExp?: string | null;
  nomePai?: string | null;
  nomeMae?: string | null;
  nacionalidade?: string | null;
  naturalidade?: string | null;
  estadoCivil?: string | null;
  sexo?: string | null;
  profissao?: string | null;
  
  nomeFantasia?: string | null;
  responsavel?: string | null;
  cpfResponsavel?: string | null;
  dataFundacao?: string | null;
  inscricaoMunicipal?: string | null;
  
  inscricaoEstadual?: string | null;

  createdAt: string | Date;
  isHidden: boolean;
  locations: any[];
  contacts?: any[];
};

const formatPhone = (val: string) => {
  let v = val.replace(/\D/g, '');
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length > 10) {
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (v.length > 6) {
    return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  } else if (v.length > 2) {
    return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  }
  return v;
};

export default function ClienteDetailClient({ customer }: { customer: Customer }) {
  const [activePrimaryTab, setActivePrimaryTab] = useState("Cadastro");
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCustomer = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomer(customer.id);
      router.push("/clientes");
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir o cliente. Tente novamente.");
      setIsDeleting(false);
    }
  };
  
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [condos, setCondos] = useState<any[]>([]);
  
  const [showCondoModal, setShowCondoModal] = useState<number | null>(null);
  const [newCondoName, setNewCondoName] = useState("");
  const [openCondoDropdown, setOpenCondoDropdown] = useState<number | null>(null);
  
  const [showCepModal, setShowCepModal] = useState<number | null>(null);

  useEffect(() => {
    getCondominiums().then(setCondos);
  }, []);

  // Form states based on real DB fields
  const [type, setType] = useState(customer.type || "PJ");
  const [locations, setLocations] = useState<any[]>(customer.locations || []);
  const [contacts, setContacts] = useState<any[]>(customer.contacts || []);
  const [phone, setPhone] = useState(customer.phone || "");

  const [name, setName] = useState(customer.name || "");
  const [document, setDocument] = useState(customer.document || "");

  // PF
  const [nomeSocial, setNomeSocial] = useState(customer.nomeSocial || "");
  const [dataNascimento, setDataNascimento] = useState(customer.dataNascimento || "");
  const [rg, setRg] = useState(customer.rg || "");
  const [rgEmissor, setRgEmissor] = useState(customer.rgEmissor || "");
  const [rgDataExp, setRgDataExp] = useState(customer.rgDataExp || "");
  const [nomePai, setNomePai] = useState(customer.nomePai || "");
  const [nomeMae, setNomeMae] = useState(customer.nomeMae || "");
  const [nacionalidade, setNacionalidade] = useState(customer.nacionalidade || "");
  const [naturalidade, setNaturalidade] = useState(customer.naturalidade || "");
  const [estadoCivil, setEstadoCivil] = useState(customer.estadoCivil || "");
  const [sexo, setSexo] = useState(customer.sexo || "");
  const [profissao, setProfissao] = useState(customer.profissao || "");

  // PJ
  const [nomeFantasia, setNomeFantasia] = useState(customer.nomeFantasia || "");
  const [responsavel, setResponsavel] = useState(customer.responsavel || "");
  const [cpfResponsavel, setCpfResponsavel] = useState(customer.cpfResponsavel || "");
  const [dataFundacao, setDataFundacao] = useState(customer.dataFundacao || "");
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState(customer.inscricaoMunicipal || "");

  // Common
  const [inscricaoEstadual, setInscricaoEstadual] = useState(customer.inscricaoEstadual || "");

  const handleTypeChange = (newType: string) => {
    if (newType !== type) {
      setType(newType);
      // Limpar todos os dados referentes ao cliente (exceto telefone e endereços, pois não foi pedido para limpar endereço especificamente, mas "todos os dados referentes ao cliente". Vou limpar os dados do cliente em si)
      setName("");
      setDocument("");
      setNomeSocial("");
      setDataNascimento("");
      setRg("");
      setRgEmissor("");
      setRgDataExp("");
      setNomePai("");
      setNomeMae("");
      setNacionalidade("");
      setNaturalidade("");
      setEstadoCivil("");
      setSexo("");
      setProfissao("");
      setNomeFantasia("");
      setResponsavel("");
      setCpfResponsavel("");
      setDataFundacao("");
      setInscricaoMunicipal("");
      setInscricaoEstadual("");
    }
  };

  const primaryTabs = [
    "Cadastro", "Contratos", "Financeiro", "Comodato / Venda", "Ocorrências", 
    "Documentos", "Anotações", "Assinaturas Eletrônicas", "Histórico"
  ];

  const initials = (customer.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join("");

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 5) {
      value = value.substring(0, 5) + "-" + value.substring(5, 8);
    }
    const newLocs = [...locations];
    newLocs[index].cep = value;
    setLocations(newLocs);
  };

  const fetchCep = (index: number) => {
    const cep = locations[index].cep?.replace(/\D/g, "") || "";
    if (cep.length !== 8) {
      alert("CEP inválido. O CEP deve conter 8 dígitos.");
      return;
    }
    
    setShowCepModal(index);
  };

  const confirmFetchCep = async () => {
    if (showCepModal === null) return;
    const index = showCepModal;
    const cep = locations[index].cep?.replace(/\D/g, "") || "";
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        alert("CEP não encontrado.");
        setShowCepModal(null);
        return;
      }

      const newLocs = [...locations];
      newLocs[index].street = data.logradouro || newLocs[index].street;
      newLocs[index].neighborhood = data.bairro || newLocs[index].neighborhood;
      newLocs[index].city = data.localidade || newLocs[index].city;
      newLocs[index].state = data.uf || newLocs[index].state;
      newLocs[index].codigoMun = data.ibge || newLocs[index].codigoMun;
      
      setLocations(newLocs);
    } catch (error) {
      alert("Erro ao buscar o CEP. Tente novamente.");
    } finally {
      setShowCepModal(null);
    }
  };

  const handleSaveNewCondo = async () => {
    if (newCondoName.trim() && showCondoModal !== null) {
      try {
        const newCondo = await createCondominium(newCondoName.trim());
        setCondos(prev => [...prev, newCondo]);
        
        const newLocs = [...locations];
        newLocs[showCondoModal].condominioName = newCondo.name;
        newLocs[showCondoModal].condominiumId = newCondo.id;
        setLocations(newLocs);
        
        setNewCondoName("");
        setShowCondoModal(null);
      } catch (e) {
        alert("Erro ao criar condomínio.");
      }
    }
  };

  const handleSave = () => {
    // Form Validation
    if (!name.trim()) {
      alert("Por favor, preencha o Nome / Razão Social.");
      return;
    }
    
    // Address Validation
    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      if (!loc.cep?.trim() || !loc.street?.trim() || !loc.neighborhood?.trim() || !loc.city?.trim() || !loc.state?.trim()) {
        alert(`Por favor, preencha todos os campos obrigatórios (*) do Endereço ${i + 1}.`);
        return;
      }
    }

    setIsSaving(true);
    startTransition(async () => {
      await updateCustomer(customer.id, {
        name,
        type,
        document,
        phone,
        nomeSocial,
        dataNascimento,
        rg,
        rgEmissor,
        rgDataExp,
        nomePai,
        nomeMae,
        nacionalidade,
        naturalidade,
        estadoCivil,
        sexo,
        profissao,
        nomeFantasia,
        responsavel,
        cpfResponsavel,
        dataFundacao,
        inscricaoMunicipal,
        inscricaoEstadual,
        contacts: contacts.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          value: c.value
        })),
        locations: locations.map(loc => ({
          id: loc.id,
          cep: loc.cep,
          street: loc.street,
          neighborhood: loc.neighborhood,
          city: loc.city,
          state: loc.state || "RN",
          numero: loc.numero,
          complemento: loc.complemento,
          pontoReferencia: loc.pontoReferencia,
          codigoMun: loc.codigoMun,
          condominiumId: loc.condominiumId
        }))
      });
      setIsSaving(false);
      alert("Cadastro atualizado com sucesso!");
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
      
      {/* Top Header like the Orange bar */}
      <div style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Cadastro</h2>
      </div>

      {/* Info Card */}
      <div style={{ 
        background: 'var(--bg-color-soft)', 
        border: '1px solid var(--glass-border)', 
        borderRadius: '14px', 
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: '0 6px 16px var(--primary-glow)'
          }}>
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                {customer.name}
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'var(--primary-glow)',
                color: 'var(--primary-color)'
              }}>
                {type === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} />
                ID <strong style={{ color: 'var(--text-main)' }}>#{customer.id}</strong>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} />
                {type === "PJ" ? "CNPJ" : "CPF"} <strong style={{ color: 'var(--text-main)' }}>{customer.document || "-"}</strong>
              </span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '2px',
          padding: '10px 16px',
          borderRadius: '10px',
          background: 'var(--bg-color)',
          border: '1px solid var(--glass-border)'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Cliente desde
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
            {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            às {new Date(customer.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Primary Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px',
        background: 'var(--bg-color-soft)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '6px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        scrollbarWidth: 'none' // For Firefox
      }} className="hide-scrollbar">
        {primaryTabs.map(tab => {
          const isActive = activePrimaryTab === tab;
          return (
            <button 
              key={tab}
              onClick={() => setActivePrimaryTab(tab)}
              style={{
                background: isActive ? 'var(--primary-color)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 4px 12px var(--primary-glow)' : 'none'
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--glass-hover)'; e.currentTarget.style.color = 'var(--text-main)'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Data Form Area */}
      {activePrimaryTab === "Cadastro" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
          
          {/* Top Toggle: PF or PJ */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button 
              type="button"
              onClick={() => handleTypeChange('PF')}
              style={{
                padding: '8px 24px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: type === 'PF' ? 'var(--primary-color)' : 'var(--glass-border)',
                fontWeight: 600,
                cursor: 'pointer',
                background: type === 'PF' ? 'var(--primary-color)' : 'transparent',
                color: type === 'PF' ? '#fff' : 'var(--text-secondary)',
                boxShadow: type === 'PF' ? '0 4px 12px var(--primary-glow)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Pessoa Física (PF)
            </button>
            <button 
              type="button"
              onClick={() => handleTypeChange('PJ')}
              style={{
                padding: '8px 24px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: type === 'PJ' ? 'var(--primary-color)' : 'var(--glass-border)',
                fontWeight: 600,
                cursor: 'pointer',
                background: type === 'PJ' ? 'var(--primary-color)' : 'transparent',
                color: type === 'PJ' ? '#fff' : 'var(--text-secondary)',
                boxShadow: type === 'PJ' ? '0 4px 12px var(--primary-glow)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Pessoa Jurídica (PJ)
            </button>
          </div>

          {/* Card: Dados */}
          <div style={{ 
            background: 'var(--bg-color-soft)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid var(--glass-border)', 
              fontWeight: 600, 
              fontSize: '15px', 
              color: 'var(--primary-color)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              Dados Principais
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {type === 'PF' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Nome:<span style={{color: '#ef4444'}}>*</span></label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="sgp-input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Nome Social:</label>
                      <input type="text" value={nomeSocial} onChange={e => setNomeSocial(e.target.value)} className="sgp-input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>CPF:</label>
                      <input type="text" value={document} onChange={e => setDocument(e.target.value)} className="sgp-input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Data Nasc.:</label>
                      <input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} className="sgp-input" style={{ width: '200px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>RG:</label>
                      <input type="text" value={rg} onChange={e => setRg(e.target.value)} className="sgp-input" style={{ width: '200px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>RG Emissor:</label>
                      <input type="text" value={rgEmissor} onChange={e => setRgEmissor(e.target.value)} className="sgp-input" style={{ width: '200px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>RG Data Exp.:</label>
                      <input type="date" value={rgDataExp} onChange={e => setRgDataExp(e.target.value)} className="sgp-input" style={{ width: '200px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Nome do Pai:</label>
                      <input type="text" value={nomePai} onChange={e => setNomePai(e.target.value)} className="sgp-input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Nome da Mãe:</label>
                      <input type="text" value={nomeMae} onChange={e => setNomeMae(e.target.value)} className="sgp-input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Nacionalidade:</label>
                      <select value={nacionalidade} onChange={e => setNacionalidade(e.target.value)} className="sgp-input" style={{ width: '200px' }}>
                        <option value="">Selecione...</option>
                        <option value="Brasileiro(a)">Brasileiro(a)</option>
                        <option value="Estrangeiro(a)">Estrangeiro(a)</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Naturalidade (UF):</label>
                      <select value={naturalidade} onChange={e => setNaturalidade(e.target.value)} className="sgp-input" style={{ width: '200px' }}>
                        <option value="">Selecione...</option>
                        <option value="AC">Acre (AC)</option><option value="AL">Alagoas (AL)</option><option value="AP">Amapá (AP)</option>
                        <option value="AM">Amazonas (AM)</option><option value="BA">Bahia (BA)</option><option value="CE">Ceará (CE)</option>
                        <option value="DF">Distrito Federal (DF)</option><option value="ES">Espírito Santo (ES)</option><option value="GO">Goiás (GO)</option>
                        <option value="MA">Maranhão (MA)</option><option value="MT">Mato Grosso (MT)</option><option value="MS">Mato Grosso do Sul (MS)</option>
                        <option value="MG">Minas Gerais (MG)</option><option value="PA">Pará (PA)</option><option value="PB">Paraíba (PB)</option>
                        <option value="PR">Paraná (PR)</option><option value="PE">Pernambuco (PE)</option><option value="PI">Piauí (PI)</option>
                        <option value="RJ">Rio de Janeiro (RJ)</option><option value="RN">Rio Grande do Norte (RN)</option><option value="RS">Rio Grande do Sul (RS)</option>
                        <option value="RO">Rondônia (RO)</option><option value="RR">Roraima (RR)</option><option value="SC">Santa Catarina (SC)</option>
                        <option value="SP">São Paulo (SP)</option><option value="SE">Sergipe (SE)</option><option value="TO">Tocantins (TO)</option>
                        <option value="Estrangeiro">Estrangeiro</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Estado Civil:</label>
                      <select value={estadoCivil} onChange={e => setEstadoCivil(e.target.value)} className="sgp-input" style={{ width: '200px' }}>
                        <option value="">Selecione...</option>
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                        <option value="Separado(a)">Separado(a)</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Sexo:</label>
                      <select value={sexo} onChange={e => setSexo(e.target.value)} className="sgp-input" style={{ width: '200px' }}>
                        <option value="">Selecione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                        <option value="Prefiro não informar">Prefiro não informar</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Profissão:</label>
                      <input type="text" value={profissao} onChange={e => setProfissao(e.target.value)} className="sgp-input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Insc. Estadual:</label>
                      <input type="text" value={inscricaoEstadual} onChange={e => setInscricaoEstadual(e.target.value)} className="sgp-input" style={{ width: '250px' }} />
                    </div>
                  </>
                )}

                {type === 'PJ' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Razão Social:<span style={{color: '#ef4444'}}>*</span></label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="sgp-input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Nome Fantasia:</label>
                      <input type="text" value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} className="sgp-input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Responsável:</label>
                      <input type="text" value={responsavel} onChange={e => setResponsavel(e.target.value)} className="sgp-input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>CPF do Responsável:</label>
                      <input type="text" value={cpfResponsavel} onChange={e => setCpfResponsavel(e.target.value)} className="sgp-input" style={{ width: '250px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>CNPJ:</label>
                      <input type="text" value={document} onChange={e => setDocument(e.target.value)} className="sgp-input" style={{ width: '250px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Data Fundação:</label>
                      <input type="date" value={dataFundacao} onChange={e => setDataFundacao(e.target.value)} className="sgp-input" style={{ width: '200px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Inscrição Estadual:</label>
                      <input type="text" value={inscricaoEstadual} onChange={e => setInscricaoEstadual(e.target.value)} className="sgp-input" style={{ width: '250px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Inscrição Municipal:</label>
                      <input type="text" value={inscricaoMunicipal} onChange={e => setInscricaoMunicipal(e.target.value)} className="sgp-input" style={{ width: '250px' }} />
                    </div>
                  </>
                )}
                
              </div>

            </div>
          </div>

          {/* Card: Contatos */}
          <div style={{ 
            background: 'var(--bg-color-soft)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              padding: '12px 24px', 
              borderBottom: '1px solid var(--glass-border)', 
              background: 'rgba(255,255,255,0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--primary-color)' }}>Contatos</span>
              <button 
                onClick={() => setContacts([...contacts, { id: 0, name: "", type: "Telefone", value: "" }])}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--primary-color)',
                  color: 'var(--primary-color)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Adicionar Contato
              </button>
            </div>
            
            <div style={{ padding: '16px 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '12px 8px', fontWeight: 500, width: '30%' }}>Nome</th>
                    <th style={{ padding: '12px 8px', fontWeight: 500, width: '20%' }}>Tipo</th>
                    <th style={{ padding: '12px 8px', fontWeight: 500, width: '40%' }}>Email / Número</th>
                    <th style={{ padding: '12px 8px', fontWeight: 500, width: '10%', textAlign: 'center' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact, index) => (
                    <tr key={index} style={{ borderBottom: index < contacts.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                      <td style={{ padding: '8px' }}>
                        <input 
                          type="text" 
                          value={contact.name} 
                          onChange={e => { const newContacts = [...contacts]; newContacts[index].name = e.target.value; setContacts(newContacts); }} 
                          className="sgp-input" 
                          style={{ width: '100%', padding: '6px 10px', height: '36px' }} 
                          placeholder="Ex: Financeiro" 
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select 
                          value={contact.type} 
                          onChange={e => { const newContacts = [...contacts]; newContacts[index].type = e.target.value; setContacts(newContacts); }} 
                          className="sgp-input" 
                          style={{ width: '100%', padding: '6px 10px', height: '36px' }}
                        >
                          <option value="Telefone">Telefone</option>
                          <option value="Email">Email</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input 
                          type="text" 
                          value={contact.value} 
                          onChange={e => { const newContacts = [...contacts]; newContacts[index].value = contact.type === 'Telefone' ? formatPhone(e.target.value) : e.target.value; setContacts(newContacts); }} 
                          className="sgp-input" 
                          style={{ width: '100%', padding: '6px 10px', height: '36px' }} 
                          placeholder={contact.type === 'Email' ? 'contato@empresa.com' : '(00) 00000-0000'} 
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => { const newContacts = [...contacts]; newContacts.splice(index, 1); setContacts(newContacts); }} 
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.2)', 
                            color: '#ef4444', 
                            fontSize: '12px', 
                            cursor: 'pointer', 
                            fontWeight: 600, 
                            padding: '6px 12px',
                            borderRadius: '6px',
                            transition: 'all 0.2s'
                          }}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Nenhum contato adicionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: Endereço */}
          <div style={{ 
            background: 'var(--bg-color-soft)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              padding: '12px 24px', 
              borderBottom: '1px solid var(--glass-border)', 
              background: 'rgba(255,255,255,0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--primary-color)' }}>Endereço</span>
              <button 
                onClick={() => setLocations([...locations, { id: 0, cep: "", street: "", neighborhood: "", city: "", state: "RN", contacts: [] }])}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--primary-color)',
                  color: 'var(--primary-color)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Adicionar Local
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {locations.map((loc, index) => (
                <div key={index} style={{ padding: '24px', borderBottom: index < locations.length - 1 ? '1px solid var(--glass-border)' : 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: locations.length > 1 ? '16px' : '0' }}>
                    {locations.length > 1 && (
                      <h5 style={{ margin: 0, fontSize: '14px', color: 'var(--primary-color)', fontWeight: 600 }}>Endereço {index + 1}</h5>
                    )}
                    {locations.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => {
                          const newLocs = [...locations];
                          newLocs.splice(index, 1);
                          setLocations(newLocs);
                        }}
                        style={{ color: 'var(--danger)', background: 'var(--danger-bg)', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}
                      >
                        Remover Endereço
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>CEP:<span style={{color: '#ef4444'}}>*</span></label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={loc.cep || ''} 
                        onChange={e => handleCepChange(e, index)} 
                        maxLength={9}
                        className="sgp-input" 
                        style={{ width: '200px' }} 
                        placeholder="00000-000"
                      />
                      <div onClick={() => fetchCep(index)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: '6px', width: '36px', height: '36px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <Search size={16} color="#0ea5e9" />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Endereço:<span style={{color: '#ef4444'}}>*</span></label>
                    <input type="text" value={loc.street} onChange={e => { const newLocs = [...locations]; newLocs[index].street = e.target.value; setLocations(newLocs); }} className="sgp-input" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Número:</label>
                    <input type="text" value={loc.numero || ''} onChange={e => { const newLocs = [...locations]; newLocs[index].numero = e.target.value; setLocations(newLocs); }} className="sgp-input" style={{ width: '200px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Bairro:<span style={{color: '#ef4444'}}>*</span></label>
                    <input type="text" value={loc.neighborhood} onChange={e => { const newLocs = [...locations]; newLocs[index].neighborhood = e.target.value; setLocations(newLocs); }} className="sgp-input" style={{ width: '300px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Cidade:<span style={{color: '#ef4444'}}>*</span></label>
                    <input type="text" value={loc.city} onChange={e => { const newLocs = [...locations]; newLocs[index].city = e.target.value; setLocations(newLocs); }} className="sgp-input" style={{ width: '300px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Cód. Mun. (IBGE):</label>
                    <input type="text" value={loc.codigoMun || ''} onChange={e => { const newLocs = [...locations]; newLocs[index].codigoMun = e.target.value; setLocations(newLocs); }} className="sgp-input" style={{ width: '150px' }} placeholder="Ex: 3550308" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>UF:<span style={{color: '#ef4444'}}>*</span></label>
                    <select value={loc.state || 'RN'} onChange={e => { const newLocs = [...locations]; newLocs[index].state = e.target.value; setLocations(newLocs); }} className="sgp-input" style={{ width: '100px' }}>
                      <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option>
                      <option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option>
                      <option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option>
                      <option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option>
                      <option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option>
                      <option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option>
                      <option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option>
                      <option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option>
                      <option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Complemento:</label>
                    <input type="text" value={loc.complemento || ''} onChange={e => { const newLocs = [...locations]; newLocs[index].complemento = e.target.value; setLocations(newLocs); }} className="sgp-input" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Ponto de Referência:</label>
                    <input type="text" value={loc.pontoReferencia || ''} onChange={e => { const newLocs = [...locations]; newLocs[index].pontoReferencia = e.target.value; setLocations(newLocs); }} className="sgp-input" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Condomínio:</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                      <input 
                        value={loc.condominioName || ''} 
                        onChange={e => { 
                          const newLocs = [...locations]; 
                          newLocs[index].condominioName = e.target.value; 
                          const found = condos.find(c => c.name === e.target.value);
                          newLocs[index].condominiumId = found ? found.id : null;
                          setLocations(newLocs); 
                        }} 
                        onFocus={() => setOpenCondoDropdown(index)}
                        onBlur={() => setTimeout(() => setOpenCondoDropdown(null), 200)}
                        className="sgp-input" 
                        style={{ width: '300px' }} 
                        placeholder="Pesquisar condomínio..."
                      />
                      
                      {/* Custom Dropdown */}
                      {openCondoDropdown === index && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '100%', 
                          left: 0, 
                          width: '300px', 
                          maxHeight: '200px', 
                          overflowY: 'auto', 
                          background: 'var(--bg-color-soft)', 
                          border: '1px solid var(--glass-border)', 
                          borderRadius: '8px', 
                          marginTop: '4px', 
                          zIndex: 50,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          {condos.filter(c => c.name.toLowerCase().includes((loc.condominioName || '').toLowerCase())).length > 0 ? (
                            condos.filter(c => c.name.toLowerCase().includes((loc.condominioName || '').toLowerCase())).map(c => (
                              <div 
                                key={c.id} 
                                onClick={() => {
                                  const newLocs = [...locations];
                                  newLocs[index].condominioName = c.name;
                                  newLocs[index].condominiumId = c.id;
                                  setLocations(newLocs);
                                  setOpenCondoDropdown(null);
                                }}
                                style={{ 
                                  padding: '10px 14px', 
                                  cursor: 'pointer', 
                                  fontSize: '13px', 
                                  color: 'var(--text-main)',
                                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                {c.name}
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                              Nenhum condomínio encontrado.
                            </div>
                          )}
                        </div>
                      )}

                      <button 
                        type="button"
                        onClick={() => setShowCondoModal(index)}
                        style={{ 
                          background: '#22c55e', 
                          border: 'none', 
                          borderRadius: '6px', 
                          width: '36px', 
                          height: '36px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                        }}
                        title="Adicionar Condomínio"
                      >
                        +
                      </button>
                    </div>
                  </div>



                </div>
              ))}
              {locations.length === 0 && (
                <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Nenhum endereço cadastrado.</div>
              )}
            </div>
          </div>

          {/* SGP Style Action Bar */}
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            marginTop: '8px',
            background: 'var(--bg-color-soft)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '16px 20px'
          }}>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: '#22c55e', // Green "Alterar"
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1
              }}
            >
              {isSaving ? "Salvando..." : "Alterar"}
            </button>
            <button 
              type="button"
              onClick={() => setShowDeleteModal(true)}
              style={{
                background: '#ef4444', // Red "Remover"
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Remover Cliente
            </button>
            <button 
              style={{
                background: '#64748b', // Gray fallback
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Adicionar à BlackList
            </button>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '16px'
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) setShowDeleteModal(false); }}
        >
          <div style={{
            background: 'var(--bg-color-soft)', border: '1px solid var(--glass-border)', borderRadius: '16px',
            padding: '24px', width: '100%', maxWidth: '460px',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.35)', display: 'flex', flexDirection: 'column', gap: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', background: 'var(--danger-bg)', color: 'var(--danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Excluir cliente permanentemente?
                </h3>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Você está prestes a excluir <strong style={{ color: 'var(--text-main)' }}>{customer.name}</strong>.
                  Todos os dados deste cliente serão <strong style={{ color: 'var(--danger)' }}>permanentemente perdidos</strong> e não poderão ser recuperados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setShowDeleteModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px',
              padding: '12px 16px', fontSize: '13px', color: 'var(--text-main)'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '6px' }}>Serão excluídos:</div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <li>Dados cadastrais e contatos</li>
                <li>Todos os endereços cadastrados</li>
                <li>Ordens de serviço, visitas e atribuições de técnicos</li>
                <li>Contas a receber vinculadas</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                style={{
                  background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)',
                  padding: '9px 16px', borderRadius: '8px', cursor: isDeleting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                style={{
                  background: 'var(--danger)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: '8px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px',
                  opacity: isDeleting ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                <Trash2 size={15} />
                {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Condomínio */}
      {showCondoModal !== null && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(15, 23, 42, 0.65)', 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backdropFilter: 'blur(6px)',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCondoModal(null);
              setNewCondoName("");
            }
          }}
        >
          <div 
            style={{ 
              background: 'var(--bg-color-soft)', 
              border: '1px solid var(--glass-border)', 
              borderRadius: '16px', 
              padding: '24px', 
              width: '100%', 
              maxWidth: '440px', 
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: 'var(--primary-glow)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--primary-color)'
                }}>
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '16px', fontWeight: 700 }}>
                    Adicionar Novo Condomínio
                  </h3>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    Cadastre um novo condomínio para vincular ao endereço.
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => {
                  setShowCondoModal(null);
                  setNewCondoName("");
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                Nome do Condomínio <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="text" 
                value={newCondoName} 
                onChange={e => setNewCondoName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveNewCondo();
                  }
                }}
                className="sgp-input" 
                placeholder="Ex: Residencial Alphaville"
                autoFocus
                style={{
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: '8px'
                }}
              />
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
              <button 
                type="button"
                onClick={() => {
                  setShowCondoModal(null);
                  setNewCondoName("");
                }} 
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--glass-border)', 
                  color: 'var(--text-secondary)', 
                  padding: '9px 16px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 600,
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--glass-hover)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSaveNewCondo} 
                disabled={!newCondoName.trim()}
                style={{ 
                  background: 'var(--primary-color)', 
                  border: 'none', 
                  color: '#fff', 
                  padding: '9px 18px', 
                  borderRadius: '8px', 
                  cursor: !newCondoName.trim() ? 'not-allowed' : 'pointer', 
                  fontWeight: 600,
                  fontSize: '13px',
                  opacity: !newCondoName.trim() ? 0.6 : 1,
                  boxShadow: '0 4px 12px var(--primary-glow)',
                  transition: 'all 0.2s'
                }}
              >
                Salvar Condomínio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação ViaCEP */}
      {showCepModal !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-color-soft)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '24px', width: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-main)', fontSize: '18px' }}>Autopreenchimento de Endereço</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Deseja preencher as informações de endereço (Rua, Bairro, Cidade, Estado e Código Mun.) automaticamente com base neste CEP?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowCepModal(null)} 
                style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Não, preencher manualmente
              </button>
              <button 
                onClick={confirmFetchCep} 
                style={{ background: 'var(--primary-color)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Sim, preencher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico Area */}
      {activePrimaryTab === "Histórico" && (
        <div style={{ 
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Histórico de Ações e Logs</h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Data/Hora</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Ação</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Módulo</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Usuário</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 8px', color: 'var(--text-main)' }}>{new Date(customer.createdAt).toLocaleString('pt-BR')}</td>
                <td style={{ padding: '12px 8px', color: '#22c55e', fontWeight: 500 }}>Criação</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Cadastro</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-main)' }}>Sistema</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Cliente cadastrado no sistema.</td>
              </tr>
              {customer.locations.length > 0 && (
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 8px', color: 'var(--text-main)' }}>{new Date(new Date(customer.createdAt).getTime() + 5000).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '12px 8px', color: '#3b82f6', fontWeight: 500 }}>Adição</td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Endereço</td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-main)' }}>Sistema</td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Endereço de instalação vinculado ({customer.locations[0].cep}).</td>
                </tr>
              )}
              {/* Linha de exemplo para simular auditoria */}
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 8px', color: 'var(--text-main)' }}>{new Date().toLocaleString('pt-BR')}</td>
                <td style={{ padding: '12px 8px', color: '#8b5cf6', fontWeight: 500 }}>Visualização</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Cadastro</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-main)' }}>Atendente Atual</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Ficha de cadastro acessada.</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .sgp-input {
          background: var(--bg-color);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 10px 14px;
          color: var(--text-main);
          font-size: 14px;
          outline: none;
          width: 100%;
          transition: all 0.2s ease;
        }
        .sgp-input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(217, 70, 239, 0.15);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
