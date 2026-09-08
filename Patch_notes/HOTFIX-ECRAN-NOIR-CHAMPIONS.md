# Hotfix — écran noir sur les six derniers champions

## Le symptôme

Cliquer sur Vharok, Ragnhild, Sivrane, Yunmei, Aszhal ou Nyxaris dans le Codex
faisait tomber la page entière en écran noir. Les vingt-six autres champions
s'ouvraient normalement.

## La cause

Ma faute, et elle date de l'ajout de ces six champions.

Chaque champion possède un profil de guide — statistiques prioritaires,
complexité, modes conseillés, ouverture. `championGuide` prévoyait des valeurs
par défaut, mais ne les appliquait **que si le profil manquait entièrement** :

```js
{...identité, ...(PROFILS[id] || {valeurs par défaut})}
```

J'avais écrit pour ces six champions des profils **partiels** — rôle, niche,
composition, mais ni `priorityStats`, ni `complexity`, ni `modes`, ni `opening`.
Un profil partiel passait donc à travers le filet, et l'écran appelait
`priorityStats.join(' · ')` sur `undefined`. React n'a rien à afficher : écran
noir.

La modale « Guide du champion », qui lit les mêmes champs, tombait pareil.

## Les deux corrections

**Structurelle.** Les valeurs par défaut s'étalent désormais **sous** le profil,
toujours. Un champion ajouté à la va-vite s'affiche pauvre — « Polyvalent ·
Adaptable » — au lieu de casser l'écran. C'est le comportement qu'il aurait
toujours dû avoir.

**De contenu.** Les six profils sont complétés pour de bon, écrits sur leurs kits
réels : les statistiques qui comptent, la complexité, les modes où ils brillent,
et trois lignes d'ouverture chacun. Vharok apprend à ne pas dépenser son
Maelström trop tôt, Nyxaris à compter ses charges dans le budget du Sablier,
Aszhal à agir avant ses alliés.

## Sous le capot

La difficulté du test était que, tous les profils étant désormais complets,
**aucun champion réel ne passe plus par le chemin fautif** — un test sur les
champions n'aurait donc rien verrouillé. La fusion est donc exposée comme
fonction à part et testée pour elle-même, avec un profil volontairement partiel.

Les écrans lisent le guide sous des noms de variable différents (`guide` dans la
page, `g` dans la modale). Le test part donc des **clés du guide** et cherche
lesquelles apparaissent dans les sources, plutôt que de deviner le nom de la
variable — il continuera de fonctionner quand une troisième page l'appellera
autrement.

43 tests nouveaux. 13 mutations appliquées, 13 tuées. Deux avaient survécu, dont
une révélatrice : mon ensemble de champs à vérifier se déduisait de la sortie de
`championGuide`, si bien qu'une mutation qui *retirait* des champs rétrécissait
aussi l'ensemble — le test ne pouvait plus rien voir. Ancré sur l'identité.

Vérifié dans le jeu : les sept champions testés s'ouvrent, aucune erreur console.

**1 228 tests, 47 fichiers.**
