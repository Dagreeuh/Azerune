import test from 'node:test';
import assert from 'node:assert/strict';

import { TALENTS, defaultProfile } from '../src/data.js';
import { ICON_DATA } from '../src/icons.js';
import { dbItems } from '../src/gear.js';
import {
  TALENT_BUILDS, TALENT_COLS, TALENT_ROWS, TALENT_TREES, addBlocker, allTalents, buildProblems, fullBuild,
  pointsAvailable, rankText, removeBlocker, talentDef, totalPoints, treePoints,
} from '../src/talenttrees.js';

test('arbres : une case par talent, prérequis plus haut dans le même arbre', () => {
  for (const tree of TALENT_TREES) {
    const seen = new Set();
    for (const t of tree.talents) {
      assert.ok(t.row >= 0 && t.row < TALENT_ROWS && t.col >= 0 && t.col < TALENT_COLS, t.id);
      const key = `${t.row}:${t.col}`;
      assert.ok(!seen.has(key), `${tree.id} : deux talents en ${key}`);
      seen.add(key);
      if (t.req) {
        const r = talentDef(t.req);
        assert.equal(r.tree, tree.id, t.id);
        assert.ok(r.row < t.row, t.id);
      }
    }
  }
});

test('les talents du sim existent dans les arbres avec le même rang maximal', () => {
  for (const t of TALENTS) {
    const def = talentDef(t.id);
    assert.ok(def, `${t.id} absent des arbres`);
    assert.equal(def.max, t.max, t.id);
    assert.ok(def.sim, `${t.id} devrait être marqué « sim »`);
  }
});

test('builds conseillés valides et complets', () => {
  for (const level of [30, 60]) {
    assert.deepEqual(buildProblems(TALENT_BUILDS[level], level), []);
    assert.equal(totalPoints(TALENT_BUILDS[level]), pointsAvailable(level));
    assert.deepEqual(defaultProfile(level).talents, TALENT_BUILDS[level]);
  }
  assert.equal(pointsAvailable(30), 21);
  assert.equal(pointsAvailable(60), 51);
});

test('règles de points : rangées, prérequis, total', () => {
  const empty = fullBuild({});
  assert.equal(addBlocker(empty, 'improvedTracking', 60), null);
  assert.match(addBlocker(empty, 'savageStrikes', 60), /5 points en Survie/);
  assert.match(addBlocker({ ...empty, improvedTracking: 5, savageStrikes: 2, survivalist: 5, cleverTraps: 2, surefooted: 3 }, 'counterattack', 60), /Deterrence/);
  const full30 = { ...TALENT_BUILDS[30] };
  assert.match(addBlocker(full30, 'deflection', 30), /Plus de points/);
  assert.equal(addBlocker(full30, 'deflection', 60), null);
});

test('retirer un point : bloqué si un talent plus bas en dépend', () => {
  // Deterrence est requis par Counterattack.
  assert.match(removeBlocker({ ...TALENT_BUILDS[60] }, 'deterrence'), /Counterattack/);
  const b = { ...TALENT_BUILDS[30] };
  // Les 5 points d’Improved Tracking portent Strider Kick (rangée 5, 20 points au-dessus).
  assert.ok(removeBlocker(b, 'improvedTracking'));
  assert.equal(removeBlocker(b, 'strikerKick'), 'Talent inconnu.');
  assert.equal(removeBlocker(b, 'striderKick'), null);
  assert.equal(treePoints(b, 'sv'), 21);
});

test('texte par rang', () => {
  assert.equal(rankText('+{1/2/3} % de toucher', 2), '+2 % de toucher');
  assert.equal(rankText('+{1/2/3} % de toucher', 0), '+1 % de toucher');
  assert.equal(rankText('Sans rang', 1), 'Sans rang');
});

test('icônes : chaque talent a la sienne, les objets presque tous', () => {
  for (const t of allTalents()) assert.ok(ICON_DATA[t.icon], `icône manquante pour ${t.name} : ${t.icon}`);
  const items = dbItems();
  const withIcon = items.filter((i) => i.icon && ICON_DATA[i.icon]);
  assert.ok(withIcon.length / items.length > 0.99, `${withIcon.length} / ${items.length}`);
  assert.ok(ICON_DATA.inv_misc_questionmark);
});
