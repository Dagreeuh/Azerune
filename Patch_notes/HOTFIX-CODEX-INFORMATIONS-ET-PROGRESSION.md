# Azerune - Séparation du Codex et de la page Équipe

## Objectif

Le Codex devient une page dédiée à la consultation et à la progression individuelle des champions. La composition des équipes reste exclusivement dans la page Équipe.

## Codex

Le Codex conserve :

- recherche et filtres du roster ;
- informations d'identité et guide de gameplay ;
- statistiques naturelles et actuelles ;
- Ascension ;
- Résonance et constellation ;
- fragments d'âme ;
- consultation et amélioration des compétences ;
- aperçu des champions non possédés.

Le Codex ne permet plus :

- d'ajouter un champion à l'équipe active ;
- de retirer un champion de l'équipe active ;
- de modifier une composition enregistrée ;
- de gérer les priorités AUTO.

## Page Équipe

La page Équipe conserve sans changement :

- l'équipe active de trois champions ;
- les neuf compositions enregistrées ;
- ajout, retrait et remplacement des membres ;
- renommage et copie des équipes ;
- puissance de l'équipe ;
- filtres du roster possédé ;
- priorités AUTO.

## Fichier modifié

```text
src/pages/HeroesPage.jsx
```

`App.jsx` et `Layout.jsx` ont été vérifiés. Les routes `codex` et `squad` sont déjà correctement séparées et ne nécessitent pas de remplacement.

## Installation

Extraire le ZIP à la racine du projet, accepter le remplacement, puis lancer :

```powershell
npm run build
```
