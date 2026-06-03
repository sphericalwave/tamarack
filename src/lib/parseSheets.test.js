import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import XLSX from 'xlsx-js-style';
import { parseHours, parseExpenses } from './parseSheets.js';

const TIMESHEET_DIR = join(process.cwd(), 'timesheet');

function employeeFiles() {
  return readdirSync(TIMESHEET_DIR)
    .filter(f => f.endsWith('.xlsx') && f !== 'master-timesheet.xlsx')
    .map(f => ({ name: f, wb: XLSX.read(readFileSync(join(TIMESHEET_DIR, f)), { type: 'buffer' }) }));
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
    const perFile = files.map(({ name, wb }) => ({
      name,
      rows: parseHours(wb.Sheets['Hours']),
    }));
    const sum = perFile.reduce((n, f) => n + f.rows.length, 0);
    const merged = perFile.flatMap(f => f.rows);
    expect(merged.length).toBe(sum);
  });

  it('merged expenses count equals sum of per-file counts', () => {
    const files = employeeFiles();
    const perFile = files.map(({ name, wb }) => ({
      name,
      rows: parseExpenses(wb.Sheets['Expenses']),
    }));
    const sum = perFile.reduce((n, f) => n + f.rows.length, 0);
    const merged = perFile.flatMap(f => f.rows);
    expect(merged.length).toBe(sum);
  });

  it('no hours row is missing Employee, Date, or Hours', () => {
    for (const { name, wb } of employeeFiles()) {
      const rows = parseHours(wb.Sheets['Hours']);
      for (const row of rows) {
        expect(row.Employee, `${name} Employee`).toBeTruthy();
        expect(row.Date, `${name} Date`).toBeInstanceOf(Date);
        expect(row.Hours, `${name} Hours`).toBeGreaterThan(0);
      }
    }
  });

  it('no expense row is missing Employee, Date, or Total', () => {
    for (const { name, wb } of employeeFiles()) {
      const rows = parseExpenses(wb.Sheets['Expenses']);
      for (const row of rows) {
        expect(row.Employee, `${name} Employee`).toBeTruthy();
        expect(row.Total, `${name} Total`).toBeGreaterThan(0);
      }
    }
  });
});
