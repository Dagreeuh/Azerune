// Toute valeur venue d'une sauvegarde peut etre absente, nulle, ou d'un autre
// type : un fichier importe n'est valide qu'en surface. `nombre` garantit qu'une
// entree invalide retombe sur un repli plutot que de propager NaN dans les
// etoiles, le niveau et donc toutes les statistiques du champion.
const nombre=(valeur,repli=0)=>{const n=Number(valeur);return Number.isFinite(n)?n:repli};

export const MAX_STARS=6;
export const MAX_LEVEL=60;
export const MAX_RESONANCE=5;
export const RESONANCE_COSTS=[1,2,3,4,5];
export const BLOOD_FRAGMENT_VALUES={3:1,4:3,5:10};
export const remainingResonanceFragments=progress=>RESONANCE_COSTS.slice(Math.max(0,Math.min(MAX_RESONANCE,nombre(progress?.resonance,0)))).reduce((sum,value)=>sum+value,0);
export const resonanceFragmentCapacity=progress=>remainingResonanceFragments(progress);
export const bloodFragmentValue=hero=>BLOOD_FRAGMENT_VALUES[hero?.rarity]||1;
export const ASCENSION_COSTS={
  3:{gold:15000,minor:20,major:0,mythic:0},
  4:{gold:40000,minor:40,major:10,mythic:0},
  5:{gold:100000,minor:0,major:30,mythic:5}
};
export const levelCap=stars=>Math.min(MAX_LEVEL,stars*10);
export const xpForNextLevel=level=>Math.round(90*Math.pow(level,1.28)+40);
export function defaultChampionProgress(hero){return{level:1,xp:0,stars:hero.rarity,soulFragments:0,resonance:0};}
export function normalizeChampionProgress(hero,value){
  const fallback=defaultChampionProgress(hero);
  const rarete=nombre(hero?.rarity,1);
  const stars=Math.max(rarete,Math.min(MAX_STARS,nombre(value?.stars,fallback.stars)));
  const level=Math.max(1,Math.min(levelCap(stars),nombre(value?.level,1)));
  const resonance=Math.max(0,Math.min(MAX_RESONANCE,nombre(value?.resonance,0)));
  return{
    stars,level,
    xp:Math.max(0,nombre(value?.xp,0)),
    soulFragments:Math.min(remainingResonanceFragments({resonance}),Math.max(0,nombre(value?.soulFragments,0))),
    resonance
  };
}
export function addChampionXp(hero,current,amount){let next=normalizeChampionProgress(hero,current),level=next.level,xp=next.xp+Math.max(0,amount),cap=levelCap(next.stars);while(level<cap){const required=xpForNextLevel(level);if(xp<required)break;xp-=required;level+=1;}if(level>=cap)xp=0;return{...next,level,xp};}
export function addSoulFragment(hero,current,amount=1){const value=normalizeChampionProgress(hero,current),capacity=remainingResonanceFragments(value);return{...value,soulFragments:Math.min(capacity,value.soulFragments+Math.max(0,amount))};}
export function normalizeResonanceOverflow(hero,current){const raw=Math.max(0,Number(current?.soulFragments||0)),progress=normalizeChampionProgress(hero,current),capacity=remainingResonanceFragments(progress),overflow=Math.max(0,raw-capacity);return{progress:{...progress,soulFragments:Math.min(raw,capacity)},overflow,bloodFragments:overflow*bloodFragmentValue(hero)}}
export function evolutionStatus(hero,current,essences={minor:0,major:0,mythic:0},gold=0){const progress=normalizeChampionProgress(hero,current),cost=ASCENSION_COSTS[progress.stars]||null,maxLevel=levelCap(progress.stars),levelReady=progress.level>=maxLevel,resourcesReady=Boolean(cost)&&gold>=cost.gold&&essences.minor>=cost.minor&&essences.major>=cost.major&&essences.mythic>=cost.mythic;return{progress,cost,maxLevel,maxStars:progress.stars>=MAX_STARS,levelReady,resourcesReady,canEvolve:progress.stars<MAX_STARS&&levelReady&&resourcesReady};}
export function evolveChampion(hero,current){const progress=normalizeChampionProgress(hero,current);if(progress.stars>=MAX_STARS||progress.level<levelCap(progress.stars))return{ok:false,progress};return{ok:true,progress:{...progress,stars:progress.stars+1,level:1,xp:0},previousStars:progress.stars};}
export function resonanceStatus(hero,current){const progress=normalizeChampionProgress(hero,current),maxed=progress.resonance>=MAX_RESONANCE,required=maxed?0:RESONANCE_COSTS[progress.resonance];return{progress,maxed,required,ready:!maxed&&progress.soulFragments>=required,next:Math.min(MAX_RESONANCE,progress.resonance+1)};}
export function strengthenResonance(hero,current){const status=resonanceStatus(hero,current);if(!status.ready)return{ok:false,status,progress:status.progress};return{ok:true,progress:{...status.progress,resonance:status.next,soulFragments:status.progress.soulFragments-status.required},previous:status.progress.resonance};}
export function evolveFromDuplicate(hero,current){const value=normalizeChampionProgress(hero,current),capacity=remainingResonanceFragments(value);return value.soulFragments>=capacity?{progress:{...value,soulFragments:capacity},result:'bloodFragment',bloodFragments:bloodFragmentValue(hero)}:{progress:addSoulFragment(hero,value,1),result:'soulFragment'};}
export function resonanceBonus(progress){const r=Math.max(0,Math.min(5,Number(progress?.resonance||0)));return{allPercent:(r>=1?2:0)+(r>=5?2:0),speed:r>=2?3:0,accuracy:r>=3?3:0,resistance:r>=3?3:0,identity:r>=4};}
