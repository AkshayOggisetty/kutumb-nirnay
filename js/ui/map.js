/* The "Nazdeek" (nearby) plate.
 *
 * A radial plan centred on the household: bearing gives direction, radius gives
 * distance. Drawn rather than tiled — the same decision the Viatica atlas made,
 * for the same reasons: no tile dependency, no API key, works offline, and it
 * reads clearly on a projector.
 *
 * Distance is haversine with a 1.3 road-detour factor; travel mode, time and
 * fare are inferred from road distance. All arithmetic is real.
 */

import { CENTRES, CENTRE_TYPE, FALLBACK_ORIGIN } from '../data/centres.js';
import { byId } from '../data/paths.js';
import { haversine, travelFor, inr } from '../core/engine.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}) => {
  const e = document.createElementNS(NS, t);
  for (const [k, v] of Object.entries(a)) e.setAttribute(k, v);
  return e;
};

const RINGS = [5, 15, 40, 90];          // km bands drawn on the plate
const MAXKM = 90;

/* bearing from a to b, radians, 0 = north, clockwise */
function bearing(a, b) {
  const toRad = d => d * Math.PI / 180;
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat), la2 = toRad(b.lat);
  const y = Math.sin(dLon) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
  return Math.atan2(y, x);
}

const GLYPH = {
  spanner: 'M-3,-4 a3,3 0 1,0 2,5 l3,4 2,-2 -3,-4 a3,3 0 0,0 -4,-3 z',
  compass: 'M0,-5 L2,0 0,5 -2,0 Z',
  spark:   'M0,-5 L1.4,-1.4 5,0 1.4,1.4 0,5 -1.4,1.4 -5,0 -1.4,-1.4 Z',
  cross:   'M-1.6,-5 h3.2 v3.4 h3.4 v3.2 h-3.4 v3.4 h-3.2 v-3.4 h-3.4 v-3.2 h3.4 Z',
  book:    'M-4,-4 h8 v8 h-8 Z M0,-4 v8'
};

export class NearbyPlate {
  constructor(host) {
    this.host = host;
    this.origin = { ...FALLBACK_ORIGIN };
    this.filter = 'all';
    this.selected = null;
    this.located = false;
  }

  /* resolve the household's position; falls back silently */
  async locate() {
    if (!navigator.geolocation) return false;
    return new Promise(resolve => {
      const done = ok => resolve(ok);
      const timer = setTimeout(() => done(false), 6000);
      navigator.geolocation.getCurrentPosition(
        pos => {
          clearTimeout(timer);
          this.origin = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            label: 'Your location'
          };
          this.located = true;
          done(true);
        },
        () => { clearTimeout(timer); done(false); },
        { timeout: 6000, maximumAge: 300000 }
      );
    });
  }

  /* centres sorted by distance, with travel attached */
  resolved() {
    return CENTRES
      .map(c => {
        const straight = haversine(this.origin, c);
        return { ...c, straight, travel: travelFor(straight), bearing: bearing(this.origin, c) };
      })
      .filter(c => this.filter === 'all' || c.type === this.filter)
      .sort((a, b) => a.straight - b.straight);
  }

  render() {
    const list = this.resolved();
    const near = list.filter(c => c.travel.km <= MAXKM * 1.3).slice(0, 14);

    this.host.innerHTML = `
      <div class="plate-wrap">
        <div class="plate-side">
          <div class="plate-head">
            <span class="eyebrow">Centred on</span>
            <strong>${this.origin.label}</strong>
            <button class="btn ghost sm" id="locate-btn">
              ${this.located ? 'Located' : 'Use my location'}
            </button>
          </div>
          <div class="chips" id="type-chips">
            ${['all', ...Object.keys(CENTRE_TYPE)].map(t => `
              <button class="chip${this.filter === t ? ' on' : ''}" data-type="${t}">
                ${t === 'all' ? 'All' : CENTRE_TYPE[t].label}
              </button>`).join('')}
          </div>
          <div class="centre-list" id="centre-list">
            ${near.map(c => this.rowHTML(c)).join('') ||
              '<p class="muted">No centres of that kind within 90 km.</p>'}
          </div>
        </div>
        <div class="plate-main">
          <div class="plate" id="plate"></div>
          <div class="plate-detail" id="plate-detail"></div>
        </div>
      </div>`;

    this.drawPlate(near);
    this.wire(near);
    if (this.selected) this.showDetail(near.find(c => c.id === this.selected) || near[0]);
    else if (near[0]) this.showDetail(near[0]);
  }

  rowHTML(c) {
    const t = c.travel;
    return `
      <button class="centre-row${this.selected === c.id ? ' on' : ''}" data-id="${c.id}">
        <span class="cr-type" data-t="${c.type}">${CENTRE_TYPE[c.type].label}</span>
        <span class="cr-name">${c.name}</span>
        <span class="cr-meta">
          <b class="num">${t.km} km</b> · ${t.mode} · ${t.minutes} min
          ${t.commutable ? '' : '<em>· not a daily commute</em>'}
        </span>
      </button>`;
  }

  drawPlate(list) {
    const host = this.host.querySelector('#plate');
    const S = 560, C = S / 2, R = C - 44;
    const scale = km => Math.sqrt(Math.min(km, MAXKM) / MAXKM) * R;

    const svg = el('svg', {
      viewBox: `0 0 ${S} ${S}`, class: 'plate-svg', role: 'img',
      'aria-label': 'Radial plan of training centres by direction and distance'
    });

    /* plate ground */
    svg.appendChild(el('circle', { cx: C, cy: C, r: R + 30, fill: '#fffdf8', stroke: '#ded6c8' }));

    /* distance rings */
    RINGS.forEach(km => {
      const r = scale(km);
      svg.appendChild(el('circle', {
        cx: C, cy: C, r, fill: 'none', stroke: '#ded6c8',
        'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: .9
      }));
      const t = el('text', {
        x: C + 4, y: C - r - 5, fill: '#a79c8c', 'font-size': 10,
        'font-family': 'ui-monospace, Menlo, monospace'
      });
      t.textContent = `${km} km`;
      svg.appendChild(t);
    });

    /* cardinal spokes */
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([lbl, deg]) => {
      const a = (deg - 90) * Math.PI / 180;
      svg.appendChild(el('line', {
        x1: C, y1: C,
        x2: C + Math.cos(a) * (R + 14), y2: C + Math.sin(a) * (R + 14),
        stroke: '#e8e2d6', 'stroke-width': 1
      }));
      const t = el('text', {
        x: C + Math.cos(a) * (R + 30), y: C + Math.sin(a) * (R + 30) + 4,
        'text-anchor': 'middle', fill: '#a79c8c', 'font-size': 11, 'font-weight': 600
      });
      t.textContent = lbl;
      svg.appendChild(t);
    });

    /* the household at centre */
    svg.appendChild(el('circle', { cx: C, cy: C, r: 7, fill: '#23201c' }));
    svg.appendChild(el('circle', { cx: C, cy: C, r: 13, fill: 'none', stroke: '#23201c', opacity: .25 }));
    const me = el('text', {
      x: C, y: C + 30, 'text-anchor': 'middle', fill: '#4a443c',
      'font-size': 11, 'font-weight': 620
    });
    me.textContent = 'Home';
    svg.appendChild(me);

    /* centres */
    list.forEach(c => {
      const r = scale(c.travel.km);
      const a = c.bearing - Math.PI / 2;
      const x = C + Math.cos(a) * r, y = C + Math.sin(a) * r;
      const on = this.selected === c.id;

      const g = el('g', { class: 'mark', 'data-id': c.id, style: 'cursor:pointer' });
      /* connector */
      g.appendChild(el('line', {
        x1: C, y1: C, x2: x, y2: y,
        stroke: on ? '#c2701c' : '#ded6c8', 'stroke-width': on ? 1.6 : 1,
        opacity: on ? .9 : .5
      }));
      /* 2px surface ring so overlapping marks stay separable */
      g.appendChild(el('circle', {
        cx: x, cy: y, r: on ? 13 : 10,
        fill: on ? '#c2701c' : '#f7f4ee',
        stroke: '#fffdf8', 'stroke-width': 2
      }));
      g.appendChild(el('circle', {
        cx: x, cy: y, r: on ? 13 : 10,
        fill: 'none', stroke: on ? '#c2701c' : '#a79c8c', 'stroke-width': 1.2
      }));
      const gl = el('path', {
        d: GLYPH[CENTRE_TYPE[c.type].glyph],
        transform: `translate(${x},${y}) scale(${on ? 1.05 : .9})`,
        fill: 'none', stroke: on ? '#fffdf8' : '#4a443c', 'stroke-width': 1.5,
        'stroke-linejoin': 'round'
      });
      g.appendChild(gl);
      svg.appendChild(g);
    });

    host.innerHTML = '';
    host.appendChild(svg);
  }

  showDetail(c) {
    if (!c) return;
    this.selected = c.id;
    const t = c.travel;
    const trades = c.trades.map(id => byId(id)).filter(Boolean);
    this.host.querySelector('#plate-detail').innerHTML = `
      <div class="pd-head">
        <div>
          <span class="pill">${CENTRE_TYPE[c.type].label}</span>
          ${c.govt ? '<span class="pill ok">Government</span>' : '<span class="pill">Private</span>'}
          <h3>${c.name}</h3>
        </div>
        <div class="pd-dist"><b class="num">${t.km}</b><span>km by road</span></div>
      </div>
      <div class="pd-grid">
        <div><span class="eyebrow">Getting there</span><b>${t.mode}</b><em>${t.minutes} min each way</em></div>
        <div><span class="eyebrow">Fare</span><b class="num">${t.costOneWay ? inr(t.costOneWay) : 'Free'}</b><em>one way</em></div>
        <div><span class="eyebrow">Monthly travel</span><b class="num">${t.costMonthly != null ? inr(t.costMonthly) : '—'}</b><em>${t.commutable ? '24 days, both ways' : 'hostel advised'}</em></div>
        <div><span class="eyebrow">Seats</span><b class="num">${c.seats}</b><em>per intake</em></div>
      </div>
      <div class="pd-trades">
        <span class="eyebrow">Courses offered here</span>
        <ul>${trades.map(p => `
          <li><b>${p.name}</b> <span class="pill">NSQF ${p.nsqf}</span>
          <em>${p.months} months · ${p.feePerYear ? inr(p.feePerYear) + '/yr' : 'no fee'}</em></li>`).join('')}
        </ul>
      </div>
      ${!t.commutable ? `<p class="pd-warn">Beyond daily-commute range. Factor hostel cost into the household plan before shortlisting this centre.</p>` : ''}`;
  }

  wire(near) {
    const q = s => this.host.querySelector(s);
    q('#locate-btn')?.addEventListener('click', async () => {
      const btn = q('#locate-btn');
      btn.textContent = 'Locating…';
      const ok = await this.locate();
      if (!ok) btn.textContent = 'Location unavailable';
      this.render();
    });
    this.host.querySelectorAll('#type-chips .chip').forEach(b =>
      b.addEventListener('click', () => {
        this.filter = b.dataset.type;
        this.selected = null;
        this.render();
      }));
    const pick = id => {
      const c = this.resolved().find(x => x.id === id);
      if (!c) return;
      this.showDetail(c);
      this.drawPlate(this.resolved().filter(x => x.travel.km <= MAXKM * 1.3).slice(0, 14));
      this.host.querySelectorAll('.centre-row').forEach(r =>
        r.classList.toggle('on', r.dataset.id === id));
    };
    this.host.querySelectorAll('.centre-row').forEach(r =>
      r.addEventListener('click', () => pick(r.dataset.id)));
    this.host.querySelectorAll('.mark').forEach(m =>
      m.addEventListener('click', () => pick(m.dataset.id)));
  }
}
