# Chroniques d'Azerune v1.76.0

## Le niveau des champions s'affiche en combat

**Type :** interface
**Date :** 10 septembre 2026

Chaque carte alliée porte désormais le niveau de son champion, en haut à droite.

Le niveau était visible partout — Codex, Équipe, Inventaire — sauf là où il
compte le plus : au moment de choisir qui joue.

## Détails

- La pastille n'apparaît que sur les **alliés** : les ennemis n'ont pas de
  niveau, et une pastille vide aurait été un mensonge de plus.
- Elle partage son coin avec le marqueur **AUTO**, mais les deux ne peuvent
  jamais coexister : AUTO ne s'affiche que sur un ennemi ciblé
  automatiquement. Un test fige cette séparation, pour qu'un changement futur
  ne les fasse pas se chevaucher en silence.
- Elle ne capte pas le clic : la carte entière reste sélectionnable.
- Vérifiée à 430 px et à 1440 px, sans débordement.

## Couverture

`tests/niveau.en.combat.test.js` : 10 tests, 7 mutations sur 7 tuées.
Suite complète : **1 618 tests**, 75 fichiers, tous au vert.
