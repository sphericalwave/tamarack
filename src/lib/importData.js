export function validateImportTotals(mergedHours, mergedExpenses, timeEntries, expenses) {
  const round = n => Math.round(n * 100) / 100;
  const sheetHours      = round(mergedHours.reduce((s, r) => s + (r.Hours || 0), 0));
  const importedHours   = round(timeEntries.reduce((s, t) => s + t.hours, 0));
  const sheetExpenses   = round(mergedExpenses.reduce((s, r) => s + (typeof r.Total === 'number' ? r.Total : 0), 0));
  const importedExpenses = round(expenses.reduce((s, e) => s + e.total, 0));
  return {
    sheetHours,
    importedHours,
    sheetExpenses,
    importedExpenses,
    hoursMatch:    sheetHours    === importedHours,
    expensesMatch: sheetExpenses === importedExpenses,
  };
}
