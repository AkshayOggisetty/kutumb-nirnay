/* End to end interaction test for the Kutumb Nirnay prototype.
 * Drives a real Chrome and asserts that every control does something.
 *
 *   node test/run.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'http://localhost:8081';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

let pass = 0, fail = 0;
const errors = [];
const results = [];

function ok(name, cond, detail = '') {
  if (cond) { pass++; results.push(`  PASS  ${name}`); }
  else { fail++; results.push(`  FAIL  ${name}${detail ? '  (' + detail + ')' : ''}`); }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,1000']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });

const EXPECTED = /\/api\/chat/;   // the unconfigured assistant is tested on purpose
page.on('console', m => {
  if (m.type() !== 'error') return;
  if (EXPECTED.test(m.text()) || /503|502/.test(m.text())) return;
  errors.push('console: ' + m.text());
});
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('requestfailed', r => {
  if (EXPECTED.test(r.url())) return;
  errors.push('requestfailed: ' + r.url() + ' ' + r.failure()?.errorText);
});

console.log(`\nTesting ${BASE}\n${'='.repeat(62)}`);

/* ---------------------------------------------------------- 1. boot */
await page.goto(BASE, { waitUntil: 'networkidle0' });
await sleep(400);
ok('page boots with no console errors', errors.length === 0, errors[0]);
ok('navigation rendered', (await page.$$('.nav-link')).length === 7);
ok('start view rendered', !!(await page.$('.hero h1')));

/* ------------------------------------------------- 2. every nav link */
const navIds = await page.$$eval('.nav-link', ns => ns.map(n => n.dataset.go));
for (const id of navIds) {
  await page.click(`.nav-link[data-go="${id}"]`);
  await sleep(260);
  const got = await page.evaluate(() => location.hash);
  const hasContent = await page.evaluate(() => document.querySelector('#view').children.length > 0);
  ok(`nav "${id}" routes and renders`, got === `#/${id}` && hasContent, `hash=${got}`);
}

/* --------------------------------------------- 3. profile form inputs */
await page.click('.nav-link[data-go="profile"]');
await sleep(250);

await page.type('input[name="name"]', 'Test Student');
const nameVal = await page.$eval('input[name="name"]', e => e.value);
ok('text input accepts typing', nameVal === 'Test Student');

await page.select('select[name="stage"]', 'Class 12 passed');
await sleep(120);
ok('stage select persists',
   (await page.evaluate(() => JSON.parse(localStorage.getItem('kn.profile.v1')).stage)) === 'Class 12 passed');

await page.$eval('input[name="income"]', e => {
  e.value = 42000;
  e.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(150);
const incomeShown = await page.$eval('#income-out', e => e.textContent);
ok('income slider updates its readout', /42,000/.test(incomeShown), incomeShown);

await page.click('.radio input[value="soon"]');
await sleep(150);
ok('urgency radio persists',
   (await page.evaluate(() => JSON.parse(localStorage.getItem('kn.profile.v1')).urgency)) === 'soon');

const ctaBefore = await page.$eval('#to-explore', e => e.disabled);
await page.click('[data-interest="hands-on"]');
await page.click('[data-interest="electrical"]');
await sleep(200);
const ctaAfter = await page.$eval('#to-explore', e => e.disabled);
ok('interest chips toggle and unlock the CTA', ctaBefore === true && ctaAfter === false,
   `before=${ctaBefore} after=${ctaAfter}`);
ok('interests persisted',
   (await page.evaluate(() => JSON.parse(localStorage.getItem('kn.profile.v1')).interests.length)) === 2);

/* ------------------------------------------------- 4. explore screen */
await page.click('#to-explore');
await sleep(350);
ok('CTA navigates to explore', (await page.evaluate(() => location.hash)) === '#/explore');

const cards = await page.$$('.path-card');
ok('path cards rendered', cards.length === 8, `${cards.length} cards`);

const topScore = await page.$eval('.path-card .match b', e => +e.textContent);
ok('match scores computed', topScore > 0 && topScore <= 99, `top=${topScore}`);

const order = await page.$$eval('.path-card .match b', ns => ns.map(n => +n.textContent));
ok('cards sorted by match descending',
   order.every((v, i) => i === 0 || order[i - 1] >= v), order.join(','));

/* interests should influence ranking: electrical interests selected above */
const firstCard = await page.$eval('.path-card h3', e => e.textContent);
ok('ranking responds to stated interests', /Electrician|Solar/.test(firstCard), firstCard);

await page.click('[data-family="Degree"]');
await sleep(250);
const degreeOnly = await page.$$eval('.path-card h3', ns => ns.map(n => n.textContent));
ok('family filter narrows the list',
   degreeOnly.length === 2 && degreeOnly.every(t => /B\.A\.|B\.Sc/.test(t)), degreeOnly.join(','));
await page.click('[data-family="All"]');
await sleep(220);

/* shortlist */
await page.click('.path-card [data-shortlist]');
await sleep(250);
ok('shortlist button records a choice',
   (await page.evaluate(() => JSON.parse(localStorage.getItem('kn.profile.v1')).shortlist.length)) === 1);
ok('shortlisted card is marked', !!(await page.$('.path-card.picked')));

/* detail dialog */
await page.click('.path-card [data-detail]');
await sleep(300);
ok('detail dialog opens', await page.$eval('#detail', e => !e.hidden));
ok('detail dialog has content', !!(await page.$('#detail .dlg-in h3')));
await page.click('.dlg-x');
await sleep(250);
ok('detail dialog closes', await page.$eval('#detail', e => e.hidden));

/* ------------------------------------------------- 5. compare screen */
await page.click('.nav-link[data-go="compare"]');
await sleep(500);

ok('cash flow chart drawn', (await page.$$('#cf-chart svg path')).length >= 2);
ok('placement chart drawn', (await page.$$('#pl-chart svg rect')).length > 8);
ok('summary populated', (await page.$eval('#cf-summary', e => e.textContent.trim().length)) > 20);

await page.select('select[data-slot="0"]', 'gnm-nursing');
await sleep(450);
const afterSwap = await page.evaluate(() => JSON.parse(localStorage.getItem('kn.profile.v1')).compare[0]);
ok('compare selector changes the path', afterSwap === 'gnm-nursing', afterSwap);
ok('chart redrew after selector change', (await page.$$('#cf-chart svg path')).length >= 2);

for (const lens of ['student', 'parent', 'both']) {
  await page.click(`[data-lens="${lens}"]`);
  await sleep(260);
  const cls = await page.$eval('.compare-grid', e => e.className);
  ok(`lens "${lens}" applies`, cls.includes(`lens-${lens}`), cls);
}

/* ------------------------------------------------- 6. centres / map */
await page.click('.nav-link[data-go="centres"]');
await sleep(600);

const marks = await page.$$('.mark');
ok('map markers rendered', marks.length > 4, `${marks.length} markers`);
ok('centre list rendered', (await page.$$('.centre-row')).length > 4);
ok('detail panel populated on load', (await page.$eval('#fx-detail', e => e.textContent.length)) > 60);

/* click a marker and confirm the detail panel changes */
const beforeDetail = await page.$eval('#fx-detail h3', e => e.textContent.trim());
const markInfo = await page.$$eval('.mark', ns =>
  ns.map(n => ({ id: n.dataset.centre, label: n.getAttribute('aria-label') || '' })));
ok('markers carry an accessible label', markInfo.every(m => m.label.length > 0));
let changed = false, clickedLabel = '';
for (const m of markInfo) {
  if (m.label.startsWith(beforeDetail)) continue;   // skip the already-selected one
  await page.click(`.mark[data-centre="${m.id}"]`);
  await sleep(340);
  const afterDetail = await page.$eval('#fx-detail h3', e => e.textContent.trim());
  changed = afterDetail !== beforeDetail;
  clickedLabel = `${beforeDetail} -> ${afterDetail}`;
  break;
}
ok('clicking a map marker loads that centre', changed, clickedLabel);

/* click a list row */
const rowIds = await page.$$eval('.centre-row', ns => ns.map(n => n.dataset.centre));
await page.click(`.centre-row[data-centre="${rowIds[rowIds.length - 1]}"]`);
await sleep(320);
ok('clicking a list row selects it', !!(await page.$('.centre-row.on')));

/* travel figures are real */
const dist = await page.$eval('.cd-dist b', e => parseFloat(e.textContent));
ok('distance is computed', dist > 0 && dist < 200, String(dist));
const grid = await page.$eval('.cd-grid', e => e.textContent);
ok('travel mode and fare shown', /min each way/.test(grid) && /one way/.test(grid));

/* type filters */
await page.click('[data-type="iti"]');
await sleep(320);
const itiRows = await page.$$eval('.cr-type', ns => ns.map(n => n.textContent.trim()));
ok('centre type filter works',
   itiRows.length > 0 && itiRows.every(t => t.startsWith('ITI')), itiRows.join(','));
await page.click('[data-type="all"]');
await sleep(260);

/* ------------------------------------------------- 7. concerns */
await page.click('.nav-link[data-go="concerns"]');
await sleep(350);
ok('concerns rendered', (await page.$$('.concern')).length === 9);
await page.click('.concern-head');
await sleep(300);
ok('selecting a concern records it',
   (await page.evaluate(() => JSON.parse(localStorage.getItem('kn.profile.v1')).concerns.length)) === 1);
ok('selected concern is marked', !!(await page.$('.concern.on')));
ok('alumni rendered', (await page.$$('.al-card')).length === 5);

/* ------------------------------------------------- 8. plan */
await page.click('.nav-link[data-go="plan"]');
await sleep(400);
const sheet = await page.$eval('#sheet', e => e.textContent);
ok('plan shows the student name entered earlier', /Test Student/.test(sheet));
ok('plan shows the district', /Pune/.test(sheet));
ok('plan reflects the chosen urgency', /Within a year/.test(sheet));
ok('plan table has both compared options', (await page.$$('.sheet-table tbody tr')).length === 2);
ok('plan lists the shortlist', /Shortlisted/.test(sheet));
ok('plan lists the selected concern', !/None selected yet/.test(sheet));

/* ------------------------------------------------- 9. persistence */
await page.reload({ waitUntil: 'networkidle0' });
await sleep(450);
const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('kn.profile.v1')));
ok('profile survives a reload', persisted.name === 'Test Student' && persisted.interests.length === 2);

/* ------------------------------------------------ 10. no long dashes */
await page.click('.nav-link[data-go="start"]');
await sleep(250);
let dashHits = [];
for (const id of navIds) {
  await page.click(`.nav-link[data-go="${id}"]`);
  await sleep(300);
  const txt = await page.evaluate(() => document.body.innerText);
  if (/[\u2013\u2014]/.test(txt)) {
    const m = txt.match(/.{0,30}[\u2013\u2014].{0,30}/);
    dashHits.push(`${id}: ${m && m[0]}`);
  }
}
ok('no em or en dashes anywhere in the UI', dashHits.length === 0, dashHits.join(' | '));

/* --------------------------------------------- 11. no Hindi script */
let devanagari = [];
for (const id of navIds) {
  await page.click(`.nav-link[data-go="${id}"]`);
  await sleep(300);
  const txt = await page.evaluate(() => document.body.innerText);
  if (/[\u0900-\u097F]/.test(txt)) devanagari.push(id);
}
ok('no Devanagari text in the UI', devanagari.length === 0, devanagari.join(','));

/* ---------------------------------------- 12. reset + empty profile */
await page.click('.nav-link[data-go="start"]');
await sleep(250);
const resetBtn = await page.$('[data-act="reset"]');
if (resetBtn) {
  await resetBtn.click();
  await sleep(350);
  ok('reset clears the profile',
     (await page.evaluate(() => JSON.parse(localStorage.getItem('kn.profile.v1')).name)) === '');
} else {
  ok('reset control present when a profile exists', false, 'button missing');
}
await page.click('.nav-link[data-go="explore"]');
await sleep(350);
ok('explore works with an empty profile', (await page.$$('.path-card')).length === 8);
await page.click('.nav-link[data-go="plan"]');
await sleep(350);
ok('plan works with an empty profile', !!(await page.$('#sheet')));


/* ------------------------------------ 13. profile drives the map */
await page.click('.nav-link[data-go="profile"]');
await sleep(300);
await page.$eval('input[name="district"]', e => { e.value = ''; });
await page.type('input[name="district"]', 'Nashik');
await sleep(250);
await page.click('.nav-link[data-go="centres"]');
await sleep(600);
const originLabel = await page.$eval('#fx-origin strong', e => e.textContent.trim());
ok('map centres on the district typed in the profile', /Nashik/i.test(originLabel), originLabel);
const nearestNow = await page.$eval('.centre-row .cr-name', e => e.textContent.trim());
ok('nearest centre changes with the district', /Nashik/i.test(nearestNow), nearestNow);

/* shortlist drives the relevance filter */
await page.click('.nav-link[data-go="explore"]');
await sleep(350);
await page.click('.path-card [data-shortlist]');
await sleep(300);
await page.click('.nav-link[data-go="centres"]');
await sleep(600);
const hasMine = await page.$('[data-type="mine"]');
ok('a shortlist adds the "offers my courses" filter', !!hasMine);
if (hasMine) {
  await page.click('[data-type="mine"]');
  await sleep(350);
  const rows = await page.$$('.centre-row');
  const allRel = await page.$$eval('.centre-row', ns => ns.every(n => n.classList.contains('rel')));
  ok('that filter shows only relevant centres', rows.length > 0 && allRel, `${rows.length} rows`);
  await page.click('[data-type="all"]');
  await sleep(250);
}
const anyRel = await page.$$eval('.centre-row', ns => ns.some(n => n.classList.contains('rel')));
ok('centres offering a considered course are marked', anyRel);

/* ------------------------------------ 14. the assistant */
ok('assistant button is mounted', !!(await page.$('#as-fab')));
await page.click('#as-fab');
await sleep(350);
ok('assistant panel opens', await page.$eval('#as-panel', e => !e.hidden));
ok('assistant greets on first open', (await page.$$('.as-msg.bot')).length >= 1);
const suggCount = await page.$$eval('.as-sugg button', ns => ns.length);
ok('assistant offers suggestions for this screen', suggCount >= 1, String(suggCount));

/* with no key configured it must fail softly, never break the page */
await page.type('#as-input', 'What will the travel cost us?');
await page.click('#as-send');
await page.waitForFunction(() => !!document.querySelector('.as-msg.err'), { timeout: 15000 })
  .catch(() => {});
const errShown = await page.$('.as-msg.err');
ok('assistant degrades gracefully with no key', !!errShown);
const errText = errShown ? await page.evaluate(e => e.textContent, errShown) : '';
ok('degradation message reassures the rest still works', /still works/i.test(errText), errText.slice(0, 70));
ok('page still functional after an assistant failure', (await page.$$('.centre-row')).length > 0);
await page.click('#as-close');
await sleep(250);
ok('assistant panel closes', await page.$eval('#as-panel', e => e.hidden));

/* ------------------------------------ 15. plain language intake */
await page.click('.nav-link[data-go="profile"]');
await sleep(300);
ok('plain language box is present', !!(await page.$('#nl-input')));
await page.click('#nl-go');
await sleep(400);
const nlEmpty = await page.$eval('#nl-status', e => e.textContent);
ok('empty plain language input is handled', /type a sentence/i.test(nlEmpty), nlEmpty);
await page.type('#nl-input', 'my son finished class 10 in Pune, we earn 20000');
await page.click('#nl-go');
await page.waitForFunction(() => {
  const s = document.querySelector('#nl-status');
  return s && !/reading that/i.test(s.textContent);
}, { timeout: 15000 }).catch(() => {});
const nlMsg = await page.$eval('#nl-status', e => e.textContent);
ok('plain language input degrades gracefully with no key',
   /assistant|fill the form/i.test(nlMsg), nlMsg.slice(0, 70));

/* ------------------------------------ 16. plan summary */
await page.click('.nav-link[data-go="plan"]');
await sleep(400);
ok('plan offers an assistant summary', !!(await page.$('#plan-summary')));
await page.click('#plan-summary');
await page.waitForFunction(() => {
  const n = document.querySelector('#plan-narrative');
  return n && !n.hidden && !/reading your figures/i.test(n.textContent);
}, { timeout: 15000 }).catch(() => {});
const narr = await page.$eval('#plan-narrative', e => e.textContent);
ok('plan summary degrades gracefully with no key', /assistant|complete without it/i.test(narr), narr.slice(0, 70));
ok('plan sheet still complete after assistant failure', !!(await page.$('.sheet-table tbody tr')));

/* ------------------------------------------------------------ report */
console.log(results.join('\n'));
console.log('='.repeat(62));
console.log(`  ${pass} passed, ${fail} failed`);
if (errors.length) {
  console.log('\n  Runtime errors captured:');
  [...new Set(errors)].forEach(e => console.log('   ', e));
} else {
  console.log('  No console errors, page errors or failed requests.');
}
await browser.close();
process.exit(fail || errors.length ? 1 : 0);
