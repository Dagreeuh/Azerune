// Calculateur de talents à la manière de Wowhead : trois arbres d’icônes, rangs, flèches de prérequis.
// Clic : +1 point. Clic droit ou appui long : −1. Les arbres passent en onglets quand la place manque.

import {
  TALENT_TREES, addBlocker, buildProblems, pointsAvailable, rankText, removeBlocker, talentDef, totalPoints, treePoints,
} from '../talenttrees.js';
import { h } from './dom.js';
import { iconSrc, talentBgSrc } from './icons.js';

const LONG_PRESS_MS = 450;
// Après un appui long, le clic et le menu contextuel qui suivent ne doivent pas compter.
let suppressUntil = 0;

function talentState(talents, t, level) {
  const rank = Number(talents[t.id]) || 0;
  if (rank >= t.max) return 'max';
  if (rank > 0) return 'part';
  return addBlocker(talents, t.id, level) ? 'locked' : 'open';
}

// Gestes : clic = +1, clic droit = −1, appui long (tactile) = −1, touches « - » ou Retour arrière = −1.
function bindGestures(btn, id, onChange, onFocus) {
  let timer = null;
  let touch = false;
  btn.addEventListener('pointerdown', (e) => {
    touch = e.pointerType === 'touch';
    if (!touch) return;
    timer = setTimeout(() => { suppressUntil = Date.now() + 900; onChange(id, -1); }, LONG_PRESS_MS);
  });
  const cancel = () => { clearTimeout(timer); timer = null; };
  btn.addEventListener('pointerup', cancel);
  btn.addEventListener('pointerleave', cancel);
  btn.addEventListener('pointercancel', cancel);
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (Date.now() < suppressUntil) return;
    onChange(id, 1);
  });
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (touch || Date.now() < suppressUntil) return;
    onChange(id, -1);
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === '-' || e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); onChange(id, -1); }
  });
  btn.addEventListener('pointerenter', () => onFocus(id));
  btn.addEventListener('focus', () => onFocus(id));
}

function treeView(tree, opts) {
  const { talents, level, onChange, onFocus, focus } = opts;
  const pts = treePoints(talents, tree.id);
  const grid = h('div', { class: 'tc-grid', style: `background-image:url(${talentBgSrc(tree.id)})` });

  for (const t of tree.talents) {
    if (!t.req) continue;
    const from = talentDef(t.req);
    const active = (Number(talents[from.id]) || 0) >= from.max;
    // Flèche verticale : du bas du talent requis au haut du talent qui en dépend.
    grid.append(h('i', {
      class: `tc-arrow${active ? ' on' : ''}`, 'aria-hidden': 'true',
      style: `--c:${t.col};--r1:${from.row};--r2:${t.row}`,
    }));
  }

  for (const t of tree.talents) {
    const rank = Number(talents[t.id]) || 0;
    const st = talentState(talents, t, level);
    const btn = h('button', {
      type: 'button',
      class: `tal ${st}${focus === t.id ? ' focus' : ''}`,
      style: `grid-column:${t.col + 1};grid-row:${t.row + 1}`,
      'aria-label': `${t.name}, ${rank} sur ${t.max}`,
      'data-talent': t.id,
    },
    h('img', { src: iconSrc(t.icon), alt: '', width: 40, height: 40, draggable: 'false' }),
    h('span', { class: 'tal-rank', 'aria-hidden': 'true' }, `${rank}/${t.max}`));
    bindGestures(btn, t.id, onChange, onFocus);
    grid.append(btn);
  }

  return h('section', { class: `tc-tree${opts.tree === tree.id ? ' sel' : ''}`, 'aria-label': `${tree.name}, ${pts} points` },
    h('header', { class: 'tc-tree-head' }, h('span', {}, tree.name), h('span', { class: 'num' }, String(pts))),
    grid);
}

export function talentInfo(opts) {
  const { talents, level, focus, onChange } = opts;
  const t = talentDef(focus);
  if (!t) {
    return h('div', { class: 'tc-info', id: 'tc-info' },
      h('p', { class: 'hint' }, 'Survolez ou touchez un talent pour lire son effet.'));
  }
  const rank = Number(talents[t.id]) || 0;
  const blockAdd = rank < t.max ? addBlocker(talents, t.id, level) : null;
  const blockRemove = rank > 0 ? removeBlocker(talents, t.id) : 'Aucun point à retirer.';
  const tree = TALENT_TREES.find((x) => x.id === t.tree);
  return h('div', { class: 'tc-info', id: 'tc-info', 'aria-live': 'polite' },
    h('img', { class: 'tc-info-icon', src: iconSrc(t.icon), alt: '', width: 48, height: 48 }),
    h('div', { class: 'tc-info-body' },
      h('div', { class: 'tc-info-title' },
        h('strong', {}, t.name),
        h('span', { class: 'hint' }, `${tree.name} · rangée ${t.row + 1}`),
        t.sim ? h('span', { class: 'chip fresh', title: 'Ce talent change le DPS simulé.' }, 'Simulé') : null),
      h('div', { class: 'tc-info-rank num' }, `Rang ${rank}/${t.max}`),
      h('p', {}, rankText(t.desc, rank || 1)),
      rank > 0 && rank < t.max ? h('p', { class: 'hint' }, h('b', {}, 'Rang suivant : '), rankText(t.desc, rank + 1)) : null,
      blockAdd ? h('p', { class: 'tc-blocked' }, blockAdd) : null),
    h('div', { class: 'tc-info-actions' },
      h('button', { type: 'button', class: 'btn small', 'aria-label': `Retirer un point à ${t.name}`, disabled: !!blockRemove, title: blockRemove || '', onclick: () => onChange(t.id, -1) }, '−'),
      h('button', { type: 'button', class: 'btn small', 'aria-label': `Ajouter un point à ${t.name}`, disabled: !!blockAdd, title: blockAdd || '', onclick: () => onChange(t.id, 1) }, '+')));
}

// opts : { talents, level, focus, tree, onChange(id, delta), onFocus(id), onTree(id), onPreset(), onReset() }
export function talentCalculator(opts) {
  const { talents, level } = opts;
  const used = totalPoints(talents);
  const avail = pointsAvailable(level);
  const problems = buildProblems(talents, level);

  const tabs = h('div', { class: 'tc-tabs', role: 'tablist', 'aria-label': 'Arbres de talents' }, TALENT_TREES.map((tree) => h('button', {
    type: 'button', role: 'tab', class: 'tab', 'aria-selected': opts.tree === tree.id ? 'true' : 'false',
    onclick: () => opts.onTree(tree.id),
  }, `${tree.name} `, h('span', { class: 'num' }, String(treePoints(talents, tree.id))))));

  return h('div', { class: 'tc' },
    h('div', { class: 'tc-head' },
      h('div', { class: 'tc-points' },
        h('span', { class: `num big${used > avail ? ' warn' : ''}` }, `${used} / ${avail}`),
        h('span', { class: 'hint' }, `points au niveau ${level} · `,
          h('span', { class: 'num' }, TALENT_TREES.map((tree) => treePoints(talents, tree.id)).join(' / ')))),
      h('div', { class: 'io-actions' },
        h('button', { type: 'button', class: 'btn small', onclick: opts.onPreset }, `Build conseillé (niveau ${level})`),
        h('button', { type: 'button', class: 'btn small ghost', disabled: used === 0, onclick: opts.onReset }, 'Tout retirer'))),
    problems.length ? h('div', { class: 'notice', role: 'status' },
      h('strong', {}, 'Ce build ne respecte pas les règles de l’arbre. '),
      'Le sim le calcule quand même : ', problems.slice(0, 3).join(' '),
      problems.length > 3 ? ` (+${problems.length - 3})` : '') : null,
    tabs,
    h('div', { class: 'tc-trees' }, TALENT_TREES.map((tree) => treeView(tree, opts))),
    talentInfo(opts),
    h('p', { class: 'hint' }, 'Clic : +1 point. Clic droit ou appui long : −1. Comme en jeu, chaque rangée demande 5 points de plus dans l’arbre, et une flèche marque un talent à prendre au rang maximal avant.'));
}
