# Azerune v1.50.12 - Menu d'élément noir personnalisé

## Correctif

Le sélecteur HTML natif a été remplacé par un menu React personnalisé. Le navigateur ne peut donc plus imposer un fond blanc.

## Rendu

- fond noir `#020617` ;
- texte clair ;
- police monospace identique à Azerune ;
- graisse normale `400`, y compris pour l'option sélectionnée ;
- survol bleu sombre ;
- coche discrète sur l'élément actif ;
- icônes conservées.

## Comportement

- fermeture après sélection ;
- fermeture au clic ou au toucher à l'extérieur ;
- fermeture avec `Échap` ;
- navigation avec les flèches ;
- validation avec `Entrée` ou `Espace` ;
- attributs ARIA `listbox` et `option` ;
- menu mobile agrandi et placé au-dessus de la navigation.

## Fichiers modifiés

- `src/pages/HeroesPage.jsx`
- `src/styles.css`

## Installation

Extraire le ZIP directement à la racine du projet Azerune et accepter le remplacement des fichiers.
