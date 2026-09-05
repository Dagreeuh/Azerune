# Azerune - Hotfix Académie Équipe v1.50.17

## Problème
Dans la leçon « Maîtriser le mode AUTO », l'action Équipe apparaissait comme un petit onglet sombre isolé en bas de la simulation. L'action requise était difficile à identifier.

## Corrections
- Remplacement du petit onglet par un grand appel à l'action intégré au mini-défi.
- Libellé explicite « ACTION REQUISE » puis « Ouvrir Équipe ».
- Icône Équipe agrandie.
- Contraste orange renforcé et animation légère tant que le clic est attendu.
- Passage en vert avec « ÉTAPE TERMINÉE » après le clic.
- Message guidant vers « Priorités AUTO » sur la carte d'Elowen.
- Carte d'Elowen et bouton « Priorités AUTO » rendus plus visibles.
- Adaptation ordinateur, tablette et smartphone.
- Respect du réglage système de réduction des animations.

## Fichiers modifiés
```text
src/components/TutorialModal.jsx
src/styles.css
```

`TutorialAcademyPage.jsx` a été contrôlé mais n'est pas modifié.

## Installation
Extraire l'archive à la racine du projet, accepter les remplacements, puis exécuter :

```powershell
npm run build
```
