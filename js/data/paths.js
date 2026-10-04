/* Career paths available to a school leaver.
 *
 * Wage bands follow the shape the Periodic Labour Force Survey publishes
 * earnings by education level. Courses link to occupations through NSQF
 * qualification levels and NCO occupation codes.
 */

export const PATHS = [
  {
    id: 'iti-electrician',
    kind: 'vocational',
    name: 'ITI Electrician',
    short: 'Electrician',
    family: 'Trade',
    nsqf: 4,
    nco: '7411',
    months: 24,
    feePerYear: 6200,
    stipendMonthly: 9000,
    stipendFromMonth: 24,
    entryWage: [13000, 16000],
    wage3yr: [22000, 28000],
    placement: 0.65,
    demand: 'high',
    interests: ['hands-on', 'technical', 'electrical'],
    ladder: ['ITI, NSQF level 4', 'Apprenticeship under NAPS', 'Diploma by lateral entry', 'B.E. direct second year'],
    selfEmployable: true,
    blurb: 'A licensed trade. Wiring contracts and rooftop solar installation both recruit from it, and the licence travels with you between employers.'
  },
  {
    id: 'iti-fitter',
    kind: 'vocational',
    name: 'ITI Fitter',
    short: 'Fitter',
    family: 'Trade',
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
    interests: ['hands-on', 'technical', 'machines'],
    ladder: ['ITI, NSQF level 4', 'Apprenticeship under NAPS', 'Diploma by lateral entry', 'Shop floor supervisor'],
    selfEmployable: false,
    blurb: 'A core manufacturing trade. Demand follows industrial corridors, so placement is strongest near a manufacturing belt.'
  },
  {
    id: 'cnc-operator',
    kind: 'short',
    name: 'CNC Machine Operator',
    short: 'CNC Operator',
    family: 'Short course',
    nsqf: 4,
    nco: '7223',
    months: 6,
    feePerYear: 0,
    stipendMonthly: 0,
    stipendFromMonth: null,
    entryWage: [14000, 18000],
    wage3yr: [23000, 29000],
    placement: 0.48,
    demand: 'medium',
    interests: ['technical', 'machines', 'computers'],
    ladder: ['Short term training, NSQF level 4', 'On job training', 'Machine setter', 'CAM programmer'],
    selfEmployable: false,
    blurb: 'The fastest route to a first wage, with no course fee. Placement varies a lot between training centres, so check the centre record before enrolling.'
  },
  {
    id: 'solar-pv',
    kind: 'short',
    name: 'Solar PV Technician',
    short: 'Solar Technician',
    family: 'Short course',
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
    interests: ['hands-on', 'outdoors', 'electrical'],
    ladder: ['Short term training, NSQF level 4', 'Installer', 'Site supervisor', 'Own installation contracts'],
    selfEmployable: true,
    blurb: 'Three months, no fee, and demand is rising with rooftop solar. Working for yourself becomes realistic after about two years on site.'
  },
  {
    id: 'diploma-mech',
    kind: 'diploma',
    name: 'Diploma in Mechanical Engineering',
    short: 'Mechanical Diploma',
    family: 'Diploma',
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
    interests: ['technical', 'machines', 'study'],
    ladder: ['Diploma, NSQF level 5', 'Junior engineer', 'B.E. direct second year', 'Design or site engineer'],
    selfEmployable: false,
    blurb: 'The middle route. Three years at a polytechnic, and the engineering degree stays fully open through lateral entry.'
  },
  {
    id: 'gnm-nursing',
    kind: 'vocational',
    name: 'GNM Nursing',
    short: 'Nursing',
    family: 'Healthcare',
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
    interests: ['care', 'health', 'study'],
    ladder: ['GNM, NSQF level 5', 'Staff nurse', 'Post basic B.Sc Nursing', 'Ward or ICU in charge'],
    selfEmployable: false,
    blurb: 'The highest placement rate of any path here. The course fee is the real barrier, not finding work afterwards.'
  },
  {
    id: 'ba-general',
    kind: 'degree',
    name: 'B.A. General',
    short: 'B.A.',
    family: 'Degree',
    nsqf: 6,
    nco: null,
    months: 36,
    feePerYear: 8500,
    stipendMonthly: 0,
    stipendFromMonth: null,
    entryWage: [10000, 14000],
    wage3yr: [16000, 22000],
    placement: 0.31,
    demand: 'low',
    interests: ['study', 'office', 'government'],
    ladder: ['B.A., NSQF level 6', 'Competitive exam preparation', 'M.A. or B.Ed', 'Government service'],
    selfEmployable: false,
    blurb: 'The most common choice. Its genuine value is eligibility for government examinations, and that is a real reason to pick it.'
  },
  {
    id: 'bsc-general',
    kind: 'degree',
    name: 'B.Sc General',
    short: 'B.Sc',
    family: 'Degree',
    nsqf: 6,
    nco: null,
    months: 36,
    feePerYear: 12000,
    stipendMonthly: 0,
    stipendFromMonth: null,
    entryWage: [11000, 15000],
    wage3yr: [18000, 24000],
    placement: 0.36,
    demand: 'low',
    interests: ['study', 'technical', 'government'],
    ladder: ['B.Sc, NSQF level 6', 'M.Sc or B.Ed', 'Laboratory technician', 'Government service'],
    selfEmployable: false,
    blurb: 'Similar economics to a B.A., with a slightly better route into technical and laboratory roles.'
  }
];

export const byId = id => PATHS.find(p => p.id === id);

export const INTERESTS = [
  { id: 'hands-on',   label: 'Working with my hands' },
  { id: 'technical',  label: 'Technical and mechanical work' },
  { id: 'machines',   label: 'Machines and manufacturing' },
  { id: 'electrical', label: 'Electrical and wiring work' },
  { id: 'computers',  label: 'Computers' },
  { id: 'outdoors',   label: 'Working outdoors' },
  { id: 'care',       label: 'Caring for people' },
  { id: 'health',     label: 'Health and medicine' },
  { id: 'study',      label: 'Classroom study' },
  { id: 'office',     label: 'Office work' },
  { id: 'government', label: 'Government service' }
];

export const DEMAND_LABEL = {
  high:   { text: 'Strong local demand', tone: 'ok' },
  medium: { text: 'Moderate demand',     tone: '' },
  low:    { text: 'Limited formal demand', tone: 'warn' }
};

/* Score a path against the student's stated interests and the household budget.
   Returns 0 to 100. Used to order the Explore screen. */
export function scorePath(path, profile) {
  let score = 50;

  const chosen = profile.interests || [];
  if (chosen.length) {
    const hits = path.interests.filter(i => chosen.includes(i)).length;
    score += (hits / Math.max(chosen.length, 1)) * 30;
  }

  /* Affordability: annual fee against annual household income. */
  const annualIncome = (profile.income || 18000) * 12;
  const feeShare = (path.feePerYear * (path.months / 12)) / annualIncome;
  if (feeShare < 0.05) score += 12;
  else if (feeShare < 0.12) score += 6;
  else if (feeShare > 0.30) score -= 14;

  /* Households that need an earner sooner weight shorter courses. */
  if (profile.urgency === 'soon') {
    if (path.months <= 6) score += 14;
    else if (path.months <= 24) score += 6;
    else score -= 10;
  }

  score += (path.placement - 0.5) * 24;

  return Math.max(4, Math.min(99, Math.round(score)));
}
