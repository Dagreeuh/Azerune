export const RAID_DAILY_ATTEMPTS=5;
/**
 * Puissance annoncee, RELEVEE et non decidee — et elle a beaucoup baisse.
 *
 * L'ancienne table demandait jusqu'a 30 100 au niveau 10. Mesure, avec une
 * equipe COMPOSEE (un soin, un bouclier, deux frappeurs) : 10 200 suffisent.
 * L'ecart allait de +93 % a +198 %.
 *
 * Le piege est que l'ancien chiffre n'etait pas absurde pour une equipe
 * composee des quatre champions LES PLUS PUISSANTS — celle-la a effectivement
 * besoin de trois fois plus de puissance, parce qu'elle n'emmene ni soin ni
 * bouclier. C'est la toute la limite d'un nombre unique : il ne peut pas dire
 * « il te manque un soigneur ». Cette table annonce donc ce que demande une
 * equipe correctement composee, et la fenetre de preparation affiche desormais
 * les manques de composition a cote.
 *
 * Valeurs revues une seconde fois apres le correctif du seuil d'Eruption : le
 * quatrieme champion n'etant plus une punition, une equipe de quatre franchit
 * les memes niveaux avec moins de puissance qu'avant.
 */
export const RAID_POWER=[3400,3700,4300,5100,5400,6200,7000,7900,8800,10200];

const mechanics=[
  ['Cœur incandescent','Rhazakar gagne une charge à chaque action de champion.'],
  ['Élémentaire de braise','Sa mort retire 4 charges au Cœur incandescent.'],
  ['Brûlure volcanique','L’Éruption applique Brûlure à toute l’équipe.'],
  ['Prêtre des flammes','Le serviteur soigne et renforce Rhazakar.'],
  ['Brûlure cumulable','Les Brûlures deviennent plus dangereuses.'],
  ['Canalisation du Cœur','À partir du niveau 6, le Prêtre canalise et devient intouchable. Seul un contrôle l’interrompt : sans étourdissement, la canalisation aboutit et le Cœur incandescent explose.'],
  ['Gardien de lave','Le Gardien provoque et protège les serviteurs.'],
  ['Fureur du brasier','Après une Éruption, Rhazakar gagne Attaque augmentée.'],
  ['Braises renaissantes','Après sa destruction, l’Élémentaire revient après 7 actions aux niveaux 1 à 3, 5 actions aux niveaux 4 à 7, puis 4 actions aux niveaux 8 à 10.'],
  ['Flammes perforantes','L’Éruption frappe d’abord les boucliers. Ignifuge réduit aussi son impact direct de 10 %.'],
  ['Incarnation du Brasier','À 30 % de PV, Rhazakar accélère et l’Éruption arrive à 8 charges.']
];

/**
 * La Canalisation du Coeur n'avait jamais eu lieu.
 *
 * Mesure, sur 60 combats aux niveaux 6, 8 et 10 : ZERO canalisation. Ni
 * aboutie, ni interrompue. La mecanique est pourtant ecrite de bout en bout —
 * declenchement, punition, et meme une regle de pilotage automatique qui fait
 * passer l'etourdissement en priorite absolue (`chooseAutoSkill`). Tout cela
 * dormait a cause d'un seul nombre : le Pretre meurt a la 1,8e action de
 * champion en moyenne, et la canalisation commencait a la 8e.
 *
 * Abaisser le seuil ne suffisait pas : a 3 actions, il est deja mort. Il faut
 * qu'il TIENNE. Ses points de vie sont doubles et le seuil descend a 5 : la
 * canalisation se declenche alors dans 20 combats sur 20, et l'equipe qui
 * n'amene aucun controle subit la punition prevue depuis le debut.
 *
 * Les apparitions sont par ailleurs realignees sur les mecaniques ANNONCEES :
 * le Pretre arrivait au niveau 3 quand l'ecran le promettait au 4, le Gardien
 * au 6 quand l'ecran le promettait au 7. Le mur mesure entre les niveaux 5 et
 * 6 — cinq paliers de progression bloques d'un coup — etait ce Gardien en
 * avance d'un niveau.
 */
export const CANALISATION_DEPART=5;
export const PRETRE_PV=2;
export const NIVEAU_PRETRE=4;
export const NIVEAU_GARDIEN=7;

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
  const channelFrom=level>=6?CANALISATION_DEPART:null,channelActions=level>=9?3:4,enrageAt=level<=3?40:level<=6?34:level<=9?30:28,emberRespawnActions=level<=3?7:level<=7?5:4,eruptionDamageRate=level<=3?.60:level<=6?.70:level<=8?.75:level===9?.80:.85;
  return{...raid,level,teamSize:4,enrageAt,emberRespawnActions,eruptionDamageRate,channelFrom,channelActions,recommended:RAID_POWER[index],mechanics:mechanics.slice(0,level===10?mechanics.length:index+1),eruptionAt:level===10?8:Math.max(10,13-Math.ceil(level/2)),reward:{gold:500+level*350,gems:level===10?150:15+level*5,stones:level>=7?1:0},loot:{raidId,stars:level<=3?3:level<=6?4:5,minQuality:level===10?'rare':level>=7?'rare':level>=4?'common':'common'}};
}
export function createRaidMission(raidId,level){
  const data=raidLevelData(raidId,level),scale=1+(level-1)*.18,bossHp=1.43,bossAtk=1.16,bossDef=1.08,addHp=1.34,addAtk=1.14,addDef=1.06;
  const boss={id:'rhazakar',name:data.boss,icon:'🔥',element:'Feu',hp:Math.round(1500*scale*bossHp),atk:Math.round(82*scale*bossAtk),def:Math.round(34*scale*bossDef),spd:98+level*2,resistance:25+level*4,accuracy:28+level*4,bossUnit:true,raidRole:'boss'};
  const ember={id:'ember',name:'Élémentaire de braise',icon:'🌋',element:'Feu',hp:Math.round(420*scale*addHp),atk:Math.round(43*scale*addAtk),def:Math.round(19*scale*addDef),spd:108,resistance:15+level*3,accuracy:20+level*3,raidRole:'ember'};
  const priest={id:'flame-priest',name:'Prêtre des flammes',icon:'🧙',element:'Feu',hp:Math.round(360*PRETRE_PV*scale*addHp),atk:Math.round(38*scale*addAtk),def:Math.round(18*scale*addDef),spd:115,resistance:20+level*3,accuracy:30+level*3,raidRole:'priest'};
  const guardian={id:'lava-guardian',name:'Gardien de lave',icon:'🗿',element:'Feu',hp:Math.round(650*scale*addHp),atk:Math.round(45*scale*addAtk),def:Math.round(34*scale*addDef),spd:90,resistance:30+level*3,accuracy:25+level*3,raidRole:'guardian'};
  const enemies=[boss,ember];if(level>=NIVEAU_PRETRE)enemies.push(priest);if(level>=NIVEAU_GARDIEN)enemies.push(guardian);
  return{key:raidKey(raidId,level),raid:true,teamSize:4,raidId,raidLevel:level,name:`${data.name} · Niveau ${level}`,continentName:data.name,difficultyName:'Raid',icon:data.icon,boss:true,enemies,scale:1,recommended:data.recommended,reward:data.reward,raidData:data};
}
