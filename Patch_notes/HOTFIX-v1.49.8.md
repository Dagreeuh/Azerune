# Azerune - Hotfix v1.49.8 - Affichage d'Histéria

## Objectif

Supprimer la fausse jauge `Afflictions 0/5` d'Histéria et afficher l'état réel de sa préparation.

## Nouvel indicateur

Histéria dispose maintenant d'un indicateur contextuel :

- `Aucune affliction` si aucun ennemi vivant ne possède d'effet compatible ;
- `1 affliction · cible` lorsqu'une cible commence à être préparée ;
- le nombre de cumuls d'Agonie est indiqué lorsqu'Agonie est présente ;
- `EXTASE PRÊTE · cible` lorsqu'une cible possède au moins deux afflictions compatibles ou une Agonie à 3 cumuls et plus.

Les afflictions reconnues sont :

```text
Agonie
Corruption
Poison
Brûlure
Saignement
```

L'indicateur examine tous les ennemis vivants et affiche la cible la mieux préparée.

## Portée

Ce correctif modifie uniquement l'interface de combat. Il ne change pas :

- les dégâts d'Histéria ;
- les durées ou chances d'application ;
- les règles d'Extase maléfique ;
- les priorités AUTO ;
- les autres champions.

Le hotfix v1.49.7 reste nécessaire pour les corrections du moteur d'Histéria.

## Fichier modifié

```text
src/pages/BattlePage.jsx
```

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement, puis exécuter :

```powershell
npm run build
```

## Tests

1. Lancer un combat avec Histéria sans affliction : vérifier `Aucune affliction`.
2. Poser Agonie : vérifier la cible et le cumul affichés.
3. Poser Agonie et Corruption : vérifier `EXTASE PRÊTE`.
4. Tester Poison et Brûlure sans Agonie : vérifier `EXTASE PRÊTE`.
5. Vérifier que `Afflictions 0/5` n'apparaît plus.
