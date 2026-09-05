# Azerune v1.50.2 - Refonte de Caelion

## Changements du kit

- **Sablier brisé** retire 15 % de jauge à la cible.
- Avec un allié ancré, Sablier brisé lui donne 25 % de jauge.
- Sans Ancrage, Caelion conserve 15 % de jauge.
- **Ancrage temporel** mémorise la jauge et les délais, puis donne immédiatement 15 % de jauge.
- **Retour temporel** ramène l’allié ancré à au moins 85 % de jauge et restaure ses délais mémorisés.
- En Résonance IV, l’allié ancré revient à 100 % de jauge et les autres alliés réduisent leurs délais de 2 tours.

## AUTO

- Ancrage temporel évite Caelion et privilégie un allié offensif possédant une compétence à forte recharge.
- Retour temporel ne part plus immédiatement après l’Ancrage.
- AUTO attend une compétence à recharge dépensée, une restauration utile ou l’expiration imminente de l’Ancrage.

## Interface

- Suppression de l’affichage trompeur `0/5` pour Caelion.
- Affichage de la cible ancrée et des états `En attente` ou `Retour prêt`.
- Ajout d’une explication spécifique dans Priorités AUTO.

## Fichiers modifiés

- `src/data/heroes.js`
- `src/data/championIdentities.js`
- `src/battle/engine.js`
- `src/pages/BattlePage.jsx`
- `src/components/AutoSkillPriorityModal.jsx`
- `src/styles.css`

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement des fichiers.

## Vérifications

1. Ancrer un attaquant et vérifier le bonus immédiat de 15 % de jauge.
2. Utiliser Sablier brisé et vérifier le retrait de 15 % et le gain de 25 % pour l’allié ancré.
3. Vérifier que Retour temporel restaure au moins 85 % de jauge.
4. En AUTO, vérifier que Caelion n’utilise pas Retour temporel immédiatement sans valeur.
5. Vérifier l’état de l’Ancrage sur la carte de Caelion.
6. Tester la Résonance IV et l’affichage mobile.
