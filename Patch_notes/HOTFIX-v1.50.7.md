# Azerune v1.50.7 - Audit final du roster

Correctif cumulatif appliqué aux 15 champions restants : Hicho, Nashoba, Histéria, Mathanae, Sylven, Korga, Nerissa, Malvek, Aurelis, Vexil, Maerys, Ignovar, Elowen, Seraphiel et Morghast.

## Correctifs principaux

- Synchronisation réelle du Totem de Hicho et du Jardin d’Elowen.
- Apocalypse attend 4 Blessures par défaut en AUTO.
- Agonie et Corruption utilisent désormais Précision et Résistance.
- Extase déclenche les cinq afflictions reconnues sans les consommer.
- Métamorphose ne part plus à zéro Fragment et sa maîtrise augmente aussi le soin.
- Compteur de Graines de Sylven synchronisé sur 3 et soin identique au déclenchement automatique ou manuel.
- Texte de l’Exécution de Korga aligné sur le moteur.
- Nerissa ne crée plus de jauge avec zéro Reflux et affiche une réserve sur 60.
- Propagation de Malvek exige une infection source et propage ses cumuls.
- Aurelis commence avec son Égide de secours prête.
- Vexil attend 4 Instabilités par défaut avant Convergence.
- Brasier d’Ignovar prolonge sans raccourcir les Brûlures et les maîtrises améliorent l’explosion.
- Elowen pose le Jardin avant Prison en AUTO et son ralentissement respecte la Précision.
- Seraphiel attend 3 Condamnations par défaut avant Jugement.
- Les réactions de Morghast profitent des maîtrises de puissance.

## Fichiers modifiés

- `src/data/heroes.js`
- `src/data/customHeroes.js`
- `src/data/championIdentities.js`
- `src/battle/engine.js`
- `src/utils/skills.js`
- `src/pages/BattlePage.jsx`
- `src/components/AutoSkillPriorityModal.jsx`
- `src/styles.css`

## Installation

Extraire ce ZIP directement à la racine du projet Azerune, puis accepter le remplacement des fichiers existants.

## Vérifications recommandées

1. Tester chaque champion manuellement puis en AUTO sans priorité personnalisée.
2. Tester les seuils AUTO personnalisés après modification de l’ordre des sorts.
3. Vérifier les compteurs Totem, Graines, Reflux, Égide, Instabilité, Braises, Jardin et Condamnation.
4. Tester les effets contre une cible à forte Résistance.
5. Tester une transition de vague Mythic+ avec Totem, Jardin, Goule et afflictions actifs.
