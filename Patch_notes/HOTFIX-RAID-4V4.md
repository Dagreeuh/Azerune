# Hotfix Raid 4v4

## Version de référence
Ce correctif utilise `BattlePage.valid.jsx` comme source et l'installe sous `src/pages/BattlePage.jsx`.

## Changements
- Quatrième champion réellement sélectionnable dans la préparation du Raid.
- Renfort temporaire sans modification des presets 3v3.
- Affichage conditionnel du format 4v4 dans le combat.
- Transmission du combat complet à `finishRaidMission()`.
- Affichage du compteur d'actions avant l'enrage.
- Affichage de l'enrage et des échecs mécaniques.
- Affichage du bilan de performance dans la fenêtre de victoire.
- Affichage de l'éventuel second équipement de maîtrise.

## Fichiers modifiés
- src/battle/engine.js
- src/components/Layout.jsx
- src/pages/BattlePage.jsx
- src/store/GameContext.jsx

## Installation
Extraire l'archive directement à la racine du projet, accepter les remplacements, puis lancer `npm run build`.
