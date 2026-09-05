# Hotfix Raid - Faisabilité du Cœur incandescent

## Correctifs
- L'Élémentaire de braise réapparaît après 7 actions aux niveaux 1 à 3, 5 actions aux niveaux 4 à 7, puis 4 actions aux niveaux 8 à 10.
- Sa destruction retire toujours 4 charges avant l'ajout de la charge de fin d'action.
- À partir de 60 % du seuil du Cœur, l'AUTO donne une priorité absolue à l'Élémentaire vivant.
- L'Éruption frappe désormais les boucliers avant les PV.
- Ignifuge réduit l'impact direct de l'Éruption de 10 %, en plus de sa réduction existante de 25 % sur les ticks de Brûlure.
- Dégâts directs de l'Éruption : 60 % aux niveaux 1 à 3, 70 % aux niveaux 4 à 6, 75 % aux niveaux 7 à 8, 80 % au niveau 9, 85 % au niveau 10.
- La barre du Raid affiche la priorité mécanique et le délai avant le retour de l'Élémentaire.

## Fichiers modifiés
- src/battle/engine.js
- src/data/raids.js
- src/pages/BattlePage.jsx

## Installation
Extraire l'archive directement à la racine du projet, accepter les remplacements, puis lancer `npm run build`.
