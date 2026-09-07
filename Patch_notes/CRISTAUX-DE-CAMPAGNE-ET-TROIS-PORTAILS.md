# Cristaux de campagne et trois portails d'invocation

## En bref

Les cristaux de campagne suivent enfin la progression, terminer un continent
verse un palier, et le Portail ancestral n'est plus seul : le **Vœu d'Azerune**
laisse nommer un 5★, la **Conjonction mensuelle** met trois 5★ en avant chaque
mois.

Aucun des deux nouveaux portails ne change les taux.

## Les cristaux de campagne

Ils étaient plats : 11 par palier, 34 par boss, de la zone 1 à la zone 10. Le
gardien de Valebrume, premier obstacle du jeu, et Pyraxis, épreuve finale,
versaient exactement la même chose.

Désormais la récompense suit la zone — doucement, le cristal reste la monnaie
rare — et **terminer les sept missions d'un continent verse un palier**, une
seule fois par difficulté, qui grandit avec la zone. Le farm n'en déclenche
aucun.

Le premier palier est calé pour ouvrir votre première invocation multiple : avec
les 600 cristaux de départ et ce que verse le premier continent, terminer
Valebrume vous amène à 1 000. Auparavant on pouvait boucler tout un continent
sans jamais pouvoir s'offrir un rituel.

Mesuré sur huit parties simulées sans aucun autre contenu — ni quêtes, ni
expéditions, ni hauts faits — la campagne seule porte maintenant jusqu'à la
moitié du parcours. La seconde moitié demande de jouer le reste du jeu : c'est
voulu.

Les hauts faits n'ont pas été touchés. Ils versent déjà 33 200 cristaux, plus du
triple de toute la campagne Normal : les gonfler aurait donné le roster sans le
jeu.

## Trois portails

**La règle, valable pour les trois : aucun ne modifie le taux de 5★.** Ils
changent la cible, jamais le volume. Cent invocations donnent le même nombre de
5★ où que vous les fassiez ; ce qui change, c'est la probabilité que ce 5★ soit
celui que vous attendez.

Le prix est le même partout — 100 et 900 — et **le compteur de garantie est
commun aux trois**. Changer de portail ne fait rien perdre.

### 🌀 Portail ancestral
Le pool complet, sans favori. Le seul qui accepte les Pierres de foyer, et le
seul qui puisse donner n'importe quel champion.

### 🕯️ Vœu d'Azerune
Vous nommez un 5★. Une chance sur deux qu'un 5★ obtenu soit lui — et si ce n'est
pas lui, **le prochain 5★ de ce portail l'est à coup sûr**. Deux 5★ suffisent
donc toujours, un et demi en moyenne.

Changer d'élu remet cette garantie à zéro. C'est le seul prix du choix.

### 🌙 Conjonction mensuelle
Trois 5★ mis en avant, trois chances sur quatre qu'un 5★ soit l'un d'eux. Vous
ne choisissez pas lequel, et le trio change au premier du mois.

Le trio est calculé à partir du mois, jamais tiré au hasard : vos amis et vous
voyez exactement le même, sans que rien ne soit synchronisé.

### Lequel choisir
Chacun est le meilleur à quelque chose. Le Vœu vise **un** champion précis. La
Conjonction touche plus souvent **l'un des trois**, mais sans choisir. L'ancestral
reste le seul complet, et le seul pour les Pierres de foyer.

## Corrections

L'onglet **Difficile** annonçait « 3★ à 5★ » alors que son butin plafonne à 4★ —
corrigé au patch précédent, rappelé ici pour mémoire.

Deux chiffres de l'audit de difficulté publié précédemment étaient faux et ont
été corrigés dans le document : l'économie de la campagne Normal (4 575 cristaux
et non 1 000 — les paliers d'étoiles avaient été oubliés), et les mesures
« après correction », produites par un simulateur qui créditait des cristaux sur
chaque partie de farm alors que le jeu n'en verse qu'au premier clear. Le
diagnostic sur l'XP ne dépendait d'aucun des deux.

## Sous le capot

54 tests nouveaux répartis en trois fichiers, dont un test de contrat qui
vérifie que **tout ce que l'écran d'invocation réclame est réellement fourni** —
une clé manquante ne casse aucun test unitaire, la page rend `undefined` en
silence.

43 mutations appliquées ; six ont survécu au premier passage, toutes tuées après
renforcement des tests. Parmi les survivants : trois pourcentages affichés au
joueur qui n'étaient testés que les uns par rapport aux autres, et un test qui
cherchait la sauvegarde dans une fenêtre assez large pour attraper le tableau de
dépendances du `useEffect` juste en dessous.

Audit complet et méthode : `Audit/RAPPORT-CRISTAUX-ET-PORTAILS.md`.

**1 106 tests, 42 fichiers.**
