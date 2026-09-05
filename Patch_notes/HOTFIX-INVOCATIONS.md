# Azerune - Correctif ciblé des invocations

## Cause

La fonction `request()` verrouillait `busy.current` avant d'appeler `start()` pour une invocation x10. `start()` détectait alors le verrou et quittait immédiatement, ce qui empêchait les invocations x10 avec ou sans confirmation.

## Correction

- Le verrou est désormais pris par `start()` uniquement au moment réel de l'invocation x10.
- L'ouverture de la confirmation ne verrouille plus l'invocation.
- L'invocation simple conserve un verrou court protégé par `try/finally`.
- Une erreur ou un refus de `summonMany()` libère le verrou.
- L'annulation de la confirmation réinitialise le verrou transitoire.
- La normalisation des sessions et la correction de casse `fiveIndexes` / `focusCursor` sont conservées.

## Fichier modifié

```text
src/pages/SummonPage.jsx
```

## Installation

Extraire le ZIP à la racine du projet, accepter le remplacement, puis lancer :

```powershell
npm run build
```
