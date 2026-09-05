# Hotfix v1.30.3 - Cerf lunaire, Cœur sylvestre

- Ajoute un rôle IA explicite au Cerf lunaire.
- Supprime la dépendance fragile à l’index contenu dans l’identifiant runtime.
- Onde lunaire ne parcourt que les alliés vivants.
- L’action du Cerf termine toujours son tour.
- Le watchdog de BattlePage reste une sécurité supplémentaire.

Remplacez :
- `src/data/campaign.js`
- `src/battle/engine.js`
