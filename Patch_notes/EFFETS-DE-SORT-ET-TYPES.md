# Effets de sort, types de champion, et le champ mort

## Les combats s'animent

Chaque sort a désormais une allure. Une entaille file en travers de la cible,
une déflagration s'ouvre en anneau, le givre éclate en fragments, une brume de
soins monte, un dôme de protection se referme, une emprise trace un cercle de
runes. La cible tressaille, et sa bordure prend brièvement la couleur du sort
qu'elle vient de recevoir.

**Quatorze allures, six palettes.** Le sort choisit la forme, l'élément choisit
la couleur : une Salve de givre reste du givre, qu'elle soit lancée par un mage
d'Eau ou par un champion de Feu. Un critique et une affinité efficace
intensifient l'effet **sans changer sa forme** — on doit reconnaître le sort
avant d'en lire la puissance.

Et une règle qui prime sur tout : **un soin ressemble à un soin**, un bouclier à
un bouclier, quel que soit l'élément.

## On peut tout couper

Un bouton **✨ EFFETS** en combat, juste au-dessus d'AUTO. Un clic et plus rien
ne bouge.

C'est le **même réglage** que celui des Paramètres et du rituel d'invocation :
couper les animations quelque part les coupe partout. Le jeu respecte aussi le
réglage système « animations réduites » du navigateur.

## Ragnhild n'est pas un tank

Tu avais raison. Elle était étiquetée `dps/tank` alors que son kit est
entièrement offensif : vol de vie, auto-dégâts pour se renforcer, exécution — et
ses statistiques prioritaires sont Attaque et Critique. Aucun bouclier, aucune
provocation, aucune redirection. C'est une bruiser, pas un mur. Corrigé en `dps`.

Un test verrouille la règle : **un tank doit avoir une statistique défensive en
première position**. Brom et Maerys passent — ils frappent depuis leur Défense et
tiennent la ligne, ce sont bien des tanks même sans bouclier. Ragnhild ne passait
pas.

Deux autres règles au passage : un champion étiqueté *soigneur* doit avoir un
sort qui soigne, un *protecteur* un outil qui protège quelqu'un. Tout le roster
les respecte.

## Le champ pitfall a disparu

Il existait sur six champions et **n'était lu par aucun écran**. Retiré.

## Sous le capot

Le moteur attache maintenant le sort et l'élément à chaque événement de combat.
C'est ce qui permet à l'écran de choisir l'animation du **sort** plutôt qu'une
gerbe générique — et l'ensemble tient en un seul point de jonction dans le
moteur, pour le joueur, l'automatique et les ennemis à la fois.

Tout est en CSS : aucune dépendance, aucun canvas, aucune boucle d'animation en
JavaScript. Les couleurs passent par des variables, si bien qu'une même allure
sert six éléments sans dupliquer une règle.

30 tests nouveaux. 15 mutations appliquées, 15 tuées. Deux avaient survécu, dont
une amusante : mon test vérifiait qu'une animation avait bien ses keyframes avec
`toContain('@keyframes vfxShards')` — ce qui passe sur `@keyframes vfxShardsOld`,
puisque c'est une sous-chaîne. L'animation serait restée morte.

Vérifié en combat réel : cinq allures distinctes observées en une seule bataille,
la coupure ne laisse **aucun** effet visible, et la préférence est bien écrite
dans la clé partagée.

> **Un avertissement React signalé, non corrigé.** La console affiche « Cannot
> update a component while rendering a different component » pendant les combats
> automatiques. Vérifié : il est **présent à l'identique avant ces changements**,
> donc préexistant et hors sujet ici. Il mérite sa propre investigation.

**1 257 tests, 48 fichiers.**
