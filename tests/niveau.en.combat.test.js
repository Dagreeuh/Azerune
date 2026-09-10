import{describe,it,expect}from'vitest';
import React from'react';
import{renderToStaticMarkup}from'react-dom/server';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{Unit}from'../src/pages/BattlePage';
import{HEROES}from'../src/data/heroes';
import{levelCap,MAX_LEVEL}from'../src/utils/progression';

// Niveau du champion sur sa carte de combat, en haut a droite.
//
// Le coin haut-droit portait deja le marqueur AUTO. Les deux ne se croisent
// jamais — AUTO ne s'affiche que sur un ENNEMI cible automatiquement, le
// niveau que sur un ALLIE — mais rien ne l'ecrivait nulle part, et c'est
// exactement le genre de voisinage qui casse six mois plus tard.

const unite=(hero,extra={})=>({...hero,side:'ally',hp:100,maxHp:100,shield:0,maxShield:0,
  atb:50,currentSpd:100,buffs:{},debuffs:{},cooldowns:[0,0,0],mechanic:{value:1},
  dead:false,atk:100,...extra});
const rendre=(u,props={})=>renderToStaticMarkup(React.createElement(Unit,
  {unit:u,active:false,selected:false,automatic:false,onClick:()=>{},events:[],
   enemies:[],allies:[u],vfxEnabled:true,...props}));
const pastille=html=>html.match(/<span class="unit-level">([^<]*)<\/span>/)?.[1]||null;

describe('la carte affiche le niveau du champion',()=>{
  it('il apparaît pour tout le roster',()=>{
    HEROES.forEach(hero=>
      expect(pastille(rendre(unite(hero,{currentLevel:37}))),hero.name).toBe('Niv. 37'));
  });

  it('il est en haut à droite de la carte',()=>{
    const styles=fs.readFileSync(fileURLToPath(new URL('../src/styles.css',import.meta.url)),'utf8');
    const regle=styles.slice(styles.indexOf('.unit-level{'),styles.indexOf('}',styles.indexOf('.unit-level{')));
    expect(regle,'la pastille n’est plus positionnée').toContain('position:absolute');
    expect(regle,'elle n’est plus à droite').toMatch(/right:\d/);
    expect(regle,'elle n’est plus en haut').toMatch(/top:\d/);
  });

  it('elle n’avale pas le clic de sélection de la carte',()=>{
    // La carte entiere est un bouton : une pastille cliquable au-dessus
    // empecherait de cibler l'allie.
    const styles=fs.readFileSync(fileURLToPath(new URL('../src/styles.css',import.meta.url)),'utf8');
    const regle=styles.slice(styles.indexOf('.unit-level{'),styles.indexOf('}',styles.indexOf('.unit-level{')));
    expect(regle).toContain('pointer-events:none');
  });
});

describe('elle ne s’affiche que là où un niveau existe',()=>{
  it('jamais sur un ennemi : les ennemis n’ont pas de niveau',()=>{
    const e=unite(HEROES[0],{side:'enemy',currentLevel:42});
    expect(pastille(rendre(e,{enemies:[e],allies:[]}))).toBe(null);
  });

  it('jamais sans niveau connu',()=>{
    expect(pastille(rendre(unite(HEROES[0])))).toBe(null);
    expect(pastille(rendre(unite(HEROES[0],{currentLevel:0})))).toBe(null);
    expect(pastille(rendre(unite(HEROES[0],{currentLevel:null})))).toBe(null);
  });
});

describe('elle ne se marche pas sur les pieds avec le reste de la carte',()=>{
  it('le marqueur AUTO et le niveau ne peuvent pas coexister',()=>{
    // AUTO est pose par `.compact-unit.auto-target:after` au meme endroit.
    // La page ne passe `automatic` que pour les ennemis, et le niveau ne
    // s'affiche que pour les allies : ce test fige cette separation.
    const page=fs.readFileSync(fileURLToPath(new URL('../src/pages/BattlePage.jsx',import.meta.url)),'utf8');
    const allies=page.slice(page.indexOf('battle.allies.map(unit=><Unit'));
    expect(allies.slice(0,400),'l’écran marque un allié comme cible AUTO').not.toContain('automatic=');
    const avecAuto=rendre(unite(HEROES[0],{currentLevel:12}),{automatic:true});
    expect(pastille(avecAuto),'un allié porte les deux marqueurs').toBe('Niv. 12');
  });

  it('l’étiquette TOUR reste au-dessus, pas à droite',()=>{
    const styles=fs.readFileSync(fileURLToPath(new URL('../src/styles.css',import.meta.url)),'utf8');
    const regle=styles.slice(styles.indexOf('.turn-label{'),styles.indexOf('}',styles.indexOf('.turn-label{')));
    expect(regle,'TOUR a migré dans le coin du niveau').toContain('left:50%');
  });

  it('le reste de la carte est inchangé',()=>{
    // Un ajout d'interface ne doit rien deplacer d'autre.
    const sans=rendre(unite(HEROES[0])),avec=rendre(unite(HEROES[0],{currentLevel:42}));
    expect(avec.replace(/<span class="unit-level">[^<]*<\/span>/,'')).toBe(sans);
  });
});

describe('le niveau affiché est le vrai',()=>{
  it('l’écran de combat embarque le niveau réel du champion',()=>{
    const page=fs.readFileSync(fileURLToPath(new URL('../src/pages/BattlePage.jsx',import.meta.url)),'utf8');
    expect(page,'le niveau n’est plus lu depuis la progression')
      .toContain('currentLevel:getProgress(hero).level');
  });

  it('il s’affiche jusqu’au plafond du jeu',()=>{
    expect(pastille(rendre(unite(HEROES[0],{currentLevel:MAX_LEVEL})))).toBe(`Niv. ${MAX_LEVEL}`);
    expect(levelCap(6),'le plafond a changé').toBe(MAX_LEVEL);
  });
});
