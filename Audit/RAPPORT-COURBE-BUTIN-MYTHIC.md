# Audit — Le butin Mythic+ stagnait entre deux jalons

*Suite directe de `RAPPORT-PUISSANCE-ENNEMIS-MYTHIC.md`, dont la dernière
section signalait ce défaut sans le corriger.*

## Le symptôme

Après la remontée en puissance des ennemis, un palier ressortait comme
anormalement dur : **le Mythic+ 15**, avec 44 % de victoires pour un joueur
équipé du butin de ce palier, quand ses voisins en donnaient 100 %.

Ce n'était pas la faute des ennemis, qui montent régulièrement. C'était la
courbe d'équipement qui, elle, ne montait pas.

## La cause

Les tables de butin Mythic+ fonctionnaient par blocs de niveaux, et deux blocs
étaient **plus généreux que le bloc suivant** :

| Palier | Étoiles moyennes | Qualité moyenne (normal 0 → légendaire 4) |
|---|---|---|
| 9 | 2,20 | 1,42 |
| **10** | **3,00** | **2,20** |
| 11 à 15 | 3,00 | **1,95** ⬅ *recul* |
| 16 à 19 | 3,25 | 2,37 |
| **20** | **4,00** | **2,70** |
| 21 à 24 | 4,00 | **2,65** ⬅ *recul* |

Farmer le palier 15 rapportait donc des pièces **de moins bonne qualité** que
farmer le palier 10. Mesurée en puissance d'équipe réelle, sur sept tirages
d'équipement complet par palier :

| Équipement du palier | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|---|---|---|---|---|---|---|---|
| Puissance | **17 155** | 16 308 | 16 993 | 16 725 | 18 219 | 17 983 | 19 215 |

Il fallait atteindre le palier 14 pour retrouver la puissance du palier 10, et
le palier 16 pour la dépasser nettement. Pendant ces cinq paliers, les ennemis,
eux, continuaient de monter. Le mur du mode était là, et il était structurel.

Le rapport entre puissance réelle et puissance recommandée oscillait entre
**0,75 et 0,99** selon le palier — un joueur pouvait être « prêt » ou
« en retard » selon le seul hasard de l'endroit où il s'était arrêté.

## La correction

Les tables par blocs sont remplacées par une **interpolation entre les
paliers-jalons**, avec deux garanties :

1. Les jalons — 1, 6, 10, 20, 30 — reprennent **exactement** les valeurs des
   anciens blocs. Aucun palier ne reçoit moins qu'avant.
2. Entre deux jalons, étoiles et qualité progressent à chaque palier au lieu
   d'attendre le suivant.

```
Étoiles :  1 → 2,0   6 → 2,2   10 → 3,0   20 → 4,0   30 → 5,0
Qualité :  1 → 0,95  6 → 1,42  10 → 2,20  20 → 2,70  30 → 3,30
```

Le sommet de la courbe est inchangé : le palier 30 reste 5★, épique 70 /
légendaire 30. Il ne s'agissait pas d'enrichir la fin de jeu, mais de supprimer
les creux.

Un défaut connexe a été corrigé au passage : les **dix derniers paliers
d'ennemis montaient à 80 % du rythme** des vingt premiers, sans raison énoncée.
La difficulté s'aplatissait exactement là où elle doit culminer. Chaque palier
compte désormais pour un.

Enfin, le seuil du Sablier parfait passe de 75 % à **70 % du budget** : à
équipement du palier, une course tient désormais le budget sans atteindre ce
seuil, qui redevient ce qu'il devait être — la récompense d'un écart
d'équipement réel.

## Résultat mesuré

Puissance réelle rapportée à la puissance recommandée, onze tirages par palier :

| | Avant | Après |
|---|---|---|
| Amplitude du rapport sur 30 paliers | **0,75 – 0,99** | **1,00 – 1,18** |
| Reculs de puissance d'un palier au suivant | 11, 13, 18, 19, 22, 24, 27, 29 | 13, 18, 24 (bruit d'échantillonnage, 1 à 4 %) |

Difficulté, 25 courses par case — cinq tirages d'équipement complet, cinq
courses chacun. `⌛` Sablier parfait, `⏳` tenu, `💥` Effondrement.

| Palier | Équipement +5 | Équipement du palier | Équipement −5 |
|---|---|---|---|
| M+1 | ⌛ 16 % / ⏳ 80 % | ⏳ 92 % | ⏳ 80 % / 💥 20 % |
| M+5 | ⌛ 68 % / ⏳ 32 % | ⏳ 96 % | ⏳ 24 % / 💥 76 % |
| M+10 | ⌛ 72 % / ⏳ 28 % | ⌛ 20 % / ⏳ 80 % | **40 % de victoires**, 3,2 morts |
| M+15 | ⌛ 72 % / ⏳ 28 % | ⌛ 28 % / ⏳ 72 % | **88 % de victoires**, 1,0 mort |
| M+20 | ⌛ 96 % | ⌛ 28 % / ⏳ 56 % | **56 % de victoires**, 2,0 morts |
| M+25 | ⌛ 100 % | ⌛ 36 % / ⏳ 64 % | **68 % de victoires**, 1,6 mort |
| M+30 | ⌛ 92 % | ⌛ 24 % / ⏳ 72 % | **80 % de victoires**, 0,9 mort |

Le palier 15 n'est plus un mur : il se comporte comme ses voisins. La lecture
des trois paliers du Sablier est enfin celle qui était visée — sur-équipé,
Sablier parfait ; équipé pour le palier, Sablier tenu ; en retard,
Effondrement et morts.

## Ce qui reste

**Le palier 30 est le plus indulgent du haut de la courbe** : 80 % de victoires
avec cinq paliers de retard, contre 56 % au palier 20. C'est une conséquence
mécanique du terminus — le butin du palier 30 est le meilleur du jeu et il
n'existe rien au-delà, donc l'écart entre « équipé pour 25 » et « équipé pour
30 » est le plus faible de la courbe. Le corriger demanderait un contenu
au-delà du palier 30, pas un réglage.
