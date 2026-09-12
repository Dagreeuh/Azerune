# Azerune — Hotfix : deux quêtes de compétences impossibles à terminer

## Problème

Deux quêtes attendaient l'événement `skillUsed`, que rien n'émettait :

| Période | Quête | Objectif |
|---|---|---|
| Journalière | ✨ Maître des arcanes | Utiliser 6 compétences |
| Hebdomadaire | 🌠 Maîtrise tactique | Utiliser 60 compétences |

Leur compteur restait donc bloqué à zéro quoi que fasse le joueur. Les deux
étaient affichées dans le Journal, avec leur récompense, sans aucun moyen de les
valider.

Conséquence sur les coffres : le coffre journalier demande 6 quêtes sur 8, et
l'hebdomadaire 7 sur 9. Avec une quête définitivement bloquée dans chaque
période, il ne restait plus aucune marge d'erreur — il fallait terminer
absolument toutes les autres.

## Cause

`HOTFIX-QUETES-VALIDATION` avait relevé le problème d'origine : « les
compétences envoyaient `skills` alors que les quêtes attendaient `skillUsed` ».
Le correctif d'alors a ajouté une traduction `skills` → `skillUsed` dans
`progressQuest`, plutôt que de faire émettre le bon nom. L'émetteur `skills` a
ensuite disparu, et l'alias est devenu une passerelle vers rien.

## Correction

`recordBattleResult` émet désormais `skillUsed`, calculé comme ses voisins
`dotDamageDealt` et `supportDone` : à partir de `combatStats`, qui comptait déjà
les utilisations de compétences par champion sans que personne s'en serve.

L'alias `skills` → `skillUsed` est conservé : il ne coûte rien et protège un
appelant oublié.

Aucun compteur n'est rétroactivement complété. Les prochains combats gagnés font
progresser les deux quêtes normalement.

## Nettoyage

`progressQuest('summon', count)` était appelé lors d'une invocation alors
qu'aucune quête n'écoute `summon` — la ligne suivante émet `heroSummoned`, qui
est l'événement réellement écouté. Appel mort retiré, sans effet en jeu.

## Verrou

`tests/quests.contract.test.js` compare la liste des événements attendus par les
quêtes à celle des événements réellement émis dans tout `src/`. Un écart fait
échouer les tests en nommant les quêtes concernées.

Contrôle du verrou : retirer l'émission de `skillUsed` fait rougir 4 tests, dont
un intitulé « toute quête affichée au joueur peut progresser », qui affiche
`daily/skills « Maître des arcanes » attend skillUsed`.

## Réorganisation

La logique de quête sort de `GameProvider` vers `src/utils/quests.js`, en
fonctions pures : avancement après un événement, seuils de valeur, comptage de
champions distincts, conditions de réclamation et ouverture du coffre.
`GameContext` garde les `setState`.

Les quatre groupes de quêtes passent maintenant par le même calcul. Auparavant
seul le groupe Progression gérait les seuils et les champions distincts ; une
future quête journalière à seuil aurait été ignorée en silence.

## Vérification

`npm test` — 381 tests, dont 39 sur la logique de quête et 7 sur le câblage des
événements.
