// Équipement : emplacements, objets, analyse de tooltip et fusion des objets dans le profil.

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
  { key: 'hit', label: 'Toucher (%)', short: 'toucher', pct: true },
  { key: 'crit', label: 'Critique (%)', short: 'crit', pct: true },
  { key: 'haste', label: 'Hâte (%)', short: 'hâte', pct: true },
  { key: 'expertise', label: 'Réduction esquive/parade (%)', short: 'réd. esq./par.', pct: true },
  { key: 'skill', label: 'Compétence d’arme', short: 'compétence' },
  { key: 'mp5', label: 'Mana toutes les 5 s', short: 'mp5' },
  { key: 'extraAttack', label: 'Attaque suppl. (% par coup)', short: 'att. suppl.', pct: true },
];

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
  return !!(item && slot && slot.accepts.includes(item.type));
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

export function itemSummary(item) {
  const parts = [];
  if (item.weapon) parts.push(`${fmtNum(item.weapon.min)}–${fmtNum(item.weapon.max)} · ${fmtNum(item.weapon.speed)} s · ${fmtNum(Math.round(weaponDps(item.weapon) * 10) / 10)} DPS`);
  for (const s of ITEM_STATS) {
    const v = Number(item.stats?.[s.key]) || 0;
    if (v) parts.push(s.pct ? `${fmtNum(v)} % ${s.short}` : `${fmtNum(v)} ${s.short}`);
  }
  if (item.onUse?.value) {
    const u = item.onUse;
    parts.push(`Utiliser : +${fmtNum(u.value)}${u.type === 'haste' || u.type === 'crit' ? ' %' : ''} ${ON_USE_TYPES[u.type] || u.type} (${fmtNum(u.duration)} s / ${fmtNum(u.cd)} s)`);
  }
  return parts.join(' · ') || 'Aucune stat';
}

// Équipe un objet en gardant un ensemble cohérent (2M ↔ main gauche).
export function equipItem(profile, items, slotId, itemId) {
  const eq = { ...(profile.equipment || {}) };
  const item = items.find((i) => i.id === itemId);
  eq[slotId] = itemId || null;
  if (item && item.type === 'weapon2h' && slotId === 'mainHand') eq.offHand = null;
  if (item && slotId === 'offHand') {
    const main = items.find((i) => i.id === eq.mainHand);
    if (main && main.type === 'weapon2h') eq.mainHand = null;
  }
  profile.equipment = eq;
  return profile;
}

function equippedItems(profile, items) {
  const eq = profile.equipment || {};
  const byId = new Map(items.map((i) => [i.id, i]));
  const out = {};
  for (const slot of SLOTS) {
    const it = byId.get(eq[slot.id]);
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

  for (const it of Object.values(eq)) {
    for (const s of ITEM_STATS) {
      const v = Number(it.stats?.[s.key]) || 0;
      if (!v) continue;
      if (s.key === 'extraAttack') extra += v;
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
    if ((m = line.match(/\+?\s*(\d+)\s*(?:attack power|à la puissance d['’]attaque|puissance d['’]attaque)/i) || line.match(/(?:attack power by|puissance d['’]attaque de)\s*(\d+)/i))) {
      add('ap', num(m[1]));
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

// ---------- objets d’exemple ----------

const EXAMPLE_60 = [
  { key: 'head', type: 'head', name: 'Heaume de pisteur', stats: { agi: 20, str: 10, sta: 15, hit: 1 } },
  { key: 'neck', type: 'neck', name: 'Collier de crocs', stats: { agi: 10, sta: 6, ap: 20 } },
  { key: 'shoulders', type: 'shoulders', name: 'Épaulières de traque', stats: { agi: 16, str: 8, sta: 12 } },
  { key: 'back', type: 'back', name: 'Cape du rôdeur', stats: { agi: 12, sta: 8, ap: 10, hit: 1 } },
  { key: 'chest', type: 'chest', name: 'Plastron de chasseur', stats: { agi: 22, str: 12, sta: 18, int: 10, crit: 1 } },
  { key: 'wrists', type: 'wrists', name: 'Brassards à lanières', stats: { agi: 10, str: 6, sta: 8 } },
  { key: 'hands', type: 'hands', name: 'Gants de dépeceur', stats: { agi: 12, str: 8, ap: 20, crit: 1 } },
  { key: 'waist', type: 'waist', name: 'Ceinture à crochets', stats: { agi: 14, str: 8, sta: 12, hit: 1 } },
  { key: 'legs', type: 'legs', name: 'Jambières de traqueur', stats: { agi: 20, str: 12, sta: 20, ap: 30 } },
  { key: 'feet', type: 'feet', name: 'Bottes de piste', stats: { agi: 14, str: 8, sta: 14, int: 10 } },
  { key: 'ring1', type: 'finger', name: 'Anneau de griffe', stats: { agi: 8, sta: 10, hit: 1 } },
  { key: 'ring2', type: 'finger', name: 'Chevalière du clan', stats: { str: 8, sta: 8, ap: 10, crit: 1 } },
  { key: 'trinket1', type: 'trinket', name: 'Talisman de chasse', stats: { ap: 30, hit: 1 } },
  { key: 'trinket2', type: 'trinket', name: 'Insigne de rage', stats: {}, onUse: { type: 'ap', value: 280, duration: 20, cd: 120 } },
  { key: 'twohand', type: 'weapon2h', name: 'Grande hache de guerre', stats: { str: 10, sta: 13 }, weapon: { min: 153, max: 256, speed: 3.8, type: 'axe' } },
  { key: 'mh', type: 'weapon1h', name: 'Épée longue du clan', stats: { agi: 6, sta: 6 }, weapon: { min: 81, max: 151, speed: 2.8, type: 'sword' } },
  { key: 'oh', type: 'weapon1h', name: 'Épée courte du clan', stats: { agi: 5 }, weapon: { min: 52, max: 98, speed: 1.8, type: 'sword' } },
  { key: 'ranged', type: 'ranged', name: 'Arc en if', stats: { agi: 10, hit: 1 } },
  // Alternatives pour essayer le comparateur.
  { key: 'head-alt', type: 'head', name: 'Casque de précision', stats: { agi: 14, sta: 10, hit: 2, crit: 1 } },
  { key: 'hands-alt', type: 'hands', name: 'Gantelets de force', stats: { str: 22, sta: 10, crit: 1 } },
  { key: 'trinket-alt', type: 'trinket', name: 'Œil du faucon', stats: { crit: 2 } },
  { key: 'staff', type: 'weapon2h', name: 'Bâton de la bête', stats: { agi: 22, sta: 15 }, weapon: { min: 140, max: 211, speed: 3.2, type: 'staff' } },
];

const WEAPONS_30 = {
  twohand: { min: 60, max: 91, speed: 3.4, type: 'axe' },
  mh: { min: 26, max: 49, speed: 2.6, type: 'sword' },
  oh: { min: 19, max: 36, speed: 1.9, type: 'sword' },
  staff: { min: 55, max: 84, speed: 3.0, type: 'staff' },
};

function scaleStats(stats) {
  const out = {};
  for (const s of ITEM_STATS) {
    const v = Number(stats[s.key]) || 0;
    if (!v) continue;
    const scaled = s.pct ? Math.floor(v / 2) : Math.round(v * (s.key === 'ap' ? 0.2 : 0.35));
    if (scaled) out[s.key] = scaled;
  }
  return out;
}

export function exampleItems() {
  const items = [];
  for (const e of EXAMPLE_60) {
    items.push({ id: `ex60-${e.key}`, name: `${e.name} (exemple)`, type: e.type, level: 60, source: 'exemple', stats: { ...e.stats }, weapon: e.weapon ? { ...e.weapon } : null, onUse: e.onUse ? { ...e.onUse } : null });
  }
  for (const e of EXAMPLE_60) {
    const onUse = e.onUse ? { ...e.onUse, value: Math.round(e.onUse.value * 0.3) } : null;
    const weapon = e.weapon ? { ...WEAPONS_30[e.key] } : null;
    items.push({ id: `ex30-${e.key}`, name: `${e.name} niv. 30 (exemple)`, type: e.type, level: 30, source: 'exemple', stats: scaleStats(e.stats), weapon, onUse });
  }
  return items;
}

const SET_2H = { head: 'head', neck: 'neck', shoulders: 'shoulders', back: 'back', chest: 'chest', wrists: 'wrists', hands: 'hands', waist: 'waist', legs: 'legs', feet: 'feet', finger1: 'ring1', finger2: 'ring2', trinket1: 'trinket1', trinket2: 'trinket2', mainHand: 'twohand', ranged: 'ranged' };

export function exampleEquipment(level, dualWield = false) {
  const prefix = level === 30 ? 'ex30' : 'ex60';
  const eq = {};
  for (const [slot, key] of Object.entries(SET_2H)) eq[slot] = `${prefix}-${key}`;
  if (dualWield) {
    eq.mainHand = `${prefix}-mh`;
    eq.offHand = `${prefix}-oh`;
  }
  return eq;
}
