# Sim Survie mêlée — WoW Forever

Simulateur de DPS personnel pour le **chasseur Survie au corps à corps** de *World of Warcraft: Forever*.
Il reprend les formules de combat de Classic (code open source de [wowsims](https://github.com/wowsims/sod)
et wiki de [magey](https://github.com/magey/classic-warrior/wiki/Attack-table)) et y applique les valeurs de
Forever lues dans les données du client : sorts du chasseur et 2 731 objets réels, exportés par
[wowsims/gamedata](https://github.com/wowsims/gamedata), la même source que Wowhead.

> Données au 12 octobre 2026, bêta build 1.60.1.70338. La bêta se termine le 21 octobre et la sortie est
> prévue le 4 novembre 2026 : plusieurs valeurs vont encore bouger. Chaque valeur incertaine est modifiable
> dans l’onglet **Hypothèses** et affiche son niveau de fiabilité.

## Utilisation

- **Sans rien installer** : ouvrir `dist/sim-survie-forever.html` dans un navigateur (double-clic).
- **En développement** : servir le dossier (`python3 -m http.server` depuis `wow-forever-sim/`) puis ouvrir
  `index.html`. Les modules ES ne se chargent pas en `file://`, d’où la version assemblée dans `dist/`.
- **Tests** : `npm test` (Node 20+, aucune dépendance).
- **Reconstruire `dist/`** après une modification : `npm run build`.

Les profils et la bibliothèque d’objets sont enregistrés dans le navigateur (`localStorage`). Le bouton
**Importer / exporter** permet de sauvegarder ou partager un profil en JSON, avec ses objets équipés.

## Ce que fait le sim

- **Équipement** : 17 emplacements (de la tête à l’arme à distance).
  - Base de données Forever : 2 731 objets qu’un chasseur mêlée peut porter, avec recherche par nom, type et
    qualité, valeur estimée en PA et lien vers la page Wowhead Forever de chaque objet.
  - « Équiper les meilleurs objets » : choisit l’objet le plus fort de chaque emplacement selon les poids des
    stats, la qualité maximale et le style (2M ou ambidextrie).
  - Bibliothèque personnelle pour les objets absents de la base : collez leur tooltip (Wowhead ou jeu, en
    anglais ou en français) et le sim reconnaît stats, scores, dégâts d’arme et effets « Utiliser ».
- **Profils** : niveau 60 ou 30 (bêta), race, aspect, talents, buffs, consommables, débuffs, rotation,
  bonus manuels (enchantements d’armure ou totaux saisis à la main).
- **Feuille de personnage** calculée en direct : PA, crit contre le boss, plafond de toucher, raté,
  esquive, érafles, armure, coûts en mana.
- **Simulation Monte-Carlo** : DPS moyen avec intervalle de confiance, répartition par technique,
  distribution du DPS, temps passé à sec de mana.
- **Cycle de sorts** :
  - chronologie d’un combat, 30 secondes à la fois : chaque GCD coloré par technique, attaques auto,
    fenêtres Mongoose Bite, saignement, buffs et courbe de mana ;
  - statistiques sur des milliers de combats : part du GCD utilisée, utilisations par minute, fenêtres
    Mongoose ouvertes, utilisées ou perdues, temps actif de chaque effet ;
  - enchaînements de 3 techniques les plus fréquents, et journal détaillé.
- **Comparer** :
  - objets : le sim essaie l’objet équipé, ceux de la bibliothèque et les 10 meilleurs de la base à un
    emplacement, et donne l’écart de DPS avec sa marge d’erreur ;
  - deux profils A et B côte à côte : DPS par technique, cycle, stats ;
  - classement de tous les profils.
- **Poids des stats** en équivalent PA, avec marge d’erreur. Ils donnent aussi une « valeur PA » à chaque
  objet de la bibliothèque.

## Modèle

Chaque itération joue un combat complet, événement par événement : attaques automatiques des deux mains,
GCD, recharges, mana (esprit avec la règle des 5 secondes, mp5, potions), procs et effets périodiques.

| Mécanique | Modèle par défaut | Fiabilité |
|---|---|---|
| Table d’attaque | Classic : un jet pour les attaques auto (raté, esquive, parade, érafle, crit), deux jets pour les techniques ; boss +3 | Classic |
| Scores des objets | 10 de toucher = 1 %, 14 de crit = 1 % au niveau 60 ; hâte et expertise 10 = 1 % | Client (toucher, crit) / estimé |
| Raptor Strike | Arme + 70 (rang 8), 100 mana, 6 s, sans GCD : coup sur la prochaine attaque | Client / estimé |
| Mongoose Bite | Arme **normalisée** + 57 (rang 4), 65 mana, 5 s, après une esquive ou un proc d’Expose Prey | Client |
| Expose Prey | 10 % sur chaque coup qui touche une cible marquée, fenêtre de 10 s | Client / officiel |
| Lacerating Strikes | Saignement de 40 % des dégâts de la Morsure sur 21 s, peut critiquer | Client |
| Lacerate | Saignement de 7 × 58 en 21 s, 95 mana, peut critiquer | Client |
| Strider Kick | 100 % de l’arme normalisée, 5,81 % du mana de base, 8 s | Client |
| Counterattack | 50 % de (arme normalisée + 110), après une parade | Client |
| Savage Strikes | +20 % de crit aux techniques de mêlée au rang maximal | Client |
| Predator’s Edge | +30 % de dégâts critiques des techniques, +50 % de dégâts de main gauche | Client |
| Aspect of the Beast | +110 PA de mêlée au rang 4 | Client |
| Piège d’immolation | 5 × 138 de Feu, 245 mana, 30 s de recharge | Client |

Le client ne dit pas si Raptor Strike frappe à la prochaine attaque ou instantanément : il lui manque
seulement le GCD, comme à Frappe héroïque. C’est l’hypothèse qui change le plus le DPS (environ +35 % en
« instantané hors GCD »), à vérifier en jeu. Ce choix et les autres options (saignement cumulatif, Predator’s
Edge appliqué au total…) se règlent dans l’onglet **Hypothèses**.

**Pas simulé** : déplacements, AoE, menace, Wing Clip, procs d’objets précis, capacités détaillées du familier
(son DPS est une valeur fixe à saisir).

## Mettre à jour une valeur

1. Dans l’interface : onglet **Hypothèses**. Chaque profil garde ses propres valeurs.
2. Dans le code, pour changer la valeur par défaut : tableau `MECHANICS` de `src/data.js`
   (champ `value`, `conf` pour la fiabilité, `src` pour les sources), puis `npm test` et `npm run build`.

## Mettre à jour la base d’objets

```sh
git clone --depth 1 https://github.com/wowsims/gamedata ../gamedata
node scripts/import-items.js ../gamedata   # réécrit src/itemdb.js
npm test && npm run build
```

Le script garde les objets verts et mieux qu’un chasseur peut porter (pas de masses, de boucliers ni de
plaques) et qui ont une stat utile en mêlée. Il exclut les objets de test et ceux de Season of Discovery,
présents dans le client mais absents de Forever.

## Fichiers

- `src/data.js` : données (sorts, talents, buffs, races, sources, valeurs par défaut).
- `src/gear.js` : emplacements, objets, base de données, équipement automatique, analyse des tooltips.
- `src/itemdb.js` : objets de Forever, générés par `scripts/import-items.js`.
- `src/engine.js` : moteur de simulation, trace du combat et statistiques du cycle (sans dépendance au
  navigateur, testé avec Node).
- `src/app.js`, `src/ui/`, `src/styles.css`, `index.html` : interface.
- `scripts/build.js` : assemble `dist/sim-survie-forever.html`.
- `tests/` : tests du moteur et de l’équipement.

## Sources principales

- Blizzard — [Forever Beta Development Notes (8 octobre 2026)](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-8/2360696/4)
- Blizzard — [Class Deep Dives : Hunter and Druid](https://worldofwarcraft.blizzard.com/en-us/news/24301515)
- [wowsims/gamedata](https://github.com/wowsims/gamedata) : sorts et objets lus dans le client Forever
  (build 1.60.1.70338, 12 octobre 2026), avec liens vers [Wowhead Forever](https://www.wowhead.com/forever)
- [wowsims/sod](https://github.com/wowsims/sod) et [magey/classic-warrior](https://github.com/magey/classic-warrior/wiki/Attack-table) pour les formules Classic
- Guides de la bêta : [Mobalytics](https://mobalytics.gg/wow-forever/classes/survival-hunter-guide),
  [Icy Veins](https://www.icy-veins.com/wow-forever/survival-hunter-melee-dps-pve-guide),
  [classicwow.gg](https://classicwow.gg/forever/guides/hunter/survival),
  [WoW Forever Talents](https://wowforevertalents.com/hunter/),
  [WCLBox](https://wowforever.wclbox.com/en/fashu/hunter/hunter-mongoose-bite),
  [ForeverDB](https://foreverdb.net/stats),
  [ForeverChanges](https://foreverchanges.pro/class/hunter)

La liste complète, avec le lien entre chaque valeur et ses sources, est dans l’onglet **Hypothèses** et en bas
de la page.
