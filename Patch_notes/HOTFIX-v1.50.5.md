# Azerune v1.50.5 - Audit groupé Kaelen, Vaeloria et Brom

## Correctif cumulatif

Ce hotfix part de la version actuelle incluant Caelion v1.50.3 et Thorgar v1.50.4.

## Kaelen

- AUTO pose Traque coordonnée avant Déluge du traqueur.
- Déluge n’est plus choisi sans proie réellement traquée.
- La proie obsolète est nettoyée à sa mort ou à l’expiration de Traque.
- Une nouvelle Traque retire l’ancienne Traque posée par Kaelen.
- La description précise que Marque augmente de 20 % les dégâts subis.
- L’interface affiche la cible et la durée, sans faux compteur `0/5`.

## Vaeloria

- Tempête de lames est décrite comme une étape flexible de Danse.
- La ressource affiche désormais `0/3`, `1/3` ou `2/3` étapes.
- Les infobulles affichent le vrai niveau maximal : 6, 5 ou 4 selon l’emplacement.
- La logique AUTO qui privilégie les étapes inutilisées est conservée.

## Brom

- Fracture tellurique utilise réellement les Impacts consommés.
- 1 Impact : 2 tours, 75 % de chance de base.
- 2 Impacts : 3 tours, 85 % de chance de base.
- 3 Impacts : 3 tours, 95 % de chance de base.
- La maîtrise de Fracture inclut maintenant Chance d’effet +10 %.
- Sans priorité personnalisée, AUTO construit 3 Impacts avant Séisme.
- Avec Fracture placée avant Séisme, AUTO peut utiliser Fracture à partir de 2 Impacts.
- L’interface affiche les Impacts sur 3 et signale `Séisme prêt`.
- Le texte de Résonance IV est précisé.

## Fichiers modifiés

- `src/data/heroes.js`
- `src/data/championIdentities.js`
- `src/battle/engine.js`
- `src/utils/skills.js`
- `src/pages/BattlePage.jsx`
- `src/components/AutoSkillPriorityModal.jsx`
- `src/styles.css`

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement des fichiers.

## Vérifications

### Kaelen
1. Activer AUTO et vérifier que Traque précède Déluge.
2. Tuer la proie ou laisser Traque expirer, puis vérifier `Aucune proie`.
3. Vérifier le gain de 12 % de jauge, puis 15 % en Résonance IV.

### Vaeloria
1. Utiliser les trois compétences dans plusieurs ordres.
2. Vérifier le tour bonus après trois compétences différentes.
3. Vérifier l’affichage sur 3 étapes et les maximums 6, 5 et 4.

### Brom
1. Tester Fracture à 0, 1, 2 et 3 Impacts.
2. Vérifier durée, chance annoncée et remise à zéro.
3. En AUTO par défaut, vérifier la construction jusqu’à 3 Impacts puis Séisme.
4. Placer Fracture avant Séisme et vérifier son usage à partir de 2 Impacts.
