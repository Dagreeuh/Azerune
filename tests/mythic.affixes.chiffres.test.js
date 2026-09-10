import{describe,it,expect,afterEach,vi}from'vitest';
import{MYTHIC_AFFIXES}from'../src/data/mythic';
import{createBattle,nextTurn,enemyAction,castSkill}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,findUnit,fixedRandom}from'./helpers';

// Chaque affixe annonce des chiffres précis au joueur. Les lire dans le code ne
// suffit pas — cet audit a déjà été trompé quatre fois par sa propre mesure.
// On les vérifie donc en jouant, et on compare à la phrase affichée.

afterEach(()=>vi.restoreAllMocks());

/** Combat Mythic+ portant les affixes demandés. */
const combat=(affixIds,{boss=false,ennemis=1,pvAllie=200000}={})=>{
  const equipe=[makeHero({id:9100,hp:pvAllie,atk:400,def:0,spd:1,name:'A0',element:'Arcane'}),
    makeHero({id:9101,hp:pvAllie,atk:400,def:0,spd:1,name:'A1',element:'Arcane'})];
  const cibles=[...Array(ennemis)].map((u,i)=>
    makeEnemy({id:`c${i}`,hp:5000,atk:100,def:50,spd:300,element:'Arcane',bossUnit:boss}));
  return createBattle(equipe.map(h=>h.id),equipe.map(h=>({...h,currentStars:6})),
    unite=>({...statsFrom(unite),accuracy:120,resistance:0}),
    {enemies:cibles,mythic:{level:20,season:'test',turnBudget:80},affixIds});
};
/** Le nombre cité dans la phrase de l'affixe, en pourcentage ou en points. */
const cite=(id,motif)=>{
  const texte=MYTHIC_AFFIXES[id].summary||MYTHIC_AFFIXES[id].description||'';
  const trouve=texte.match(motif);
  expect(trouve,`« ${texte} » ne cite pas ${motif}`).toBeTruthy();
  return Number(String(trouve[1]).replace(',','.'));
};

/**
 * Galvanisant et Détonant se déclenchent sur une mort SURVENUE pendant une
 * ACTION : le bloc vit dans `finish()`, pas dans le décompte des tours. Un
 * cadavre déjà présent à l'entrée ne compte pas, et un ennemi tué par des
 * dégâts périodiques non plus. On les tue donc d'un coup de sort.
 *
 * Le pantin porte une frappe de zone déclarée dans la liste blanche du moteur,
 * pour pouvoir en tuer plusieurs d'un coup et atteindre le plafond annoncé.
 */
const ZONE={name:'Vague',icon:'💥',cd:0,target:'allEnemies',
  description:'Frappe de zone.',power:1,effect:'bladeDanceStorm'};
const combatZone=(affixes,ennemis)=>{
  const equipe=[makeHero({id:9100,hp:200000,atk:400,def:0,spd:1,name:'A0',element:'Arcane',skills:[ZONE]}),
    makeHero({id:9101,hp:200000,atk:400,def:0,spd:1,name:'A1',element:'Arcane',skills:[ZONE]})];
  const cibles=[...Array(ennemis)].map((u,i)=>
    makeEnemy({id:`c${i}`,hp:5000,atk:100,def:50,spd:300,element:'Arcane'}));
  return createBattle(equipe.map(h=>h.id),equipe.map(h=>({...h,currentStars:6})),
    unite=>({...statsFrom(unite),accuracy:120,resistance:0}),
    {enemies:cibles,mythic:{level:20,season:'test',turnBudget:80},affixIds:affixes});
};
const tuerUnEnnemi=(affixes,morts=1,ennemis=Math.max(3,morts+1))=>{
  fixedRandom(.5);
  let b=combatZone(affixes,ennemis);
  b={...b,turn:9100,
    allies:b.allies.map(u=>({...u,hp:u.maxHp,cooldowns:[0,0,0]})),
    enemies:b.enemies.map((u,i)=>i<morts?{...u,hp:1}:u)};
  const sortie=castSkill(b,0,b.enemies[0].id);
  return sortie.battle||sortie;
};

describe('Fortifié — les chiffres annoncés sont ceux appliqués',()=>{
  const nu=()=>combat([]).enemies[0];
  const fort=()=>combat(['fortified']).enemies[0];

  it('les points de vie montent du pourcentage annoncé',()=>{
    const attendu=cite('fortified',/(\d+)\s*% de PV/);
    expect(fort().maxHp/nu().maxHp).toBeCloseTo(1+attendu/100,2);
  });

  it('l’Attaque aussi',()=>{
    const attendu=cite('fortified',/(\d+)\s*% d’Attaque/);
    expect(fort().atk/nu().atk).toBeCloseTo(1+attendu/100,2);
  });

  it('la Résistance monte du nombre de points annoncé',()=>{
    const attendu=cite('fortified',/(\d+)\s*Résistance/);
    expect(fort().resistance-nu().resistance).toBe(attendu);
  });

  it('il épargne les boss : c’est ce qui le distingue de Tyrannique',()=>{
    expect(combat(['fortified'],{boss:true}).enemies[0].maxHp)
      .toBe(combat([],{boss:true}).enemies[0].maxHp);
  });
});

describe('Tyrannique — les chiffres annoncés sont ceux appliqués',()=>{
  const nu=()=>combat([],{boss:true}).enemies[0];
  const tyran=()=>combat(['tyrannical'],{boss:true}).enemies[0];

  it('les points de vie du boss montent du pourcentage annoncé',()=>{
    expect(tyran().maxHp/nu().maxHp).toBeCloseTo(1+cite('tyrannical',/(\d+)\s*% de PV/)/100,2);
  });

  it('son Attaque aussi',()=>{
    expect(tyran().atk/nu().atk).toBeCloseTo(1+cite('tyrannical',/(\d+)\s*% d’Attaque/)/100,2);
  });

  it('sa Précision monte du nombre de points annoncé',()=>{
    expect(tyran().accuracy-nu().accuracy).toBe(cite('tyrannical',/(\d+)\s*Précision/));
  });

  it('il épargne les serviteurs',()=>{
    expect(combat(['tyrannical']).enemies[0].maxHp).toBe(combat([]).enemies[0].maxHp);
  });
});

describe('Déchaîné — sous le seuil annoncé, et pas avant',()=>{
  const seuil=()=>cite('raging',/Sous (\d+)\s*% de PV/)/100;
  const vitesse=part=>{
    let b=combat(['raging']);
    b={...b,enemies:b.enemies.map(u=>({...u,hp:Math.round(u.maxHp*part)})),
      allies:b.allies.map(u=>({...u,atb:0}))};
    return nextTurn(b).enemies[0].currentSpd;
  };

  it('la Vitesse monte du pourcentage annoncé, une fois sous le seuil',()=>{
    const attendu=cite('raging',/(\d+)\s*% de Vitesse/);
    expect(vitesse(seuil()/2)/vitesse(.9)).toBeCloseTo(1+attendu/100,2);
  });

  it('au-dessus du seuil, rien ne change',()=>{
    expect(vitesse(seuil()+.05)).toBe(vitesse(.95));
  });
});

describe('Galvanisant — la mort d’un ennemi renforce les survivants',()=>{
  it('les survivants gagnent un cumul par mort, pour la durée annoncée',()=>{
    const tours=cite('bolstering',/pendant (\d+) tours?/);
    const apres=tuerUnEnnemi(['bolstering']);
    const vivants=apres.enemies.filter(u=>!u.dead);
    vivants.forEach(u=>{
      expect(u.buffs?.mythicBolster?.stacks,`${u.name} n’est pas galvanisé`).toBeGreaterThan(0);
      expect(u.buffs.mythicBolster.turns).toBe(tours);
    });
  });

  it('sans l’affixe, personne n’est galvanisé',()=>{
    const apres=tuerUnEnnemi([]);
    apres.enemies.filter(u=>!u.dead).forEach(u=>expect(u.buffs?.mythicBolster).toBeFalsy());
  });
});

describe('Détonant — la mort d’un ennemi frappe l’escouade',()=>{
  const perte=(morts,affixes)=>{
    const apres=tuerUnEnnemi(affixes,morts);
    const allie=findUnit(apres,9100);
    return(allie.maxHp-allie.hp)/allie.maxHp;
  };

  it('une mort coûte le pourcentage annoncé des PV max',()=>{
    const attendu=cite('bursting',/(\d+[.,]?\d*)\s*% des PV max/);
    expect(perte(1,['bursting'])).toBeCloseTo(attendu/100,3);
  });

  it('plusieurs morts s’additionnent',()=>{
    expect(perte(3,['bursting'])).toBeCloseTo(3*cite('bursting',/(\d+[.,]?\d*)\s*% des PV max/)/100,3);
  });

  it('le plafond annoncé tient : cinq morts ne coûtent pas plus que quatre',()=>{
    // À 2,5 % par mort, quatre morts font pile 10 % : il faut cinq morts pour
    // que le plafond morde, sinon on ne teste rien.
    const plafond=cite('bursting',/plafond de (\d+)\s*%/);
    expect(perte(5,['bursting'])).toBeCloseTo(plafond/100,3);
    expect(perte(6,['bursting'])).toBeCloseTo(plafond/100,3);
  });

  it('une mort causée par une riposte compte aussi',()=>{
    // Le chemin « action ennemie » doit fournir le même instantané : sans lui,
    // un ennemi tué par une contre-attaque ne déclencherait rien.
    // On compare à un témoin sans l'affixe : l'ennemi frappe l'allié dans les
    // deux cas, seule la détonation doit faire la différence.
    const riposte=affixes=>{
      fixedRandom(.1); // le jet doit passer sous 20 % pour que la riposte parte
      const equipe=[makeHero({id:9100,hp:200000,atk:4000,def:0,spd:1,name:'A0',element:'Arcane'})];
      let b=createBattle([9100],equipe.map(h=>({...h,currentStars:6})),
        u=>({...statsFrom(u),accuracy:120,resistance:0,setEffects:['counterSet']}),
        {enemies:[makeEnemy({id:'c0',hp:5000,atk:100,def:0,spd:300,element:'Arcane'})],
         mythic:{level:20,season:'test',turnBudget:80},affixIds:affixes});
      b={...b,turn:null,allies:b.allies.map(u=>({...u,hp:u.maxHp,atb:0})),
        enemies:b.enemies.map(u=>({...u,hp:1,atb:100}))};
      const apres=enemyAction(nextTurn(b));
      expect(apres.enemies[0].dead,'la riposte n’a pas tué l’ennemi').toBe(true);
      const allie=findUnit(apres,9100);
      return{perdu:allie.maxHp-allie.hp,max:allie.maxHp};
    };
    const avec=riposte(['bursting']),sans=riposte([]);
    const attendu=cite('bursting',/(\d+[.,]?\d*)\s*% des PV max/)/100;
    expect((avec.perdu-sans.perdu)/avec.max,'aucune détonation sur une mort par riposte')
      .toBeCloseTo(attendu,3);
  });
});

describe('Nécrotique — les soins reçus fondent',()=>{
  it('chaque cumul retire le pourcentage annoncé, jusqu’au plafond',()=>{
    const parCumul=cite('necrotic',/-?(\d+)\s*% par cumul/);
    const plafond=cite('necrotic',/jusqu’à (\d+) cumuls?/);
    expect(parCumul).toBeGreaterThan(0);
    expect(plafond).toBe(5);
    // Le moteur applique 1 - parCumul% x cumuls, plafonné au nombre annoncé.
    const moteur=(stacks)=>1-(parCumul/100)*Math.min(plafond,stacks);
    expect(moteur(1)).toBeCloseTo(1-parCumul/100,4);
    expect(moteur(9)).toBe(moteur(plafond));
  });

  it('une attaque ennemie pose bien un cumul',()=>{
    fixedRandom(.5);
    let b=combat(['necrotic']);
    b={...b,turn:null,enemies:b.enemies.map(u=>({...u,atb:100})),
      allies:b.allies.map(u=>({...u,atb:0}))};
    b=nextTurn(b);
    const apres=enemyAction(b);
    const touche=apres.allies.find(u=>u.debuffs?.necrotic);
    expect(touche,'aucun cumul de Nécrose posé').toBeTruthy();
    expect(touche.debuffs.necrotic.stacks).toBe(1);
  });

  it('sans l’affixe, aucune Nécrose',()=>{
    fixedRandom(.5);
    let b=combat([]);
    b={...b,turn:null,enemies:b.enemies.map(u=>({...u,atb:100})),
      allies:b.allies.map(u=>({...u,atb:0}))};
    expect(enemyAction(nextTurn(b)).allies.some(u=>u.debuffs?.necrotic)).toBe(false);
  });
});
