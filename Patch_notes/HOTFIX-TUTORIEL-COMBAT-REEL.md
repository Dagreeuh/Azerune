# Azerune - Tutoriel d'introduction en combat reel

## Version

Tutoriel combat reel 1.0

## Changements

- Le tutoriel utilise `createBattle`, `castSkill`, `nextTurn` et `enemyAction` du moteur principal.
- La riposte fixe de 12 degats a ete supprimee.
- Les degats utilisent les statistiques, la Defense, les critiques et les affinites reelles.
- Les soins respectent les PV maximums et `healingDown`.
- Les boucliers absorbent les attaques reelles.
- Les effets et leurs durees passent par `nextTurn`.
- Les trois champions utilisent des statistiques pedagogiques fixes, sans equipement ni Resonance de la sauvegarde.
- Le troisieme sort est autorise uniquement lorsque `battle.tutorialBattle.enabled` est actif.
- Aucune etoile, Ascension ou progression n'est modifiee.
- Le scenario guide montre Thorgar, Sylven et Korga, puis ouvre un mode libre.

## Fichiers modifies

```text
src/pages/TutorialPage.jsx
src/battle/engine.js
src/styles.css
```

## Fichier ajoute

```text
src/data/tutorialBattle.js
```

## Installation

Extraire le ZIP a la racine du projet, accepter les remplacements, puis lancer :

```powershell
npm run build
```

## Verifications ciblees

- troisieme sort autorise dans le tutoriel ;
- troisieme sort toujours verrouille hors tutoriel ;
- attaque basee sur la Defense de Thorgar ;
- bouclier partiellement detruit par Korga ;
- soin plafonne aux PV maximums ;
- soutien sans affinite offensive ;
- action ennemie calculee par le moteur ;
- effets et temps de recharge decrementés ;
- victoire determinee par le moteur ;
- sauvegarde de progression non modifiee.
