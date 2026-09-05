# Azerune v1.50.10 - Filtre d'élément du Codex

## Changement

Ajout d'un filtre d'élément dans le Codex des champions.

La liste est générée automatiquement depuis les éléments réellement présents dans `HEROES`, puis les noms et icônes sont récupérés avec `elementMeta`. Le filtre reste donc compatible avec les éléments actuels et avec de futurs éléments ajoutés au roster.

## Combinaisons prises en charge

Le filtre d'élément se combine avec :

- la recherche par nom ou rôle ;
- la rareté ;
- la possession ;
- le type de champion ;
- le compteur des résultats.

Le bouton **Réinitialiser** efface désormais aussi le filtre d'élément.

## Fichiers modifiés

- `src/pages/HeroesPage.jsx`
- `src/styles.css`

## Installation

Extraire le ZIP directement à la racine d'Azerune et accepter le remplacement des fichiers.

## Tests recommandés

1. Sélectionner chaque élément et vérifier la liste affichée.
2. Combiner élément et type de champion.
3. Combiner élément, rareté et possession.
4. Vérifier le bouton Réinitialiser.
5. Contrôler l'affichage sur ordinateur, tablette et téléphone.
