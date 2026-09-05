# Azerune - Hotfix Korga : icônes des affaiblissements

## Problème

La compétence 2 de Korga peut afficher simultanément deux affaiblissements sur la cible :

- Défense réduite
- Exposé

Les deux effets utilisaient la même icône `💢`, donnant l'impression que Défense réduite était appliquée deux fois.

## Correction

- `DEF -` conserve l'icône `💢`.
- `Exposé` utilise désormais l'icône distincte `🔓`.
- Aucun changement n'est appliqué aux chances, durées ou calculs du moteur de combat.

## Fichier modifié

```text
src/pages/BattlePage.jsx
```

## Installation

Extraire l'archive à la racine du projet, accepter le remplacement, puis exécuter :

```powershell
npm run build
```
