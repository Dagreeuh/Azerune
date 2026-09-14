# v1.89.0 — Les dégâts comptent enfin

## Le problème, en une phrase

**Plus un champion infligeait de dégâts, moins il faisait gagner son équipe.**

Ce n'était pas une impression. Classement des 29 champions sur quatre
rencontres d'éléments différents : les cinq champions sans aucune utilité — ni
malus, ni soin, ni bouclier — occupaient les **cinq dernières places**. Les
trois premiers étaient ceux qui en apportaient le plus. Thorgar, un 3★ qui
inflige 83 % de dégâts en moins que la médiane, était **premier du roster**.

## Pourquoi

La Défense réduisait les dégâts selon `100 / (100 + DÉF × 3)`. Mesuré le long
de la progression :

| Contenu | DÉF ennemie | Dégâts absorbés | Rapport soutien/dégâts |
|---|---|---|---|
| Campagne zone 1 | 13 | 29 % | 0,89 |
| Campagne zone 5 | 25 | 43 % | 2,20 |
| Campagne zone 10 | 42 | 56 % | 2,78 |
| Raid niveau 10 | 73 | **69 %** | 2,02 |

Pendant ce temps, soins et boucliers se calculent sur les **PV max** de l'allié
— une valeur que l'ennemi ne réduit pas. Le jeu commençait équilibré et glissait
mécaniquement vers le soutien à mesure que la Défense montait.

## Ce qui change

Le poids de la Défense passe de **×3 à ×1,5**. Un boss de raid absorbe désormais
52 % des dégâts au lieu de 69 %.

Cette valeur n'existe plus qu'à **un seul endroit** dans le code. Le moteur,
l'infobulle de tes sorts et les tests la lisent tous les trois : l'écran ne peut
plus annoncer une formule que le combat n'applique pas.

## Ce que ça donne

**Les frappeurs redeviennent jouables.** Sur 240 combats simulés par champion :

| Champion | Avant | Après |
|---|---|---|
| Vharok (4★) | 129 | **202** |
| Vélomoteur (5★) | 142 | **232** |
| Ragnhild (3★) | 139 | **212** |
| Seraphiel (4★) | 145 | **211** |
| Brilith (5★) | 133 | **194** |

L'écart entre le meilleur et le pire champion tombe de **108 à 76 points**.

**Et la campagne devient une vraie progression.** C'est la surprise de cette
mesure : avant ce changement, un joueur équipé en **zone 3** nettoyait les zones
1 à 9 en gagnant 29 ou 30 fois sur 30. La campagne était une formalité de bout
en bout. Elle demande maintenant de progresser pour avancer.

Le Raid et les Expéditions y gagnent aussi une courbe plus régulière. Les
puissances annoncées des Expéditions sont relevées en conséquence ; celles du
Raid tombaient déjà juste.

## Ce qui reste

Quatre champions restent nettement en dessous : **Nyxaris, Aszhal, Caelion**
(tous trois Arcane) et **Yunmei**. Leur problème ne vient plus du moteur — il
vient de leur kit. C'est le chantier suivant, et il est maintenant possible de
le mener sans convertir tout le monde en soigneur.
