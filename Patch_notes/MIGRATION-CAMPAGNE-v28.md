# Migration Campagne v28

## Conversion des difficultés

```text
Ancien Facile + ancien Normal
→ Nouveau Normal, meilleur score conservé

Ancien Difficile
→ Nouveau Difficile

Ancien Hardcore
→ Nouveau Hardcore
```

Pour chaque mission :

```js
nouveauNormal = Math.max(ancienFacile, ancienNormal);
```

## Récompenses d’étoiles
Les anciens paliers réclamés sont convertis prudemment :

```text
21  → 21
42  → 42
63  → 63
105 → 105
147 → 147
210 → 189
252 → 231
315 → 315
```

Le palier 273 reste disponible s’il constitue une récompense réellement supplémentaire. Aucune nouvelle récompense n’est créditée automatiquement.

## Combats persistants
Une session Facile enregistrée est convertie vers la mission Normal correspondante. Le combat interne est réinitialisé et revient à la préparation afin d’éviter de conserver des statistiques ennemies de l’ancienne difficulté. Aucune tentative n’est consommée par la migration.

## Sécurité
- Migration exécutée une seule fois avec `campaignDifficultyMigrationV28`.
- Aucune étoile supprimée.
- Aucune récompense déjà reçue retirée.
- Aucune double récompense automatique.
- Priorités AUTO, équipes, Stuff, Résonances et progression des champions conservés.

## Sauvegarde recommandée
Avant installation, exporter une copie de `azerune-save` si possible. Ne pas désinstaller l’application Android, car une désinstallation efface normalement le stockage local.
