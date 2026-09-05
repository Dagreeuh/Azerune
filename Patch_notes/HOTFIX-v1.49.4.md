# Azerune - Hotfix v1.49.4

## Objectif

Corriger l'affichage trompeur de la ressource de Morghast en combat.

## Problème

Morghast affichait `Réactions 0/5`, alors que ses réactions alchimiques ne reposent sur aucune jauge numérique. Elles se déclenchent directement selon les afflictions présentes sur la cible.

## Correction

La fausse jauge `0/5` est supprimée pour Morghast et remplacée par un indicateur contextuel :

- `Combine 2 afflictions` lorsqu'aucune réaction n'est disponible ;
- `Hémotoxique · cible` avec Poison et Saignement ;
- `Caustique · cible` avec Poison et Brûlure ;
- `Thermique · cible` avec Brûlure et Saignement ;
- `Catalyse parfaite · cible` avec Poison, Brûlure et Saignement.

L'indicateur examine les ennemis vivants et affiche en priorité la combinaison la plus complète.

## Gameplay inchangé

- Aucun changement de dégâts.
- Aucun changement des chances d'application.
- Aucun changement des durées.
- Aucun changement de l'AUTO.
- Les afflictions ne sont toujours pas consommées par les réactions.
- La Résonance IV conserve son fonctionnement actuel.

## Fichiers modifiés

```text
src/pages/BattlePage.jsx
src/data/championIdentities.js
```

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement, puis exécuter :

```powershell
npm run build
npx cap sync android
```

## Tests

1. Lancer un combat avec Morghast sans affliction compatible : `Combine 2 afflictions` doit apparaître.
2. Appliquer Poison et Saignement : `Hémotoxique` doit apparaître avec le nom de la cible.
3. Appliquer Poison et Brûlure : `Caustique` doit apparaître.
4. Appliquer Brûlure et Saignement : `Thermique` doit apparaître.
5. Appliquer les trois afflictions : `Catalyse parfaite` doit être prioritaire.
6. Vérifier que les dégâts et malus des réactions restent identiques.
