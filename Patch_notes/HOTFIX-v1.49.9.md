# Azerune - Hotfix v1.49.9 - Stabilité de la boucle de combat

## Symptôme corrigé

Le combat pouvait parfois rester figé jusqu'à ce que le joueur quitte la page puis revienne. Le remontage de la page relançait alors les effets React et le combat reprenait.

## Cause traitée

La page possédait des sécurités séparées pour les tours ennemis et le mode AUTO, mais aucune surveillance globale de la boucle. Un état pouvait donc rester bloqué dans les situations suivantes :

- `turn` restait vide sans produire une nouvelle transition React ;
- le tour pointait vers une unité morte ou absente ;
- un verrou ennemi ou AUTO restait actif après une interruption asynchrone ;
- une erreur dans le calcul du prochain tour laissait le combat sans relance ;
- un retour au premier plan arrivait après l'expiration ou l'annulation d'un minuteur.

## Corrections

### Surveillance globale

Une pulsation surveille désormais la progression réelle du combat toutes les 750 ms à partir du tour, du journal, des événements et de la vague.

### Récupération automatique

Le combat est relancé lorsque :

- aucun tour n'est attribué pendant anormalement longtemps ;
- le tour courant désigne une unité invalide ;
- un tour ennemi reste bloqué ;
- un tour allié en mode AUTO reste bloqué.

Un tour allié manuel n'est jamais forcé, afin de laisser au joueur le temps de choisir une compétence.

### Verrous et reprise

Lors d'une récupération :

- les verrous ennemi et AUTO sont remis à zéro ;
- la génération AUTO précédente est invalidée ;
- le tour invalide est supprimé ;
- `nextTurn()` est relancé immédiatement ;
- la reprise après changement d'onglet ou retour de focus déclenche la même vérification.

### Sécurité d'erreur

Si `nextTurn()` lève une exception, l'erreur est isolée, le mode AUTO est désactivé et une nouvelle tentative reste possible au lieu de figer la page.

## Journal

Une récupération réussie ajoute :

```text
Watchdog : boucle de combat relancée automatiquement.
```

## Fichier modifié

```text
src/pages/BattlePage.jsx
```

`engine.js` et `GameContext.jsx` ont été contrôlés mais ne nécessitent pas de remplacement pour ce correctif.

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement, puis exécuter :

```powershell
npm run build
```

## Tests recommandés

1. Lancer plusieurs combats en AUTO pendant plusieurs minutes.
2. Alterner rapidement AUTO actif et AUTO désactivé.
3. Passer sur un autre onglet du navigateur pendant un tour ennemi, puis revenir.
4. Tester Campagne, Raid, Expédition et Mythic+.
5. Vérifier les changements de vague Mythic+.
6. Laisser volontairement un tour manuel ouvert plus de 10 secondes et vérifier qu'il n'est pas forcé.
7. Rechercher les messages `Watchdog` dans le journal pour identifier une récupération.
