# Azerune - Hotfix v1.49.6

## Objectif

Rendre l'importation et l'exportation de sauvegarde fiables dans l'APK Android tout en conservant le fonctionnement dans le navigateur.

## Export dans l'APK

- Création du JSON dans le cache privé de l'application.
- Ouverture du menu de partage Android.
- Enregistrement ou transfert possible vers un gestionnaire de fichiers, Drive, Discord, e-mail ou toute application compatible.
- Aucune permission générale de stockage n'est requise, car le fichier temporaire est créé dans le cache de l'application.

## Import dans l'APK

- Ouverture d'un sélecteur de fichiers natif Android.
- Sélection limitée à une sauvegarde JSON.
- Lecture UTF-8 du contenu sélectionné.
- Validation complète du format Azerune avant affichage de la confirmation.
- La sauvegarde actuelle n'est remplacée qu'après confirmation.
- Rechargement automatique après import réussi.

## Navigateur

Le téléchargement avec le navigateur et l'import HTML restent disponibles sur PC et navigateur mobile.

## Compatibilité

- Format de sauvegarde maintenu en version 1.
- Anciennes sauvegardes valides toujours importables.
- Aucun changement de progression ou d'équilibrage.

## Dépendances ajoutées

```text
@capacitor/filesystem ^8.1.3
@capacitor/share ^8.0.1
@capawesome/capacitor-file-picker ^8.0.4
```

Ces versions sont compatibles avec Capacitor 8.5.0 utilisé par le projet.

## Fichiers modifiés

```text
src/pages/SettingsPage.jsx
package.json
package-lock.json
```

## Installation obligatoire

Extraire le ZIP à la racine du projet, puis exécuter dans cet ordre :

```powershell
npm install
npm run build
npx cap sync android
npx cap open android
```

Reconstruire ensuite l'APK dans Android Studio. Un ancien APK ne profitera pas des plugins natifs ajoutés.

## Tests APK

1. Installer le nouvel APK.
2. Ouvrir Paramètres puis Gestion de la sauvegarde.
3. Appuyer sur Exporter la sauvegarde.
4. Enregistrer le JSON dans Fichiers ou Drive.
5. Appuyer sur Importer une sauvegarde.
6. Sélectionner le JSON exporté.
7. Vérifier que la confirmation affiche le nom et la date du fichier.
8. Confirmer l'import et contrôler le rechargement de la progression.
9. Tester aussi un fichier non JSON et un JSON invalide.
