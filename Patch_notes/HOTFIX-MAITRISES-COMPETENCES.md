# Azerune — Hotfix : palier de maîtrise inatteignable et descriptions perdues

## 1. Un palier de maîtrise que personne ne pouvait débloquer

La troisième compétence d'un champion plafonne au niveau 4, soit **trois**
améliorations. Or *Reflux libéré* de Nerissa (`refluxRelease`) en déclarait
**quatre** :

```
Redistribution +10 %  ·  +10 %  ·  +10 %  ·  Temps de recharge −1 tour
```

Les bonus sont cumulés par `track.slice(0, level - 1)`. Au niveau maximum, cela
s'arrête à trois paliers : la réduction de temps de recharge n'était **jamais**
accordée.

Effet visible dans l'interface : une compétence pourtant au maximum continuait
d'annoncer une amélioration suivante, que le joueur ne pouvait pas acheter.

### Correction

Le quatrième palier est retiré. **Aucun changement en jeu** : il n'était pas
atteignable, donc personne ne l'avait jamais reçu.

Si le comportement voulu était bien d'accorder cette réduction de recharge, la
correction est différente — il faut remplacer l'un des trois paliers de
puissance par le palier de recharge, ce qui modifie l'équilibrage d'une
compétence maximisée. C'est un choix de design, laissé ouvert.

## 2. Deux descriptions de compétence silencieusement écrasées

`DESCRIPTIONS` déclarait deux fois `unstableRelease` et deux fois
`soulMetamorphosis`. Dans un objet littéral, **la dernière déclaration gagne** et
la première disparaît sans erreur.

Pour `unstableRelease`, c'est la version détaillée qui était perdue :

> ❌ affichée : « Convertit toute l'Instabilité en dégâts de zone avec un
> contrecoup à haute charge. »
>
> ✅ perdue : « Consomme toute l'Instabilité en dégâts de zone. À 4 charges,
> Vexil perd 6 % de ses PV max ; à 5 charges, 12 %. Le contrecoup ne peut pas le
> vaincre et ne se déclenche qu'une fois. »

Le joueur perdait les pourcentages exacts du contrecoup — précisément
l'information dont il a besoin pour décider s'il lance ce sort.

La description détaillée est rétablie. Pour `soulMetamorphosis`, c'est la
seconde qui était la plus complète : elle est conservée, le doublon retiré.

## Verrou

`tests/skills.test.js` :

- chaque compétence du roster a **exactement** `skillMaxLevel(index) − 1`
  paliers — ni un de trop, ni un de moins ;
- une compétence au niveau maximum n'annonce plus aucun palier suivant ;
- aucune clé de `DESCRIPTIONS` n'est déclarée deux fois, et chacune vise un
  effet qui existe réellement dans un kit ;
- les bonus montent à chaque niveau et ne redescendent jamais.

Contrôle par mutation : réintroduire le palier de Nerissa fait échouer 2 tests,
dont un qui affiche « Nerissa · compétence 3 (refluxRelease) : 4 paliers pour 3
attendus » ; redupliquer une description en fait échouer 1.

## Vérification

`npm test` — 536 tests, dont 21 sur les maîtrises.
