# Azerune — Le Sablier d'Azerune : le Mythic+ a enfin une horloge

## Le problème

Le Mythic+ n'était pas difficile, il était **long**. Aucune de ses trente
courses n'avait de condition d'échec : le Raid déclenche son enrage à
quarante actions, le Mythic+ n'avait rien. Une équipe à moins de la moitié de
la puissance recommandée gagnait quand même, en cent soixante tours.

Rien ne récompensait l'efficacité. Jouer vite ou jouer lentement rapportait le
même butin, donc l'optimisation d'une équipe n'avait aucune traduction dans le
jeu.

## Le Sablier

Chaque niveau Mythic+ dispose désormais d'un **budget de tours partagé par les
quatre vagues**. Passer à la vague suivante ne le remet pas à zéro : c'est la
course entière qui est chronométrée, pas chaque combat.

Quand le sablier se vide, la course **ne s'arrête pas**. L'**Effondrement**
commence : chaque tour au-delà du budget augmente l'Attaque ennemie de **+5 %**,
cumulativement. Vingt tours de retard, et les ennemis frappent deux fois plus
fort. Le joueur n'est pas éjecté ; il est mis sous pression, et la course
devient de plus en plus mortelle jusqu'à ce qu'il gagne ou qu'il tombe.

Le sablier restant s'affiche pendant le combat, à côté du compteur de vagues, et
bascule en rouge clignotant dès l'Effondrement.

## Trois paliers de butin

| Palier | Condition | Butin |
|---|---|---|
| ⌛ **Sablier parfait** | 75 % du budget ou moins | **×1,25** |
| ⏳ **Sablier tenu** | jusqu'au budget | normal |
| 💥 **Effondrement** | au-delà | **×0,6** |

Le multiplicateur s'applique à l'or, aux gemmes, aux pierres, à l'essence, aux
tomes et aux âmes de la **première validation** du niveau. L'équipement et les
reliques restent binaires. Un gain non nul ne peut jamais tomber à zéro : une
course validée rapporte toujours quelque chose.

Le palier obtenu est affiché sur l'écran de fin de mission, avec les tours
consommés.

## Un budget propre à chaque niveau

C'est le point sur lequel la première calibration était fausse, et il vaut la
peine d'être expliqué.

L'intention était un budget fixe de 80 tours. En simulant trente courses
complètes par point de mesure sur le moteur réel, la durée médiane d'une course
menée exactement à la puissance recommandée donne :

| Niveau | M+1 | M+5 | M+10 | M+15 | M+20 | M+25 | M+30 |
|---|---|---|---|---|---|---|---|
| Tours | 135 | 118 | 96 | 95 | 97 | 110 | 89 |

La durée d'une course ne suit pas le niveau : elle suit le rapport entre les PV
ennemis totaux et la puissance recommandée, et ce rapport fait des dents de
scie parce que la puissance recommandée reçoit un bonus tous les dix niveaux.

Un budget fixe de 80 tours aurait donc mis **toutes les courses de M+1 à M+8 en
Effondrement, y compris à 1,4× la puissance recommandée**, pendant que M+30
restait tranquille. L'inverse exact de la progression annoncée.

Le budget est donc calculé par niveau, à partir du contenu réel de la course :

```
budget = 133 × (PV ennemis des quatre vagues) / (puissance recommandée)
```

Soit 179 tours à M+1, 130 à M+5, 101 de M+10 à M+20, 107 à M+25, 88 à M+30. Ce
prédicteur reproduit les durées mesurées à moins de 8 % près sur les trente
niveaux. Le budget de chaque niveau est annoncé sur la page Mythic+ avant le
lancement, avec les trois paliers : une pression que l'on découvre en la
subissant est une punition, pas une mécanique.

## Ce que ça donne, mesuré

21 courses par point, équipement exprimé en multiple de la puissance
recommandée :

| Équipement | M+5 | M+10 | M+15 | M+20 | M+25 | M+30 |
|---|---|---|---|---|---|---|
| ×0,8 | 💥 100 % | 💥 100 % | 💥 95 % | 💥 100 % | 💥 100 % | 💥 100 % |
| ×0,9 | 💥 48 % | 💥 100 % | 💥 52 % | 💥 76 % | 💥 100 % | 💥 100 % |
| ×1,0 | ⏳ tenu | ⏳ tenu | ⏳ tenu | ⏳ 90 % | 💥 76 % | 💥 62 % |
| ×1,1 | ⏳ tenu | ⏳ tenu | ⏳ tenu | ⏳ tenu | ⏳ 95 % | ⏳ 95 % |
| ×1,2 | ⌛ 19 % | ⌛ 19 % | ⌛ 43 % | ⌛ 14 % | ⏳ tenu | ⏳ tenu |
| ×1,4 | ⌛ 100 % | ⌛ 100 % | ⌛ 100 % | ⌛ 100 % | ⌛ 62 % | ⌛ 62 % |

Sous-équipé, on s'effondre. À la puissance recommandée, on tient de justesse.
Le Sablier parfait demande un écart d'équipement réel.

## Ce qui reste à faire, et qu'il faut dire

**L'Effondrement ne tue pas encore.** Sur ces mêmes courses, une équipe à 0,8×
encaisse au total 0,2× ses points de vie ; avec l'Effondrement elle en encaisse
0,4×. En poussant le taux à 20 % — une Attaque ennemie multipliée par dix en fin
de course — elle survit toujours.

La cause n'est pas le Sablier : **les ennemis Mythic+ frappent beaucoup trop
faiblement pour leur puissance recommandée**. À M+20, ils ont 60 à 109 d'Attaque
face à des alliés à 229–364 d'Attaque et 1 225–1 936 PV.

C'est le constat déjà posé par l'audit d'équilibrage. Le Sablier apporte
aujourd'hui la pression et le gradient de récompense ; il ne deviendra létal
qu'une fois l'Attaque des ennemis Mythic+ remontée. C'est la prochaine étape.

## Détail technique

| Fichier | Rôle |
|---|---|
| `src/data/mythic.js` | constantes, `mythicTurnBudget`, `mythicPerfectTurns`, `turnBudget` sur la mission |
| `src/utils/mythic.js` | logique pure : état, horloge, facteur d'Effondrement, paliers, mise à l'échelle du butin |
| `src/battle/engine.js` | création de l'état, avance à chaque tour, facteur appliqué à l'Attaque ennemie |
| `src/store/GameContext.jsx` | `finishMythicMission(mission, battle)` applique le palier au butin |
| `src/pages/BattlePage.jsx` | sablier restant, Effondrement, palier sur l'écran de récompense |
| `src/pages/MythicPage.jsx` | règle et budget du niveau annoncés avant le lancement |

Aucun nouveau système : le compteur d'actions, le facteur multiplicatif sur
l'Attaque et la persistance d'état entre vagues existaient déjà.

**62 tests** couvrent la mécanique (`tests/mythic.sablier.test.js`), dont sept
tests de contrat qui vérifient que le budget de la mission arrive jusqu'au
moteur, que le combat arrive jusqu'au calcul de récompense, et que la règle est
affichée au joueur. **34 mutations** ont été appliquées au code livré : toutes
sont détectées.

---

> **Correction (voir `EQUILIBRAGE-PUISSANCE-ENNEMIS-MYTHIC.md`).** Les budgets
> et la table de résultats ci-dessus proviennent d'une simulation menée avec une
> équipe synthétique, dont les statistiques étaient calées artificiellement sur
> la puissance recommandée. Mesurée avec du vrai butin, cette équipe a une
> Défense bien plus élevée et des courses bien plus courtes. Les budgets réels
> vont de **56 tours au palier 1 à 80 au palier 30**, et le facteur de budget
> est passé de 133 à 120. La mécanique du Sablier, ses trois paliers et ses
> multiplicateurs de butin sont inchangés.
