# Feuilles de personnage — ce que le pipeline attend

Dépose ici une feuille par champion : `assets-source/<nom>.png`.

## Ce qui a marché du premier coup sur Lelianna

La feuille de Lelianna a été découpée automatiquement sans aucun réglage :
45 cadres, 6 rangées, 12 libellés écartés tout seuls. Garde la même recette et
le reste du roster passera pareil.

| Ce qui compte | Pourquoi |
|---|---|
| **Fond noir uni** | Le détourage part des bords et remonte : un fond uni se retire proprement, un fond dégradé laisse un halo. |
| **Une animation par rangée** | Le regroupement se fait par centre vertical. Deux animations sur la même ligne finissent dans la même rangée. |
| **Un vrai espace entre les cadres** | Deux poses qui se touchent sont vues comme une seule. Une bonne dizaine de pixels de noir suffit. |
| **Libellés d'au plus ~48 px de haut** | C'est ce qui les distingue d'une pièce d'animation (la plus petite fait 63 px). Un titre énorme serait pris pour un sprite. |
| **PNG, pas JPEG** | Le JPEG bave autour des contours et invente des couleurs. Ça marche quand même, mais on perd de la netteté pour rien. |

## Ce qui n'a PAS besoin d'être régulier

- **Les échelles.** Sur la feuille de Lelianna, l'idle est dessiné deux fois
  plus grand que l'attaque. Le pipeline le mesure et le compense à
  l'affichage — il ne redimensionne jamais l'art.
- **Le nombre de cadres.** 5 en idle, 9 en marche, 8 en attaque : peu importe.
- **La position des rangées.** Tout est détecté, rien n'est codé en dur.

## Ce qui coince encore

Une pièce qui se **détache complètement** du personnage (le bâton qui tombe au
KO, une plume isolée) est vue comme un cadre à part. J'avais écrit un
recollage automatique : il chaînait le portrait en pied jusqu'aux rangées
voisines et soudait la feuille entière en un seul bloc. Je l'ai retiré — les
rares cas se règlent dans la config du champion (`outils/feuilles/<nom>.json`).

## Config d'un champion

```json
{
  "champion": "Lelianna",
  "heroId": 12,
  "source": "assets-source/lelianna.png",
  "hauteurCible": 160,
  "animations": [
    {"nom": "repos",   "rangee": 0, "xMin": 400},
    {"nom": "attaque", "rangee": 2, "xMax": 1200},
    {"nom": "mort",    "rangee": 5, "xMin": 600, "minLargeur": 90}
  ]
}
```

`rangee` est l'index affiché par `npm run decouper`. `xMin` / `xMax` /
`minLargeur` servent à écarter ce qui traîne dans la rangée (un logo, un
projectile, un feu follet). Trois lignes suffisent pour un champion.

## Marche à suivre

```bash
npm run decouper -- assets-source/<nom>.png --apercu /tmp/decoupe.png
# on regarde l'aperçu, on écrit outils/feuilles/<nom>.json
npm run importer -- outils/feuilles/<nom>.json
```

Le champion apparaît alors dans l'arène, reconnu par son `heroId`.
