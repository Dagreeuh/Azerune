# Azerune - Gros hotfix d'équilibrage de la Campagne

## Objectif
Repousser le grind obligatoire, lisser les dix zones et supprimer la régression de qualité des zones 5 à 9.

## Changements principaux
- Courbe régionale lissée zone par zone.
- Boss de zone 5 assoupli; boss final de zone 10 conservé comme épreuve majeure.
- Qualités strictement ascendantes en Normal, Difficile et Hardcore.
- Pools de sets de `items.js` alignés sur les sets affichés par `campaign.js`.
- Premier clear toujours garanti.
- Boss Normal des zones 1 à 3: pièce pédagogique supplémentaire Vitalité, Attaque ou Défense.
- Boss final Normal: pièce Ignifuge supplémentaire conservée.
- Transition recalibrée vers Rhazakar et Mythic+.
- Aucun ciblage de set, compteur visible ou sécurité répétable ajouté.

## Installation
Extraire le ZIP à la racine du projet, accepter les remplacements, puis exécuter `npm run build`.

## Compatibilité
Les équipements et scores existants sont conservés. Les anciennes données non utilisées restent ignorées sans suppression.
