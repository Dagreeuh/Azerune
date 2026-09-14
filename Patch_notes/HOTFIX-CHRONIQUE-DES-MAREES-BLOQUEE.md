# Azerune — Hotfix : une Chronique légendaire entièrement inaccessible

## Problème

La **Larme de la Mer ancienne** était la seule relique sur huit à n'être
accordée par aucune activité du jeu. Elle n'apparaissait nulle part ailleurs que
dans sa propre déclaration.

Or c'est la première étape de la chronique des Marées : « Examiner la Larme de
la Mer ancienne ». Sans elle, toute la suite était bloquée.

### Ce que le joueur perdait

| Contenu | État |
|---|---|
| Chronique des Marées | jamais démarrable |
| Thalassyr, Mémoire de l'Océan (world boss) | jamais accessible |
| Égide des Mille Marées (arme Unique) | jamais forgeable |
| Haut fait « Chroniques accomplies » | **impossible** |

Le dernier point est le plus coûteux : le haut fait exige les **sept** armes
Uniques. Avec une chronique bloquée, il ne pouvait jamais être validé — quel que
soit le temps de jeu.

L'enchaînement était invisible : la page des Adversaires légendaires filtre les
world boss sur les chroniques actives, donc Thalassyr n'apparaissait tout
simplement jamais dans la liste. Aucun message, aucune erreur.

## Cause

Les reliques tombent en Mythic+ via `rollLegendaryMythic`, qui liste les
candidats par palier de niveau. Sept relique y figuraient :

| Relique | Source |
|---|---|
| `heartworld-eye` | Raid Fournaise, niveaux 9 et 10 |
| `storm-left`, `ash-shard` | Mythic+ 20 |
| `first-plague` | Mythic+ 18-20, puis 21-29 |
| `fallen-plume` | Mythic+ 25-29, puis 30 |
| `storm-right` | Mythic+ 30 |
| `eclipse-string` | Mythic+ 30 face à Astreon |
| **`ancient-tear`** | **aucune** |

Simple oubli d'entrée dans la table, sans conséquence visible ailleurs.

## Correction

`ancient-tear` rejoint les tirages du **Mythic+ 20**, au taux de **0,05 %**.

Ce palier et ce taux reprennent exactement ceux d'`ash-shard`, la relique de
Cendre-Sépulcrale — la chronique structurellement la plus proche : même première
étape « Examiner », et un world boss propre elle aussi.

**Ces deux valeurs sont un choix d'équilibrage, pas une vérité retrouvée.** Si
la Larme devait tomber ailleurs, ou plus rarement, seule cette ligne est à
ajuster.

## Verrou

`tests/legendary.contract.test.js` couvre toute la chaîne : arme → relique →
chronique → world boss → forge. Le contrôle décisif vérifie que **chaque relique
est accordée par au moins une activité**.

Contrôle par mutation : retirer à nouveau la source fait échouer le test avec
« ancient-tear « Larme de la Mer ancienne » — aucune activité ne l'accorde ».

Le même fichier vérifie aussi que chaque arme vise un set et des champions qui
existent, que chaque chronique se termine par sa forge, et que toute chronique
citant un world boss en a réellement un.

## Vérification

`npm test` — 586 tests.
