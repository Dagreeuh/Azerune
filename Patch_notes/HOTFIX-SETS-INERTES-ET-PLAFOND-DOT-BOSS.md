# Azerune — Hotfix : sets inertes et plafond des DOT sur les boss

## Objectif

Rebrancher trois sets d'équipement qui annonçaient un bonus au joueur sans avoir
aucun effet en combat, et rétablir le plafond des dégâts périodiques sur les
boss annoncé en v1.49.0.

Les quatre correctifs avaient été écrits dans `src/combat/engine.js`, un second
moteur que le jeu n'exécutait pas. Le moteur réel est `src/battle/engine.js`.

## Sets d'équipement

Trois sets 4 pièces affichaient leur bonus dans la page Équipement sans rien
faire en combat. Aucun des trois n'apportait non plus de statistiques passives :
ils étaient entièrement inertes.

- **Protection** — bouclier initial de 15 % des PV max au début du combat.
  Alliés uniquement.
- **Contre-attaque** — 20 % de chance de riposter quand le porteur encaisse un
  coup. La riposte vaut 75 % de son Attaque, réduite par la Défense de
  l'attaquant, avec un minimum de 1 point.
- **Incendiaire** — 25 % de chance d'appliquer Brûlure pendant 2 tours après une
  compétence offensive ayant infligé des dégâts.

Le set Incendiaire est du butin de fin de campagne : c'est celui dont l'absence
d'effet coûtait le plus d'efforts au joueur.

### Correction d'un bug dans le code d'origine

La riposte écrivait sur `actor`, qui désigne dans `enemyAction` l'objet du
combat reçu, alors que l'état renvoyé est reconstruit à partir de copies. Les
dégâts de riposte étaient perdus. Ils s'appliquent désormais sur la copie
réellement conservée.

## Dégâts périodiques contre les boss

Sur un boss, les dégâts de Brûlure, Saignement et Corruption basés sur les PV
maximum sont désormais plafonnés par l'Attaque de la source, mémorisée au moment
où le malus est appliqué.

- Brûlure : plafond à 1,15 × Attaque de la source.
- Saignement : plafond à 1,05 × Attaque.
- Corruption : plafond à 0,95 × Attaque.

Poison et Agonie ne sont pas concernés.

Sur une cible ordinaire, ou si l'Attaque de la source n'est pas connue, le
calcul reste inchangé. Un combat déjà engagé ne change donc pas de comportement
en cours de route.

L'attribution aux statistiques de combat passe par le même calcul que les dégâts
réellement infligés : le rapport de fin de combat ne surestime plus les dégâts
périodiques.

### Effet sur l'équilibrage

C'est un affaiblissement réel des trois afflictions en raid, Mythic+ et contre
les boss de campagne. Sur un boss à 100 000 PV, une Brûlure posée par un
champion à 300 d'Attaque passe de 5 000 à 345 dégâts par tour. Le plafond ne
mord pas sur les ennemis ordinaires.

## Vérification

`npm test` — 156 tests, dont 26 dédiés à ces correctifs
(`tests/engine.sets.test.js`).

Chaque règle a été validée par mutation : modifier le taux de bouclier, le seuil
de riposte dans les deux sens, le taux d'Incendiaire, le plafond de Saignement,
ou désactiver le plafond, fait échouer les tests correspondants. Réintroduire le
bug de riposte sur `actor` en fait échouer trois.

## Fichiers

```
src/battle/engine.js
tests/engine.sets.test.js
tests/sets.contract.test.js
Audit/RAPPORT-SETS-ORPHELINS.md
Audit/RAPPORT-SUPPRESSION-COMBAT-ENGINE.md
```
