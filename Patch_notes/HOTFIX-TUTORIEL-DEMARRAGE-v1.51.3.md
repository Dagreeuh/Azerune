# Azerune - Hotfix tutoriel de démarrage v1.51.3

## Objectif
Stabiliser définitivement le mode libre du tutoriel de démarrage en utilisant une seule boucle de combat réelle.

## Corrections
- Suppression de l'action ennemie forcée depuis `useSkill()`.
- Le prochain acteur est désormais choisi uniquement par `nextTurn()`.
- Les tours ennemis sont exécutés uniquement lorsque le moteur désigne réellement un ennemi actif.
- Une compétence jouée en mode libre n'appelle plus une seconde fois `prepareTutorialTurn()`.
- Les effets de début de tour, durées, soins périodiques et temps de recharge ne sont plus traités deux fois.
- La victoire est recalculée immédiatement après chaque compétence.
- Les raccourcis `Q` et `D` restent disponibles pour parcourir les cibles.
- Les raccourcis `1`, `2` et `3` restent disponibles pour lancer les sorts.
- Le troisième sort reste autorisé uniquement dans le tutoriel de démarrage.

## Fichiers fournis
```text
src/pages/TutorialPage.jsx
src/data/tutorialBattle.js
src/battle/engine.js
```

Seul `src/pages/TutorialPage.jsx` contient une modification fonctionnelle. Les deux autres fichiers sont inclus dans leurs versions actuelles afin de préserver un lot cohérent et directement extractible.

## Installation
Extraire l'archive à la racine du projet, accepter le remplacement des fichiers, puis lancer :

```powershell
npm run build
```

Si une ancienne partie bloquée est restaurée, exécuter une fois dans la console du navigateur :

```js
localStorage.removeItem('azerune-tutorial-state-v3');
location.reload();
```

## Vérifications
- Une seule préparation de début de tour par acteur.
- Aucun double tour ennemi.
- Relance après un `turn` vide.
- Victoire immédiate lorsque le dernier ennemi tombe.
- Conservation des touches Q, D, 1, 2 et 3.
- Aucun changement de l'Académie ou des combats normaux.
