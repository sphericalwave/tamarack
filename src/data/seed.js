
export const SEED_USERS = [
  { id: 'u1', name: 'Alex Johnson', email: 'pm@tamarack.ca', password: 'password', role: 'pm', rate: 120 },
  { id: 'u2', name: 'Katie Morrison', email: 'km@tamarack.ca', password: 'password', role: 'employee', rate: 85 },
  { id: 'u3', name: 'Aaron Bates', email: 'ab@tamarack.ca', password: 'password', role: 'employee', rate: 90 },
  { id: 'u4', name: 'Sam Rivera', email: 'sr@tamarack.ca', password: 'password', role: 'employee', rate: 75 },
];

export const SEED_PROJECTS = [
  {
    id: 'p1',
    name: 'Hudson Bay Wetland Assessment',
    status: 'active',
    pmId: 'u1',
    phases: ['Phase 1 - Desktop Review', 'Phase 2 - Field Investigation', 'Phase 3 - Report Preparation', 'Phase 4 - Final Report'],
  },
  {
    id: 'p2',
    name: 'Guelph Industrial Site EIA',
    status: 'active',
    pmId: 'u1',
    phases: ['Scoping', 'Baseline Data Collection', 'Impact Assessment', 'Mitigation Planning', 'Reporting'],
  },
  {
    id: 'p3',
    name: 'Northern Pipeline Corridor Survey',
    status: 'complete',
    pmId: 'u1',
    phases: ['Stakeholder Engagement', 'Field Survey', 'Species Identification', 'Final Report'],
  },
];

export const SEED_TIME_ENTRIES = [
  {
    id: 't1', employeeId: 'u2', projectId: 'p1',
    phase: 'Phase 1 - Desktop Review',
    date: '2026-05-20', hours: 4,
    billingNotes: 'Desktop review of historical mapping data and existing environmental reports for study area.',
    createdAt: '2026-05-20T09:00:00Z',
  },
  {
    id: 't2', employeeId: 'u2', projectId: 'p1',
    phase: 'Phase 2 - Field Investigation',
    date: '2026-05-22', hours: 8,
    billingNotes: 'Field reconnaissance of wetland boundaries. Collected GPS waypoints and photographic documentation.',
    createdAt: '2026-05-22T17:00:00Z',
  },
  {
    id: 't3', employeeId: 'u3', projectId: 'p2',
    phase: 'Baseline Data Collection',
    date: '2026-05-23', hours: 6,
    billingNotes: 'Baseline vegetation survey along transects A through E. Identified 12 species of concern.',
    createdAt: '2026-05-23T16:00:00Z',
  },
  {
    id: 't4', employeeId: 'u2', projectId: 'p2',
    phase: 'Scoping',
    date: '2026-05-26', hours: 3,
    billingNotes: 'Scoping meeting with client and regulatory team. Defined project boundaries and key assessment components.',
    createdAt: '2026-05-26T14:00:00Z',
  },
  {
    id: 't5', employeeId: 'u4', projectId: 'p1',
    phase: 'Phase 3 - Report Preparation',
    date: '2026-05-28', hours: 5,
    billingNotes: 'Drafted wetland classification tables and prepared GIS figures for Sections 3 and 4 of report.',
    createdAt: '2026-05-28T15:00:00Z',
  },
];

export const SEED_EXPENSES = [
  {
    id: 'e1', employeeId: 'u2', projectId: 'p1',
    date: '2026-05-22',
    amount: 18.50, tax: 2.41, tip: 0, total: 20.91,
    vendorNotes: 'TIM HORTONS - Meeting with KM & AB pre-field day',
    province: 'ON', paymentType: 'Personal Card',
    createdAt: '2026-05-22T08:00:00Z',
  },
  {
    id: 'e2', employeeId: 'u2', projectId: 'p1',
    date: '2026-05-22',
    amount: 0, tax: 0, tip: 0, total: 93.15,
    vendorNotes: 'Mileage - Guelph to Hudson Bay study area 345 km',
    province: 'ON', paymentType: 'Personal Card',
    createdAt: '2026-05-22T18:00:00Z',
  },
  {
    id: 'e3', employeeId: 'u3', projectId: 'p2',
    date: '2026-05-23',
    amount: 189.00, tax: 24.57, tip: 0, total: 213.57,
    vendorNotes: 'MARRIOTT HOTEL - Accommodations for AB May 23 and 24',
    province: 'ON', paymentType: 'Corporate Card',
    createdAt: '2026-05-23T20:00:00Z',
  },
];

export const SEED_PHASE_BUDGETS = {
  p1: {
    'Phase 1 - Desktop Review':      { fees: 5000,  expenses: 200  },
    'Phase 2 - Field Investigation': { fees: 12000, expenses: 3000 },
    'Phase 3 - Report Preparation':  { fees: 8000,  expenses: 500  },
    'Phase 4 - Final Report':        { fees: 4000,  expenses: 200  },
  },
  p2: {
    'Scoping':                 { fees: 3500, expenses: 0    },
    'Baseline Data Collection':{ fees: 9000, expenses: 2500 },
    'Impact Assessment':       { fees: 7000, expenses: 500  },
    'Mitigation Planning':     { fees: 4000, expenses: 0    },
    'Reporting':               { fees: 5000, expenses: 200  },
  },
  p3: {
    'Stakeholder Engagement': { fees: 6000,  expenses: 500  },
    'Field Survey':           { fees: 15000, expenses: 4000 },
    'Species Identification': { fees: 8000,  expenses: 0    },
    'Final Report':           { fees: 5000,  expenses: 300  },
  },
};

export const SEED_INVOICES = [
  { id: 'inv1', projectId: 'p1', dateSent: '2026-04-15', paid: true,  amount: 8500,  description: 'Phase 1 – Desktop Review completion' },
  { id: 'inv2', projectId: 'p2', dateSent: '2026-03-30', paid: true,  amount: 4200,  description: 'Scoping phase and initial baseline setup' },
  { id: 'inv3', projectId: 'p2', dateSent: '2026-05-20', paid: false, amount: 11800, description: 'Baseline Data Collection' },
  { id: 'inv4', projectId: 'p3', dateSent: '2026-02-10', paid: true,  amount: 34000, description: 'Final invoice — all phases complete' },
];

export function initSeedData() {
  if (!localStorage.getItem('tm_seeded')) {
    localStorage.setItem('tm_users', JSON.stringify(SEED_USERS));
    localStorage.setItem('tm_projects', JSON.stringify(SEED_PROJECTS));
    localStorage.setItem('tm_time_entries', JSON.stringify(SEED_TIME_ENTRIES));
    localStorage.setItem('tm_expenses', JSON.stringify(SEED_EXPENSES));
    localStorage.setItem('tm_seeded', '1');
  }

  // Migrations for existing installs
  if (!localStorage.getItem('tm_phase_budgets')) {
    localStorage.setItem('tm_phase_budgets', JSON.stringify(SEED_PHASE_BUDGETS));
  }
  if (!localStorage.getItem('tm_invoices')) {
    localStorage.setItem('tm_invoices', JSON.stringify(SEED_INVOICES));
  }
  const storedProjects = JSON.parse(localStorage.getItem('tm_projects') || '[]');
  if (storedProjects.length && storedProjects[0].pmId === undefined) {
    localStorage.setItem('tm_projects', JSON.stringify(
      storedProjects.map(p => {
        const s = SEED_PROJECTS.find(x => x.id === p.id);
        return s ? { ...p, pmId: s.pmId } : p;
      })
    ));
  }
  const storedUsers = JSON.parse(localStorage.getItem('tm_users') || '[]');
  if (storedUsers.length && storedUsers[0].rate === undefined) {
    localStorage.setItem('tm_users', JSON.stringify(
      storedUsers.map(u => {
        const s = SEED_USERS.find(x => x.id === u.id);
        return s ? { ...u, rate: s.rate } : u;
      })
    ));
  }
}
