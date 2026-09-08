# Les Empreintes d'Azerune

## En bref

Chaque champion dispose désormais d'un **arbre d'Empreintes** : douze nœuds
répartis en trois branches, dont vous ne pourrez jamais allumer plus de la
moitié. Et la Résonance cesse d'être décorative — chacun de ses cinq paliers
ouvre un étage de l'arbre ou verse un point.

Au passage : **les Tomes de maîtrise ne servaient à rien.** C'est corrigé.

## Le bug d'abord

Le moteur de combat lit les niveaux de compétence de chaque champion. L'écran de
combat ne les lui transmettait jamais. Résultat : **toute compétence montée avec
des Tomes de maîtrise combattait au niveau 1**, quoi que vous ayez acheté, et
l'infobulle affichait « Niveau 1/6 » en permanence.

Le tutoriel, lui, transmettait bien la valeur — ce qui rendait le défaut
invisible, puisque c'était le seul endroit où elle valait 1 de toute façon.

Mesuré : une compétence au maximum vaut **+29,5 % de dégâts**. Tout cela était
perdu. Vos Tomes déjà dépensés reprennent effet immédiatement.

## L'arbre d'Empreintes

Trois branches, quatre étages chacune :

- ⚔️ **Force** — amplifie ce que le champion fait déjà : dégâts, soins ou
  boucliers selon son kit.
- 🕸️ **Emprise** — fiabilité et durée des effets : marques, malus,
  régénérations.
- 🌀 **Flux** — vitesse, temps de recharge, tempo.

**Vous n'aurez jamais assez de points pour tout allumer.** Douze nœuds, six
points au sommet absolu de la progression. Ce n'est pas une avarice : c'est le
cœur du système. On ne renforce pas un champion, on le spécialise. Deux joueurs
avec le même Thorgar pleinement investi n'auront pas le même Thorgar.

Et si un choix ne vous plaît pas, **tout effacer est gratuit et illimité**.
Essayer une autre orientation ne doit rien coûter.

### Deux sources, deux rôles

- **Les étoiles donnent les points.** `étoiles − 2`, soit 1 à 4 : donc
  l'Ascension, donc les essences.
- **La Résonance donne la profondeur.** Les doublons ouvrent les étages.

| Palier | Ce qu'il donnait | Ce qu'il donne en plus |
|---|---|---|
| R1 | +2 % PV/ATQ/DEF | ouvre l'étage II |
| R2 | +3 Vitesse | +1 point d'Empreinte |
| R3 | +3 Précision / Résistance | ouvre l'étage III |
| R4 | bonus d'identité | +1 point d'Empreinte |
| R5 | +2 % PV/ATQ/DEF | ouvre l'étage IV |

**Rien n'a été retiré.** Tous les bonus existants sont conservés — la Résonance
gagne une fonction, elle n'en perd aucune.

Un champion neuf a déjà un point et trois nœuds où le poser : l'arbre est
utilisable dès la première invocation.

## L'équilibre

C'est la règle qui a permis d'ajouter deux portails d'invocation sans toucher à
l'économie, appliquée ici : **changer la forme, pas le volume.**

| Source de puissance | Gain |
|---|---|
| Équipement complet | +172 % |
| Maîtrise des compétences | +30 % |
| **Branche Force complète** | **+20,5 %** sur l'ultime |
| Résonance R0→R5 | +3,8 % |

Les Empreintes se placent entre la maîtrise et l'équipement. Assez pour compter,
jamais assez pour devenir la nouvelle source dominante — un test le verrouille
des deux côtés.

Conséquence assumée : la puissance affichée ne bouge presque pas, la plupart des
nœuds étant des bonus de sort. La recommandation des missions sous-estime donc
légèrement un champion investi. C'est le bon sens de l'erreur.

## Ce qui n'a pas été fait

Pas de second emplacement d'équipement façon Cône de lumière : ce serait une
source de puissance de plus par-dessus un équipement qui pèse déjà +172 %. Les
Armes Uniques tiennent ce rôle ; leur vrai manque est leur couverture — sept
armes pour trente-six champions — pas leur absence.

Les nœuds sont dérivés du kit de chaque champion plutôt qu'écrits un par un.
C'est ce qui rend le système tenable à trente-six champions, mais un nœud
d'étage IV taillé sur mesure aurait plus de saveur.

## Sous le capot

Une Empreinte n'agit qu'à travers des leviers que le moteur lit déjà — les
quatre bonus de compétence et les statistiques. Un seul point de jonction dans
le calcul des sorts, donc aucune surface de bug nouvelle dans le combat.

42 tests nouveaux. 26 mutations appliquées, 26 tuées après renforcement — dont
la plus grave, qui effaçait l'arbre à chaque rechargement de la sauvegarde sans
qu'aucun test ne s'en aperçoive.

Audit complet et méthode : `Audit/RAPPORT-EMPREINTES.md`.

**1 148 tests, 45 fichiers.**
