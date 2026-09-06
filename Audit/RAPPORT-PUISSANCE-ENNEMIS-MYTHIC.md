# Audit — Pourquoi les ennemis Mythic+ ne tuaient personne

*Mesures faites sur le moteur réel, avec des champions maximisés portant du
butin Mythic+ généré par le jeu lui-même. Aucune équipe synthétique : c'est
l'erreur qui a faussé la première calibration du Sablier.*

## Le constat de départ

Le Sablier d'Azerune mettait le joueur sous pression sans jamais le tuer.
En poussant l'Effondrement à +20 % d'Attaque ennemie par tour — soit une
Attaque multipliée par dix en fin de course — une équipe sous-équipée
survivait encore. Le Sablier n'était pas en cause.

## Ce que la mesure a montré

### 1. La puissance recommandée était fausse d'un facteur 2 à 4

Un joueur portant six pièces de butin Mythic+ du palier, champions niveau 60
et 6★ :

| Équipement | Puissance réelle | Recommandée annoncée | Écart |
|---|---|---|---|
| Mythic+ 1 | 12 696 | 2 925 | **×4,34** |
| Mythic+ 15 | 17 852 | 10 934 | ×1,63 |
| Mythic+ 30 | 41 926 | 20 306 | ×2,06 |

La jauge de préparation affichée avant chaque course annonçait « prêt » très
au-delà du nécessaire. Elle ne pouvait rien dire d'utile.

### 2. La Défense alliée annulait l'Attaque ennemie

La mitigation vaut `100 / (100 + DEF × 3)`. Or la Défense d'un joueur équipé
monte vite :

| Équipement | Défense typique | Part de l'Attaque ennemie encaissée |
|---|---|---|
| Mythic+ 1 | 174 | 16,1 % |
| Mythic+ 15 | 282 | 10,6 % |
| Mythic+ 30 | 480 | **6,5 %** |

Pendant ce temps, l'Attaque ennemie suivait `1,035` par palier — moins vite
que la puissance des joueurs, et bien moins vite que leur Défense. Un ennemi
de Mythic+ 30 avait **79 d'Attaque** ; après mitigation, il infligeait environ
cinq points de dégâts à un allié de 4 000 points de vie.

### 3. La Défense ennemie, elle, était plate

`1,015` par palier, soit ×1,5 sur trente niveaux, quand l'Attaque des joueurs
triplait. Les derniers paliers se terminaient donc **plus vite** que ceux du
milieu : 20 tours au palier 30 contre 51 au palier 15.

### 4. La dernière vague du palier 30 n'alignait qu'une unité

Toutes les autres quatrièmes vagues comptent un boss et deux élites. Le palier
final, lui, envoyait son boss seul — ce qui en faisait la course la plus courte
du mode.

### Résultat mesuré, avant correction

Victoires à **100 % partout**, zéro mort, y compris avec dix paliers
d'équipement de retard.

## Les corrections

| | Avant | Après |
|---|---|---|
| Attaque de base (ordinaire / élite / boss) | 31 / 39 / 48 | **700 / 880 / 1085** |
| Exposant d'Attaque | 1,035 | **1,072** |
| PV de base (ordinaire / élite / boss) | 250 / 360 / 560 | **375 / 540 / 840** |
| Exposant de Défense | 1,015 | **1,045** |
| Vague 4 du palier 30 | boss seul | **boss + 2 élites** |
| Puissance recommandée | (1700 + 360N + 600⌊N/10⌋) × 1,42 | **12 650 + 28N²** |
| Facteur de budget du Sablier | 133 | **120** |

La forme quadratique de la puissance recommandée est un ajustement par moindres
carrés sur la puissance réellement mesurée aux trente paliers : écart moyen
4,2 %. Elle remplace un palier tous les dix niveaux qui n'existait dans aucune
donnée réelle.

## Résultat mesuré, après correction

13 courses complètes par case. `g N` = joueur équipé en butin du palier N.
`⌛` Sablier parfait, `⏳` tenu, `💥` Effondrement — répartition des victoires.

| Palier | Équipement +5 | Équipement du palier | Équipement −5 | Équipement −10 |
|---|---|---|---|---|
| M+1 | ⌛ 100 % | ⏳ 100 % | ⏳ 100 % | ⏳ 89 % |
| M+5 | ⌛ 67 % | ⏳ 100 % | ⏳ 78 % / 💥 22 % | ⏳ 100 % |
| M+10 | ⌛ 44 % / ⏳ 56 % | ⌛ 44 % / ⏳ 56 % | **11 % de victoires**, 3,6 morts | **défaite** |
| M+15 | ⌛ 89 % | 44 % de victoires, 2,7 morts | 💥 100 % | **défaite** |
| M+20 | ⌛ 100 % | ⏳ 67 % / ⌛ 33 % | **défaite** | **défaite** |
| M+25 | ⌛ 100 % | ⌛ 78 % / ⏳ 22 % | 💥 67 % | **défaite** |
| M+30 | ⌛ 100 % | ⏳ 100 % | 56 % de victoires, 2,1 morts | **défaite** |

L'Effondrement tue désormais : c'est lui qui transforme un retard d'équipement
de cinq paliers en course perdue plutôt qu'en course longue.

## Ce qui reste imparfait

**La courbe d'équipement est en marches d'escalier.** Le butin Mythic+ change de
qualité et d'étoiles à des paliers fixes, si bien que la puissance réelle fait
des bonds : 17 983 au palier 15, 25 792 au palier 20, 39 601 au palier 30. La
puissance recommandée, elle, est lisse. Conséquence : certains paliers tombent
juste avant une marche et sont plus durs que leurs voisins — le palier 15 est
le plus sévère de la table ci-dessus, avec 44 % de victoires à équipement
théoriquement adéquat.

Lisser cette courbe demande de retoucher les tables de génération du butin
Mythic+, pas les ennemis. C'est un travail séparé, et volontairement laissé de
côté ici.

**Le palier 30 reste indulgent à équipement maximal**, parce que le butin du
palier 30 est le meilleur du jeu et qu'il n'existe rien au-delà. La référence
honnête pour ce palier est l'équipement du palier 25, qui donne 56 % de
victoires et deux morts par course.
