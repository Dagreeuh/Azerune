# Campagne — la courbe de progression

## En bref

La campagne Normal ne se terminait pas. Un joueur qui nettoyait chaque mission
une fois s'arrêtait au cinquième continent sur dix, et comme Difficile est
verrouillé derrière un clear intégral de Normal, les deux autres difficultés
étaient inaccessibles.

L'XP versée par les missions suit désormais la courbe de niveaux au lieu d'une
droite, et les difficultés se raccordent entre elles au lieu de repartir de zéro.

## Ce qui n'allait pas

**L'XP grandissait en ligne droite, le coût des niveaux en puissance.** La
récompense passait de 3 526 XP pour la zone 1 à 8 638 pour la zone 10 — un
facteur 3,4. Traverser la bande de niveaux correspondante passait de 3 045 XP à
458 116 — un facteur 150.

La campagne couvrait donc 116 % de sa bande de niveaux en zone 1 et **13 %** en
zone 10. On arrivait au Cœur Ignifugé, zone annoncée niveaux 55-60, au
**niveau 25**. Le ratio de puissance restait cloué à 0,7-0,8 du début à la fin :
le joueur ne rattrapait jamais son retard, il le creusait.

**Les difficultés ne se raccordaient pas.** La courbe d'objets, elle, était déjà
continue : la zone 10 de Normal finit au niveau d'objet 75-76 et la zone 1 de
Difficile commence à 74-75. Mais la courbe d'ennemis réindexait à la zone 1 à
chaque difficulté. Le joueur gardait tout son équipement de fin de Normal et
retrouvait des ennemis de zone 1 simplement multipliés. Il entrait en Difficile
à 1,84 fois la puissance recommandée et traversait les dix continents **sans une
seule partie de farm**. Hardcore ouvrait à 2,20.

## Ce qui change

**L'XP est ancrée sur la courbe de niveaux.** Nettoyer entièrement une zone
verse 62 % de l'XP nécessaire pour traverser la bande que cette zone annonce. Le
reste vient du farm et des autres contenus — c'est le réglage, pas un oubli.

La forme interne ne bouge pas : le boss garde sa prime, les paliers gardent leur
montée, Difficile et Hardcore gardent leurs bonus. Seule l'échelle par zone
change, de ×0,54 en zone 1 à ×6,95 en zone 10.

La zone 1 **baisse**. Elle versait 116 % de sa bande quand toutes les autres en
versaient une fraction : sa générosité était l'autre bout du même déréglage.

**Les difficultés se raccordent.** Un facteur de continuité rattrape l'écart à
l'entrée de Difficile et de Hardcore, puis s'efface à la zone 10 — là où les
deux courbes se rejoignaient déjà. Difficile ouvre à ×1,53 et termine à ×1,05.

**L'onglet Difficile annonçait « 3★ à 5★ ».** Le butin y plafonne à 4★ ; la 5★
n'existe qu'en Hardcore. L'aperçu par mission disait vrai, seul le libellé de
l'onglet mentait.

## Ce que ça donne

Le niveau suit enfin la bande : on arrive au sixième continent au niveau 33-37
pour une bande 31-36, au lieu du niveau 18. La campagne Normal se termine. Et
Difficile redevient un contenu : de 0 farm à plus d'une centaine de parties sur
un parcours mesuré, avec une entrée à 1,21-1,36 au lieu de 1,84.

Le farm reste utile sans être obligatoire partout, et les autres contenus restent
nécessaires — c'était le but.

## Sous le capot

Les 1 029 tests existants passaient tous **avant** correction, alors que l'XP a
été multipliée par 7 sur la zone 10 et la puissance des ennemis par 1,5 à
l'entrée de Difficile. Aucun ne regardait la courbe de progression.

`tests/campagne.progression.test.js` verrouille désormais les invariants en
pourcentages plutôt qu'en valeurs — couverture d'une zone entre 45 % et 80 % de
sa bande, dérive entre zones sous 40 %, pas de marche descendante entre
difficultés, et un facteur de continuité qui vaut réellement plus au début qu'à
la fin. Treize mutations appliquées, treize tuées.

Audit complet et méthode de mesure : `Audit/RAPPORT-DIFFICULTE-CAMPAGNE.md`.

**1 052 tests, 39 fichiers.**
