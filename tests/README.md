# Tests du moteur de combat

```bash
npm test         # une passe
npm run test:watch
```

335 tests, environ une seconde et demie. Aucun test ne modifie le code de production.

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
| `engine.auto.test.js` | Combat AUTO : ordre des compétences, priorité du joueur, conditions d'utilité, choix de cible |
| `engine.sets.test.js` | Sets Protection, Contre-attaque, Incendiaire, et plafond des DOT sur les boss |
| `sets.contract.test.js` | Tout set annoncé au joueur est bien lu par le moteur |
| `battleSession.test.js` | Un combat en cours survit à l'aller-retour JSON de la sauvegarde |
| `storage.test.js` | Export, validation et import d'une sauvegarde, rollback compris |
| `stats.test.js` | Puissance de champion et d'équipe, progression, équipement, difficulté, XP |
| `stats.assessment.test.js` | Détection des capacités d'équipe et note de faisabilité affichée avant mission |
| `rewards.test.js` | Génération du butin, sets actifs, coût d'amélioration, recyclage, forge |
| `rewards.mission.test.js` | Calcul des récompenses de fin de mission : campagne, raid, expédition |

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

3. **Le combat AUTO n'a besoin d'aucune graine.** `chooseAutoSkill`,
   `chooseAutoEnemyTarget` et `chooseAutoAllyTarget` sont purs. Il suffit de
   poser `battle.turn` sur le champion voulu ; pas besoin de passer par la
   jauge.

## Vérifier que la suite mord encore

Un test qui passe ne prouve rien tant qu'on n'a pas vu échouer sa version
mutée. Avant de faire confiance à un nouveau test, cassez la règle qu'il
protège dans le moteur et vérifiez qu'il rougit. Repères mesurés sur cette
suite :

| Mutation dans `src/battle/engine.js` | Tests rouges |
|---|---|
| Poison `.06` → `.07` | 8 |
| Redirection du gardien `.30` → `.40` | 1 |
| Ordre AUTO par défaut `[2,1,0]` → `[0,1,2]` | 9 |
| `respectPlayerPriority:customOrder` → `false` | 2 |
| `affinityRank` inversé | 2 |
| Tri des cibles alliées `sa-sb` → `sb-sa` | 7 |
| Bouclier Protection `.15` → `.25` | 2 |
| Seuil de riposte `.20` → `.50` ou `.10` | 1 / 4 |
| Riposte écrite sur `actor` au lieu de `self` | 3 |
| Plafond boss désactivé | 4 |
| Restauration retirée du `catch` d'import | 1 |
| Contrôle du jeu d'origine retiré | 1 |
| `shieldExecute` réintroduit dans les boucliers | 3 |
| Retour au rapprochement par sous-chaîne | 1 |
| Bornes du score retirées | 1 |
| Poids de l'Attaque `7.5` → `0.2` | 1 |
| Garde du set inconnu retirée | 1 |
| Nombre de pièces d'un set ignoré | 1 |
| Pénalités de recyclage supprimées | 2 |
| Paliers à sous-stat déplacés | 2 |
| Paliers d'étoiles `45/72` → `50/75` | 4 |
| Or de farm `20 %` → `35 %` | 1 |
| Pierres hors premier passage | 1 |
| Chances de relique de raid inversées | 1 |
| Bonus de première victoire retiré | 2 |

La ligne `respectPlayerPriority` est le correctif v1.49.5 : c'est exactement la
régression que la suite est là pour empêcher de revenir.

Une mutation qui **survit** est une information, pas un détail. Le retour au
rapprochement par sous-chaîne dans `stats.js` est passé vert au premier essai :
la liste corrigée suffisait déjà sur le roster actuel, et le cas de test ne
discriminait pas les deux formes. Il a fallu un effet dont le nom contient un
effet listé comme sous-chaîne stricte — `rescueShieldBreaker` — pour que le test
sépare vraiment les deux comportements.

## Deux zones sans aléatoire

Ces deux familles ne demandent aucune graine, ce qui les rend faciles à étendre :

- **Le combat AUTO** (`chooseAutoSkill`, `autoSkillUseful`, les deux fonctions de
  ciblage) est entièrement pur.
- **La persistance** se teste par `JSON.parse(JSON.stringify(combat))`, qui est
  exactement ce que fait `save()` dans `localStorage`. Si l'aller-retour est
  égal à l'original, aucune valeur n'est perdue en chemin.

Pour `storage.test.js`, `localStorage` et `sessionStorage` sont remplacés par un
stockage minimal via `vi.stubGlobal` : l'environnement de test est `node`, il
n'y en a pas.

## Rendre testable ce qui ne l'est pas

`GameProvider` est un composant de 70 Ko : ses fonctions internes ne sont
atteignables par aucun test sans monter React. La voie utilisée ici, sans
ajouter de dépendance de test, est de séparer la décision de l'effet.

`src/utils/rewards.js` en est l'exemple : il calcule **ce que** le joueur
reçoit — parts par étoiles, or de farm, taux de butin, cadeaux de progression,
montants d'expédition — pendant que `GameContext` garde les `setState`.
`finishCampaignMission` est passée d'un bloc mêlant calcul et effets à une
orchestration lisible, et ses règles sont couvertes par 45 tests.

La même découpe reste à faire pour les quêtes, la forge et la boutique.

## Ce que la suite ne couvre pas encore

Les kits de champions un par un, les vagues Mythic+, les mécaniques de raid, et
toute la couche React. Les prochaines cibles utiles, par ordre de rentabilité :
les quêtes et leur validation, la forge et la boutique, puis les enchaînements
de vagues Mythic+.
