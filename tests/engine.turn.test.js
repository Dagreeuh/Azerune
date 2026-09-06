// Ordre des tours, jauge ATB et garde-fous de stabilite.
import{describe,it,expect,beforeEach,afterEach,vi}from'vitest';
import{createBattle,nextTurn,winner}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,findUnit,withStatus,fixedRandom}from './helpers';

const mort={dead:true};
const vivant={dead:false};

function combat({allies=[{spd:100}],enemies=[{spd:100}]}={}){
  const heros=allies.map((patch,index)=>makeHero({hp:500,spd:100,name:`A${index}`,...patch}));
  return{
    combat:createBattle(heros.map(h=>h.id),heros,statsFrom,{
      enemies:enemies.map((patch,index)=>makeEnemy({id:`e${index}`,hp:500,spd:100,...patch}))
    }),
    heros
  };
}

/** Remet toutes les jauges a zero pour partir d une base connue. */
const jaugesAZero=etat=>({
  ...etat,
  allies:etat.allies.map(unit=>({...unit,atb:0})),
  enemies:etat.enemies.map(unit=>({...unit,atb:0}))
});

beforeEach(()=>fixedRandom(.5));
afterEach(()=>vi.restoreAllMocks());

describe('winner',()=>{
  it('donne la victoire aux allies quand tous les ennemis sont morts',()=>{
    expect(winner([vivant],[mort,mort])).toBe('ally');
  });

  it('donne la victoire aux ennemis quand tous les allies sont morts',()=>{
    expect(winner([mort,mort],[vivant])).toBe('enemy');
  });

  it('ne tranche pas tant que chaque camp a un survivant',()=>{
    expect(winner([mort,vivant],[mort,vivant])).toBeNull();
  });

  it('un seul survivant suffit a tenir le camp en vie',()=>{
    expect(winner([mort,mort,vivant],[vivant])).toBeNull();
  });
});

describe('ordre des tours',()=>{
  it('fait agir l unite la plus rapide en premier',()=>{
    const{combat:etat,heros}=combat({allies:[{spd:300}],enemies:[{spd:50}]});
    expect(nextTurn(jaugesAZero(etat)).turn).toBe(heros[0].id);
  });

  it('fait agir l ennemi le plus rapide en premier',()=>{
    const{combat:etat}=combat({allies:[{spd:50}],enemies:[{spd:300}]});
    expect(nextTurn(jaugesAZero(etat)).turn).toBe('e-w1-0-e0');
  });

  it('la jauge de l unite qui agit est ramenee a 100',()=>{
    const{combat:etat,heros}=combat({allies:[{spd:300}],enemies:[{spd:50}]});
    expect(findUnit(nextTurn(jaugesAZero(etat)),heros[0].id).atb).toBe(100);
  });

  it('ignore les unites mortes dans le choix de l acteur',()=>{
    const{combat:etat,heros}=combat({allies:[{spd:400},{spd:80}],enemies:[{spd:50}]});
    let base=jaugesAZero(etat);
    base={...base,allies:base.allies.map(unit=>
      unit.id===heros[0].id?{...unit,dead:true,hp:0}:unit)};
    expect(nextTurn(base).turn).toBe(heros[1].id);
  });
});

describe('vitesse effective',()=>{
  const vitesse=(patch)=>{
    const{combat:etat,heros}=combat({allies:[{spd:100}],enemies:[{spd:1}]});
    const suivant=nextTurn(withStatus(jaugesAZero(etat),heros[0].id,patch));
    return findUnit(suivant,heros[0].id).currentSpd;
  };

  it('Vitesse augmentee applique un facteur 1,25',()=>{
    expect(vitesse({buffs:{speedUp:{turns:2}}})).toBe(125);
  });

  it('Vitesse reduite applique un facteur 0,75',()=>{
    expect(vitesse({debuffs:{slow:{turns:2}}})).toBe(75);
  });

  it('les deux se combinent multiplicativement',()=>{
    expect(vitesse({buffs:{speedUp:{turns:2}},debuffs:{slow:{turns:2}}}))
      .toBe(Math.round(100*1.25*.75));
  });

  it('la vitesse effective ne descend jamais sous 20',()=>{
    const{combat:etat,heros}=combat({allies:[{spd:1}],enemies:[{spd:1}]});
    const suivant=nextTurn(withStatus(jaugesAZero(etat),heros[0].id,
      {debuffs:{slow:{turns:2}}}));
    expect(findUnit(suivant,heros[0].id).currentSpd).toBe(20);
  });
});

describe('etourdissement',()=>{
  it('marque l unite etourdie comme devant passer son tour',()=>{
    const{combat:etat,heros}=combat({allies:[{spd:300}],enemies:[{spd:50}]});
    const suivant=nextTurn(withStatus(jaugesAZero(etat),heros[0].id,
      {debuffs:{stun:{turns:2}}}));
    expect(findUnit(suivant,heros[0].id).skip).toBe(true);
  });

  it('ne marque pas skip une unite saine',()=>{
    const{combat:etat,heros}=combat({allies:[{spd:300}],enemies:[{spd:50}]});
    expect(findUnit(nextTurn(jaugesAZero(etat)),heros[0].id).skip).toBe(false);
  });
});

describe('garde-fous de la jauge',()=>{
  // Regression : v1.32.0 « jauges non finies ou invalides normalisees »
  // et « boucle de remplissage plafonnee a 10 000 iterations ».

  it('normalise une jauge NaN sans boucler indefiniment',()=>{
    const{combat:etat,heros}=combat({allies:[{spd:100}],enemies:[{spd:100}]});
    const casse={...etat,allies:etat.allies.map(unit=>({...unit,atb:NaN}))};
    const suivant=nextTurn(casse);
    expect(suivant.turn).toBeTruthy();
    expect(Number.isFinite(findUnit(suivant,heros[0].id).atb)).toBe(true);
  });

  it('normalise une jauge Infinity',()=>{
    const{combat:etat}=combat();
    const casse={...etat,enemies:etat.enemies.map(unit=>({...unit,atb:Infinity}))};
    const suivant=nextTurn(casse);
    expect(suivant.turn).toBeTruthy();
    suivant.enemies.forEach(unit=>expect(Number.isFinite(unit.atb)).toBe(true));
  });

  it('normalise une jauge negative',()=>{
    const{combat:etat}=combat();
    const casse={...etat,allies:etat.allies.map(unit=>({...unit,atb:-500}))};
    suivantEstValide(nextTurn(casse));
  });

  it('normalise une vitesse effective non finie',()=>{
    const{combat:etat}=combat();
    const casse={...etat,allies:etat.allies.map(unit=>
      ({...unit,spd:NaN,currentSpd:NaN,atb:0}))};
    suivantEstValide(nextTurn(casse));
  });

  it('termine meme avec des vitesses minuscules (watchdog)',()=>{
    const{combat:etat}=combat({allies:[{spd:1}],enemies:[{spd:1}]});
    const depart=Date.now();
    const suivant=nextTurn(jaugesAZero(etat));
    expect(suivant.turn).toBeTruthy();
    expect(Date.now()-depart).toBeLessThan(2000);
  });

  function suivantEstValide(suivant){
    expect(suivant.turn).toBeTruthy();
    [...suivant.allies,...suivant.enemies].forEach(unit=>
      expect(Number.isFinite(unit.atb)).toBe(true));
  }
});

describe('immutabilite',()=>{
  it('nextTurn ne modifie pas l objet combat recu',()=>{
    const{combat:etat}=combat();
    const avant=JSON.stringify(etat);
    nextTurn(etat);
    expect(JSON.stringify(etat)).toBe(avant);
  });

  it('nextTurn sur un combat deja gagne est sans effet',()=>{
    const{combat:etat}=combat();
    const gagne={...etat,winner:'ally'};
    expect(nextTurn(gagne)).toBe(gagne);
  });

  it('nextTurn tolere une entree nulle',()=>{
    expect(nextTurn(null)).toBeNull();
    expect(nextTurn(undefined)).toBeUndefined();
  });
});
