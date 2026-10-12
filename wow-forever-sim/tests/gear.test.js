import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultProfile } from '../src/data.js';
import { combatTrace, runSim } from '../src/engine.js';
import {
  equipItem, equipmentTotals, exampleEquipment, exampleItems, parseTooltip, resolveProfile,
} from '../src/gear.js';

const ITEMS = exampleItems();

function equippedProfile(level = 60, dualWield = false) {
  const p = defaultProfile(level);
  for (const k of Object.keys(p.gear)) p.gear[k] = 0;
  p.equipment = exampleEquipment(level, dualWield);
  return p;
}

test('tooltip anglais : arme à deux mains', () => {
  const r = parseTooltip(`Arcanite Reaper
Binds when equipped
Two-Hand Axe
153 - 256 Damage Speed 3.80
(53.8 damage per second)
+13 Strength
+13 Stamina
Durability 120 / 120
Requires Level 58
Equip: +62 Attack Power.`);
  assert.equal(r.name, 'Arcanite Reaper');
  assert.equal(r.type, 'weapon2h');
  assert.deepEqual(r.weapon, { min: 153, max: 256, speed: 3.8, type: 'axe' });
  assert.deepEqual(r.stats, { str: 13, sta: 13, ap: 62 });
  assert.deepEqual(r.unparsed, []);
});

test('tooltip français : toucher, crit, compétence et effet à utiliser', () => {
  const r = parseTooltip(`Bijou de test
Bijou
+10 Agilité
Équipé : Augmente vos chances de toucher de 1%.
Équipé : Augmente vos chances d'infliger un coup critique de 2%.
Équipé : Compétence Haches augmentée de 7.
Utiliser : Augmente la puissance d'attaque de 280 pendant 20 s. (Recharge : 2 min)`);
  assert.equal(r.type, 'trinket');
  assert.deepEqual(r.stats, { agi: 10, hit: 1, crit: 2, skill: 7 });
  assert.deepEqual(r.skillFor, ['axe']);
  assert.deepEqual(r.onUse, { type: 'ap', value: 280, duration: 20, cd: 120 });
});

test('les lignes inconnues sont signalées au lieu d’être ignorées', () => {
  const r = parseTooltip(`Main de justice
Trinket
Chance on hit: Grants an extra attack on your next swing.`);
  assert.equal(r.type, 'trinket');
  assert.equal(r.unparsed.length, 1);
});

test('les objets équipés s’ajoutent aux bonus manuels', () => {
  const p = equippedProfile(60);
  p.gear.agi = 5;
  const totals = equipmentTotals(p, ITEMS);
  const r = resolveProfile(p, ITEMS);
  assert.equal(r.gear.agi, totals.agi + 5);
  assert.equal(r.twoHand, true);
  assert.equal(r.mh.speed, 3.8);
  assert.equal(r.trinkets[1].preset, 'custom');
  assert.equal(r.trinkets[1].value, 280);
});

test('ambidextrie : deux armes à une main, la 2M retire la main gauche', () => {
  const dw = resolveProfile(equippedProfile(60, true), ITEMS);
  assert.equal(dw.twoHand, false);
  assert.equal(dw.oh.speed, 1.8);

  const p = equippedProfile(60, true);
  equipItem(p, ITEMS, 'mainHand', 'ex60-twohand');
  assert.equal(p.equipment.offHand, null);
  const r = resolveProfile(p, ITEMS);
  assert.equal(r.twoHand, true);
});

test('le profil d’exemple équipé se simule', () => {
  const r = runSim(resolveProfile(equippedProfile(60), ITEMS), { iterations: 200 });
  assert.ok(r.mean > 200, `DPS ${r.mean}`);
  const r30 = runSim(resolveProfile(equippedProfile(30), ITEMS), { iterations: 200 });
  assert.ok(r30.mean > 30 && r30.mean < r.mean, `DPS 30 : ${r30.mean}`);
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
