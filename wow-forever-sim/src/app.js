// Interface du sim Survie mêlée (WoW Forever). Aucune dépendance.

import {
  BUFFS, CONFIDENCE, DATA_INFO, ENCHANTS, FIGHT_PRESETS, MECHANICS, ON_USE_PRESETS, RACES,
  ROTATION_ABILITIES, SAMPLE_WEAPONS, SOURCES, TALENTS, TALENT_PRESETS, WEAPON_TYPES,
  defaultProfile, mechanicDefault,
} from './data.js';
import {
  buildCharacter, characterSheet, combatLog, createAccumulator, profileVariants, simulateBatch,
  statWeightsFromRuns, summarize,
} from './engine.js';

const STORE_KEY = 'forever-sv-sim:v1';
const SEED = 1;

const TABS = [
  ['perso', 'Personnage'],
  ['talents', 'Talents'],
  ['buffs', 'Buffs'],
  ['rotation', 'Rotation'],
  ['combat', 'Combat'],
  ['hypo', 'Hypothèses'],
];

const state = {
  profiles: [],
  currentId: null,
  tab: 'perso',
  iterations: 2000,
  results: {},
  weights: {},
  compare: null,
  log: {},
  running: null,
  notice: '',
  ioOpen: false,
  ioMessage: '',
  confirmDelete: false,
};

// ---------- utilitaires ----------

const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
const fmt0 = (v) => fmt(v, 0);
const uid = () => `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const tick = () => new Promise((r) => setTimeout(r, 0));
const $ = (id) => document.getElementById(id);

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, v);
  for (const c of children.flat()) if (c) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (o[keys[i]] == null) o[keys[i]] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = value;
}

const current = () => state.profiles.find((p) => p.id === state.currentId) || state.profiles[0];
const snapshot = (p) => JSON.stringify({ ...p, name: undefined });

// ---------- profils ----------

function normalizeProfile(p) {
  const L = Number(p.level) === 30 ? 30 : 60;
  const d = defaultProfile(L);
  const out = { ...d, ...p, level: L };
  for (const k of ['gear', 'mh', 'oh', 'talents', 'fight', 'pet', 'custom', 'mechanics']) out[k] = { ...d[k], ...(p[k] || {}) };
  out.buffs = Array.isArray(p.buffs) ? p.buffs.filter((id) => BUFFS.some((b) => b.id === id)) : d.buffs;
  out.trinkets = [0, 1].map((i) => ({ ...d.trinkets[i], ...((p.trinkets || [])[i] || {}) }));
  const rot = Array.isArray(p.rotation) ? p.rotation.filter((r) => ROTATION_ABILITIES[r.id]) : [];
  for (const r of d.rotation) if (!rot.some((x) => x.id === r.id)) rot.push({ ...r });
  out.rotation = rot.map((r) => ({ id: r.id, enabled: !!r.enabled, minMana: Number(r.minMana) || 0 }));
  out.id = p.id || uid();
  out.name = String(p.name || d.name).slice(0, 80);
  return out;
}

function sampleProfiles() {
  const a = defaultProfile(60);
  a.id = 'exemple-60-2m';
  a.name = 'Exemple · niveau 60 · arme à deux mains';

  const b = defaultProfile(60);
  const w = SAMPLE_WEAPONS[60];
  b.id = 'exemple-60-dw';
  b.name = 'Exemple · niveau 60 · ambidextrie';
  b.twoHand = false;
  b.mh = { min: w.mh.min, max: w.mh.max, speed: w.mh.speed, type: w.mh.type, enchant: 'crusader' };
  b.oh = { min: w.oh.min, max: w.oh.max, speed: w.oh.speed, type: w.oh.type, enchant: 'crusader' };

  const c = defaultProfile(30);
  c.id = 'exemple-30-beta';
  c.name = 'Exemple · niveau 30 (bêta) · 2M';
  return [a, b, c];
}

function load() {
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
  } catch {
    data = null;
  }
  if (data && Array.isArray(data.profiles) && data.profiles.length) {
    state.profiles = data.profiles.map(normalizeProfile);
    state.currentId = data.currentId;
    state.iterations = [500, 1000, 2000, 5000, 10000].includes(data.iterations) ? data.iterations : 2000;
    state.tab = TABS.some(([k]) => k === data.tab) ? data.tab : 'perso';
  } else {
    state.profiles = sampleProfiles();
    state.currentId = state.profiles[0].id;
  }
  if (!state.profiles.some((p) => p.id === state.currentId)) state.currentId = state.profiles[0].id;
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      profiles: state.profiles, currentId: state.currentId, iterations: state.iterations, tab: state.tab,
    }));
  } catch {
    // Stockage indisponible (navigation privée) : le sim fonctionne sans.
  }
}

function switchProfile(id) {
  state.currentId = id;
  state.confirmDelete = false;
  state.notice = '';
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
  if (L < 40) p.talents.laceratingStrikes = 0;
  state.notice = `Niveau ${L} : niveau et armure du boss, rangs des sorts et valeurs dépendantes du niveau ont été remis à jour. Vérifiez l’équipement, les armes, les buffs et les talents.`;
  save();
  renderAll();
}

// ---------- champs de formulaire ----------

function fieldId(path) {
  return `f-${path.replace(/\./g, '-')}`;
}

function numField(label, path, opts = {}) {
  const value = getPath(current(), path);
  return h('label', { class: 'field', for: fieldId(path) },
    h('span', {}, label),
    h('input', {
      id: fieldId(path), type: 'number', inputmode: 'decimal', step: opts.step ?? 'any', min: opts.min, max: opts.max,
      value: value ?? 0, 'data-path': path, 'data-kind': 'num',
    }));
}

function textField(label, path) {
  return h('label', { class: 'field', for: fieldId(path) },
    h('span', {}, label),
    h('input', { id: fieldId(path), type: 'text', value: getPath(current(), path) ?? '', 'data-path': path, 'data-kind': 'str' }));
}

function selectEl(options, value, attrs = {}) {
  const s = h('select', attrs, Object.entries(options).map(([k, v]) => h('option', { value: k }, v)));
  s.value = String(value);
  return s;
}

function selectField(label, path, options, { kind = 'str', rerender = false } = {}) {
  return h('label', { class: 'field', for: fieldId(path) },
    h('span', {}, label),
    selectEl(options, getPath(current(), path), { id: fieldId(path), 'data-path': path, 'data-kind': kind, 'data-rerender': rerender ? '1' : undefined }));
}

function checkField(label, path, { rerender = false } = {}) {
  const input = h('input', { id: fieldId(path), type: 'checkbox', 'data-path': path, 'data-rerender': rerender ? '1' : undefined });
  input.checked = !!getPath(current(), path);
  return h('label', { class: 'check', for: fieldId(path) }, input, h('span', {}, label));
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
    h('button', { class: 'btn small', type: 'button', onclick: () => addProfile(defaultProfile(60)) }, 'Nouveau 60'),
    h('button', { class: 'btn small', type: 'button', onclick: () => addProfile(defaultProfile(30)) }, 'Nouveau 30'),
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
        switchProfile(state.profiles[0].id);
      },
    }, state.confirmDelete ? 'Confirmer la suppression' : 'Supprimer'),
    h('button', {
      class: 'btn small', type: 'button', 'aria-expanded': state.ioOpen ? 'true' : 'false',
      onclick: () => { state.ioOpen = !state.ioOpen; state.ioMessage = ''; renderIO(); renderProfileBar(); },
    }, state.ioOpen ? 'Fermer l’import/export' : 'Importer / exporter'),
  );
}

function renderIO() {
  const box = $('io');
  box.replaceChildren();
  box.hidden = !state.ioOpen;
  if (!state.ioOpen) return;
  const p = current();
  const exportData = JSON.stringify({ ...p, id: undefined }, null, 2);
  const out = h('textarea', { id: 'exportText', readonly: true, 'aria-label': 'Profil exporté (JSON)' });
  out.value = exportData;
  const inp = h('textarea', { id: 'importText', placeholder: 'Collez ici un profil exporté (JSON)…', 'aria-label': 'Profil à importer (JSON)' });
  const msg = h('p', { class: 'hint', 'aria-live': 'polite' }, state.ioMessage);
  box.append(
    h('div', { class: 'panel-head' }, h('h2', {}, 'Importer ou exporter un profil'), h('span', { class: 'hint' }, 'Pour sauvegarder ailleurs ou partager un profil.')),
    h('div', { class: 'io' },
      h('label', { class: 'field', for: 'exportText' }, h('span', {}, `Profil « ${p.name} »`), out),
      h('div', { class: 'io-actions' },
        h('button', {
          class: 'btn small', type: 'button',
          onclick: () => {
            const done = () => { state.ioMessage = 'Profil copié dans le presse-papiers.'; msg.textContent = state.ioMessage; };
            try {
              navigator.clipboard.writeText(exportData).then(done, () => { out.select(); msg.textContent = 'Copie refusée : le texte est sélectionné, copiez-le avec Ctrl+C.'; });
            } catch {
              out.select();
              msg.textContent = 'Copie refusée : le texte est sélectionné, copiez-le avec Ctrl+C.';
            }
          },
        }, 'Copier le profil')),
      h('label', { class: 'field', for: 'importText' }, h('span', {}, 'Importer'), inp),
      h('div', { class: 'io-actions' },
        h('button', {
          class: 'btn small primary', type: 'button',
          onclick: () => {
            try {
              const data = JSON.parse(inp.value);
              if (!data || typeof data !== 'object') throw new Error('format');
              state.ioMessage = 'Profil importé.';
              addProfile(data);
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
  const s = characterSheet(current());
  const hitWarn = s.yellowMiss > 0;
  const items = [
    ['PA de mêlée', fmt0(s.ap)],
    ['Agilité / Force', `${fmt0(s.agi)} / ${fmt0(s.str)}`],
    ['Crit (feuille)', `${fmt(s.crit)} %`],
    ['Crit contre le boss', `${fmt(s.critVsBoss)} %`],
    ['Toucher / plafond', `${fmt(s.hit)} / ${fmt(s.hitCap)} %`, hitWarn],
    ['Raté techniques', `${fmt(s.yellowMiss)} %`, hitWarn],
    ['Raté attaques auto', `${fmt(s.whiteMiss)} %`],
    ['Esquive du boss', `${fmt(s.dodge)} %`],
    ['Érafles (pénalité)', `${fmt0(s.glance)} % (−${fmt0(s.glancePenalty)} %)`],
    ['Compétence d’arme', fmt0(s.skill)],
    ['Armure du boss', `${fmt0(s.armor)} (−${fmt(s.armorReduction)} %)`],
    ['Dégâts critiques', `${fmt0(s.critMult * 100)} %`],
    ['Mana', fmt0(s.mana)],
    ['Expose Prey', `${fmt(s.exposePrey)} % par coup`],
    ['Coût RS / MB / SK', `${fmt0(s.costs.raptor)} / ${fmt0(s.costs.mongoose)} / ${fmt0(s.costs.striderKick)}`],
    s.ohMult !== null
      ? ['Main gauche', `${fmt0(s.ohMult)} % des dégâts`]
      : ['Vitesse d’attaque', `${fmt(s.swing, 2)} s${s.haste > 0 ? ` (+${fmt(s.haste)} %)` : ''}`],
  ];
  $('sheet').replaceChildren(...items.map(([k, v, warn]) => h('div', {}, h('span', { class: 'k' }, k), h('span', { class: `v${warn ? ' warn' : ''}` }, v))));
}

// ---------- onglets ----------

function renderTabs() {
  const tabs = $('tabs');
  tabs.replaceChildren(...TABS.map(([key, label]) => h('button', {
    class: 'tab', type: 'button', role: 'tab', 'aria-selected': state.tab === key ? 'true' : 'false',
    onclick: () => { state.tab = key; save(); renderTabs(); renderPanel(); },
  }, label)));
}

function renderPanel() {
  const panel = $('panel');
  const p = current();
  const content = {
    perso: panelPerso,
    talents: panelTalents,
    buffs: panelBuffs,
    rotation: panelRotation,
    combat: panelCombat,
    hypo: panelHypo,
  }[state.tab](p);
  panel.replaceChildren(...[
    state.notice ? h('div', { class: 'notice', role: 'status' }, state.notice) : null,
    content,
  ].filter(Boolean));
}

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

function panelPerso(p) {
  const race = RACES[p.race] || RACES.orc;
  const levelSel = selectEl({ 60: 'Niveau 60', 30: 'Niveau 30 (bêta)' }, p.level, { id: 'f-level', 'aria-label': 'Niveau' });
  levelSel.addEventListener('change', () => changeLevel(Number(levelSel.value)));

  const trinketTypes = { ap: 'Puissance d’attaque', haste: 'Hâte (%)', agi: 'Agilité', str: 'Force', crit: 'Critique (%)' };
  const trinketRows = [0, 1].map((i) => {
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

  const twoHandToggle = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Style d’arme' },
    h('button', { type: 'button', 'aria-pressed': p.twoHand ? 'true' : 'false', onclick: () => { p.twoHand = true; afterChange(true); } }, 'Arme à deux mains'),
    h('button', { type: 'button', 'aria-pressed': p.twoHand ? 'false' : 'true', onclick: () => { p.twoHand = false; afterChange(true); } }, 'Ambidextrie'));

  const loadSample = () => {
    const s = SAMPLE_WEAPONS[p.level];
    if (p.twoHand) Object.assign(p.mh, { min: s.twoHand.min, max: s.twoHand.max, speed: s.twoHand.speed, type: s.twoHand.type });
    else {
      Object.assign(p.mh, { min: s.mh.min, max: s.mh.max, speed: s.mh.speed, type: s.mh.type });
      Object.assign(p.oh, { min: s.oh.min, max: s.oh.max, speed: s.oh.speed, type: s.oh.type });
    }
    afterChange(true);
  };
  const sample = SAMPLE_WEAPONS[p.level];

  return h('div', { class: 'section-stack' },
    section('Personnage', null,
      h('div', { class: 'fields' },
        textField('Nom du profil', 'name'),
        h('label', { class: 'field', for: 'f-level' }, h('span', {}, 'Niveau'), levelSel),
        selectField('Race', 'race', Object.fromEntries(Object.entries(RACES).map(([k, v]) => [k, v.name])), { rerender: true }),
        selectField('Aspect', 'aspect', { beast: 'Aspect of the Beast', monkey: 'Aspect du singe', hawk: 'Aspect du faucon', none: 'Aucun' })),
      h('p', { class: 'hint' }, race.note),
      h('div', { class: 'fields' },
        checkField('Hunter’s Mark sur la cible', 'huntersMark'),
        checkField('Utiliser le racial offensif', 'racial'))),
    section('Statistiques d’équipement', 'Totaux de l’équipement, sans buffs ni talents. Toucher et crit sont unifiés dans Forever.',
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
    h('div', { class: 'section' },
      h('div', { class: 'section-title' }, h('h3', {}, 'Armes'), twoHandToggle),
      h('div', { class: 'io-actions' },
        h('button', { class: 'btn small', type: 'button', onclick: loadSample }, p.twoHand ? 'Charger l’arme d’exemple' : 'Charger les armes d’exemple'),
        h('span', { class: 'hint' }, p.twoHand ? sample.twoHand.name : `${sample.mh.name} et ${sample.oh.name}`)),
      h('p', { class: 'hint' }, 'Les armes d’exemple reprennent des stats de Classic : l’itemisation de Forever peut différer.')),
    weaponBlock(p.twoHand ? 'Arme à deux mains' : 'Main droite', 'mh', p),
    p.twoHand ? null : weaponBlock('Main gauche', 'oh', p),
    section('Bijoux et procs', null,
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
  );
}

function talentPoints(p) {
  return TALENTS.reduce((s, t) => s + (Number(p.talents[t.id]) || 0), 0);
}

function panelTalents(p) {
  const available = p.level - 9;
  const used = talentPoints(p);
  const list = h('div', { class: 'talent-list' }, TALENTS.map((t) => {
    const locked = t.minLevel && p.level < t.minLevel;
    const v = locked ? 0 : Number(p.talents[t.id]) || 0;
    const set = (nv) => { p.talents[t.id] = Math.max(0, Math.min(t.max, nv)); afterChange(true); };
    return h('div', { class: `talent${v === 0 ? ' off' : ''}` },
      h('div', {}, h('span', { class: 'name' }, t.name), h('span', { class: 'tree' }, `${t.tree} · ${t.need} pts requis`)),
      h('div', { class: 'stepper' },
        h('button', { type: 'button', 'aria-label': `Retirer un point à ${t.name}`, disabled: locked || v <= 0, onclick: () => set(v - 1) }, '−'),
        h('span', { class: 'num', 'aria-live': 'polite' }, `${v}/${t.max}`),
        h('button', { type: 'button', 'aria-label': `Ajouter un point à ${t.name}`, disabled: locked || v >= t.max, onclick: () => set(v + 1) }, '+')),
      h('div', { class: 'desc' }, locked ? `Indisponible au niveau ${p.level} (31 points en Survie, niveau ${t.minLevel} minimum).` : t.desc));
  }));
  return h('div', { class: 'section-stack' },
    section('Talents qui comptent pour le sim', null,
      h('p', { class: 'hint' }, `${used} points dans ces talents, sur ${available} disponibles au niveau ${p.level}. Les autres points du build (défensifs, utilitaires) ne changent pas le DPS simulé.`),
      h('div', { class: 'io-actions' },
        h('button', { class: 'btn small', type: 'button', onclick: () => { p.talents = { ...TALENT_PRESETS[p.level] }; afterChange(true); } }, `Charger le build par défaut (niveau ${p.level})`)),
      used > available ? h('div', { class: 'notice' }, `Trop de points : ${used} pour ${available} disponibles.`) : null,
      list));
}

function panelBuffs(p) {
  const cats = [...new Set(BUFFS.map((b) => b.cat))];
  const notes = {
    'Raid': 'Valeurs de Classic au niveau choisi.',
    'Consommables': 'Un seul effet par famille (élixir d’agilité, de force, nourriture…).',
    'Buffs de monde': 'Présence dans Forever non confirmée.',
    'Débuffs': 'Réduisent l’armure du boss.',
  };
  return h('div', { class: 'section-stack' }, cats.map((cat) => section(cat, notes[cat],
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
    })))));
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
      h('label', { class: 'rot-name', for: `rot-${r.id}` }, h('span', {}, def.name), h('small', { class: 'muted' }, note)),
      h('label', { class: 'mana', for: `rot-mana-${r.id}` }, 'Mana min.',
        h('input', { id: `rot-mana-${r.id}`, type: 'number', min: 0, max: 100, step: 5, value: r.minMana, 'data-path': `rotation.${i}.minMana`, 'data-kind': 'num' }), '%'),
      h('div', { class: 'moves' },
        h('button', { class: 'btn small', type: 'button', 'aria-label': `Monter ${def.name}`, disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
        h('button', { class: 'btn small', type: 'button', 'aria-label': `Descendre ${def.name}`, disabled: i === p.rotation.length - 1, onclick: () => move(i, 1) }, '↓')));
  });
  return h('div', { class: 'section-stack' },
    section('Priorités', 'À chaque fin de GCD, le sim lance la première technique disponible de la liste.',
      h('div', { class: 'rotation' }, rows),
      h('p', { class: 'hint' }, 'Le seuil « Mana min. » garde du mana pour les techniques placées plus haut. Les recharges (racial, bijoux) et les potions sont utilisées dès que possible.'),
      h('div', { class: 'io-actions' },
        h('button', { class: 'btn small', type: 'button', onclick: () => { state.tab = 'hypo'; save(); renderTabs(); renderPanel(); } }, 'Changer le mode de Raptor Strike (Hypothèses)'))));
}

function panelCombat(p) {
  return h('div', { class: 'section-stack' },
    section('Rencontre', null,
      h('div', { class: 'fields' },
        numField('Durée (s)', 'fight.duration', { min: 10, step: 10 }),
        numField('Variation de durée (±%)', 'fight.variance', { min: 0, max: 50, step: 5 }),
        numField('Niveau du boss', 'fight.bossLevel', { min: 1, step: 1 }),
        numField('Armure du boss', 'fight.bossArmor', { min: 0, step: 50 })),
      h('div', { class: 'fields' },
        checkField('Dans le dos du boss (pas de parade)', 'fight.behind'),
        checkField('Boss d’un type pisté (Improved Tracking)', 'fight.trackedType'),
        checkField('Vous êtes attaqué (solo, tank)', 'fight.beingAttacked', { rerender: true }))),
    p.fight.beingAttacked ? section('Attaques subies', 'Vos esquives activent Mongoose Bite, vos parades Counterattack.',
      h('div', { class: 'fields' },
        numField('Vitesse du boss (s)', 'fight.bossSwing', { min: 0.5, step: 0.1 }),
        numField('Votre esquive (%)', 'fight.playerDodge', { min: 0, step: 0.5 }),
        numField('Votre parade (%)', 'fight.playerParry', { min: 0, step: 0.5 }))) : null);
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
      (def.src || []).map((s) => SOURCES[s] ? h('a', { href: SOURCES[s].url, target: '_blank', rel: 'noopener' }, SOURCES[s].label.split(' — ')[0]) : null),
      isChanged ? h('button', { class: 'btn small ghost', type: 'button', onclick: () => { p.mechanics[def.key] = dflt; afterChange(true); } }, 'Réinitialiser') : null),
    h('div', { class: 'control' }, control));
}

// ---------- liaison des champs ----------

function onFieldEvent(e) {
  const el = e.target;
  const path = el?.dataset?.path;
  if (!path) return;
  const isText = el.type === 'number' || el.type === 'text';
  if (e.type === 'input' && !isText) return;
  if (e.type === 'change' && isText) return;
  let v;
  if (el.type === 'checkbox') v = el.checked;
  else if (el.dataset.kind === 'num') {
    if (el.value === '') return;
    v = Number(el.value);
    if (!Number.isFinite(v)) return;
  } else v = el.value;
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
}

// ---------- résultats ----------

function isStale(p, stored) {
  return !stored || stored.snapshot !== snapshot(p);
}

function renderStatus() {
  const el = $('runStatus');
  if (!el) return;
  const p = current();
  const res = state.results[p.id];
  el.replaceChildren(!res ? h('span', { class: 'chip stale' }, 'Pas encore simulé')
    : isStale(p, res) ? h('span', { class: 'chip stale' }, 'Profil modifié depuis le calcul')
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

function setProgress(id, frac) {
  const bar = $(id);
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
  }
}

function runMain() {
  return guarded('main', async () => {
    const p = current();
    const summary = await simulateChunked(p, state.iterations, (f) => setProgress('progress-main', f));
    state.results[p.id] = { summary, snapshot: snapshot(p) };
  });
}

function runWeights() {
  return guarded('weights', async () => {
    const p = current();
    const variants = profileVariants(p);
    const n = Math.min(state.iterations, 3000);
    const results = {};
    for (let k = 0; k < variants.length; k++) {
      const v = variants[k];
      const s = await simulateChunked(v.profile, n, (f) => setProgress('progress-weights', (k + f) / variants.length));
      results[v.key] = s.dps;
    }
    state.weights[p.id] = { rows: statWeightsFromRuns(results), snapshot: snapshot(p), iterations: n };
  });
}

function runCompare() {
  return guarded('compare', async () => {
    const n = Math.min(state.iterations, 3000);
    const rows = [];
    for (let k = 0; k < state.profiles.length; k++) {
      const p = state.profiles[k];
      const s = await simulateChunked(p, n, (f) => setProgress('progress-compare', (k + f) / state.profiles.length));
      rows.push({ id: p.id, name: p.name, level: p.level, mean: s.mean, se: s.se, oomPct: s.oomPct });
    }
    state.compare = { rows, iterations: n };
  });
}

function runLog() {
  const p = current();
  state.log[p.id] = { rows: combatLog(p, { seconds: 60, seed: SEED }), snapshot: snapshot(p) };
  renderResults();
}

function niceTicks(min, max, count = 5) {
  const span = max - min || 1;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => span / s <= count) || 10 * pow;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(v);
  return ticks;
}

function columnPath(x, y, w, hgt, r) {
  const rr = Math.min(r, w / 2, hgt);
  const b = y + hgt;
  return `M${x},${b}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${b}Z`;
}

function histogram(dps, mean) {
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
    const col = svg('path', {
      class: 'col', d: columnPath(x0, top, Math.max(1, bw - 2), H - m.b - top, 4),
      tabindex: '0', 'data-tip-title': `${fmt(s)} % des combats`,
      'data-tip': `${fmt0(lo + i * width)} à ${fmt0(lo + (i + 1) * width)} DPS`,
    });
    cols.append(col);
  });
  root.append(cols);
  const mx = x(mean);
  root.append(
    svg('line', { class: 'mean-line', x1: mx, x2: mx, y1: m.t - 4, y2: H - m.b }),
    svg('text', { class: 'mean-label', x: Math.min(W - m.r - 4, Math.max(m.l + 4, mx)), y: m.t - 8, 'text-anchor': mx > W - 90 ? 'end' : mx < m.l + 90 ? 'start' : 'middle' }, `moyenne ${fmt0(mean)}`),
  );
  return root;
}

function barChart(rows, { currentId } = {}) {
  const max = Math.max(...rows.map((r) => r.value), 1e-9);
  return h('div', { class: 'bars' }, rows.map((r) => {
    const ratio = Math.max(0, r.value) / max;
    return h('div', {
      class: `bar-row${r.id && r.id === currentId ? ' current' : ''}`, tabindex: '0',
      'data-tip-title': r.tipTitle || r.valueText, 'data-tip': r.tip || r.label,
    },
      h('span', { class: 'bar-label' }, r.label),
      h('span', { class: 'bar-track' },
        h('span', { class: 'bar-fill', style: `--ratio:${ratio.toFixed(4)}` }),
        h('span', { class: 'bar-value' }, r.valueText)));
  }));
}

function resultPanel(title, hint, ...content) {
  return h('section', { class: 'panel' },
    h('div', { class: 'panel-head' }, h('h2', {}, title), hint ? h('span', { class: 'hint' }, hint) : null),
    content);
}

function renderResults() {
  const box = $('results');
  const p = current();
  const res = state.results[p.id];
  const s = res?.summary;
  const busy = !!state.running;

  const itSel = selectEl({ 500: '500', 1000: '1 000', 2000: '2 000', 5000: '5 000', 10000: '10 000' }, state.iterations, { id: 'iterations' });
  itSel.addEventListener('change', () => { state.iterations = Number(itSel.value); save(); });

  const main = resultPanel('Simulation', null,
    h('div', { class: 'runbar' },
      h('button', { class: 'btn primary', type: 'button', disabled: busy, onclick: runMain }, state.running === 'main' ? 'Calcul…' : 'Lancer la simulation'),
      h('label', { for: 'iterations' }, 'Combats', itSel),
      h('span', { id: 'runStatus' })),
    h('div', { class: 'progress', 'aria-hidden': 'true', hidden: state.running !== 'main' }, h('i', { id: 'progress-main' })),
    s ? [
      h('div', { class: 'hero' },
        h('span', { class: 'big' }, fmt(s.mean)),
        h('span', { class: 'unit' }, 'DPS moyen'),
        h('span', { class: 'ci' }, `± ${fmt(1.96 * s.se)} (IC 95 %) · ${s.iterations.toLocaleString('fr-FR')} combats de ${fmt0(s.avgDuration)} s`)),
      h('div', { class: 'stats' },
        stat('Écart-type', `${fmt(s.sd)} DPS`),
        stat('5e – 95e centile', `${fmt0(s.p5)} – ${fmt0(s.p95)}`),
        stat('Temps à sec de mana', `${fmt(s.oomPct)} %`),
        stat('Procs Expose Prey', `${fmt(s.procs.exposePrey || 0)} / combat`),
        stat('Mongoose Bite', `${fmt(s.breakdown.find((b) => b.id === 'mongoose')?.casts || 0)} / combat`),
        stat('Potions et runes', `${fmt(s.procs.potions || 0)} / combat`)),
    ] : h('p', { class: 'empty' }, 'Lancez la simulation pour obtenir le DPS moyen, la répartition des dégâts et la distribution.'),
  );

  const panels = [main];

  if (s) {
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
    panels.push(resultPanel('Répartition des dégâts', 'DPS par source',
      barChart(s.breakdown.map((b) => ({
        label: b.name, value: b.dps, valueText: `${fmt(b.dps)} · ${fmt0(b.share)} %`,
        tipTitle: `${fmt(b.dps)} DPS`,
        tip: `${b.name}\n${b.casts ? `${fmt(b.casts)} par combat · ` : ''}crit ${fmt(b.critPct)} %`,
      }))),
      h('details', {}, h('summary', {}, 'Détail par technique (tableau)'), table)));

    panels.push(resultPanel('Distribution du DPS', `${s.iterations.toLocaleString('fr-FR')} combats`,
      h('div', { class: 'histo' }, histogram(s.dps, s.mean)),
      h('p', { class: 'hint' }, 'Part des combats par tranche de DPS. L’écart vient des crits, des procs et de la durée variable des combats.')));
  }

  const w = state.weights[p.id];
  panels.push(resultPanel('Poids des stats', 'Équivalence en PA (PA = 1)',
    h('div', { class: 'runbar' },
      h('button', { class: 'btn', type: 'button', disabled: busy, onclick: runWeights }, state.running === 'weights' ? 'Calcul…' : 'Calculer les poids'),
      w && isStale(p, w) ? h('span', { class: 'chip stale' }, 'Profil modifié depuis le calcul') : null),
    h('div', { class: 'progress', 'aria-hidden': 'true', hidden: state.running !== 'weights' }, h('i', { id: 'progress-weights' })),
    w ? [
      barChart(w.rows.map((r) => ({
        label: r.label, value: r.ep, valueText: r.epError ? `${fmt(r.ep, 2)} ± ${fmt(r.epError, 1)}` : fmt(r.ep, 2),
        tipTitle: `${fmt(r.ep, 2)} PA`,
        tip: `${r.label}\n${fmt(r.dpsPerPoint, 3)} DPS par point${r.epError ? `\nMarge (IC 95 %) : ± ${fmt(r.epError, 2)} PA` : ''}`,
      }))),
      h('p', { class: 'hint' }, `${w.iterations.toLocaleString('fr-FR')} combats par variante avec les mêmes tirages aléatoires ; « ± » donne la marge à 95 %. Écarts testés : +100 PA, +50 Agilité ou Force, +2 % toucher, crit ou réduction, +5 compétence, +5 % hâte, +5 DPS d’arme. Le toucher vaut 0 une fois le plafond atteint.`),
    ] : h('p', { class: 'empty' }, 'Mesure le gain de DPS de chaque stat (Agilité, Force, toucher, crit, hâte, compétence, arme) en relançant le profil avec un peu plus de cette stat.')));

  const cmp = state.compare;
  panels.push(resultPanel('Comparer les profils', 'Tous les profils enregistrés',
    h('div', { class: 'runbar' },
      h('button', { class: 'btn', type: 'button', disabled: busy, onclick: runCompare }, state.running === 'compare' ? 'Calcul…' : `Comparer les ${state.profiles.length} profils`)),
    h('div', { class: 'progress', 'aria-hidden': 'true', hidden: state.running !== 'compare' }, h('i', { id: 'progress-compare' })),
    cmp ? [
      barChart([...cmp.rows].sort((a, b) => b.mean - a.mean).map((r) => ({
        id: r.id, label: `${r.name} (niv. ${r.level})`, value: r.mean, valueText: fmt(r.mean),
        tipTitle: `${fmt(r.mean)} DPS`, tip: `± ${fmt(1.96 * r.se)} (IC 95 %)\n${fmt(r.oomPct)} % du temps à sec de mana`,
      })), { currentId: p.id }),
      h('p', { class: 'hint' }, `${cmp.iterations.toLocaleString('fr-FR')} combats par profil. Pour comparer 2M et ambidextrie, dupliquez un profil et changez seulement les armes.`),
    ] : h('p', { class: 'empty' }, 'Classe vos profils par DPS : pratique pour trancher entre arme à deux mains et ambidextrie, ou entre deux builds.')));

  const lg = state.log[p.id];
  panels.push(resultPanel('Journal de combat', '60 premières secondes d’un combat',
    h('div', { class: 'runbar' },
      h('button', { class: 'btn', type: 'button', disabled: busy, onclick: runLog }, lg ? 'Régénérer le journal' : 'Afficher le journal'),
      lg && isStale(p, lg) ? h('span', { class: 'chip stale' }, 'Profil modifié depuis le calcul') : null),
    lg ? h('div', { class: 'log', role: 'log' },
      h('div', { class: 'log-row' }, h('span', { class: 't' }, 'Temps'), h('span', { class: 'm' }, 'Mana'), h('span', { class: 'txt muted' }, 'Événement')),
      lg.rows.map((r) => {
        const cls = r.text.startsWith('Lance') || r.text.startsWith('Utilise') ? ' cast'
          : /^(Expose|Vous|Deadly|Furie|Potion|Rune)/.test(r.text) ? ' proc' : '';
        return h('div', { class: `log-row${cls}` },
          h('span', { class: 't' }, `${fmt(r.t, 2)} s`),
          h('span', { class: 'm' }, fmt0(r.mana)),
          h('span', { class: 'txt' }, r.text));
      }))
      : h('p', { class: 'empty' }, 'Montre chaque attaque, technique et proc : utile pour vérifier que la rotation fait ce que vous attendez.')));

  box.replaceChildren(...panels);
  renderStatus();
}

function stat(k, v) {
  return h('div', { class: 'stat' }, h('span', { class: 'k' }, k), h('span', { class: 'v' }, v));
}

// ---------- sources ----------

function renderSources() {
  const box = $('sources');
  box.replaceChildren(
    h('div', { class: 'panel-head' }, h('h2', {}, 'Sources et fiabilité'), h('span', { class: 'hint' }, `Données au ${new Date(DATA_INFO.updated).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · build ${DATA_INFO.build}`)),
    h('p', {}, DATA_INFO.note),
    h('div', { class: 'legend' }, Object.entries(CONFIDENCE).map(([k, c]) => h('div', {}, chip(k), h('small', {}, c.desc)))),
    h('div', { class: 'section' },
      h('h3', {}, 'Comment le sim calcule'),
      h('ul', {},
        h('li', {}, 'Monte-Carlo événementiel : chaque itération joue un combat complet (attaques automatiques, GCD, recharges, mana, procs, saignement, piège).'),
        h('li', {}, 'Table d’attaque de Classic : un seul jet pour les attaques automatiques (raté, esquive, parade, érafle, crit), deux jets pour les techniques. Formules reprises du code de wowsims et du wiki de magey.'),
        h('li', {}, 'Changements Forever appliqués : Mongoose Bite et Raptor Strike basés sur l’arme, Expose Prey, Lacerating Strikes, Strider Kick, Predator’s Edge, Aspect of the Beast avec PA de mêlée, toucher et crit unifiés, stat de réduction d’esquive/parade.'),
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
    tip.replaceChildren(h('strong', {}, el.getAttribute('data-tip-title') || ''), ...(el.getAttribute('data-tip') || '').split('\n').map((l) => h('div', {}, l)));
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    const left = Math.min(window.innerWidth - r.width - 8, x + 14);
    const top = y + 14 + r.height > window.innerHeight ? y - r.height - 10 : y + 14;
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${Math.max(8, top)}px`;
  };
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest?.('[data-tip-title]');
    if (el) show(el, e.clientX, e.clientY);
    else tip.hidden = true;
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('[data-tip-title]');
    if (!el) { tip.hidden = true; return; }
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
  setupTooltip();
  renderSources();
  renderAll();
  runMain();
}

start();
