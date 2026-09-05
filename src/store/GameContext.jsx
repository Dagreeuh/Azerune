import React,{createContext,useContext,useEffect,useMemo,useRef,useState}from'react';
import{HEROES}from'../data/heroes';
import{ITEMS,SLOTS,generateCampaignItem,generateAchievementItem,generateShopItem,generateRaidItem,generateMythicItem,generateExpeditionItem,QUALITIES,normalizedItem,upgradeCost,forgeUpgradeItem,recycleEssenceValue}from'../data/items';
import{QUESTS,WEEKLY_QUESTS,MONTHLY_QUESTS,QUEST_GROUPS,FINAL_CHESTS,QUEST_PERIOD_CONFIG}from'../data/quests';
import{CONTINENTS,DIFFICULTIES,STAR_MILESTONES,allMissionKeys,milestoneKey,createMission}from'../data/campaign';
import{load,save,day}from'../utils/storage';
import{totalStats,progressionStats as championProgressionStats,championPower,teamPower,missionDifficulty,campaignXp,calibratedEncounterPower,assessTeamForMission}from'../utils/stats';
import{addChampionXp,defaultChampionProgress,evolveFromDuplicate,normalizeChampionProgress,normalizeResonanceOverflow,evolutionStatus,evolveChampion,resonanceStatus,strengthenResonance}from'../utils/progression';
import{skillInfo,skillMaxLevel}from'../utils/skills';
import{generateShopOffers,SHOP_BASE_SLOTS,SHOP_MAX_SLOTS,SHOP_SLOT_COSTS,SHOP_REFRESH_COSTS,SHOP_MAX_REFRESHES}from'../data/shop';
import{ACHIEVEMENTS,achievementReady}from'../data/achievements';
import{RAIDS,RAID_DAILY_ATTEMPTS}from'../data/raids';
import{EXPEDITIONS,EXPEDITION_DAILY_SEALS,EXPEDITION_HONOR_WINS,expeditionHonorForDate,expeditionHonorReward}from'../data/expeditions';
import{mythicSeason}from'../data/mythic';
import{ACADEMY_TUTORIALS,ACADEMY_REWARD,ACADEMY_FINAL_REWARD,emptyAcademyProgress}from'../data/tutorials';
import{UNIQUE_WEAPONS,RELICS,CHRONICLE_STEPS,normalizeChronicles,createUniqueWeapon,weaponForHero}from'../data/legendary';

const GameContext=createContext();
const REMOVED_HERO_IDS=new Set([2,4,5,6]);
const STARTER_TEAM=[1,19,20];
const freshDaily=()=>({date:day(),progress:{battle:0,skills:0,summon:0},claimed:{},bonus:false,campaignStones:0});
const weekKey=()=>{const date=new Date(),copy=new Date(date.getFullYear(),date.getMonth(),date.getDate()),weekday=(copy.getDay()+6)%7;copy.setDate(copy.getDate()-weekday);return `${copy.getFullYear()}-${String(copy.getMonth()+1).padStart(2,'0')}-${String(copy.getDate()).padStart(2,'0')}`;};
const monthKey=()=>{const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;};
const freshCycle=key=>({key,progress:{},claimed:{},bonus:false});
const emptyProgressionStats=()=>({version:1,lifetime:{battles:{completed:0,won:0,autoWins:0,manualWins:0,flawlessWins:0},combat:{damageDealt:0,damageTaken:0,healingDone:0,mitigation:0,dotDamageDealt:0,shieldAbsorbed:0,criticalDamage:0,enemiesDefeated:0,bossesDefeated:0},summons:{total:0,multi10:0,newHeroes:0,duplicates:0,rarity4:0,rarity5:0,pity:0,gemsSpent:0,stonesSpent:0},forge:{upgrades:0,recycles:0,sales:0,transfers:0,equipped:0,goldSpent:0,essenceSpent:0},activities:{campaignWins:0,expeditionWins:0,raidWins:0,mythicWins:0},chronicles:{relicsFound:0,activated:0,uniqueWeaponsForged:0}},records:{mythicHighest:0},champions:{},processed:{}});
const deepMerge=(base,value)=>Object.fromEntries(Object.keys({...base,...(value||{})}).map(k=>[k,base?.[k]&&typeof base[k]==='object'&&!Array.isArray(base[k])?deepMerge(base[k],value?.[k]):value?.[k]??base?.[k]]));
const SUMMONER_MAX_LEVEL=60;
const summonerXpRequired=level=>{
  if(level<5)return 100+(level-1)*25;
  if(level<10)return 200+(level-5)*40;
  if(level<20)return 450+(level-10)*65;
  return 1100+(level-20)*90;
};
const unlocks=[
  {level:1,label:'Campagne, quêtes journalières, Codex, Équipe et invocation x1'},
  {level:2,label:'Équipement'},
  {level:3,label:'Expéditions quotidiennes et quêtes hebdomadaires'},
  {level:6,label:'Bonus de progression Invocateur'},
  {level:8,label:'Quêtes mensuelles et Mythic+'},
  {level:10,label:'Historique des invocations'},
  {level:15,label:'Coffre de fidélité Invocateur'}
];
const buildProgress=(saved,owned)=>Object.fromEntries(HEROES.filter(hero=>owned.includes(hero.id)).map(hero=>[hero.id,normalizeChampionProgress(hero,saved?.[hero.id])]));

const PROMO_CODES={
  BIENVENUEAZERUNE:{label:'Pack de bienvenue',reward:{gems:500,gold:1500,stones:3}},
  PORTAIL2026:{label:'Pack du portail',reward:{gems:300,stones:5}},
  FOYER10:{label:'Réserve de Pierres de foyer',reward:{stones:10}},
  TESTFOYER10:{label:'Code de test illimité',reward:{stones:10},repeatable:true},
  CRISTAUX500:{label:'Coffre de cristaux',reward:{gems:500}},
  VELOMOTEUR5:{label:'Vélomoteur',heroId:9},DAGCAT5:{label:'Dagcat',heroId:10},MOBEEN5:{label:'Mobeen',heroId:11},
  LELIANNA5:{label:'Lelianna',heroId:12},SAYLICH5:{label:'Saylich',heroId:13},BRILITH5:{label:'Brilith',heroId:14},
  HICHO5:{label:'Hicho',heroId:15},NASHOBA5:{label:'Nashoba',heroId:16},HISTERIA5:{label:'Histéria',heroId:17},MATHANAE5:{label:'Mathanae',heroId:18}
};
const normalizeCode=value=>value.toUpperCase().replace(/[^A-Z0-9]/g,'');

const normalizeTeamPresets=(value,currentTeam,owned)=>Array.from({length:9},(_,index)=>{const source=Array.isArray(value)?value[index]:null;const members=(source?.members||(index===0?currentTeam:[])).map(Number).filter(id=>owned.includes(id)).slice(0,3);return{id:index+1,name:String(source?.name||`Équipe ${index+1}`).slice(0,24),members};});
export function GameProvider({children}){
  const legacy=useMemo(()=>load('azerune-v8-2',{}),[]);
  const stored=useMemo(()=>{
    const source=load('azerune-save',legacy)||{};
    const validHero=id=>HEROES.some(hero=>hero.id===Number(id))&&!REMOVED_HERO_IDS.has(Number(id));
    const owned=[...new Set([...(source.owned||[]).filter(validHero),...STARTER_TEAM])];
    let resonanceOverflowBlood=0;const championProgress=Object.fromEntries(Object.entries(source.championProgress||{}).filter(([id])=>validHero(id)).map(([id,value])=>{const hero=HEROES.find(entry=>entry.id===Number(id)),normalized=normalizeResonanceOverflow(hero,value);resonanceOverflowBlood+=normalized.bloodFragments;return[id,normalized.progress]}));
    const skillLevels=Object.fromEntries(Object.entries(source.skillLevels||{}).filter(([id])=>validHero(id)));
    const equipment=Object.fromEntries(Object.entries(source.equipment||{}).filter(([id])=>validHero(id)));
    STARTER_TEAM.forEach(id=>{const hero=HEROES.find(entry=>entry.id===id);if(hero&&!championProgress[id])championProgress[id]=defaultChampionProgress(hero);});
    const oldScores=source.campaign?.scores||{},migratedScores={};
    Object.entries(oldScores).forEach(([key,stars])=>{const [difficulty,continentId,stageId]=key.split(':');const targetDifficulty=difficulty==='easy'?'normal':difficulty;if(!['normal','hard','hardcore'].includes(targetDifficulty))return;const targetKey=`${targetDifficulty}:${continentId}:${stageId}`;migratedScores[targetKey]=Math.max(migratedScores[targetKey]||0,Number(stars)||0)});
    const oldClaims=source.campaign?.claimedMilestones||{},migratedClaims={};const milestoneMap={21:21,42:42,63:63,105:105,147:147,210:189,252:231,315:315};
    Object.entries(oldClaims).forEach(([key,claimed])=>{if(!claimed)return;const [difficulty,stars]=key.split(':'),targetDifficulty=difficulty==='easy'?'normal':difficulty,targetStars=milestoneMap[Number(stars)]||Number(stars);if(['normal','hard','hardcore'].includes(targetDifficulty))migratedClaims[`${targetDifficulty}:${targetStars}`]=true});
    const migratedCampaign={scores:migratedScores,claimedMilestones:migratedClaims,difficultyMigrationV28:true};
    let migratedBattleSession=source.battleSession?.format===1&&source.battleSession?.mission?source.battleSession:null;
    if(migratedBattleSession?.mission?.difficultyId==='easy'){const legacyMission=migratedBattleSession.mission,continent=CONTINENTS.find(entry=>entry.id===legacyMission.continentId),stage=continent?.stages.find(entry=>String(entry.id)===String(legacyMission.stageId)),difficulty=DIFFICULTIES.find(entry=>entry.id==='normal');migratedBattleSession=continent&&stage&&difficulty?{...migratedBattleSession,mission:createMission(difficulty,continent,stage),battle:null,target:null,missionReward:null,updatedAt:Date.now()}:null;}
    const normalizedTeam=(source.team||STARTER_TEAM).map(Number).filter(id=>owned.includes(id)).slice(0,3);const safeTeam=normalizedTeam.length?normalizedTeam:[...STARTER_TEAM];const activeTeamSlot=Math.max(1,Math.min(9,Number(source.activeTeamSlot)||1));const teamPresets=normalizeTeamPresets(source.teamPresets,safeTeam,owned);return{...source,version:29,campaign:migratedCampaign,campaignDifficultyMigrationV28:true,autoSkillPriorities:source.autoSkillPriorities||{},resonanceOverflowBlood, resonanceOverflowMigrated:true,legendaryChronicles:normalizeChronicles(source.legendaryChronicles),ascensionEssences:{minor:Math.max(0,Number(source.ascensionEssences?.minor||0)),major:Math.max(0,Number(source.ascensionEssences?.major||0)),mythic:Math.max(0,Number(source.ascensionEssences?.mythic||0))},conversionHistory:Array.isArray(source.conversionHistory)?source.conversionHistory.slice(0,50):[],trackedQuests:Array.isArray(source.trackedQuests)?source.trackedQuests.slice(0,3):[],progressionStats:deepMerge(emptyProgressionStats(),source.progressionStats),permanentQuests:source.permanentQuests||{progress:{},claimed:{}},mythicProgress:source.mythicProgress||{season:mythicSeason().key,completed:0,claimed:{},history:[]},activeTeamSlot,teamPresets,achievementClaims:source.achievementClaims||{},tutorialRewardClaimed:Boolean(source.tutorialRewardClaimed),tutorialAcademy:{...emptyAcademyProgress(),...(source.tutorialAcademy||{}),completed:Object.fromEntries(ACADEMY_TUTORIALS.filter(item=>source.tutorialAcademy?.completed?.[item.id]).map(item=>[item.id,source.tutorialAcademy.completed[item.id]])),claimed:Object.fromEntries(ACADEMY_TUTORIALS.filter(item=>source.tutorialAcademy?.claimed?.[item.id]).map(item=>[item.id,source.tutorialAcademy.claimed[item.id]]))},battleSession:migratedBattleSession,inventory:(source.inventory||[]).map(normalizedItem),forgeHistory:source.forgeHistory||[],owned,team:teamPresets[activeTeamSlot-1]?.members.length?teamPresets[activeTeamSlot-1].members:safeTeam,championProgress,skillLevels,equipment};
  },[legacy]);
  const[gems,setGems]=useState(stored.gems??500),[gold,setGold]=useState(stored.gold??1800),[hearthstones,setHearthstones]=useState(stored.hearthstones??5),[pityCounter,setPityCounter]=useState(stored.pityCounter??0);
  const[owned,setOwned]=useState(stored.owned??STARTER_TEAM),[team,setTeam]=useState(stored.team??STARTER_TEAM);
  const[activeTeamSlot,setActiveTeamSlotState]=useState(stored.activeTeamSlot??1),[teamPresets,setTeamPresets]=useState(stored.teamPresets??normalizeTeamPresets(null,stored.team??STARTER_TEAM,stored.owned??STARTER_TEAM));
  const[equipment,setEquipment]=useState(stored.equipment??{}),[inventory,setInventory]=useState((stored.inventory??[]).map(normalizedItem)),[history,setHistory]=useState(stored.history??[]),[redeemedCodes,setRedeemedCodes]=useState(stored.redeemedCodes??[]);
  const[universalSoul5,setUniversalSoul5]=useState(stored.universalSoul5??0);
  const[ascensionEssences,setAscensionEssences]=useState(stored.ascensionEssences??{minor:0,major:0,mythic:0});
  const[conversionHistory,setConversionHistory]=useState(stored.conversionHistory??[]);
  const[masteryTomes,setMasteryTomes]=useState(stored.masteryTomes??0);
  const[skillLevels,setSkillLevels]=useState(stored.skillLevels??{});
  const[bloodFragments,setBloodFragments]=useState((stored.bloodFragments??0)+(stored.resonanceOverflowMigrated?stored.resonanceOverflowBlood||0:0));
  const[shopState,setShopState]=useState(()=>{const value=stored.shopState||{};const slotCount=Math.max(SHOP_BASE_SLOTS,Math.min(SHOP_MAX_SLOTS,value.slotCount||SHOP_BASE_SLOTS));return value.date===day()?{date:value.date,slotCount,refreshCount:value.refreshCount||0,offers:value.offers?.length?value.offers:generateShopOffers(slotCount)}:{date:day(),slotCount,refreshCount:0,offers:generateShopOffers(slotCount)}});
  const[raidProgress,setRaidProgress]=useState(()=>{const value=stored.raidProgress||{};return value.date===day()?{date:value.date,attempts:value.attempts??RAID_DAILY_ATTEMPTS,completed:value.completed||{},firstWins:value.firstWins||{}}:{date:day(),attempts:RAID_DAILY_ATTEMPTS,completed:value.completed||{},firstWins:value.firstWins||{}}});
  const[forgeEssence,setForgeEssence]=useState(stored.forgeEssence??0);
  const[forgeHistory,setForgeHistory]=useState(stored.forgeHistory??[]);
  const[expeditionProgress,setExpeditionProgress]=useState(()=>{const value=stored.expeditionProgress||{},sameDay=value.date===day(),honor=sameDay?(value.honor||{}):{};return{date:day(),seals:sameDay?(value.seals??EXPEDITION_DAILY_SEALS):EXPEDITION_DAILY_SEALS,completed:value.completed||{},firstWins:value.firstWins||{},honor:{wins:Math.max(0,Math.min(EXPEDITION_HONOR_WINS,Number(honor.wins)||0)),claimed:Boolean(honor.claimed),sundayChoice:honor.sundayChoice||null,locked:Boolean(honor.locked)}}});
  const[championProgress,setChampionProgress]=useState(()=>buildProgress(stored.championProgress,stored.owned??STARTER_TEAM));
  const[campaign,setCampaign]=useState(stored.campaign??{scores:{},claimedMilestones:{}});
  const[tutorialRewardClaimed,setTutorialRewardClaimed]=useState(stored.tutorialRewardClaimed??false);
  const[tutorialAcademy,setTutorialAcademy]=useState(stored.tutorialAcademy??emptyAcademyProgress());
  const academyRewardLocks=useRef(new Set());
  const[achievementClaims,setAchievementClaims]=useState(stored.achievementClaims??{});
  const[progressionStats,setProgressionStats]=useState(stored.progressionStats??emptyProgressionStats());
  const[permanentQuests,setPermanentQuests]=useState(stored.permanentQuests??{progress:{},claimed:{}});
  const[autoSkillPriorities,setAutoSkillPriorities]=useState(stored.autoSkillPriorities??{});
  const[mythicProgress,setMythicProgress]=useState(()=>{const value=stored.mythicProgress||{},season=mythicSeason().key;return value.season===season?{season,completed:value.completed||0,claimed:value.claimed||{},history:value.history||[]}:{season,completed:0,claimed:{},history:[...(value.history||[]),value.season?{season:value.season,completed:value.completed||0}:null].filter(Boolean).slice(-24)}});
  const[summonerProfile,setSummonerProfile]=useState(stored.summonerProfile??{name:'',level:1,xp:0});
  const[legendaryChronicles,setLegendaryChronicles]=useState(stored.legendaryChronicles||normalizeChronicles());
  const[weekly,setWeekly]=useState(()=>stored.weekly?.key===weekKey()?stored.weekly:freshCycle(weekKey()));
  const[trackedQuests,setTrackedQuests]=useState(stored.trackedQuests??[]);
  const[monthly,setMonthly]=useState(()=>stored.monthly?.key===monthKey()?stored.monthly:freshCycle(monthKey()));
  const[activeMission,setActiveMission]=useState(stored.battleSession?.mission||null);
  const[battleSession,setBattleSession]=useState(stored.battleSession||null);
  const[pendingMission,setPendingMission]=useState(null),[preparationMission,setPreparationMission]=useState(null);
  const[daily,setDaily]=useState(()=>{const value=load('azerune-save-daily',freshDaily());return value.date===day()?value:freshDaily()});

  useEffect(()=>save('azerune-save',{version:29,campaignDifficultyMigrationV28:true,autoSkillPriorities,resonanceOverflowMigrated:true,legendaryChronicles,ascensionEssences,conversionHistory,mythicProgress,activeTeamSlot,teamPresets,achievementClaims,progressionStats,permanentQuests,tutorialRewardClaimed,tutorialAcademy,gems,gold,hearthstones,pityCounter,owned,team,equipment,inventory,history,championProgress,campaign,redeemedCodes,summonerProfile,weekly,monthly,trackedQuests,universalSoul5,masteryTomes,skillLevels,bloodFragments,shopState,raidProgress,forgeEssence,forgeHistory,expeditionProgress,battleSession}),[autoSkillPriorities,legendaryChronicles,ascensionEssences,conversionHistory,mythicProgress,activeTeamSlot,teamPresets,achievementClaims,progressionStats,permanentQuests,tutorialRewardClaimed,tutorialAcademy,gems,gold,hearthstones,pityCounter,owned,team,equipment,inventory,history,championProgress,campaign,redeemedCodes,summonerProfile,weekly,monthly,trackedQuests,universalSoul5,masteryTomes,skillLevels,bloodFragments,shopState,raidProgress,forgeEssence,forgeHistory,expeditionProgress,battleSession]);
  useEffect(()=>save('azerune-save-daily',daily),[daily]);
  useEffect(()=>{
    const checkDailyReset=()=>{
      setDaily(current=>current.date===day()?current:freshDaily());
      setWeekly(current=>current.key===weekKey()?current:freshCycle(weekKey()));
      setMonthly(current=>current.key===monthKey()?current:freshCycle(monthKey()));setMythicProgress(current=>current.season===mythicSeason().key?current:{season:mythicSeason().key,completed:0,claimed:{},history:[...(current.history||[]),{season:current.season,completed:current.completed||0}].slice(-24)});
      setShopState(current=>current.date===day()?current:{date:day(),slotCount:current.slotCount||SHOP_BASE_SLOTS,refreshCount:0,offers:generateShopOffers(current.slotCount||SHOP_BASE_SLOTS)});
      setRaidProgress(current=>current.date===day()?current:{...current,date:day(),attempts:RAID_DAILY_ATTEMPTS});
      setExpeditionProgress(current=>current.date===day()?current:{...current,date:day(),seals:EXPEDITION_DAILY_SEALS,honor:{wins:0,claimed:false,sundayChoice:null,locked:false}});
    };
    checkDailyReset();
    const timer=setInterval(checkDailyReset,30000);
    const onVisibilityChange=()=>{if(document.visibilityState==='visible')checkDailyReset();};
    window.addEventListener('focus',checkDailyReset);
    document.addEventListener('visibilitychange',onVisibilityChange);
    return()=>{
      clearInterval(timer);
      window.removeEventListener('focus',checkDailyReset);
      document.removeEventListener('visibilitychange',onVisibilityChange);
    };
  },[]);

  useEffect(()=>{setTeamPresets(current=>current.map((preset,index)=>index===activeTeamSlot-1?{...preset,members:[...team]}:preset));},[team,activeTeamSlot]);
  const selectTeamPreset=slot=>{const index=Math.max(0,Math.min(8,Number(slot)-1)),preset=teamPresets[index],members=(preset?.members||[]).map(Number).filter(id=>owned.includes(id)).slice(0,3);setActiveTeamSlotState(index+1);setTeam(members);return{ok:true,message:`${preset?.name||`Équipe ${index+1}`} chargée.`};};
  const renameTeamPreset=(slot,name)=>{const index=Math.max(0,Math.min(8,Number(slot)-1)),clean=String(name||'').trim().slice(0,24)||`Équipe ${index+1}`;setTeamPresets(current=>current.map((preset,i)=>i===index?{...preset,name:clean}:preset));return{ok:true,message:`Équipe renommée en ${clean}.`};};
  const saveCurrentTeamToPreset=slot=>{const index=Math.max(0,Math.min(8,Number(slot)-1));setTeamPresets(current=>current.map((preset,i)=>i===index?{...preset,members:[...team]}:preset));return{ok:true,message:`Composition enregistrée dans l’équipe ${index+1}.`};};
  const setTeamMember=(slot,heroId)=>{const index=Math.max(0,Math.min(2,Number(slot)||0)),id=Number(heroId);if(!owned.includes(id))return{ok:false,message:'Ce champion n’est pas possédé.'};let outcome={ok:true};setTeam(current=>{const next=[...current],existing=next.indexOf(id);if(existing===index){outcome.message='Ce champion occupe déjà cet emplacement.';return current}if(existing>=0)next.splice(existing,1);while(next.length<index)next.push(null);next[index]=id;const clean=next.filter((value,pos,array)=>value!=null&&array.indexOf(value)===pos).slice(0,3);outcome.message=`Champion placé dans l’emplacement ${index+1}.`;if(clean.length>=3)emitProgressEvent('teamComposed');return clean});return outcome;};
  const removeTeamMember=slot=>{const index=Math.max(0,Math.min(2,Number(slot)||0));let outcome={ok:true};setTeam(current=>{if(!current[index]){outcome={ok:false,message:'Cet emplacement est déjà vide.'};return current}const next=current.filter((_,i)=>i!==index);outcome.message=`Emplacement ${index+1} libéré.`;return next});return outcome;};
  const clearCurrentTeam=()=>{setTeam([]);return{ok:true,message:'L’équipe active a été vidée.'};};
  const copyTeamPreset=(sourceSlot,targetSlot)=>{const source=Math.max(0,Math.min(8,Number(sourceSlot)-1)),target=Math.max(0,Math.min(8,Number(targetSlot)-1));if(source===target)return{ok:false,message:'Choisis une autre équipe de destination.'};const members=[...(teamPresets[source]?.members||[])];setTeamPresets(current=>current.map((preset,index)=>index===target?{...preset,members}:preset));return{ok:true,message:`Équipe ${source+1} copiée vers Équipe ${target+1}.`};};
  const battleInProgress=Boolean(battleSession?.battle&&!battleSession.battle.winner);
  const requestMissionStart=mission=>{
    if(battleInProgress){setPendingMission(mission);return{ok:false,blocked:true,message:'Un combat est déjà en cours.'};}
    setPreparationMission(mission);return{ok:false,preparation:true};
  };
  const cancelMissionPreparation=()=>setPreparationMission(null);
  const confirmMissionPreparation=(members=team)=>{if(!preparationMission)return{ok:false};const maxMembers=Math.max(1,Math.min(4,Number(preparationMission.teamSize)||3)),clean=[...new Set(members.map(Number).filter(id=>owned.includes(id)))].slice(0,maxMembers);if(!clean.length)return{ok:false,message:'Choisis au moins un champion.'};if(clean.length>=3)emitProgressEvent('teamComposed');if(maxMembers<=3){setTeam(clean);setTeamPresets(current=>current.map((preset,index)=>index===activeTeamSlot-1?{...preset,members:[...clean]}:preset));}const mission=preparationMission,session={format:1,id:`battle-${Date.now()}-${Math.random()}`,mission,team:[...clean],battle:null,target:null,missionReward:null,createdAt:Date.now(),updatedAt:Date.now()};setActiveMission(mission);setBattleSession(session);setPreparationMission(null);setPendingMission(null);return{ok:true,session};};
  const updateBattleSession=patch=>setBattleSession(current=>current?{...current,...(typeof patch==='function'?patch(current):patch),updatedAt:Date.now()}:current);
  const abandonBattle=()=>{setBattleSession(null);setActiveMission(null);setPendingMission(null);setPreparationMission(null);return{ok:true,message:'Le combat a été abandonné sans consommer de tentative.'};};
  const prepareNextMission=(mission,members=team)=>{const completed=Boolean(battleSession?.battle?.winner==='ally'&&battleSession?.battle?.rewarded);if(!mission)return{ok:false,message:'Aucune mission suivante.'};if(!completed)return{ok:false,message:'La victoire précédente doit être enregistrée.'};const maxMembers=Math.max(1,Math.min(4,Number(mission.teamSize)||3)),clean=[...new Set((members||[]).map(Number).filter(id=>owned.includes(id)))].slice(0,maxMembers);if(!clean.length)return{ok:false,message:'Aucune équipe valide.'};setBattleSession(null);setActiveMission(null);setPendingMission(null);if(maxMembers<=3){setTeam(clean);setTeamPresets(current=>current.map((preset,index)=>index===activeTeamSlot-1?{...preset,members:[...clean]}:preset));}setPreparationMission(mission);return{ok:true,preparation:true};};
  const dismissPendingMission=()=>setPendingMission(null);
  const replaceBattleWithPending=()=>{if(!pendingMission)return false;const mission=pendingMission;setBattleSession({format:1,id:`battle-${Date.now()}-${Math.random()}`,mission,team:[...team],battle:null,target:null,missionReward:null,createdAt:Date.now(),updatedAt:Date.now()});setActiveMission(mission);setPendingMission(null);return true;};

  const toggleTrackedQuest=(period,questId)=>{const key=`${period}:${questId}`;let outcome={ok:true};setTrackedQuests(current=>{if(current.includes(key)){outcome.message='Quête retirée du suivi.';return current.filter(item=>item!==key)}if(current.length>=3){outcome={ok:false,message:'Tu peux suivre jusqu’à 3 quêtes.'};return current}outcome.message='Quête ajoutée au suivi.';return[...current,key]});return outcome;};
  const progressQuest=(event,amount=1,payload={})=>{event=event==='skills'?'skillUsed':event;
    const update=(setter,quests)=>setter(current=>{const progress={...current.progress};quests.filter(q=>q.event===event).forEach(q=>{progress[q.id]=Math.min(q.goal,(progress[q.id]||0)+amount)});return{...current,progress}});
    update(setDaily,QUESTS);update(setWeekly,WEEKLY_QUESTS);update(setMonthly,MONTHLY_QUESTS);
    setPermanentQuests(current=>{const progress={...current.progress};(QUEST_GROUPS.progression||[]).filter(q=>q.event===event).forEach(q=>{if(q.mode==='uniqueHeroes'){const key=`${q.id}:heroes`,ids=new Set(progress[key]||[]);if(payload.championId!=null&&Number(payload.value||0)>=Number(q.threshold||0))ids.add(String(payload.championId));progress[key]=[...ids];progress[q.id]=Math.min(q.goal,ids.size);}else if(q.threshold&&Number(payload.value||0)<q.threshold){}else progress[q.id]=Math.min(q.goal,(progress[q.id]||0)+amount)});return{...current,progress}});
  };
  const emitProgressEvent=(event,payload={})=>{const amount=Math.max(0,Number(payload.amount??1)||0);progressQuest(event,amount,payload);};
  const grantReward=reward=>{reward=reward||{};if(reward.gold)setGold(v=>v+reward.gold);if(reward.gems)setGems(v=>v+reward.gems);if(reward.stones)setHearthstones(v=>v+reward.stones);if(reward.essence)setForgeEssence(v=>v+reward.essence);if(reward.masteryTomes)setMasteryTomes(v=>v+reward.masteryTomes);if(reward.universalSoul5)setUniversalSoul5(v=>v+reward.universalSoul5);if(reward.summonerXp)grantSummonerXp(reward.summonerXp);};
  const recordBattleResult=(battle,mission,autoUsed=false)=>{if(!battle?.winner)return;const id=battleSession?.id||battle.id||`${mission?.key||'arena'}:${battle.eventSeq||0}`;setProgressionStats(current=>{if(current.processed?.[id])return current;const rows=Object.values(battle.combatStats||{}),sum=k=>rows.reduce((n,x)=>n+Number(x?.[k]||0),0),won=battle.winner==='ally',bosses=(battle.enemies||[]).filter(x=>x.bossUnit&&x.dead).length,enemies=(battle.enemies||[]).filter(x=>x.dead).length;return{...current,lifetime:{...current.lifetime,battles:{...current.lifetime.battles,completed:current.lifetime.battles.completed+1,won:current.lifetime.battles.won+(won?1:0),autoWins:current.lifetime.battles.autoWins+(won&&autoUsed?1:0),manualWins:current.lifetime.battles.manualWins+(won&&!autoUsed?1:0),flawlessWins:current.lifetime.battles.flawlessWins+(won&&(battle.allies||[]).every(x=>!x.dead)?1:0)},combat:{...current.lifetime.combat,damageDealt:current.lifetime.combat.damageDealt+sum('damage'),damageTaken:current.lifetime.combat.damageTaken+sum('damageTaken'),healingDone:current.lifetime.combat.healingDone+sum('healing'),mitigation:current.lifetime.combat.mitigation+sum('mitigation'),dotDamageDealt:current.lifetime.combat.dotDamageDealt+sum('dotDamage'),shieldAbsorbed:current.lifetime.combat.shieldAbsorbed+sum('shieldMitigation'),criticalDamage:current.lifetime.combat.criticalDamage+sum('criticalDamage'),enemiesDefeated:current.lifetime.combat.enemiesDefeated+enemies,bossesDefeated:current.lifetime.combat.bossesDefeated+bosses},activities:{...current.lifetime.activities,campaignWins:current.lifetime.activities.campaignWins+(won&&mission&&!mission.raid&&!mission.expedition&&!mission.mythic?1:0),expeditionWins:current.lifetime.activities.expeditionWins+(won&&mission?.expedition?1:0),raidWins:current.lifetime.activities.raidWins+(won&&mission?.raid?1:0),mythicWins:current.lifetime.activities.mythicWins+(won&&mission?.mythic?1:0)}},records:{...current.records,mythicHighest:Math.max(current.records.mythicHighest||0,won&&mission?.mythic?mission.mythicLevel||0:0)},processed:{...current.processed,[id]:Date.now()}}});emitProgressEvent('battleCompleted',{amount:1});if(battle.winner==='ally'){if(mission?.raid)emitProgressEvent('raidCompleted');else if(mission?.expedition)emitProgressEvent('expeditionCompleted');else if(mission?.mythic)emitProgressEvent('mythicCompleted');else if(mission)emitProgressEvent('campaignCompleted');const bosses=(battle.enemies||[]).filter(x=>x.bossUnit&&x.dead).length;if(bosses)emitProgressEvent('bossDefeated',{amount:bosses});const rows=Object.values(battle.combatStats||{});emitProgressEvent('dotDamageDealt',{amount:rows.reduce((n,x)=>n+(x.dotDamage||0),0)});emitProgressEvent('supportDone',{amount:rows.reduce((n,x)=>n+(x.healing||0)+(x.mitigation||0),0)});}};
  const grantSummonerXp=amount=>setSummonerProfile(current=>{let level=current.level,xp=current.xp+Math.max(0,amount);while(level<SUMMONER_MAX_LEVEL&&xp>=summonerXpRequired(level)){xp-=summonerXpRequired(level);level+=1;}if(level>=SUMMONER_MAX_LEVEL)xp=0;return{...current,level,xp};});
  const setSummonerName=name=>{const clean=String(name||'').trim().slice(0,20);setSummonerProfile(current=>({...current,name:clean}));if(clean)emitProgressEvent('summonerNamed');};
  const isUnlocked=level=>summonerProfile.level>=level;
  const cycleState={daily,weekly,monthly,progression:permanentQuests};
  const cycleSetter={daily:setDaily,weekly:setWeekly,monthly:setMonthly,progression:setPermanentQuests};
  const claimQuest=(period,questId)=>{const quests=QUEST_GROUPS[period],quest=quests?.find(item=>item.id===questId),state=cycleState[period],setter=cycleSetter[period];if(!quest||!state||state.claimed[questId]||(state.progress[questId]||0)<quest.goal)return false;const reward=quest.reward||{};grantReward(reward);setter(current=>({...current,claimed:{...current.claimed,[questId]:true}}));if(period==='weekly')emitProgressEvent('weeklyQuestClaimed');return true;};
  const claimQuestChest=period=>{const quests=QUEST_GROUPS[period],state=cycleState[period],setter=cycleSetter[period],reward=FINAL_CHESTS[period];const required=QUEST_PERIOD_CONFIG?.[period]?.requiredForChest||quests.length;if(!quests||Object.keys(state.claimed||{}).filter(id=>state.claimed[id]&&quests.some(q=>q.id===id)).length<required||state.bonus)return false;grantReward(reward);setter(current=>({...current,bonus:true}));return true;};
  const getProgress=hero=>normalizeChampionProgress(hero,championProgress[hero.id]||defaultChampionProgress(hero));
  const grantXp=(heroIds,amount)=>setChampionProgress(current=>{const next={...current};heroIds.forEach(id=>{const hero=HEROES.find(entry=>entry.id===id);if(hero){next[id]=addChampionXp(hero,next[id],amount);emitProgressEvent('heroLevelReached',{championId:id,value:next[id].level});}});return next});
  const getEvolutionStatus=hero=>evolutionStatus(hero,getProgress(hero),ascensionEssences,gold);
  const evolveHero=heroId=>{
    const hero=HEROES.find(entry=>entry.id===heroId);if(!hero)return{ok:false,message:'Champion introuvable.'};
    const status=getEvolutionStatus(hero);if(!status.canEvolve)return{ok:false,message:'Les conditions d’Ascension ne sont pas remplies.',status};
    const result=evolveChampion(hero,status.progress);if(!result.ok)return{ok:false,message:'Ascension impossible.',status};
    setGold(value=>value-status.cost.gold);setAscensionEssences(value=>({minor:value.minor-status.cost.minor,major:value.major-status.cost.major,mythic:value.mythic-status.cost.mythic}));
    setChampionProgress(current=>({...current,[heroId]:result.progress}));emitProgressEvent('heroAscended',{championId:heroId,value:result.progress.stars});emitProgressEvent('heroStarReached',{championId:heroId,value:result.progress.stars});
    return{ok:true,message:`${hero.name} atteint ${result.progress.stars}★ et revient au niveau 1.`,progress:result.progress};
  };
  const getResonanceStatus=hero=>resonanceStatus(hero,getProgress(hero));
  const reinforceResonance=heroId=>{const hero=HEROES.find(entry=>entry.id===heroId);if(!hero)return{ok:false,message:'Champion introuvable.'};const result=strengthenResonance(hero,getProgress(hero));if(!result.ok)return{ok:false,message:result.status.maxed?'Résonance maximale atteinte.':`Il faut ${result.status.required} Fragment(s) d’âme.`,status:result.status};setChampionProgress(current=>({...current,[heroId]:result.progress}));emitProgressEvent('resonanceUpgraded',{championId:heroId,value:result.progress.resonance});emitProgressEvent('resonanceReached',{championId:heroId,value:result.progress.resonance});return{ok:true,message:`${hero.name} atteint la Résonance ${result.progress.resonance}.`,progress:result.progress};};
  const convertAscensionEssence=(from,batches=1)=>{const source=from==='minor'?'minor':'major',target=source==='minor'?'major':'mythic',available=Math.floor((ascensionEssences[source]||0)/10),count=batches==='max'?available:Math.max(0,Math.min(available,Math.floor(Number(batches)||0)));if(count<1)return{ok:false,message:'Quantité insuffisante pour cette conversion.'};const spent=count*10;setAscensionEssences(value=>({...value,[source]:value[source]-spent,[target]:value[target]+count}));const entry={id:`conversion-${Date.now()}-${Math.random()}`,date:new Date().toLocaleString('fr-FR'),from:source,to:target,spent,received:count};setConversionHistory(value=>[entry,...value].slice(0,50));return{ok:true,message:`${spent} Essences ${source==='minor'?'mineures':'majeures'} converties en ${count} Essence(s) ${target==='major'?'majeure(s)':'mythique(s)'}.`,entry};};
  const getAutoSkillPriority=heroId=>{const value=autoSkillPriorities?.[heroId];return Array.isArray(value)&&value.length===3?[...value]:[2,1,0];};
  const setAutoSkillPriority=(heroId,order)=>{const clean=[...new Set((order||[]).map(Number).filter(index=>index>=0&&index<3))];if(clean.length!==3)return{ok:false,message:'Ordre AUTO invalide.'};setAutoSkillPriorities(current=>({...current,[heroId]:clean}));return{ok:true,message:'Priorités AUTO enregistrées.'};};
  const resetAutoSkillPriority=heroId=>{setAutoSkillPriorities(current=>{const next={...current};delete next[heroId];return next});return{ok:true,message:'Priorités AUTO réinitialisées.'};};
  const getSkillInfo=(hero,index)=>skillInfo(hero,index,skillLevels[hero.id]);
  const upgradeSkill=(heroId,index)=>{
    const hero=HEROES.find(entry=>entry.id===heroId);if(!hero)return{ok:false,message:'Champion introuvable.'};
    const info=getSkillInfo(hero,index);if(info.maxed)return{ok:false,message:'Cette compétence est déjà au maximum.'};
    if(masteryTomes<1)return{ok:false,message:'Il faut 1 Tome de maîtrise.'};
    if(gold<info.cost)return{ok:false,message:`Il faut ${info.cost.toLocaleString('fr-FR')} or.`};
    setMasteryTomes(value=>value-1);setGold(value=>value-info.cost);
    setSkillLevels(current=>({...current,[heroId]:{...(current[heroId]||{}),[index]:Math.min(skillMaxLevel(index),info.level+1)}}));
    return{ok:true,message:`${hero.skills[index].name} passe au niveau ${info.level+1}.`};
  };

  const completeTutorialReward=()=>{if(tutorialRewardClaimed)return{ok:false,alreadyClaimed:true};setGold(value=>value+300);setGems(value=>value+100);setTutorialRewardClaimed(true);return{ok:true,gold:300,gems:100};};

  const completeAcademyTutorial=id=>{if(!ACADEMY_TUTORIALS.some(item=>item.id===id))return{ok:false,message:'Leçon inconnue.'};setTutorialAcademy(current=>({...current,completed:{...current.completed,[id]:current.completed[id]||Date.now()}}));return{ok:true,message:'Leçon terminée.'};};
  const claimAcademyTutorial=id=>{if(!ACADEMY_TUTORIALS.some(item=>item.id===id))return{ok:false,message:'Leçon inconnue.'};if(!tutorialAcademy.completed[id])return{ok:false,message:'Termine d’abord cette leçon.'};if(tutorialAcademy.claimed[id]||academyRewardLocks.current.has(id))return{ok:false,message:'Récompense déjà récupérée.'};academyRewardLocks.current.add(id);setGems(value=>value+ACADEMY_REWARD);setTutorialAcademy(current=>({...current,claimed:{...current.claimed,[id]:current.claimed[id]||Date.now()}}));return{ok:true,message:`${ACADEMY_REWARD} Cristaux récupérés.`};};
  const claimAcademyFinal=()=>{const allDone=ACADEMY_TUTORIALS.every(item=>tutorialAcademy.completed[item.id]);if(!allDone)return{ok:false,message:`Termine les ${ACADEMY_TUTORIALS.length} leçons.`};if(tutorialAcademy.finalClaimed||academyRewardLocks.current.has('final'))return{ok:false,message:'Récompense finale déjà récupérée.'};academyRewardLocks.current.add('final');setGold(value=>value+ACADEMY_FINAL_REWARD.gold);setHearthstones(value=>value+ACADEMY_FINAL_REWARD.stones);setTutorialAcademy(current=>({...current,finalClaimed:true}));return{ok:true,message:`Récompense finale reçue : ${ACADEMY_FINAL_REWARD.gold} Or et ${ACADEMY_FINAL_REWARD.stones} Pierre${ACADEMY_FINAL_REWARD.stones>1?'s':''} de foyer.`};};
  const summonRates={3:.80,4:.185,5:.015};
  const pickHero=(forcedFive=false,minimumRarity=3)=>{
    let rarity;
    if(forcedFive)rarity=5;
    else if(minimumRarity>=4){
      // Le tirage garanti du x10 conserve le taux naturel de 5★ à 1,5 %.
      // Si le jet n'est pas un 5★, le résultat est converti en 4★.
      rarity=Math.random()<summonRates[5]?5:4;
    }else{
      const roll=Math.random();
      rarity=roll<summonRates[5]?5:roll<summonRates[5]+summonRates[4]?4:3;
    }
    const pool=HEROES.filter(hero=>hero.rarity===rarity);
    return pool[Math.floor(Math.random()*pool.length)];
  };
  const summonMany=(count,currency)=>{
    const cost=currency==='stone'?count:(count===10?900:count*100);
    if(currency==='stone'&&hearthstones<cost)return null;
    if(currency==='gems'&&gems<cost)return null;
    if(currency==='stone')setHearthstones(value=>value-cost);else setGems(value=>value-cost);
    let ownedDraft=[...owned],progressDraft={...championProgress},pityDraft=pityCounter;
    const results=[];
    let obtainedFourPlus=false,bloodGained=0;
    for(let index=0;index<count;index+=1){
      const pityGuaranteed=pityDraft>=99;
      const x10Guarantee=count===10&&index===9&&!obtainedFourPlus&&!pityGuaranteed;
      const hero=pickHero(pityGuaranteed,x10Guarantee?4:3);
      const naturalFive=hero.rarity===5;
      if(hero.rarity>=4)obtainedFourPlus=true;
      pityDraft=naturalFive?0:pityDraft+1;
      const duplicate=ownedDraft.includes(hero.id);
      let outcome;
      if(!duplicate){ownedDraft.push(hero.id);progressDraft[hero.id]=defaultChampionProgress(hero);outcome={progress:progressDraft[hero.id],result:'new'};}
      else{outcome=evolveFromDuplicate(hero,progressDraft[hero.id]);progressDraft[hero.id]=outcome.progress;if(outcome.bloodFragments)bloodGained+=outcome.bloodFragments;}
      results.push({...hero,duplicate,summonResult:outcome.result,progress:outcome.progress,pityGuaranteed,x10Guaranteed:x10Guarantee});
    }
    setOwned(ownedDraft);setChampionProgress(progressDraft);setPityCounter(pityDraft);if(bloodGained)setBloodFragments(value=>value+bloodGained);
    const now=new Date().toLocaleString('fr-FR');
    setHistory(current=>[...results.map((hero,index)=>({id:Date.now()+index+Math.random(),name:hero.name,icon:hero.icon,rarity:hero.rarity,duplicate:hero.duplicate,result:hero.summonResult,stars:hero.progress.stars,level:hero.progress.level,soulFragments:hero.progress.soulFragments,bloodFragments:hero.bloodFragments||0,pityGuaranteed:hero.pityGuaranteed,x10Guaranteed:hero.x10Guaranteed,date:now})),...current].slice(0,50));
    progressQuest('summon',count);emitProgressEvent('heroSummoned',{amount:count});setProgressionStats(current=>({...current,lifetime:{...current.lifetime,summons:{...current.lifetime.summons,total:current.lifetime.summons.total+count,multi10:current.lifetime.summons.multi10+(count===10?1:0),newHeroes:current.lifetime.summons.newHeroes+results.filter(x=>!x.duplicate).length,duplicates:current.lifetime.summons.duplicates+results.filter(x=>x.duplicate).length,rarity4:current.lifetime.summons.rarity4+results.filter(x=>x.rarity===4).length,rarity5:current.lifetime.summons.rarity5+results.filter(x=>x.rarity===5).length,pity:current.lifetime.summons.pity+results.filter(x=>x.pityGuaranteed).length,gemsSpent:current.lifetime.summons.gemsSpent+(currency==='gems'?cost:0),stonesSpent:current.lifetime.summons.stonesSpent+(currency==='stone'?cost:0)}}}));
    grantSummonerXp(count*8);
    return results;
  };
  const summon=()=>summonMany(1,'gems')?.[0]||null;

  const redeemCode=input=>{
    const code=normalizeCode(input||'');
    const promo=PROMO_CODES[code];
    if(!code)return{ok:false,message:'Entre un code.'};
    if(!promo)return{ok:false,message:'Code invalide.'};
    if(!promo.repeatable&&redeemedCodes.includes(code))return{ok:false,message:'Ce code a déjà été utilisé.'};
    let message='';
    if(promo.heroId){
      const hero=HEROES.find(entry=>entry.id===promo.heroId);
      if(!hero)return{ok:false,message:'Champion introuvable.'};
      if(owned.includes(hero.id)){
        setGems(value=>value+500);setHearthstones(value=>value+3);
        message=`${hero.name} est déjà possédé : compensation de 500 cristaux et 3 Pierres de foyer.`;
      }else{
        setOwned(value=>[...value,hero.id]);
        setChampionProgress(current=>({...current,[hero.id]:defaultChampionProgress(hero)}));
        message=`${hero.name} a été débloqué au niveau 1 et à son rang naturel 5★.`;
      }
    }else{
      const reward=promo.reward||{};
      if(reward.gems)setGems(value=>value+reward.gems);
      if(reward.gold)setGold(value=>value+reward.gold);
      if(reward.stones)setHearthstones(value=>value+reward.stones);
      const parts=[reward.gems?`${reward.gems} cristaux`:null,reward.gold?`${reward.gold} or`:null,reward.stones?`${reward.stones} Pierres de foyer`:null].filter(Boolean);
      message=`${promo.label} reçu : ${parts.join(', ')}.`;
    }
    if(!promo.repeatable)setRedeemedCodes(value=>[...value,code]);
    return{ok:true,message};
  };

  const shopRefreshCost=SHOP_REFRESH_COSTS[shopState.refreshCount]||0;
  const shopNextRotation=(()=>{const next=new Date();next.setHours(24,0,0,0);return next.getTime()})();
  const refreshShop=()=>{
    if(shopState.refreshCount>=SHOP_MAX_REFRESHES)return{ok:false,message:'Limite quotidienne de rafraîchissements atteinte.'};
    const cost=SHOP_REFRESH_COSTS[shopState.refreshCount];if(gems<cost)return{ok:false,message:`Il faut ${cost} cristaux.`};
    setGems(value=>value-cost);setShopState(current=>({...current,refreshCount:current.refreshCount+1,offers:generateShopOffers(current.slotCount)}));return{ok:true,message:'Les offres de la boutique ont été renouvelées.'};
  };
  const unlockShopSlot=()=>{
    if(shopState.slotCount>=SHOP_MAX_SLOTS)return{ok:false,message:'Tous les emplacements sont déjà débloqués.'};
    const next=shopState.slotCount+1,cost=SHOP_SLOT_COSTS[next];if(gems<cost)return{ok:false,message:`Il faut ${cost} cristaux.`};
    setGems(value=>value-cost);setShopState(current=>({...current,slotCount:next,offers:[...current.offers,...generateShopOffers(1)]}));return{ok:true,message:`Le ${next}e emplacement de boutique est débloqué définitivement.`};
  };
  const buyShopOffer=offerId=>{
    const item=shopState.offers.find(entry=>entry.id===offerId);if(!item)return{ok:false,message:'Offre introuvable.'};if(item.sold>=item.stock)return{ok:false,message:'Cette offre est déjà vendue.'};
    const balance=item.currency==='gold'?gold:item.currency==='gems'?gems:bloodFragments;if(balance<item.price)return{ok:false,message:'Solde insuffisant.'};
    if(item.type==='gear'&&inventory.length>=300)return{ok:false,message:'Inventaire plein : 300/300 objets.'};
    if(item.currency==='gold')setGold(value=>value-item.price);else if(item.currency==='gems')setGems(value=>value-item.price);else setBloodFragments(value=>value-item.price);
    if(item.type==='gems')setGems(value=>value+item.amount);if(item.type==='stones')setHearthstones(value=>value+item.amount);if(item.type==='masteryTomes')setMasteryTomes(value=>value+item.amount);if(item.type==='universalSoul5')setUniversalSoul5(value=>value+item.amount);if(item.type==='gear')setInventory(current=>[generateShopItem(item.gear),...current]);
    setShopState(current=>({...current,offers:current.offers.map(entry=>entry.id===offerId?{...entry,sold:entry.sold+1}:entry)}));return{ok:true,message:`${item.name} acheté avec succès.`};
  };

  const addForgeHistory=entry=>setForgeHistory(current=>[{id:`forge-${Date.now()}-${Math.random()}`,date:new Date().toLocaleString('fr-FR'),...entry},...current].slice(0,100));
  const getItemUpgradeCost=itemId=>{const item=inventory.find(entry=>entry.id===itemId);return item?upgradeCost(item):null;};
  const upgradeItem=itemId=>{
    const item=inventory.find(entry=>entry.id===itemId);if(!item)return{ok:false,message:'Objet introuvable.'};
    const cost=upgradeCost(item);if(!cost)return{ok:false,message:'Cet équipement est déjà +15.'};
    if(gold<cost.gold)return{ok:false,message:`Il faut ${cost.gold.toLocaleString('fr-FR')} or.`};
    if(forgeEssence<cost.essence)return{ok:false,message:`Il faut ${cost.essence} Essences de forge.`};
    const result=forgeUpgradeItem(item);if(!result.ok)return result;
    setGold(value=>value-cost.gold);setForgeEssence(value=>value-cost.essence);setInventory(current=>current.map(entry=>entry.id===itemId?result.item:entry));
    const detail=result.changes[0];emitProgressEvent('itemUpgraded');setProgressionStats(current=>({...current,lifetime:{...current.lifetime,forge:{...current.lifetime.forge,upgrades:current.lifetime.forge.upgrades+1,goldSpent:current.lifetime.forge.goldSpent+cost.gold,essenceSpent:current.lifetime.forge.essenceSpent+cost.essence}}}));addForgeHistory({type:'upgrade',itemName:item.name,itemIcon:item.icon,level:result.item.level,gold:cost.gold,essence:cost.essence,detail:detail?`${detail.type==='add'?'Nouvelle statistique':'Statistique améliorée'} : ${detail.stat} +${detail.value}`:'Statistique principale renforcée'});
    return{ok:true,item:result.item,cost,changes:result.changes,message:`${item.name} passe à +${result.item.level}.`};
  };
  const itemRecycleValue=item=>recycleEssenceValue(item);
  const recycleItem=itemId=>{
    const item=inventory.find(entry=>entry.id===itemId);if(!item)return{ok:false,message:'Objet introuvable.'};
    if(item.unique)return{ok:false,message:'Une arme Unique ne peut pas être recyclée.'};if(item.locked)return{ok:false,message:'Déverrouille cet objet avant de le recycler.'};
    if(Object.values(equipment).some(gear=>Object.values(gear||{}).includes(itemId)))return{ok:false,message:'Retire cet objet du champion avant de le recycler.'};
    const value=recycleEssenceValue(item);emitProgressEvent('itemRecycled');setProgressionStats(current=>({...current,lifetime:{...current.lifetime,forge:{...current.lifetime.forge,recycles:current.lifetime.forge.recycles+1}}}));setForgeEssence(current=>current+value);setInventory(current=>current.filter(entry=>entry.id!==itemId));addForgeHistory({type:'recycle',itemName:item.name,itemIcon:item.icon,level:item.level||0,essence:value,detail:`${item.stars}★ · ${QUALITIES[item.quality]?.name||item.quality}`});return{ok:true,value,message:`${item.name} recyclé pour ${value} Essences de forge.`};
  };

  const difficultyUnlocked=id=>{
    const order=['normal','hard','hardcore'],index=order.indexOf(id);
    if(index<=0)return true;
    return allMissionKeys(order[index-1]).every(key=>(campaign.scores[key]||0)>0);
  };
  const continentUnlocked=(difficultyId,continentIndex)=>continentIndex===0||CONTINENTS[continentIndex-1].stages.every(item=>(campaign.scores[`${difficultyId}:${CONTINENTS[continentIndex-1].id}:${item.id}`]||0)>0);
  const stageUnlocked=(difficultyId,continent,stageIndex)=>stageIndex===0||((campaign.scores[`${difficultyId}:${continent.id}:${continent.stages[stageIndex-1].id}`]||0)>0);
  const difficultyStars=difficultyId=>Object.entries(campaign.scores).filter(([key])=>key.startsWith(`${difficultyId}:`)).reduce((sum,[,stars])=>sum+stars,0);
  const claimCampaignMilestone=(difficultyId,milestone)=>{
    const key=milestoneKey(difficultyId,milestone.stars);
    if(difficultyStars(difficultyId)<milestone.stars||campaign.claimedMilestones?.[key])return false;
    const reward=milestone.reward||{};if(reward.gold)setGold(value=>value+reward.gold);if(reward.gems)setGems(value=>value+reward.gems);if(reward.stones)setHearthstones(value=>value+reward.stones);if(reward.essence||reward.forgeEssence)setForgeEssence(value=>value+(reward.essence||reward.forgeEssence));if(reward.minor||reward.major||reward.mythic)setAscensionEssences(value=>({minor:value.minor+(reward.minor||0),major:value.major+(reward.major||0),mythic:value.mythic+(reward.mythic||0)}));if(reward.tomes)setMasteryTomes(value=>value+reward.tomes);if(reward.souls)setUniversalSoul5(value=>value+reward.souls);if(reward.blood)setBloodFragments(value=>value+reward.blood);
    setCampaign(current=>({...current,claimedMilestones:{...(current.claimedMilestones||{}),[key]:true}}));
    return true;
  };


  const grantRelic=(relicId,source='Activité légendaire')=>{const relic=RELICS.find(r=>r.id===relicId);if(!relic)return{ok:false};if(legendaryChronicles.relics[relicId]?.owned||legendaryChronicles.completed[relic.weaponId])return{ok:false,duplicate:true};setLegendaryChronicles(v=>({...v,relics:{...v.relics,[relicId]:{owned:1,activated:false,obtainedAt:Date.now(),source}}}));return{ok:true,relic};};
  const activateRelic=relicId=>{const relic=RELICS.find(r=>r.id===relicId),entry=legendaryChronicles.relics[relicId];if(!relic||!entry?.owned)return{ok:false,message:'Relique introuvable.'};if(entry.activated)return{ok:false,message:'Cette relique a déjà été activée.'};setLegendaryChronicles(v=>({...v,relics:{...v.relics,[relicId]:{...v.relics[relicId],activated:true}},active:{...v.active,[relic.weaponId]:v.active[relic.weaponId]||{step:0,progress:{},startedAt:Date.now()}}}));return{ok:true,message:`Chronique activée : ${UNIQUE_WEAPONS[relic.weaponId].name}.`};};
  const addLegendaryMaterial=(id,amount=1)=>setLegendaryChronicles(v=>({...v,materials:{...v.materials,[id]:(v.materials[id]||0)+amount}}));
  const setChronicleStep=(weaponId,step)=>setLegendaryChronicles(v=>({...v,active:{...v.active,[weaponId]:{...(v.active[weaponId]||{}),step:Math.max(0,Math.min((CHRONICLE_STEPS[weaponId]?.length||1)-1,step))}}}));
  const chooseUniqueOrientation=(weaponId,orientation)=>{if(weaponId!=='sepulchral'||!['purified','corrupted'].includes(orientation))return{ok:false,message:'Orientation invalide.'};setLegendaryChronicles(v=>({...v,orientations:{...v.orientations,[weaponId]:orientation}}));return{ok:true,message:orientation==='purified'?'Cendre-Sépulcrale sera purifiée.':'Cendre-Sépulcrale sera corrompue.'};};
  const forgeUniqueWeapon=(weaponId,setId)=>{const w=UNIQUE_WEAPONS[weaponId];if(!w||!legendaryChronicles.active[weaponId])return{ok:false,message:'Chronique inactive.'};if(legendaryChronicles.obtainedWeapons[weaponId]||inventory.some(i=>i.uniqueId===weaponId))return{ok:false,message:'Cette arme Unique existe déjà.'};if(w.orientation&&!legendaryChronicles.orientations[weaponId])return{ok:false,message:'Choisis d’abord une orientation.'};const item=createUniqueWeapon(weaponId,setId,legendaryChronicles.orientations[weaponId]);setInventory(v=>[item,...v].slice(0,300));emitProgressEvent('uniqueWeaponForged');setProgressionStats(current=>({...current,lifetime:{...current.lifetime,chronicles:{...current.lifetime.chronicles,uniqueWeaponsForged:current.lifetime.chronicles.uniqueWeaponsForged+1}}}));setLegendaryChronicles(v=>{const active={...v.active};delete active[weaponId];return{...v,active,completed:{...v.completed,[weaponId]:Date.now()},obtainedWeapons:{...v.obtainedWeapons,[weaponId]:true}}});return{ok:true,item,message:`${w.name} a été forgée.`};};
  const harmonizeUniqueWeapon=(itemId,setId)=>{const item=inventory.find(i=>i.id===itemId);if(!item?.unique||!SETS_SAFE(setId))return{ok:false,message:'Arme ou set invalide.'};if(itemOwner(itemId))return{ok:false,message:'Retire l’arme avant de modifier son set.'};const changed=Boolean(item.harmonizedOnce);if(changed&&(gold<2500||forgeEssence<250))return{ok:false,message:'Il faut 2 500 or et 250 Essences de forge.'};if(changed){setGold(v=>v-2500);setForgeEssence(v=>v-250)}setInventory(v=>v.map(i=>i.id===itemId?{...i,setId,harmonizedOnce:true}:i));return{ok:true,message:`Set harmonisé : ${setId}.`};};
  const SETS_SAFE=id=>['vitality','accuracy','lifesteal','defense','attack','protection','speed','critical','resistance','destruction','counter','endurance','incendiary','volcanicFury','fireproof'].includes(id);
  const getUniqueWeaponForHero=hero=>{const id=equipment[hero.id]?.Arme,item=inventory.find(i=>i.id===id);return item?.unique?item:null;};
  const rollLegendaryMythic=mission=>{const l=mission.mythicLevel,boss=mission.bossInfo?.name||'';let candidates=[];if(l===20)candidates.push(['storm-left',.0006],['ash-shard',.0005]);if(l===30)candidates.push(['storm-right',.0008]);if(l>=25&&l<=29)candidates.push(['fallen-plume',.0003]);if(l===30)candidates.push(['fallen-plume',.001]);if(l>=18&&l<=20)candidates.push(['first-plague',.0004]);if(l>=21&&l<=29)candidates.push(['first-plague',.0006]);if(l===30&&boss.includes('Astreon'))candidates.push(['eclipse-string',.0015]);for(const [id,chance] of candidates)if(Math.random()<chance){const r=grantRelic(id,`Mythic+ ${l}`);if(r.ok)return r}return null;};

  const itemOwner=itemId=>{const found=Object.entries(equipment).find(([,gear])=>Object.values(gear||{}).includes(itemId));if(!found)return null;const hero=HEROES.find(entry=>entry.id===Number(found[0]));return hero?{heroId:hero.id,hero,slot:Object.entries(found[1]||{}).find(([,id])=>id===itemId)?.[0]||null}:null;};
  const equipItem=(heroId,itemId)=>{
    const item=inventory.find(entry=>entry.id===itemId),targetHero=HEROES.find(entry=>entry.id===heroId);if(!item||!targetHero||!SLOTS.includes(item.slot))return{ok:false,message:'Équipement ou champion introuvable.'};
    if(item.unique&&!item.compatibleHeroes?.includes(targetHero.name))return{ok:false,message:`${item.name} ne répond pas à ${targetHero.name}.`};
    const owner=itemOwner(itemId),replacedId=equipment[heroId]?.[item.slot],replacedItem=inventory.find(entry=>entry.id===replacedId);
    setEquipment(current=>{const next=Object.fromEntries(Object.entries(current).map(([id,gear])=>[id,{...(gear||{})}]));Object.keys(next).forEach(id=>{Object.keys(next[id]).forEach(slot=>{if(next[id][slot]===itemId)delete next[id][slot]})});next[heroId]={...(next[heroId]||{}),[item.slot]:itemId};return next});
    const transferred=owner&&owner.heroId!==heroId;emitProgressEvent('itemEquipped');setProgressionStats(current=>({...current,lifetime:{...current.lifetime,forge:{...current.lifetime.forge,equipped:current.lifetime.forge.equipped+1,transfers:current.lifetime.forge.transfers+(transferred?1:0)}}}));return{ok:true,transferred,previousOwner:owner?.hero?.name||null,replacedItem:replacedItem?.name||null,message:transferred?`${item.name} a été retiré de ${owner.hero.name} et équipé sur ${targetHero.name}.${replacedItem?` ${replacedItem.name} retourne dans l’inventaire.`:''}`:`${item.name} équipé sur ${targetHero.name}.${replacedItem&&replacedId!==itemId?` ${replacedItem.name} retourne dans l’inventaire.`:''}`};
  };
  const unequipSlot=(heroId,slot)=>setEquipment(current=>{const gear={...(current[heroId]||{})};delete gear[slot];return{...current,[heroId]:gear}});
  const toggleItemLock=itemId=>setInventory(current=>current.map(item=>item.id===itemId?{...item,locked:!item.locked}:item));
  const itemSellValue=item=>item?Math.round((item.itemLevel+10)*item.stars*({normal:1,common:1.3,rare:1.8,epic:2.7,legendary:5}[item.quality]||1)):0;
  const sellItem=itemId=>{
    const item=inventory.find(entry=>entry.id===itemId);
    if(!item)return{ok:false,message:'Objet introuvable.'};
    if(item.unique)return{ok:false,message:'Une arme Unique ne peut pas être vendue.'};if(item.locked)return{ok:false,message:'Déverrouille cet objet avant de le vendre.'};
    if(Object.values(equipment).some(gear=>Object.values(gear||{}).includes(itemId)))return{ok:false,message:'Retire cet objet du champion avant de le vendre.'};
    const value=itemSellValue(item);
    setGold(current=>current+value);
    setInventory(current=>current.filter(entry=>entry.id!==itemId));
    return{ok:true,value,message:`${item.name} vendu pour ${value.toLocaleString('fr-FR')} or.`};
  };
  const campaignFarmLootRate=mission=>{const rates={normal:{stage:42,boss:58},hard:{stage:54,boss:68},hardcore:{stage:66,boss:80}},entry=rates[mission.difficultyId]||rates.normal;return mission.boss?entry.boss:entry.stage;};
  const rollCampaignLoot=(mission,guaranteed=false)=>{const lootChance=campaignFarmLootRate(mission),dropped=guaranteed||Math.random()<lootChance/100;if(!dropped)return{item:null,lootChance};const setIds=mission.setIds||[mission.setId].filter(Boolean),randomSetId=setIds[Math.floor(Math.random()*setIds.length)]||mission.setId,item=generateCampaignItem({...mission,setId:randomSetId});setInventory(current=>[item,...current].slice(0,300));return{item,lootChance};};
  const claimAchievement=id=>{const achievement=ACHIEVEMENTS.find(item=>item.id===id);if(!achievement)return{ok:false,message:'Haut fait introuvable.'};if(achievementClaims[id])return{ok:false,message:'Récompense déjà réclamée.'};const achievementState={campaign,expeditionProgress,raidProgress,mythicProgress,owned,championProgress,forgeHistory,inventory,history,legendaryChronicles,progressionStats};if(!achievementReady(achievement,achievementState))return{ok:false,message:'Objectif non terminé.'};const reward=achievement.reward||{};if(reward.gold)setGold(value=>value+reward.gold);if(reward.gems)setGems(value=>value+reward.gems);if(reward.essence)setForgeEssence(value=>value+reward.essence);const gear=[...(reward.gear?[reward.gear]:[]),...(reward.gearPack||[])].map(generateAchievementItem);if(gear.length)setInventory(current=>[...gear,...current].slice(0,300));setAchievementClaims(current=>({...current,[id]:Date.now()}));return{ok:true,message:`Récompense de ${achievement.name} reçue.`};};
  const finishMythicMission=mission=>{const uniqueRelic=rollLegendaryMythic(mission);const level=mission.mythicLevel,reward=mission.reward||{},first=!mythicProgress.claimed?.[level];if(!first)return{mythic:true,first:false,gold:0,gems:0,essence:0,uniqueRelic};if(reward.gold)setGold(v=>v+reward.gold);if(reward.gems)setGems(v=>v+reward.gems);if(reward.stones)setHearthstones(v=>v+reward.stones);if(reward.essence)setForgeEssence(v=>v+reward.essence);if(reward.tomes)setMasteryTomes(v=>v+reward.tomes);if(reward.souls)setUniversalSoul5(v=>v+reward.souls);const loot=reward.gear?generateMythicItem({level,source:`Mythic+ · ${mission.mythicSeason} · Niveau ${level}`}):null;if(loot)setInventory(v=>[loot,...v].slice(0,300));setMythicProgress(current=>({...current,completed:Math.max(current.completed||0,level),claimed:{...(current.claimed||{}),[level]:true}}));emitProgressEvent('mythicLevelReached',{amount:1,value:level});return{mythic:true,first:true,gold:reward.gold||0,gems:reward.gems||0,essence:reward.essence||0,stones:reward.stones||0,tomes:reward.tomes||0,souls:reward.souls||0,loot,uniqueRelic};};
  const chooseSundayExpeditionHonor=id=>{if(new Date().getDay()!==0)return{ok:false,message:'Le choix manuel est réservé au dimanche.'};if(!EXPEDITIONS.some(entry=>entry.id===id))return{ok:false,message:'Expédition inconnue.'};if(expeditionProgress.honor?.locked)return{ok:false,message:'Le choix du dimanche est déjà verrouillé.'};setExpeditionProgress(current=>({...current,honor:{...(current.honor||{}),sundayChoice:id,locked:true}}));return{ok:true,message:'Expédition à l’honneur choisie pour aujourd’hui.'};};
  const claimExpeditionHonor=()=>{const honor=expeditionProgress.honor||{},featuredId=expeditionHonorForDate(new Date(),honor.sundayChoice),reward=expeditionHonorReward(featuredId);if(!featuredId||!reward)return{ok:false,message:'Choisis d’abord l’Expédition à l’honneur.'};if(honor.claimed)return{ok:false,message:'Le coffre a déjà été récupéré aujourd’hui.'};if((honor.wins||0)<EXPEDITION_HONOR_WINS)return{ok:false,message:`Il faut ${EXPEDITION_HONOR_WINS} victoires récompensées.`};if(reward.gold)setGold(value=>value+reward.gold);if(reward.xp)grantXp(team,reward.xp);if(reward.essence)setForgeEssence(value=>value+reward.essence);if(reward.ascension)setAscensionEssences(value=>({minor:value.minor+(reward.ascension.minor||0),major:value.major+(reward.ascension.major||0),mythic:value.mythic+(reward.ascension.mythic||0)}));setExpeditionProgress(current=>({...current,honor:{...(current.honor||{}),claimed:true,locked:true}}));return{ok:true,message:`Coffre quotidien reçu : ${reward.label}.`};};
  const finishExpeditionMission=mission=>{
    const id=mission.expeditionId,level=mission.expeditionLevel,key=mission.key,first=!expeditionProgress.firstWins?.[key],rewarded=expeditionProgress.seals>0,base=mission.expeditionData.reward,factor=first?1.25:1,amount=typeof base==='number'?(rewarded?Math.round(base*factor):0):0,ascension=typeof base==='object'&&rewarded?Object.fromEntries(Object.entries(base).map(([grade,value])=>[grade,Math.round(value*factor)])):{minor:0,major:0,mythic:0};
    const loot=rewarded&&Math.random()<(mission.expeditionData.gearChance??(0.30+level*0.035))?generateExpeditionItem({expeditionId:id,level,source:`${mission.expeditionData.name} · Niveau ${level}`}):null;const reward={expedition:true,rewardType:mission.expeditionData.rewardType,amount,ascension,improved:first,rewarded,loot,sealsLeft:expeditionProgress.seals};if(loot)setInventory(value=>[loot,...value].slice(0,300));
    if(rewarded){if(reward.rewardType==='gold')setGold(value=>value+amount);if(reward.rewardType==='xp')grantXp(team,amount);if(reward.rewardType==='essence')setForgeEssence(value=>value+amount);if(reward.rewardType==='ascension')setAscensionEssences(value=>({minor:value.minor+ascension.minor,major:value.major+ascension.major,mythic:value.mythic+ascension.mythic}));}
    setExpeditionProgress(current=>{const honor=current.honor||{},featuredId=expeditionHonorForDate(new Date(),honor.sundayChoice),eligible=rewarded&&featuredId===id,nextWins=eligible?Math.min(EXPEDITION_HONOR_WINS,(honor.wins||0)+1):(honor.wins||0);return{...current,seals:Math.max(0,current.seals-(rewarded?1:0)),completed:{...current.completed,[id]:Math.max(current.completed?.[id]||0,level)},firstWins:{...current.firstWins,[key]:true},honor:{...honor,wins:nextWins,locked:honor.locked||Boolean(eligible)}}});
    reward.sealsLeft=Math.max(0,expeditionProgress.seals-(rewarded?1:0));return reward;
  };

  const finishRaidMission=(mission,stars,battle=null)=>{
    const raidId=mission.raidId,level=mission.raidLevel,key=mission.key,first=!raidProgress.firstWins?.[key],rewarded=raidProgress.attempts>0;
    const performance=battle?.raidState?{championActions:battle.raidState.championActions||0,mechanicFailures:battle.raidState.mechanicFailures||0,enraged:Boolean(battle.raidState.enraged),flawless:(battle.allies||[]).every(unit=>!unit.dead)}:null;const reward={gold:0,gems:0,stones:0,improved:first,loot:null,bonusLoot:null,raid:true,performance,attemptsLeft:raidProgress.attempts};
    if(rewarded){if(raidId==='heartforge'&&[9,10].includes(level)){const chance=level===9?.0005:.0015;if(Math.random()<chance)reward.uniqueRelic=grantRelic('heartworld-eye',`Fournaise niveau ${level}`);}reward.gold=mission.reward.gold;reward.gems=mission.reward.gems;reward.stones=mission.reward.stones||0;reward.loot=generateRaidItem({...mission.raidData.loot,qualityBonus:performance?.flawless?5:0});if(performance&&performance.mechanicFailures===0&&Math.random()<.10)reward.bonusLoot=generateRaidItem(mission.raidData.loot);setGold(value=>value+reward.gold);setGems(value=>value+reward.gems);if(reward.stones)setHearthstones(value=>value+reward.stones);setInventory(current=>[reward.loot,...(reward.bonusLoot?[reward.bonusLoot]:[]),...current].slice(0,300));}
    setRaidProgress(current=>({...current,attempts:Math.max(0,current.attempts-(rewarded?1:0)),completed:{...current.completed,[raidId]:Math.max(current.completed?.[raidId]||0,level)},firstWins:{...current.firstWins,[key]:true}}));
    reward.attemptsLeft=Math.max(0,raidProgress.attempts-(rewarded?1:0));return reward;
  };

  const rollCampaignStone=mission=>{
    const used=Number(daily.campaignStones||0);if(used>=3)return{dropped:false,count:used,limit:3};
    const rates={normal:mission.boss?.0075:.0035,hard:mission.boss?.01:.0055,hardcore:mission.boss?.015:.008};
    const dropped=Math.random()<(rates[mission.difficultyId]||0);
    if(dropped){setHearthstones(value=>value+1);setDaily(current=>({...current,campaignStones:Number(current.campaignStones||0)+1}));}
    return{dropped,count:used+(dropped?1:0),limit:3};
  };
  const finishCampaignMission=(mission,stars,members=team)=>{
    const previous=campaign.scores[mission.key]||0;
    const improved=stars>previous;
    const teamValue=teamPower(members,HEROES,hero=>totalStats(hero,equipment,getProgress(hero),inventory));
    const farmFactor=mission.difficultyId==='hardcore'?.30:mission.difficultyId==='hard'?.275:.25,baseXp=Math.round((mission.reward?.xpBase||180)*(improved?1:farmFactor));
    const xpResult=campaignXp(baseXp,teamValue,mission.recommended);
    if(xpResult.xp)grantXp(members,xpResult.xp);
    if(!improved){const farmGold=Math.max(1,Math.round(mission.reward.gold*.20)),lootRoll=rollCampaignLoot(mission,false),campaignStone=rollCampaignStone(mission);setGold(value=>value+farmGold);return{gold:farmGold,gems:0,stones:0,improved:false,farm:true,previousStars:previous,loot:lootRoll.item,lootChance:lootRoll.lootChance,campaignStone,championXp:xpResult.xp,xpFactor:xpResult.factor,xpFarm:true};}
    const rewardFactors=[0,.45,.72,1],rewardFactor=Math.max(0,rewardFactors[stars]-rewardFactors[previous]);
    const firstClear=previous===0;
    const rewards={
      gold:Math.round(mission.reward.gold*rewardFactor),
      gems:Math.round(mission.reward.gems*rewardFactor),
      stones:firstClear?(mission.reward.stones||0):0,
      improved:true,
      previousStars:previous,
      rewardFactor,
      rewardPercent:Math.round(rewardFactor*100),
      firstClear
    };
    setGold(value=>value+rewards.gold);
    setGems(value=>value+rewards.gems);
    if(rewards.stones)setHearthstones(value=>value+rewards.stones);
    setCampaign(current=>({...current,scores:{...current.scores,[mission.key]:stars}}));emitProgressEvent('campaignStarsEarned',{amount:Math.max(0,stars-previous)});
    const lootRoll=rollCampaignLoot(mission,firstClear),campaignStone=rollCampaignStone(mission);let progressionGift=null;if(firstClear&&mission.difficultyId==='normal'&&mission.boss){const gifts={valebrume:{slot:'Casque',setId:'vitality',mainStat:'hp',label:'Initiation Vitalité'},khazdrum:{slot:'Arme',setId:'attack',mainStat:'atk',label:'Initiation Attaque'},'bastion-pierre':{slot:'Épaules',setId:'defense',mainStat:'def',label:'Initiation Défense'},'coeur-ignifuge':{slot:'Torse',setId:'fireproof',mainStat:'resistance',label:'Préparation Cœur-Monde'}};const gift=gifts[mission.continentId];if(gift){progressionGift=generateAchievementItem(gift);progressionGift={...progressionGift,stars:mission.continentId==='coeur-ignifuge'?3:2,quality:mission.continentId==='coeur-ignifuge'?'rare':'common',itemLevel:Number(lootRoll.item?.itemLevel||0)||Math.max(1,(Number(mission.continentIndex)||0)+1),source:`${gift.label} · ${mission.continentName}`,giftLabel:gift.label,giftType:mission.continentId==='coeur-ignifuge'?'fireproof':'tutorial'};setInventory(current=>[progressionGift,...current].slice(0,300));}}
    return{...rewards,farm:false,loot:lootRoll.item,progressionGift,lootChance:lootRoll.lootChance,campaignStone,championXp:xpResult.xp,xpFactor:xpResult.factor,xpFarm:false};
  };

  const value={HEROES,UNIQUE_WEAPONS,RELICS,CHRONICLE_STEPS,legendaryChronicles,grantRelic,activateRelic,addLegendaryMaterial,setChronicleStep,chooseUniqueOrientation,forgeUniqueWeapon,harmonizeUniqueWeapon,getUniqueWeaponForHero,ITEMS,QUALITIES,RAIDS,EXPEDITIONS,QUESTS,WEEKLY_QUESTS,MONTHLY_QUESTS,QUEST_GROUPS,FINAL_CHESTS,QUEST_PERIOD_CONFIG,DIFFICULTIES,CONTINENTS,STAR_MILESTONES,gems,gold,hearthstones,pityCounter,tutorialRewardClaimed,completeTutorialReward,tutorialAcademy,completeAcademyTutorial,claimAcademyTutorial,claimAcademyFinal,summonRates,redeemedCodes,universalSoul5,ascensionEssences,conversionHistory,convertAscensionEssence,masteryTomes,skillLevels,autoSkillPriorities,getAutoSkillPriority,setAutoSkillPriority,resetAutoSkillPriority,bloodFragments,shopState,raidProgress,forgeEssence,forgeHistory,setForgeHistory,expeditionProgress,chooseSundayExpeditionHonor,claimExpeditionHonor,shopRefreshCost,shopNextRotation,summonerProfile,weekly,monthly,trackedQuests,toggleTrackedQuest,unlocks,SUMMONER_MAX_LEVEL,summonerXpRequired,owned,team,teamPresets,activeTeamSlot,selectTeamPreset,renameTeamPreset,saveCurrentTeamToPreset,setTeamMember,removeTeamMember,clearCurrentTeam,copyTeamPreset,equipment,inventory,history,daily,championProgress,campaign,mythicProgress,finishMythicMission,achievementClaims,claimAchievement,progressionStats,permanentQuests,emitProgressEvent,recordBattleResult,grantReward,activeMission,battleSession,battleInProgress,pendingMission,preparationMission,cancelMissionPreparation,confirmMissionPreparation,prepareNextMission,setGems,setGold,setHearthstones,setTeam,setEquipment,setInventory,setHistory,equipItem,itemOwner,unequipSlot,toggleItemLock,sellItem,itemSellValue,upgradeItem,getItemUpgradeCost,recycleItem,itemRecycleValue,buyShopOffer,refreshShop,unlockShopSlot,setDaily,setActiveMission,setBattleSession,requestMissionStart,updateBattleSession,abandonBattle,dismissPendingMission,replaceBattleWithPending,progress:progressQuest,claimQuest,claimQuestChest,grantSummonerXp,setSummonerName,isUnlocked,summon,summonMany,redeemCode,grantXp,getProgress,getEvolutionStatus,evolveHero,getResonanceStatus,reinforceResonance,getSkillInfo,upgradeSkill,difficultyUnlocked,continentUnlocked,stageUnlocked,difficultyStars,claimCampaignMilestone,finishExpeditionMission,finishRaidMission,finishCampaignMission,stats:hero=>totalStats(hero,equipment,getProgress(hero),inventory),naturalStats:hero=>championProgressionStats(hero,getProgress(hero)),championPower:hero=>championPower(totalStats(hero,equipment,getProgress(hero),inventory)),teamPower:(members=team)=>teamPower(members,HEROES,hero=>totalStats(hero,equipment,getProgress(hero),inventory)),missionPower:mission=>calibratedEncounterPower(mission),assessMission:(mission,members=team)=>assessTeamForMission(members,HEROES,hero=>totalStats(hero,equipment,getProgress(hero),inventory),mission),missionDifficulty,campaignXp};
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
export const useGame=()=>useContext(GameContext);
