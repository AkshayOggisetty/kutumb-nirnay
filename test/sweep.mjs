/* Exhaustive interaction sweep.
 *
 * Enumerates every interactive element on every screen and clicks it, asserting
 * that something observably changed. A control that does nothing is a failure,
 * which is what catches a dead button.
 *
 *   node test/sweep.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'http://localhost:8081';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SCREENS = ['start', 'profile', 'explore', 'compare', 'centres', 'concerns', 'plan'];

let pass = 0, fail = 0;
const lines = [], errors = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; }
  else { fail++; lines.push(`  FAIL  ${name}${detail ? '  (' + detail + ')' : ''}`); }
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,1000']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });

const EXPECTED = /\/api\/chat/;
page.on('console', m => {
  if (m.type() !== 'error') return;
  if (EXPECTED.test(m.text()) || /50\d/.test(m.text())) return;
  errors.push('console: ' + m.text());
});
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('requestfailed', r => {
  if (EXPECTED.test(r.url())) return;
  errors.push('requestfailed: ' + r.url());
});

/* a cheap fingerprint of observable app state */
const snapshot = () => page.evaluate(() => ({
  hash: location.hash,
  store: localStorage.getItem('kn.profile.v1') || '',
  html: document.querySelector('#view')?.innerHTML.length || 0,
  classes: [...document.querySelectorAll('#view [class]')]
    .slice(0, 400).map(n => n.className).join('|').length,
  dialog: document.querySelector('#detail')?.hidden,
  assistant: document.querySelector('#as-panel')?.hidden
}));

const changed = (a, b) =>
  a.hash !== b.hash || a.store !== b.store || a.html !== b.html ||
  a.classes !== b.classes || a.dialog !== b.dialog || a.assistant !== b.assistant;

console.log(`\nExhaustive sweep of ${BASE}\n${'='.repeat(64)}`);

await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });
await sleep(500);

/* seed a profile so every screen has content to act on */
await page.evaluate(() => localStorage.setItem('kn.profile.v1', JSON.stringify({
  name: 'Sweep Test', stage: 'Class 10 passed', district: 'Pune, Maharashtra',
  income: 19000, urgency: 'flexible', interests: ['hands-on', 'electrical'],
  compare: ['iti-electrician', 'ba-general'], lens: 'both',
  concerns: [], shortlist: []
})));

let totalControls = 0, deadControls = [];

for (const screen of SCREENS) {
  await page.goto(`${BASE}/#/${screen}`, { waitUntil: 'networkidle0' });
  await page.reload({ waitUntil: 'networkidle0' });
  /* window.print cannot change the DOM, so record that it fired instead */
  await page.evaluate(() => {
    window.__printed = 0;
    window.print = () => { window.__printed++; };
  });
  await sleep(700);

  /* every clickable control inside the view, excluding navigation which is
     covered separately, and excluding the assistant which needs the network */
  const controls = await page.evaluate(() => {
    const sel = '#view button, #view [role="button"], #view a[href^="http"]';
    return [...document.querySelectorAll(sel)].map((n, i) => {
      n.setAttribute('data-sweep', String(i));
      return {
        i,
        tag: n.tagName.toLowerCase(),
        label: (n.textContent || n.getAttribute('aria-label') || '').trim().slice(0, 44),
        external: n.tagName === 'A',
        disabled: !!n.disabled
      };
    });
  });

  let screenDead = [];
  for (const c of controls) {
    if (c.external || c.disabled) continue;
    totalControls++;
    const before = await snapshot();
    const clicked = await page.evaluate(i => {
      const n = document.querySelector(`#view [data-sweep="${i}"]`);
      if (!n) return false;
      n.click();
      return true;
    }, c.i);
    if (!clicked) continue;
    await sleep(330);
    const after = await snapshot();
    const printed = await page.evaluate(() => { const n = window.__printed || 0; window.__printed = 0; return n; });
    if (!changed(before, after) && !printed) screenDead.push(`${screen}: "${c.label}"`);

    /* close any dialog the click opened, so the next control is reachable */
    const dlgOpen = await page.evaluate(() => {
      const d = document.querySelector('#detail');
      return d && !d.hidden;
    });
    if (dlgOpen) {
      await page.click('.dlg-x').catch(() => {});
      await sleep(220);
    }
    /* return to this screen if the click navigated away */
    const here = await page.evaluate(() => location.hash);
    if (here !== `#/${screen}`) {
      await page.goto(`${BASE}/#/${screen}`, { waitUntil: 'networkidle0' });
      await sleep(400);
    }
  }

  const live = controls.filter(c => !c.external && !c.disabled).length;
  ok(`every control responds on "${screen}" (${live} controls)`,
     screenDead.length === 0, screenDead.join('; '));
  deadControls.push(...screenDead);
  lines.push(`  ${screenDead.length ? 'FAIL' : 'PASS'}  ${screen}: ${live} controls, ` +
             `${live - screenDead.length} responded`);
}

/* ---- form controls respond ------------------------------------------- */
await page.goto(`${BASE}/#/profile`, { waitUntil: 'networkidle0' });
await page.reload({ waitUntil: 'networkidle0' });
await sleep(600);

const fields = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('#view input, #view select, #view textarea').forEach(n => {
    out.push({ name: n.name || n.id, type: n.type || n.tagName.toLowerCase() });
  });
  return out;
});
ok('profile exposes every expected field',
   ['name', 'stage', 'district', 'income', 'urgency'].every(f => fields.some(x => x.name === f)),
   JSON.stringify(fields.map(f => f.name)));

/* each field writes through to storage */
const beforeStore = await page.evaluate(() => localStorage.getItem('kn.profile.v1'));
await page.$eval('input[name="district"]', e => { e.value = ''; });
await page.type('input[name="district"]', 'Nagpur');
await sleep(300);
const afterStore = await page.evaluate(() => JSON.parse(localStorage.getItem('kn.profile.v1')));
ok('typing a district persists', /Nagpur/.test(afterStore.district), afterStore.district);

await page.select('select[name="stage"]', 'Class 12 passed');
await sleep(250);
ok('changing the stage persists',
   (await page.evaluate(() => JSON.parse(localStorage.getItem('kn.profile.v1')).stage)) === 'Class 12 passed');

/* every interest chip toggles both ways */
const chipIds = await page.$$eval('[data-interest]', ns => ns.map(n => n.dataset.interest));
let chipFails = [];
for (const id of chipIds) {
  const was = await page.evaluate(i =>
    JSON.parse(localStorage.getItem('kn.profile.v1')).interests.includes(i), id);
  await page.click(`[data-interest="${id}"]`);
  await sleep(90);
  const now = await page.evaluate(i =>
    JSON.parse(localStorage.getItem('kn.profile.v1')).interests.includes(i), id);
  if (was === now) chipFails.push(id);
  await page.click(`[data-interest="${id}"]`);   // restore
  await sleep(70);
}
ok(`all ${chipIds.length} interest chips toggle`, chipFails.length === 0, chipFails.join(','));

/* every course is selectable in both compare slots */
await page.goto(`${BASE}/#/compare`, { waitUntil: 'networkidle0' });
await page.reload({ waitUntil: 'networkidle0' });
await sleep(700);
const courseIds = await page.$$eval('select[data-slot="0"] option', ns => ns.map(n => n.value));
let slotFails = [];
for (const slot of ['0', '1']) {
  for (const id of courseIds) {
    await page.select(`select[data-slot="${slot}"]`, id);
    await sleep(190);
    const got = await page.evaluate(s =>
      JSON.parse(localStorage.getItem('kn.profile.v1')).compare[+s], slot);
    const drawn = await page.$$eval('#cf-chart svg path', ns => ns.length);
    if (got !== id || drawn < 2) slotFails.push(`slot${slot}:${id}`);
  }
}
ok(`all ${courseIds.length} courses selectable in both slots, chart redraws each time`,
   slotFails.length === 0, slotFails.slice(0, 4).join(','));

/* every centre marker and row opens its own detail */
await page.goto(`${BASE}/#/centres`, { waitUntil: 'networkidle0' });
await page.reload({ waitUntil: 'networkidle0' });
await sleep(900);
const markIds = await page.$$eval('.mark', ns => ns.map(n => n.dataset.centre));
let markFails = [];
for (const id of markIds) {
  /* click the hit circle itself, not the group, whose box spans the connector */
  await page.click(`.mark[data-centre="${id}"] circle.hit`);
  await sleep(240);
  const sel = await page.$eval('.centre-row.on', e => e.dataset.centre).catch(() => null);
  const hasDetail = await page.$eval('#fx-detail h3', e => e.textContent.trim().length > 0).catch(() => false);
  if (sel !== id || !hasDetail) markFails.push(id);
}
ok(`all ${markIds.length} map markers open their own centre`,
   markFails.length === 0, markFails.join(','));

const typeIds = await page.$$eval('#fx-chips .chip', ns => ns.map(n => n.dataset.type));
let filterFails = [];
for (const t of typeIds) {
  await page.click(`[data-type="${t}"]`);
  await sleep(260);
  const on = await page.$eval('.chip.on', e => e.dataset.type).catch(() => null);
  const rows = await page.$$eval('.centre-row', ns => ns.length);
  const empty = await page.$('.centre-list .hint');
  if (on !== t || (rows === 0 && !empty)) filterFails.push(t);
}
ok(`all ${typeIds.length} centre filters apply`, filterFails.length === 0, filterFails.join(','));

/* every concern toggles */
await page.goto(`${BASE}/#/concerns`, { waitUntil: 'networkidle0' });
await page.reload({ waitUntil: 'networkidle0' });
await sleep(700);
const concernIds = await page.$$eval('[data-concern]', ns => ns.map(n => n.dataset.concern));
let concernFails = [];
for (const id of concernIds) {
  const was = await page.evaluate(i =>
    JSON.parse(localStorage.getItem('kn.profile.v1')).concerns.includes(i), id);
  await page.click(`[data-concern="${id}"]`);
  await sleep(230);
  const now = await page.evaluate(i =>
    JSON.parse(localStorage.getItem('kn.profile.v1')).concerns.includes(i), id);
  if (was === now) concernFails.push(id);
}
ok(`all ${concernIds.length} concerns toggle`, concernFails.length === 0, concernFails.join(','));

/* every shortlist button toggles */
await page.goto(`${BASE}/#/explore`, { waitUntil: 'networkidle0' });
await page.reload({ waitUntil: 'networkidle0' });
await sleep(700);
const slIds = await page.$$eval('[data-shortlist]', ns => ns.map(n => n.dataset.shortlist));
let slFails = [];
for (const id of slIds) {
  const was = await page.evaluate(i =>
    JSON.parse(localStorage.getItem('kn.profile.v1')).shortlist.includes(i), id);
  await page.click(`[data-shortlist="${id}"]`);
  await sleep(260);
  const now = await page.evaluate(i =>
    JSON.parse(localStorage.getItem('kn.profile.v1')).shortlist.includes(i), id);
  if (was === now) slFails.push(id);
}
ok(`all ${slIds.length} shortlist buttons toggle`, slFails.length === 0, slFails.join(','));

/* every detail dialog opens with content and closes */
const detIds = await page.$$eval('[data-detail]', ns => ns.map(n => n.dataset.detail));
let detFails = [];
for (const id of detIds) {
  await page.click(`[data-detail="${id}"]`);
  await sleep(260);
  const open = await page.$eval('#detail', e => !e.hidden).catch(() => false);
  const body = await page.$eval('#detail .dlg-in', e => e.textContent.length).catch(() => 0);
  await page.click('.dlg-x').catch(() => {});
  await sleep(200);
  const closed = await page.$eval('#detail', e => e.hidden).catch(() => false);
  if (!open || body < 120 || !closed) detFails.push(id);
}
ok(`all ${detIds.length} course dialogs open with content and close`,
   detFails.length === 0, detFails.join(','));

/* keyboard: escape closes the dialog */
await page.click(`[data-detail="${detIds[0]}"]`);
await sleep(230);
await page.keyboard.press('Escape');
await sleep(230);
ok('Escape closes the course dialog', await page.$eval('#detail', e => e.hidden));

/* deep links */
let deepFails = [];
for (const s of SCREENS) {
  await page.goto(`${BASE}/#/${s}`, { waitUntil: 'networkidle0' });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(420);
  const onScreen = await page.evaluate(() =>
    document.querySelector('.nav-link.on')?.dataset.go);
  const filled = await page.evaluate(() => document.querySelector('#view').children.length > 0);
  if (onScreen !== s || !filled) deepFails.push(s);
}
ok('every screen is reachable by direct link after a reload',
   deepFails.length === 0, deepFails.join(','));

/* mobile viewport */
await page.setViewport({ width: 390, height: 844 });
let mobileFails = [];
for (const s of SCREENS) {
  await page.goto(`${BASE}/#/${s}`, { waitUntil: 'networkidle0' });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(450);
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) mobileFails.push(`${s}:+${overflow}px`);
}
ok('no horizontal overflow at 390px on any screen',
   mobileFails.length === 0, mobileFails.join(','));
await page.setViewport({ width: 1440, height: 1000 });

/* ------------------------------------------------------------- report */
console.log(lines.join('\n'));
console.log('='.repeat(64));
console.log(`  controls exercised: ${totalControls}`);
console.log(`  ${pass} checks passed, ${fail} failed`);
if (deadControls.length) {
  console.log('\n  Controls that did nothing:');
  deadControls.forEach(d => console.log('   ', d));
}
if (errors.length) {
  console.log('\n  Runtime errors:');
  [...new Set(errors)].forEach(e => console.log('   ', e));
} else {
  console.log('  No unexpected console errors, page errors or failed requests.');
}
await browser.close();
process.exit(fail || errors.length ? 1 : 0);
