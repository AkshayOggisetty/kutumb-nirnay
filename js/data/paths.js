/* Career paths.
 *
 * SEEDED DEMONSTRATION DATA. Wage bands are representative figures in the shape
 * the Periodic Labour Force Survey (PLFS, MoSPI) publishes them — unit-level
 * earnings by education level. In production these are read from PLFS microdata
 * joined to courses through the NCVET Qualification-Pack-to-NCO-code mapping.
 * Placement rates sit in the band the CAG PMKVY audit (Report 20 of 2025)
 * observed nationally (41% for short-term training).
 *
 * Every figure below is labelled in the UI as simulated. Nothing here should be
 * presented as measured fact.
 */

export const PATHS = [
  {
    id: 'iti-electrician',
    kind: 'vocational',
    name: 'ITI — Electrician',
    nameHi: 'आईटीआई — इलेक्ट्रीशियन',
    nsqf: 4,
    nco: '7411',
    months: 24,
    feePerYear: 6200,
    stipendMonthly: 9000,          // during NAPS apprenticeship
    stipendFromMonth: 24,
    entryWage: [13000, 16000],
    wage3yr: [22000, 28000],
    placement: 0.65,
    demand: 'high',
    ladder: ['ITI (NSQF 4)', 'NAPS apprenticeship', 'Diploma via lateral entry', 'B.E. lateral (2nd yr)'],
    selfEmployable: true,
    note: 'Licensed trade. Wiring contracts and solar installation both draw from it.'
  },
  {
    id: 'iti-fitter',
    kind: 'vocational',
    name: 'ITI — Fitter',
    nameHi: 'आईटीआई — फिटर',
    nsqf: 4,
    nco: '7222',
    months: 24,
    feePerYear: 6200,
    stipendMonthly: 8500,
    stipendFromMonth: 24,
    entryWage: [12500, 15500],
    wage3yr: [20000, 26000],
    placement: 0.61,
    demand: 'high',
    ladder: ['ITI (NSQF 4)', 'NAPS apprenticeship', 'Diploma via lateral entry', 'Supervisor / shop floor lead'],
    selfEmployable: false,
    note: 'Core manufacturing trade; demand tracks industrial corridors.'
  },
  {
    id: 'cnc-operator',
    kind: 'short',
    name: 'CNC Machine Operator (PMKVY)',
    nameHi: 'सीएनसी ऑपरेटर',
    nsqf: 4,
    nco: '7223',
    months: 6,
    feePerYear: 0,                 // PMKVY short-term training is fee-free
    stipendMonthly: 0,
    stipendFromMonth: null,
    entryWage: [14000, 18000],
    wage3yr: [23000, 29000],
    placement: 0.48,
    demand: 'medium',
    ladder: ['PMKVY STT (NSQF 4)', 'On-job training', 'Setter', 'Programmer (CAM)'],
    selfEmployable: false,
    note: 'Fastest route to a first wage. Placement is the weak link — verify the centre.'
  },
  {
    id: 'solar-pv',
    kind: 'short',
    name: 'Solar PV Technician (PMKVY)',
    nameHi: 'सोलर पीवी तकनीशियन',
    nsqf: 4,
    nco: '7412',
    months: 3,
    feePerYear: 0,
    stipendMonthly: 0,
    stipendFromMonth: null,
    entryWage: [12000, 15000],
    wage3yr: [20000, 26000],
    placement: 0.44,
    demand: 'high',
    ladder: ['PMKVY STT (NSQF 4)', 'Installer', 'Site supervisor', 'Own installation contract'],
    selfEmployable: true,
    note: 'Rides the rooftop-solar push. Self-employment is realistic after ~2 years.'
  },
  {
    id: 'diploma-mech',
    kind: 'diploma',
    name: 'Diploma — Mechanical (Polytechnic)',
    nameHi: 'डिप्लोमा — मैकेनिकल',
    nsqf: 5,
    nco: '3115',
    months: 36,
    feePerYear: 18000,
    stipendMonthly: 0,
    stipendFromMonth: null,
    entryWage: [16000, 20000],
    wage3yr: [28000, 35000],
    placement: 0.55,
    demand: 'medium',
    ladder: ['Diploma (NSQF 5)', 'Junior Engineer', 'B.E. lateral entry (2nd yr)', 'Site / design engineer'],
    selfEmployable: false,
    note: 'The usual compromise path. Keeps the degree option fully open.'
  },
  {
    id: 'gnm-nursing',
    kind: 'vocational',
    name: 'GNM Nursing',
    nameHi: 'जीएनएम नर्सिंग',
    nsqf: 5,
    nco: '3221',
    months: 36,
    feePerYear: 42000,
    stipendMonthly: 0,
    stipendFromMonth: null,
    entryWage: [15000, 20000],
    wage3yr: [25000, 32000],
    placement: 0.72,
    demand: 'high',
    ladder: ['GNM (NSQF 5)', 'Staff nurse', 'B.Sc Nursing (post-basic)', 'Ward / ICU in-charge'],
    selfEmployable: false,
    note: 'Highest placement in this set. Fee is the barrier, not demand.'
  },
  {
    id: 'ba-general',
    kind: 'degree',
    name: 'B.A. (general)',
    nameHi: 'बी.ए. (सामान्य)',
    nsqf: 6,
    nco: '—',
    months: 36,
    feePerYear: 8500,
    stipendMonthly: 0,
    stipendFromMonth: null,
    entryWage: [10000, 14000],
    wage3yr: [16000, 22000],
    placement: 0.31,
    demand: 'low',
    ladder: ['B.A. (NSQF 6)', 'Competitive-exam preparation', 'M.A. / B.Ed', 'Government exam eligibility'],
    selfEmployable: false,
    note: 'Chosen most often. Keeps government-exam eligibility open — that is its real value, and it is a real value.'
  },
  {
    id: 'bsc-general',
    kind: 'degree',
    name: 'B.Sc (general)',
    nameHi: 'बी.एससी. (सामान्य)',
    nsqf: 6,
    nco: '—',
    months: 36,
    feePerYear: 12000,
    stipendMonthly: 0,
    stipendFromMonth: null,
    entryWage: [11000, 15000],
    wage3yr: [18000, 24000],
    placement: 0.36,
    demand: 'low',
    ladder: ['B.Sc (NSQF 6)', 'M.Sc / B.Ed', 'Lab technician', 'Government exam eligibility'],
    selfEmployable: false,
    note: 'Similar economics to B.A., slightly better technical entry.'
  }
];

export const byId = id => PATHS.find(p => p.id === id);

/* Which paths a household is likely to be weighing against each other.
   The default comparison the product opens with. */
export const DEFAULT_COMPARE = ['iti-electrician', 'ba-general'];

export const DEMAND_LABEL = {
  high:   { text: 'High local demand',   tone: 'ok' },
  medium: { text: 'Moderate demand',     tone: '' },
  low:    { text: 'Thin formal demand',  tone: 'warn' }
};
