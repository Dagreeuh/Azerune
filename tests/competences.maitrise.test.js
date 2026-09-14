import{describe,it,expect}from'vitest';
import{championsDeCombat}from'../src/utils/combatChampions';
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

  // Ces trois contrats CHERCHAIENT DU TEXTE dans BattlePage.jsx — « la ligne
  // contient-elle le mot skillLevels ? ». Ils verifiaient une orthographe, pas
  // un comportement : deplacer le code sans rien changer les cassait, et une
  // construction fausse mais bien orthographiee les aurait laisses verts.
  // Ils exercent desormais le constructeur reel.
  it('le champion qui entre en combat porte ses niveaux de competence',()=>{
    const heros=HEROES.slice(0,3);
    const prets=championsDeCombat(heros,{
      getProgress:()=>({stars:5,level:42,empreintes:[]}),
      skillLevels:{[heros[0].id]:{0:6,1:5,2:4}}});
    expect(prets[0].skillLevels).toEqual({0:6,1:5,2:4});
    expect(prets[1].skillLevels).toEqual({});
  });

  it('il porte aussi ses Empreintes, ses etoiles et son niveau',()=>{
    const [pret]=championsDeCombat(HEROES.slice(0,1),{
      getProgress:()=>({stars:6,level:60,empreintes:[]})});
    expect(pret.empreinteSkills).toBeDefined();
    expect(pret.currentStars).toBe(6);
    // Sans le niveau, le joueur combat au niveau 1 pour l'eternite.
    expect(pret.currentLevel).toBe(60);
  });

  it('l’ecran de combat n’en construit pas une deuxieme version',()=>{
    // Une copie finirait par mentir sur un des quatre champs. Un seul appel.
    const page=lire('../src/pages/BattlePage.jsx');
    expect(page).toContain('championsDeCombat()');
    expect(page).not.toMatch(/battleHeroes=HEROES\.map\(/);
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
