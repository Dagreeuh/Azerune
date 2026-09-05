# Azerune v1.50.1 - Correction de la leçon 7 AUTO

## Objectif

La leçon 7 montre désormais le parcours réel du joueur au lieu de présenter uniquement une liste abstraite de compétences.

## Changements

- Reproduction du bouton `▶ AUTO` à droite de l'interface de combat, au-dessus du menu inférieur.
- Démonstration de son état actif `⏸ AUTO ACTIF` en vert.
- Parcours simulé vers `Équipe`, puis vers la carte d'Elowen.
- Mise en évidence du bouton `⚙ Priorités AUTO` présent sur la carte du champion.
- Configuration interactive des priorités :
  1. Sève régénérante
  2. Prison de racines
  3. Ronce entravante
- Explication claire : les positions 1, 2 et 3 sont un ordre de vérification, pas une rotation garantie.
- Simulation montrant le passage à la priorité suivante lorsque la précédente est indisponible.
- Validation uniquement après activation d'AUTO, ouverture du réglage, enregistrement du bon ordre et lancement de la simulation.

## Fichiers modifiés

- `src/data/tutorials.js`
- `src/components/TutorialModal.jsx`
- `src/styles.css`

## Installation

Extraire le ZIP directement à la racine du projet et remplacer les fichiers existants.

## Vérifications

1. Ouvrir Académie, puis la leçon 7.
2. Vérifier l'emplacement présenté pour `▶ AUTO`.
3. Cliquer dessus et vérifier le passage à `⏸ AUTO ACTIF`.
4. Ouvrir la simulation Équipe puis `⚙ Priorités AUTO` sur Elowen.
5. Placer les sorts dans l'ordre demandé et enregistrer.
6. Lancer la simulation et terminer la leçon.
7. Vérifier l'affichage sur ordinateur et smartphone.
