# Azerune - Rapport de combat corrigé après contrôle de cohérence

## Corrections préventives

- attribution des boucliers par couches séparées afin d'éviter qu'un nouveau bouclier vole la mitigation d'un ancien poseur ;
- attribution du bouclier d'urgence d'Aurelis ;
- conservation de l'attribution des boucliers après copie d'une unité ;
- compatibilité avec les anciennes sessions ne possédant pas encore de registre de couches ;
- exclusion du contrecoup auto-infligé de Vexil des dégâts périodiques infligés aux ennemis.

## Fichiers inclus

```text
src/battle/engine.js
src/pages/BattlePage.jsx
src/styles.css
```

## Installation

Extraire directement à la racine du projet, accepter les remplacements, puis lancer :

```powershell
npm run build
```
