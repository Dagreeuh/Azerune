# Détection des capacités d'équipe — un briseur de boucliers compté comme protecteur

## Constat

`assessTeamForMission` évalue une équipe avant une mission et affiche une note,
un verdict et une liste de manques. Elle s'appuie sur `heroCapabilities`, qui
déduisait les capacités d'un champion en cherchant des **sous-chaînes** dans ses
effets de compétence concaténés :

```js
const hasAny=(text,values)=>values.some(value=>text.includes(value.toLowerCase()));
// text = tous les effets du champion, en minuscules, colles bout a bout
```

La liste `shield` contenait l'entrée `'shield'`. Trois effets du jeu la
contiennent comme sous-chaîne tout en désignant exactement l'inverse :

| Effet | Ce qu'il fait réellement |
|---|---|
| `shieldBreaker` | Brise le bouclier de l'ennemi |
| `shieldExpose` | Expose l'ennemi, bonus de dégâts s'il est protégé |
| `shieldExecute` | Finisseur sur une cible dont le bouclier est tombé |

## Impact

Un seul champion du roster est concerné, mais c'est le pire cas possible :

**Korga, « Brise-bouclier »**, dont les trois compétences sont `shieldBreaker`,
`shieldExpose` et `shieldExecute`. Le spécialiste anti-bouclier du jeu était
compté comme un fournisseur de boucliers.

Conséquences sur la note affichée à toute équipe contenant Korga :

- `checks.survival` gagnait **+8 points** injustifiés ;
- `checks.sustain` affichait **« Partiel »** au lieu de **« Absent »** ;
- le manque « Aucun soin fiable pour un combat prolongé » restait signalé, mais
  le joueur voyait par ailleurs une ligne de soutien rassurante.

Autrement dit, l'écran conseillait d'engager un combat prolongé avec une équipe
qui n'a aucune protection réelle.

## Correction

Le rapprochement se fait désormais sur l'**identifiant d'effet exact**, via un
`Set`, et non plus par sous-chaîne sur une chaîne concaténée.

Deux entrées manquantes, vérifiées dans le moteur, ont été ajoutées :

- `aegisStrike` accorde un bouclier — `shield(low, actor.maxHp*.08)` — et
  n'était pas dans la liste `shield` ;
- `gardenThorn` applique Ralentissement — `debuff(chosen,'slow',2,.75)` — et
  n'était pas dans la liste `control`.

Aucun champion actuel ne change de classement par ces deux ajouts : les
champions qui les portent avaient déjà un autre effet qualifiant. Ils comptent
pour les champions à venir.

Les notes `damage`, `survival`, `tempo` et le score final sont désormais bornés
à l'intervalle 0–100. Le score pouvait devenir négatif : il est calculé comme
une moyenne diminuée de 7 points par manque détecté, et six manques simultanés
sont atteignables sur une équipe incomplète en raid.

## Ce qui n'a pas été touché, et pourquoi

Les listes `heal`, `cleanse` et `debuff` ont été converties au rapprochement
exact **sans changer leur contenu effectif** : chaque effet capté auparavant
l'est encore.

J'ai tenté de re-dériver l'ensemble des classifications en analysant le moteur,
pour repérer d'autres oublis. L'analyse n'est pas concluante : le moteur est une
longue chaîne de `if(e==='...')` sans frontières nettes, et une fenêtre de
lecture trop étroite manque des effets traités à plusieurs endroits — c'est le
cas de `unstableStun` — tandis qu'une fenêtre plus large déborde sur le code
voisin et classe `arcaneBlast` comme un soin.

Ces listes méritent une relecture manuelle, kit par kit. Candidats repérés mais
**non vérifiés**, à arbitrer :

- `impactFracture`, `lowTide`, `anchorStrike` semblent appliquer du contrôle
  (Ralentissement, retrait de jauge) sans figurer dans `control` ;
- `emberSpread`, `virulentSpread`, `virulentStrike` semblent appliquer des
  afflictions sans figurer dans `debuff`.

Je ne les ai pas ajoutés : chaque ajout modifie la note vue par le joueur, et
une correction non vérifiée rendrait ce chiffre moins fiable, pas plus.

## Verrous

`tests/stats.assessment.test.js` :

- aucune compétence anti-bouclier ne peut revenir dans la liste `shield` ;
- Korga, pris du roster réel, n'est pas compté comme protecteur ;
- chaque effet listé dans `SKILL_TAGS` existe réellement sur un champion **et**
  est traité par le moteur — une entrée morte donne l'illusion d'une couverture
  qui n'existe pas ;
- le rapprochement reste exact : un effet nommé `rescueShieldBreaker` ne compte
  pas comme protection.
