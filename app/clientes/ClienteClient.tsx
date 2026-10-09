"use client";

import { useState } from "react";
import Link from "next/link";
import { createCustomer, updateCustomer, hideCustomer, unhideCustomer } from "@/app/actions/clientes";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Building2, MapPin, Plus, Trash2, User, Phone, Filter, Download, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { formatPhone } from "@/app/lib/utils";

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
  contacts?: { id: number; name: string; type: string; value: string }[];
  locations: { 
    id: number; 
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
    contact: string | null;
    contacts: { id: number; name: string; phone: string | null }[];
  }[];
};

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function ClienteClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [clientType, setClientType] = useState<'PF' | 'PJ'>('PJ');
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  
  const [locations, setLocations] = useState<any[]>([{ id: undefined, cep: "", street: "", neighborhood: "", city: "", state: "RN", contacts: [{ name: "", phone: "" }] }]);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterDocument, setFilterDocument] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterStreet, setFilterStreet] = useState("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ativos" | "ocultos" | "todos">("ativos");

  const [filterType, setFilterType] = useState<"todos" | "PF" | "PJ">("todos");
  const [filterNomeSocialFantasia, setFilterNomeSocialFantasia] = useState("");
  const [filterResponsavel, setFilterResponsavel] = useState("");
  const [filterProfissao, setFilterProfissao] = useState("");

  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleClearFilters = () => {
    setFilterName("");
    setFilterDocument("");
    setFilterPhone("");
    setFilterStreet("");
    setFilterNeighborhood("");
    setFilterCity("");
    setFilterState("");
    setFilterStatus("ativos");
    setFilterType("todos");
    setFilterNomeSocialFantasia("");
    setFilterResponsavel("");
    setFilterProfissao("");
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const handleCepBlur = async (index: number) => {
    const loc = locations[index];
    if (!loc.cep) return;
    const cleanCep = loc.cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          const newLocs = [...locations];
          newLocs[index].street = data.logradouro || "";
          newLocs[index].neighborhood = data.bairro || "";
          newLocs[index].city = data.localidade || "";
          if (data.uf) newLocs[index].state = data.uf;
          setLocations(newLocs);
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      }
    }
  };

  const addLocation = () => setLocations([...locations, { id: undefined, cep: "", street: "", neighborhood: "", city: "", state: "RN", contacts: [{ name: "", phone: "" }] }]);
  const updateLocation = (index: number, field: string, value: string) => {
    const newLocs = [...locations];
    newLocs[index][field] = value;
    setLocations(newLocs);
  };
  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const addContact = (locIndex: number) => {
    const newLocs = [...locations];
    newLocs[locIndex].contacts.push({ name: "", phone: "" });
    setLocations(newLocs);
  };
  const updateContact = (locIndex: number, contactIndex: number, field: 'name' | 'phone', value: string) => {
    const newLocs = [...locations];
    newLocs[locIndex].contacts[contactIndex][field] = value;
    setLocations(newLocs);
  };
  const removeContact = (locIndex: number, contactIndex: number) => {
    const newLocs = [...locations];
    newLocs[locIndex].contacts = newLocs[locIndex].contacts.filter((_: any, i: number) => i !== contactIndex);
    setLocations(newLocs);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formattedLocs = locations.map(loc => ({
        ...loc,
        contacts: loc.contacts.filter((c: any) => c.name.trim() !== "")
      }));
      await createCustomer({ name, type: clientType, document, phone, locations: formattedLocs });
      setName(""); setDocument(""); setPhone(""); 
      setLocations([{ id: undefined, cep: "", street: "", neighborhood: "", city: "", state: "RN", contacts: [{ name: "", phone: "" }] }]);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    try {
      await updateCustomer(selectedCustomer.id, { name, type: clientType, document, phone, locations });
      setSelectedCustomer(null);
      setName(""); setDocument(""); setPhone(""); 
      setLocations([{ id: undefined, cep: "", street: "", neighborhood: "", city: "", state: "RN", contacts: [{ name: "", phone: "" }] }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHideCustomer = async () => {
    if (!selectedCustomer) return;
    if (confirm("Tem certeza que deseja ocultar este cliente? Ele não aparecerá mais na listagem principal.")) {
      await hideCustomer(selectedCustomer.id);
      setSelectedCustomer(null);
    }
  };

  const handleUnhideCustomer = async () => {
    if (!selectedCustomer) return;
    if (confirm("Deseja reativar este cliente para que ele volte a aparecer nas listagens principais?")) {
      await unhideCustomer(selectedCustomer.id);
      setSelectedCustomer(null);
    }
  };

  const openEditModal = (c: Customer) => {
    setSelectedCustomer(c);
    setClientType(c.type as 'PF' | 'PJ' || (c.document?.length === 14 ? 'PF' : 'PJ'));
    setName(c.name);
    setDocument(c.document || "");
    setPhone(formatPhone(c.phone || ""));
    if (c.locations && c.locations.length > 0) {
      setLocations(c.locations.map(loc => ({
        id: loc.id,
        cep: loc.cep || "",
        street: loc.street || "",
        neighborhood: loc.neighborhood || "",
        city: loc.city || "",
        state: loc.state || "RN",
        contacts: loc.contacts && loc.contacts.length > 0 ? loc.contacts.map((contact: any) => ({ ...contact, phone: formatPhone(contact.phone || "") })) : [{ name: "", phone: "" }]
      })));
    } else {
      setLocations([{ id: undefined, cep: "", street: "", neighborhood: "", city: "", state: "RN", contacts: [{ name: "", phone: "" }] }]);
    }
  };

  const filteredCustomers = initialCustomers.filter(c => {
    if (filterStatus === "ativos" && c.isHidden) return false;
    if (filterStatus === "ocultos" && !c.isHidden) return false;

    if (filterType !== "todos") {
      const isPF = c.type === "PF" || (c.document && c.document.length === 14);
      if (filterType === "PF" && !isPF) return false;
      if (filterType === "PJ" && isPF) return false;
    }
    
    if (filterName && !c.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterDocument && (!c.document || !c.document.includes(filterDocument))) return false;
    
    if (filterPhone) {
      let found = false;
      if (c.phone && c.phone.includes(filterPhone)) found = true;
      if (c.contacts && c.contacts.length > 0) {
        if (c.contacts.some((contact: any) => contact.value && contact.value.includes(filterPhone))) found = true;
      }
      if (!found) return false;
    }

    if (filterNomeSocialFantasia) {
      const nsf = ((c.nomeSocial || "") + " " + (c.nomeFantasia || "")).toLowerCase();
      if (!nsf.includes(filterNomeSocialFantasia.toLowerCase())) return false;
    }

    if (filterResponsavel && (!c.responsavel || !c.responsavel.toLowerCase().includes(filterResponsavel.toLowerCase()))) return false;
    if (filterProfissao && (!c.profissao || !c.profissao.toLowerCase().includes(filterProfissao.toLowerCase()))) return false;

    const mainLoc = c.locations[0];
    if (filterNeighborhood && (!mainLoc || !mainLoc.neighborhood.toLowerCase().includes(filterNeighborhood.toLowerCase()))) return false;
    if (filterStreet && (!mainLoc || !mainLoc.street.toLowerCase().includes(filterStreet.toLowerCase()))) return false;
    if (filterCity && (!mainLoc || !mainLoc.city.toLowerCase().includes(filterCity.toLowerCase()))) return false;
    if (filterState && (!mainLoc || mainLoc.state.toLowerCase() !== filterState.toLowerCase())) return false;

    if (filterStartDate) {
      const start = new Date(filterStartDate + "T00:00:00.000Z");
      if (new Date(c.createdAt) < start) return false;
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate + "T23:59:59.999Z");
      if (new Date(c.createdAt) > end) return false;
    }

    return true;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const mainLocA = a.locations[0];
    const mainLocB = b.locations[0];

    let valA: any = "";
    let valB: any = "";

    switch (sortColumn) {
      case "id":
        valA = a.id; valB = b.id; break;
      case "name":
        valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
      case "type":
        valA = a.document && a.document.length > 14 ? "PJ" : "PF";
        valB = b.document && b.document.length > 14 ? "PJ" : "PF";
        if (!a.document) valA = "";
        if (!b.document) valB = "";
        break;
      case "phone":
        valA = a.phone || ""; valB = b.phone || ""; break;
      case "street":
        valA = mainLocA?.street.toLowerCase() || ""; valB = mainLocB?.street.toLowerCase() || ""; break;
      case "neighborhood":
        valA = mainLocA?.neighborhood.toLowerCase() || ""; valB = mainLocB?.neighborhood.toLowerCase() || ""; break;
      case "city":
        valA = mainLocA?.city.toLowerCase() || ""; valB = mainLocB?.city.toLowerCase() || ""; break;
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const paginatedCustomers = sortedCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Relatório de Clientes", 14, 15);
    
    const tableColumn = [
      "ID", "Nome", "Tipo", "Doc", "Contatos", 
      "Endereços", "Data Cadastro", "Infos Extras"
    ];
    const tableRows: any[] = [];

    sortedCustomers.forEach(c => {
      const typeLabel = c.type || (c.document ? (c.document.length > 14 ? "PJ" : "PF") : "-");
      
      const addresses = c.locations.length > 0 ? c.locations.map(l => `${l.street}, ${l.neighborhood}, ${l.city}-${l.state}`).join("\n") : "-";
      
      const allContacts = [];
      if (c.phone) allContacts.push(c.phone);
      if (c.contacts && c.contacts.length > 0) {
        c.contacts.forEach(ct => allContacts.push(ct.value));
      }
      const contactsStr = allContacts.length > 0 ? allContacts.join("\n") : "-";

      const extras = [];
      if (c.nomeSocial) extras.push(`N. Social: ${c.nomeSocial}`);
      if (c.dataNascimento) extras.push(`Nasc: ${c.dataNascimento}`);
      if (c.rg) extras.push(`RG: ${c.rg}`);
      if (c.profissao) extras.push(`Profissão: ${c.profissao}`);
      if (c.nomeFantasia) extras.push(`Fantasia: ${c.nomeFantasia}`);
      if (c.responsavel) extras.push(`Resp: ${c.responsavel}`);
      if (c.cpfResponsavel) extras.push(`CPF Resp: ${c.cpfResponsavel}`);
      if (c.inscricaoEstadual) extras.push(`IE: ${c.inscricaoEstadual}`);

      const row = [
        c.id,
        c.name,
        typeLabel,
        c.document || "-",
        contactsStr,
        addresses,
        new Date(c.createdAt).toLocaleDateString('pt-BR'),
        extras.length > 0 ? extras.join("\n") : "-"
      ];
      tableRows.push(row);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] }
    });
    
    doc.save("clientes.pdf");
  };

  const exportExcel = () => {
    const data = sortedCustomers.map(c => {
      const typeLabel = c.type || (c.document ? (c.document.length > 14 ? "PJ" : "PF") : "-");
      const statusLabel = c.isHidden ? "Oculto" : "Ativo";
      
      const addresses = c.locations.length > 0 ? c.locations.map(l => `${l.street}, ${l.neighborhood}, ${l.city}-${l.state}`).join(" | ") : "-";
      
      // Combinar `phone` legado com os contatos novos
      const allContacts = [];
      if (c.phone) allContacts.push(c.phone);
      if (c.contacts && c.contacts.length > 0) {
        c.contacts.forEach(ct => allContacts.push(ct.value));
      }
      const contactsStr = allContacts.length > 0 ? allContacts.join(" | ") : "-";

      return {
        ID: c.id,
        Nome_RazaoSocial: c.name,
        Tipo: typeLabel,
        Documento: c.document || "-",
        Contatos: contactsStr,
        Status: statusLabel,
        Enderecos: addresses,
        DataCadastro: new Date(c.createdAt).toLocaleDateString('pt-BR'),
        // PF Fields
        NomeSocial: c.nomeSocial || "-",
        DataNascimento: c.dataNascimento || "-",
        RG: c.rg || "-",
        RGEmissor: c.rgEmissor || "-",
        RGDataExp: c.rgDataExp || "-",
        NomePai: c.nomePai || "-",
        NomeMae: c.nomeMae || "-",
        Nacionalidade: c.nacionalidade || "-",
        Naturalidade: c.naturalidade || "-",
        EstadoCivil: c.estadoCivil || "-",
        Sexo: c.sexo || "-",
        Profissao: c.profissao || "-",
        // PJ Fields
        NomeFantasia: c.nomeFantasia || "-",
        Responsavel: c.responsavel || "-",
        CPFResponsavel: c.cpfResponsavel || "-",
        DataFundacao: c.dataFundacao || "-",
        InscricaoMunicipal: c.inscricaoMunicipal || "-",
        // Common
        InscricaoEstadual: c.inscricaoEstadual || "-"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
    XLSX.writeFile(workbook, "clientes.xlsx");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div className="flex-between">
        <h1 className="page-title" style={{ margin: 0 }}>Gestão de Clientes</h1>
        <button 
          className="btn-primary" 
          onClick={() => setIsFilterModalOpen(true)}
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <Filter size={18} /> Filtrar
        </button>
      </div>

      {/* Modal de Filtros */}
      {isFilterModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '700px' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="panel-header" style={{ margin: 0 }}><Filter size={20} className="text-primary" /> Filtros de Busca</h3>
              <button onClick={() => setIsFilterModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>&times;</button>
            </div>
            
            <div className="form-grid mb-6">
              <div className="input-group">
                <label>Itens por Página</label>
                <select 
                  value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>
              <div className="input-group">
                <label>Nome / Empresa</label>
                <input 
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Tipo de Cliente</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value as any)}>
                  <option value="todos">Todos</option>
                  <option value="PF">Pessoa Física</option>
                  <option value="PJ">Pessoa Jurídica</option>
                </select>
              </div>
              <div className="input-group">
                <label>CPF / CNPJ</label>
                <input 
                  value={filterDocument}
                  onChange={e => setFilterDocument(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Nome Social / Fantasia</label>
                <input 
                  value={filterNomeSocialFantasia}
                  onChange={e => setFilterNomeSocialFantasia(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Responsável</label>
                <input 
                  value={filterResponsavel}
                  onChange={e => setFilterResponsavel(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Profissão</label>
                <input 
                  value={filterProfissao}
                  onChange={e => setFilterProfissao(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Telefone</label>
                <input 
                  value={filterPhone}
                  onChange={e => setFilterPhone(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Rua</label>
                <input 
                  value={filterStreet}
                  onChange={e => setFilterStreet(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Bairro</label>
                <input 
                  value={filterNeighborhood}
                  onChange={e => setFilterNeighborhood(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Cidade</label>
                <input 
                  value={filterCity}
                  onChange={e => setFilterCity(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Estado</label>
                <select value={filterState} onChange={e => setFilterState(e.target.value)}>
                  <option value="">Todos</option>
                  {BRAZILIAN_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Data Início</label>
                <input 
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Data Fim</label>
                <input 
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Status</label>
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value as any)}
                >
                  <option value="ativos">Ativos</option>
                  <option value="ocultos">Ocultos</option>
                  <option value="todos">Todos</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button onClick={handleClearFilters} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Limpar</button>
              <button onClick={() => setIsFilterModalOpen(false)} className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--secondary-color), #d946ef)' }}>
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Novo Cliente */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="panel-header" style={{ margin: 0 }}><Building2 size={20} className="text-primary" /> Cadastrar Novo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(15, 23, 42, 0.6)', padding: '6px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--glass-border)' }}>
              <button 
                type="button"
                onClick={() => setClientType('PJ')}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  fontSize: '14px',
                  background: clientType === 'PJ' ? 'var(--primary-color)' : 'transparent',
                  color: clientType === 'PJ' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease-in-out'
                }}>
                Pessoa Jurídica (PJ)
              </button>
              <button 
                type="button"
                onClick={() => setClientType('PF')}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  fontSize: '14px',
                  background: clientType === 'PF' ? 'var(--primary-color)' : 'transparent',
                  color: clientType === 'PF' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease-in-out'
                }}>
                Pessoa Física (PF)
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div className="form-grid mb-6">
                <div className="input-group">
                  <label>{clientType === 'PJ' ? 'Nome da Empresa' : 'Nome Completo'}</label>
                  <input placeholder={clientType === 'PJ' ? "Ex: Tech Solutions" : "Ex: João da Silva"} value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>{clientType === 'PJ' ? 'CNPJ' : 'CPF'}</label>
                  <input placeholder={clientType === 'PJ' ? "00.000.000/0000-00" : "000.000.000-00"} value={document} onChange={e => setDocument(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Telefone</label>
                  <input placeholder="(11) 90000-0000" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Endereços</h4>
                <button type="button" onClick={addLocation} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                  <Plus size={14} /> Adicionar Endereço
                </button>
              </div>

              {locations.map((loc, locIndex) => (
                <div key={locIndex} style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                  <div className="flex-between" style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Endereço {locIndex + 1}</div>
                    {locations.length > 1 && (
                      <button type="button" onClick={() => removeLocation(locIndex)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="form-grid mb-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
                    <div className="input-group">
                      <label>CEP</label>
                      <input placeholder="00000-000" value={loc.cep} onChange={e => updateLocation(locIndex, 'cep', e.target.value)} onBlur={() => handleCepBlur(locIndex)} required />
                    </div>
                    <div className="input-group">
                      <label>Rua</label>
                      <input placeholder="Ex: Av. Paulista, 1000" value={loc.street} onChange={e => updateLocation(locIndex, 'street', e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-grid mb-6" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div className="input-group">
                      <label>Bairro</label>
                      <input placeholder="Ex: Bela Vista" value={loc.neighborhood} onChange={e => updateLocation(locIndex, 'neighborhood', e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label>Cidade</label>
                      <input placeholder="Ex: São Paulo" value={loc.city} onChange={e => updateLocation(locIndex, 'city', e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label>Estado</label>
                      <select value={loc.state} onChange={e => updateLocation(locIndex, 'state', e.target.value)} required>
                        {BRAZILIAN_STATES.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex-between" style={{ marginBottom: '12px' }}>
                      <label style={{ margin: 0 }}>Contatos no Local (Opcional)</label>
                      <button type="button" onClick={() => addContact(locIndex)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                        <Plus size={14} /> Adicionar Contato
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {loc.contacts.map((contact: any, contactIndex: number) => (
                        <div key={contactIndex} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input placeholder="Nome" value={contact.name} onChange={e => updateContact(locIndex, contactIndex, 'name', e.target.value)} style={{ paddingLeft: '32px', width: '100%', fontSize: '13px' }} />
                          </div>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <Phone size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input placeholder="Telefone" value={contact.phone} onChange={e => updateContact(locIndex, contactIndex, 'phone', formatPhone(e.target.value))} style={{ paddingLeft: '32px', width: '100%', fontSize: '13px' }} />
                          </div>
                          {loc.contacts.length > 1 && (
                            <button type="button" onClick={() => removeContact(locIndex, contactIndex)} style={{ background: 'none', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button className="btn-primary" type="submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, var(--secondary-color), #d946ef)' }}>
                  <Plus size={18}/> {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Cliente */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="panel-header" style={{ margin: 0 }}><Building2 size={20} className="text-primary" /> Editar Cliente</h3>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
              <button 
                type="button"
                onClick={() => setClientType('PJ')}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  fontSize: '14px',
                  background: clientType === 'PJ' ? 'var(--primary-color)' : 'transparent',
                  color: clientType === 'PJ' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease-in-out'
                }}>
                Pessoa Jurídica (PJ)
              </button>
              <button 
                type="button"
                onClick={() => setClientType('PF')}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  fontSize: '14px',
                  background: clientType === 'PF' ? 'var(--primary-color)' : 'transparent',
                  color: clientType === 'PF' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease-in-out'
                }}>
                Pessoa Física (PF)
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer}>
              <div className="form-grid mb-6">
                <div className="input-group">
                  <label>{clientType === 'PJ' ? 'Nome da Empresa' : 'Nome Completo'}</label>
                  <input placeholder={clientType === 'PJ' ? "Ex: Tech Solutions" : "Ex: João da Silva"} value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>{clientType === 'PJ' ? 'CNPJ' : 'CPF'}</label>
                  <input placeholder={clientType === 'PJ' ? "00.000.000/0000-00" : "000.000.000-00"} value={document} onChange={e => setDocument(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Telefone</label>
                  <input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Endereços</h4>
                <button type="button" onClick={addLocation} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                  <Plus size={14} /> Adicionar Endereço
                </button>
              </div>

              {locations.map((loc, locIndex) => (
                <div key={locIndex} style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                  <div className="flex-between" style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Endereço {locIndex + 1}</div>
                    {locations.length > 1 && (
                      <button type="button" onClick={() => removeLocation(locIndex)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="form-grid mb-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
                    <div className="input-group">
                      <label>CEP</label>
                      <input placeholder="00000-000" value={loc.cep} onChange={e => updateLocation(locIndex, 'cep', e.target.value)} onBlur={() => handleCepBlur(locIndex)} />
                    </div>
                    <div className="input-group">
                      <label>Rua</label>
                      <input placeholder="Ex: Av. Paulista, 1000" value={loc.street} onChange={e => updateLocation(locIndex, 'street', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-grid mb-6" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div className="input-group">
                      <label>Bairro</label>
                      <input placeholder="Ex: Bela Vista" value={loc.neighborhood} onChange={e => updateLocation(locIndex, 'neighborhood', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Cidade</label>
                      <input placeholder="Ex: São Paulo" value={loc.city} onChange={e => updateLocation(locIndex, 'city', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Estado</label>
                      <select value={loc.state} onChange={e => updateLocation(locIndex, 'state', e.target.value)}>
                        {BRAZILIAN_STATES.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
                {selectedCustomer.isHidden ? (
                  <button type="button" onClick={handleUnhideCustomer} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Reativar Cliente</button>
                ) : (
                  <button type="button" onClick={handleHideCustomer} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Ocultar Cliente</button>
                )}
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button type="button" onClick={() => setSelectedCustomer(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                  <button className="btn-primary" type="submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, var(--secondary-color), #d946ef)' }}>
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="glass-panel">
        <div className="flex-between panel-header" style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Lista de Clientes</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" onClick={exportPDF} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <Download size={16} /> PDF
            </button>
            <button type="button" onClick={exportExcel} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <Download size={16} /> Excel
            </button>
            <Link href="/clientes/novo" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <Plus size={18} /> Cadastrar Cliente
            </Link>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th onClick={() => handleSort('id')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  ID {sortColumn === 'id' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th onClick={() => handleSort('name')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Nome / Razão Social {sortColumn === 'name' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th onClick={() => handleSort('type')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Tipo {sortColumn === 'type' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  CPF / CNPJ
                </th>
                <th onClick={() => handleSort('phone')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Contato Principal {sortColumn === 'phone' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Localidade
                </th>
                <th onClick={() => handleSort('createdAt')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Data Cadastro {sortColumn === 'createdAt' ? (sortDirection === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/>) : <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.3 }}/>}
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {
                sortedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                paginatedCustomers.map(c => {
                  const mainLocation = c.locations[0];
                  const typeLabel = c.type || (c.document ? (c.document.length > 14 ? "PJ" : "PF") : "-");
                  const isPJ = typeLabel === "PJ";
                  const mainContact = c.phone || (c.contacts && c.contacts.length > 0 ? c.contacts[0].value : "-");

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'default' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>#{c.id}</td>
                      <td style={{ padding: '16px', fontWeight: 500 }}>
                        {c.name}
                        {c.isHidden && <span className="badge" style={{ marginLeft: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Oculto</span>}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {typeLabel !== "-" ? <span className="badge badge-neutral">{typeLabel}</span> : <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{c.document || '-'}</td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{mainContact}</td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                        {mainLocation ? (mainLocation.city + (mainLocation.state ? ` / ${mainLocation.state}` : '')) : '-'}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                      <Link 
                        href={`/clientes/${c.id}`}
                        style={{ 
                          display: 'inline-block',
                          background: 'rgba(217, 70, 239, 0.15)', 
                          color: '#d946ef', 
                          border: '1px solid rgba(217, 70, 239, 0.3)', 
                          padding: '6px 16px', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          fontSize: '13px', 
                          fontWeight: 600,
                          transition: 'all 0.2s',
                          textDecoration: 'none'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(217, 70, 239, 0.25)' }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(217, 70, 239, 0.15)' }}
                      >
                        Ver Mais
                      </Link>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Controles de Paginação */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Mostrando de {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, sortedCustomers.length)} de {sortedCustomers.length} registros
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'var(--bg-color-soft)',
                  border: '1px solid var(--glass-border)',
                  color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Anterior
              </button>
              
              <div style={{ padding: '6px 12px', background: 'var(--primary-color)', color: 'white', borderRadius: '6px', fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'var(--bg-color-soft)',
                  border: '1px solid var(--glass-border)',
                  color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
