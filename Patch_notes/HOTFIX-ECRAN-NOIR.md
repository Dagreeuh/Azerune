# Azerune v1.51.1 - Correctif écran noir

## Cause principale

`emitProgressEvent('summonerNamed')` était exécuté directement pendant chaque rendu de `GameProvider`, en dehors du corps de `setSummonerName`. Cet appel mettait à jour plusieurs états React pendant le rendu et déclenchait une boucle infinie.

## Corrections

- déplacement de l'événement `summonerNamed` dans `setSummonerName` ;
- émission uniquement lorsqu'un nom non vide est enregistré ;
- définition de `required` et `claimedInCycle` dans le Journal de quêtes ;
- masquage du coffre pour l'onglet permanent Progression ;
- ajout de `legendaryChronicles` aux dépendances de la liste des hauts faits.

## Fichiers modifiés

```text
src/store/GameContext.jsx
src/pages/QuestsPage.jsx
src/pages/AchievementsPage.jsx
```

## Installation

Extraire l'archive directement à la racine du projet, accepter le remplacement, puis exécuter :

```powershell
npm run build
```

La sauvegarde ne doit pas être supprimée.
