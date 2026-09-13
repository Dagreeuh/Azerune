export const EXPEDITION_DAILY_SEALS=6;

export const EXPEDITION_HONOR_WINS=3;
export const EXPEDITION_HONOR_REWARDS={
 treasury:{gold:5000,label:'🪙 5 000 Or'},
 sanctuary:{xp:500,label:'📚 500 XP par champion'},
 'astral-forge':{essence:50,label:'🔹 50 Essences de forge'},
 'ascension-sanctuary':{ascension:{minor:10,major:2},label:'💠 10 mineures · 2 majeures'}
};
const HONOR_WEEK=['ascension-sanctuary','treasury','sanctuary','astral-forge','ascension-sanctuary','treasury','sanctuary'];
export const expeditionHonorForDate=(date=new Date(),sundayChoice=null)=>date.getDay()===0?(sundayChoice||null):HONOR_WEEK[date.getDay()];
export const expeditionHonorReward=id=>EXPEDITION_HONOR_REWARDS[id]||null;

/**
 * Puissance annoncee, RELEVEE et non decidee.
 *
 * L'ancienne table annoncait 500 au niveau 1 — ou il en faut 2 900 — et 16 000
 * au niveau 10 — ou 11 100 suffisent. Elle se trompait de -83 % a +83 %, dans
 * les deux sens, ce qui est pire qu'un chiffre absent : le joueur y lisait
 * « infaisable » quand il gagnait, et « accessible » quand il perdait.
 *
 * Chaque valeur est desormais la puissance mediane, sur les quatre
 * expeditions, de la premiere equipe simulee qui gagne une fois sur deux.
 */
export const EXPEDITION_POWER=[2900,3700,4300,5100,5900,6500,6900,7400,9500,11100];
const rewards={gold:[1000,1500,2200,3200,4500,6200,8500,11500,15000,20000],xp:[150,250,400,650,1000,1500,2200,3200,4500,6000],essence:[5,8,12,17,24,32,42,55,70,90],ascension:[{minor:6},{minor:9},{minor:13},{minor:18,major:1},{minor:24,major:1},{minor:30,major:2},{minor:38,major:3},{minor:48,major:4},{major:6,mythic:1},{major:8,mythic:2}]};
export const EXPEDITIONS=[
{id:'treasury',name:'Trésorerie des Gobelins',icon:'🪙',color:'#f59e0b',rewardType:'gold',rewardIcon:'🪙',rewardName:'Or',description:'Traque les voleurs et abats les gardes avant de briser le Trésorier blindé.'},
{id:'sanctuary',name:'Sanctuaire des Anciens',icon:'📚',color:'#8b5cf6',rewardType:'xp',rewardIcon:'👥',rewardName:'XP Champions',description:'Vaincs des esprits qui gagnent en puissance à mesure que le combat se prolonge.'},
{id:'astral-forge',name:'Forge astrale',icon:'🔹',color:'#06b6d4',rewardType:'essence',rewardIcon:'🔹',rewardName:'Essence de forge',description:'Détruis les cristaux qui renforcent, protègent et soignent le Golem astral.'},
{id:'ascension-sanctuary',name:'Sanctuaire de l’Ascension',icon:'💠',color:'#a78bfa',rewardType:'ascension',rewardIcon:'💠',rewardName:'Essences d’Ascension',description:'Disponible chaque jour. Les grades supérieurs apparaissent à mesure que le niveau augmente.'}
];
export const expeditionKey=(id,level)=>`${id}:${level}`;
const enemy=(id,name,icon,element,hp,atk,def,spd,role,bossUnit=false)=>({id,name,icon,element,hp,atk,def,spd,resistance:15,accuracy:15,expeditionRole:role,bossUnit});
/**
 * Courbe de difficulte des expeditions.
 *
 * L'ancienne echelle valait `1+(niveau-1)*0,22`, soit x2,98 du niveau 1 au
 * niveau 10. Mesure : un joueur de la ZONE 3 enchainait les dix niveaux. Les
 * niveaux 7 a 10 ne demandaient rien de plus que le niveau 7, et le jeu
 * annoncait pourtant 16 000 de puissance pour le dernier quand 5 700
 * suffisaient. Quatre niveaux sur dix ne servaient a rien.
 *
 * La table ci-dessous n'est pas devinee : pour chaque niveau on a cherche, par
 * dichotomie sur les quatre expeditions, le facteur qui place la rencontre au
 * point d'equilibre du palier de progression vise. Le premier niveau reste une
 * mise en jambe ; le dixieme demande une campagne normale terminee.
 *
 * La pente est constante (x1,30 par niveau) parce que la relation mesuree
 * entre echelle ennemie et palier de joueur est log-lineaire. Une table plus
 * raide plaçait le niveau 10 derriere la campagne DIFFICILE — or les
 * expeditions versent les essences d'Ascension qui servent justement a y
 * arriver. On ne met pas la cle derriere la porte qu'elle ouvre.
 *
 * Detail : Audit/RAPPORT-EXPERIENCE-JOUEUR.md
 */
export const EXPEDITION_SCALE=[1,1.30,1.69,2.20,2.86,3.71,4.83,6.27,8.16,10.6];
export const expeditionScale=level=>EXPEDITION_SCALE[Math.max(0,Math.min(9,Number(level)-1))];
// Le premier palier de la courbe absorbe desormais l'adoucissement des deux
// premiers niveaux : le garder ici en plus l'aurait applique deux fois. Ne
// reste que la clemence sur Resistance et Precision, qui ne parle pas de
// puissance mais de fiabilite des malus pour un joueur sans Precision.
const earlyBalance=(value)=>Math.round(value);
export function expeditionLevelData(id,level){const expedition=EXPEDITIONS.find(x=>x.id===id),i=Math.max(0,Math.min(9,level-1));return{...expedition,level,recommended:EXPEDITION_POWER[i],gearChance:Math.min(.65,.30+level*.035),reward:rewards[expedition.rewardType][i],firstBonus:.25,mechanics:id==='treasury'?['Les gardes renforcent la Défense du Trésorier.','Élimine les voleurs avant le boss.']:id==='sanctuary'?['Les Esprits gagnent de l’Attaque à chaque action.','Termine rapidement le combat.']:id==='astral-forge'?['Cristal offensif : Attaque du Golem.','Cristal défensif : Défense du Golem.','Cristal régénérant : soin du Golem.']:['L’Éclat mineur accélère l’équipe ennemie.','L’Éclat majeur protège le Gardien.','L’Éclat mythique soigne et renforce le Gardien.']};}
export function createExpeditionMission(id,level){const data=expeditionLevelData(id,level),scale=expeditionScale(level);let enemies=[];if(id==='treasury')enemies=[enemy('treasurer','Trésorier blindé','🗝️','Nature',Math.round(680*scale),Math.round(42*scale),Math.round(30*scale),92,'treasurer',true),enemy('thief','Voleur gobelin','🗡️','Nature',Math.round(260*scale),Math.round(34*scale),Math.round(12*scale),118,'thief'),enemy('guard','Garde du coffre','🛡️','Nature',Math.round(380*scale),Math.round(30*scale),Math.round(25*scale),96,'guard')];if(id==='sanctuary')enemies=[enemy('wisdom','Gardien de sagesse','🧿','Arcane',Math.round(760*scale),Math.round(45*scale),Math.round(24*scale),105,'ancient',true),enemy('time','Esprit du temps','⏳','Arcane',Math.round(310*scale),Math.round(34*scale),Math.round(14*scale),122,'time-spirit'),enemy('echo','Écho ancestral','👻','Lumière',Math.round(350*scale),Math.round(38*scale),Math.round(16*scale),112,'ancient')];if(id==='astral-forge')enemies=[enemy('golem','Golem astral','🤖','Arcane',Math.round(900*scale),Math.round(48*scale),Math.round(28*scale),94,'forge-golem',true),enemy('offense','Cristal offensif','🔶','Feu',Math.round(250*scale),Math.round(28*scale),Math.round(13*scale),108,'offense-crystal'),enemy('defense','Cristal défensif','🔷','Eau',Math.round(290*scale),Math.round(22*scale),Math.round(22*scale),100,'defense-crystal'),enemy('healing','Cristal régénérant','🔹','Nature',Math.round(265*scale),Math.round(20*scale),Math.round(16*scale),104,'healing-crystal')];if(id==='ascension-sanctuary')enemies=[enemy('ascension-guardian','Gardien de l’Ascension','💠','Arcane',Math.round(980*scale),Math.round(47*scale),Math.round(30*scale),98,'ascension-guardian',true),enemy('minor-shard','Éclat mineur','🔹','Eau',Math.round(245*scale),Math.round(29*scale),Math.round(13*scale),120,'minor-shard'),enemy('major-shard','Éclat majeur','🔷','Nature',Math.round(310*scale),Math.round(24*scale),Math.round(24*scale),102,'major-shard'),enemy('mythic-shard','Éclat mythique','💠','Lumière',Math.round(285*scale),Math.round(22*scale),Math.round(17*scale),108,'mythic-shard')];enemies=enemies.map(unit=>({...unit,hp:earlyBalance(unit.hp),atk:earlyBalance(unit.atk),def:earlyBalance(unit.def),spd:earlyBalance(unit.spd),resistance:level===1?8:level===2?12:unit.resistance,accuracy:level===1?10:level===2?12:unit.accuracy}));return{key:expeditionKey(id,level),expedition:true,expeditionId:id,expeditionLevel:level,name:`${data.name} · Niveau ${level}`,continentName:data.name,difficultyName:'Expédition',icon:data.icon,enemies,scale:1,recommended:data.recommended,expeditionData:data};}
