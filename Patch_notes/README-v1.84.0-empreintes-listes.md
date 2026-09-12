# v1.84.0 — Cinq sorts avaient droit à un bonus qu'on leur refusait

## Ce qui change pour toi

Cinq compétences pouvaient recevoir le nœud **durée** de l'arbre d'Empreintes —
le moteur en tenait compte depuis toujours — mais l'interface le leur refusait.

| Champion | Sort |
|---|---|
| Aurelis | **Rayon consacré** |
| Aurelis | **Égide mineure** |
| Aurelis | **Sanctuaire lumineux** |
| Thorgar | **Rempart ancestral** |
| Mathanae | **Métamorphose démoniaque** |

Tous posent un **bouclier**. Sa durée suivait déjà ton bonus de durée ; tu ne
pouvais simplement pas acheter ce bonus. C'est corrigé : le nœud est désormais
proposé sur ces cinq sorts.

Aucun équilibrage n'a été touché. Rien n'est retiré à personne.

## Pourquoi c'était passé inaperçu

Le test qui gardait ces listes **lisait le code du moteur** pour deviner quels
sorts avaient une durée. Or ces cinq-là ne posent pas leur bouclier eux-mêmes :
ils appellent une fonction commune qui s'en charge. Le test regardait au mauvais
endroit, ne trouvait rien, et confirmait chaque jour que la liste était juste.

## Ce qui le remplace

Un nouveau contrat qui ne lit plus le code : il **lance chaque sort du jeu deux
fois**, une fois sans bonus et une fois avec, et regarde ce qui change
réellement dans le combat. 96 effets passés au banc.

Résultat : les trois listes correspondent maintenant à ce que le moteur fait
vraiment — et si tu ajoutes un sort demain, le test te dira tout seul quels
nœuds il doit accepter.

Deux sorts font exception, et c'est écrit noir sur blanc dans le test avec la
raison : `guardianLink` et `refluxRelease` réagissent bien au bonus, mais cela
ne peut se voir qu'en conditions de jeu réelles, pas sur un banc d'essai.
