# Chroniques d'Azerune v1.72.0

## Chaque champion déclare désormais sa propre ressource

**Type :** refonte technique
**Date :** 10 septembre 2026

Aucun changement visible en jeu — et c'est précisément ce qui a été vérifié.

## Ce qui change pour le jeu

Rien. L'affichage des ressources de champion (Fragments d'âme, Braises, Reflux,
Instabilité, Serment du gardien…) est identique, caractère pour caractère.

La vérification : le composant de carte a été rendu en HTML avant et après la
refonte, sur **1 632 combinaisons** — les 32 champions × 17 états de mécanique
× 3 terrains de combat. **Zéro différence.** La référence est conservée dans le
dépôt et rejouée à chaque exécution des tests.

## Ce qui change pour la suite

L'écran de combat contenait 23 identifiants de champion codés en dur et 24
variables nommées d'après un champion précis, dans un composant de 32 000
caractères recalculé à chaque rendu et pour chaque unité. Ajouter un champion
voulait dire éditer ce bloc.

Chaque champion déclare maintenant sa ressource à côté de son identité, et
l'écran se contente de l'afficher :

| Le composant de carte | Avant | Après |
|---|---|---|
| Taille | 31 989 caractères | 22 627 |
| Identifiants de champion en dur | 23 | 0 |
| Variables nommées d'après un champion | 24 | 0 |

**Ajouter un champion** ne demande plus aucune modification de l'écran de
combat : une entrée de statistiques et de sorts, une entrée d'identité, et une
entrée de ressource s'il en a une.

Surtout, un champion ajouté sans ressource déclarée fait désormais **échouer les
tests** — c'est la famille de bugs « annoncé au joueur mais jamais appliqué »
qui ne peut plus naître par simple oubli.

## Le moteur

Pas une ligne touchée.

## Couverture

`tests/ressources.champions.test.js` : 23 tests, 20 mutations sur 20 tuées.
Suite complète : **1 527 tests**, 71 fichiers, tous au vert.

Détail complet, dont les trois mutants qui avaient d'abord survécu à la matrice
de 1 632 cas : `Audit/RAPPORT-EXPERIENCE-JOUEUR.md`, section 18.
