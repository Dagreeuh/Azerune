# Azerune — La Provocation subie ne provoquait rien

## Le défaut

Le **Gardien de lave** du Raid utilise Rempart de lave et provoque toute
l'équipe. Le malus était bien appliqué, bien affiché dans la barre d'état,
bien nommé dans le journal de combat.

Et lu **nulle part** côté joueur.

```js
// enemyAction : un ennemi provoqué est bien contraint…
const provoker=choices.find(unit=>unit.id===actor.debuffs.provoke?.source);
const victim=provoker||tacticalTarget||choices[0];
```

La contrainte existait dans un seul sens. Un ennemi provoqué par Maerys ou
Mathanae est forcé de les attaquer — cette moitié fonctionnait. Mais un
**champion** provoqué par le Gardien pouvait viser librement qui il voulait :
ni `castSkill` ni le ciblage automatique ne consultaient son malus.

La mécanique entière du Gardien de lave ne faisait donc rien. C'est la même
signature que `accuracyDown` et que la Précision réduite d'Œil-Clair : une
moitié écrite, l'autre pas.

## La correction

Un champion provoqué ne peut plus viser que celui qui l'a provoqué, tant que
ce dernier vit et tant que la Provocation n'est pas purifiée — au ciblage
manuel comme en combat automatique. Si le provocateur meurt, la contrainte
tombe immédiatement.

## Ce que ça ne corrige pas — mesuré

L'espoir était que cette mécanique enfin réelle réduise la concentration des
Raids sur quelques champions. **Mesuré en A/B sur le même réglage** — Raid
Cœur-de-Forge niveau 6, deux tirages d'équipement, 150 compositions chacun,
avec puis sans la contrainte :

| | Mécanique inerte | Mécanique appliquée |
|---|---|---|
| Compositions qui passent | 55 % | 54 % |
| Écart entre champions | 1,20 | 1,34 |
| Champions de purification | 1,06 | 1,04 |
| Champions de contrôle | 0,94 | 0,98 |

**Aucune différence en dehors du bruit.** Une Provocation d'un tour toutes les
trois actions est une gêne, pas une exigence de composition.

Renforcer l'effet ne fonctionne pas non plus, et va même dans le mauvais sens.
Portée à trois tours et 85 % de chance, elle rend le Raid nettement plus dur
(38 % de réussite) et **plus concentré** encore (écart 2,27, Morghast à 2,48) :
en allongeant la course, elle récompense davantage les gros dégâts. Les valeurs
d'origine sont conservées.

## Ce que ça dit du problème réel

La concentration des Raids n'est pas causée par une mécanique inerte. Elle est
**structurelle** : le Raid est une course contre le compteur de charges, et la
réponse à une course est toujours plus de dégâts. Aucun réglage de la
Provocation ne changera cela.

La corriger demanderait une mécanique dont la réponse **n'est pas des dégâts** —
par exemple une phase que seul un contrôle interrompt, ou un dégât d'équipe que
seul un bouclier absorbe. C'est un travail de conception de contenu, pas un
réglage, et il reste ouvert.

## Détail technique

`src/battle/engine.js` : `forcedEnemyTarget`, lu par `castSkill` et
`chooseAutoEnemyTarget`.

**989 tests**, dont 11 sur la Provocation subie. **4 mutations** appliquées au
code livré, toutes détectées. Une garde redondante a été retirée plutôt que
conservée sans test capable de la distinguer.
