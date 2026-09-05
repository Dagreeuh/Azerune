# Azerune - Hotfix v1.49.1

## Objectif unique

Rééquilibrer uniquement les équipements obtenus en campagne. Aucun changement de champion, de récompense, de set ou de moteur de combat n'est inclus dans ce correctif.

## Problème corrigé

Le niveau d'objet et son coefficient de statistiques augmentaient trop vite. Une pièce Commune 3 étoiles de la zone 3 pouvait déjà donner environ 12 % de Précision et 9 % de Critique, ce qui correspondait davantage à une pièce de milieu ou de fin de campagne.

## Nouvelle courbe du niveau d'objet

### Normal

- Zone 1 : environ 1 à 14.
- Zone 3 : environ 15 à 28.
- Zone 5 : environ 29 à 42.
- Zone 10 : environ 64 à 77.
- Zone 15 : environ 99 à 112.

### Difficile

- Début : environ 116 à 129.
- Fin : environ 214 à 227.

### Hardcore

- Début : environ 221 à 234.
- Fin : environ 319 à 332.

Les missions d'une même zone progressent de deux niveaux d'objet chacune. La variation aléatoire est limitée à plus ou moins un niveau.

## Nouvelle puissance des statistiques de campagne

- Contribution du niveau d'objet réduite de 1,8 % à 1,0 % par niveau.
- Contribution des étoiles diminuée pour éviter qu'un 3 étoiles précoce ne double immédiatement la puissance d'une pièce.
- Multiplicateurs de qualité spécifiques à la campagne et plus progressifs.
- Bases des statistiques secondaires offensives réduites, particulièrement le Critique.
- Les équipements de Raid, Mythic+, Boutique, Hauts faits et armes Uniques ne sont pas modifiés.

## Exemple attendu en zone 3 Normal

Pour une pièce Commune 3 étoiles similaire à la capture :

- Niveau d'objet attendu : environ 19 à 22 sur la mission 3.
- Précision principale attendue : environ 7 %.
- Critique secondaire attendu : environ 4 %.

Une pièce Rare du même palier peut être légèrement supérieure, sans atteindre les valeurs de milieu de campagne.

## Forge

Les nouvelles statistiques secondaires ajoutées aux paliers +3, +6, +9, +12 et +15 utilisent désormais la formule équilibrée lorsqu'il s'agit d'une pièce de campagne nouvelle génération.

La statistique principale conserve sa progression actuelle de 4 % par niveau de forge. Les coûts et le recyclage ne changent pas.

## Compatibilité des sauvegardes

- Les anciens objets ne sont pas modifiés rétroactivement afin d'éviter une altération imprévisible des pièces déjà améliorées.
- Les nouveaux objets de campagne portent `campaignBalanced: true` et `balanceVersion: 2`.
- Pour tester proprement la nouvelle courbe, il faut obtenir une nouvelle pièce après installation du hotfix.

## Fichier modifié

```text
src/data/items.js
```

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement, puis exécuter :

```powershell
npm run build
npx cap sync android
```

## Tests recommandés

1. Obtenir plusieurs pièces en zone 3 Normal et contrôler des niveaux d'objet proches de 15 à 28.
2. Vérifier qu'une pièce Commune 3 étoiles ne donne plus environ 12 % de Précision et 9 % de Critique.
3. Obtenir des pièces dans les zones 5, 10 et 15 pour vérifier la progression régulière.
4. Vérifier qu'aucun objet 4 étoiles ne tombe en Normal.
5. Améliorer une nouvelle pièce jusqu'à +3 et vérifier que la sous-statistique ajoutée utilise la nouvelle échelle.
