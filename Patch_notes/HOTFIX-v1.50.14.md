# Azerune v1.50.14 - Filtre d'élément natif uniforme

## Correction

Le filtre d'élément utilise maintenant exactement le même élément HTML `<select>` et les mêmes règles CSS que les filtres Rareté, Possession et Type.

## Nettoyage

- suppression du menu React personnalisé ;
- suppression de `useEffect` et `useRef` ;
- suppression des états et gestionnaires du menu personnalisé ;
- suppression de toutes les classes CSS spécifiques au filtre d'élément ajoutées en v1.50.10 à v1.50.13 ;
- conservation uniquement de la grille responsive nécessaire pour loger le filtre supplémentaire.

## Fichiers modifiés

- `src/pages/HeroesPage.jsx`
- `src/styles.css`

## Installation

Extraire le ZIP directement à la racine d'Azerune et accepter le remplacement des fichiers.
