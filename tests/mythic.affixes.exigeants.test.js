// Deux affixes qui demandent un outil, et la seule réanimation du jeu.
//
// Les six affixes d'origine ne modifiaient que des statistiques : mesuré sur
// 300 compositions, aucun champion n'avait le moindre avantage en Mythic+ 30.
// Le mode testait l'équipement, jamais l'équipe. Affligé exige une
// purification, Incorporel un contrôle.
import{describe,it,expect,afterEach,vi}from'vitest';
import{MYTHIC_AFFIXES}from'../src/data/mythic';
import{HEROES}from'../src/data/heroes';
import{createBattle,nextTurn,enemyAction,castSkill}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,withStatus,findUnit,fixedRandom,giveTurnTo}from'./helpers';

afterEach(()=>vi.restoreAllMocks());

/** Combat Mythic+ portant les affixes demandés. */
function combatAffixe(affixIds,{allies=null,ennemis=1,pvAllie=4000}={}){
  const equipe=allies||[makeHero({id:9100,hp:pvAllie,atk:40,def:0,spd:1,name:'A0'})];
  const cibles=[...Array(ennemis)].map((_,index)=>
    makeEnemy({id:`c${index}`,hp:40000,atk:60,def:0,spd:300,element:'Arcane'}));
  return createBattle(equipe.map(hero=>hero.id),equipe.map(hero=>({...hero,currentStars:6})),
    unite=>({...statsFrom(unite),accuracy:120,resistance:0}),
    {enemies:cibles,mythic:{level:20,season:'test',turnBudget:80},affixIds});
}

describe('Affligé — une purification devient nécessaire',()=>{
  it('l’affixe est déclaré et décrit au joueur',()=>{
    expect(MYTHIC_AFFIXES.afflicted.name).toBe('Affligé');
    expect(MYTHIC_AFFIXES.afflicted.description).toMatch(/purifier/i);
  });

  it('une attaque ennemie applique un cumul d’Affliction',()=>{
    fixedRandom(.5);
    let combat=combatAffixe(['afflicted']);
    combat={...combat,allies:combat.allies.map(u=>({...u,atb:0})),
      enemies:combat.enemies.map(u=>({...u,atb:99.9}))};
    combat=nextTurn(combat);
    expect(findUnit(enemyAction(combat),9100).debuffs.affliction?.stacks).toBe(1);
  });

  it('les cumuls s’empilent jusqu’à cinq',()=>{
    fixedRandom(.5);
    let combat=combatAffixe(['afflicted']);
    combat={...combat,allies:combat.allies.map(u=>({...u,atb:0})),
      enemies:combat.enemies.map(u=>({...u,atb:99.9}))};
    for(let tour=0;tour<9;tour+=1){
      combat=nextTurn(combat);
      if(combat.turn)combat=enemyAction(combat);
      combat={...combat,allies:combat.allies.map(u=>({...u,atb:0})),
        enemies:combat.enemies.map(u=>({...u,atb:99.9}))};
    }
    expect(findUnit(combat,9100).debuffs.affliction.stacks).toBe(5);
  });

  it('l’Affliction inflige des dégâts périodiques croissants',()=>{
    fixedRandom(.5);
    const subis=cumuls=>{
      let combat=combatAffixe(['afflicted']);
      combat=withStatus(combat,9100,{debuffs:{affliction:{turns:99,stacks:cumuls}}});
      combat={...combat,allies:combat.allies.map(u=>({...u,atb:99.9})),
        enemies:combat.enemies.map(u=>({...u,atb:0}))};
      const avant=findUnit(combat,9100).hp;
      return avant-findUnit(nextTurn(combat),9100).hp;
    };
    expect(subis(1)).toBeGreaterThan(0);
    expect(subis(5)).toBeGreaterThan(subis(1)*3);
  });

  it('elle ne s’estompe pas d’elle-même : il faut la purifier',()=>{
    // Une durée de 99 tours : le temps ne la retire pas.
    fixedRandom(.5);
    let combat=combatAffixe(['afflicted']);
    combat={...combat,allies:combat.allies.map(u=>({...u,atb:0})),
      enemies:combat.enemies.map(u=>({...u,atb:99.9}))};
    combat=nextTurn(combat);
    expect(findUnit(enemyAction(combat),9100).debuffs.affliction.turns).toBeGreaterThan(20);
  });

  it('une purification la retire, et en priorité',()=>{
    fixedRandom(.5);
    const yunmei=HEROES.find(hero=>hero.id===34);
    let combat=combatAffixe(['afflicted'],{allies:[yunmei,
      makeHero({id:9101,hp:4000,def:0,spd:1,name:'A1'})]});
    combat={...combat,allies:combat.allies.map(unite=>unite.id===9101
      ?{...unite,hp:100,debuffs:{slow:{turns:2},affliction:{turns:99,stacks:4}}}
      :{...unite,cooldowns:[0,0,0]})};
    combat=nextTurn(giveTurnTo(combat,34));
    const sortie=castSkill(combat,1,9101),apres=sortie.battle||sortie;
    expect(findUnit(apres,9101).debuffs.affliction).toBeUndefined();
    expect(findUnit(apres,9101).debuffs.slow).toBeTruthy();
  });

  it('sans l’affixe, aucune Affliction n’apparaît',()=>{
    fixedRandom(.5);
    let combat=combatAffixe(['fortified']);
    combat={...combat,allies:combat.allies.map(u=>({...u,atb:0})),
      enemies:combat.enemies.map(u=>({...u,atb:99.9}))};
    combat=nextTurn(combat);
    expect(findUnit(enemyAction(combat),9100).debuffs.affliction).toBeUndefined();
  });
});

describe('Incorporel — un contrôle devient nécessaire',()=>{
  it('l’affixe est déclaré et décrit au joueur',()=>{
    expect(MYTHIC_AFFIXES.incorporeal.name).toBe('Incorporel');
    expect(MYTHIC_AFFIXES.incorporeal.description).toMatch(/45 %/);
  });

  /** Dégâts infligés à un ennemi selon ses PV et son état. */
  function frappe({affixe=['incorporeal'],ratioPv=.3,statut=null}={}){
    fixedRandom(.5);
    const frappeur=makeHero({id:9200,hp:4000,atk:120,def:0,spd:300,name:'D',
      skills:[{name:'Trait',icon:'✴️',cd:0,target:'enemy',description:'Frappe.',power:1,effect:'arcaneBlast'}]});
    let combat=combatAffixe(affixe,{allies:[frappeur]});
    combat={...combat,enemies:combat.enemies.map(unite=>
      ({...unite,hp:Math.round(unite.maxHp*ratioPv),...(statut?{debuffs:{[statut]:{turns:2}}}:{})}))};
    combat=nextTurn(giveTurnTo(combat,9200));
    const identifiant=combat.enemies[0].id,avant=findUnit(combat,identifiant).hp;
    const sortie=castSkill(combat,0,identifiant),apres=sortie.battle||sortie;
    return avant-findUnit(apres,identifiant).hp;
  }

  it('au-dessus de 50 % de PV, l’ennemi encaisse normalement',()=>{
    expect(frappe({ratioPv:.9})).toBe(frappe({affixe:['fortified'],ratioPv:.9}));
  });

  it('sous 50 % de PV, il ne subit plus qu’une fraction des dégâts',()=>{
    const intangible=frappe({ratioPv:.3}),normal=frappe({affixe:['fortified'],ratioPv:.3});
    expect(intangible).toBeLessThan(normal);
    expect(intangible/normal).toBeCloseTo(.45,1);
  });

  it('un étourdissement lui rend sa consistance',()=>{
    expect(frappe({ratioPv:.3,statut:'stun'})).toBe(frappe({affixe:['fortified'],ratioPv:.3}));
  });

  it('un ralentissement aussi',()=>{
    expect(frappe({ratioPv:.3,statut:'slow'})).toBe(frappe({affixe:['fortified'],ratioPv:.3}));
  });

  it('l’affixe ne protège jamais les alliés',()=>{
    // Il ne s'applique qu'aux ennemis : un allié blessé reste vulnérable.
    fixedRandom(.5);
    let combat=combatAffixe(['incorporeal'],{pvAllie:4000});
    combat={...combat,allies:combat.allies.map(u=>({...u,hp:Math.round(u.maxHp*.2),atb:0})),
      enemies:combat.enemies.map(u=>({...u,atb:99.9}))};
    combat=nextTurn(combat);
    const avant=findUnit(combat,9100).hp;
    expect(findUnit(enemyAction(combat),9100).hp).toBeLessThan(avant);
  });
});

describe('Retour temporel — la seule réanimation du jeu',()=>{
  const caelion=()=>HEROES.find(hero=>hero.id===30);

  /** Caelion, un allié ancré, et cet allié éventuellement mort. */
  function scene({mort=true}={}){
    fixedRandom(.5);
    const equipe=[caelion(),makeHero({id:9300,hp:3000,atk:30,def:0,spd:1,name:'Ancré'})];
    let combat=createBattle(equipe.map(hero=>hero.id),equipe.map(hero=>({...hero,currentStars:6})),
      unite=>({...statsFrom(unite),accuracy:60,resistance:0}),
      {enemies:[makeEnemy({id:'c0',hp:40000,atk:10,def:0,spd:1,element:'Arcane'})]});
    combat={...combat,allies:combat.allies.map(unite=>({...unite,cooldowns:[0,0,0]}))};
    combat=nextTurn(giveTurnTo(combat,30));
    const ancre=castSkill(combat,1,9300);
    combat=ancre.battle||ancre;
    combat={...combat,allies:combat.allies.map(unite=>unite.id===9300&&mort
      ?{...unite,hp:0,dead:true,atb:0}
      :{...unite,cooldowns:[0,0,0]})};
    return nextTurn(giveTurnTo(combat,30));
  }

  it('aucun autre champion du jeu ne réanime',()=>{
    const reanimateurs=HEROES.filter(hero=>hero.skills.some(competence=>
      /ramène|réanim|relève/i.test(competence.description)&&/tomb|chute|mort/i.test(competence.description)));
    expect(reanimateurs.map(hero=>hero.name)).toEqual(['Caelion']);
  });

  it('l’allié ancré tombé est ramené',()=>{
    const combat=scene();
    const sortie=castSkill(combat,2),apres=sortie.battle||sortie;
    const ancien=findUnit(apres,9300);
    expect(ancien.dead).toBe(false);
    expect(ancien.hp).toBeGreaterThan(0);
  });

  it('il revient avec environ un tiers de ses PV, pas au maximum',()=>{
    const combat=scene();
    const sortie=castSkill(combat,2),apres=sortie.battle||sortie;
    const ancien=findUnit(apres,9300);
    expect(ancien.hp).toBeCloseTo(Math.round(ancien.maxHp*.35),-1);
    expect(ancien.hp).toBeLessThan(ancien.maxHp);
  });

  it('il revient débarrassé de ses malus',()=>{
    let combat=scene();
    combat=withStatus(combat,9300,{debuffs:{burn:{turns:3},slow:{turns:2}}});
    const sortie=castSkill(combat,2),apres=sortie.battle||sortie;
    expect(Object.keys(findUnit(apres,9300).debuffs)).toEqual([]);
  });

  it('la réanimation ne fonctionne qu’une fois par combat',()=>{
    let combat=scene();
    const premier=castSkill(combat,2);
    combat=premier.battle||premier;
    combat={...combat,allies:combat.allies.map(unite=>unite.id===9300
      ?{...unite,hp:0,dead:true}:{...unite,cooldowns:[0,0,0]})};
    combat=nextTurn(giveTurnTo(combat,30));
    const second=castSkill(combat,2),apres=second.battle||second;
    expect(findUnit(apres,9300).dead).toBe(true);
  });

  it('sans allié tombé, le Retour temporel garde son effet d’origine',()=>{
    const combat=scene({mort:false});
    const sortie=castSkill(combat,2),apres=sortie.battle||sortie;
    expect(findUnit(apres,9300).dead).toBe(false);
    expect(findUnit(apres,9300).atb).toBeGreaterThanOrEqual(85);
  });
});

describe('Affliction à saturation — elle déborde sur l’équipe',()=>{
  // Un soigneur suffisait à absorber l'Affliction : l'affixe était pénible sans
  // être exigeant. À cinq cumuls elle contamine l'allié le moins atteint, et
  // aucun soin ne suit cette progression — seule la purification l'arrête.
  //
  // Ce comportement a aussi révélé un plantage : le message de débordement était
  // écrit dans un tampon déclaré plus bas dans la fonction.
  function equipeAffligee(cumulsParAllie){
    fixedRandom(.5);
    const equipe=cumulsParAllie.map((_,index)=>
      makeHero({id:9400+index,hp:100000,atk:20,def:0,spd:index===0?300:1,name:`A${index}`}));
    const cibles=[makeEnemy({id:'c0',hp:40000,atk:1,def:0,spd:1,element:'Arcane'})];
    let combat=createBattle(equipe.map(hero=>hero.id),equipe.map(hero=>({...hero,currentStars:6})),
      unite=>({...statsFrom(unite),accuracy:60,resistance:0}),
      {enemies:cibles,mythic:{level:20,season:'test',turnBudget:80},affixIds:['afflicted']});
    return{...combat,allies:combat.allies.map((unite,index)=>({...unite,
      atb:index===0?99.9:0,
      debuffs:cumulsParAllie[index]?{affliction:{turns:99,stacks:cumulsParAllie[index]}}:{}}))};
  }
  const cumuls=(combat,id)=>findUnit(combat,id).debuffs.affliction?.stacks||0;

  it('à cinq cumuls, un allié contamine le moins atteint',()=>{
    const apres=nextTurn(equipeAffligee([5,0,2]));
    expect(cumuls(apres,9401)).toBe(1);
    expect(cumuls(apres,9402)).toBe(2);
  });

  it('en dessous de cinq cumuls, rien ne déborde',()=>{
    const apres=nextTurn(equipeAffligee([4,0,0]));
    expect(cumuls(apres,9401)).toBe(0);
    expect(cumuls(apres,9402)).toBe(0);
  });

  it('le débordement ne fait pas planter le tour',()=>{
    // Le message était écrit dans un tampon déclaré plus bas : la première
    // saturation levait une exception au lieu d’afficher une ligne de journal.
    expect(()=>nextTurn(equipeAffligee([5,0,0]))).not.toThrow();
  });

  it('le joueur est prévenu dans le journal de combat',()=>{
    const apres=nextTurn(equipeAffligee([5,0,0]));
    expect(apres.log.some(ligne=>/déborde/.test(ligne))).toBe(true);
  });

  it('un allié déjà saturé n’est pas choisi comme cible',()=>{
    const apres=nextTurn(equipeAffligee([5,5,1]));
    expect(cumuls(apres,9401)).toBe(5);
    expect(cumuls(apres,9402)).toBe(2);
  });

  it('sans allié contaminable, rien ne se passe et rien n’est annoncé',()=>{
    // Toute l'équipe est déjà saturée : annoncer un débordement serait mentir.
    const apres=nextTurn(equipeAffligee([5,5,5]));
    expect(apres.allies.every(unite=>cumuls(apres,unite.id)===5)).toBe(true);
    expect(apres.log.some(ligne=>/déborde/.test(ligne))).toBe(false);
  });
});
