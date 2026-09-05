# Azerune - Hotfix v1.49.3

## Objectif

Finaliser l'équilibrage des qualités en fin de campagne Normal afin d'éviter qu'un joueur accumule trop rapidement un équipement 3 étoiles Épique avant l'entrée en Difficile.

## Ajustement zones 11 à 15 en Normal

### Missions standards

Avant :

```text
Rare 65 % | Épique 33 % | Légendaire 2 %
```

Après :

```text
Rare 73 % | Épique 25 % | Légendaire 2 %
```

### Boss

Avant :

```text
Rare 48 % | Épique 47 % | Légendaire 5 %
```

Après :

```text
Rare 55 % | Épique 40 % | Légendaire 5 %
```

## Raisons

- Un taux de 33 % d'Épique sur chaque mission standard rendait l'Épique trop banal.
- Un taux de 47 % sur les boss approchait une distribution d'une pièce Épique sur deux.
- Le Rare doit rester la base solide permettant de terminer le Normal.
- L'Épique doit représenter une optimisation de fin de Normal, sans devenir l'équipement standard de toute l'équipe.
- Le Légendaire reste exceptionnel à 2 % sur les missions et 5 % sur les boss.
- Le passage en Difficile conserve une vraie valeur grâce à l'accès progressif au 4 étoiles.

## Éléments inchangés

- Aucun équipement 4 étoiles en Normal.
- Probabilités d'étoiles inchangées.
- Niveaux d'objet inchangés.
- Valeurs de statistiques inchangées.
- Zones 1 à 10 inchangées par rapport à la v1.49.2.
- Difficile et Hardcore inchangés.
- Boutique, Raid, Mythic+, Hauts faits et armes Uniques inchangés.
- Objets déjà obtenus inchangés.

## Fichier modifié

```text
src/data/items.js
```

## Installation

Extraire le ZIP à la racine du projet, accepter le remplacement, puis exécuter :

```powershell
npm run build
npx cap sync android
```

## Vérifications recommandées

1. Farmer plusieurs missions standards des zones 11 à 15.
2. Vérifier que le Rare reste nettement majoritaire.
3. Vérifier que l'Épique reste fréquent mais non systématique.
4. Comparer les missions standards aux boss.
5. Vérifier qu'aucune pièce 4 étoiles ne tombe en Normal.
