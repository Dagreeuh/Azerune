# Azerune — Derniers réglages : cohérence des renforts et parcours complet

## 1. Les soins de Yunmei suivaient la mauvaise statistique

Tous les soins du jeu se calculent sur les **points de vie maximum** — ceux de
la cible pour Hicho, ceux du lanceur pour Sylven. Yunmei faisait exception : ses
trois soins dépendaient de son **Attaque**.

La conséquence n'était pas seulement une incohérence de règle. Le guide du
champion et l'infobulle de compétence en tiraient un conseil d'équipement, et ce
conseil envoyait le joueur chercher de l'Attaque sur la seule soigneuse du
roster à qui elle ne sert normalement à rien.

Paume de brume rend désormais 8 % des PV maximum de la cible, Brume revigorante
18 %, Renouveau 22 % sur chaque allié — la même convention que le reste du jeu.

## 2. Sivrane était conseillée en Critique

Son Ralentissement et son Étourdissement sont des jets qui dépendent de la
**Précision**. Le classement interne des compétences la rangeait pourtant parmi
les frappeuses critiques, si bien que l'infobulle conseillait « Attaque,
Critique, Vitesse » — pendant que sa propre fiche de champion disait
« Précision ». Deux moitiés de la même information qui se contredisaient.

Ses trois compétences sont désormais classées sur la Précision, et sa fiche dit
la même chose que ses infobulles.

## 3. Un parcours complet, tous modes confondus

Les deux plantages trouvés cette semaine — le Prêtre des flammes soignant un
boss mort, et les compétences qui frappaient dans le vide — n'apparaissaient
qu'en jouant des parties entières. Aucun test unitaire ne pouvait les voir.

`tests/parcours.complet.test.js` joue donc **chaque mode du jeu jusqu'à son
terme** : campagne Normal et Hardcore, les quatre Raids, les quatre Expéditions,
Mythic+ 1 et Mythic+ 30. Avec des compositions tirées dans tout le roster, avec
les six renforts entre eux, et avec une équipe entièrement 3★. Quatorze
scénarios, tous doivent aboutir à un vainqueur sans lever d'exception.

## Vérifications

**952 tests**, dont 46 sur les renforts et 14 de parcours complet.
Le jeu se construit et se joue de bout en bout dans les onze modes.
