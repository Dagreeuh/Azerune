# Hotfix Mythic+ 4v4

## Version

`v1.52.0`

## Périmètre

Ce hotfix transforme Mythic+ en contenu 4v4 et équilibre ses vagues et affixes autour de quatre champions. Il ne modifie pas les récompenses, les kits des champions ou les autres activités.

## Changements

### Format

- Toutes les missions Mythic+ déclarent `teamSize: 4`.
- La préparation peut accepter un quatrième champion grâce à la limite contextuelle existante.
- La puissance recommandée est recalibrée avec le coefficient 4v4 `x1,42`.

### Courbe ennemie

- PV : croissance composée de 5,5 % par niveau.
- Attaque : croissance composée de 3,5 % par niveau.
- Défense : croissance composée de 1,5 % par niveau.
- Après le niveau 20, chaque niveau supplémentaire compte pour 80 % d'un niveau de croissance.
- Les différences boss, élite et ennemi standard restent conservées.

### Affixes

- Mythic+ 1 à 4 : aucun affixe.
- Mythic+ 5 à 9 : un affixe.
- Mythic+ 10 à 19 : deux affixes.
- Mythic+ 20 à 30 : trois affixes.

Ajustements :

- Fortifié : ennemis non-boss, PV +20 %, Attaque +12 %, Résistance +5.
- Tyrannique : boss, PV +25 %, Attaque +15 %, Précision +8.
- Galvanisant : +8 % d'Attaque et de Défense par ennemi mort, pendant 2 tours, 4 cumuls maximum.
- Déchaîné : sous 30 % de PV, Attaque +15 % et Vitesse +20 %.
- Détonant : 2,5 % des PV max par ennemi mort simultanément, plafonné à 10 % par résolution.
- Nécrotique : soins reçus -6 % par cumul, maximum 5 cumuls pendant 2 tours.

### Vagues

Le fonctionnement existant est conservé : PV, effets, temps de recharge et mécaniques personnelles persistent, tandis que la jauge est plafonnée à 25 % au début de la vague suivante.

### Interface

La page Mythic+ indique explicitement le format `4v4`.

## Fichiers modifiés

```text
src/data/mythic.js
src/battle/engine.js
src/pages/MythicPage.jsx
```

## Installation

1. Fermer le serveur de développement si nécessaire.
2. Extraire le ZIP directement à la racine du projet Azerune.
3. Accepter le remplacement des fichiers.
4. Exécuter :

```powershell
npm run build
```

Pour tester en développement :

```powershell
npm run dev
```

## Vérifications conseillées

- Vérifier que la préparation accepte 4 champions.
- Vérifier les paliers d'affixes aux niveaux 4, 5, 9, 10, 19 et 20.
- Terminer une vague et vérifier le plafond de jauge à 25 %.
- Tester Détonant avec plusieurs morts simultanées.
- Tester Nécrotique, Galvanisant et Déchaîné.
- Vérifier que les quatre participants reçoivent la progression prévue.

## Vérifications techniques réalisées

- Syntaxe JavaScript validée pour `mythic.js` et `engine.js`.
- Syntaxe JSX validée pour `MythicPage.jsx`.
- Missions 1, 4, 5, 9, 10, 19, 20 et 30 générées avec succès.
- `teamSize: 4` et les paliers de 0 à 3 affixes vérifiés.
