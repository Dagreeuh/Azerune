# Azerune v1.51.4 - Farm de campagne ciblé

## Principes

- La campagne reste composée de 10 régions et 7 missions par région.
- Neuf régions proposent deux sets afin de réduire la longueur artificielle sans supprimer le farm.
- Le joueur choisit un set recherché par difficulté et par région.
- Le compteur augmente uniquement lorsqu'un équipement tombe dans l'autre set.
- Après 10 mauvais drops, le prochain équipement appartient au set sélectionné.
- La garantie porte uniquement sur le set.
- Emplacement, étoiles, qualité, statistique principale, sous-statistiques et jets restent aléatoires.
- Un drop naturel ou garanti du bon set remet le compteur à zéro.
- Une victoire sans équipement ne fait pas progresser la protection.
- Le Cœur Ignifugé reste dédié au set Ignifuge et n'utilise aucune jauge inutile.

## Répartition complémentaire

- Campagne : sets fondamentaux et préparation de progression.
- Expéditions : pools spécialisés déjà présents.
- Raids : Incendiaire et Furie volcanique.
- Mythic+ : équipements de haut niveau et meilleures qualités.

## Fichiers modifiés

```text
src/data/campaign.js
src/data/items.js
src/store/GameContext.jsx
src/pages/CampaignPage.jsx
src/styles.css
```

## Installation

Extraire le ZIP directement à la racine du projet, accepter le remplacement, puis exécuter :

```powershell
npm run build
```

## Tests

1. Ouvrir une région disposant de deux sets.
2. Choisir un set recherché.
3. Vérifier la persistance après rechargement.
4. Obtenir un équipement de l'autre set et vérifier +1.
5. Vérifier qu'une victoire sans équipement ne modifie pas la jauge.
6. Atteindre 10/10 puis vérifier le set du prochain équipement.
7. Vérifier que l'emplacement, la qualité et les statistiques restent aléatoires.
8. Vérifier la remise à zéro après réception du bon set.
