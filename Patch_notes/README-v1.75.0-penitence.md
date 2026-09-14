# Chroniques d'Azerune v1.75.0

## Pénitence : le soin de Lelianna se voit enfin

**Type :** correctif d'équilibrage
**Date :** 10 septembre 2026

## Le problème

La Pénitence rendait **34 PV** sur une barre de 3 750, et à un seul allié. Le
journal l'affichait, le calcul était juste — et le soin était invisible.

Elle convertissait **35 % des dégâts infligés**. Mais dans ce jeu un coup vaut
environ 3 % d'une barre de vie : 35 % de cela vaut 1 %. Pour rendre le quart
d'une barre, il aurait fallu infliger plus de dégâts que la cible n'a de points
de vie. Aucun réglage du pourcentage ne pouvait sauver cette règle.

Deux autres défauts au passage :

- **« Frappe trois fois » ne changeait rien** : la puissance était divisée par le
  nombre de coups, donc trois frappes valaient une.
- **Son ultime frappait moins fort que son attaque de base** (.52 contre .84),
  pour cinq tours de recharge.

## Ce qui change

**L'Expiation ne convertit plus des dégâts.** Chaque coup porté par Lelianna
rend **6 % des PV maximum** aux alliés qui la portent (8 % en Résonance IV) —
un soin par coup, ce qui donne enfin un sens aux trois frappes.

- **Pénitence** applique désormais l'Expiation à **toute l'équipe**, puis frappe
  trois fois : **18 % de PV rendus à chaque allié**. Sa puissance passe de .52
  à .95.
- **Châtiment** entretient la fenêtre : 6 % par allié, sans recharge, tant que
  l'Expiation tient.

L'ultime ouvre la fenêtre, le sort de base l'entretient. Sur trois actions,
Lelianna rend désormais **90 % d'une barre** répartis sur l'équipe, tout en
infligeant des dégâts.

Elle reste loin derrière une soigneuse pure : le Renouveau de Yunmei rend 158 %
d'une barre d'un seul sort.

## Textes corrigés

Le Châtiment annonçait « déclenche Expiation ». Il ne l'a jamais posée — il
soigne ceux qui la portent. Le texte le dit maintenant.

## Couverture

`tests/lelianna.expiation.test.js` : 17 tests, 10 mutations sur 10 tuées.
Suite complète : **1 608 tests**, 74 fichiers, tous au vert.

Mesures et détail : `Audit/RAPPORT-EXPERIENCE-JOUEUR.md`, section 21.
