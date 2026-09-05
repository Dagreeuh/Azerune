# Hotfix Histéria - Dégâts reçus dans le rapport de combat

## Corrections

- Ajout de la statistique **Dégâts reçus** pour chaque champion.
- Ajout du champion ayant reçu le plus de dégâts dans l'en-tête du rapport.
- Ajout du total des dégâts reçus dans le pied du rapport.
- Conservation de **Mitigation** comme dégâts réellement empêchés par bouclier, redirection ou réduction personnelle.
- Comptabilisation des attaques ennemies, dégâts périodiques, Éruption de raid et affixe Déchaînement.
- La redirection de Thorgar compte comme dégâts reçus par Thorgar et comme mitigation pour l'allié protégé.
- Ajout de **Dégâts directs** dans les détails pour expliquer entièrement le total d'Histéria.

## Fichiers

- `src/battle/engine.js`
- `src/pages/BattlePage.jsx`
- `src/styles.css`

## Installation

Extraire le ZIP à la racine du projet et remplacer les fichiers. Un nouveau combat doit être lancé pour produire les nouvelles statistiques.
