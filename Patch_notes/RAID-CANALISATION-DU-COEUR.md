# Azerune — Canalisation du Cœur : une mécanique de Raid dont la réponse n'est pas des dégâts

## Le problème

Mesuré : environ 10 % des compositions terminaient un Raid de haut niveau, et
deux champions y valaient trois fois leur poids. La cause est structurelle — le
Raid est une course contre le compteur de charges, et **la réponse à une course
est toujours plus de dégâts**. Aucune de ses mécaniques ne demandait autre chose
que de frapper fort.

Une piste avait déjà été testée et écartée : rendre la Provocation du Gardien
réellement appliquée n'a rien changé, et la renforcer aggravait la
concentration.

## La mécanique

**Canalisation du Cœur**, à partir du niveau 6.

Le **Prêtre des flammes** — jusqu'ici un simple soigneur qu'on abattait —
commence à canaliser après huit actions de champion. Pendant la canalisation :

- il devient **intouchable** : les dégâts ne l'atteignent plus du tout ;
- seul un **étourdissement** l'interrompt ;
- s'il canalise jusqu'au bout (quatre actions, trois à partir du niveau 9), le
  Cœur incandescent bondit de **la moitié de sa capacité** et Rhazakar récupère
  **6 %** de ses points de vie.

Et surtout : **interrompre n'évite pas seulement une sanction, cela retire trois
charges** au Cœur incandescent — au même titre que détruire l'Élémentaire de
braise. Le contrôle devient un levier sur l'économie du combat, pas seulement un
bouclier contre une punition.

Le combat automatique sait y répondre : pendant une canalisation, tout champion
capable d'étourdir le fait en priorité et vise le Prêtre, tandis que les frappes
ordinaires sont détournées vers d'autres cibles.

## Ce que ça change, mesuré

A/B sur le **même palier** — Raid Cœur-de-Forge niveau 6, deux tirages
d'équipement, 150 compositions chacun, mécanique activée ou non.

| | Sans Canalisation | Avec |
|---|---|---|
| Compositions qui passent | 57 % | **32–36 %** |
| Écart entre champions | 1,31 | 2,22 |
| Champions de contrôle (moyenne) | 0,92 | **1,00–1,09** |
| **Vexil**, seul étourdissement de zone fiable | 0,94 | **1,58–1,70** |

**Vexil passe de 0,94 à 1,70 fois sa présence attendue** dans les compositions
gagnantes. C'est le plus grand déplacement de valeur mesuré sur un champion
depuis le début de cet audit, et il est constant sur les cinq variantes
essayées. La mécanique fait exactement ce qu'on lui demandait : créer une
exigence que les dégâts ne satisfont pas.

## Ce qu'elle ne fait pas — et cinq variantes pour le prouver

Elle **ne réduit pas la concentration du Raid**. L'écart entre le meilleur et le
pire champion monte au lieu de descendre, et Brilith reste en tête.

| Variante essayée | Réussite | Écart | Contrôle | Vexil |
|---|---|---|---|---|
| Sans Canalisation | 57 % | 1,31 | 0,92 | 0,94 |
| Dure : Cœur au maximum, boss +12 % | 26 % | 3,10 | 1,06 | 1,55 |
| Adoucie : +moitié, boss +6 % | 32 % | 2,38 | 1,09 | 1,67 |
| Adoucie + interruption récompensée | 36 % | 2,22 | 1,00 | 1,58 |
| … + 6 actions de plus avant l'enrage | 36 % | 1,95 | 1,04 | 1,70 |

La leçon est nette et vaut d'être retenue : **toute difficulté ajoutée
concentre davantage**, quelle que soit sa nature, parce que la condition de
victoire du Raid ne change pas. Un combat plus dur récompense mécaniquement
celui qui frappe le plus fort.

Réduire la concentration demanderait de changer la **condition de victoire**
elle-même — un Raid qui ne se gagne pas en tuant vite — et non d'y ajouter des
mécaniques. C'est une refonte de contenu, pas un réglage, et elle reste ouverte.

La variante retenue est **« adoucie + interruption récompensée »** : elle donne
au contrôle sa valeur sans la sanction la plus brutale, et la compensation par
l'enrage n'a rien apporté de mesurable, donc elle n'est pas retenue.

## Un bug trouvé en chemin

En écrivant les tests de ciblage automatique, j'ai découvert que ma propre
correction de la Provocation était **cassée en mode automatique** :
`chooseAutoEnemyTarget` renvoie une **unité**, et je renvoyais un
**identifiant**. `performAutoAction` lit `target?.id` — sur une chaîne, cela vaut
`undefined`, et le ciblage retombait silencieusement sur le premier ennemi venu.

Le test que j'avais écrit comparait la valeur de retour à un identifiant : il
confirmait mon implémentation au lieu de vérifier l'exigence. Il est remplacé
par un test de bout en bout qui vérifie que la frappe part réellement sur le
provocateur.

## Détail technique

`src/data/raids.js` : `channelFrom`, `channelActions`, onzième mécanique
annoncée au joueur dès le niveau 6, et le dernier palier révèle désormais la
liste complète.
`src/battle/engine.js` : machine d'état dans `finish`, intouchabilité dans
`castSkill`, priorité de compétence et de cible dans le combat automatique.

**1014 tests**, dont 21 sur la Canalisation. **15 mutations** appliquées au code
livré, toutes détectées.
