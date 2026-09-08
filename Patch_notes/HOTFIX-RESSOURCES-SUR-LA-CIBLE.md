# Hotfix — Virulence et Givre se lisent sur la cible

## Ce qui n'allait pas

Malvek et Sivrane affichaient une barre de ressource figée à zéro. Leur
ressource existe pourtant bien — mais elle ne vit pas sur eux : **Virulence et
Givre sont des cumuls de malus posés sur l'ennemi.** La barre lisait leur
compteur personnel, qui n'a jamais bougé.

## Ce qui change

Chacun a désormais son panneau, lu sur l'ennemi le plus chargé :

- **☠️ Virulence sur la cible** — « 2 cumuls · Loup des fougères »
- **❄️ Givre sur la cible** — « 2/5 · Ronceur », et **BRISURE PRÊTE** dès trois
  cumuls, le seuil auquel Fracture glaciale fige la cible.

Deux nombres à ne pas confondre, et c'est un test qui m'a rattrapé : le Givre
plafonne à **5** cumuls, mais la Brisure ne fige qu'à partir de **3**. Ma
première version affichait « /3 » — elle aurait donc affiché « 4/3 » dès le
quatrième cumul.

## Seraphiel n'était pas concerné

Je l'avais signalé au patch précédent comme étant dans le même cas. **C'était
faux.** Sa Condamnation monte bien sur lui : Dissipation sacrée l'incrémente
quand elle retire des améliorations ennemies. Mon relevé la croyait morte parce
que les ennemis de mon banc d'essai ne portaient aucune amélioration à dissiper
— la mécanique n'avait jamais l'occasion de se déclencher.

Sa barre est inchangée, et un test verrouille désormais le fait qu'elle reste un
compteur personnel.

## Sous le capot

5 tests nouveaux. 12 mutations appliquées, 12 tuées. Une avait survécu :
désactiver le panneau de Malvek laissait le nom de classe présent dans la
branche morte, et mes tests ne regardaient que ce nom. Ils vérifient maintenant
la condition qui allume le panneau.

Vérifié en jeu : « Givre sur la cible 2/5 · Loup des fougères 1 » et
« Virulence sur la cible 2 cumuls · Ronceur 1 », aucune erreur console.

**1 293 tests, 51 fichiers.**
