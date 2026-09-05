# Tests du moteur de combat

```bash
npm test         # une passe
npm run test:watch
```

87 tests, moins d'une seconde. Aucun test ne modifie le code de production.

## Pourquoi ces tests-là

Le moteur porte une cinquantaine d'effets qui interagissent. C'est la zone qui a
généré le plus de correctifs du projet, et celle qu'on ne peut pas vérifier à la
main : le nombre de combinaisons est trop grand. Les tests couvrent donc en
priorité les règles transverses, pas les kits de champions un par un.

| Fichier | Couvre |
|---|---|
| `elements.test.js` | Cycles d'affinité, normalisation, valeurs 1,30 / 0,75 / 1 |
| `engine.dot.test.js` | Formules des dégâts périodiques, Virulence, charges d'Agonie, Régénération, expiration |
| `engine.turn.test.js` | Ordre des tours, vitesse effective, étourdissement, garde-fous de la jauge |
| `engine.damage.test.js` | Formule de dégâts, variance, critiques, Défense, boucliers, Serment du gardien |
| `sets.contract.test.js` | Tout set annoncé au joueur est bien lu par le moteur |

## Déterminisme

Le moteur appelle `Math.random()` à huit endroits (jauge initiale, variance des
dégâts, critiques, chances d'effet). Les tests le remplacent par un générateur
seedé (`mulberry32`) via `seedRandom(graine)`, ou le figent avec
`fixedRandom(valeur)`. Le moteur n'est pas modifié pour autant : c'est un espion
`vitest`, restauré automatiquement entre chaque test.

Repères utiles avec `fixedRandom` :

- `0.5` → variance ×1,00 et aucun critique. C'est le réglage par défaut : les
  dégâts attendus se calculent à la main.
- `0` → variance ×0,92 et critique garanti (×1,5).

## Écrire un nouveau test

`helpers.js` fournit `makeHero`, `makeEnemy`, `statsFrom`, `giveTurnTo`,
`withStatus` et `findUnit`.

Deux pièges rencontrés en écrivant cette suite :

1. **L'IA ennemie choisit sa cible.** Elle vise spontanément l'allié le plus
   fragile. Pour cibler un allié précis, posez `provoke` sur l'ennemi avec
   `source` = l'identifiant de l'allié voulu.
2. **Les identifiants de champions sont porteurs de sens.** `createBattle`
   traite spécialement les id 3, 7, 8, 13, 14, 19, 21, 23, 25 et 28.
   `makeHero` part de 9000 pour rester sur les règles générales.

## Ce que la suite ne couvre pas encore

Les kits de champions un par un, les vagues Mythic+, les mécaniques de raid, la
campagne, et toute la couche React. Les prochaines cibles utiles, par ordre de
rentabilité : les priorités du combat AUTO, la persistance de `battleSession`
entre deux sessions, et les enchaînements de vagues.
