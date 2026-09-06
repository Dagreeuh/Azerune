// Contrat : toute compétence qui annonce des dégâts doit en infliger.
//
// Le moteur décide des dégâts par liste blanche (`damageEffects`). Une
// compétence offensive absente de cette liste s'exécute normalement, applique
// ses malus, écrit dans le journal de combat — et ne retire pas un seul point
// de vie. Aucune erreur, aucun avertissement.
//
// Ce piège s'est refermé sur les six renforts élémentaires : leurs onze
// compétences offensives ont frappé dans le vide jusqu'à ce que ce test
// existe. Il vaut pour tout champion ajouté ensuite.
import{describe,it,expect,afterEach,vi}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{createBattle,nextTurn,castSkill}from'../src/battle/engine';
import{makeEnemy,statsFrom,fixedRandom,giveTurnTo}from'./helpers';

const moteur=fs.readFileSync(fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8');
const listeBlanche=new Set(
  [...moteur.slice(moteur.indexOf('const damageEffects=new Set(['))
    .slice(0,moteur.slice(moteur.indexOf('const damageEffects=new Set([')).indexOf(']);'))
    .matchAll(/'([^']+)'/g)].map(trouve=>trouve[1])
);

/** Compétences qui promettent des dégâts : cible ennemie et puissance non nulle. */
const offensives=HEROES.flatMap(hero=>hero.skills
  .map((skill,index)=>({hero,skill,index}))
  .filter(({skill})=>['enemy','allEnemies'].includes(skill.target)&&(skill.power||0)>0));

afterEach(()=>vi.restoreAllMocks());

describe('liste blanche des dégâts',()=>{
  it('le roster déclare bien des compétences offensives',()=>{
    expect(offensives.length).toBeGreaterThan(40);
  });

  offensives.forEach(({hero,skill})=>{
    it(`${hero.name} · ${skill.name} figure dans la liste blanche`,()=>{
      expect(listeBlanche.has(skill.effect),
        `${skill.effect} absent : la compétence frapperait dans le vide`).toBe(true);
    });
  });

  it('la liste blanche ne contient aucun effet inconnu du roster',()=>{
    // Un effet listé que plus aucun champion ne porte est du code mort.
    const portes=new Set(HEROES.flatMap(hero=>hero.skills.map(skill=>skill.effect)));
    expect([...listeBlanche].filter(effet=>!portes.has(effet))).toEqual([]);
  });
});

describe('vérification en combat',()=>{
  /** Fait lancer la compétence et renvoie les dégâts réellement infligés. */
  function degats(hero,index){
    fixedRandom(.5);
    const cibles=[0,1,2].map(rang=>makeEnemy({id:`c${rang}`,hp:400000,atk:1,def:0,spd:1,element:'Arcane'}));
    let combat=createBattle([hero.id],[{...hero,currentStars:6}],
      unite=>({...statsFrom(unite),accuracy:120,resistance:0}),{enemies:cibles});
    combat={...combat,allies:combat.allies.map(unite=>({...unite,cooldowns:[0,0,0]}))};
    combat=nextTurn(giveTurnTo(combat,hero.id));
    const avant=combat.enemies.reduce((total,unite)=>total+unite.hp,0);
    const sortie=castSkill(combat,index,combat.enemies[0].id),apres=sortie.battle||sortie;
    return avant-apres.enemies.reduce((total,unite)=>total+unite.hp,0);
  }

  offensives.forEach(({hero,skill,index})=>{
    it(`${hero.name} · ${skill.name} retire réellement des points de vie`,()=>{
      expect(degats(hero,index),`${skill.effect} n’inflige rien`).toBeGreaterThan(0);
    });
  });
});
