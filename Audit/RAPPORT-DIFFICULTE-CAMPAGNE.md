# Audit de la difficulté de la campagne — Normal, Difficile, Hardcore

Méthode, résultats, et ce qui a été corrigé. Tout ce qui est chiffré ici a été
mesuré sur le code réellement livré, jamais estimé.

---

## 1. Comment c'est mesuré

Un simulateur de progression joue la campagne comme un joueur : il démarre avec
le trio du tutoriel (Nashoba, Yunmei, Sivrane) au niveau 1 et enchaîne les
missions dans l'ordre, sans rien s'accorder que le jeu ne donne.

À chaque victoire il applique les vraies récompenses (`campaignBaseXp` →
`campaignXp` → `addChampionXp`), tire le vrai butin (`campaignLootRate` →
`generateCampaignItem`), encaisse gemmes et or, invoque un multi à 900 gemmes,
puis **redistribue tout l'inventaire** sur l'équipe active. Les combats sont
joués par le moteur, en automatique, tour par tour.

Deux détails comptent :

- **L'équipement est réel.** Aucune statistique synthétique : les pièces sortent
  du générateur de butin de la campagne, avec leurs étoiles, leur qualité et
  leur niveau d'objet.
- **Quand le joueur bloque**, il farme la dernière mission terminée. Si le farm
  ne suffit plus, on lui injecte un « colis d'aide » de 900 gemmes — c'est la
  façon de représenter les autres contenus (quêtes, hauts faits, expéditions).
  **Le nombre de colis nécessaires est la mesure la plus parlante du rapport :
  c'est la quantité de jeu extérieur qu'il faut pour avancer.**

Trois graines de générateur pseudo-aléatoire, parcours continu Normal →
Difficile → Hardcore avec le même joueur, sans remise à zéro.

> **Une erreur de méthode corrigée en cours de route.** La première version du
> simulateur comparait `Math.random()` à `campaignLootRate(mission)`, qui renvoie
> un **pourcentage** (42, 58) et non une fraction : chaque mission laissait donc
> tomber une pièce. Toutes les mesures ont été refaites après correction. Les
> chiffres ci-dessous sont ceux d'après.

---

## 2. Le résultat principal : la campagne Normal ne se termine pas

Avant correction, sur la graine de référence :

```
BOSS normal  valebrume        2396 /  3142 = 0.76 · niveau  8 · farm   6
BOSS normal  khazdrum         2991 /  3550 = 0.84 · niveau 11 · farm  59
BOSS normal  bastion-pierre   3093 /  4003 = 0.77 · niveau 13 · farm  59
BOSS normal  oeil-clair       3215 /  4502 = 0.71 · niveau 15 · farm  59
ARRÊT à arene-lames/7 — continent 5 sur 10
        172 parties de farm · 13 colis d'aide · niveau moyen 22
```

Le joueur s'arrête au **cinquième continent sur dix**, après 172 parties de farm
et l'équivalent de 130 invocations venues d'ailleurs. Il ne finit pas Normal.

Et comme **Difficile est verrouillé derrière un clear intégral de Normal**
(`difficultyUnlocked` exige les 70 missions), les deux autres difficultés sont
tout simplement inaccessibles. Les trois quarts du contenu de campagne étaient
hors d'atteinte.

### Où ça casse exactement

Tous les blocages, sans exception, tombent au **palier 7 — le boss de
continent**. Les paliers 1 à 6 ne bloquent quasiment jamais. Le mur est le boss,
pas la zone.

Et le ratio puissance / recommandation ne remonte jamais : 0.76, 0.84, 0.77,
0.71. Le joueur ne rattrape pas son retard, il le creuse.

---

## 3. La cause : l'XP est linéaire, le coût des niveaux ne l'est pas

C'est un défaut d'une seule ligne, et il est arithmétique.

La récompense d'XP valait `(180 + 55 × zone + 25 × palier) × (boss ? 1,65 : 1) ×
tuning` — **linéaire en zone**. Elle passait de 3 526 XP pour la zone 1 à 8 638
pour la zone 10 : un facteur **3,4**.

Le coût cumulé des niveaux, lui, suit `90 × niveau^1,28 + 40`. Traverser la
bande 1-6 coûte 3 045 XP ; traverser la bande 55-60 en coûte 458 116. Un facteur
**150**.

Une droite contre une puissance : l'écart ne pouvait que s'ouvrir.

| Zone | Bande annoncée | XP versée par la zone | Couverture | Niveau réellement atteint |
|---|---|---|---|---|
| 1 | 1-6 | 3 526 | **116 %** | 7 |
| 2 | 7-12 | 4 094 | 59 % | 10 |
| 3 | 13-18 | 4 662 | 39 % | 12 |
| 4 | 19-24 | 5 231 | 30 % | 14 |
| 5 | 25-30 | 5 798 | 24 % | 16 |
| 6 | 31-36 | 6 366 | 20 % | 18 |
| 7 | 37-42 | 6 934 | 18 % | 20 |
| 8 | 43-48 | 7 503 | 16 % | 22 |
| 9 | 49-54 | 8 070 | 14 % | 23 |
| 10 | 55-60 | 8 638 | **13 %** | **25** |

Lecture : un joueur qui nettoie **toute** la campagne Normal une fois arrive au
Cœur Ignifugé, zone annoncée **niveaux 55-60**, au **niveau 25**. La zone 1
était sur-généreuse (116 % de sa bande), la zone 10 versait un huitième de ce
qu'elle demandait. Le même défaut existe en Difficile (15 %) et en Hardcore
(18 %).

Le ratio de puissance figé à 0,7-0,8 tout du long n'était pas un problème
d'équipement : c'était le niveau.

### La vérification qui écarte l'équipement

Balayage sur la graine de référence, en multipliant un seul levier à la fois :

| Variante | Arrêt | Farm | Niveau moyen |
|---|---|---|---|
| référence | arene-lames/7 (5/10) | 172 | 22 |
| butin ×1,5 | cimes-vent/7 (6/10) | 198 | 20 |
| butin ×2 | oeil-clair/7 (**4/10**) | 187 | 22 |
| XP ×1,5 | arene-lames/7 (5/10) | 196 | 29 |
| **XP ×2** | **coeur-ignifuge/7 (10/10)** | 420 | **49** |
| XP ×2 + butin ×1,5 | **terminée** | 208 | 43 |

Doubler le butin ne débloque rien — la variante ×2 s'arrête même *plus tôt* que
la ×1,5, ce qui dit surtout que le butin est bruité et n'est pas le facteur
limitant. Doubler l'XP fait passer le joueur du continent 5 au continent 10.
**Le verrou est l'XP.**

---

## 4. Le second défaut : Difficile et Hardcore sont des formalités

Une fois l'XP corrigée, le joueur atteint enfin Difficile — et le traverse sans
combattre.

```
G777 hard      TERMINÉE   farm 0   aides 0
     valebr:1.84  khazdr:1.67  bastio:1.58  oeil-c:1.44  arene-:1.31
     cimes-:1.26  temple:1.15  crypte:1.05  rempar:1.03  coeur-:0.89

G777 hardcore  TERMINÉE   farm 9   aides 0
     valebr:2.20  khazdr:2.15  bastio:1.87  ...  coeur-:1.09
```

Dix continents de Difficile, **zéro partie de farm, zéro apport extérieur**. Le
joueur entre à 1,84 fois la puissance recommandée. Seul l'ultime boss oppose une
résistance. Hardcore, censé être le sommet, s'ouvre à 2,20.

La cause est une incohérence entre deux courbes qui auraient dû se répondre :

- **La courbe d'objets est continue.** `CAMPAIGN_ITEM_LEVEL_CURVE` fait finir la
  zone 10 de Normal au niveau d'objet 75-76 et commencer la zone 1 de Difficile
  à 74-75. Le raccord est délibéré et propre.
- **La courbe d'ennemis repartait de zéro.** `normalRegionalTuning(zoneIndex)`
  réindexe à la zone 1 à chaque difficulté. Le joueur gardait tout son
  équipement de fin de Normal et retrouvait en face de lui des ennemis de zone 1
  simplement multipliés par 1,38.

Le joueur montait, les ennemis redescendaient.

---

## 5. Ce qui a été corrigé

### 5.1 L'XP suit désormais la courbe de niveaux

La récompense n'est plus une formule inventée à côté de la courbe : elle est
**ancrée dessus**. Un nettoyage complet d'une zone verse une part fixe —
`ZONE_XP_SHARE = 0,62` — de l'XP nécessaire pour traverser la bande de niveaux
que cette zone annonce.

Le reste vient du farm et des autres contenus. **C'est voulu, et c'est le cœur
du réglage** : 62 % ne se termine pas tout seul.

La forme interne ne bouge pas — le boss garde sa prime de 1,65, les paliers
gardent leur montée, Difficile et Hardcore gardent leurs 15 % et 33 % de bonus.
Seule l'échelle par zone change :

| Zone | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Facteur | ×0,54 | ×1,50 | ×2,43 | ×3,28 | ×4,05 | ×4,74 | ×5,36 | ×5,93 | ×6,46 | **×6,95** |

La zone 1 **baisse** : elle versait 116 % de sa bande, elle en verse 62 % comme
les autres. La générosité du départ n'était pas un cadeau, c'était l'autre bout
du même déréglage.

### 5.2 Les difficultés se raccordent

Un facteur de continuité rattrape l'écart à l'entrée d'une difficulté et
s'efface à la zone 10, là où les deux courbes se rejoignaient déjà :

```
CONTINUITY = { hard: {floor: 1,05, slope: 0,48}, hardcore: {floor: 1,26, slope: 0,56} }
facteur = floor + slope × (1 − zone/9)
```

Difficile ouvre à ×1,53 et termine à ×1,05. Hardcore ouvre à ×1,82 et termine à
×1,26. La marche descendante disparaît sans que la fin de campagne ne devienne
un mur.

---

## 6. Après correction

Trois graines, parcours continu, aucune remise à zéro entre les difficultés :

```
G777   normal    TERMINÉE                farm 209  aides 13  niveau 50
       0.83 0.82 0.81 0.79 0.88 0.88 0.84 0.80 0.85 0.73
G777   hard      arrêt rempart-endurance farm 113  aides 12  niveau 50
       1.36 1.26 1.19 1.18 1.11 1.10 1.07 1.01

G90210 normal    TERMINÉE                farm  59  aides  3  niveau 40
       0.84 0.81 0.81 0.81 0.78 0.77 0.77 0.79 0.75 0.65
G90210 hard      TERMINÉE                farm   2  aides  0  niveau 40
       1.21 1.19 1.09 1.04 0.97 0.89 0.88 0.85 0.90 0.79
G90210 hardcore  TERMINÉE                farm   0  aides  0  niveau 40
       1.31 1.24 1.18 1.11 1.03 0.99 0.94 0.94 0.93 0.81

G4242  normal    arrêt coeur-ignifuge/7  farm 345  aides 20  niveau 50
       0.80 0.93 0.86 0.88 0.98 1.01 0.96 0.91 0.84
```

Ce qui a changé, dans l'ordre d'importance :

1. **La campagne Normal se termine** — deux graines sur trois, la troisième
   s'arrêtant sur l'ultime boss du jeu.
2. **Le niveau suit la bande.** Le joueur arrive au continent 6 au niveau 33-37
   pour une bande 31-36, au lieu du niveau 18 d'avant.
3. **Difficile redevient un contenu.** De 0 farm / 0 aide à 113 farms et 12
   colis sur la graine 777 ; l'entrée passe de 1,84 à 1,21-1,36.
4. **Le farm reste utile sans être obligatoire partout.** 59 parties suffisent
   sur une graine, 209 sur une autre — l'écart vient de la chance d'invocation,
   ce qui est le comportement attendu d'un gacha.

### Deux réserves honnêtes

- **La variance entre graines reste forte** (59 contre 345 parties de farm). Le
  simulateur joue en automatique avec une équipe de trois choisie gloutonnement ;
  un joueur réel arbitre mieux. Ces chiffres sont un plancher, pas une
  prédiction.
- **Le plafond de niveau 50 est atteint** sur deux graines : la progression bute
  ensuite sur l'Ascension, qui demande des essences. C'est un verrou de contenu
  extérieur, et il fonctionne — mais il n'a pas été audité ici.

---

## 7. Ce qui a été vérifié, et ce que la suite ne voyait pas

Après ces deux changements, **les 1 029 tests existants passaient toujours** —
alors que l'XP avait été multipliée par 7 sur la zone 10 et la puissance des
ennemis par 1,5 à l'entrée de Difficile. Aucun test ne regardait la courbe de
progression. C'était le vrai trou.

`tests/campagne.progression.test.js` (20 tests) verrouille désormais les deux
invariants, en pourcentages plutôt qu'en valeurs — ce sont les rapports qui
doivent tenir quand les chiffres bougent :

- la couverture d'une zone reste entre 45 % et 80 % de sa bande de niveaux ;
- l'écart de couverture entre la meilleure et la pire zone reste sous 40 % ;
- la zone 10 verse au moins 20 fois la zone 1 ;
- le boss garde une prime nette à palier égal ;
- entrer dans une difficulté ne fait pas retomber l'exigence sous le tiers de la
  précédente ;
- le facteur de continuité vaut plus en zone 1 qu'en zone 10 — sinon il ne
  raccorde rien, il durcit simplement partout.

Dix mutations appliquées au code corrigé, **dix tuées** : retour à la formule
linéaire, part d'XP à 0,30 puis à 0,95, bande figée sur la zone 1, prime de boss
retirée, bonus de difficulté ignoré, continuité désactivée, rendue constante,
inversée, et Hardcore aligné sur Difficile.

> Une onzième mutation avait d'abord **survécu** : retirer la prime de boss. Le
> test la comparait au palier 6, qui pèse déjà moins lourd que le palier 7 — il
> mesurait le rang du palier, pas la prime. Corrigé en comparant à palier égal.

**Total : 1 049 tests, 39 fichiers, suite verte.**

---

## 8. Pistes d'optimisation, non implémentées

Classées par rapport valeur / risque. Aucune n'a été mesurée — ce sont des
hypothèses, pas des conclusions.

### 8.1 La campagne finance à peine une invocation multiple

Toute la campagne Normal rapporte **environ 1 000 gemmes** : 11 par palier, 34
par boss. Un multi coûte 900. Dix continents, soixante-dix missions, pour un
seul tirage.

C'est cohérent avec la volonté que le joueur aille chercher ailleurs — mais
l'écart est tel que la campagne ne *participe* plus du tout au roster. Une
récompense en gemmes indexée sur la zone, comme l'XP vient de l'être, rendrait
le premier clear d'un continent tardif significatif sans toucher au farm (qui ne
verse pas de gemmes).

### 8.2 Le mur est toujours le palier 7

Aucun blocage n'a jamais eu lieu ailleurs qu'au boss de continent. Le
`wallFactor` ajoute déjà 6 % au boss, 10 % en zone 5, 20 % en zone 10. La
question n'est pas de l'adoucir — un boss doit être un mur — mais de savoir si
le joueur *comprend* pourquoi il bute. La bannière « PREMIER PALIER » n'existe
qu'en zones 5 et 10 ; les huit autres boss n'annoncent rien.

### 8.3 Le sous-titre de difficulté ment sur le butin

`DIFFICULTIES` annonce « 3★ à 5★ selon la zone » pour Difficile. Le profil réel
(`campaignLootProfile`) plafonne à **4★** en Difficile : la 5★ n'apparaît qu'en
Hardcore. Correction d'une chaîne de caractères, mais c'est une promesse fausse
affichée sur l'écran de sélection.

### 8.4 La dépendance au soigneur

Le balayage de compositions mené précédemment (220 équipes, niveau 30, avec
l'équipement du continent) donnait 94 % de réussite à Bastion de Pierre en
Normal mais 12 % aux Cimes du Vent, avec un écart de 5,87 entre la meilleure et
la pire composition — presque entièrement porté par la présence d'un soigneur.
Une équipe sans soin n'a pas de seconde chance. C'est un choix de design
défendable, mais il n'est dit nulle part.

### 8.5 Le plafond de niveau devrait être annoncé

Deux graines sur trois butent sur le niveau 50 et non sur un boss. Le joueur
voit sa progression s'arrêter sans qu'aucun écran ne lui dise que la suite passe
par l'Ascension.
