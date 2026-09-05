# Azerune - Hotfix Académie v1.50.16

## Périmètre

Ce hotfix modifie uniquement l'Académie d'Azerune.

## Corrections

- Reconstruction propre et sécurisée de la page de l'Académie.
- Toutes les actions sont déclenchées uniquement par un clic utilisateur.
- Blocage immédiat des boutons pendant l'attribution d'une récompense.
- Protection en mémoire contre les doubles clics et doubles attributions.
- Validation de l'identifiant d'une leçon avant toute réclamation.
- Conservation de la date de première complétion lors d'une leçon rejouée.
- Calcul automatique du total de Cristaux à partir du nombre de leçons.
- Textes de la récompense finale calculés depuis les constantes réelles.
- État final « prêt » désactivé après récupération.
- Nettoyage des anciennes clés de leçons qui ne figurent plus dans l'Académie actuelle.
- Prise en compte du résultat réel renvoyé par `completeAcademyTutorial`.

## Fichiers modifiés

```text
src/pages/TutorialAcademyPage.jsx
src/data/tutorials.js
src/store/GameContext.jsx
```

## Installation

Extraire cette archive à la racine du projet, accepter les remplacements, puis exécuter :

```powershell
npm run build
```

## Vérifications

- Compilation JSX des composants modifiés.
- Validation syntaxique des données.
- Contrôle des 12 identifiants uniques.
- Contrôle du total de 600 Cristaux calculé dynamiquement.
- Contrôle de la protection contre les doubles réclamations.
