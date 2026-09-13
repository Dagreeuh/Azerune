import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{createBattle,chooseAutoAllyTarget,castSkill,performAutoAction,nextTurn,enemyAction,winner}from'../src/battle/engine';
import{makeEnemy,seedRandom}from'./helpers';

/**
 * Le pilote automatique ne doit jamais désigner une cible que le moteur
 * refusera. Quand il le faisait, le tour passait SANS message : le joueur
 * voyait seulement son gardien rester immobile.
 *
 * Thorgar perdait ainsi jusqu'à 18 tours sur 40 en combat automatique — mode
 * utilisé par la campagne auto, par la simulation de mission, et par le bouton
 * « auto » du joueur.
 */
const S={hp:9000,atk:600,def:200,spd:100,crit:0,critDamage:50,
  accuracy:40,resistance:20,setEffects:[],resonanceLevel:0};
const ennemis=()=>[makeEnemy({id:'e1',hp:60000,atk:40,def:200,spd:60,element:'Arcane'}),
  makeEnemy({id:'e2',hp:60000,atk:40,def:200,spd:60,element:'Nature'})];
const THORGAR=1,SERMENT=1;
const roster=()=>HEROES.map(h=>({...h,currentStars:6,skillLevels:{0:6,1:5,2:4}}));

const combat=()=>createBattle([THORGAR,3,7],roster(),()=>({...S}),{enemies:ennemis()});

describe('le pilote automatique ne choisit pas de cible impossible',()=>{
  // Le tri penalisait le lanceur d'un poids de 5 000. Ce n'etait pas un
  // interdit, seulement une preference : le score d'un allie comprend
  // `bouclier x 0,4`, si bien qu'un bouclier de 12 500 le depasse. Or Thorgar
  // pose lui-meme un bouclier d'equipe — il fabriquait donc la condition qui
  // lui faisait perdre son tour, et seulement en fin de combat.
  it('le Serment ne cible pas son lanceur, meme quand les allies sont couverts',()=>{
    const b=combat(),thorgar=b.allies.find(u=>u.id===THORGAR);
    const couverts={...b,allies:b.allies.map(u=>u.id===THORGAR?u:{...u,shield:20000})};
    const cible=chooseAutoAllyTarget(couverts,thorgar,thorgar.skills[SERMENT]);
    expect(cible).toBeTruthy();
    expect(cible.id).not.toBe(THORGAR);
  });

  it('le Serment ne cible pas son lanceur quand il est le plus bas en PV',()=>{
    const b=combat(),thorgar=b.allies.find(u=>u.id===THORGAR);
    const blesse={...b,allies:b.allies.map(u=>u.id===THORGAR?{...u,hp:1}:u)};
    expect(chooseAutoAllyTarget(blesse,thorgar,thorgar.skills[SERMENT]).id).not.toBe(THORGAR);
  });

  it('le moteur refuse toujours la cible impossible si on la lui impose',()=>{
    const b={...combat(),turn:THORGAR};
    expect(castSkill(b,SERMENT,THORGAR).error).toBeTruthy();
  });

  it('Thorgar ne gaspille aucun tour sur 40 actions automatiques',()=>{
    seedRandom(20250913);
    let b=combat(),actions=0,rates=0;
    for(let garde=0;garde<800&&actions<40;garde+=1){
      if(b.winner)break;
      if(!b.turn){b=nextTurn(b);continue}
      if(String(b.turn).startsWith('e')){b=enemyAction(b);continue}
      const acteur=b.turn,sortie=performAutoAction(b);
      if(acteur===THORGAR){actions+=1;if(sortie?.error)rates+=1}
      b=sortie?.battle||b;
      b={...b,winner:winner(b.allies,b.enemies)};
    }
    expect(actions).toBe(40);
    expect(rates).toBe(0);
  });

  it('aucun champion du roster ne rate une action automatique',()=>{
    seedRandom(4242);
    const rates={};
    HEROES.forEach(hero=>{
      const autres=HEROES.filter(h=>h.id!==hero.id).slice(0,2).map(h=>h.id);
      let b=createBattle([hero.id,...autres],roster(),()=>({...S}),{enemies:ennemis()});
      let actions=0;
      for(let garde=0;garde<400&&actions<12;garde+=1){
        if(b.winner)break;
        if(!b.turn){b=nextTurn(b);continue}
        if(String(b.turn).startsWith('e')){b=enemyAction(b);continue}
        const acteur=b.turn,sortie=performAutoAction(b);
        if(acteur===hero.id){actions+=1;if(sortie?.error)rates[hero.name]=(rates[hero.name]||0)+1}
        b=sortie?.battle||b;
        b={...b,winner:winner(b.allies,b.enemies)};
      }
    });
    expect(rates).toEqual({});
  });
});
