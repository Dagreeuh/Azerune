# Chroniques d'Azerune

RPG gacha au tour par tour. React + Vite, entièrement côté client, sauvegarde
dans le navigateur. Empaqueté pour mobile avec Capacitor.

## Lancer le jeu

```bash
npm install
npm run dev
```

## Après un `git pull`

**Relance `npm install`.** C'est la seule chose à retenir : dès qu'une version
ajoute une dépendance, un `node_modules` qui date plante avec une erreur qui ne
dit pas d'où elle vient (`Failed to resolve import "pixi.js"`, au milieu d'une
pile d'appels).

`npm run dev` vérifie désormais ce point avant de démarrer et te le dit en une
phrase plutôt qu'en trente lignes. Pour le contrôler à part :

```bash
npm run verifier-deps
```

## Les commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | construit la version de production |
| `npm test` | la suite complète |
| `npm run test:watch` | les tests en continu |
| `npm run mesures` | harnais de mesure sans assertion (équilibrage) |

### Sprites et feuilles de personnage

| Commande | Ce qu'elle fait |
|---|---|
| `npm run sprites` | régénère les sprites de secours dessinés par script |
| `npm run decouper -- assets-source/<nom>.png --apercu /tmp/x.png` | découpe une feuille et sort un aperçu annoté |
| `npm run importer -- outils/feuilles/<nom>.json` | produit l'atlas d'un champion |

Le format attendu pour une feuille de personnage est décrit dans
[`assets-source/README.md`](assets-source/README.md).

## Où regarder

- **Onglet 🎬 Arène** — prototype de combat en pixel art rendu par PixiJS, avec
  le vrai moteur de combat. Écran d'essai : il ne remplace pas encore l'écran
  de combat.
- `Audit/RAPPORT-EXPERIENCE-JOUEUR.md` — le journal de bord technique, version
  par version : ce qui a été mesuré, ce qui a été trouvé, ce qui reste ouvert.
- `Patch_notes/` — les notes de version côté joueur.
