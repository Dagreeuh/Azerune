// Importe les objets de WoW Forever depuis l’export du client publié par wowsims/gamedata
// (https://github.com/wowsims/gamedata, fichier items/items.txt, une fiche par objet).
// Garde ce qu’un chasseur mêlée peut porter et qui a une stat utile, puis écrit src/itemdb.js.
//
// Usage : node scripts/import-items.js <dossier gamedata>
//   ex. : git clone --depth 1 https://github.com/wowsims/gamedata ../gamedata
//         node scripts/import-items.js ../gamedata

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src) {
  console.error('Usage : node scripts/import-items.js <dossier gamedata>');
  process.exit(1);
}

const state = JSON.parse(readFileSync(join(src, 'state.json'), 'utf8'));
const text = readFileSync(join(src, 'items/items.txt'), 'utf8');

const QUALITY = { uncommon: 2, rare: 3, epic: 4, legendary: 5 };
const SLOT_TYPE = {
  head: 'head', neck: 'neck', shoulders: 'shoulders', back: 'back', chest: 'chest', wrists: 'wrists',
  hands: 'hands', waist: 'waist', legs: 'legs', feet: 'feet', finger: 'finger', trinket: 'trinket',
  'two-hand': 'weapon2h', 'one-hand': 'weapon1h', 'main hand': 'weapon1h', 'off hand': 'weapon1h',
  ranged: 'ranged', thrown: 'ranged',
};
// Armes qu’un chasseur peut manier (pas de masses, de boucliers ni de baguettes).
const WEAPONS = { Axe: 'axe', Sword: 'sword', Polearm: 'polearm', Staff: 'staff', Dagger: 'dagger', 'Fist Weapon': 'fist' };
const RANGED = new Set(['Bow', 'Gun', 'Crossbow', 'Thrown']);
const ARMOR = { Cloth: 'cloth', Leather: 'leather', Mail: 'mail', Miscellaneous: 'misc' };

const STAT = {
  agility: 'agi', strength: 'str', stamina: 'sta', intellect: 'int', spirit: 'spi',
  'attack power': 'ap', 'hit rating': 'hitRating', 'crit rating': 'critRating', 'haste rating': 'hasteRating',
  'expertise rating': 'expertiseRating', 'mana per 5 sec': 'mp5', 'weapon damage': 'weaponDmg',
};
// Compétences d’arme : identifiants de stat lus sur des objets connus (Hurley’s Felling Axe → hache, etc.).
const SKILL_STAT = { 90: 'axe', 91: 'mace', 92: 'sword', 96: 'dagger', 98: 'fist', 101: 'fist' };
const USEFUL = ['agi', 'str', 'ap', 'hitRating', 'critRating', 'hasteRating', 'expertiseRating', 'skill', 'weaponDmg'];

// Effets « Utiliser » connus (valeurs de Classic pour le même sort) : type, valeur, durée.
const KNOWN_USE = {
  25891: { type: 'ap', value: 280, duration: 20 }, // Earthstrike
  28866: { type: 'haste', value: 20, duration: 15 }, // Kiss of the Spider
  28777: { type: 'ap', value: 260, duration: 20 }, // Slayer's Crest
  24352: { type: 'ap', value: 150, duration: 20 }, // Devilsaur Eye
};

// Objets de test ou de développement laissés dans le client.
const SKIP_NAME = /^(\[|UNUSED|OLD|Monster - |Deprecated|DEBUG)|\[(PH|DNT|TMP)\]|\btest(ing)?\b|^\d+ (green|blue|rare|epic|purple)\b|placeholder|template|\bQA\b/i;
const SKIP_TAG = /PTR Only|Sanctified/;

function parseCard(card) {
  const lines = card.split('\n').filter(Boolean);
  const head = lines[0].match(/^(\d+) (.*)$/);
  if (!head) return null;
  const item = { id: Number(head[1]), name: head[2].trim(), fields: {}, effects: [] };
  for (const line of lines.slice(1)) {
    const m = line.match(/^(\w+)\s+(.*)$/);
    if (!m) continue;
    if (m[1] === 'effect') item.effects.push(m[2].trim());
    else item.fields[m[1]] = (item.fields[m[1]] ? `${item.fields[m[1]]}\n` : '') + m[2].trim();
  }
  return item;
}

function convert(raw) {
  const f = raw.fields;
  if (!f.item || SKIP_NAME.test(raw.name) || (f.tag && SKIP_TAG.test(f.tag))) return null;
  // Objets de Season of Discovery présents dans le client mais pas dans Forever.
  if (raw.id >= 200000 && raw.id < 250000) return null;
  const parts = f.item.split(', ');
  const quality = QUALITY[parts[0]];
  if (!quality) return null;
  const slot = parts[parts.length - 1];
  const sub = parts.length === 3 ? parts[1] : null;
  const type = SLOT_TYPE[slot];
  if (!type) return null;
  if (f.classes && !/hunter/.test(f.classes)) return null;

  let weapon = null;
  let armor = null;
  if (type === 'weapon1h' || type === 'weapon2h') {
    if (!WEAPONS[sub]) return null;
    const w = f.weapon && f.weapon.match(/(\d+) - (\d+) damage, speed ([\d.]+)/);
    if (!w) return null;
    weapon = { min: Number(w[1]), max: Number(w[2]), speed: Number(w[3]), type: WEAPONS[sub] };
  } else if (type === 'ranged') {
    if (!RANGED.has(sub)) return null;
  } else {
    if (!(sub in ARMOR)) return null;
    armor = ARMOR[sub];
  }

  const stats = {};
  let skillFor = null;
  for (const tok of (f.stats || '').split(', ')) {
    if (/allocation/.test(tok)) continue;
    const m = tok.match(/^([+-]\d+(?:\.\d+)?) (.+)$/);
    if (!m) continue;
    const v = Number(m[1]);
    const name = m[2].trim();
    const sk = name.match(/^stat (\d+)$/);
    if (sk && SKILL_STAT[sk[1]]) {
      stats.skill = (stats.skill || 0) + v;
      skillFor = [SKILL_STAT[sk[1]]];
    } else if (STAT[name]) {
      stats[STAT[name]] = (stats[STAT[name]] || 0) + v;
    }
  }

  let onUse = null;
  const notes = [];
  for (const e of raw.effects) {
    let m;
    if ((m = e.match(/^use: (\d+) (.+?) \((\d+) s cooldown(?:, (\d+) s shared cooldown)?\)/))) {
      const known = KNOWN_USE[m[1]];
      if (known) onUse = { ...known, cd: Number(m[3]) };
      else if (type === 'trinket') notes.push(`Utiliser : ${m[2]} (non simulé)`);
    } else if ((m = e.match(/^(?:equip|chance on hit): \d+ (.+)$/)) && !/Minor Run Speed|Stealth Detection|Ghost Wolf/.test(m[1])) {
      notes.push(`${/^chance/.test(e) ? 'Chance au toucher' : 'Équipé'} : ${m[1]} (non simulé)`);
    }
  }
  if (f.set) notes.push(`Ensemble : ${f.set.split('\n')[0]} (bonus non simulés)`);

  const useful = USEFUL.some((k) => stats[k]) || weapon || onUse;
  if (!useful) return null;

  const lv = f.level.match(/ilvl (\d+)(?:, requires level (\d+))?/);
  const ilvl = Number(lv[1]);
  const req = lv[2] ? Number(lv[2]) : 0;
  if (req > 60) return null;
  // Sans niveau requis (récompenses, butin de raid…) : niveau estimé d’après le niveau d’objet.
  // « Niveau 1 » sur un objet de haut niveau d’objet : on estime aussi d’après le niveau d’objet.
  const estimated = !req || (req <= 1 && ilvl >= 20);
  const level = estimated ? Math.max(1, Math.min(60, ilvl - 5)) : req;

  const out = { id: raw.id, n: raw.name, t: type, q: quality, l: level, i: ilvl };
  if (estimated) out.e = 1;
  if (armor && armor !== 'misc') out.a = armor;
  if (Object.keys(stats).length) out.s = stats;
  if (skillFor) out.sf = skillFor;
  if (weapon) out.w = [weapon.min, weapon.max, weapon.speed, weapon.type];
  if (slot === 'main hand') out.mh = 1;
  if (slot === 'off hand') out.oh = 1;
  if (onUse) out.u = onUse;
  if (f.unique) out.uq = 1;
  if (notes.length) out.no = notes;
  return out;
}

const items = [];
for (const card of text.split('=======\n')) {
  const raw = parseCard(card.trim());
  if (!raw) continue;
  const item = convert(raw);
  if (item) items.push(item);
}
items.sort((a, b) => a.id - b.id);

const info = {
  build: state.version,
  date: state.date,
  hotfixes: state.folder,
  source: 'https://github.com/wowsims/gamedata',
  count: items.length,
};
const body = items.map((i) => JSON.stringify(i)).join(',\n');
writeFileSync(join(root, 'src/itemdb.js'), `// Généré par scripts/import-items.js depuis wowsims/gamedata (données du client WoW Forever).
// Ne pas modifier à la main : relancer le script pour mettre à jour.
// Clés : n nom, t type, q qualité (2 vert, 3 bleu, 4 violet, 5 orange), l niveau requis (e = estimé),
// i niveau d’objet, a armure, s stats (scores bruts), sf compétence limitée à, w arme [min, max, vitesse, type],
// mh/oh main droite/gauche seulement, u effet à utiliser, uq unique, no effets non simulés.

export const ITEM_DB_INFO = ${JSON.stringify(info)};

export const ITEM_DB = [
${body},
];
`);
console.log(`${items.length} objets écrits dans src/itemdb.js (build ${state.version}, ${state.date})`);
