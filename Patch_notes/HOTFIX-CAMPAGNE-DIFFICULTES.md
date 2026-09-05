# Hotfix Campagne - Difficultés Normal, Difficile et Hardcore

## Version

`v1.52.1`

## Objectif

Créer une progression de difficulté nette et régulière :

- le Normal reste accessible, mais les dernières zones demandent une vraie composition ;
- le Difficile constitue un saut visible après le Normal ;
- le Hardcore reste sensiblement plus exigeant que le Difficile ;
- les boss des zones 5 et 10 jouent réellement leur rôle de murs de progression.

## Changements

### Échelle de combat

La difficulté de combat est désormais séparée du multiplicateur économique utilisé par les récompenses :

```text
Normal    : x1,12
Difficile : x1,38
Hardcore  : x1,70
```

### Statistiques par difficulté

```text
Normal
PV x1,06 · ATQ x1,08 · DEF x1,04
Vitesse x1,01
Zones 9 et 10 : mécanique de palier 2, Vitesse x1,03, Précision et Résistance renforcées

Difficile
PV x1,25 · ATQ x1,24 · DEF x1,16
Vitesse x1,05 · Résistance +14 · Précision +12
Mécaniques de palier 2

Hardcore
PV x1,45 · ATQ x1,42 · DEF x1,28
Vitesse x1,10 · Résistance +28 · Précision +24
Mécaniques de palier 3
```

Ces multiplicateurs s'ajoutent à la progression régionale propre à chaque zone.

### Boss

Les boss reçoivent une pression supplémentaire :

```text
Boss ordinaire : mur x1,06
Boss zone 5    : mur x1,10
Boss zone 10   : mur x1,20
```

Le mur est ensuite renforcé de 7 % en Difficile et de 13 % en Hardcore.

### Pouvoirs majeurs des boss

```text
Normal    : coefficient 0,68 · soin 8 %
Difficile : coefficient 0,80 · soin 11 %
Hardcore  : coefficient 0,94 · soin 14 %
```

Les chances de coup critique et la pression propre aux boss de Campagne augmentent également avec la difficulté.

## Transitions visées

À zone équivalente, la hausse réelle est approximativement :

```text
Normal vers Difficile
PV et pression globale : environ +40 à +45 %

Difficile vers Hardcore
PV et pression globale : environ +40 à +45 %
```

Le saut reste important, mais il est progressif et prévisible.

## Fichiers modifiés

```text
src/data/campaign.js
src/battle/engine.js
```

## Fichier audité et inchangé

```text
src/utils/stats.js
```

Les recommandations sont recalculées depuis les ennemis générés. La formule de puissance n'avait pas besoin d'être modifiée.

## Installation

1. Extraire le ZIP directement à la racine du projet.
2. Accepter le remplacement des fichiers.
3. Lancer :

```powershell
npm run build
```

Pour tester localement :

```powershell
npm run dev
```

## Tests conseillés

- Normal zone 1, boss : reste accessible à une équipe de départ.
- Normal zones 9 et 10 : vérifier que soin, purification et ciblage deviennent utiles.
- Difficile zone 1 : vérifier le saut après le boss final Normal.
- Difficile zones 5 et 10 : vérifier les murs de progression.
- Hardcore zone 1 : vérifier qu'une équipe seulement capable de terminer le Difficile ne roule pas immédiatement sur le contenu.
- Hardcore zones 5 et 10 : tester en manuel et en AUTO.

## Vérifications techniques

- Syntaxe JavaScript validée pour les deux fichiers.
- Génération vérifiée pour les boss des zones 1, 5, 9 et 10 dans les trois difficultés.
- Mécaniques de palier vérifiées.
- Récompenses et multiplicateurs d'XP conservés.
- Autres activités non modifiées.
