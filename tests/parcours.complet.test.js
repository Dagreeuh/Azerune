// Test de bout en bout : chaque mode de jeu se joue jusqu'au bout, sans
// exception et avec un vainqueur décidé.
//
// Deux plantages de ce projet — le Prêtre des flammes soignant un boss mort, et
// les compétences frappant dans le vide — n'apparaissaient qu'en jouant des
// parties complètes. Aucun test unitaire ne les voyait. Ce parcours joue tous
// les modes avec des compositions variées, y compris les six renforts.
import{describe,it,expect,afterEach,vi}from'vitest';
import{HEROES}from'../src/data/heroes';
import{CONTINENTS,DIFFICULTIES,createMission}from'../src/data/campaign';
import{RAIDS,createRaidMission}from'../src/data/raids';
import{EXPEDITIONS,createExpeditionMission}from'../src/data/expeditions';
import{createMythicMission}from'../src/data/mythic';
import{createBattle,nextTurn,enemyAction,advanceMythicWave,performAutoAction}from'../src/battle/engine';
import{statsFrom,mulberry32}from'./helpers';

afterEach(()=>vi.restoreAllMocks());

/** Joue une mission jusqu'à son terme en mode automatique. */
function parcourir(mission,equipe){
  const heroes=HEROES.map(hero=>({...hero,currentStars:6}));
  let combat=createBattle(equipe,heroes,unite=>({...statsFrom(unite),accuracy:40,resistance:20}),{
    enemies:mission.enemies,enemyScale:mission.scale||1,
    raid:mission.raid?{...mission.raidData,level:mission.raidLevel}:null,
    mythic:mission.mythic?{level:mission.mythicLevel,season:mission.mythicSeason,turnBudget:mission.turnBudget}:null,
    expedition:mission.expedition?mission.expeditionData:null,
    waves:mission.waves,affixIds:mission.affixIds});
  combat={...combat,autoMode:true};
  for(let garde=0;garde<8000;garde+=1){
    if(combat.winner==='enemy')return{fini:true,vainqueur:'enemy',tours:garde};
    if(combat.winner==='ally'){
      if(combat.mythic&&combat.wave<combat.totalWaves){combat=advanceMythicWave(combat);continue}
      return{fini:true,vainqueur:'ally',tours:garde};
    }
    if(!combat.turn){combat=nextTurn(combat);continue}
    if(combat.allies.some(unite=>unite.id===combat.turn&&!unite.dead)){
      const sortie=performAutoAction(combat,{});combat=sortie.battle||sortie;
    }else combat=enemyAction(combat);
  }
  return{fini:false,vainqueur:null,tours:8000};
}

/** Compositions déterministes couvrant tout le roster, renforts inclus. */
function compositions(taille,nombre){
  const alea=mulberry32(20260907),ids=HEROES.map(hero=>hero.id),sortie=[];
  for(let index=0;index<nombre;index+=1){
    const restants=[...ids],equipe=[];
    while(equipe.length<taille&&restants.length)
      equipe.push(...restants.splice(Math.floor(alea()*restants.length),1));
    sortie.push(equipe);
  }
  return sortie;
}

const dernier=CONTINENTS[CONTINENTS.length-1];
const MISSIONS=[
  ['Campagne Normal',createMission('normal',CONTINENTS[0].id,CONTINENTS[0].stages[0]),3],
  ['Campagne Hardcore finale',createMission('hardcore',dernier.id,dernier.stages[dernier.stages.length-1]),3],
  ...RAIDS.map(raid=>[`Raid ${raid.name}`,createRaidMission(raid.id,6),4]),
  ...EXPEDITIONS.map(expedition=>
    [`Expédition ${expedition.name}`,createExpeditionMission(expedition.id,5),
      createExpeditionMission(expedition.id,5)?.teamSize||3]),
  ['Mythic+ 1',createMythicMission(1),4],
  ['Mythic+ 30',createMythicMission(30),4]
];

describe('parcours complet — tous les modes se jouent jusqu’au bout',()=>{
  MISSIONS.forEach(([nom,mission,taille])=>{
    it(`${nom} se termine sans exception`,()=>{
      expect(mission,`${nom} : mission introuvable`).toBeTruthy();
      vi.spyOn(Math,'random').mockImplementation(mulberry32(4242));
      compositions(taille,3).forEach(equipe=>{
        const sortie=parcourir(mission,equipe);
        expect(sortie.fini,`${nom} n’a pas abouti avec ${equipe.join(',')}`).toBe(true);
        expect(['ally','enemy']).toContain(sortie.vainqueur);
      });
    });
  });

  it('les six renforts jouent chaque mode sans exception',()=>{
    vi.spyOn(Math,'random').mockImplementation(mulberry32(777));
    const renforts=[31,32,33,34,35,36];
    MISSIONS.forEach(([nom,mission,taille])=>{
      const equipe=renforts.slice(0,taille);
      const sortie=parcourir(mission,equipe);
      expect(sortie.fini,`${nom} avec les renforts`).toBe(true);
    });
  });

  it('une équipe entièrement 3★ termine chaque mode sans exception',()=>{
    vi.spyOn(Math,'random').mockImplementation(mulberry32(31313));
    const bases=HEROES.filter(hero=>hero.rarity===3).map(hero=>hero.id);
    MISSIONS.forEach(([nom,mission,taille])=>{
      const sortie=parcourir(mission,bases.slice(0,taille));
      expect(sortie.fini,`${nom} en 3★`).toBe(true);
    });
  });
});
