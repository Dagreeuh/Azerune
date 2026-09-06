# Audit général — état du projet et couverture du roster

*Toutes les conclusions ci-dessous viennent de mesures faites sur le code livré :
compositions jouées par le vrai moteur, avec de vrais personnages équipés par
les tables du jeu. Les affirmations non mesurées sont signalées comme telles.*

---

# Partie 1 — Défauts trouvés et corrigés dans cette passe

## 1. Plantage du moteur en Raid

**Gravité : haute — le combat s'interrompt.**

```js
}else if(actor.raidRole==='priest'&&cooldowns[0]===0){
  const boss=enemies.find(unit=>unit.raidRole==='boss'&&!unit.dead);
  const heal=Math.round(boss.maxHp*.08);   // ← boss peut être undefined
```

Le Prêtre des flammes soigne le boss. Si le boss meurt avant lui — c'est-à-dire
si le joueur concentre ses dégâts sur le boss, ce que fait tout le monde — le
prêtre survivant cherche un boss vivant, n'en trouve aucun, et lit `maxHp` sur
`undefined`. Le moteur lève une exception au milieu du combat.

Les branches voisines (cristaux d'Expédition) vérifient toutes la présence de
leur boss avant d'agir. Celle-ci l'avait oublié. Le prêtre attaque désormais
normalement quand il n'a plus personne à soigner.

Ce défaut a été trouvé en faisant jouer 1 500 compositions au moteur : aucun
test ne l'aurait révélé, et aucune lecture non plus.

## 2. La Précision réduite ne réduisait rien

**Gravité : moyenne — une mécanique de zone annoncée et absente.**

La zone **Œil-Clair** (4ᵉ continent) applique `accuracyDown` et écrit dans le
journal de combat « brouille la vision : Précision réduite ». Le malus était
posé sur l'unité, et **lu nulle part** :

```js
const debuffChance=(actor,target,base,mastery)=>
  clamp(base+mastery+(actor.accuracy||0)/100-(target.resistance||0)/100,.15,.95);
```

La formule lit la statistique brute. Le malus n'avait aucun effet, n'était pas
affiché, et le joueur ne pouvait donc ni le constater ni s'en protéger. Il
divise maintenant réellement la Précision du lanceur par 0,65.

C'est le même défaut que `rempart-anciens` : une moitié écrite, l'autre pas.

## 3. Six effets invisibles, et un effet fantôme dans la légende

**Gravité : moyenne — le joueur subit des mécaniques qu'il ne peut pas voir.**

Un balayage croisant « effets appliqués par le moteur » et « effets nommés dans
la barre d'état » a donné :

| Effet | Appliqué | Affiché | Conséquence |
|---|---|---|---|
| `necrotic` | oui | **non** | Affixe Mythic+ dont la description promet « jusqu'à 5 cumuls » — cumuls invisibles |
| `mythicBolster` | oui | **non** | Affixe Galvanisant, +8 % ATQ/DEF par cumul — invisible |
| `raidEnrage` | oui | **non** | L'enrage du boss de raid n'apparaît que dans le journal |
| `healingDown` | oui | **non** | Soins reçus réduits de 40 % |
| `raidHealingDown` | oui | **non** | Soins reçus réduits de 30 % pendant l'enrage |
| `accuracyDown` | oui | **non** | Voir point 2 |
| `accuracyUp` | **non** | oui | Entrée morte : rien dans le jeu ne l'accorde |

Les six premiers sont désormais nommés et affichés ; le septième est retiré.
Deux d'entre eux — Nécrose et Galvanisant — sont des affixes dont la
description **promet explicitement un cumul** au joueur : un cumul invisible ne
se joue pas.

---

# Partie 2 — Le roster a-t-il les outils pour finir le jeu ?

## Le roster

26 champions : **9 en 3★, 7 en 4★, 10 en 5★**.

| Élément | Nature | Ombre | Lumière | Feu | Eau | Arcane |
|---|---|---|---|---|---|---|
| Champions | **8** | 5 | 4 | 3 | 3 | 3 |

## Réponse courte : oui, et aucun outil n'est enfermé derrière le gacha

Le jeu vérifie lui-même six capacités avant chaque combat
(`assessTeamForMission`). Toutes les six sont disponibles **parmi les neuf
champions 3★** :

| Capacité | Champions 3★ qui la fournissent |
|---|---|
| Soins | Sylven |
| Purification | **Sylven — seul du roster entier** |
| Bouclier | Thorgar, Aurelis |
| Contrôle | Brom, Vexil, Nerissa |
| Malus | Malvek, Brom, Sylven, Korga |
| Dégâts de zone | Brom, Malvek, Vexil, Nerissa |

**Aucune capacité n'exige un 4★ ni un 5★.** Un joueur qui n'obtient jamais une
seule invocation chanceuse dispose de tout ce que le jeu lui demande d'avoir.

## La mesure

Pour chaque contenu, **toutes** les compositions possibles d'un bassin de
rareté (ou 240 tirées régulièrement quand il y en a des milliers), équipement
identique et calibré sur le contenu, deux tentatives par composition.

| Contenu | 3★ seulement | 3★ et 4★ | Roster complet |
|---|---|---|---|
| Campagne Hardcore, dernière étape | **37 %** des compositions | 56 % | 52 % |
| Raid Cœur-de-Forge niveau 10 | 2 % | 8 % | **10 %** |
| Raid Nécropole niveau 10 | 1 % | 9 % | **10 %** |
| Mythic+ 30 | **94 %** | 98 % | 87 % |

## Ce que ces chiffres disent

### Mythic+ ne teste que l'équipement

**94 % des compositions composées uniquement de 3★ terminent le Mythic+ 30**,
et aucun champion ne ressort : chacun apparaît dans les compositions gagnantes
à sa fréquence attendue, à un point près. Le mode ne demande **aucune
composition particulière**.

C'est une bonne nouvelle pour l'accessibilité et une mauvaise pour la
profondeur : après le rééquilibrage des ennemis et du Sablier, Mythic+ est une
épreuve d'équipement et de vitesse d'exécution, jamais de constitution
d'équipe. Les affixes de saison, qui devraient être le levier compositionnel,
ne changent visiblement pas le classement des champions.

### Les Raids, à l'inverse, sont verrouillés sur deux champions

Seules **10 %** des compositions terminent un raid de niveau 10. Parmi les
gagnantes :

| Champion | Présence dans les gagnantes | Présence attendue |
|---|---|---|
| **Ignovar** 4★ | 63 % | 18 % |
| **Morghast** 4★ | 63 % | 17 % |
| Nashoba 5★ | 42 % | 18 % |
| Vaeloria 4★ | 33 % | 15 % |

Ignovar et Morghast sont les deux spécialistes des dégâts périodiques. Le raid
de haut niveau est, en pratique, une épreuve de dégâts sur la durée, et deux
champions y valent trois fois leur poids. Ce n'est pas un défaut en soi — un
contenu peut avoir une réponse — mais ce n'est nulle part annoncé au joueur.

### La jauge de préparation réclame un outil contre-productif

Le panneau de préparation signale « Aucune purification détectée » comme un
manque pour **tout raid**, et plafonne la note en conséquence.

Or **Sylven, seule source de purification du jeu, n'apparaît dans aucune des
compositions gagnantes du Cœur-de-Forge.** L'emmener coûte un emplacement et
fait perdre.

La raison est mécanique. *Correction : un premier comptage annonçait trois
malus ennemis ; il ne recensait que les appels à `tryDebuff` et manquait les
mécaniques de zone. Les ennemis en appliquent huit —* `bleed`, `slow`,
`provoke`, `burn`, `mark`, `accuracyDown`, `healingDown`, `necrotic`.

Mais **en Raid**, un seul est infligé : la **Provocation** du Gardien de lave,
qui force vos attaquants sur la mauvaise cible. Et la purification de Sylven
**l'ignorait explicitement** :

```js
const first=Object.keys(unit.debuffs||{}).find(key=>!['provoke'].includes(key));
```

Elle refusait donc précisément de nettoyer la seule chose qu'il y avait à
nettoyer — alors que le moteur classe lui-même la Provocation parmi les malus
les plus dangereux, dans la liste que suit le combat automatique.

Le conseil et la réalité se contredisent : c'est le genre d'écart qui apprend au
joueur à ne pas faire confiance à l'interface.

### Points de fragilité du roster

- **La purification tient à un seul champion.** Sylven la fournit seul, via ses
  deux compétences. Il est en 3★, donc accessible — mais tout contenu futur qui
  reposerait sur des malus lourds rendrait un champion unique obligatoire.
- **Aucune réanimation n'existe dans le jeu.** Aucun champion, aucun set,
  aucune relique ne relève un allié tombé. Avec la difficulté Mythic+ revue,
  une mort est définitive pour la course — et le seul système qui en tient
  compte est la notation en étoiles.
- **Caelion (4★, Chronomancien) n'apparaît dans aucune composition gagnante des
  deux raids.** Sur ~24 compositions gagnantes par raid et une présence
  attendue de 18 %, c'est un signal, pas une preuve : à vérifier par une mesure
  dédiée avant d'y toucher.
- **La répartition élémentaire est déséquilibrée** : 8 champions Nature contre
  3 en Feu, Eau et Arcane. Sur un système d'affinités, cela réduit les réponses
  disponibles face à un contenu orienté.

---

# Partie 3 — Ce qui reste à améliorer, par ordre de rentabilité

### 1. Réconcilier la jauge de préparation avec le jeu réel
La purification est réclamée partout et ne sert presque nulle part. Deux voies :
donner du poids aux malus ennemis (les raids n'en appliquent que deux), ou
cesser de réclamer une purification là où il n'y a rien à purifier. La première
est plus intéressante : elle rendrait Sylven réellement utile.

### 2. Donner à Mythic+ une exigence de composition
Le mode ne distingue aucune équipe. Les affixes de saison sont le levier
naturel : un affixe qui punit l'absence de contrôle, ou de dégâts de zone,
transformerait un test d'équipement en test d'équipe. Le socle existe déjà —
les six affixes sont câblés et fonctionnent.

### 3. Annoncer ce que le contenu demande
Les raids de haut niveau exigent des dégâts périodiques ; rien ne le dit. Une
ligne dans la fiche du raid, au même endroit que les mécaniques, suffirait.

### 4. Élargir la purification, ou assumer le point unique
Un second porteur, idéalement d'un autre élément, retirerait la dépendance à un
champion unique.

### 5. Rééquilibrer la couverture élémentaire
Huit champions Nature pour trois Feu : les prochaines additions au roster
devraient viser Feu, Eau et Arcane.

### 6. Vérifier Caelion
Mesure dédiée : comparer le taux de réussite des compositions avec et sans lui,
à composition par ailleurs identique.

---

## Note de méthode

Deux défauts de cette passe — le plantage en Raid et l'inertie de la Précision
réduite — n'ont été trouvés ni par relecture ni par les 746 tests existants,
mais **en faisant jouer au moteur des milliers de parties complètes**. Le
plantage exigeait un ordre de morts précis ; l'inertie exigeait de comparer ce
que le jeu annonce à ce qu'il calcule.

C'est la troisième fois dans ce projet que la simulation trouve ce que la
lecture ne voit pas. Elle mérite d'être un outil permanent plutôt qu'un banc
reconstruit à chaque audit.

---

# Suites données à cet audit

| Constat | État |
|---|---|
| Plantage du moteur en Raid | **corrigé** (v1.55.1) |
| Précision réduite inerte | **corrigé** (v1.55.1) |
| Six effets invisibles, un effet fantôme | **corrigé** (v1.55.1) |
| Purification qui refuse la Provocation | **corrigé** (v1.56.0) — ordre de gravité partagé |
| Purification tenue par un seul champion | **corrigé** (v1.56.0) — Yunmei, 4★ Eau |
| Répartition élémentaire déséquilibrée | **corrigé** (v1.56.0) — six renforts, aucun élément sous 4 |
| Mythic+ ne teste que l'équipement | **ouvert** — les affixes de saison restent le levier |
| Raids verrouillés sur peu de champions | **ouvert** — atténué par les renforts, non résolu |
| Aucune réanimation dans le jeu | **ouvert** — choix de conception à trancher |
| Caelion absent des compositions gagnantes | **ouvert** — mesure dédiée à faire |

Un défaut supplémentaire a été trouvé en ajoutant les champions, et il mérite
d'être noté ici parce qu'il piège quiconque en ajoutera d'autres : **le moteur
décide des dégâts par liste blanche**. Une compétence offensive absente de
`damageEffects` s'exécute, applique ses malus, écrit dans le journal — et
n'inflige rien. `tests/degats.contrat.test.js` ferme définitivement ce piège.
