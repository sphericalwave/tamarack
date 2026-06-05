export const SEED_USERS = [
  { id: 'u-tu', name: 'Test User', initials: 'TU', email: 'tu@tamarack.ca', password: 'password', role: 'pm', rate: 0 },
];

export function initSeedData() {
  if (localStorage.getItem('tm_seeded') !== 'v8') {
    localStorage.setItem('tm_users',        JSON.stringify(SEED_USERS));
    localStorage.setItem('tm_projects',     JSON.stringify([]));
    localStorage.setItem('tm_time_entries', JSON.stringify([]));
    localStorage.setItem('tm_expenses',     JSON.stringify([]));
    localStorage.setItem('tm_phase_budgets',JSON.stringify({}));
    localStorage.setItem('tm_invoices',     JSON.stringify([]));
    localStorage.setItem('tm_seeded',       'v8');
  }
}
