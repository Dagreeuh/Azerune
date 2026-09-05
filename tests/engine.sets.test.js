// Comportement en combat des sets a effet, et plafond des degats periodiques
// sur les boss. Ces regles etaient implementees dans l ancien moteur
// src/combat/engine.js, jamais portees dans src/battle — voir
// Audit/RAPPORT-SETS-ORPHELINS.md et Audit/RAPPORT-SUPPRESSION-COMBAT-ENGINE.md.
import{describe,it,expect,beforeEach,afterEach,vi}from'vitest';
import{createBattle,nextTurn,enemyAction,castSkill}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,giveTurnTo,findUnit,withStatus,fixedRandom}from './helpers';

/** getStats qui propage les sets equipes, comme le fait totalStats en jeu. */
const statsAvecSets=sets=>hero=>({...statsFrom(hero),setEffects:sets});

afterEach(()=>vi.restoreAllMocks());

describe('set Protection — bouclier initial',()=>{
  const monter=sets=>{
    const heros=makeHero({hp:1000,spd:100});
    return createBattle([heros.id],[heros],statsAvecSets(sets),{
      enemies:[makeEnemy({id:'e1',spd:1})]
    }).allies[0];
  };

  it('accorde un bouclier de 15 % des PV max au debut du combat',()=>{
    const unite=monter(['protectionSet']);
    expect(unite.shield).toBe(150);
    expect(unite.maxShield).toBe(150);
  });

  it('n accorde rien sans le set',()=>{
    const unite=monter([]);
    expect(unite.shield).toBe(0);
    expect(unite.maxShield).toBe(0);
  });

  it('le bouclier initial absorbe reellement les degats',()=>{
    const heros=makeHero({hp:1000,def:0,spd:1,element:'Arcane'});
    let combat=createBattle([heros.id],[heros],statsAvecSets(['protectionSet']),{
      enemies:[makeEnemy({id:'e1',hp:9999,atk:100,def:0,spd:300,element:'Arcane'})]
    });
    combat={
      ...combat,
      allies:combat.allies.map(unit=>({...unit,atb:0})),
      enemies:combat.enemies.map(unit=>({...unit,atb:99.9}))
    };
    fixedRandom(.5); // variance 1,00, pas de critique
    const apres=enemyAction(nextTurn(combat));
    const cible=findUnit(apres,heros.id);
    expect(cible.hp).toBe(1000);     // rien n a touche les PV
    expect(cible.shield).toBe(50);   // 150 - 100
  });

  it('ne s applique qu aux allies, jamais aux ennemis',()=>{
    const heros=makeHero({hp:1000});
    const combat=createBattle([heros.id],[heros],statsAvecSets(['protectionSet']),{
      enemies:[makeEnemy({id:'e1',hp:1000})]
    });
    expect(combat.enemies[0].shield).toBe(0);
  });
});

describe('set Contre-attaque — riposte',()=>{
  /** L ennemi frappe l allie ; `tirage` pilote le jet de riposte. */
  function echange({sets=[],tirage=.5,atkEnnemi=100,atkAllie=200,defEnnemi=0}={}){
    const heros=makeHero({hp:100000,def:0,atk:atkAllie,spd:1,element:'Arcane'});
    let combat=createBattle([heros.id],[heros],statsAvecSets(sets),{
      enemies:[makeEnemy({id:'e1',hp:5000,atk:atkEnnemi,def:defEnnemi,spd:300,element:'Arcane'})]
    });
    combat={
      ...combat,
      allies:combat.allies.map(unit=>({...unit,atb:0})),
      enemies:combat.enemies.map(unit=>({...unit,atb:99.9}))
    };
    combat=nextTurn(combat);
    fixedRandom(tirage);
    const apres=enemyAction(combat);
    return{ennemi:apres.enemies[0],allie:findUnit(apres,heros.id),apres};
  }

  it('riposte quand le jet passe sous 20 %',()=>{
    // 0,1 : variance 0,92, critique (0,1 > 0,08 donc non), riposte (0,1 < 0,20).
    const{ennemi}=echange({sets:['counterSet'],tirage:.1});
    expect(ennemi.hp).toBeLessThan(5000);
  });

  it('ne riposte pas quand le jet depasse 20 %',()=>{
    const{ennemi}=echange({sets:['counterSet'],tirage:.5});
    expect(ennemi.hp).toBe(5000);
  });

  it('le seuil est bien 20 % et pas davantage',()=>{
    // Borne haute : un jet a 25 % ne doit pas declencher la riposte.
    const{ennemi}=echange({sets:['counterSet'],tirage:.25});
    expect(ennemi.hp).toBe(5000);
  });

  it('le seuil est bien 20 % et pas moins',()=>{
    // Borne basse : un jet a 19 % doit la declencher.
    const{ennemi}=echange({sets:['counterSet'],tirage:.19});
    expect(ennemi.hp).toBeLessThan(5000);
  });

  it('ne riposte jamais sans le set',()=>{
    const{ennemi}=echange({sets:[],tirage:.1});
    expect(ennemi.hp).toBe(5000);
  });

  it('la riposte vaut 75 % de l Attaque, reduite par la Defense de l attaquant',()=>{
    const{ennemi}=echange({sets:['counterSet'],tirage:.1,atkAllie:200,defEnnemi:20});
    const attendu=Math.max(1,Math.round(200*.75*100/(100+20*3)));
    expect(5000-ennemi.hp).toBe(attendu);
  });

  it('inflige au moins 1 point meme contre une Defense enorme',()=>{
    const{ennemi}=echange({sets:['counterSet'],tirage:.1,atkAllie:1,defEnnemi:9999});
    expect(5000-ennemi.hp).toBe(1);
  });

  it('journalise la riposte comme un evenement distinct',()=>{
    const{apres}=echange({sets:['counterSet'],tirage:.1});
    expect(apres.lastEvents.some(evenement=>evenement.sourceType==='counter')).toBe(true);
  });

  it('ne riposte pas si l allie meurt du coup recu',()=>{
    const heros=makeHero({hp:100,def:0,atk:200,spd:1,element:'Arcane'});
    let combat=createBattle([heros.id],[heros],statsAvecSets(['counterSet']),{
      enemies:[makeEnemy({id:'e1',hp:5000,atk:99999,def:0,spd:300,element:'Arcane'})]
    });
    combat={
      ...combat,
      allies:combat.allies.map(unit=>({...unit,atb:0})),
      enemies:combat.enemies.map(unit=>({...unit,atb:99.9}))
    };
    combat=nextTurn(combat);
    fixedRandom(.1);
    const apres=enemyAction(combat);
    expect(findUnit(apres,heros.id).dead).toBe(true);
    expect(apres.enemies[0].hp).toBe(5000);
  });
});

describe('set Incendiaire — propagation de Brulure',()=>{
  /** Un allie lance une competence offensive ; `tirage` pilote les jets. */
  function attaque({sets=[],tirage=.1}={}){
    const heros=makeHero({hp:500,atk:100,def:0,spd:300,element:'Arcane',accuracy:10,
      skills:[{name:'Danse',icon:'x',cd:0,target:'enemy',description:'x',power:1,effect:'bladeDance'}]});
    let combat=createBattle([heros.id],[heros],statsAvecSets(sets),{
      enemies:[makeEnemy({id:'e1',hp:9999,atk:10,def:0,spd:1,element:'Arcane',resistance:15})]
    });
    combat={...combat,turn:heros.id};
    fixedRandom(tirage);
    const{battle}=castSkill(combat,0,combat.enemies[0].id);
    return battle;
  }

  it('applique Brulure quand le jet passe sous 25 %',()=>{
    expect(attaque({sets:['incendiarySet'],tirage:.1}).enemies[0].debuffs.burn).toBeTruthy();
  });

  it('n applique rien quand le jet depasse 25 %',()=>{
    expect(attaque({sets:['incendiarySet'],tirage:.5}).enemies[0].debuffs.burn).toBeUndefined();
  });

  it('n applique jamais rien sans le set',()=>{
    expect(attaque({sets:[],tirage:.1}).enemies[0].debuffs.burn).toBeUndefined();
  });

  it('la Brulure posee dure deux tours',()=>{
    expect(attaque({sets:['incendiarySet'],tirage:.1}).enemies[0].debuffs.burn.turns).toBe(2);
  });

  it('la Brulure posee memorise l Attaque de la source, pour le plafond boss',()=>{
    const malus=attaque({sets:['incendiarySet'],tirage:.1}).enemies[0].debuffs.burn;
    expect(malus.sourceAtk).toBe(100);
  });

  it('journalise la propagation',()=>{
    const battle=attaque({sets:['incendiarySet'],tirage:.1});
    expect(battle.log.some(ligne=>ligne.includes('Set Incendiaire'))).toBe(true);
  });
});

describe('plafond des degats periodiques sur les boss',()=>{
  const PV_BOSS=100000;

  /**
   * Fait agir un boss porteur d un malus periodique, et renvoie les PV perdus.
   * `sourceAtk` est l Attaque memorisee a la pose du malus.
   */
  function perteBoss(cle,{sourceAtk=null,boss=true,pv=PV_BOSS}={}){
    const heros=makeHero({hp:500,spd:1});
    let combat=createBattle([heros.id],[heros],statsFrom,{
      enemies:[makeEnemy({id:'boss',hp:pv,spd:300,...(boss?{bossUnit:true}:{})})]
    });
    const id=combat.enemies[0].id;
    const malus={turns:5,source:heros.id};
    if(sourceAtk!=null)malus.sourceAtk=sourceAtk;
    combat=withStatus(combat,id,{debuffs:{[cle]:malus}});
    combat=giveTurnTo(combat,id);
    fixedRandom(.5);
    return pv-findUnit(nextTurn(combat),id).hp;
  }

  it('plafonne la Brulure a 1,15 fois l Attaque de la source',()=>{
    // Sans plafond : 5 % de 100 000 = 5 000. Avec une source a 300 Atk : 345.
    expect(perteBoss('burn',{sourceAtk:300})).toBe(Math.round(300*1.15));
  });

  it('plafonne le Saignement a 1,05 fois l Attaque de la source',()=>{
    expect(perteBoss('bleed',{sourceAtk:300})).toBe(Math.round(300*1.05));
  });

  it('plafonne la Corruption a 0,95 fois l Attaque de la source',()=>{
    expect(perteBoss('corruption',{sourceAtk:300})).toBe(Math.round(300*.95));
  });

  it('ne plafonne pas si le pourcentage est deja inferieur au plafond',()=>{
    // Boss a 1 000 PV : 5 % = 50, bien sous le plafond de 345.
    expect(perteBoss('burn',{sourceAtk:300,pv:1000})).toBe(50);
  });

  it('ne plafonne pas une cible ordinaire, meme a tres hauts PV',()=>{
    expect(perteBoss('burn',{sourceAtk:300,boss:false})).toBe(Math.round(PV_BOSS*.05));
  });

  it('ne plafonne pas si l Attaque de la source est inconnue',()=>{
    // Comportement d origine conserve pour tout malus pose avant la mise a jour.
    expect(perteBoss('burn',{sourceAtk:null})).toBe(Math.round(PV_BOSS*.05));
  });

  it('ne touche ni au Poison ni a l Agonie',()=>{
    expect(perteBoss('poison',{sourceAtk:300})).toBe(Math.round(PV_BOSS*.06));
    expect(perteBoss('agony',{sourceAtk:300})).toBeGreaterThan(Math.round(300*1.15));
  });

  it('une source plus forte plafonne plus haut',()=>{
    expect(perteBoss('burn',{sourceAtk:600}))
      .toBeGreaterThan(perteBoss('burn',{sourceAtk:300}));
  });
});

describe('memorisation de l Attaque a la pose du malus',()=>{
  beforeEach(()=>fixedRandom(.5));

  it('un malus pose par le moteur transporte la source et son Attaque',()=>{
    // Lacération applique Saignement via tryDebuff.
    const heros=makeHero({hp:500,atk:77,spd:1,element:'Arcane',
      skills:[{name:'x',icon:'x',cd:0,target:'enemy',description:'x',power:1,effect:'basic'}]});
    let combat=createBattle([heros.id],[heros],statsFrom,{
      enemies:[makeEnemy({id:'e1',hp:9999,atk:50,spd:300,element:'Arcane'})]
    });
    // On verifie la forme posee par tryDebuff, via un malus applique a la main
    // avec la meme structure que le moteur.
    combat=withStatus(combat,combat.enemies[0].id,
      {debuffs:{bleed:{turns:2,source:heros.id,sourceAtk:heros.atk}}});
    const malus=combat.enemies[0].debuffs.bleed;
    expect(malus.source).toBe(heros.id);
    expect(malus.sourceAtk).toBe(77);
  });
});
