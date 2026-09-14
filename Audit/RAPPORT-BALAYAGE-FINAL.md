# Balayage final — académie, hauts faits, codex

Trois zones passées au crible, sans nouveau bug joueur. C'est un résultat en
soi : après onze défauts trouvés ailleurs, ces trois-là sont complets.

## Académie de l'Invocateur

12 leçons à 50 Cristaux, plus une récompense finale. Vérifié :

- les 5 types de défi déclarés — `resources`, `choice`, `arena`, `effects`,
  `auto` — sont tous rendus par l'interface. Un type non géré aurait bloqué la
  leçon, donc ses 50 Cristaux ;
- chaque défi à choix désigne une réponse qui existe dans sa liste ;
- `ACADEMY_TOTAL_REWARD` (600) correspond bien à 12 × 50 ;
- la garde anti-double-réclamation introduite en v1.50.16 est en place et
  fonctionne.

La décision — « cette leçon peut-elle être encaissée ? » — part dans
`src/utils/academy.js`. `GameContext` garde les `setState` et le verrou de
double-clic.

## Réclamation des hauts faits

La décision part dans `src/utils/achievements.js`. Ordre de contrôle vérifié :
un haut fait déjà réclamé le dit **avant** de réévaluer l'objectif, ce qui évite
un message trompeur si la condition a été perdue entre-temps.

Le score global est couvert : réclamer un haut fait ne fait pas perdre ses
points, et un haut fait atteint puis réclamé n'est pas compté deux fois.

## Codex des champions

Cinq tables indexées par identifiant de champion : `CHAMPION_IDENTITIES`,
`RESONANCE_CONSTELLATIONS`, `RESONANCE_IV_BONUSES`, `CHAMPION_TYPES`,
`ROSTER_PROFILES`.

**Les cinq couvrent exactement les 26 champions** — aucun manquant, aucune
entrée orpheline.

Le risque ici n'était pas un bug existant mais un piège pour la suite :
`championIdentity` retombe sur une fiche générique « Spécialiste · Champion
polyvalent » quand le champion n'est pas déclaré. Un nouveau champion oublié
dans ces tables n'aurait provoqué aucune erreur — juste une fiche vide de sens.

Le test vérifie donc qu'**aucun champion du roster ne retombe sur la fiche
générique**, tout en gardant celle-ci disponible comme filet.

## Le piège de test, troisième occurrence

`ACADEMY_TOTAL_REWARD` est *calculé* : `ACADEMY_TUTORIALS.length * ACADEMY_REWARD`.
Le test le comparait au même produit — il ne pouvait pas échouer. Passer la
récompense de 50 à 40 laissait la suite verte.

Même piège que `ITEM_UPGRADE_MILESTONES` et `SHOP_REFRESH_COSTS` avant lui. Les
valeurs sont désormais figées en clair : 50 par leçon, 12 leçons, 600 au total.

**Une constante dérivée ne se teste pas contre sa propre formule.**
