# Azerune v1.50.9 - Filtres Équipements et Codex

## Nouveautés

### Équipements

- Filtre par statistique principale.
- Filtre par statistique secondaire.
- Les statistiques secondaires ajoutées ou améliorées à la Forge sont prises en compte grâce aux statistiques effectives.
- Les nouveaux filtres se combinent avec l’emplacement, la qualité et le set.
- Bouton de réinitialisation unique et compteur de résultats dynamique.

### Codex

- Filtre par type : Tank, DPS, Soigneur, Soutien, Contrôle et Protecteur.
- Un champion peut appartenir à plusieurs types.
- Le filtre se combine avec le nom, le rôle textuel, la rareté et la possession.
- Bouton de réinitialisation unique.

## Fichiers modifiés

- `src/pages/EquipmentPage.jsx`
- `src/pages/HeroesPage.jsx`
- `src/data/championIdentities.js`
- `src/styles.css`

## Installation

Extraire le ZIP directement à la racine d’Azerune et accepter le remplacement des fichiers.

## Tests recommandés

1. Combiner emplacement, set, stat principale et stat secondaire.
2. Vérifier une statistique secondaire ajoutée à +3, +6, +9, +12 ou +15.
3. Vérifier le bouton Réinitialiser et le compteur d’objets.
4. Tester chaque type du Codex avec rareté et possession.
5. Vérifier la barre de filtres sur téléphone et ordinateur.
