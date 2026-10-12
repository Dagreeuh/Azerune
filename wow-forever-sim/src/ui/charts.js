// Graphiques en SVG/HTML : distribution, barres, chronologie du cycle et courbe de mana.

import { fmt, fmt0, h, svg } from './dom.js';

// Une couleur par technique (palette catégorielle validée), toujours accompagnée d’une abréviation.
export const CAST_STYLE = {
  raptor: { n: 1, abbr: 'RS' },
  mongoose: { n: 2, abbr: 'MB' },
  striderKick: { n: 3, abbr: 'SK' },
  counterattack: { n: 4, abbr: 'CA' },
  immolation: { n: 5, abbr: 'PI' },
};

const SPAN_ORDER = ['mbWindow', 'caWindow', 'bleed', 'trap', 'bloodFury', 'berserking', 'trinket0', 'trinket1', 'deadlyAspects', 'crusaderMH', 'crusaderOH', 'resourcefulness'];

export function niceTicks(min, max, count = 5) {
  const span = max - min || 1;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => span / s <= count) || 10 * pow;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(v);
  return ticks;
}

export function columnPath(x, y, w, hgt, r) {
  const rr = Math.min(r, w / 2, hgt);
  const b = y + hgt;
  return `M${x},${b}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${b}Z`;
}

export function castChip(id, name) {
  const st = CAST_STYLE[id];
  return h('span', { class: 'cast-chip' },
    h('i', { class: `cast-swatch s${st ? st.n : 0}`, 'aria-hidden': 'true' }, st ? st.abbr : ''),
    h('span', {}, name));
}

export function histogram(dps, mean) {
  const W = 560;
  const H = 210;
  const m = { l: 40, r: 12, t: 22, b: 28 };
  let lo = Math.min(...dps);
  let hi = Math.max(...dps);
  if (hi - lo < 1) { lo -= 1; hi += 1; }
  const bins = 24;
  const width = (hi - lo) / bins;
  const counts = new Array(bins).fill(0);
  for (const v of dps) counts[Math.min(bins - 1, Math.floor((v - lo) / width))]++;
  const shares = counts.map((c) => (c / dps.length) * 100);
  const yMax = Math.max(...shares) * 1.1;
  const x = (v) => m.l + ((v - lo) / (hi - lo)) * (W - m.l - m.r);
  const y = (v) => H - m.b - (v / yMax) * (H - m.t - m.b);
  const bw = (W - m.l - m.r) / bins;

  const yTicks = niceTicks(0, yMax, 3);
  const xTicks = niceTicks(lo, hi, 5);
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Distribution du DPS sur ${dps.length} combats, moyenne ${fmt0(mean)}` });
  root.append(
    svg('g', { class: 'grid' }, yTicks.map((t) => svg('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t) }))),
    svg('g', { class: 'axis' },
      yTicks.map((t) => svg('text', { x: m.l - 6, y: y(t) + 4, 'text-anchor': 'end' }, `${fmt0(t)} %`)),
      xTicks.map((t) => svg('text', { x: x(t), y: H - 8, 'text-anchor': 'middle' }, fmt0(t))),
      svg('line', { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b })),
  );
  const cols = svg('g', {});
  shares.forEach((s, i) => {
    if (s <= 0) return;
    const x0 = m.l + i * bw + 1;
    const top = y(s);
    cols.append(svg('path', {
      class: 'col', d: columnPath(x0, top, Math.max(1, bw - 2), H - m.b - top, 4),
      tabindex: '0', 'data-tip-title': `${fmt(s)} % des combats`,
      'data-tip': `${fmt0(lo + i * width)} à ${fmt0(lo + (i + 1) * width)} DPS`,
    }));
  });
  root.append(cols);
  const mx = x(mean);
  root.append(
    svg('line', { class: 'mean-line', x1: mx, x2: mx, y1: m.t - 4, y2: H - m.b }),
    svg('text', { class: 'mean-label', x: Math.min(W - m.r - 4, Math.max(m.l + 4, mx)), y: m.t - 8, 'text-anchor': mx > W - 90 ? 'end' : mx < m.l + 90 ? 'start' : 'middle' }, `moyenne ${fmt0(mean)}`),
  );
  return h('div', { class: 'histo' }, root);
}

export function barChart(rows, { currentId } = {}) {
  const max = Math.max(...rows.map((r) => r.value), 1e-9);
  return h('div', { class: 'bars' }, rows.map((r) => {
    const ratio = Math.max(0, r.value) / max;
    return h('div', {
      class: `bar-row${r.id && r.id === currentId ? ' current' : ''}`, tabindex: '0',
      'data-tip-title': r.tipTitle || r.valueText, 'data-tip': r.tip || r.label,
    },
      h('span', { class: 'bar-label' }, r.labelNode || r.label),
      h('span', { class: 'bar-track' },
        h('span', { class: 'bar-fill', style: `--ratio:${ratio.toFixed(4)}` }),
        h('span', { class: 'bar-value' }, r.valueText)));
  }));
}

// ---------- chronologie ----------

const TL = { W: 640, labelW: 150, right: 10, laneH: 24, gap: 8, top: 6, axisH: 26 };

function lanesFor(trace) {
  const lanes = [];
  const casts = trace.events.filter((e) => e.kind === 'cast');
  if (casts.some((e) => e.gcd)) lanes.push({ key: 'gcd', label: 'Techniques (GCD)' });
  if (casts.some((e) => !e.gcd)) lanes.push({ key: 'offgcd', label: 'Raptor Strike (hors GCD)' });
  lanes.push({ key: 'mh', label: 'Main droite' });
  if (trace.dw) lanes.push({ key: 'oh', label: 'Main gauche' });
  const rank = (id) => { const i = SPAN_ORDER.indexOf(id); return i < 0 ? 99 : i; };
  const ids = [...new Set(trace.spans.map((s) => s.id))].sort((a, b) => rank(a) - rank(b));
  for (const id of ids) lanes.push({ key: `span:${id}`, label: trace.spans.find((s) => s.id === id).name, spanId: id });
  return lanes;
}

// `describe(event)` renvoie { title, text } pour l’infobulle. À placer dans un conteneur `.timeline`
// avec `manaChart` pour qu’ils défilent ensemble sur petit écran.
export function timelineChart(trace, { from, to, describe }) {
  const { W, labelW, right, laneH, gap, top, axisH } = TL;
  const lanes = lanesFor(trace);
  const H = top + lanes.length * (laneH + gap) + axisH;
  const x = (t) => labelW + ((t - from) / (to - from)) * (W - labelW - right);
  const laneY = (i) => top + i * (laneH + gap);
  const inWindow = (t) => t >= from && t < to;

  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'timeline-svg', role: 'img', 'aria-label': `Chronologie du combat de ${fmt0(from)} à ${fmt0(to)} secondes` });
  const grid = svg('g', { class: 'grid' });
  for (let v = Math.ceil(from / 5) * 5; v <= to + 1e-9; v += 5) {
    grid.append(svg('line', { x1: x(v), x2: x(v), y1: top - 2, y2: H - axisH + 2 }));
  }
  root.append(grid);

  lanes.forEach((lane, i) => {
    const y0 = laneY(i);
    root.append(
      svg('rect', { class: 'lane-bg', x: labelW, y: y0, width: W - labelW - right, height: laneH, rx: 3 }),
      svg('text', { class: 'lane-label', x: labelW - 10, y: y0 + laneH / 2 + 4, 'text-anchor': 'end' }, lane.label),
    );
    const g = svg('g', {});
    if (lane.key === 'gcd' || lane.key === 'offgcd') {
      const onGcd = lane.key === 'gcd';
      for (const e of trace.events) {
        if (e.kind !== 'cast' || e.gcd !== onGcd || !inWindow(e.t)) continue;
        const st = CAST_STYLE[e.id] || { n: 0, abbr: '?' };
        const x0 = x(e.t);
        const len = onGcd ? trace.gcd : 0.45;
        const w = Math.max(6, Math.min(x(e.t + len), x(to)) - x0 - 2);
        const avoided = e.outcome === 'miss' || e.outcome === 'dodge' || e.outcome === 'parry';
        const d = describe(e);
        const mark = svg('g', { class: `cast s${st.n}${avoided ? ' avoided' : ''}`, tabindex: '0', 'data-tip-title': d.title, 'data-tip': d.text });
        mark.append(svg('rect', { class: 'cast-fill', x: x0, y: y0 + 1, width: w, height: laneH - 2, rx: 4 }));
        if (e.outcome === 'crit') mark.append(svg('rect', { class: 'crit-cap', x: x0 + 2, y: y0 - 2, width: Math.max(2, w - 4), height: 3, rx: 1.5 }));
        if (w >= 22) mark.append(svg('text', { class: 'cast-text', x: x0 + w / 2, y: y0 + laneH / 2 + 4, 'text-anchor': 'middle' }, st.abbr));
        g.append(mark);
      }
    } else if (lane.key === 'mh' || lane.key === 'oh') {
      for (const e of trace.events) {
        if (e.kind !== 'swing' || !inWindow(e.t)) continue;
        const isOH = e.id === 'oh';
        if ((lane.key === 'oh') !== isOH) continue;
        const d = describe(e);
        const x0 = x(e.t);
        const attrs = { 'data-tip-title': d.title, 'data-tip': d.text };
        if (e.outcome === 'miss' || e.outcome === 'dodge' || e.outcome === 'parry') {
          g.append(svg('circle', { class: 'swing-miss', cx: x0, cy: y0 + laneH - 5, r: 3.5, ...attrs }));
        } else {
          const hgt = e.outcome === 'crit' ? laneH - 2 : e.outcome === 'glance' ? 9 : 15;
          g.append(svg('rect', { class: `swing ${e.outcome}${e.id === 'extra' ? ' extra' : ''}`, x: x0 - 1.5, y: y0 + laneH - 1 - hgt, width: 3, height: hgt, rx: 1, ...attrs }));
          g.append(svg('rect', { class: 'hit-target', x: x0 - 5, y: y0, width: 10, height: laneH, ...attrs }));
        }
      }
    } else if (lane.spanId) {
      for (const s of trace.spans) {
        if (s.id !== lane.spanId || s.end <= from || s.start >= to) continue;
        const x0 = x(Math.max(from, s.start));
        const x1 = x(Math.min(to, s.end));
        g.append(svg('rect', {
          class: 'span-mark', x: x0, y: y0 + 6, width: Math.max(2, x1 - x0), height: laneH - 12, rx: 3,
          'data-tip-title': s.name, 'data-tip': `de ${fmt(s.start, 1)} à ${fmt(s.end, 1)} s · ${fmt(s.end - s.start, 1)} s`,
        }));
      }
    }
    root.append(g);
  });

  const axisY = H - axisH + 16;
  const axis = svg('g', { class: 'axis' });
  for (let v = Math.ceil(from / 5) * 5; v <= to + 1e-9; v += 5) {
    axis.append(svg('text', { x: x(v), y: axisY, 'text-anchor': v === from ? 'start' : v >= to ? 'end' : 'middle' }, `${fmt0(v)} s`));
  }
  root.append(axis);
  return root;
}

// Courbe du mana sur la même échelle de temps que la chronologie.
export function manaChart(trace, { from, to }) {
  const { W, labelW, right } = TL;
  const H = 104;
  const top = 10;
  const bottom = 22;
  const x = (t) => labelW + ((t - from) / (to - from)) * (W - labelW - right);
  const y = (m) => top + (1 - m / trace.manaMax) * (H - top - bottom);

  const pts = [{ t: 0, mana: trace.manaMax }, ...trace.events.filter((e) => Number.isFinite(e.mana)).map((e) => ({ t: e.t, mana: e.mana }))];
  let startMana = trace.manaMax;
  for (const p of pts) if (p.t <= from) startMana = p.mana;
  const win = [{ t: from, mana: startMana }, ...pts.filter((p) => p.t > from && p.t < to), { t: to, mana: null }];
  let d = `M${x(from)},${y(startMana)}`;
  let last = startMana;
  for (const p of win.slice(1)) {
    d += `H${x(p.t)}`;
    if (p.mana !== null) {
      d += `V${y(p.mana)}`;
      last = p.mana;
    }
  }
  const area = `${d}V${y(0)}H${x(from)}Z`;

  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'mana-svg', role: 'img', 'aria-label': `Mana de ${fmt0(from)} à ${fmt0(to)} secondes, ${fmt0(last)} à la fin` });
  root.append(
    svg('text', { class: 'lane-label', x: labelW - 52, y: (y(trace.manaMax) + y(0)) / 2 + 4, 'text-anchor': 'end' }, 'Mana'),
    svg('g', { class: 'axis' },
      svg('text', { x: labelW - 8, y: y(trace.manaMax) + 4, 'text-anchor': 'end' }, fmt0(trace.manaMax)),
      svg('text', { x: labelW - 8, y: y(0) + 4, 'text-anchor': 'end' }, '0')),
    svg('g', { class: 'grid' },
      svg('line', { x1: labelW, x2: W - right, y1: y(trace.manaMax), y2: y(trace.manaMax) }),
      svg('line', { x1: labelW, x2: W - right, y1: y(0), y2: y(0) })),
    svg('path', { class: 'mana-area', d: area }),
    svg('path', { class: 'mana-line', d }),
  );
  const cross = svg('line', { class: 'crosshair', x1: 0, x2: 0, y1: top, y2: y(0), visibility: 'hidden' });
  const overlay = svg('rect', { class: 'overlay', x: labelW, y: 0, width: W - labelW - right, height: H - bottom + 4, 'data-tip-title': '', 'data-tip': '' });
  overlay.addEventListener('pointermove', (ev) => {
    const ctm = root.getScreenCTM();
    if (!ctm) return;
    const pt = root.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    const loc = pt.matrixTransform(ctm.inverse());
    const t = from + ((loc.x - labelW) / (W - labelW - right)) * (to - from);
    let value = startMana;
    for (const p of pts) { if (p.t <= t) value = p.mana; else break; }
    cross.setAttribute('x1', x(t));
    cross.setAttribute('x2', x(t));
    cross.setAttribute('visibility', 'visible');
    overlay.setAttribute('data-tip-title', `${fmt0(value)} mana`);
    overlay.setAttribute('data-tip', `à ${fmt(t, 1)} s · ${fmt0((value / trace.manaMax) * 100)} % du maximum`);
  });
  overlay.addEventListener('pointerleave', () => cross.setAttribute('visibility', 'hidden'));
  root.append(cross, overlay);
  return root;
}
