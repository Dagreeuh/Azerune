# Hotfix équilibrage du butin Mythic+

## Changements
- Suppression de la formule fixe `60 + niveau x 3`.
- iLvl progressif de 72-74 au niveau 1 à 168-174 au niveau 30.
- Qualité tirée selon le niveau au lieu d’être Rare ou Épique garantie.
- Mythic+ 1 à 5 : 20 % Normal, 65 % Commun, 15 % Rare.
- Mythic+ 6 à 9 : 60 % Commun, 38 % Rare, 2 % Épique.
- Mythic+ 10 : 80 % Rare, 20 % Épique.
- Progression graduelle jusqu’au niveau 30 : 70 % Épique, 30 % Légendaire.
- Étoiles progressives : 2★ au début, 3★ au niveau 10, 4★ au niveau 20, 5★ au niveau 30.
- Les objets existants ne sont pas modifiés.
- Les nouveaux objets portent `origin: mythic`, `mythicLevel`, `mythicBalanced: true` et `balanceVersion: 1`.

## Fréquence conservée
Les équipements restent attribués aux niveaux 3, 6, 9, 10, 12, 15, 18, 20, 21, 24, 27 et 30.

## Fichiers modifiés
- src/data/mythic.js
- src/data/items.js
- src/store/GameContext.jsx

## Installation
Extraire le ZIP à la racine du projet, accepter les remplacements, puis lancer `npm run build`.
