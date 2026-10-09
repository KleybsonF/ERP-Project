"use client";

import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { Search, Printer, Save, MapPin, Phone, User, Building2 } from "lucide-react";
import { updateCustomer, getCondominiums, createCondominium } from "@/app/actions/clientes";

type Customer = {
  id: number;
  name: string;
  type?: string;
  document: string | null;
  phone: string | null;
  createdAt: string | Date;
  isHidden: boolean;
  locations: any[];
};

export default function ClienteDetailClient({ customer }: { customer: Customer }) {
  const [activePrimaryTab, setActivePrimaryTab] = useState("Cadastro");
  const [activeSecondaryTab, setActiveSecondaryTab] = useState("Dados do Cliente");
  
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [condos, setCondos] = useState<any[]>([]);
  
  const [showCondoModal, setShowCondoModal] = useState(false);
  const [newCondoName, setNewCondoName] = useState("");

  useEffect(() => {
    getCondominiums().then(setCondos);
  }, []);

  // Form states based on real DB fields
  const [name, setName] = useState(customer.name);
  const [document, setDocument] = useState(customer.document || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const [type, setType] = useState(customer.type || (customer.document ? (customer.document.length > 14 ? "PJ" : "PF") : "PF"));
  const [locations, setLocations] = useState<any[]>(customer.locations || []);

  const typeLabel = type;

  const primaryTabs = [
    "Cadastro", "Contratos", "Financeiro", "Comodato / Venda", "Ocorrências", 
    "Extrato de Tráfego", "Documentos", "Aditivos", "Anotações", "Variáveis", "Benefícios", "Assinaturas Eletrônicas", "Histórico"
  ];

  const secondaryTabs = ["Dados do Cliente", "Contatos", "Outros"];

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 5) {
      value = value.substring(0, 5) + "-" + value.substring(5, 8);
    }
    const newLocs = [...locations];
    newLocs[index].cep = value;
    setLocations(newLocs);
  };

  const fetchCep = async (index: number) => {
    const cep = locations[index].cep?.replace(/\D/g, "") || "";
    if (cep.length !== 8) {
      alert("CEP inválido. O CEP deve conter 8 dígitos.");
      return;
    }
    
    if (window.confirm("Deseja preencher as informações de endereço automaticamente com base neste CEP?")) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          alert("CEP não encontrado.");
          return;
        }

        const newLocs = [...locations];
        newLocs[index].street = data.logradouro || newLocs[index].street;
        newLocs[index].neighborhood = data.bairro || newLocs[index].neighborhood;
        newLocs[index].city = data.localidade || newLocs[index].city;
        newLocs[index].state = data.uf || newLocs[index].state;
        newLocs[index].codigoMun = data.ibge || newLocs[index].codigoMun;
        // Optionally update complemento if it comes from viacep and it's not empty, but usually it's best to leave it for the user
        
        setLocations(newLocs);
      } catch (error) {
        alert("Erro ao buscar o CEP. Tente novamente.");
      }
    }
  };

  const handleSaveNewCondo = async () => {
    if (newCondoName.trim()) {
      const newCondo = await createCondominium(newCondoName.trim());
      setCondos([...condos, newCondo]);
      setNewCondoName("");
      setShowCondoModal(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    startTransition(async () => {
      await updateCustomer(customer.id, {
        name,
        type,
        document,
        phone,
        locations: locations.map(loc => ({
          id: loc.id,
          cep: loc.cep,
          street: loc.street,
          neighborhood: loc.neighborhood,
          city: loc.city,
          state: loc.state
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
        borderRadius: '8px', 
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            Cliente ID: <strong style={{ color: 'var(--text-main)' }}>{customer.id}</strong>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Nome/Razão Social: <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{customer.name}</strong>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            CPF/CNPJ: <strong style={{ color: 'var(--text-main)' }}>{customer.document || "-"}</strong>
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Contratos: <span style={{ color: '#22c55e', fontWeight: 600 }}>Ativos: 1</span> | 
            <span style={{ color: '#ef4444', fontWeight: 600 }}> Ativos Vel. Red.: 0</span> | 
            <span style={{ color: '#eab308', fontWeight: 600 }}> Inativos: 0</span> | 
            <span style={{ color: '#ef4444', fontWeight: 600 }}> Suspensos: 0</span> | 
            <span style={{ color: 'var(--text-muted)' }}> Cancelados: 0</span> | 
            <span style={{ color: 'var(--text-muted)' }}> Inviabilizados: 0</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            Data de Cadastro: <span style={{ color: 'var(--text-main)' }}>{new Date(customer.createdAt).toLocaleString('pt-BR')}</span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Tipo de Cliente: <span style={{ color: 'var(--text-main)' }}>{typeLabel === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}</span>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Serviços: <span style={{ color: '#22c55e', fontWeight: 600 }}> 0 Online </span> | 
            <span style={{ color: '#ef4444', fontWeight: 600 }}> 1 Offline</span>
          </div>
        </div>
      </div>

      {/* Primary Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px',
        background: 'var(--bg-color-soft)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        padding: '4px 8px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        scrollbarWidth: 'none' // For Firefox
      }} className="hide-scrollbar">
        {primaryTabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActivePrimaryTab(tab)}
            style={{
              background: activePrimaryTab === tab ? 'transparent' : 'transparent',
              border: activePrimaryTab === tab ? '1px solid var(--primary-color)' : '1px solid transparent',
              borderRadius: '20px',
              padding: '6px 16px',
              color: activePrimaryTab === tab ? 'var(--text-main)' : 'var(--text-secondary)',
              fontWeight: activePrimaryTab === tab ? 600 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activePrimaryTab === tab ? 'inset 0 0 10px rgba(217, 70, 239, 0.1)' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Secondary Tabs */}
      {activePrimaryTab === "Cadastro" && (
        <div style={{ 
          display: 'flex', 
          gap: '4px',
          background: 'var(--bg-color-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          padding: '4px 8px'
        }}>
          {secondaryTabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveSecondaryTab(tab)}
              style={{
                background: 'transparent',
                border: activeSecondaryTab === tab ? '1px solid var(--primary-color)' : '1px solid transparent',
                borderRadius: '20px',
                padding: '6px 16px',
                color: activeSecondaryTab === tab ? 'var(--text-main)' : 'var(--text-secondary)',
                fontWeight: activeSecondaryTab === tab ? 600 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Data Form Area */}
      {activePrimaryTab === "Cadastro" && activeSecondaryTab === "Dados do Cliente" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
          
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
              Dados
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Nome / Razão Social <span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="sgp-input" 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Tipo de Cliente <span style={{color: '#ef4444'}}>*</span></label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value)} 
                    className="sgp-input"
                  >
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>CPF / CNPJ <span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="text" 
                    value={document} 
                    onChange={e => setDocument(e.target.value)} 
                    className="sgp-input" 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Telefone Principal</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    className="sgp-input" 
                  />
                </div>
              </div>

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
                onClick={() => setLocations([...locations, { id: 0, cep: "", street: "", neighborhood: "", city: "", state: "", contacts: [] }])}
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
                  {locations.length > 1 && (
                    <h5 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--primary-color)', fontWeight: 600 }}>Endereço {index + 1}</h5>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>CEP:*</label>
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
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Endereço:*</label>
                    <input type="text" value={loc.street} onChange={e => { const newLocs = [...locations]; newLocs[index].street = e.target.value; setLocations(newLocs); }} className="sgp-input" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Número:</label>
                    <input type="text" value={loc.numero || ''} onChange={e => { const newLocs = [...locations]; newLocs[index].numero = e.target.value; setLocations(newLocs); }} className="sgp-input" style={{ width: '200px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Bairro:*</label>
                    <input type="text" value={loc.neighborhood} onChange={e => { const newLocs = [...locations]; newLocs[index].neighborhood = e.target.value; setLocations(newLocs); }} className="sgp-input" style={{ width: '300px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Cidade:*</label>
                    <input type="text" value={loc.city} onChange={e => { const newLocs = [...locations]; newLocs[index].city = e.target.value; setLocations(newLocs); }} className="sgp-input" style={{ width: '300px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>UF:*</label>
                    <select value={loc.state} onChange={e => { const newLocs = [...locations]; newLocs[index].state = e.target.value; setLocations(newLocs); }} className="sgp-input" style={{ width: '100px' }}>
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        list={`condos-list-${index}`} 
                        value={loc.condominioName || ''} 
                        onChange={e => { 
                          const newLocs = [...locations]; 
                          newLocs[index].condominioName = e.target.value; 
                          const found = condos.find(c => c.name === e.target.value);
                          newLocs[index].condominiumId = found ? found.id : null;
                          setLocations(newLocs); 
                        }} 
                        className="sgp-input" 
                        style={{ width: '300px' }} 
                        placeholder="Pesquisar condomínio..."
                      />
                      <datalist id={`condos-list-${index}`}>
                        {condos.map(c => (
                          <option key={c.id} value={c.name} />
                        ))}
                      </datalist>
                      <button 
                        type="button"
                        onClick={() => setShowCondoModal(true)}
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

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Código Mun.</label>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Código Município IBGE.</span>
                    </div>
                    <input type="text" value={loc.codigoMun || ''} onChange={e => { const newLocs = [...locations]; newLocs[index].codigoMun = e.target.value; setLocations(newLocs); }} className="sgp-input" style={{ width: '200px' }} />
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

      {/* Modal Novo Condomínio */}
      {showCondoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#0a0d14', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '24px', width: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)', fontSize: '16px' }}>Adicionar Novo Condomínio</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nome do Condomínio</label>
              <input 
                type="text" 
                value={newCondoName} 
                onChange={e => setNewCondoName(e.target.value)}
                className="sgp-input" 
                placeholder="Ex: Residencial Alphaville"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => {
                  setShowCondoModal(false);
                  setNewCondoName("");
                }} 
                style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveNewCondo} 
                style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Salvar Condomínio
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
