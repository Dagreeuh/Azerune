# Azerune - Hotfix v1.49.0

## Objectif

Appliquer les conclusions de l'audit global : sécuriser l'économie de campagne, donner une identité nette au butin de chaque difficulté, activer les sets spéciaux manquants, encadrer les statistiques et limiter les dégâts périodiques basés sur les PV des boss.

## Campagne et récompenses

### Récompenses d'étoiles différentielles

Le cumul maximal d'une mission est désormais de 100 % :

- 0 vers 1 étoile : 45 %.
- 1 vers 2 étoiles : complément de 27 %.
- 2 vers 3 étoiles : complément de 28 %.
- 0 vers 2 étoiles : 72 %.
- 0 vers 3 étoiles : 100 %.

Une amélioration ne redonne donc plus l'intégralité du palier atteint.

### Récompenses uniques

- La Pierre de foyer fixe d'un boss est accordée uniquement lors de sa première victoire.
- Le butin garanti est réservé à la première victoire.
- Une amélioration ultérieure des étoiles utilise le taux de butin normal et la garantie de farm.
- Les Pierres aléatoires quotidiennes restent indépendantes, avec leur plafond actuel.
- Les cadeaux de préparation au Cœur-Monde ne peuvent plus être obtenus plusieurs fois en améliorant les étoiles.
- Les anciennes sauvegardes ne perdent aucune ressource. Une mission déjà validée est automatiquement considérée comme ayant distribué sa récompense unique.

## Nouvelle progression du butin de campagne

Les plafonds sont absolus. Un boss améliore les chances d'atteindre le meilleur résultat autorisé, mais ne dépasse jamais le plafond de sa zone.

### Normal

- Zones 1 à 2 : maximum 2 étoiles Rare.
- Zones 3 à 4 : maximum 3 étoiles Rare.
- Zones 5 à 7 : maximum 3 étoiles Épique.
- Zones 8 à 10 : maximum 3 étoiles Épique.
- Zones 11 à 15 : maximum 3 étoiles Légendaire.
- Aucun équipement 4 étoiles en Normal.

### Difficile

- Zones 1 à 4 : maximum 3 étoiles Légendaire.
- Zones 5 à 9 : maximum 4 étoiles Rare.
- Zones 10 à 15 : maximum 4 étoiles Légendaire.

### Hardcore

- Zones 1 à 4 : maximum 4 étoiles Légendaire.
- Zones 5 à 9 : maximum 5 étoiles Rare.
- Zones 10 à 15 : maximum 5 étoiles Légendaire.

## Ensembles activés

### Protection, 4 pièces

- Applique au début du combat un bouclier égal à 15 % des PV maximum du porteur.

### Contre-attaque, 4 pièces

- Après une attaque directe ennemie ayant infligé des dégâts, le porteur survivant possède 20 % de chance de riposter.
- La riposte est une attaque simplifiée à 75 % de puissance.
- Une contre-attaque ne peut pas déclencher une autre contre-attaque.
- Les dégâts périodiques ne déclenchent pas cet effet.

### Incendiaire, 4 pièces

- Après une compétence offensive ayant infligé des dégâts, une seule tentative à 25 % est effectuée.
- En cas de succès, une Brûlure de 2 tours est tentée sur la cible principale.
- La Précision et la Résistance restent prises en compte.
- Une attaque multiple ne multiplie pas le nombre de tentatives.

## Statistiques

- Critique effectif plafonné à 100 %.
- Précision et Résistance effectives plafonnées à 120 %.
- La chance finale d'appliquer un malus conserve son plancher de 15 % et son plafond de 95 %.
- Les effets spéciaux actifs restent transmis au moteur via `setEffects`.

## Dégâts périodiques contre les boss

- Poison, Brûlure, Saignement, Agonie et Corruption enregistrent désormais leur source lorsqu'ils sont appliqués par un champion.
- Sur un boss, leurs dégâts basés sur les PV maximum sont limités par un plafond dépendant de l'Attaque de la source.
- Les ennemis ordinaires conservent les dégâts en pourcentage complets.
- Les anciens effets dépourvus de source continuent de fonctionner normalement.

## Champions et conseils

- Brom : la description précise le rôle des Impacts sur Fracture et Séisme.
- Aurelis : les conseils indiquent que ses grands boucliers reposent sur les PV des bénéficiaires.
- Elowen : son identité est clarifiée comme soutien persistant à soin modéré et contrôle conditionnel.
- Hicho : son identité met davantage l'accent sur le Totem et les combats longs.
- Les ajustements v1.48.0 d'Elowen, Hicho, Brom, des tanks, de Thorgar et de Caelion sont conservés.

## Fichiers modifiés

```text
src/combat/engine.js
src/data/championIdentities.js
src/data/items.js
src/store/GameContext.jsx
src/utils/stats.js
```

Les fichiers `campaign.js` et `progression.js` sont inclus comme références synchronisées, sans modification fonctionnelle nécessaire.

## Installation

1. Sauvegarder le projet et, si souhaité, exporter la sauvegarde du jeu.
2. Extraire le ZIP directement à la racine du projet Azerune.
3. Accepter le remplacement des fichiers.
4. Depuis la racine :

```powershell
npm run build
npx cap sync android
npx cap open android
```

Dans Android Studio :

```text
Build > Build Bundle(s) / APK(s) > Build APK(s)
```

## Tests recommandés

1. Terminer une nouvelle mission avec 1 étoile, puis 2, puis 3 et vérifier les compléments 45 %, 27 % et 28 %.
2. Rejouer un boss déjà validé et vérifier que sa Pierre fixe n'est pas redonnée.
3. Vérifier que la Pierre aléatoire quotidienne peut toujours tomber séparément.
4. Farmer chaque palier de zone et contrôler qu'aucun objet ne dépasse son plafond.
5. Équiper quatre pièces Protection et vérifier le bouclier dès le début du combat.
6. Équiper quatre pièces Contre-attaque et vérifier l'absence de boucle.
7. Équiper quatre pièces Incendiaire et vérifier une seule tentative par compétence.
8. Tester un champion dépassant 100 % de Critique et vérifier le plafond effectif.
9. Comparer les DOT sur un ennemi ordinaire puis sur un boss à hauts PV.
10. Retester Elowen, Hicho, Brom, Thorgar et Caelion pour confirmer la conservation du hotfix v1.48.0.

## Validation technique

- Syntaxe JavaScript contrôlée sur les modules `.js`.
- Arborescence du ZIP contrôlée.
- Intégrité de l'archive contrôlée.
- Aucun retrait rétroactif de ressources ou de progression.
