# Azerune - Sets de Campagne entièrement aléatoires

## Modifications

- Suppression de l'affichage de la protection de set.
- Suppression du compteur « Mauvais drops ».
- Suppression du choix du set recherché.
- Suppression de la préférence de set enregistrée dans la sauvegarde.
- Suppression de la garantie répétable après plusieurs mauvais drops.
- Dans une zone à plusieurs sets, chaque équipement choisit désormais son set aléatoirement avec une probabilité uniforme.
- La pièce, la qualité, la statistique principale et les statistiques secondaires restent aléatoires.
- La première pièce Ignifuge garantie du boss final en Normal est conservée comme récompense de progression vers Rhazakar.

## Fichiers modifiés

```text
src/pages/CampaignPage.jsx
src/data/campaign.js
src/store/GameContext.jsx
```

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement, puis lancer :

```powershell
npm run build
```

Les anciennes clés de ciblage éventuellement présentes dans une sauvegarde sont simplement ignorées.
