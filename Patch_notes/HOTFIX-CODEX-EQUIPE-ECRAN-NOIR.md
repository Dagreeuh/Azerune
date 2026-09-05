# Azerune v1.51.3 - Correctif écran noir Codex et Équipe

## Cause

Le nom `progressionStats` était utilisé à la fois pour :

- la fonction de calcul des statistiques naturelles d'un champion importée depuis `src/utils/stats.js` ;
- le nouvel état global des hauts faits ajouté dans `GameContext.jsx`.

L'état React masquait la fonction importée. À l'ouverture de Codex ou Équipe, `HeroesPage.jsx` appelait `naturalStats(hero)`, puis `GameContext.jsx` essayait d'exécuter l'objet `progressionStats` comme une fonction, provoquant l'écran noir.

## Correction

La fonction importée est désormais renommée localement en :

```text
championProgressionStats
```

Le calcul `naturalStats` appelle donc à nouveau la bonne fonction, tandis que l'état global `progressionStats` conserve son nom et ses données.

## Fichier modifié

```text
src/store/GameContext.jsx
```

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement, puis exécuter :

```powershell
npm run build
```

Aucune sauvegarde ne doit être supprimée.
