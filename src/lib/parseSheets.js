import XLSX from 'xlsx-js-style';

function excelDate(serial) {
  if (typeof serial !== 'number' || serial < 40000) return null;
  return new Date((serial - 25569) * 86400000);
}

function str(v) { return String(v ?? '').trim(); }

export function parseHours(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
  if (!raw.length) return [];
  const keys = Object.keys(raw[0]);
  const empKey   = keys.find(k => /^Employee/i.test(k));
  const projKey  = keys.find(k => /^Project/i.test(k));
  const phaseKey = keys.find(k => /^Phase/i.test(k));
  const dateKey  = keys.find(k => /^Date/i.test(k));
  const hoursKey = keys.find(k => k === 'Hours');
  const notesKey = keys.find(k => /^Billing Notes/i.test(k));
  if (!empKey || !hoursKey || !dateKey) return [];

  return raw
    .filter(r => {
      const emp = r[empKey];
      const hrs = r[hoursKey];
      const dt  = r[dateKey];
      return typeof emp === 'string' && emp.trim() && !emp.includes('\n') && emp.length <= 12 &&
             typeof dt  === 'number' && dt  > 40000 &&
             typeof hrs === 'number' && hrs  > 0;
    })
    .map(r => ({
      Employee:        str(r[empKey]),
      Project:         str(r[projKey]),
      Phase:           str(r[phaseKey]),
      Date:            excelDate(r[dateKey]),
      Hours:           Math.round(r[hoursKey] * 10) / 10,
      'Billing Notes': str(r[notesKey]),
    }));
}

export function parseExpenses(ws) {
  const arrays = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  return arrays.slice(2)
    .filter(r => {
      const emp = r[0];
      return typeof emp === 'string' && emp.trim() && emp.length <= 12 &&
             !emp.includes('Staff') && !emp.includes('INSTRUCTIONS');
    })
    .map(r => ({
      Employee:           str(r[0]),
      Project:            str(r[1]),
      Date:               excelDate(typeof r[2] === 'number' ? r[2] : null),
      'Expense Amount':   typeof r[3] === 'number' ? r[3] : '',
      Tax:                typeof r[4] === 'number' ? r[4] : '',
      Tip:                typeof r[5] === 'number' ? r[5] : '',
      Total:              typeof r[6] === 'number' ? r[6] : '',
      'Vendor and Notes': str(r[7]),
      'Tax Rate':         str(r[8]),
      'Payment Type':     str(r[9]),
    }))
    .filter(r => r.Employee !== '' && r.Total !== '' && r.Total > 0);
}
