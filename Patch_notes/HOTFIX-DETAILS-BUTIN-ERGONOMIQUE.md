# Hotfix fiche de butin ergonomique

## Périmètre
Correctif ciblé sur la fiche d’équipement affichée dans la fenêtre de victoire.

## Changements
- Remplacement de la grande infobulle flottante par un panneau de détails intégré à la carte de butin.
- Ajout d’un bouton explicite « Voir les détails / Masquer ».
- Résumé compact avec icône, nom, qualité, étoiles et niveau d’objet.
- Ouverture au clic ou au toucher, fermeture avec le bouton X, Échap ou un clic extérieur.
- Aucun chevauchement avec le titre VICTOIRE, les récompenses ou les boutons de navigation.
- Mise en page en deux colonnes sur ordinateur et une colonne sur mobile.

## Fichiers modifiés
- `src/pages/BattlePage.jsx`
- `src/styles.css`

## Vérifications
- Compilation JSX avec esbuild réussie.
- Le panneau reste dans le flux de la fenêtre de victoire.
- Aucun changement des statistiques, taux de butin ou règles d’attribution.

## Installation
Extraire le contenu du ZIP à la racine du projet, accepter le remplacement, puis exécuter :

```powershell
npm run build
```
