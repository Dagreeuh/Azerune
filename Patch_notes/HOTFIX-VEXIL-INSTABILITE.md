# Hotfix Vexil - Instabilité et contrecoup

## Nouvelles règles
- 0 à 3 Instabilités : aucun contrecoup.
- 4 Instabilités au début d'un sort offensif : perte de 6 % des PV maximums.
- 5 Instabilités au début d'un sort offensif : perte de 12 % des PV maximums, puis retour à 3 Instabilités.
- Le contrecoup ne peut jamais vaincre Vexil.
- Le sort qui atteint 4 charges ne déclenche pas immédiatement le contrecoup.
- Convergence mentale déclenche un seul contrecoup puis consume toutes les charges.

## AUTO
À 4 charges ou plus, Convergence mentale est prioritaire si elle est débloquée. Avant 4★, Entrave surchargée est prioritaire lorsqu'elle est disponible.

## Fichiers modifiés
- src/battle/engine.js
- src/data/heroes.js
- src/pages/BattlePage.jsx
- src/utils/skills.js
- src/components/AutoSkillPriorityModal.jsx
- src/data/championIdentities.js

## Installation
Extraire le ZIP directement à la racine du projet, accepter les remplacements, puis lancer `npm run build`.

Aucune suppression de sauvegarde n'est nécessaire.
