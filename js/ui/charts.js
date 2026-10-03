/* Inline SVG charts.
 *
 * Series palette validated with the dataviz six-checks against the parchment
 * surface: #c2701c (vocational) / #3f62c4 (degree) — lightness band PASS,
 * chroma floor PASS, CVD separation ΔE 26.8 protan / 26.2 tritan, normal-vision
 * ΔE 30.4, contrast >= 3:1. Magnitude charts use a single hue, not the
 * categorical pair, because they encode amount rather than identity.
 */

import { inrShort, inr } from '../core/engine.js';

export const SERIES = {
  vocational: '#c2701c',
  degree:     '#3f62c4'
};
const INK = '#23201c', INK3 = '#7a7064', RULE = '#ded6c8', SURFACE = '#fffdf8';

const svgEl = (tag, attrs = {}) => {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};

/* ---------------------------------------------------------------- tooltip */
function mountTip(host) {
  let tip = host.querySelector('.cht-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'cht-tip';
    tip.hidden = true;
    host.appendChild(tip);
  }
  return tip;
}

/* ============================================================== cash flow */
/* Two-line comparison of cumulative household position. The headline chart:
   it is the household-finance reframing made visible. */
export function cashflowChart(host, cmp, labelA, labelB) {
  host.innerHTML = '';
  host.style.position = 'relative';
  const tip = mountTip(host);

  const W = 760, H = 320, P = { t: 22, r: 20, b: 40, l: 62 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const months = cmp.a.series.length;

  const all = [...cmp.a.series, ...cmp.b.series].map(p => p.cumulative);
  const lo = Math.min(0, ...all), hi = Math.max(...all);
  const pad = (hi - lo) * 0.08;
  const y0 = lo - pad, y1 = hi + pad;

  const X = m => P.l + (m - 1) / (months - 1) * iw;
  const Y = v => P.t + ih - (v - y0) / (y1 - y0) * ih;

  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`, class: 'cht', role: 'img',
    'aria-label': `Cumulative household position, ${labelA} versus ${labelB}, over four years`
  });

  /* grid — recessive */
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const v = y0 + (y1 - y0) * i / ticks;
    const y = Y(v);
    svg.appendChild(svgEl('line', {
      x1: P.l, x2: W - P.r, y1: y, y2: y,
      stroke: RULE, 'stroke-width': 1, opacity: v === 0 ? .9 : .45
    }));
    const t = svgEl('text', {
      x: P.l - 10, y: y + 4, 'text-anchor': 'end',
      fill: INK3, 'font-size': 11, 'font-family': 'ui-monospace, Menlo, monospace'
    });
    t.textContent = inrShort(v);
    svg.appendChild(t);
  }

  /* zero line emphasised — the break-even reference */
  if (y0 < 0 && y1 > 0) {
    svg.appendChild(svgEl('line', {
      x1: P.l, x2: W - P.r, y1: Y(0), y2: Y(0),
      stroke: INK, 'stroke-width': 1.5, opacity: .35, 'stroke-dasharray': '2 3'
    }));
  }

  /* x axis — years */
  for (let m = 12; m <= months; m += 12) {
    const t = svgEl('text', {
      x: X(m), y: H - P.b + 20, 'text-anchor': 'middle',
      fill: INK3, 'font-size': 11
    });
    t.textContent = `${m / 12} yr`;
    svg.appendChild(t);
  }

  const line = (series, color) => {
    const d = series.map((p, i) => `${i ? 'L' : 'M'}${X(p.month).toFixed(1)},${Y(p.cumulative).toFixed(1)}`).join('');
    svg.appendChild(svgEl('path', {
      d, fill: 'none', stroke: color, 'stroke-width': 2,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round'
    }));
  };
  line(cmp.a.series, SERIES.vocational);
  line(cmp.b.series, SERIES.degree);

  /* crossover marker — the moment the comparison flips */
  if (cmp.crossover) {
    const cx = X(cmp.crossover), cy = Y(cmp.a.at(cmp.crossover));
    svg.appendChild(svgEl('line', {
      x1: cx, x2: cx, y1: P.t, y2: P.t + ih,
      stroke: INK, 'stroke-width': 1, opacity: .3, 'stroke-dasharray': '3 3'
    }));
    svg.appendChild(svgEl('circle', {
      cx, cy, r: 5, fill: SURFACE, stroke: INK, 'stroke-width': 2
    }));
    const lbl = svgEl('text', {
      x: cx + 9, y: P.t + 14, fill: INK, 'font-size': 11, 'font-weight': 600
    });
    lbl.textContent = `crosses at ${Math.round(cmp.crossover / 12 * 10) / 10} yr`;
    svg.appendChild(lbl);
  }

  /* direct labels at the series ends — identity without relying on color */
  const endLabel = (series, color, text) => {
    const last = series[series.length - 1];
    const t = svgEl('text', {
      x: X(last.month) - 4, y: Y(last.cumulative) - 10,
      'text-anchor': 'end', fill: INK, 'font-size': 11.5, 'font-weight': 620
    });
    t.textContent = text;
    svg.appendChild(t);
    svg.appendChild(svgEl('circle', {
      cx: X(last.month), cy: Y(last.cumulative), r: 4.5,
      fill: color, stroke: SURFACE, 'stroke-width': 2
    }));
  };
  endLabel(cmp.a.series, SERIES.vocational, labelA);
  endLabel(cmp.b.series, SERIES.degree, labelB);

  /* hover crosshair */
  const hx = svgEl('line', { y1: P.t, y2: P.t + ih, stroke: INK, 'stroke-width': 1, opacity: 0 });
  const da = svgEl('circle', { r: 5, fill: SERIES.vocational, stroke: SURFACE, 'stroke-width': 2, opacity: 0 });
  const db = svgEl('circle', { r: 5, fill: SERIES.degree,     stroke: SURFACE, 'stroke-width': 2, opacity: 0 });
  svg.append(hx, da, db);

  const hit = svgEl('rect', { x: P.l, y: P.t, width: iw, height: ih, fill: 'transparent', style: 'cursor:crosshair' });
  svg.appendChild(hit);

  const onMove = ev => {
    const r = svg.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width * W;
    let m = Math.round((px - P.l) / iw * (months - 1) + 1);
    m = Math.max(1, Math.min(months, m));
    const av = cmp.a.at(m), bv = cmp.b.at(m);
    hx.setAttribute('x1', X(m)); hx.setAttribute('x2', X(m));
    hx.setAttribute('opacity', .25);
    da.setAttribute('cx', X(m)); da.setAttribute('cy', Y(av)); da.setAttribute('opacity', 1);
    db.setAttribute('cx', X(m)); db.setAttribute('cy', Y(bv)); db.setAttribute('opacity', 1);
    tip.hidden = false;
    tip.innerHTML =
      `<div class="cht-tip-h">Month ${m}</div>` +
      `<div class="cht-tip-r"><i style="background:${SERIES.vocational}"></i>${labelA}<b>${inr(av)}</b></div>` +
      `<div class="cht-tip-r"><i style="background:${SERIES.degree}"></i>${labelB}<b>${inr(bv)}</b></div>` +
      `<div class="cht-tip-d">difference <b>${inr(av - bv)}</b></div>`;
    const hr = host.getBoundingClientRect();
    tip.style.left = Math.min(hr.width - 180, Math.max(4, ev.clientX - hr.left + 12)) + 'px';
    tip.style.top = Math.max(4, ev.clientY - hr.top - 10) + 'px';
  };
  const onLeave = () => {
    tip.hidden = true;
    hx.setAttribute('opacity', 0);
    da.setAttribute('opacity', 0); db.setAttribute('opacity', 0);
  };
  hit.addEventListener('mousemove', onMove);
  hit.addEventListener('mouseleave', onLeave);

  host.appendChild(svg);
}

/* ======================================================= magnitude bars */
/* Single hue — this encodes amount across categories, not identity. */
export function barsChart(host, rows, { unit = '%', hue = '#8a6a2f', max = null } = {}) {
  host.innerHTML = '';
  host.style.position = 'relative';
  const tip = mountTip(host);

  const n = rows.length;
  const rowH = 30, gap = 8;
  const W = 760, P = { t: 6, r: 90, b: 6, l: 206 };
  const H = P.t + P.b + n * rowH + (n - 1) * gap;
  const iw = W - P.l - P.r;
  const hi = max ?? Math.max(...rows.map(r => r.value));

  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cht', role: 'img' });

  rows.forEach((r, i) => {
    const y = P.t + i * (rowH + gap);
    const w = Math.max(2, r.value / hi * iw);

    const lbl = svgEl('text', {
      x: P.l - 12, y: y + rowH / 2 + 4, 'text-anchor': 'end',
      fill: INK, 'font-size': 12.5
    });
    lbl.textContent = r.label;
    svg.appendChild(lbl);

    svg.appendChild(svgEl('rect', {
      x: P.l, y: y + 5, width: iw, height: rowH - 10,
      fill: RULE, opacity: .35, rx: 4
    }));

    const bar = svgEl('rect', {
      x: P.l, y: y + 5, width: w, height: rowH - 10,
      fill: r.tone || hue, rx: 4, style: 'cursor:default'
    });
    svg.appendChild(bar);

    const val = svgEl('text', {
      x: P.l + w + 10, y: y + rowH / 2 + 4,
      fill: INK, 'font-size': 12, 'font-weight': 620,
      'font-family': 'ui-monospace, Menlo, monospace'
    });
    val.textContent = unit === '%' ? `${Math.round(r.value)}%` : `${r.value}${unit}`;
    svg.appendChild(val);

    bar.addEventListener('mousemove', ev => {
      tip.hidden = false;
      tip.innerHTML = `<div class="cht-tip-h">${r.label}</div>` +
        (r.note ? `<div class="cht-tip-d">${r.note}</div>` : '');
      const hr = host.getBoundingClientRect();
      tip.style.left = Math.min(hr.width - 200, ev.clientX - hr.left + 12) + 'px';
      tip.style.top = (ev.clientY - hr.top - 10) + 'px';
    });
    bar.addEventListener('mouseleave', () => { tip.hidden = true; });
  });

  host.appendChild(svg);
}

/* ================================================== paired "gap" chart */
/* Status quo against design target. The status-quo figures are sourced and
   cited in the caption; the target figures are explicitly labelled as design
   targets, never as measured outcomes. */
export function gapChart(host, rows) {
  host.innerHTML = '';
  host.style.position = 'relative';
  const tip = mountTip(host);

  const n = rows.length;
  const bandH = 56, gap = 16;
  const W = 760, P = { t: 26, r: 70, b: 8, l: 212 };
  const H = P.t + P.b + n * bandH + (n - 1) * gap;
  const iw = W - P.l - P.r;

  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cht', role: 'img' });

  /* legend */
  const legend = [
    { t: 'Today', c: '#9a9183' },
    { t: 'With Kutumb Nirnay (design target)', c: SERIES.vocational }
  ];
  let lx = P.l;
  legend.forEach(l => {
    svg.appendChild(svgEl('rect', { x: lx, y: 6, width: 10, height: 10, rx: 2, fill: l.c }));
    const t = svgEl('text', { x: lx + 15, y: 15, fill: INK3, 'font-size': 11 });
    t.textContent = l.t;
    svg.appendChild(t);
    lx += l.t.length * 6.0 + 38;
  });

  rows.forEach((r, i) => {
    const y = P.t + i * (bandH + gap);
    const hi = r.max ?? 100;

    const lbl = svgEl('text', {
      x: P.l - 12, y: y + 20, 'text-anchor': 'end', fill: INK, 'font-size': 12.5
    });
    lbl.textContent = r.label;
    svg.appendChild(lbl);

    const sub = svgEl('text', {
      x: P.l - 12, y: y + 36, 'text-anchor': 'end', fill: INK3, 'font-size': 10.5
    });
    sub.textContent = r.source;
    svg.appendChild(sub);

    /* two bars, 2px surface gap between them */
    [[r.now, '#9a9183', 0], [r.target, SERIES.vocational, 24]].forEach(([v, c, dy], k) => {
      const w = Math.max(2, v / hi * iw);
      const bar = svgEl('rect', { x: P.l, y: y + dy, width: w, height: 22, fill: c, rx: 4 });
      svg.appendChild(bar);
      const t = svgEl('text', {
        x: P.l + w + 9, y: y + dy + 16, fill: INK, 'font-size': 11.5, 'font-weight': 620,
        'font-family': 'ui-monospace, Menlo, monospace'
      });
      t.textContent = r.fmt ? r.fmt(v) : `${v}%`;
      svg.appendChild(t);

      bar.addEventListener('mousemove', ev => {
        tip.hidden = false;
        tip.innerHTML = `<div class="cht-tip-h">${r.label} — ${k ? 'design target' : 'today'}</div>` +
          `<div class="cht-tip-d">${k ? r.targetNote : r.nowNote}</div>`;
        const hr = host.getBoundingClientRect();
        tip.style.left = Math.min(hr.width - 220, ev.clientX - hr.left + 12) + 'px';
        tip.style.top = (ev.clientY - hr.top - 10) + 'px';
      });
      bar.addEventListener('mouseleave', () => { tip.hidden = true; });
    });
  });

  host.appendChild(svg);
}
