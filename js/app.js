/* Kutumb Nirnay — prototype shell.
 *
 * Zero build, ES modules, no dependencies. Everything on screen is computed in
 * the browser; nothing is sent anywhere.
 */

import { PATHS, byId, DEMAND_LABEL } from './data/paths.js';
import { OBJECTIONS, ALUMNI } from './data/voices.js';
import { cashflow, compare, inr, inrShort, months } from './core/engine.js';
import { cashflowChart, barsChart, gapChart, SERIES } from './ui/charts.js';
import { NearbyPlate } from './ui/map.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------------------------------------------------------------- state */
const state = {
  section: 'home',
  household: {
    district: 'Pune, Maharashtra',
    income: 18000,          // monthly household income
    student: 'Class 10 passed',
    concern: 'o2'
  },
  compare: ['iti-electrician', 'ba-general'],
  lens: 'both',             // 'student' | 'parent' | 'both'
  resolved: new Set(),      // objections the family has worked through
  plan: null
};

const SECTIONS = [
  { id: 'home',      label: 'Home',          hi: '' },
  { id: 'household', label: 'The household', hi: 'परिवार' },
  { id: 'views',     label: 'Two views',     hi: 'दो नज़र' },
  { id: 'numbers',   label: 'The numbers',   hi: 'हिसाब' },
  { id: 'nearby',    label: 'Nearby',        hi: 'नज़दीक' },
  { id: 'answers',   label: 'Answers',       hi: 'सवाल' },
  { id: 'plan',      label: 'The plan',      hi: 'फ़ैसला' }
];

let plate = null;

/* ---------------------------------------------------------------- views */

function vHome() {
  return `
  <section class="hero">
    <span class="eyebrow">Career guidance for vocational education</span>
    <h1>The decision is made at home.<br>So that is where the counselling belongs.</h1>
    <p class="lede one-line">
      Kutumb Nirnay counsels the whole family — not just the student — turning a
      career argument into a shared, evidence-backed decision.
    </p>
    <div class="hero-cta">
      <button class="btn" data-go="household">Start with a household</button>
      <button class="btn ghost" data-go="numbers">See the numbers first</button>
    </div>
    <div class="hero-stats">
      <div><b class="num">1 : 3,000</b><span>counsellor to student ratio in India<br>(the recommended ratio is 1:250)</span></div>
      <div><b class="num">10.4%</b><span>of students have access to<br>professional career counselling</span></div>
      <div><b class="num">41%</b><span>placement under PMKVY short-term training<br>(CAG performance audit, 2025)</span></div>
    </div>
  </section>

  <section class="band">
    <h2>Every other tool talks to the student.</h2>
    <div class="three">
      <div class="card">
        <span class="eyebrow">What exists</span>
        <h4>A recommender for the child</h4>
        <p>Skill India Digital Hub already carries 7,500+ courses with AI-matched
        recommendations. The student-facing problem is solved.</p>
      </div>
      <div class="card">
        <span class="eyebrow">What is missing</span>
        <h4>Anyone speaking to the parent</h4>
        <p>The parent holds the veto and has never been shown a wage curve, a
        placement rate, or a neighbour who took the trade and did well.</p>
      </div>
      <div class="card accent">
        <span class="eyebrow">What this does</span>
        <h4>Counsels the household</h4>
        <p>Two views of one decision, the family's own cash flow, the centres within
        reach, and an answer to the objection actually being raised.</p>
      </div>
    </div>
  </section>`;
}

function vHousehold() {
  const h = state.household;
  return `
  <section class="sec">
    <span class="eyebrow">Step one · परिवार</span>
    <h2>Who is deciding, and under what constraints</h2>
    <p class="lede">Recommendations are conditioned on the household's economics, not
    just the student's aptitude. A path that needs three fee-paying years is a
    different proposition at ₹12,000 a month than at ₹40,000.</p>

    <div class="form-grid">
      <label>District
        <input id="f-district" value="${h.district}">
      </label>
      <label>Monthly household income
        <input id="f-income" type="range" min="6000" max="60000" step="1000" value="${h.income}">
        <output class="num">${inr(h.income)}</output>
      </label>
      <label>Student stage
        <select id="f-student">
          ${['Class 10 appearing','Class 10 passed','Class 12 appearing','Class 12 passed']
            .map(o => `<option${o === h.student ? ' selected' : ''}>${o}</option>`).join('')}
        </select>
      </label>
      <label>The objection being raised at home
        <select id="f-concern">
          ${OBJECTIONS.filter(o => o.voice === 'parent')
            .map(o => `<option value="${o.id}"${o.id === h.concern ? ' selected' : ''}>${o.says}</option>`).join('')}
        </select>
      </label>
    </div>

    <div class="paths-pick">
      <span class="eyebrow">The two paths on the table</span>
      <div class="pick-row">
        <div class="pick" data-slot="0">
          ${PATHS.map(p => `<button class="pbtn${state.compare[0] === p.id ? ' on' : ''}" data-slot="0" data-id="${p.id}">${p.name}</button>`).join('')}
        </div>
        <div class="vs">against</div>
        <div class="pick" data-slot="1">
          ${PATHS.map(p => `<button class="pbtn${state.compare[1] === p.id ? ' on' : ''}" data-slot="1" data-id="${p.id}">${p.name}</button>`).join('')}
        </div>
      </div>
    </div>

    <div class="sec-cta">
      <button class="btn" data-go="views">Open both views</button>
    </div>
  </section>`;
}

function pathCard(p, voice) {
  const d = DEMAND_LABEL[p.demand];
  const cf = cashflow(p);
  if (voice === 'student') {
    return `
      <div class="vcard">
        <span class="pill student">What you would actually do</span>
        <h3>${p.name}</h3>
        <p class="script">${p.nameHi}</p>
        <ul class="vlist">
          <li><b>${p.months} months</b> of training</li>
          <li>NSQF level <b>${p.nsqf}</b>${p.nco !== '—' ? ` · NCO <b class="num">${p.nco}</b>` : ''}</li>
          <li>${p.note}</li>
          <li><b>${p.selfEmployable ? 'Can work for yourself' : 'Employed role'}</b></li>
        </ul>
        <div class="ladder">
          <span class="eyebrow">Where it leads</span>
          <ol>${p.ladder.map(s => `<li>${s}</li>`).join('')}</ol>
        </div>
      </div>`;
  }
  return `
    <div class="vcard">
      <span class="pill parent">What it means for the household</span>
      <h3>${p.name}</h3>
      <ul class="vlist num-list">
        <li><span>First earning begins</span><b>month ${cf.firstEarningMonth}</b></li>
        <li><span>Fees over the course</span><b class="num">${inr(p.feePerYear * p.months / 12)}</b></li>
        <li><span>Starting wage</span><b class="num">${inrShort(p.entryWage[0])}–${inrShort(p.entryWage[1])}</b></li>
        <li><span>After three years</span><b class="num">${inrShort(p.wage3yr[0])}–${inrShort(p.wage3yr[1])}</b></li>
        <li><span>Placement rate</span><b class="num">${Math.round(p.placement * 100)}%</b></li>
        <li><span>Household breaks even</span><b>${months(cf.breakEven)}</b></li>
      </ul>
      <span class="pill ${d.tone}">${d.text}</span>
    </div>`;
}

function vViews() {
  const [a, b] = state.compare.map(byId);
  const lens = state.lens;
  return `
  <section class="sec">
    <span class="eyebrow">Step two · दो नज़र</span>
    <h2>One decision, rendered twice</h2>
    <p class="lede">The student and the parent are not asking the same question.
    The student wants to know what the work is. The parent wants to know when the
    money starts. Both deserve a straight answer — and they are looking at the
    same screen.</p>

    <div class="lens-switch">
      ${[['student','Student view'],['both','Both'],['parent','Parent view']]
        .map(([k, l]) => `<button class="lens${lens === k ? ' on' : ''}" data-lens="${k}">${l}</button>`).join('')}
    </div>

    <div class="views-grid lens-${lens}">
      <div class="vcol student-col">
        <div class="vcol-head"><span class="pill student">Student</span></div>
        ${pathCard(a, 'student')}
        ${pathCard(b, 'student')}
      </div>
      <div class="vcol parent-col">
        <div class="vcol-head"><span class="pill parent">Parent</span></div>
        ${pathCard(a, 'parent')}
        ${pathCard(b, 'parent')}
      </div>
    </div>

    <div class="sec-cta">
      <button class="btn" data-go="numbers">Put it on one chart</button>
    </div>
  </section>`;
}

function vNumbers() {
  const [a, b] = state.compare.map(byId);
  return `
  <section class="sec">
    <span class="eyebrow">Step three · हिसाब</span>
    <h2>A household decision, not a career choice</h2>
    <p class="lede">A family is not picking a profession. It is deciding how much to
    spend, for how long, before anyone starts earning — under uncertainty. So the
    chart that matters is the household's own balance, month by month.</p>

    <div class="chart-card">
      <div class="chart-head">
        <h3>Cumulative household position</h3>
        <p>Fees out, stipend and wages in. Wages are discounted by each path's
        placement rate — the figure a household should plan against, not the best case.</p>
      </div>
      <div id="cf-chart"></div>
      <div class="chart-legend">
        <span><i style="background:${SERIES.vocational}"></i>${a.name}</span>
        <span><i style="background:${SERIES.degree}"></i>${b.name}</span>
      </div>
      <div id="cf-summary" class="chart-summary"></div>
    </div>

    <div class="chart-card">
      <div class="chart-head">
        <h3>Placement rate by path</h3>
        <p>The single number most often missing from the conversation at home.</p>
      </div>
      <div id="pl-chart"></div>
      <p class="sim-note">Seeded demonstration figures, shaped to the bands reported
      in the CAG performance audit of PMKVY (Report 20 of 2025). Production reads
      PLFS microdata joined to courses through the NCVET Qualification-Pack-to-NCO mapping.</p>
    </div>

    <div class="chart-card">
      <div class="chart-head">
        <h3>What changes with Kutumb Nirnay</h3>
        <p>Left bar is the measured situation today, with its source. Right bar is
        this project's design target — stated as a target, not a result.</p>
      </div>
      <div id="gap-chart"></div>
    </div>

    <div class="sec-cta">
      <button class="btn" data-go="nearby">Find the centres within reach</button>
    </div>
  </section>`;
}

function vNearby() {
  return `
  <section class="sec">
    <span class="eyebrow">Step four · नज़दीक</span>
    <h2>Which of these is actually reachable</h2>
    <p class="lede">A path is only real if the household can get the child there every
    morning. Direction, road distance, travel mode, journey time and monthly fare —
    computed, not estimated by eye.</p>
    <div id="nearby-host"></div>
    <p class="sim-note">Centre records are seeded for demonstration at real
    coordinates, so distance and travel arithmetic behave correctly. Production
    draws from the DGT ITI directory (15,024 institutes), the PMKVY centre registry
    and AISHE college listings.</p>
    <div class="sec-cta">
      <button class="btn" data-go="answers">Answer the objection at home</button>
    </div>
  </section>`;
}

function vAnswers() {
  const current = OBJECTIONS.find(o => o.id === state.household.concern);
  return `
  <section class="sec">
    <span class="eyebrow">Step five · सवाल</span>
    <h2>Counselling is answering the actual objection</h2>
    <p class="lede">Not producing a recommendation. The thing standing between a
    family and a good decision is usually one specific sentence, said at home, that
    nobody has ever answered with evidence.</p>

    ${current ? `
    <div class="objection focus">
      <div class="obj-said">
        <span class="pill parent">Raised at home</span>
        <blockquote>“${current.says}”</blockquote>
        <p class="script">${current.saysHi || ''}</p>
      </div>
      <div class="obj-ans">
        <span class="eyebrow">The answer</span>
        <p>${current.answer}</p>
        <div class="obj-ev"><span class="pill ok">${current.evidence}</span></div>
        <p class="obj-counter">${current.counter}</p>
      </div>
    </div>` : ''}

    <h3 class="sub">Everything else families actually say</h3>
    <div class="obj-grid">
      ${OBJECTIONS.filter(o => o.id !== state.household.concern).map(o => `
        <button class="obj-card${state.resolved.has(o.id) ? ' done' : ''}" data-obj="${o.id}">
          <span class="pill ${o.voice}">${o.voice}</span>
          <blockquote>“${o.says}”</blockquote>
          <p>${o.answer}</p>
        </button>`).join('')}
    </div>

    <h3 class="sub">Four families within reach of here</h3>
    <p class="muted">The objection “what will people say” is never answered with a
    statistic. It is answered with neighbours.</p>
    <div class="alumni">
      ${ALUMNI.map(a => {
        const p = byId(a.path);
        return `
        <div class="al-card">
          <div class="al-head">
            <b>${a.name}</b>
            <span class="num">${a.km} km</span>
          </div>
          <span class="pill">${p ? p.name : a.path}</span>
          <p class="al-now">${a.now}</p>
          <p class="al-meta">
            ${a.wage ? `<b class="num">${inr(a.wage)}</b>/month · ` : ''}finished ${a.year} · ${a.block} block
          </p>
          <p class="al-note">${a.note}</p>
        </div>`;
      }).join('')}
    </div>
    <p class="sim-note">Alumni records are seeded for demonstration. In production
    these are consented, verified outcome records — which is also what matures this
    product into the district-level labour-market information the CAG audit found missing.</p>

    <div class="sec-cta">
      <button class="btn" data-go="plan">Write the family's plan</button>
    </div>
  </section>`;
}

function vPlan() {
  const [a, b] = state.compare.map(byId);
  const cmp = compare(a, b);
  const h = state.household;
  const worked = OBJECTIONS.filter(o => state.resolved.has(o.id));
  return `
  <section class="sec">
    <span class="eyebrow">Step six · फ़ैसला</span>
    <h2>Decision support needs an artefact</h2>
    <p class="lede">Not a recommendation page. A plan both sides have seen, with the
    disagreements named, the numbers attached, and a date to review it — because
    aspiration effects decay inside a fortnight, so the conversation has to continue.</p>

    <div class="plan-sheet" id="plan-sheet">
      <div class="ps-head">
        <div>
          <span class="eyebrow">Family decision record</span>
          <h3>${h.district}</h3>
        </div>
        <div class="ps-date"><span class="num">${new Date().toLocaleDateString('en-IN')}</span></div>
      </div>
      <hr class="rule">
      <div class="ps-grid">
        <div>
          <span class="eyebrow">Student stage</span><b>${h.student}</b>
        </div>
        <div>
          <span class="eyebrow">Household income</span><b class="num">${inr(h.income)}/month</b>
        </div>
        <div>
          <span class="eyebrow">Paths weighed</span><b>${a.name} · ${b.name}</b>
        </div>
        <div>
          <span class="eyebrow">Position at 4 years</span>
          <b class="num">${inr(cmp.a.at(48))} vs ${inr(cmp.b.at(48))}</b>
        </div>
      </div>
      <hr class="rule">
      <div class="ps-block">
        <span class="eyebrow">Concerns raised and answered</span>
        ${worked.length
          ? `<ul>${worked.map(o => `<li>“${o.says}” — ${o.evidence}</li>`).join('')}</ul>`
          : `<p class="muted">None marked yet. Open the Answers step and mark the ones
             your family has actually worked through.</p>`}
      </div>
      <div class="ps-block">
        <span class="eyebrow">Still open</span>
        <ul>${OBJECTIONS.filter(o => !state.resolved.has(o.id)).slice(0, 3)
          .map(o => `<li>“${o.says}”</li>`).join('')}</ul>
      </div>
      <hr class="rule">
      <div class="ps-foot">
        <div><span class="eyebrow">Student agrees</span><div class="sigline"></div></div>
        <div><span class="eyebrow">Parent agrees</span><div class="sigline"></div></div>
        <div><span class="eyebrow">Review on</span>
          <div class="sigline num">${new Date(Date.now() + 21 * 864e5).toLocaleDateString('en-IN')}</div></div>
      </div>
    </div>

    <div class="plan-actions">
      <button class="btn" id="print-plan">Print / save as PDF</button>
      <button class="btn ghost" data-go="home">Start again</button>
    </div>
    <p class="muted centre">Parents trust paper, and paper travels to the relatives
    who also get a say. The printed sheet is a deliberate output, not a fallback.</p>
  </section>`;
}

/* ---------------------------------------------------------------- render */

const VIEWS = { home: vHome, household: vHousehold, views: vViews,
                numbers: vNumbers, nearby: vNearby, answers: vAnswers, plan: vPlan };

function render() {
  $('#view').innerHTML = VIEWS[state.section]();
  $$('.nav-link').forEach(l => l.classList.toggle('on', l.dataset.go === state.section));
  window.scrollTo({ top: 0, behavior: 'instant' });
  afterRender();
  location.hash = '#/' + state.section;
}

function afterRender() {
  /* navigation buttons anywhere in the view */
  $$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

  if (state.section === 'household') wireHousehold();
  if (state.section === 'views') {
    $$('.lens').forEach(b => b.addEventListener('click', () => { state.lens = b.dataset.lens; render(); }));
  }
  if (state.section === 'numbers') drawNumbers();
  if (state.section === 'nearby') {
    plate = new NearbyPlate($('#nearby-host'));
    plate.render();
  }
  if (state.section === 'answers') {
    $$('.obj-card').forEach(c => c.addEventListener('click', () => {
      const id = c.dataset.obj;
      state.resolved.has(id) ? state.resolved.delete(id) : state.resolved.add(id);
      c.classList.toggle('done');
    }));
  }
  if (state.section === 'plan') {
    $('#print-plan')?.addEventListener('click', () => window.print());
  }
}

function wireHousehold() {
  const h = state.household;
  $('#f-district')?.addEventListener('input', e => h.district = e.target.value);
  $('#f-income')?.addEventListener('input', e => {
    h.income = +e.target.value;
    e.target.nextElementSibling.textContent = inr(h.income);
  });
  $('#f-student')?.addEventListener('change', e => h.student = e.target.value);
  $('#f-concern')?.addEventListener('change', e => h.concern = e.target.value);
  $$('.pbtn').forEach(b => b.addEventListener('click', () => {
    const slot = +b.dataset.slot;
    state.compare[slot] = b.dataset.id;
    render();
  }));
}

function drawNumbers() {
  const [a, b] = state.compare.map(byId);
  const cmp = compare(a, b);

  cashflowChart($('#cf-chart'), cmp, a.name.split('—')[0].trim(), b.name.split('(')[0].trim());

  const cross = cmp.crossover;
  $('#cf-summary').innerHTML = `
    <div><span class="eyebrow">Break-even</span>
      <b>${a.name}: ${months(cmp.a.breakEven)}</b> · <b>${b.name}: ${months(cmp.b.breakEven)}</b></div>
    <div><span class="eyebrow">At four years</span>
      <b class="num">${inr(cmp.a.at(48))}</b> against <b class="num">${inr(cmp.b.at(48))}</b></div>
    ${cross ? `<div><span class="eyebrow">Paths cross</span><b>month ${cross}</b> — before that the
      degree is ahead; after it, it is not</div>` : ''}`;

  barsChart($('#pl-chart'),
    PATHS.map(p => ({
      label: p.name,
      value: p.placement * 100,
      note: `${p.months} months · ${p.feePerYear ? inr(p.feePerYear) + '/yr' : 'no fee'}`,
      tone: p.kind === 'degree' ? '#3f62c4' : '#c2701c'
    })).sort((x, y) => y.value - x.value),
    { unit: '%', max: 100 });

  gapChart($('#gap-chart'), [
    {
      label: 'Students reached by counselling',
      source: 'UN study across 21,239 students, 7 states',
      now: 10.4, target: 70, max: 100,
      nowNote: 'Only 10.4% have access to professional career counselling.',
      targetNote: 'Design target: a counselling conversation delivered to the household by phone, without a counsellor in the room.'
    },
    {
      label: 'Decisions where the parent saw wage data',
      source: 'Parental-perception literature; no measured baseline exists',
      now: 8, target: 90, max: 100,
      nowNote: 'Parents decide on status because nobody has put the comparison in front of them.',
      targetNote: 'Design target: every household sees placement rate, wage band and break-even before deciding.'
    },
    {
      label: 'Short-term training ending in placement',
      source: 'CAG performance audit of PMKVY, Report 20 of 2025',
      now: 41, target: 65, max: 100,
      nowNote: 'The audit also found training "not aligned with region-specific skill gaps".',
      targetNote: 'Design target via district demand signal — the audit named the absence of micro-level skill-gap assessment as a cause.'
    },
    {
      label: 'Counsellor reach',
      source: 'Approx. 10,000 counsellors for 26.5 crore students',
      now: 1, target: 12, max: 12,
      fmt: v => v === 1 ? '1 : 3,000' : '1 : 250 equivalent',
      nowNote: 'India runs roughly one counsellor per 3,000 students.',
      targetNote: 'Design target: AI absorbs the informational load and triages the families that need a human, so the counsellor is not replaced but extended.'
    }
  ]);
}

function go(id) {
  if (!VIEWS[id]) return;
  state.section = id;
  render();
}

/* ------------------------------------------------------------------ boot */
function boot() {
  $('#nav').innerHTML = SECTIONS.map(s =>
    `<button class="nav-link" data-go="${s.id}">
       ${s.label}${s.hi ? `<span class="script">${s.hi}</span>` : ''}
     </button>`).join('');
  $$('.nav-link').forEach(l => l.addEventListener('click', () => go(l.dataset.go)));

  const fromHash = location.hash.replace('#/', '');
  state.section = VIEWS[fromHash] ? fromHash : 'home';
  render();

  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#/', '');
    if (VIEWS[h] && h !== state.section) { state.section = h; render(); }
  });
}

document.addEventListener('DOMContentLoaded', boot);
