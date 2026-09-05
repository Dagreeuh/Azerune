# Azerune - Hotfix Stuff v1.51.1

## Objectif
Permettre l'amélioration directe des pièces équipées et rendre l'inventaire plus rapide à parcourir.

## Changements
- Ajout du bouton `Améliorer` dans chaque emplacement équipé.
- Réutilisation stricte du modal et de la fonction de Forge existants.
- La pièce conserve son `itemId` et reste équipée pendant l'amélioration.
- Affichage du set, de la qualité, des étoiles, du niveau d'objet, du niveau de Forge, de la statistique principale, des sous-statistiques et du prochain coût.
- Ajout du filtre `Tous / Non équipés / Équipés / Verrouillés`.
- Le filtre `Non équipés` est sélectionné par défaut.
- Tri visuel après filtrage : libres, équipés sur le champion sélectionné, équipés sur un autre champion.
- Les badges de propriétaire existants sont conservés.
- Les armes Uniques conservent toutes leurs restrictions.

## Fichiers modifiés
```text
src/pages/EquipmentPage.jsx
src/styles.css
```

## GameContext
`src/store/GameContext.jsx` a été audité mais ne nécessite aucune modification. `upgradeItem(itemId)` modifie déjà l'objet existant dans l'inventaire, conserve son identifiant, met à jour l'historique et déclenche les statistiques de progression. Les statistiques du champion sont recalculées à partir du même objet équipé.

## Installation
Extraire le ZIP directement à la racine du projet, accepter le remplacement des fichiers puis lancer :

```powershell
npm run build
```

## Vérifications
- Ouverture du modal de Forge depuis un emplacement équipé.
- Actualisation du modal après amélioration.
- Conservation de l'objet équipé.
- Filtre de disponibilité indépendant des autres filtres.
- Tri non destructif, sans modification de l'ordre sauvegardé.
- Responsive ordinateur, tablette et smartphone.
