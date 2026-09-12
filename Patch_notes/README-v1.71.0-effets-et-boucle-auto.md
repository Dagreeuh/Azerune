# Chroniques d'Azerune v1.71.0

## Les effets de sort, et le mode AUTO qui gelait un combat sur deux

**Type :** correctifs
**Date :** 10 septembre 2026

## Effets visuels des sorts

- Ils ne s'affichaient **jamais** sur un appareil réglé sur « réduire les
  animations » — un réglage que l'économie d'énergie active toute seule sur
  Android et qui est courant en accessibilité sur iOS. Le CSS masquait la
  couche en dur pendant que le bouton ✨ continuait d'annoncer que les effets
  étaient actifs. Le réglage système décide désormais de l'état initial du
  bouton, plus jamais du rendu : les effets restent coupés par défaut dans ce
  cas, mais une tape les rallume vraiment.
- Le réglage des Paramètres s'appelait « Réduire les animations d'invocation »
  alors qu'il coupait aussi les effets de combat. Le libellé le dit maintenant,
  et rappelle que le bouton ✨ règle le combat à tout moment.

## Mode AUTO

- **Le combat gelait dans six cas sur huit en vitesse x2** : AUTO affiché
  « ACTIF », un allié figé à 100 % de jauge, et plus aucune action. La boucle
  abandonnait le tour au lieu de le repousser ; comme aucune action n'était
  jouée, rien ne pouvait la réveiller. Elle se réarme désormais, et le watchdog
  peut la relancer même quand c'est le même champion qui doit jouer.
- **Le tour ennemi était figé à une demi-seconde** quelle que soit la vitesse
  choisie : en x3 l'escouade jouait trois fois plus vite que l'adversaire et le
  combat avançait par à-coups. Les deux suivent maintenant le même réglage.
- **Deux tapes rapides sur le bouton de vitesse ne comptaient que pour une.**

## Préparation du combat

- **« Estimer mes chances » est retiré.** Savoir avant de lancer qu'on gagne
  17 fois sur 20 supprimait la seule question qui donne un intérêt au combat.

## Couverture

`tests/effets.visuels.test.js` (8 tests) et quatre tests ajoutés à
`tests/confort.balayage.test.js` : 12 mutations sur 12 tuées.
Suite complète : **1 504 tests**, 70 fichiers, tous au vert.

Mesures et diagnostic complet : `Audit/RAPPORT-EXPERIENCE-JOUEUR.md`, section 17
— qui répond aussi à la question « le moteur suivra-t-il ? ».
