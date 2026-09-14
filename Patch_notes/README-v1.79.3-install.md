# v1.79.3 — Le message d'erreur dit maintenant quoi faire

Tu es tombé sur `Failed to resolve import "pixi.js"` après avoir récupéré la
branche. Ce n'était pas un bug : il manquait juste un `npm install`.

L'arène utilise **PixiJS**, une bibliothèque ajoutée récemment. Quand une
version ajoute une dépendance, ton dossier `node_modules` ne la connaît pas
encore, et Vite plante — en pointant un fichier parfaitement correct, au milieu
d'une pile d'appels illisible. Rien ne disait quoi faire.

## Maintenant

`npm run dev` vérifie d'abord et s'arrête en une phrase :

```
  Dépendances manquantes : pixi.js
  Elles ont été ajoutées depuis ta dernière installation.

     npm install
```

## La règle à retenir

**Après un `git pull`, lance `npm install`.**

C'est aussi écrit dans le README du projet, qui était vide et qui explique
maintenant comment lancer le jeu et à quoi servent les commandes.
