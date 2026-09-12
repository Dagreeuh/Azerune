# Azerune — Les ennemis Mythic+ frappent enfin

## Ce qui n'allait pas

Le Sablier d'Azerune a donné au Mythic+ une horloge, mais pas encore de danger.
On pouvait pousser l'Effondrement jusqu'à multiplier l'Attaque ennemie par dix :
une équipe sous-équipée survivait quand même.

La cause tenait en trois chiffres, mesurés sur de vrais personnages portant du
vrai butin :

- Un joueur équipé pour le palier 30 a environ **480 de Défense**. Avec la
  mitigation `100/(100+DEF×3)`, il n'encaisse que **6,5 %** de l'Attaque
  annoncée d'un ennemi.
- Un ennemi ordinaire du palier 30 avait **79 d'Attaque**. Soit environ **cinq
  points de dégâts** contre un allié de 4 000 points de vie.
- La puissance recommandée annonçait **2 925** au palier 1 quand un joueur prêt
  en avait **12 696**. La jauge de préparation se trompait d'un facteur quatre.

Résultat : **100 % de victoires à tous les paliers, zéro mort**, même avec dix
paliers d'équipement de retard.

## Ce qui change

**Les ennemis frappent pour de bon.** L'Attaque de base passe de 31 à 700 pour
un ennemi ordinaire, et sa montée par palier de 1,035 à 1,072 — elle croît
désormais plus vite que l'équipement des joueurs, ce qu'imposait la mitigation
par la Défense.

**Les ennemis résistent.** Leur Défense montait de 1,015 par palier, soit à
peine ×1,5 sur trente niveaux pendant que l'Attaque des joueurs triplait : les
derniers paliers se terminaient plus vite que ceux du milieu. Elle suit
maintenant 1,045.

**Ils encaissent un peu plus.** Les points de vie de base augmentent de moitié.

**Le palier 30 aligne une vraie escouade finale.** Sa quatrième vague envoyait
son boss seul, quand toutes les autres comptent un boss et deux élites. C'était
la course la plus courte du mode ; c'est maintenant la plus longue.

**La puissance recommandée dit la vérité.** Elle est recalée sur la puissance
réellement mesurée aux trente paliers — `12 650 + 28 × niveau²` — au lieu d'une
formule à paliers qui n'existait dans aucune donnée. La jauge de préparation
affichée avant chaque course redevient utilisable.

**Le budget du Sablier suit.** Son facteur passe de 133 à 120 : les courses
sont plus courtes et plus denses qu'avant, le sablier se cale dessus.

## Ce que ça donne

13 courses complètes par case, champions maximisés, équipement en butin Mythic+
du palier indiqué.

| Palier | Équipement du palier | 5 paliers de retard | 10 paliers de retard |
|---|---|---|---|
| M+5 | victoire nette | 22 % en Effondrement | victoire |
| M+10 | victoire nette | **11 % de victoires**, 3,6 morts | **défaite** |
| M+15 | 44 % de victoires, 2,7 morts | 100 % en Effondrement | **défaite** |
| M+20 | victoire tenue | **défaite** | **défaite** |
| M+25 | victoire, souvent parfaite | 67 % en Effondrement | **défaite** |
| M+30 | victoire tenue | 56 % de victoires, 2,1 morts | **défaite** |

L'Effondrement est devenu ce qu'il devait être : ce qui transforme un retard
d'équipement en course perdue, au lieu d'une course simplement longue.

## Ce qui reste en chantier

La courbe d'équipement Mythic+ monte en marches d'escalier — la qualité et les
étoiles du butin changent à des paliers fixes. La puissance recommandée, elle,
est lisse. Certains paliers tombent donc juste avant une marche et sont plus
durs que leurs voisins : **le palier 15 est le plus sévère du mode**, avec 44 %
de victoires à équipement théoriquement adéquat.

Corriger cela demande de retoucher les tables de génération du butin, pas les
ennemis. C'est le prochain chantier, et il est laissé de côté ici volontairement.

## Correction des chiffres du Sablier

La note `SABLIER-AZERUNE-MYTHIC.md` annonçait des budgets de 179 tours au palier
1 à 88 au palier 30, et une table de résultats par multiple de la puissance
recommandée. Ces chiffres venaient d'une simulation menée avec une **équipe
synthétique**, dont les statistiques étaient calées artificiellement sur la
puissance recommandée. Mesurée avec du vrai butin, cette équipe n'existe pas :
sa Défense était trop basse et ses courses trop longues.

Les budgets réels vont désormais de **56 tours au palier 1 à 80 au palier 30**,
et la table de référence est celle de ce document. La mécanique du Sablier, ses
trois paliers et ses multiplicateurs de butin sont inchangés.

## Détail technique

Tout tient dans `src/data/mythic.js` : `mythicScaling`, les bases de `enemy`,
la quatrième vague de `wave` au palier 30, et `recommended` dans
`createMythicMission`.

**13 mutations** appliquées au code livré — exposants revenus à leurs anciennes
valeurs, bases d'Attaque et de PV, ancienne puissance recommandée, boss seul au
palier 30 — toutes détectées. Les tests fixent désormais les valeurs absolues
d'Attaque et non plus seulement les pentes : une pente juste sur des bases trop
faibles laisse des ennemis inoffensifs à tous les paliers.
