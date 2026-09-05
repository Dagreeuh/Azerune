export const RAID_DAILY_ATTEMPTS=5;
export const RAID_POWER=[8200,9700,11200,13100,15200,17600,20300,23300,26600,30100];

const mechanics=[
  ['Cœur incandescent','Rhazakar gagne une charge à chaque action de champion.'],
  ['Élémentaire de braise','Sa mort retire 4 charges au Cœur incandescent.'],
  ['Brûlure volcanique','L’Éruption applique Brûlure à toute l’équipe.'],
  ['Prêtre des flammes','Le serviteur soigne et renforce Rhazakar.'],
  ['Brûlure cumulable','Les Brûlures deviennent plus dangereuses.'],
  ['Gardien de lave','Le Gardien provoque et protège les serviteurs.'],
  ['Fureur du brasier','Après une Éruption, Rhazakar gagne Attaque augmentée.'],
  ['Braises renaissantes','Après sa destruction, l’Élémentaire revient après 7 actions aux niveaux 1 à 3, 5 actions aux niveaux 4 à 7, puis 4 actions aux niveaux 8 à 10.'],
  ['Flammes perforantes','L’Éruption frappe d’abord les boucliers. Ignifuge réduit aussi son impact direct de 10 %.'],
  ['Incarnation du Brasier','À 30 % de PV, Rhazakar accélère et l’Éruption arrive à 8 charges.']
];

const raid=(id,name,icon,boss,element,unlockLevel,description,status='coming')=>({id,name,icon,boss,element,unlockLevel,description,status});
export const RAIDS=[
  raid('heartforge','Fournaise du Cœur-Monde','🔥','Rhazakar, Seigneur du Brasier','Feu',10,'Gère le Cœur incandescent et élimine les serviteurs avant l’Éruption.','active'),
  raid('black-empress','Antre de l’Impératrice Noire','🐉','Nyxara, Matriarche des Cendres','Ombre',15,'Détruis les œufs avant l’éclosion et survis aux phases d’envol.'),
  raid('obsidian-wing','Forteresse de l’Aile d’Obsidienne','🔮','Nefrakar, Prince Draconique','Arcane',20,'Adapte tes affinités et empêche la résurrection des Draconiens.'),
  raid('eternal-necropolis','Nécropole de l’Éternel','☠️','Kael-Zurath, Archiliche','Ombre',25,'Brise la barrière avec Poison, Brûlure et Saignement avant la limite de tours.')
];

export const raidKey=(raidId,level)=>`${raidId}:${level}`;
export function raidLevelData(raidId,level){
  const raid=RAIDS.find(value=>value.id===raidId),index=Math.max(0,Math.min(9,level-1));
  const enrageAt=level<=3?40:level<=6?34:level<=9?30:28,emberRespawnActions=level<=3?7:level<=7?5:4,eruptionDamageRate=level<=3?.60:level<=6?.70:level<=8?.75:level===9?.80:.85;
  return{...raid,level,teamSize:4,enrageAt,emberRespawnActions,eruptionDamageRate,recommended:RAID_POWER[index],mechanics:mechanics.slice(0,index+1),eruptionAt:level===10?8:Math.max(10,13-Math.ceil(level/2)),reward:{gold:500+level*350,gems:level===10?150:15+level*5,stones:level>=7?1:0},loot:{raidId,stars:level<=3?3:level<=6?4:5,minQuality:level===10?'rare':level>=7?'rare':level>=4?'common':'common'}};
}
export function createRaidMission(raidId,level){
  const data=raidLevelData(raidId,level),scale=1+(level-1)*.18,bossHp=1.43,bossAtk=1.16,bossDef=1.08,addHp=1.34,addAtk=1.14,addDef=1.06;
  const boss={id:'rhazakar',name:data.boss,icon:'🔥',element:'Feu',hp:Math.round(1500*scale*bossHp),atk:Math.round(82*scale*bossAtk),def:Math.round(34*scale*bossDef),spd:98+level*2,resistance:25+level*4,accuracy:28+level*4,bossUnit:true,raidRole:'boss'};
  const ember={id:'ember',name:'Élémentaire de braise',icon:'🌋',element:'Feu',hp:Math.round(420*scale*addHp),atk:Math.round(43*scale*addAtk),def:Math.round(19*scale*addDef),spd:108,resistance:15+level*3,accuracy:20+level*3,raidRole:'ember'};
  const priest={id:'flame-priest',name:'Prêtre des flammes',icon:'🧙',element:'Feu',hp:Math.round(360*scale*addHp),atk:Math.round(38*scale*addAtk),def:Math.round(18*scale*addDef),spd:115,resistance:20+level*3,accuracy:30+level*3,raidRole:'priest'};
  const guardian={id:'lava-guardian',name:'Gardien de lave',icon:'🗿',element:'Feu',hp:Math.round(650*scale*addHp),atk:Math.round(45*scale*addAtk),def:Math.round(34*scale*addDef),spd:90,resistance:30+level*3,accuracy:25+level*3,raidRole:'guardian'};
  const enemies=[boss,ember];if(level>=3)enemies.push(priest);if(level>=6)enemies.push(guardian);
  return{key:raidKey(raidId,level),raid:true,teamSize:4,raidId,raidLevel:level,name:`${data.name} · Niveau ${level}`,continentName:data.name,difficultyName:'Raid',icon:data.icon,boss:true,enemies,scale:1,recommended:data.recommended,reward:data.reward,raidData:data};
}
