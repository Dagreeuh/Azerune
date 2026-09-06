export const SLOTS=['Casque','Épaules','Torse','Jambières','Bottes','Arme'];
export const SLOT_ICONS={Casque:'🪖','Épaules':'🦾',Torse:'🛡️',Jambières:'👖',Bottes:'🥾',Arme:'⚔️'};
export const QUALITIES={
  normal:{name:'Normal',color:'#e5e7eb',substats:0,multiplier:1},
  common:{name:'Commun',color:'#22c55e',substats:1,multiplier:1.08},
  rare:{name:'Rare',color:'#3b82f6',substats:2,multiplier:1.17},
  epic:{name:'Épique',color:'#a855f7',substats:3,multiplier:1.28},
  legendary:{name:'Légendaire',color:'#f97316',substats:4,multiplier:1.42},
  unique:{name:'Unique',color:'#fff1a8',substats:4,multiplier:1.62}
};
export const SETS={
  vitality:{name:'Vitalité',pieces:2,icon:'❤️',bonus:'PV +15 %',stats:{hpPct:15}},
  accuracy:{name:'Précision',pieces:2,icon:'🎯',bonus:'Précision +20 %',stats:{accuracy:20}},
  lifesteal:{name:'Vol de vie',pieces:4,icon:'🩸',bonus:'Vol de vie 25 %',effect:'lifestealSet'},
  defense:{name:'Défense',pieces:2,icon:'🛡️',bonus:'Défense +15 %',stats:{defPct:15}},
  attack:{name:'Attaque',pieces:4,icon:'⚔️',bonus:'Attaque +35 %',stats:{atkPct:35}},
  protection:{name:'Protection',pieces:4,icon:'🔷',bonus:'Bouclier initial 15 %',effect:'protectionSet'},
  speed:{name:'Vitesse',pieces:4,icon:'⚡',bonus:'Vitesse +25 %',stats:{spdPct:25}},
  critical:{name:'Critique',pieces:2,icon:'💥',bonus:'Critique +12 %',stats:{crit:12}},
  resistance:{name:'Résistance',pieces:2,icon:'✦',bonus:'Résistance +20 %',stats:{resistance:20}},
  destruction:{name:'Destruction',pieces:4,icon:'☄️',bonus:'Dégâts critiques +40 %',stats:{critDamage:40}},
  counter:{name:'Contre-attaque',pieces:4,icon:'↩️',bonus:'20 % de contre-attaque',effect:'counterSet'},
  endurance:{name:'Endurance',pieces:2,icon:'🧊',bonus:'PV +10 % · Défense +10 %',stats:{hpPct:10,defPct:10}},
  incendiary:{name:'Incendiaire',pieces:4,icon:'🔥',bonus:'25 % de chance d’appliquer Brûlure',effect:'incendiarySet',campaignLate:true},
  volcanicFury:{name:'Furie volcanique',pieces:4,icon:'🌋',bonus:'Attaque +20 % · Dégâts +12 % sous 50 % PV',stats:{atkPct:20},effect:'volcanicFurySet',campaignLate:true},
  fireproof:{name:'Ignifuge',pieces:2,icon:'🧯',bonus:'Résistance +15 % · Brûlure reçue -25 %',stats:{resistance:15},effect:'fireproofSet',campaignLate:true}
};
export const CONTINENT_SETS={valebrume:['vitality','attack'],khazdrum:['attack','critical'],'bastion-pierre':['defense','vitality'],'oeil-clair':['accuracy','resistance'],'arene-lames':['critical','destruction'],'cimes-vent':['speed','accuracy'],'temple-inebranlable':['resistance','endurance'],'crypte-sanglante':['lifesteal','attack'],'rempart-endurance':['protection','endurance'],'coeur-ignifuge':['fireproof']};
export const EXPEDITION_SET_POOLS={treasury:['critical','speed'],sanctuary:['resistance','endurance','counter'],'astral-forge':['attack','critical','destruction'],'ascension-sanctuary':['vitality','defense','protection']};
export const continentSetDetails=continentId=>(CONTINENT_SETS[continentId]||[]).map(id=>({id,...SETS[id]}));
export const campaignSetPool=continentId=>[...(CONTINENT_SETS[continentId]||[])];
export const RAID_SETS={heartforge:['incendiary','volcanicFury']};
export const raidSetDetails=raidId=>(RAID_SETS[raidId]||[]).map(id=>({id,...SETS[id]}));
const MAIN_STATS={Casque:['hp'],Épaules:['def'],Arme:['atk'],Torse:['hpPct','defPct','atkPct','accuracy','resistance'],Jambières:['hpPct','defPct','atkPct','crit','critDamage'],Bottes:['spd','hpPct','defPct','atkPct']};
const SUB_STATS=['hp','hpPct','atk','atkPct','def','defPct','spd','crit','critDamage','accuracy','resistance'];
export const STAT_LABELS={hp:'PV',hpPct:'PV %',atk:'ATQ',atkPct:'ATQ %',def:'DEF',defPct:'DEF %',spd:'VIT',spdPct:'VIT %',crit:'Critique %',critDamage:'Dégâts crit. %',accuracy:'Précision %',resistance:'Résistance %'};
export const ITEMS=[];
const pick=list=>list[Math.floor(Math.random()*list.length)];
const QUALITY_ORDER=['normal','common','rare','epic','legendary'];
function weighted(entries){let total=entries.reduce((sum,[,weight])=>sum+weight,0),roll=Math.random()*total;for(const [value,weight] of entries){roll-=weight;if(roll<=0)return value}return entries[entries.length-1][0]}
function campaignLootProfile(mission){
  const zone=Math.max(1,Math.min(10,(Number(mission.continentIndex)||0)+1)),difficulty=mission.difficultyId||'normal',boss=Boolean(mission.boss);
  let starRates,qualityRates;
  if(difficulty==='normal'){
    if(zone<=2){starRates=[[1,boss?58:72],[2,boss?42:28]];qualityRates=boss?[['normal',42],['common',46],['rare',12]]:[['normal',58],['common',36],['rare',6]];}
    else if(zone<=4){starRates=[[1,12],[2,boss?60:70],[3,boss?28:18]];qualityRates=boss?[['normal',18],['common',55],['rare',27]]:[['normal',30],['common',55],['rare',15]];}
    else if(zone<=7){starRates=[[2,boss?48:64],[3,boss?52:36]];qualityRates=boss?[['common',38],['rare',53],['epic',9]]:[['common',52],['rare',44],['epic',4]];}
    else if(zone<=9){starRates=[[2,boss?22:34],[3,boss?78:66]];qualityRates=boss?[['common',16],['rare',64],['epic',20]]:[['common',27],['rare',61],['epic',12]];}
    else{starRates=[[3,100]];qualityRates=boss?[['rare',68],['epic',29],['legendary',3]]:[['rare',78],['epic',20],['legendary',2]];}
  }else if(difficulty==='hard'){
    if(zone<=2){starRates=[[3,100]];qualityRates=boss?[['rare',55],['epic',40],['legendary',5]]:[['rare',62],['epic',35],['legendary',3]];}
    else if(zone<=4){starRates=[[3,boss?82:90],[4,boss?18:10]];qualityRates=boss?[['rare',48],['epic',45],['legendary',7]]:[['rare',55],['epic',40],['legendary',5]];}
    else if(zone<=6){starRates=[[3,boss?52:66],[4,boss?48:34]];qualityRates=boss?[['rare',42],['epic',50],['legendary',8]]:[['rare',50],['epic',44],['legendary',6]];}
    else if(zone<=8){starRates=[[3,boss?28:42],[4,boss?72:58]];qualityRates=boss?[['rare',35],['epic',55],['legendary',10]]:[['rare',43],['epic',49],['legendary',8]];}
    else if(zone===9){starRates=[[3,16],[4,84]];qualityRates=boss?[['rare',28],['epic',58],['legendary',14]]:[['rare',36],['epic',53],['legendary',11]];}
    else{starRates=[[4,100]];qualityRates=boss?[['rare',20],['epic',62],['legendary',18]]:[['rare',28],['epic',58],['legendary',14]];}
  }else{
    if(zone<=2){starRates=[[4,100]];qualityRates=boss?[['rare',42],['epic',50],['legendary',8]]:[['rare',50],['epic',44],['legendary',6]];}
    else if(zone<=4){starRates=[[4,boss?84:92],[5,boss?16:8]];qualityRates=boss?[['rare',35],['epic',55],['legendary',10]]:[['rare',42],['epic',50],['legendary',8]];}
    else if(zone<=6){starRates=[[4,boss?48:62],[5,boss?52:38]];qualityRates=boss?[['rare',30],['epic',58],['legendary',12]]:[['rare',37],['epic',53],['legendary',10]];}
    else if(zone<=8){starRates=[[4,boss?24:38],[5,boss?76:62]];qualityRates=boss?[['rare',24],['epic',61],['legendary',15]]:[['rare',31],['epic',57],['legendary',12]];}
    else if(zone===9){starRates=[[4,12],[5,88]];qualityRates=boss?[['rare',18],['epic',63],['legendary',19]]:[['rare',25],['epic',60],['legendary',15]];}
    else{starRates=[[5,100]];qualityRates=boss?[['rare',12],['epic',64],['legendary',24]]:[['rare',18],['epic',63],['legendary',19]];}
  }
  const stars=weighted(starRates),quality=weighted(qualityRates);return{stars,quality,maxStars:Math.max(...starRates.map(([value])=>value)),maxQuality:qualityRates[qualityRates.length-1][0]};
}
export function campaignLootPreview(mission){const profile=campaignLootProfile(mission),zone=Math.max(1,Math.min(10,(Number(mission.continentIndex)||0)+1)),difficulty=mission.difficultyId||'normal';const ranges={normal:zone<=2?'1★ à 2★':zone<=9?'2★ à 3★':'3★',hard:zone<=2?'3★':zone<=8?'3★ à 4★':'4★',hardcore:zone<=2?'4★':zone<=8?'4★ à 5★':'5★'};return{stars:ranges[difficulty],maxQuality:profile.maxQuality};}

function baseValue(stat,stars,itemLevel,quality){const scale=(.72+stars*.32)*(1+itemLevel*.018)*QUALITIES[quality].multiplier;const bases={hp:24,atk:5,def:4,spd:3,hpPct:4,atkPct:4,defPct:4,crit:3,critDamage:5,accuracy:4,resistance:4};return Math.max(1,Math.round(bases[stat]*scale))}
export const CAMPAIGN_ITEM_LEVEL_CURVE={
 normal:{
  1:{stages:[1,2,3,4,5,6],boss:[6,7]},2:{stages:[6,7,8,9,10,10],boss:[11,12]},3:{stages:[11,12,13,14,15,16],boss:[17,18]},4:{stages:[17,18,19,20,21,23],boss:[24,25]},5:{stages:[24,25,26,28,29,31],boss:[32,33]},6:{stages:[32,33,35,37,38,40],boss:[41,42]},7:{stages:[41,42,44,46,48,49],boss:[50,51]},8:{stages:[50,52,54,55,57,58],boss:[59,60]},9:{stages:[59,60,62,64,65,66],boss:[67,68]},10:{stages:[67,68,69,70,71,74],boss:[75,76]}
 },
 hard:{
  1:{stages:[74,75,77,78,80,81],boss:[82,83]},2:{stages:[81,82,84,86,87,88],boss:[89,90]},3:{stages:[88,89,91,93,94,95],boss:[96,97]},4:{stages:[95,96,98,100,101,102],boss:[103,104]},5:{stages:[102,104,106,107,109,110],boss:[111,112]},6:{stages:[110,112,114,115,117,118],boss:[119,120]},7:{stages:[118,120,122,124,125,126],boss:[127,128]},8:{stages:[126,128,130,132,133,134],boss:[135,136]},9:{stages:[134,136,138,140,142,143],boss:[144,145]},10:{stages:[143,145,147,149,151,152],boss:[153,155]}
 },
 hardcore:{
  1:{stages:[153,155,157,158,160,161],boss:[162,164]},2:{stages:[161,163,165,167,168,169],boss:[170,172]},3:{stages:[169,171,173,175,177,178],boss:[179,181]},4:{stages:[178,180,182,184,186,187],boss:[188,190]},5:{stages:[187,189,191,193,195,196],boss:[197,199]},6:{stages:[196,198,200,202,204,205],boss:[206,208]},7:{stages:[205,207,209,211,213,214],boss:[215,217]},8:{stages:[214,216,218,220,222,223],boss:[224,226]},9:{stages:[223,225,227,229,231,233],boss:[234,236]},10:{stages:[233,235,237,239,242,244],boss:[245,248]}
 }
};
const CAMPAIGN_QUALITY_MULTIPLIER={normal:1,common:1.06,rare:1.13,epic:1.22,legendary:1.32,unique:1.45};
function campaignBaseValue(stat,stars,itemLevel,quality){const scale=(.62+stars*.24)*(1+itemLevel*.010)*(CAMPAIGN_QUALITY_MULTIPLIER[quality]||1);const bases={hp:20,atk:4,def:3.5,spd:2.4,hpPct:3.2,atkPct:3.2,defPct:3.2,crit:2.5,critDamage:4,accuracy:4,resistance:4};return Math.max(1,Math.round(bases[stat]*scale))}
function campaignItemLevel(mission){
 const difficulty=['normal','hard','hardcore'].includes(mission.difficultyId)?mission.difficultyId:'normal';
 const zone=Math.max(1,Math.min(10,(Number(mission.continentIndex)||0)+1));
 const stage=Math.max(1,Math.min(7,Number(mission.stageId)||1));
 const entry=CAMPAIGN_ITEM_LEVEL_CURVE[difficulty][zone];
 if(Boolean(mission.boss)||stage===7){const [minimum,maximum]=entry.boss;return minimum+Math.floor(Math.random()*(maximum-minimum+1));}
 return entry.stages[stage-1];
}
function stageSlot(stageId,boss){if(boss||Number(stageId)===7)return pick(SLOTS);return ['Casque','Épaules','Torse','Jambières','Bottes','Arme'][Math.max(0,Number(stageId)-1)]||'Casque'}
export function generateCampaignItem(mission){
  const profile=campaignLootProfile(mission),stars=profile.stars,quality=profile.quality,slot=stageSlot(mission.stageId,mission.boss);
  const pool=CONTINENT_SETS[mission.continentId]||Object.keys(SETS),requested=mission.preferredSetId,forced=Boolean(requested&&pool.includes(requested)),setId=forced?requested:(mission.setId&&pool.includes(mission.setId)?mission.setId:pick(pool)),mainStat=pick(MAIN_STATS[slot]);
  const itemLevel=campaignItemLevel(mission);
  const available=SUB_STATS.filter(stat=>stat!==mainStat),substats={};
  for(let i=0;i<QUALITIES[quality].substats;i++){const stat=pick(available.filter(value=>!(value in substats)));substats[stat]=campaignBaseValue(stat,stars,itemLevel,quality)}
  return{id:`gear-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:`${SLOT_ICONS[slot]} ${slot} ${SETS[setId].name}`,icon:SLOT_ICONS[slot],slot,setId,quality,stars,itemLevel,level:0,mainStat,mainValue:campaignBaseValue(mainStat,stars,itemLevel,quality),substats,locked:false,source:`${mission.continentName} · ${mission.name}`,origin:'campaign',campaignBalanced:true,balanceVersion:5,campaignItemLevelCurve:true,targetedSet:forced};
}

export function generateAchievementItem(config={}){const slot=config.slot||'Casque',setId=config.setId||'vitality',mainStat=config.mainStat||MAIN_STATS[slot][0],stars=1,quality='common',itemLevel=5;return{id:`achievement-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:`${SLOT_ICONS[slot]} ${slot} ${SETS[setId].name}`,icon:SLOT_ICONS[slot],slot,setId,quality,stars,itemLevel,level:0,mainStat,mainValue:baseValue(mainStat,stars,itemLevel,quality),substats:{},locked:false,source:'Haut fait'};}

export function itemStats(item){return effectiveItemStats(item)}
// Un objet peut porter un setId disparu du jeu : sauvegarde ancienne, set retire
// lors d'une refonte, ou fichier importe depuis une autre version. Sans ce
// filtre, SETS[id].pieces leve et fait tomber totalStats, donc toute page qui
// calcule des statistiques.
export function activeSets(items){const counts={};(items||[]).forEach(item=>{if(item?.setId&&SETS[item.setId])counts[item.setId]=(counts[item.setId]||0)+1});return Object.entries(counts).flatMap(([id,count])=>Array.from({length:Math.floor(count/SETS[id].pieces)},()=>id))}
export function setStats(items){const result={};activeSets(items).forEach(id=>Object.entries(SETS[id]?.stats||{}).forEach(([key,value])=>result[key]=(result[key]||0)+value));return result}

export function generateShopItem(config={}){
  const stars=config.stars||2,quality=config.quality||'common',slot=pick(SLOTS),setId=pick(Object.keys(SETS)),mainStat=pick(MAIN_STATS[slot]);
  const itemLevel=config.itemLevel||Math.max(5,stars*15+Math.floor(Math.random()*8));
  const available=SUB_STATS.filter(stat=>stat!==mainStat),substats={};
  for(let index=0;index<QUALITIES[quality].substats;index+=1){const stat=pick(available.filter(value=>!(value in substats)));substats[stat]=baseValue(stat,stars,itemLevel,quality)}
  return{id:`shop-gear-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:`${SLOT_ICONS[slot]} ${slot} ${SETS[setId].name}`,icon:SLOT_ICONS[slot],slot,setId,quality,stars,itemLevel,level:0,mainStat,mainValue:baseValue(mainStat,stars,itemLevel,quality),substats,locked:false,source:'Boutique d’Azerune',origin:'shop'};
}

export function generateRaidItem(config={}){
  const stars=config.stars||3;
  const roll=Math.random();
  const qualityBonus=Math.max(0,Math.min(20,Number(config.qualityBonus)||0))/100,quality=config.minQuality==='rare'?(roll<.05+qualityBonus*.25?'legendary':roll<.45+qualityBonus?'epic':'rare'):(roll<.02+qualityBonus*.20?'legendary':roll<.20+qualityBonus?'epic':roll<.65+qualityBonus?'rare':'common');
  const slot=pick(SLOTS),setId=pick(RAID_SETS[config.raidId]||RAID_SETS.heartforge),mainStat=pick(MAIN_STATS[slot]);
  const itemLevel=45+stars*12+Math.floor(Math.random()*8),available=SUB_STATS.filter(stat=>stat!==mainStat),substats={};
  for(let index=0;index<QUALITIES[quality].substats;index+=1){const stat=pick(available.filter(value=>!(value in substats)));substats[stat]=baseValue(stat,stars,itemLevel,quality)}
  return{id:`raid-gear-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:`${SLOT_ICONS[slot]} ${slot} ${SETS[setId].name}`,icon:SLOT_ICONS[slot],slot,setId,quality,stars,itemLevel,level:0,mainStat,mainValue:baseValue(mainStat,stars,itemLevel,quality),substats,locked:false,source:'Fournaise du Cœur-Monde',origin:'raid'};
}


const EXPEDITION_ITEM_LEVEL_RANGES={
  1:[5,10],
  2:[8,14],
  3:[12,18],
  4:[17,24],
  5:[23,31],
  6:[30,39],
  7:[38,47],
  8:[46,55],
  9:[54,63],
  10:[62,72]
};
const EXPEDITION_STAR_RATES={
  1:[[2,85],[3,15]],
  2:[[2,55],[3,45]],
  3:[[2,20],[3,80]],
  4:[[3,90],[4,10]],
  5:[[3,55],[4,45]],
  6:[[3,20],[4,80]],
  7:[[4,100]],
  8:[[4,90],[5,10]],
  9:[[4,55],[5,45]],
  10:[[4,20],[5,80]]
};
function expeditionQualityRates(level){
  if(level<=3)return[['normal',20],['common',60],['rare',20]];
  if(level<=6)return[['common',45],['rare',50],['epic',5]];
  if(level<=8)return[['rare',70],['epic',28],['legendary',2]];
  return[['rare',40],['epic',52],['legendary',8]];
}
function expeditionItemLevel(level){
  const [minimum,maximum]=EXPEDITION_ITEM_LEVEL_RANGES[level]||EXPEDITION_ITEM_LEVEL_RANGES[1];
  return minimum+Math.floor(Math.random()*(maximum-minimum+1));
}
export function generateExpeditionItem(config={}){
  const level=Math.max(1,Math.min(10,Number(config.level)||1));
  const stars=weighted(EXPEDITION_STAR_RATES[level]);
  const quality=weighted(expeditionQualityRates(level));
  const slot=pick(SLOTS);
  const setId=pick(EXPEDITION_SET_POOLS[config.expeditionId]||['vitality']);
  const mainStat=pick(MAIN_STATS[slot]);
  const itemLevel=expeditionItemLevel(level);
  const available=SUB_STATS.filter(stat=>stat!==mainStat),substats={};
  for(let index=0;index<QUALITIES[quality].substats;index+=1){
    const candidates=available.filter(value=>!(value in substats));
    if(!candidates.length)break;
    const stat=pick(candidates);
    substats[stat]=baseValue(stat,stars,itemLevel,quality);
  }
  return{
    id:`expedition-gear-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    name:`${SLOT_ICONS[slot]} ${slot} ${SETS[setId].name}`,
    icon:SLOT_ICONS[slot],slot,setId,quality,stars,itemLevel,level:0,
    mainStat,mainValue:baseValue(mainStat,stars,itemLevel,quality),substats,
    locked:false,source:config.source||'Expédition',origin:'expedition',
    expeditionBalanced:true,balanceVersion:1,expeditionLevel:level
  };
}
export const MYTHIC_ITEM_LEVEL_RANGES={
 1:[72,74],2:[73,75],3:[74,76],4:[75,77],5:[76,78],6:[78,80],7:[80,82],8:[82,84],9:[84,86],10:[87,90],
 11:[89,92],12:[92,95],13:[95,98],14:[98,101],15:[102,105],16:[105,108],17:[108,111],18:[112,115],19:[116,119],20:[120,124],
 21:[124,128],22:[128,132],23:[132,136],24:[136,140],25:[140,144],26:[145,149],27:[150,154],28:[155,159],29:[160,164],30:[168,174]
};
// Butin Mythic+ : etoiles et qualite interpolees entre les paliers-jalons.
//
// Les tables precedentes fonctionnaient par blocs, et deux blocs etaient plus
// genereux que le bloc suivant : le palier 10 donnait de meilleures pieces que
// les paliers 11 a 15, le palier 20 que les paliers 21 a 24. La puissance d'un
// joueur stagnait donc — voire reculait — pendant que les ennemis continuaient
// de monter, ce qui faisait du palier 15 le mur du mode.
//
// Les jalons (1, 6, 10, 20, 30) reprennent exactement les valeurs des anciens
// blocs, si bien qu'aucun palier ne perd au change ;
// seuls les paliers intermediaires sont releves, pour que l'equipement
// progresse a chaque palier au lieu d'attendre le jalon suivant.
// Voir Audit/RAPPORT-COURBE-BUTIN-MYTHIC.md.
const MYTHIC_QUALITY_SCALE=['normal','common','rare','epic','legendary'];
const MYTHIC_STAR_MILESTONES=[[1,2],[6,2.2],[10,3],[20,4],[30,5]];
const MYTHIC_QUALITY_MILESTONES=[[1,.95],[6,1.42],[10,2.20],[20,2.70],[30,3.30]];

/** Interpolation lineaire entre les paliers-jalons. */
function mythicMilestoneValue(level,milestones){
 const palier=Math.max(1,Math.min(30,Number(level)||1));
 for(let index=1;index<milestones.length;index+=1){
  const[bas,valeurBasse]=milestones[index-1],[haut,valeurHaute]=milestones[index];
  if(palier<=haut)return valeurBasse+(valeurHaute-valeurBasse)*((palier-bas)/(haut-bas));
 }
 return milestones[milestones.length-1][1];
}

/** Repartit une valeur continue sur les deux crans qui l'encadrent. */
function mythicSplit(valeur,cran){
 const bas=Math.floor(valeur),part=Math.round((valeur-bas)*100);
 if(part<=0)return[[cran(bas),100]];
 if(part>=100)return[[cran(bas+1),100]];
 return[[cran(bas),100-part],[cran(bas+1),part]];
}

function mythicStarRates(level){
 return mythicSplit(mythicMilestoneValue(level,MYTHIC_STAR_MILESTONES),rang=>rang);
}
function mythicQualityRates(level){
 const borne=rang=>MYTHIC_QUALITY_SCALE[Math.max(0,Math.min(MYTHIC_QUALITY_SCALE.length-1,rang))];
 return mythicSplit(mythicMilestoneValue(level,MYTHIC_QUALITY_MILESTONES),borne);
}
export function mythicLootPreview(level){
 level=Math.max(1,Math.min(30,Number(level)||1));
 return{itemLevel:MYTHIC_ITEM_LEVEL_RANGES[level],stars:mythicStarRates(level),qualities:mythicQualityRates(level)};
}
export function generateMythicItem(config={}){
 const level=Math.max(1,Math.min(30,Number(config.level)||1)),stars=weighted(mythicStarRates(level)),quality=weighted(mythicQualityRates(level)),slot=pick(SLOTS),setId=pick(Object.keys(SETS)),mainStat=pick(MAIN_STATS[slot]),range=MYTHIC_ITEM_LEVEL_RANGES[level],itemLevel=range[0]+Math.floor(Math.random()*(range[1]-range[0]+1)),available=SUB_STATS.filter(stat=>stat!==mainStat),substats={};
 for(let index=0;index<QUALITIES[quality].substats;index+=1){const candidates=available.filter(value=>!(value in substats));if(!candidates.length)break;const stat=pick(candidates);substats[stat]=baseValue(stat,stars,itemLevel,quality)}
 return{id:`mythic-gear-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:`${SLOT_ICONS[slot]} ${slot} ${SETS[setId].name}`,icon:SLOT_ICONS[slot],slot,setId,quality,stars,itemLevel,level:0,mainStat,mainValue:baseValue(mainStat,stars,itemLevel,quality),substats,locked:false,source:config.source||`Mythic+ · Niveau ${level}`,origin:'mythic',mythicLevel:level,mythicBalanced:true,balanceVersion:1};
}
/* v1.47.1 - Forge economy rebalance */
export const ITEM_MAX_UPGRADE=15;
export const ITEM_SUBSTAT_MAX=4;
export const ITEM_UPGRADE_MILESTONES=[3,6,9,12,15];
export const ITEM_UPGRADE_GOLD=[0,100,150,225,325,450,625,850,1100,1450,1900,2500,3300,4300,5600,7500];
export const ITEM_UPGRADE_ESSENCE=[0,1,1,2,2,3,4,5,6,8,10,13,17,22,28,36];
const STAR_UPGRADE_MULTIPLIER={1:1,2:1.35,3:1.8,4:2.5,5:3.5};
const QUALITY_UPGRADE_MULTIPLIER={normal:1,common:1.1,rare:1.25,epic:1.5,legendary:1.9,unique:2.15};
const ADVANCED_ESSENCE_MULTIPLIER={11:1.15,12:1.15,13:1.25,14:1.25,15:1.4};
const RECYCLE_STAR_BASE={1:1,2:3,3:7,4:15,5:24};
const RECYCLE_QUALITY_MULTIPLIER={normal:1,common:1.3,rare:1.8,epic:2.7,legendary:5,unique:0};

export function normalizedItem(item){return{...item,level:Math.max(0,Math.min(ITEM_MAX_UPGRADE,Number(item?.level)||0)),upgradeRolls:Array.isArray(item?.upgradeRolls)?item.upgradeRolls:[],investedEssence:Number(item?.investedEssence)||0,investedGold:Number(item?.investedGold)||0,origin:item?.origin||(String(item?.source||'').includes('Boutique')?'shop':'drop'),substats:{...(item?.substats||{})}}}
export function upgradeCost(item){
  const normalized=normalizedItem(item),target=normalized.level+1;if(target>ITEM_MAX_UPGRADE)return null;
  const multiplier=(STAR_UPGRADE_MULTIPLIER[normalized.stars]||1)*(QUALITY_UPGRADE_MULTIPLIER[normalized.quality]||1);
  const advancedEssenceMultiplier=ADVANCED_ESSENCE_MULTIPLIER[target]||1;
  return{target,gold:Math.max(1,Math.round(ITEM_UPGRADE_GOLD[target]*multiplier)),essence:Math.max(1,Math.round(ITEM_UPGRADE_ESSENCE[target]*multiplier*advancedEssenceMultiplier)),milestone:ITEM_UPGRADE_MILESTONES.includes(target)};
}
export function effectiveMainValue(item){const normalized=normalizedItem(item),value=normalized.mainValue*(1+normalized.level*.04);return Math.round(value*10)/10}
export function formatItemValue(value){return Number.isInteger(Number(value))?String(Number(value)):Number(value).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1})}
export function effectiveSubstats(item){
  const normalized=normalizedItem(item),result={...normalized.substats};
  normalized.upgradeRolls.forEach(roll=>{result[roll.stat]=(result[roll.stat]||0)+Number(roll.value||0)});return result;
}
export function effectiveItemStats(item){const normalized=normalizedItem(item);return{[normalized.mainStat]:effectiveMainValue(normalized),...effectiveSubstats(normalized)}}
export function nextMilestone(level){return ITEM_UPGRADE_MILESTONES.find(value=>value>Number(level||0))||null}
export function recycleEssenceValue(item){const normalized=normalizedItem(item),base=Math.round((RECYCLE_STAR_BASE[normalized.stars]||1)*(RECYCLE_QUALITY_MULTIPLIER[normalized.quality]||1));const recovery=base+Math.floor(normalized.investedEssence*.25),penalty=normalized.origin==='crafted'?.25:normalized.origin==='shop'?.50:1;return Math.max(1,Math.floor(recovery*penalty))}
export function forgeUpgradeItem(item){
  const normalized=normalizedItem(item),cost=upgradeCost(normalized);if(!cost)return{ok:false,item:normalized,message:'Cet équipement est déjà au niveau maximum.'};
  const next={...normalized,level:cost.target,investedEssence:normalized.investedEssence+cost.essence,investedGold:normalized.investedGold+cost.gold,upgradeRolls:[...normalized.upgradeRolls]},changes=[];
  if(cost.milestone){
    const current=effectiveSubstats(next),available=SUB_STATS.filter(stat=>stat!==next.mainStat&&!(stat in current));
    if(Object.keys(current).length<ITEM_SUBSTAT_MAX&&available.length){const stat=pick(available),value=(next.campaignBalanced?campaignBaseValue:baseValue)(stat,next.stars,next.itemLevel,next.quality);next.upgradeRolls.push({level:cost.target,type:'add',stat,value});changes.push({type:'add',stat,value});}
    else{const keys=Object.keys(current);if(keys.length){const stat=pick(keys),base=Math.max(1,next.substats[stat]||current[stat]),value=Math.max(1,Math.round(base*.60));next.upgradeRolls.push({level:cost.target,type:'upgrade',stat,value});changes.push({type:'upgrade',stat,value});}}
  }
  return{ok:true,item:next,cost,changes};
}
