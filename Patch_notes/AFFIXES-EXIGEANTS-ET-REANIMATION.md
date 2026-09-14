# Azerune — Mythic+ redemande une équipe, et le jeu a enfin une réanimation

Trois chantiers restés ouverts à l'audit, traités ensemble.

## 1. Mythic+ ne testait que l'équipement

Mesuré sur 300 compositions : en Mythic+ 30, **93 % d'entre elles passaient**, et
aucun champion n'avait le moindre avantage — chacun apparaissait dans les
compositions gagnantes à sa fréquence attendue, à un point près. Le mode était
une épreuve d'équipement, jamais d'équipe.

La cause est simple : les six affixes de saison ne modifiaient que des
**valeurs** — plus de PV, plus d'Attaque, plus de Vitesse. Aucun ne demandait un
outil. Deux affixes s'ajoutent :

**🦠 Affligé** — les attaques ennemies appliquent l'Affliction : des dégâts
périodiques croissants, jusqu'à 5 cumuls. Elle **ne s'estompe pas**. Il faut la
purifier, ou la subir jusqu'à la fin de la course.

**👻 Incorporel** — sous 50 % de PV, un ennemi devient intangible et ne subit
plus que **45 %** des dégâts, tant qu'il n'est ni étourdi ni ralenti. Sans
contrôle, la fin de chaque combat s'éternise.

Les six rotations de saison sont refondues : **chacune propose désormais au
moins un affixe exigeant**.

### Ce que ça change, mesuré

220 compositions par saison, en Mythic+ 30, équipement du palier :

| | Ancienne saison | Saison exigeante |
|---|---|---|
| Compositions qui passent | 93–95 % | **57–75 %** |
| Écart entre le meilleur et le pire champion | 0,18–0,27 | **0,61–1,31** |
| Champions de contrôle | 1,03–1,04 | **1,16–1,17** |
| Champions de purification | 0,97 | 1,01 |

L'écart entre champions est **quatre à cinq fois plus grand** — c'était tout
l'objet. Les champions de contrôle y gagnent nettement.

Première réserve, levée depuis : la purification ne montrait aucun gain
mesurable, parce qu'un soigneur suffisait à absorber l'Affliction. Voir la
section suivante.

Les deux passages de mesure diffèrent parce que l'équipement est tiré au hasard
à chaque fois : ce sont les ordres de grandeur qui comptent, pas les décimales.

## 2. Sylven ne savait pas se jouer tout seul

Le combat automatique choisit par une règle propre à chaque champion. Sylven
n'en avait aucune, et le défaut est « finisseur d'abord » : sa seule
purification, portée par sa troisième compétence, n'était donc lancée que par
hasard.

Il a désormais sa règle : il pose ses Graines, puis les fait éclore dès que deux
alliés portent un malus.

## 3. Le jeu n'avait aucune réanimation — Caelion la porte

Aucun champion, aucun set, aucune relique ne relevait un allié tombé. Avec la
difficulté Mythic+ revue, une mort était définitive pour toute la course.

**Retour temporel** rembobine désormais jusqu'à la mort elle-même : si l'allié
ancré est tombé, il est **ramené avant sa chute avec 35 % de ses PV** — 50 % en
Résonance IV — débarrassé de ses malus, **une seule fois par combat**. Sans
allié tombé, la compétence garde exactement son effet d'origine.

Le choix de Caelion n'est pas un correctif d'équilibrage. Une mesure en paires
appariées — même trio de base, avec Caelion contre un autre champion, sur 60
paires et trois points de difficulté — n'a montré **aucun effet mesurable**, ni
positif ni négatif : son absence des compositions gagnantes relevée dans l'audit
était du bruit d'échantillonnage. Il porte la réanimation parce que le retour
temporel est sa fantaisie, et parce que cela donne enfin une raison de le jouer.

## Détail technique

`src/data/mythic.js` (deux affixes, six rotations refondues),
`src/battle/engine.js` (Affliction, intangibilité, réanimation, règle de Sylven),
`src/data/heroes.js` et `src/data/championIdentities.js` (Caelion),
`src/pages/BattlePage.jsx` (légende de l'Affliction).

**974 tests**, dont 19 sur les affixes exigeants et la réanimation.
**13 mutations** appliquées au code livré, toutes détectées. Une garde
inatteignable a été retirée plutôt que conservée sans test possible.

---

## Suite — l'Affliction déborde désormais sur l'équipe

La première version de l'affixe Affligé était **pénible sans être exigeante** :
n'importe quel soigneur absorbait les dégâts, et la purification n'apportait
rien de mesurable.

À **cinq cumuls**, l'Affliction contamine maintenant l'allié le moins atteint, à
chaque tour de la victime. Sans purification, toute l'équipe finit saturée — et
aucun soin ne suit cette progression, puisqu'elle croît avec le nombre de
porteurs.

### Résultat, trois tirages d'équipement indépendants moyennés

| | Sans Affligé | Avec Affligé |
|---|---|---|
| Compositions qui passent | 94 % | **86 %** |
| Écart entre champions | 0,20 | **0,34** |
| Champions de purification | 1,00 | **1,07** |
| Soigneurs | 1,03 | **1,11** |
| Champions de contrôle | 1,03 | 1,04 |

La purification gagne enfin quelque chose de mesurable. Les soigneurs gagnent
encore davantage — l'Affliction reste partiellement absorbable, la propagation
n'a fait que réduire l'écart. C'est un progrès, pas une victoire complète, et
le contrôle ne bouge pas, ce qui est correct : cette saison ne portait pas
Incorporel.

### Un plantage évité de justesse

Le message de débordement était écrit dans un tampon déclaré **plus bas dans la
fonction** : la première saturation aurait levé une exception au lieu
d'afficher une ligne de journal. Le test qui joue une équipe à cinq cumuls l'a
attrapé avant la mise en service.
