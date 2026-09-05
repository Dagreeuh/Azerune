# Azerune - Hotfix v1.49.5

## Objectif

Corriger de manière générale le respect des priorités AUTO personnalisées, avec Elowen comme cas révélateur.

## Problème

Le moteur enregistrait correctement l'ordre choisi par le joueur, mais pouvait ignorer une compétence de soutien prioritaire lorsque toute l'équipe dépassait 88 % de PV. Ainsi, Elowen pouvait lancer Prison de racines avant Sève régénérante malgré l'ordre configuré.

## Nouvelle règle générale

Lorsqu'un joueur a défini un ordre AUTO personnalisé :

1. le moteur parcourt strictement cet ordre ;
2. la première compétence disponible et mécaniquement valide est utilisée ;
3. le moteur ne remplace plus un choix tactique simplement parce que les alliés ont plus de 88 % de PV.

Sans priorité personnalisée, l'AUTO intelligent conserve son comportement actuel et peut éviter certains soins ou soutiens prématurés.

## Blocages de sécurité conservés

Une priorité personnalisée ne force jamais une compétence réellement invalide :

- Jardin vivant déjà actif ;
- Totem déjà actif ;
- Floraison sans Graine ;
- Retour temporel sans Ancrage ;
- Catalyse sans combinaison d'afflictions ;
- Détonation sans Brûlure ;
- Apocalypse sans Blessures suffisantes ;
- Extase sans affliction compatible ;
- finisseur sans ressources suffisantes ;
- compétence verrouillée ou en recharge.

## Cas Elowen

Avec l'ordre :

```text
1. Sève régénérante
2. Prison de racines
3. Ronce entravante
```

Elowen ouvre désormais avec Sève régénérante si le Jardin n'est pas actif, même si toute l'équipe commence à 100 % de PV. Une fois le Jardin actif, Elowen passe logiquement à la compétence suivante valide.

## Portée

Le correctif s'applique à tous les champions et à toutes les priorités AUTO personnalisées. Il ne change aucune valeur de dégâts, de soin, de contrôle, de recharge ou de ressource.

## Fichier modifié

```text
src/combat/engine.js
```

## Installation

Extraire le ZIP à la racine et accepter le remplacement, puis exécuter :

```powershell
npm run build
npx cap sync android
```

## Tests recommandés

1. Elowen : placer Sève régénérante en premier et vérifier l'ouverture à 100 % de PV.
2. Elowen : vérifier que le Jardin n'est pas relancé lorsqu'il est déjà actif.
3. Hicho : placer un soin ou Totem en priorité et vérifier le respect de l'ordre.
4. Vérifier qu'un finisseur sans charges reste ignoré.
5. Vérifier qu'une compétence en recharge reste ignorée.
6. Réinitialiser les priorités d'un champion et vérifier que l'AUTO intelligent conserve ses optimisations.
