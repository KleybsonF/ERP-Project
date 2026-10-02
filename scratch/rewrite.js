const fs = require('fs');

const path = 'app/clientes/ClienteClient.tsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Replace State Declarations & Handlers
content = content.replace(
  /const \[cep, setCep\] = useState\(""\);\s*const \[street, setStreet\] = useState\(""\);\s*const \[neighborhood, setNeighborhood\] = useState\(""\);\s*const \[city, setCity\] = useState\(""\);\s*const \[stateValue, setStateValue\] = useState\("RN"\);\s*const \[contacts, setContacts\] = useState\(\[\{ name: "", phone: "" \}\]\);/,
  `const [locations, setLocations] = useState<any[]>([{ id: undefined, cep: "", street: "", neighborhood: "", city: "", state: "RN", contacts: [{ name: "", phone: "" }] }]);`
);

content = content.replace(
  /const handleCepBlur = async \(\) => \{[\s\S]*?\};\s*const addContact = \(\) => setContacts\(\[\.\.\.contacts, \{ name: "", phone: "" \}\]\);\s*const updateContact = \(index: number, field: 'name' \| 'phone', value: string\) => \{[\s\S]*?\};\s*const removeContact = \(index: number\) => \{[\s\S]*?\};/,
  `const handleCepBlur = async (index: number) => {
    const loc = locations[index];
    if (!loc.cep) return;
    const cleanCep = loc.cep.replace(/\\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(\`https://viacep.com.br/ws/\${cleanCep}/json/\`);
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
  };`
);

// 2. Replace handleCreateCustomer
content = content.replace(
  /const handleCreateCustomer = async \(e: React.FormEvent\) => \{[\s\S]*?setIsSubmitting\(false\);\s*\}\s*\};/,
  `const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formattedLocs = locations.map(loc => ({
        ...loc,
        contacts: loc.contacts.filter((c: any) => c.name.trim() !== "")
      }));
      await createCustomer({ name, document, phone, locations: formattedLocs });
      setName(""); setDocument(""); setPhone(""); 
      setLocations([{ id: undefined, cep: "", street: "", neighborhood: "", city: "", state: "RN", contacts: [{ name: "", phone: "" }] }]);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };`
);

// 3. Replace handleUpdateCustomer
content = content.replace(
  /const handleUpdateCustomer = async \(e: React.FormEvent\) => \{[\s\S]*?setIsSubmitting\(false\);\s*\}\s*\};/,
  `const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    try {
      await updateCustomer(selectedCustomer.id, { name, document, phone, locations });
      setSelectedCustomer(null);
      setName(""); setDocument(""); setPhone(""); 
      setLocations([{ id: undefined, cep: "", street: "", neighborhood: "", city: "", state: "RN", contacts: [{ name: "", phone: "" }] }]);
    } finally {
      setIsSubmitting(false);
    }
  };`
);

// 4. Replace openEditModal
content = content.replace(
  /const openEditModal = \(c: Customer\) => \{[\s\S]*?setStateValue\("RN"\);\s*\}\s*\};/,
  `const openEditModal = (c: Customer) => {
    setSelectedCustomer(c);
    setClientType(c.document?.length === 14 ? 'PF' : 'PJ');
    setName(c.name);
    setDocument(c.document || "");
    setPhone(c.phone || "");
    if (c.locations && c.locations.length > 0) {
      setLocations(c.locations.map(loc => ({
        id: loc.id,
        cep: loc.cep || "",
        street: loc.street || "",
        neighborhood: loc.neighborhood || "",
        city: loc.city || "",
        state: loc.state || "RN",
        contacts: loc.contacts && loc.contacts.length > 0 ? loc.contacts : [{ name: "", phone: "" }]
      })));
    } else {
      setLocations([{ id: undefined, cep: "", street: "", neighborhood: "", city: "", state: "RN", contacts: [{ name: "", phone: "" }] }]);
    }
  };`
);

// 5. Replace openNewModal clear
content = content.replace(
  /setName\(""\); setDocument\(""\); setPhone\(""\); \s*setCep\(""\); setStreet\(""\); setNeighborhood\(""\); setCity\(""\); setStateValue\("RN"\);\s*setContacts\(\[\{ name: "", phone: "" \}\]\);/,
  `setName(""); setDocument(""); setPhone(""); 
    setLocations([{ id: undefined, cep: "", street: "", neighborhood: "", city: "", state: "RN", contacts: [{ name: "", phone: "" }] }]);`
);

// 6. JSX Create Form
const createJSXOld = `<h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Endereço do Local</h4>
              
              <div className="form-grid mb-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
                <div className="input-group">
                  <label>CEP</label>
                  <input placeholder="00000-000" value={cep} onChange={e => setCep(e.target.value)} onBlur={handleCepBlur} required />
                </div>
                <div className="input-group">
                  <label>Rua</label>
                  <input placeholder="Ex: Av. Paulista, 1000 - Cj 42" value={street} onChange={e => setStreet(e.target.value)} required />
                </div>
              </div>

              <div className="form-grid mb-6" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="input-group">
                  <label>Bairro</label>
                  <input placeholder="Ex: Bela Vista" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Cidade</label>
                  <input placeholder="Ex: São Paulo" value={city} onChange={e => setCity(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Estado</label>
                  <select value={stateValue} onChange={e => setStateValue(e.target.value)} required>
                    {BRAZILIAN_STATES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex-between" style={{ marginBottom: '12px' }}>
                  <label style={{ margin: 0 }}>Contatos no Local (Opcional)</label>
                  <button type="button" onClick={addContact} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                    <Plus size={16} /> Adicionar Contato
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {contacts.map((contact, index) => (
                    <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input placeholder="Nome do Contato" value={contact.name} onChange={e => updateContact(index, 'name', e.target.value)} style={{ paddingLeft: '36px', width: '100%' }} />
                      </div>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input placeholder="Telefone do Contato" value={contact.phone} onChange={e => updateContact(index, 'phone', e.target.value)} style={{ paddingLeft: '36px', width: '100%' }} />
                      </div>
                      {contacts.length > 1 && (
                        <button type="button" onClick={() => removeContact(index)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>`;

const createJSXNew = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                      {loc.contacts.map((contact, contactIndex) => (
                        <div key={contactIndex} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input placeholder="Nome" value={contact.name} onChange={e => updateContact(locIndex, contactIndex, 'name', e.target.value)} style={{ paddingLeft: '32px', width: '100%', fontSize: '13px' }} />
                          </div>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <Phone size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input placeholder="Telefone" value={contact.phone} onChange={e => updateContact(locIndex, contactIndex, 'phone', e.target.value)} style={{ paddingLeft: '32px', width: '100%', fontSize: '13px' }} />
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
              ))}`;

// Regex correctly targeting the exact old code block
content = content.replace(/<h4 style=\{\{ marginBottom: '16px', color: 'var\(--text-secondary\)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0\.5px' \}\}>Endereço do Local<\/h4>[\s\S]*?<div style=\{\{ display: 'flex', justifyContent: 'flex-end', gap: '16px' \}\}>/, createJSXNew + '\\n              <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>');

// 7. JSX Edit Form
const editJSXOld = `<h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Endereço do Local Principal</h4>
              
              <div className="form-grid mb-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
                <div className="input-group">
                  <label>CEP</label>
                  <input value={cep} onChange={e => setCep(e.target.value)} onBlur={handleCepBlur} />
                </div>
                <div className="input-group">
                  <label>Rua</label>
                  <input value={street} onChange={e => setStreet(e.target.value)} />
                </div>
              </div>

              <div className="form-grid mb-6" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="input-group">
                  <label>Bairro</label>
                  <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Cidade</label>
                  <input value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Estado</label>
                  <select value={stateValue} onChange={e => setStateValue(e.target.value)}>
                    {BRAZILIAN_STATES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>`;

const editJSXNew = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
              ))}`;

content = content.replace(/<h4 style=\{\{ marginBottom: '16px', color: 'var\(--text-secondary\)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0\.5px' \}\}>Endereço do Local Principal<\/h4>[\s\S]*?<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' \}\}>/, editJSXNew + '\\n              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>');


fs.writeFileSync(path, content, 'utf-8');
console.log('Update Complete.');
