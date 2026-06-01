
export const SEED_USERS = [
  { id: 'u1', name: 'Alex Johnson', email: 'pm@tamarack.ca', password: 'password', role: 'pm' },
  { id: 'u2', name: 'Katie Morrison', email: 'km@tamarack.ca', password: 'password', role: 'employee' },
  { id: 'u3', name: 'Aaron Bates', email: 'ab@tamarack.ca', password: 'password', role: 'employee' },
  { id: 'u4', name: 'Sam Rivera', email: 'sr@tamarack.ca', password: 'password', role: 'employee' },
];

export const SEED_PROJECTS = [
  {
    id: 'p1',
    name: 'Hudson Bay Wetland Assessment',
    status: 'active',
    phases: ['Phase 1 - Desktop Review', 'Phase 2 - Field Investigation', 'Phase 3 - Report Preparation', 'Phase 4 - Final Report'],
  },
  {
    id: 'p2',
    name: 'Guelph Industrial Site EIA',
    status: 'active',
    phases: ['Scoping', 'Baseline Data Collection', 'Impact Assessment', 'Mitigation Planning', 'Reporting'],
  },
  {
    id: 'p3',
    name: 'Northern Pipeline Corridor Survey',
    status: 'complete',
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

export function initSeedData() {
  if (!localStorage.getItem('tm_seeded')) {
    localStorage.setItem('tm_users', JSON.stringify(SEED_USERS));
    localStorage.setItem('tm_projects', JSON.stringify(SEED_PROJECTS));
    localStorage.setItem('tm_time_entries', JSON.stringify(SEED_TIME_ENTRIES));
    localStorage.setItem('tm_expenses', JSON.stringify(SEED_EXPENSES));
    localStorage.setItem('tm_seeded', '1');
  }
}
