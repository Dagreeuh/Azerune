# v1.82.1 — Correctif : l'écran de combat ne s'ouvrait plus

## Ce qui était cassé

Depuis la v1.81.1, **ouvrir un combat affichait un écran vide.** Une erreur que
j'avais introduite en corrigeant l'affichage des affinités : une variable
utilisée à un endroit où elle n'existait pas.

Ni la compilation ni les 1 812 tests ne l'ont vue — parce qu'aucun test
n'ouvrait cette page. C'est en jouant une partie complète que je l'ai trouvée.

C'est corrigé, et un test ouvre désormais cette infobulle pour de vrai, dans
les trois difficultés.

## Et une bonne nouvelle

J'avais noté dans mes rapports que la carte **COMBAT EN COURS** ne fonctionnait
pas. Vérification faite en jouant : **elle fonctionne**. Ferme l'application en
plein combat, rouvre-la, et l'accueil t'affiche :

> ⚔️ COMBAT EN COURS · Approche de Valebrume · Tour : Korga · Équipe 3/3 ·
> Ennemis 3/3 · Reprendre · Abandonner

Elle ne sert pas à sortir d'un combat en cours de route — quitter fait perdre
la progression, et le jeu te le dit clairement. Elle sert à reprendre là où tu
t'étais arrêté.
