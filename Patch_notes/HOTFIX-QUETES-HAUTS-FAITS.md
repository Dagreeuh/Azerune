# Azerune v1.51.0 - Quêtes et hauts faits globaux

## Contenu

- 8 quêtes journalières avec coffre à 6 objectifs.
- 9 quêtes hebdomadaires avec coffre à 7 objectifs.
- 10 quêtes mensuelles avec coffre à 8 objectifs.
- Parcours permanent de l'Invocateur du début au late game.
- Compteurs permanents pour combats, statistiques, Forge, invocation et activités.
- Séries de hauts faits à plusieurs paliers.
- Premières maîtrises de champions extensibles.
- Agrégation du rapport de combat dans la progression globale.
- Migration additive des anciennes sauvegardes.
- Protection contre le double comptage des combats persistants.
- Attribution centralisée des récompenses étendues.

## Fichiers

```text
src/data/quests.js
src/data/achievements.js
src/store/GameContext.jsx
src/pages/QuestsPage.jsx
src/pages/AchievementsPage.jsx
src/pages/BattlePage.jsx
src/battle/engine.js
src/styles.css
```

## Installation

Extraire l'archive à la racine du projet et accepter le remplacement, puis exécuter :

```powershell
npm run build
```

## Tests prioritaires

1. Charger une ancienne sauvegarde.
2. Vérifier les quatre onglets du Journal.
3. Terminer 6 journalières et ouvrir le coffre.
4. Faire une invocation x1 et x10.
5. Améliorer, recycler, équiper et transférer un objet.
6. Terminer un combat manuel puis AUTO.
7. Vérifier les compteurs de dégâts, soins, mitigation et DOT.
8. Terminer Campagne, Expédition, Raid et Mythic+.
9. Réclamer une quête permanente et un haut fait.
10. Recharger la page et contrôler la persistance.

## Notes

Les historiques visuels restent limités, mais les nouveaux compteurs permanents ne dépendent plus de leur longueur. Les anciennes réclamations sont conservées.
