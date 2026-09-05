# Azerune v1.50.4 - Correctif de Thorgar

## Objectif

Corriger les incohérences détectées pendant l’audit individuel de Thorgar, sans augmenter artificiellement ses statistiques de base.

## Kit

- **Heurt runique** prolonge désormais le Serment actif d’un tour, sans dépasser sa durée maximale.
- **Serment du gardien** ne peut plus cibler Thorgar.
- Le Serment transfère toujours 30 % des dégâts vers Thorgar sans pouvoir vaincre Thorgar par redirection.
- **Rempart ancestral** conserve ses valeurs actuelles et son bonus renforcé sur l’allié lié.

## AUTO

- AUTO exclut Thorgar des cibles de Serment du gardien.
- AUTO privilégie un allié fragile et offensif, sans bouclier ni Serment actif.
- Rempart ancestral attend désormais qu’un Serment valide soit actif.
- Serment du gardien n’est pas relancé inutilement lorsqu’il reste plus d’un tour.

## Maîtrises

La progression de Serment du gardien est remplacée par des bonus utiles :

1. Jauge de Thorgar +10 %
2. Durée +1 tour
3. Jauge de l’allié lié +10 %
4. Temps de recharge -1 tour

## Interface

L’affichage générique `0/5` est remplacé par :

- `Aucun allié lié`
- `Nom de l’allié · X tours`

La fenêtre Priorités AUTO explique maintenant la logique particulière de Thorgar.

## Fichiers modifiés

- `src/data/heroes.js`
- `src/data/championIdentities.js`
- `src/battle/engine.js`
- `src/utils/skills.js`
- `src/pages/BattlePage.jsx`
- `src/components/AutoSkillPriorityModal.jsx`
- `src/styles.css`

## Installation

Extraire le ZIP directement à la racine du projet et accepter le remplacement des fichiers. Ce hotfix est cumulatif avec la version actuelle après Caelion v1.50.3.

## Vérifications

1. Vérifier que Serment du gardien ne peut pas cibler Thorgar.
2. Lier un allié et vérifier le transfert de 30 %.
3. Utiliser Heurt runique après la diminution de la durée du Serment et vérifier la prolongation.
4. Vérifier que la durée ne dépasse pas sa valeur maximale.
5. Tester Rempart ancestral avec et sans allié lié.
6. Vérifier les quatre niveaux de maîtrise de Serment du gardien.
7. En AUTO, vérifier que Serment est lancé avant Rempart.
8. Vérifier le nom de l’allié lié et la durée sur la carte de Thorgar.
9. Tester sur ordinateur et smartphone.
