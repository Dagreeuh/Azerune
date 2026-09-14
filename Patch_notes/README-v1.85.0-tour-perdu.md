# v1.85.0 — Thorgar perdait des tours sans rien dire

## Ce qui est corrigé

En combat automatique, **Thorgar gaspillait jusqu'à 8 tours sur 40**. Pas de
message, pas d'animation : son tour passait, simplement. Tu pouvais le regarder
sans jamais comprendre pourquoi ton gardien ne faisait rien.

Le pilote automatique choisissait « Serment du gardien », puis désignait
**Thorgar lui-même** comme cible. Or le Serment lie un *autre* allié : le moteur
refusait, et le tour était perdu.

## Pourquoi seulement en fin de combat

C'est ce qui rendait la chose invisible. Le choix de cible pénalisait bien le
lanceur — mais d'un simple **poids**, pas d'un interdit. Ce poids valait 5 000,
et le score d'un allié comprend « bouclier × 0,4 ». Dès qu'un allié portait plus
de 12 500 de bouclier, il passait devant, et Thorgar devenait le « meilleur »
choix restant.

Le piège se referme tout seul : **c'est le Rempart ancestral de Thorgar qui pose
ces boucliers**. Plus il protégeait son équipe, plus il se condamnait à perdre
ses tours.

Le lanceur est désormais retiré de la liste des cibles avant le tri, pour les
sorts qui exigent un autre allié. Une préférence est devenue une règle.

## Vérifié

Sur 40 actions automatiques : **0 tour perdu**, contre 8 avant. Aucun autre
champion du roster ne rate d'action — c'est vérifié sur les 32, à chaque
lancement de la suite de tests.
