# Chroniques d'Azerune v1.73.0

## Souffle des éons : Aszhal ne donne plus un bonus, il envoie une facture

**Type :** refonte de champion
**Date :** 10 septembre 2026

## Avant

« Toute l'équipe gagne 15 % de dégâts et de la jauge. » Lisible, efficace, et
sans aucune décision : rien à préparer, rien à regarder, aucun moment où le
lancer était meilleur qu'un autre.

## Maintenant

**Souffle des éons** ouvre une **Plaie temporelle** sur **tous** les ennemis
pendant 3 tours, et amplifie l'équipe.

Tant qu'une Plaie est ouverte, **15 % des dégâts qu'un allié amplifié par Aszhal
inflige à cet ennemi sont mis de côté**. Quand la Plaie se referme, tout est
rendu d'un coup en dégâts Arcanes.

Ce qui change dans la façon de le jouer :

- **L'amplification n'est plus la récompense, c'est la condition.** Un allié
  qu'Aszhal n'a pas amplifié ne nourrit aucune Plaie.
- **Une équipe qui ne frappe pas ne reçoit rien.** Le sort peut être gâché.
- **Il faut choisir sa cible.** Chaque Plaie ne compte que ce qu'elle a reçu.
- La Plaie se referme au tour de l'ennemi qui la porte, comme le Poison et la
  Brûlure.

**Résonance IV** porte la part de 15 % à 20 %.

En **Raid 4v4**, la part baisse à 10 % dès que trois autres alliés sont
amplifiés — c'est la clause du sort d'origine, et elle mord réellement.

## Aszhal a désormais une pastille

Il était l'un des trois champions sans ressource à suivre. L'écran de combat
affiche maintenant le nombre de Plaies ouvertes, le total en attente et les
tours restants.

## Équilibrage : c'est un renfort d'environ 5 %

Mesuré à graines appariées sur 40 combats de 24 tours : l'apport du sort passe
de **+6,7 %** à **+12,0 %** des dégâts d'équipe, ce qui vaut **+5 %** sur la
contribution totale d'Aszhal. Il arrive ainsi à parité avec une championne de
pur dégât, ce qui est défendable pour un soutien sans soin ni protection — mais
c'est bien un renfort, pas un échange neutre.

## Couverture

`tests/aszhal.plaie.test.js` : 23 tests, 20 mutations sur 20 tuées.
Suite complète : **1 550 tests**, 72 fichiers, tous au vert.

Détail, mesures et réserves : `Audit/RAPPORT-EXPERIENCE-JOUEUR.md`, section 19.
