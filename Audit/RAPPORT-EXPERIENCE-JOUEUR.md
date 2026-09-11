# Audit d'expérience joueur — Chroniques d'Azerune

> **Mise à jour du 9 septembre 2026 — les corrections ont été appliquées.**
> Les constats ci-dessous sont ceux de l'audit initial (commit `4a6bfae`).
> L'état après corrections, y compris ce qui n'a **pas** marché, est en
> section 11. Deux propositions de ce rapport se sont révélées fausses à la
> mesure : elles sont signalées là où elles apparaissent.


> « qu'est-ce qu'on pourrait faire niveau gameplay pour que ce soit une
> meilleure expérience pour le joueur »

État audité : branche `claude/gacha-game-analysis-0je6ds`, commit `4a6bfae`
(v1.66.0). Le jeu a été lu, lancé dans un navigateur, et surtout **mesuré** :
tous les chiffres de ce rapport sont reproductibles avec `npm run mesures`
(harnais dans `Audit/mesures/experience-joueur.test.js`, aucune assertion,
que des mesures).

---

## 0. Ce qui marche déjà, et qu'il ne faut pas casser

Avant les problèmes, l'inventaire honnête de ce qui est bon :

- **Le moteur de combat est riche.** 32 champions, 32 kits distincts, des
  ressources propres (Fragments, Givre, Virulence, Maelström, Goule…), des
  affinités élémentaires, de la précision et de la résistance. Ce n'est pas
  un moteur générique habillé.
- **Les mécaniques de zone sont réellement implémentées.** Les 16 entrées de
  `CAMPAIGN_MECHANICS` ne sont pas du texte de vitrine : Soif carmine rend
  des PV à l'ennemi, Surchauffe monte l'Attaque tour après tour, Courants
  ascendants déplacent les jauges. Le moteur les applique vraiment
  (`engine.js:236-258`).
- **L'économie est généreuse, comme voulu.** 8 970 cristaux par mois par les
  seules quêtes, soit **10 multi-invocations mensuelles**, soit une pitié
  garantie tous les 1,1 mois. Pour un jeu entre amis, c'est le bon réglage :
  je n'y toucherais pas.
- **`assessTeamForMission` est une très bonne idée.** Le jeu essaie déjà de
  dire au joueur si son équipe passe. Le problème n'est pas l'intention,
  c'est la précision — voir constat n° 5.
- **Sauvegarde exportable/importable.** C'est la fondation, déjà là, de tout
  ce qu'on pourrait faire côté social.

---

## 1. Le constat principal : le combat est un test de statistiques

**Mesure.** Pour quatre missions réparties sur deux difficultés, j'ai fait
varier la puissance de l'équipe par pas de 1 %, 40 combats par point, et
relevé le taux de victoire.

```
Normal Z5-7     0.90:  0  0.92: 13  0.94: 35  0.96: 85  0.98: 93  1.00:100
Normal Z8-4     0.85:  0  0.89:  0  0.91: 53  0.93: 73  0.95:100  1.00:100
Difficile Z3-7  1.05:  3  1.07: 20  1.09: 53  1.11: 90  1.13:100  1.20:100
Difficile Z6-4  1.15:  8  1.17: 35  1.19: 83  1.21:100  1.25:100  1.30:100
```

**Il faut 4 % de puissance d'équipe pour passer de « je perds toujours » à
« je gagne toujours ».**

C'est le cœur du problème d'expérience. Le joueur ne vit jamais un combat
serré. Il vit soit un rouleau compresseur, soit un mur. Et comme le mur ne
donne aucun signal exploitable — on perd à 100 %, pas à 60 % — le seul retour
qu'il reçoit est « reviens plus tard ».

### Pourquoi c'est comme ça

Le hasard existe pourtant dans le moteur : variance de dégâts ±8 %, critiques,
jets de malus. Mais un combat dure **106 actions en médiane**. Sur cent tirages,
la loi des grands nombres écrase toute variance : le résultat converge vers
l'écart de statistiques pur. Le combat est long, donc il est déterministe.

C'est important parce que **la longueur des combats et l'absence de tension
sont le même problème**, et se soignent avec le même remède.

---

## 2. Les décisions du joueur ne changent presque rien

**Mesure.** Quatre stratégies, sur 24 missions × 6 graines identiques :

| Stratégie | Victoires |
|---|---|
| AUTO (l'IA du jeu) | 25,0 % |
| ORACLE (essaie tout, prend le meilleur coup) | 22,2 % |
| HASARD (sort au hasard, cible au hasard) | 21,5 % |
| SPAM sort 1 (toujours la même touche) | 20,8 % |

**Jouer au hasard vaut jouer parfaitement.** Sur 24 missions, la stratégie n'a
changé le résultat que sur **2**.

C'est la conséquence directe du constat n° 1 : si l'issue est décidée avant le
premier tour, aucune décision ne peut la renverser. Toute la richesse des
32 kits — les Fragments, le Givre, les Marques — ne sert à rien pendant le
combat. Elle sert uniquement à faire monter le nombre de puissance.

Autre lecture du même chiffre : **l'IA AUTO est déjà au niveau du jeu parfait.**
Le joueur qui appuie sur AUTO ne perd rien. Il n'a donc aucune raison de jouer
manuellement, et le jeu se regarde au lieu de se jouer.

---

## 3. Le coût réel d'une session : ~16 minutes à regarder

| Mesure | Valeur |
|---|---|
| Actions par combat (médiane) | 106 |
| Durée d'un combat en AUTO (560 ms/action) | **59 s** |
| Boucle quotidienne (6 expéditions + 5 raids + 3 quêtes + Mythic+ + boss) | 16 combats |
| Temps de combat par jour | **~16 minutes** |

Et pendant ces 16 minutes il n'y a **ni balayage** (rejouer instantanément une
mission déjà validée 3★), **ni vitesse ×2/×3**. Le seul réglage est la
désactivation des effets visuels.

Pour un jeu qui demande du farm, c'est le point de friction le plus concret et
le plus facile à corriger.

---

## 4. Le roster : 135 % d'écart, et un 5★ injouable

**Mesure.** Métrique continue : pour chaque champion, la puissance qu'il faut
à son équipe (lui + Thorgar + Sylven) pour franchir 50 % de victoires. Plus
c'est bas, plus le champion porte. Raretés et plafonds de niveau réels.

| Rang | Champion | | Seuil |
|---|---|---|---|
| 1 | Morghast | 4★ | ×1,23 |
| 2 | Nashoba | 5★ | ×1,23 |
| 3 | Histéria | 5★ | ×1,23 |
| … | | | |
| 28 | Brom | 3★ | ×2,89 |
| 29 | Aurelis | 3★ | ×2,89 |
| 30 | **Hicho** | **5★** | **jamais (>×3,2)** |

**135 % d'écart** entre le meilleur et le dernier utilisable. Choisir le bon
champion vaut plus que doubler ses statistiques.

Deux problèmes distincts là-dedans :

1. **Hicho est un 5★ inutilisable.** Même à ×3,2 de puissance il ne franchit
   pas 50 %. Tirer un 5★ et découvrir que c'est le pire personnage du jeu est
   la pire expérience possible dans un gacha.
2. **La force d'un champion dépend énormément de ses coéquipiers, et le jeu
   ne le dit nulle part.** Voir la section 7 : Mathanae mesure ×2,19 dans ce
   harnais et sortait 1er dans un autre. Ce n'est pas une contradiction, c'est
   la composition qui décide.

---

## 5. L'indicateur de puissance est 7 fois moins précis que la bande qu'il doit prédire

C'est le constat le plus actionnable du rapport.

**Mesure.** Pour neuf missions, j'ai cherché le seuil réel de victoire à 50 %,
puis relevé ce que le jeu affichait à ce point exact.

| Mission | Recommandée | Seuil réel | Ratio | Verdict affiché **à pile ou face** |
|---|---|---|---|---|
| Normal Z3-4 | 3 125 | 2 412 | 0,79 | 🟠 Insuffisant (54) |
| Normal Z5-7 | 5 204 | 5 447 | 1,05 | 🟡 Risqué (69) |
| Normal Z9-7 | 7 628 | 10 910 | 1,43 | 🟢 **Confortable (86)** |
| Difficile Z4-7 | 6 971 | 7 575 | 1,09 | 🔵 Adapté (82) |
| Hardcore Z3-4 | 6 201 | 7 327 | 1,18 | 🔵 Adapté (85) |

Ratio moyen 1,08, **mais de 0,79 à 1,43**.

L'indicateur se trompe de ±30 %. La bande qui décide de la victoire fait 4 %.
**L'erreur de la boussole est sept fois plus large que le chemin.**

Pire, la dernière colonne : au point précis où le joueur a exactement une
chance sur deux, le jeu lui annonce selon la mission « Insuffisant », « Risqué »,
« Adapté » ou « Confortable ». Les quatre verdicts décrivent la même situation.

---

## 6. Contenu : 210 missions, ~20 rencontres distinctes

La campagne annonce 210 missions. En réalité :

- **70 missions uniques**, rejouées à l'identique en Normal / Difficile /
  Hardcore — `createMission` ne change que des multiplicateurs de statistiques,
  jamais la composition ennemie ;
- dans une zone, les stages 1 à 6 réutilisent **le même trio de monstres** avec
  un léger coefficient, et le stage 7 est le boss ;
- soit **2 compositions distinctes par zone**, 10 zones → **~20 rencontres
  réellement différentes** étalées sur 210 entrées.

Les mécaniques de zone sauvent partiellement la variété (elles, elles sont
vraies et différentes). Mais elles se déclenchent sur une cadence fixe
(`turnCount%2===0`), sans annonce et sans parade possible : le joueur les subit
sans jamais apprendre à les jouer.

Note annexe : sur 248 hauts faits, **128 sont des hauts faits « Champions »**,
c'est-à-dire une liste de cases à cocher par personnage. C'est du remplissage,
pas du contenu.

---

## 7. Correction sur mon propre rapport d'hier

Dans `Audit/RAPPORT-MATHANAE.md` j'ai écrit que le rééquilibrage lui coûtait
**−18,0 points de taux de victoire**. Ce chiffre était juste, mais **il est
propre au harnais qui l'a produit**, et je ne l'avais pas dit.

Vérification faite aujourd'hui, dans le harnais de ce rapport (Mathanae aux
côtés de Thorgar, un tank, et Sylven, une soigneuse — donc en position
redondante) :

| | Seuil de puissance |
|---|---|
| Kit d'origine | ×2,19 |
| Kit corrigé | ×2,26 |

**3 % d'écart, pas 18 points.** Le correctif n'a donc pas tapé trop fort : il
n'a presque aucun effet dès que Mathanae n'est pas seul à tenir l'équipe.

La vraie leçon est ailleurs, et elle vaut pour tout l'équilibrage du jeu :
**la puissance d'un champion n'est pas un nombre, c'est une fonction de son
équipe.** Un classement « meilleur champion » sans préciser la composition
n'a pas de sens, et j'aurais dû le préciser hier.

---

## 8. Ce qu'on pourrait faire

Classé par rapport effet/coût. Les trois premiers se tiennent : ils attaquent
la même racine.

### A. Raccourcir les combats — la seule pierre qui fait deux coups

> **Vérifié : à moitié faux.** Le gain de temps est au rendez-vous (16 min →
> 5,7 min). L'élargissement de la bande, non : elle est passée de 4,0 % à
> 3,5 %, puis à 0,5 % après la correction du ciblage. Voir section 11.

Un combat médian dure 106 actions. En descendre à 35-45 :

- **rend la variance visible** : sur 40 tirages au lieu de 106, un critique ou
  un malus résisté pèse encore quelque chose → la bande de 4 % s'élargit
  mécaniquement, et les combats redeviennent serrés ;
- **divise le temps de session par deux** : ~7 min au lieu de ~16.

Concrètement : monter les dégâts de tout le monde (joueur **et** ennemis) d'un
facteur commun, ou baisser les PV des deux côtés. C'est un réglage global, pas
une refonte, et il est mesurable avec le harnais existant — on peut viser une
largeur de bande cible (disons 20 %) et régler jusqu'à l'obtenir.

*Risque à surveiller* : trop court, les kits à montée en puissance (Fragments,
Givre, Maelström) n'ont plus le temps d'exister. 35-45 actions est un plancher,
pas une cible à dépasser.

### B. Rendre les mécaniques de zone jouables au lieu de subies

> **Vérifié : faux.** Implémenté puis retiré. Annoncer une mécanique un tour à
> l'avance et permettre de la parer coûtait au joueur 8,1 points de taux de
> victoire à x1,05 de puissance. La mesure a en revanche révélé un vrai défaut
> à côté — le ciblage automatique. Voir section 11.

Les mécaniques existent déjà et sont bonnes. Il leur manque deux choses :

1. **L'annonce.** « ⚒️ Thargrim entre en Surchauffe — frappe lourde dans
   2 tours ». Un télégraphe transforme une punition en énigme.
2. **La parade.** Étourdir, purifier, briser le bouclier pendant la fenêtre
   annulerait ou réduirait l'effet.

C'est le levier le moins cher pour que les décisions comptent, parce que la
moitié du travail est déjà faite dans le moteur. Et ça donne enfin une raison
de ne pas appuyer sur AUTO.

### C. Remplacer la puissance recommandée par une vraie simulation

Le jeu n'a pas besoin d'estimer : **il sait simuler**. J'ai lancé plusieurs
milliers de combats complets en quelques secondes dans ce même moteur.

Proposition : sur l'écran de préparation, un bouton **« Estimer mes chances »**
qui joue 20 combats en tâche de fond et répond honnêtement :

> **Tu gagnes 14 fois sur 20.** Point faible : aucune purification face au
> Gel persistant.

Ça remplace un nombre faux par une réponse vraie, ça rend la construction
d'équipe intéressante pour la première fois, et ça réutilise du code qui
existe déjà. À mon avis c'est la meilleure idée de ce rapport.

### D. Confort de farm : balayage et vitesse

- **Balayage** sur les missions déjà validées 3★ : récompenses immédiates,
  sans combat. C'est l'attente standard du genre et le premier reproche que
  feront tes amis.
- **Vitesse ×1 / ×2 / ×3** sur le délai de 560 ms.

Coût faible, gain immédiat sur les 16 minutes quotidiennes.

### E. Un plancher de viabilité, et dire la vérité sur les compositions

- **Remonter Hicho.** Un 5★ qui ne gagne jamais est un accident d'expérience.
- **Afficher la dépendance à l'équipe** plutôt qu'une note absolue : « Mathanae
  brille sans autre tank », « Sylven est redondante avec un second soigneur ».
  Le harnais de mesure sait déjà produire ces chiffres.

### F. Le social — le plus gros manque, vu l'intention

Le jeu est explicitement « à vocation entre amis ». Dix des codes promo portent
les prénoms de tes amis, et dix champions aussi. Et pourtant **il n'existe
aucune fonctionnalité sociale**, pas une seule.

Le moteur est déterministe et amorcé par graine, la sauvegarde est déjà
exportable : trois choses sont possibles **sans aucun serveur**.

1. **Le défi de la semaine.** Une graine et une rencontre identiques pour tout
   le monde, tirées de la date. Chacun la joue, le score est le nombre de tours
   utilisés. On compare en s'envoyant un code. C'est la fonctionnalité au
   meilleur rapport effet/coût de toute cette liste.
2. **Le fantôme.** Exporter un combat gagné sous forme de code court (équipe +
   graine + suite d'actions) ; un ami l'importe et regarde ta partie, ou tente
   de faire mieux.
3. **La carte de profil.** Un résumé signé exportable (niveau, roster, étoiles,
   meilleur Mythic+) qu'un ami importe pour se comparer.

### G. Variété de contenu, à moindre coût

Sans écrire 20 rencontres de plus : ajouter **une ou deux étapes à règle
spéciale par zone** — « un seul champion », « aucun soin », « les malus ne
s'appliquent plus » — qui forcent une composition différente. Ce sont des
drapeaux dans `createMission`, pas du nouveau contenu.

---

## 9. Ce que je n'ai pas retenu

Par honnêteté, les pistes que j'ai regardées et écartées :

- **Rendre le jeu plus dur.** Le problème n'est pas la difficulté, c'est sa
  raideur. Monter les statistiques ennemies déplacerait le mur sans l'élargir.
- **Toucher à l'économie de cristaux.** 10 multis par mois est exactement le
  bon réglage pour un jeu entre amis. Rien à faire.
- **Refondre les hauts faits.** 128 sur 248 sont du remplissage, mais ils ne
  gênent personne et les retirer coûterait des récompenses acquises.
- **Supprimer le mode AUTO.** Ce serait traiter le symptôme. Si les décisions
  comptent (pistes A, B, C), les joueurs joueront manuellement d'eux-mêmes.

---

## 10. Reproduire les mesures

```bash
npm run mesures
```

Cinq blocs : largeur de bande, valeur des décisions, coût de session, seuil par
champion, honnêteté de l'indicateur. Aucune assertion — si un chiffre de ce
rapport te paraît faux, la commande le contredira.


---

## 11. Après corrections — ce qui a marché, ce qui n'a pas marché

Les sept propositions ont été traitées. Six sont livrées, une est abandonnée
sur mesure, une est laissée de côté. Chiffres relevés avec `npm run mesures`
sur l'état final.

| Mesure | Avant | Après |
|---|---|---|
| Session quotidienne | ~16 min | **5,7 min** |
| Combat médian | 106 actions | **38 actions** |
| AUTO près du seuil (x1,05) | 30,6 % | **51,3 % de victoires** |
| AUTO près du seuil (x1,10) | 41,9 % | **65,0 %** |
| Écart meilleur→pire champion | 135 % | **77 % de puissance** |
| Erreur de la puissance recommandée | −21 % à +43 % | **−26 % à −1 %** |
| Bande de transition | 4,0 % | **0,5 %** ⚠️ |

### Ce qui a marché

**A — Tempo de combat.** Les réserves de PV des deux camps sont divisées par
2,4. Tout ce qui s'exprime en pourcentage de PV max se calcule sur la réserve
d'avant la coupe, pour que le rapport soin/dégâts reste intact. La session
tombe de 16 à 5,7 minutes.

**B (remplacé) — Ciblage automatique.** `chooseAutoEnemyTarget` ne comptait que
l'affinité puis l'ordre du tableau : **aucun terme de points de vie**. L'AUTO
éparpillait ses dégâts au lieu d'achever, alors que tuer une unité retire
définitivement sa part de dégâts. Un terme d'achèvement corrige ça, et l'AUTO
gagne 20,7 points à x1,05. C'est la façon dont la plupart des gens jouent : le
gain touche tout le monde.

**C — Estimer mes chances.** L'écran de préparation joue vraiment la mission
20 fois et répond « Tu gagnes 14 fois sur 20 ». Un combat à pile ou face
s'annonce « serré », jamais « confortable ».

**D — Balayage et vitesse.** Une mission maîtrisée à 3★ se récolte sans combat
(12 par jour), et le mode AUTO se règle en x1 / x2 / x3.

**E — Plancher de viabilité.** Hicho remonte de la 27ᵉ à la 21ᵉ place : ses
totems galvanisent l'équipe au lieu de seulement la soigner.

Anomalie inverse apparue à la remesure, absente de l'audit initial parce que
l'ancien ciblage la masquait : Yunmei, un 4★, était le meilleur champion du jeu
à ×0,93 quand le meilleur 5★ demandait ×1,10.

L'ablation dit où était sa force, et ce n'était pas là où je l'avais d'abord
cru :

| Kit | Seuil |
|---|---|
| Complet | ×1,013 |
| Sans le soin de Paume de brume | ×1,089 |
| Sans le soin de Brume revigorante | ×1,089 |
| **Sans le soin de Renouveau (son ultime)** | **×1,013 — aucun effet** |
| Sans la purification de Renouveau | ×1,013 — aucun effet |

Sa Paume de brume, sans recharge, frappait **et** soignait : le seul sort du
jeu à soigner sans contrepartie. Et sa valeur était **binaire** — diviser le
soin par deux (×1,023) ou ne le tisser qu'un coup sur deux (×1,023) ne
déplaçait rien ; seule sa suppression comptait. Ce n'était donc ni le montant
ni le rythme, c'était l'absence de recharge. Sa guérison est passée sur Brume
revigorante, qui en a une, comme tous les soigneurs du jeu.

Elle passe de ×0,93 à **×1,06** : toujours première, mais 4 % devant le
meilleur 5★ au lieu de 18 %. Un très bon 4★ qui se bat avec les 5★ plutôt
qu'un 4★ qui les écrase.

**F — Défi de la semaine.** La même rencontre pour tout le monde pendant sept
jours, un score comparable, un code à s'échanger. Sans serveur. Le score est la
part de PV arrachés — et la tentative compte même sur une défaite — pour que
des amis de niveaux différents puissent se comparer.

### Ce qui n'a pas marché, et pourquoi

**La tension n'est pas revenue. Elle a même empiré : la bande passe de 4,0 % à
0,5 %.**

Trois tentatives, trois échecs mesurés :

1. **Raccourcir les combats** (proposition A) n'a pas élargi la bande. Mon
   hypothèse — « les combats sont longs, donc la variance s'écrase » — était
   fausse.
2. **Mesure de contrôle**, à PV et dégâts totaux identiques répartis sur une
   puis trois unités : bande de 5 % à un seul ennemi, 2 % à trois. La cause
   n'est pas la longueur mais **la rétroaction des morts** — tuer une unité
   retire un tiers des dégâts adverses, ce qui amplifie l'avance de celui qui
   mène.
3. **Télégraphier les mécaniques** (proposition B) devait donner au joueur une
   parade. Mesuré près du seuil, en paires appariées : la parade lui coûtait
   8,1 points à x1,05 et 3,7 à x1,10. Détourner ses dégâts de la cible optimale
   ne paie jamais tant que tuer est aussi décisif. Retiré : une mécanique qui
   punit le joueur qui s'en occupe est pire que pas de mécanique.

Et un AUTO qui joue mieux rend l'issue **plus** prévisible : c'est le prix,
assumé, du gain de 20 points.

**Conclusion honnête : la tension ne se règle pas par ajustement.** Elle tient
à la forme même du combat — une course où la mort d'une unité s'auto-amplifie.
Si l'on veut des combats serrés, c'est cette spirale qu'il faut amortir, et
c'est une décision de conception, pas un réglage. Je ne l'ai pas prise seul.

> **Correction.** Une version antérieure de cette section affirmait que « la
> seule chose du jeu qui casse cette spirale est la résurrection de Yunmei, et
> c'est exactement ce qui fait d'elle le meilleur champion ». C'est faux sur
> les deux points. Son ultime « Renouveau » (`revival`) est un soin d'équipe
> avec purification, pas une résurrection : la seule réanimation du jeu est
> celle de Caelion (`timeRestore`). Et la mesure par ablation, faite depuis,
> montre que son ultime ne pèse **rien** dans sa domination : le retirer ne
> déplace pas son seuil d'un millième. Sa force venait de sa Paume de brume,
> qui frappait et soignait sans aucune recharge. J'avais raisonné sur un nom
> de sort au lieu de lire son implémentation.

### Non traité

**G — Étapes à règle spéciale.** Voir section 12.


---

## 12. Étapes à règle spéciale (proposition G)

La campagne annonce 210 missions pour **~20 rencontres réellement distinctes** :
les mêmes 70 étapes rejouées en Normal, Difficile et Hardcore, où seuls les
multiplicateurs changent. Quatre règles ajoutent une contrainte de composition,
sans écrire une seule rencontre de plus.

| Règle | Effet |
|---|---|
| 🚫 Silence des soins | Aucun soin ne fonctionne. Les boucliers, eux, tiennent. |
| 🛡️ Volonté de fer | Les ennemis résistent aux malus soumis à la Précision. |
| 💔 Marche forcée | L'équipe entre au combat à 60 % de ses points de vie. |
| ⚡ Embuscade | Les ennemis ouvrent le combat, jauges pleines. |

**Elles ne touchent jamais la Normal**, qui est le chemin obligatoire et doit
rester finissable, ni aucun boss — un mur de progression ne doit pas devenir une
impasse. Deux étapes réglées par zone en Difficile, trois en Hardcore : c'est
précisément là que les rencontres se rejouent à l'identique.

### La mesure qui compte

Une règle utile coûte cher à une équipe qui repose dessus, et peu à une équipe
qui s'en passe. Sinon ce n'est pas une contrainte de composition, c'est de la
difficulté en plus.

| Règle | Équipe concernée | Équipe insensible |
|---|---|---|
| Silence des soins | **+27,2 %** de puissance | **+0,0 %** |
| Volonté de fer | +27,4 % | +13,6 % |

Le Silence des soins est exactement ce qu'on visait : il ne pénalise que les
compositions qui reposent sur les soins. La Volonté de fer discrimine moins bien
— elle coûte aussi à une équipe neutre — mais reste une vraie contrainte.

### Une promesse tenue au mot près

La Volonté de fer annonçait d'abord « les ennemis résistent à **tous** les
malus ». C'était faux : les marques de mécanique (Traque, Marque d'exécution)
sont posées en direct par les kits, sans jet de Précision, et les bloquer
casserait ces kits. Le texte a été corrigé pour ne promettre que ce que la règle
bloque réellement. Un test vérifie que le texte ne redevient pas trop large.


---

## 13. Tour de tous les champions

32 champions, 96 sorts, chacun lancé dans une scène représentative — alliés
blessés et affaiblis, ennemis déjà affligés, protégés et l'un d'eux à l'agonie —
puis comparé à ce que le sort déclare. Rejouable avec `npm run mesures`
(`Audit/mesures/audit-champions.test.js`).

### Ce qui a été cherché

| Classe | Résultat |
|---|---|
| Sort sans aucun effet observable | 0 |
| Puissance déclarée sans dégâts | 0 |
| Dégâts sans puissance déclarée | 0 |
| Sort de soutien qui blesse | 0 |
| Recharge incohérente avec l'annonce | 0 |
| Exception au lancer | 0 |
| Promesse de description non tenue | 2, tous deux vérifiés comme différés |
| Fiche incohérente avec le kit | 0 |
| Barre de ressource jamais alimentée | 0 |
| **Résonance IV promise mais sans effet** | **3** |

### Le seul vrai défaut : trois Résonances IV payées pour rien

Aurelis, Elowen et Hicho annonçaient chacun une amélioration précise à
Résonance IV — un bouclier plus grand, un Jardin qui soigne davantage, une Marée
plus généreuse — et **le moteur ne l'appliquait nulle part**. Le joueur payait
des cristaux et des Âmes universelles pour un texte sans effet.

| Champion | Résonance 0 | Résonance IV avant | après |
|---|---|---|---|
| Aurelis — Égide de secours | 3 840 | 3 840 | **4 560** |
| Elowen — Jardin vivant | 2 880 | 2 880 | **3 600** |
| Hicho — Marée ancestrale | 11 520 | 11 520 | **13 500** |

### Trois fois où c'était ma mesure qui mentait

La battue a d'abord signalé bien plus, et chaque fois le défaut était dans le
harnais. C'est la partie la plus utile de cet exercice :

1. **Une copie de surface.** Mon instantané « avant » partageait ses objets de
   malus avec le moteur : quand un sort prolongeait un Saignement, l'instantané
   changeait aussi, et l'audit ne voyait rien. **Dagcat a été accusé à tort** de
   ne pas prolonger le Saignement.
2. **Un bouclier de test trop épais.** Il absorbait tous les dégâts, et
   **22 sorts** ont été signalés comme n'infligeant rien.
3. **Des motifs trop larges.** « Inflige le double de dégâts **aux boucliers** »
   était lu comme la promesse de *donner* un bouclier ; « Réagit avec Saignement
   ou Brûlure » comme celle d'en *appliquer*. Korga, Morghast et Histéria
   accusés à tort.

Les deux signalements qui subsistent sont attendus et vérifiés : la Graine de
Sylven purifie **quand les PV tombent**, la Pénitence de Lelianna soigne
**les alliés sous Expiation**. Un lancer isolé ne peut pas les voir.
`tests/promesses.conditionnelles.test.js` prouve que les deux tiennent, au bon
moment — et qu'elles n'agissent pas trop tôt.


---

## 14. Battue des autres systèmes

Même méthode que pour les champions : inventorier ce qui est **annoncé**, puis
vérifier que le moteur le **consomme**.

### Sets d'équipement — 15 sets, rien à signaler

Les six sets à effet (`lifestealSet`, `protectionSet`, `counterSet`,
`incendiarySet`, `volcanicFurySet`, `fireproofSet`) sont tous consommés par le
moteur, et chaque bonus chiffré annoncé correspond aux statistiques déclarées.
Aucun défaut.

### Armes Uniques — 3 pouvoirs sur 7 ne faisaient rien

Une arme Unique se gagne au bout d'une chronique longue et rare. Trois d'entre
elles ne tenaient pas leur promesse.

| Arme | Promesse | État |
|---|---|---|
| 🌟 Bâton des Astres Brisés | « Cinq compétences alliées éveillent un alignement protecteur. » | **jamais implémenté** |
| 🌊 Égide des Mille Marées | « Les soins excédentaires alimentent une égide collective. » | **jamais implémenté** |
| 🗡️ Cendre-Sépulcrale | « La lame répond à son orientation purifiée ou corrompue. » | **seule la corrompue existait** |

Les deux premières n'étaient référencées **nulle part** dans le moteur. Pire,
la décharge générique commune à toutes les armes exige d'infliger des dégâts :
un soigneur portant l'une de ces deux armes de soutien — dont les sets sont
justement Protection et Vitalité — n'en tirait rigoureusement rien.

Elles sont écrites, et sans condition de dégâts. Pour Cendre-Sépulcrale, la
chronique fait **choisir** entre purification et corruption : choisir la
purification ne donnait rien. La lame purifiée délivre désormais l'allié le plus
bas d'un malus et le soigne.

### Empreintes — 22 % du système était décoratif

Le tableau d'Empreintes est **identique pour tous les champions** : les mêmes
douze nœuds, aux mêmes emplacements, seuls les index de compétences changent.
Or un bonus de fiabilité sur une compétence qui ne tente aucun jet, ou un bonus
de durée sur une frappe qui ne pose rien, ne fait rien du tout.

**84 nœuds sur 384 étaient morts** — jusqu'à 6 sur 12 pour Caelion. Vérifié par
simulation sur 60 graines avant toute conclusion.

Correction : chaque nœud garde l'intention de sa branche — Force parle de
puissance, Emprise de fiabilité et de durée, Flux de tempo — mais **se porte sur
une compétence qui sait s'en servir**. Si aucune ne le sait, il bascule sur un
bonus que la compétence visée peut recevoir. La forme du tableau, ses coûts et
son interface ne changent pas. **0 nœud mort sur 384.**

Et pour éviter d'introduire le défaut que je traquais, le texte de chaque nœud
est désormais **dérivé du bonus retenu** au lieu d'être écrit à la main : il
nomme la compétence réellement touchée et dit le vrai type de bonus, avec le
verbe qui convient — « frappe plus fort », « protège davantage », « agit plus
fort ».

### Une quatrième fois où ma mesure mentait

Mon test « les sept armes ont un pouvoir » passait — et ne prouvait rien.
`createBattle` tire les jauges de départ au hasard : deux exécutions diffèrent
toujours, donc **n'importe quelle arme, même décorative, passait le test**. Il
échouait une fois sur trois, ce qui l'a trahi. Une fois le générateur amorcé sur
toute la séquence, Cendre-Sépulcrale est tombée immédiatement.

Un test instable n'est pas un détail de confort : c'est un test qui ment.


---

## 15. Battue des modes : Mythic+, Raids, Expéditions

### Deux affixes Mythic+ sur huit ne se déclenchaient jamais

**Galvanisant** et **Détonant** réagissent tous deux à la mort d'un ennemi. Le
code qui les déclenche vit dans `finish()` et compare les morts « d'avant » aux
morts « d'après » :

```js
const before=new Map(battle.enemies.map(unit=>[unit.id,unit.dead]));
const newDeaths=enemies.filter(unit=>unit.dead&&!before.get(unit.id));
```

Or `battle` est **déjà l'état d'après l'action**, et `enemies` en dérive. Les
deux listes étaient donc toujours identiques, `newDeaths` toujours vide, et les
deux affixes **complètement inertes** — dans toutes les saisons, à tous les
niveaux, depuis toujours.

L'appelant fournit désormais la liste des morts d'avant son action, et les deux
chemins qui tuent — le sort d'un champion et l'action d'un ennemi, riposte
comprise — la transmettent.

Les six autres affixes ont été vérifiés **en simulation, chiffre par chiffre**,
en comparant l'effet mesuré à la phrase affichée au joueur : Fortifié (+20 % PV,
+12 % Attaque, +5 Résistance), Tyrannique (+25 %, +15 %, +8 Précision), Déchaîné
(seuil 30 %, +15 % Attaque, +20 % Vitesse), Détonant (2,5 % par mort, plafond
10 %), Nécrotique (−6 % par cumul, 5 maximum), Affligé et Incorporel. Tous
conformes.

### Cinq mécaniques écrivaient dans le vide

Le moteur documente en commentaire que muter `actor` n'a aucun effet — `actor`
vient du combat reçu, `self` est la copie qui est commitée. Cinq mécaniques
annoncées mutaient pourtant `actor` : elles infligeaient bien leurs dégâts, mais
leur renforcement ou leur soin **disparaissait à chaque tour**.

| Mécanique | Promesse | État |
|---|---|---|
| ⚒️ Surchauffe (Khaz-Drum) | « L'Attaque augmente au fil des actions » | perdue |
| 🩸 Soif carmine (Crypte Sanglante) | « Les ennemis récupèrent une partie des dégâts » | perdue |
| 📚 Esprits anciens (Sanctuaire) | « Les Esprits gagnent de l'Attaque à chaque action » | perdue |
| 🛡️ Rempart de lave (Raid) | Défense du Gardien | perdue |
| 🌋 Furie volcanique · ↩️ Écho vengeur | — | perdues, mais zones non jouables |

### Six mécaniques de zone en réserve

`CAMPAIGN_MECHANICS` déclare seize zones pour dix jouables. Les six autres —
Rempart des Anciens, Netherys, Chambre des Échos, Couronne Givrée, Fournaise
Incendiaire, Trône du Volcan — ont pour la plupart déjà leur code moteur. Ce
n'est pas un défaut, c'est du contenu en attente, mais mieux vaut que ce soit
écrit : c'est ce qui m'a d'abord fait croire que la Furie volcanique était
cassée. Un test le consigne.

### Le reste est propre

Les quatre Expéditions et leurs treize rôles de serviteurs sont tous traités, et
chaque mécanique annoncée a été vérifiée en jeu — le Cristal régénérant soigne
bien, l'Éclat majeur protège bien, l'Éclat mineur accélère bien. Les quatre
Raids déclarent 34 champs, tous lus.

### Cinquième fois où ma mesure mentait

Mon test « une mort par riposte déclenche Détonant » mesurait les PV perdus par
l'allié — or l'ennemi venait justement de le frapper. L'assertion était vraie
quoi qu'il arrive. Il a fallu un témoin sans l'affixe pour que la mesure porte
sur la détonation elle-même.

## 16. Battue de l'économie : boutique, hauts faits, quêtes

Dernier tour, sur les trois systèmes qui manipulent les monnaies du joueur.
C'est le seul endroit où un bug se paie en ressources perdues, donc la battue a
porté sur une question unique : **tout ce qui est promis est-il vraiment versé ?**

### Ce qui est propre

| Système | Vérifié | Résultat |
|---|---|---|
| Quêtes | 23 événements de suivi | tous émis par le jeu |
| Récompenses | 7 clés (`gold`, `gems`, `stones`, `essence`, `masteryTomes`, `universalSoul5`, `summonerXp`) | toutes versées par `grantReward` |
| Boutique | 5 types d'offres, 3 devises | tous traités |
| Boutique | `canBuyOffer` : devise, stock, solde, inventaire plein | les quatre refus fonctionnent |

`SHOP_CURRENCIES` fait bien la traduction `blood` → `bloodFragments` : c'était le
candidat le plus probable pour une monnaie débitée dans le vide, il n'en est
rien.

### Deux compteurs de Chronique qui ne comptaient pas

`lifetime.chronicles.relicsFound` et `lifetime.chronicles.activated` existaient
dans `emptyProgressionStats()`, étaient sauvegardés, étaient lus par la page de
statistiques — et n'étaient **jamais incrémentés**. Un joueur qui trouvait dix
reliques en voyait zéro. Corrigé : `grantRelic` et `activateRelic` écrivent
maintenant dans les deux, via un unique `noterChronique`.

(`lifetime.forge.sales` reste mort lui aussi, mais rien ne le lit : ce n'est pas
un mensonge affiché au joueur, seulement du poids inutile dans la sauvegarde.)

### Sixième fois où ma mesure mentait — et c'est la plus instructive

Ma sonde de navigateur a rapporté qu'un achat de 4 500 or ne changeait **rien**
à la sauvegarde. Bouton actif, solde suffisant, aucune erreur en console. Tout
disait « bug ».

Ce n'en était pas un. Le bouton `Acheter` de la carte n'achète pas : il appelle
`setSelected(item)` et ouvre une fenêtre de confirmation. Le vrai achat est sur
un **second** bouton `Acheter`, à l'intérieur de cette fenêtre. Ma sonde cliquait
le premier et lisait le résultat du second.

Deux autres pièges se cachaient sur le même chemin, et chacun aurait pu faire
conclure à un bug différent :

- le tutoriel passe par `window.confirm`, que Playwright **refuse** par défaut :
  la sonde restait bloquée sur le premier écran en croyant naviguer ;
- la Boutique est verrouillée sous le niveau d'Invocateur 2, donc « aucune offre
  achetable » ne voulait pas dire « la boutique est vide ».

Sonde corrigée, l'achat est net, et les deux chemins sont vérifiés :

| | Avant | Après |
|---|---|---|
| Achat de cristaux (15 000 or) | 999 999 or · 99 999 💎 | 984 999 or · 100 049 💎 · stock `VENDU` |
| Achat d'équipement (4 500 or) | inventaire 0 | inventaire 1 · « 👖 Jambières Protection 2★ · Boutique d'Azerune » |

Écran et sauvegarde disent la même chose dans les deux cas.

**La leçon, six fois de suite :** aucun de ces six mensonges n'était un bug du
jeu. Tous les six étaient des bugs de l'outil qui cherchait les bugs — et cinq
d'entre eux accusaient à tort quelque chose de sain. Une sonde qui rapporte un
défaut n'a rien prouvé tant qu'elle n'a pas d'abord prouvé qu'elle sait mesurer
un cas qui marche.

### Couverture

`tests/economie.contrats.test.js`, 12 tests, **12 mutations sur 12 tuées**.

## 17. Les effets visuels, le gel de l'AUTO, et l'avenir du moteur

Trois retours du joueur, dont un que j'avais déjà prétendu corriger deux fois.

### Les effets visuels : le moteur était juste, le CSS les tuait

J'avais corrigé le moteur, puis le composant, puis les couleurs. Tout cela était
vrai et ne servait à rien : **le CSS masquait la couche en dur**, et le bouton
continuait d'annoncer que les effets étaient actifs.

```css
@media(prefers-reduced-motion:reduce){ .spell-vfx{display:none} }
```

Sort lancé, couche inspectée dans un vrai combat :

| `prefers-reduced-motion` | `.spell-vfx` | Bouton affiché |
|---|---|---|
| `no-preference` | `display:block` · 107×136 · animé, opacité 0,78 | ✨ EFFETS · `aria-pressed=true` |
| `reduce` | **`display:none` · 0×0** | ✨ EFFETS · `aria-pressed=true` |

Sur téléphone ce réglage est courant : l'économie d'énergie l'active seule sur
Android, et c'est un réglage d'accessibilité répandu sur iOS. Un joueur dans ce
cas ne pouvait **rien** voir, quoi que je corrige ailleurs — et le bouton lui
mentait.

Le réglage système décide désormais de l'**état initial** du bouton, plus jamais
du rendu. Seul `.no-vfx`, posé par le bouton, coupe la couche. Vérifié : sous
`reduce`, le bouton démarre sur « EFFETS COUPÉS » (honnête), et une tape dessus
fait réapparaître les effets — `display:block`, 107×136, animations à 1,0.

**Deuxième cause, indépendante, même symptôme.** Le réglage des Paramètres
s'appelait « Réduire les animations *d'invocation* » mais partageait sa clé
(`azerune-summon-preferences-v1`) avec le combat : le cocher éteignait les
effets de sort sans jamais le dire. Le libellé le dit maintenant.

### Le mode AUTO gelait un combat sur deux en vitesse x2

Non signalé comme tel — le joueur a dit « les combats ne sont plus très
fluides ». La mesure a trouvé bien pire qu'un manque de fluidité.

Les images : **60 fps pleins, même à 4× de bridage CPU**. Ce n'était donc pas un
problème de rendu. En revanche, sur douze secondes de combat en x2 :

| | Avant | Après |
|---|---|---|
| Combats gelés (x2) | **6 sur 8** | 0 sur 8 |
| Combats gelés (x1, x3) | 0 sur 3 | 0 sur 3 |

État pendant le gel, identique à chaque fois : `AUTO ACTIF`, un allié à 100 % de
jauge portant `[TOUR]`, et plus rien. Jamais.

La cause est un enchaînement de trois défauts qui se couvrent l'un l'autre :

1. La boucle AUTO est un `setTimeout` unique dont la garde faisait un `return`
   sec. Si elle refusait le tour, **aucune action n'était jouée**.
2. Donc `battle.turn` ne changeait pas. Or l'effet ne dépend que de cette clé :
   il ne se rejouait jamais, et son minuteur restait orphelin.
3. Le watchdog censé rattraper cela relance sur le **même** acteur — donc
   `battle.turn` ne change toujours pas, et il tournait en rond toutes les
   2,6 secondes sans jamais réveiller la boucle.

La garde repousse désormais de 90 ms au lieu de renoncer, et le watchdog dispose
d'un compteur de relance qui force l'effet à se rejouer même à acteur constant.

Deux défauts de rythme trouvés au passage, tous deux visibles en jeu :

- **Le tour ennemi était figé à 480 ms** quelle que soit la vitesse. En x3
  l'escouade jouait toutes les 187 ms et l'adversaire toujours en une
  demi-seconde : le combat avançait par à-coups. Les deux suivent le même
  réglage, avec un plancher de 150 ms.
- **Deux tapes rapides sur le bouton de vitesse ne comptaient que pour une** :
  `cycleSpeed` lisait `speed` dans sa fermeture, donc les deux clics d'un même
  lot React repartaient de la même valeur. x1 n'allait jamais qu'à x2.

### « Estimer mes chances » est retiré

À la demande du joueur, et il a raison : annoncer « tu gagnes 17 fois sur 20 »
avant d'appuyer sur Lancer supprime la seule question qui donne un intérêt au
combat. C'était une fonctionnalité que j'avais proposée ; elle résolvait un
problème d'information au prix du suspense, et le prix était trop élevé.

Le simulateur reste dans le dépôt et reste testé : c'est un bon outil de mesure
d'équilibrage. Il n'est simplement plus exposé au joueur.

### Le moteur tiendra-t-il ? Oui. L'interface de combat, non.

Question posée directement, donc réponse directe et chiffrée.

**Le moteur va très bien.** 681 lignes, fonctions pures, état immuable, 33
familles d'effets, 1 504 tests. Chaque correctif de cette battue a consisté à
ajouter une branche sans rien casser ailleurs — c'est exactement le signe qu'une
architecture tient. Le rythme (60 fps à 4× de bridage) n'est pas near la limite.

**Le problème est ailleurs, et il est déjà là.** Le composant `Unit` de
`BattlePage.jsx` fait **~32 000 caractères sur deux lignes**, et contient :

- **24 identifiants de champion codés en dur** (`unit.id===22`, `unit.id===33`…)
- **27 variables `isNomDuChampion`**
- une chaîne de ternaires qui les enchaîne toutes

le tout **recalculé à chaque rendu, pour chaque unité**. Ajouter le 33ᵉ champion
veut dire éditer cette chaîne. Au 40ᵉ elle sera intenable, et c'est là que les
bugs « annoncé mais jamais appliqué » que j'ai passé quatre versions à corriger
vont continuer de naître : la ressource affichée d'un champion vit dans
l'interface, séparée de la mécanique qui la produit dans le moteur. Rien ne les
oblige à dire la même chose — et cette battue a montré qu'elles divergent.

La sortie ne demande pas de réécrire le moteur. Elle demande que **chaque
champion déclare lui-même sa ressource** (icône, libellé, comment la lire dans
`unit.mechanic`), à côté de ses sorts, et que `Unit` se contente de l'afficher.
Un champion deviendrait alors une seule entrée de données, et le moteur comme
l'écran liraient la même source. Ce n'est pas urgent ; c'est le prochain vrai
chantier, avant d'ajouter beaucoup de contenu.

### Septième et huitième fois où ma mesure mentait

Elle a d'abord rapporté un gel total de l'AUTO en x2 — un vrai bug, mais ma
sonde le voyait pour la mauvaise raison : mon détecteur confondait « combat
terminé » et « combat figé ». Corrigé, il a confirmé le gel pour de bon.

Puis mon test de non-régression du CSS s'est déclenché sur la **bonne** règle :
`[^}]*` avalait le garde `.no-vfx` et voyait la règle fautive là où elle
n'existait plus. Il a fallu un lookbehind pour que l'assertion porte.

### Couverture

`tests/effets.visuels.test.js` (8 tests) et quatre tests ajoutés à
`tests/confort.balayage.test.js`. **12 mutants sur 12 tués** — dont un survivant
d'abord : définir `enemyDelay` sans vérifier qu'elle soit branchée laissait
passer un retour au délai fixe. Suite complète : **1 504 tests**, 70 fichiers.

## 18. Refonte : chaque champion déclare sa propre ressource

Le chantier annoncé en section 17. C'est un refactoring, donc la seule question
qui compte est : **est-ce que l'écran affiche exactement la même chose ?**

### Ce qui a été mesuré, et comment

Un refactoring qui « a l'air bon » ne prouve rien. J'ai donc rendu le composant
`Unit` en HTML, avant et après, sur une matrice de cas :

| | |
|---|---|
| Champions | 32 (tout le roster) |
| États de mécanique | 17 (vide, 0, 1, 2, 3, 4, 5, 6, 60, actif avec cible, actif sans cible, actif dépensé, inactif dépensé, marée haute, marée basse, goule, plafond déclaré) |
| Terrains | 3 (ennemis chargés de malus, terrain vierge, aucun ennemi) |
| **Combinaisons** | **1 632** |
| Rendus distincts | 206 |
| **Différences** | **0** |

Comparaison caractère pour caractère, sur le HTML **complet** de la carte, pas
seulement sur la pastille. La référence est committée
(`tests/fixtures/ressources-champions.json`) et la matrice qui la produit vit
dans `tests/helpers/ressourcesMatrice.js`, **partagée** entre le test et le
script de capture — sans ce partage, la comparaison ne prouverait rien.

### Le gain

| Le composant `Unit` | Avant | Après |
|---|---|---|
| Taille | 31 989 caractères | 22 627 |
| Identifiants de champion codés en dur | 23 | **0** |
| Variables `isNomDuChampion` | 24 | **0** |

Le préambule seul est passé de 4 033 à 764 caractères, et il ne recalcule plus
27 variables par unité et par rendu, qu'elles servent ou non.

**Ce qui change vraiment**, c'est le coût d'un champion. Aujourd'hui :

- une entrée dans `customHeroes.js` (ses statistiques et ses sorts),
- une entrée dans `championIdentities.js` (son identité),
- une entrée dans `ressourcesChampions.js` **s'il a une ressource propre**,
- et **aucune modification de `BattlePage.jsx`**.

Un champion est redevenu une donnée. C'était tout l'objet du chantier.

### Ce que ça règle sur le fond

Le problème n'était pas la longueur, c'était la **séparation** : la ressource
affichée vivait dans l'interface, la mécanique qui la produit vit dans le
moteur, et rien n'obligeait les deux à dire la même chose. Toute la battue des
sections 13 à 16 a consisté à réparer des divergences de cette famille.

Elles ne peuvent plus naître par oubli : un test vérifie que **tout champion du
roster** a soit une entrée propre, soit un repli générique valable, soit une
identité qui déclare explicitement `resource: 'Aucune'`. Un 33ᵉ champion ajouté
sans pastille fait échouer la suite.

### Trois mutants avaient survécu, et ils avaient raison

La matrice de 1 632 cas passait, et pourtant trois mutations ne changeaient
rien. Elles pointaient de vrais trous :

1. **Le tri des cumuls** (`b.stacks-a.stacks` → `a.stacks-b.stacks`). La matrice
   ne chargeait jamais qu'un seul ennemi : l'ordre ne pouvait pas se voir.
   Sivrane et Malvek doivent viser la cible **la plus** chargée.
2. **Le filtre `source===unit.id` de Lelianna.** La matrice marquait tous les
   buffs alliés au nom du champion testé. Sans le filtre, Lelianna comptait les
   Expiations posées par quelqu'un d'autre.
3. **`expose||brise` de Korga.** La matrice posait toujours `exposed`, donc la
   seconde condition n'était jamais celle qui décidait. Un bouclier brisé sans
   malus Exposé est pourtant une cible d'exécution valable.

Quatre tests ciblés les tuent. **20 mutants sur 20** au final.

Une matrice large n'est pas une matrice complète : 1 632 cas ne valaient rien
sur ces trois points précis parce qu'ils faisaient tous varier la même chose.

### Ce qui n'a pas été touché

Le moteur : pas une ligne. Les 33 familles d'effets, l'ordre des tours, les
dégâts, les affixes — rien de tout cela n'entre dans ce chantier, et c'est
voulu. `ORDRE_RECONNAISSANCE` fige par ailleurs l'ordre historique de
reconnaissance, parce qu'un héros dérivé peut porter deux effets reconnaissables
et que le changer changerait silencieusement son affichage. Un test l'épingle.

### Vérification en jeu

Combat réel, aucune erreur console : le Serment de Thorgar passe bien de
« Aucun allié lié » à « SERMENT ACTIF · Korga · 2 tours » avec sa classe
`active`, et la mise en avant `final-resource` de Sylven est intacte.

### Couverture

`tests/ressources.champions.test.js` : 23 tests, dont la comparaison des 1 632
combinaisons. Quatre tests de `champions.ressource.test.js` ont été rebranchés
du **texte source** vers le **comportement** — ils lisaient des chaînes de
`BattlePage.jsx` qui n'existent plus, et vérifient désormais ce que la fonction
renvoie, ce qui est plus solide. Suite complète : **1 527 tests**, 71 fichiers.

## 19. Souffle des éons : d'un bonus plat à une facture différée

Refonte du sort 3 d'Aszhal, sur modèle du sort du même nom dont il porte déjà
l'archétype (Évocateur Augmentation).

### Pourquoi l'ancienne version méritait de partir

« Toute l'équipe gagne 15 % de dégâts et de la jauge. » Ça marchait, c'était
lisible, et ça ne demandait rien : aucune décision, rien à regarder, aucun
moment où le sort est meilleur qu'un autre. C'était le seul ultime du jeu qui
ne produisait aucun état à suivre — d'où le `resource: 'Aucune'` d'Aszhal.

### Ce que fait la nouvelle version

| | |
|---|---|
| **Ouvre** | une **Plaie temporelle** sur **tous** les ennemis vivants, 3 tours |
| **Amplifie** | toute l'équipe (12 %, 16 % en Résonance IV) — la **condition**, plus la récompense |
| **Met de côté** | 15 % des dégâts qu'un allié **amplifié par Aszhal** inflige à une Plaie (20 % en Résonance IV) |
| **Rend** | la totalité, d'un coup, en Arcane, quand la Plaie se referme |
| **Réduit** | la part au-delà de deux autres alliés amplifiés (× 2 / n) |

Trois choses en découlent, et c'est tout l'intérêt :

- **Seuls les alliés qu'Aszhal a amplifiés nourrissent la Plaie.** Le buff
  d'équipe n'est plus le cadeau, c'est le péage.
- **La Plaie se referme au tour de l'ennemi qui la porte**, comme le Poison et
  la Brûlure. C'est la convention du moteur, pas une exception.
- **Une équipe qui ne frappe pas ne reçoit rien.** Le sort peut être gâché.

### La clause du sort d'origine n'est pas du texte mort

« Damage is reduced if Ebon Might affects more than 2 other allies » est, dans
le sort d'origine, une clause anti-montée en puissance en raid. À trois
champions elle ne se déclenche **jamais** — la recopier telle quelle aurait été
exactement le péché que ces six versions ont passé leur temps à réparer.

Elle est donc implémentée **et testée sur le format où elle mord** : en Raid 4v4,
trois autres alliés amplifiés font tomber la part de 15 % à **10 %**, et le
journal l'annonce.

### Mesure d'équilibrage — c'est un buff d'environ 5 %, et je le dis

A/B à graines appariées, 40 combats de 24 tours, même équipe, mêmes ennemis :

| | Ancienne | Nouvelle |
|---|---|---|
| Apport du sort 3 seul | +6,7 % | **+12,0 %** |
| Dégâts d'équipe sur 24 tours | 2 022 | **2 122** |
| Référence : la même équipe avec Ragnhild (DPS) à la place d'Aszhal | 2 131 | 2 131 |

La refonte vaut donc **+5 %** sur la contribution totale d'Aszhal, et le place
**à parité avec une pure championne de dégâts** (2 122 contre 2 131). Pour un
soutien qui n'apporte ni soin ni protection et dont toute la valeur est
l'amplification, c'est une place défendable — mais c'est bien un buff, pas un
échange neutre. Le levier de réglage est unique et isolé : la part de 15 %.

### Aszhal a enfin quelque chose à regarder

Il était l'un des trois champions sans pastille. La Plaie est une facture qui
grossit, et il faut la voir grossir pour choisir quand frapper : la pastille
affiche le nombre de Plaies ouvertes, le total en attente et les tours
restants. C'est le premier champion ajouté **après** la refonte de la section 18
— et il n'a demandé **aucune ligne** dans `BattlePage.jsx`. Le chantier a servi
tout de suite.

### La référence d'affichage a changé pour la première fois — volontairement

Les 1 632 combinaisons de la section 18 ont détecté la nouveauté : **51 cas
modifiés, tous Aszhal** (17 états × 3 terrains), aucun autre champion touché.
Vérifié avant de régénérer la référence, et le fichier dit désormais pourquoi il
a bougé. C'est exactement le service qu'on attend d'un filet de ce genre :
il n'empêche pas de changer, il oblige à regarder ce qui change.

### Deux tests m'ont dit non pour de mauvaises raisons

- La dérivation des listes d'Empreintes (`gestion`) lit des **lignes** de code.
  Mon effet réécrit sur plusieurs lignes est devenu invisible à `mastery.power`
  et `mastery.duration` — le test mesurait la mise en forme, pas le
  comportement. J'ai d'abord voulu la rendre robuste au bloc ; elle a alors
  révélé une dizaine de désaccords **préexistants** dans les deux sens, sur
  d'autres champions. C'est un autre chantier : j'ai remis la dérivation
  d'origine et remis mon effet sur une ligne, au style du fichier. **Le
  désaccord reste à traiter** — il est consigné ici, pas enterré.
- Un mutant destiné à Aszhal a frappé la description de **Lelianna**, qui porte
  la même phrase (`pendant 3 tours`). Faux positif de mon script — mais il a
  révélé un vrai trou : cette durée n'était épinglée nulle part. Elle l'est.

### Couverture

`tests/aszhal.plaie.test.js` : 23 tests, **20 mutations sur 20 tuées**.
Suite complète : **1 550 tests**, 72 fichiers.

## 20. Refonte des Empreintes : un arbre pour 32 champions, et une bonne réponse

Le joueur a dit « je trouve le système bof ». Il avait raison, et voici de quoi.

### Diagnostic — quatre mesures

**1. Il n'y avait pas 32 arbres, il y en avait un, appliqué 32 fois.**

| | |
|---|---|
| Champions | 32 |
| Jeux de **noms** de nœuds distincts | **1** |
| Jeux de **bonus** distincts | 12 |

« Poigne assurée », « Second souffle », « Sommet » : tout le roster portait les
mêmes douze nœuds, dans le même ordre. Aucun ne parlait du champion.

**2. Une branche sur trois mentait, pour la moitié du roster.**

46 nœuds sur 384 (12 %) n'accordaient pas ce que leur branche annonçait, et pas
au hasard : **17 champions sur 32 n'ont aucun effet à jet**. Pour eux, la branche
Emprise (« fiabilité et durée ») retombait sur `power`. Mesure sur Kaelen :
Emprise complète = **+28 % de puissance**. Une seconde branche Force déguisée.

**3. L'arbre demandait plus que les champions ne pouvaient porter.**

C'est la cause de tout le reste :

> L'arbre exigeait **12 nœuds distincts** à des champions qui n'offrent que
> **4 à 11 ancrages** (médiane 7). Caelion, avec quatre, portait **sept
> doublons**.

Il avait été dimensionné sans jamais demander ce que les champions savaient
recevoir. La cascade de secours de `ancrerBonus` n'était pas une commodité :
c'était le pansement qui cachait ça.

**4. Il y avait une bonne réponse et dix-huit pièges.**

| 6★ R5 | |
|---|---|
| Répartitions légales | 19 |
| Meilleure (F3/E3/X0) | +46 % de puissance |
| Pire (F1/E2/X3) | +14 % |
| **Écart** | **32 points** |

Plus : **la Résonance 5 n'apportait aucun point** (6 à R4 comme à R5).

Régler les pourcentages n'y aurait rien changé. Le défaut était structurel.

### La refonte

**Le socle passe de 12 nœuds à 6**, dimensionné sur ce que les champions
portent réellement. Résultat : **31 champions sur 32 n'ont plus aucun doublon**
(Caelion en garde un, irréductible : il n'offre que quatre ancrages).

**Le nom d'un nœud est dérivé du bonus réellement retenu**, comme le texte
l'était déjà. « Prise ferme » devient « Fiabilité · Nova de givre » ou
« Puissance · Trait de givre » selon ce que le nœud fait vraiment. Un nom fixe
posé par la branche ne pouvait que mentir ; celui-ci ne le peut plus.

**Chaque champion reçoit trois clés de voûte, et ne peut en allumer qu'une.**
C'est là que vivent l'identité et la décision. Une clé ne donne jamais un chiffre
de plus : elle change la forme du jeu.

| | |
|---|---|
| Clés écrites | **96** (3 × 32 champions) |
| Archétypes | **10** |
| Points d'accroche dans le moteur | **10 — un par archétype, et un seul** |

C'est ce dernier point qui rend 96 clés tenables : il n'y a que dix
comportements à vérifier, tout le reste est de la donnée. Un test l'épingle —
et il a échoué d'emblée, parce que `sacrifice` était lu **trois fois**.

Les dix archétypes : Amorce, Élan, Ferveur, Persistance, Contagion, Sacrifice,
Acharnement, Vampirisme, Égide, Dévouement. Chacun sert entre 5 et 18 champions,
sous un nom et un texte écrits pour chacun d'eux.

### L'échelle de Résonance : cinq paliers, cinq effets de nature différente

| Palier | Ce qu'il apporte |
|---|---|
| R1 | ouvre l'étage II |
| R2 | +1 point |
| R3 | **ouvre la clé de voûte** |
| R4 | +1 point |
| R5 | **la clé coûte 1 point au lieu de 2** |

Ce dernier n'est pas un réglage, c'est ce qui rend l'arbitrage **symétrique** :
au sommet, 6 points pour 6 nœuds de socle et une clé à 1. Prendre tout le socle
ou prendre une clé coûtent exactement le même budget, **et l'on ne peut pas
avoir les deux**. Une version intermédiaire donnait 7 points : le socle complet
en gaspillait un, et la clé devenait de fait obligatoire — j'ai écrit le texte
d'écran avant de mesurer ça, et la mesure m'a contredit.

### Trouvé en chemin : la moitié des malus contourne `debuff()`

En branchant la Contagion, j'ai mesuré **28 appels à `debuff()` contre 28
écritures directes** `.debuffs.X=` dans le moteur — dont **toutes les afflictions
signature** (Givre, Agonie, Corruption, Virulence, Plaie temporelle).

Ce n'est pas seulement gênant pour la Contagion, que j'ai donc branchée sur un
diff avant/après plutôt que sur `debuff()`. C'est surtout que le chemin direct
**contourne trois règles** : la règle spéciale « Volonté de fer », le bonus de
`effectRate` des Empreintes, et le modificateur d'affinité. Autrement dit, un
nœud « Fiabilité » n'agit pas sur la moitié des malus du jeu.

**Je n'ai pas corrigé ça** : router 28 écritures vers `debuff()` est un chantier
à part, avec un vrai risque d'effets de bord sur l'équilibrage. C'est consigné
ici, pas enterré.

### Dévouement était presque mort là où il comptait

Mesure des soins, en part d'une barre pleine : Hicho **96 %**, Yunmei 43–53 %.
Le soin de base de Hicho sature donc systématiquement — un « +20 % de soins »
ne s'exprimait jamais sur lui, alors que c'est à lui que la clé est proposée.

Le Dévouement **convertit désormais le surplus en bouclier** au lieu de le
perdre. La clé est utile partout, et le mécanisme existait déjà dans le jeu
(l'Égide des Mille Marées fait la même chose).

### Deux mutants avaient raison

- **`sacrifice` lu trois fois.** Ma propre promesse — un archétype, une accroche
  — était fausse dès la première version. Le test l'a dit avant moi.
- **La Contagion propageait aussi les malus déjà en place.** Frapper un ennemi
  déjà affligé aurait répandu des malus posés par quelqu'un d'autre, des tours
  plus tôt. Aucun de mes scénarios ne partait d'une cible déjà touchée.

**23 mutants sur 23** au final.

### Couverture

`tests/cles.de.voute.test.js` : 36 tests. Les fichiers `empreintes.test.js`,
`empreintes.vivantes.test.js` et `empreintes.cablage.test.js` ont été remis à
jour sur la nouvelle structure, en gardant leur intention. Suite complète :
**1 589 tests**, 73 fichiers.

### Ce qui reste ouvert

- Les 28 écritures directes de malus (ci-dessus).
- Le désaccord entre `EFFETS_A_JET`/`EFFETS_TEMPORELS`/`EFFETS_A_PUISSANCE` et
  ce que le moteur fait vraiment, relevé en section 19 et toujours là. Il est
  d'ailleurs lié : ces listes décident de `peutRecevoir`, donc des ancrages.

## 21. Pénitence : le soin était calculé, affiché, et invisible

« La Pénitence de Lelianna, j'ai pas l'impression que ça heal. » C'était exact,
et le soin n'était pourtant ni cassé ni oublié : il était **inapplicable à
l'échelle du jeu**.

### La mesure

Boucle réelle, équipe à 30 % de PV, barre de 3 750 :

| | Avant | Après |
|---|---|---|
| Soin de la Pénitence | **34 PV** (0,9 % d'une barre, sur **1** allié) | 2 025 PV (54 %, sur **3** alliés) |
| Dégâts de la Pénitence | 98 | 182 |
| Repère : une brume de Yunmei | 43 % d'une barre | — |

34 PV. Le journal l'affichait, le calcul était juste, et le joueur ne voyait
rien. Ce n'était pas un bug d'application — c'était une règle qui ne pouvait pas
produire un nombre visible.

### Pourquoi c'était structurellement impossible

Elle rendait **35 % des dégâts infligés**. Or dans ce moteur un coup vaut
environ **3 % d'une barre de vie**. 35 % de 3 %, c'est 1 %.

Pour que cette conversion rende ne serait-ce que 25 % d'une barre, il aurait
fallu infliger **4 300 dégâts en un sort** — plus que les points de vie de la
cible. Aucun réglage du pourcentage n'y changeait quoi que ce soit : le rapport
dégâts/PV du jeu interdit cette mécanique.

### Deux autres défauts sortis de la même mesure

**« Frappe trois fois » était purement décoratif.** La boucle de frappe divise
la puissance par le nombre de coups :

```js
for(let i=0;i<hits;i++) hit(target,(skill.power||0)/hits,{...});
```

Trois frappes infligeaient donc exactement autant qu'une. Pénitence est le
**seul sort du jeu** à utiliser ce compteur — personne d'autre n'en dépendait.

**Son ultime frappait moins fort que son attaque de base.** Puissance **.52**
pour un ultime monocible à cinq tours de recharge, contre **.84** pour son
Châtiment sans recharge.

Et son identité promettait « les allié**s** sous Expiation » alors que seul le
Mot de pouvoir la posait, sur **une** cible : « chaque allié » n'a jamais pu
désigner plus d'un allié.

### Le correctif

L'Expiation ne convertit plus des dégâts. **Chaque coup porté par Lelianna rend
6 % des PV maximum aux alliés qui la portent** (8 % en Résonance IV) — donc un
tic par coup, ce qui donne enfin un sens aux trois frappes.

- **Pénitence** applique l'Expiation à **toute l'équipe**, puis frappe trois
  fois : 3 × 6 % = **18 % par allié**. Sa puissance passe de .52 à **.95**.
- **Châtiment** entretient la fenêtre : 6 % par allié, sans recharge, tant que
  l'Expiation tient.

La boucle a maintenant un rythme : l'ultime ouvre la fenêtre, le sort de base
l'entretient deux tours.

### L'équilibrage reste celui d'un soigneur qui frappe

| Sur trois actions | Soins | Dégâts |
|---|---|---|
| Lelianna (Pénitence + 2 Châtiments) | 90 % d'une barre | oui |
| Yunmei (Renouveau seul, cd 5) | **158 %** d'une barre | non |

Yunmei reste très loin devant en soin pur, ce qui est sa raison d'être.
Lelianna soigne moins, étalé sur sa rotation, et frappe en même temps — ce que
son identité annonce depuis le début.

### Un mensonge de plus, corrigé au passage

Le Châtiment annonçait « Inflige des dégâts et **déclenche** Expiation ». Faux :
il ne l'a jamais posée, il soigne ceux qui la portent. Trouvé parce qu'un mutant
qui remettait l'ancien texte survivait — mon assertion se contentait de vérifier
que le mot « Expiation » apparaissait quelque part.

### Un test épingle l'écart entre le texte et le moteur

Le soin passe par `heal()`, qui multiplie par `COMBAT_TEMPO` (2,4). La part
écrite dans le moteur (.025) n'est donc **pas** celle que le joueur voit (6 %).
C'est précisément le genre d'écart qui fait mentir un texte sans que personne
s'en aperçoive : un test mesure la part réellement rendue et la compare aux 6 %
annoncés — et vérifie au passage que le tempo n'a pas bougé.

### Couverture

`tests/lelianna.expiation.test.js` : 17 tests, **10 mutations sur 10 tuées**.
Deux tests de `promesses.conditionnelles.test.js` ont été réécrits : la
condition n'a pas disparu du kit, elle porte désormais sur le Châtiment.
`atonementPenance` rejoint `EFFETS_TEMPORELS` puisqu'il pose enfin l'Expiation.
Suite complète : **1 608 tests**, 74 fichiers.

## 22. Refonte d'interface : pierre et or, et un combat en plein écran

Deux demandes en une : retrouver une ambiance World of Warcraft, et revoir
l'ergonomie des combats.

### Diagnostic

**L'ambiance : il n'y en avait pas.** L'interface était un tableau de bord web
propre mais générique — cartes ardoise, coins arrondis, aplats froids. Aucun
vocabulaire d'heroic fantasy.

Techniquement, la cause était mesurable :

| | Avant | Après |
|---|---|---|
| Variables CSS | **7** (dont 5 pour les effets de sort) | 30 jetons de thème |
| Occurrences de couleurs en dur | **2 459** | 728 |
| Teintes distinctes | 370 | — |

Changer une teinte voulait dire la changer à la main, partout.

**L'ergonomie du combat : quatre défauts chiffrés.**

| | Avant | Après |
|---|---|---|
| Cibles tactiles sous 44 px | **4 sur 13** | **0** |
| Boutons flottants dispersés | **4**, dans 4 coins différents | 0 — une seule barre |
| Texte le plus petit | **6 px** | 8 px |
| Hauteur d'écran prise par le profil et la navigation, **pendant le combat** | **~250 px sur 932 (27 %)** | 0 |
| Hauteur de l'arène | 468 px | **566 px** |

### La palette n'a pas été inventée

Elle a été **extraite du Journal de quêtes** — seul écran du jeu qui portait déjà
l'ambiance : parchemin, sceaux de quête, bordures d'or, titres à empattements.
Elle y était enfermée, en valeurs écrites en dur, pendant que tout le reste
restait en ardoise. Trente jetons (`--pierre-*`, `--bord`, `--or-*`,
`--texte-*`, `--police-titre`, `--biseau`, `--relief`) la rendent disponible
partout, et un test vérifie que chacun sert réellement.

Un second test épingle les huit teintes ardoise d'origine : si l'une revient
dans la feuille, la suite échoue.

### Le combat en plein écran

Le bandeau de profil, les monnaies et la navigation disparaissent tant qu'un
combat tourne, et reviennent pour l'écran de résultat. On quitte par un bouton
explicite avec confirmation — sans quoi il n'y aurait plus de sortie.

**Une découverte en chemin :** j'ai d'abord câblé le mode depuis la mise en
page, sur `battleInProgress` du contexte. Il ne s'est jamais déclenché. Cause :
`setBattle` de l'écran de combat **n'écrit que dans l'état local et ne
synchronise jamais `battleSession`** — donc `battleInProgress` vaut faux pendant
tout le combat. C'est aussi ce qui alimente la carte « COMBAT EN COURS » de la
mise en page, qui est donc muette elle aussi.

Je n'ai pas corrigé cette synchronisation : elle touche à la reprise de combat
sauvegardée, et ce n'était pas le sujet. **C'est la page qui déclare son mode**,
via une classe sur le corps du document, posée et retirée par le même effet.
Le défaut de synchronisation reste ouvert et consigné ici.

### Trois corrections nées de la mesure, pas de l'œil

- **Les 250 px libérés restaient un trou.** L'arène ne gagnait que 15 px : la
  grille ne s'étirait pas. Il a fallu le dire explicitement.
- **Mon plancher de lisibilité a cassé les noms.** En passant le texte à 8 px
  minimum, la pastille de niveau s'est élargie et la réserve laissée à droite
  a réduit « Thorgar » à « T… » sur une carte de 109 px. Corrigé en deux temps :
  la pastille ne porte plus que le nombre (le libellé passe dans l'infobulle),
  et le nom est empilé sous le portrait — ce qui est aussi plus proche d'un
  cadre d'unité.
- **Les deux camps se ressemblaient.** Ils portent désormais des teintes
  distinctes, rouge sombre contre vert sombre.

### Deux fois où mon test lisait la mauvaise règle

Mon assistant de test prenait la **première** occurrence d'un sélecteur — donc
l'ancienne règle, pas ma surcharge de fin de feuille. Corrigé en visant la
dernière… ce qui a cassé deux autres assertions, parce que la dernière règle
d'un sélecteur n'est pas forcément celle qui **traite la propriété** visée.
La version finale cherche la dernière règle qui parle de la propriété.

Ce détour a révélé un vrai point : sous 620 px, `.hud-bouton` perd son
`min-width`. C'est volontaire — les commandes s'étirent alors pour remplir la
barre — mais le test l'exige désormais explicitement, faute de quoi elles
rétréciraient sous la cible tactile.

### Vérification en jeu

À 430 px et 1440 px : plein écran actif, **0 cible sous 44 px**, noms entiers,
aucun débordement horizontal, aucune erreur console. La sortie par le bouton
affiche bien la confirmation, et quitter restaure le bandeau et la navigation.

### Couverture

`tests/interface.ambiance.test.js` : 16 tests, **13 mutations sur 13 tuées**.
Suite complète : **1 635 tests**, 76 fichiers.

### Ce qui reste ouvert

- La synchronisation `battleSession` (ci-dessus), qui rend `battleInProgress`
  et la carte « COMBAT EN COURS » inopérants.
- 728 couleurs restent écrites en dur : ce sont des teintes locales assumées
  (raretés, éléments, dégradés ponctuels), mais la charpente passe par les
  jetons — un test vérifie que les `var(--…)` sont plus nombreux qu'elles.

### Correctif 1.77.1 — le libellé « AFFINITÉS » sortait de son bouton

Signalé aussitôt par le joueur. Mesure :

| Largeur d'écran | Bouton | Libellé « AFFINITÉS » |
|---|---|---|
| 430 px | 74 px | **72 px** — déborde |
| 360 px | 60 px | **72 px** — déborde franchement |

Cause : sous 620 px, `.hud-bouton{flex:1 1 0}` donnait à **tous** les boutons la
même largeur, alors que les libellés vont de 15 px (« x1 ») à 72 px. Le plus
long ne pouvait pas tenir.

La correction n'est pas de raccourcir le mot : en laissant chaque bouton prendre
sa largeur (`flex:0 1 auto`), le total ne fait que **310 px pour 410
disponibles** à 430 px, et tient encore à 360 px. Plus aucun débordement aux
trois largeurs mesurées. Le libellé reste borné par sécurité, et chaque commande
porte désormais un nom accessible complet, puisque le texte visible est court.

**Deux mutants avaient d'abord survécu** — ils mutaient en réalité
`.team-prep-presets`, qui porte les mêmes propriétés plus haut dans la feuille.
Rejoués sur la bonne règle : 4 sur 4. C'est la troisième fois de cet audit qu'une
ancre de mutation ambiguë fait douter d'un test qui, lui, fonctionnait.

---

## 1.78.0 — L'arène pixel art, un prototype qu'on peut juger sur pièce

Question posée : *quel moteur permettrait de faire de plus belles animations, et
le combat en pixel art ?* J'avais répondu PixiJS et proposé de le prototyper
plutôt que de l'affirmer. Voici la pièce.

### Ce qui a été construit

Un écran d'essai (Paramètres → « Ouvrir l'arène d'essai ») où le **vrai moteur
de combat** joue, rendu par PixiJS : `createBattle`, `nextTurn`,
`performAutoAction` et `enemyAction`, sans la moindre simulation d'affichage.
Les dégâts affichés sont lus en comparant les points de vie avant et après
l'action — s'ils devaient mentir, autant ne rien montrer.

Trois pièces, volontairement étanches :

| Fichier | Rôle | Ce qu'il ignore |
|---|---|---|
| `outils/generer-sprites.mjs` | dessine les sprites, encode les PNG, écrit l'atlas | tout le reste |
| `src/pixi/arene.js` | rendu, animations, chiffres flottants | React **et** le moteur de combat |
| `src/components/ArenePixi.jsx` | montage, démontage, panne WebGL | le dessin |

Cette étanchéité n'est pas de la coquetterie : elle permet de tester l'arène
sans React et React sans WebGL, et elle rend les sprites remplaçables par de
vrais dessins sans toucher au moteur de rendu — seul `atlas.json` changerait.

### La direction artistique demandée

Lisibilité « Disney pixel RPG » posée sur le vocabulaire d'armure de WoW. Trois
règles techniques la portent :

1. **Contour noir déduit, pas dessiné.** Le dessin remplit un masque de
   *matières* ; le rendu marque en noir toute matière voisine du vide et éclaire
   ou assombrit selon une lumière en haut à gauche. Le relief vient donc du
   volume, sans placer un pixel de contour à la main.
2. **L'élément ne teinte que le tissu, la cape et l'énergie.** L'acier, l'or, la
   peau et l'os restent constants : c'est ce qui tient les six variantes
   ensemble au lieu d'en faire six monochromes.
3. **Deux volumes voisins ne partagent jamais la même matière**, et les membres
   sont séparés du tronc par une colonne de vide.

La règle 3 vient d'un échec : la première version faisait fusionner les
épaulières, les bras et le tronc en une seule tache grise, et le monstre
ressemblait à un robot. Le contour ne se déclenchant que contre le vide, deux
pièces d'acier collées n'ont aucune frontière. Les épaulières sont passées en
or, les membres du monstre dans une chair plus sombre.

### Ce que la mesure a dit — et ce qu'elle ne dit pas

Images par seconde, sous bridage CPU émulé, trois champions contre trois
ennemis :

| Bridage CPU | Relevés | IPS médian | min | max |
|---|---|---|---|---|
| ×1 | 8 | **60** | 60 | 60 |
| ×4 | 8 | **60** | 60 | 61 |
| ×6 | 8 | **60** | 30 | 60 |

**Ce que ces chiffres ne prouvent pas**, et je préfère l'écrire que le laisser
supposer : la mesure tourne sur un rendu logiciel (SwiftShader) piloté par un
processeur de serveur bridé. Cela émule un processeur lent, **pas** un GPU de
téléphone ni la chauffe. Six sprites de 48 px sont par ailleurs une charge
légère. Ce tableau dit « rien n'indique un problème de fluidité » ; il ne dit
pas « ça tournera à 60 sur ton téléphone ». Seul ton appareil le dira.

Point acquis en revanche, et vérifié au paquet : **PixiJS n'entre pas dans le
bundle principal**. Il forme un morceau séparé de 312 ko (98 ko compressés)
chargé à l'ouverture de l'arène et nulle part ailleurs.

### Une couleur qu'il aurait été facile de mentir

À l'écran, les trois ennemis sortent tous en arcane. J'ai d'abord cru à un bug
de rendu et écrit un repli qui dérivait une couleur du nom de l'ennemi — de la
variété gratuite. C'était faux, et pire : malhonnête.

`normalizeElement` rabat **tout élément inconnu sur Arcane**, et ni
`enemies.js` ni `campaign.js` ne déclarent d'élément. Les ennemis de la campagne
sont donc réellement tous arcane. La conséquence dépasse le rendu : **l'affinité
élémentaire n'a aucun effet sur toute la campagne**, sauf pour un champion Ombre
ou Lumière. Les boss, le mythique, les défis et le tutoriel, eux, déclarent bien
leurs éléments.

Le repli a été retiré. La teinte suit l'élément, elle ne l'invente pas : la
couleur annonce une affinité au joueur, un ennemi peint en rouge qui ne brûle
pas serait un mensonge à l'écran.

### Couverture

`tests/arene.pixels.test.js` (42 tests) juge les **pixels réellement écrits**,
pas l'intention du code : aucun cadre vide, rien qui déborde du cadre, et la
silhouette d'un seul tenant. `tests/arene.contrats.test.js` (11 tests) garde ce
qui ne se voit pas — dont le filtrage au plus proche voisin, seule régression
capable d'annuler toute la direction artistique sans provoquer la moindre
erreur.

**Le test a trouvé un défaut que mon œil avait laissé passer** : les pieds des
six monstres sortaient du cadre au dernier cadre de mort. Corrigé.

**11 mutants sur 11 tués**, mais après deux faux départs qui valent d'être
notés :

- Un mutant a survécu en remplaçant `performAutoAction` — il mutait en réalité
  la **ligne d'import**, et mon test se contentait de chercher le *nom* dans le
  fichier. Le test exige désormais l'appel. C'est une vraie faiblesse, trouvée
  par une mauvaise mutation.
- Deux mutations censées « détacher » un bras puis les cornes ont survécu parce
  qu'elles ne détachaient rien : les pièces restaient adjacentes d'un pixel.

**Limite assumée de l'instrument** : le comptage des morceaux attrape une pièce
réellement séparée, pas une pièce qui *semble* détachée tout en restant collée
d'un pixel — le défaut des cornes, lui, ne se voyait qu'à l'œil. Aucun test ne
remplace le fait de regarder les sprites.

Suite complète : **1 690 tests**, 78 fichiers.

### Ce que ce prototype ne fait pas

Il ne remplace pas l'écran de combat. Il ne gère ni les compétences ciblées à la
main, ni les effets visuels de sorts, ni les vagues, ni les récompenses. C'est
délibéré : la question était « est-ce que ça vaut le coup », pas « remplaçons
tout ce soir ». Les sprites sont générés par script et provisoires — leur seul
mérite est de prouver que la chaîne complète tient, du pixel jusqu'à l'écran.

---

## 1.79.0 — Les vrais dessins entrent dans le jeu

Verdict du joueur sur mes sprites générés : *« ça ne me plaît pas »*. Il avait
raison, et je peux maintenant dire de combien.

### L'écart, mesuré plutôt que supposé

| | Personnage | Palette |
|---|---|---|
| Mes sprites générés | 30×41 pixels d'art | **31 teintes** |
| Référence « paladin WoW » | ~30×51 | **108 teintes** |
| Référence Disney Pixel RPG | — | **364 teintes** |

Un facteur trois à douze sur la richesse chromatique. Aucun réglage de mon
générateur ne comble ça : des rectangles empilés avec trois tons par matière ne
deviennent pas du pixel art dessiné à la main. Le plafond n'était pas dans les
réglages, il était dans la méthode.

*(Note d'instrument : ma détection de grille a d'abord renvoyé n'importe quoi —
elle butait sur le bruit JPEG. La deuxième version, qui cherche le contraste
entre l'intérieur et la frontière des blocs, tient sur le paladin — ×23,
mesuré — mais pas sur l'image Disney, une capture vidéo redimensionnée en
non-entier. Les 364 teintes sont donc mesurées par moyennage de tuiles, pas par
lecture de grille. Je préfère le dire que laisser croire à une précision que je
n'ai pas.)*

### Ce qui a changé la donne

Le joueur a fourni une **feuille de personnage complète** pour Lelianna :
portrait en pied, palette, et surtout des rangées d'animation étiquetées —
idle, marche, attaque, soin, effets de sorts, portraits, KO. Le travail n'est
donc plus de dessiner, mais d'**importer**. C'est un travail que je sais faire
correctement.

### La chaîne construite

| Outil | Rôle |
|---|---|
| `outils/png.mjs` | décodage et encodage PNG complets, sans dépendance (les cinq filtres de ligne, les types de couleur usuels) |
| `outils/decouper-feuille.mjs` | détoure, trouve les îlots, les groupe en rangées, sort un aperçu annoté |
| `outils/importer-champion.mjs` | extrait les cadres retenus et écrit l'atlas du champion |

**Résultat sur Lelianna, sans aucun réglage manuel** : 45 cadres, 6 rangées,
12 libellés écartés tout seuls, 1 hors-gabarit (le portrait en pied) reconnu
comme tel.

Trois décisions techniques portent le résultat :

1. **Le fond est détouré par remplissage depuis les bords**, pas par un test de
   couleur. Un « tout ce qui est noir devient transparent » perce les contours
   et les parties sombres du personnage ; un noir *enfermé* dans la silhouette
   n'est jamais atteint par le remplissage, donc il survit.
2. **L'art n'est jamais rééchantillonné.** Les rangées d'une feuille sont
   dessinées à des échelles différentes — chez Lelianna l'idle fait deux fois
   la taille de l'attaque. Uniformiser en redimensionnant détruirait le pixel
   art. On garde les cadres à leur taille native et on enregistre un facteur
   d'échelle **par animation**, appliqué au moment du rendu, en filtrage au
   plus proche voisin. Sans ce recalage à chaque changement d'animation, le
   champion grandit en attaquant.
3. **Le seuil qui sépare un libellé d'un sprite est mesuré**, pas deviné : sur
   cette feuille les titres montent à 48 px, la plus petite pièce d'animation
   en fait 63.

### Une heuristique retirée, et pourquoi

J'avais écrit un recollage automatique des fragments — pour rattraper le bâton
qui se détache au KO. Il chaînait le portrait en pied jusqu'aux rangées
voisines et **soudait la feuille entière en un seul bloc** : 1 cadre, 1 rangée.
Je l'ai retiré plutôt que de le rafistoler. Une pièce isolée perdue vaut mieux
qu'un découpage qui s'effondre en silence ; les rares cas se traitent en trois
lignes de config.

### Couverture

`tests/import.champion.test.js` : 18 tests. **7 mutants sur 7 tués**, mais la
première passe n'en tuait que 3, et les trois survivants étaient de vraies
faiblesses :

- Le prédicteur **Paeth** pouvait être cassé sans qu'un test bronche : mon
  aller-retour n'utilisait que le filtre 0, celui que mon propre encodeur
  écrit. Les feuilles viennent d'outils tiers et utilisent les cinq. Le test
  encode désormais lui-même, filtre par filtre, et exige l'octet près.
- Le type de couleur **RGB sans alpha** n'était testé nulle part.
- Le test de détourage se contentait de vérifier qu'il restait des pixels
  sombres dans le sprite — ce qui passe **aussi quand rien n'est détouré**. Il
  exige maintenant les deux : du transparent autour, du plein dedans.

Suite complète : **1 708 tests**, 79 fichiers.

### Où ça en est

Lelianna se bat dans l'arène, en vrai pixel art dessiné, à côté de mes sprites
générés — la comparaison est sans appel et c'est très bien ainsi. Le placement
a dû être repris deux fois : les feuilles dessinées sont trois fois plus larges
que les sprites générés, si bien que le premier champion sortait du cadre, puis
passait derrière son voisin. Les unités sont désormais réparties d'après leur
largeur **mesurée**, pas tous les 96 pixels.

Le format attendu pour le reste du roster est documenté dans
`assets-source/README.md` — et il tient en une phrase : fond noir uni, une
animation par rangée, des cadres qui ne se touchent pas, et du PNG plutôt que
du JPEG.

### 1.79.1 — Hicho : la chaîne tient sur une deuxième feuille

Le vrai test d'un pipeline, c'est le deuxième cas. La feuille d'Hicho est plus
riche que celle de Lelianna : trois icônes de sort encadrées, trois totems, deux
sorts nommés (Chaîne d'éclair, Soin), une rangée de particules, et des libellés
**dans des boîtes** au lieu de simple texte.

Elle est passée **sans modifier une ligne de code** : 55 cadres, 7 rangées,
16 libellés écartés seuls, le portrait en pied reconnu comme hors-gabarit. Dix
animations extraites, dont les icônes de sort et les totems, utilisables plus
tard dans l'interface.

Une seule chose a demandé un ajustement, et c'est un défaut de la feuille, pas
du code : la boîte du libellé « Idle / Repos » **touche** la première pose. Les
deux ne forment qu'un seul îlot ; ce cadre a été écarté (il en reste quatre) et
la consigne est passée dans `assets-source/README.md`.

Une seule fonctionnalité ajoutée : `"echelle": 1` pour les rangées qui ne sont
pas des personnages. Ramener une icône de sort à la hauteur du champion n'a
aucun sens.

**Les tests parcourent maintenant l'index des champions** : toute feuille
importée est couverte sans qu'on touche au fichier de test. Deux contrôles
nouveaux, tous deux nés de mutants survivants :

- **Un fragment détaché n'est plus accepté comme cadre.** Le bâton isolé
  (29×53) passait tous les contrôles existants — ni vide, ni hors cadre. Seule
  sa taille le trahit. La règle ne s'applique qu'aux animations *cycliques*
  (repos, marche, attaque), où toutes les poses se ressemblent : la mort et le
  soin changent de silhouette pour de bon. Seuil mesuré sur les deux feuilles —
  le plus mauvais ratio cyclique réel est 0,78, le fragment tombe à 0,49, le
  seuil est à 0,65. Un seuil à 0,50 aurait tenu à un pixel près : inutilisable.
- **Les échelles fixées par la config sont vérifiées.** Les ignorer ne cassait
  aucun test.

Ajouté aussi : une feuille rattachée à un `heroId` inexistant est refusée. Elle
ne se serait jamais affichée, et rien ne l'aurait signalé à l'exécution.

**5 mutants sur 5 tués** (3 sur 5 à la première passe). Suite complète :
**1 722 tests**, 79 fichiers.

### 1.79.2 — L'arène était introuvable

Signalé par le joueur : *« je ne vois pas l'onglet arène pour essayer »*.

Il avait raison, et c'était une faute de ma part. J'avais mis l'accès dans une
carte des **Paramètres, placée après la zone d'effacement de sauvegarde** —
l'endroit le moins consulté de toute l'application. Pire : j'avais annoncé cet
emplacement dans deux notes de patch comme si c'était un choix.

Une page inatteignable n'existe pas. L'arène a maintenant **son propre onglet**
dans la barre de navigation (🎬 Arène), sans niveau d'Invocateur requis. La
carte des Paramètres a été retirée : elle faisait double emploi, et la page
porte déjà son propre avertissement.

Vérifié dans un navigateur en **cliquant réellement sur l'onglet**, pas en
forçant la page par `sessionStorage` comme le faisaient mes sondes précédentes.
C'est exactement ce qui m'avait empêché de voir le problème : toutes mes
vérifications entraient dans l'arène par la porte de derrière.

Quatre tests garantissent l'accès et la lisibilité : l'onglet existe, il n'est
verrouillé derrière aucun niveau, il pointe sur une vraie page, et la scène se
resserre sur petit écran.

**Corrigé au passage** : sur un écran de 420 px, les 960 pixels logiques de la
scène étaient écrasés dans 380 px et les champions devenaient illisibles — or
c'est précisément ce qu'on vient regarder. La scène passe à 520×360 sous 700 px
de large : on réduit le décor, pas les personnages.

Suite complète : **1 726 tests**, 79 fichiers.

### 1.79.3 — L'erreur qui ne disait pas quoi faire

Le joueur, après avoir récupéré la branche :
`Failed to resolve import "pixi.js" from "src/pixi/arene.js"`, au milieu d'une
pile d'appels de trente lignes pointant dans `node_modules/vite`.

Ce n'était pas un bug du code. `pixi.js` et `vitest` sont deux dépendances
ajoutées depuis `main` ; elles figurent bien dans `package.json` **et** dans
`package-lock.json` avec leur empreinte d'intégrité — vérifié. Il manquait
simplement un `npm install` après le `git pull`.

Mais l'erreur ne le disait nulle part. Elle désignait un fichier source
parfaitement correct, sur une ligne parfaitement correcte. C'est le genre de
message qui fait chercher au mauvais endroit pendant vingt minutes.

**`npm run dev` contrôle désormais les dépendances avant de démarrer** et
s'arrête sur une phrase :

```
  Dépendances manquantes : pixi.js
  Elles ont été ajoutées depuis ta dernière installation.

     npm install
```

Le contrôle a été validé **en reproduisant la panne** — `pixi.js` réellement
retiré de `node_modules`, message obtenu, dépendance remise. Il ne bloque que
pour ce motif : un manifeste illisible ou absent le fait s'effacer en silence
plutôt qu'empêcher de travailler, et c'est testé.

**Écrit aussi le README racine**, qui ne contenait qu'une ligne (`# Azerune`)
alors que le dépôt compte plus de quarante fichiers `README-v*` de notes de
version. La consigne qui aurait évité tout ceci y tient maintenant en gras :
après un `git pull`, relancer `npm install`.

Suite complète : **1 732 tests**, 80 fichiers.

## 1.80.0 — Les sorts : du moteur à l'écran

Demande du joueur : *voir comment les sorts, les animations et les dégâts se
lient*. Il ne voulait pas une démonstration, il voulait le câblage.

### Combat jouable dans l'arène

L'arène n'est plus une boucle automatique qu'on regarde. À son tour, un
champion présente ses **vraies compétences** — nom, icône, rechargement — on en
choisit une, puis une cible, et `castSkill` tranche. Les ennemis jouent seuls ;
une case « Automatique » rend la main au moteur pour les alliés aussi.

Le moteur reste seul juge. Quand il refuse une action, son message s'affiche
tel quel plutôt que d'être contourné : un test le vérifie.

### La liaison, déclarative

Une compétence est reliée à son animation et à ses effets dans le fichier du
champion, `outils/feuilles/<nom>.json` :

```json
{"anim":"attaque","effets":[{"source":"effets","index":1,"ou":"projectile"}]}
```

`ou` vaut `lanceur`, `cible`, `cibles` ou `projectile`. L'importeur recopie
cette liaison sans l'interpréter : changer l'effet d'un sort ne demande jamais
de toucher au code. Les effets eux-mêmes sortent de la feuille du champion —
c'est SON dessin qui voyage, jamais un rectangle générique.

Résultat sur les deux champions dessinés :

| Champion | Compétence | Animation | Effet |
|---|---|---|---|
| Lelianna | Châtiment | `attaque` | comète dorée, en projectile |
| Lelianna | Mot de pouvoir : Bouclier | `soin` | croix de lumière sur la cible |
| Lelianna | Pénitence | `attaque` | phénix sur elle, éclat sur la cible |
| Hicho | Vague de soins | `soin` | tourbillon vert sur la cible |
| Hicho | Totem guérisseur | `soin` | totem Kyrian sur lui |
| Hicho | Marée ancestrale | `soin` | esprit-renard sur lui, tourbillon sur chaque allié |

Les champions sans feuille dessinée gardent leur animation d'attaque et aucun
effet — ce que l'arène annonce plutôt que de le masquer.

### Ce que l'arène dit d'elle-même

Chaque action laisse une ligne : **qui, quelle compétence, quelle animation,
quels effets, combien de cibles, en combien de millisecondes**. Un effet
demandé mais introuvable y apparaît en rouge, au lieu de ne rien afficher.

Ce n'était pas prévu comme fonctionnalité — je l'ai écrit pour me débloquer,
puis gardé, parce que c'est exactement ce que le joueur demandait à voir.

### Trois instruments menteurs, dans la même séance

Le rendu marchait. J'ai passé l'essentiel du temps à le croire cassé.

1. **Un compteur de pixels qui renvoyait zéro au repos.** Relire un canevas
   WebGL par `drawImage` hors de la boucle de rendu donne une image vide —
   le tampon n'est pas conservé. Mesure inutilisable, et elle « prouvait »
   l'absence d'effet.
2. **Une ligne d'affichage écrasée.** La liaison ne montrait que la dernière
   action ; les ennemis jouant aussitôt après, je lisais leur ligne en croyant
   lire celle du joueur. C'est ce qui a transformé la ligne en historique.
3. **Des captures systématiquement en retard.** Chaque capture Playwright coûte
   du temps ; une rafale de huit arrive toujours après un sort de 440 ms. Tous
   mes clichés montraient l'après-coup — le chiffre de dégâts déjà posé, le
   projectile déjà détruit.

Ce qui a tranché : faire **tracer au sprite sa propre position** en vol.
Réponse : `x334 y211, opacité 1.00, 140×109 px, attaché à l'affichage, scène
960×420`. Il était à l'écran depuis le début. La trace a été retirée une fois
sa démonstration faite. L'image, elle, a fini par être prise avec un
enregistrement d'écran continu, qui n'a pas ce coût par image.

### Couverture

`tests/sorts.arene.test.js` : 19 tests, **9 mutants sur 9 tués**. Le contrôle
qui compte le plus : **un effet lié doit exister dans la feuille**. Un index
hors bornes ne provoque aucune erreur à l'exécution — l'effet ne s'affiche
simplement jamais, et rien ne le signalerait. Sont vérifiés de la même façon :
une animation absente de la feuille, une source d'effet inconnue, un placement
non géré, et une compétence sans effet.

Un test existant a rattrapé une régression que j'avais introduite : ma
réécriture de la page avait supprimé l'avertissement sur les sprites
provisoires. Il est revenu, corrigé : les champions dessinés ne sont plus
provisoires, les générés le restent.

Suite complète : **1 751 tests**, 81 fichiers.

### Ce qui reste ouvert

- Les trois coups de Pénitence sont joués comme un seul : `coups: 3` est
  déclaré dans la liaison mais le rendu ne le lit pas encore.
- Les compétences qui ne touchent aucun point de vie (un bouclier pur) placent
  leur effet sur la cible désignée, faute de mieux : le moteur n'expose pas la
  liste des unités affectées autrement que par comparaison d'états.
