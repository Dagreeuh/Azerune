# v1.80.0 — Les sorts dans l'arène

L'arène n'est plus un combat qu'on regarde : **c'est toi qui joues.**

## Comment ça marche

À son tour, ton champion affiche ses trois vraies compétences avec leur icône
et leur rechargement. Tu en choisis une, puis une cible, et le combat se
déroule. Les ennemis jouent seuls. Une case « Automatique » rend la main au
moteur si tu veux juste regarder.

## Ce que Lelianna et Hicho font à l'écran

| Compétence | Ce que tu vois |
|---|---|
| **Châtiment** (Lelianna) | elle lève son bâton, une comète dorée traverse l'arène et frappe |
| **Mot de pouvoir : Bouclier** | animation de soin, croix de lumière sur l'allié protégé |
| **Pénitence** | le phénix s'ouvre sur elle, l'éclat doré tombe sur l'ennemi |
| **Vague de soins** (Hicho) | animation de soin, tourbillon vert sur l'allié |
| **Totem guérisseur** | il plante son totem Kyrian |
| **Marée ancestrale** | l'esprit-renard apparaît, chaque allié reçoit son tourbillon |

Ce sont **tes dessins** qui volent et éclosent — les effets viennent de la
rangée « Effets » de tes feuilles, pas d'un habillage générique.

## Voir le câblage

Sous le combat, chaque action laisse une ligne : qui a lancé quoi, quelle
animation a été jouée, quels effets, sur combien de cibles, en combien de
millisecondes. C'est ce que tu voulais voir — et si un effet manque à l'appel,
il s'affiche en rouge plutôt que de disparaître en silence.

Les champions qui n'ont pas encore de feuille dessinée gardent leur animation
d'attaque, sans effet. L'arène le dit au lieu de le cacher.

## Pour tes prochains champions

Rien de neuf à apprendre : une fois la feuille importée, la liaison entre une
compétence et son effet tient en une ligne dans `outils/feuilles/<nom>.json`.
Dis-moi quel effet va sur quel sort, je le branche.
