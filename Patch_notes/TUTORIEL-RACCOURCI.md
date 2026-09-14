# Azerune — Le tutoriel d'ouverture, deux fois plus court et enfin facultatif

## Ce qui n'allait pas

Le tutoriel a été chronométré en le jouant réellement, pas en le lisant.

| | Avant |
|---|---|
| Écrans d'introduction | 2 |
| Étapes guidées | **11** |
| Points de vie ennemis | 1 220 + 180 de bouclier |
| Actions pour finir le combat | **49** |
| Actions **après la dernière consigne** | **≈ 42** |
| Moyen de le passer | **aucun** |

Le problème n'était pas le nombre d'étapes. C'était qu'après la onzième
consigne, le jeu basculait en « mode libre » avec pour seule instruction
« termine le combat », face à trois ennemis totalisant 1 400 points de vie
effectifs. **La partie la plus longue du tutoriel était celle qui n'enseignait
rien** — une quarantaine de clics d'attaque sans commentaire.

Et rien ne permettait d'en sortir : la page ne proposait aucun bouton, et
l'accès au jeu était verrouillé tant que le combat n'était pas gagné.

## Ce qui change

**On peut le passer, à tout moment.** Un bouton discret sur les deux écrans
d'introduction et dans l'en-tête du combat. Passer **conserve la récompense de
bienvenue** : le tutoriel est une proposition, pas un péage.

**Onze étapes deviennent six.** Attaquer · la riposte ennemie · protéger un
allié · les affinités · soigner · briser un bouclier. Les cinq étapes retirées
enseignaient des subtilités — redirection des dégâts liés, absorption par les
boucliers, bonus d'exécution — que l'**Académie** couvre déjà en douze leçons,
et qui n'ont pas leur place avant le premier vrai combat.

**Le combat est court.** Les ennemis passent de 1 220 à 240 points de vie, le
bouclier du Gardien de 180 à 50. Le combat entier se termine désormais en
**onze actions** au lieu de quarante-neuf, dont sept après la dernière consigne.

**Plus d'exception à expliquer.** Le tutoriel ne force plus l'usage du troisième
sort, normalement réservé aux champions 4★. La bannière qui prévenait « cette
exception existe uniquement dans ce combat » a disparu avec elle : un débutant
n'a pas à comprendre une règle et son exception dans la même minute.

## Vérifié en jouant

Parcours complet en navigateur, du premier écran à « Tutoriel terminé » :
**les six étapes s'enchaînent, quinze clics au total, aucune erreur**.

## Détail technique

`src/data/tutorialBattle.js` (six étapes, points de vie), `src/pages/TutorialPage.jsx`
(bouton pour passer, bouclier, message de fin), `src/styles.css`.

**13 tests** (`tests/tutoriel.test.js`) fixent la longueur — six étapes au plus,
quatorze actions au plus pour finir — et l'existence du bouton sur les trois
écrans. **5 mutations** appliquées au code livré, toutes détectées.
