
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
  // P1 Hudson Bay — Katie (u2, $85/hr)
  { id: 't1',  employeeId: 'u2', projectId: 'p1', phase: 'Phase 1 - Desktop Review',      date: '2026-05-05', hours: 6, billingNotes: 'Desktop review of historical aerial photography and land use records for study area.', createdAt: '2026-05-05T17:00:00Z' },
  { id: 't2',  employeeId: 'u2', projectId: 'p1', phase: 'Phase 2 - Field Investigation', date: '2026-05-12', hours: 8, billingNotes: 'Field reconnaissance of wetland boundaries. GPS waypoints and photo documentation.', createdAt: '2026-05-12T17:00:00Z' },
  { id: 't3',  employeeId: 'u2', projectId: 'p1', phase: 'Phase 2 - Field Investigation', date: '2026-05-13', hours: 8, billingNotes: 'Wetland delineation transects. Vegetation community mapping in northern sector.', createdAt: '2026-05-13T17:00:00Z' },
  { id: 't4',  employeeId: 'u2', projectId: 'p1', phase: 'Phase 3 - Report Preparation',  date: '2026-05-26', hours: 5, billingNotes: 'Drafted wetland classification tables and GIS figures for Sections 3 and 4.', createdAt: '2026-05-26T17:00:00Z' },

  // P1 Hudson Bay — Aaron (u3, $90/hr)
  { id: 't5',  employeeId: 'u3', projectId: 'p1', phase: 'Phase 1 - Desktop Review',      date: '2026-05-06', hours: 4, billingNotes: 'Review of existing EAs and MNRF data layers for study area.', createdAt: '2026-05-06T17:00:00Z' },
  { id: 't6',  employeeId: 'u3', projectId: 'p1', phase: 'Phase 2 - Field Investigation', date: '2026-05-12', hours: 8, billingNotes: 'Soil pit excavations and wetland classification verification alongside KM.', createdAt: '2026-05-12T17:00:00Z' },
  { id: 't7',  employeeId: 'u3', projectId: 'p1', phase: 'Phase 3 - Report Preparation',  date: '2026-05-27', hours: 4, billingNotes: 'Species at risk screening and Section 2 background write-up.', createdAt: '2026-05-27T17:00:00Z' },

  // P1 Hudson Bay — Sam (u4, $75/hr)
  { id: 't8',  employeeId: 'u4', projectId: 'p1', phase: 'Phase 2 - Field Investigation', date: '2026-05-13', hours: 8, billingNotes: 'Bird point count surveys along established transects. 14 species recorded.', createdAt: '2026-05-13T17:00:00Z' },
  { id: 't9',  employeeId: 'u4', projectId: 'p1', phase: 'Phase 3 - Report Preparation',  date: '2026-05-28', hours: 5, billingNotes: 'Compiled bird survey data and prepared tables for Appendix B.', createdAt: '2026-05-28T17:00:00Z' },

  // P1 Hudson Bay — Alex PM (u1, $120/hr)
  { id: 't10', employeeId: 'u1', projectId: 'p1', phase: 'Phase 3 - Report Preparation',  date: '2026-05-29', hours: 2, billingNotes: 'QA review of draft wetland assessment report sections 1–5.', createdAt: '2026-05-29T17:00:00Z' },

  // P2 Guelph EIA — Katie (u2)
  { id: 't11', employeeId: 'u2', projectId: 'p2', phase: 'Scoping',                  date: '2026-05-08', hours: 3, billingNotes: 'Scoping meeting with client and regulatory team. Defined project boundaries.', createdAt: '2026-05-08T17:00:00Z' },
  { id: 't12', employeeId: 'u2', projectId: 'p2', phase: 'Baseline Data Collection', date: '2026-05-15', hours: 7, billingNotes: 'Vegetation survey along transects A–E. 12 species of concern identified.', createdAt: '2026-05-15T17:00:00Z' },
  { id: 't13', employeeId: 'u2', projectId: 'p2', phase: 'Impact Assessment',        date: '2026-05-29', hours: 6, billingNotes: 'Draft impact assessment matrix for terrestrial habitat components.', createdAt: '2026-05-29T17:00:00Z' },

  // P2 Guelph EIA — Aaron (u3)
  { id: 't14', employeeId: 'u3', projectId: 'p2', phase: 'Baseline Data Collection', date: '2026-05-15', hours: 7, billingNotes: 'Soil and groundwater sampling at 8 monitoring stations. Chain-of-custody completed.', createdAt: '2026-05-15T17:00:00Z' },
  { id: 't15', employeeId: 'u3', projectId: 'p2', phase: 'Baseline Data Collection', date: '2026-05-16', hours: 6, billingNotes: 'Acoustic bat monitoring equipment deployment at 5 locations.', createdAt: '2026-05-16T17:00:00Z' },
  { id: 't16', employeeId: 'u3', projectId: 'p2', phase: 'Impact Assessment',        date: '2026-05-30', hours: 5, billingNotes: 'Reviewed groundwater lab results. Drafted contamination risk section.', createdAt: '2026-05-30T17:00:00Z' },

  // P2 Guelph EIA — Sam (u4)
  { id: 't17', employeeId: 'u4', projectId: 'p2', phase: 'Scoping',                  date: '2026-05-08', hours: 2, billingNotes: 'Attended scoping meeting. Prepared field logistics plan.', createdAt: '2026-05-08T17:00:00Z' },
  { id: 't18', employeeId: 'u4', projectId: 'p2', phase: 'Baseline Data Collection', date: '2026-05-16', hours: 8, billingNotes: 'Reptile and amphibian surveys at pond complex. 3 species confirmed.', createdAt: '2026-05-16T17:00:00Z' },

  // P2 Guelph EIA — Alex PM (u1)
  { id: 't19', employeeId: 'u1', projectId: 'p2', phase: 'Impact Assessment',        date: '2026-05-31', hours: 3, billingNotes: 'Senior review of impact matrix. Client call re: mitigation options.', createdAt: '2026-05-31T17:00:00Z' },

  // Alex PM (u1) — June 2026 entries
  { id: 't29', employeeId: 'u1', projectId: 'p1', phase: 'Phase 4 - Final Report',   date: '2026-06-02', hours: 3, billingNotes: 'Client presentation of draft final report. Addressed comments from regulatory reviewer.', createdAt: '2026-06-02T17:00:00Z' },
  { id: 't30', employeeId: 'u1', projectId: 'p2', phase: 'Mitigation Planning',      date: '2026-06-03', hours: 4, billingNotes: 'Facilitated mitigation workshop with client and engineering team. Drafted mitigation register.', createdAt: '2026-06-03T17:00:00Z' },
  { id: 't31', employeeId: 'u1', projectId: 'p1', phase: 'Phase 4 - Final Report',   date: '2026-06-04', hours: 2, billingNotes: 'Final review and sign-off of wetland assessment report for client submission.', createdAt: '2026-06-04T17:00:00Z' },

  // P3 Northern Pipeline — Aaron (u3)
  { id: 't20', employeeId: 'u3', projectId: 'p3', phase: 'Stakeholder Engagement', date: '2026-03-10', hours: 6, billingNotes: 'Indigenous community consultation meetings in Fort Albany and Kashechewan.', createdAt: '2026-03-10T17:00:00Z' },
  { id: 't21', employeeId: 'u3', projectId: 'p3', phase: 'Field Survey',            date: '2026-04-05', hours: 8, billingNotes: 'Helicopter transect surveys along 120 km corridor. Moose and caribou counts.', createdAt: '2026-04-05T17:00:00Z' },
  { id: 't22', employeeId: 'u3', projectId: 'p3', phase: 'Field Survey',            date: '2026-04-06', hours: 8, billingNotes: 'Riparian vegetation transects at 22 stream crossings.', createdAt: '2026-04-06T17:00:00Z' },
  { id: 't23', employeeId: 'u3', projectId: 'p3', phase: 'Species Identification',  date: '2026-04-18', hours: 5, billingNotes: 'Bat call analysis from 5 Anabat recorders. 4 species identified.', createdAt: '2026-04-18T17:00:00Z' },

  // P3 Northern Pipeline — Sam (u4)
  { id: 't24', employeeId: 'u4', projectId: 'p3', phase: 'Field Survey',           date: '2026-04-05', hours: 8, billingNotes: 'Ground-truthing remote sensing data at 15 pre-selected corridor sites.', createdAt: '2026-04-05T17:00:00Z' },
  { id: 't25', employeeId: 'u4', projectId: 'p3', phase: 'Species Identification', date: '2026-04-20', hours: 5, billingNotes: 'Identified 47 vascular plant species from field samples. Updated species list.', createdAt: '2026-04-20T17:00:00Z' },
  { id: 't26', employeeId: 'u4', projectId: 'p3', phase: 'Final Report',           date: '2026-05-01', hours: 4, billingNotes: 'Prepared appendix maps and species occurrence tables for final report.', createdAt: '2026-05-01T17:00:00Z' },

  // P3 Northern Pipeline — Katie (u2)
  { id: 't27', employeeId: 'u2', projectId: 'p3', phase: 'Stakeholder Engagement', date: '2026-03-11', hours: 4, billingNotes: 'Prepared engagement summary report and action item tracker.', createdAt: '2026-03-11T17:00:00Z' },
  { id: 't28', employeeId: 'u2', projectId: 'p3', phase: 'Final Report',           date: '2026-05-02', hours: 6, billingNotes: 'Final report editing and QA review. Incorporated client comments from draft.', createdAt: '2026-05-02T17:00:00Z' },
];

export const SEED_EXPENSES = [
  // P1 Hudson Bay — Katie (u2)
  { id: 'e1',  employeeId: 'u2', projectId: 'p1', date: '2026-05-12', amount: 18.50,   tax: 2.41,  tip: 0, total: 20.91,   vendorNotes: 'TIM HORTONS - Crew breakfast before field day', province: 'ON', paymentType: 'Personal Card',  createdAt: '2026-05-12T07:00:00Z' },
  { id: 'e2',  employeeId: 'u2', projectId: 'p1', date: '2026-05-12', amount: 0,       tax: 0,     tip: 0, total: 93.15,   vendorNotes: 'Mileage - Guelph to Hudson Bay study area 345 km', province: 'ON', paymentType: 'Personal Card',  createdAt: '2026-05-12T18:00:00Z' },
  { id: 'e3',  employeeId: 'u2', projectId: 'p1', date: '2026-05-13', amount: 0,       tax: 0,     tip: 0, total: 93.15,   vendorNotes: 'Mileage - Hudson Bay study area return to Guelph 345 km', province: 'ON', paymentType: 'Personal Card',  createdAt: '2026-05-13T18:00:00Z' },

  // P1 Hudson Bay — Aaron (u3)
  { id: 'e4',  employeeId: 'u3', projectId: 'p1', date: '2026-05-12', amount: 145.00,  tax: 18.85, tip: 0, total: 163.85,  vendorNotes: 'HOLIDAY INN BARRIE - Accommodations AB and SR May 12', province: 'ON', paymentType: 'Corporate Card', createdAt: '2026-05-12T20:00:00Z' },
  { id: 'e5',  employeeId: 'u3', projectId: 'p1', date: '2026-05-12', amount: 0,       tax: 0,     tip: 0, total: 67.50,   vendorNotes: 'Mileage - Guelph to study area 250 km', province: 'ON', paymentType: 'Personal Card',  createdAt: '2026-05-12T18:30:00Z' },

  // P2 Guelph EIA — Aaron (u3)
  { id: 'e6',  employeeId: 'u3', projectId: 'p2', date: '2026-05-15', amount: 189.00,  tax: 24.57, tip: 0, total: 213.57,  vendorNotes: 'MARRIOTT GUELPH - Accommodations AB May 15 and 16', province: 'ON', paymentType: 'Corporate Card', createdAt: '2026-05-15T20:00:00Z' },
  { id: 'e7',  employeeId: 'u3', projectId: 'p2', date: '2026-05-15', amount: 245.80,  tax: 0,     tip: 0, total: 245.80,  vendorNotes: 'LABWORKS ONTARIO - Groundwater analysis 8 samples', province: 'ON', paymentType: 'Corporate Card', createdAt: '2026-05-15T16:00:00Z' },

  // P2 Guelph EIA — Sam (u4)
  { id: 'e8',  employeeId: 'u4', projectId: 'p2', date: '2026-05-16', amount: 0,       tax: 0,     tip: 0, total: 54.00,   vendorNotes: 'Mileage - Guelph to EIA site and return 200 km', province: 'ON', paymentType: 'Personal Card',  createdAt: '2026-05-16T18:00:00Z' },
  { id: 'e9',  employeeId: 'u4', projectId: 'p2', date: '2026-05-16', amount: 32.00,   tax: 4.16,  tip: 0, total: 36.16,   vendorNotes: "MCDONALD'S - Lunch for SR and AB during field day", province: 'ON', paymentType: 'Personal Card',  createdAt: '2026-05-16T12:00:00Z' },

  // P3 Northern Pipeline — Aaron (u3)
  { id: 'e10', employeeId: 'u3', projectId: 'p3', date: '2026-04-05', amount: 1850.00, tax: 0,     tip: 0, total: 1850.00, vendorNotes: 'NORTHERN AIR - Helicopter charter transect surveys 4 hrs', province: 'ON', paymentType: 'Corporate Card', createdAt: '2026-04-05T18:00:00Z' },
  { id: 'e11', employeeId: 'u3', projectId: 'p3', date: '2026-04-04', amount: 185.00,  tax: 24.05, tip: 0, total: 209.05,  vendorNotes: 'BEST WESTERN MOOSONEE - Accommodations AB and SR Apr 4, 5, 6', province: 'ON', paymentType: 'Corporate Card', createdAt: '2026-04-04T20:00:00Z' },
  { id: 'e12', employeeId: 'u3', projectId: 'p3', date: '2026-04-04', amount: 0,       tax: 0,     tip: 0, total: 486.00,  vendorNotes: 'AIR CANADA - Return flights YYZ-YMO AB and SR', province: 'ON', paymentType: 'Corporate Card', createdAt: '2026-04-04T06:00:00Z' },

  // P3 Northern Pipeline — Katie (u2)
  { id: 'e13', employeeId: 'u2', projectId: 'p3', date: '2026-03-10', amount: 420.00,  tax: 0,     tip: 0, total: 420.00,  vendorNotes: 'AIR CANADA - Return flight YYZ-YMO KM community consultations', province: 'ON', paymentType: 'Corporate Card', createdAt: '2026-03-10T06:00:00Z' },
  { id: 'e14', employeeId: 'u2', projectId: 'p3', date: '2026-03-10', amount: 95.00,   tax: 12.35, tip: 0, total: 107.35,  vendorNotes: 'REVS DINER MOOSONEE - Crew dinner during community engagement', province: 'ON', paymentType: 'Personal Card',  createdAt: '2026-03-10T19:00:00Z' },

  // Alex PM (u1) — expenses June 2026
  { id: 'e15', employeeId: 'u1', projectId: 'p1', date: '2026-06-02', amount: 0,       tax: 0,     tip: 0, total: 54.00,   vendorNotes: 'Mileage - Guelph to client office and return 200 km', province: 'ON', paymentType: 'Personal Card',  createdAt: '2026-06-02T18:00:00Z' },
  { id: 'e16', employeeId: 'u1', projectId: 'p2', date: '2026-06-03', amount: 68.00,   tax: 8.84,  tip: 0, total: 76.84,   vendorNotes: 'BOREALIS RESTAURANT - Working lunch with client PM and engineer', province: 'ON', paymentType: 'Corporate Card', createdAt: '2026-06-03T12:30:00Z' },
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
  if (localStorage.getItem('tm_seeded') !== 'v3') {
    localStorage.setItem('tm_users', JSON.stringify(SEED_USERS));
    localStorage.setItem('tm_projects', JSON.stringify(SEED_PROJECTS));
    localStorage.setItem('tm_time_entries', JSON.stringify(SEED_TIME_ENTRIES));
    localStorage.setItem('tm_expenses', JSON.stringify(SEED_EXPENSES));
    localStorage.setItem('tm_seeded', 'v3');
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
