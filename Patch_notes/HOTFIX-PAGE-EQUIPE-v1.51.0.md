# Azerune - Hotfix complet Page Équipe v1.51.0

## Objectif
Transformer Équipe en constructeur de formations autonome et conserver Codex comme espace d'information détaillée.

## Changements
- Affichage de tous les champions possédés dans Équipe.
- Trois emplacements actifs sélectionnables.
- Ajout au premier emplacement libre ou remplacement ciblé.
- Recherche, filtre par rôle, filtre par élément et tris par puissance, niveau, étoiles ou nom.
- Indication des champions déjà présents et de leur emplacement.
- Accès direct aux Priorités AUTO depuis chaque carte.
- Gestion des 9 équipes, renommage et copie vers un autre preset.
- Presets vides réellement chargeables.
- Équipe temporairement vide autorisée dans le constructeur, mais toujours refusée au lancement d'un combat.
- Sauvegarde automatique conservée.
- Grande fiche documentaire retirée du mode Équipe et conservée dans Codex.

## Fichiers modifiés
```text
src/pages/HeroesPage.jsx
src/store/GameContext.jsx
src/styles.css
```

## Installation
Extraire l'archive directement à la racine du projet, accepter les remplacements, puis lancer :

```powershell
npm run build
```
