// Outils partages des tests du moteur de combat.
//
// Le moteur appelle Math.random a 8 endroits (jauge initiale, variance des
// degats, critiques, chances d'effet). Pour rendre les tests reproductibles on
// remplace Math.random par un generateur deterministe seede, sans modifier le
// moteur lui-meme.

import{vi}from'vitest';

// PRNG mulberry32 : petit, rapide, sequence stable pour une graine donnee.
export function mulberry32(seed){
  let a=seed>>>0;
  return()=>{
    a=(a+0x6D2B79F5)>>>0;
    let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return((t^(t>>>14))>>>0)/4294967296;
  };
}

/** Installe un Math.random deterministe. vitest le restaure via restoreMocks. */
export function seedRandom(seed=1){
  const next=mulberry32(seed);
  vi.spyOn(Math,'random').mockImplementation(next);
  return next;
}

/** Force Math.random a renvoyer toujours la meme valeur (variance/crit figes). */
export function fixedRandom(value=0.5){
  vi.spyOn(Math,'random').mockReturnValue(value);
}

let nextId=9000;

/**
 * Champion minimal. On evite volontairement les identifiants a comportement
 * special dans createBattle (3, 7, 8, 13, 14, 19, 21, 23, 25, 28) pour que les
 * tests portent sur les regles generales et non sur un kit particulier.
 */
export function makeHero(overrides={}){
  return{
    id:nextId++,
    name:'Testeur',
    role:'Combattant',
    element:'Arcane',
    rarity:3,
    icon:'🧪',
    hp:200,atk:30,def:15,spd:100,
    skills:[{name:'Frappe',icon:'⚔️',cd:0,target:'enemy',description:'Frappe simple.',power:1,effect:'basic'}],
    ...overrides
  };
}

export function makeEnemy(overrides={}){
  return{id:'x1',name:'Cible',icon:'👹',hp:400,atk:30,def:15,spd:100,element:'Arcane',...overrides};
}

/** getStats minimal : le moteur fait `...stats` puis `maxHp:stats.hp`. */
export const statsFrom=hero=>({
  hp:hero.hp,atk:hero.atk,def:hero.def,spd:hero.spd,
  accuracy:hero.accuracy??10,resistance:hero.resistance??15
});

/**
 * Place l'unite visee en tete de la jauge pour que le prochain nextTurn la
 * fasse agir, et remet les autres a zero. Rend le tour d'action previsible.
 */
export function giveTurnTo(battle,id){
  const set=unit=>({...unit,atb:unit.id===id?99.9:0});
  return{...battle,allies:battle.allies.map(set),enemies:battle.enemies.map(set)};
}

/** Retrouve une unite dans les deux camps. */
export const findUnit=(battle,id)=>
  battle.allies.find(unit=>unit.id===id)||battle.enemies.find(unit=>unit.id===id);

/** Applique des malus/bonus a une unite avant un tour. */
export function withStatus(battle,id,{debuffs={},buffs={},patch={}}={}){
  const apply=unit=>unit.id!==id?unit:{
    ...unit,
    debuffs:{...unit.debuffs,...debuffs},
    buffs:{...unit.buffs,...buffs},
    ...patch
  };
  return{...battle,allies:battle.allies.map(apply),enemies:battle.enemies.map(apply)};
}
