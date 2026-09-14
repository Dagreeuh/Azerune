# Cristaux de campagne et portails d'invocation

Ce que la campagne verse, ce qu'elle devrait verser, et pourquoi trois portails
peuvent coexister sans toucher à l'équilibre.

---

## 1. Deux corrections au rapport précédent

Avant tout chiffre nouveau, deux erreurs du rapport de difficulté à réparer.

**L'économie annoncée était fausse.** J'ai écrit que « toute la campagne Normal
rapporte environ 1 000 gemmes ». Ce chiffre ne comptait que les récompenses de
mission et oubliait les paliers d'étoiles, qui en versent **3 575** de plus. Le
total réel était de 4 575 pour Normal — cinq invocations multiples, pas une. Le
constat de fond tenait, mais pas son ampleur.

**Le simulateur payait des gemmes en farm.** Il créditait `mission.reward.gems`
à chaque partie jouée. Le jeu n'en verse qu'au premier clear :
`campaignMissionRewards` renvoie `gems: 0` dès que le score ne progresse pas. Le
joueur simulé encaissait donc des milliers de gemmes fantômes sur ses centaines
de parties de farm. Les « campagnes terminées » du rapport précédent étaient
d'autant plus optimistes.

Le simulateur a été reconstruit sur ces deux points, et sur un troisième : il
démarrait le joueur à **zéro cristal**. Un vrai joueur en possède **1 200** avant
sa première mission — 500 de départ, 100 du tutoriel, 600 pour les douze leçons
de l'Académie à 50 chacune. Cette omission suffisait à fausser tout le début de
partie.

Le diagnostic sur l'XP, lui, ne dépendait d'aucun des trois : il se mesure au
niveau atteint et au ratio de puissance.

---

## 2. Les cristaux de campagne étaient plats

`baseGems = (boss ? 34 : 11) × multiplicateur de difficulté`.

Aucune trace de la zone. Le boss de Valebrume, premier obstacle du jeu, et
Pyraxis, épreuve finale du Cœur Ignifugé, versaient exactement **34 cristaux**
tous les deux. Le même défaut de forme que l'XP, sur une autre monnaie.

| Source | Normal | Difficile | Hardcore |
|---|---|---|---|
| Missions (avant) | 1 000 | 1 360 | 1 720 |
| Paliers d'étoiles | 3 575 | 3 575 | 3 575 |
| **Total (avant)** | **4 575** | **4 935** | **5 295** |

### La mesure qui tranche

Simulateur corrigé, joueur doté de ses 1 200 cristaux réels, **aucun apport
extérieur** — ni quêtes, ni expéditions, ni hauts faits. Métrique : combien des
70 missions de Normal il franchit avant de bloquer définitivement. Huit graines.

| Variante | Missions franchies (moyenne sur 70) |
|---|---|
| Cristaux plats (état d'origine) | **31,4** |
| Indexés sur la zone, sans palier | 31,4 |
| Zone + paliers de continent (livré) | **33,1** |
| Paliers +50 % | 42,8 |

Lecture : la campagne seule porte le joueur jusqu'à la **moitié** du parcours.
C'est exactement la cible demandée — un jeu qui se joue, pas un jeu qui se
déroule. La variante +50 % l'emmène aux deux tiers ; elle a été écartée comme
trop généreuse.

> **Ce que cette mesure ne dit pas.** La variance entre graines est forte
> (13 à 69 missions). Le simulateur joue en automatique avec une équipe de trois
> choisie gloutonnement. Ces chiffres comparent des variantes entre elles ; ils
> ne prédisent pas la partie d'un joueur réel, qui arbitre mieux.

### Un balayage qui ne prouvait rien

Une première tentative comparait le nombre de « colis d'aide » consommés par
variante. Elle donnait l'état livré **pire** que l'état d'origine, ce qui est
impossible : plus de cristaux ne peut pas nuire. La faute était méthodologique —
davantage de cristaux signifie davantage d'invocations, donc un flux aléatoire
différent : la graine ne contrôlait plus rien, et trois échantillons par variante
ne mesuraient que du bruit. D'où la métrique monotone ci-dessus et huit graines.

---

## 3. Ce qui a été corrigé

**Les cristaux de mission suivent la zone**, doucement : `×(1 + 0,14 × (zone−1))`.
La zone 10 vaut 2,26 fois la zone 1. Le cristal est la monnaie rare — on
l'indexe, on ne l'enfle pas.

**Terminer les sept missions d'un continent verse un palier**, une seule fois par
difficulté : `300 + 32 × index`, multiplié par la difficulté. Le farm n'en
déclenche aucun.

Le 300 du premier palier n'est pas un chiffre rond arbitraire. Le joueur démarre
à 600 cristaux ; le premier continent en verse une centaine par ses missions ; le
palier l'amène à **1 000**, soit sa première invocation multiple à 900. Sans lui,
il terminait tout un continent sans jamais pouvoir s'offrir un rituel.

| Source | Normal | Difficile | Hardcore |
|---|---|---|---|
| Missions | 1 635 | 2 183 | 2 807 |
| Paliers de continent | 4 440 | 5 950 | 7 637 |
| Paliers d'étoiles | 3 575 | 3 575 | 3 575 |
| **Total** | **9 650** | **11 708** | **14 019** |
| En invocations multiples | 10,7 | 13,0 | 15,6 |

Les trois difficultés, jouées de bout en bout et trois-étoilées partout,
financent moins de 400 invocations. Le gacha garde sa part.

---

## 4. Les hauts faits : mesuré, et rien à changer

La demande était de les revoir « si besoin ». Mesure faite, ce n'est pas
nécessaire — et y ajouter romprait la contrainte de ne pas tout débloquer.

| Catégorie | Cristaux |
|---|---|
| Champions | 9 600 |
| Combat | 6 850 |
| Invocation | 5 500 |
| Mythic+ | 2 375 |
| Chroniques | 2 300 |
| Forge | 1 600 |
| Campagne | 1 325 |
| Progression | 1 175 |
| Raids | 1 025 |
| Collection | 1 000 |
| Expéditions | 450 |
| **Total** | **33 200** |

Les hauts faits sont déjà **la plus grosse source de cristaux du jeu** — plus du
triple de la campagne Normal, 36 invocations multiples à eux seuls. Les gonfler
donnerait le roster sans le jeu.

Deux observations, laissées telles quelles :

- **Ils sont arrière-chargés.** Tous les paliers 1 et 2 des séries réunis ne
  pèsent que 2 500 cristaux. Les grosses récompenses demandent 500 à 2 500
  victoires, ou 1 000 invocations. C'est cohérent avec un jeu au long cours,
  mais ça n'aide pas un début de partie.
- **65 hauts faits sur 248 ne versent aucun cristal**, dont 32 maîtrises de
  champion. La catégorie Champions répartit 9 600 cristaux sur plus de deux
  cents entrées : l'essentiel du travail sur les champions paie en or.

Aucun des deux n'est un défaut. Ce sont des choix de rythme, signalés au cas où
ils ne seraient pas délibérés.

---

## 5. Les trois portails

### La règle qui rend l'ajout sûr

**Aucun portail ne modifie le taux de 5★.** Ils changent la *cible*, jamais le
*volume*. Cent invocations donnent le même nombre de 5★ sur les trois ; ce qui
change, c'est la probabilité que ce 5★ soit celui qu'on attend.

C'est ce qui permet d'ouvrir deux portails de plus sans revoir une seule source
de cristaux. Un portail qui aurait relevé le taux aurait fait valoir un cristal
différemment selon l'endroit où on le dépense — et il aurait fallu tout
recalibrer.

Deuxième règle, celle qui rend l'ensemble accueillant : **le compteur de garantie
est commun aux trois**. Changer de portail ne fait rien perdre. Un jeu entre amis
n'a pas à punir la curiosité.

Troisième : **le prix est le même partout**. 100 pour une invocation, 900 pour
dix. Aucun portail ne s'achète plus cher que les autres.

### Ce que chacun apporte

| Portail | Ciblage | Pierres de foyer |
|---|---|---|
| **Portail ancestral** | aucun — le pool complet | oui, seul |
| **Vœu d'Azerune** | 50 % l'élu que vous nommez ; sinon le 5★ suivant l'est à coup sûr | non |
| **Conjonction mensuelle** | 75 % l'un des trois du mois | non |

Chacun est le meilleur à quelque chose, et aucun ne domine :

- Le **Vœu** vise **un** champion précis. Deux 5★ suffisent en moyenne à
  l'obtenir — mesuré à **1,498** sur 400 essais simulés, jamais plus de 2.
- La **Conjonction** vise **trois** champions à la fois, avec une meilleure
  chance de toucher l'un d'eux — mais on ne choisit pas lequel, et le trio change
  au premier du mois.
- L'**ancestral** est le seul qui puisse donner *n'importe quel* champion, et le
  seul qui accepte les Pierres de foyer.

Deux tests verrouillent cette symétrie : le Vœu doit cibler un champion donné
mieux que la Conjonction, et la Conjonction doit toucher « l'un des trois » mieux
que le Vœu. Si l'un des deux tombait, un portail n'aurait plus de raison
d'exister.

### La rotation mensuelle

Le trio est **calculé**, jamais tiré au hasard : mélange déterministe du pool de
5★ amorcé sur `année × 12 + mois`. Deux amis qui jouent le même mois voient le
même trio, sur n'importe quelle machine, sans serveur.

Le pool est trié par identifiant avant mélange. Sans ce tri, réordonner
`heroes.js` changerait la rotation de tous les mois, pour tout le monde — un
effet de bord invisible qu'un test couvre désormais explicitement.

---

## 6. Vérification

**Tests unitaires et de contrat.** `tests/campagne.cristaux.test.js` (14),
`tests/invocation.portails.test.js` (27), `tests/invocation.cablage.test.js`
(13).

`GameContext` est un composant React ; le projet le vérifie par contrat sur son
texte source. Le test le plus utile de la série vérifie que **tout ce que la page
d'invocation réclame à `useGame()` est réellement exporté** par le fournisseur :
une clé manquante ne casse aucun test unitaire, la page rend `undefined` en
silence.

**Mutation.** 43 mutations appliquées : 10 sur les cristaux de campagne, 23 sur
les portails, 10 sur le câblage. Six ont survécu au premier passage ; toutes
sont tuées après renforcement des tests.

Six mutants avaient d'abord survécu, et chacun disait quelque chose :

- **Trois constantes affichées à l'écran** (part de l'élu, part mensuelle,
  taille du trio) n'étaient testées que les unes par rapport aux autres. Les
  faire bouger déplaçait le code *et* l'attente. Elles sont désormais figées à
  leur valeur : ce sont des promesses faites au joueur.
- **Un test mal choisi** comparait décembre 2026 à janvier 2027 pour vérifier que
  la rotation tient compte de l'année. Les deux mois diffèrent déjà. Le vrai
  risque — décembre identique d'une année sur l'autre — n'était pas couvert.
- **Le tri du pool** n'était protégé par rien.
- **Une mutation que j'avais mal écrite** remplaçait une chaîne par elle-même.
  Elle ne prouvait rien : refaite correctement, le test la tue.
- **Un test trop large** cherchait `electedChampion` dans les 3 000 caractères
  suivant `save(`. Le tableau de dépendances du `useEffect` vient juste après et
  cite les mêmes noms : le test passait même après retrait de la sauvegarde.
  Borné à l'objet sauvegardé.

**Dans le jeu.** Les trois onglets rendus, l'élu nommé parmi les onze 5★, le trio
du mois affiché, les Pierres de foyer masquées hors du Portail ancestral, aucune
erreur console.

**1 106 tests, 42 fichiers.**
