# Chroniques d'Azerune v1.68.0

## Battue des systèmes : ce qui était annoncé sans être appliqué

**Type :** correctifs
**Date :** 10 septembre 2026

Après le tour de tous les champions (v1.67.0), la même méthode appliquée aux
Empreintes, aux armes Uniques et aux sets d'équipement.

## Armes Uniques

Trois pouvoirs sur sept ne faisaient rien.

- **Bâton des Astres Brisés** — « Cinq compétences alliées éveillent un
  alignement protecteur » n'existait nulle part. L'alignement accorde désormais
  un bouclier à toute l'équipe toutes les cinq compétences, **sans exiger de
  dégâts** : c'est une arme de soutien, elle doit servir à un soigneur.
- **Égide des Mille Marées** — « Les soins excédentaires alimentent une égide
  collective » n'existait pas non plus. Le surplus de soin devient maintenant du
  bouclier partagé au lieu d'être perdu.
- **Cendre-Sépulcrale** — la chronique fait choisir entre lame purifiée et lame
  corrompue, et seule la corrompue était implémentée. La lame purifiée délivre
  l'allié le plus bas d'un malus et le soigne.

## Empreintes

Le tableau était identique pour tous les champions, alors que les kits diffèrent :
un bonus de fiabilité sur une compétence qui ne tente aucun jet ne fait rien.
**84 nœuds sur 384 étaient décoratifs**, jusqu'à 6 sur 12 pour Caelion.

Chaque nœud garde l'intention de sa branche mais se porte désormais sur une
compétence qui sait s'en servir. La forme du tableau et ses coûts ne changent
pas. **Plus aucun nœud mort.**

Le texte de chaque nœud est maintenant dérivé du bonus réellement retenu : il
nomme la compétence touchée et dit le vrai type de bonus.

## Sets d'équipement

Les quinze sets ont été vérifiés : tous leurs effets sont consommés par le
moteur et tous leurs bonus chiffrés correspondent. Rien à corriger.

## Vérification

1 447 tests, 65 fichiers, tous au vert. 13 mutations testées sur ces
changements, 13 tuées. Battue rejouable avec `npm run mesures`.

Détail complet, y compris quatre fois où c'est la mesure elle-même qui mentait :
`Audit/RAPPORT-EXPERIENCE-JOUEUR.md`, sections 13 et 14.
