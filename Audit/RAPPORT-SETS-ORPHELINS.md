# Trois sets d'équipement ne font rien en combat

## Constat

`src/data/items.js` déclare six sets porteurs d'un `effect`. Le moteur de
combat `src/battle/engine.js` n'en lit que trois.

| Set | Bonus annoncé au joueur | Lu par le moteur |
|---|---|---|
| Vol de vie | Vol de vie 25 % | oui |
| Fournaise ignifuge | Brûlure reçue −25 % | oui |
| Furie volcanique | Dégâts +12 % sous 50 % PV | oui |
| **Protection** | **Bouclier initial 15 %** | **non** |
| **Contre-attaque** | **20 % de contre-attaque** | **non** |
| **Incendiaire** | **25 % de chance d'appliquer Brûlure** | **non** |

Vérification : `grep -c protectionSet src/battle/engine.js` → `0`, idem pour
`counterSet` et `incendiarySet`.

## Impact

Ce sont trois sets 4 pièces. Un joueur qui complète l'un d'eux voit le bonus
affiché dans la page Équipement et n'obtient aucun effet en combat. Le set
Incendiaire est marqué `campaignLate:true` : c'est du butin de fin de campagne,
donc l'effort demandé pour l'obtenir est maximal.

Aucun de ces trois sets n'apporte non plus de `stats` passives — contrairement à
Furie volcanique ou Fournaise ignifuge, qui en ont en plus de leur effet. Ils
sont donc **entièrement inertes** : quatre pièces pour zéro bénéfice.

## Origine

Les trois étaient implémentés dans l'ancien moteur `src/combat/engine.js`,
supprimé depuis (voir `RAPPORT-SUPPRESSION-COMBAT-ENGINE.md`). Ils n'ont jamais
été portés dans `src/battle/engine.js`. Le patch note v1.49.0, qui annonçait
« activer les sets spéciaux manquants », a été appliqué au moteur mort.

C'est le même schéma que le plafond de dégâts périodiques sur les boss : du
travail réel, fait dans le fichier que le jeu n'exécute pas.

## Verrou

`tests/sets.contract.test.js` interdit désormais l'ajout d'un nouveau set
orphelin, et liste ces trois-là comme dette explicite. Implémenter l'un d'eux
fait échouer le test tant qu'il n'est pas retiré de la liste `NON_IMPLEMENTES`.

## Décision à prendre

Pour chacun des trois, deux issues :

1. **Implémenter l'effet** dans `src/battle/engine.js`. Le code de référence est
   récupérable dans l'historique : `git show <commit>^:src/Combat/engine.js`.
2. **Retirer le set** des tables de butin, ou lui donner des `stats` passives à
   la place de son `effect`, pour que le texte affiché corresponde à la réalité.

Laisser en l'état n'est pas une option neutre : le jeu promet aujourd'hui au
joueur quelque chose qu'il ne délivre pas.
