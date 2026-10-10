"use client";
import { Calendar, ChevronDown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function PeriodSelector({ 
  currentPeriod, currentStart, currentEnd, style, selectStyle
}: { 
  currentPeriod: string, currentStart: string, currentEnd: string, style?: React.CSSProperties, selectStyle?: React.CSSProperties
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCustom, setIsCustom] = useState(currentPeriod === 'personalizado');
  const [customStart, setCustomStart] = useState(currentStart);
  const [customEnd, setCustomEnd] = useState(currentEnd);

  const handlePeriodChange = (e: any) => {
    const val = e.target.value;
    if (val === 'personalizado') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      router.push(`${pathname}?period=${val}`);
    }
  };

  const applyCustomPeriod = () => {
    if (customStart && customEnd) {
      router.push(`${pathname}?period=personalizado&start=${customStart}&end=${customEnd}`);
    }
  };

  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '8px', 
      background: 'var(--bg-color)', 
      padding: '0 14px', 
      height: '38px',
      borderRadius: '10px', 
      border: '1px solid var(--glass-border)', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s ease',
      ...style 
    }}>
      <Calendar size={15} color="var(--primary-color)" />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Período:</span>
      
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
          {{
            dia: "Hoje",
            semana: "Esta Semana",
            mes: "Este Mês",
            semestre: "Este Semestre",
            ano: "Este Ano",
            personalizado: "Personalizado..."
          }[currentPeriod] || (isCustom ? 'Personalizado...' : 'Este Mês')}
        </span>
        <ChevronDown size={14} color="var(--text-muted)" />

        <select 
          style={{ 
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer'
          }}
          value={isCustom ? 'personalizado' : currentPeriod}
          onChange={handlePeriodChange}
        >
          <option value="dia" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>Hoje</option>
          <option value="semana" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>Esta Semana</option>
          <option value="mes" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>Este Mês</option>
          <option value="semestre" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>Este Semestre</option>
          <option value="ano" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>Este Ano</option>
          <option value="personalizado" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>Personalizado...</option>
        </select>
      </div>

      {isCustom && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '8px', paddingLeft: '12px', borderLeft: '1px solid var(--glass-border)' }}>
          <input type="date" className="input-field" style={{ padding: '4px 8px', fontSize: '12px', height: '28px' }} value={customStart} onChange={e => setCustomStart(e.target.value)} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>até</span>
          <input type="date" className="input-field" style={{ padding: '4px 8px', fontSize: '12px', height: '28px' }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          <button className="btn-primary" style={{ padding: '4px 12px', fontSize: '12px', height: '28px' }} onClick={applyCustomPeriod}>Aplicar</button>
        </div>
      )}
    </div>
  );
}
