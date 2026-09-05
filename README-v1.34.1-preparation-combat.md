# Azerune v1.34.1 - Préparation avant combat

Cette mise à jour est cumulative avec la v1.34.0.

- Toute activité utilisant `requestMissionStart()` ouvre désormais la préparation d’équipe.
- Cela couvre automatiquement Campagne, Raids et Expéditions sans modifier chaque page séparément.
- Choix parmi les neuf équipes enregistrées.
- Modification temporaire des trois champions avant le lancement.
- Puissance choisie et puissance recommandée visibles.
- La composition confirmée est copiée dans `battleSession.team` et ne change plus pendant le combat.
- Les informations permanentes et les neuf équipes de la v1.34.0 sont conservées.

Remplacez :
- `src/store/GameContext.jsx`
- `src/components/Layout.jsx`
- `src/pages/HeroesPage.jsx`
- `src/styles.css`
