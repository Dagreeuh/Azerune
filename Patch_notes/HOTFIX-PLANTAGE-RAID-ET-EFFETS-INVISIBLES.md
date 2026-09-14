# Azerune — Hotfix : plantage en Raid, Précision réduite inerte, effets invisibles

## 1. Le Raid pouvait planter en plein combat

Le Prêtre des flammes soigne le boss du raid. Le code cherchait un boss vivant
puis lisait ses points de vie **sans vérifier qu'il en avait trouvé un** :

```js
const boss=enemies.find(unit=>unit.raidRole==='boss'&&!unit.dead);
const heal=Math.round(boss.maxHp*.08);
```

Tuer le boss avant ses serviteurs — la stratégie que tout le monde emploie —
faisait donc lever une exception au tour suivant du prêtre, et le combat
s'interrompait.

Les branches voisines, celles des cristaux d'Expédition, vérifient toutes la
présence de leur boss avant d'agir. Celle-ci l'avait oublié. Le prêtre attaque
désormais normalement quand il n'a plus personne à soigner ; tant que le boss
vit, il le soigne exactement comme avant.

## 2. La Précision réduite ne réduisait rien

La zone **Œil-Clair** applique un malus de Précision et l'annonce dans le
journal de combat : « brouille la vision : Précision réduite ». Le malus était
bien posé sur le champion — et **lu nulle part**. Le calcul de chance de placer
un malus lisait la statistique brute.

Résultat : une mécanique de continent annoncée au joueur, sans le moindre effet,
et invisible dans la barre d'état. Elle divise maintenant réellement la
Précision du porteur par 0,65.

## 3. Six effets que vous subissiez sans les voir

Le moteur appliquait six effets qui n'avaient aucun nom dans la barre d'état du
combat :

| Effet | Ce qu'il fait |
|---|---|
| ☣️ **Nécrose** | Affixe Mythic+ : soins reçus −6 % par cumul, jusqu'à 5 |
| 💪 **Galvanisé** | Affixe Mythic+ : +8 % d'Attaque et de Défense par cumul |
| 😤 **Enrage** | Le boss de raid a déclenché son enrage |
| 💔 **Soins −** | Soins reçus réduits de 40 % |
| 🩸 **Soins − (enrage)** | Soins reçus réduits de 30 % pendant l'enrage |
| 🌫️ **Préc. −** | Précision réduite (voir point 2) |

Les deux premiers sont des affixes de saison dont la description **promet
explicitement un cumul**. Un cumul qu'on ne peut pas voir ne se joue pas.

À l'inverse, la légende annonçait un **🎯 PRÉC. +** qu'aucune compétence, aucun
set et aucune résonance n'accorde jamais. L'entrée est retirée.

## Comment ces défauts ont été trouvés

Aucun n'est sorti d'une relecture ni des 746 tests existants. Ils sont apparus
en faisant jouer au moteur **1 500 parties complètes** dans le cadre de l'audit
du roster : le plantage exigeait un ordre de morts précis, l'inertie exigeait de
comparer ce que le jeu annonce à ce qu'il calcule.

## Détail technique

`src/battle/engine.js` : garde `raidBoss` avant la branche du prêtre, et
`effectiveAccuracy` lu par `debuffChance`.
`src/pages/BattlePage.jsx` : six entrées ajoutées à la légende, une retirée.

**17 tests** nouveaux (`tests/raid.pretre.test.js`, `tests/effets.affichage.test.js`),
dont un contrat qui vérifie dans les deux sens que tout effet appliqué par le
moteur est nommé au joueur, et qu'aucun effet nommé n'est fantôme.
**11 mutations** appliquées au code livré, toutes détectées.
