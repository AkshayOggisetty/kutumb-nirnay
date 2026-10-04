/* Capture screenshots of every screen with a realistic profile filled in. */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:8081';
const OUT  = process.argv[3] || 'prototype/shots';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT, { recursive: true });

const PROFILE = {
  name: 'Anjali Patil',
  stage: 'Class 10 passed',
  district: 'Pune, Maharashtra',
  income: 19000,
  urgency: 'flexible',
  interests: ['hands-on', 'electrical', 'technical'],
  compare: ['iti-electrician', 'ba-general'],
  lens: 'both',
  concerns: ['o2', 'o3'],
  shortlist: ['iti-electrician', 'solar-pv']
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
});
const page = await browser.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));

await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.evaluate(p => localStorage.setItem('kn.profile.v1', JSON.stringify(p)), PROFILE);

const screens = [
  ['01-start',    'start',    1250],
  ['02-profile',  'profile',  1320],
  ['03-explore',  'explore',  1750],
  ['04-compare',  'compare',  2150],
  ['05-centres',  'centres',  1450],
  ['06-concerns', 'concerns', 2000],
  ['07-plan',     'plan',     1400]
];

for (const [file, hash, height] of screens) {
  await page.setViewport({ width: 1400, height });
  await page.goto(`${BASE}/#/${hash}`, { waitUntil: 'networkidle0' });
  await page.reload({ waitUntil: 'networkidle0' });   // re-boot so the seeded profile loads
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(900);
  await page.screenshot({ path: `${OUT}/${file}.png` });
  console.log('  captured', file);
}

/* one extra: the course detail dialog */
await page.setViewport({ width: 1400, height: 900 });
await page.goto(`${BASE}/#/explore`, { waitUntil: 'networkidle0' });
await page.reload({ waitUntil: 'networkidle0' });
await sleep(700);
await page.click('.path-card [data-detail]');
await sleep(600);
await page.screenshot({ path: `${OUT}/08-detail.png` });
console.log('  captured 08-detail');

await browser.close();
