# Récompenses de fin de mission — vestiges et robustesse

## 1. Le pity de butin de campagne était mort, mais pas oublié

`campaignLootPity` existait dans `GameContext` : migré depuis la sauvegarde et
borné à 0–4, réécrit dans `localStorage` à chaque changement, exposé dans la
valeur du contexte. Et `rollCampaignLoot` renvoyait `pity:0` et
`pityGuaranteed:false` **en dur**, propagés jusqu'aux objets de récompense sous
`lootPity` / `lootPityGuaranteed`.

Vérification : `setCampaignLootPity` n'apparaissait qu'une fois dans tout le
projet — sa propre déclaration. Jamais appelé. `campaignLootPity`, `lootPity` et
`lootPityGuaranteed` n'étaient lus par aucune page ni aucun composant.

### Ce n'était pas un oubli

`README V1.28` introduisait le mécanisme : « après quatre victoires de farm sans
objet, la cinquième donne un équipement garanti ».
`HOTFIX-CAMPAGNE-SETS-ECONOMIE` l'a ensuite retiré volontairement :
« Suppression de la pity automatique de butin Campagne », dans le cadre de la
refonte de la Campagne de 15 à 10 zones.

**Le code était donc juste, et le pity n'a pas été rétabli.** Ce qui restait,
c'était l'échafaudage : un état persisté que rien n'écrit, et deux champs de
retour toujours constants.

Seul `Audit/RAPPORT-EQUILIBRAGE.md` (v1.32.0) décrivait encore un « pity au
cinquième farm conservé ». Ce rapport est corrigé.

### Nettoyage

Retirés : l'état `campaignLootPity` et sa migration, sa persistance, son
exposition dans le contexte, et les champs `pity` / `pityGuaranteed` /
`lootPity` / `lootPityGuaranteed` toujours constants.

Le pity d'**invocation** (`pityCounter`, garantie 5★ à 100 tirages) est un autre
système, bien vivant, et n'est pas touché.

## 2. Un objet au set disparu faisait tomber toute l'application

`activeSets` comptait les pièces par `setId` puis divisait par
`SETS[id].pieces`, sans vérifier que `SETS[id]` existe :

```js
items.forEach(item=>{if(item?.setId)counts[item.setId]=(counts[item.setId]||0)+1});
return Object.entries(counts).flatMap(([id,count])=>
  Array.from({length:Math.floor(count/SETS[id].pieces)},()=>id))
```

Un objet portant un `setId` absent de `SETS` lève
`Cannot read properties of undefined (reading 'pieces')`.

### Pourquoi c'est grave

`setStats` appelle `activeSets`, et `totalStats` appelle `setStats`. Or
`totalStats` est calculé pour **chaque champion**, sur la page Champions, la
préparation de combat, la puissance d'équipe et l'évaluation de faisabilité. Une
seule pièce d'équipement au set inconnu suffit à faire tomber ces écrans.

### Comment un tel objet arrive dans une sauvegarde

- La refonte de la Campagne a changé la progression des sets, et sa note de
  migration précise que « les anciennes pièces restent valides » : elles
  conservent donc leur `setId` d'origine.
- L'import de sauvegarde accepte un fichier venant d'une autre version du jeu,
  avec l'inventaire qu'il contient.

Ce n'est pas la cause de `HOTFIX-ECRAN-NOIR` (v1.51.1), qui était une boucle de
rendu : c'est un chemin de plantage distinct, resté ouvert.

### Correction

`activeSets` ignore désormais un `setId` inconnu au lieu de lever, tolère une
liste nulle, et `setStats` accède aux statistiques du set de façon défensive.
Aucun changement de comportement sur des données valides : le joueur perd
seulement le bonus d'un set qui n'existe plus, au lieu de perdre l'écran.

## 3. Couverture

`tests/rewards.test.js` — 39 tests sur les générateurs de butin de campagne,
raid, expédition, Mythic+, boutique et haut fait, sur la normalisation d'objet,
les sets actifs, le coût d'amélioration, la valeur de recyclage et la forge.

Les générateurs sont vérifiés par invariants sur des dizaines de graines : slot
connu, qualité connue, set existant, nombre de sous-statistiques conforme à la
qualité, pas de doublon avec la statistique principale, niveau d'amélioration à
zéro.
