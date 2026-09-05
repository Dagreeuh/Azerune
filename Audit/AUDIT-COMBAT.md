# Audit combat v1.30.0

## Couverture

1. Buffs et malus : application, rafraîchissement, expiration et journal d’expiration.
2. Dégâts périodiques : Poison, Brûlure, Saignement, Agonie et Corruption.
3. Effets persistants : Graines, Régénération, Totem guérisseur et Jardin vivant.
4. Protection : boucliers, Provocation, Serment du gardien et Égide de secours.
5. Ressources : plafonds, génération, consommation et persistance dans `unit.mechanic`.
6. Conditions : finisseurs, consommations, déclenchements et remise à zéro.
7. Critiques et pénétration : Visée, Disparition, dégâts critiques et pénétration.
8. Jauge : Traque, Reflux, Danse et Ancrage temporel.
9. Ciblage : ennemi, allié, lanceur, zone ennemie et équipe.
10. Précision, Résistance et affinités : les affinités affectent aussi les chances d’effet.
11. Cooldowns et maîtrises : puissance, durée, chance et réduction de recharge.
12. Événements : dégâts, soins, boucliers, DOT, critique et journal.
13. Persistance : buffs, malus, cooldowns, jauges et mécaniques restent dans `battleSession.battle`.

## Corrections majeures

- Les attaques indiquées comme basées sur la Défense utilisent maintenant uniquement la Défense offensive, et non Attaque + Défense.
- Agonie et Corruption infligent désormais leurs dégâts au début du tour de la cible.
- Agonie augmente progressivement jusqu’à cinq charges.
- Virulence augmente réellement les dégâts du Poison.
- Les Graines se déclenchent sous 50 % de PV, soignent, purifient puis disparaissent.
- Le Totem soigne réellement pendant sa durée.
- Les affinités élémentaires modifient les chances d’application des malus de plus ou moins 15 %.
- Disparition garantit désormais le critique d’Éviscération.
- Une attaque alliée sur la proie accélère réellement Kaelen.
- La goule de Nashoba attaque pendant sa durée.
- Tous les effets uniques apparaissent maintenant dans l’interface.
