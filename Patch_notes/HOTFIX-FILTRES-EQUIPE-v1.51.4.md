# Azerune - Hotfix filtres Équipe v1.51.4

## Audit

La page Codex utilisait déjà `CHAMPION_TYPE_OPTIONS` et `championTypes(hero)` pour proposer six catégories fonctionnelles. La page Équipe reconstruisait au contraire une liste à partir de `hero.role`, ce qui exposait des spécialisations très détaillées et abstraites.

## Correction

- Remplacement de « Tous les rôles » par « Tous les types » dans Équipe.
- Réutilisation exacte des catégories du Codex :
  - 🛡️ Tank
  - ⚔️ DPS
  - 💚 Soigneur
  - 🌿 Soutien
  - 🌀 Contrôle
  - 🔷 Protecteur
- Filtrage avec `championTypes(entry).includes(teamType)`.
- Prise en charge des champions appartenant à plusieurs catégories.
- Conservation des filtres Élément, Recherche et Tri.
- Réinitialisation adaptée au nouveau filtre.
- La spécialité détaillée reste visible sur les cartes.
- Aucun changement du Codex, des équipes enregistrées ou de la composition active.

## Fichier modifié

```text
src/pages/HeroesPage.jsx
```

## Fichiers audités mais inchangés

```text
src/data/championIdentities.js
src/styles.css
```

## Installation

Extraire le ZIP à la racine du projet, accepter le remplacement, puis lancer :

```powershell
npm run build
```

## Vérifications

- Les six options proviennent de la même constante que le Codex.
- Un champion multi-type apparaît dans chacune de ses catégories.
- « Réinitialiser » remet le type sur « Tous les types ».
- La recherche continue à reconnaître le nom et la spécialité détaillée.
- Les tris Puissance, Niveau, Étoiles et Nom restent inchangés.
