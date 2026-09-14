# Azerune — Hotfix : le gain de Fragments de sang était toujours annoncé à 10

## Problème

Quand un doublon ne peut plus servir à la Résonance, il est converti en
Fragments de sang. Le nombre obtenu dépend de la rareté du champion :

| Rareté | Fragments de sang réellement gagnés | Affiché |
|---|---|---|
| 3★ | **1** | +10 |
| 4★ | **3** | +10 |
| 5★ | 10 | +10 |

L'écran de révélation d'invocation et le Journal des invocations affichaient
tous les deux `+10 Fragments de sang` en dur, sans lire la valeur réelle.

Les 3★ représentent 80 % des tirages. Une fois leur Résonance complète, c'est
donc le message le plus fréquent de l'écran d'invocation — et il annonçait dix
fois la valeur réelle.

La Boutique vend contre des Fragments de sang (30 pour un Fragment universel 5★,
50 pour une pièce légendaire). Un joueur qui planifiait ses achats sur le nombre
affiché se trompait d'un facteur dix.

## Cause

Trois maillons :

1. `evolveFromDuplicate` renvoie bien `bloodFragments` avec la bonne valeur.
2. Mais `summonMany` ne recopiait pas ce champ dans le résultat d'invocation.
3. L'historique lisait donc `hero.bloodFragments || 0`, soit toujours `0`, et les
   deux écrans contournaient le problème avec un texte figé à `+10`.

## Correction

Le résultat d'invocation transporte désormais `bloodFragments`, et les deux
écrans affichent la valeur réelle, avec l'accord en nombre :
« +1 Fragment de sang », « +3 Fragments de sang ».

Aucun gain n'est modifié : seul l'affichage était faux. Les Fragments réellement
crédités étaient les bons depuis le début.

## Durcissement

`normalizeChampionProgress` est la fonction chargée de remettre d'aplomb une
progression de champion venue de la sauvegarde. Elle propageait `NaN` : une
valeur non numérique dans `stars` produisait des étoiles `NaN`, donc un plafond
de niveau `NaN`, donc un niveau `NaN`, donc toutes les statistiques du champion
et la puissance d'équipe à `NaN`.

Le cas est atteignable par un fichier de sauvegarde importé : l'import ne valide
que l'enveloppe, jamais les valeurs internes. Chaque champ retombe maintenant
sur un repli sain.

## Vérification

`npm test` — 474 tests, dont 44 sur la progression : plafonds de niveau, courbe
d'XP, coûts de Résonance, valeur des doublons, conditions d'évolution et bonus
de Résonance.

Contrôle par mutation : décaler le coût d'un palier de Résonance fait échouer
5 tests, changer la valeur d'un doublon 5★ en fait échouer 3, retirer la garde
`NaN` 1.
