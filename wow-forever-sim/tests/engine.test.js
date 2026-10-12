import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultProfile, defaultMechanics } from '../src/data.js';
import {
  attackTable, buildCharacter, characterSheet, computeStatWeights, makeRng, runSim, simulateOnce,
} from '../src/engine.js';

const M60 = defaultMechanics(60);
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('table d’attaque Classic à 300 de compétence contre un boss +3', () => {
  const t = attackTable(60, 63, 0, 0, M60);
  assert.ok(close(t.miss, 8));
  assert.ok(close(t.hitSuppression, 1));
  assert.ok(close(t.dodge, 6.5));
  assert.ok(close(t.parry, 14));
  assert.ok(close(t.glance, 40));
  assert.ok(close((t.glanceMin + t.glanceMax) / 2, 0.65));
  assert.ok(close(t.critSuppression, 4.8));
});

test('+5 de compétence : 6 % de raté, plus de suppression, érafles à 15 %', () => {
  const t = attackTable(60, 63, 5, 0, M60);
  assert.ok(close(t.miss, 6));
  assert.ok(close(t.hitSuppression, 0));
  assert.ok(close(t.dodge, 6));
  assert.ok(close((t.glanceMin + t.glanceMax) / 2, 0.85));
});

test('la réduction d’esquive/parade (Forever) retire des points d’esquive', () => {
  const t = attackTable(60, 63, 0, 2, M60);
  assert.ok(close(t.dodge, 4.5));
  assert.ok(close(t.parry, 12));
});

test('même graine, même résultat ; graine différente, résultat différent', () => {
  const p = defaultProfile(60);
  const a = runSim(p, { iterations: 200, seed: 3 });
  const b = runSim(p, { iterations: 200, seed: 3 });
  const c = runSim(p, { iterations: 200, seed: 4 });
  assert.equal(a.mean, b.mean);
  assert.notEqual(a.mean, c.mean);
});

test('la répartition par technique retombe sur le DPS moyen', () => {
  const r = runSim(defaultProfile(60), { iterations: 400 });
  const sum = r.breakdown.reduce((s, b) => s + b.dps, 0);
  assert.ok(r.mean > 100, `DPS trop bas : ${r.mean}`);
  assert.ok(Math.abs(sum - r.mean) / r.mean < 0.02, `${sum} vs ${r.mean}`);
});

test('feuille de personnage : toucher plafonné et coûts réduits par Resourcefulness', () => {
  const p = defaultProfile(60);
  p.gear.hit = 6;
  const s = characterSheet(p);
  assert.equal(s.yellowMiss, 0);
  assert.ok(close(s.costs.raptor, 100 * 0.4));
  p.talents.resourcefulness = 0;
  assert.ok(close(characterSheet(p).costs.raptor, 100));
});

test('sans Hunter’s Mark ni attaque subie, Mongoose Bite ne s’active jamais', () => {
  const p = defaultProfile(60);
  p.huntersMark = false;
  const r = runSim(p, { iterations: 100 });
  assert.equal(r.breakdown.find((b) => b.id === 'mongoose'), undefined);
  assert.equal(r.procs.exposePrey, 0);
});

test('Lacerating Strikes est indisponible au niveau 30', () => {
  const p = defaultProfile(30);
  p.talents.laceratingStrikes = 1;
  assert.equal(buildCharacter(p).lacerating, false);
});

test('le mana ne descend jamais sous zéro, même sans Resourcefulness', () => {
  const p = defaultProfile(60);
  p.talents.resourcefulness = 0;
  p.buffs = p.buffs.filter((b) => b !== 'manaPotion');
  const C = buildCharacter(p);
  for (let i = 0; i < 50; i++) {
    const res = simulateOnce(C, makeRng(i + 1), 300);
    assert.ok(res.manaEnd >= 0, `mana final négatif : ${res.manaEnd}`);
  }
});

test('Raptor Strike en « prochaine attaque » ne dépasse pas sa recharge', () => {
  const p = defaultProfile(60);
  p.mechanics.raptorMode = 'nextSwing';
  p.fight.variance = 0;
  const r = runSim(p, { iterations: 100 });
  const raptor = r.breakdown.find((b) => b.id === 'raptor');
  assert.ok(raptor.casts <= 180 / 6 + 1);
});

test('plus de puissance d’attaque donne plus de DPS', () => {
  const p = defaultProfile(60);
  const q = defaultProfile(60);
  q.gear.ap += 300;
  const a = runSim(p, { iterations: 300, seed: 9 }).mean;
  const b = runSim(q, { iterations: 300, seed: 9 }).mean;
  assert.ok(b > a + 20, `${a} -> ${b}`);
});

test('poids des stats : l’Agilité vaut plus que la Force', () => {
  const rows = computeStatWeights(defaultProfile(60), { iterations: 600 });
  const ep = Object.fromEntries(rows.map((r) => [r.key, r.ep]));
  assert.equal(ep.ap, 1);
  assert.ok(ep.agi > ep.str, JSON.stringify(ep));
  assert.ok(ep.crit > 5, JSON.stringify(ep));
});
