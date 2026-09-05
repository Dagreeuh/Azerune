# Azerune - Hotfix tutoriel de démarrage v1.51.2

## Correctifs
- Déblocage du mode libre lorsque `battle.turn` reste vide.
- Relance automatique de la boucle réelle avec `nextTurn()`.
- Exécution automatique des tours ennemis en mode libre.
- Raccourcis `Q` et `D` pour parcourir les cibles vivantes.
- Raccourcis `1`, `2` et `3` pour lancer les trois sorts.
- Le troisième sort reste temporairement autorisé uniquement dans le tutoriel.
- Affichage des raccourcis dans le panneau de commande sur ordinateur.

## Fichiers modifiés
```text
src/pages/TutorialPage.jsx
src/styles.css
```

## Installation
Extraire le ZIP à la racine du projet puis lancer :

```powershell
npm run build
```

## Vérifications
- Passage du scénario guidé au mode libre.
- Calcul automatique du prochain acteur.
- Enchaînement des tours ennemis.
- Sélection circulaire des cibles avec Q et D.
- Lancement des sorts avec 1, 2 et 3.
- Aucun changement dans l’Académie ou les combats normaux.
