# Chroniques d'Azerune v1.66.0

## Équilibrage de Mathanae

**Type :** équilibrage de champion
**Date :** 8 septembre 2026

## En bref

Mathanae ressortait **1er sur 32** en taux de victoire (49,1 % contre 20,2 %
de moyenne) et **trois fois** au-dessus du tank suivant. Trois retouches de
kit le ramènent à 31,1 % : toujours le meilleur tank du jeu, plus le meilleur
champion du jeu.

**Ses statistiques n'ont pas été touchées** — il n'était pas surstatté (8ᵉ sur
11 chez les 5★). Le problème était le cumul de son kit.

## Modifications

### Sigil de tourment
- gain de Fragments plafonné à **2 par lancer** (au lieu de 1 par cible) :
  il faut maintenant trois lancers pour remplir la jauge au lieu de deux ;
- renfort de Défense ramené à **2 tours** (recharge de 3) : il n'est plus
  permanent, ce qui comptait double puisque ses dégâts scalent sur la Défense ;
- la provocation de zone est **conservée** : c'est son identité de tank.

### Métamorphose démoniaque
- le bouclier protège désormais les **2 alliés les plus bas en PV** au lieu de
  toute l'équipe ;
- soin personnel ramené de 8 % + 6 %/Fragment à **5 % + 4 %/Fragment**
  (il se rendait jusqu'à 38 % de ses PV maximum d'un seul sort).

### Descriptions des sorts
Les textes annonçaient encore l'ancien comportement. Ils sont corrigés, et un
test de contrat garantit maintenant que description et moteur restent
synchronisés.

## Vérification

12 nouveaux tests, 17 mutations testées et toutes tuées, suite complète au
vert (1305 tests, 52 fichiers).

Détail complet et chiffres de mesure : `Audit/RAPPORT-MATHANAE.md`.
