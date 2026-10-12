# Sim Survie mêlée — WoW Forever

Simulateur de DPS personnel pour le **chasseur Survie au corps à corps** de *World of Warcraft: Forever*.
Il reprend les formules de combat de Classic (code open source de [wowsims](https://github.com/wowsims/sod)
et wiki de [magey](https://github.com/magey/classic-warrior/wiki/Attack-table)) et y applique les changements
Forever connus pendant la bêta.

> Données au 12 octobre 2026, bêta build 1.60.1.70338. La bêta se termine le 21 octobre et la sortie est
> prévue le 4 novembre 2026 : plusieurs valeurs vont encore bouger. Chaque valeur incertaine est modifiable
> dans l’onglet **Hypothèses** et affiche son niveau de fiabilité.

## Utilisation

- **Sans rien installer** : ouvrir `dist/sim-survie-forever.html` dans un navigateur (double-clic).
- **En développement** : servir le dossier (`python3 -m http.server` depuis `wow-forever-sim/`) puis ouvrir
  `index.html`. Les modules ES ne se chargent pas en `file://`, d’où la version assemblée dans `dist/`.
- **Tests** : `npm test` (Node 20+, aucune dépendance).
- **Reconstruire `dist/`** après une modification : `npm run build`.

Les profils sont enregistrés dans le navigateur (`localStorage`). Le bouton **Importer / exporter** permet
de les sauvegarder ailleurs ou de les partager en JSON.

## Ce que fait le sim

- **Profils** : niveau 60 ou 30 (bêta), race, aspect, stats d’équipement, armes (2M ou ambidextrie),
  enchantements, bijoux à activer, familier, talents, buffs, consommables, débuffs, rotation.
- **Feuille de personnage** calculée en direct : PA, crit contre le boss, plafond de toucher, raté,
  esquive, érafles, armure, coûts en mana.
- **Simulation Monte-Carlo** : DPS moyen avec intervalle de confiance, répartition par technique,
  distribution du DPS, temps passé à sec de mana.
- **Poids des stats** en équivalent PA, avec marge d’erreur (mêmes tirages aléatoires pour chaque variante).
- **Comparaison** de tous les profils enregistrés (utile pour trancher 2M contre ambidextrie).
- **Journal de combat** des 60 premières secondes pour vérifier la rotation.

## Modèle

Chaque itération joue un combat complet, événement par événement : attaques automatiques des deux mains,
GCD, recharges, mana (esprit avec la règle des 5 secondes, mp5, potions), procs et effets périodiques.

| Mécanique | Modèle par défaut | Fiabilité |
|---|---|---|
| Table d’attaque | Classic : un jet pour les attaques auto (raté, esquive, parade, érafle, crit), deux jets pour les techniques ; boss +3 | Classic |
| Toucher et crit | Unifiés (mêlée, distance, sorts) | Communauté |
| Réduction d’esquive/parade | Nouvelle stat Forever, retire des points d’esquive et de parade | Communauté |
| Raptor Strike | Dégâts d’arme + 70 (rang 8), 100 mana, 6 s, instantané avec GCD | Communauté / estimé |
| Mongoose Bite | Dégâts d’arme + 57 (rang 4), 65 mana, 5 s, après une esquive ou un proc d’Expose Prey | Communauté |
| Expose Prey | 5 % par rang sur chaque coup qui touche une cible marquée, fenêtre de 10 s | Officiel (10 s) / communauté |
| Lacerating Strikes | Saignement de 40 % des dégâts de la Morsure sur 21 s, réapplication qui remplace | Officiel / estimé |
| Strider Kick | 100 % de l’arme, 5,81 % du mana de base, 8 s | Communauté |
| Predator’s Edge | +6 % de dégâts critiques et +10 % de dégâts de main gauche par rang | Communauté |
| Savage Strikes | +2 % de crit des techniques par rang | Communauté |
| Aspect of the Beast | +110 PA de mêlée au rang 4 | Communauté |

Les options alternatives (Raptor Strike en « prochaine attaque » comme en Classic, saignement cumulatif ou
qui critique, Predator’s Edge appliqué au total, Savage Strikes en dégâts…) se choisissent dans l’onglet
**Hypothèses**.

**Pas simulé** : déplacements, AoE, menace, Wing Clip, procs d’objets précis, capacités détaillées du familier
(son DPS est une valeur fixe à saisir).

## Mettre à jour une valeur

1. Dans l’interface : onglet **Hypothèses**. Chaque profil garde ses propres valeurs.
2. Dans le code, pour changer la valeur par défaut : tableau `MECHANICS` de `src/data.js`
   (champ `value`, `conf` pour la fiabilité, `src` pour les sources), puis `npm test` et `npm run build`.

## Fichiers

- `src/data.js` : données (sorts, talents, buffs, races, sources, valeurs par défaut).
- `src/engine.js` : moteur de simulation (sans dépendance au navigateur, testé avec Node).
- `src/app.js`, `src/styles.css`, `index.html` : interface.
- `scripts/build.js` : assemble `dist/sim-survie-forever.html`.
- `tests/engine.test.js` : tests du moteur.

## Sources principales

- Blizzard — [Forever Beta Development Notes (8 octobre 2026)](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-8/2360696/4)
- Blizzard — [Class Deep Dives : Hunter and Druid](https://worldofwarcraft.blizzard.com/en-us/news/24301515)
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
