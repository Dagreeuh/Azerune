# v1.80.1 — Fini le tourniquet

Tu avais raison, et c'est plus littéral que tu ne le pensais.

## Pourquoi elles tournaient

**La rangée « Idle » de tes feuilles n'est pas une boucle d'attente, c'est un
tour de présentation** : face, trois-quarts, dos. Lelianna a cinq poses, les
deux dernières la montrent de dos. Jouée en boucle du premier au dernier cadre,
elle pivotait sans fin — avec un à-coup au moment de repartir.

## Ce qui change

**L'aller-retour**, comme tu l'as demandé : la série se lit à l'endroit puis à
l'envers. Plus aucun à-coup, le mouvement se referme sur lui-même.

**Et les poses de dos ne sont plus utilisées pour l'attente.** L'aller-retour
seul aurait gardé le demi-tour : tes champions auraient continué à tourner le
dos à l'ennemi une fois sur deux. L'attente se limite maintenant aux poses de
face — face → face → trois-quarts → retour. Un balancement, pas un tourniquet.

Les attaques, les soins et les morts ne sont pas touchés : ils se jouent une
fois, à l'endroit.

## Si tu veux ajuster

Une ligne par champion dans `outils/feuilles/<nom>.json` :

```json
"attente": 3
```

C'est le nombre de poses employées pour l'attente. Mets-en plus si tu veux plus
de mouvement, retire la ligne pour rejouer le tour complet.

## Pour tes prochaines feuilles

Si tu veux une attente vraiment naturelle, dessine une rangée « Idle » qui
**reste de face** — une respiration, un léger balancement — et garde le tour de
présentation dans une rangée à part. Tu n'auras alors plus rien à régler.
