# Hotfix courbe d’iLvl de la Campagne

## Portée
Le correctif applique une courbe explicite aux futurs équipements de Campagne uniquement. Les objets déjà obtenus ne sont pas modifiés.

## Fonctionnement
- 10 zones, 6 étapes ordinaires et 1 boss par zone.
- Étapes 1 à 6 : valeur déterministe propre à la mission.
- Boss : tirage inclusif dans la plage prévue.
- Chevauchement limité entre Normal, Difficile et Hardcore.
- Zone 10 Normal : étapes jusqu’à 74, boss 75 à 76.
- Zone 10 Difficile : boss 153 à 155.
- Zone 10 Hardcore : boss 245 à 248.

## Compatibilité
- Étoiles, qualités, sets, taux de butin et statistiques possibles inchangés.
- Forge et autres sources de butin inchangées.
- Les nouveaux objets de Campagne portent `balanceVersion: 5` et `campaignItemLevelCurve: true`.
- Le cadeau Ignifuge n’est plus forcé à l’iLvl 190 et suit désormais la courbe du butin de la mission.

## Fichiers modifiés
- src/data/items.js
- src/store/GameContext.jsx

`src/data/campaign.js` est inclus sans modification afin de conserver le lot audité et l’arborescence de référence.

## Installation
Extraire le ZIP directement à la racine du projet, accepter les remplacements, puis lancer `npm run build`.
