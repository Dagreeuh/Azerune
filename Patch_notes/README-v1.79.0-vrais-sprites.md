# v1.79.0 — Lelianna entre dans l'arène

## Tes dessins sont dans le jeu

Ta feuille de personnage a été découpée automatiquement : **45 cadres,
6 rangées**, les libellés (« Repos / Idle », « Marche »…) écartés tout seuls.
Aucun réglage manuel.

Lelianna se bat maintenant dans l'arène d'essai
(**Paramètres → Ouvrir l'arène d'essai**), avec ses vraies animations : repos,
attaque, mort. Ses trois portraits sont extraits aussi — ils serviront d'icônes.

## Ce que ça change

Mes sprites générés faisaient 31 teintes. Les tiens en ont plus de 100. La
comparaison côte à côte dans l'arène se passe de commentaire — et c'est
exactement pour ça que le prototype existait.

## Ce que la chaîne respecte

**Elle ne redimensionne jamais ton art.** Sur ta feuille, l'idle est dessiné
deux fois plus grand que l'attaque. Plutôt que de tout ramener de force à une
taille commune — ce qui abîmerait le pixel art — le jeu mesure l'écart et le
compense à l'affichage. Ton dessin arrive à l'écran tel que tu l'as fait.

**Elle ne troue pas les personnages.** Le fond noir est retiré en partant des
bords : les noirs *à l'intérieur* de Lelianna — ses contours, les creux de sa
robe — sont préservés.

## Pour les autres champions

Garde la même recette et ça passera tout seul. Le détail est dans
`assets-source/README.md`, mais l'essentiel tient en quatre points :

- **fond noir uni**
- **une animation par rangée**
- **un espace net entre les cadres** (deux poses collées sont vues comme une)
- **du PNG plutôt que du JPEG** — le JPEG bave autour des contours

Tu n'as pas besoin de garder les mêmes échelles ni le même nombre de cadres
d'un champion à l'autre : tout est détecté.

Dépose les feuilles dans `assets-source/`, je m'occupe du reste.
