// Persistance d un combat en cours.
//
// GameContext ecrit `battleSession` dans localStorage via JSON.stringify et le
// relit tel quel au demarrage. Un combat interrompu — application fermee,
// onglet recharge, telephone en veille — doit donc traverser un aller-retour
// JSON sans rien perdre et sans changer de comportement.
//
// C est un contrat silencieux : une valeur qui ne survit pas a JSON
// (undefined, NaN, Infinity, Set, Map) ne casse rien au moment de la
// sauvegarde, seulement a la reprise, chez le joueur.
import{describe,it,expect,beforeEach,afterEach,vi}from'vitest';
import{createBattle,nextTurn,enemyAction,winner}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,withStatus,findUnit,fixedRandom}from './helpers';

const allerRetour=valeur=>JSON.parse(JSON.stringify(valeur));

/** Combat de reference : deux allies, deux ennemis, jauges figees. */
function combatDeReference(){
  const equipe=[
    makeHero({name:'Alpha',hp:1200,atk:60,def:20,spd:110,element:'Feu'}),
    makeHero({name:'Beta',hp:900,atk:80,def:12,spd:95,element:'Eau'})
  ];
  let combat=createBattle(equipe.map(hero=>hero.id),equipe,statsFrom,{
    enemies:[
      makeEnemy({id:'g1',hp:1500,atk:55,def:18,spd:100,element:'Nature'}),
      makeEnemy({id:'g2',hp:1100,atk:70,def:10,spd:120,element:'Ombre'})
    ]
  });
  // Jauges deterministes : createBattle les initialise avec Math.random.
  combat={
    ...combat,
    allies:combat.allies.map((unit,index)=>({...unit,atb:index*7})),
    enemies:combat.enemies.map((unit,index)=>({...unit,atb:index*5}))
  };
  return{combat,equipe};
}

/** Un combat deja bien engage : malus, boucliers, recharges, ressources. */
function combatEngage(){
  let{combat,equipe}=combatDeReference();
  combat=withStatus(combat,equipe[0].id,{
    debuffs:{poison:{turns:3,source:'g1',sourceAtk:55},slow:{turns:2,source:'g1'}},
    buffs:{shield:{turns:2,source:equipe[1].id}},
    patch:{shield:180,maxShield:220,cooldowns:[0,2,4],hp:640}
  });
  combat=withStatus(combat,equipe[1].id,{
    buffs:{regen:{turns:3,source:equipe[1].id},speedUp:{turns:1}},
    patch:{hp:410,mechanic:{key:2,value:3,max:5,targetId:'g2',danceSteps:['a','b'],active:true}}
  });
  combat=withStatus(combat,combat.enemies[0].id,{
    debuffs:{burn:{turns:4,source:equipe[0].id,sourceAtk:60},
             agony:{turns:3,stacks:2,source:equipe[0].id}},
    patch:{hp:900}
  });
  return{combat,equipe};
}

beforeEach(()=>fixedRandom(.5));
afterEach(()=>vi.restoreAllMocks());

describe('serialisation sans perte',()=>{
  it('un combat neuf traverse JSON a l identique',()=>{
    const{combat}=combatDeReference();
    expect(allerRetour(combat)).toEqual(combat);
  });

  it('un combat engage traverse JSON a l identique',()=>{
    const{combat}=combatEngage();
    expect(allerRetour(combat)).toEqual(combat);
  });

  it('malus, bonus, boucliers et recharges survivent',()=>{
    const{combat,equipe}=combatEngage();
    const avant=findUnit(combat,equipe[0].id),apres=findUnit(allerRetour(combat),equipe[0].id);
    expect(apres.debuffs).toEqual(avant.debuffs);
    expect(apres.buffs).toEqual(avant.buffs);
    expect(apres.shield).toBe(avant.shield);
    expect(apres.cooldowns).toEqual(avant.cooldowns);
  });

  it('la ressource de champion et ses tableaux internes survivent',()=>{
    const{combat,equipe}=combatEngage();
    const apres=findUnit(allerRetour(combat),equipe[1].id);
    expect(apres.mechanic).toEqual({key:2,value:3,max:5,targetId:'g2',
      danceSteps:['a','b'],active:true});
  });

  it('l Attaque memorisee pour le plafond boss survit',()=>{
    const{combat}=combatEngage();
    expect(allerRetour(combat).enemies[0].debuffs.burn.sourceAtk).toBe(60);
  });

  it('les statistiques de combat accumulees survivent',()=>{
    let{combat}=combatDeReference();
    combat=nextTurn(combat);
    combat=enemyAction(combat);
    expect(allerRetour(combat).combatStats).toEqual(combat.combatStats);
  });

  it('aucune valeur du combat n est perdue par JSON',()=>{
    // Une cle a undefined disparait silencieusement de la sauvegarde. Si
    // l aller-retour est egal a l original, c est qu il n y en a aucune.
    const{combat}=combatEngage();
    const perdu=JSON.stringify(combat)!==JSON.stringify(allerRetour(combat));
    expect(perdu).toBe(false);
  });
});

describe('reprise apres rechargement',()=>{
  /** Joue `tours` tours, en alternant jauge et action ennemie. */
  function jouer(depart,tours){
    let combat=depart;
    for(let index=0;index<tours;index+=1){
      combat=nextTurn(combat);
      if(combat.winner)break;
      if(combat.enemies.some(unit=>unit.id===combat.turn&&!unit.dead))
        combat=enemyAction(combat);
    }
    return combat;
  }

  it('interrompre et reprendre donne exactement le meme etat',()=>{
    const{combat}=combatEngage();
    const dUneTraite=jouer(combat,6);
    const enDeuxFois=jouer(allerRetour(jouer(combat,3)),3);
    expect(enDeuxFois).toEqual(dUneTraite);
  });

  it('la reprise fonctionne apres plusieurs sauvegardes successives',()=>{
    const{combat}=combatEngage();
    const dUneTraite=jouer(combat,6);
    let morcele=combat;
    for(let index=0;index<6;index+=1)morcele=allerRetour(jouer(morcele,1));
    expect(morcele).toEqual(dUneTraite);
  });

  it('les degats periodiques reprennent au bon montant',()=>{
    const{combat,equipe}=combatEngage();
    const direct=findUnit(jouer(combat,4),equipe[0].id).hp;
    const repris=findUnit(jouer(allerRetour(jouer(combat,2)),2),equipe[0].id).hp;
    expect(repris).toBe(direct);
  });

  it('un combat gagne reste gagne apres rechargement',()=>{
    let{combat}=combatDeReference();
    combat={...combat,enemies:combat.enemies.map(unit=>({...unit,hp:0,dead:true}))};
    combat=nextTurn(combat);
    expect(combat.winner).toBe('ally');
    const recharge=allerRetour(combat);
    expect(recharge.winner).toBe('ally');
    expect(winner(recharge.allies,recharge.enemies)).toBe('ally');
    // Un combat termine ne doit pas repartir a la reprise.
    expect(nextTurn(recharge)).toBe(recharge);
  });
});

describe('valeurs que JSON ne sait pas transporter',()=>{
  it('une jauge NaN devient null a la sauvegarde, et le moteur la rattrape',()=>{
    let{combat}=combatDeReference();
    combat={...combat,allies:combat.allies.map(unit=>({...unit,atb:NaN}))};
    const recharge=allerRetour(combat);
    expect(recharge.allies[0].atb).toBeNull(); // JSON ne sait pas dire NaN
    const suivant=nextTurn(recharge);
    expect(suivant.turn).toBeTruthy();
    [...suivant.allies,...suivant.enemies].forEach(unit=>
      expect(Number.isFinite(unit.atb)).toBe(true));
  });

  it('une jauge Infinity devient null, et le moteur la rattrape',()=>{
    let{combat}=combatDeReference();
    combat={...combat,enemies:combat.enemies.map(unit=>({...unit,atb:Infinity}))};
    const recharge=allerRetour(combat);
    expect(recharge.enemies[0].atb).toBeNull();
    expect(nextTurn(recharge).turn).toBeTruthy();
  });

  it('une vitesse effective perdue est reconstruite',()=>{
    let{combat}=combatDeReference();
    combat={...combat,allies:combat.allies.map(unit=>({...unit,currentSpd:NaN}))};
    const suivant=nextTurn(allerRetour(combat));
    suivant.allies.forEach(unit=>expect(unit.currentSpd).toBeGreaterThanOrEqual(20));
  });
});

describe('forme attendue par la sauvegarde',()=>{
  it('le combat porte un identifiant et une version de schema',()=>{
    const{combat}=combatDeReference();
    expect(combat.battleId).toBeTruthy();
    expect(combat.schemaVersion).toBe(2);
  });

  it('l identifiant de combat est stable a travers les tours et la sauvegarde',()=>{
    const{combat}=combatEngage();
    const suivant=allerRetour(nextTurn(combat));
    expect(suivant.battleId).toBe(combat.battleId);
    expect(suivant.schemaVersion).toBe(combat.schemaVersion);
  });

  it('le journal reste borne et ne gonfle pas la sauvegarde',()=>{
    let{combat}=combatEngage();
    for(let index=0;index<25;index+=1){
      combat=nextTurn(combat);
      if(combat.winner)break;
    }
    expect(combat.log.length).toBeLessThanOrEqual(12);
  });
});
