# Azerune - Hotfix v1.49.7 - Histéria

## Objectif

Corriger la cohérence d'Histéria, principalement Extase maléfique et son comportement en AUTO.

## Problèmes corrigés

### 1. Extase ne reproduisait pas fidèlement les dégâts périodiques

Le déclenchement immédiat utilisait des formules différentes des ticks naturels :

- Agonie devenait beaucoup trop puissante à hauts cumuls ;
- Corruption infligeait 4 % au lieu de 3,5 % des PV maximum ;
- Poison ignorait les cumuls de Virulence ;
- Brûlure ignorait la réduction du set Ignifuge.

Extase utilise désormais exactement les mêmes bases que les ticks naturels, puis applique ses maîtrises et le bonus de Résonance IV.

### 2. AUTO incomplet

Extase était considérée inutilisable sans Agonie ou Corruption, même si Poison, Brûlure ou Saignement étaient déjà actifs.

Désormais, l'AUTO reconnaît les cinq afflictions compatibles :

```text
Agonie
Corruption
Poison
Brûlure
Saignement
```

Sans priorité personnalisée, Histéria prépare Extase lorsqu'une cible possède au moins deux afflictions reconnues ou une Agonie à 3 cumuls et plus.

### 3. Journal de combat

Chaque déclenchement d'Extase indique maintenant les dégâts périodiques immédiats infligés à la cible et rappelle que les afflictions ne sont pas consommées.

## Comportements conservés

- Extase conserve ses dégâts directs initiaux.
- Les afflictions ne sont pas consommées.
- Agonie continue de monter jusqu'à 5 cumuls lors de ses ticks naturels.
- Précision et Résistance continuent de déterminer l'application d'Agonie et Corruption.
- La Résonance IV conserve son bonus de 12 % sur les déclenchements d'Extase.

## Correctif cumulatif AUTO

Le fichier moteur fourni ne contenait pas encore la correction générale v1.49.5. Elle est réintégrée pour éviter toute régression : lorsqu'une priorité personnalisée existe, l'ordre du joueur est respecté tant que la compétence est mécaniquement valide.

## Fichiers modifiés

```text
src/battle/engine.js
src/data/championIdentities.js
```

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement, puis exécuter :

```powershell
npm run build
```

## Tests recommandés

1. Poser Agonie puis attendre plusieurs ticks : les cumuls doivent progresser jusqu'à 5.
2. Utiliser Extase avec Agonie seule : le déclenchement doit correspondre au tick naturel du cumul actuel.
3. Utiliser Extase avec Corruption seule : déclenchement à 3,5 % des PV maximum avant bonus.
4. Tester Poison avec Virulence : Extase doit tenir compte des cumuls.
5. Tester Brûlure sur une cible Ignifuge : la réduction doit être respectée.
6. Tester Poison + Brûlure sans Agonie ni Corruption : Extase doit être reconnue comme utilisable en AUTO.
7. Vérifier qu'aucune affliction n'est consommée.
8. Vérifier les priorités AUTO personnalisées d'Elowen et des autres champions.
