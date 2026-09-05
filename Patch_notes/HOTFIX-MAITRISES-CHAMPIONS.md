# Azerune v1.51.2 - Maîtrises de tous les champions

## Contenu

- 104 hauts faits de maîtrise répartis sur 26 champions.
- 4 maîtrises par champion : les trois compétences du kit et une maîtrise de rôle.
- Noms distincts et descriptions précises pour les hauts faits généraux.
- Suivi des utilisations de compétences résolues dans le moteur de combat.
- Agrégation par champion des dégâts, soins, mitigations, combats et victoires.
- Affichage d'un détail technique pour chaque maîtrise.
- Récompenses complétées dans l'interface : Pierres, Tomes et fragments universels.

## Fichiers modifiés

```text
src/data/achievements.js
src/battle/engine.js
src/store/GameContext.jsx
src/pages/AchievementsPage.jsx
```

## Installation

Extraire le ZIP à la racine du projet et accepter le remplacement, puis exécuter :

```powershell
npm run build
```

## Important

Les nouvelles statistiques de maîtrise commencent à être comptées à partir de l'installation de cette version. Les anciennes réclamations et les statistiques globales déjà enregistrées sont conservées.

## Tests

1. Lancer un combat avec trois champions.
2. Utiliser chaque compétence au moins une fois.
3. Terminer le combat.
4. Ouvrir Hauts faits, catégorie Champions.
5. Rechercher chacun des trois champions utilisés.
6. Vérifier la progression des compétences et de la maîtrise de rôle.
7. Recharger le jeu et contrôler la persistance.
