# Chroniques d'Azerune v1.74.0

## Les Empreintes : chaque champion a enfin son arbre, et un vrai choix

**Type :** refonte de système
**Date :** 10 septembre 2026

## Ce qui n'allait pas

Le système avait quatre défauts, tous mesurés :

- **Il n'y avait pas 32 arbres, mais un seul appliqué 32 fois** : un unique jeu
  de noms de nœuds pour tout le roster.
- **La branche Emprise mentait pour 17 champions sur 32.** Faute d'effets à jet,
  elle retombait sur de la puissance : une seconde branche Force déguisée.
- **L'arbre demandait 12 nœuds distincts** à des champions qui n'offrent que 4 à
  11 ancrages. Caelion portait sept doublons.
- **Il existait une allocation dominante** et dix-huit moins bonnes — 32 points
  de puissance d'écart entre la meilleure et la pire.

Et la **Résonance 5 n'apportait aucun point** : le sommet de la progression
donnait autant que la Résonance 4.

## Ce qui change

### Un socle de 6 nœuds au lieu de 12

Dimensionné sur ce que les champions savent réellement recevoir. **31 champions
sur 32 n'ont plus aucun nœud en double.**

Le **nom d'un nœud est désormais celui de ce qu'il fait** : « Puissance · Trait
de givre », « Fiabilité · Nova de givre », « Cadence · Fracture glaciale ». Un
nœud ne peut plus annoncer une chose et en faire une autre.

### 🗝️ Les clés de voûte

Chaque champion a **trois clés de voûte, et ne peut en graver qu'une seule**.
Elles ne donnent pas un chiffre de plus : elles changent la façon de le jouer.

Quelques exemples :

- **Sivrane** — *Blizzard* : chaque cumul de Givre gagne un second porteur ·
  *Gel profond* : tout dure un tour de plus · *Fracture imminente* : plus le
  Givre monte, plus ses traits frappent fort.
- **Vexil** — *Rupture assumée* : il commence à l'Instabilité maximale, au prix
  de ses PV.
- **Ragnhild** — *Soif de sang* : elle récupère bien davantage de PV sur chaque
  coup porté.

96 clés au total, écrites une par une dans le vocabulaire de leur champion.

### L'échelle de Résonance : chaque palier fait quelque chose

| Palier | Ce qu'il apporte |
|---|---|
| R1 | ouvre l'étage II |
| R2 | +1 point |
| R3 | ouvre la clé de voûte |
| R4 | +1 point |
| R5 | la clé de voûte ne coûte plus qu'1 point au lieu de 2 |

Au sommet : **6 points pour 6 nœuds de socle, ou 5 nœuds et une clé.** Les deux
coûtent le même budget, et l'on ne peut pas avoir les deux.

## Note sur les sauvegardes

L'arbre passant de 12 à 6 nœuds, les Empreintes gravées aux anciens étages III
et IV n'existent plus. Les points, eux, sont rendus : ils restent gagnés par
l'Ascension et la Résonance, et peuvent être regravés librement — l'effacement
des Empreintes a toujours été gratuit et sans limite.

## Couverture

`tests/cles.de.voute.test.js` : 36 tests, 23 mutations sur 23 tuées.
Suite complète : **1 589 tests**, 73 fichiers, tous au vert.

Diagnostic chiffré, mesures et réserves : `Audit/RAPPORT-EXPERIENCE-JOUEUR.md`,
section 20.
