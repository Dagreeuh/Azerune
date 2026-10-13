import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultProfile } from '../src/data.js';
import { combatTrace, runSim } from '../src/engine.js';
import {
  bestEquipment, dbItem, dbItems, equipItem, findItem, parseTooltip, ratingFactors, resolveProfile, wearable,
} from '../src/gear.js';
import { ITEM_DB_INFO } from '../src/itemdb.js';

function nakedProfile(level = 60) {
  const p = defaultProfile(level);
  for (const k of Object.keys(p.gear)) p.gear[k] = 0;
  return p;
}

test('tooltip anglais : arme à deux mains', () => {
  const r = parseTooltip(`Arcanite Reaper
Binds when equipped
Two-Hand Axe
153 - 256 Damage Speed 3.80
(53.8 damage per second)
+13 Stamina
Durability 120 / 120
Requires Level 58
Equip: +62 Attack Power.`);
  assert.equal(r.name, 'Arcanite Reaper');
  assert.equal(r.type, 'weapon2h');
  assert.deepEqual(r.weapon, { min: 153, max: 256, speed: 3.8, type: 'axe' });
  assert.deepEqual(r.stats, { sta: 13, ap: 62 });
  assert.deepEqual(r.unparsed, []);
});

test('tooltip : scores de toucher et de crit (anglais et français)', () => {
  const en = parseTooltip('Devilsaur Leggings\nLegs\n+12 Stamina\n+46 Attack Power\n+14 Critical Strike Rating');
  assert.deepEqual(en.stats, { sta: 12, ap: 46, critRating: 14 });
  const fr = parseTooltip('Pendentif\nCou\n+7 Agilité\n+10 au score de toucher\n+14 au score de coup critique');
  assert.deepEqual(fr.stats, { agi: 7, hitRating: 10, critRating: 14 });
});

test('tooltip français : pourcentages, compétence et effet à utiliser', () => {
  const r = parseTooltip(`Bijou de test
Bijou
+10 Agilité
Équipé : Augmente vos chances de toucher de 1%.
Équipé : Compétence Haches augmentée de 7.
Utiliser : Augmente la puissance d'attaque de 280 pendant 20 s. (Recharge : 2 min)`);
  assert.equal(r.type, 'trinket');
  assert.deepEqual(r.stats, { agi: 10, hit: 1, skill: 7 });
  assert.deepEqual(r.skillFor, ['axe']);
  assert.deepEqual(r.onUse, { type: 'ap', value: 280, duration: 20, cd: 120 });
});

test('la base contient des objets réels de Forever, sans objets de test ni de SoD', () => {
  const items = dbItems();
  assert.equal(items.length, ITEM_DB_INFO.count);
  assert.ok(items.length > 1000);
  const reaper = dbItem('db12784');
  assert.equal(reaper.name, 'Arcanite Reaper');
  assert.deepEqual(reaper.weapon, { min: 153, max: 256, speed: 3.8, type: 'axe' });
  for (const i of items) {
    assert.ok(!(i.dbId >= 200000 && i.dbId < 250000), `objet SoD : ${i.name}`);
    assert.ok(!/\btest/i.test(i.name), `objet de test : ${i.name}`);
    assert.ok(i.weapon === null || i.weapon.type !== 'mace', `masse : ${i.name}`);
  }
});

test('les scores sont convertis en %, avec la même valeur à tous les niveaux', () => {
  const p = nakedProfile(60);
  p.equipment = { legs: 'db15062' }; // Devilsaur Leggings : +14 crit rating, +46 PA
  const r = resolveProfile(p, []);
  assert.ok(Math.abs(r.gear.crit - 1) < 1e-9);
  assert.equal(r.gear.ap, 46);
  assert.deepEqual(ratingFactors(nakedProfile(30)), ratingFactors(p));
});

test('niveau 30 : les 10 de score de toucher de Felbough Arm valent 1 % (vérifié en jeu)', () => {
  const p = nakedProfile(30);
  p.equipment = { mainHand: 'db273037' };
  assert.ok(Math.abs(resolveProfile(p, []).gear.hit - 1) < 1e-9);
});

test('arme à deux mains de la base : la main gauche est retirée', () => {
  const p = nakedProfile(60);
  p.equipment = bestEquipment(p, { style: 'dw', maxQuality: 3 });
  assert.ok(p.equipment.mainHand && p.equipment.offHand);
  assert.equal(resolveProfile(p, []).twoHand, false);
  equipItem(p, [], 'mainHand', 'db12784');
  assert.equal(p.equipment.offHand, null);
  assert.equal(resolveProfile(p, []).twoHand, true);
});

test('équipement automatique : objets portables au niveau choisi', () => {
  for (const level of [30, 60]) {
    const p = nakedProfile(level);
    const eq = bestEquipment(p, { style: '2h', maxQuality: 3 });
    assert.ok(Object.keys(eq).length >= 12, `${level} : ${Object.keys(eq).length} emplacements`);
    for (const id of Object.values(eq)) {
      const it = findItem([], id);
      assert.ok(wearable(it, level), `${it.name} pas portable au niveau ${level}`);
      assert.ok(it.quality <= 3);
    }
    assert.notEqual(eq.finger1, eq.finger2);
  }
});

test('les profils équipés de la base se simulent', () => {
  const p60 = nakedProfile(60);
  p60.equipment = bestEquipment(p60, { maxQuality: 3 });
  const p30 = nakedProfile(30);
  p30.equipment = bestEquipment(p30, { maxQuality: 3 });
  const r60 = runSim(resolveProfile(p60, []), { iterations: 200 }).mean;
  const r30 = runSim(resolveProfile(p30, []), { iterations: 200 }).mean;
  assert.ok(r60 > 200, `DPS 60 : ${r60}`);
  assert.ok(r30 > 40 && r30 < r60, `DPS 30 : ${r30}`);
});

test('statistiques du cycle cohérentes', () => {
  const r = runSim(defaultProfile(60), { iterations: 300 });
  const c = r.cycle;
  assert.ok(c.gcdUsage > 0 && c.gcdUsage <= 100, `GCD ${c.gcdUsage}`);
  assert.ok(c.mb.used <= c.mb.opened + 1e-9);
  assert.ok(c.sequences.length > 0);
  for (const u of c.uptime) assert.ok(u.pct >= 0 && u.pct <= 100.0001, `${u.id} ${u.pct}`);
});

test('la trace contient techniques, attaques et périodes actives', () => {
  const tr = combatTrace(defaultProfile(60), { seconds: 30 });
  assert.ok(tr.events.some((e) => e.kind === 'cast'));
  assert.ok(tr.events.some((e) => e.kind === 'swing'));
  for (const s of tr.spans) assert.ok(s.end <= 30 && s.start < s.end);
  const casts = tr.events.filter((e) => e.kind === 'cast' && e.gcd);
  for (let i = 1; i < casts.length; i++) assert.ok(casts[i].t - casts[i - 1].t >= tr.gcd - 1e-9);
});

test('Lacerate pose un saignement de 7 tics', () => {
  const tr = combatTrace(defaultProfile(60), { seconds: 40 });
  const ticks = tr.events.filter((e) => e.kind === 'tick' && e.id === 'lacerate');
  assert.ok(ticks.length >= 7, `${ticks.length} tics`);
});

test('PA contre un type de créature : comptée seulement contre ce type', () => {
  const p = nakedProfile(60);
  p.equipment = { chest: 'db3566' }; // Raptorbane Armor : +16 PA, +15 PA contre les bêtes
  p.fight.creatureType = 'beast';
  assert.equal(resolveProfile(p, []).gear.ap, 31);
  p.fight.creatureType = 'humanoid';
  assert.equal(resolveProfile(p, []).gear.ap, 16);
  assert.ok(dbItem('db23206'), 'Mark of the Champion présent dans la base');
});

test('tooltip : PA contre un type de créature (anglais et français)', () => {
  const en = parseTooltip('Raptorbane\nChest\nEquip: +15 Attack Power when fighting Beasts.\nEquip: +16 Attack Power.');
  assert.deepEqual(en.stats, { apVsBeast: 15, ap: 16 });
  const fr = parseTooltip('Marque\nBijou\nÉquipé : +150 à la puissance d’attaque contre les Morts-vivants.');
  assert.deepEqual(fr.stats, { apVsUndead: 150 });
});

test('« +X dégâts d’arme » sur une arme ne compte que pour cette arme', () => {
  const sword = { id: 'w1', name: 'Épée', type: 'weapon1h', stats: { weaponDmg: 5 }, weapon: { min: 50, max: 90, speed: 2.6, type: 'sword' } };
  const ring = { id: 'r1', name: 'Anneau', type: 'finger', stats: { weaponDmg: 3 } };
  const p = nakedProfile(60);
  p.equipment = { mainHand: 'w1', finger1: 'r1' };
  const r = resolveProfile(p, [sword, ring]);
  assert.equal(r.mh.bonusDmg, 5);
  assert.equal(r.gear.weaponDmg, 3);
});
