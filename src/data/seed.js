
function client(name) {
  const i = name.search(/\s[-–]\s/);
  return i >= 0 ? name.slice(0, i).trim() : name;
}

function proj(id, name, status, phases) {
  return { id, name: name.trim(), client: client(name.trim()), status, pmId: 'u1', phases: phases.map(p => p.trim()).filter(Boolean) };
}

export const SEED_USERS = [
  { id: 'u-tu', name: 'Test User', initials: 'TU', email: 'tu@tamarack.ca', password: 'password', role: 'pm', rate: 0 },
];

export const SEED_PROJECTS = [
  proj('p1',  'ADMIN', 'active', ['BD','Financials','Other','Vacation (PTO)','Statutory Holiday','Overhead']),
  proj('p2',  'AAN - AMEX HRIA', 'active', ['Internal Project Initiation, Setup and Coordination','Gap Analysis','Targeted TKLU Data Gathering','Reporting','Data Management and QA/QC']),
  proj('p3',  'AAN - Country Foods Study', 'active', ['Project Management','Research and Prep','Workshop','Field Sampling','Reporting']),
  proj('p4',  'AAN - Crawford Engagement and Negotiations', 'active', ['Review of permit applications','Review of Nation-Specific IA Chapter','Technical Review of Impact Statement','Meetings with Proponent/IBA Drafting','Internal AAN Meetings','Community Meetings','Meetings with the Crown']),
  proj('p5',  'AAN - Crawford IAAC PFP', 'active', ['Impact Assessment Report','Participation in Technical Working Group','Consultation/Accommodation Report']),
  proj('p6',  'AAN - Cumulative Effects Assessment and Remediation Action Plan', 'active', ['Compliation and Review of existing AAN work','Workplan Development','Presentation of Workplan to AAN','Background Data Gathering','Mapping','Community Engagement','Reporting - CEA report','Reporting - RAP report','Presentation of Draft reports to AAN','Report finalization']),
  proj('p7',  'AAN - Detour Gold', 'active', ['Technical Reviews','Participation in Meetings','Ongoing Technical Support','Project Management','TMA Cell 3 Workshops']),
  proj('p8',  'AAN - Detour TMA Cell 3 Oral History', 'active', ['Project Management','Oral History Interviews','Report Writing']),
  proj('p9',  'AAN - GFG Resources HRIA', 'active', ['Internal Project Initiation, Setup and Coordination','Gap Analysis','Targeted TKLU Data Gathering','Data Management and QA/QC']),
  proj('p10', 'AAN - GIS Training and Database Management', 'active', ['Project Management','ArcGIS Training Sessions','Database Management']),
  proj('p11', 'AAN - Gowest Gold Bradshaw Closure Plan Review & IBA Negotiation', 'active', ['Closure Plan Review','Agreement Drafting','Negotiation Meetings with Proponent','Internal AAN Meetings/consultation']),
  proj('p12', 'AAN - IBA Negotiation for Power Metals', 'active', ['Environmental Due Diligence','Review of PEA','Review of Permits and Approvals for Mine Construction and Operation','Meetings with Proponent/IBA Drafting','Internal AAN Meetings','Community Meetings','Follow-up Reporting/Notes from Meetings','Meetings with the Crown']),
  proj('p13', 'AAN - Macassa', 'active', ['Technical Review of Regulatory and Environmental Documents','Participation in Meetings','Ongoing Technical Support','Project Management','Negotiation Support']),
  proj('p14', 'AAN - Mayfair Fenn-Gib Gold Project 2025', 'active', ['Baseline study development, design and review','Technical Review of Regulatory and Environmental Documents','Meetings with Proponent','Community Meetings','Internal AAN Meetings']),
  proj('p15', 'AAN - McEwen EMC', 'active', ['Permit Review','Meetings','Other Support']),
  proj('p16', 'AAN - Mining and Exploration Support', 'active', ['Abitibi River Water Management Plan','Agnico Eagle','Amex','Amex Exploration','ARS-WMP','Atacama','Barrick','Bear Creek','Bounty Gold','Brandy Brook','Claimstaking','Class 1','Copper Road','Custom Concrete','Discovery Silver','EV Nickel','Fortune Nickel and Gold','Fulcrum Metals','GFG Resources','Gold Candle','Gowest Gold','Grace Gold','Heritage Mining','Hwy 652','IEP','Insight Exploration','Jobina','Kirkland Lake Discoveries','Legendary Ore','Libra','MAG Silver','Mayfair Gold','McEwen Mining','McLaren Resources','Metals Creek','Midex Resources','Mining Act Challenge','Mistango','MOI disposition D1057448','Munro Quarries','Northern Sun','Onyx Gold','OPG','Pan American - Bell Creek','Plato Gold','Plethora Green Energy','Power Metals','Sienna Resources','Tiger Gold','VCC','Voltage Metals Corp']),
  proj('p17', 'AAN - STLLR Gold HRIA', 'active', ['Internal Project Initiation, Setup and Coordination','Gap Analysis','Targeted TKLU Data Gathering','Data Management and QA/QC']),
  proj('p18', 'AAN - STLLR Tower Gold 2025', 'active', ['Baseline study development, design and review','Review of PEA','Meetings with Proponent','Community Meetings']),
  proj('p19', 'AAN - Upper Beaver IA', 'active', ['Technical Review of Regulatory and Environmental Documents','Participation in Meetings','Ongoing Technical Support','Project Management']),
  proj('p20', 'AFN - Reseach on Impacts of Waboose Dam', 'active', ['General Support']),
  proj('p21', 'AZA - Environmental Monitoring Program', 'active', ['Detail Project Planning','Project Kick-off and In-Office Training Program','Field Program','Field Equipment','Lab Fees','Summary Report Based on Results']),
  proj('p22', 'AZA - GTM Seymour Project', 'active', ['Meetings with GTM','Community Meetings (1 and 2)','Technical Review of Closure Plan and Class EA','Negotiation of Mine Agreement','Development of Engagement Agreement']),
  proj('p23', 'AZA - GTM Seymour TKLU Study', 'active', ['AZA Traditional Knowledge Study']),
  proj('p24', 'AZA - MFCAR EA', 'active', ['Environmental Regulatory Support','Technical Review']),
  proj('p25', 'AZA - MFCAR Traditional Knowledge Study', 'active', ['Traditional Knowledge Study']),
  proj('p26', 'BNDN - Exploration Projects 2025', 'active', ['Fermi Exploration - Badger Lake Projects','Mustang Energy - Yellowstone Project','Fission Uranium - Patterson Lake South Project','Resource Use Cabin','Cameco North William River','Other Support (detailed notes required)']),
  proj('p27', 'BNDN - Fermi Exploration Agreement', 'active', ['Project Management','Technical Reviews','HRIA and Land Use','Site Visits']),
  proj('p28', 'BNDN - NexGen Rook 1 CNSC PFP', 'active', ['Meetings','Hearing Participation and Prep','Review Commission Member Docs','Project Management','Community Meeting']),
  proj('p29', 'BNDN - NexGen Rook I Support', 'active', ['Project Management','Technical and Regulatory Support','BNDDI Support (billed separately)','Implementation Tasks']),
  proj('p30', 'BNDN - Orano Midwest Mining', 'active', []),
  proj('p31', 'BNDN - Paladin PLS Implementation', 'active', ['Project Management','Technical and Regulatory Support','Implementation Tasks']),
  proj('p32', 'BNDN - Training and Capacity Support for the BNDN Nuh Nene Department', 'active', ['General Support','No Go Zone','Funding Applications','Mapping','Training and Capacity Development']),
  proj('p33', 'BNDN - Youth Lands Protectors', 'active', ['Project Management','Training Workshops','Community Meetings','Reporting','Documentary']),
  proj('p34', 'CLFN - MFCAR - IS responses and IA Report', 'active', ['Project Management & Coordination','MFCAR Tech Review','Registry Comments','Impact Assesment','Community Meeting','Community Meeting 2']),
  proj('p35', 'CLFN - WSR - IS responses and IA Report', 'active', ['Project Management & Coordination','WSR Tech Review','Registry Comments','Impact Assesment','Community Meeting','Community Meeting 2']),
  proj('p36', 'ELFN - Goliath Technical Support', 'active', ['Virtual EMC Meetings','In-person meeting','Ongoing support to ELFN','Review Closure Plan','Review IAAC Project Change Documentation','Community Engagement Virtual Meeting','Permit Reviews','Feasibility Study Review']),
  proj('p37', 'ELFN - Mining Retainer Support', 'active', ['Technical Support']),
  proj('p38', 'GFN - Cumlative Effect Study', 'active', ['Mapping']),
  proj('p39', 'GFN - Generation Mining Fisheries Act Authorization', 'active', ['Prep for Community Meetings','Community Meetings, Workshops, Interviews','Analysis and Reporting','Review Findings with GFN','Meetings with GFN, DFO, Generation, others']),
  proj('p40', 'GFN - GenPGM IBA Negotiation', 'active', ['Technical Review','Community Meeting','Project Management/Coordination']),
  proj('p41', 'Innu Nation - Kami Iron Mine', 'active', ['Project Management','Review of Impact Statement','Engagement Agreement Support']),
  proj('p42', 'Innu Nation - MPA Engagement Support', 'active', ['Project Management','Community Meetings','Reporting']),
  proj('p43', 'Innu Nation - Strange Lake Technical Support', 'active', ['General Support and Meetings','Community Meetings','Innu Knowledge Study','Socioec Study','Technical Review of EA','Negotiation Support','IAAC PFP - Reporting (EIS, EA, and meetings)']),
  proj('p44', 'Kopit Lodge - Centre Village 500MW Gas Plant', 'active', ['IAAC PFP (Planning Phase)','Project Management and Engagement Activities','Meetings w ProEnergy','Meetings w Government','Community Meetings','Mi\'kmaq Knowledge Study','Technical Support','IBA Negotiation']),
  proj('p45', 'Kopit Lodge - IPF Documentary', 'active', ['Project Management','Filming Trips','Editing, Coding, and Music','Production']),
  proj('p46', 'Kopit Lodge - NB Power Engagement Support', 'active', ['Project Management','Meetings with NB Power','Technical Review of EA','Mi\'kmaq Knowledge Study']),
  proj('p47', 'Kopit Lodge - Parks Canada Guardians Project (YEAR 3)', 'active', ['Internal Meetings','Meetings with Parks Canada','Document Review','Workshop and CCVM','Workshop Report','Guidance Document','Project Management and Coordination','Training Course Development','Training Sessions']),
  proj('p48', 'Kopit Lodge - Premiere Tech Support', 'active', ['General Support']),
  proj('p49', 'Kugluktuk HTO - Grays Bay Road and Port Project', 'active', ['Project Management','Technical Review','Knowedge Gathering/Mapping','Community Visit']),
  proj('p50', 'LKFN - Cantung Technical Support 2025-2026', 'active', ['Participation in CWG Meetings','Review Monthly SNP Reports and technical docs','Participation in Spring Flat River Tailings Closure Options Meeting','Participation in Spring/Summer Closure Prep Meeting','Participation in Fall/Winter Closure Prep Meeting','Membership Review of Closure Options','Site Visit Coordination','Site Visit','Project Management and Administration']),
  proj('p51', 'LKFN - Climate Change Guardians Project', 'active', ['Project Management','Monitoring Project Development','Training Workshop','Reporting']),
  proj('p52', 'LKFN - INRP Family Mapping & Environmental Training', 'active', ['Family map methodology','Family Map Fieldwork & Deliverables','Training Development','Training Delivery']),
  proj('p53', 'LKFN - Lands Department Support (INRP)', 'active', ['Climate Change Study Support (Invoice Climate Change Study)','Lands and Resources Department Support','Fort Simpson Community Plan Review (billed separately)']),
  proj('p54', 'LKFN - MVH Technical Review', 'active', ['Project Management','Technical Review','Information Requests','Technical Sessions','Community Meetings']),
  proj('p55', 'LKFN - Nogha Support', 'active', ['General Support']),
  proj('p56', 'LKFN - Norzinc Project Support', 'active', ['Project Management','Technical and Regulatory Support']),
  proj('p57', 'LSFN & WFN - Evolution FHCP Review', 'active', ['Technical Review','EMC Support']),
  proj('p58', 'Lubicon Lake - Peace River Nuclear Power Project', 'active', ['Project Management','TISG/IEPP Review','Meetings']),
  proj('p59', 'Piikani - CNFSAR Aquatic Restoration', 'active', ['Y3 - Project Management','Y3 - Fish Habitat Restoration and Research','Y3 - Community Workshop','Y3 - Reporting']),
  proj('p60', 'Piikani - Crown Mountain Technical Support', 'active', ['Project management','Community Meeting','Field Visits']),
  proj('p61', 'Piikani - Fording River Extension', 'active', ['Project Management and Coordination','Review of Impact Statement Guidelines and Indigenous Engagement and Participation Plan','Technical review of Detailed Project Description','Technical review of EIS','Meetings with Proponent or Regulators','Field Visits','Community Meeting','SCOPE CHANGE Review of AIP and JAEP']),
  proj('p62', 'Piikani - Grassy Mountain Technical Support', 'active', ['Project management']),
  proj('p63', 'Shared Spirits - Enviro Monitor Capacity Building', 'active', ['Project Management and Coordination','Biweekly Meetings incl. Prep','Training Workshop']),
  proj('p64', 'Shared Spirits - Evolution EMC 2026', 'active', ['Major Technical Reviews','Minor Technical Reviews','Participation in Quaterly Meetings / Site Visit','Weekly Technical Support']),
  proj('p65', 'Shared Spirits - Great Bear Advanced Exploration', 'active', ['Meetings','Document Review']),
  proj('p66', 'Shared Spirits - Great Bear Gold IA Support', 'active', ['Project Management','Review of Impact Statement']),
  proj('p67', 'Shared Spirits - WRLG Phase 1', 'active', ['Meetings','Document Review']),
];

export const SEED_TIME_ENTRIES = [];

export const SEED_EXPENSES = [];

export const SEED_PHASE_BUDGETS = {
  p3: {
    'Project Management': { fees: 3000,  expenses: 0    },
    'Research and Prep':  { fees: 5000,  expenses: 200  },
    'Workshop':           { fees: 4000,  expenses: 500  },
    'Field Sampling':     { fees: 8000,  expenses: 2000 },
    'Reporting':          { fees: 4000,  expenses: 0    },
  },
  p29: {
    'Project Management':               { fees: 4000,  expenses: 0 },
    'Technical and Regulatory Support': { fees: 12000, expenses: 0 },
  },
};

export const SEED_INVOICES = [
  { id: 'inv1', projectId: 'p3', dateSent: '2026-05-15', paid: true,  amount: 5000, description: 'Research and preparation phase completion' },
];

export function initSeedData() {
  if (localStorage.getItem('tm_seeded') !== 'v6') {
    localStorage.setItem('tm_users',        JSON.stringify(SEED_USERS));
    localStorage.setItem('tm_projects',     JSON.stringify(SEED_PROJECTS));
    localStorage.setItem('tm_time_entries', JSON.stringify(SEED_TIME_ENTRIES));
    localStorage.setItem('tm_expenses',     JSON.stringify(SEED_EXPENSES));
    localStorage.setItem('tm_phase_budgets',JSON.stringify(SEED_PHASE_BUDGETS));
    localStorage.setItem('tm_invoices',     JSON.stringify(SEED_INVOICES));
    localStorage.setItem('tm_seeded',       'v6');
  }
}
