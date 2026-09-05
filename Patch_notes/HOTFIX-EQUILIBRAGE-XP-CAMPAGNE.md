# Azerune - Equilibrage de l'XP de Campagne

## Version

Correctif XP Campagne 1.0

## Changements

### Multiplicateurs d'XP des missions

- Normal : 1,75 vers 1,35
- Difficile : 2,20 vers 1,55
- Hardcore : 2,90 vers 1,80

### Coefficients d'XP des missions rejouees

- Normal : 35 % vers 25 %
- Difficile : 40 % vers 27,5 %
- Hardcore : 45 % vers 30 %

### Penalite de surpuissance

- Jusqu'a 110 % : 100 % d'XP
- De 110 % a 130 % : 80 %
- De 130 % a 155 % : 60 %
- De 155 % a 190 % : 40 %
- De 190 % a 230 % : 25 %
- Au-dela de 230 % : 15 %

Le minimum absolu reste fixe a 10 XP.

## Fichiers modifies

```text
src/data/campaign.js
src/utils/stats.js
src/store/GameContext.jsx
```

`src/utils/progression.js` reste volontairement inchange. La formule de cout des niveaux et les plafonds d'Ascension sont conserves.

## Installation

Extraire le ZIP directement a la racine du projet, accepter les remplacements, puis lancer :

```powershell
npm run build
```
