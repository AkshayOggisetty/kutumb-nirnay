/* Nearby centres: a radial plan centred on the household.
 * Bearing gives direction, radius gives distance on a square root scale.
 *
 * All interaction is handled by delegation on the host container, so markers
 * and list rows stay clickable across re-renders.
 */

import { CENTRES, CENTRE_TYPE, FALLBACK_ORIGIN, resolveDistrict } from '../data/centres.js';
import { byId } from '../data/paths.js';
import { haversine, travelFor, inr } from '../core/engine.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}) => {
  const e = document.createElementNS(NS, t);
  for (const [k, v] of Object.entries(a)) e.setAttribute(k, String(v));
  return e;
};

const RINGS = [5, 15, 40, 90];
const MAXKM = 90;

function bearing(a, b) {
  const rad = d => d * Math.PI / 180;
  const dLon = rad(b.lon - a.lon);
  const la1 = rad(a.lat), la2 = rad(b.lat);
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

export class CentreFinder {
  constructor(host, opts = {}) {
    this.host = host;
    this.profile = opts.profile || null;
    this.origin = { ...FALLBACK_ORIGIN };
    this.applyProfileOrigin();
    this.filter = opts.filter || 'all';
    this.selected = null;
    this.located = false;
    this.locating = false;
    this._bound = false;
  }

  /* Centre the map on the district the family typed, unless they have granted
     live geolocation, which always wins. */
  applyProfileOrigin() {
    if (this.located || !this.profile) return;
    const hit = resolveDistrict(this.profile.district);
    if (hit) this.origin = hit;
  }

  /* Courses the family is actually weighing: the shortlist plus the two being
     compared. Centres offering any of these are marked as relevant. */
  relevantCourses() {
    if (!this.profile) return [];
    return [...new Set([...(this.profile.shortlist || []),
                        ...(this.profile.compare || [])])];
  }

  isRelevant(c) {
    const want = this.relevantCourses();
    return want.length > 0 && c.trades.some(t => want.includes(t));
  }

  async locate() {
    if (!navigator.geolocation) return false;
    this.locating = true;
    this.paint();
    return new Promise(resolve => {
      let settled = false;
      const finish = ok => {
        if (settled) return;
        settled = true;
        this.locating = false;
        resolve(ok);
      };
      const timer = setTimeout(() => finish(false), 8000);
      navigator.geolocation.getCurrentPosition(
        pos => {
          clearTimeout(timer);
          this.origin = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            label: 'Your current location'
          };
          this.located = true;
          finish(true);
        },
        () => { clearTimeout(timer); finish(false); },
        { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
      );
    });
  }

  setOrigin(lat, lon, label) {
    this.origin = { lat, lon, label };
    this.located = true;
    this.selected = null;
    this.paint();
  }

  resolved() {
    return CENTRES
      .map(c => {
        const straight = haversine(this.origin, c);
        return { ...c, straight, travel: travelFor(straight), bearing: bearing(this.origin, c) };
      })
      .filter(c => this.filter === 'all' ? true
                 : this.filter === 'mine' ? this.isRelevant(c)
                 : c.type === this.filter)
      .sort((a, b) => a.straight - b.straight);
  }

  visible() {
    return this.resolved().filter(c => c.travel.km <= MAXKM * 1.3).slice(0, 16);
  }

  /* ------------------------------------------------------------- render */
  mount() {
    this.host.innerHTML = `
      <div class="finder">
        <aside class="finder-side">
          <div class="finder-origin" id="fx-origin"></div>
          <div class="chips" id="fx-chips"></div>
          <div class="centre-list" id="fx-list"></div>
        </aside>
        <div class="finder-main">
          <div class="plate" id="fx-plate"></div>
          <div class="centre-detail" id="fx-detail"></div>
        </div>
      </div>`;
    this.bind();
    this.paint();
  }

  bind() {
    if (this._bound) return;
    this._bound = true;

    /* one delegated click handler covers list rows, markers, chips, buttons */
    this.host.addEventListener('click', ev => {
      const locBtn = ev.target.closest('[data-act="locate"]');
      if (locBtn) {
        this.locate().then(ok => {
          if (!ok) this.locateFailed = true;
          this.paint();
        });
        return;
      }
      const chip = ev.target.closest('[data-type]');
      if (chip) {
        this.filter = chip.dataset.type;
        this.selected = null;
        this.paint();
        return;
      }
      const hit = ev.target.closest('[data-centre]');
      if (hit) {
        this.selected = hit.dataset.centre;
        this.paint();
        const d = this.host.querySelector('#fx-detail');
        if (d && window.matchMedia('(max-width: 960px)').matches) {
          d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });

    /* keyboard access for the markers */
    this.host.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const hit = ev.target.closest('[data-centre]');
      if (hit) { ev.preventDefault(); this.selected = hit.dataset.centre; this.paint(); }
    });
  }

  paint() {
    const list = this.visible();
    if (!this.selected && list.length) this.selected = list[0].id;

    const originEl = this.host.querySelector('#fx-origin');
    if (originEl) {
      originEl.innerHTML = `
        <span class="field-label">Showing centres near</span>
        <strong>${this.origin.label}</strong>
        ${!this.located && this.profile && this.profile.district
          ? '<p class="hint">Taken from the district in your details.</p>' : ''}
        <button class="btn ghost sm" data-act="locate" ${this.locating ? 'disabled' : ''}>
          ${this.locating ? 'Finding you...' : this.located ? 'Update location' : 'Use my location'}
        </button>
        ${this.locateFailed && !this.located
          ? '<p class="hint">Location unavailable, so results are shown for the district above.</p>' : ''}`;
    }

    const chipsEl = this.host.querySelector('#fx-chips');
    if (chipsEl) {
      const keys = ['all'];
      if (this.relevantCourses().length) keys.push('mine');
      keys.push(...Object.keys(CENTRE_TYPE));
      chipsEl.innerHTML = keys.map(t => `
        <button class="chip${this.filter === t ? ' on' : ''}" data-type="${t}">
          ${t === 'all' ? 'All centres'
            : t === 'mine' ? 'Offers my courses'
            : CENTRE_TYPE[t].label}
        </button>`).join('');
    }

    const listEl = this.host.querySelector('#fx-list');
    if (listEl) {
      listEl.innerHTML = list.length
        ? list.map(c => this.rowHTML(c)).join('')
        : '<p class="hint">No centres of this kind within 90 km. Try another filter.</p>';
    }

    this.drawPlate(list);
    this.drawDetail(list.find(c => c.id === this.selected));
  }

  rowHTML(c) {
    const t = c.travel;
    return `
      <button class="centre-row${this.selected === c.id ? ' on' : ''}${this.isRelevant(c) ? ' rel' : ''}" data-centre="${c.id}">
        <span class="cr-type">${CENTRE_TYPE[c.type].label}${this.isRelevant(c) ? ' &middot; offers your course' : ''}</span>
        <span class="cr-name">${c.name}</span>
        <span class="cr-meta"><b class="num">${t.km} km</b> ${t.mode}, ${t.minutes} min</span>
      </button>`;
  }

  drawPlate(list) {
    const host = this.host.querySelector('#fx-plate');
    if (!host) return;
    const S = 560, C = S / 2, R = C - 46;
    const scale = km => Math.sqrt(Math.min(km, MAXKM) / MAXKM) * R;

    const svg = el('svg', {
      viewBox: `0 0 ${S} ${S}`, class: 'plate-svg', role: 'img',
      'aria-label': 'Map of nearby training centres by direction and distance'
    });

    svg.appendChild(el('circle', { cx: C, cy: C, r: R + 32, fill: '#fffdf8', stroke: '#ded6c8' }));

    RINGS.forEach(km => {
      const r = scale(km);
      svg.appendChild(el('circle', {
        cx: C, cy: C, r, fill: 'none', stroke: '#e3dcce',
        'stroke-width': 1, 'stroke-dasharray': '3 5'
      }));
      const t = el('text', {
        x: C + 5, y: C - r - 5, fill: '#a79c8c', 'font-size': 10,
        'font-family': 'ui-monospace, Menlo, monospace'
      });
      t.textContent = `${km} km`;
      svg.appendChild(t);
    });

    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([lbl, deg]) => {
      const a = (deg - 90) * Math.PI / 180;
      svg.appendChild(el('line', {
        x1: C, y1: C, x2: C + Math.cos(a) * (R + 12), y2: C + Math.sin(a) * (R + 12),
        stroke: '#efeae1', 'stroke-width': 1
      }));
      const t = el('text', {
        x: C + Math.cos(a) * (R + 28), y: C + Math.sin(a) * (R + 28) + 4,
        'text-anchor': 'middle', fill: '#a79c8c', 'font-size': 11, 'font-weight': 600
      });
      t.textContent = lbl;
      svg.appendChild(t);
    });

    svg.appendChild(el('circle', { cx: C, cy: C, r: 7, fill: '#23201c' }));
    svg.appendChild(el('circle', { cx: C, cy: C, r: 13, fill: 'none', stroke: '#23201c', opacity: .22 }));
    const me = el('text', {
      x: C, y: C + 30, 'text-anchor': 'middle', fill: '#4a443c',
      'font-size': 11, 'font-weight': 620
    });
    me.textContent = 'You';
    svg.appendChild(me);

    /* Place the markers, then push apart any that land on top of each other.
       Without this, centres in the same town overlap and a click lands on
       whichever happens to be drawn last. */
    const MIN_GAP = 30;
    const pts = list.map(c => {
      const r = scale(c.travel.km);
      const a = c.bearing - Math.PI / 2;
      return { c, x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, r, a };
    });
    for (let pass = 0; pass < 24; pass++) {
      let moved = false;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const p = pts[i], q = pts[j];
          let dx = q.x - p.x, dy = q.y - p.y;
          let d = Math.hypot(dx, dy);
          if (d >= MIN_GAP) continue;
          if (d < 0.01) {                 // exactly coincident, separate along the bearing
            dx = Math.cos(p.a + 0.6); dy = Math.sin(p.a + 0.6); d = 1;
          }
          const push = (MIN_GAP - d) / 2;
          const ux = dx / d, uy = dy / d;
          p.x -= ux * push; p.y -= uy * push;
          q.x += ux * push; q.y += uy * push;
          moved = true;
        }
      }
      if (!moved) break;
    }
    /* keep everything inside the plate */
    pts.forEach(p => {
      const dx = p.x - C, dy = p.y - C, d = Math.hypot(dx, dy);
      const lim = R + 8;
      if (d > lim) { p.x = C + dx / d * lim; p.y = C + dy / d * lim; }
    });

    pts.forEach(({ c, x, y }) => {
      const on = this.selected === c.id;

      /* the whole group is the hit target, and it is focusable */
      const g = el('g', {
        class: 'mark' + (on ? ' on' : ''),
        'data-centre': c.id,
        tabindex: '0',
        role: 'button',
        'aria-label': `${c.name}, ${c.travel.km} kilometres away`
      });

      g.appendChild(el('line', {
        x1: C, y1: C, x2: x, y2: y,
        stroke: on ? '#c2701c' : '#ded6c8', 'stroke-width': on ? 1.6 : 1,
        opacity: on ? .9 : .45,
        'pointer-events': 'none'
      }));
      /* the only hit target: generous, so a small marker is easy to tap */
      g.appendChild(el('circle', { cx: x, cy: y, r: 17, fill: 'transparent', class: 'hit' }));
      g.appendChild(el('circle', {
        cx: x, cy: y, r: on ? 13 : 10,
        fill: on ? '#c2701c' : '#f7f4ee',
        stroke: '#fffdf8', 'stroke-width': 2
      }));
      g.appendChild(el('circle', {
        cx: x, cy: y, r: on ? 13 : 10,
        fill: 'none', stroke: on ? '#c2701c' : '#a79c8c', 'stroke-width': 1.2
      }));
      if (this.isRelevant(c) && !on) {
        g.appendChild(el('circle', {
          cx: x, cy: y, r: 14, fill: 'none', stroke: '#c2701c',
          'stroke-width': 1.4, 'stroke-dasharray': '3 3', opacity: .85
        }));
      }
      g.appendChild(el('path', {
        d: GLYPH[CENTRE_TYPE[c.type].glyph],
        transform: `translate(${x},${y}) scale(${on ? 1.05 : .9})`,
        fill: 'none', stroke: on ? '#fffdf8' : '#4a443c', 'stroke-width': 1.5,
        'stroke-linejoin': 'round', 'pointer-events': 'none'
      }));
      if (on) {
        const lbl = el('text', {
          x, y: y - 20, 'text-anchor': 'middle', fill: '#23201c',
          'font-size': 11, 'font-weight': 650, 'pointer-events': 'none'
        });
        lbl.textContent = `${c.travel.km} km`;
        g.appendChild(lbl);
      }
      svg.appendChild(g);
    });

    host.innerHTML = '';
    host.appendChild(svg);
  }

  drawDetail(c) {
    const host = this.host.querySelector('#fx-detail');
    if (!host) return;
    if (!c) {
      host.innerHTML = '<p class="hint">Select a centre on the map or in the list to see travel details.</p>';
      return;
    }
    const t = c.travel;
    const courses = c.trades.map(id => byId(id)).filter(Boolean);
    host.innerHTML = `
      <div class="cd-head">
        <div>
          <span class="tag">${CENTRE_TYPE[c.type].label}</span>
          <span class="tag ${c.govt ? 'ok' : ''}">${c.govt ? 'Government' : 'Private'}</span>
          ${this.isRelevant(c) ? '<span class="tag hi">Offers a course you are considering</span>' : ''}
          <h3>${c.name}</h3>
        </div>
        <div class="cd-dist"><b class="num">${t.km}</b><span>km by road</span></div>
      </div>
      <div class="cd-grid">
        <div><span class="field-label">Getting there</span><b>${t.mode}</b><em>${t.minutes} min each way</em></div>
        <div><span class="field-label">Fare</span><b class="num">${t.costOneWay ? inr(t.costOneWay) : 'No cost'}</b><em>one way</em></div>
        <div><span class="field-label">Monthly travel</span><b class="num">${t.costMonthly != null ? inr(t.costMonthly) : 'Not daily'}</b><em>${t.commutable ? '24 days, both ways' : 'hostel advised'}</em></div>
        <div><span class="field-label">Seats</span><b class="num">${c.seats}</b><em>per intake</em></div>
      </div>
      <div class="cd-courses">
        <span class="field-label">Courses offered here</span>
        <ul>${courses.map(p => `
          <li><b>${p.name}</b> <span class="tag">NSQF ${p.nsqf}</span>
          <em>${p.months} months, ${p.feePerYear ? inr(p.feePerYear) + ' a year' : 'no course fee'}</em></li>`).join('')}
        </ul>
      </div>
      ${!t.commutable
        ? '<p class="cd-warn">This is beyond daily travelling distance. Include hostel costs in your plan before shortlisting it.</p>'
        : ''}`;
  }
}
