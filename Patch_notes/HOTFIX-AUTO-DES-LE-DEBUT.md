# Azerune - AUTO activable dès le début du combat

## Problème corrigé

Le bouton AUTO pouvait être activé pendant que `battle.turn` était encore nul. La boucle AUTO exigeait pourtant un acteur actif, ce qui pouvait laisser le combat en attente jusqu'à une première compétence manuelle.

## Correction

- L'activation d'AUTO initialise immédiatement le premier tour si nécessaire.
- La boucle AUTO possède une seconde sécurité si le mode est actif mais qu'aucun acteur n'est encore défini.
- Si l'ennemi commence, l'action ennemie existante se lance normalement.
- Si un champion commence, sa priorité AUTO est évaluée sans action manuelle préalable.
- La reprise d'un combat et les nouvelles vagues Mythic+ restent compatibles.
- En cas d'erreur d'initialisation, AUTO se désactive proprement avec un message dans le journal.

## Fichier modifié

```text
src/pages/BattlePage.jsx
```

`engine.js` et `styles.css` ont été contrôlés mais ne nécessitent pas de modification pour ce problème.

## Installation

Extraire le ZIP à la racine du projet, accepter le remplacement, puis lancer :

```powershell
npm run build
```
