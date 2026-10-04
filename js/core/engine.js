/* Core arithmetic: geography, travel inference, and the household cash-flow
 * model. All of this runs in the browser with no network call. */

/* ---- Geography -------------------------------------------------------- */

const R_EARTH = 6371; // km

export function haversine(a, b) {
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat), la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(h));
}

/* Straight-line distance understates road distance. A detour factor of ~1.3 is
   the usual planning approximation for Indian road networks. */
export const roadKm = straightKm => straightKm * 1.3;

/* Travel mode inferred from road distance. Daily-commute framing: a family is
   deciding whether the child can reach this centre every morning.
   Costs are per single trip, in rupees. */
const MODES = [
  { max: 2,    mode: 'Walk',             kmph: 4.5,  cost: () => 0,                daily: true  },
  { max: 6,    mode: 'Cycle',            kmph: 11,   cost: () => 0,                daily: true  },
  { max: 12,   mode: 'Auto / share-auto',kmph: 20,   cost: k => Math.round(k * 12), daily: true  },
  { max: 30,   mode: 'City bus',         kmph: 22,   cost: k => Math.round(8 + k * 1.6), daily: true  },
  { max: 70,   mode: 'State bus',        kmph: 34,   cost: k => Math.round(12 + k * 1.3), daily: false },
  { max: 200,  mode: 'Train / state bus',kmph: 45,   cost: k => Math.round(20 + k * 0.9), daily: false },
  { max: Infinity, mode: 'Train, hostel advised', kmph: 55, cost: k => Math.round(30 + k * 0.7), daily: false }
];

export function travelFor(straightKm) {
  const km = roadKm(straightKm);
  const m = MODES.find(x => km <= x.max);
  const minutes = Math.round((km / m.kmph) * 60);
  return {
    km: +km.toFixed(1),
    mode: m.mode,
    minutes,
    costOneWay: m.cost(km),
    commutable: m.daily,
    /* monthly cost assumes 24 teaching days, both ways */
    costMonthly: m.daily ? m.cost(km) * 2 * 24 : null
  };
}

/* ---- Household cash flow ---------------------------------------------- */

/* The central reframing: a family is not choosing a career, it is making a
 * household financial decision under uncertainty. This models the household's
 * net position month by month, fees out, stipend and wages in, rather than
 * quoting a salary figure that arrives at an unspecified time.
 *
 * Returns a month-indexed series up to `horizon` months.
 */
export function cashflow(path, { horizon = 48, wagePoint = 'mid' } = {}) {
  const wage = band => wagePoint === 'low'  ? band[0]
                     : wagePoint === 'high' ? band[1]
                     : (band[0] + band[1]) / 2;

  const entry = wage(path.entryWage);
  const later = wage(path.wage3yr);
  const feeMonthly = (path.feePerYear || 0) / 12;

  const series = [];
  let cumulative = 0;

  for (let m = 1; m <= horizon; m++) {
    let inflow = 0, outflow = 0;

    /* Fees run for the duration of the course. */
    if (m <= path.months) outflow += feeMonthly;

    /* Apprenticeship stipend, where the path has one. */
    if (path.stipendFromMonth && m > path.stipendFromMonth &&
        m <= path.stipendFromMonth + 12) {
      inflow += path.stipendMonthly;
    }

    /* Wage begins after the course ends, discounted by placement probability , 
       the expected value a household should actually plan against, not the
       best case. */
    if (m > path.months) {
      const monthsWorking = m - path.months;
      /* linear ramp from entry wage to the 3-year figure over 36 months */
      const t = Math.min(monthsWorking / 36, 1);
      const w = entry + (later - entry) * t;
      inflow += w * path.placement;
    }

    const net = inflow - outflow;
    cumulative += net;
    series.push({ month: m, inflow, outflow, net, cumulative });
  }

  return {
    pathId: path.id,
    series,
    breakEven: series.find(p => p.cumulative >= 0)?.month ?? null,
    at: m => series[m - 1]?.cumulative ?? 0,
    firstEarningMonth: path.stipendFromMonth
      ? path.stipendFromMonth + 1
      : path.months + 1
  };
}

export function compare(pathA, pathB, opts) {
  const a = cashflow(pathA, opts);
  const b = cashflow(pathB, opts);
  const marks = [12, 24, 36, 48];
  return {
    a, b,
    rows: marks.map(m => ({
      month: m,
      a: Math.round(a.at(m)),
      b: Math.round(b.at(m)),
      delta: Math.round(a.at(m) - b.at(m))
    })),
    /* the month at which the two paths cross, if they do */
    crossover: (() => {
      for (let m = 1; m <= 48; m++) {
        const prev = a.at(m - 1) - b.at(m - 1);
        const now  = a.at(m) - b.at(m);
        if (m > 1 && prev < 0 && now >= 0) return m;
      }
      return null;
    })()
  };
}

/* ---- Formatting -------------------------------------------------------- */

export const inr = n => {
  const v = Math.round(Math.abs(n));
  const s = v.toLocaleString('en-IN');
  return (n < 0 ? '−₹' : '₹') + s;
};

export const inrShort = n => {
  const v = Math.abs(Math.round(n));
  const sign = n < 0 ? '−' : '';
  if (v >= 1e5) return `${sign}₹${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `${sign}₹${Math.round(v / 1e3)}k`;
  return `${sign}₹${v}`;
};

export const months = n =>
  n == null ? ', '
  : n < 12   ? `${n} months`
  : n % 12 === 0 ? `${n / 12} year${n > 12 ? 's' : ''}`
  : `${Math.floor(n / 12)}y ${n % 12}m`;
