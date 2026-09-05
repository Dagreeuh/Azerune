export const DIFFICULTIES=[
 {id:'normal',name:'Normal',icon:'⚔️',multiplier:1,level:'1-60',color:'#3b82f6',loot:'1★ à 3★ selon la zone'},
 {id:'hard',name:'Difficile',icon:'🔥',multiplier:1.34,level:'30-60+',color:'#f97316',loot:'3★ à 5★ selon la zone'},
 {id:'hardcore',name:'Hardcore',icon:'💀',multiplier:1.72,level:'50-60+',color:'#dc2626',loot:'4★ à 5★ · prestige'}
];
export const STAR_MILESTONES=[
 {stars:21,reward:{gold:1500,gems:75,stones:1,minor:6}},
 {stars:42,reward:{gold:2500,gems:125,minor:10,forgeEssence:60}},
 {stars:63,reward:{gold:3500,gems:175,stones:2}},
 {stars:84,reward:{gold:4500,gems:220,forgeEssence:100}},
 {stars:105,reward:{gold:6000,gems:280,stones:2,major:4}},
 {stars:126,reward:{gold:7500,gems:350,forgeEssence:180,tomes:1}},
 {stars:147,reward:{gold:9000,gems:425,major:7}},
 {stars:168,reward:{gold:11500,gems:500,mythic:1}},
 {stars:189,reward:{gold:14500,gems:625,forgeEssence:300,tomes:1}},
 {stars:210,reward:{gold:20000,gems:800,stones:6,major:15,mythic:2,tomes:2}}
];

export const CAMPAIGN_MECHANICS={
 'valebrume':{icon:'🌿',name:'Sève vivante',summary:'Poison léger et régénération ennemie.',boss:'Le Gardien régénère son groupe et propage les ronces.'},
 'oeil-clair':{icon:'🎯',name:'Vision parfaite',summary:'Résistance, purification et réduction de Précision.',boss:'Le Hiérophante gagne de la jauge lorsque ses effets sont résistés.'},
 'crypte-sanglante':{icon:'🩸',name:'Soif carmine',summary:'Les ennemis récupèrent une partie des dégâts infligés.',boss:'La Comtesse se soigne quand ses serviteurs frappent.'},
 'bastion-pierre':{icon:'🛡️',name:'Rempart minéral',summary:'Boucliers, garde et Défense renforcée.',boss:'Briser son bouclier déclenche une contre-pression.'},
 'khazdrum':{icon:'⚒️',name:'Surchauffe',summary:'L’Attaque augmente au fil des actions.',boss:'Thargrim prépare périodiquement une frappe lourde.'},
 'rempart-anciens':{icon:'🔷',name:'Serment de garde',summary:'Protection de l’allié le plus fragile et Provocation.',boss:'Les attaques de zone provoquent une riposte défensive.'},
 'cimes-vent':{icon:'⚡',name:'Courants ascendants',summary:'Vitesse et manipulation de jauge.',boss:'Zephyros accélère lorsque ses serviteurs tombent.'},
 'arene-lames':{icon:'💥',name:'Marque d’exécution',summary:'Marques et coups critiques préparés.',boss:'Kaelis exécute plus durement les cibles affaiblies.'},
 'temple-inebranlable':{icon:'✦',name:'Volonté consacrée',summary:'Résistance élevée et purification limitée.',boss:'Sérath réduit régulièrement la durée de ses malus.'},
 'netherys':{icon:'🌌',name:'Érosion du Vide',summary:'Pression croissante et réduction des soins.',boss:'Xal’Neth devient plus dangereux à chaque cycle.'},
 'chambre-echos':{icon:'↩️',name:'Résonance vengeresse',summary:'Ripostes et renforcement après les attaques répétées.',boss:'Le Miroir punit les assauts trop prévisibles.'},
 'couronne-givree':{icon:'❄️',name:'Gel persistant',summary:'Ralentissement et réduction des soins.',boss:'Arthoryn consume parfois la Régénération pour se protéger.'},
 'fournaise-incendiaire':{icon:'🔥',name:'Brasier propagé',summary:'Brûlures persistantes et propagation.',boss:'Ignovar intensifie les Brûlures déjà présentes.'},
 'trone-volcan':{icon:'🌋',name:'Furie volcanique',summary:'Les ennemis se renforcent sous 40 % de PV.',boss:'Vulkar entre dans une seconde phase offensive.'},
 'rempart-endurance':{icon:'🔷',name:'Dernier rempart',summary:'Protection, Endurance et combats prolongés.',boss:'Aegor alterne garde absolue et pression soutenue.'},
 'coeur-ignifuge':{icon:'🧯',name:'Épreuve du Cœur-Monde',summary:'Brûlures, réduction des soins et éruption d’entraînement.',boss:'Pyraxis prépare aux mécaniques de la Fournaise du Cœur-Monde.'}
};
const CAMPAIGN_ROLES=['assaulter','support','controller'];
const REGIONAL_TUNING=[{hp:1,atk:1,def:1,res:0,acc:0},{hp:1.05,atk:1.04,def:1.03,res:1,acc:1},{hp:1.10,atk:1.08,def:1.05,res:2,acc:2},{hp:1.16,atk:1.12,def:1.08,res:4,acc:3},{hp:1.23,atk:1.17,def:1.11,res:6,acc:5},{hp:1.30,atk:1.22,def:1.14,res:8,acc:6},{hp:1.37,atk:1.27,def:1.17,res:10,acc:8},{hp:1.45,atk:1.32,def:1.20,res:12,acc:10},{hp:1.53,atk:1.37,def:1.23,res:15,acc:12},{hp:1.62,atk:1.43,def:1.27,res:18,acc:14}];const normalRegionalTuning=zoneIndex=>REGIONAL_TUNING[Math.max(0,Math.min(9,Number(zoneIndex)||0))];
const CAMPAIGN_COMBAT_SCALE={normal:1.12,hard:1.38,hardcore:1.70};
const difficultyTuning=(difficultyId,zoneIndex)=>{const base=normalRegionalTuning(zoneIndex),lateNormal=zoneIndex>=8;if(difficultyId==='hard')return{hp:base.hp*1.25,atk:base.atk*1.24,def:base.def*1.16,res:base.res+14,acc:base.acc+12,spd:1.05,mechanicTier:2,xp:1.55};if(difficultyId==='hardcore')return{hp:base.hp*1.45,atk:base.atk*1.42,def:base.def*1.28,res:base.res+28,acc:base.acc+24,spd:1.10,mechanicTier:3,xp:1.80};return{hp:base.hp*1.06,atk:base.atk*1.08,def:base.def*1.04,res:base.res+(lateNormal?4:0),acc:base.acc+(lateNormal?3:0),spd:lateNormal?1.03:1.01,mechanicTier:lateNormal?2:1,xp:1.35};};
const wallFactor=(zoneIndex,stageId,boss,difficultyId)=>{if(!boss)return 1;const zone=zoneIndex+1,base=zone===5?1.10:zone===10?1.20:1.06;return base*(difficultyId==='hard'?1.07:difficultyId==='hardcore'?1.13:1)};

const enemy=(name,icon,hp,atk,def,spd,resistance=15,accuracy=10,element=null,aiRole=null)=>({name,icon,hp,atk,def,spd,resistance,accuracy,element,aiRole});
const stage=(id,name,icon,power,enemies,boss=false,slot=null)=>({id,name,icon,power,enemies,boss,slot});
const ZONES=[
 ['valebrume','Valebrume','🌲','1-6',['Vitalité','Attaque'],['vitality','attack'],'Nature',['Ronceur','Loup des fougères','Fée égarée'],'Ursael, Gardien des Racines','🐻'],
 ['khazdrum','Forges de Khaz-Drum','⚒️','7-12',['Attaque','Critique'],['attack','critical'],'Feu',['Garde sombrefer','Forgeron cendré','Molosse de forge'],'Thargrim, Seigneur des Forges','⚒️'],
 ['bastion-pierre','Bastion de Pierre','🗿','13-18',['Défense','Vitalité'],['defense','vitality'],'Nature',['Golem fissuré','Sentinelle de granit','Sculpteur runique'],'Colosse Inébranlable','🗿'],
 ['oeil-clair','Sanctuaire de l’Œil Clair','🎯','19-24',['Précision','Résistance'],['accuracy','resistance'],'Lumière',['Acolyte clairvoyant','Œil runique','Gardien solaire'],'Hiérophante Clairvoyant','👁️'],
 ['arene-lames','Arène des Lames','💥','25-30',['Critique','Destruction'],['critical','destruction'],'Feu',['Duelliste noir','Lame dansante','Exécuteur masqué'],'Kaelis, Première Lame','⚔️'],
 ['cimes-vent','Cimes du Vent','⚡','31-36',['Vitesse','Précision'],['speed','accuracy'],'Arcane',['Harpie des cimes','Éclair vivant','Chevauche-vent'],'Zephyros, Maître des Rafales','🌪️'],
 ['temple-inebranlable','Temple Inébranlable','✦','37-42',['Résistance','Endurance'],['resistance','endurance'],'Lumière',['Moine de fer','Oracle silencieux','Gardien consacré'],'Sérath, Volonté Éternelle','🧘'],
 ['crypte-sanglante','Crypte Sanglante','🩸','43-48',['Vol de vie','Attaque'],['lifesteal','attack'],'Ombre',['Vampire affamé','Goule carmine','Chauve-souris sanglante'],'Comtesse Écarlate','🧛'],
 ['rempart-endurance','Rempart du Dernier Serment','🔷','49-54',['Protection','Endurance'],['protection','endurance'],'Lumière',['Gardien d’égide','Prêtre du rempart','Automate protecteur'],'Aegor, Bouclier des Âges','🛡️'],
 ['coeur-ignifuge','Cœur Ignifugé','🧯','55-60',['Ignifuge'],['fireproof'],'Feu',['Gardien ignifugé','Alchimiste des cendres','Drake de braise'],'Pyraxis, Épreuve du Cœur-Monde','🐲']
];
const slots=['Casque','Épaules','Torse','Jambières','Bottes','Arme','Toutes les pièces'];
export const CONTINENTS=ZONES.map((z,zoneIndex)=>{const[id,name,icon,level,setNames,setIds,element,mobs,bossName,bossIcon]=z,base=165+zoneIndex*22,atk=24+zoneIndex*3.3,def=9+zoneIndex*1.45,spd=94+zoneIndex*.7,power=.68+zoneIndex*.075;const stages=[1,2,3,4,5,6,7].map(n=>{const boss=n===7,mult=1+(n-1)*.052;const enemies=boss?[enemy(bossName,bossIcon,Math.round(base*2.05),Math.round(atk*1.28),Math.round(def*1.38),Math.round(spd+4),15+zoneIndex,10+zoneIndex,element),enemy(mobs[1],['🧙','👻','🗿'][zoneIndex%3],Math.round(base*1.05),Math.round(atk*.96),Math.round(def*1.05),Math.round(spd+8),15,10,element),enemy(mobs[2],['🐺','🦇','🐉'][zoneIndex%3],Math.round(base*.98),Math.round(atk*1.04),Math.round(def*.9),Math.round(spd+13),15,10,element)]:mobs.map((mob,index)=>enemy(`${mob} ${n}`,['⚔️','🛡️','🧙'][index],Math.round(base*mult*(1+(index-1)*.08)),Math.round(atk*mult*(1+(index-1)*.06)),Math.round(def*mult*(1+(index-1)*.08)),Math.round(spd+index*8),15+Math.floor(zoneIndex/3),10+Math.floor(zoneIndex/4),element));return stage(String(n),boss?`Gardien de ${name}`:[`Approche de ${name}`,`Passage de ${name}`,`Profondeurs de ${name}`,`Sanctuaire de ${name}`,`Avant-poste de ${name}`,`Arsenal de ${name}`][n-1],boss?bossIcon:['🚪','🛤️','🏛️','⚔️','🥾','🗡️'][n-1],power+(n-1)*.035,enemies,boss,slots[n-1])});return{id,name,icon,level,description:zoneIndex<3?`Progression guidée : ${setNames.join(' et ')} sans farm obligatoire.`:zoneIndex<7?`Spécialisation progressive autour de ${setNames.join(' et ')}.`:zoneIndex<9?`Optimisation avancée : ${setNames.join(' et ')}.`:`Préparation finale au Raid avec ${setNames.join(' et ')}.`,mechanic:CAMPAIGN_MECHANICS[id],setId:setIds[0],setIds,raidPreparation:setIds.includes('fireproof'),stages}});
export const missionKey=(difficultyId,continentId,stageId)=>`${difficultyId}:${continentId}:${stageId}`;
export const allMissionKeys=difficultyId=>CONTINENTS.flatMap(continent=>continent.stages.map(item=>missionKey(difficultyId,continent.id,item.id)));
export const milestoneKey=(difficultyId,stars)=>`${difficultyId}:${stars}`;
export function createMission(difficulty,continent,item){
 const continentIndex=Math.max(0,CONTINENTS.findIndex(x=>x.id===continent.id)),zone=continentIndex+1,stageId=Number(item.id),scale=(CAMPAIGN_COMBAT_SCALE[difficulty.id]||CAMPAIGN_COMBAT_SCALE.normal)*item.power,tuning=difficultyTuning(difficulty.id,continentIndex),stageRamp=1+(stageId-1)*.045,wall=wallFactor(continentIndex,stageId,item.boss,difficulty.id);
 const baseGold=Math.round((item.boss?330:125)*(1+continentIndex*.10)*difficulty.multiplier),baseGems=Math.round((item.boss?34:11)*difficulty.multiplier);
 const enemies=item.enemies.map((unit,index)=>{const bossUnit=item.boss&&index===0,bossFactor=bossUnit?1.14:1;return{...unit,bossUnit,campaignUnit:true,campaignDifficulty:difficulty.id,campaignZone:continent.id,campaignZoneIndex:continentIndex,campaignRole:bossUnit?'boss':CAMPAIGN_ROLES[index%CAMPAIGN_ROLES.length],campaignMechanic:CAMPAIGN_MECHANICS[continent.id],campaignMechanicTier:tuning.mechanicTier,hp:Math.round(unit.hp*tuning.hp*stageRamp*bossFactor*wall),atk:Math.round(unit.atk*tuning.atk*stageRamp*(bossUnit?1.08:1)*wall),def:Math.round(unit.def*tuning.def*stageRamp*(bossUnit?1.08:1)),spd:Math.round(unit.spd*tuning.spd),resistance:Math.min(90,(unit.resistance||15)+tuning.res+(bossUnit?12:0)),accuracy:Math.min(90,(unit.accuracy||10)+tuning.acc+(bossUnit?7:0))}});
 const xpBase=Math.round((180+zone*55+stageId*25)*(item.boss?1.65:1)*tuning.xp);
 const recommended=Math.round(enemies.reduce((sum,u)=>sum+u.hp*.30+u.atk*7.5+u.def*5.5+u.spd*1.7+(u.accuracy||0)*1.5+(u.resistance||0)*1.25,0)*(item.boss?1.52:1.38));
 return{key:missionKey(difficulty.id,continent.id,item.id),difficultyId:difficulty.id,difficultyName:difficulty.name,continentId:continent.id,continentName:continent.name,continentIndex,setId:(continent.setIds||[continent.setId])[Math.floor(Math.random()*(continent.setIds||[continent.setId]).length)],setIds:continent.setIds||[continent.setId],stageId:item.id,slotHint:item.slot,name:item.name,icon:item.icon,boss:item.boss,enemies,scale,mechanics:[CAMPAIGN_MECHANICS[continent.id]],mechanicTier:tuning.mechanicTier,progressionWall:item.boss&&[5,10].includes(zone)?zone:null,reward:{gold:baseGold,gems:baseGems,stones:item.boss?1:0,xpBase},recommended};
}
