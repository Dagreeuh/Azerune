# Azerune v1.50.11 - Lisibilite du filtre d'element

## Probleme corrige

Le menu natif du filtre d'element pouvait etre affiche avec un fond blanc par Chromium ou Windows, tout en conservant le texte cyan tres clair du select ferme. Les noms Arcane, Eau, Feu, Lumiere, Nature et Ombre devenaient alors presque invisibles.

## Correction

- Le select ferme conserve son fond sombre et son texte clair.
- Les options du menu natif utilisent un fond blanc et un texte gris tres fonce, combinaison fiable lorsque le navigateur impose une liste blanche.
- L'option selectionnee conserve un contraste blanc sur bleu lorsque le navigateur autorise sa personnalisation.
- `color-scheme: light` est limite au filtre d'element afin de stabiliser le menu natif sans modifier le theme sombre du reste du jeu.
- Une classe explicite est ajoutee aux options pour renforcer la compatibilite entre navigateurs.

## Fichiers modifies

- `src/pages/HeroesPage.jsx`
- `src/styles.css`

## Installation

Extraire ce ZIP directement a la racine du projet Azerune et accepter le remplacement des fichiers.

## Verification

1. Ouvrir le Codex.
2. Ouvrir le filtre Tous les elements.
3. Verifier que chaque nom est lisible sur le fond du menu.
4. Selectionner successivement Arcane, Eau, Feu, Lumiere, Nature et Ombre.
5. Verifier le rendu sur ordinateur et telephone.
