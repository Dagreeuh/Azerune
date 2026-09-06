# Azerune — Le butin Mythic+ progresse enfin à chaque palier

## Ce qui n'allait pas

Le Mythic+ 15 était le mur du mode : 44 % de victoires pour un joueur équipé du
butin de ce palier, quand ses voisins en donnaient 100 %.

Les ennemis n'y étaient pour rien. C'est le butin qui reculait. Les tables
fonctionnaient par blocs de niveaux, et deux blocs étaient **plus généreux que
le bloc suivant** :

- Le palier **10** donnait du rare/épique 80-20. Les paliers **11 à 15**
  retombaient à commun/rare/épique 20-65-15.
- Le palier **20** donnait épique 60 %. Les paliers **21 à 24** retombaient à
  55 %.

Farmer le palier 15 rapportait donc des pièces **de moins bonne qualité** que
farmer le palier 10. Mesuré en puissance d'équipe réelle : il fallait atteindre
le palier 14 pour retrouver la puissance donnée par le palier 10, et le
palier 16 pour la dépasser. Pendant ces cinq paliers, les ennemis continuaient
de monter.

## Ce qui change

**Les tables par blocs deviennent une courbe continue.** Étoiles et qualité
progressent désormais à chaque palier, au lieu d'attendre le jalon suivant.

**Aucun palier ne reçoit moins qu'avant.** Les jalons — 1, 6, 10, 20 et 30 —
gardent exactement leurs valeurs d'origine ; seuls les paliers intermédiaires
sont relevés. Le palier 30 reste 5★, épique 70 / légendaire 30 : il s'agissait
de supprimer les creux, pas d'enrichir la fin de jeu.

**Les dix derniers paliers montent à plein régime.** Les ennemis des paliers 21
à 30 progressaient à 80 % du rythme des vingt premiers, sans raison énoncée :
la difficulté s'aplatissait exactement là où elle doit culminer. Chaque palier
compte maintenant pour un.

**Le Sablier parfait se mérite.** Son seuil passe de 75 % à 70 % du budget. À
équipement du palier, une course tient désormais le budget sans atteindre ce
seuil — il redevient la récompense d'un écart d'équipement réel, comme prévu.

## Ce que ça donne

La puissance réelle d'un joueur rapportée à la puissance recommandée tenait
entre **0,75 et 0,99** selon le palier où il s'était arrêté. Elle tient
désormais entre **1,00 et 1,18** sur les trente paliers.

25 courses par case — cinq tirages d'équipement complet, cinq courses chacun.
`⌛` Sablier parfait, `⏳` tenu, `💥` Effondrement.

| Palier | Équipement +5 | Équipement du palier | Équipement −5 |
|---|---|---|---|
| M+5 | ⌛ 68 % | ⏳ 96 % | ⏳ 24 % / 💥 76 % |
| M+10 | ⌛ 72 % | ⌛ 20 % / ⏳ 80 % | **40 % de victoires**, 3,2 morts |
| M+15 | ⌛ 72 % | ⌛ 28 % / ⏳ 72 % | **88 % de victoires**, 1,0 mort |
| M+20 | ⌛ 96 % | ⌛ 28 % / ⏳ 56 % | **56 % de victoires**, 2,0 morts |
| M+25 | ⌛ 100 % | ⌛ 36 % / ⏳ 64 % | **68 % de victoires**, 1,6 mort |
| M+30 | ⌛ 92 % | ⌛ 24 % / ⏳ 72 % | **80 % de victoires**, 0,9 mort |

Le palier 15 se comporte comme ses voisins. La lecture des trois paliers du
Sablier est enfin celle qui était visée : sur-équipé, Sablier parfait ; équipé
pour le palier, Sablier tenu ; en retard, Effondrement et morts.

## Ce qui reste

**Le palier 30 est le plus indulgent du haut de la courbe** — 80 % de victoires
avec cinq paliers de retard, contre 56 % au palier 20. C'est mécanique : son
butin est le meilleur du jeu et il n'existe rien au-delà, donc l'écart entre
« équipé pour 25 » et « équipé pour 30 » est le plus faible de la courbe. Cela
demanderait du contenu au-delà du palier 30, pas un réglage.

## Détail technique

`src/data/items.js` : `mythicStarRates` et `mythicQualityRates` sont
reconstruites par interpolation entre paliers-jalons.
`src/data/mythic.js` : suppression de l'amortissement des dix derniers paliers,
seuil du Sablier parfait à 70 %.

**17 tests** nouveaux (`tests/loot.mythic.test.js`) verrouillent l'absence de
recul palier par palier, les valeurs des jalons, et le fait que l'aperçu affiché
au joueur et le générateur lisent bien les mêmes tables. **13 mutations**
appliquées au code livré, dont deux équivalentes et documentées comme telles.
