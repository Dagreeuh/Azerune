# Azerune - Hotfix ciblé Vaeloria

## Version

Hotfix Vaeloria 1.0

## Objectif

Rendre la mécanique Danse des lames lisible en combat et garantir que l'AUTO cherche réellement à compléter une rotation de trois compétences différentes.

## Changements

### Interface de combat

La ressource de Vaeloria affiche désormais :

- le compteur global de 0/3 à 2/3 ;
- chaque compétence utilisée avec un marqueur `✓` ;
- chaque compétence encore manquante avec un marqueur `○` ;
- le nom exact des trois compétences.

### Moteur AUTO

Pour Vaeloria :

1. l'AUTO cherche d'abord une compétence disponible qui n'a pas encore validé une étape de Danse ;
2. l'ordre personnalisé du joueur départage les compétences inédites disponibles ;
3. une compétence déjà utilisée ne repasse devant que lorsqu'aucune nouvelle étape n'est actuellement disponible ;
4. les temps de recharge restent respectés ;
5. la rotation manuelle et les autres champions ne sont pas modifiés.

### Fenêtre des priorités AUTO

Le texte spécifique à Vaeloria explique désormais précisément l'interaction entre Danse des lames et l'ordre personnalisé.

## Fichiers modifiés

```text
src/pages/BattlePage.jsx
src/battle/engine.js
src/components/AutoSkillPriorityModal.jsx
```

## Vérifications

- une compétence répétée ne crée pas une seconde étape ;
- les trois compétences différentes déclenchent toujours le tour bonus existant ;
- la remise à zéro de `danceSteps` reste intacte ;
- la Résonance IV reste intacte ;
- l'AUTO respecte les délais ;
- la préférence pour une étape inédite fonctionne aussi avec un ordre personnalisé ;
- aucun kit, coefficient ou dégât de Vaeloria n'est modifié.

## Installation

Extraire le ZIP directement à la racine du projet, accepter les remplacements, puis lancer :

```powershell
npm run build
```
