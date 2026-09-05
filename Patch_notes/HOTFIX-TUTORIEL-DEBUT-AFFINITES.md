# Azerune - Correction du tutoriel de début, étape Affinités

## Problème

À l'étape 6/11 « Affinités offensives », aucun champion actif n'est attendu. Le bouton Affinités était rendu uniquement dans le panneau d'un acteur, donc le tutoriel affichait « Le moteur prépare le prochain acteur... » et devenait impossible à poursuivre.

## Correction

- Ajout d'un panneau dédié aux étapes informatives, indépendant d'un champion actif.
- Le bouton « Ouvrir le rappel » reste visible à l'étape Affinités.
- L'étape n'est validée qu'à la fermeture du rappel avec « Compris » ou en cliquant sur l'arrière-plan.
- Après fermeture, le tutoriel passe à l'étape 7 et prépare le champion attendu.
- Aucun changement du moteur, des dégâts, de la progression ou de l'Académie.

## Fichier modifié

```text
src/pages/TutorialPage.jsx
```

## Installation

Extraire le ZIP à la racine du projet, accepter le remplacement, puis lancer :

```powershell
npm run build
```
