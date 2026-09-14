# v1.92.0 — « Insuffisant » alors que tu gagnes

## Le problème

Le jeu t'annonçait **« Insuffisant »** ou **« Très insuffisant »** sur des
combats que tu remportais douze fois sur douze. Mesuré sur 840 situations
(palier de progression × mission) : **20 % de verdicts franchement faux**, tous
dans ce sens — le jeu décourageait d'essayer un contenu déjà à ta portée.

## Deux causes, et la première est spectaculaire

**L'écran de Raid affichait deux chiffres qui se contredisaient.** Le panneau
annonçait « Recommandée : 10 200 » — la bonne valeur, relevée par simulation —
pendant que le verdict juste à côté était calculé sur **52 300**. Un facteur
**cinq**, sur la même page.

Le code savait pourtant quoi faire : *« quand le mode annonce lui-même une
puissance calibrée, c'est elle qui fait foi »*. Mais la règle demandait « cette
mission a-t-elle un identifiant de difficulté ? » au lieu de « cette mission
annonce-t-elle un chiffre ? ». Le Raid et les Expéditions en annoncent un ; ils
étaient exclus pour une raison sans rapport.

**Et la campagne annonçait 47 % de trop.** C'est le seul mode dont la puissance
recommandée est calculée plutôt que relevée — 210 missions ne se mettent pas en
table. Ses facteurs n'avaient pas suivi les rééquilibrages récents.

| Mode | Écart avant | Écart après |
|---|---|---|
| Campagne | **+47 %** (jusqu'à +78 %) | **−1 %** |
| Raid | +295 % (verdict) | **+1 %** |
| Expéditions | +152 % (verdict) | **+2 %** |

## Ce que ça change pour toi

Les contradictions franches passent de **20 % à 1 %**.

Concrètement : quand le jeu te dit que c'est jouable, ça l'est ; quand il te dit
que ça ne passe pas, écoute-le. Les deux chiffres d'un écran de Raid disent
enfin la même chose.

## Un test qui a changé de camp

Le contrat qui gardait tout ça exigeait qu'il **existe** des combats où le
verdict se trompe — c'était la raison d'être du simulateur. Il n'en trouve plus.
Vérifié par le balayage large avant de le croire : cette fois l'indicateur est
réellement devenu fiable. Le test a donc été **inversé** : il exige maintenant
l'accord, et il échouera si un futur rééquilibrage remet l'annonce en défaut.
