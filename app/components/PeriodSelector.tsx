"use client";
import { Calendar } from "lucide-react";
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
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', ...style }}>
      <Calendar size={16} color="var(--primary-color)" />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Período:</span>
      
      <select 
        className="input-field" 
        style={{ width: '140px', padding: '6px 10px', fontSize: '13px', ...selectStyle }}
        value={isCustom ? 'personalizado' : currentPeriod}
        onChange={handlePeriodChange}
      >
        <option value="dia">Hoje</option>
        <option value="semana">Esta Semana</option>
        <option value="mes">Este Mês</option>
        <option value="semestre">Este Semestre</option>
        <option value="ano">Este Ano</option>
        <option value="personalizado">Personalizado...</option>
      </select>

      {isCustom && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '8px', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <input type="date" className="input-field" style={{ padding: '8px', fontSize: '13px' }} value={customStart} onChange={e => setCustomStart(e.target.value)} />
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>até</span>
          <input type="date" className="input-field" style={{ padding: '8px', fontSize: '13px' }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={applyCustomPeriod}>Aplicar</button>
        </div>
      )}
    </div>
  );
}
