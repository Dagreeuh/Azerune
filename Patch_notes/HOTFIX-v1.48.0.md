# Azerune - Hotfix v1.48.0

## Objectif

Rééquilibrer plusieurs champions après l'audit du roster, améliorer leur comportement en combat automatique et corriger l'évaluation des compositions.

## Changements

### Elowen

- `Sève régénérante` : soin initial réduit de 12 % à 9 % des PV maximum.
- Régénération du Jardin réduite de 3 à 2 tours avant bonus de maîtrise.
- `Prison de racines` : chance d'étourdissement réduite de 65 % à 55 % avec Jardin actif, et de 35 % à 30 % sans Jardin.
- Son identité reste celle d'un soutien persistant avec contrôle, sans remplacer un soigneur principal.

### Hicho

- `Vague de soins` : soin réduit de 40 % à 36 % des PV maximum, ou de 48 % à 44 % avec Totem actif.
- `Totem guérisseur` : soin immédiat d'équipe réduit de 10 % à 8 %.
- `Marée ancestrale` : soin d'équipe réduit de 32 % à 28 %.
- Les soins périodiques et la prolongation du Totem sont conservés.

### Brom

- `Fracture tellurique` dépend désormais réellement du nombre d'Impacts consommés.
- 0 Impact : 1 tour, 55 % de chance de base.
- 1 Impact : 2 tours, 72 % de chance de base.
- 2 Impacts : 2 tours, 88 % de chance de base.
- 3 Impacts : 3 tours, 95 % de chance de base.
- Le journal de combat indique maintenant le nombre d'Impacts consommés.

### Tanks et ciblage ennemi

- Sans Provocation, les ennemis conservent leur priorité élémentaire.
- À affinité élémentaire équivalente, ils ont désormais une préférence modérée pour les tanks.
- La Provocation reste prioritaire et obligatoire.

### Combat automatique

- Thorgar évite de poser son Lien sur lui-même et privilégie mieux les alliés offensifs fragiles.
- Caelion privilégie pour l'Ancrage temporel un allié offensif ayant des compétences en recharge.
- Les boucliers existants ne pénalisent plus à tort le ciblage du Lien de Thorgar.

### Évaluation des équipes

- Détection étendue des soins récents : Sylven, Elowen, Lelianna, Hicho et Mathanae.
- Détection étendue des boucliers : Thorgar, Aurelis, Lelianna et Mathanae.
- Détection étendue des contrôles et affaiblissements propres aux champions actuels.
- L'écran de préparation ne devrait plus annoncer à tort l'absence de soin ou de protection.

## Fichiers modifiés

```text
src/combat/engine.js
src/utils/stats.js
```

## Installation

1. Fermer le serveur de développement si nécessaire.
2. Extraire le contenu du ZIP directement à la racine du projet Azerune.
3. Accepter le remplacement des fichiers.
4. Exécuter :

```powershell
npm run build
```

Pour Android :

```powershell
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

## Vérifications recommandées

1. Tester Elowen sur un combat long et vérifier que le Jardin reste utile sans fournir trop de soin et de contrôle simultanément.
2. Comparer Hicho, Sylven et Elowen avec un équipement équivalent.
3. Utiliser Brom avec 0, 1, 2 puis 3 Impacts avant Fracture tellurique.
4. Lancer plusieurs combats sans Provocation et vérifier que les tanks sont légèrement plus ciblés uniquement lorsque l'affinité est équivalente.
5. Tester Thorgar et Caelion en mode AUTO.
6. Ouvrir la préparation d'une mission avec chaque soigneur et vérifier la détection du soin.

## Validation technique

- Syntaxe JavaScript contrôlée avec Node.js.
- Arborescence du ZIP conforme à celle du projet.
- Aucun fichier de sauvegarde ni donnée joueur modifié.
