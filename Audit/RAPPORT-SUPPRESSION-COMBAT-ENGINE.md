# Suppression de `src/combat/engine.js` (moteur mort)

## Constat

Le dépôt contenait deux moteurs de combat :

| Fichier | Taille | Statut |
|---|---|---|
| `src/battle/engine.js` | 75 Ko | **Moteur vif** |
| `src/combat/engine.js` | 58 Ko | Copie morte, supprimée |

`src/combat/engine.js` n'était importé par aucun fichier. Les deux seuls
consommateurs d'un moteur importent `../battle/engine` :

- `src/pages/BattlePage.jsx`
- `src/pages/TutorialPage.jsx`

Preuve indépendante : `prepareTutorialTurn` n'est exporté que par
`battle/engine.js`. `TutorialPage` planterait au chargement sur l'autre copie.

Les deux fichiers avaient divergé. `battle/engine.js` porte des systèmes que
`combat/engine.js` n'a jamais eus (`combatStats` / `addCombatStat` pour le
rapport de fin de combat, `prepareTutorialTurn`, `enrageBoss`, `raidDanger`,
la traçabilité `source` sur les malus, la priorité AUTO `customOrder`).

Les patch notes v1.48.0, v1.49.0 et v1.49.5 listent `src/combat/engine.js`
comme fichier modifié : la duplication date de cette période.

## À conserver — un correctif n'existait que dans le fichier supprimé

Le **plafond des dégâts périodiques sur les boss**, annoncé en v1.49.0
(« Sur un boss, leurs dégâts basés sur les PV maximum sont limités par un
plafond dépendant de l'Attaque de la source ») n'a **jamais été porté** dans
`battle/engine.js`.

Vérification : `battle/engine.js` contient 0 occurrence de `bossDotAmount` et
0 occurrence de `sourceAtk`. Ses DoT calculent `Math.round(unit.maxHp * taux)`
sans aucun plafond.

Conséquence : **le jeu tourne déjà sans ce plafond** depuis que le moteur vif
est `battle/`. La suppression ne change donc rien au comportement en jeu — mais
elle effaçait la seule copie du code. Il est reproduit ici à l'identique.

### Le mécanisme, en deux parties

**1. Le plafond**

```js
const bossDotAmount=(unit,debuff,percent,fallback)=>{
  const raw=Math.round(unit.maxHp*percent),
        sourceAtk=Math.max(0,Number(debuff?.sourceAtk)||0);
  if(!unit.bossUnit||!sourceAtk)return raw;
  return Math.min(raw,Math.round(sourceAtk*fallback));
};
```

Sur une cible ordinaire, ou si l'Attaque de la source est inconnue, le calcul
reste inchangé. Sur un boss, les dégâts sont plafonnés à
`Attaque de la source × fallback`.

**2. Les trois DoT concernés**

```js
if(unit.debuffs.burn){const amount=Math.round(bossDotAmount(unit,unit.debuffs.burn,.05,1.15)*(unit.setEffects?.includes('fireproofSet')?.75:1));...}
if(unit.debuffs.bleed){const amount=bossDotAmount(unit,unit.debuffs.bleed,.045,1.05);...}
if(unit.debuffs.corruption){const amount=bossDotAmount(unit,unit.debuffs.corruption,.035,.95);...}
```

**3. Le prérequis : mémoriser l'Attaque au moment de l'application**

Le plafond ne s'active que si le malus transporte `sourceAtk`. Il faut donc
l'écrire à chaque pose, aux 5 endroits concernés :

```js
target.debuffs[key]={...target.debuffs[key],source:actor.id,sourceAtk:actor.atk}
target.debuffs.poison={turns:3+mastery.duration,source:actor.id,sourceAtk:actor.atk}
target.debuffs.agony={turns:4+mastery.duration,stacks:1,source:actor.id,sourceAtk:actor.atk}
target.debuffs.corruption={turns:4+mastery.duration,source:actor.id,sourceAtk:actor.atk}
burnTarget.debuffs.burn={...burnTarget.debuffs.burn,source:actor.id,sourceAtk:actor.atk}
```

`battle/engine.js` écrit déjà `source:actor.id` à ces endroits ; il ne manque
que `sourceAtk:actor.atk`.

## Décision prise : le plafond est porté

Le comportement de la v1.49.0 est rétabli dans `src/battle/engine.js`.

- `bossDotAmount` est restauré à l'identique.
- Brûlure (×1,15), Saignement (×1,05) et Corruption (×0,95) passent par lui,
  **dans les deux endroits** qui les calculent : l'application des dégâts et
  l'attribution aux statistiques de combat. Les deux devaient rester d'accord,
  sinon le rapport de fin de combat surestime les dégâts périodiques.
- `sourceAtk` est mémorisée à la pose du malus : dans `tryDebuff`, qui couvre le
  chemin générique, et sur les trois écritures directes.

Le drapeau `bossUnit` est bien posé dans les données de campagne, mythic, raids,
expéditions et world boss : le plafond s'applique donc réellement.

### Dégradation sûre

Un malus sans `sourceAtk` connue — une sauvegarde en cours, un chemin non
couvert — retombe sur le calcul d'origine. Aucun combat déjà engagé ne change de
comportement en cours de route.

### Impact d'équilibrage

C'est un affaiblissement réel de Brûlure, Saignement et Corruption contre les
boss, donc en raid, Mythic+ et boss de campagne. Sur un boss à 100 000 PV, une
Brûlure posée par un champion à 300 d'Attaque passe de 5 000 à 345 dégâts par
tour. Le plafond ne mord pas sur les cibles ordinaires : à 1 000 PV, les 5 %
valent 50, très en dessous du plafond.

Le test 9 du HOTFIX-v1.49.0 — comparer les DOT sur un ennemi ordinaire puis sur
un boss à hauts PV — est désormais automatisé dans `tests/engine.sets.test.js`.
