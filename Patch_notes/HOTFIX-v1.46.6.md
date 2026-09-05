# Azerune Hotfix v1.46.6

## Objectif
Corriger le plantage de `BattlePage` introduit par la navigation contextuelle après victoire.

## Corrections
- Suppression du `useMemo` appelé après un retour conditionnel.
- Rétablissement d’un ordre de Hooks identique à chaque rendu.
- Suppression des mises à jour de `GameProvider` depuis les fonctions de mise à jour locale de `BattlePage`.
- Synchronisation de `battle`, `target` et `missionReward` avec la session persistante dans un `useEffect` après rendu.
- Conservation de la navigation `Mission suivante`, `Niveau suivant`, `Rejouer` et `Retour à l’activité`.

## Cause technique
Le calcul de la mission suivante utilisait `useMemo` après `if (!battle) return ...`. Le premier rendu n’appelait pas ce Hook, puis le rendu suivant l’appelait, ce qui violait l’ordre des Hooks React. Les setters locaux appelaient également `updateBattleSession()` au sein d’un autre setter, produisant une mise à jour du `GameProvider` pendant le rendu de `BattlePage`.

## Fichier modifié
- `src/pages/BattlePage.jsx`

## Vérifications
- Compilation JSX avec esbuild.
- Aucun Hook conditionnel restant pour le calcul de la mission suivante.
- Aucune mise à jour de `GameProvider` dans un setter local de `BattlePage`.
- Archive ZIP vérifiée.

## Installation PC
```powershell
Ctrl+C
Remove-Item -Recurse -Force .\node_modules\.vite -ErrorAction SilentlyContinue
npm run dev -- --force
```

Recharge ensuite avec `Ctrl+F5`.

## Installation Android
```powershell
npm run build
npx cap sync android
npx cap open android
```

## Test recommandé
1. Ouvrir une mission.
2. Lancer le combat.
3. Vérifier l’absence d’avertissement sur l’ordre des Hooks.
4. Gagner le combat.
5. Tester `Mission suivante` ou `Niveau suivant`.
