# Azerune - Hotfix fenêtre de victoire après Rejouer

## Version
Hotfix v1.50.15

## Problème corrigé
Après une première victoire, le verrou de finalisation restait actif. **Rejouer** lançait une bataille, mais la victoire suivante ne recalculait plus `missionReward`, ce qui laissait la fenêtre minimale.

## Changements
- Réinitialisation du verrou des récompenses à chaque nouveau combat.
- Réinitialisation des verrous AUTO et ennemi, du rapport et des événements visuels.
- Retour de la fenêtre complète après une mission rejouée.
- Affichage du record d'étoiles déjà acquis.
- Détails du butin répétable : set, emplacement, étoiles et qualité.
- Message clair si aucun équipement ne tombe.
- État transitoire « Calcul des récompenses en cours… » au lieu du résumé générique.
- Aucune réattribution des cadeaux, étoiles ou jalons de première victoire.

## Fichiers modifiés
```text
src/pages/BattlePage.jsx
src/styles.css
```

`GameContext.jsx` a été audité mais n'est pas modifié, car sa logique distingue déjà la première victoire du farm.

## Installation
Extraire à la racine du projet, accepter les remplacements, puis lancer :

```powershell
npm run build
```
