# Chroniques d'Azerune v1.46.0

## Combat automatique et priorités de compétences

**Type :** mise à jour majeure / hotfix cumulatif  
**Statut :** en préparation  
**Date :** 20 août 2026

## Objectif

Ajouter un mode de combat automatique activable ou désactivable pendant les combats, ainsi qu'un configurateur individuel permettant de définir l'ordre de priorité des trois compétences de chaque champion.

## Fonctionnalités prévues

### Combat automatique

- bouton compact `AUTO` dans l'interface de combat ;
- activation et désactivation à tout moment ;
- reprise immédiate du contrôle manuel après désactivation ;
- nouveau combat démarrant avec le mode Auto désactivé ;
- conservation de l'état Auto entre les vagues d'un même combat Mythic+ ;
- verrouillage empêchant les doubles actions ;
- temporisation courte pour conserver une bonne lisibilité des actions ;
- compatibilité avec les combats de Campagne, Expédition, Raid, Mythic+ et World Boss.

### Priorité des compétences

Chaque champion disposera d'un ordre personnel enregistré :

```text
Priorité 1
Priorité 2
Priorité 3
```

L'interface permettra :

- le glisser-déposer à la souris ;
- le glisser-déposer tactile sur Android ;
- l'utilisation de boutons Monter et Descendre ;
- l'affichage de la description au survol ;
- l'affichage de la description par appui sur mobile ;
- la réinitialisation vers l'ordre recommandé ;
- la sauvegarde de la priorité pour chaque champion.

## Règles de ciblage prévues

### Cibles ennemies

```text
1. Affinité efficace
2. Affinité neutre
3. Affinité défavorable
4. À égalité, cible vivante la plus à gauche
```

Des règles spécialisées seront ajoutées pour les compétences d'exécution, de dissipation, de destruction de bouclier et d'afflictions.

### Cibles alliées

```text
Soins
→ allié avec le plus faible pourcentage de PV

Boucliers
→ allié sans bouclier, puis allié avec le moins de PV

Purification
→ allié contrôlé, puis allié avec le malus le plus dangereux

Protection ciblée
→ allié fragile qui ne bénéficie pas déjà de la protection
```

## Cas particuliers prévus

- **Thorgar :** protéger en priorité un allié fragile sans Serment actif ;
- **Kaelen :** conserver la cible de Traque lorsque celle-ci est encore valide ;
- **Sylven :** poser une Graine sur un allié qui n'en possède pas ;
- **Korga :** privilégier une cible possédant un bouclier ;
- **Vaeloria :** respecter la rotation de trois compétences distinctes ;
- **Seraphiel :** utiliser la dissipation sur la cible ayant le plus de buffs dissipables ;
- **Morghast :** privilégier les cibles permettant une Réaction alchimique ;
- **Brilith :** tenir compte des Charges arcaniques ;
- **Nashoba :** utiliser Apocalypse selon les Blessures purulentes disponibles ;
- **Histéria :** utiliser Extase sur les cibles possédant les afflictions requises ;
- **Mathanae :** utiliser Métamorphose selon les Fragments d'âme disponibles.

## Sauvegarde prévue

```js
autoSkillPriorities: {
  "1": [2, 1, 0],
  "7": [0, 2, 1],
  "16": [2, 0, 1]
}
```

Les index internes `0`, `1` et `2` correspondent aux compétences affichées comme `1`, `2` et `3`.

## Fichiers déjà reçus

```text
src/pages/BattlePage.jsx
src/battle/engine.js
src/store/GameContext.jsx
src/utils/skills.js
src/pages/HeroesPage.jsx
src/components/Cards.jsx
src/styles.css
```

## Fichiers encore nécessaires

```text
src/data/heroes.js
src/data/customHeroes.js
src/data/championIdentities.js
```

## Correctif complémentaire inclus

Le doublon de la clé `soulMetamorphosis` dans `src/utils/skills.js` sera supprimé sans modifier la description finale retenue.

## Vérifications prévues avant livraison

```text
[ ] Activation et désactivation du mode Auto
[ ] Aucun double tour allié
[ ] Aucun conflit avec les tours ennemis
[ ] Arrêt immédiat après désactivation
[ ] Respect des cooldowns
[ ] Respect des compétences verrouillées
[ ] Respect des ressources personnelles
[ ] Ciblage élémentaire efficace, neutre puis défavorable
[ ] Soins et boucliers sur les bonnes cibles
[ ] Priorités enregistrées par champion
[ ] Glisser-déposer fonctionnel sur ordinateur
[ ] Réorganisation fonctionnelle sur Android
[ ] Compatibilité avec les vagues Mythic+
[ ] Compatibilité avec les armes Uniques
[ ] Compatibilité avec la Résonance IV
[ ] Compilation Vite réussie
[ ] Synchronisation Capacitor réussie
[ ] Archive finale vérifiée
```

## Installation future

Lorsque la version sera finalisée :

```powershell
npm run build
npx cap sync android
npx cap open android
```

Puis dans Android Studio :

```text
Build
→ Build App Bundle(s) or APK(s)
→ Build APK(s)
```
