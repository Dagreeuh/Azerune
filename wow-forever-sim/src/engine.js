// Moteur Monte-Carlo du sim Survie mêlée (WoW Forever).
// Table d’attaque et formules reprises de Classic (wowsims/sod, magey),
// modifiées par les changements Forever décrits dans data.js.

import { BASE_STATS, BUFFS, ON_USE_PRESETS, RACES, TALENTS, defaultMechanics } from './data.js';

// Générateur pseudo-aléatoire déterministe (mulberry32).
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function iterationSeed(base, i) {
  let h = (base ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function byLevel(stats, level) {
  if (stats && (stats[60] || stats[30])) return stats[level] || {};
  return stats || {};
}

// Table d’attaque Classic contre une cible (en pourcentages).
export function attackTable(level, bossLevel, skillBonus, expertise, M) {
  const baseSkill = level * 5;
  const skill = baseSkill + skillBonus;
  const defense = bossLevel * 5;
  const diff = defense - skill;
  const baseDiff = defense - baseSkill;

  let miss;
  let hitSuppression;
  if (diff > 10) {
    hitSuppression = (diff - 10) * 0.2;
    miss = 5 + diff * 0.2;
  } else {
    hitSuppression = 0;
    miss = 5 + diff * 0.1;
  }

  const dodge = Math.max(0, 5 + diff * 0.1 - expertise);
  const parry = Math.max(0, (baseDiff > 10 ? 5 + baseDiff * 0.6 : 5 + baseDiff * 0.1) - expertise);
  const glance = M.glancing ? Math.max(0, 10 + baseDiff * 2) : 0;
  const glanceMin = clamp(1.3 - 0.05 * diff, 0.01, 0.91);
  const glanceMax = clamp(1.2 - 0.03 * diff, 0.2, 0.99);

  let critSuppression = 0;
  if (M.critSuppression) {
    critSuppression = defense > baseSkill ? baseDiff * 0.2 : baseDiff * 0.04;
    if (bossLevel - level >= 3) critSuppression += 1.8;
  }

  return { skill, miss: Math.max(0, miss), hitSuppression, dodge, parry, glance, glanceMin, glanceMax, critSuppression };
}

function spellMissBase(levelDiff) {
  if (levelDiff <= 0) return 4;
  if (levelDiff === 1) return 5;
  if (levelDiff === 2) return 6;
  return 17 + (levelDiff - 3) * 11;
}

function onUseFromTrinket(tr) {
  if (!tr || tr.preset === 'none') return null;
  const preset = ON_USE_PRESETS[tr.preset];
  if (!preset) return null;
  const src = tr.preset === 'custom' ? { ...preset, ...tr } : preset;
  const value = Number(src.value) || 0;
  const duration = Number(src.duration) || 0;
  const cd = Number(src.cd) || 0;
  if (!value || !duration || !cd) return null;
  return { name: src.name, type: src.type, value, duration, cd };
}

// Transforme un profil (saisie de l’utilisateur) en personnage prêt à simuler.
export function buildCharacter(profile) {
  const L = Number(profile.level) === 30 ? 30 : 60;
  const M = { ...defaultMechanics(L), ...(profile.mechanics || {}) };
  const fight = profile.fight || {};
  const bossLevel = Number(fight.bossLevel) || L + 3;

  const T = {};
  for (const def of TALENTS) {
    let v = clamp(Math.round(Number(profile.talents?.[def.id]) || 0), 0, def.max);
    if (def.minLevel && L < def.minLevel) v = 0;
    T[def.id] = v;
  }

  const race = RACES[profile.race] || RACES.orc;
  const classBase = BASE_STATS[L];
  const base = {};
  for (const k of ['str', 'agi', 'sta', 'int', 'spi']) base[k] = classBase[k] + (race.offsets[k] || 0);

  const add = { str: 0, agi: 0, sta: 0, int: 0, spi: 0, ap: 0, crit: 0, hit: 0, mp5: 0, expertise: 0, skill: 0, weaponDmg: 0, armorReduction: 0, windfuryAp: 0 };
  const statPct = [];
  const haste = [];
  let manaPotion = false;
  let manaRune = false;

  const gear = profile.gear || {};
  for (const k of Object.keys(add)) add[k] += Number(gear[k]) || 0;
  if (Number(gear.haste)) haste.push(Number(gear.haste));

  const usedGroups = new Set();
  const activeBuffs = [];
  for (const id of profile.buffs || []) {
    const def = BUFFS.find((b) => b.id === id);
    if (!def) continue;
    if (def.group) {
      if (usedGroups.has(def.group)) continue;
      usedGroups.add(def.group);
    }
    activeBuffs.push(def.id);
    const s = byLevel(def.stats, L);
    for (const [k, v] of Object.entries(s)) {
      if (k === 'statPct') statPct.push(v);
      else if (k === 'haste') haste.push(v);
      else if (k === 'manaPotion') manaPotion = true;
      else if (k === 'manaRune') manaRune = true;
      else if (k in add) add[k] += v;
    }
  }

  const twoHand = profile.twoHand !== false;
  const dw = !twoHand && !!profile.oh;
  const weaponsIn = [profile.mh, dw ? profile.oh : null];
  for (const w of weaponsIn) {
    if (!w) continue;
    if (w.enchant === 'agility') add.agi += twoHand ? 25 : 15;
    if (w.enchant === 'strength') add.str += 15;
    if (w.enchant === 'counterweight' && twoHand) haste.push(3);
  }

  const custom = profile.custom || {};
  add.ap += Number(custom.ap) || 0;
  add.crit += Number(custom.crit) || 0;

  if (profile.aspect === 'beast') add.ap += Number(M.beastAp) || 0;
  add.hit += T.surefooted * M.surefootedPerRank;

  const statMult = statPct.reduce((m, p) => m * (1 + p / 100), 1);
  const agiMult = statMult * (1 + (T.lightningReflexes * M.lightningReflexesPerRank) / 100);
  const strMult = statMult;

  const str = (base.str + add.str) * strMult;
  const agi = (base.agi + add.agi) * agiMult;
  const int = (base.int + add.int) * statMult;
  const spi = (base.spi + add.spi) * statMult;

  const levelAp = L * 2 - 20;
  const ap = levelAp + str * M.apPerStr + agi * M.apPerAgi + add.ap;
  const baseApForRacial = levelAp + base.str * M.apPerStr + base.agi * M.apPerAgi;
  const crit = M.baseCrit + agi / M.agiPerCrit + add.crit;
  const hit = add.hit;
  const hasteStatic = haste.reduce((m, h) => m * (1 + h / 100), 1);

  const manaMax = classBase.mana + Math.min(20, int) + Math.max(0, int - 20) * 15;
  const spiritTick = 15 + spi / 5;

  const peCrit = (T.predatorsEdge * M.predatorCritPerRank) / 100;
  const critMult = M.predatorCritMode === 'total' ? 2 * (1 + peCrit) : 1 + (1 + peCrit);

  const trackMult = fight.trackedType !== false ? 1 + (T.improvedTracking * M.improvedTrackingPerRank) / 100 : 1;
  const petActive = !!profile.pet?.enabled;
  const ffMult = petActive ? 1 + (T.focusedFire * M.focusedFirePerRank) / 100 : 1;
  const dmgMult = (1 + (Number(custom.dmgPct) || 0) / 100) * trackMult * ffMult;
  const savage = T.savageStrikes * M.savageStrikesPerRank;
  const meleeMult = dmgMult * (M.savageStrikesMode === 'damage' ? 1 + savage / 100 : 1);
  const specialCritBonus = M.savageStrikesMode === 'crit' ? savage : 0;

  const armor = Math.max(0, (Number(fight.bossArmor) || 0) - add.armorReduction);
  const armorMult = 1 - armor / (armor + 400 + 85 * L);

  const behind = fight.behind !== false;

  function makeWeapon(w, isOH) {
    const min = Math.max(0, Number(w.min) || 0);
    const max = Math.max(min, Number(w.max) || 0);
    const speed = Math.max(0.5, Number(w.speed) || 2);
    const skillBonus = add.skill + (race.skill[w.type] || 0);
    const mult = isOH ? (M.ohPenalty / 100) * (1 + (T.predatorsEdge * M.predatorOhPerRank) / 100) : 1;
    return {
      isOH, min, max, speed, type: w.type, enchant: w.enchant || 'none', flat: add.weaponDmg, mult,
      table: attackTable(L, bossLevel, skillBonus, add.expertise, M),
    };
  }
  const mh = makeWeapon(profile.mh || { min: 1, max: 2, speed: 2 }, false);
  const oh = dw ? makeWeapon(profile.oh, true) : null;

  const resourceful = 1 - (T.resourcefulness * M.resourcefulnessPerRank) / 100;
  const costs = {
    raptor: M.raptorMana * resourceful,
    mongoose: M.mongooseMana * resourceful,
    striderKick: ((classBase.mana * M.striderManaPct) / 100) * resourceful,
    counterattack: M.counterMana * resourceful,
    immolation: M.trapMana * resourceful,
  };

  const beingAttacked = !!fight.beingAttacked;
  const known = {
    mongoose: true,
    raptor: true,
    striderKick: T.striderKick > 0,
    counterattack: T.counterattack > 0 && beingAttacked,
    immolation: true,
  };
  const rotation = (profile.rotation || [])
    .filter((r) => r.enabled && known[r.id])
    .map((r) => ({ id: r.id, minMana: clamp(Number(r.minMana) || 0, 0, 100) }));
  const raptorEnabled = rotation.some((r) => r.id === 'raptor');
  const gcdRotation = rotation.filter((r) => !(r.id === 'raptor' && M.raptorMode !== 'instant'));
  const enabledCosts = rotation.map((r) => costs[r.id]);
  const minCost = enabledCosts.length ? Math.min(...enabledCosts) : 0;

  const cooldowns = [];
  if (profile.racial !== false) {
    if (race.cooldown === 'bloodFury') {
      cooldowns.push({ id: 'bloodFury', name: 'Fureur sanguinaire', type: 'ap', value: (baseApForRacial * M.bloodFuryPct) / 100, duration: 15, cd: 120 });
    } else if (race.cooldown === 'berserking') {
      cooldowns.push({ id: 'berserking', name: 'Berserker', type: 'haste', value: M.berserkingHaste, duration: 10, cd: 180 });
    }
  }
  (profile.trinkets || []).forEach((tr, i) => {
    const cd = onUseFromTrinket(tr);
    if (cd) cooldowns.push({ ...cd, id: `trinket${i}` });
  });

  const huntersMark = profile.huntersMark !== false;
  const exposePreyChance = huntersMark ? T.exposePrey * M.exposePreyChance : 0;
  const trapMiss = Math.max(1, spellMissBase(bossLevel - L) - hit - T.survivalTactics * M.survivalTacticsPerRank);
  const trapTicks = Math.max(1, Math.round(M.trapDuration / 3));

  return {
    level: L, bossLevel, M, T, race,
    stats: { str, agi, int, spi, ap, crit, hit, hasteStatic, mp5: add.mp5, expertise: add.expertise },
    strMult, agiMult, baseApForRacial,
    manaMax, spiritTick, baseMana: classBase.mana,
    mh, oh, dw, twoHand, behind,
    critMult, dmgMult, meleeMult, specialCritBonus, armor, armorMult,
    costs, rotation, gcdRotation, raptorEnabled, minCost, cooldowns,
    huntersMark, exposePreyChance,
    lacerating: T.laceratingStrikes > 0,
    deadlyAspects: T.deadlyAspects > 0 && profile.aspect === 'beast',
    windfuryAp: add.windfuryAp,
    extraAttackChance: Number(profile.extraAttackChance) || 0,
    resourcefulnessProc: T.resourcefulness > 0 ? M.resourcefulnessProc : 0,
    manaPotion, manaRune,
    trapMiss, trapTicks, trapMult: dmgMult * (1 + (T.cleverTraps * M.cleverTrapsPerRank) / 100),
    trapCd: M.trapCd * (1 - (T.survivalistsDiscipline * M.survivalistsDiscipline) / 100),
    beingAttacked, bossSwing: Math.max(0.5, Number(fight.bossSwing) || 2),
    playerDodge: Number(fight.playerDodge) || 0, playerParry: Number(fight.playerParry) || 0,
    pet: petActive ? (Number(profile.pet.dps) || 0) * ffMult : 0,
    activeBuffs,
  };
}

const METRIC_IDS = ['mh', 'oh', 'extra', 'raptor', 'mongoose', 'striderKick', 'counterattack', 'lacerating', 'immolation'];

function newMetrics() {
  const m = {};
  for (const id of METRIC_IDS) m[id] = { dmg: 0, casts: 0, hits: 0, crits: 0, miss: 0, dodge: 0, parry: 0, glance: 0, ticks: 0 };
  return m;
}

// Simule un combat. `log` (tableau) reçoit le journal des `logLimit` premières secondes.
export function simulateOnce(C, rng, duration, log = null, logLimit = 60) {
  const M = C.M;
  const metrics = newMetrics();
  let t = 0;
  let mana = C.manaMax;
  let lastSpend = -100;
  let gcdReady = 0;
  const cdReady = { raptor: 0, mongoose: 0, striderKick: 0, counterattack: 0, immolation: 0 };
  let mbUntil = -1;
  let mbAvail = 0;
  let caUntil = -1;
  let caAvail = 0;
  let rsQueued = false;
  let oomTime = 0;
  let potionReady = 0;
  let runeReady = 0;
  const procs = { exposePrey: 0, dodgeWindows: 0, parryWindows: 0, deadlyAspects: 0, windfury: 0, crusader: 0, potions: 0 };
  const cdReadyAt = C.cooldowns.map(() => 0);

  const dyn = { ap: 0, str: 0, agi: 0, crit: 0 };
  let regenWhileCasting = 0;
  let haste = C.stats.hasteStatic;
  const auras = [];

  let nextMH = 0;
  let nextOH = C.dw ? rng() * 0.3 : Infinity;
  let nextRegen = rng() * 2;
  let nextBoss = C.beingAttacked ? rng() * C.bossSwing : Infinity;
  let nextDecide = 0;
  const bleed = { perTick: 0, ticksLeft: 0, next: Infinity };
  const trap = { triggerAt: Infinity, perTick: 0, ticksLeft: 0, next: Infinity };

  const say = log ? (text) => { if (t <= logLimit) log.push({ t, text, mana }); } : null;

  const currentAP = () => C.stats.ap + dyn.ap + dyn.str * C.strMult * M.apPerStr + dyn.agi * C.agiMult * M.apPerAgi;
  const currentCrit = () => C.stats.crit + dyn.crit + (dyn.agi * C.agiMult) / M.agiPerCrit;
  const effHit = (tbl) => Math.max(0, C.stats.hit - tbl.hitSuppression);

  function setHaste(newHaste) {
    if (newHaste === haste) return;
    const ratio = haste / newHaste;
    if (nextMH > t && Number.isFinite(nextMH)) nextMH = t + (nextMH - t) * ratio;
    if (nextOH > t && Number.isFinite(nextOH)) nextOH = t + (nextOH - t) * ratio;
    haste = newHaste;
  }

  function applyEffect(a, sign) {
    if (a.stat === 'haste') {
      a.active = sign > 0;
      let h = C.stats.hasteStatic;
      for (const o of auras) if (o.stat === 'haste' && o.active) h *= 1 + o.value / 100;
      setHaste(h);
    } else if (a.stat === 'regen') {
      regenWhileCasting += sign;
    } else {
      dyn[a.stat] += sign * a.value;
    }
  }

  function applyAura(id, stat, value, dur) {
    const existing = auras.find((a) => a.id === id);
    if (existing) {
      existing.until = t + dur;
      return;
    }
    const a = { id, stat, value, until: t + dur, active: false };
    auras.push(a);
    applyEffect(a, 1);
  }

  function expireAuras() {
    for (let i = auras.length - 1; i >= 0; i--) {
      const a = auras[i];
      if (a.until <= t) {
        auras.splice(i, 1);
        applyEffect(a, -1);
        if (say) say(`Fin de ${a.id}`);
      }
    }
  }

  function spend(cost) {
    mana -= cost;
    lastSpend = t;
  }

  function weaponDamage(w, extraAp = 0) {
    const base = w.min + rng() * (w.max - w.min);
    return (base + ((currentAP() + extraAp) / M.apPerDps) * w.speed + w.flat) * w.mult;
  }

  function onHit(w, isWhite, isCrit, isExtra) {
    if (C.exposePreyChance > 0 && (isWhite || M.exposePreyOn === 'all')) {
      if (rng() * 100 < C.exposePreyChance) {
        if (t >= mbUntil) mbAvail = t + M.reaction;
        mbUntil = t + M.exposePreyWindow;
        procs.exposePrey++;
        if (say) say('Expose Prey : Mongoose Bite disponible');
      }
    }
    if (isWhite && C.deadlyAspects && rng() * 100 < M.deadlyAspectsChance) {
      applyAura('deadlyAspects', 'haste', M.deadlyAspectsHaste, M.deadlyAspectsDuration);
      procs.deadlyAspects++;
      if (say) say('Deadly Aspects : +vitesse d’attaque');
    }
    if (w.enchant === 'crusader' && rng() < w.speed / 60) {
      applyAura(w.isOH ? 'crusaderOH' : 'crusaderMH', 'str', 100, 15);
      procs.crusader++;
    }
    if (isCrit && C.resourcefulnessProc > 0 && rng() * 100 < C.resourcefulnessProc) {
      applyAura('resourcefulness', 'regen', 1, 30);
    }
    if (!isExtra && !w.isOH && C.windfuryAp > 0 && rng() * 100 < M.windfuryChance) {
      procs.windfury++;
      if (say) say('Furie-des-vents : attaque supplémentaire');
      whiteAttack(C.mh, C.windfuryAp, true);
    } else if (!isExtra && C.extraAttackChance > 0 && rng() * 100 < C.extraAttackChance) {
      whiteAttack(C.mh, 0, true);
    }
  }

  function whiteAttack(w, extraAp = 0, isExtra = false) {
    const id = w.isOH ? 'oh' : isExtra ? 'extra' : 'mh';
    const m = metrics[id];
    const tbl = w.table;
    m.casts++;
    const dwPenalty = C.dw && !rsQueued ? M.dwMissPenalty : 0;
    const miss = Math.max(0, tbl.miss + dwPenalty - effHit(tbl));
    const r = rng() * 100;
    let acc = miss;
    if (r < acc) { m.miss++; if (say) say(`${label(id)} : raté`); return; }
    acc += tbl.dodge;
    if (r < acc) { m.dodge++; if (say) say(`${label(id)} : esquivé`); return; }
    if (!C.behind) {
      acc += tbl.parry;
      if (r < acc) { m.parry++; if (say) say(`${label(id)} : paré`); return; }
    }
    let dmg = weaponDamage(w, extraAp) * C.meleeMult * C.armorMult;
    let isCrit = false;
    acc += tbl.glance;
    if (r < acc) {
      dmg *= tbl.glanceMin + rng() * (tbl.glanceMax - tbl.glanceMin);
      m.glance++;
    } else {
      acc += Math.max(0, currentCrit() - tbl.critSuppression);
      if (r < acc) { dmg *= C.critMult; isCrit = true; m.crits++; } else m.hits++;
    }
    m.dmg += dmg;
    if (say) say(`${label(id)} : ${Math.round(dmg)}${isCrit ? ' (crit)' : ''}`);
    onHit(w, true, isCrit, isExtra);
  }

  function yellowAttack(id, raw, noAvoid = false) {
    const m = metrics[id];
    const tbl = C.mh.table;
    m.casts++;
    const r = rng() * 100;
    let acc = Math.max(0, tbl.miss - effHit(tbl));
    if (r < acc) { m.miss++; if (say) say(`${label(id)} : raté`); return null; }
    if (!noAvoid) {
      acc += tbl.dodge;
      if (r < acc) { m.dodge++; if (say) say(`${label(id)} : esquivé`); return null; }
      if (!C.behind) {
        acc += tbl.parry;
        if (r < acc) { m.parry++; if (say) say(`${label(id)} : paré`); return null; }
      }
    }
    const isCrit = rng() * 100 < currentCrit() + C.specialCritBonus - tbl.critSuppression;
    let dmg = raw() * C.meleeMult * C.armorMult;
    if (isCrit) { dmg *= C.critMult; m.crits++; } else m.hits++;
    m.dmg += dmg;
    if (say) say(`${label(id)} : ${Math.round(dmg)}${isCrit ? ' (crit)' : ''}`);
    onHit(C.mh, false, isCrit, false);
    return { dmg, isCrit };
  }

  function applyBleed(dmg) {
    const total = (dmg * M.laceratingPct) / 100;
    const ticks = Math.max(1, Math.round(M.laceratingDuration / M.laceratingTick));
    let pool = total;
    if (M.laceratingRefresh === 'rolling' && bleed.ticksLeft > 0) pool += bleed.perTick * bleed.ticksLeft;
    bleed.perTick = pool / ticks;
    bleed.ticksLeft = ticks;
    bleed.next = t + M.laceratingTick;
  }

  function cast(id) {
    const cost = C.costs[id];
    spend(cost);
    if (id !== 'raptor' || M.raptorMode === 'instant') gcdReady = t + M.gcd;
    if (say) say(`Lance ${label(id)} (−${Math.round(cost)} mana)`);
    switch (id) {
      case 'mongoose': {
        mbUntil = -1;
        cdReady.mongoose = t + M.mongooseCd;
        const res = yellowAttack('mongoose', () => weaponDamage(C.mh) + M.mongooseBonus);
        if (res && C.lacerating) applyBleed(res.dmg);
        break;
      }
      case 'raptor':
        cdReady.raptor = t + M.raptorCd;
        yellowAttack('raptor', () => weaponDamage(C.mh) + M.raptorBonus);
        break;
      case 'striderKick':
        cdReady.striderKick = t + M.striderCd;
        yellowAttack('striderKick', () => (weaponDamage(C.mh) * M.striderWeaponPct) / 100);
        break;
      case 'counterattack':
        caUntil = -1;
        cdReady.counterattack = t + M.counterCd;
        yellowAttack('counterattack', () => (weaponDamage(C.mh) * M.counterWeaponPct) / 100 + M.counterBonus, true);
        break;
      case 'immolation':
        cdReady.immolation = t + C.trapCd;
        metrics.immolation.casts++;
        trap.triggerAt = t + M.trapArm;
        break;
      default:
        break;
    }
  }

  function usable(r) {
    const id = r.id;
    if (t < cdReady[id]) return false;
    const cost = C.costs[id];
    if (mana < cost) return false;
    if (r.minMana > 0 && (mana / C.manaMax) * 100 < r.minMana) return false;
    if (id === 'mongoose') return t < mbUntil && t >= mbAvail;
    if (id === 'counterattack') return t < caUntil && t >= caAvail;
    if (id === 'immolation') return trap.ticksLeft === 0 && trap.triggerAt === Infinity;
    return true;
  }

  function decide() {
    // Recharges hors GCD : raciaux, bijoux, potions.
    for (let i = 0; i < C.cooldowns.length; i++) {
      if (t >= cdReadyAt[i]) {
        const cd = C.cooldowns[i];
        applyAura(cd.id, cd.type, cd.value, cd.duration);
        cdReadyAt[i] = t + cd.cd;
        if (say) say(`Utilise ${cd.name}`);
      }
    }
    if (C.manaPotion && t >= potionReady && C.manaMax - mana >= 2250) {
      mana += 1350 + rng() * 900;
      potionReady = t + 120;
      procs.potions++;
      if (say) say('Potion de mana');
    }
    if (C.manaRune && t >= runeReady && C.manaMax - mana >= 1500) {
      mana += 900 + rng() * 600;
      runeReady = t + 120;
      procs.potions++;
      if (say) say('Rune démoniaque');
    }

    if (C.raptorEnabled && M.raptorMode !== 'instant') {
      const r = C.rotation.find((x) => x.id === 'raptor');
      if (M.raptorMode === 'nextSwing') {
        if (!rsQueued && usable(r)) rsQueued = true;
      } else if (usable(r)) {
        cast('raptor');
      }
    }

    if (t >= gcdReady) {
      for (const r of C.gcdRotation) {
        if (usable(r)) { cast(r.id); break; }
      }
    }

    // Prochain moment où une décision peut changer.
    let next = Infinity;
    const consider = (x) => { if (x > t && x < next) next = x; };
    consider(gcdReady);
    for (const r of C.rotation) consider(cdReady[r.id]);
    if (mbUntil > t) consider(mbAvail);
    if (caUntil > t) consider(caAvail);
    for (const x of cdReadyAt) consider(x);
    if (C.manaPotion) consider(potionReady);
    if (C.manaRune) consider(runeReady);
    nextDecide = next;
  }

  function mhSwing() {
    if (rsQueued) {
      rsQueued = false;
      const cost = C.costs.raptor;
      if (mana >= cost && t >= cdReady.raptor) {
        spend(cost);
        cdReady.raptor = t + M.raptorCd;
        yellowAttack('raptor', () => weaponDamage(C.mh) + M.raptorBonus);
      } else {
        whiteAttack(C.mh);
      }
    } else {
      whiteAttack(C.mh);
    }
    nextMH = t + C.mh.speed / haste;
  }

  function regenTick() {
    let gain = (C.stats.mp5 * 2) / 5;
    if (t - lastSpend >= 5) gain += C.spiritTick;
    else if (regenWhileCasting > 0) gain += C.spiritTick * 0.5;
    mana = Math.min(C.manaMax, mana + gain);
    nextRegen = t + 2;
  }

  function bossSwing() {
    const r = rng() * 100;
    if (r < C.playerDodge) {
      if (t >= mbUntil) mbAvail = t + M.reaction;
      mbUntil = Math.max(mbUntil, t + M.dodgeWindow);
      procs.dodgeWindows++;
      if (say) say('Vous esquivez : Mongoose Bite disponible');
    } else if (r < C.playerDodge + C.playerParry && C.T.counterattack > 0) {
      if (t >= caUntil) caAvail = t + M.reaction;
      caUntil = t + 5;
      procs.parryWindows++;
      if (say) say('Vous parez : Counterattack disponible');
    }
    nextBoss = t + C.bossSwing;
  }

  function trapTrigger() {
    trap.triggerAt = Infinity;
    if (rng() * 100 < C.trapMiss) {
      metrics.immolation.miss++;
      if (say) say('Piège d’immolation : résisté');
      return;
    }
    metrics.immolation.hits++;
    trap.ticksLeft = C.trapTicks;
    trap.perTick = (M.trapDamage * C.trapMult) / C.trapTicks;
    trap.next = t + M.trapDuration / C.trapTicks;
  }

  decide();
  while (true) {
    let nextExpire = Infinity;
    for (const a of auras) if (a.until < nextExpire) nextExpire = a.until;
    const tn = Math.min(nextExpire, nextRegen, bleed.next, trap.triggerAt, trap.next, nextBoss, nextMH, nextOH, nextDecide);
    if (tn > duration) {
      if (mana < C.minCost) oomTime += duration - t;
      break;
    }
    if (mana < C.minCost) oomTime += tn - t;
    t = tn;

    if (tn === nextExpire) expireAuras();
    else if (tn === nextRegen) regenTick();
    else if (tn === bleed.next) {
      let dmg = bleed.perTick;
      if (M.laceratingCanCrit && rng() * 100 < currentCrit() + C.specialCritBonus - C.mh.table.critSuppression) {
        dmg *= C.critMult;
        metrics.lacerating.crits++;
      }
      metrics.lacerating.dmg += dmg;
      metrics.lacerating.ticks++;
      bleed.ticksLeft--;
      bleed.next = bleed.ticksLeft > 0 ? t + M.laceratingTick : Infinity;
    } else if (tn === trap.triggerAt) trapTrigger();
    else if (tn === trap.next) {
      metrics.immolation.dmg += trap.perTick;
      metrics.immolation.ticks++;
      trap.ticksLeft--;
      trap.next = trap.ticksLeft > 0 ? t + M.trapDuration / C.trapTicks : Infinity;
    } else if (tn === nextBoss) bossSwing();
    else if (tn === nextMH) mhSwing();
    else if (tn === nextOH) {
      whiteAttack(C.oh);
      nextOH = t + C.oh.speed / haste;
    } else nextDecide = Infinity;

    decide();
  }

  let total = 0;
  for (const id of METRIC_IDS) total += metrics[id].dmg;
  return { damage: total, duration, metrics, oomTime, procs, manaEnd: mana };
}

const LABELS = {
  mh: 'Attaque auto (main droite)',
  oh: 'Attaque auto (main gauche)',
  extra: 'Attaques supplémentaires',
  raptor: 'Raptor Strike',
  mongoose: 'Mongoose Bite',
  striderKick: 'Strider Kick',
  counterattack: 'Counterattack',
  lacerating: 'Lacerating Strikes (saignement)',
  immolation: 'Piège d’immolation',
  pet: 'Familier (estimation)',
};

export function label(id) {
  return LABELS[id] || id;
}

// Accumulateur : permet de lancer les itérations par paquets sans bloquer l’interface.
export function createAccumulator() {
  return { n: 0, dps: [], damage: 0, duration: 0, oom: 0, metrics: newMetrics(), procs: {} };
}

export function simulateBatch(C, profile, acc, start, count, seed = 1) {
  const fight = profile.fight || {};
  const base = Math.max(10, Number(fight.duration) || 180);
  const variance = clamp(Number(fight.variance) || 0, 0, 50) / 100;
  for (let i = start; i < start + count; i++) {
    const rng = makeRng(iterationSeed(seed, i));
    const duration = base * (1 - variance + 2 * variance * rng());
    const res = simulateOnce(C, rng, duration);
    const dps = res.damage / duration + C.pet;
    acc.dps.push(dps);
    acc.damage += res.damage;
    acc.duration += duration;
    acc.oom += res.oomTime;
    for (const id of METRIC_IDS) {
      const a = acc.metrics[id];
      const b = res.metrics[id];
      for (const k of Object.keys(a)) a[k] += b[k];
    }
    for (const [k, v] of Object.entries(res.procs)) acc.procs[k] = (acc.procs[k] || 0) + v;
    acc.n++;
  }
  return acc;
}

export function summarize(C, acc) {
  const n = acc.n || 1;
  const mean = acc.dps.reduce((s, x) => s + x, 0) / n;
  const variance = acc.dps.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, n - 1);
  const sd = Math.sqrt(variance);
  const sorted = [...acc.dps].sort((a, b) => a - b);
  const avgDuration = acc.duration / n;
  const breakdown = [];
  for (const id of METRIC_IDS) {
    const m = acc.metrics[id];
    if (m.dmg <= 0 && m.casts <= 0) continue;
    const landed = m.hits + m.crits + m.glance;
    breakdown.push({
      id,
      name: label(id),
      dps: m.dmg / acc.duration,
      share: 0,
      casts: m.casts / n,
      ticks: m.ticks / n,
      avgHit: m.ticks ? m.dmg / m.ticks : landed ? m.dmg / landed : 0,
      critPct: m.ticks ? (m.crits / m.ticks) * 100 : landed ? (m.crits / landed) * 100 : 0,
      missPct: m.casts ? (m.miss / m.casts) * 100 : 0,
      dodgePct: m.casts ? (m.dodge / m.casts) * 100 : 0,
      parryPct: m.casts ? (m.parry / m.casts) * 100 : 0,
      glancePct: m.casts ? (m.glance / m.casts) * 100 : 0,
    });
  }
  if (C.pet > 0) breakdown.push({ id: 'pet', name: label('pet'), dps: C.pet, share: 0, casts: 0, ticks: 0, avgHit: 0, critPct: 0, missPct: 0, dodgePct: 0, parryPct: 0, glancePct: 0 });
  const totalDps = breakdown.reduce((s, b) => s + b.dps, 0) || 1;
  for (const b of breakdown) b.share = (b.dps / totalDps) * 100;
  breakdown.sort((a, b) => b.dps - a.dps);
  const procs = {};
  for (const [k, v] of Object.entries(acc.procs)) procs[k] = v / n;
  return {
    iterations: acc.n,
    mean,
    sd,
    se: sd / Math.sqrt(n),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    p5: sorted[Math.floor(0.05 * (sorted.length - 1))] ?? 0,
    p95: sorted[Math.floor(0.95 * (sorted.length - 1))] ?? 0,
    avgDuration,
    oomPct: (acc.oom / acc.duration) * 100,
    breakdown,
    procs,
    dps: acc.dps,
  };
}

export function runSim(profile, { iterations = 1000, seed = 1 } = {}) {
  const C = buildCharacter(profile);
  const acc = createAccumulator();
  simulateBatch(C, profile, acc, 0, iterations, seed);
  return summarize(C, acc);
}

// Journal d’un combat (pour comprendre la rotation).
export function combatLog(profile, { seed = 1, seconds = 60 } = {}) {
  const C = buildCharacter(profile);
  const rng = makeRng(iterationSeed(seed, 0));
  const log = [];
  simulateOnce(C, rng, seconds, log, seconds);
  return log;
}

// Feuille de personnage (valeurs affichées dans l’interface).
export function characterSheet(profile) {
  const C = buildCharacter(profile);
  const tbl = C.mh.table;
  const hit = Math.max(0, C.stats.hit - tbl.hitSuppression);
  return {
    C,
    ap: C.stats.ap,
    agi: C.stats.agi,
    str: C.stats.str,
    crit: C.stats.crit,
    critVsBoss: C.stats.crit - tbl.critSuppression,
    hit: C.stats.hit,
    yellowMiss: Math.max(0, tbl.miss - hit),
    whiteMiss: Math.max(0, tbl.miss + (C.dw ? C.M.dwMissPenalty : 0) - hit),
    hitCap: tbl.miss + tbl.hitSuppression,
    dodge: tbl.dodge,
    parry: C.behind ? 0 : tbl.parry,
    glance: tbl.glance,
    glancePenalty: (1 - (tbl.glanceMin + tbl.glanceMax) / 2) * 100,
    skill: tbl.skill,
    armor: C.armor,
    armorReduction: (1 - C.armorMult) * 100,
    critMult: C.critMult,
    mana: C.manaMax,
    costs: C.costs,
    haste: (C.stats.hasteStatic - 1) * 100,
    swing: C.mh.speed / C.stats.hasteStatic,
    ohMult: C.oh ? C.oh.mult * 100 : null,
    exposePrey: C.exposePreyChance,
    trapMiss: C.trapMiss,
  };
}

// Poids des stats : mêmes graines pour chaque variante (nombres aléatoires communs).
// Les écarts sont volontairement larges : la hâte décale tous les événements et
// rend la comparaison bruitée avec de petits écarts.
const addGear = (key, n) => (p) => { p.gear[key] = (Number(p.gear[key]) || 0) + n; };

export const STAT_DELTAS = [
  { key: 'agi', label: 'Agilité', delta: 50, apply: addGear('agi', 50) },
  { key: 'str', label: 'Force', delta: 50, apply: addGear('str', 50) },
  { key: 'hit', label: 'Toucher (par %)', delta: 2, apply: addGear('hit', 2) },
  { key: 'crit', label: 'Critique (par %)', delta: 2, apply: addGear('crit', 2) },
  { key: 'expertise', label: 'Réduction esquive/parade (par %)', delta: 2, apply: addGear('expertise', 2) },
  { key: 'skill', label: 'Compétence d’arme (par point)', delta: 5, apply: addGear('skill', 5) },
  { key: 'haste', label: 'Hâte (par %)', delta: 5, apply: addGear('haste', 5) },
  {
    key: 'weapon', label: 'DPS d’arme MD (par point)', delta: 5,
    apply: (p) => { const s = Number(p.mh.speed) || 2; p.mh.min = (Number(p.mh.min) || 0) + 5 * s; p.mh.max = (Number(p.mh.max) || 0) + 5 * s; },
  },
];

export const AP_DELTA = 100;

export function profileVariants(profile) {
  const clone = () => JSON.parse(JSON.stringify(profile));
  const variants = [{ key: 'base', profile: clone() }];
  const apP = clone();
  addGear('ap', AP_DELTA)(apP);
  variants.push({ key: 'ap', profile: apP });
  for (const d of STAT_DELTAS) {
    const p = clone();
    d.apply(p);
    variants.push({ key: d.key, profile: p });
  }
  return variants;
}

// Écart moyen et erreur type appariée entre deux séries de DPS jouées avec les mêmes graines.
function pairedDiff(a, b) {
  const n = Math.min(a.length, b.length);
  if (!n) return { mean: 0, se: 0 };
  let sum = 0;
  for (let i = 0; i < n; i++) sum += b[i] - a[i];
  const mean = sum / n;
  let sq = 0;
  for (let i = 0; i < n; i++) sq += (b[i] - a[i] - mean) ** 2;
  return { mean, se: Math.sqrt(sq / Math.max(1, n - 1) / n) };
}

// `runs[key]` = DPS de chaque combat (même ordre de graines pour toutes les variantes).
export function statWeightsFromRuns(runs) {
  const ap = pairedDiff(runs.base, runs.ap);
  const perAp = ap.mean / AP_DELTA;
  const rows = [{ key: 'ap', label: 'Puissance d’attaque', dpsPerPoint: perAp, ep: 1, epError: 0 }];
  for (const d of STAT_DELTAS) {
    const diff = pairedDiff(runs.base, runs[d.key]);
    const per = diff.mean / d.delta;
    rows.push({
      key: d.key, label: d.label, dpsPerPoint: per,
      ep: perAp > 0 ? per / perAp : 0,
      epError: perAp > 0 ? (1.96 * diff.se) / d.delta / perAp : 0,
    });
  }
  return rows;
}

export function computeStatWeights(profile, { iterations = 2000, seed = 7 } = {}) {
  const runs = {};
  for (const v of profileVariants(profile)) runs[v.key] = runSim(v.profile, { iterations, seed }).dps;
  return statWeightsFromRuns(runs);
}
