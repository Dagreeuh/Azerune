# Hotfix — le moteur de combat tournait pendant le rendu

## Le symptôme

Un avertissement React pendant les combats automatiques :
*« Cannot update a component while rendering a different component. »*

Je l'avais signalé au patch précédent comme préexistant, sans le corriger. La
cause est plus sérieuse que l'avertissement.

## La cause

La pile JavaScript, obtenue en instrumentant le navigateur, désignait la boucle
AUTO :

```
BattlePage → useState → basicStateReducer → (updater) → progressQuest → setState
```

L'action automatique était calculée **à l'intérieur d'un updater de `setState`** :

```js
setBattle(current=>{
  const result=performAutoAction(current,autoSkillPriorities);
  progress('skills');          // ← un setState d'un AUTRE composant
  return result.battle;
});
```

React peut rejouer un updater pendant un rendu. Deux conséquences :

- **`progress('skills')` partait au mauvais moment**, et pouvait se déclencher
  plusieurs fois pour une seule action — le compteur de quête « utiliser des
  compétences » avançait plus vite qu'il n'aurait dû.
- **Le moteur de combat était rejoué**, tirages aléatoires compris, pour un
  résultat aussitôt jeté.

## La correction

L'action se calcule désormais hors de tout updater, sur `battleRef` — la
référence qui porte le dernier combat **commité**. Les protections contre un
état périmé sont conservées à l'identique ; seule la manière de lire l'état
change. Le moteur n'est appelé qu'une fois, et la progression de quête part
d'un endroit sûr.

## Ce qui n'a pas été touché, et pourquoi

Quatre updaters de reprise (la logique qui relance un combat bloqué) appellent
encore `nextTurn` ou `enemyAction`. C'est le même reste inélégant — un rejeu
recalcule l'état — mais **sans conséquence observable** : React retient la
dernière valeur rendue, et ces updaters n'ont aucun effet de bord. Les réécrire
toucherait à la reprise des combats bloqués pour un gain nul.

Un test verrouille donc la seule combinaison réellement dangereuse : **un
updater ne doit jamais mêler un appel moteur à un effet de bord**. Et aucun
updater, jamais, ne doit déclencher un `setState` du fournisseur de jeu, écrire
dans le stockage, ou appeler `performAutoAction`.

## Sous le capot

Écrire ce test a été plus instructif que la correction. Trois versions ont été
nécessaires, chacune parce qu'une mutation lui échappait :

1. La première ne reconnaissait que `setX(current=>{…})` — un updater nommant
   son paramètre `cur` passait au travers.
2. La deuxième ratait les corps concis sans accolades, `setX(cur=>expression)`.
3. La troisième, qui équilibre les parenthèses de tout `setX(…)`, attrapait
   `setTimeout` — dont le rappel a parfaitement le droit d'avoir des effets de
   bord, puisqu'il s'exécute hors rendu. Les minuteurs sont exclus nommément,
   plutôt que de relâcher la règle.

7 tests nouveaux. 8 mutations appliquées, 8 tuées.

Vérifié en jeu : page vivante, combat automatique joué jusqu'à faire tomber deux
ennemis, effets de sort visibles sur 69 relevés sur 70, **zéro avertissement**,
zéro erreur console.

**1 264 tests, 49 fichiers.**
