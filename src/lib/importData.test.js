import { describe, it, expect } from 'vitest';
import { validateImportTotals } from './importData.js';

describe('validateImportTotals', () => {
  it('matches when all rows imported', () => {
    const mergedHours    = [{ Hours: 3 }, { Hours: 5 }, { Hours: 2.5 }];
    const mergedExpenses = [{ Total: 100.00 }, { Total: 45.50 }];
    const timeEntries    = [{ hours: 3 }, { hours: 5 }, { hours: 2.5 }];
    const expenses       = [{ total: 100.00 }, { total: 45.50 }];
    const r = validateImportTotals(mergedHours, mergedExpenses, timeEntries, expenses);
    expect(r.hoursMatch).toBe(true);
    expect(r.expensesMatch).toBe(true);
    expect(r.sheetHours).toBe(10.5);
    expect(r.sheetExpenses).toBe(145.50);
  });

  it('detects mismatch when rows are skipped', () => {
    const mergedHours    = [{ Hours: 4 }, { Hours: 4 }];
    const mergedExpenses = [{ Total: 200 }, { Total: 50 }];
    const timeEntries    = [{ hours: 4 }];      // one skipped
    const expenses       = [{ total: 200 }];    // one skipped
    const r = validateImportTotals(mergedHours, mergedExpenses, timeEntries, expenses);
    expect(r.hoursMatch).toBe(false);
    expect(r.expensesMatch).toBe(false);
    expect(r.importedHours).toBe(4);
    expect(r.importedExpenses).toBe(200);
  });
});
