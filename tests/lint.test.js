import{describe,it,expect}from'vitest';
import{execFileSync}from'node:child_process';
import path from'node:path';

/**
 * Le linter tourne avec les tests, et pas seulement quand on y pense.
 *
 * `no-undef` est la seule règle activée. Elle existe pour une classe de défaut
 * précise : une variable employée hors de sa portée. C'est ce qui a rendu
 * l'écran de combat entièrement vide en 1.81.1 — `battle?.difficulte` écrit
 * dans un composant défini AVANT la déclaration de `battle`.
 *
 * Ce que rien d'autre ne voyait :
 *   · `vite build` compile un JSX valide sans broncher ;
 *   · les tests ne rendaient aucune page ;
 *   · et même le test de rendu de toutes les pages, ajouté depuis, ne
 *     l'attrape PAS — le composant fautif ne se rend que sur survol.
 *
 * Vérifié en réintroduisant la faute : ESLint la signale à la ligne et à la
 * colonne exactes, le build passe au vert.
 */
const RACINE=path.resolve(__dirname,'..');

describe('analyse statique',()=>{
  it('aucune variable employée hors de sa portée',()=>{
    let sortie='';
    try{
      execFileSync('npx',['eslint','.'],
        {cwd:RACINE,stdio:'pipe',encoding:'utf8'});
    }catch(erreur){
      sortie=String(erreur.stdout||'')+String(erreur.stderr||'');
    }
    expect(sortie.trim(),sortie).toBe('');
  },120000);
});
