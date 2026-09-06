# Audit d'équilibrage — champions et difficulté des modes

## Méthode

Cet audit ne repose pas sur une lecture des tables mais sur des **combats réellement
joués** avec le moteur du jeu : équipes construites, IA AUTO active, 24 à 40 graines
par mesure, victoires et durées agrégées.

Deux mesures distinctes :

- **le ratio** entre la puissance de l'équipe et celle que le jeu recommande ;
- **le seuil réel d'échec**, obtenu en affaiblissant progressivement l'équipe
  jusqu'à ce qu'elle perde.

L'équipe de référence de fin de jeu : quatre 5★ portés à 6★, niveau 60, Résonance 5,
six pièces de la zone 10 améliorées +15. Soit **17 233** de puissance à quatre,
**13 193** à trois.

---

## 1. Les champions sont bien équilibrés

À investissement égal, sans équipement ni Résonance :

| Rareté | Nombre | Minimum | Médiane | Maximum | Écart |
|---|---|---|---|---|---|
| 3★ | 9 | 1 044 | 1 119 | 1 202 | **1,15×** |
| 4★ | 7 | 1 329 | 1 418 | 1 525 | **1,15×** |
| 5★ | 10 | 1 498 | 1 803 | 1 844 | **1,23×** |

Un écart de 15 à 23 % à l'intérieur d'une rareté est sain : il laisse de la place au
choix sans créer de champion obligatoire. **Aucune correction n'est nécessaire ici.**

### Une réserve sur la mesure, pas sur les champions

`championPower` pondère l'Attaque à 7,5 par point contre 0,30 pour les PV. Un
soigneur est donc structurellement sous-évalué : **Hicho (5★, 1 498) est classé
derrière Ignovar (4★, 1 525)**.

Ce n'est pas un problème d'équilibrage des champions, mais un biais de l'indicateur —
et cet indicateur alimente `teamPower`, donc la note de faisabilité affichée avant
chaque combat. Une équipe portée sur le soutien est annoncée plus faible qu'elle
n'est.

---

## 2. La progression du joueur dépasse celle du contenu

| | Croissance |
|---|---|
| Contenu, zone 1 → zone 10 (Normal) | **×2,92** |
| Joueur, 3★ niveau 30 → 5★/6★ niveau 60 R5, stuff zone 10 +15 | **×3,34** |
| **Écart accumulé** | **×1,14 en faveur du joueur** |

L'écart est modéré et ne suffit pas, seul, à expliquer que tout se termine trop vite.
La cause est ailleurs.

---

## 3. Le paysage de difficulté, mesuré

Ratio de l'équipe de fin de jeu face à chaque contenu — au-dessus de 1, l'équipe est
plus forte que ce que le jeu recommande.

| Mode | Ratio | Victoires | Tours (médiane) |
|---|---|---|---|
| Campagne Normal, zone 1 | 6,30× | 100 % | **5** |
| Expédition niveau 1 | 4,20× | 100 % | **9** |
| Mythic+ 1 | 3,77× | 100 % | 28 |
| Mythic+ 15 | 1,81× | 100 % | 55 |
| Campagne Normal, boss final | 1,44× | 100 % | 38 |
| Expédition niveau 10 | 1,24× | 100 % | 44 |
| Campagne Difficile, boss final | 1,19× | — | — |
| **Campagne Hardcore, boss final** | **1,00×** | 100 % | 71 |
| **Mythic+ 30** | **0,95×** | 100 % | 80 |
| **Raid niveau 10** | **0,57×** | — | — |

Trois lectures :

- **La Campagne est bien étalée.** Normal confortable, Difficile serré, Hardcore
  exactement au niveau de l'équipe maximale. C'est la courbe la mieux réglée du jeu.
- **Les niveaux 1 des modes de fin sont du remplissage.** Mythic+ 1 à 3,77× et
  Expédition 1 à 4,20× ne demandent rien à un joueur qui y accède.
- **Le Raid est de loin le contenu le plus dur** — 0,57×, soit près du double de ce
  que l'équipe peut fournir.

---

## 4. Le défaut central : le Mythic+ n'a aucune condition d'échec

C'est le constat le plus important de cet audit.

En affaiblissant l'équipe pas à pas contre le **Mythic+ 30**, le contenu le plus
difficile annoncé du jeu :

| Puissance de l'équipe | Ratio | Victoires | Tours |
|---|---|---|---|
| 100 % | 0,95× | **100 %** | 81 |
| 80 % | 0,79× | **100 %** | 92 |
| 65 % | 0,66× | **100 %** | 113 |
| 50 % | 0,54× | **100 %** | 139 |
| **40 %** | **0,46×** | **100 %** | **165** |
| 30 % | 0,37× | 0 % | — |

**Une équipe à moins de la moitié de la puissance recommandée gagne encore le
Mythic+ 30, cent fois sur cent.** Elle met simplement 165 tours au lieu de 81.

À comparer avec la Campagne Hardcore, qui possède un vrai seuil :

| Puissance | Ratio | Victoires |
|---|---|---|
| 100 % | 1,00× | 100 % |
| 80 % | 0,83× | **29 %** |

La falaise est nette entre 0,83× et 1,00×. C'est exactement ce qu'on attend d'un
contenu de fin.

### La cause

Le Raid possède une montée en pression : `enrageAt`, déclenché après **40 actions de
champions**. Passé ce cap, le boss devient létal — le joueur ne peut pas gagner par
usure.

Le Mythic+ n'a **aucun équivalent** : zéro occurrence d'enrage dans ses données. Les
quatre vagues conservent les PV des alliés, la Résonance 5 apporte un soin continu, et
rien ne borne la durée. Le combat ne peut se perdre que si l'équipe est incapable de
tuer plus vite que les ennemis ne régénèrent la pression — ce qui n'arrive qu'à 0,37×.

**Le Mythic+ n'est donc pas difficile, il est long.** C'est la pire combinaison pour
l'expérience de jeu : aucune tension, beaucoup de temps.

---

## 5. Autres constats

### La durée n'est pas le problème que tu crains

L'inquiétude « tout clear en 2 minutes » ne se vérifie pas sur le contenu de niveau :
le boss final Normal demande 38 tours, Hardcore 71, Mythic+ 30 quatre-vingts. À deux
ou trois secondes par tour, ce sont des combats de deux à quatre minutes.

Ce qui se termine en quelques secondes, c'est le **farm** : 5 tours pour la zone 1
avec une équipe de fin. C'est normal et souhaitable.

Le vrai problème n'est pas la vitesse, c'est **l'absence de risque**.

### `EXPEDITION_POWER` est une table morte

`[500, 800, 1700, 2500, 3600, 5000, 6800, 9000, 12000, 16000]` est déclarée et
**utilisée nulle part**. Les expéditions passent par `calibratedEncounterPower`, qui
donne 3 143 à 13 884 — des valeurs sans rapport avec la table.

Soit la table est la référence voulue et le calcul devrait s'y adosser, soit elle doit
disparaître. En l'état, elle induit en erreur quiconque la lit pour régler la
difficulté.

---

## 6. Recommandations, par ordre d'impact

### 1. Donner une condition d'échec au Mythic+

C'est le seul changement qui transforme l'expérience. Trois options, de la plus simple
à la plus riche :

- **Un enrage sur le modèle du Raid.** Après N actions de champions, les ennemis
  gagnent des dégâts croissants. Avec N ≈ 90 pour quatre vagues, une équipe au ratio
  1,00× (81 tours) passe, une équipe à 0,66× (113 tours) échoue. Le seuil de réussite
  remonterait de 0,46× à environ 0,85×, ce qui est cohérent avec la Campagne Hardcore.
- **Un budget de tours par vague**, affiché, qui rend la pression lisible.
- **Un affixe de saison qui monte en intensité** avec la durée du combat, ce qui
  réutilise le système d'affixes déjà en place.

La première est la moins coûteuse : le mécanisme existe déjà dans le moteur pour le
Raid, il s'agit de le brancher sur `battle.mythic`.

### 2. Relever le plancher des modes de fin

Mythic+ 1 à 3,77× et Expédition 1 à 4,20× n'apportent rien. Deux possibilités :

- resserrer la courbe pour que le niveau 1 démarre vers 1,5× à 2× ;
- ou supprimer les premiers niveaux et commencer plus haut.

Le second choix raccourcit le trajet sans rien perdre d'intéressant.

### 3. Corriger le biais de `championPower` sur le soutien

Le rapport 7,5 pour l'Attaque contre 0,30 pour les PV est trop marqué. Rapprocher ces
poids — par exemple 6,0 et 0,45 — suffirait à ce qu'un soigneur 5★ ne soit plus classé
derrière un attaquant 4★, et rendrait la note de faisabilité juste pour les
compositions défensives.

C'est un changement à surveiller : `teamPower` alimente les ratios de difficulté
partout. À faire seul, et à revérifier avec les mesures de ce rapport.

### 4. Trancher sur `EXPEDITION_POWER`

Table morte : à brancher ou à supprimer.

---

## Ce qui va bien et n'a pas besoin d'être touché

- L'équilibrage entre champions d'une même rareté.
- La courbe de la Campagne sur ses trois difficultés — c'est la référence dont les
  autres modes devraient s'inspirer.
- Le Raid, seul mode avec une vraie tension, grâce à son enrage.
- La durée des combats de niveau, qui est bonne.
