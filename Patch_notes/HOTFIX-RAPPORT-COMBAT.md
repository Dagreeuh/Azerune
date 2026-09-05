# Azerune - Hotfix complet Rapport de combat

## Objectif

Ajouter un rapport de combat consultable à la fin d'une victoire ou d'une défaite, et garantir que la fenêtre du rapport apparaît devant la fenêtre de résultat.

## Interface

La fenêtre de fin de combat contient le bouton :

```text
📖 Rapport
```

Le rapport affiche pour chaque champion :

- les dégâts infligés ;
- les soins prodigués ;
- les dégâts mitigés ;
- le détail des différentes sources.

Le rapport présente également :

- les totaux de l'équipe ;
- le meilleur score de dégâts ;
- le meilleur score de soins ;
- le meilleur score de mitigation.

## Dégâts suivis

- dégâts directs ;
- dégâts critiques ;
- dégâts périodiques attribuables au poseur ;
- dégâts d'invocation ;
- dégâts d'arme unique.

## Soins suivis

- soins directs ;
- soins périodiques ;
- soins du Totem ;
- soins du Jardin ;
- vol de vie.

## Mitigation suivie

- dégâts réellement absorbés par les boucliers ;
- attribution par couches en cas de boucliers provenant de plusieurs champions ;
- bouclier d'urgence d'Aurelis ;
- redirection du Serment de Thorgar ;
- réduction personnelle de Maerys en Marée haute.

## Ordre d'affichage

```text
Combat
Fenêtre de résultat : z-index 6500
Rapport de combat : z-index 7000
```

Le rapport apparaît donc toujours devant la fenêtre de victoire ou de défaite. La fermeture du rapport fait réapparaître la fenêtre de résultat.

## Persistance

Les statistiques sont enregistrées dans l'état du combat et sont conservées avec la session persistante.

## Fichiers modifiés

```text
src/battle/engine.js
src/pages/BattlePage.jsx
src/styles.css
```

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement des fichiers, puis lancer :

```powershell
npm run build
```

## Tests recommandés

1. Terminer un combat en victoire.
2. Ouvrir le rapport et vérifier qu'il apparaît devant la fenêtre de résultat.
3. Fermer le rapport avec la croix.
4. Rouvrir le rapport puis le fermer en touchant l'arrière-plan.
5. Vérifier les dégâts, soins et mitigations de chaque champion.
6. Tester plusieurs boucliers provenant de champions différents.
7. Tester Aurelis, Thorgar et Maerys.
8. Reprendre une session de combat et vérifier la conservation des statistiques.
