// Calcul des recompenses de fin de mission.
//
// Ces fonctions etaient des closures a l'interieur de GameProvider, melees aux
// appels setState. Elles sont ici pures : elles decident CE QUE le joueur
// recoit, sans rien ecrire. GameContext garde les effets de bord.
//
// Les formules sont reprises a l'identique. Les seuls ecarts, volontaires, sont
// des garde-fous sur des entrees invalides qui faisaient lever : une mission
// sans bloc `reward`, ou un nombre d'etoiles hors bornes.

import{generateAchievementItem}from'../data/items';

const nombre=valeur=>Number.isFinite(Number(valeur))?Number(valeur):0;

/* ------------------------------------------------------------------ Campagne */

/** Part de recompense cumulee atteinte a chaque palier d'etoiles. */
export const CAMPAIGN_STAR_SHARES=[0,.45,.72,1];
export const CAMPAIGN_MAX_STARS=CAMPAIGN_STAR_SHARES.length-1;

/** Part d'or de farm, une fois la mission deja terminee au meme score. */
export const CAMPAIGN_FARM_GOLD_SHARE=.20;

/** Facteur d'XP en farm, par difficulte. */
export const CAMPAIGN_FARM_XP_FACTORS={normal:.25,hard:.275,hardcore:.30};

/** Taux de butin en pourcentage, par difficulte et selon boss ou etape. */
export const CAMPAIGN_LOOT_RATES={
  normal:{stage:42,boss:58},
  hard:{stage:54,boss:68},
  hardcore:{stage:66,boss:80}
};

/** Pierres de foyer de campagne : chance par mission, et plafond quotidien. */
export const CAMPAIGN_STONE_RATES={
  normal:{stage:.0035,boss:.0075},
  hard:{stage:.0055,boss:.01},
  hardcore:{stage:.008,boss:.015}
};
export const CAMPAIGN_STONE_DAILY_LIMIT=3;

const borneEtoiles=valeur=>Math.max(0,Math.min(CAMPAIGN_MAX_STARS,Math.round(nombre(valeur))));

/** Chance de butin, en pourcentage. */
export function campaignLootRate(mission={}){
  const entree=CAMPAIGN_LOOT_RATES[mission.difficultyId]||CAMPAIGN_LOOT_RATES.normal;
  return mission.boss?entree.boss:entree.stage;
}

/** Chance de Pierre de foyer, entre 0 et 1. */
export function campaignStoneChance(mission={}){
  const entree=CAMPAIGN_STONE_RATES[mission.difficultyId];
  if(!entree)return 0;
  return mission.boss?entree.boss:entree.stage;
}

/** Le plafond quotidien de Pierres est-il deja atteint ? */
export const campaignStoneCapped=used=>nombre(used)>=CAMPAIGN_STONE_DAILY_LIMIT;

/** XP de base, avant la moderation par l'ecart de puissance (campaignXp). */
export function campaignBaseXp(mission={},improved){
  const base=nombre(mission.reward?.xpBase)||180;
  const facteur=improved?1:(CAMPAIGN_FARM_XP_FACTORS[mission.difficultyId]??CAMPAIGN_FARM_XP_FACTORS.normal);
  return Math.round(base*facteur);
}

/** Or gagne en rejouant une mission deja terminee au meme score. */
export function campaignFarmGold(mission={}){
  return Math.max(1,Math.round(nombre(mission.reward?.gold)*CAMPAIGN_FARM_GOLD_SHARE));
}

/**
 * Part de recompense reellement due : la difference entre le palier atteint et
 * celui deja paye. Rejouer sans ameliorer son score ne redonne rien.
 */
export function campaignRewardShare(stars,previous){
  const atteint=borneEtoiles(stars),paye=borneEtoiles(previous);
  return Math.max(0,CAMPAIGN_STAR_SHARES[atteint]-CAMPAIGN_STAR_SHARES[paye]);
}

/** Or, cristaux et pierres dus pour une amelioration de score. */
export function campaignMissionRewards(mission={},stars,previous){
  const rewardFactor=campaignRewardShare(stars,previous);
  const firstClear=borneEtoiles(previous)===0;
  return{
    gold:Math.round(nombre(mission.reward?.gold)*rewardFactor),
    gems:Math.round(nombre(mission.reward?.gems)*rewardFactor),
    stones:firstClear?nombre(mission.reward?.stones):0,
    rewardFactor,
    rewardPercent:Math.round(rewardFactor*100),
    firstClear
  };
}

/** Pieces offertes au premier passage d'un boss de continent, en Normale. */
export const CAMPAIGN_PROGRESSION_GIFTS={
  valebrume:{slot:'Casque',setId:'vitality',mainStat:'hp',label:'Initiation Vitalité'},
  khazdrum:{slot:'Arme',setId:'attack',mainStat:'atk',label:'Initiation Attaque'},
  'bastion-pierre':{slot:'Épaules',setId:'defense',mainStat:'def',label:'Initiation Défense'},
  'coeur-ignifuge':{slot:'Torse',setId:'fireproof',mainStat:'resistance',label:'Préparation Cœur-Monde'}
};

/** Le cadeau de progression est-il du pour cette mission ? */
export function campaignGiftConfig(mission={},firstClear){
  if(!firstClear||mission.difficultyId!=='normal'||!mission.boss)return null;
  return CAMPAIGN_PROGRESSION_GIFTS[mission.continentId]||null;
}

/** Construit la piece offerte, ou null si elle n'est pas due. */
export function campaignProgressionGift(mission={},firstClear,lootItemLevel){
  const gift=campaignGiftConfig(mission,firstClear);
  if(!gift)return null;
  const finale=mission.continentId==='coeur-ignifuge';
  return{
    ...generateAchievementItem(gift),
    stars:finale?3:2,
    quality:finale?'rare':'common',
    itemLevel:nombre(lootItemLevel)||Math.max(1,nombre(mission.continentIndex)+1),
    source:`${gift.label} · ${mission.continentName}`,
    giftLabel:gift.label,
    giftType:finale?'fireproof':'tutorial'
  };
}

/* ------------------------------------------------------------------- Raid */

/** Bonus de qualite du butin de raid : recompense un combat sans perte. */
export const raidQualityBonus=performance=>performance?.flawless?5:0;

/** Un butin supplementaire tombe si aucune mecanique n'a ete ratee. */
export const RAID_BONUS_LOOT_CHANCE=.10;
export const raidBonusLootAllowed=performance=>
  Boolean(performance)&&performance.mechanicFailures===0;

/** Chance de relique unique, reservee a la Fournaise en niveaux 9 et 10. */
export function raidRelicChance(raidId,level){
  if(raidId!=='heartforge')return 0;
  return level===9?.0005:level===10?.0015:0;
}

/* -------------------------------------------------------------- Expedition */

/** Chance de butin d'expedition, entre 0 et 1. */
export function expeditionGearChance(expeditionData={},level){
  const annoncee=expeditionData.gearChance;
  return annoncee??(.30+nombre(level)*.035);
}

export const EXPEDITION_FIRST_WIN_BONUS=1.25;

/**
 * Montant d'une expedition. Les expeditions d'Essences d'ascension renvoient
 * un objet par grade, les autres un nombre unique.
 */
export function expeditionRewardAmount(base,first,rewarded){
  const facteur=first?EXPEDITION_FIRST_WIN_BONUS:1;
  const vide={minor:0,major:0,mythic:0};
  if(typeof base==='number')
    return{amount:rewarded?Math.round(base*facteur):0,ascension:vide};
  if(base&&typeof base==='object'&&rewarded)
    return{
      amount:0,
      ascension:Object.fromEntries(Object.entries(base)
        .map(([grade,valeur])=>[grade,Math.round(nombre(valeur)*facteur)]))
    };
  return{amount:0,ascension:vide};
}
