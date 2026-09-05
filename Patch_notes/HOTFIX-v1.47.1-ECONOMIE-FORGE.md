# Azerune Hotfix v1.47.1

## Rééquilibrage des Essences de forge

**Type :** hotfix économique cumulatif  
**Compatibilité :** sauvegardes v28 et antérieures  
**Migration :** aucune migration requise

## Objectif

Conserver une Forge accessible jusqu’à `+10`, tout en restaurant une vraie valeur de long terme aux Essences de forge dans les améliorations avancées. Le correctif réduit aussi les apports ponctuels trop élevés et diminue légèrement la valeur de recyclage du Stuff 5★.

## Changements

### Coûts d’amélioration

Les coûts de `+1` à `+10` restent inchangés.

```text
+11 et +12 : coût en Essences +15 %
+13 et +14 : coût en Essences +25 %
+15         : coût en Essences +40 %
```

Exemple pour un objet 5★ Légendaire :

```text
Ancien coût cumulé jusqu’à +15 : 1 049 Essences
Nouveau coût cumulé jusqu’à +15 : 1 259 Essences
```

### Hauts faits

Le total d’Essences offert par les Hauts faits concernés passe d’environ :

```text
7 600 → 3 875 Essences
```

Les autres récompenses en Or, Cristaux et objets restent inchangées. Les Hauts faits déjà réclamés ne sont pas retirés et aucune ressource déjà obtenue n’est reprise.

### Recyclage du Stuff 5★

La valeur de base d’un objet 5★ passe de `30` à `24` avant multiplicateur de qualité.

Exemple :

```text
5★ Légendaire non amélioré
150 → 120 Essences
```

Le remboursement de `35 %` des Essences réellement investies dans un objet reste inchangé.

### Éléments conservés

- gains de la Forge astrale inchangés ;
- six Sceaux quotidiens inchangés ;
- coûts d’Or inchangés ;
- coûts de Forge jusqu’à `+10` inchangés ;
- paliers de Campagne inchangés ;
- harmonisation des armes Uniques inchangée ;
- progression et sauvegarde inchangées.

## Fichiers modifiés

```text
src/data/items.js
src/data/achievements.js
```

## Vérifications réalisées

- syntaxe JavaScript vérifiée ;
- coûts `+1` à `+10` comparés et inchangés ;
- multiplicateurs avancés contrôlés ;
- total des Hauts faits recalculé à 3 875 Essences ;
- recyclage 5★ contrôlé ;
- archive ZIP vérifiée.

## Installation PC

Décompresse l’archive à la racine du projet, puis :

```powershell
Ctrl+C
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

Génère ensuite l’APK depuis Android Studio.

## Tests conseillés

- vérifier le coût d’un objet `+10`, qui doit rester identique ;
- vérifier les hausses à `+11`, `+13` et `+15` ;
- recycler un objet 5★ non amélioré ;
- consulter les récompenses de Hauts faits non réclamés ;
- vérifier qu’une récompense déjà réclamée n’est pas modifiée rétroactivement.
