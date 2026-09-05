# Azerune v1.50.6 - Audit groupé de six champions

Correctif cumulatif pour Vélomoteur, Dagcat, Mobeen, Lelianna, Saylich et Brilith.

## Changements

- Vélomoteur : AUTO attend 5 Puissances sacrées avant Verdict par défaut.
- Dagcat : AUTO privilégie les cibles sous Saignement, description du finisseur précisée.
- Mobeen : Disparition est nettoyée à expiration, AUTO prépare l'ouverture avant Éviscération, maîtrises utiles.
- Lelianna : AUTO pose Expiation avant les attaques et évite les réapplications inutiles, texte de Pénitence corrigé.
- Saylich : AUTO exige Visée active, pénétration réelle de 85 %, 90 % en Résonance IV, maîtrises utiles, compteur sur 3.
- Brilith : AUTO attend 4 Charges avant Barrage par défaut, compteur sur 4, Orbe clarifié.

## Fichiers modifiés

- `src/data/customHeroes.js`
- `src/data/championIdentities.js`
- `src/battle/engine.js`
- `src/utils/skills.js`
- `src/pages/BattlePage.jsx`
- `src/components/AutoSkillPriorityModal.jsx`
- `src/styles.css`

## Installation

Extraire le ZIP directement à la racine du projet et remplacer les fichiers existants.

## Vérifications

1. Tester chaque champion manuellement puis en AUTO sans priorité personnalisée.
2. Vérifier les compteurs 5, 5, 5, Expiations, 3 et 4.
3. Vérifier que les priorités personnalisées gardent les seuils offensifs souples de Vélomoteur et Brilith.
4. Laisser Disparition expirer et confirmer que le critique garanti disparaît.
5. Tester Saylich avant et après Résonance IV contre une cible à haute Défense.
