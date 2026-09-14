# v1.83.0 — Que ça ne se reproduise pas

La v1.82.1 corrigeait un écran de combat entièrement vide, causé par une faute
que j'avais livrée. Cette version s'occupe de la cause : **rien dans le projet
n'était capable de voir ce genre d'erreur.**

## Ce qui est en place

**Les 18 pages du jeu sont désormais rendues par les tests.** Aucune ne peut
plus planter au chargement sans que la suite le signale.

**Et un analyseur statique tourne avec les tests.** Une seule règle activée,
celle qui attrape une variable utilisée là où elle n'existe pas — exactement la
faute de la v1.81.1. Elle la trouve en 3 secondes, à la ligne près, sans même
lancer le jeu. Sur le code actuel : zéro problème.

## Ce que je ne prétends pas

Le test de rendu des pages, à lui seul, **n'aurait pas attrapé ma faute** : le
morceau en cause ne s'affiche que quand tu survoles une compétence. Je l'ai
vérifié en remettant l'erreur — il restait vert. C'est l'analyseur statique qui
la trouve.

Restent hors de portée : les erreurs qui ne surviennent qu'en cliquant, et les
fautes de frappe sur un nom de propriété. Je le note pour ne pas te laisser
croire à une garantie plus large qu'elle n'est.

Pense à relancer `npm install` : cette version ajoute un outil de
développement.
