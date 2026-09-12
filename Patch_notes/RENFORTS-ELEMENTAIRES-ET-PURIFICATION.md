# Azerune — Six renforts élémentaires, et la purification enfin utile

## Pourquoi

L'audit du roster avait relevé deux choses : une répartition élémentaire
déséquilibrée (**8 champions Nature contre 3 en Feu, Eau et Arcane**), et une
purification qui ne servait à rien là où le jeu la réclamait le plus.

## Six nouveaux champions

Inspirés de spécialisations de World of Warcraft encore absentes du roster.

| Champion | Élément | Rareté | Inspiration | Ce qu'il apporte |
|---|---|---|---|---|
| ⚡ **Vharok** | Feu | 4★ | Chaman Amélioration | **Maelström** : se charge en frappant, se dépense en décharge de zone (+18 % par cumul) |
| 🪓 **Ragnhild** | Feu | 3★ | Guerrier Fureur | Vol de vie 20 %, Témérité qui échange des PV contre de l'Attaque, Exécution presque doublée sous 35 % de PV |
| ❄️ **Sivrane** | Eau | 3★ | Mage Givre | **Givre cumulatif** : ralentit, puis se brise en étourdissement à partir de 3 cumuls |
| 🍃 **Yunmei** | Eau | 4★ | Moine Tisse-brume | Soins et **purification** — la deuxième source du jeu |
| 🐉 **Aszhal** | Arcane | 5★ | Évocateur Augmentation | Ne frappe pas fort : **il fait frapper les autres** (+30 % de dégâts sur un allié, +15 % sur l'équipe) |
| 🔮 **Nyxaris** | Arcane | 4★ | Évocateur Dévastation | **Incantation prolongée** : charger coûte un tour, et le Sablier d'Azerune les compte |

Le roster passe de 26 à **32 champions**.

| | Avant | Après |
|---|---|---|
| Nature | 8 | 8 |
| Ombre | 5 | 5 |
| Feu | **3** | **5** |
| Eau | **3** | **5** |
| Arcane | **3** | **5** |
| Lumière | 4 | 4 |

Les raretés restent équilibrées : 11 champions 3★, 10 en 4★, 11 en 5★.

## La purification retirait le mauvais malus

Le jeu réclamait une purification avant chaque Raid. Or Sylven, seule source du
jeu, n'apparaissait dans **aucune** composition gagnante de Raid.

La cause tenait en une ligne. Sa purification prenait « la première clé de
l'objet » **en sautant explicitement la Provocation** :

```js
const first=Object.keys(unit.debuffs||{}).find(key=>!['provoke'].includes(key));
```

Or la Provocation est le **seul** malus qu'un raid inflige — le Gardien de lave
force vos attaquants sur la mauvaise cible. Et le moteur la classe lui-même
parmi les plus dangereux, dans la liste que suit le combat automatique. La
purification refusait donc précisément de nettoyer ce qu'il y avait à nettoyer.

Elle suit désormais un **ordre de gravité** unique et partagé, du plus
handicapant au plus bénin : Étourdissement, Provocation, Soins réduits, Agonie,
Corruption… jusqu'à Précision réduite et Marque. Les marques de mécanique de
boss, elles, ne se purifient pas.

Mesuré sur 300 compositions par raid : Sylven passe de **0 %** de présence dans
les compositions gagnantes à une présence réelle, et Yunmei arrive au-dessus de
sa fréquence attendue.

## Le combat automatique ne savait pas jouer les kits à ressource

Le combat automatique choisit ses compétences par une règle propre à chaque
champion. Sans règle, il applique « finisseur d'abord » — ce qui, pour un kit à
ressource, revient à lancer la Décharge sans Maelström et la Désintégration sans
Charge.

Les six renforts ont donc chacun leur règle. L'effet est net : Nyxaris passe de
**aucune** composition gagnante à une présence normale, et Vharok devient l'un
des meilleurs choix de Raid.

## Le piège qui a failli tout casser

Le moteur décide des dégâts par **liste blanche**. Une compétence offensive
absente de cette liste s'exécute normalement, applique ses malus, écrit dans le
journal de combat — et ne retire pas un seul point de vie. Aucune erreur.

Les onze compétences offensives des six renforts ont frappé dans le vide
jusqu'à ce qu'un test le révèle. `tests/degats.contrat.test.js` interdit
désormais cet oubli pour tout champion ajouté ensuite : il vérifie, pour chacune
des 72 compétences offensives du roster, qu'elle figure dans la liste **et**
qu'elle retire réellement des points de vie en combat.

## Équilibrage

Mesuré sur 300 compositions par contenu, équipement calé sur le palier. Les
renforts se placent entre **0,4 et 1,8 fois** leur fréquence attendue dans les
compositions gagnantes — à l'intérieur de l'écart déjà existant du roster, où
les meilleurs choix montent à 4 ou 5. Aucun n'est indispensable, aucun n'est
inutile.

Réserve honnête : avec une vingtaine de compositions gagnantes par raid, ces
rapports ont une marge d'erreur large. Ils disent qu'aucun renfort n'est cassé,
pas qu'ils sont réglés au dixième.

## Détail technique

`src/data/customHeroes.js`, `src/data/championIdentities.js` (cinq registres),
`src/battle/engine.js` (18 effets, `damageUp`, `frost`, politique de
purification, liste blanche, règles de combat automatique),
`src/utils/stats.js` et `src/utils/skills.js` (capacités et maîtrises),
`src/pages/BattlePage.jsx` (légende).

**933 tests**, dont 41 sur les renforts et 146 sur le contrat des dégâts.
**22 mutations** appliquées au code livré, toutes détectées.
