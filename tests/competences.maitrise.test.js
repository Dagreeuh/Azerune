import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill}from'../src/battle/engine';
import{skillBonuses,skillMaxLevel}from'../src/utils/skills';
import{mulberry32}from'./helpers';

// Le moteur lit `unit.skillLevels`. L'ecran de combat construisait ses heros
// sans jamais l'attacher : chaque Tome de maitrise depense n'avait aucun effet.
// Seul le tutoriel le transmettait, ce qui rendait le defaut invisible.
const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const STATS={hp:9000,atk:900,def:300,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};

/** Degats du premier sort de Korga, a niveaux de maitrise donnes. */
function degats(skillLevels){
  const vrai=Math.random;Math.random=mulberry32(5);
  try{
    const heroes=HEROES.map(hero=>({...hero,currentStars:hero.rarity,...(skillLevels?{skillLevels}:{})}));
    let battle=createBattle([1,19,20],heroes,()=>({...STATS}),
      {enemies:[{name:'Cible',icon:'x',hp:900000,atk:1,def:200,spd:1,accuracy:0,resistance:0,element:'Feu'}]});
    battle={...battle,turn:battle.allies[2].id};
    const avant=battle.enemies[0].hp,apres=castSkill(battle,0,battle.enemies[0].id);
    return avant-(apres.battle||apres).enemies[0].hp;
  }finally{Math.random=vrai}
}

describe('les niveaux de maitrise agissent en combat',()=>{
  it('monter une competence augmente reellement les degats',()=>{
    const base=degats({0:1,1:1,2:1}),max=degats({0:6,1:5,2:4});
    expect(max).toBeGreaterThan(base);
    // La piste de la competence 1 vaut +30 % de puissance a son maximum.
    expect(max/base).toBeGreaterThan(1.2);
  });

  it('un heros sans skillLevels combat au niveau 1',()=>{
    expect(degats(null)).toBe(degats({0:1,1:1,2:1}));
  });

  it('l’ecran de combat transmet aussi les Empreintes au moteur',()=>{
    const page=lire('../src/pages/BattlePage.jsx');
    const construction=page.match(/const battleHeroes=HEROES\.map\([^;]+\);/);
    expect(construction[0]).toContain('empreinteSkills');
  });

  it('l’ecran de combat transmet les niveaux au moteur',()=>{
    // Le test decisif : sans cette ligne, les deux tests ci-dessus passent
    // toujours et le joueur combat pourtant au niveau 1 pour l'eternite.
    const page=lire('../src/pages/BattlePage.jsx');
    const construction=page.match(/const battleHeroes=HEROES\.map\([^;]+\);/);
    expect(construction).not.toBeNull();
    expect(construction[0]).toContain('skillLevels');
  });

  it('BattlePage reclame skillLevels a useGame',()=>{
    const page=lire('../src/pages/BattlePage.jsx');
    const reclames=page.match(/const\{([^}]+)\}=useGame\(\)/)[1].split(',').map(part=>part.trim());
    expect(reclames).toContain('skillLevels');
  });

  it('le tutoriel transmet aussi les siens',()=>{
    expect(lire('../src/pages/TutorialPage.jsx')).toContain('skillLevels:');
  });

  it('chaque piste de competence apporte quelque chose a son maximum',()=>{
    HEROES.forEach(hero=>{
      (hero.skills||[]).forEach((skill,index)=>{
        const bonus=skillBonuses(index,skillMaxLevel(index),skill);
        const total=bonus.power+bonus.effectRate+bonus.duration+bonus.cooldown;
        expect(total).toBeGreaterThan(0);
      });
    });
  });
});
