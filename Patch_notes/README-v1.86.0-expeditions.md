# v1.86.0 — Les expéditions avaient quatre niveaux pour rien

## Le constat

En simulant de vraies équipes contre les vraies rencontres : **un joueur de la
zone 3 enchaînait les niveaux 7, 8, 9 et 10.** Les quatre derniers niveaux ne
demandaient rien de plus que le septième.

Pendant ce temps, l'écran annonçait **16 000 de puissance** pour le niveau 10.
Il en fallait **5 700**.

## Ce qui change

**La difficulté monte maintenant sur les dix niveaux.** Le niveau 1 reste une
mise en jambe pour une équipe de départ ; le niveau 10 demande une campagne
normale terminée. Entre les deux, chaque niveau demande à peu près un palier de
progression de plus.

**La puissance annoncée a été relevée, pas décidée.** Chaque valeur est
maintenant la puissance de la première équipe simulée qui gagne une fois sur
deux, médiane sur les quatre expéditions.

| Niveau | Annoncé avant | Annoncé maintenant |
|---|---|---|
| 1 | 500 | **2 900** |
| 5 | 3 600 | **5 900** |
| 10 | 16 000 | **11 100** |

L'ancienne table se trompait de **-83 % à +83 %**, dans les deux sens. C'est
pire qu'un chiffre absent : tu pouvais y lire « infaisable » et gagner, ou
« accessible » et perdre.

## Ce qui ne change pas

Les récompenses, le nombre de sceaux quotidiens, les mécaniques de chaque
expédition et le bonus de première victoire sont intacts. **Seule la courbe de
difficulté bouge**, et seulement à partir du niveau 2.

## Pourquoi le niveau 10 s'arrête à la campagne normale

Une courbe plus raide plaçait le niveau 10 derrière la campagne *difficile*. Or
les expéditions versent les essences d'Ascension qui servent précisément à y
arriver : on ne met pas la clé derrière la porte qu'elle ouvre.

## Vérifié

7 tests rejouent de vrais combats à chaque lancement de la suite, dont celui qui
aurait attrapé le défaut d'origine : *un joueur de milieu de partie ne doit pas
balayer les derniers niveaux*. Remettre l'ancienne échelle le fait échouer.
