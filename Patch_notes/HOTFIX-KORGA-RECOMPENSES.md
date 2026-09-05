# Azerune - Hotfix Korga et récompenses pédagogiques

## Écran de victoire
- Les cadeaux des boss des zones 1 à 3 sont présentés comme **Équipement pédagogique**.
- Seule une pièce `fireproof` du Cœur Ignifugé est présentée comme **Préparation Cœur-Monde** et **Pièce Ignifuge garantie**.

## Korga, Armure exposée
- Les dégâts renforcés contre le bouclier restent partiels, sans suppression automatique.
- **Exposé** est appliqué pendant 2 tours.
- **Défense réduite** est tentée pendant 2 tours avec 80 % de chance de base.
- La chance finale tient compte de la Précision, de la Résistance, de l’affinité et de la maîtrise.
- Le journal indique si Défense réduite est appliquée ou résistée.
- L’AUTO peut employer Armure exposée sans bouclier si les affaiblissements doivent être renouvelés.

## Fichiers modifiés
```text
src/pages/BattlePage.jsx
src/battle/engine.js
src/utils/skills.js
```
