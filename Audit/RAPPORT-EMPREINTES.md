# Les Empreintes d'Azerune

Ce que Honkai: Star Rail fait avec les Eidolons, les Traces et les Cônes de
lumière ; ce qu'Azerune avait déjà ; et ce qui manquait vraiment.

---

## 1. Le diagnostic : les conteneurs existaient, les décisions non

Azerune possédait déjà un équivalent partiel des trois systèmes. Mesuré, pas
supposé.

| HSR | Équivalent Azerune | Ce qu'il pèse réellement |
|---|---|---|
| **Eidolons** | Résonance R1→R5 | **+3,8 % de puissance** au total, pour cinq doublons de 5★ — la ressource la plus rare du jeu. Quatre paliers sur cinq ne versent que des statistiques plates ; seul R4 change un comportement. |
| **Traces** | Niveaux de compétence | +30 %, +10 % et +15 % de puissance sur les trois sorts. **Piste linéaire, aucun embranchement.** |
| **Cônes de lumière** | Armes Uniques | Riches — effet propre, orientation, harmonisation — mais **7 armes** pour un roster de 32, derrière de longues chroniques. |

Et la référence qui cadre tout : **l'équipement complet vaut +172 %**. À côté,
la Résonance à +3,8 % est du bruit statistique.

Le manque n'était donc pas la puissance. C'était ceci :

> **Nombre de choix qu'un joueur pose sur toute la progression d'un champion :
> un seul** — l'orientation de Cendre-Sépulcrale.

La Résonance s'applique seule. Les compétences montent en ligne droite. Il y
avait de la puissance à gagner partout et une décision à prendre nulle part.

---

## 2. Un bug trouvé en chemin : les Tomes de maîtrise ne servaient à rien

En cherchant par où les bonus de compétence atteignent le moteur, un défaut est
apparu.

Le moteur lit `unit.skillLevels` et en tire les bonus de maîtrise. L'écran de
combat construisait ses héros ainsi :

```js
HEROES.map(hero=>({...hero,currentStars:...,uniqueWeapon:...}))
```

**Aucun `skillLevels`.** Dans chaque combat réel, la valeur était `undefined`,
le moteur retombait sur le niveau 1, et **toute compétence montée avec des Tomes
de maîtrise n'avait aucun effet**. L'infobulle affichait « Niveau 1/6 » quoi que
le joueur ait acheté.

Le tutoriel, lui, transmettait bien `skillLevels:{0:1,1:1,2:1}` — ce qui rendait
le défaut invisible : le seul endroit où la clé était passée était aussi le seul
où elle valait 1.

Mesure de ce qui était perdu :

```
sans skillLevels (comme l'écran de combat) : 129 dégâts
skillLevels niveau 1                       : 129
skillLevels niveau MAX                     : 167   soit +29,5 %
```

Corrigé, et verrouillé par `tests/competences.maitrise.test.js` — dont le test
décisif ne regarde pas le moteur mais **la ligne de construction de la page** :
les deux tests de comportement passaient parfaitement pendant que le joueur
combattait au niveau 1 pour l'éternité.

---

## 3. Le principe : changer la forme, pas le volume

Le même qui a permis d'ajouter deux portails d'invocation sans toucher à
l'économie. Un arbre de traces qui ne verse que du gain pur, c'est de
l'inflation garantie sur un jeu où l'équipement domine déjà à +172 %.

**Le budget de points n'atteint jamais le nombre de nœuds.** Douze nœuds, six
points au sommet absolu de la progression. On ne renforce donc pas un champion,
on le spécialise : deux joueurs avec le même Thorgar pleinement investi n'ont
pas le même Thorgar.

Second principe, d'implémentation : **une Empreinte n'agit qu'à travers des
leviers que le moteur lit déjà** — les quatre bonus de compétence (puissance,
chance d'effet, durée, recharge) et les statistiques. Un seul point de jonction
dans `castSkill`, donc aucune surface de bug nouvelle dans le moteur de combat.

---

## 4. La structure

Trois branches × quatre étages = **douze nœuds par champion**.

| Branche | Ce qu'elle travaille |
|---|---|
| ⚔️ **Force** | Amplifie ce que le champion fait déjà — dégâts, soins ou boucliers selon son kit |
| 🕸️ **Emprise** | Fiabilité et durée des effets — marques, malus, régénérations |
| 🌀 **Flux** | Vitesse, temps de recharge, tempo |

Rien n'est écrit à la main pour trente-deux champions : chaque nœud vise un
index de compétence et se nomme d'après son effet réel. Un nœud de Force sur une
soigneuse annonce « Soins +8 % » parce que `powerLabel` sait déjà lire son
effet. C'est l'idiome du projet, celui de `championIdentities` et de `skills`.

### Deux axes distincts, deux sources déjà gâtées par d'autres contenus

- **Les étoiles donnent les points** — donc l'Ascension, donc les essences, donc
  les autres contenus. `points = étoiles − 2`, soit 1 à 4.
- **La Résonance donne la profondeur** — les doublons ouvrent les étages.

| Palier | Bonus existant, **conservé** | Nouveau rôle |
|---|---|---|
| R1 | +2 % PV/ATQ/DEF | ouvre l'**étage II** |
| R2 | +3 Vitesse | **+1 point** |
| R3 | +3 Précision / Résistance | ouvre l'**étage III** |
| R4 | bonus d'identité | **+1 point** |
| R5 | +2 % PV/ATQ/DEF | ouvre l'**étage IV** |

Aucun bonus n'a été retiré : la refonte n'enlève rien à personne, elle ajoute une
fonction structurelle à chacun des cinq paliers. Un test vérifie explicitement
que **chaque palier de Résonance fait désormais quelque chose** — ouvre un étage
ou verse un point.

### Le budget mesuré

```
3★ R0 : 1 point  · profondeur 1/4     6★ R2 : 5 points · profondeur 2/4
4★ R0 : 2 points · profondeur 1/4     6★ R4 : 6 points · profondeur 3/4
5★ R0 : 3 points · profondeur 1/4     6★ R5 : 6 points · profondeur 4/4
6★ R0 : 4 points · profondeur 1/4
```

Un champion neuf dispose déjà d'un point et de trois nœuds où le poser : le
système est visible dès la première invocation. Au sommet absolu — 6★ R5, la fin
de toute progression — il reste **six nœuds éteints sur douze**.

La tension est réelle : à R5 l'étage IV s'ouvre, mais l'atteindre coûte les
quatre nœuds d'une branche. Prendre un capstone, c'est renoncer aux deux tiers
du reste.

---

## 5. Ce que ça pèse

| Source | Gain |
|---|---|
| Équipement complet 5★ hardcore | **+172 %** |
| Maîtrise des compétences au maximum | +30 % |
| **Branche Force complète (4 points)** | **+20,5 %** sur l'ultime |
| Résonance R0→R5 | +3,8 % |

Les Empreintes se placent entre la maîtrise et l'équipement : assez pour
compter, loin d'être la nouvelle source dominante. Un test le verrouille par le
haut — le rapport doit rester **sous 1,5** — et par le bas — au-dessus de 1,15,
pour qu'investir ne soit pas décoratif.

### Un effet de bord, assumé

La puissance affichée ne bouge que de **+0,3 %** pour un arbre plein, parce que
la plupart des nœuds sont des bonus de sort et non des statistiques. La
recommandation de puissance des missions **sous-estime donc légèrement** un
champion investi.

C'est le sens sûr de l'erreur : mieux vaut un joueur qui trouve une mission plus
facile qu'annoncé que l'inverse. Un test fige ce comportement plutôt que de le
laisser dériver.

---

## 6. Vérification

**Tests.** `tests/empreintes.test.js` (27), `tests/empreintes.cablage.test.js`
(8), `tests/competences.maitrise.test.js` (7). Deux tests existants de
`progression.test.js` ont dû être élargis — ils vérifiaient la forme exacte du
progrès et que **tout** champ est un nombre fini. Ils ont été étendus, pas
affaiblis : les Empreintes doivent toujours sortir en tableau de chaînes, et
quatre entrées malformées de plus ont été ajoutées au jeu d'essai.

**Mutation.** 26 mutations appliquées, 26 tuées après renforcement. Quatre
avaient survécu au premier passage :

- **Le plus grave** : `normalizeChampionProgress` renvoyant toujours un tableau
  vide. Aucun test ne vérifiait que l'arbre **survit au rechargement de la
  sauvegarde** — un joueur aurait retrouvé ses Empreintes effacées à chaque
  lancement, sans qu'aucune autre vérification ne s'en aperçoive.
- **Un test qui ne prouvait pas ce qu'il annonçait** : « un étage fermé reste
  inaccessible » vérifiait un nœud indisponible pour la mauvaise raison — son
  étage précédent n'était pas gravé. Corrigé en allumant d'abord le prédécesseur.
- **La page de combat ne transmettant pas les Empreintes** au moteur : le
  contrat n'existait que pour `skillLevels`.
- **Une mutation que j'avais mal écrite**, chaîne Python non terminée. Refaite,
  elle est tuée.

**Dans le jeu.** Onglet « Empreintes » sur la fiche champion : douze nœuds, trois
disponibles et neuf verrouillés pour un 3★ R0, gravure effective, message de
retour, effacement complet. Aucune erreur console.

**Mise en page.** Vérifiée en 1360×900 et en 412 px de large. La grille passe à
une colonne sous 850 px, et le document ne déborde pas horizontalement
(scrollWidth 412 = innerWidth 412). Une fois la page défilée jusqu'en bas, le
dernier nœud s'arrête à 693 px quand la barre de navigation commence à 832 :
rien n'est masqué, l'application réservant déjà 112 px de marge basse pour ses
68 px de barre fixe.

> **Une fausse alerte, née de mes propres captures.** Les premières images
> montraient la barre de filtres au milieu des cartes de champions et la barre
> de navigation par-dessus le bas du panneau. C'était un artefact de la capture
> `fullPage` : les éléments en `position: fixed` et `position: sticky` y sont
> peints à leur position d'écran, donc au milieu d'une image de deux mille
> pixels de haut. Mesuré dans un vrai viewport, aucun chevauchement — les seuls
> relevés portaient sur la barre fixe, et le défilement les résout. Les captures
> pleine page sont trompeuses dès qu'une interface a une barre collante ; à
> refaire à la taille d'écran.

**1 148 tests, 45 fichiers.**

---

## 7. Ce qui n'a pas été fait

**Les Cônes de lumière n'ont pas d'équivalent nouveau.** Un second emplacement
équipable serait une source de puissance de plus par-dessus un équipement qui
pèse déjà +172 % : c'est le seul des trois systèmes que je déconseille sans
compensation ailleurs. Les Armes Uniques en tiennent déjà le rôle.

> **Correction.** Cette section ajoutait que « le vrai manque de ce côté est
> leur couverture — sept armes pour trente-six champions ». C'était faux sur les
> chiffres (le roster en compte 32, et 26 sont déjà porteurs possibles) et faux
> sur le fond : une arme que tout le monde peut obtenir n'est plus unique. Voir
> `Audit/RAPPORT-CHRONIQUES-LEGENDAIRES.md`, section 6.

**Les nœuds n'ont pas de contrepartie négative.** Le principe « changer la
forme, pas le volume » est tenu par la rareté des points, pas par des malus. Des
nœuds en échange (« +20 % ici, +1 tour de recharge là ») rendraient les
décisions plus tranchées ; ils demanderaient aussi de vérifier qu'aucun ne
produit un champion strictement pire, ce qui n'a pas été mesuré.

**Les nœuds sont génériques.** Les douze sont dérivés du kit, pas écrits pour
chaque champion. C'est ce qui rend le système maintenable à trente-deux
champions, mais un nœud d'étage IV taillé sur mesure — qui toucherait la
mécanique personnelle plutôt que les quatre leviers standard — aurait plus de
saveur. Il faudrait alors du code de moteur, donc de la surface de bug.
