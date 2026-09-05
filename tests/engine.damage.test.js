// Formule de degats, via le chemin d attaque simple de enemyAction.
//
// Formule verifiee :
//   degats = max(6, round(atk * mult * 100/(100+def*3) * variance * crit * affinite))
//   variance = 0,92 + Math.random() * 0,16      (donc 1,00 pour un tirage a 0,5)
//   critique = Math.random() < 0,08             (x1,5 sur un ennemi ordinaire)
import{describe,it,expect,beforeEach,afterEach,vi}from'vitest';
import{createBattle,nextTurn,enemyAction}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,withStatus,findUnit,seedRandom,fixedRandom}from './helpers';

const PV_ALLIE=100000; // assez haut pour que rien ne meure pendant les mesures

/** Un allie encaisse une attaque d ennemi. Renvoie le combat resolu. */
function frappe({allie={},ennemi={},statuts=null,allies=null}={}){
  const heros=(allies||[allie]).map((patch,index)=>
    makeHero({hp:PV_ALLIE,def:0,spd:1,element:'Arcane',name:`A${index}`,...patch}));
  let combat=createBattle(heros.map(h=>h.id),heros,statsFrom,{
    enemies:[makeEnemy({id:'e1',hp:99999,atk:100,def:0,spd:300,element:'Arcane',...ennemi})]
  });
  combat={
    ...combat,
    allies:combat.allies.map(unit=>({...unit,atb:0})),
    enemies:combat.enemies.map(unit=>({...unit,atb:99.9}))
  };
  combat=nextTurn(combat);
  if(statuts)statuts.forEach(([id,patch])=>{combat=withStatus(combat,id,patch);});
  return{resolu:enemyAction(combat),heros};
}

/** Degats subis par le premier allie. */
function degats(options){
  const{resolu,heros}=frappe(options);
  return PV_ALLIE-findUnit(resolu,heros[0].id).hp;
}

afterEach(()=>vi.restoreAllMocks());

describe('formule de base',()=>{
  beforeEach(()=>fixedRandom(.5)); // variance 1,00 et aucun critique

  it('sans defense, les degats valent l Attaque de l attaquant',()=>{
    expect(degats({ennemi:{atk:100}})).toBe(100);
  });

  it('est lineaire en Attaque',()=>{
    expect(degats({ennemi:{atk:200}})).toBe(200);
    expect(degats({ennemi:{atk:37}})).toBe(37);
  });

  it('la Defense reduit selon 100 / (100 + Def x 3)',()=>{
    [10,25,50,100].forEach(def=>{
      expect(degats({allie:{def},ennemi:{atk:1000}}))
        .toBe(Math.round(1000*100/(100+def*3)));
    });
  });

  it('la Defense a un rendement decroissant, jamais nul',()=>{
    const sansDefense=degats({allie:{def:0},ennemi:{atk:1000}});
    const grosseDefense=degats({allie:{def:500},ennemi:{atk:1000}});
    expect(grosseDefense).toBeGreaterThan(0);
    expect(grosseDefense).toBeLessThan(sansDefense/10);
  });

  it('applique un plancher de 6 degats',()=>{
    expect(degats({allie:{def:9999},ennemi:{atk:1}})).toBe(6);
  });
});

describe('variance et critiques',()=>{
  it('un tirage a 0 donne la variance minimale de 0,92 et un critique',()=>{
    fixedRandom(0); // variance 0,92 puis 0 < 0,08 donc critique
    expect(degats({ennemi:{atk:1000}})).toBe(Math.round(1000*.92*1.5));
  });

  it('un tirage a 0,999 donne la variance maximale sans critique',()=>{
    fixedRandom(.999);
    expect(degats({ennemi:{atk:1000}})).toBe(Math.round(1000*(.92+.999*.16)));
  });

  it('la variance reste dans une fourchette de plus ou moins 8 %',()=>{
    for(let graine=1;graine<=40;graine+=1){
      seedRandom(graine);
      const subis=degats({ennemi:{atk:1000}});
      // Bornes : variance dans [0,92 ; 1,08], critique eventuel a 1,5.
      expect(subis).toBeGreaterThanOrEqual(Math.round(1000*.92));
      expect(subis).toBeLessThanOrEqual(Math.round(1000*1.08*1.5));
      vi.restoreAllMocks();
    }
  });

  it('est reproductible a graine egale',()=>{
    seedRandom(1234);
    const premier=degats({ennemi:{atk:777}});
    vi.restoreAllMocks();
    seedRandom(1234);
    expect(degats({ennemi:{atk:777}})).toBe(premier);
  });
});

describe('affinites elementaires',()=>{
  beforeEach(()=>fixedRandom(.5));

  it('une attaque efficace ajoute 30 %',()=>{
    // Feu attaque Nature.
    expect(degats({allie:{element:'Nature'},ennemi:{atk:1000,element:'Feu'}}))
      .toBe(Math.round(1000*1.30));
  });

  it('une attaque inefficace retire 25 %',()=>{
    // Nature attaque Feu.
    expect(degats({allie:{element:'Feu'},ennemi:{atk:1000,element:'Nature'}}))
      .toBe(Math.round(1000*.75));
  });

  it('une attaque neutre ne modifie rien',()=>{
    expect(degats({allie:{element:'Feu'},ennemi:{atk:1000,element:'Feu'}})).toBe(1000);
  });

  it('efficace > neutre > inefficace, a graine identique',()=>{
    const mesure=(elementAllie,elementEnnemi)=>{
      fixedRandom(.5);
      const valeur=degats({allie:{element:elementAllie},ennemi:{atk:1000,element:elementEnnemi}});
      vi.restoreAllMocks();
      return valeur;
    };
    expect(mesure('Nature','Feu')).toBeGreaterThan(mesure('Feu','Feu'));
    expect(mesure('Feu','Feu')).toBeGreaterThan(mesure('Feu','Nature'));
  });
});

describe('Attaque reduite',()=>{
  beforeEach(()=>fixedRandom(.5));

  it('le malus Attaque reduite retire 30 % des degats',()=>{
    const{resolu,heros}=frappe({
      ennemi:{atk:1000},
      statuts:[['e-w1-0-e1',{debuffs:{atkDown:{turns:2}}}]]
    });
    expect(PV_ALLIE-findUnit(resolu,heros[0].id).hp).toBe(Math.round(1000*.7));
  });
});

describe('boucliers',()=>{
  beforeEach(()=>fixedRandom(.5));

  it('un bouclier absorbe les degats avant les PV',()=>{
    const essai=frappeAvecBouclier(300,100);
    expect(essai.pvPerdus).toBe(0);
    expect(essai.bouclierRestant).toBe(200);
  });

  it('un bouclier insuffisant laisse passer le reste',()=>{
    const essai=frappeAvecBouclier(40,100);
    expect(essai.pvPerdus).toBe(60);
    expect(essai.bouclierRestant).toBe(0);
  });

  it('un bouclier exactement egal absorbe tout et tombe a zero',()=>{
    const essai=frappeAvecBouclier(100,100);
    expect(essai.pvPerdus).toBe(0);
    expect(essai.bouclierRestant).toBe(0);
  });

  function frappeAvecBouclier(bouclier,atk){
    const heros=[makeHero({hp:PV_ALLIE,def:0,spd:1,element:'Arcane'})];
    let combat=createBattle(heros.map(h=>h.id),heros,statsFrom,{
      enemies:[makeEnemy({id:'e1',hp:99999,atk,def:0,spd:300,element:'Arcane'})]
    });
    combat={
      ...combat,
      allies:combat.allies.map(unit=>({...unit,atb:0,shield:bouclier,maxShield:bouclier})),
      enemies:combat.enemies.map(unit=>({...unit,atb:99.9}))
    };
    combat=nextTurn(combat);
    const resolu=enemyAction(combat);
    const cible=findUnit(resolu,heros[0].id);
    return{pvPerdus:PV_ALLIE-cible.hp,bouclierRestant:cible.shield};
  }
});

describe('Serment du gardien',()=>{
  beforeEach(()=>fixedRandom(.5));

  /** Deux allies : [0] protege, [1] gardien. */
  function avecGardien({pvGardien=PV_ALLIE,atk=1000}={}){
    const equipe=[makeHero({hp:PV_ALLIE,def:0,spd:1,element:'Arcane',name:'Protege'}),
                  makeHero({hp:PV_ALLIE,def:0,spd:1,element:'Arcane',name:'Gardien'})];
    let combat=createBattle(equipe.map(h=>h.id),equipe,statsFrom,{
      enemies:[makeEnemy({id:'e1',hp:99999,atk,def:0,spd:300,element:'Arcane'})]
    });
    combat={
      ...combat,
      allies:combat.allies.map((unit,index)=>index===0
        ?{...unit,atb:0,buffs:{guardianLink:{turns:3,source:equipe[1].id}}}
        :{...unit,atb:0,hp:pvGardien}),
      // Provocation : force l ennemi a viser le protege, sinon son IA cible
      // spontanement l allie le plus fragile (ici le gardien affaibli).
      enemies:combat.enemies.map(unit=>({...unit,atb:99.9,
        debuffs:{provoke:{turns:2,source:equipe[0].id}}}))
    };
    combat=nextTurn(combat);
    const apres=enemyAction(combat);
    return{
      protege:findUnit(apres,equipe[0].id),
      gardien:findUnit(apres,equipe[1].id),
      equipe
    };
  }

  it('le gardien encaisse 30 % des degats a la place du protege',()=>{
    const{protege,gardien}=avecGardien({atk:1000});
    const redirige=Math.round(1000*.30);
    expect(PV_ALLIE-gardien.hp).toBe(redirige);
    expect(PV_ALLIE-protege.hp).toBe(1000-redirige);
  });

  it('le gardien ne peut jamais mourir de la redirection',()=>{
    const{gardien}=avecGardien({pvGardien:5,atk:100000});
    expect(gardien.hp).toBe(1);
    expect(gardien.dead).toBe(false);
  });

  it('sans gardien vivant, le protege encaisse tout',()=>{
    fixedRandom(.5);
    expect(degats({ennemi:{atk:1000}})).toBe(1000);
  });
});
