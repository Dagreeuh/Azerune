// Les six renforts élémentaires : Vharok, Ragnhild, Sivrane, Yunmei, Aszhal,
// Nyxaris.
//
// Chaque kit est vérifié sur ce qu'il promet dans sa description, et sur son
// câblage réel dans le moteur — la moitié qui manque derrière chaque bug de ce
// projet. Les dégâts eux-mêmes sont couverts par degats.contrat.test.js.
import{describe,it,expect,afterEach,vi}from'vitest';
import{HEROES}from'../src/data/heroes';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{createBattle,nextTurn,castSkill,performAutoAction}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,findUnit,fixedRandom,giveTurnTo}from'./helpers';

const moteur=fs.readFileSync(fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8');

afterEach(()=>vi.restoreAllMocks());

const heros=id=>HEROES.find(hero=>hero.id===id);

/**
 * Combat où le champion testé agit immédiatement.
 * `createBattle` réécrit les identifiants ennemis : on les relit sur le combat.
 */
function scene(id,{allies=[],enemies=1,patchAllie=null}={}){
  const equipe=[heros(id),...allies.map((patch,index)=>
    makeHero({id:8100+index,hp:4000,atk:30,def:10,spd:1,name:`A${index}`,...patch}))];
  const cibles=[...Array(enemies)].map((_,index)=>
    makeEnemy({id:`c${index}`,hp:200000,atk:20,def:0,spd:1,element:'Arcane',name:`E${index}`}));
  let combat=createBattle(equipe.map(hero=>hero.id),equipe.map(hero=>({...hero,currentStars:6})),
    unite=>({...statsFrom(unite),accuracy:120,resistance:0}),{enemies:cibles});
  combat={...combat,allies:combat.allies.map(unite=>
    ({...unite,cooldowns:[0,0,0],...(patchAllie?.(unite)||{})}))};
  return nextTurn(giveTurnTo(combat,id));
}
const lance=(combat,index,cible)=>{const sortie=castSkill(combat,index,cible);return sortie.battle||sortie};
const cible=(combat,index=0)=>combat.enemies[index].id;

describe('répartition élémentaire du roster',()=>{
  const compte=()=>HEROES.reduce((total,hero)=>
    ({...total,[hero.element]:(total[hero.element]||0)+1}),{});

  it('aucun élément ne compte moins de quatre champions',()=>{
    Object.entries(compte()).forEach(([element,total])=>
      expect(total,`${element} : ${total} champion(s)`).toBeGreaterThanOrEqual(4));
  });

  it('l’élément le plus servi n’en compte pas plus du double du moins servi',()=>{
    // L'écart était de 8 à 3 — Nature contre Feu, Eau et Arcane.
    const valeurs=Object.values(compte());
    expect(Math.max(...valeurs)/Math.min(...valeurs)).toBeLessThanOrEqual(2);
  });

  it('les six éléments existent bien tous dans le roster',()=>{
    expect(Object.keys(compte()).sort())
      .toEqual(['Arcane','Eau','Feu','Lumière','Nature','Ombre']);
  });

  it('les six renforts sont jouables et déclarent trois compétences',()=>{
    [31,32,33,34,35,36].forEach(id=>{
      expect(heros(id),`champion ${id}`).toBeTruthy();
      expect(heros(id).skills,`champion ${id}`).toHaveLength(3);
    });
  });

  it('aucun effet de compétence n’est utilisé par deux champions',()=>{
    const effets=HEROES.flatMap(hero=>hero.skills.map(skill=>skill.effect));
    expect(effets.length).toBe(new Set(effets).size);
  });
});

describe('Vharok — Maelström',()=>{
  it('Frappe-tempête accumule un cumul',()=>{
    fixedRandom(.5);
    const combat=scene(31);
    expect(findUnit(lance(combat,0,cible(combat)),31).mechanic.value).toBe(1);
  });

  it('la réserve est plafonnée à cinq',()=>{
    fixedRandom(.5);
    let combat=scene(31);
    for(let tour=0;tour<8;tour+=1){
      combat=lance(combat,0,cible(combat));
      combat=nextTurn(giveTurnTo({...combat,allies:combat.allies.map(u=>({...u,cooldowns:[0,0,0]}))},31));
    }
    expect(findUnit(combat,31).mechanic.value).toBe(5);
  });

  it('Totem des vents accélère toute l’équipe',()=>{
    fixedRandom(.5);
    const apres=lance(scene(31,{allies:[{},{}]}),1);
    apres.allies.filter(unite=>!unite.dead).forEach(unite=>
      expect(unite.buffs.speedUp,`${unite.name}`).toBeTruthy());
  });

  it('Totem des vents accumule aussi un Maelström',()=>{
    fixedRandom(.5);
    expect(findUnit(lance(scene(31,{allies:[{}]}),1),31).mechanic.value).toBe(1);
  });

  it('la Décharge frappe plus fort chargée, et consomme tout',()=>{
    fixedRandom(.5);
    const essai=cumuls=>{
      const combat=scene(31,{enemies:2,patchAllie:unite=>
        unite.id===31?{mechanic:{...unite.mechanic,value:cumuls}}:{}});
      const avant=combat.enemies.reduce((total,unite)=>total+unite.hp,0);
      const apres=lance(combat,2,cible(combat));
      return{subis:avant-apres.enemies.reduce((total,unite)=>total+unite.hp,0),
        reste:findUnit(apres,31).mechanic.value};
    };
    expect(essai(5).subis).toBeGreaterThan(essai(0).subis);
    expect(essai(5).reste).toBe(0);
  });
});

describe('Ragnhild — Fureur',()=>{
  it('Écorchure sanglante lui rend des PV',()=>{
    fixedRandom(.5);
    const combat=scene(32,{patchAllie:unite=>unite.id===32?{hp:Math.round(unite.maxHp*.4)}:{}});
    const avant=findUnit(combat,32).hp;
    expect(findUnit(lance(combat,0,cible(combat)),32).hp).toBeGreaterThan(avant);
  });

  it('elle ne se soigne pas au-delà de son maximum',()=>{
    fixedRandom(.5);
    const combat=scene(32);
    const apres=findUnit(lance(combat,0,cible(combat)),32);
    expect(apres.hp).toBeLessThanOrEqual(apres.maxHp);
  });

  it('Témérité augmente l’Attaque et coûte des PV',()=>{
    fixedRandom(.5);
    const combat=scene(32),avant=findUnit(combat,32).hp;
    const apres=lance(combat,1);
    expect(findUnit(apres,32).buffs.atkUp).toBeTruthy();
    expect(findUnit(apres,32).hp).toBeLessThan(avant);
  });

  it('Témérité ne peut jamais la tuer',()=>{
    fixedRandom(.5);
    const combat=scene(32,{patchAllie:unite=>unite.id===32?{hp:1}:{}});
    const apres=findUnit(lance(combat,1),32);
    expect(apres.hp).toBeGreaterThan(0);
    expect(apres.dead).toBe(false);
  });

  it('Exécution frappe bien plus fort une cible affaiblie',()=>{
    fixedRandom(.5);
    const essai=ratio=>{
      let combat=scene(32);
      combat={...combat,enemies:combat.enemies.map(unite=>
        ({...unite,hp:Math.round(unite.maxHp*ratio)}))};
      const identifiant=cible(combat),avant=findUnit(combat,identifiant).hp;
      return avant-findUnit(lance(combat,2,identifiant),identifiant).hp;
    };
    expect(essai(.2)).toBeGreaterThan(essai(.9)*1.5);
  });
});

describe('Sivrane — Givre',()=>{
  it('Trait de givre applique un cumul et ralentit',()=>{
    fixedRandom(.5);
    const combat=scene(33),identifiant=cible(combat);
    const touche=findUnit(lance(combat,0,identifiant),identifiant);
    expect(touche.debuffs.frost?.stacks).toBe(1);
    expect(touche.debuffs.slow).toBeTruthy();
  });

  it('les cumuls s’empilent jusqu’à cinq',()=>{
    fixedRandom(.5);
    let combat=scene(33);
    for(let tour=0;tour<7;tour+=1){
      combat=lance(combat,0,cible(combat));
      combat=nextTurn(giveTurnTo({...combat,allies:combat.allies.map(u=>({...u,cooldowns:[0,0,0]}))},33));
    }
    expect(findUnit(combat,cible(combat)).debuffs.frost.stacks).toBe(5);
  });

  it('Nova de givre touche toutes les cibles',()=>{
    fixedRandom(.5);
    lance(scene(33,{enemies:3}),1).enemies.forEach(unite=>
      expect(unite.debuffs.frost?.stacks,`${unite.name}`).toBe(1));
  });

  it('Fracture glaciale étourdit à partir de trois cumuls, pas avant',()=>{
    fixedRandom(.5);
    const fracture=cumuls=>{
      let combat=scene(33);
      combat={...combat,enemies:combat.enemies.map(unite=>
        ({...unite,debuffs:{...unite.debuffs,frost:{turns:3,stacks:cumuls}}}))};
      const identifiant=cible(combat);
      return findUnit(lance(combat,2,identifiant),identifiant);
    };
    expect(fracture(2).debuffs.stun).toBeFalsy();
    expect(fracture(3).debuffs.stun).toBeTruthy();
  });

  it('Fracture glaciale consomme le Givre',()=>{
    fixedRandom(.5);
    let combat=scene(33);
    combat={...combat,enemies:combat.enemies.map(unite=>
      ({...unite,debuffs:{...unite.debuffs,frost:{turns:3,stacks:4}}}))};
    const identifiant=cible(combat);
    expect(findUnit(lance(combat,2,identifiant),identifiant).debuffs.frost).toBeUndefined();
  });

  it('Fracture glaciale frappe plus fort à mesure que le Givre s’empile',()=>{
    fixedRandom(.5);
    const essai=cumuls=>{
      let combat=scene(33);
      if(cumuls)combat={...combat,enemies:combat.enemies.map(unite=>
        ({...unite,debuffs:{...unite.debuffs,frost:{turns:3,stacks:cumuls}}}))};
      const identifiant=cible(combat),avant=findUnit(combat,identifiant).hp;
      return avant-findUnit(lance(combat,2,identifiant),identifiant).hp;
    };
    expect(essai(5)).toBeGreaterThan(essai(0));
    expect(essai(5)).toBeGreaterThan(essai(2));
  });

  it('sans Givre, Fracture glaciale n’étourdit pas',()=>{
    fixedRandom(.5);
    const combat=scene(33),identifiant=cible(combat);
    expect(findUnit(lance(combat,2,identifiant),identifiant).debuffs.stun).toBeFalsy();
  });
});

describe('Yunmei — Brumes',()=>{
  it('Paume de brume soigne l’allié le plus bas',()=>{
    fixedRandom(.5);
    const combat=scene(34,{allies:[{}],patchAllie:unite=>
      unite.id===8100?{hp:Math.round(unite.maxHp*.2)}:{}});
    const avant=findUnit(combat,8100).hp;
    expect(findUnit(lance(combat,0,cible(combat)),8100).hp).toBeGreaterThan(avant);
  });

  it('Brume revigorante purifie le malus le plus grave d’abord',()=>{
    fixedRandom(.5);
    const combat=scene(34,{allies:[{}],patchAllie:unite=>
      unite.id===8100?{hp:10,debuffs:{slow:{turns:2},burn:{turns:3}}}:{}});
    const soigne=findUnit(lance(combat,1,8100),8100);
    // La Brûlure passe avant le Ralentissement dans l'ordre de purification.
    expect(soigne.debuffs.burn).toBeUndefined();
    expect(soigne.debuffs.slow).toBeTruthy();
  });

  it('Brume revigorante applique aussi Régénération',()=>{
    fixedRandom(.5);
    const combat=scene(34,{allies:[{}],patchAllie:unite=>unite.id===8100?{hp:10}:{}});
    expect(findUnit(lance(combat,1,8100),8100).buffs.regen).toBeTruthy();
  });

  it('Renouveau purifie deux malus sur chaque allié',()=>{
    fixedRandom(.5);
    // Pas d'Étourdissement sur la lanceuse : elle passerait son tour.
    const malus={burn:{turns:3},poison:{turns:3},slow:{turns:2},bleed:{turns:3}};
    // PV suffisants : trois dégâts périodiques tueraient la lanceuse au seuil
    // de son propre tour, et elle sortirait de la liste des alliés vivants.
    const combat=scene(34,{allies:[{},{}],
      patchAllie:unite=>({hp:Math.round(unite.maxHp*.6),debuffs:{...malus}})});
    lance(combat,2).allies.forEach(unite=>
      expect(Object.keys(unite.debuffs).length,`${unite.name}`).toBe(2));
  });

  it('la purification ne retire pas les marques de mécanique de boss',()=>{
    fixedRandom(.5);
    const combat=scene(34,{allies:[{}],patchAllie:unite=>
      unite.id===8100?{hp:10,debuffs:{raidHealingDown:{turns:99}}}:{}});
    expect(findUnit(lance(combat,1,8100),8100).debuffs.raidHealingDown).toBeTruthy();
  });

  it('Yunmei est la seconde source de purification, Sylven n’est plus seul',()=>{
    const purificateurs=HEROES.filter(hero=>hero.skills.some(skill=>
      ['healingSeed','seedBloom','renewingMist','revival'].includes(skill.effect)));
    expect(purificateurs.length).toBeGreaterThanOrEqual(2);
    expect(new Set(purificateurs.map(hero=>hero.element)).size).toBeGreaterThan(1);
  });
});

describe('Aszhal — Augmentation',()=>{
  it('Puissance d’ébène augmente réellement les dégâts de l’allié visé',()=>{
    fixedRandom(.5);
    const frappe=amplifie=>{
      let combat=scene(35,{allies:[{atk:200,spd:1,skills:[{name:'Trait',icon:'✴️',cd:0,target:'enemy',description:'Frappe.',power:1,effect:'arcaneBlast'}]}]});
      if(amplifie)combat=lance(combat,1,8100);
      combat={...combat,allies:combat.allies.map(unite=>({...unite,cooldowns:[0,0,0]}))};
      combat=nextTurn(giveTurnTo(combat,8100));
      const identifiant=cible(combat),avant=findUnit(combat,identifiant).hp;
      return avant-findUnit(lance(combat,0,identifiant),identifiant).hp;
    };
    expect(frappe(true)).toBeGreaterThan(frappe(false));
  });

  it('Frappe prescience amplifie l’allié le plus offensif, jamais Aszhal',()=>{
    fixedRandom(.5);
    const combat=scene(35,{allies:[{atk:20},{atk:300}]});
    const apres=lance(combat,0,cible(combat));
    expect(findUnit(apres,8101).buffs.damageUp).toBeTruthy();
    expect(findUnit(apres,8100).buffs.damageUp).toBeFalsy();
    expect(findUnit(apres,35).buffs.damageUp).toBeFalsy();
  });

  it('Souffle des éons amplifie toute l’équipe',()=>{
    fixedRandom(.5);
    lance(scene(35,{allies:[{},{}]}),2).allies.filter(unite=>!unite.dead)
      .forEach(unite=>expect(unite.buffs.damageUp,`${unite.name}`).toBeTruthy());
  });

  it('Souffle des éons rend de la jauge aux alliés',()=>{
    fixedRandom(.5);
    const combat=scene(35,{allies:[{},{}],patchAllie:()=>({atb:0})});
    // La jauge du lanceur est remise à zéro par la fin de son propre tour.
    lance(combat,2).allies.filter(unite=>!unite.dead&&unite.id!==35)
      .forEach(unite=>expect(unite.atb,`${unite.name}`).toBeGreaterThan(0));
  });
});

describe('Nyxaris — Incantation prolongée',()=>{
  it('charger accumule une Charge',()=>{
    fixedRandom(.5);
    expect(findUnit(lance(scene(36),0),36).mechanic.value).toBe(1);
  });

  it('charger conserve de la jauge pour le tour suivant',()=>{
    // Le seul levier possible : la jauge du lanceur est remise à `retain`.
    fixedRandom(.5);
    expect(findUnit(lance(scene(36,{patchAllie:()=>({atb:0})}),0),36).atb).toBeGreaterThan(0);
  });

  it('la Charge est plafonnée à trois',()=>{
    fixedRandom(.5);
    let combat=scene(36);
    for(let tour=0;tour<6;tour+=1){
      combat=lance(combat,0);
      combat=nextTurn(giveTurnTo({...combat,allies:combat.allies.map(u=>({...u,cooldowns:[0,0,0]}))},36));
    }
    expect(findUnit(combat,36).mechanic.value).toBe(3);
  });

  it('Désintégration frappe plus fort chargée et consomme tout',()=>{
    fixedRandom(.5);
    const essai=charges=>{
      const combat=scene(36,{patchAllie:unite=>
        unite.id===36?{mechanic:{...unite.mechanic,value:charges}}:{}});
      const identifiant=cible(combat),avant=findUnit(combat,identifiant).hp;
      const apres=lance(combat,1,identifiant);
      return{subis:avant-findUnit(apres,identifiant).hp,reste:findUnit(apres,36).mechanic.value};
    };
    expect(essai(3).subis).toBeGreaterThan(essai(0).subis*1.5);
    expect(essai(3).reste).toBe(0);
  });

  it('Vague d’éternité consomme aussi les Charges',()=>{
    fixedRandom(.5);
    const combat=scene(36,{enemies:3,patchAllie:unite=>
      unite.id===36?{mechanic:{...unite.mechanic,value:3}}:{}});
    expect(findUnit(lance(combat,2),36).mechanic.value).toBe(0);
  });
});

describe('le combat automatique sait jouer les renforts',()=>{
  // Sans règle dédiée, le combat automatique lance le finisseur en premier :
  // Décharge sans Maelström, Fracture sans Givre, Désintégration sans Charge.
  // Le champion existe alors sur le papier et ne fonctionne pas en jeu.
  const CAS=[
    {id:31,nom:'Vharok',reserve:combat=>findUnit(combat,31).mechanic.value},
    {id:33,nom:'Sivrane',reserve:combat=>Math.max(0,...combat.enemies.map(u=>u.debuffs?.frost?.stacks||0))},
    {id:36,nom:'Nyxaris',reserve:combat=>findUnit(combat,36).mechanic.value}
  ];

  CAS.forEach(({id,nom,reserve})=>{
    it(`${nom} constitue sa réserve avant de la dépenser`,()=>{
      fixedRandom(.5);
      let combat=scene(id,{enemies:2});
      let maximum=0;
      for(let tour=0;tour<6;tour+=1){
        const sortie=performAutoAction(combat,{});
        combat=sortie.battle||sortie;
        maximum=Math.max(maximum,reserve(combat));
        combat=nextTurn(giveTurnTo({...combat,
          allies:combat.allies.map(unite=>({...unite,cooldowns:[0,0,0]}))},id));
      }
      expect(maximum,`${nom} n’accumule jamais rien en automatique`).toBeGreaterThanOrEqual(2);
    });
  });

  it('chaque renfort a une règle de combat automatique dédiée',()=>{
    // Le défaut du moteur est « finisseur d'abord » : il ne convient à aucun
    // kit a ressource.
    [31,32,33,34,35,36].forEach(id=>
      expect(moteur.includes(`actor.id===${id}&&!customOrder`),
        `aucune règle automatique pour le champion ${id}`).toBe(true));
  });
});
