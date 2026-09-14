# Hauts faits — les deux chemins de résolution, et ce qu'ils cachaient

## Comment un haut fait sait où il en est

Deux mécanismes, tous deux silencieux en cas d'erreur.

**1. Un compteur**, chemin en clair dans `progressionStats` :

```js
const get=(o,p,d=0)=>p.split('.').reduce((v,k)=>v?.[k],o)??d;
```

**2. Une valeur dérivée**, calculée à la volée depuis l'état de jeu :

```js
const derived=(name,state)=>({ownedCount:…, sixStarCount:…, …}[name]||0);
```

Dans les deux cas, une erreur — chemin mal orthographié, branche jamais
alimentée, nom de dérivation inconnu — renvoie `0`. Aucune exception, aucune
trace. Le haut fait reste affiché avec sa récompense, bloqué pour toujours.

## Ce qui a été trouvé

### Les compteurs : 104 hauts faits morts

Traité dans `Patch_notes/HOTFIX-MAITRISES-CHAMPIONS-JAMAIS-CREDITEES.md`.
`progressionStats.champions` n'était jamais écrit.

### Les valeurs dérivées : aucune ne l'était

Les huit valeurs — `ownedCount`, `rosterComplete`, `sixStarCount`,
`level60Count`, `maxResonance`, `plusFifteenCount`, `campaignStars`,
`uniqueComplete` — résolvent toutes correctement, et les douze hauts faits
qu'elles alimentent sont tous atteignables. Vérifié en construisant l'état d'un
joueur ayant tout terminé.

Les buts sont cohérents avec les données du jeu :

| But | Maximum réel | Verdict |
|---|---|---|
| `campaignStars` 500 | 630 (70 étapes × 3 difficultés × 3 étoiles) | atteignable |
| `ownedCount` 20 | 26 champions | atteignable |
| `sixStarCount` 3 | 26 | atteignable |
| `level60Count` 3 | 26, le niveau 60 étant le plafond à 6★ | atteignable |
| `maxResonance` 5 | 5 | atteignable, tout juste |
| `uniqueComplete` | 7 armes uniques | atteignable, tout juste |

### Un seuil écrit en dur

`uniqueComplete` testait `weapons.length >= 7`, alors que le jeu compte
exactement 7 armes uniques. Le nombre était donc juste, mais par coïncidence :

- ajouter une huitième arme aurait validé « Chroniques accomplies » à 7 sur 8 ;
- en retirer une l'aurait rendu définitivement impossible.

Le seuil suit désormais `Object.keys(UNIQUE_WEAPONS).length`.

## Le verrou

`tests/achievements.contract.test.js` couvre maintenant les deux chemins, pour
les 224 hauts faits.

Pour les valeurs dérivées, le contrôle décisif compare deux états : un état
vide, et celui d'un joueur ayant tout terminé. Une valeur réellement calculée
doit bouger entre les deux. Si elle ne bouge pas, elle est indistinguable d'un
nom de dérivation inconnu — c'est exactement la signature du bug silencieux.

S'y ajoute un contrôle d'atteignabilité : aucun but ne doit dépasser ce que les
données du jeu peuvent rendre. Porter le but d'étoiles de campagne à 9999 fait
échouer le test avec le message « vise 9999 étoiles sur 630 possibles ».

## Ce qui reste sans couverture

Le calcul du score de hauts faits (`achievementScore`) et l'attribution des
récompenses restent dans `GameProvider`, donc hors de portée des tests sans
monter React. La même découpe décision/effet que pour les récompenses de mission
s'y appliquerait.
