# Azerune — Deux puissances recommandées sur le même écran

## Le défaut

En ouvrant la page Mythic+ pour la première fois depuis le rééquilibrage, deux
chiffres se contredisaient à quelques centimètres l'un de l'autre :

- le bloc du **Sablier d'Azerune** calculait son budget sur une puissance
  recommandée de **12 678** ;
- la **jauge de préparation**, juste en dessous, annonçait **43 000**.

La jauge n'utilisait pas la puissance annoncée par la mission. Elle la
recalculait depuis les statistiques des ennemis — et l'Attaque des ennemis
Mythic+ venait d'être multipliée par vingt. Le chiffre a suivi.

```js
// La valeur annoncée n'était honorée que pour la campagne.
if(mission.difficultyId && Number.isFinite(Number(mission.recommended)))
  return Math.round(Number(mission.recommended));
```

Conséquence pour le joueur : une jauge affichant « Très insuffisant » alors
qu'il est correctement équipé, et un budget de Sablier calculé sur une autre
échelle que la préparation affichée.

## La correction

Quand un mode annonce lui-même une puissance calibrée, c'est elle qui fait foi.
La puissance recommandée du Mythic+ est ajustée par moindres carrés sur la
puissance réellement mesurée des joueurs aux trente paliers : la dériver des
statistiques ennemies ne pouvait que produire un second chiffre, différent.

Les Raids et les Expéditions gardent leur calcul dérivé : leurs tables de
puissance n'ont pas été recalibrées, et les toucher sans mesure serait
gratuit.

## Comment il a été trouvé

En lançant le jeu. Ni les 1 014 tests, ni la simulation, ni la relecture ne
pouvaient voir ce défaut : les deux chiffres sont justes séparément, chacun
calculé par une fonction qui fait ce qu'elle annonce. Ils ne se contredisent
que côte à côte, à l'écran.

Deux tests ferment la brèche : la puissance évaluée doit être celle que la
mission annonce, aux trente paliers, et elle doit rester cohérente avec le
budget du Sablier qui la divise.

**1 016 tests.** 2 mutations appliquées au code livré, toutes détectées.
