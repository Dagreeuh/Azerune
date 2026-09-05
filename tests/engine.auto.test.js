// Combat AUTO : choix de la competence et choix de la cible.
//
// Zone entierement deterministe (aucun appel a Math.random), et zone la plus
// corrigee du projet — v1.49.5 puis plusieurs correctifs v1.50.x. Les regles
// verrouillees ici sont surtout celles qui arbitrent entre la priorite choisie
// par le joueur et l heuristique d utilite du moteur.
import{describe,it,expect}from'vitest';
import{createBattle,chooseAutoSkill,chooseAutoEnemyTarget,chooseAutoAllyTarget,performAutoAction}
  from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,findUnit}from'./helpers';

const S=(effect,target='enemy',extra={})=>
  ({name:effect,icon:'*',cd:0,target,description:effect,power:1,effect,...extra});

/** Competence sans condition d utilite : autoSkillUseful la juge toujours utile. */
const BANALE=nom=>S(nom==null?'basic':nom);

/**
 * Monte un combat ou `heros` agit. Les identifiants partent de 9000 pour
 * eviter les champions traites specialement par createBattle.
 */
function scene({heros={},equipe=null,ennemis=[{}]}={}){
  const membres=(equipe||[heros]).map((patch,index)=>makeHero({
    rarity:4, // debloque la troisieme competence
    skills:[BANALE(),BANALE(),BANALE()],
    name:`A${index}`,
    ...patch
  }));
  let combat=createBattle(membres.map(h=>h.id),membres,statsFrom,{
    enemies:ennemis.map((patch,index)=>makeEnemy({id:`e${index}`,element:'Arcane',...patch}))
  });
  // On donne le tour au premier membre sans passer par la jauge.
  combat={...combat,turn:membres[0].id};
  return{combat,membres};
}

/** Applique un patch a une unite deja construite dans le combat. */
const patcher=(combat,camp,index,patch)=>({
  ...combat,
  [camp]:combat[camp].map((unit,position)=>position===index?{...unit,...patch}:unit)
});

describe('chooseAutoSkill — ordre par defaut',()=>{
  it('privilegie la competence la plus haute disponible',()=>{
    const{combat}=scene();
    expect(chooseAutoSkill(combat)).toBe(2);
  });

  it('descend d un cran si la plus haute est en recharge',()=>{
    let{combat}=scene();
    combat=patcher(combat,'allies',0,{cooldowns:[0,0,3]});
    expect(chooseAutoSkill(combat)).toBe(1);
  });

  it('retombe sur la competence de base si les deux autres rechargent',()=>{
    let{combat}=scene();
    combat=patcher(combat,'allies',0,{cooldowns:[0,2,3]});
    expect(chooseAutoSkill(combat)).toBe(0);
  });

  it('verrouille la troisieme competence d un 3 etoiles non evolue',()=>{
    let{combat}=scene({heros:{rarity:3}});
    combat=patcher(combat,'allies',0,{rarity:3,currentStars:3});
    expect(chooseAutoSkill(combat)).toBe(1);
  });

  it('deverrouille la troisieme competence a partir de 4 etoiles',()=>{
    let{combat}=scene({heros:{rarity:3}});
    combat=patcher(combat,'allies',0,{rarity:3,currentStars:4});
    expect(chooseAutoSkill(combat)).toBe(2);
  });

  it('ne renvoie rien si aucun champion n a le tour',()=>{
    const{combat}=scene();
    expect(chooseAutoSkill({...combat,turn:null})).toBeNull();
  });

  it('ne renvoie rien si le champion actif est mort',()=>{
    let{combat}=scene();
    combat=patcher(combat,'allies',0,{dead:true});
    expect(chooseAutoSkill(combat)).toBeNull();
  });
});

describe('chooseAutoSkill — priorite choisie par le joueur',()=>{
  it('respecte l ordre demande',()=>{
    const{combat,membres}=scene();
    expect(chooseAutoSkill(combat,{[membres[0].id]:[0,1,2]})).toBe(0);
    expect(chooseAutoSkill(combat,{[membres[0].id]:[1,2,0]})).toBe(1);
  });

  it('complete une priorite partielle par l ordre naturel',()=>{
    let{combat,membres}=scene();
    // [1] devient [1,0,2] : si 1 recharge on passe a 0, pas a 2.
    combat=patcher(combat,'allies',0,{cooldowns:[0,4,0]});
    expect(chooseAutoSkill(combat,{[membres[0].id]:[1]})).toBe(0);
  });

  it('ignore les index invalides',()=>{
    const{combat,membres}=scene();
    expect(chooseAutoSkill(combat,{[membres[0].id]:[9,-1,0]})).toBe(0);
  });

  it('tolere les doublons dans la priorite',()=>{
    const{combat,membres}=scene();
    expect(chooseAutoSkill(combat,{[membres[0].id]:[1,1,1]})).toBe(1);
  });

  it('une priorite vide retombe sur l ordre par defaut',()=>{
    const{combat,membres}=scene();
    expect(chooseAutoSkill(combat,{[membres[0].id]:[]})).toBe(2);
  });

  it('une priorite posee sur un autre champion ne s applique pas',()=>{
    const{combat}=scene();
    expect(chooseAutoSkill(combat,{999999:[0]})).toBe(2);
  });
});

describe('priorite du joueur contre heuristique d utilite',()=>{
  // Regression v1.49.5 : l AUTO ignorait la priorite personnalisee quand sa
  // propre heuristique jugeait la competence inutile.
  const equipeAvecSoin=()=>scene({
    equipe:[{skills:[BANALE(),BANALE(),S('healingTotem','allAllies')]}]
  });

  it('sans priorite, un soin sur une equipe intacte est juge inutile',()=>{
    const{combat}=equipeAvecSoin();
    expect(chooseAutoSkill(combat)).toBe(1);
  });

  it('avec la priorite du joueur, le soin est utilise malgre tout',()=>{
    const{combat,membres}=equipeAvecSoin();
    expect(chooseAutoSkill(combat,{[membres[0].id]:[2]})).toBe(2);
  });

  it('sans priorite, le soin redevient utile des qu un allie est blesse',()=>{
    let{combat}=equipeAvecSoin();
    combat=patcher(combat,'allies',0,{hp:10}); // bien sous 88 % des PV max
    expect(chooseAutoSkill(combat)).toBe(2);
  });
});

describe('conditions d utilite',()=>{
  it('une detonation de Brulure est inutile si aucun ennemi ne brule',()=>{
    const{combat}=scene({equipe:[{skills:[BANALE(),BANALE(),S('emberDetonate')]}]});
    expect(chooseAutoSkill(combat)).toBe(1);
  });

  it('elle devient utile des qu un ennemi brule',()=>{
    let{combat}=scene({equipe:[{skills:[BANALE(),BANALE(),S('emberDetonate')]}]});
    combat=patcher(combat,'enemies',0,{debuffs:{burn:{turns:2}}});
    expect(chooseAutoSkill(combat)).toBe(2);
  });

  it('un finisseur a ressource est ignore tant que la ressource manque',()=>{
    let{combat}=scene({equipe:[{skills:[BANALE(),BANALE(),S('impactQuake')]}]});
    combat=patcher(combat,'allies',0,{mechanic:{key:1,value:2,max:5}});
    expect(chooseAutoSkill(combat)).toBe(1);
  });

  it('et devient disponible une fois la ressource atteinte',()=>{
    let{combat}=scene({equipe:[{skills:[BANALE(),BANALE(),S('impactQuake')]}]});
    combat=patcher(combat,'allies',0,{mechanic:{key:1,value:3,max:5}});
    expect(chooseAutoSkill(combat)).toBe(2);
  });

  it('sans ennemi vivant, aucune competence n est jugee utile',()=>{
    let{combat}=scene();
    combat=patcher(combat,'enemies',0,{dead:true});
    // Repli : la premiere competence prete de l ordre, sans test d utilite.
    expect(chooseAutoSkill(combat)).toBe(2);
  });
});

describe('chooseAutoEnemyTarget',()=>{
  const acteur=element=>({id:1,element,mechanic:{}});

  it('vise en priorite l ennemi contre lequel l affinite est efficace',()=>{
    const{combat}=scene({ennemis:[{id:'neutre',element:'Arcane'},{id:'faible',element:'Nature'}]});
    const cible=chooseAutoEnemyTarget(combat,acteur('Feu'),BANALE());
    expect(cible.element).toBe('Nature'); // Feu est efficace contre Nature
  });

  it('evite l ennemi contre lequel l affinite est inefficace',()=>{
    const{combat}=scene({ennemis:[{id:'resistant',element:'Eau'},{id:'neutre',element:'Arcane'}]});
    const cible=chooseAutoEnemyTarget(combat,acteur('Feu'),BANALE());
    expect(cible.element).toBe('Arcane'); // Feu est inefficace contre Eau
  });

  it('a affinite egale, garde le premier ennemi de la liste',()=>{
    const{combat}=scene({ennemis:[{id:'a',element:'Arcane'},{id:'b',element:'Arcane'}]});
    expect(chooseAutoEnemyTarget(combat,acteur('Feu'),BANALE()).id).toContain('-a');
  });

  it('ignore les ennemis morts',()=>{
    let{combat}=scene({ennemis:[{id:'mort',element:'Nature'},{id:'vivant',element:'Arcane'}]});
    combat=patcher(combat,'enemies',0,{dead:true});
    expect(chooseAutoEnemyTarget(combat,acteur('Feu'),BANALE()).id).toContain('-vivant');
  });

  it('ne renvoie rien si tous les ennemis sont morts',()=>{
    let{combat}=scene();
    combat=patcher(combat,'enemies',0,{dead:true});
    expect(chooseAutoEnemyTarget(combat,acteur('Feu'),BANALE())).toBeNull();
  });

  it('un brise-bouclier vise l ennemi qui porte un bouclier',()=>{
    let{combat}=scene({ennemis:[{id:'nu',element:'Arcane'},{id:'protege',element:'Arcane'}]});
    combat=patcher(combat,'enemies',1,{shield:500});
    const cible=chooseAutoEnemyTarget(combat,acteur('Arcane'),S('shieldExpose'));
    expect(cible.id).toContain('-protege');
  });

  it('une competence a afflictions vise l ennemi le plus afflige',()=>{
    let{combat}=scene({ennemis:[
      {id:'sain',element:'Arcane'},{id:'afflige',element:'Arcane'}]});
    combat=patcher(combat,'enemies',0,{debuffs:{poison:{turns:2}}});
    combat=patcher(combat,'enemies',1,{debuffs:{poison:{turns:2},burn:{turns:2},agony:{turns:2}}});
    expect(chooseAutoEnemyTarget(combat,acteur('Arcane'),S('rapture')).id).toContain('-afflige');
  });

  it('un finisseur vise l ennemi le plus bas en points de vie',()=>{
    let{combat}=scene({ennemis:[{id:'intact',element:'Arcane'},{id:'agonisant',element:'Arcane'}]});
    combat=patcher(combat,'enemies',1,{hp:20});
    const cible=chooseAutoEnemyTarget(combat,acteur('Arcane'),S('rogueFinish'));
    expect(cible.id).toContain('-agonisant');
  });
});

describe('chooseAutoAllyTarget',()=>{
  const trio=()=>scene({equipe:[
    {name:'Meneur',hp:1000,def:20,atk:30},
    {name:'Blesse',hp:1000,def:20,atk:30},
    {name:'Intact',hp:1000,def:20,atk:30}
  ]});

  it('un soin vise l allie le plus bas en proportion de PV',()=>{
    let{combat}=trio();
    combat=patcher(combat,'allies',1,{hp:300});  // 30 %
    combat=patcher(combat,'allies',2,{hp:700});  // 70 %
    expect(chooseAutoAllyTarget(combat,combat.allies[0],S('heal','ally')).name).toBe('Blesse');
  });

  it('raisonne en proportion, pas en PV absolus',()=>{
    let{combat}=scene({equipe:[
      {name:'Colosse',hp:5000,def:20,atk:30},
      {name:'Fragile',hp:200,def:20,atk:30}
    ]});
    // Colosse : 1000/5000 = 20 %. Fragile : 100/200 = 50 %.
    combat=patcher(combat,'allies',0,{hp:1000});
    combat=patcher(combat,'allies',1,{hp:100});
    expect(chooseAutoAllyTarget(combat,combat.allies[1],S('heal','ally')).name).toBe('Colosse');
  });

  it('ignore les allies morts',()=>{
    let{combat}=trio();
    combat=patcher(combat,'allies',1,{hp:0,dead:true});
    combat=patcher(combat,'allies',2,{hp:500});
    expect(chooseAutoAllyTarget(combat,combat.allies[0],S('heal','ally')).name).toBe('Intact');
  });

  it('ne renvoie rien si toute l equipe est morte',()=>{
    let{combat}=trio();
    combat={...combat,allies:combat.allies.map(unit=>({...unit,dead:true}))};
    expect(chooseAutoAllyTarget(combat,combat.allies[0],S('heal','ally'))).toBeNull();
  });

  it('le Serment du gardien ne se pose jamais sur le gardien lui-meme',()=>{
    const{combat}=trio();
    const cible=chooseAutoAllyTarget(combat,combat.allies[0],S('guardianLink','ally'));
    expect(cible.id).not.toBe(combat.allies[0].id);
  });

  it('le Serment du gardien protege le porteur de degats fragile',()=>{
    let{combat}=scene({equipe:[
      {name:'Gardien',hp:1000,def:40,atk:20},
      {name:'Tank',hp:1000,def:60,atk:15},
      {name:'Carry',hp:1000,def:10,atk:60}
    ]});
    const cible=chooseAutoAllyTarget(combat,combat.allies[0],S('guardianLink','ally'));
    expect(cible.name).toBe('Carry');
  });

  it('l Ancrage temporel ne se pose jamais sur le lanceur',()=>{
    const{combat}=trio();
    const cible=chooseAutoAllyTarget(combat,combat.allies[0],S('timeAnchor','ally'));
    expect(cible.id).not.toBe(combat.allies[0].id);
  });

  it('une purification vise l allie sous controle plutot que legerement afflige',()=>{
    let{combat}=trio();
    combat=patcher(combat,'allies',1,{debuffs:{defDown:{turns:2}}});
    combat=patcher(combat,'allies',2,{debuffs:{stun:{turns:2}}});
    expect(chooseAutoAllyTarget(combat,combat.allies[0],S('cleanseWave','ally')).name).toBe('Intact');
  });
});

describe('performAutoAction',()=>{
  it('joue la competence choisie et fait des degats a un ennemi',()=>{
    const{combat}=scene({equipe:[{skills:[S('bladeDance'),BANALE(),BANALE()]}]});
    const{battle}=performAutoAction(combat,{[combat.allies[0].id]:[0]});
    expect(battle.enemies[0].hp).toBeLessThan(combat.enemies[0].hp);
  });

  it('respecte la priorite du joueur de bout en bout',()=>{
    const{combat,membres}=scene({
      equipe:[{skills:[BANALE(),BANALE(),S('healingTotem','allAllies')]}]
    });
    const{battle}=performAutoAction(combat,{[membres[0].id]:[2]});
    // Le totem pose bien son bonus : la priorite a ete suivie jusqu a l execution.
    expect(battle.allies.some(unit=>unit.buffs?.healingTotem)).toBe(true);
  });

  it('signale l absence de champion actif',()=>{
    const{combat}=scene();
    expect(performAutoAction({...combat,turn:null}).error).toBeTruthy();
  });

  it('ne laisse jamais le combat sans progression',()=>{
    const{combat}=scene();
    const resultat=performAutoAction(combat);
    expect(resultat.battle).toBeTruthy();
    expect(resultat.battle.log.length).toBeGreaterThan(0);
  });
});
