// La Provocation subie par un allié.
//
// Le Gardien de lave du Raid provoque toute l'équipe. Le malus était posé,
// nommé dans la barre d'état — et lu nulle part côté joueur. Un champion
// provoqué visait librement qui il voulait : la mécanique entière du Gardien ne
// faisait rien, et le Raid se résumait à une course aux dégâts.
//
// Même signature que `accuracyDown` et que la Précision réduite d'Œil-Clair :
// une moitié écrite, l'autre pas.
import{describe,it,expect,afterEach,vi}from'vitest';
import{RAIDS,createRaidMission}from'../src/data/raids';
import{createBattle,nextTurn,castSkill,chooseAutoEnemyTarget,performAutoAction}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,withStatus,findUnit,fixedRandom,giveTurnTo}from'./helpers';

afterEach(()=>vi.restoreAllMocks());

/** Un attaquant, deux ennemis : un « provocateur » et une cible plus tentante. */
function scene({provoquePar=null}={}){
  fixedRandom(.5);
  const heros=[makeHero({id:9500,hp:9000,atk:80,def:0,spd:300,name:'Attaquant',
    skills:[{name:'Trait',icon:'✴️',cd:0,target:'enemy',description:'Frappe.',power:1,effect:'arcaneBlast'}]})];
  let combat=createBattle([9500],heros,unite=>({...statsFrom(unite),accuracy:60,resistance:0}),{
    enemies:[makeEnemy({id:'gardien',hp:50000,atk:10,def:0,spd:1,element:'Arcane',name:'Gardien'}),
      makeEnemy({id:'fragile',hp:800,atk:10,def:0,spd:1,element:'Arcane',name:'Fragile'})]});
  combat=nextTurn(giveTurnTo(combat,9500));
  const gardien=combat.enemies[0].id;
  if(provoquePar)combat=withStatus(combat,9500,{debuffs:{provoke:{turns:2,source:gardien}}});
  return{combat,gardien,fragile:combat.enemies[1].id};
}
const lance=(combat,index,cible)=>{const sortie=castSkill(combat,index,cible);return sortie.battle||sortie};

describe('un allié provoqué ne peut plus choisir sa cible',()=>{
  it('sans Provocation, il frappe bien la cible désignée',()=>{
    const{combat,fragile}=scene();
    const avant=findUnit(combat,fragile).hp;
    expect(findUnit(lance(combat,0,fragile),fragile).hp).toBeLessThan(avant);
  });

  it('provoqué, sa frappe part sur le provocateur malgré la cible désignée',()=>{
    const{combat,gardien,fragile}=scene({provoquePar:true});
    const apres=lance(combat,0,fragile);
    expect(findUnit(apres,fragile).hp).toBe(findUnit(combat,fragile).hp);
    expect(findUnit(apres,gardien).hp).toBeLessThan(findUnit(combat,gardien).hp);
  });

  it('le combat automatique respecte aussi la Provocation',()=>{
    const{combat,gardien}=scene({provoquePar:true});
    const acteur=findUnit(combat,9500);
    expect(chooseAutoEnemyTarget(combat,acteur,acteur.skills[0])).toBe(gardien);
  });

  it('sans Provocation, le combat automatique vise librement',()=>{
    const{combat,gardien}=scene();
    const acteur=findUnit(combat,9500);
    expect(chooseAutoEnemyTarget(combat,acteur,acteur.skills[0])).not.toBe(gardien);
  });

  it('si le provocateur meurt, la contrainte tombe',()=>{
    let{combat,gardien,fragile}=scene({provoquePar:true});
    combat={...combat,enemies:combat.enemies.map(unite=>
      unite.id===gardien?{...unite,hp:0,dead:true}:unite)};
    const avant=findUnit(combat,fragile).hp;
    expect(findUnit(lance(combat,0,fragile),fragile).hp).toBeLessThan(avant);
  });

  it('le combat automatique ignore aussi un provocateur mort',()=>{
    // Le ciblage automatique renvoie l'identifiant impose directement : sans
    // controle de la mort, il aurait designe un cadavre.
    let{combat,gardien}=scene({provoquePar:true});
    combat={...combat,enemies:combat.enemies.map(unite=>
      unite.id===gardien?{...unite,hp:0,dead:true}:unite)};
    const acteur=findUnit(combat,9500);
    expect(chooseAutoEnemyTarget(combat,acteur,acteur.skills[0])).not.toBe(gardien);
  });

  it('une Provocation sans source ne bloque rien',()=>{
    // Etat relu depuis une sauvegarde : pas de source, pas de contrainte.
    let{combat,fragile}=scene();
    combat=withStatus(combat,9500,{debuffs:{provoke:{turns:2}}});
    const avant=findUnit(combat,fragile).hp;
    expect(findUnit(lance(combat,0,fragile),fragile).hp).toBeLessThan(avant);
  });

  it('purifier la Provocation rend sa liberté au champion',()=>{
    let{combat,fragile}=scene({provoquePar:true});
    combat={...combat,allies:combat.allies.map(unite=>({...unite,debuffs:{}}))};
    const avant=findUnit(combat,fragile).hp;
    expect(findUnit(lance(combat,0,fragile),fragile).hp).toBeLessThan(avant);
  });
});

describe('le Gardien de lave du Raid retrouve son rôle',()=>{
  /** Un vrai raid, où le Gardien a provoqué l'équipe. */
  function raid(){
    fixedRandom(.5);
    const heros=[0,1,2,3].map(index=>makeHero({id:9600+index,hp:20000,atk:70,def:0,spd:index?1:300,
      name:`A${index}`,skills:[{name:'Trait',icon:'✴️',cd:0,target:'enemy',description:'Frappe.',power:1,effect:'arcaneBlast'}]}));
    const mission=createRaidMission(RAIDS[0].id,6);
    let combat=createBattle(heros.map(hero=>hero.id),heros,
      unite=>({...statsFrom(unite),accuracy:60,resistance:0}),
      {enemies:mission.enemies,enemyScale:mission.scale||1,
        raid:{...mission.raidData,level:mission.raidLevel}});
    return nextTurn(giveTurnTo(combat,9600));
  }

  it('le Raid comporte bien un Gardien qui provoque',()=>{
    const mission=createRaidMission(RAIDS[0].id,6);
    expect(mission.enemies.map(unite=>unite.raidRole)).toContain('guardian');
  });

  it('provoquée, l’équipe ne peut plus frapper le boss',()=>{
    let combat=raid();
    const gardien=combat.enemies.find(unite=>unite.raidRole==='guardian').id;
    const boss=combat.enemies.find(unite=>unite.raidRole==='boss').id;
    combat={...combat,allies:combat.allies.map(unite=>
      ({...unite,debuffs:{provoke:{turns:2,source:gardien}}}))};
    const avantBoss=findUnit(combat,boss).hp;
    const apres=lance(combat,0,boss);
    expect(findUnit(apres,boss).hp).toBe(avantBoss);
    expect(findUnit(apres,gardien).hp).toBeLessThan(findUnit(combat,gardien).hp);
  });

  it('la Provocation du Gardien est reconnue comme dangereuse par le moteur',()=>{
    // Elle figure dans la liste que suit le combat automatique, et en tête de
    // l'ordre de purification.
    const combat=raid();
    expect(combat.enemies.some(unite=>unite.raidRole==='guardian')).toBe(true);
  });
});
