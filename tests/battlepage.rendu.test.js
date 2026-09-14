import{describe,it,expect}from'vitest';
import React from'react';
import{renderToStaticMarkup}from'react-dom/server';
import{SkillTooltip}from'../src/pages/BattlePage';
import{HEROES}from'../src/data/heroes';
import{affinity}from'../src/utils/elements';
import fs from'node:fs';
import path from'node:path';

/**
 * Ce fichier existe à cause d'une régression que j'ai introduite en 1.81.1.
 *
 * En faisant dériver l'affichage d'affinité du moteur, j'ai écrit
 * `battle?.difficulte` DANS `SkillTooltip` — un composant défini AVANT la
 * déclaration de `battle`, donc hors de sa portée. `vite build` a compilé sans
 * broncher (du JSX valide, un identifiant simplement absent à l'exécution) et
 * les 1 805 tests sont passés au vert, car AUCUN ne rendait cette page.
 *
 * Résultat : l'écran de combat entier plantait sur `battle is not defined`.
 * Découvert en jouant une vraie partie dans un navigateur.
 */

const acteur=(()=>{
  const h=HEROES[0];
  return{...h,currentStars:5,skillLevels:{0:1,1:1,2:1},
    atk:400,def:120,hp:3000,spd:100,crit:10,critDamage:60,
    accuracy:40,resistance:20,setEffects:[],element:h.element};
})();

const rendre=(props={})=>renderToStaticMarkup(
  React.createElement(SkillTooltip,{
    actor:acteur,skill:acteur.skills[0],index:0,
    relation:affinity(acteur.element,'Nature',props.difficulte),
    unlocked:true,onGuide:()=>{},defense:120,...props}));

describe('l’infobulle de compétence se rend vraiment',()=>{
  it('ne plante pas — c’est tout le propos',()=>{
    expect(()=>rendre()).not.toThrow();
  });

  it('se rend pour les trois difficultés',()=>{
    ['normal','hard','hardcore'].forEach(difficulte=>
      expect(()=>rendre({difficulte}),difficulte).not.toThrow());
  });

  it('n’utilise aucune variable hors de sa portée',()=>{
    // La faute exacte : `battle` n'existe pas dans ce composant. Le rendu
    // aurait levé `battle is not defined` ; il ne lève plus rien.
    const html=rendre({difficulte:'normal'});
    expect(html).toContain('AFFINITÉ');
  });
});

describe('le combat transmet bien sa difficulté',()=>{
  // Le composant peut être parfait et recevoir `null` : l'infobulle
  // annoncerait alors le poids plein dans tous les modes.
  const page=fs.readFileSync(path.resolve(__dirname,'../src/pages/BattlePage.jsx'),'utf8');

  it('la passe au rendu de l’infobulle',()=>{
    expect(page).toMatch(/<SkillTooltip[^>]*difficulte=\{battle\?\.difficulte/);
  });
});

describe('l’infobulle annonce les valeurs du mode joué',()=>{
  it('affiche le multiplicateur atténué en Normal',()=>{
    // En Normal l'affinité pèse 45 % : efficace vaut ×1,14, pas ×1,30.
    expect(rendre({difficulte:'normal'})).toContain('×1,14');
  });

  it('affiche le multiplicateur plein en Hardcore',()=>{
    expect(rendre({difficulte:'hardcore'})).toContain('×1,30');
  });

  it('sans difficulté, annonce le poids plein',()=>{
    // Hors campagne — raids, mythique, défis — l'affinité garde tout son poids.
    expect(rendre()).toContain('×1,30');
  });
});
