# Azerune Hotfix v1.46.5

## Fonctionnalité
Navigation contextuelle après une victoire.

## Changements
- Ajout de `Mission suivante` en Campagne pour les missions 1 à 6 de la même zone.
- Ajout de `Niveau suivant` pour les Expéditions, Raids et Mythic+.
- Aucun passage automatique vers une autre zone, un autre Raid ou au-delà du niveau maximal.
- Aucun bouton suivant pour les World Boss ou après une défaite.
- Ajout d’un bouton explicite de retour adapté à chaque activité.
- L’équipe actuelle est conservée et la fenêtre de préparation reste disponible avant le lancement.
- Les priorités AUTO sont conservées, mais le nouveau combat démarre avec AUTO désactivé.
- Vérification que la victoire précédente est enregistrée avant de créer la préparation suivante.
- Protection contre la création simultanée de deux sessions.

## Fichiers modifiés
- `src/pages/BattlePage.jsx`
- `src/store/GameContext.jsx`
- `src/styles.css`

## Fichiers de données inclus
- `src/data/campaign.js`
- `src/data/raids.js`
- `src/data/expeditions.js`
- `src/data/mythic.js`

## Vérifications
- Compilation JSX de BattlePage et GameContext.
- Résolution de la mission suivante depuis les constructeurs officiels.
- Limites Campagne 7, Expédition 10, Raid 10 et Mythic+ 30.
- Absence de bouton suivant après défaite et World Boss.
- Archive ZIP vérifiée.

## Installation PC
```powershell
npm run dev
```

## Installation Android
```powershell
npm run build
npx cap sync android
npx cap open android
```

## Tests recommandés
1. Gagner une mission 1 à 6 de Campagne et ouvrir la préparation suivante.
2. Gagner le boss d’une zone et vérifier l’absence de mission suivante.
3. Tester un niveau d’Expédition, de Raid et de Mythic+.
4. Vérifier l’absence de bouton après une défaite.
5. Vérifier que les récompenses précédentes ne sont pas attribuées deux fois.
