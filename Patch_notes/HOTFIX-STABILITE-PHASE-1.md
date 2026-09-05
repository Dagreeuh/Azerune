# Azerune - Stabilisation technique phase 1

## Portée

Correctif construit avec les fichiers effectivement disponibles dans les lots 3 à 7.

## Corrections majeures

- Correction de l’écran noir Invocation causé par `fiveindexes` / `focuscursor`.
- Validation de la session visuelle d’Invocation et écritures locales sécurisées.
- Verrou local commun aux invocations simples et x10.
- Ajout d’un `battleId`, d’une version de schéma et d’un compteur `actionSeq` au moteur.
- Verrou synchrone de finalisation des récompenses dans `BattlePage`.
- Verrous locaux pour quêtes, coffres, hauts faits, Forge, conversions et lancements d’activités.
- Filtrage des sets invalides dans la Campagne et les Expéditions.
- Exclusion des anciennes zones du total d’étoiles affiché lorsque `difficultyStars` est disponible.
- Messages d’erreur visibles lors d’un échec de préparation d’activité.
- `MythicPage` accepte désormais `setPage` et redirige vers le combat après préparation.

## Limite volontaire

L’Error Boundary racine, le stockage atomique, la migration complète et le registre persistant `rewardedSessions` nécessitent les versions actuelles de `main.jsx`, `App.jsx`, `GameContext.jsx`, `storage.js`, `SettingsPage.jsx` et `Layout.jsx`. Ces fichiers ne sont pas remplacés dans cette phase car ils ne sont pas présents parmi les fichiers locaux disponibles lors de la génération.

## Installation

Extraire le ZIP à la racine du projet, accepter les remplacements, puis exécuter `npm run build`.
