export function parseDateFilter(period?: string, start?: string, end?: string): { startDate: Date | undefined, endDate: Date | undefined } {
  let startDate: Date | undefined = undefined;
  let endDate: Date | undefined = undefined;
  
  if (period) {
    const now = new Date();
    startDate = new Date(now);
    endDate = new Date(now);
    
    if (period === 'dia') {
      startDate.setUTCHours(0,0,0,0);
      endDate.setUTCHours(23,59,59,999);
    } else if (period === 'semana') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setUTCHours(0,0,0,0);
      endDate.setDate(diff + 6);
      endDate.setUTCHours(23,59,59,999);
    } else if (period === 'mes') {
      startDate.setDate(1);
      startDate.setUTCHours(0,0,0,0);
      endDate.setMonth(now.getMonth() + 1);
      endDate.setDate(0);
      endDate.setUTCHours(23,59,59,999);
    } else if (period === 'semestre') {
      const sem = Math.floor(now.getMonth() / 6);
      startDate.setMonth(sem * 6);
      startDate.setDate(1);
      startDate.setUTCHours(0,0,0,0);
      endDate.setMonth((sem + 1) * 6);
      endDate.setDate(0);
      endDate.setUTCHours(23,59,59,999);
    } else if (period === 'ano') {
      startDate.setMonth(0, 1);
      startDate.setUTCHours(0,0,0,0);
      endDate.setMonth(11, 31);
      endDate.setUTCHours(23,59,59,999);
    } else if (period === 'personalizado' && start && end) {
      startDate = new Date(start + "T00:00:00.000Z");
      endDate = new Date(end + "T23:59:59.999Z");
    }
  } else {
    // Default to 'mes'
    const now = new Date();
    startDate = new Date(now);
    startDate.setDate(1);
    startDate.setUTCHours(0,0,0,0);
    endDate = new Date(now);
    endDate.setMonth(now.getMonth() + 1);
    endDate.setDate(0);
    endDate.setUTCHours(23,59,59,999);
  }

  return { startDate, endDate };
}

export function formatPhone(value: string) {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 0) return "";
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}
