// Interface du sim Survie mêlée (WoW Forever). Aucune dépendance.

import {
  BUFFS, CONFIDENCE, CREATURE_TYPES, DATA_INFO, ENCHANTS, FIGHT_PRESETS, MECHANICS, ON_USE_PRESETS, RACES,
  ROTATION_ABILITIES, SAMPLE_WEAPONS, SOURCES, TALENTS, TALENT_PRESETS, WEAPON_TYPES,
  defaultProfile, mechanicDefault,
} from './data.js';
import {
  ARMOR_NAMES, CREATURE_AP_KEYS, ITEM_STATS, ITEM_TYPES, ON_USE_TYPES, QUALITY_NAMES, SLOTS, bestEquipment, canEquip, dbItem, dbItems,
  epFromWeights, equipItem, equipmentTotals, findItem, isWeaponType, itemScore, itemSummary, parseTooltip,
  raceSkill, ratingFactors, resolveProfile, slotDef, wearable, weaponDps, wowheadUrl,
} from './gear.js';
import { ITEM_DB_INFO } from './itemdb.js';
import { addBlocker, buildProblems, fullBuild, removeBlocker } from './talenttrees.js';
import {
  buildCharacter, characterSheet, combatTrace, createAccumulator, label, pairedDiff, profileVariants,
  simulateBatch, statWeightsFromRuns, summarize,
} from './engine.js';
import { $, fmt, fmt0, fmtSigned, getPath, h, setPath, tick, uid } from './ui/dom.js';
import { CAST_STYLE, barChart, castChip, histogram, manaChart, timelineChart } from './ui/charts.js';
import { itemIconSrc, slotIconSrc } from './ui/icons.js';
import { talentCalculator, talentInfo } from './ui/talentcalc.js';

const STORE_KEY = 'forever-sv-sim:v1';
const SEED = 1;
const WINDOW = 30;

const TABS = [
  ['equip', 'Personnage'],
  ['talents', 'Talents'],
  ['combat', 'Combat et buffs'],
  ['rotation', 'Rotation'],
  ['hypo', 'Hypothèses'],
];
// Onglets des anciennes versions, regroupés depuis.
const OLD_TABS = { perso: 'equip', buffs: 'combat' };

const RESULT_TABS = [
  ['summary', 'Résumé'],
  ['cycle', 'Cycle de sorts'],
  ['compare', 'Comparer'],
  ['weights', 'Poids des stats'],
];

const OUTCOME = {
  hit: 'touché', crit: 'critique', glance: 'érafle', miss: 'raté', dodge: 'esquivé', parry: 'paré', placed: 'posé',
};

const state = {
  profiles: [],
  items: [],
  currentId: null,
  tab: 'equip',
  resultsTab: 'summary',
  iterations: 2000,
  results: {},
  weights: {},
  compareAll: null,
  duel: null,
  duelIds: [null, null],
  traces: {},
  traceSeed: 1,
  cycleFrom: 0,
  running: null,
  notice: '',
  ioOpen: false,
  ioMessage: '',
  confirmDelete: false,
  confirmItemDelete: null,
  autoQuality: 3,
  autoStyle: '2h',
  optionsOpen: false,
  picker: null,
  talentTree: 'sv',
  talentFocus: null,
  rerun: false,
};

// ---------- profils et objets ----------

const current = () => state.profiles.find((p) => p.id === state.currentId) || state.profiles[0];
const resolved = (p = current()) => resolveProfile(p, state.items);
const snapshotOf = (p = current()) => JSON.stringify({ ...resolved(p), name: undefined, id: undefined });

function sanitizeItem(i) {
  if (!i || typeof i !== 'object' || !ITEM_TYPES[i.type]) return null;
  const stats = {};
  for (const s of ITEM_STATS) {
    const v = Number(i.stats?.[s.key]);
    if (Number.isFinite(v) && v !== 0) stats[s.key] = v;
  }
  const item = {
    id: String(i.id || uid('i')),
    name: String(i.name || 'Objet sans nom').slice(0, 80),
    type: i.type,
    level: Number(i.level) === 30 ? 30 : Number(i.level) === 60 ? 60 : null,
    source: ['exemple', 'manuel', 'tooltip'].includes(i.source) ? i.source : 'manuel',
    stats,
    weapon: null,
    onUse: null,
    skillFor: Array.isArray(i.skillFor) && i.skillFor.length ? i.skillFor.filter((t) => WEAPON_TYPES[t]) : null,
  };
  if (isWeaponType(i.type) && i.weapon) {
    const min = Math.max(0, Number(i.weapon.min) || 0);
    item.weapon = { min, max: Math.max(min, Number(i.weapon.max) || 0), speed: Math.max(0.5, Number(i.weapon.speed) || 2), type: WEAPON_TYPES[i.weapon.type] ? i.weapon.type : 'axe' };
  }
  if (i.type === 'trinket' && i.onUse && Number(i.onUse.value)) {
    item.onUse = { type: ON_USE_TYPES[i.onUse.type] ? i.onUse.type : 'ap', value: Number(i.onUse.value), duration: Math.max(1, Number(i.onUse.duration) || 20), cd: Math.max(1, Number(i.onUse.cd) || 120) };
  }
  return item;
}

const OLD_RATING_DEFAULTS = { hitRatingPerPct: 4.23, critRatingPerPct: 5.92, hasteRatingPerPct: 4.23, expertiseRatingPerPct: 4.23 };

function normalizeProfile(p) {
  const L = Number(p.level) === 30 ? 30 : 60;
  const d = defaultProfile(L);
  const out = { ...d, ...p, level: L };
  for (const k of ['gear', 'mh', 'oh', 'fight', 'pet', 'custom', 'mechanics']) out[k] = { ...d[k], ...(p[k] || {}) };
  // Un build enregistré est repris tel quel (sans le compléter avec le build par défaut).
  out.talents = fullBuild(p.talents && typeof p.talents === 'object' ? p.talents : d.talents);
  // Les scores valaient moins de % au niveau 30 dans les anciennes versions : on reprend la valeur actuelle.
  for (const [k, old] of Object.entries(OLD_RATING_DEFAULTS)) if (out.mechanics[k] === old) out.mechanics[k] = d.mechanics[k];
  out.buffs = Array.isArray(p.buffs) ? p.buffs.filter((id) => BUFFS.some((b) => b.id === id)) : d.buffs;
  out.trinkets = [0, 1].map((i) => ({ ...d.trinkets[i], ...((p.trinkets || [])[i] || {}) }));
  const rot = Array.isArray(p.rotation) ? p.rotation.filter((r) => ROTATION_ABILITIES[r.id]) : [];
  for (const r of d.rotation) if (!rot.some((x) => x.id === r.id)) rot.push({ ...r });
  out.rotation = rot.map((r) => ({ id: r.id, enabled: !!r.enabled, minMana: Number(r.minMana) || 0 }));
  out.equipment = {};
  for (const slot of SLOTS) if (p.equipment?.[slot.id]) out.equipment[slot.id] = String(p.equipment[slot.id]);
  out.id = p.id || uid();
  out.name = String(p.name || d.name).slice(0, 80);
  return out;
}

function emptyGear(level) {
  const g = { ...defaultProfile(level).gear };
  for (const k of Object.keys(g)) g[k] = 0;
  return g;
}

// Profils d’exemple équipés d’objets réels de la base (meilleurs objets selon les poids par défaut).
function sampleProfiles() {
  const make = (level, style, quality, id, name) => {
    const p = defaultProfile(level);
    p.id = id;
    p.name = name;
    p.gear = emptyGear(level);
    p.twoHand = style === '2h';
    p.equipment = bestEquipment(p, { style, maxQuality: quality });
    return p;
  };
  return [
    make(60, '2h', 3, 'exemple-60-bleu-2m', 'Exemple · niveau 60 · objets bleus · 2M'),
    make(60, 'dw', 3, 'exemple-60-bleu-dw', 'Exemple · niveau 60 · objets bleus · ambidextrie'),
    make(60, '2h', 4, 'exemple-60-epique-2m', 'Exemple · niveau 60 · objets épiques · 2M'),
    make(30, '2h', 3, 'exemple-30-beta', 'Exemple · niveau 30 (bêta) · objets bleus'),
  ];
}

function load() {
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
  } catch {
    data = null;
  }
  state.items = Array.isArray(data?.items) ? data.items.map(sanitizeItem).filter(Boolean) : [];
  if (data && Array.isArray(data.profiles) && data.profiles.length) {
    state.profiles = data.profiles.map(normalizeProfile);
    state.currentId = data.currentId;
    state.iterations = [500, 1000, 2000, 5000, 10000].includes(data.iterations) ? data.iterations : 2000;
    const tab = OLD_TABS[data.tab] || data.tab;
    state.tab = TABS.some(([k]) => k === tab) ? tab : 'equip';
    if (['bm', 'mm', 'sv'].includes(data.talentTree)) state.talentTree = data.talentTree;
    state.resultsTab = RESULT_TABS.some(([k]) => k === data.resultsTab) ? data.resultsTab : 'summary';
    if ([2, 3, 4, 5].includes(data.autoQuality)) state.autoQuality = data.autoQuality;
    if (['2h', 'dw'].includes(data.autoStyle)) state.autoStyle = data.autoStyle;
  } else {
    state.profiles = sampleProfiles();
    state.currentId = state.profiles[0].id;
  }
  if (!state.profiles.some((p) => p.id === state.currentId)) state.currentId = state.profiles[0].id;
  const p = current();
  if (buildProblems(p.talents, p.level).length) {
    state.notice = 'Vos talents viennent d’une version précédente du sim et ne respectent pas les règles de l’arbre de Forever : ouvrez l’onglet Talents pour les corriger ou charger le build conseillé.';
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      profiles: state.profiles, items: state.items, currentId: state.currentId,
      iterations: state.iterations, tab: state.tab, resultsTab: state.resultsTab,
      autoQuality: state.autoQuality, autoStyle: state.autoStyle, talentTree: state.talentTree,
    }));
  } catch {
    // Stockage indisponible (navigation privée) : le sim fonctionne sans.
  }
}

function switchProfile(id) {
  state.currentId = id;
  state.confirmDelete = false;
  state.notice = '';
  state.cycleFrom = 0;
  save();
  renderAll();
}

function addProfile(p) {
  const n = normalizeProfile({ ...p, id: uid() });
  state.profiles.push(n);
  switchProfile(n.id);
}

function changeLevel(L) {
  const p = current();
  if (p.level === L) return;
  p.level = L;
  p.fight.bossLevel = L + 3;
  p.fight.bossArmor = FIGHT_PRESETS[L].bossArmor;
  for (const def of MECHANICS) {
    if (def.value !== null && typeof def.value === 'object') p.mechanics[def.key] = mechanicDefault(def, L);
  }
  const resetTalents = buildProblems(p.talents, L).length > 0;
  if (resetTalents) p.talents = { ...TALENT_PRESETS[L] };
  state.notice = `Niveau ${L} : niveau et armure du boss, rangs des sorts et valeurs dépendantes du niveau ont été remis à jour.${resetTalents ? ` Vos talents ne tenaient pas dans les ${L - 9} points du niveau ${L} : le build conseillé les remplace.` : ''} Vérifiez l’équipement et les buffs.`;
  save();
  renderAll();
}

// ---------- champs de formulaire ----------

function fieldId(path) {
  return `f-${path.replace(/\./g, '-')}`;
}

function numField(text, path, opts = {}) {
  const value = getPath(opts.target || current(), path);
  const attr = opts.draft ? 'data-draft' : 'data-path';
  const id = opts.draft ? `d-${path.replace(/\./g, '-')}` : fieldId(path);
  return h('label', { class: 'field', for: id },
    h('span', {}, text),
    h('input', {
      id, type: 'number', inputmode: 'decimal', step: opts.step ?? 'any', min: opts.min, max: opts.max,
      value: value ?? 0, [attr]: path, 'data-kind': 'num',
    }));
}

function textField(text, path, opts = {}) {
  const attr = opts.draft ? 'data-draft' : 'data-path';
  const id = opts.draft ? `d-${path.replace(/\./g, '-')}` : fieldId(path);
  return h('label', { class: 'field', for: id },
    h('span', {}, text),
    h('input', { id, type: 'text', value: getPath(opts.target || current(), path) ?? '', [attr]: path, 'data-kind': 'str' }));
}

function selectEl(options, value, attrs = {}) {
  const s = h('select', attrs, Object.entries(options).map(([k, v]) => h('option', { value: k }, v)));
  s.value = String(value);
  return s;
}

function selectField(text, path, options, { kind = 'str', rerender = false, draft = false, target } = {}) {
  const attr = draft ? 'data-draft' : 'data-path';
  const id = draft ? `d-${path.replace(/\./g, '-')}` : fieldId(path);
  return h('label', { class: 'field', for: id },
    h('span', {}, text),
    selectEl(options, getPath(target || current(), path), { id, [attr]: path, 'data-kind': kind, 'data-rerender': rerender ? '1' : undefined }));
}

function checkField(text, path, { rerender = false } = {}) {
  const input = h('input', { id: fieldId(path), type: 'checkbox', 'data-path': path, 'data-rerender': rerender ? '1' : undefined });
  input.checked = !!getPath(current(), path);
  return h('label', { class: 'check', for: fieldId(path) }, input, h('span', {}, text));
}

function chip(conf) {
  const c = CONFIDENCE[conf];
  return h('span', { class: `chip ${conf}`, title: c ? c.desc : '' }, c ? c.label : conf);
}

function section(title, hint, ...content) {
  return h('div', { class: 'section' },
    h('div', { class: 'section-title' }, h('h3', {}, title), hint ? h('span', { class: 'hint' }, hint) : null),
    content);
}

// ---------- en-tête et profils ----------

function renderProfileBar() {
  const bar = $('profileBar');
  bar.replaceChildren();
  const p = current();
  const sel = h('select', { id: 'profileSelect', 'aria-label': 'Profil' },
    state.profiles.map((x) => h('option', { value: x.id }, `${x.name} (niv. ${x.level})`)));
  sel.value = p.id;
  sel.addEventListener('change', () => switchProfile(sel.value));
  bar.append(
    sel,
    h('button', { class: 'btn small', type: 'button', onclick: () => addProfile({ ...defaultProfile(60), gear: emptyGear(60) }) }, 'Nouveau 60'),
    h('button', { class: 'btn small', type: 'button', onclick: () => addProfile({ ...defaultProfile(30), gear: emptyGear(30) }) }, 'Nouveau 30'),
    h('button', {
      class: 'btn small', type: 'button',
      onclick: () => addProfile({ ...JSON.parse(JSON.stringify(p)), name: `${p.name} (copie)` }),
    }, 'Dupliquer'),
    h('button', {
      class: `btn small${state.confirmDelete ? ' danger' : ''}`, type: 'button', disabled: state.profiles.length < 2,
      onclick: () => {
        if (!state.confirmDelete) {
          state.confirmDelete = true;
          renderProfileBar();
          return;
        }
        state.profiles = state.profiles.filter((x) => x.id !== p.id);
        delete state.results[p.id];
        delete state.weights[p.id];
        delete state.traces[p.id];
        switchProfile(state.profiles[0].id);
      },
    }, state.confirmDelete ? 'Confirmer la suppression' : 'Supprimer'),
    h('button', {
      class: 'btn small', type: 'button', 'aria-expanded': state.ioOpen ? 'true' : 'false',
      onclick: () => { state.ioOpen = !state.ioOpen; state.ioMessage = ''; renderIO(); renderProfileBar(); },
    }, state.ioOpen ? 'Fermer l’import/export' : 'Importer / exporter'),
  );
}

function exportPayload(p) {
  const ids = new Set(Object.values(p.equipment || {}));
  return JSON.stringify({ format: 'sim-survie-forever', profile: { ...p, id: undefined }, items: state.items.filter((i) => ids.has(i.id)) }, null, 2);
  // Les objets de la base (« db… ») ne sont pas copiés : leur identifiant suffit.
}

function importPayload(data) {
  const profile = data && data.profile ? data.profile : data;
  if (!profile || typeof profile !== 'object') throw new Error('format');
  const remap = {};
  for (const raw of Array.isArray(data.items) ? data.items : []) {
    const item = sanitizeItem(raw);
    if (!item) continue;
    const existing = state.items.find((i) => i.id === item.id);
    if (existing && JSON.stringify(existing) === JSON.stringify(item)) continue;
    if (existing) {
      const id = uid('i');
      remap[item.id] = id;
      item.id = id;
    }
    state.items.push(item);
  }
  const eq = {};
  for (const [slot, id] of Object.entries(profile.equipment || {})) eq[slot] = remap[id] || id;
  addProfile({ ...profile, equipment: eq });
}

function renderIO() {
  const box = $('io');
  box.replaceChildren();
  box.hidden = !state.ioOpen;
  if (!state.ioOpen) return;
  const p = current();
  const exportData = exportPayload(p);
  const out = h('textarea', { id: 'exportText', readonly: true, 'aria-label': 'Profil exporté (JSON)' });
  out.value = exportData;
  const inp = h('textarea', { id: 'importText', placeholder: 'Collez ici un profil exporté (JSON)…', 'aria-label': 'Profil à importer (JSON)' });
  const msg = h('p', { class: 'hint', 'aria-live': 'polite' }, state.ioMessage);
  box.append(
    h('div', { class: 'panel-head' }, h('h2', {}, 'Importer ou exporter un profil'), h('span', { class: 'hint' }, 'Le profil exporté contient aussi ses objets équipés.')),
    h('div', { class: 'io' },
      h('label', { class: 'field', for: 'exportText' }, h('span', {}, `Profil « ${p.name} »`), out),
      h('div', { class: 'io-actions' },
        h('button', {
          class: 'btn small', type: 'button',
          onclick: () => {
            const fail = () => { out.select(); msg.textContent = 'Copie refusée : le texte est sélectionné, copiez-le avec Ctrl+C.'; };
            try {
              navigator.clipboard.writeText(exportData).then(() => { msg.textContent = 'Profil copié dans le presse-papiers.'; }, fail);
            } catch {
              fail();
            }
          },
        }, 'Copier le profil')),
      h('label', { class: 'field', for: 'importText' }, h('span', {}, 'Importer'), inp),
      h('div', { class: 'io-actions' },
        h('button', {
          class: 'btn small primary', type: 'button',
          onclick: () => {
            try {
              state.ioMessage = 'Profil importé.';
              importPayload(JSON.parse(inp.value));
            } catch {
              msg.textContent = 'Ce texte n’est pas un profil valide. Collez le JSON complet obtenu avec « Copier le profil ».';
            }
          },
        }, 'Importer comme nouveau profil')),
      msg),
  );
}

// ---------- feuille de personnage ----------

function renderSheet() {
  const s = characterSheet(resolved());
  const hitWarn = s.yellowMiss > 0;
  const keyStats = [
    ['PA de mêlée', fmt0(s.ap)],
    ['Agilité', fmt0(s.agi)],
    ['Crit contre la cible', `${fmt(s.critVsBoss)} %`],
    ['Toucher / plafond', `${fmt(s.hit)} / ${fmt(s.hitCap)} %`, hitWarn],
    ['Compétence d’arme', fmt0(s.skill)],
    ['Mana', fmt0(s.mana)],
  ];
  const all = [
    ['PA de mêlée', fmt0(s.ap)],
    ['Agilité / Force', `${fmt0(s.agi)} / ${fmt0(s.str)}`],
    ['Crit (feuille)', `${fmt(s.crit)} %`],
    ['Crit contre la cible', `${fmt(s.critVsBoss)} %`],
    ['Toucher / plafond', `${fmt(s.hit)} / ${fmt(s.hitCap)} %`, hitWarn],
    ['Raté techniques', `${fmt(s.yellowMiss)} %`, hitWarn],
    ['Raté attaques auto', `${fmt(s.whiteMiss)} %`],
    ['Esquive de la cible', `${fmt(s.dodge)} %`],
    ['Érafles (pénalité)', `${fmt0(s.glance)} % (−${fmt0(s.glancePenalty)} %)`],
    ['Compétence d’arme', fmt0(s.skill)],
    ['Armure de la cible', `${fmt0(s.armor)} (−${fmt(s.armorReduction)} %)`],
    ['Dégâts critiques', `${fmt0(s.critMultWhite * 100)} % auto · ${fmt0(s.critMult * 100)} % techniques`],
    ['Mana', fmt0(s.mana)],
    ['Expose Prey', `${fmt(s.exposePrey)} % par coup`],
    ['Coût RS / MB / SK', `${fmt0(s.costs.raptor)} / ${fmt0(s.costs.mongoose)} / ${fmt0(s.costs.striderKick)}`],
    s.ohMult !== null
      ? ['Main gauche', `${fmt0(s.ohMult)} % des dégâts`]
      : ['Vitesse d’attaque', `${fmt(s.swing, 2)} s${s.haste > 0 ? ` (+${fmt(s.haste)} %)` : ''}`],
  ];
  const cell = ([k, v, warn]) => h('div', {}, h('span', { class: 'k' }, k), h('span', { class: `v${warn ? ' warn' : ''}` }, v));
  $('doll-stats')?.replaceChildren(...keyStats.map(cell));
  $('sheet')?.replaceChildren(...all.map(cell));
}

// ---------- onglets de réglages ----------

function renderTabs() {
  // Les trois arbres de talents demandent plus de largeur : la colonne des réglages s’élargit.
  document.querySelector('.layout')?.classList.toggle('wide-config', state.tab === 'talents');
  $('tabs').replaceChildren(...TABS.map(([key, text]) => h('button', {
    class: 'tab', type: 'button', role: 'tab', 'aria-selected': state.tab === key ? 'true' : 'false',
    onclick: () => { state.tab = key; save(); renderTabs(); renderPanel(); },
  }, text)));
}

function renderPanel() {
  const p = current();
  const content = {
    equip: panelEquip,
    talents: panelTalents,
    combat: panelCombat,
    rotation: panelRotation,
    hypo: panelHypo,
  }[state.tab](p);
  $('panel').replaceChildren(...[
    state.notice ? h('div', { class: 'notice', role: 'status' }, state.notice) : null,
    content,
  ].filter(Boolean));
}

// ----- Personnage : fiche d’équipement façon jeu -----

const lookup = (id) => findItem(state.items, id);

// Disposition de la fenêtre de personnage du jeu : deux colonnes d’emplacements et les armes en bas.
const DOLL_LEFT = ['head', 'neck', 'shoulders', 'back', 'chest', 'wrists'];
const DOLL_RIGHT = ['hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2'];
const DOLL_WEAPONS = ['mainHand', 'offHand', 'ranged'];
const RANGED_NAMES = { bow: 'Arc', gun: 'Arme à feu', crossbow: 'Arbalète', thrown: 'Arme de jet' };
const AUTO_QUALITY = { 2: 'Objets verts au plus', 3: 'Objets bleus au plus', 4: 'Objets épiques au plus', 5: 'Objets légendaires au plus' };
const QUALITY_FILTER = { 2: 'Verts au plus', 3: 'Bleus au plus', 4: 'Épiques au plus', 5: 'Toutes' };

function currentEp(p = current()) {
  const w = state.weights[p.id];
  return { ep: epFromWeights(w ? w.rows : null, p), measured: !!w };
}

// Ce qui dépend du profil dans la valeur d’un objet : compétence raciale et type de la cible.
function scoreOpts(p) {
  return { raceSkill: raceSkill(p), creature: p.fight?.creatureType };
}

function itemValue(item, p = current(), opts = {}) {
  return itemScore(item, currentEp(p).ep, ratingFactors(p), { ...scoreOpts(p), ...opts });
}

function levelTag(item) {
  if (item.reqLevel) return `niv. ${item.reqEstimated ? '~' : ''}${item.reqLevel}`;
  return item.level ? `niv. ${item.level}` : null;
}

function itemMeta(item) {
  return [
    levelTag(item),
    item.armor ? ARMOR_NAMES[item.armor] : null,
    item.weapon ? `${WEAPON_TYPES[item.weapon.type]}${item.type === 'weapon2h' ? ' à deux mains' : ''}` : null,
    item.rangedType ? RANGED_NAMES[item.rangedType] : null,
    item.source !== 'base' ? 'Objet ajouté' : null,
  ].filter(Boolean).join(' · ');
}

const qualityClass = (item) => `q${item && item.quality ? item.quality : 1}`;

function offHandBlocked(p) {
  const main = lookup(p.equipment?.mainHand);
  return !!(main && main.type === 'weapon2h');
}

function slotButton(p, slotId, side) {
  const slot = slotDef(slotId);
  const blocked = slotId === 'offHand' && offHandBlocked(p);
  const it = blocked ? null : lookup(p.equipment?.[slotId]);
  const factors = ratingFactors(p);
  const tip = it
    ? [itemMeta(it), itemSummary(it, factors), ...(it.notes || []), 'Clic : changer d’objet'].filter(Boolean).join('\n')
    : blocked ? 'Libre en retirant l’arme à deux mains.' : 'Clic : choisir un objet';
  return h('button', {
    type: 'button', class: `slot ${side}${it ? ` ${qualityClass(it)}` : ' empty'}`, disabled: blocked,
    'data-slot': slotId, 'data-tip-title': it ? it.name : slot.name, 'data-tip': tip,
    'aria-label': `${slot.name} : ${it ? it.name : 'vide'}. Changer d’objet`,
    onclick: () => openPicker(slotId),
  },
  h('span', { class: 'slot-icon' }, h('img', { src: itemIconSrc(it, slotId), alt: '', width: 44, height: 44 })),
  h('span', { class: 'slot-text' },
    h('span', { class: 'slot-label' }, slot.name),
    h('span', { class: `slot-item ${it ? qualityClass(it) : ''}` }, it ? it.name : blocked ? 'Arme à deux mains équipée' : 'Vide'),
    it ? h('span', { class: 'slot-stats' }, itemSummary(it, factors)) : null));
}

function autoEquip(p) {
  const style = state.autoStyle;
  p.equipment = bestEquipment(p, { ep: currentEp(p).ep, factors: ratingFactors(p), maxQuality: state.autoQuality, style });
  p.twoHand = style === '2h';
  const count = Object.values(p.equipment).filter(Boolean).length;
  const manual = Object.values(p.gear || {}).some((v) => Number(v));
  state.notice = `${count} objets de la base équipés (${AUTO_QUALITY[state.autoQuality].toLowerCase()}, ${style === '2h' ? 'arme à deux mains' : 'ambidextrie'}).${manual ? ' Vos bonus manuels (réglages du personnage) s’ajoutent encore : remettez-les à zéro s’ils font double emploi.' : ''} Touchez un emplacement pour comparer les objets.`;
  afterChange(true);
}

function panelEquip(p) {
  const races = Object.fromEntries(Object.entries(RACES).map(([k, v]) => [k, v.name]));
  const raceSel = selectEl(races, p.race, { id: fieldId('race'), 'data-path': 'race', 'data-kind': 'str', 'data-rerender': '1', 'aria-label': 'Race' });
  const levelSeg = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Niveau' },
    [30, 60].map((L) => h('button', { type: 'button', 'aria-pressed': p.level === L ? 'true' : 'false', onclick: () => changeLevel(L) }, `Niveau ${L}`)));

  const doll = h('div', { class: 'doll' },
    h('div', { class: 'doll-col left' }, DOLL_LEFT.map((id) => slotButton(p, id, 'left'))),
    h('div', { class: 'doll-center' },
      h('div', { class: 'doll-id' }, levelSeg, raceSel),
      h('p', { class: 'hint' }, (RACES[p.race] || RACES.orc).note),
      h('div', { class: 'doll-stats', id: 'doll-stats' }),
      h('details', { class: 'doll-sheet' }, h('summary', {}, 'Toutes les stats'), h('div', { class: 'sheet', id: 'sheet' }))),
    h('div', { class: 'doll-col right' }, DOLL_RIGHT.map((id) => slotButton(p, id, 'right'))),
    h('div', { class: 'doll-weapons' }, DOLL_WEAPONS.map((id) => slotButton(p, id, 'weapon'))));
  queueMicrotask(renderSheet);

  const qualSel = selectEl(AUTO_QUALITY, state.autoQuality, { id: 'auto-quality', 'aria-label': 'Qualité maximale' });
  qualSel.addEventListener('change', () => { state.autoQuality = Number(qualSel.value); save(); });
  const styleSel = selectEl({ '2h': 'Arme à deux mains', dw: 'Ambidextrie' }, state.autoStyle, { id: 'auto-style', 'aria-label': 'Style d’arme' });
  styleSel.addEventListener('change', () => { state.autoStyle = styleSel.value; save(); });

  return h('div', { class: 'section-stack' },
    doll,
    h('div', { class: 'auto-row' },
      h('span', { class: 'hint' }, 'Remplir avec les meilleurs objets de la base :'),
      qualSel, styleSel,
      h('button', { class: 'btn small primary', type: 'button', onclick: () => autoEquip(p) }, 'Équiper'),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { p.equipment = {}; afterChange(true); } }, 'Tout retirer')),
    characterOptions(p));
}

// ----- Choix d’un objet (fenêtre) -----

const PICKER_BATCH = 8;
const PICKER_ITERATIONS = 1000;
const pickerCache = new Map();
const pickerBase = new Map();
let pickerSeq = 0;
let pickerTimer = null;

const normalizeText = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nameKeys = new Map();
const nameKey = (item) => {
  if (!nameKeys.has(item.id)) nameKeys.set(item.id, normalizeText(item.name));
  return nameKeys.get(item.id);
};

function pairedSlot(slotId) {
  return { finger1: 'finger2', finger2: 'finger1', trinket1: 'trinket2', trinket2: 'trinket1' }[slotId] || null;
}

// Objets possibles pour l’emplacement, du plus prometteur au moins prometteur (poids des stats).
function pickerCandidates(p, pk) {
  const eq = p.equipment || {};
  const other = pairedSlot(pk.slotId) ? eq[pairedSlot(pk.slotId)] : null;
  const words = normalizeText(pk.query).split(/\s+/).filter(Boolean);
  const offHand = pk.slotId === 'offHand';
  const cur = lookup(eq[pk.slotId]);
  const curValue = cur ? itemValue(cur, p, { offHand }) : 0;
  return [...state.items, ...dbItems()]
    .filter((i) => canEquip(i, pk.slotId) && i.id !== other
      && (!pk.myLevel || (i.source === 'base' ? wearable(i, p.level) : !i.level || i.level === p.level))
      && (!i.quality || i.quality <= pk.maxQuality)
      && words.every((w) => nameKey(i).includes(w)))
    .map((i) => ({ i, v: itemValue(i, p, { offHand }) - curValue }))
    .sort((a, b) => b.v - a.v);
}

function openPicker(slotId) {
  if (slotId === 'offHand' && offHandBlocked(current())) return;
  state.picker = { slotId, query: '', myLevel: true, maxQuality: 4, limit: 40, simCount: PICKER_BATCH, progress: null };
  renderPicker();
  const dlg = $('picker');
  if (!dlg.open) dlg.showModal();
  if (window.matchMedia('(pointer: fine)').matches) $('picker-q')?.focus();
  else dlg.querySelector('.picker-close')?.focus();
  runPickerSims();
}

function closePicker() {
  pickerSeq++;
  state.picker = null;
  const dlg = $('picker');
  if (dlg.open) dlg.close();
}

function pickItem(item) {
  const pk = state.picker;
  if (!pk) return;
  equipItem(current(), state.items, pk.slotId, item ? item.id : null);
  state.notice = '';
  closePicker();
  afterChange(true);
}

function addFromTooltip(text, msg) {
  const pk = state.picker;
  if (!pk) return;
  const r = parseTooltip(text);
  if (!r.name) { msg.textContent = 'Rien à lire : collez le texte complet du tooltip.'; return; }
  const type = r.type || slotDef(pk.slotId).accepts[0];
  if (isWeaponType(type) && !r.weapon) { msg.textContent = 'Dégâts de l’arme introuvables : collez le tooltip complet, avec la ligne « Dégâts » et la vitesse.'; return; }
  const item = sanitizeItem({
    id: uid('i'), name: r.name, type, stats: r.stats, source: 'tooltip', skillFor: r.skillFor,
    weapon: r.weapon, onUse: r.onUse, level: current().level,
  });
  if (!canEquip(item, pk.slotId)) {
    msg.textContent = `Ce tooltip décrit un objet « ${ITEM_TYPES[type]} », qui ne va pas dans l’emplacement ${slotDef(pk.slotId).name}.`;
    return;
  }
  state.items.push(item);
  equipItem(current(), state.items, pk.slotId, item.id);
  closePicker();
  state.notice = `« ${item.name} » ajouté à vos objets et équipé.${r.unparsed.length ? ` Lignes non reconnues : ${r.unparsed.join(' / ')}.` : ''}`;
  afterChange(true);
}

function renderPicker() {
  const pk = state.picker;
  const dlg = $('picker');
  if (!pk || !dlg) return;
  const p = current();
  const slot = slotDef(pk.slotId);
  const cur = lookup(p.equipment?.[pk.slotId]);

  const q = h('input', { id: 'picker-q', type: 'search', value: pk.query, placeholder: 'Nom anglais, ex. Devilsaur…', autocomplete: 'off', spellcheck: 'false' });
  q.addEventListener('input', () => { pk.query = q.value; pk.limit = 40; renderPickerList(); schedulePickerSims(); });
  const qual = selectEl(QUALITY_FILTER, pk.maxQuality, { id: 'picker-quality' });
  qual.addEventListener('change', () => { pk.maxQuality = Number(qual.value); renderPickerList(); schedulePickerSims(); });
  const lvl = h('input', { id: 'picker-level', type: 'checkbox' });
  lvl.checked = pk.myLevel;
  lvl.addEventListener('change', () => { pk.myLevel = lvl.checked; renderPickerList(); schedulePickerSims(); });

  const paste = h('textarea', { id: 'picker-tooltip', placeholder: 'Collez ici le tooltip de l’objet (Wowhead ou jeu, en anglais ou en français)…' });
  const msg = h('p', { class: 'hint', 'aria-live': 'polite' });

  dlg.replaceChildren(h('div', { class: 'picker' },
    h('header', { class: 'picker-head' },
      h('img', { class: 'picker-slot', src: slotIconSrc(pk.slotId), alt: '', width: 40, height: 40 }),
      h('div', { class: 'picker-title' },
        h('h2', { id: 'picker-title' }, slot.name),
        h('p', { class: 'hint' }, 'Touchez un objet pour l’équiper. Le gain est simulé sur votre profil.')),
      h('button', { type: 'button', class: 'btn small ghost picker-close', 'aria-label': 'Fermer', onclick: closePicker }, '✕')),
    cur ? h('div', { class: 'picker-current' },
      h('img', { class: `pick-icon ${qualityClass(cur)}`, src: itemIconSrc(cur, pk.slotId), alt: '', width: 32, height: 32 }),
      h('span', { class: 'pick-main' }, h('span', { class: 'hint' }, 'Équipé'), h('span', { class: `pick-name ${qualityClass(cur)}` }, cur.name)),
      h('button', { type: 'button', class: 'btn small', onclick: () => pickItem(null) }, 'Retirer')) : null,
    h('div', { class: 'picker-filters' },
      h('label', { class: 'field picker-search', for: 'picker-q' }, h('span', {}, 'Rechercher'), q),
      h('label', { class: 'field', for: 'picker-quality' }, h('span', {}, 'Qualité'), qual),
      h('label', { class: 'check', for: 'picker-level' }, lvl, h('span', {}, `Portable au niveau ${p.level}`))),
    h('div', { class: 'picker-status', id: 'picker-status', 'aria-live': 'polite' }),
    h('div', { class: 'picker-list', id: 'picker-list' }),
    h('details', { class: 'picker-add' },
      h('summary', {}, 'Objet absent de la base ? Collez son tooltip'),
      paste,
      h('div', { class: 'io-actions' }, h('button', { type: 'button', class: 'btn small primary', onclick: () => addFromTooltip(paste.value, msg) }, 'Ajouter et équiper')),
      msg)));
  dlg.setAttribute('aria-labelledby', 'picker-title');
  renderPickerList();
}

function pickerRow(p, pk, item, value, inBatch, snap, curId, factors) {
  const sim = pickerCache.get(`${snap}|${pk.slotId}|${item.id}`);
  const isCur = item.id === curId;
  let gain;
  if (isCur) gain = h('span', { class: 'chip fresh' }, 'Équipé');
  else if (sim) {
    const cls = sim.delta > sim.err ? 'pos' : sim.delta < -sim.err ? 'neg' : '';
    gain = [h('b', { class: `delta ${cls} num` }, fmtSigned(sim.delta, 2)), h('small', {}, `DPS ± ${fmt(sim.err, 2)}`)];
  } else if (inBatch) gain = h('small', { class: 'muted' }, 'calcul…');
  else gain = h('small', { class: 'muted', title: 'Estimation rapide par les poids des stats, en puissance d’attaque' }, `≈ ${fmtSigned(value, 0)} PA`);
  return h('button', { type: 'button', class: `pick${isCur ? ' current' : ''}`, onclick: () => pickItem(item) },
    h('img', { class: `pick-icon ${qualityClass(item)}`, src: itemIconSrc(item, pk.slotId), alt: '', width: 36, height: 36, loading: 'lazy' }),
    h('span', { class: 'pick-main' },
      h('span', { class: `pick-name ${qualityClass(item)}` }, item.name),
      h('span', { class: 'pick-meta' }, itemMeta(item)),
      h('span', { class: 'pick-stats' }, itemSummary(item, factors)),
      item.notes && item.notes.length ? h('span', { class: 'pick-notes' }, item.notes.join(' · ')) : null),
    h('span', { class: 'pick-gain' }, gain));
}

function renderPickerList() {
  const pk = state.picker;
  const box = $('picker-list');
  if (!pk || !box) return;
  const p = current();
  const snap = snapshotOf(p);
  const curId = p.equipment?.[pk.slotId] || null;
  const factors = ratingFactors(p);
  let rows = pickerCandidates(p, pk);
  // Une fois les simulations finies, les objets simulés passent en tête, du meilleur gain au moins bon.
  if (!pk.progress) {
    const simOf = (r) => (r.i.id === curId ? { delta: 0 } : pickerCache.get(`${snap}|${pk.slotId}|${r.i.id}`));
    const simulated = rows.slice(0, pk.simCount).filter(simOf).sort((a, b) => simOf(b).delta - simOf(a).delta);
    const done = new Set(simulated.map((r) => r.i.id));
    rows = [...simulated, ...rows.filter((r) => !done.has(r.i.id))];
  }
  const shown = rows.slice(0, pk.limit);
  box.replaceChildren(...[
    shown.length
      ? shown.map(({ i, v }, k) => pickerRow(p, pk, i, v, k < pk.simCount, snap, curId, factors))
      : h('p', { class: 'empty' }, 'Aucun objet ne correspond. Les noms sont en anglais, comme dans le client ; décochez « Portable » pour voir les objets de plus haut niveau.'),
    rows.length > pk.limit ? h('button', { type: 'button', class: 'btn small', onclick: () => { pk.limit += 40; renderPickerList(); } }, `Afficher 40 de plus (${rows.length - pk.limit} restants)`) : null,
  ].flat().filter(Boolean));
  renderPickerStatus(rows.length);
}

function renderPickerStatus(count) {
  const pk = state.picker;
  const box = $('picker-status');
  if (!pk || !box) return;
  const total = count ?? pickerCandidates(current(), pk).length;
  box.replaceChildren(...[
    h('span', {}, pk.progress
      ? `Simulation des gains : ${pk.progress.done} / ${pk.progress.total}…`
      : `${total.toLocaleString('fr-FR')} objet${total > 1 ? 's' : ''}. Gain en DPS simulé pour les ${Math.min(pk.simCount, total)} premiers (${PICKER_ITERATIONS.toLocaleString('fr-FR')} combats chacun, mêmes tirages) ; les autres : estimation en PA.`),
    !pk.progress && total > pk.simCount
      ? h('button', { type: 'button', class: 'btn small', onclick: () => { pk.simCount += PICKER_BATCH; renderPickerList(); runPickerSims(); } }, `Simuler les ${PICKER_BATCH} suivants`)
      : null,
  ].filter(Boolean));
}

function schedulePickerSims() {
  clearTimeout(pickerTimer);
  pickerTimer = setTimeout(runPickerSims, 350);
}

// Gain réel de DPS des premiers objets : même profil, même graine, seul l’emplacement change.
async function runPickerSims() {
  const pk = state.picker;
  if (!pk) return;
  const seq = ++pickerSeq;
  const p = current();
  const snap = snapshotOf(p);
  const curId = p.equipment?.[pk.slotId] || null;
  const todo = pickerCandidates(p, pk).slice(0, pk.simCount).map((x) => x.i)
    .filter((i) => i.id !== curId && !pickerCache.has(`${snap}|${pk.slotId}|${i.id}`));
  if (!todo.length) { pk.progress = null; renderPickerStatus(); return; }
  if (pickerCache.size > 3000) pickerCache.clear();
  pk.progress = { done: 0, total: todo.length };
  renderPickerStatus();
  let base = pickerBase.get(snap);
  if (!base) {
    base = (await simulateChunked(resolved(p), PICKER_ITERATIONS)).dps;
    if (seq !== pickerSeq) return;
    pickerBase.clear();
    pickerBase.set(snap, base);
  }
  for (const item of todo) {
    const variant = JSON.parse(JSON.stringify(p));
    equipItem(variant, state.items, pk.slotId, item.id);
    const s = await simulateChunked(resolveProfile(variant, state.items), PICKER_ITERATIONS);
    if (seq !== pickerSeq || state.picker !== pk) return;
    const d = pairedDiff(base, s.dps);
    pickerCache.set(`${snap}|${pk.slotId}|${item.id}`, { delta: d.mean, err: 1.96 * d.se });
    pk.progress.done++;
    renderPickerList();
  }
  pk.progress = null;
  renderPickerList();
}

// ----- Réglages du personnage (repliés sous la fiche) -----

function weaponBlock(title, key, p) {
  const w = p[key];
  const dps = ((Number(w.min) + Number(w.max)) / 2) / (Number(w.speed) || 1);
  const enchants = Object.fromEntries(Object.entries(ENCHANTS).filter(([k]) => k !== 'counterweight' || p.twoHand).map(([k, v]) => [k, v.name]));
  return h('div', { class: 'section' },
    h('div', { class: 'section-title' }, h('h3', {}, title), h('span', { class: 'hint num', id: `dps-${key}` }, `${fmt(dps)} DPS d’arme`)),
    h('div', { class: 'fields' },
      numField('Dégâts min', `${key}.min`, { min: 0, step: 1 }),
      numField('Dégâts max', `${key}.max`, { min: 0, step: 1 }),
      numField('Vitesse (s)', `${key}.speed`, { min: 0.5, step: 0.1 }),
      selectField('Type', `${key}.type`, WEAPON_TYPES),
      selectField('Enchantement', `${key}.enchant`, enchants)));
}

function deleteItems(ids) {
  const set = new Set(ids);
  state.items = state.items.filter((i) => !set.has(i.id));
  for (const p of state.profiles) {
    for (const [slot, itemId] of Object.entries(p.equipment || {})) if (set.has(itemId)) p.equipment[slot] = null;
  }
  state.confirmItemDelete = null;
  afterChange(true);
}

function myItems(p) {
  if (!state.items.length) return null;
  const equipped = new Set(Object.values(p.equipment || {}));
  const factors = ratingFactors(p);
  return section(`Mes objets ajoutés (${state.items.length})`, 'Ajoutés par tooltip, partagés entre vos profils',
    h('div', { class: 'library' }, state.items.map((it) => {
      const confirming = state.confirmItemDelete === it.id;
      return h('div', { class: `item-row${equipped.has(it.id) ? ' equipped' : ''}` },
        h('div', { class: 'item-main' },
          h('div', { class: 'item-title' }, h('span', { class: 'name' }, it.name), h('span', { class: 'tag' }, ITEM_TYPES[it.type]),
            equipped.has(it.id) ? h('span', { class: 'chip fresh' }, 'Équipé') : null),
          h('small', { class: 'muted' }, itemSummary(it, factors))),
        h('div', { class: 'slot-actions' },
          h('button', {
            class: `btn small ghost${confirming ? ' danger' : ''}`, type: 'button',
            onclick: () => { if (confirming) deleteItems([it.id]); else { state.confirmItemDelete = it.id; renderPanel(); } },
          }, confirming ? 'Confirmer' : 'Supprimer')));
    })));
}

function characterOptions(p) {
  const r = resolved(p);
  const eq = p.equipment || {};
  const mainItem = lookup(eq.mainHand);
  const weaponsFromItems = !!(mainItem && mainItem.weapon);

  const trinketTypes = { ap: 'Puissance d’attaque', haste: 'Hâte (%)', agi: 'Agilité', str: 'Force', crit: 'Critique (%)' };
  const trinketRows = [0, 1].map((i) => {
    const item = lookup(eq[`trinket${i + 1}`]);
    if (item) {
      return h('p', { class: 'hint' }, item.onUse && Number(item.onUse.value)
        ? `Bijou ${i + 1} : ${item.name}, ${itemSummary({ stats: {}, onUse: item.onUse })}.`
        : `Bijou ${i + 1} : ${item.name}, sans effet à activer simulé.`);
    }
    const tr = p.trinkets[i];
    const presets = Object.fromEntries(Object.entries(ON_USE_PRESETS).map(([k, v]) => [k, v.name]));
    return h('div', { class: 'fields' },
      selectField(`Bijou à activer ${i + 1}`, `trinkets.${i}.preset`, presets, { rerender: true }),
      tr.preset === 'custom' ? [
        selectField('Effet', `trinkets.${i}.type`, trinketTypes),
        numField('Valeur', `trinkets.${i}.value`, { step: 1 }),
        numField('Durée (s)', `trinkets.${i}.duration`, { min: 1, step: 1 }),
        numField('Recharge (s)', `trinkets.${i}.cd`, { min: 1, step: 1 }),
      ] : null);
  });

  const enchants = Object.fromEntries(Object.entries(ENCHANTS).filter(([k]) => k !== 'counterweight' || r.twoHand).map(([k, v]) => [k, v.name]));
  const twoHandToggle = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Style d’arme' },
    h('button', { type: 'button', 'aria-pressed': p.twoHand ? 'true' : 'false', onclick: () => { p.twoHand = true; afterChange(true); } }, 'Arme à deux mains'),
    h('button', { type: 'button', 'aria-pressed': p.twoHand ? 'false' : 'true', onclick: () => { p.twoHand = false; afterChange(true); } }, 'Ambidextrie'));
  const sample = SAMPLE_WEAPONS[p.level];
  const loadSample = () => {
    if (p.twoHand) Object.assign(p.mh, { min: sample.twoHand.min, max: sample.twoHand.max, speed: sample.twoHand.speed, type: sample.twoHand.type });
    else {
      Object.assign(p.mh, { min: sample.mh.min, max: sample.mh.max, speed: sample.mh.speed, type: sample.mh.type });
      Object.assign(p.oh, { min: sample.oh.min, max: sample.oh.max, speed: sample.oh.speed, type: sample.oh.type });
    }
    afterChange(true);
  };

  const details = h('details', { class: 'more', id: 'char-options' },
    h('summary', {}, 'Réglages du personnage : aspect, enchantements, bonus, bijoux, familier'),
    h('div', { class: 'section-stack' },
      section('Profil', null,
        h('div', { class: 'fields' },
          textField('Nom du profil', 'name'),
          selectField('Aspect', 'aspect', { beast: 'Aspect of the Beast', monkey: 'Aspect du singe', hawk: 'Aspect du faucon', none: 'Aucun' })),
        h('div', { class: 'fields' },
          checkField('Hunter’s Mark sur la cible', 'huntersMark'),
          checkField('Utiliser le racial offensif', 'racial'))),
      weaponsFromItems
        ? section('Enchantements d’arme', null,
          h('div', { class: 'fields' },
            selectField(r.twoHand ? 'Enchantement' : 'Enchantement main droite', 'mh.enchant', enchants),
            r.oh ? selectField('Enchantement main gauche', 'oh.enchant', enchants) : null))
        : [
          h('div', { class: 'section' },
            h('div', { class: 'section-title' }, h('h3', {}, 'Armes sans objet'), twoHandToggle),
            h('p', { class: 'hint' }, 'Utilisées tant qu’aucune arme n’est équipée dans la fiche.'),
            h('div', { class: 'io-actions' },
              h('button', { class: 'btn small', type: 'button', onclick: loadSample }, p.twoHand ? 'Charger l’arme d’exemple' : 'Charger les armes d’exemple'),
              h('span', { class: 'hint' }, p.twoHand ? sample.twoHand.name : `${sample.mh.name} et ${sample.oh.name}`))),
          weaponBlock(p.twoHand ? 'Arme à deux mains' : 'Main droite', 'mh', p),
          p.twoHand ? null : weaponBlock('Main gauche', 'oh', p),
        ],
      section('Bonus manuels', 'S’ajoutent aux objets : enchantements d’armure, ou vos totaux si vous ne remplissez pas la fiche.',
        h('div', { class: 'fields' },
          numField('Force', 'gear.str', { step: 1 }),
          numField('Agilité', 'gear.agi', { step: 1 }),
          numField('Endurance', 'gear.sta', { step: 1 }),
          numField('Intelligence', 'gear.int', { step: 1 }),
          numField('Esprit', 'gear.spi', { step: 1 }),
          numField('Puissance d’attaque', 'gear.ap', { step: 1 }),
          numField('Toucher (%)', 'gear.hit', { step: 0.5 }),
          numField('Critique (%)', 'gear.crit', { step: 0.5 }),
          numField('Hâte de mêlée (%)', 'gear.haste', { step: 0.5 }),
          numField('Mana toutes les 5 s', 'gear.mp5', { step: 1 }),
          numField('Compétence d’arme (+)', 'gear.skill', { step: 1 }),
          numField('Réduction esquive/parade (%)', 'gear.expertise', { step: 0.5 }))),
      section('Bijoux à activer et procs', null,
        trinketRows,
        h('div', { class: 'fields' }, numField('Attaque suppl. (% par coup)', 'extraAttackChance', { min: 0, step: 0.5 })),
        h('p', { class: 'hint' }, 'Bijoux utilisés dès que possible. Attaque supplémentaire : chance par coup qui touche, par exemple 2 % pour la Main de justice.')),
      section('Familier et modificateurs', 'Le familier est un DPS fixe : ses stats Forever ne sont pas encore connues.',
        h('div', { class: 'fields' },
          checkField('Familier actif', 'pet.enabled'),
          numField('DPS du familier', 'pet.dps', { min: 0, step: 5 }),
          numField('Dégâts en plus (%)', 'custom.dmgPct', { step: 1 }),
          numField('Crit en plus (%)', 'custom.crit', { step: 0.5 }),
          numField('PA en plus', 'custom.ap', { step: 5 }))),
      myItems(p)));
  details.open = state.optionsOpen;
  details.addEventListener('toggle', () => { state.optionsOpen = details.open; });
  return details;
}

// ----- Talents -----

function talentCalcFor(p) {
  const opts = {
    talents: p.talents,
    level: p.level,
    focus: state.talentFocus,
    tree: state.talentTree,
    onChange: (id, d) => {
      state.talentFocus = id;
      const blocked = d > 0 ? addBlocker(p.talents, id, p.level) : removeBlocker(p.talents, id);
      if (!blocked) {
        p.talents[id] = (Number(p.talents[id]) || 0) + d;
        afterChange(false);
      }
      refreshTalents(id);
    },
    // Survol ou focus : seule la fiche du talent change, pas l’arbre.
    onFocus: (id) => {
      if (state.talentFocus === id) return;
      state.talentFocus = id;
      opts.focus = id;
      $('tc-info')?.replaceWith(talentInfo(opts));
      for (const el of document.querySelectorAll('.tal.focus')) el.classList.remove('focus');
      document.querySelector(`.tal[data-talent="${id}"]`)?.classList.add('focus');
    },
    onTree: (id) => { state.talentTree = id; save(); refreshTalents(); },
    onPreset: () => { p.talents = { ...TALENT_PRESETS[p.level] }; afterChange(false); refreshTalents(); },
    onReset: () => { p.talents = fullBuild({}); afterChange(false); refreshTalents(); },
  };
  return talentCalculator(opts);
}

// Redessine le calculateur en gardant le focus clavier sur le talent touché.
function refreshTalents(focusId = null) {
  const box = $('talent-calc');
  if (!box) return;
  box.replaceChildren(talentCalcFor(current()));
  if (focusId) box.querySelector(`[data-talent="${focusId}"]`)?.focus({ preventScroll: true });
}

function panelTalents(p) {
  return h('div', { id: 'talent-calc' }, talentCalcFor(p));
}

// ----- Combat, buffs, rotation, hypothèses -----

function panelBuffs(p) {
  const cats = [...new Set(BUFFS.map((b) => b.cat))];
  const notes = {
    'Raid': 'Valeurs de Classic au niveau choisi.',
    'Consommables': 'Un seul effet par famille (élixir d’agilité, de force, nourriture…).',
    'Buffs de monde': 'Présence dans Forever non confirmée.',
    'Débuffs': 'Réduisent l’armure du boss.',
  };
  return cats.map((cat) => section(cat, notes[cat],
    h('div', { class: 'buff-grid' }, BUFFS.filter((b) => b.cat === cat).map((b) => {
      const id = `buff-${b.id}`;
      const input = h('input', { id, type: 'checkbox' });
      input.checked = p.buffs.includes(b.id);
      input.addEventListener('change', () => {
        let list = p.buffs.filter((x) => x !== b.id);
        if (input.checked) {
          if (b.group) list = list.filter((x) => BUFFS.find((y) => y.id === x)?.group !== b.group);
          list.push(b.id);
        }
        p.buffs = list;
        afterChange(true);
      });
      return h('label', { class: 'check', for: id }, input, h('span', {}, b.name));
    }))));
}

function panelRotation(p) {
  const M = p.mechanics;
  const modeLabel = MECHANICS.find((m) => m.key === 'raptorMode').options[M.raptorMode];
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= p.rotation.length) return;
    [p.rotation[i], p.rotation[j]] = [p.rotation[j], p.rotation[i]];
    afterChange(true);
  };
  const rows = p.rotation.map((r, i) => {
    const def = ROTATION_ABILITIES[r.id];
    const cb = h('input', { type: 'checkbox', id: `rot-${r.id}`, 'data-path': `rotation.${i}.enabled`, 'data-rerender': '1', 'aria-label': `Activer ${def.name}` });
    cb.checked = r.enabled;
    let note = def.desc;
    if (r.id === 'striderKick' && !p.talents.striderKick) note = 'Talent non pris : ignoré.';
    if (r.id === 'counterattack' && (!p.talents.counterattack || !p.fight.beingAttacked)) note = 'Ignoré tant que vous n’êtes pas attaqué (onglet Combat) ou sans le talent.';
    if (r.id === 'raptor') note = `${def.desc} Mode : ${modeLabel}.`;
    return h('div', { class: `rot-row${r.enabled ? '' : ' disabled'}` },
      h('span', { class: 'rank' }, String(i + 1)),
      cb,
      h('label', { class: 'rot-name', for: `rot-${r.id}` }, castChip(r.id, def.name), h('small', { class: 'muted' }, note)),
      h('label', { class: 'mana', for: `rot-mana-${r.id}` }, 'Mana min.',
        h('input', { id: `rot-mana-${r.id}`, type: 'number', min: 0, max: 100, step: 5, value: r.minMana, 'data-path': `rotation.${i}.minMana`, 'data-kind': 'num' }), '%'),
      h('div', { class: 'moves' },
        h('button', { class: 'btn small', type: 'button', 'aria-label': `Monter ${def.name}`, disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
        h('button', { class: 'btn small', type: 'button', 'aria-label': `Descendre ${def.name}`, disabled: i === p.rotation.length - 1, onclick: () => move(i, 1) }, '↓')));
  });
  return h('div', { class: 'section-stack' },
    section('Priorités', 'À chaque fin de GCD, le sim lance la première technique disponible de la liste.',
      h('div', { class: 'rotation' }, rows),
      h('p', { class: 'hint' }, 'Le seuil « Mana min. » garde du mana pour les techniques placées plus haut. Les recharges (racial, bijoux) et les potions sont utilisées dès que possible. Le résultat est visible dans l’onglet « Cycle de sorts ».'),
      h('div', { class: 'io-actions' },
        h('button', { class: 'btn small', type: 'button', onclick: () => { state.resultsTab = 'cycle'; save(); renderResults(); $('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 'Voir le cycle obtenu'),
        h('button', { class: 'btn small', type: 'button', onclick: () => { state.tab = 'hypo'; save(); renderTabs(); renderPanel(); } }, 'Changer le mode de Raptor Strike'))));
}

function panelCombat(p) {
  return h('div', { class: 'section-stack' },
    section('Rencontre', 'Le type de la cible compte pour Improved Tracking et pour les objets « PA contre… ».',
      h('div', { class: 'fields' },
        numField('Durée (s)', 'fight.duration', { min: 10, step: 10 }),
        numField('Variation de durée (±%)', 'fight.variance', { min: 0, max: 50, step: 5 }),
        numField('Niveau du boss', 'fight.bossLevel', { min: 1, step: 1 }),
        numField('Armure du boss', 'fight.bossArmor', { min: 0, step: 50 })),
      h('div', { class: 'fields' },
        checkField('Dans le dos du boss (pas de parade)', 'fight.behind'),
        selectField('Type de créature de la cible', 'fight.creatureType', CREATURE_TYPES),
        checkField('Vous êtes attaqué (solo, tank)', 'fight.beingAttacked', { rerender: true }))),
    p.fight.beingAttacked ? section('Attaques subies', 'Vos esquives activent Mongoose Bite, vos parades Counterattack.',
      h('div', { class: 'fields' },
        numField('Vitesse du boss (s)', 'fight.bossSwing', { min: 0.5, step: 0.1 }),
        numField('Votre esquive (%)', 'fight.playerDodge', { min: 0, step: 0.5 }),
        numField('Votre parade (%)', 'fight.playerParry', { min: 0, step: 0.5 }))) : null,
    panelBuffs(p));
}

function panelHypo(p) {
  const groups = [...new Set(MECHANICS.map((m) => m.group))];
  const resetAll = () => {
    for (const def of MECHANICS) p.mechanics[def.key] = mechanicDefault(def, p.level);
    afterChange(true);
  };
  const changed = MECHANICS.filter((def) => p.mechanics[def.key] !== mechanicDefault(def, p.level)).length;
  return h('div', { class: 'section-stack' },
    section('Hypothèses Forever', null,
      h('p', { class: 'hint' }, 'Toutes les valeurs incertaines de la bêta sont ici. Corrigez-les dès qu’un tooltip change : chaque profil garde ses propres hypothèses.'),
      h('div', { class: 'io-actions' },
        h('button', { class: 'btn small', type: 'button', disabled: changed === 0, onclick: resetAll }, `Tout réinitialiser${changed ? ` (${changed} modifiée${changed > 1 ? 's' : ''})` : ''}`))),
    groups.map((g) => section(g, null, h('div', { class: 'mech-group' }, MECHANICS.filter((m) => m.group === g).map((def) => mechRow(def, p))))));
}

function mechRow(def, p) {
  const value = p.mechanics[def.key];
  const dflt = mechanicDefault(def, p.level);
  const id = fieldId(`mechanics.${def.key}`);
  let control;
  if (typeof dflt === 'boolean') {
    control = h('input', { id, type: 'checkbox', 'data-path': `mechanics.${def.key}`, 'data-rerender': '1' });
    control.checked = !!value;
  } else if (def.options) {
    control = selectEl(def.options, value, { id, 'data-path': `mechanics.${def.key}`, 'data-kind': 'str', 'data-rerender': '1' });
  } else {
    control = h('input', { id, type: 'number', step: def.step ?? 'any', value, 'data-path': `mechanics.${def.key}`, 'data-kind': 'num' });
  }
  const isChanged = value !== dflt;
  const dfltText = typeof dflt === 'boolean' ? (dflt ? 'oui' : 'non') : def.options ? def.options[dflt] : fmt(dflt, Number.isInteger(dflt) ? 0 : 2);
  return h('div', { class: `mech${isChanged ? ' changed' : ''}`, id: `mech-${def.key}` },
    h('label', { class: 'label', for: id }, def.label),
    h('div', { class: 'meta' },
      chip(def.conf),
      h('span', {}, `Défaut : ${dfltText}`),
      def.note ? h('span', {}, def.note) : null,
      (def.src || []).map((s) => (SOURCES[s] ? h('a', { href: SOURCES[s].url, target: '_blank', rel: 'noopener' }, SOURCES[s].label.split(' — ')[0]) : null)),
      isChanged ? h('button', { class: 'btn small ghost', type: 'button', onclick: () => { p.mechanics[def.key] = dflt; afterChange(true); } }, 'Réinitialiser') : null),
    h('div', { class: 'control' }, control));
}

// ---------- liaison des champs ----------

function readValue(el) {
  if (el.type === 'checkbox') return { ok: true, v: el.checked };
  if (el.dataset.kind === 'num') {
    if (el.value === '') return { ok: false };
    const v = Number(el.value);
    return { ok: Number.isFinite(v), v };
  }
  return { ok: true, v: el.value };
}

function onFieldEvent(e) {
  const el = e.target;
  const path = el?.dataset?.path;
  if (!path) return;
  const isText = el.type === 'number' || el.type === 'text';
  if (e.type === 'input' && !isText) return;
  if (e.type === 'change' && isText) return;
  const { ok, v } = readValue(el);
  if (!ok) return;

  setPath(current(), path, v);
  if (path === 'name') {
    const opt = $('profileSelect')?.selectedOptions?.[0];
    if (opt) opt.textContent = `${v} (niv. ${current().level})`;
  }
  if (path.startsWith('mh.') || path.startsWith('oh.')) {
    const key = path.split('.')[0];
    const w = current()[key];
    const out = $(`dps-${key}`);
    if (out) out.textContent = `${fmt(((Number(w.min) + Number(w.max)) / 2) / (Number(w.speed) || 1))} DPS d’arme`;
  }
  if (path.startsWith('mechanics.')) {
    const key = path.slice('mechanics.'.length);
    const def = MECHANICS.find((m) => m.key === key);
    const row = $(`mech-${key}`);
    if (def && row && el.dataset.rerender !== '1') row.classList.toggle('changed', v !== mechanicDefault(def, current().level));
  }
  afterChange(el.dataset.rerender === '1');
}

function afterChange(rerender = false) {
  state.confirmDelete = false;
  save();
  renderSheet();
  renderStatus();
  if (rerender) renderPanel();
  scheduleRun();
}

// Relance la simulation peu après chaque changement (une seule fois pour une rafale de clics).
let runTimer = null;
function scheduleRun(delay = 700) {
  clearTimeout(runTimer);
  runTimer = setTimeout(() => {
    if (state.running) { state.rerun = true; return; }
    if (isStale(state.results[current().id])) runMain();
  }, delay);
}

// ---------- calculs ----------

function isStale(stored) {
  return !stored || stored.snapshot !== snapshotOf();
}

function renderStatus() {
  const el = $('runStatus');
  if (!el) return;
  const res = state.results[current().id];
  el.replaceChildren(!res ? h('span', { class: 'chip stale' }, 'Pas encore simulé')
    : isStale(res) ? h('span', { class: 'chip stale' }, 'Profil modifié depuis le calcul')
      : h('span', { class: 'chip fresh' }, 'À jour'));
}

async function simulateChunked(profile, iterations, onProgress) {
  const C = buildCharacter(profile);
  const acc = createAccumulator();
  const chunk = 200;
  for (let i = 0; i < iterations; i += chunk) {
    simulateBatch(C, profile, acc, i, Math.min(chunk, iterations - i), SEED);
    if (onProgress) onProgress(Math.min(1, (i + chunk) / iterations));
    await tick();
  }
  return summarize(C, acc);
}

function setProgress(frac) {
  const bar = $('progress-bar');
  if (bar) bar.style.width = `${Math.round(frac * 100)}%`;
}

async function guarded(kind, fn) {
  if (state.running) return;
  state.running = kind;
  renderResults();
  try {
    await fn();
  } finally {
    state.running = null;
    renderResults();
    if (state.rerun) {
      state.rerun = false;
      scheduleRun(100);
    }
  }
}

function runMain() {
  return guarded('main', async () => {
    const p = current();
    const summary = await simulateChunked(resolved(p), state.iterations, setProgress);
    state.results[p.id] = { summary, snapshot: snapshotOf(p) };
  });
}

function runWeights() {
  return guarded('weights', async () => {
    const p = current();
    const variants = profileVariants(resolved(p));
    const n = Math.min(state.iterations, 3000);
    const runs = {};
    for (let k = 0; k < variants.length; k++) {
      const s = await simulateChunked(variants[k].profile, n, (f) => setProgress((k + f) / variants.length));
      runs[variants[k].key] = s.dps;
    }
    state.weights[p.id] = { rows: statWeightsFromRuns(runs), snapshot: snapshotOf(p), iterations: n };
  });
}

function runCompareAll() {
  return guarded('compareAll', async () => {
    const n = Math.min(state.iterations, 3000);
    const rows = [];
    for (let k = 0; k < state.profiles.length; k++) {
      const p = state.profiles[k];
      const s = await simulateChunked(resolved(p), n, (f) => setProgress((k + f) / state.profiles.length));
      rows.push({ id: p.id, name: p.name, level: p.level, mean: s.mean, se: s.se, oomPct: s.oomPct });
    }
    state.compareAll = { rows, iterations: n };
  });
}

function runDuel() {
  return guarded('duel', async () => {
    const [aId, bId] = duelIds();
    const A = state.profiles.find((x) => x.id === aId);
    const B = state.profiles.find((x) => x.id === bId);
    const n = Math.min(state.iterations, 3000);
    const sa = await simulateChunked(resolved(A), n, (f) => setProgress(f / 2));
    const sb = await simulateChunked(resolved(B), n, (f) => setProgress(0.5 + f / 2));
    state.duel = {
      iterations: n,
      a: { id: A.id, name: A.name, s: sa, sheet: characterSheet(resolved(A)), r: resolved(A) },
      b: { id: B.id, name: B.name, s: sb, sheet: characterSheet(resolved(B)), r: resolved(B) },
    };
  });
}

function duelIds() {
  let [a, b] = state.duelIds;
  const ids = state.profiles.map((p) => p.id);
  if (!ids.includes(a)) a = current().id;
  if (!ids.includes(b) || b === a) b = ids.find((id) => id !== a) || a;
  state.duelIds = [a, b];
  return [a, b];
}

function traceFor(p) {
  const snap = snapshotOf(p);
  const stored = state.traces[p.id];
  if (stored && stored.snapshot === snap && stored.seed === state.traceSeed) return stored.trace;
  const r = resolved(p);
  const seconds = Math.min(300, Math.max(30, Number(r.fight.duration) || 180));
  const trace = combatTrace(r, { seed: state.traceSeed, seconds });
  state.traces[p.id] = { trace, snapshot: snap, seed: state.traceSeed };
  return trace;
}

// ---------- textes des événements ----------

function describeEvent(e) {
  const at = `à ${fmt(e.t, 2)} s`;
  const mana = Number.isFinite(e.mana) ? ` · mana ${fmt0(e.mana)}` : '';
  if (e.kind === 'cast') {
    const res = e.outcome === 'placed' ? 'posé' : e.dmg > 0 ? `${fmt0(e.dmg)} dégâts${e.outcome === 'crit' ? ' (critique)' : ''}` : OUTCOME[e.outcome] || e.outcome;
    return { title: `${label(e.id)} : ${res}`, text: `${at} · coût ${fmt0(e.cost)}${mana}` };
  }
  if (e.kind === 'swing') {
    const who = e.id === 'oh' ? 'Main gauche' : e.id === 'extra' ? 'Attaque supplémentaire' : 'Main droite';
    const res = e.dmg > 0 ? `${fmt0(e.dmg)}${e.outcome === 'crit' ? ' (critique)' : e.outcome === 'glance' ? ' (érafle)' : ''}` : OUTCOME[e.outcome] || e.outcome;
    return { title: `${who} : ${res}`, text: at };
  }
  if (e.kind === 'tick') return { title: `${label(e.id)} : ${fmt0(e.dmg)}${e.outcome === 'crit' ? ' (critique)' : ''}`, text: at };
  if (e.kind === 'cooldown') return { title: `Utilise ${e.name}`, text: at };
  if (e.kind === 'proc') {
    const texts = {
      exposePrey: 'Expose Prey : Mongoose Bite disponible',
      dodge: 'Vous esquivez : Mongoose Bite disponible',
      parry: 'Vous parez : Counterattack disponible',
    };
    return { title: texts[e.id] || label(e.id), text: at };
  }
  return { title: label(e.id), text: at };
}

// ---------- résultats ----------

function resultPanel(title, hint, ...content) {
  return h('section', { class: 'panel' },
    h('div', { class: 'panel-head' }, h('h2', {}, title), hint ? h('span', { class: 'hint' }, hint) : null),
    content);
}

function stat(k, v) {
  return h('div', { class: 'stat' }, h('span', { class: 'k' }, k), h('span', { class: 'v' }, v));
}

function staleChip(stored) {
  return stored && isStale(stored) ? h('span', { class: 'chip stale' }, 'Profil modifié depuis le calcul') : null;
}

function renderResults() {
  const box = $('results');
  const p = current();
  const res = state.results[p.id];
  const s = res?.summary;
  const busy = !!state.running;

  const itSel = selectEl({ 500: '500', 1000: '1 000', 2000: '2 000', 5000: '5 000', 10000: '10 000' }, state.iterations, { id: 'iterations' });
  itSel.addEventListener('change', () => { state.iterations = Number(itSel.value); save(); });
  const runningLabel = { main: 'Simulation', weights: 'Poids des stats', compareAll: 'Classement des profils', items: 'Comparaison d’objets', duel: 'Comparaison A / B' }[state.running];

  const main = resultPanel('Simulation', null,
    h('div', { class: 'runbar' },
      h('button', { class: 'btn primary', type: 'button', disabled: busy, onclick: runMain }, state.running === 'main' ? 'Calcul…' : 'Lancer la simulation'),
      h('label', { for: 'iterations' }, 'Combats', itSel),
      h('span', { id: 'runStatus' })),
    busy ? h('div', { class: 'progress-wrap' },
      h('span', { class: 'hint' }, `${runningLabel} en cours…`),
      h('div', { class: 'progress', 'aria-hidden': 'true' }, h('i', { id: 'progress-bar' }))) : null,
    s ? [
      h('div', { class: 'hero' },
        h('span', { class: 'big' }, fmt(s.mean)),
        h('span', { class: 'unit' }, 'DPS moyen'),
        h('span', { class: 'ci' }, `± ${fmt(1.96 * s.se)} (IC 95 %) · ${s.iterations.toLocaleString('fr-FR')} combats de ${fmt0(s.avgDuration)} s`)),
      h('div', { class: 'stats' },
        stat('Écart-type', `${fmt(s.sd)} DPS`),
        stat('5e – 95e centile', `${fmt0(s.p5)} – ${fmt0(s.p95)}`),
        stat('Temps à sec de mana', `${fmt(s.oomPct)} %`),
        stat('GCD occupé', `${fmt0(s.cycle.gcdUsage)} %`),
        stat('Mongoose Bite', `${fmt(s.cycle.mb.used)} / combat`),
        stat('Potions et runes', `${fmt(s.procs.potions || 0)} / combat`)),
    ] : h('p', { class: 'empty' }, 'Lancez la simulation pour obtenir le DPS moyen, la répartition des dégâts et le cycle de sorts.'),
  );

  const nav = h('div', { class: 'results-tabs', role: 'tablist', 'aria-label': 'Résultats' }, RESULT_TABS.map(([key, text]) => h('button', {
    class: 'tab', type: 'button', role: 'tab', 'aria-selected': state.resultsTab === key ? 'true' : 'false',
    onclick: () => { state.resultsTab = key; save(); renderResults(); },
  }, text)));

  const content = {
    summary: resultsSummary,
    cycle: resultsCycle,
    compare: resultsCompare,
    weights: resultsWeights,
  }[state.resultsTab](p, s, busy);

  box.replaceChildren(main, nav, ...[content].flat().filter(Boolean));
  renderStatus();
}

function resultsSummary(p, s) {
  if (!s) return h('p', { class: 'empty panel' }, 'Pas encore de résultats.');
  const table = h('div', { class: 'table-wrap' }, h('table', {},
    h('thead', {}, h('tr', {}, ['Technique', 'DPS', 'Part', 'Par combat', 'Moyenne', 'Crit', 'Raté', 'Esquivé', 'Érafle'].map((t, i) => h('th', { class: i ? 'num' : '' }, t)))),
    h('tbody', {}, s.breakdown.map((b) => h('tr', {},
      h('td', {}, b.name),
      h('td', { class: 'num' }, fmt(b.dps)),
      h('td', { class: 'num' }, `${fmt(b.share)} %`),
      h('td', { class: 'num' }, b.id === 'pet' ? '—' : b.casts ? fmt(b.casts) : `${fmt(b.ticks)} tics`),
      h('td', { class: 'num' }, b.avgHit ? fmt0(b.avgHit) : '—'),
      h('td', { class: 'num' }, `${fmt(b.critPct)} %`),
      h('td', { class: 'num' }, `${fmt(b.missPct)} %`),
      h('td', { class: 'num' }, `${fmt(b.dodgePct)} %`),
      h('td', { class: 'num' }, `${fmt(b.glancePct)} %`))))));
  return [
    resultPanel('Répartition des dégâts', 'DPS par source',
      barChart(s.breakdown.map((b) => ({
        label: b.name, value: b.dps, valueText: `${fmt(b.dps)} · ${fmt0(b.share)} %`,
        tipTitle: `${fmt(b.dps)} DPS`,
        tip: `${b.name}\n${b.casts ? `${fmt(b.casts)} par combat · ` : ''}crit ${fmt(b.critPct)} %`,
      }))),
      h('details', {}, h('summary', {}, 'Détail par technique (tableau)'), table)),
    resultPanel('Distribution du DPS', `${s.iterations.toLocaleString('fr-FR')} combats`,
      histogram(s.dps, s.mean),
      h('p', { class: 'hint' }, 'Part des combats par tranche de DPS. L’écart vient des crits, des procs et de la durée variable des combats.')),
  ];
}

function resultsCycle(p, s) {
  const trace = traceFor(p);
  const span = Math.min(WINDOW, trace.duration);
  const maxFrom = Math.max(0, trace.duration - span);
  state.cycleFrom = Math.min(Math.max(0, state.cycleFrom), maxFrom);
  const from = state.cycleFrom;
  const to = from + span;
  const castIds = [...new Set(trace.events.filter((e) => e.kind === 'cast').map((e) => e.id))];
  const go = (d) => { state.cycleFrom = Math.min(maxFrom, Math.max(0, from + d)); renderResults(); };

  const windowEvents = trace.events.filter((e) => e.kind !== 'regen' && e.t >= from && e.t < to);
  const gcdCasts = trace.events.filter((e) => e.kind === 'cast' && e.gcd && e.t >= from && e.t < to);
  const sequence = gcdCasts.map((e) => (CAST_STYLE[e.id] ? CAST_STYLE[e.id].abbr : '?'));

  const timeline = resultPanel('Chronologie d’un combat', `${fmt0(from)} – ${fmt0(to)} s sur ${fmt0(trace.duration)} s`,
    h('div', { class: 'runbar' },
      h('button', { class: 'btn small', type: 'button', disabled: from <= 0, onclick: () => go(-span) }, `← ${fmt0(span)} s`),
      h('button', { class: 'btn small', type: 'button', disabled: from >= maxFrom, onclick: () => go(span) }, `${fmt0(span)} s →`),
      h('button', { class: 'btn small', type: 'button', onclick: () => { state.traceSeed++; state.cycleFrom = 0; renderResults(); } }, 'Autre combat'),
      h('span', { class: 'hint' }, `combat n° ${state.traceSeed}`)),
    h('div', { class: 'legend-row' },
      castIds.map((id) => castChip(id, label(id))),
      h('span', { class: 'hint' }, 'Trait au-dessus : coup critique. Contour seul : raté ou esquivé.')),
    h('div', { class: 'timeline' },
      timelineChart(trace, { from, to, describe: describeEvent }),
      manaChart(trace, { from, to })),
    h('p', { class: 'hint' }, sequence.length ? `Ordre des GCD : ${sequence.join(' · ')}` : 'Aucune technique sur cette période.'));

  const panels = [timeline];

  if (s) {
    const c = s.cycle;
    const gcd = Number(p.mechanics.gcd) || 1.5;
    const perAbility = h('div', { class: 'table-wrap' }, h('table', {},
      h('thead', {}, h('tr', {}, ['Technique', 'Par minute', 'Intervalle moyen', 'Part du temps de GCD'].map((t, i) => h('th', { class: i ? 'num' : '' }, t)))),
      h('tbody', {}, c.perMinute.map((x) => h('tr', {},
        h('td', {}, castChip(x.id, x.name)),
        h('td', { class: 'num' }, fmt(x.perMinute)),
        h('td', { class: 'num' }, `${fmt(60 / x.perMinute)} s`),
        h('td', { class: 'num' }, `${fmt((x.perMinute * gcd) / 60 * 100)} %`))))));
    panels.push(resultPanel('Le cycle en chiffres', `Moyenne sur ${s.iterations.toLocaleString('fr-FR')} combats`,
      staleChip(state.results[p.id]),
      h('div', { class: 'stats' },
        stat('GCD occupé', `${fmt0(c.gcdUsage)} %`),
        stat('Fenêtres Mongoose', `${fmt(c.mb.opened)} / combat`),
        stat('Fenêtres utilisées', `${fmt0(c.mb.usedPct)} %`),
        stat('Délai avant la Morsure', `${fmt(c.mb.avgDelay, 2)} s`),
        stat('Fenêtres perdues', `${fmt(c.mb.wasted)} / combat`),
        stat('Temps à sec de mana', `${fmt(s.oomPct)} %`)),
      perAbility,
      c.uptime.length ? [
        h('h3', {}, 'Temps actif des effets'),
        barChart(c.uptime.map((u) => ({ label: u.name, value: u.pct, valueText: `${fmt0(u.pct)} %`, tipTitle: `${fmt(u.pct)} % du combat`, tip: u.name }))),
      ] : null,
      h('p', { class: 'hint' }, `Un GCD occupé à ${fmt0(c.gcdUsage)} % veut dire que ${fmt0(100 - c.gcdUsage)} % du temps, aucune technique n’est prête : les recharges limitent le cycle plus que le GCD.`)));

    const seqMax = Math.max(...c.sequences.map((q) => q.pct), 1);
    panels.push(resultPanel('Séquences les plus fréquentes', 'Enchaînements de 3 techniques',
      h('div', { class: 'sequences' }, c.sequences.map((q) => h('div', { class: 'seq-row', tabindex: '0', 'data-tip-title': `${fmt(q.pct)} % des enchaînements`, 'data-tip': `${fmt(q.perFight)} fois par combat` },
        h('span', { class: 'seq-chips' }, q.ids.map((id, i) => [i ? h('span', { class: 'arrow', 'aria-hidden': 'true' }, '→') : null, castChip(id, CAST_STYLE[id] ? label(id) : id)])),
        h('span', { class: 'bar-track' }, h('span', { class: 'bar-fill', style: `--ratio:${(q.pct / seqMax).toFixed(4)}` }), h('span', { class: 'bar-value' }, `${fmt0(q.pct)} %`))))),
      h('p', { class: 'hint' }, 'Le sim suit la liste de priorités de l’onglet Rotation : ces séquences en sont le résultat, pas une consigne.')));
  } else {
    panels.push(h('p', { class: 'empty panel' }, 'Lancez la simulation pour obtenir les statistiques du cycle sur des milliers de combats.'));
  }

  panels.push(resultPanel('Journal', `${fmt0(from)} – ${fmt0(to)} s`,
    h('div', { class: 'log', role: 'log' },
      h('div', { class: 'log-row' }, h('span', { class: 't' }, 'Temps'), h('span', { class: 'm' }, 'Mana'), h('span', { class: 'txt muted' }, 'Événement')),
      windowEvents.map((e) => {
        const d = describeEvent(e);
        const cls = e.kind === 'cast' || e.kind === 'cooldown' ? ' cast' : e.kind === 'proc' ? ' proc' : '';
        return h('div', { class: `log-row${cls}` },
          h('span', { class: 't' }, `${fmt(e.t, 2)} s`),
          h('span', { class: 'm' }, fmt0(e.mana)),
          h('span', { class: 'txt' }, e.kind === 'cast' ? castChip(e.id, d.title) : d.title));
      }))));
  return panels;
}

function deltaNode(v, d = 1, suffix = '') {
  const cls = v > 0.0001 ? 'delta pos' : v < -0.0001 ? 'delta neg' : 'delta';
  const arrow = v > 0.0001 ? '▲ ' : v < -0.0001 ? '▼ ' : '';
  return h('span', { class: cls }, `${arrow}${fmtSigned(v, d)}${suffix}`);
}

function resultsCompare(p, s, busy) {
  const panels = [
    h('p', { class: 'hint panel' }, 'Pour comparer des objets, touchez un emplacement de la fiche (onglet Personnage) : le gain de chaque objet y est simulé.'),
  ];

  const [aId, bId] = duelIds();
  const opts = Object.fromEntries(state.profiles.map((x) => [x.id, `${x.name} (niv. ${x.level})`]));
  const aSel = selectEl(opts, aId, { id: 'duel-a', 'aria-label': 'Profil A' });
  const bSel = selectEl(opts, bId, { id: 'duel-b', 'aria-label': 'Profil B' });
  aSel.addEventListener('change', () => { state.duelIds = [aSel.value, bSel.value]; });
  bSel.addEventListener('change', () => { state.duelIds = [aSel.value, bSel.value]; });
  panels.push(resultPanel('Comparer deux profils', 'A contre B, côte à côte',
    h('div', { class: 'duel-pick' },
      h('label', { class: 'field', for: 'duel-a' }, h('span', {}, 'Profil A'), aSel),
      h('label', { class: 'field', for: 'duel-b' }, h('span', {}, 'Profil B'), bSel),
      h('button', { class: 'btn', type: 'button', disabled: busy || state.profiles.length < 2, onclick: () => { state.duelIds = [aSel.value, bSel.value]; runDuel(); } }, state.running === 'duel' ? 'Calcul…' : 'Comparer A et B')),
    state.duel ? duelTable(state.duel) : h('p', { class: 'empty' }, 'Dupliquez un profil, changez une arme, un talent ou la rotation, puis comparez : le tableau montre l’écart de DPS, technique par technique.')));

  const ca = state.compareAll;
  panels.push(resultPanel('Classement de tous les profils', `${state.profiles.length} profils`,
    h('div', { class: 'runbar' },
      h('button', { class: 'btn', type: 'button', disabled: busy, onclick: runCompareAll }, state.running === 'compareAll' ? 'Calcul…' : `Classer les ${state.profiles.length} profils`)),
    ca ? [
      barChart([...ca.rows].sort((a, b) => b.mean - a.mean).map((r) => ({
        id: r.id, label: `${r.name} (niv. ${r.level})`, value: r.mean, valueText: fmt(r.mean),
        tipTitle: `${fmt(r.mean)} DPS`, tip: `± ${fmt(1.96 * r.se)} (IC 95 %)\n${fmt(r.oomPct)} % du temps à sec de mana`,
      })), { currentId: p.id }),
      h('p', { class: 'hint' }, `${ca.iterations.toLocaleString('fr-FR')} combats par profil.`),
    ] : h('p', { class: 'empty' }, 'Classe tous vos profils enregistrés par DPS moyen.')));
  return panels;
}

function duelTable(d) {
  const A = d.a;
  const B = d.b;
  const ids = [...new Set([...A.s.breakdown, ...B.s.breakdown].map((x) => x.id))];
  const dpsOf = (side, id) => side.s.breakdown.find((x) => x.id === id)?.dps || 0;
  const row = (name, a, b, digits = 1, suffix = '', node = null) => h('tr', {},
    h('td', {}, node || name),
    h('td', { class: 'num' }, `${fmt(a, digits)}${suffix}`),
    h('td', { class: 'num' }, `${fmt(b, digits)}${suffix}`),
    h('td', { class: 'num' }, deltaNode(b - a, digits, suffix)));
  const group = (title) => h('tr', { class: 'group' }, h('td', { colspan: '4' }, title));
  const mainDps = (side) => weaponDps(side.r.mh);
  const pct = A.s.mean ? ((B.s.mean - A.s.mean) / A.s.mean) * 100 : 0;
  return [
    h('p', { class: 'duel-head' },
      h('strong', {}, `B ${pct >= 0 ? 'fait' : 'fait'} ${fmtSigned(B.s.mean - A.s.mean)} DPS (${fmtSigned(pct)} %)`),
      ` par rapport à A, sur ${d.iterations.toLocaleString('fr-FR')} combats chacun.`),
    h('div', { class: 'table-wrap' }, h('table', { class: 'duel' },
      h('thead', {}, h('tr', {}, h('th', {}, ''), h('th', { class: 'num' }, `A · ${A.name}`), h('th', { class: 'num' }, `B · ${B.name}`), h('th', { class: 'num' }, 'B − A'))),
      h('tbody', {},
        row('DPS moyen', A.s.mean, B.s.mean),
        group('Dégâts par source (DPS)'),
        ids.map((id) => row(label(id), dpsOf(A, id), dpsOf(B, id), 1, '', CAST_STYLE[id] ? castChip(id, label(id)) : null)),
        group('Cycle'),
        row('GCD occupé', A.s.cycle.gcdUsage, B.s.cycle.gcdUsage, 0, ' %'),
        row('Mongoose Bite par combat', A.s.cycle.mb.used, B.s.cycle.mb.used),
        row('Temps à sec de mana', A.s.oomPct, B.s.oomPct, 1, ' %'),
        group('Personnage'),
        row('PA de mêlée', A.sheet.ap, B.sheet.ap, 0),
        row('Crit contre le boss', A.sheet.critVsBoss, B.sheet.critVsBoss, 1, ' %'),
        row('Toucher', A.sheet.hit, B.sheet.hit, 1, ' %'),
        row('Raté des techniques', A.sheet.yellowMiss, B.sheet.yellowMiss, 1, ' %'),
        row('DPS d’arme (main droite)', mainDps(A), mainDps(B)),
        row('Mana', A.sheet.mana, B.sheet.mana, 0)))),
  ];
}

function resultsWeights(p, s, busy) {
  const w = state.weights[p.id];
  return resultPanel('Poids des stats', 'Équivalence en PA (PA = 1)',
    h('div', { class: 'runbar' },
      h('button', { class: 'btn', type: 'button', disabled: busy, onclick: runWeights }, state.running === 'weights' ? 'Calcul…' : 'Calculer les poids'),
      staleChip(w)),
    w ? [
      barChart(w.rows.map((r) => ({
        label: r.label, value: r.ep, valueText: r.epError ? `${fmt(r.ep, 2)} ± ${fmt(r.epError, 1)}` : fmt(r.ep, 2),
        tipTitle: `${fmt(r.ep, 2)} PA`,
        tip: `${r.label}\n${fmt(r.dpsPerPoint, 3)} DPS par point${r.epError ? `\nMarge (IC 95 %) : ± ${fmt(r.epError, 2)} PA` : ''}`,
      }))),
      h('p', { class: 'hint' }, `${w.iterations.toLocaleString('fr-FR')} combats par variante avec les mêmes tirages aléatoires ; « ± » donne la marge à 95 %. Écarts testés : +100 PA, +50 Agilité ou Force, +2 % toucher, crit ou réduction, +5 compétence, +5 % hâte, +5 DPS d’arme, +20 mp5, +50 Intelligence. Le toucher vaut 0 une fois le plafond atteint ; le mp5 et l’Intelligence valent 0 tant que vous ne manquez pas de mana. Ces poids donnent aussi une « valeur PA » à chaque objet de la bibliothèque.`),
    ] : h('p', { class: 'empty' }, 'Mesure le gain de DPS de chaque stat en relançant le profil avec un peu plus de cette stat. Utile pour départager deux objets d’un coup d’œil.'));
}

// ---------- sources ----------

function renderSources() {
  $('sources').replaceChildren(
    h('div', { class: 'panel-head' }, h('h2', {}, 'Sources et fiabilité'), h('span', { class: 'hint' }, `Données au ${new Date(DATA_INFO.updated).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · build ${DATA_INFO.build}`)),
    h('p', {}, DATA_INFO.note),
    h('div', { class: 'legend' }, Object.entries(CONFIDENCE).map(([k, c]) => h('div', {}, chip(k), h('small', {}, c.desc)))),
    h('div', { class: 'section' },
      h('h3', {}, 'Comment le sim calcule'),
      h('ul', {},
        h('li', {}, 'Monte-Carlo événementiel : chaque itération joue un combat complet (attaques automatiques, GCD, recharges, mana, procs, saignement, piège).'),
        h('li', {}, 'Table d’attaque de Classic : un seul jet pour les attaques automatiques (raté, esquive, parade, érafle, crit), deux jets pour les techniques. Formules reprises du code de wowsims et du wiki de magey.'),
        h('li', {}, 'Changements Forever appliqués : Mongoose Bite et Raptor Strike basés sur l’arme, Expose Prey, Lacerating Strikes, Strider Kick, Predator’s Edge, Aspect of the Beast avec PA de mêlée, toucher et crit unifiés, stat de réduction d’esquive/parade.'),
        h('li', {}, `Objets : ${ITEM_DB_INFO.count.toLocaleString('fr-FR')} objets réels de Forever (build ${ITEM_DB_INFO.build}, ${ITEM_DB_INFO.date}), lus dans le client par wowsims/gamedata, la même source que Wowhead. Gardés : ce qu’un chasseur mêlée peut porter et qui a une stat utile ; exclus : objets de test et de Season of Discovery. Chaque objet a un lien vers sa page Wowhead Forever.`),
        h('li', {}, 'Valeurs des sorts du chasseur (Raptor Strike, Mongoose Bite, Expose Prey, Lacerate…) lues dans les mêmes données du client : fiabilité « Client » dans l’onglet Hypothèses.'),
        h('li', {}, 'Icônes et fonds des arbres : textures de l’interface du jeu (Gethe/wow-ui-textures). Les objets propres à Forever empruntent l’icône d’un objet voisin. Le client ne donne pas la place des talents dans les arbres : la disposition suit Classic et les guides de la bêta, à confirmer en jeu.'),
        h('li', {}, 'Pas simulé : déplacements, AoE, menace, Wing Clip, procs d’objets précis, détail des capacités du familier.'))),
    h('div', { class: 'section' },
      h('h3', {}, 'Sources'),
      h('ul', {}, Object.values(SOURCES).map((s) => h('li', {}, h('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.label))))),
  );
}

// ---------- infobulle ----------

function setupTooltip() {
  const tip = $('tooltip');
  const show = (el, x, y) => {
    tip.replaceChildren(h('strong', {}, el.getAttribute('data-tip-title') || ''), ...(el.getAttribute('data-tip') || '').split('\n').filter(Boolean).map((l) => h('div', {}, l)));
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    const left = Math.min(window.innerWidth - r.width - 8, x + 14);
    const top = y + 14 + r.height > window.innerHeight ? y - r.height - 10 : y + 14;
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${Math.max(8, top)}px`;
  };
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest?.('[data-tip-title]');
    if (el && el.getAttribute('data-tip-title')) show(el, e.clientX, e.clientY);
    else tip.hidden = true;
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('[data-tip-title]');
    if (!el || !el.getAttribute('data-tip-title')) { tip.hidden = true; return; }
    const r = el.getBoundingClientRect();
    show(el, r.left + r.width / 2, r.bottom);
  });
  document.addEventListener('scroll', () => { tip.hidden = true; }, true);
}

// ---------- démarrage ----------

function renderAll() {
  renderProfileBar();
  renderIO();
  renderSheet();
  renderTabs();
  renderPanel();
  renderResults();
}

function start() {
  load();
  const config = $('config');
  config.addEventListener('input', onFieldEvent);
  config.addEventListener('change', onFieldEvent);
  const picker = $('picker');
  picker.addEventListener('close', () => { if (state.picker) { pickerSeq++; state.picker = null; } });
  // Un clic sur le fond assombri (hors de la fenêtre) la ferme.
  picker.addEventListener('click', (e) => { if (e.target === picker) closePicker(); });
  setupTooltip();
  renderSources();
  renderAll();
  runMain();
}

start();
