# Azerune - Extension des hauts faits jusqu'au late game

## Contenu

- Extension massive des hauts faits de Combat, Campagne, Invocation, Forge, Expéditions, Raids, Mythic+ et Chroniques.
- Ajout des dégâts reçus, dégâts périodiques, dégâts critiques, ennemis et boss vaincus.
- Ajout des victoires parfaites, AUTO et manuelles.
- Ajout des séries de campagne et Mythic+.
- Ajout des recyclages, équipements et transferts.
- Ajout des invocations x10, 5 étoiles, doublons et Pity.
- Ajout d'objectifs de niveau 60, équipes 6 étoiles, collection complète et armes Uniques.
- Nouvelle vue avec score, pourcentage global, compteurs, alertes par catégorie et détails des récompenses.

## Fichiers modifiés

- `src/data/achievements.js`
- `src/pages/AchievementsPage.jsx`
- `src/styles.css`

## Installation

Extraire le ZIP directement à la racine du projet et remplacer les fichiers existants.

## Vérifications

- Syntaxe JavaScript et JSX contrôlée.
- Identifiants de hauts faits uniques.
- Compatibilité avec les compteurs déjà présents dans `progressionStats`.
- Les anciens hauts faits et réclamations sont conservés.

## Suite du chantier

La partie Quêtes journalières, hebdomadaires, mensuelles et permanentes sera raccordée avec les fichiers `src/data/quests.js` et `src/pages/QuestsPage.jsx` actuels.
