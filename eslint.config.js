// Configuration volontairement MINIMALE.
//
// Le projet n'avait aucun linter, et ce fichier n'est pas là pour imposer un
// style : il existe pour une seule classe de défaut, celle qui a rendu l'écran
// de combat entièrement vide en 1.81.1. `battle?.difficulte` écrit dans un
// composant défini avant la déclaration de `battle` : du JSX parfaitement
// valide, que `vite build` compile sans broncher et qu'aucun test ne voyait,
// puisque le composant ne se rend que sur survol.
//
// `no-undef` attrape exactement cela, statiquement, sur tout le code — y
// compris les chemins que personne ne rend jamais dans les tests.
//
// Tout le reste est désactivé : ajouter des règles de style ici ferait du
// bruit et ferait perdre de vue le seul défaut qu'on veut rendre impossible.
import globals from'globals';

export default[
  {
    files:['src/**/*.{js,jsx}','outils/**/*.mjs','tests/**/*.js'],
    languageOptions:{
      ecmaVersion:2023,
      sourceType:'module',
      parserOptions:{ecmaFeatures:{jsx:true}},
      globals:{...globals.browser,...globals.node},
    },
    linterOptions:{reportUnusedDisableDirectives:true},
    rules:{'no-undef':'error'},
  },
];
