# Proposition — Le Sablier d'Azerune

Une mécanique de pression pour le Mythic+, inspirée du chrono de WoW mais
traduite pour le tour par tour, et branchée sur des systèmes que le jeu possède
déjà.

Tous les chiffres qui suivent sont **mesurés** par simulation de combats réels
(moteur du jeu, IA AUTO, 16 graines par point).

---

## Le principe

**Un budget de 80 tours, partagé par les quatre vagues.**

Pas un budget par vague : un seul sablier pour toute la course. Les tours passés
sur la première vague sont autant de tours en moins face au boss.

Quand le sablier se vide, le combat ne s'arrête pas — **l'Effondrement**
commence : chaque tour au-delà du budget augmente l'Attaque ennemie de
**+5 %**, cumulativement. Rien n'est perdu d'un coup ; la mort devient
progressivement inévitable si l'écart de puissance est réel.

---

## Pourquoi 80 tours

Le nombre de tours nécessaires est remarquablement **stable d'un palier à
l'autre**, à équipement relatif égal :

| Équipement du joueur | M+1 | M+10 | M+20 | M+30 |
|---|---|---|---|---|
| 0,9× du recommandé | — | 110 | 107 | 85 |
| 1,1× | 105 | 85 | 85 | 71 |
| 1,4× | 78 | 60 | 71 | 51 |
| 1,8× | 54 | 52 | 53 | 42 |

Un budget **unique et non indexé au niveau** suffit donc. C'est un avantage :
le joueur retient un seul nombre, valable partout, et la lisibilité d'une
mécanique de pression compte autant que son réglage.

À 80 tours, la coupure tombe exactement entre « correctement équipé » (1,4× →
51 à 78 tours, passe) et « juste à la limite » (1,1× → 71 à 105 tours, ça se
joue).

---

## Pourquoi +5 % par tour

Mesuré sur le Mythic+ 20, budget 80 tours, taux de victoire :

| Pente | 0,8× sous-équipé | 1,0× à la limite | 1,2× correct | 1,5× confortable |
|---|---|---|---|---|
| **aucune (aujourd'hui)** | **100 %** | **100 %** | 100 % | 100 % |
| +4 % / tour | 0 % | 94 % | 100 % | 100 % |
| **+5 % / tour** | **0 %** | **~75 %** | **100 %** | **100 %** |
| +6 % / tour | 0 % | 56 % | 100 % | 100 % |
| +9 % / tour | 0 % | 38 % | 100 % | 100 % |

La pente est le curseur de difficulté :

- **+4 %** — indulgent : on n'échoue qu'en étant nettement sous-équipé ;
- **+6 %** — exigeant : à la puissance exactement recommandée, c'est une pièce
  qu'on lance.

**+5 % est le réglage proposé.** Il crée un vrai échec là où il n'y en avait
aucun, sans punir le joueur qui a fait le travail.

### Le point important

À 1,2× et au-dessus, la course se termine en **77 tours** — sous le budget. Un
joueur correctement équipé **ne voit jamais l'Effondrement**. La mécanique reste
invisible tant qu'on n'est pas en difficulté, exactement comme le chrono de WoW
pour un bon groupe.

---

## Ce qui la rend propre à Azerune

Trois écarts volontaires avec un simple chrono.

### 1. Le budget est partagé, donc c'est un choix de rythme

Passer quatre tours à installer Poison et Agonie sur la première vague est un
investissement : ces quatre tours manqueront au boss. À l'inverse, expédier les
petites vagues sans préparation laisse du sable pour la fin.

C'est la décision d'itinéraire du Mythic+ de WoW, transposée au tour près.

### 2. Le sable restant devient de la récompense

Plutôt qu'un palier binaire, la fin de course convertit les tours économisés :

| Tours utilisés | Résultat |
|---|---|
| ≤ 55 | **Sablier parfait** — butin de qualité supérieure garantie |
| 56 à 80 | **Sablier tenu** — récompense pleine |
| > 80 | **Effondrement** — course validée si vous survivez, récompense réduite |

Le seuil de 55 correspond à la performance mesurée d'une équipe à 1,8×, soit un
vrai surinvestissement ou un jeu très propre. Il reste atteignable sans être
banal.

C'est l'équivalent continu du +1 / +2 / +3 de WoW, sans introduire de système de
clé.

### 3. Les kits de contrôle de jauge deviennent enfin des choix premium

C'est l'argument le plus fort en faveur de cette mécanique plutôt qu'un enrage
classique.

Azerune possède déjà des compétences qui retirent de la jauge aux ennemis ou en
donnent aux alliés : la Traque de Kaelen, l'Ancrage de Caelion, le Reflux de
Nerissa, la Marée basse de Maerys, le Pas fantôme de Vaeloria.

Aujourd'hui, ces effets sont marginaux : puisqu'on ne peut pas perdre, retarder
un ennemi n'a pas de valeur. **Sous un budget de tours, chaque tour refusé à
l'adversaire est du sable économisé.** Ces champions passent de gadget à pilier,
sans qu'une seule de leurs compétences soit modifiée.

Un enrage classique, lui, ne récompenserait que les dégâts bruts.

---

## Esquisse d'implémentation

Le moteur possède déjà tout ce qu'il faut : le Raid compte les actions de
champions et déclenche son enrage à 40 (`raidState.championActions`,
`raidState.enrageAt`, `raidState.enraged`).

1. **Compter** — `createBattle` initialise déjà `mythic`. Ajouter à côté un
   `mythicState:{turns:0, budget:80, collapsed:false}`.
2. **Décompter** — dans `nextTurn`, incrémenter `turns` à chaque action, sans
   remise à zéro entre les vagues : `advanceMythicWave` conserve `mythicState`
   comme il conserve déjà `affixState.ids`.
3. **Effondrer** — au calcul des dégâts, appliquer
   `1 + 0.05 * max(0, turns - budget)` à l'Attaque ennemie. C'est le même point
   d'entrée que le facteur `raging` de l'affixe Déchaîné.
4. **Afficher** — le sablier restant à côté du compteur de vagues. Une pression
   invisible ne pèse sur personne.
5. **Récompenser** — `finishMythicMission` reçoit déjà la mission ; lui passer
   les tours utilisés pour choisir le palier de butin.

Aucun nouveau système : le compteur d'actions, le facteur multiplicatif sur
l'Attaque et la persistance d'état entre vagues existent tous.

---

## Réglages à surveiller après mise en service

- **Le budget de 80 tours** est calé sur une équipe de quatre 5★ maximisés. Une
  équipe plus modeste sur un palier bas prendra plus de tours : vérifier que
  M+1 à M+5 restent accessibles aux joueurs qui viennent d'y accéder.
- **La pente de 5 %** peut être différenciée par palier — par exemple 4 % en
  dessous de M+10, 5 % ensuite, 6 % à partir de M+25 — si l'on veut que la
  pression monte avec le contenu.
- **Le seuil de 55 tours** du Sablier parfait mérite d'être revu après quelques
  semaines de données réelles : il doit rester exigeant sans devenir la norme.

---

## En une phrase

Le Mythic+ n'est aujourd'hui pas difficile, il est long. Le Sablier échange
cette longueur contre de la tension, récompense l'efficacité plutôt que
l'endurance, et donne enfin une raison de jouer les champions qui manipulent la
jauge.
