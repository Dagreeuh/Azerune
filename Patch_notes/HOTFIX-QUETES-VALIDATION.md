# Hotfix validation des quêtes

## Causes corrigées
- Les compétences envoyaient `skills` alors que les quêtes attendaient `skillUsed`.
- Aucune progression n’était envoyée pour `weeklyQuestClaimed`.
- Aucune progression n’était envoyée pour `campaignStarsEarned`.
- Aucune progression fiable n’était envoyée pour `teamComposed`.
- Les niveaux de champion n’émettaient pas `heroLevelReached`.
- Mythic+ 30 n’émettait pas `mythicLevelReached`.
- Les Fragments d’âme universels n’étaient pas affichés dans les récompenses du journal.

## Compatibilité
Les compteurs existants sont conservés. Les prochaines actions valides feront progresser normalement les quêtes. Aucun compteur n’est artificiellement complété.

## Fichiers modifiés
- src/store/GameContext.jsx
- src/pages/QuestsPage.jsx
- src/data/quests.js

## Installation
Extraire à la racine du projet, accepter les remplacements, puis lancer `npm run build`.
