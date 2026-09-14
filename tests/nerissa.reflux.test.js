import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill,nextTurn}from'../src/battle/engine';
import{makeEnemy,fixedRandom,giveTurnTo,findUnit}from'./helpers';

/**
 * Nerissa, Ondomancienne — le Reflux rendait de la jauge.
 *
 * Son kit vole de la jauge aux ennemis (utile : cela retarde vraiment leur
 * tour, car la jauge d'un ennemi et celle d'un allié ne sont pas dans la même
 * file) puis la **redistribuait aux alliés** — ce qui ne fait que réordonner sa
 * propre équipe. Mesuré deux fois dans ce projet : la jauge est une file
 * d'attente, pas une ressource, et en donner à un allié en retire à un autre.
 *
 * Elle était 2ᵉ plus faible du roster pour sa rareté : 14 sur 288 contre 50 de
 * moyenne 3★. Le Reflux stocké se convertit désormais en **amplification des
 * dégâts** — mesuré, 14 → 35.
 */
const S={hp:6000,atk:300,def:80,spd:100,crit:0,critDamage:50,
  accuracy:60,resistance:0,setEffects:[],resonanceLevel:0};
const NERISSA=21,ECLAT=0,COURANT=1,MAREE=2;
const roster=()=>HEROES.map(h=>({...h,currentStars:6,skillLevels:{0:1,1:1,2:1}}));

// Deux comparses pris dans le roster : melanger des identifiants et des objets
// champion dans la meme liste ne construisait aucun combat valide.
const ALLIE=1,COMPARSE=3;
function scene(){
  fixedRandom(.5);
  const b=createBattle([NERISSA,ALLIE,COMPARSE],roster(),()=>({...S}),
    {enemies:[makeEnemy({id:'n0',hp:500000,atk:10,def:0,spd:60,element:'Feu',resistance:0})]});
  return nextTurn(giveTurnTo({...b,allies:b.allies.map(u=>({...u,cooldowns:[0,0,0]}))},NERISSA));
}
const lancer=(b,i,c)=>{const s=castSkill(b,i,c);return s.battle||b};

describe('le Reflux de Nerissa se convertit en puissance',()=>{
  it('l’Éclat de reflux retire de la jauge à l’ennemi et la stocke',()=>{
    const avant=scene();
    const ennemi={...avant,enemies:avant.enemies.map(u=>({...u,atb:60}))};
    const apres=lancer(ennemi,ECLAT,'n0');
    expect(apres.enemies[0].atb,'la jauge ennemie n’a pas bougé').toBeLessThan(60);
    expect(findUnit(apres,NERISSA).mechanic.value,'rien n’a été stocké').toBeGreaterThan(0);
  });

  it('la Marée redistribuée amplifie les dégâts de l’équipe',()=>{
    let b=scene();
    b={...b,allies:b.allies.map(u=>u.id===NERISSA?{...u,mechanic:{...u.mechanic,value:40}}:u)};
    const apres=lancer(b,MAREE,NERISSA);
    apres.allies.filter(u=>!u.dead).forEach(u=>
      expect(u.buffs.damageUp,`${u.name} n’est pas amplifié`).toBeTruthy());
    expect(findUnit(apres,NERISSA).mechanic.value,'le Reflux n’a pas été consommé').toBe(0);
  });

  // Le defaut d'origine, en une ligne : elle rendait de la jauge aux allies.
  it('elle ne rend plus de jauge à ses alliés',()=>{
    let b=scene();
    b={...b,allies:b.allies.map(u=>u.id===NERISSA
      ?{...u,mechanic:{...u.mechanic,value:40}}:{...u,atb:10})};
    const apres=lancer(b,MAREE,NERISSA);
    apres.allies.filter(u=>u.id!==NERISSA).forEach(u=>
      expect(u.atb,`${u.name} a reçu de la jauge`).toBeLessThanOrEqual(10));
  });

  it('sans Reflux stocké, la Marée n’amplifie rien',()=>{
    const apres=lancer(scene(),MAREE,NERISSA);
    expect(findUnit(apres,ALLIE).buffs.damageUp).toBeFalsy();
  });

  it('l’amplification est plafonnée',()=>{
    let b=scene();
    b={...b,allies:b.allies.map(u=>u.id===NERISSA?{...u,mechanic:{...u.mechanic,value:100000}}:u)};
    const apres=lancer(b,MAREE,NERISSA);
    expect(findUnit(apres,ALLIE).buffs.damageUp.power).toBeLessThanOrEqual(.60);
  });

  it('la description annonce ce que le moteur applique',()=>{
    const nerissa=HEROES.find(h=>h.id===NERISSA);
    expect(nerissa.skills[MAREE].description).toMatch(/dégâts/i);
    expect(nerissa.skills[MAREE].description,'promesse de jauge restante').not.toMatch(/jauge/i);
  });
});
