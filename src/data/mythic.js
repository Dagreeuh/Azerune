const monthKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
const hash=value=>[...value].reduce((sum,char)=>((sum*31)+char.charCodeAt(0))>>>0,2166136261);
export const MYTHIC_AFFIXES={
 fortified:{id:'fortified',icon:'🛡️',name:'Fortifié',description:'Les ennemis non-boss gagnent 20 % de PV, 12 % d’Attaque et 5 Résistance.'},
 tyrannical:{id:'tyrannical',icon:'👑',name:'Tyrannique',description:'Les boss gagnent 25 % de PV, 15 % d’Attaque et 8 Précision.'},
 bolstering:{id:'bolstering',icon:'💪',name:'Galvanisant',description:'Lorsqu’un ennemi meurt, les survivants gagnent 8 % d’Attaque et de Défense pendant 2 tours.'},
 raging:{id:'raging',icon:'😡',name:'Déchaîné',description:'Sous 30 % de PV, les ennemis gagnent 15 % d’Attaque et 20 % de Vitesse.'},
 bursting:{id:'bursting',icon:'💥',name:'Détonant',description:'La mort d’un ennemi inflige 2,5 % des PV max à l’escouade, avec un plafond de 10 % par résolution.'},
 necrotic:{id:'necrotic',icon:'☠️',name:'Nécrotique',description:'Les attaques ennemies appliquent Nécrose : soins reçus -6 % par cumul, jusqu’à 5 cumuls pendant 2 tours.'}
};
const ROTATIONS=[['fortified','bursting','raging'],['tyrannical','necrotic','bolstering'],['fortified','bolstering','necrotic'],['tyrannical','raging','bursting']];
export const mythicSeason=()=>{const key=monthKey(),seed=hash(key),rotation=ROTATIONS[seed%ROTATIONS.length];return{key,name:`Saison ${new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}`,affixes:rotation,finalBoss:seed%3};};
const pools={
 forge:[['Sentinelle de scories','🗿','Feu'],['Artificier sombre','🧨','Feu'],['Golem de cuivre','🤖','Nature'],['Maître-forge','🔨','Feu']],
 plague:[['Goule vorace','🧟','Ombre'],['Nécromancien du fléau','🧙','Ombre'],['Abomination cousue','🧌','Nature'],['Chevalier déchu','⚔️','Ombre']],
 void:[['Anomalie du Vide','🕳️','Arcane'],['Observateur insondable','👁️','Ombre'],['Tisseur temporel','⏳','Arcane'],['Gardien sans-visage','👤','Ombre']]
};
const bosses=[
 {name:'Astreon, Dévoreur de Lunes',icon:'🌘',element:'Ombre',passive:'Éclipse croissante',spells:[['Éclat lunaire','Dégâts de zone et Vitesse réduite.'],['Nuit totale','Attaque majeure toutes les trois actions.'],['Fragments lunaires','Renforce Astreon tant que les fragments survivent.']],tips:['Détruire les fragments en priorité.','Conserver une purification pour Vitesse réduite.','Alterner dégâts et soutien afin de contrôler l’Éclipse.']},
 {name:'Varkhaz, Roi de Cendre',icon:'🌋',element:'Feu',passive:'Couronne de braises',spells:[['Pluie de cendres','Applique Brûlure à toute l’équipe.'],['Trône incandescent','Gagne un bouclier sous 50 % de PV.'],['Déflagration royale','Consomme les Brûlures pour infliger davantage de dégâts.']],tips:['Prévoir purification et soins réguliers.','Les champions Eau sont efficaces.','Garder les ultimes pour son bouclier.']},
 {name:'Chronar, Dernier Instant',icon:'⌛',element:'Arcane',passive:'Paradoxe infini',spells:[['Vol de temps','Réduit la jauge de toute l’équipe.'],['Retour arrière','Restaure une partie de ses PV.'],['Dernière seconde','Augmente les cooldowns alliés.']],tips:['Privilégier Vitesse et réduction de jauge.','Utiliser les compétences importantes avant Dernière seconde.','Une forte précision aide à contrôler Chronar.']}
];
const mythicScaling=level=>{const raw=Math.max(0,Math.min(29,Number(level||1)-1)),steps=Math.min(20,raw)+Math.max(0,raw-20)*.80;return{hp:Math.pow(1.055,steps),atk:Math.pow(1.035,steps),def:Math.pow(1.015,steps),steps};};
const enemy=(name,icon,element,level,index,boss=false,elite=false)=>{const scaling=mythicScaling(level),rankHp=boss?1.28:elite?1.12:1,rankAtk=boss?1.18:elite?1.08:1,rankDef=boss?1.14:elite?1.08:1;return{id:`mythic-${level}-${index}-${name}`,name,icon,element,hp:Math.round((boss?560:elite?360:250)*rankHp*scaling.hp),atk:Math.round((boss?48:elite?39:31)*rankAtk*scaling.atk),def:Math.round((boss?24:elite?19:13)*rankDef*scaling.def),spd:Math.round((boss?104:elite?108:96)+scaling.steps*.7),accuracy:12+level*2+(boss?8:0),resistance:15+level*2+(boss?10:0),bossUnit:boss,mythicUnit:true,mythicElite:elite};};
const wave=(level,waveIndex,season)=>{const zone=level<=10?'forge':level<=20?'plague':'void',pool=pools[zone];if(waveIndex===4){if(level===30){const b=bosses[season.finalBoss];return[{...enemy(b.name,b.icon,b.element,level,0,true),mythicBossInfo:b}]}const fixed=level===10?{name:'Thane Brise-Enclume',icon:'🔨',element:'Feu'}:level===20?{name:'Seigneur Morvhal',icon:'💀',element:'Ombre'}:{name:`Gardien Mythique +${level}`,icon:'👑',element:pool[0][2]};return[enemy(fixed.name,fixed.icon,fixed.element,level,0,true),enemy(pool[1][0],pool[1][1],pool[1][2],level,1,false,true),enemy(pool[2][0],pool[2][1],pool[2][2],level,2,false,true)]}return[0,1,2].map((_,index)=>{const data=pool[(index+waveIndex-1)%pool.length];return enemy(data[0],data[1],data[2],level,index,false,waveIndex===3&&index===2)});};
const rewards=level=>level===30?{gems:500,gold:5000,stones:5,essence:2500,tomes:2,souls:20,gear:{milestone:true}}:level%10===0?{gems:level*10,gold:level*120,stones:level/10,essence:level*50,tomes:level===20?1:0,gear:{milestone:true}}:{gems:10+level*3,gold:250+level*65,essence:15+level*5,gear:level%3===0?{milestone:false}:null};
export function createMythicMission(level){level=Math.max(1,Math.min(30,Number(level)||1));const season=mythicSeason(),affixCount=level<=4?0:level<=9?1:level<=19?2:3,affixIds=season.affixes.slice(0,affixCount),waves=[1,2,3,4].map(index=>wave(level,index,season)),recommended=Math.round((1700+level*360+Math.floor(level/10)*600)*1.42);return{key:`mythic:${season.key}:${level}`,name:`Mythic+ ${level}`,icon:'🗝️',mythic:true,teamSize:4,mythicLevel:level,mythicSeason:season.key,waves,enemies:waves[0],affixIds,affixes:affixIds.map(id=>MYTHIC_AFFIXES[id]).filter(Boolean),bossInfo:waves[3][0].mythicBossInfo||{name:waves[3][0].name,icon:waves[3][0].icon,element:waves[3][0].element,passive:'Boss de palier',spells:[['Pouvoir majeur','Attaque de zone toutes les trois actions.']],tips:['Éliminer les serviteurs avant le boss.','Conserver soins et contrôles pour la quatrième vague.']},recommended,turnBudget:mythicTurnBudget(waves,recommended),reward:rewards(level),scale:1};}
// Le Sablier d'Azerune : budget de tours partage par les quatre vagues.
// Au-dela, l'Effondrement augmente l'Attaque ennemie a chaque tour depasse.
//
// Le budget n'est pas fixe. La duree reelle d'une course est proportionnelle
// aux PV ennemis totaux rapportes a la puissance recommandee : mesure sur les
// 30 niveaux, l'ecart entre cette prediction et la simulation reste sous 8 %.
// Un budget fixe rendrait Mythic+ 1 (course longue, adversaires nombreux face a
// une puissance recommandee basse) plus severe que Mythic+ 30, exactement
// l'inverse de la progression annoncee au joueur.
//
// MYTHIC_BUDGET_FACTOR place le budget environ 6 % au-dessus de la duree
// mediane d'une course menee a la puissance recommandee : a l'equipement
// juste, le sablier tient de justesse ; au-dela, il tient confortablement.
// Voir Audit/PROPOSITION-SABLIER-MYTHIC.md.
export const MYTHIC_BUDGET_FACTOR=133;
export const MYTHIC_PERFECT_RATIO=.75;
export const MYTHIC_COLLAPSE_RATE=.05;
export const MYTHIC_DEFAULT_BUDGET=100;

/** Budget de tours d'une course, d'apres son contenu reel. */
export function mythicTurnBudget(waves,recommended){
  const pv=(waves||[]).flat().reduce((total,ennemi)=>total+(Number(ennemi?.hp)||0),0),
    puissance=Number(recommended)||0;
  if(!(pv>0)||!(puissance>0))return MYTHIC_DEFAULT_BUDGET;
  return Math.max(40,Math.round(MYTHIC_BUDGET_FACTOR*pv/puissance));
}

/** Seuil du Sablier parfait pour un budget donne. */
export const mythicPerfectTurns=budget=>
  Math.round((Number(budget)>0?Number(budget):MYTHIC_DEFAULT_BUDGET)*MYTHIC_PERFECT_RATIO);

export const MYTHIC_LEVELS=Array.from({length:30},(_,index)=>index+1);
