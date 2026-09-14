# Les Chroniques légendaires

Sulfuras et Thunderfury dans Azerune : ce qui existait déjà, ce qui était creux,
et ce qui rend une quête légendaire réellement longue.

---

## 1. Trois quarts du système existaient — et ne servaient à rien

L'anatomie d'une légendaire de World of Warcraft tient en quatre temps : un
**drop très rare** qui ouvre la quête sans prévenir ; un **farm long** de
matériaux ; une **étape cachée** qui demande d'aller tuer quelque chose ; une
**arme forte et permanente**.

Azerune avait déjà trois de ces quatre temps codés. Vérifié un par un.

| Ingrédient | État réel |
|---|---|
| Drop très rare qui ouvre la quête | ✅ **Existe.** 0,03 % à 0,15 % selon la relique et le contenu |
| Farm long de matériaux | ❌ **N'existe pas du tout** |
| Boss caché à vaincre | ⚠️ Le boss existe, **le vaincre ne compte nulle part** |
| Arme forte et permanente | ✅ **Existe**, effets implémentés dans le moteur |

### Le trou : « Valider l'étape » était un bouton libre

```jsx
<button onClick={()=>setChronicleStep(weaponId,(state.step||0)+1)}>Valider l’étape</button>
```

Aucune condition. Le joueur cliquait trois fois et forgeait l'arme.

Les textes d'étape annonçaient pourtant « Réunir 80 Lingots volcaniques et 25
Cœurs incendiaires », « Réunir 100 Éclats de tempête », « Réunir 40 Fragments du
Bâton ». **Ces matériaux n'étaient comptés par rien** : la fonction
`addLegendaryMaterial` était définie, exportée dans le contexte de jeu… et
appelée par personne dans tout le projet. Du texte d'ambiance devant un bouton
libre.

### Le second trou : vaincre un Adversaire légendaire ne comptait pas

```js
if(mission.worldBoss)return null;
```

Aeralion, Arkhéon, la Chasseuse de la Dernière Lune et Thalassyr pouvaient être
vaincus indéfiniment sans que rien ne soit enregistré. C'était la seule activité
du jeu dont la victoire ne produisait aucun effet.

### Ce qui marchait déjà, et qu'il ne fallait pas toucher

Une relique tombe bel et bien, et les effets d'arme sont de vrais effets — pas
des statistiques : une jauge de charges qui déclenche un impact volcanique, un
éclair qui vole de la jauge, une Brûlure appliquée, une réduction de soins sur
cible affligée.

Mais les taux, eux, étaient au-delà du rare (section 3).

---

## 2. Ce qui a été construit

### Les Vestiges

Sept matériaux, chacun rattaché à une Chronique et à une activité. Ils **ne
tombent que si leur Chronique est active** — c'est le signal que la chasse a
commencé, et ça évite d'accumuler des Vestiges pour une arme jamais découverte.

Le rendement suit le niveau du contenu : monter en difficulté raccourcit la
quête. C'est la récompense de la progression, pas un raccourci.

### Cinq natures d'étape, aucune instrumentation nouvelle

Chaque étape déclare ce qu'elle exige. Toutes les conditions s'appuient sur des
compteurs qui existaient déjà — rien n'a été ajouté au moteur de combat.

| Nature | Ce qu'elle lit | Exemple |
|---|---|---|
| `free` | rien | Examiner la relique, forger l'arme |
| `material` | les Vestiges accumulés | 100 Éclats de tempête |
| `resource` | les monnaies du joueur | 10 Essences mythiques + 2 500 de forge |
| `relics` | les reliques possédées | **les deux** Liens du Prince-Tempête |
| `kill` | les victoires enregistrées | Thalassyr, Mémoire de l'Océan |
| `stat` | le suivi de progression | 750 000 dégâts d'affliction cumulés |

La dernière mérite un mot : l'étape « Catalyse parfaite » de l'Alambic du Fléau
demandait « déclencher les afflictions requises », ce qui n'était mesuré nulle
part. Elle s'appuie désormais sur `lifetime.combat.dotDamageDealt`, un compteur
qui existait déjà — la condition colle à l'arme sans coûter une ligne de moteur.

### La longueur du farm, mesurée

| Chronique | Étape de matériaux | Passages nécessaires |
|---|---|---|
| Marteau du Cœur-Monde | 80 Lingots + 25 Cœurs | **25 à 27** (Raid) |
| Lame du Prince-Tempête | 100 Éclats de tempête | **25 à 50** (Mythic+) |
| Bâton des Astres Brisés | 40 Fragments du Bâton | **20 à 40** (Mythic+) |
| Cendre-Sépulcrale | 50 Âmes enchaînées | **25 à 50** (Mythic+) |
| Alambic du Fléau | 60 Catalyseurs | **30 à 60** (Mythic+) |
| Égide des Mille Marées | 50 Perles abyssales | **25** (Adversaire légendaire) |

La fourchette va du contenu le plus haut au plus bas. Un test borne les deux
côtés — au moins 20 passages au mieux, au plus 60 au pire : une quête de dix
passages ne serait pas une légende, une de deux cents serait une punition.

> **Un détail d'équilibrage.** Les quantités annoncées dans les textes ne
> devaient pas changer — « Quarante éclats » est le titre d'une étape. C'est
> donc un **taux par matériau** qui égalise les longueurs, pas le compteur. Seule
> exception : les Âmes enchaînées passent de 30 à 50, la quête tombant sinon à
> huit passages, et la description a été corrigée avec.

### La Lame du Prince-Tempête garde sa singularité

Sa première étape exige **les deux Liens**, tombés séparément à 0,06 % en
Mythic+ 20 et 0,08 % en Mythic+ 30. C'est la structure exacte de Thunderfury, et
elle est désormais réellement vérifiée : posséder un seul Lien ne fait pas
avancer la Chronique.

---

## 3. « Très rare » avait fini par vouloir dire « jamais »

Le calcul, que je n'avais pas fait en écrivant la première version de ce
rapport, et qui change la conclusion.

| Relique | Meilleure source | Taux | Passages pour 50 % | pour 90 % |
|---|---|---|---|---|
| Corde de la Dernière Éclipse | M+30 contre Astreon | 0,15 % | **462** | 1 534 |
| Œil du Cœur-Monde | Fournaise 10 | 0,15 % | **462** | 1 534 |
| Plume de l'Astre déchu | M+30 | 0,10 % | **693** | 2 302 |
| Lien droit du Prince-Tempête | M+30 | 0,08 % | **867** | 2 878 |
| Lien gauche du Prince-Tempête | M+20 | 0,06 % | **1 155** | 3 837 |
| Fiole du Premier Fléau | M+21-29 | 0,06 % | **1 155** | 3 837 |
| Éclat de Cendre profanée | M+20 | 0,05 % | **1 386** | 4 605 |
| Larme de la Mer ancienne | M+20 | 0,05 % | **1 386** | 4 605 |

Et la Lame du Prince-Tempête exige **les deux** Liens, sur deux niveaux
différents : **2 022 passages** pour une chance sur deux de posséder les deux.

À dix passages de Mythic+ par jour, c'est quatre à sept mois pour *ouvrir* une
Chronique — avant les vingt à soixante passages de la quête elle-même. Le
contenu construit dans les sections précédentes n'aurait jamais été vu.

### Les nouveaux taux

Cible : une chance sur deux entre 120 et 200 passages du contenu le plus haut.
Assez long pour rester une légende, assez court pour qu'un joueur assidu la vive.

| Relique | Avant | Après | 50 % |
|---|---|---|---|
| Corde de la Dernière Éclipse | 0,15 % | **0,60 %** | 116 |
| Œil du Cœur-Monde (Fournaise 10) | 0,15 % | **0,60 %** | 116 |
| Lien droit du Prince-Tempête | 0,08 % | **0,50 %** | 139 |
| Plume de l'Astre déchu (M+30) | 0,10 % | **0,50 %** | 139 |
| Lien gauche du Prince-Tempête | 0,06 % | **0,40 %** | 174 |
| Fiole du Premier Fléau (M+21-29) | 0,06 % | **0,40 %** | 174 |
| Éclat de Cendre profanée | 0,05 % | **0,35 %** | 198 |
| Larme de la Mer ancienne | 0,05 % | **0,35 %** | 198 |

Une relique reste **sous une chance sur deux cents** par passage. Thunderfury
demande désormais 313 passages pour une chance sur deux d'avoir ses deux Liens,
puis 25 à 50 de plus pour les Éclats de tempête.

> **C'est une décision d'équilibrage, pas une correction de bug.** Les anciens
> taux n'étaient pas cassés, ils étaient un choix — je l'ai jugé incompatible
> avec « une aventure annexe qui permet de débloquer une arme ». Deux tests
> bornent désormais les deux côtés : sous 1 % par tirage, et 50 % atteint en 250
> passages au plus. Les revenir en arrière ne demande qu'un chiffre, et les
> tests diront lequel.

Un test existant figeait `raidRelicChance` à ses valeurs exactes. Il a été
réécrit sur la propriété plutôt que sur le littéral : un chiffre figé est un
détecteur de changement, il tombe dès qu'on retouche l'équilibrage sans rien
dire de ce qui compte.

---

## 4. Ce que l'arme apporte vraiment

Mesuré sur huit attaques, avec et sans l'arme Unique, à maîtrise maximale.

| Arme | Champion | Dégâts sur 8 coups | Puissance |
|---|---|---|---|
| Lame du Prince-Tempête | Thorgar | 272 → 1 028 (**+278 %**) | +39 % |
| Marteau du Cœur-Monde | Brom | 304 → 682 (+124 %) | +42 % |
| Bâton des Astres Brisés | Sylven | 696 → 1 452 (+109 %) | +32 % |
| Arc de la Dernière Éclipse | Kaelen | 1 000 → 2 044 (+104 %) | +51 % |
| Alambic du Fléau | Malvek | 1 096 → 1 852 (+69 %) | +44 % |
| Cendre-Sépulcrale | Seraphiel | 1 272 → 2 028 (+59 %) | +46 % |
| Égide des Mille Marées | Nerissa | 1 424 → 2 180 (+53 %) | +31 % |

**+31 % à +51 % de puissance**, et le déclenchement s'ajoute par-dessus. C'est
énorme — et c'est voulu : derrière une relique à 0,05 % et cinquante passages de
Mythic+, une arme tiède serait une trahison.

> **Ce que ce tableau ne dit pas.** La comparaison se fait contre un emplacement
> d'arme **vide**, pas contre une bonne arme ordinaire. L'écart réel pour un
> joueur équipé est plus faible. Le proc, lui, est un gain net dans tous les cas.

---

## 5. Vérification

**Tests.** `tests/chroniques.legendaires.test.js` (36).

Le plus utile de la série est celui qui a trouvé un bug pendant son écriture :
il énumère toutes les conditions de victoire déclarées et vérifie que **chaque
identifiant est réellement émis par le jeu**. La Chasseuse de la Dernière Lune a
pour identifiant `huntress` ; la condition attendait `chasseuse`. La Chronique
de l'Arc serait restée bloquée pour toujours, sans erreur ni message — le joueur
aurait vaincu la Chasseuse autant de fois qu'il aurait voulu sans rien voir
avancer.

**Mutation.** 29 mutations appliquées, 29 tuées. Deux avaient survécu :

- **Faire tomber les Vestiges de n'importe quelle activité.** Mon test vérifiait
  qu'une Chronique active reçoit ses matériaux — avec une seule Chronique
  active, la mutation ne changeait rien. Corrigé en activant une Chronique de
  Raid puis en demandant du Mythic+.
- **Perdre les victoires au rechargement.** Le test vérifiait qu'une sauvegarde
  *vide* rend un objet vide, ce qui ne prouve rien. Il fallait vérifier qu'une
  sauvegarde *pleine* rend son contenu : sans quoi le joueur reperdait Thalassyr
  et ses cent Éclats à chaque lancement.

**Le garde-fou sorti de cette correction.** Les armes désignent leurs porteurs
par **nom**, pas par identifiant. Renommer un champion orphelinerait son arme en
silence : la Chronique irait jusqu'au bout, l'arme se forgerait, et
`equipItem` la refuserait à tout le monde. Trois tests couvrent désormais le
sujet — chaque porteur existe, aucun champion ne porte deux armes Uniques, et
aucune arme n'est ouverte à plus d'un quart du roster. Ce dernier est le vrai
verrou : c'est la rareté qui fait la légende.

**Dans le jeu.** Sauvegarde injectée avec la Chronique du Prince-Tempête à
l'étape 2 et 40 Éclats sur 100 : barre de progression affichée, bouton « Étape
incomplète » grisé. À 100 sur 100 : bouton actif. Après validation : étape 3/4,
message de confirmation, et les cent Éclats consommés. Aucune erreur console.

**1 185 tests, 46 fichiers.**

---

## 6. Ce qui reste ouvert

> **Correction : la « couverture » n'était pas un problème, et mes chiffres
> étaient faux.** Cette section affirmait « sept armes pour trente-six
> champions, vingt-deux champions sans arme atteignable ». Les deux nombres
> étaient inventés — je ne les avais pas mesurés. Le roster compte **32**
> champions, pas 36, et **26 d'entre eux** figurent déjà dans la liste de
> porteurs d'une arme. Seuls six n'en ont aucune : Ragnhild et Sivrane (3★),
> Vharok, Yunmei et Nyxaris (4★), Aszhal (5★).
>
> Et surtout, le raisonnement était mauvais. Une arme que tout le monde peut
> obtenir n'est plus unique : la rareté *est* le sujet. Chaque Chronique ne
> produit qu'un seul exemplaire, et la liste de porteurs dit seulement qui peut
> le manier — exactement comme Thunderfury, ouvert aux guerriers et aux voleurs.
> À 26 sur 32 éligibles, l'écueil serait plutôt l'inverse : des armes trop
> largement compatibles. Il n'y a rien à corriger ici.

**Aucun signal quand une relique tombe.**
**Le nouvel équilibrage des taux n'est pas mesuré en jeu.** Les 116 à 198
passages sont un calcul de probabilité, pas une observation. Un joueur qui
alterne les niveaux de Mythic+ voit plusieurs reliques éligibles à la fois, ce
qui raccourcit l'attente d'une *première* Chronique sans changer celle d'une
relique précise. Le chiffre à surveiller à l'usage est celui-là.

Quand une relique tombe, rien n'attire l'œil du joueur autrement que la ligne de
butin. Une légendaire qui s'ouvre mérite un moment.
