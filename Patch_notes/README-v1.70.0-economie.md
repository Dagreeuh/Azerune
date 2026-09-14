# Chroniques d'Azerune v1.70.0

## Deux compteurs de Chronique qui ne comptaient pas

**Type :** correctifs
**Date :** 10 septembre 2026

Dernier volet de la battue « annoncé mais jamais appliqué », après les
champions (v1.67.0), les Empreintes et armes Uniques (v1.68.0), et les affixes
Mythic+ (v1.69.0). Cette fois sur les trois systèmes qui touchent aux
ressources : la Boutique, les Hauts faits et les Quêtes.

## Statistiques de Chronique

- **Reliques trouvées** et **Chroniques activées** affichaient toujours zéro.
  Les deux compteurs existaient dans la sauvegarde et étaient bien lus par la
  page de statistiques, mais rien ne les incrémentait jamais. Un joueur qui
  avait trouvé dix reliques en voyait zéro. Ils comptent désormais.

## Ce qui a été vérifié et qui était déjà juste

Aucun correctif n'a été nécessaire ailleurs, et c'est la conclusion la plus
utile de ce volet :

- les **23 événements** de suivi de quêtes sont tous émis par le jeu ;
- les **7 types de récompense** (or, cristaux, Pierres de foyer, Essence de
  forge, Tomes de maîtrise, Fragments universels 5★, XP d'Invocateur) sont tous
  versés ;
- les **5 types d'offres** et les **3 devises** de la Boutique sont tous
  traités, Fragments de sang compris ;
- les quatre refus d'achat (devise inconnue, stock épuisé, solde insuffisant,
  inventaire plein) fonctionnent tous.

## Couverture

`tests/economie.contrats.test.js` : 12 tests, 12 mutations sur 12 tuées.
Suite complète : **1493 tests**, 69 fichiers, tous au vert.

Détail complet, y compris la sonde de navigateur qui a d'abord accusé la
Boutique à tort : `Audit/RAPPORT-EXPERIENCE-JOUEUR.md`, section 16.
