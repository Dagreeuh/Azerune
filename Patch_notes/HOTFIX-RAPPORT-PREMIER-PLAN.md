# Azerune - Rapport de combat au premier plan

## Correction

La fenêtre de résultat utilise un `z-index` de 6500, tandis que le rapport de combat utilisait un `z-index` de 6200. Le rapport était donc affiché derrière la fenêtre de victoire ou de défaite.

Le rapport utilise désormais :

```css
z-index: 7000;
```

La fenêtre de résultat reste visible sous le fond assombri et réapparaît lorsque le rapport est fermé.

## Fichier modifié

```text
src/styles.css
```

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement, puis lancer :

```powershell
npm run build
```

## Vérifications

- rapport au-dessus de la fenêtre de résultat ;
- fermeture par la croix ;
- fermeture en touchant l'arrière-plan ;
- résultat toujours présent après fermeture ;
- comportement responsive conservé.
