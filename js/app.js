/* Kutumb Nirnay
 *
 * Career guidance built around the household rather than the student alone.
 * Runs entirely in the browser. Nothing is uploaded and nothing leaves the device.
 */

import { PATHS, byId, INTERESTS, DEMAND_LABEL, scorePath } from './data/paths.js';
import { OBJECTIONS, ALUMNI } from './data/voices.js';
import { cashflow, compare, inr, inrShort, months } from './core/engine.js';
import { cashflowChart, barsChart, SERIES } from './ui/charts.js';
import { CentreFinder } from './ui/map.js';
import { Assistant } from './ui/chat.js';
import { ask, parseProfile } from './core/ai.js';

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const KEY = 'kn.profile.v1';

/* ------------------------------------------------------------------ state */
const defaults = () => ({
  name: '',
  stage: 'Class 10 passed',
  district: 'Pune, Maharashtra',
  income: 18000,
  urgency: 'flexible',
  interests: [],
  compare: ['iti-electrician', 'ba-general'],
  lens: 'both',
  concerns: [],
  shortlist: []
});

let profile = load();
let finder = null;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch (e) { /* storage unavailable, fall through */ }
  return defaults();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch (e) { /* ignore */ }
}

const SECTIONS = [
  { id: 'start',    label: 'Start' },
  { id: 'profile',  label: 'Your details' },
  { id: 'explore',  label: 'Explore options' },
  { id: 'compare',  label: 'Compare two' },
  { id: 'centres',  label: 'Find centres' },
  { id: 'concerns', label: 'Family concerns' },
  { id: 'plan',     label: 'Your plan' }
];

const profileComplete = () => profile.interests.length > 0;

/* ------------------------------------------------------------------ views */

function vStart() {
  const resuming = profile.name || profile.interests.length;
  return `
  <section class="hero">
    <p class="kicker">Career guidance for families</p>
    <h1>The decision is made at home, so that is where the guidance belongs.</h1>
    <p class="lede">
      Most career advice speaks only to the student. Kutumb Nirnay is built for the
      whole family, so that the person who actually decides can see what a course
      costs, when the earning starts, and how often it ends in a job.
    </p>
    <div class="row">
      <button class="btn" data-go="profile">${resuming ? 'Continue' : 'Get started'}</button>
      <button class="btn ghost" data-go="explore">Browse all options</button>
    </div>
    ${resuming ? `<p class="hint">Picking up where you left off. <button class="linkbtn" data-act="reset">Start again</button></p>` : ''}
  </section>

  <section class="block">
    <h2>What you get</h2>
    <div class="grid-3">
      <article class="card">
        <span class="step-n">1</span>
        <h3>Options matched to your household</h3>
        <p>Courses ranked by what interests the student and what the family can
        realistically afford to wait for.</p>
      </article>
      <article class="card">
        <span class="step-n">2</span>
        <h3>The numbers both of you need</h3>
        <p>Fees, the month earning begins, placement rates, and the point at which
        the household is ahead.</p>
      </article>
      <article class="card">
        <span class="step-n">3</span>
        <h3>Centres you can actually reach</h3>
        <p>Every institute near you with the distance, the way to travel, the journey
        time and what the commute costs each month.</p>
      </article>
    </div>
  </section>`;
}

function vProfile() {
  return `
  <section class="sec">
    <p class="kicker">Step 1 of 4</p>
    <h2>Tell us about the student and the household</h2>
    <p class="lede">Everything you enter stays on this device. These answers shape the
    options you are shown and the numbers used to compare them.</p>

    <div class="nl-box">
      <label class="field">
        <span class="field-label">Describe your situation in your own words</span>
        <textarea id="nl-input" rows="2" maxlength="500"
          placeholder="For example: my daughter just finished class 10 in Nashik, we earn around 20 thousand a month, she likes working with her hands"></textarea>
      </label>
      <div class="row">
        <button class="btn sm" id="nl-go">Fill the form from this</button>
        <span class="hint" id="nl-status"></span>
      </div>
    </div>

    <form class="form" id="profile-form" autocomplete="off">
      <div class="field-row">
        <label class="field">
          <span class="field-label">Student name <em>(optional)</em></span>
          <input type="text" name="name" value="${esc(profile.name)}" placeholder="For your printed plan">
        </label>
        <label class="field">
          <span class="field-label">Current stage</span>
          <select name="stage">
            ${['Class 10 appearing', 'Class 10 passed', 'Class 12 appearing', 'Class 12 passed']
              .map(o => `<option${o === profile.stage ? ' selected' : ''}>${o}</option>`).join('')}
          </select>
        </label>
      </div>

      <div class="field-row">
        <label class="field">
          <span class="field-label">District</span>
          <input type="text" name="district" value="${esc(profile.district)}" placeholder="District and state">
        </label>
        <label class="field">
          <span class="field-label">Monthly household income
            <output class="out num" id="income-out">${inr(profile.income)}</output>
          </span>
          <input type="range" name="income" min="5000" max="80000" step="1000" value="${profile.income}">
        </label>
      </div>

      <fieldset class="field">
        <span class="field-label">How soon does the household need another earner?</span>
        <div class="radio-row">
          ${[['soon', 'Within a year'], ['flexible', 'We can wait two to three years'], ['open', 'Not a constraint']]
            .map(([v, l]) => `
            <label class="radio${profile.urgency === v ? ' on' : ''}">
              <input type="radio" name="urgency" value="${v}"${profile.urgency === v ? ' checked' : ''}>
              <span>${l}</span>
            </label>`).join('')}
        </div>
      </fieldset>

      <fieldset class="field">
        <span class="field-label">What does the student enjoy? Choose any that apply.</span>
        <div class="chips" id="interest-chips">
          ${INTERESTS.map(i => `
            <button type="button" class="chip${profile.interests.includes(i.id) ? ' on' : ''}"
                    data-interest="${i.id}">${i.label}</button>`).join('')}
        </div>
        <p class="hint" id="interest-hint">${profile.interests.length
          ? `${profile.interests.length} selected`
          : 'Select at least one to see matched options.'}</p>
      </fieldset>
    </form>

    <div class="row sticky-cta">
      <button class="btn" data-go="explore" id="to-explore" ${profileComplete() ? '' : 'disabled'}>
        See matched options
      </button>
      <button class="btn ghost" data-go="explore">Skip and browse everything</button>
    </div>
  </section>`;
}

function vExplore() {
  const scored = PATHS
    .map(p => ({ p, score: scorePath(p, profile) }))
    .sort((a, b) => b.score - a.score);

  return `
  <section class="sec">
    <p class="kicker">Step 2 of 4</p>
    <h2>Options ranked for this household</h2>
    <p class="lede">${profile.interests.length
      ? 'Ordered by how well each option matches the interests you chose, what the household can afford, and how often the course ends in a job.'
      : 'Showing every option. Add interests on the previous step to rank them for your household.'}</p>

    <div class="toolbar">
      <div class="chips" id="family-filter">
        ${['All', 'Trade', 'Short course', 'Diploma', 'Healthcare', 'Degree']
          .map(f => `<button class="chip${(profile.familyFilter || 'All') === f ? ' on' : ''}" data-family="${f}">${f}</button>`).join('')}
      </div>
      <p class="hint">${scored.length} options</p>
    </div>

    <div class="path-grid" id="path-grid">
      ${scored
        .filter(({ p }) => !profile.familyFilter || profile.familyFilter === 'All' || p.family === profile.familyFilter)
        .map(({ p, score }) => pathCard(p, score)).join('')}
    </div>

    <div class="row sticky-cta">
      <button class="btn" data-go="compare">Compare two options</button>
      <button class="btn ghost" data-go="profile">Change my details</button>
    </div>
  </section>`;
}

function pathCard(p, score) {
  const d = DEMAND_LABEL[p.demand];
  const cf = cashflow(p);
  const picked = profile.shortlist.includes(p.id);
  return `
    <article class="path-card${picked ? ' picked' : ''}">
      <header>
        <div>
          <span class="tag">${p.family}</span>
          <span class="tag ${d.tone}">${d.text}</span>
          <h3>${p.name}</h3>
        </div>
        <div class="match" title="How well this fits your answers">
          <b class="num">${score}</b><span>match</span>
        </div>
      </header>
      <p class="path-blurb">${p.blurb}</p>
      <dl class="path-facts">
        <div><dt>Course length</dt><dd>${p.months} months</dd></div>
        <div><dt>Course fee</dt><dd class="num">${p.feePerYear ? inr(p.feePerYear) + ' a year' : 'None'}</dd></div>
        <div><dt>Earning starts</dt><dd>month ${cf.firstEarningMonth}</dd></div>
        <div><dt>Starting pay</dt><dd class="num">${inrShort(p.entryWage[0])} to ${inrShort(p.entryWage[1])}</dd></div>
        <div><dt>Finds work</dt><dd class="num">${Math.round(p.placement * 100)}% of the time</dd></div>
        <div><dt>Qualification</dt><dd>NSQF ${p.nsqf}</dd></div>
      </dl>
      <footer>
        <button class="btn sm${picked ? ' ghost' : ''}" data-shortlist="${p.id}">
          ${picked ? 'Remove from shortlist' : 'Add to shortlist'}
        </button>
        <button class="linkbtn" data-detail="${p.id}">Full details</button>
      </footer>
    </article>`;
}

function vCompare() {
  const [a, b] = profile.compare.map(byId);
  const cmp = compare(a, b);
  return `
  <section class="sec">
    <p class="kicker">Step 3 of 4</p>
    <h2>Put two options side by side</h2>
    <p class="lede">The student and the parent are not asking the same question. Switch
    between the two views, or keep both on screen.</p>

    <div class="compare-pickers">
      <label class="field">
        <span class="field-label">First option</span>
        <select data-slot="0">
          ${PATHS.map(p => `<option value="${p.id}"${p.id === a.id ? ' selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </label>
      <span class="vs">against</span>
      <label class="field">
        <span class="field-label">Second option</span>
        <select data-slot="1">
          ${PATHS.map(p => `<option value="${p.id}"${p.id === b.id ? ' selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </label>
    </div>

    <div class="segmented" role="tablist">
      ${[['student', 'Student view'], ['both', 'Both'], ['parent', 'Parent view']]
        .map(([k, l]) => `<button role="tab" class="seg${profile.lens === k ? ' on' : ''}" data-lens="${k}">${l}</button>`).join('')}
    </div>

    <div class="compare-grid lens-${profile.lens}">
      <div class="col student-col">
        <h4 class="col-head">What the student would be doing</h4>
        ${viewCard(a, 'student')}
        ${viewCard(b, 'student')}
      </div>
      <div class="col parent-col">
        <h4 class="col-head">What it means for the household</h4>
        ${viewCard(a, 'parent')}
        ${viewCard(b, 'parent')}
      </div>
    </div>

    <div class="panel">
      <h3>Household position over four years</h3>
      <p class="panel-sub">Course fees going out, stipend and wages coming in. Wages are
      adjusted for how often each course actually leads to a job, so this is what the
      household can reasonably plan around rather than a best case.</p>
      <div id="cf-chart"></div>
      <div class="legend">
        <span><i style="background:${SERIES.vocational}"></i>${a.short}</span>
        <span><i style="background:${SERIES.degree}"></i>${b.short}</span>
      </div>
      <div class="summary" id="cf-summary"></div>
    </div>

    <div class="panel">
      <h3>How often each course leads to a job</h3>
      <div id="pl-chart"></div>
    </div>

    <div class="row sticky-cta">
      <button class="btn" data-go="centres">Find centres near me</button>
    </div>
  </section>`;
}

function viewCard(p, voice) {
  const cf = cashflow(p);
  if (voice === 'student') {
    return `
      <article class="vcard">
        <h3>${p.name}</h3>
        <p class="path-blurb">${p.blurb}</p>
        <ul class="plain">
          <li><b>${p.months} months</b> of training</li>
          <li>Qualification level <b>NSQF ${p.nsqf}</b>${p.nco ? `, occupation code <b class="num">${p.nco}</b>` : ''}</li>
          <li>${p.selfEmployable ? 'You can work for yourself later' : 'Usually an employed role'}</li>
        </ul>
        <div class="ladder">
          <span class="field-label">Where it can lead</span>
          <ol>${p.ladder.map(s => `<li>${s}</li>`).join('')}</ol>
        </div>
      </article>`;
  }
  return `
    <article class="vcard">
      <h3>${p.name}</h3>
      <dl class="kv">
        <div><dt>Earning begins</dt><dd>month ${cf.firstEarningMonth}</dd></div>
        <div><dt>Total course fees</dt><dd class="num">${inr(p.feePerYear * p.months / 12)}</dd></div>
        <div><dt>Starting pay</dt><dd class="num">${inrShort(p.entryWage[0])} to ${inrShort(p.entryWage[1])}</dd></div>
        <div><dt>After three years</dt><dd class="num">${inrShort(p.wage3yr[0])} to ${inrShort(p.wage3yr[1])}</dd></div>
        <div><dt>Finds work</dt><dd class="num">${Math.round(p.placement * 100)}%</dd></div>
        <div><dt>Household breaks even</dt><dd>${months(cf.breakEven)}</dd></div>
      </dl>
    </article>`;
}

function vCentres() {
  return `
  <section class="sec">
    <p class="kicker">Step 4 of 4</p>
    <h2>Which centres are actually within reach</h2>
    <p class="lede">A course is only a real option if the student can get there. Select
    any centre to see the distance, how to travel, how long it takes and what the
    journey costs each month.</p>
    <div id="finder-host"></div>
  </section>`;
}

function vConcerns() {
  const mine = profile.concerns;
  return `
  <section class="sec">
    <p class="kicker">Family concerns</p>
    <h2>The questions that actually come up at home</h2>
    <p class="lede">Select the ones being raised in your family. Each has an answer you
    can take back to the conversation, and they carry into your printed plan.</p>

    <div class="concern-list">
      ${OBJECTIONS.map(o => `
        <article class="concern${mine.includes(o.id) ? ' on' : ''}">
          <button class="concern-head" data-concern="${o.id}">
            <span class="tag ${o.voice}">${o.voice === 'parent' ? 'Parent' : 'Student'}</span>
            <span class="tag">${o.theme}</span>
            <q>${o.says}</q>
            <span class="concern-mark">${mine.includes(o.id) ? 'Selected' : 'Select'}</span>
          </button>
          <div class="concern-body">
            <p>${o.answer}</p>
            <p class="concern-counter">${o.counter}</p>
          </div>
        </article>`).join('')}
    </div>

    <h3 class="sub">People near you who took these routes</h3>
    <p class="hint">The question of what people will say is rarely settled by a statistic.</p>
    <div class="alumni">
      ${ALUMNI.map(a => {
        const p = byId(a.path);
        return `
        <article class="al-card">
          <header><b>${a.name}</b><span class="num">${a.km} km</span></header>
          <span class="tag">${p ? p.name : a.path}</span>
          <p class="al-now">${a.now}</p>
          <p class="al-meta">${a.wage ? `<b class="num">${inr(a.wage)}</b> a month, ` : ''}finished ${a.year}, ${a.block} block</p>
          <p class="al-note">${a.note}</p>
        </article>`;
      }).join('')}
    </div>

    <div class="row sticky-cta">
      <button class="btn" data-go="plan">Build my plan</button>
    </div>
  </section>`;
}

function vPlan() {
  const [a, b] = profile.compare.map(byId);
  const cmp = compare(a, b);
  const picked = profile.shortlist.map(byId).filter(Boolean);
  const chosen = OBJECTIONS.filter(o => profile.concerns.includes(o.id));
  const review = new Date(Date.now() + 21 * 864e5).toLocaleDateString('en-IN');

  return `
  <section class="sec">
    <p class="kicker">Your plan</p>
    <h2>A record both of you can sign</h2>
    <p class="lede">Print this, or save it as a PDF. It travels to the relatives who also
    have a say but were not part of the conversation.</p>

    <div class="sheet" id="sheet">
      <header class="sheet-head">
        <div>
          <span class="field-label">Family career plan</span>
          <h3>${esc(profile.name) || 'Student'}, ${esc(profile.district)}</h3>
        </div>
        <span class="num">${new Date().toLocaleDateString('en-IN')}</span>
      </header>

      <div class="sheet-grid">
        <div><span class="field-label">Current stage</span><b>${esc(profile.stage)}</b></div>
        <div><span class="field-label">Household income</span><b class="num">${inr(profile.income)} a month</b></div>
        <div><span class="field-label">Earner needed</span><b>${
          { soon: 'Within a year', flexible: 'Two to three years', open: 'Not a constraint' }[profile.urgency]
        }</b></div>
        <div><span class="field-label">Interests</span><b>${
          profile.interests.length
            ? profile.interests.map(i => INTERESTS.find(x => x.id === i)?.label).filter(Boolean).join(', ')
            : 'Not stated'
        }</b></div>
      </div>

      <h4>Options compared</h4>
      <table class="sheet-table">
        <thead><tr><th>Option</th><th>Length</th><th>Fees</th><th>Earning starts</th><th>Finds work</th><th>Position at 4 years</th></tr></thead>
        <tbody>
          ${[a, b].map((p, i) => {
            const cf = cashflow(p);
            return `<tr>
              <td><b>${p.name}</b></td>
              <td>${p.months} months</td>
              <td class="num">${inr(p.feePerYear * p.months / 12)}</td>
              <td>month ${cf.firstEarningMonth}</td>
              <td class="num">${Math.round(p.placement * 100)}%</td>
              <td class="num">${inr(i === 0 ? cmp.a.at(48) : cmp.b.at(48))}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>

      ${picked.length ? `
      <h4>Shortlisted</h4>
      <ul class="plain">${picked.map(p => `<li>${p.name}, NSQF ${p.nsqf}, ${p.months} months</li>`).join('')}</ul>` : ''}

      <div id="sheet-narrative" class="sheet-narrative" hidden></div>

      <h4>Concerns raised and answered</h4>
      ${chosen.length
        ? `<ul class="plain">${chosen.map(o => `<li><q>${o.says}</q> ${o.answer}</li>`).join('')}</ul>`
        : '<p class="hint">None selected yet. Open Family concerns to add them.</p>'}

      <footer class="sheet-foot">
        <div><span class="field-label">Student agrees</span><div class="sig"></div></div>
        <div><span class="field-label">Parent agrees</span><div class="sig"></div></div>
        <div><span class="field-label">Review on</span><div class="sig num">${review}</div></div>
      </footer>
    </div>

    <div class="row">
      <button class="btn ghost" id="plan-summary">Write a summary for us</button>
    </div>
    <div id="plan-narrative" class="narrative" hidden></div>

    <div class="row">
      <button class="btn" data-act="print">Print or save as PDF</button>
      <button class="btn ghost" data-go="concerns">Add more concerns</button>
    </div>
  </section>`;
}

/* --------------------------------------------------------------- detail */
function pathDetail(id) {
  const p = byId(id);
  if (!p) return;
  const cf = cashflow(p);
  const d = DEMAND_LABEL[p.demand];
  const dlg = $('#detail');
  dlg.innerHTML = `
    <div class="dlg-in">
      <button class="dlg-x" data-act="close-detail" aria-label="Close">&times;</button>
      <span class="tag">${p.family}</span><span class="tag ${d.tone}">${d.text}</span>
      <h3>${p.name}</h3>
      <p>${p.blurb}</p>
      <dl class="kv">
        <div><dt>Course length</dt><dd>${p.months} months</dd></div>
        <div><dt>Course fee</dt><dd class="num">${p.feePerYear ? inr(p.feePerYear) + ' a year' : 'None'}</dd></div>
        <div><dt>Qualification</dt><dd>NSQF level ${p.nsqf}</dd></div>
        ${p.nco ? `<div><dt>Occupation code</dt><dd class="num">${p.nco}</dd></div>` : ''}
        <div><dt>Starting pay</dt><dd class="num">${inr(p.entryWage[0])} to ${inr(p.entryWage[1])}</dd></div>
        <div><dt>After three years</dt><dd class="num">${inr(p.wage3yr[0])} to ${inr(p.wage3yr[1])}</dd></div>
        <div><dt>Finds work</dt><dd class="num">${Math.round(p.placement * 100)}%</dd></div>
        <div><dt>Household breaks even</dt><dd>${months(cf.breakEven)}</dd></div>
      </dl>
      <div class="ladder">
        <span class="field-label">Where it can lead</span>
        <ol>${p.ladder.map(s => `<li>${s}</li>`).join('')}</ol>
      </div>
      <div class="row">
        <button class="btn sm" data-shortlist="${p.id}">
          ${profile.shortlist.includes(p.id) ? 'Remove from shortlist' : 'Add to shortlist'}
        </button>
        <a class="btn ghost sm" href="https://www.skillindiadigital.gov.in" target="_blank" rel="noopener">Find this course officially</a>
      </div>
    </div>`;
  dlg.hidden = false;
  document.body.classList.add('locked');
}

/* ----------------------------------------------------------------- render */
const VIEWS = { start: vStart, profile: vProfile, explore: vExplore, compare: vCompare,
                centres: vCentres, concerns: vConcerns, plan: vPlan };

let current = 'start';

function render(id) {
  if (id) current = id;
  if (!VIEWS[current]) current = 'start';
  $('#view').innerHTML = VIEWS[current]();
  $$('.nav-link').forEach(l => {
    const on = l.dataset.go === current;
    l.classList.toggle('on', on);
    l.setAttribute('aria-current', on ? 'page' : 'false');
  });
  if (location.hash !== '#/' + current) location.hash = '#/' + current;
  window.scrollTo({ top: 0, behavior: 'instant' });
  afterRender();
}

function afterRender() {
  if (current === 'profile') wireNaturalLanguage();
  if (current === 'plan') wirePlanSummary();
  if (current === 'compare') drawCompare();
  if (current === 'centres') {
    finder = new CentreFinder($('#finder-host'), { profile });
    finder.mount();
  }
}

function wireNaturalLanguage() {
  const btn = $('#nl-go'), box = $('#nl-input'), status = $('#nl-status');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const text = box.value.trim();
    if (!text) { status.textContent = 'Type a sentence or two first.'; return; }
    btn.disabled = true;
    status.textContent = 'Reading that...';
    try {
      const got = await parseProfile(text, profile);
      const keys = Object.keys(got);
      if (!keys.length) {
        status.textContent = 'Could not pick anything out of that. Try mentioning the class, the district and the household income.';
      } else {
        Object.assign(profile, got);
        save();
        render();
        const names = { name: 'name', stage: 'stage', district: 'district',
                        income: 'income', urgency: 'timing', interests: 'interests' };
        const filled = keys.map(k => names[k] || k).join(', ');
        setTimeout(() => {
          const s = $('#nl-status');
          if (s) s.textContent = 'Filled in: ' + filled + '. Check it and change anything that is wrong.';
        }, 60);
      }
    } catch (err) {
      status.textContent = err.code === 'no_key'
        ? 'The assistant is not switched on here. Fill the form below instead.'
        : 'Could not reach the assistant. Fill the form below instead.';
    } finally {
      btn.disabled = false;
    }
  });
}

function wirePlanSummary() {
  const btn = $('#plan-summary');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const host = $('#plan-narrative'), sheet = $('#sheet-narrative');
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = 'Writing...';
    host.hidden = false;
    host.textContent = 'Reading your figures...';
    try {
      const text = await ask({
        mode: 'plan',
        message: 'Write the summary paragraph for this family.',
        profile
      });
      host.textContent = text;
      if (sheet) { sheet.hidden = false; sheet.innerHTML = '<h4>Summary</h4><p>' + esc(text) + '</p>'; }
    } catch (err) {
      host.textContent = err.code === 'no_key'
        ? 'The assistant is not switched on for this deployment. The plan below is complete without it.'
        : 'Could not reach the assistant just now. The plan below is complete without it.';
    } finally {
      btn.disabled = false;
      btn.textContent = prev;
    }
  });
}

function drawCompare() {
  const [a, b] = profile.compare.map(byId);
  const cmp = compare(a, b);
  cashflowChart($('#cf-chart'), cmp, a.short, b.short);

  $('#cf-summary').innerHTML = `
    <div><span class="field-label">Breaks even</span>
      <b>${a.short}: ${months(cmp.a.breakEven)}</b>, <b>${b.short}: ${months(cmp.b.breakEven)}</b></div>
    <div><span class="field-label">After four years</span>
      <b class="num">${inr(cmp.a.at(48))}</b> against <b class="num">${inr(cmp.b.at(48))}</b></div>
    ${cmp.crossover
      ? `<div><span class="field-label">Positions swap</span><b>month ${cmp.crossover}</b></div>`
      : ''}`;

  barsChart($('#pl-chart'),
    PATHS.map(p => ({
      label: p.name,
      value: p.placement * 100,
      note: `${p.months} months, ${p.feePerYear ? inr(p.feePerYear) + ' a year' : 'no fee'}`,
      tone: p.kind === 'degree' ? SERIES.degree : SERIES.vocational
    })).sort((x, y) => y.value - x.value),
    { unit: '%', max: 100 });
}

/* ------------------------------------------------------------- behaviour */
function wireGlobal() {
  /* every click in the app, handled in one place so nothing goes dead
     after a re-render */
  document.addEventListener('click', ev => {
    const t = ev.target;

    const nav = t.closest('[data-go]');
    if (nav) { render(nav.dataset.go); return; }

    const act = t.closest('[data-act]')?.dataset.act;
    if (act === 'print')        { window.print(); return; }
    if (act === 'close-detail') { closeDetail(); return; }
    if (act === 'reset') {
      profile = defaults(); save(); render('start'); return;
    }

    const interest = t.closest('[data-interest]');
    if (interest) {
      const id = interest.dataset.interest;
      const i = profile.interests.indexOf(id);
      if (i >= 0) profile.interests.splice(i, 1); else profile.interests.push(id);
      interest.classList.toggle('on');
      save();
      const hint = $('#interest-hint');
      if (hint) hint.textContent = profile.interests.length
        ? `${profile.interests.length} selected`
        : 'Select at least one to see matched options.';
      const btn = $('#to-explore');
      if (btn) btn.disabled = !profileComplete();
      return;
    }

    const fam = t.closest('[data-family]');
    if (fam) { profile.familyFilter = fam.dataset.family; save(); render(); return; }

    const sl = t.closest('[data-shortlist]');
    if (sl) {
      const id = sl.dataset.shortlist;
      const i = profile.shortlist.indexOf(id);
      if (i >= 0) profile.shortlist.splice(i, 1); else profile.shortlist.push(id);
      save();
      if (!$('#detail').hidden) pathDetail(id);
      if (current === 'explore') render();
      return;
    }

    const det = t.closest('[data-detail]');
    if (det) { pathDetail(det.dataset.detail); return; }

    const lens = t.closest('[data-lens]');
    if (lens) { profile.lens = lens.dataset.lens; save(); render(); return; }

    const con = t.closest('[data-concern]');
    if (con) {
      const id = con.dataset.concern;
      const i = profile.concerns.indexOf(id);
      if (i >= 0) profile.concerns.splice(i, 1); else profile.concerns.push(id);
      save(); render();
      return;
    }

    if (t.id === 'detail') closeDetail();
  });

  /* form inputs */
  document.addEventListener('input', ev => {
    const n = ev.target.name;
    if (!n) return;
    if (n === 'income') {
      profile.income = +ev.target.value;
      const o = $('#income-out');
      if (o) o.textContent = inr(profile.income);
    } else if (n in profile) {
      profile[n] = ev.target.value;
    }
    save();
  });

  document.addEventListener('change', ev => {
    const slot = ev.target.dataset?.slot;
    if (slot !== undefined && ev.target.tagName === 'SELECT') {
      profile.compare[+slot] = ev.target.value;
      save(); render();
      return;
    }
    if (ev.target.name === 'urgency') {
      profile.urgency = ev.target.value;
      $$('.radio').forEach(r => r.classList.toggle('on', r.querySelector('input').checked));
      save();
    }
    if (ev.target.name === 'stage') { profile.stage = ev.target.value; save(); }
  });

  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') closeDetail();
  });

  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#/', '');
    if (VIEWS[h] && h !== current) render(h);
  });
}

function closeDetail() {
  const d = $('#detail');
  if (d) { d.hidden = true; d.innerHTML = ''; }
  document.body.classList.remove('locked');
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ------------------------------------------------------------------ boot */
function boot() {
  $('#nav').innerHTML = SECTIONS
    .map(s => `<button class="nav-link" data-go="${s.id}">${s.label}</button>`).join('');
  wireGlobal();
  const h = location.hash.replace('#/', '');
  render(VIEWS[h] ? h : 'start');

  const assistant = new Assistant({
    getProfile: () => profile,
    getScreen: () => current
  });
  assistant.mount();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
