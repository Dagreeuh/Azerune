# Azerune — Hotfix : la difficulté Mythic+ reculait après chaque dizaine

## Problème

La puissance recommandée d'une mission Mythic+ **diminuait** entre le niveau 10
et le niveau 11, et de nouveau entre le 20 et le 21 :

| Niveau | Affichée | Variation |
|---|---|---|
| 9 | 6 764 | +252 |
| 10 | 7 905 | +1 141 |
| **11** | **7 783** | **−122** |
| 12 | 8 035 | +252 |

Le joueur voyait donc le Mythic+ 11 présenté comme **plus facile** que le
Mythic+ 10, alors que ses quatre vagues sont plus fortes. L'écran de mission et
l'évaluation de faisabilité reposent tous deux sur ce nombre.

## Cause

Un bonus de palier accordé au seul niveau multiple de dix, puis retiré au niveau
suivant :

```js
1700 + level*360 + (level%10===0 ? 600 : 0)
```

Le même défaut existait **en double**, écrit deux fois indépendamment :

- `createMythicMission` — `mission.recommended` ;
- `calibratedEncounterPower` — `(level%10===0 ? .12 : 0)`, et c'est cette
  valeur-là que `MythicPage` affiche.

## Correction

Le bonus devient cumulatif : `Math.floor(level/10)` fois le palier. Chaque
dizaine franchie ajoute un cran qui ne se perd plus.

L'intention est conservée — franchir une dizaine reste le plus gros saut de
difficulté — et la courbe ne redescend jamais.

### Effet sur les valeurs affichées

Les niveaux 1 à 10 sont inchangés. Au-delà, la difficulté annoncée monte :

| Niveau | Avant | Après |
|---|---|---|
| 10 | 7 905 | 7 905 |
| 11 | 7 783 | 8 225 |
| 20 | 12 112 | 12 698 |
| 30 | 16 554 | 18 082 |

C'est un changement de la difficulté **annoncée**, pas de la force réelle des
ennemis : aucune vague n'est modifiée. Le nombre décrit simplement mieux ce que
le joueur affronte.

Si l'intention était un pic ponctuel réservé aux boss de palier, l'autre
correction possible est de retirer le bonus entièrement — également monotone,
mais plus basse aux niveaux 10, 20 et 30.

## Ce qui a été vérifié et va bien

Le reste du Mythic+ est complet, ce qui n'était pas acquis :

- les six affixes déclarés sont tous lus par le moteur ;
- tous les identifiants des rotations de saison existent ;
- les effets correspondent à leurs descriptions — Fortifié +20 % PV / +12 %
  Attaque / +5 Résistance sur les non-boss, Tyrannique +25 / +15 / +8 Précision
  sur les boss, Déchaîné +20 % Vitesse sous 30 % de PV ;
- les buffs posés sont réellement consommés : `mythicBolster` module attaque et
  défense de +8 % par cumul, `necrotic` réduit les soins de 6 % par cumul.

## Verrou

`tests/mythic.test.js` — 30 tests, dont la monotonie des deux formules sur les
trente niveaux, le contrat de câblage des affixes, et l'enchaînement des vagues.

Contrôle par mutation : rétablir le bonus ponctuel fait échouer le test avec
« niveau 11: expected 8037 to be greater than 8378 ».
