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
