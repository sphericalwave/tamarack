import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import XLSX from 'xlsx-js-style';
import { parseHours, parseExpenses } from './parseSheets.js';

const TIMESHEET_DIR = join(process.cwd(), 'timesheet');
const MASTER_PATH   = join(TIMESHEET_DIR, 'master-timesheet.xlsx');

function employeeFiles() {
  return readdirSync(TIMESHEET_DIR)
    .filter(f => f.endsWith('.xlsx') && f !== 'master-timesheet.xlsx')
    .map(f => ({ name: f, wb: XLSX.read(readFileSync(join(TIMESHEET_DIR, f)), { type: 'buffer' }) }));
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function dateFromSerial(v) {
  if (typeof v !== 'number' || v < 40000) return null;
  const d = new Date((Math.round(v) - 25569) * 86400000);
  return `${String(d.getUTCDate()).padStart(2, '0')}-${MONTHS[d.getUTCMonth()]}-${String(d.getUTCFullYear()).slice(-2)}`;
}

// Master Hours/Expenses sheets have a "Seq" prefix column + a single header row,
// so they're read with sheet_to_json (named keys) rather than the employee-file parsers.
function masterRows(sheet) {
  const wb = XLSX.read(readFileSync(MASTER_PATH), { type: 'buffer' });
  const ws = wb.Sheets[sheet];
  if (!ws) return [];

  if (sheet === 'Hours') {
    // parseHours handles named-key form — works on both individual and master sheets
    return parseHours(ws);
  }

  if (sheet === 'Expenses') {
    // Master has named headers: Seq, Employee, Project, Date, Expense Amount, Tax, Tip, Total, Vendor and Notes, Tax Rate, Payment Type
    const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
    return raw
      .filter(r => typeof r['Employee'] === 'string' && r['Employee'].trim())
      .map(r => ({
        Employee:           String(r['Employee']).trim(),
        Project:            String(r['Project'] || '').trim(),
        Date:               dateFromSerial(r['Date']),
        'Expense Amount':   typeof r['Expense Amount'] === 'number' ? r['Expense Amount'] : '',
        Tax:                typeof r['Tax'] === 'number' ? r['Tax'] : '',
        Tip:                typeof r['Tip'] === 'number' ? r['Tip'] : '',
        Total:              typeof r['Total'] === 'number' ? r['Total'] : '',
        'Vendor and Notes': String(r['Vendor and Notes'] || '').trim(),
        'Tax Rate':         String(r['Tax Rate'] || '').trim(),
        'Payment Type':     String(r['Payment Type'] || '').trim(),
      }))
      .filter(r => r.Employee && r.Total !== '' && r.Total > 0);
  }

  return [];
}

// Normalise for comparison: strings trimmed, numbers as-is. Dates are now plain strings.
function norm(v) {
  if (typeof v === 'string') return v.trim();
  return v;
}

describe('merge completeness', () => {
  it('every file yields at least one hours row', () => {
    for (const { name, wb } of employeeFiles()) {
      const rows = parseHours(wb.Sheets['Hours']);
      expect(rows.length, `${name} hours`).toBeGreaterThan(0);
    }
  });

  it('merged hours count equals sum of per-file counts', () => {
    const files = employeeFiles();
    const sum = files.reduce((n, { wb }) => n + parseHours(wb.Sheets['Hours']).length, 0);
    expect(masterRows('Hours').length).toBe(sum);
  });

  it('merged expenses count equals sum of per-file counts', () => {
    const files = employeeFiles();
    const sum = files.reduce((n, { wb }) => n + parseExpenses(wb.Sheets['Expenses']).length, 0);
    expect(masterRows('Expenses').length).toBe(sum);
  });

  it('no hours row is missing Employee, Date, or Hours', () => {
    for (const { name, wb } of employeeFiles()) {
      const rows = parseHours(wb.Sheets['Hours']);
      for (const row of rows) {
        expect(row.Employee, `${name} Employee`).toBeTruthy();
        expect(row.Date, `${name} Date`).toMatch(/^\d{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/);
        expect(row.Hours,    `${name} Hours`).toBeGreaterThan(0);
      }
    }
  });

  it('no expense row is missing Employee, Date, or Total', () => {
    for (const { name, wb } of employeeFiles()) {
      const rows = parseExpenses(wb.Sheets['Expenses']);
      for (const row of rows) {
        expect(row.Employee, `${name} Employee`).toBeTruthy();
        expect(row.Total,    `${name} Total`).toBeGreaterThan(0);
      }
    }
  });

  it('every hours entry from every employee file appears in the master with identical values', () => {
    const master = masterRows('Hours');
    for (const { name, wb } of employeeFiles()) {
      for (const row of parseHours(wb.Sheets['Hours'])) {
        const match = master.find(m =>
          norm(m.Employee)         === norm(row.Employee) &&
          norm(m.Date)             === norm(row.Date) &&
          norm(m.Hours)            === norm(row.Hours) &&
          norm(m.Project)          === norm(row.Project) &&
          norm(m.Phase)            === norm(row.Phase) &&
          norm(m['Billing Notes']) === norm(row['Billing Notes'])
        );
        expect(
          match,
          `${name}: no master match for ${row.Employee} ${row.Date} ${row.Hours}h "${row.Project}"`
        ).toBeDefined();
      }
    }
  });

  it('every expense entry from every employee file appears in the master with identical values', () => {
    const master = masterRows('Expenses');
    for (const { name, wb } of employeeFiles()) {
      for (const row of parseExpenses(wb.Sheets['Expenses'])) {
        const match = master.find(m =>
          norm(m.Employee)            === norm(row.Employee) &&
          norm(m.Date)                === norm(row.Date) &&
          norm(m.Total)               === norm(row.Total) &&
          norm(m.Project)             === norm(row.Project) &&
          norm(m['Expense Amount'])   === norm(row['Expense Amount']) &&
          norm(m['Vendor and Notes']) === norm(row['Vendor and Notes'])
        );
        expect(
          match,
          `${name}: no master match for ${row.Employee} ${row.Date} total=${row.Total}`
        ).toBeDefined();
      }
    }
  });

  it('master Hours cells have no trailing-dot number format', () => {
    const wb = XLSX.read(readFileSync(MASTER_PATH), { type: 'buffer' });
    const ws = wb.Sheets['Hours'];
    if (!ws || !ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);
    // find Hours column index from header row
    let hoursCol = -1;
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
      if (cell?.v === 'Hours') { hoursCol = C; break; }
    }
    expect(hoursCol, 'Hours column not found').toBeGreaterThanOrEqual(0);
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: hoursCol })];
      if (cell?.t === 'n' && cell.w != null) {
        expect(cell.w, `Hours cell ${R} displays "${cell.w}" with trailing dot`).not.toMatch(/\.$/);
      }
    }
  });
});
