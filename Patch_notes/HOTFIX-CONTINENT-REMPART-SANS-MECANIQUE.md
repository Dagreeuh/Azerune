# Azerune — Hotfix : un continent de Campagne sans mécanique de zone

## Problème

Le neuvième continent, **Rempart du Dernier Serment** (niveaux 49 à 54),
déclarait une mécanique de zone — « Protection, Endurance et combats
prolongés » — que le moteur de combat n'appliquait jamais.

Neuf continents sur dix accordaient bien leur effet de zone. Celui-là, non :
aucun bouclier, aucune Défense renforcée, alors que l'interface annonçait la
mécanique.

## Cause

Le moteur reconnaît une zone par `actor.campaignZone`, qui vaut toujours
l'identifiant du continent. Il testait :

```js
actor.campaignZone === 'bastion-pierre' || actor.campaignZone === 'rempart-anciens'
```

`rempart-anciens` était l'identifiant **avant** la refonte de la Campagne de 15
à 10 zones. Le continent s'appelle depuis `rempart-endurance`. La condition ne
pouvait donc plus être vraie, et la branche était morte.

Un identifiant qui ne correspond plus à rien ne lève aucune erreur : la
mécanique disparaît simplement.

## Correction

Le moteur teste désormais `rempart-endurance`. L'effet — bouclier de
10 % + 4 % par palier des PV maximum de l'allié, plus Défense augmentée deux
tours — s'applique enfin sur ce continent, comme sur `bastion-pierre` qui
partage la même branche.

## Vestiges de la refonte

Cinq autres identifiants de zone subsistent dans le moteur et dans les données
sans correspondre à aucun continent : `netherys`, `chambre-echos`,
`couronne-givree`, `fournaise-incendiaire`, `trone-volcan`.

Ils sont **inertes par construction** : `campaignZone` vaut toujours
l'identifiant d'un continent existant. Ils sont conservés en l'état et
répertoriés dans le test, plutôt que supprimés au jugé d'un moteur de 75 Ko.
Toute nouvelle entrée dans cette liste signalerait un continent renommé sans que
le moteur suive — précisément le défaut corrigé ici.

## Verrou

`tests/campaign.contract.test.js` vérifie que chaque continent vivant est
réellement reconnu par le moteur, et qu'aucune mécanique déclarée n'échappe à la
liste connue.

Contrôle par mutation : rétablir l'ancien identifiant fait échouer le test avec
« rempart-endurance « Rempart du Dernier Serment » — mécanique jamais
appliquée ».

## Vérification

`npm test` — 573 tests.
