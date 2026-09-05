# Azerune v1.50.3 - Refonte complète de Caelion

## Correctif cumulatif

Ce ZIP remplace intégralement le hotfix v1.50.2. Il contient la refonte fonctionnelle de Caelion ainsi que la correction de `skills.js`, des maîtrises et des textes détaillés.

## Kit

- **Sablier brisé** retire 15 % de jauge, transfère 25 % à l’allié ancré ou conserve 15 % sans Ancrage.
- **Ancrage temporel** mémorise jauge et délais, donne 15 % de jauge et dure 4 tours.
- **Retour temporel** restaure les délais mémorisés et ramène l’allié ancré à au moins 85 % de jauge.
- **Résonance IV** ramène la cible à 100 % de jauge et réduit de 2 tours les délais des autres alliés.

## Maîtrises corrigées

- `timeRestore` n’est plus classé comme soin.
- Sablier brisé améliore ses dégâts et ses valeurs de jauge.
- Ancrage temporel améliore sa jauge initiale, sa durée et sa recharge.
- Retour temporel améliore son seuil de jauge restaurée et sa recharge.
- Les textes `skillMechanic()` correspondent désormais au fonctionnement réel.

## AUTO et interface

- Ciblage intelligent du pivot offensif.
- Retour temporel retenu tant qu’aucune valeur n’est restaurable.
- Affichage de la cible ancrée et des états `En attente` et `Retour prêt`.
- Explication spéciale dans Priorités AUTO.

## Fichiers modifiés

- `src/data/heroes.js`
- `src/data/championIdentities.js`
- `src/battle/engine.js`
- `src/pages/BattlePage.jsx`
- `src/components/AutoSkillPriorityModal.jsx`
- `src/utils/skills.js`
- `src/styles.css`

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement des fichiers. Ce ZIP suffit à lui seul, même si v1.50.2 n’a pas été installé.

## Vérifications

1. Contrôler les trois descriptions dans Équipe et en combat.
2. Monter une maîtrise de chaque sort et vérifier les libellés de jauge, durée ou recharge.
3. Vérifier qu’aucune maîtrise de Retour temporel ne mentionne les soins.
4. Tester le cycle manuel complet.
5. Tester AUTO avec un attaquant et un tank.
6. Tester la Résonance IV.
7. Vérifier les états de l’Ancrage sur ordinateur et smartphone.
