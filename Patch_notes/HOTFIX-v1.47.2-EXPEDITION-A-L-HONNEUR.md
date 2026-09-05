# Chroniques d'Azerune v1.47.2

## Expédition à l'honneur quotidienne

**Type :** hotfix de contenu quotidien  
**Date :** 20 août 2026

## Changements

- Ajout d'une Expédition à l'honneur différente selon le jour.
- Ajout d'un objectif quotidien de 3 victoires récompensées.
- Les combats d'entraînement ne progressent pas dans l'objectif.
- Ajout d'un coffre fixe à récupérer manuellement.
- Le compteur est plafonné à 3/3.
- Une seule récupération est possible par jour.
- Le choix du dimanche est effectué par le joueur et verrouillé après validation.
- Aucun changement des 6 Sceaux quotidiens.
- Aucun changement du bonus de première victoire.

## Calendrier

- Lundi : Trésorerie des Gobelins
- Mardi : Sanctuaire des Anciens
- Mercredi : Forge astrale
- Jeudi : Sanctuaire de l'Ascension
- Vendredi : Trésorerie des Gobelins
- Samedi : Sanctuaire des Anciens
- Dimanche : choix du joueur

## Coffres fixes

- Trésorerie des Gobelins : 5 000 Or
- Sanctuaire des Anciens : 500 XP par champion de l'équipe active
- Forge astrale : 50 Essences de forge
- Sanctuaire de l'Ascension : 10 Essences mineures et 2 Essences majeures

Aucune Essence mythique et aucun multiplicateur x2 ne sont accordés.

## Fichiers modifiés

```text
src/pages/ExpeditionsPage.jsx
src/data/expeditions.js
src/store/GameContext.jsx
src/styles.css
```

## Vérifications réalisées

- Compilation JSX de `ExpeditionsPage.jsx` avec esbuild.
- Compilation JSX de `GameContext.jsx` avec esbuild.
- Compilation JavaScript de `expeditions.js` avec esbuild.
- Vérification de la compatibilité avec les anciennes sauvegardes.
- Vérification du plafond à 3 victoires.
- Vérification de l'exclusion du mode entraînement.
- Vérification de la récupération unique du coffre.
- Vérification du choix et du verrouillage du dimanche.

## Installation

Copier les quatre fichiers dans leurs dossiers respectifs, puis exécuter depuis la racine du projet :

```powershell
npm run build
npx cap sync android
npx cap open android
```

Dans Android Studio :

```text
Build
→ Build App Bundle(s) or APK(s)
→ Build APK(s)
```
