// Équipement : emplacements, objets, base de données Forever, analyse de tooltip
// et fusion des objets dans le profil.

import { RACES, defaultMechanics } from './data.js';
import { ITEM_DB } from './itemdb.js';

export const ITEM_TYPES = {
  head: 'Tête',
  neck: 'Cou',
  shoulders: 'Épaules',
  back: 'Dos',
  chest: 'Torse',
  wrists: 'Poignets',
  hands: 'Mains',
  waist: 'Taille',
  legs: 'Jambes',
  feet: 'Pieds',
  finger: 'Doigt',
  trinket: 'Bijou',
  weapon2h: 'Arme à deux mains',
  weapon1h: 'Arme à une main',
  ranged: 'Distance',
};

export const SLOTS = [
  { id: 'head', name: 'Tête', accepts: ['head'] },
  { id: 'neck', name: 'Cou', accepts: ['neck'] },
  { id: 'shoulders', name: 'Épaules', accepts: ['shoulders'] },
  { id: 'back', name: 'Dos', accepts: ['back'] },
  { id: 'chest', name: 'Torse', accepts: ['chest'] },
  { id: 'wrists', name: 'Poignets', accepts: ['wrists'] },
  { id: 'hands', name: 'Mains', accepts: ['hands'] },
  { id: 'waist', name: 'Taille', accepts: ['waist'] },
  { id: 'legs', name: 'Jambes', accepts: ['legs'] },
  { id: 'feet', name: 'Pieds', accepts: ['feet'] },
  { id: 'finger1', name: 'Doigt 1', accepts: ['finger'] },
  { id: 'finger2', name: 'Doigt 2', accepts: ['finger'] },
  { id: 'trinket1', name: 'Bijou 1', accepts: ['trinket'] },
  { id: 'trinket2', name: 'Bijou 2', accepts: ['trinket'] },
  { id: 'mainHand', name: 'Arme principale', accepts: ['weapon2h', 'weapon1h'] },
  { id: 'offHand', name: 'Main gauche', accepts: ['weapon1h'] },
  { id: 'ranged', name: 'Distance', accepts: ['ranged'] },
];

export const ITEM_STATS = [
  { key: 'agi', label: 'Agilité', short: 'Agi' },
  { key: 'str', label: 'Force', short: 'For' },
  { key: 'sta', label: 'Endurance', short: 'End' },
  { key: 'int', label: 'Intelligence', short: 'Int' },
  { key: 'spi', label: 'Esprit', short: 'Esp' },
  { key: 'ap', label: 'Puissance d’attaque', short: 'PA' },
  { key: 'hitRating', label: 'Score de toucher', short: 'score toucher', rating: 'hit' },
  { key: 'critRating', label: 'Score de crit', short: 'score crit', rating: 'crit' },
  { key: 'hasteRating', label: 'Score de hâte', short: 'score hâte', rating: 'haste' },
  { key: 'expertiseRating', label: 'Score d’expertise', short: 'score expertise', rating: 'expertise' },
  { key: 'hit', label: 'Toucher (%)', short: 'toucher', pct: true },
  { key: 'crit', label: 'Critique (%)', short: 'crit', pct: true },
  { key: 'haste', label: 'Hâte (%)', short: 'hâte', pct: true },
  { key: 'expertise', label: 'Réduction esquive/parade (%)', short: 'réd. esq./par.', pct: true },
  { key: 'skill', label: 'Compétence d’arme', short: 'compétence' },
  { key: 'weaponDmg', label: 'Dégâts d’arme (+ par coup)', short: 'dégâts d’arme' },
  { key: 'mp5', label: 'Mana toutes les 5 s', short: 'mp5' },
  { key: 'extraAttack', label: 'Attaque suppl. (% par coup)', short: 'att. suppl.', pct: true },
  // PA qui ne compte que contre un type de créature (saisi dans l’éditeur par un seul champ).
  { key: 'apVsHumanoid', label: 'PA contre les humanoïdes', short: 'PA contre humanoïdes', creature: 'humanoid' },
  { key: 'apVsBeast', label: 'PA contre les bêtes', short: 'PA contre bêtes', creature: 'beast' },
  { key: 'apVsDragonkin', label: 'PA contre les draconiens', short: 'PA contre draconiens', creature: 'dragonkin' },
  { key: 'apVsDemon', label: 'PA contre les démons', short: 'PA contre démons', creature: 'demon' },
  { key: 'apVsUndead', label: 'PA contre les morts-vivants', short: 'PA contre morts-vivants', creature: 'undead' },
  { key: 'apVsElemental', label: 'PA contre les élémentaires', short: 'PA contre élémentaires', creature: 'elemental' },
  { key: 'apVsGiant', label: 'PA contre les géants', short: 'PA contre géants', creature: 'giant' },
  { key: 'apVsMechanical', label: 'PA contre les machines', short: 'PA contre machines', creature: 'mechanical' },
];

export const CREATURE_AP_KEYS = Object.fromEntries(ITEM_STATS.filter((s) => s.creature).map((s) => [s.creature, s.key]));

// Conversion des scores en pourcentage, selon les hypothèses du profil (même valeur à tous les niveaux).
const PCT_SHORT = { hit: 'toucher', crit: 'crit', haste: 'hâte', expertise: 'réd. esq./par.' };
const RATING_KEYS = { hit: 'hitRatingPerPct', crit: 'critRatingPerPct', haste: 'hasteRatingPerPct', expertise: 'expertiseRatingPerPct' };

export function ratingFactors(profile) {
  const level = Number(profile?.level) === 30 ? 30 : 60;
  const M = { ...defaultMechanics(level), ...(profile?.mechanics || {}) };
  const out = {};
  for (const [stat, key] of Object.entries(RATING_KEYS)) out[stat] = Number(M[key]) || 1;
  return out;
}

export const ON_USE_TYPES = {
  ap: 'Puissance d’attaque',
  haste: 'Hâte (%)',
  agi: 'Agilité',
  str: 'Force',
  crit: 'Critique (%)',
};

export function slotDef(slotId) {
  return SLOTS.find((s) => s.id === slotId);
}

export function canEquip(item, slotId) {
  const slot = slotDef(slotId);
  if (!item || !slot || !slot.accepts.includes(item.type)) return false;
  if (item.mhOnly && slotId === 'offHand') return false;
  if (item.ohOnly && slotId === 'mainHand') return false;
  return true;
}

export function isWeaponType(type) {
  return type === 'weapon1h' || type === 'weapon2h';
}

export function weaponDps(w) {
  if (!w) return 0;
  return ((Number(w.min) || 0) + (Number(w.max) || 0)) / 2 / (Number(w.speed) || 1);
}

function fmtNum(v) {
  return Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

// `factors` (facultatif) : conversion des scores en %, pour afficher l’équivalent.
export function itemSummary(item, factors = null) {
  const parts = [];
  if (item.weapon) parts.push(`${fmtNum(item.weapon.min)}–${fmtNum(item.weapon.max)} · ${fmtNum(item.weapon.speed)} s · ${fmtNum(Math.round(weaponDps(item.weapon) * 10) / 10)} DPS`);
  for (const s of ITEM_STATS) {
    const v = Number(item.stats?.[s.key]) || 0;
    if (!v) continue;
    if (s.rating && factors) parts.push(`${fmtNum(Math.round((v / factors[s.rating]) * 100) / 100)} % ${PCT_SHORT[s.rating]}`);
    else parts.push(s.pct ? `${fmtNum(v)} % ${s.short}` : `${fmtNum(v)} ${s.short}`);
  }
  if (item.onUse?.value) {
    const u = item.onUse;
    parts.push(`Utiliser : +${fmtNum(u.value)}${u.type === 'haste' || u.type === 'crit' ? ' %' : ''} ${ON_USE_TYPES[u.type] || u.type} (${fmtNum(u.duration)} s / ${fmtNum(u.cd)} s)`);
  }
  return parts.join(' · ') || 'Aucune stat';
}

// Un identifiant d’objet désigne la bibliothèque de l’utilisateur ou la base Forever (« db12345 »).
export function findItem(items, id) {
  if (!id) return null;
  return items.find((i) => i.id === id) || (String(id).startsWith('db') ? dbItem(id) : null);
}

// Équipe un objet en gardant un ensemble cohérent (2M ↔ main gauche).
export function equipItem(profile, items, slotId, itemId) {
  const eq = { ...(profile.equipment || {}) };
  const item = findItem(items, itemId);
  eq[slotId] = itemId || null;
  if (item && item.type === 'weapon2h' && slotId === 'mainHand') eq.offHand = null;
  if (item && slotId === 'offHand') {
    const main = findItem(items, eq.mainHand);
    if (main && main.type === 'weapon2h') eq.mainHand = null;
  }
  profile.equipment = eq;
  return profile;
}

function equippedItems(profile, items) {
  const eq = profile.equipment || {};
  const out = {};
  for (const slot of SLOTS) {
    const it = findItem(items, eq[slot.id]);
    if (it && canEquip(it, slot.id)) out[slot.id] = it;
  }
  if (out.mainHand && out.mainHand.type === 'weapon2h') delete out.offHand;
  return out;
}

// Somme des stats des objets équipés (pour l’affichage).
export function equipmentTotals(profile, items) {
  const totals = {};
  for (const it of Object.values(equippedItems(profile, items))) {
    for (const s of ITEM_STATS) {
      const v = Number(it.stats?.[s.key]) || 0;
      if (v) totals[s.key] = (totals[s.key] || 0) + v;
    }
  }
  return totals;
}

// Profil prêt pour le moteur : stats des objets ajoutées aux bonus manuels,
// armes et bijoux à activer repris des objets équipés.
export function resolveProfile(profile, items = []) {
  const p = JSON.parse(JSON.stringify(profile));
  const eq = equippedItems(p, items);
  p.gear = { ...(p.gear || {}) };
  let extra = Number(p.extraAttackChance) || 0;

  const main = eq.mainHand && eq.mainHand.weapon ? eq.mainHand : null;
  if (main) {
    p.twoHand = main.type === 'weapon2h';
    p.mh = { ...main.weapon, enchant: p.mh?.enchant || 'none' };
    const off = !p.twoHand && eq.offHand && eq.offHand.weapon ? eq.offHand : null;
    p.oh = off ? { ...off.weapon, enchant: p.oh?.enchant || 'none' } : null;
  }

  const factors = ratingFactors(p);
  const target = p.fight?.creatureType;
  for (const [slotId, it] of Object.entries(eq)) {
    for (const s of ITEM_STATS) {
      const v = Number(it.stats?.[s.key]) || 0;
      if (!v) continue;
      if (s.creature) {
        if (s.creature === target) p.gear.ap = (Number(p.gear.ap) || 0) + v;
      } else if (s.key === 'weaponDmg' && it.weapon && (slotId === 'mainHand' || slotId === 'offHand')) {
        // « +X dégâts d’arme » sur une arme ne compte que pour elle.
        const w = slotId === 'mainHand' ? p.mh : p.oh;
        if (w) w.bonusDmg = (Number(w.bonusDmg) || 0) + v;
      } else if (s.rating) p.gear[s.rating] = (Number(p.gear[s.rating]) || 0) + v / factors[s.rating];
      else if (s.key === 'extraAttack') extra += v;
      else if (s.key === 'skill' && Array.isArray(it.skillFor) && it.skillFor.length) {
        if (it.skillFor.includes(p.mh?.type)) p.gear.skill = (Number(p.gear.skill) || 0) + v;
      } else p.gear[s.key] = (Number(p.gear[s.key]) || 0) + v;
    }
  }

  p.trinkets = [0, 1].map((i) => ({ ...((p.trinkets || [])[i] || { preset: 'none' }) }));
  ['trinket1', 'trinket2'].forEach((slot, i) => {
    const it = eq[slot];
    if (it && it.onUse && Number(it.onUse.value)) {
      p.trinkets[i] = { preset: 'custom', name: it.name, type: it.onUse.type, value: it.onUse.value, duration: it.onUse.duration, cd: it.onUse.cd };
    }
  });
  p.extraAttackChance = extra;
  return p;
}

// ---------- analyse d’un tooltip collé (anglais ou français) ----------

const num = (s) => Number(String(s).replace(',', '.'));

const TYPE_WORDS = [
  [/^(two[- ]?hand|deux mains)/i, 'weapon2h'],
  [/^(one[- ]?hand|une main|main hand|off hand|main droite|main gauche)/i, 'weapon1h'],
  [/^(ranged|à distance|distance|bow|gun|crossbow|thrown|arc|fusil|arbalète|armes? de jet)\b/i, 'ranged'],
  [/^(head|tête)$/i, 'head'],
  [/^(neck|cou)$/i, 'neck'],
  [/^(shoulders?|épaules?)$/i, 'shoulders'],
  [/^(back|dos)$/i, 'back'],
  [/^(chest|torse)$/i, 'chest'],
  [/^(wrists?|poignets?)$/i, 'wrists'],
  [/^(hands|mains)$/i, 'hands'],
  [/^(waist|taille)$/i, 'waist'],
  [/^(legs|jambes)$/i, 'legs'],
  [/^(feet|pieds)$/i, 'feet'],
  [/^(finger|doigt)$/i, 'finger'],
  [/^(trinket|bijou)$/i, 'trinket'],
];

const WEAPON_WORDS = [
  [/fist|pugilat/i, 'fist'],
  [/polearm|arme d['’]hast/i, 'polearm'],
  [/axe|hache/i, 'axe'],
  [/sword|épée/i, 'sword'],
  [/mace|masse/i, 'mace'],
  [/staff|staves|bâton/i, 'staff'],
  [/dagger|dague/i, 'dagger'],
];

const PRIMARY = [
  [/^(strength|force)$/i, 'str'],
  [/^(agility|agilité)$/i, 'agi'],
  [/^(stamina|endurance)$/i, 'sta'],
  [/^(intellect|intelligence)$/i, 'int'],
  [/^(spirit|esprit)$/i, 'spi'],
];

const IGNORE = /soulbound|binds when|lié quand|^lié|^unique|durability|durabilité|requires|^niveau|item level|niveau d['’]objet|sell price|prix de vente|^classes?\s*:|^\d+\s*(armor|armure)$|^armor|^armure|^"/i;

const PCT = '(\\d+(?:[.,]\\d+)?)\\s*%';

const CREATURE_WORDS = {
  humanoid: /^(humanoids?|humanoïdes?)$/,
  beast: /^(beasts?|bêtes?)$/,
  dragonkin: /^(dragonkin|draconiens?|dragons?)$/,
  demon: /^(demons?|démons?)$/,
  undead: /^(undead|morts-vivants?)$/,
  elemental: /^(elementals?|élémentaires?)$/,
  giant: /^(giants?|géants?)$/,
  mechanical: /^(mechanicals?|machines?|mécaniques?)$/,
};

function weaponWord(line) {
  for (const [re, type] of WEAPON_WORDS) if (re.test(line)) return type;
  return null;
}

function parseOnUse(line) {
  const out = {};
  let m;
  if ((m = line.match(/(\d+)\s*(?:attack power|à la puissance d['’]attaque)/i) || line.match(/(?:attack power by|puissance d['’]attaque de)\s*(\d+)/i))) {
    out.type = 'ap';
    out.value = num(m[1]);
  } else if ((m = line.match(new RegExp(`(?:attack speed|vitesse d['’]attaque)[^0-9]*${PCT}`, 'i')))) {
    out.type = 'haste';
    out.value = num(m[1]);
  } else if ((m = line.match(/(?:agility by|agilité de)\s*(\d+)/i))) {
    out.type = 'agi';
    out.value = num(m[1]);
  } else if ((m = line.match(/(?:strength by|force de)\s*(\d+)/i))) {
    out.type = 'str';
    out.value = num(m[1]);
  } else if ((m = line.match(new RegExp(`(?:critical strike|coup critique)[^0-9]*${PCT}`, 'i')))) {
    out.type = 'crit';
    out.value = num(m[1]);
  }
  if ((m = line.match(/(?:for|pendant)\s*(\d+(?:[.,]\d+)?)\s*(sec|s\b|min)/i))) out.duration = num(m[1]) * (/min/i.test(m[2]) ? 60 : 1);
  if ((m = line.match(/\((\d+(?:[.,]\d+)?)\s*(min|sec|s)\b[^)]*\)/i) || line.match(/recharge\s*:?\s*(\d+(?:[.,]\d+)?)\s*(min|sec|s)\b/i))) {
    out.cd = num(m[1]) * (/min/i.test(m[2]) ? 60 : 1);
  }
  return out.type ? out : null;
}

export function parseTooltip(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const result = { name: '', type: null, stats: {}, weapon: null, onUse: null, skillFor: null, unparsed: [] };
  if (!lines.length) return result;
  result.name = lines[0];
  const add = (key, v) => { result.stats[key] = (result.stats[key] || 0) + v; };
  let weaponType = null;
  let dmg = null;
  let speed = null;

  for (const raw of lines.slice(1)) {
    const line = raw.replace(/^(equip|équipé|équipée)\s*:\s*/i, '');
    let m;
    let used = false;

    for (const [re, type] of TYPE_WORDS) {
      if (re.test(line)) {
        if (!result.type) result.type = type;
        weaponType = weaponType || weaponWord(line);
        used = true;
        break;
      }
    }
    if (used) continue;

    if (!weaponType && /^(axe|sword|mace|polearm|staff|dagger|fist weapon|hache|épée|masse|arme d['’]hast|bâton|dague|arme de pugilat)$/i.test(line)) {
      weaponType = weaponWord(line);
      continue;
    }

    if ((m = line.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:damage|dégâts|points de dégâts)/i) || line.match(/(?:damage|dégâts)\s*:?\s*(\d+)\s*[-–]\s*(\d+)/i))) {
      dmg = [num(m[1]), num(m[2])];
      const sp = line.match(/(?:speed|vitesse)\s*:?\s*(\d+(?:[.,]\d+)?)/i);
      if (sp) speed = num(sp[1]);
      continue;
    }
    if ((m = line.match(/^(?:speed|vitesse)\s*:?\s*(\d+(?:[.,]\d+)?)/i))) {
      speed = num(m[1]);
      continue;
    }
    if (/damage per second|dégâts par seconde/i.test(line)) continue;

    if (/^(use|utiliser)\s*:/i.test(raw)) {
      const u = parseOnUse(raw);
      if (u) { result.onUse = { duration: 20, cd: 120, ...u }; continue; }
      result.unparsed.push(raw);
      continue;
    }

    if ((m = line.match(/^\+\s*(\d+)\s+(.+?)\.?$/))) {
      const stat = PRIMARY.find(([re]) => re.test(m[2].trim()));
      if (stat) { add(stat[1], num(m[1])); continue; }
    }
    if ((m = line.match(/(\d+).*(?:attack power|puissance d['’]attaque).*(?:when fighting|contre les?)\s+([\p{L}-]+)/iu))) {
      const word = m[2].toLowerCase();
      const creature = Object.entries(CREATURE_WORDS).find(([, re]) => re.test(word));
      if (creature) {
        add(CREATURE_AP_KEYS[creature[0]], num(m[1]));
        continue;
      }
    }
    if ((m = line.match(/\+?\s*(\d+)\s*(?:attack power|à la puissance d['’]attaque|puissance d['’]attaque)/i) || line.match(/(?:attack power by|puissance d['’]attaque de)\s*(\d+)/i))) {
      add('ap', num(m[1]));
      continue;
    }
    if ((m = line.match(/^\+?\s*(\d+)\s+(hit|critical strike|crit|haste|expertise) rating/i) || line.match(/^\+?\s*(\d+)\s+(?:au |en )?score (?:de |d['’])(toucher|coup critique|critique|hâte|expertise)/i))) {
      const word = m[2].toLowerCase();
      const key = /hit|toucher/.test(word) ? 'hitRating' : /crit/.test(word) ? 'critRating' : /haste|hâte/.test(word) ? 'hasteRating' : 'expertiseRating';
      add(key, num(m[1]));
      continue;
    }
    if ((m = line.match(new RegExp(`(?:chance to hit|chances de toucher)[^0-9]*${PCT}`, 'i')) || line.match(new RegExp(`^\\+?${PCT}\\s*(?:hit|toucher)`, 'i')))) {
      add('hit', num(m[1]));
      continue;
    }
    if ((m = line.match(new RegExp(`(?:critical strike|coups? critiques?)[^0-9]*${PCT}`, 'i')) || line.match(new RegExp(`^\\+?${PCT}\\s*(?:crit|critique)`, 'i')))) {
      add('crit', num(m[1]));
      continue;
    }
    if ((m = line.match(new RegExp(`(?:dodged|parried|esquivée?s?|parée?s?)[^0-9]*${PCT}`, 'i')))) {
      add('expertise', num(m[1]));
      continue;
    }
    if ((m = line.match(new RegExp(`(?:attack speed|vitesse d['’]attaque)[^0-9]*${PCT}`, 'i')))) {
      add('haste', num(m[1]));
      continue;
    }
    if ((m = line.match(/(\d+)\s*(?:mana per 5|mana every 5|points? de mana toutes les 5|mana toutes les 5)/i))) {
      add('mp5', num(m[1]));
      continue;
    }
    if ((m = line.match(/increased\s+(.+?)\s*\+\s*(\d+)/i) || line.match(/compétence\s+(?:en\s+|aux\s+|avec les\s+)?(.+?)\s+(?:augmentée\s+de\s+)?\+?\s*(\d+)/i))) {
      const types = WEAPON_WORDS.filter(([re]) => re.test(m[1])).map(([, ty]) => ty);
      add('skill', num(m[2]));
      if (types.length) result.skillFor = types;
      continue;
    }
    if ((m = line.match(new RegExp(`(?:extra attack|attaque supplémentaire)[^%]*?${PCT}|${PCT}[^%]*?(?:extra attack|attaque supplémentaire)`, 'i')))) {
      add('extraAttack', num(m[1] || m[2]));
      continue;
    }
    if (IGNORE.test(line)) continue;
    result.unparsed.push(raw);
  }

  if (dmg) {
    result.weapon = { min: dmg[0], max: dmg[1], speed: speed || 2.0, type: weaponType || 'axe' };
    if (!result.type || !['weapon1h', 'weapon2h', 'ranged'].includes(result.type)) result.type = (speed || 2) >= 3 ? 'weapon2h' : 'weapon1h';
    if (result.type === 'ranged') result.weapon = null;
  }
  return result;
}

// ---------- base de données Forever ----------

export const QUALITY_NAMES = { 2: 'Vert', 3: 'Bleu', 4: 'Épique', 5: 'Légendaire' };
export const ARMOR_NAMES = { cloth: 'Tissu', leather: 'Cuir', mail: 'Mailles' };

export function itemFromDb(rec) {
  return {
    id: `db${rec.id}`,
    dbId: rec.id,
    name: rec.n,
    type: rec.t,
    level: null,
    reqLevel: rec.l,
    reqEstimated: !!rec.e,
    ilvl: rec.i,
    quality: rec.q,
    armor: rec.a || null,
    source: 'base',
    stats: { ...(rec.s || {}) },
    weapon: rec.w ? { min: rec.w[0], max: rec.w[1], speed: rec.w[2], type: rec.w[3] } : null,
    onUse: rec.u ? { ...rec.u } : null,
    skillFor: rec.sf || null,
    mhOnly: !!rec.mh,
    ohOnly: !!rec.oh,
    unique: !!rec.uq,
    notes: rec.no || [],
    rangedType: rec.r || null,
    icon: rec.ic || null,
    iconEstimated: !!rec.ie,
  };
}

let dbList = null;
let dbIndex = null;

export function dbItems() {
  if (!dbList) {
    dbList = ITEM_DB.map(itemFromDb);
    dbIndex = new Map(dbList.map((i) => [i.id, i]));
  }
  return dbList;
}

export function dbItem(id) {
  dbItems();
  return dbIndex.get(id) || null;
}

export function wowheadUrl(item) {
  return item && item.dbId ? `https://www.wowhead.com/forever/item=${item.dbId}` : null;
}

// Un chasseur porte la maille à partir du niveau 40.
export function wearable(item, level) {
  if (item.reqLevel && item.reqLevel > level) return false;
  if (item.armor === 'mail' && level < 40) return false;
  return true;
}

// Poids par défaut (PA = 1), mesurés sur le profil d’exemple niveau 60. Toucher, crit,
// hâte et réduction d’esquive en points de % ; arme en DPS d’arme.
// Mana (mp5, Intelligence) : 0 tant que le profil ne manque pas de mana, ce qui est le cas avec Resourcefulness.
export const DEFAULT_EP = { agi: 1.6, str: 1, ap: 1, hit: 12, crit: 24, haste: 10, expertise: 23, skill: 8, weapon: 14, weaponDmg: 4, mp5: 0, int: 0, spi: 0 };

// Poids par défaut adaptés au profil : sans Resourcefulness 2/2, le mana manque et le mp5
// et l’Intelligence prennent de la valeur (mesuré : ~4,4 et ~2 PA au niveau 60, ~3 et ~1,5 au niveau 30).
export function defaultEp(profile) {
  const ep = { ...DEFAULT_EP };
  if ((Number(profile?.talents?.resourcefulness) || 0) < 2) {
    const lvl30 = Number(profile?.level) === 30;
    ep.mp5 = lvl30 ? 3 : 4.4;
    ep.int = lvl30 ? 1.5 : 2;
  }
  return ep;
}

// Poids issus du calcul « Poids des stats » quand il existe, sinon poids par défaut du profil.
export function epFromWeights(rows, profile = null) {
  const ep = defaultEp(profile);
  for (const r of rows || []) if (Number.isFinite(r.ep) && r.key in ep) ep[r.key] = Math.max(0, r.ep);
  return ep;
}

// Compétence d’arme raciale du profil (ex. orc : +5 hache), qui compte dans la valeur d’une arme.
export function raceSkill(profile) {
  return (RACES[profile?.race] || {}).skill || {};
}

// Valeur d’un objet en PA. `offHand` : une arme en main gauche ne compte que pour les attaques auto.
// `creature` : type de la cible, pour les objets « PA contre… ».
export function itemScore(item, ep, factors, { offHand = false, raceSkill: racial = {}, creature = null } = {}) {
  const st = item.stats || {};
  const n = (k) => Number(st[k]) || 0;
  let v = n('agi') * ep.agi + n('str') * ep.str + n('ap') * ep.ap
    + (n('hit') + n('hitRating') / factors.hit) * ep.hit
    + (n('crit') + n('critRating') / factors.crit) * ep.crit
    + (n('haste') + n('hasteRating') / factors.haste) * ep.haste
    + (n('expertise') + n('expertiseRating') / factors.expertise) * ep.expertise
    + n('skill') * ep.skill + n('weaponDmg') * ep.weaponDmg
    + n('mp5') * (ep.mp5 || 0) + n('int') * (ep.int || 0) + n('spi') * (ep.spi || 0)
    + (creature && CREATURE_AP_KEYS[creature] ? n(CREATURE_AP_KEYS[creature]) * ep.ap : 0);
  const u = item.onUse;
  if (u && Number(u.value) && Number(u.cd)) {
    const uptime = Math.min(1, (Number(u.duration) || 0) / Number(u.cd));
    const per = { ap: ep.ap, agi: ep.agi, str: ep.str, haste: ep.haste, crit: ep.crit }[u.type] || 0;
    v += Number(u.value) * uptime * per;
  }
  if (item.weapon) {
    v += weaponDps(item.weapon) * ep.weapon * (offHand ? 0.35 : 1);
    v += (racial[item.weapon.type] || 0) * ep.skill * (offHand ? 0.35 : 1);
  }
  return v;
}

// Meilleur objet de la base pour chaque emplacement, selon les poids.
// `style` : '2h' ou 'dw' ; `maxQuality` : 2 vert, 3 bleu, 4 épique, 5 légendaire.
export function bestEquipment(profile, { ep = defaultEp(profile), factors = ratingFactors(profile), maxQuality = 4, style = '2h', pool = null } = {}) {
  const level = Number(profile.level) === 30 ? 30 : 60;
  const items = (pool || dbItems()).filter((i) => wearable(i, level) && (!i.quality || i.quality <= maxQuality));
  const racial = raceSkill(profile);
  const best = (type, { exclude = new Set(), filter = () => true, offHand = false } = {}) => {
    let top = null;
    let topV = 0;
    for (const i of items) {
      if (i.type !== type || exclude.has(i.id) || !filter(i)) continue;
      const v = itemScore(i, ep, factors, { offHand, raceSkill: racial, creature: profile.fight?.creatureType });
      if (v > topV) { topV = v; top = i; }
    }
    return top;
  };
  const eq = {};
  for (const slot of ['head', 'neck', 'shoulders', 'back', 'chest', 'wrists', 'hands', 'waist', 'legs', 'feet', 'ranged']) {
    const it = best(slot);
    if (it) eq[slot] = it.id;
  }
  for (const [type, a, b] of [['finger', 'finger1', 'finger2'], ['trinket', 'trinket1', 'trinket2']]) {
    const first = best(type);
    if (!first) continue;
    eq[a] = first.id;
    const second = best(type, { exclude: new Set([first.id]), filter: (i) => i.name !== first.name });
    if (second) eq[b] = second.id;
  }
  if (style === 'dw') {
    const mh = best('weapon1h', { filter: (i) => !i.ohOnly });
    if (mh) {
      eq.mainHand = mh.id;
      const oh = best('weapon1h', { exclude: new Set([mh.id]), filter: (i) => !i.mhOnly, offHand: true });
      if (oh) eq.offHand = oh.id;
    }
  } else {
    const th = best('weapon2h');
    if (th) eq.mainHand = th.id;
  }
  return eq;
}
