# Azerune — Hotfix : les 104 maîtrises de champion ne pouvaient pas progresser

## Problème

Sur les 224 hauts faits du jeu, **104 étaient impossibles à terminer** — soit
46 % du catalogue. Toutes les maîtrises de champion : 4 par champion, 3 pour les
compétences du kit et 1 pour le rôle, sur 26 champions.

Leur compteur restait à zéro quel que soit le nombre de combats joués.

## Cause

Un haut fait désigne sa source par un chemin en clair, par exemple
`champions.1.skillUses.guardianStrike`. La résolution se fait par un `reduce`
sur les points, avec un repli à `0` :

```js
const get=(o,p,d=0)=>p.split('.').reduce((v,k)=>v?.[k],o)??d;
```

Un chemin qui ne résout pas ne lève rien : il renvoie `0`. Le haut fait reste
donc affiché, avec sa récompense, bloqué à zéro pour toujours.

Or `progressionStats.champions` était initialisé à `{}` et **jamais écrit** :
aucun des six appels à `setProgressionStats` ne le touchait.

Le patch note v1.51.2 annonçait pourtant les deux moitiés du travail :

- « Suivi des utilisations de compétences résolues dans le moteur de combat » —
  **fait** : le moteur écrit bien `skillUses:{[skill.effect]:1}` dans
  `combatStats`.
- « Agrégation par champion des dégâts, soins, mitigations » — **absente**.

La donnée était produite à chaque combat, puis jetée.

## Correction

`recordBattleResult` agrège désormais le rapport de combat dans
`progressionStats.champions`, via `mergeChampionStats`.

L'appel est placé dans le même bloc de mise à jour que le reste des
statistiques, et hérite donc de la protection existante contre le double
comptage d'un combat déjà traité.

La correspondance est directe : `combatStats` est indexé par identifiant de
champion et porte déjà `damage`, `healing`, `mitigation` et `skillUses`, ce qui
est exactement l'ensemble des chemins lus par les 104 maîtrises.

Aucun compteur n'est rétroactivement crédité. Les prochains combats font
progresser les maîtrises normalement.

## Verrou

`tests/achievements.contract.test.js` vérifie les 224 compteurs :

- chaque chemin global résout dans la forme des statistiques, et pointe sur un
  nombre et non sur une branche ;
- chaque compteur de maîtrise vise un champion qui existe, et un effet qui
  appartient réellement au kit de ce champion ;
- chaque compteur de rôle vise une métrique effectivement cumulée ;
- l'agrégation est bien appelée, et un haut fait de maîtrise devient réalisable
  après assez de combats.

Contrôle du verrou : retirer l'appel à `mergeChampionStats` fait échouer le test
« le rapport de combat est agrégé dans progressionStats ».

## Réorganisation

`emptyProgressionStats` sort de `GameProvider` vers
`src/utils/progressionStats.js`, avec `mergeChampionStats`. La forme de
référence devient ainsi lisible par les tests, ce qui rend le contrôle des 224
chemins possible.

## Vérification

`npm test` — 505 tests, dont 15 sur l'agrégation et 16 sur le contrat des
compteurs.
