# Azerune Hotfix v1.47.0

## Refonte majeure de la Campagne

La Campagne passe de quatre à trois difficultés :

- **Normal** : progression principale.
- **Difficile** : optimisation et mécaniques renforcées.
- **Hardcore** : maîtrise et prestige.

La nouvelle structure contient **15 zones × 7 missions × 3 difficultés**, soit **315 missions** et **945 étoiles**.

## Changements principaux

### Difficultés
- Suppression de Facile.
- Normal devient la difficulté initiale.
- Difficile se débloque après le Normal complet.
- Hardcore se débloque après le Difficile complet.
- Trois niveaux de mécaniques régionales dans le moteur de combat.

### Courbe et murs
- Recalibrage progressif des zones.
- Mur 1 au boss de la Zone 5.
- Mur 2 au boss de la Zone 10.
- Mur 3 au boss de la Zone 15.
- Puissances recommandées Normal des murs : environ 4 691, 8 109 et 10 445.
- Indications de progression ajoutées sur la page Campagne.

### XP
- Normal complet : environ **145 876 XP** bruts.
- Difficile complet : environ **183 373 XP** bruts.
- Hardcore complet : environ **241 741 XP** bruts.
- Farm : 35 % en Normal, 40 % en Difficile et 45 % en Hardcore.

### Stuff
- Les étoiles dépendent désormais de la difficulté, de la zone et du statut de boss.
- Normal progresse de 1★-2★ jusqu’à 3★-4★.
- Difficile progresse de 3★ jusqu’à 4★ avec une faible chance de 5★ en fin de parcours.
- Hardcore commence en 4★ et garantit du 5★ dans les dernières zones.
- Les qualités moyennes augmentent selon la difficulté.

### Préparation au Cœur-Monde
- Boss de la Zone 13 : première pièce Ignifuge 3★ Rare garantie.
- Boss de la Zone 14 : deuxième pièce Ignifuge 3★ Rare garantie.
- Les récompenses apparaissent dans la fenêtre de victoire.

### Étoiles
Nouveaux paliers :

`21, 42, 63, 105, 147, 189, 231, 273, 315`

Le palier final Normal peut distribuer 20 000 Or, 800 Cristaux, 6 Pierres de foyer, 15 Essences majeures, 2 Essences mythiques et 2 Tomes de maîtrise.

### Hauts faits
- Conversion des objectifs Facile vers Normal.
- Les objectifs de fin de zone vérifient désormais la mission 7.
- Actualisation des descriptions de Valebrume.
- Le pack de préparation Ignifuge est lié au Trône du Volcan.

## Fichiers modifiés
- `src/data/campaign.js`
- `src/data/items.js`
- `src/data/achievements.js`
- `src/utils/stats.js`
- `src/store/GameContext.jsx`
- `src/pages/CampaignPage.jsx`
- `src/pages/BattlePage.jsx`
- `src/battle/engine.js`
- `src/styles.css`

## Migration
La sauvegarde passe de la version 27 à la version 28. Consulter `MIGRATION-CAMPAGNE-v28.md`.

## Vérifications réalisées
- Compilation de tous les fichiers JavaScript et JSX modifiés avec esbuild.
- 3 difficultés détectées.
- 105 missions par difficulté.
- 315 missions au total.
- 315 étoiles par difficulté et 945 au total.
- 9 paliers de récompenses.
- Courbes XP conformes aux cibles de l’audit.
- Puissances des murs contrôlées.
- Archive ZIP testée.

## Installation PC
```powershell
Ctrl+C
Expand-Archive .\azerune-campaign-v1.47.0.zip -DestinationPath . -Force
Remove-Item -Recurse -Force .\node_modules\.vite -ErrorAction SilentlyContinue
npm run dev -- --force
```

Recharge ensuite avec `Ctrl+F5`.

## Installation Android
```powershell
npm run build
npx cap sync android
npx cap open android
```

## Tests recommandés
1. Ouvrir une ancienne sauvegarde possédant des scores Facile et Normal.
2. Vérifier que Normal conserve le meilleur score de chaque mission.
3. Vérifier les trois onglets de difficulté.
4. Vérifier les murs des zones 5, 10 et 15.
5. Terminer les boss des zones 13 et 14 en Normal et contrôler les pièces Ignifuge.
6. Réclamer un nouveau palier d’étoiles.
7. Tester Mission suivante après une victoire.
8. Reconstruire l’APK uniquement après validation sur PC.
