# Chroniques d'Azerune v1.77.0

## Pierre et or, et un combat en plein écran

**Type :** refonte d'interface
**Date :** 10 septembre 2026

## L'ambiance

Le jeu ressemblait à un tableau de bord : cartes ardoise, aplats froids, aucun
vocabulaire d'heroic fantasy. Il porte désormais une palette de **pierre, de
métal et d'or**, des titres à empattements, des barres de vie creusées et des
panneaux cerclés.

La palette n'a pas été inventée : elle est **extraite du Journal de quêtes**,
seul écran qui portait déjà l'ambiance — parchemin, sceaux, bordures d'or. Elle
y était enfermée ; elle est maintenant disponible partout.

| | Avant | Après |
|---|---|---|
| Variables de thème | 7 (dont 5 pour les effets de sort) | 30 |
| Couleurs écrites en dur | 2 459 | 728 |

## Le combat

**Il se joue en plein écran.** Le bandeau de profil, les monnaies et la
navigation s'effacent tant que le combat dure, et reviennent pour l'écran de
résultat. On quitte par un bouton explicite, avec confirmation.

**Les commandes sont rassemblées.** AUTO, vitesse, effets, affinités et sortie
vivaient dans quatre coins différents de l'écran, dont un par-dessus le journal.
Elles forment maintenant une seule barre en haut.

| | Avant | Après |
|---|---|---|
| Cibles tactiles trop petites | 4 sur 13 | **0** |
| Boutons flottants dispersés | 4 | 0 |
| Texte le plus petit | 6 px | 8 px |
| Hauteur de l'arène | 468 px | **566 px** |

**Les deux camps se distinguent enfin** : rouge sombre pour les ennemis, vert
sombre pour l'escouade.

**Les noms de champions ne sont plus tronqués.** « Thorgar » s'affichait « T… ».
Le portrait est maintenant au-dessus et le nom en dessous, sur toute la largeur
de la carte — comme un cadre d'unité. La pastille de niveau se réduit au nombre,
le libellé complet restant dans l'infobulle.

## Couverture

`tests/interface.ambiance.test.js` : 16 tests, 13 mutations sur 13 tuées.
Suite complète : **1 635 tests**, 76 fichiers, tous au vert.
Vérifié en jeu à 430 px et 1440 px, sans débordement ni erreur console.

Diagnostic chiffré et réserves : `Audit/RAPPORT-EXPERIENCE-JOUEUR.md`,
section 22.
