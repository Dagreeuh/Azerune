# Azerune - Hotfix v1.48.0

## Objet

Ajout de l’exportation et de l’importation de la sauvegarde depuis la page **Paramètres**.

## Changements

- Ajout d’un bouton **Exporter la sauvegarde**.
- Téléchargement d’un fichier `azerune-save-AAAA-MM-JJ.json`.
- Export de la progression principale, des données journalières, du tutoriel et des préférences d’invocation.
- Ajout d’un bouton **Importer une sauvegarde** avec sélecteur de fichier JSON.
- Validation du jeu d’origine, du format et de la progression principale avant toute modification.
- Confirmation obligatoire avant remplacement de la sauvegarde locale.
- Restauration automatique de l’ancienne sauvegarde si l’écriture échoue.
- Rechargement automatique du jeu après un import réussi.
- Messages d’erreur et de réussite affichés dans la page Paramètres.

## Fichiers modifies

- `src/pages/SettingsPage.jsx`
- `src/utils/storage.js`

`src/store/GameContext.jsx` a été vérifié mais ne nécessite aucune modification. Le contexte recharge déjà `azerune-save` et `azerune-save-daily` au démarrage.

## Installation

1. Remplacer `src/pages/SettingsPage.jsx` par le fichier fourni.
2. Remplacer `src/utils/storage.js` par le fichier fourni.
3. Conserver le fichier `GameContext.jsx` actuel.
4. Relancer la compilation ou le serveur de développement.

## Vérifications conseillees

1. Ouvrir **Paramètres** et exporter la sauvegarde.
2. Vérifier qu’un fichier JSON est téléchargé.
3. Modifier légèrement la progression dans le jeu.
4. Importer le fichier exporté.
5. Confirmer le remplacement.
6. Vérifier qu’après rechargement la progression exportée est restaurée.
7. Tester un fichier JSON quelconque pour vérifier qu’il est refusé.
8. Tester le transfert du fichier entre ordinateur et téléphone.

## Compatibilite

- Format d’export Azerune : `1`.
- Sauvegarde interne actuelle détectée : version `28`.
- Aucun serveur ni compte utilisateur requis.
