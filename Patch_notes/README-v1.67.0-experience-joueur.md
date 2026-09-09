# Chroniques d'Azerune v1.67.0

## Corrections d'expérience joueur

**Type :** confort, équilibrage, nouveauté sociale
**Date :** 9 septembre 2026

## En bref

| | Avant | Après |
|---|---|---|
| Session quotidienne | ~16 min | **5,7 min** |
| Combat médian | 106 actions | **38 actions** |
| Victoires en AUTO près du seuil | 30,6 % | **51,3 %** |
| Écart meilleur→pire champion | 135 % | **77 %** |

## Combats

- **Tempo** — les réserves de PV des deux camps sont divisées par 2,4. Les
  combats durent trois fois moins longtemps, sans toucher au rapport
  soin/dégâts : tout ce qui s'exprime en pourcentage de PV max se calcule sur
  la réserve d'avant la coupe.
- **Ciblage automatique** — l'AUTO ne comptait que l'affinité et n'achevait
  jamais personne. Il concentre désormais ses coups sur l'ennemi le plus bas :
  +20,7 points de victoires près du seuil.
- **Vitesse x1 / x2 / x3** en combat automatique.

## Préparation

- **« Estimer mes chances »** — le jeu joue vraiment la mission 20 fois avec
  votre équipe et répond « Tu gagnes 14 fois sur 20 », au lieu d'annoncer un
  nombre de puissance qui se trompait de −21 % à +43 %.

## Confort

- **Balayage** — une mission maîtrisée à 3★ se récolte sans combat, 12 fois
  par jour, avec exactement la même récolte qu'un combat rejoué.

## Entre amis

- **Défi de la semaine** — la même rencontre pour tout le monde pendant sept
  jours, un score comparable et un code court à s'échanger. Sans serveur. Le
  score est la part de points de vie arrachés, et la tentative compte même sur
  une défaite : des amis de niveaux différents peuvent se comparer.

## Champions

- **Hicho** — ses totems galvanisent l'équipe en plus de la soigner. Il remonte
  de la 27ᵉ à la 21ᵉ place. Il reste un soigneur pur, statistiques inchangées.
- **Yunmei** — sa Paume de brume passe de 0,85 à 0,70 : elle soignait et
  frappait comme un attaquant, et sortait meilleure que tous les 5★. Sa
  résurrection n'est pas touchée.
- **Nyxaris** — « Incantation prolongée » infligeait 0 dégât, seul premier sort
  du roster dans ce cas. Elle frappe désormais en chargeant.

## Effets visuels

Les effets de sort étaient rendus mais illisibles : un halo blanc de 96 px sur
une carte de 107 px lavait la couleur élémentaire, et l'effet se jouait
exactement derrière le compteur de dégâts. Halo resserré et coloré, effets
descendus sur la moitié basse de la carte.

## Ce qui n'a pas été retenu

Annoncer les mécaniques de zone un tour à l'avance pour permettre de les parer
a été implémenté, mesuré, puis retiré : la parade coûtait au joueur 8,1 points
de taux de victoire. Détail et mesures dans `Audit/RAPPORT-EXPERIENCE-JOUEUR.md`.

## Vérification

1 390 tests, 59 fichiers, tous au vert. 69 mutations testées sur les
changements de cette version, 69 tuées. Mesures reproductibles avec
`npm run mesures`.
