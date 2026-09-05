# Azerune - Hotfix v1.49.2

## Objectif

Rééquilibrer la fréquence des qualités d'équipement en campagne Normal afin d'éviter une optimisation trop rapide, notamment lorsqu'un joueur obtient tôt un champion naturel 5 étoiles.

Ce correctif ne réduit pas les statistiques des nouvelles pièces équilibrées par la v1.49.1. Il ralentit uniquement l'accumulation des qualités élevées.

## Taux de qualité en Normal

### Missions standards

- Zones 1 à 2 : Normal 62 %, Commun 33 %, Rare 5 %.
- Zones 3 à 4 : Normal 40 %, Commun 50 %, Rare 10 %.
- Zones 5 à 7 : Commun 60 %, Rare 37 %, Épique 3 %.
- Zones 8 à 10 : Commun 32 %, Rare 58 %, Épique 10 %.
- Zones 11 à 15 : Rare 65 %, Épique 33 %, Légendaire 2 %.

### Boss

- Zones 1 à 2 : Normal 48 %, Commun 42 %, Rare 10 %.
- Zones 3 à 4 : Normal 25 %, Commun 55 %, Rare 20 %.
- Zones 5 à 7 : Commun 43 %, Rare 50 %, Épique 7 %.
- Zones 8 à 10 : Commun 20 %, Rare 62 %, Épique 18 %.
- Zones 11 à 15 : Rare 48 %, Épique 47 %, Légendaire 5 %.

## Règles conservées

- Aucun équipement 4 étoiles en campagne Normal.
- Zones 1 à 2 : maximum 2 étoiles Rare.
- Zones 3 à 4 : maximum 3 étoiles Rare.
- Zones 5 à 10 : maximum 3 étoiles Épique.
- Zones 11 à 15 : maximum 3 étoiles Légendaire.
- Les boss améliorent la qualité moyenne sans franchir le plafond de leur zone.
- Les probabilités d'étoiles ne changent pas.
- Les niveaux d'objet et les valeurs de statistiques de la v1.49.1 ne changent pas.
- Les objets déjà obtenus ne sont pas modifiés.
- Les objets de Boutique, Raid, Mythic+, Hauts faits et les armes Uniques ne sont pas affectés.

## Correction d'affichage

La description de la difficulté Normal indique maintenant correctement :

```text
1★ à 3★ selon la zone
```

au lieu de `1★ à 4★ selon la zone`.

## Fichiers modifiés

```text
src/data/items.js
src/data/campaign.js
```

## Installation

Extraire le ZIP directement à la racine du projet, accepter le remplacement des fichiers, puis exécuter :

```powershell
npm run build
npx cap sync android
```

## Tests recommandés

1. Obtenir plusieurs pièces dans les zones 1 à 4 du Normal.
2. Vérifier que le Commun constitue la majorité des pièces utiles du début.
3. Vérifier que le Rare reste possible, mais nettement moins fréquent sur les missions standards.
4. Comparer une mission standard et le boss de la même zone.
5. Vérifier qu'aucun Épique ne tombe avant la zone 5.
6. Vérifier qu'aucune pièce 4 étoiles ne tombe en Normal.
7. Contrôler que les statistiques et niveaux d'objet restent identiques à la v1.49.1.
