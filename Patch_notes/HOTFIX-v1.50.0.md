# Azerune v1.50.0 - Académie interactive

## Fonctionnalité

Ajout de l'onglet **📘 Académie** avec 12 leçons interactives, des démonstrations, des mini-défis rejouables et des récompenses uniques.

## Récompenses

- 50 Cristaux par leçon terminée et réclamée, soit 600 Cristaux au total.
- Récompense finale : 300 Or et 1 Pierre de foyer.
- Une récompense ne peut être récupérée qu'une seule fois.

## Fichiers ajoutés

- `src/data/tutorials.js`
- `src/pages/TutorialAcademyPage.jsx`
- `src/components/TutorialModal.jsx`

## Fichiers modifiés

- `src/App.jsx`
- `src/store/GameContext.jsx`
- `src/components/Layout.jsx`
- `src/styles.css`

## Sauvegarde

La progression est enregistrée dans `azerune-save` sous `tutorialAcademy` avec `completed`, `claimed` et `finalClaimed`. Les anciennes sauvegardes reçoivent automatiquement une structure vide.

## Installation

1. Extraire le ZIP directement à la racine du projet.
2. Accepter le remplacement des fichiers existants.
3. Lancer `npm run dev`.
4. Ouvrir l'onglet **Académie** dans le menu.

## Vérifications recommandées

- Terminer une leçon puis récupérer exactement 50 Cristaux.
- Rejouer la leçon et vérifier que la récompense ne peut pas être récupérée deux fois.
- Terminer les 12 leçons et récupérer 300 Or et 1 Pierre de foyer.
- Recharger la page et vérifier la conservation de la progression.
- Exporter puis importer la sauvegarde et vérifier la progression de l'Académie.
- Tester l'interface sur ordinateur et smartphone.
