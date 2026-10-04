/* The assistant layer.
 *
 * Grounding is the whole design. Every figure the model is allowed to speak
 * comes from the deterministic engine and is packed into a context object here.
 * The model explains, matches and phrases. It never calculates and never
 * invents a wage, a fee or a distance.
 *
 * If the assistant is unreachable or unconfigured, every screen still works.
 * Nothing in the product depends on it.
 */

import { PATHS, byId, INTERESTS, scorePath, DEMAND_LABEL } from '../data/paths.js';
import { OBJECTIONS } from '../data/voices.js';
import { CENTRES, CENTRE_TYPE, resolveDistrict, FALLBACK_ORIGIN } from '../data/centres.js';
import { cashflow, compare, haversine, travelFor, inr, months } from './engine.js';

/* Where the serverless function lives. Same origin when the app is served from
   the deployment that hosts /api. A static mirror can point elsewhere by adding
   <meta name="kn-api" content="https://...">. */
const API = (() => {
  const meta = document.querySelector('meta[name="kn-api"]');
  const base = meta?.content?.trim();
  return (base ? base.replace(/\/$/, '') : '') + '/api/chat';
})();

export const ai = {
  available: null,        // null unknown, true reachable, false not
  lastError: null
};

/* ------------------------------------------------------------ context */

function courseBrief(p, profile) {
  const cf = cashflow(p);
  return {
    id: p.id,
    name: p.name,
    family: p.family,
    months: p.months,
    feePerYear: p.feePerYear,
    totalFees: Math.round(p.feePerYear * p.months / 12),
    startingPay: `${inr(p.entryWage[0])} to ${inr(p.entryWage[1])} a month`,
    payAfterThreeYears: `${inr(p.wage3yr[0])} to ${inr(p.wage3yr[1])} a month`,
    placementRate: `${Math.round(p.placement * 100)}%`,
    earningBeginsMonth: cf.firstEarningMonth,
    householdBreaksEven: months(cf.breakEven),
    nsqfLevel: p.nsqf,
    ncoCode: p.nco || 'not applicable',
    localDemand: DEMAND_LABEL[p.demand].text,
    canSelfEmploy: p.selfEmployable,
    progression: p.ladder,
    matchScoreForThisFamily: profile ? scorePath(p, profile) : null
  };
}

function nearbyBrief(profile, courseIds) {
  const origin = resolveDistrict(profile?.district) || FALLBACK_ORIGIN;
  return CENTRES
    .map(c => {
      const t = travelFor(haversine(origin, c));
      return { c, t };
    })
    .filter(({ c }) => !courseIds?.length || c.trades.some(x => courseIds.includes(x)))
    .sort((a, b) => a.t.km - b.t.km)
    .slice(0, 6)
    .map(({ c, t }) => ({
      name: c.name,
      type: CENTRE_TYPE[c.type].label,
      government: c.govt,
      roadDistanceKm: t.km,
      travelMode: t.mode,
      journeyMinutesEachWay: t.minutes,
      monthlyTravelCost: t.costMonthly != null ? inr(t.costMonthly) : 'not a daily commute',
      seats: c.seats,
      coursesOffered: c.trades.map(id => byId(id)?.name).filter(Boolean)
    }));
}

/** Everything the model is permitted to know, built fresh on every call. */
export function buildContext(profile, opts = {}) {
  const [a, b] = (profile.compare || []).map(byId).filter(Boolean);
  const cmp = a && b ? compare(a, b) : null;

  const ranked = PATHS
    .map(p => ({ p, s: scorePath(p, profile) }))
    .sort((x, y) => y.s - x.s);

  const ctx = {
    household: {
      studentName: profile.name || 'not given',
      stage: profile.stage,
      district: profile.district,
      monthlyIncome: inr(profile.income),
      howSoonAnEarnerIsNeeded: {
        soon: 'within a year', flexible: 'two to three years', open: 'not a constraint'
      }[profile.urgency],
      studentEnjoys: (profile.interests || [])
        .map(i => INTERESTS.find(x => x.id === i)?.label).filter(Boolean)
    },
    rankedOptions: ranked.slice(0, 5).map(({ p, s }) => ({
      name: p.name, matchScore: s, placementRate: `${Math.round(p.placement * 100)}%`,
      months: p.months, totalFees: inr(p.feePerYear * p.months / 12)
    })),
    howMatchScoreWorks:
      'Starts at 50. Adds up to 30 for overlap with the interests chosen. Adds or ' +
      'subtracts for fees as a share of annual household income. Adjusts for how ' +
      'soon an earner is needed. Adds or subtracts based on placement rate.',
    shortlisted: (profile.shortlist || []).map(id => byId(id)?.name).filter(Boolean)
  };

  if (a && b && cmp) {
    ctx.comparison = {
      optionA: courseBrief(a, profile),
      optionB: courseBrief(b, profile),
      householdPositionAtFourYears: {
        [a.name]: inr(cmp.a.at(48)),
        [b.name]: inr(cmp.b.at(48))
      },
      whichIsAheadAtFourYears: cmp.a.at(48) >= cmp.b.at(48) ? a.name : b.name,
      note: 'Wages in these figures are already reduced by each course placement ' +
            'rate, so they describe the expected case, not the best case.'
    };
  }

  const courseIds = [...new Set([...(profile.shortlist || []), ...(profile.compare || [])])];
  ctx.nearestCentres = nearbyBrief(profile, courseIds);

  if (profile.concerns?.length) {
    ctx.concernsTheFamilyHasFlagged = OBJECTIONS
      .filter(o => profile.concerns.includes(o.id))
      .map(o => ({ raisedBy: o.voice, says: o.says, establishedAnswer: o.answer }));
  }

  ctx.knownConcernLibrary = OBJECTIONS.map(o => ({ says: o.says, answer: o.answer }));

  if (opts.extra) Object.assign(ctx, opts.extra);
  return ctx;
}

/* --------------------------------------------------------------- calls */

async function post(payload) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `assistant unavailable (${res.status})`);
    err.code = body.error || String(res.status);
    throw err;
  }
  return res.json();
}

/** Returns the reply text, or throws. Callers must handle the throw. */
export async function ask({ mode = 'concern', message = '', profile, history = [], extra }) {
  try {
    const out = await post({
      mode, message,
      context: buildContext(profile, { extra }),
      history: history.slice(-6)
    });
    ai.available = true;
    ai.lastError = null;
    return out.text.trim();
  } catch (err) {
    ai.available = false;
    ai.lastError = err.message;
    throw err;
  }
}

/** Plain language profile input. Returns a partial profile, or {}. */
export async function parseProfile(text, profile) {
  const raw = await ask({ mode: 'parse', message: text, profile });
  let obj = null;
  const attempts = [
    raw.trim(),
    raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim(),
    (raw.match(/\{[\s\S]*\}/) || [''])[0]    // first brace block, whatever surrounds it
  ];
  for (const a of attempts) {
    if (!a) continue;
    try { obj = JSON.parse(a); break; } catch { /* try the next shape */ }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};

  /* accept only known keys with sane values, never trust the shape blindly */
  const out = {};
  const stages = ['Class 10 appearing', 'Class 10 passed', 'Class 12 appearing', 'Class 12 passed'];
  const ids = INTERESTS.map(i => i.id);
  if (typeof obj.name === 'string' && obj.name.length < 60) out.name = obj.name;
  if (stages.includes(obj.stage)) out.stage = obj.stage;
  if (typeof obj.district === 'string' && obj.district.length < 80) out.district = obj.district;
  if (Number.isFinite(obj.income) && obj.income >= 2000 && obj.income <= 500000) {
    out.income = Math.round(obj.income / 1000) * 1000;
  }
  if (['soon', 'flexible', 'open'].includes(obj.urgency)) out.urgency = obj.urgency;
  if (Array.isArray(obj.interests)) {
    const keep = obj.interests.filter(i => ids.includes(i));
    if (keep.length) out.interests = [...new Set(keep)];
  }
  return out;
}

/** One line probe so the UI can show the assistant as available or not. */
export async function probe(profile) {
  try {
    await ask({ mode: 'explain', message: 'Reply with the single word ready.', profile });
    return true;
  } catch {
    return false;
  }
}
