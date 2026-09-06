const Q=(id,event,icon,name,desc,goal,activity,reward,extra={})=>({id,event,icon,name,desc,goal,activity,reward,story:extra.story||desc,...extra});
export const QUEST_PERIOD_CONFIG={
 daily:{label:'Journalières',requiredForChest:6,reset:'Chaque jour'},
 weekly:{label:'Hebdomadaires',requiredForChest:7,reset:'Chaque lundi'},
 monthly:{label:'Mensuelles',requiredForChest:8,reset:'Le 1er du mois'},
 progression:{label:'Progression',requiredForChest:0,reset:'Permanent'}
};
export const QUESTS=[
 Q('battle','battleCompleted','⚔️','Combattant quotidien','Terminer 3 combats',3,'campaign',{gold:250,summonerXp:25}),
 Q('campaignWin','campaignCompleted','🗺️','Sentiers reconquis','Gagner 1 mission de Campagne',1,'campaign',{gold:300,summonerXp:25}),
 Q('skills','skillUsed','✨','Maître des arcanes','Utiliser 6 compétences',6,'campaign',{gems:35,summonerXp:25}),
 Q('dotDaily','dotDamageDealt','☠️','Afflictions persistantes','Infliger 500 dégâts périodiques',500,'campaign',{gold:250,essence:10}),
 Q('supportDaily','supportDone','🛡️','Rempart vivant','Produire 750 soins ou mitigation',750,'campaign',{gold:250,summonerXp:25}),
 Q('forgeDaily','itemUpgraded','🔨','Entretien de l’arsenal','Améliorer 1 équipement',1,'gear',{essence:15,gold:200}),
 Q('expeditionDaily','expeditionCompleted','🧭','Éclaireur astral','Terminer 1 Expédition',1,'expeditions',{gold:300,summonerXp:30}),
 Q('summonOrFree','heroSummoned','🌀','Écho du Foyer','Effectuer 1 invocation',1,'summon',{gold:200,summonerXp:20})
];
export const WEEKLY_QUESTS=[
 Q('weeklyBattles','battleCompleted','⚔️','Vétéran de la semaine','Terminer 30 combats',30,'campaign',{gold:1800,gems:75,summonerXp:150}),
 Q('weeklyCampaign','campaignCompleted','🗺️','Conquête régulière','Gagner 15 missions de Campagne',15,'campaign',{gold:1600,essence:75}),
 Q('weeklyBosses','bossDefeated','👑','Briseur de boss','Vaincre 3 boss',3,'campaign',{gold:1400,gems:80}),
 Q('weeklySkills','skillUsed','🌠','Maîtrise tactique','Utiliser 60 compétences',60,'campaign',{gold:1200,stones:1,summonerXp:150}),
 Q('weeklyForge','itemUpgraded','🔨','Forge assidue','Améliorer 8 équipements',8,'gear',{essence:100,gold:1200}),
 Q('weeklyExpeditions','expeditionCompleted','🧭','Routes astrales','Terminer 8 Expéditions',8,'expeditions',{gold:1500,essence:90}),
 Q('weeklySupport','supportDone','💚','Soutien exemplaire','Produire 20 000 soins ou mitigation',20000,'campaign',{gems:100,summonerXp:160}),
 Q('weeklyDot','dotDamageDealt','☠️','Fléau durable','Infliger 15 000 dégâts périodiques',15000,'campaign',{gold:1500,essence:80}),
 Q('weeklySummons','heroSummoned','🔥','Appel du Foyer','Effectuer 10 invocations',10,'summon',{gems:150,stones:2,summonerXp:180})
];
export const MONTHLY_QUESTS=[
 Q('monthlyBattles','battleCompleted','🏆','Conquérant du mois','Terminer 100 combats',100,'campaign',{gold:6000,gems:250,summonerXp:500}),
 Q('monthlyBosses','bossDefeated','👑','Chasseur de légendes','Vaincre 25 boss',25,'campaign',{gold:5000,gems:250}),
 Q('monthlyCampaign','campaignStarsEarned','⭐','Cartographe d’Azerune','Obtenir 60 nouvelles étoiles de Campagne',60,'campaign',{gold:5000,essence:300}),
 Q('monthlyExpeditions','expeditionCompleted','🧭','Maître des routes','Terminer 30 Expéditions',30,'expeditions',{gold:5000,essence:300}),
 Q('monthlyForge','itemUpgraded','⚙️','Grand artisan','Améliorer 30 équipements',30,'gear',{gold:4500,essence:350}),
 Q('monthlyAscension','heroAscended','🌟','Ascension continue','Faire progresser 2 champions par Ascension',2,'heroes',{gems:300,masteryTomes:1}),
 Q('monthlyResonance','resonanceUpgraded','✦','Constellations éveillées','Renforcer 2 Résonances',2,'heroes',{gems:300,universalSoul5:2}),
 Q('monthlyRaid','raidCompleted','🐉','Assaut mensuel','Terminer 8 combats de Raid',8,'raids',{gold:6000,gems:300}),
 Q('monthlyMythic','mythicCompleted','🗝️','Clés renforcées','Terminer 6 niveaux Mythic+',6,'mythic',{gold:6000,essence:400}),
 Q('monthlyWeeklies','weeklyQuestClaimed','📅','Discipline mensuelle','Réclamer 20 quêtes hebdomadaires',20,'quests',{gems:400,stones:3})
];
export const PROGRESSION_QUESTS=[
 Q('progress-name','summonerNamed','📜','Un nom dans les Chroniques','Choisir le nom de l’Invocateur',1,'settings',{gold:300,gems:50},{permanent:true,chapter:'Début'}),
 Q('progress-team','teamComposed','👥','Première escouade','Composer une équipe de 3 champions',1,'team',{gold:400},{permanent:true,chapter:'Début'}),
 Q('progress-campaign-1','campaignCompleted','🗺️','Premier sentier','Terminer 5 missions de Campagne',5,'campaign',{gold:750,gems:75},{permanent:true,chapter:'Début'}),
 Q('progress-equip','itemEquipped','🎒','Prêt au combat','Équiper 3 objets',3,'gear',{essence:30},{permanent:true,chapter:'Début'}),
 Q('progress-summon','heroSummoned','🌀','Premier appel','Effectuer 10 invocations',10,'summon',{stones:2},{permanent:true,chapter:'Début'}),
 Q('progress-40','heroLevelReached','📈','Escouade aguerrie','Atteindre le niveau 40 avec 3 champions',3,'heroes',{gold:3000,gems:150},{permanent:true,chapter:'Milieu',mode:'uniqueHeroes',threshold:40}),
 Q('progress-5star','heroStarReached','🌟','Ascension majeure','Atteindre 5★ avec un champion',1,'heroes',{masteryTomes:1,gems:200},{permanent:true,chapter:'Milieu',mode:'uniqueHeroes',threshold:5}),
 Q('progress-raid','raidCompleted','🐉','Première brèche','Terminer un Raid',1,'raids',{gold:2500,gems:150},{permanent:true,chapter:'Milieu'}),
 Q('progress-60','heroLevelReached','🏅','Équipe légendaire','Atteindre le niveau 60 avec 3 champions',3,'heroes',{gold:8000,gems:500},{permanent:true,chapter:'Fin',mode:'uniqueHeroes',threshold:60}),
 Q('progress-r5','resonanceReached','✦','Constellation parfaite','Atteindre Résonance V avec un champion',1,'heroes',{gems:500,universalSoul5:5},{permanent:true,chapter:'Fin',threshold:5}),
 Q('progress-m30','mythicLevelReached','🌌','Au-delà du voile','Terminer Mythic+ 30',1,'mythic',{gems:750,masteryTomes:2},{permanent:true,chapter:'Fin',threshold:30}),
 Q('progress-unique','uniqueWeaponForged','🗡️','Légende forgée','Forger une arme Unique',1,'quests',{gems:500,essence:500},{permanent:true,chapter:'Fin'})
];
export const QUEST_GROUPS={daily:QUESTS,weekly:WEEKLY_QUESTS,monthly:MONTHLY_QUESTS,progression:PROGRESSION_QUESTS};
export const FINAL_CHESTS={
 daily:{gems:80,gold:500,summonerXp:60},
 weekly:{gems:300,gold:3000,stones:3,masteryTomes:1,summonerXp:300},
 monthly:{gems:900,gold:10000,stones:8,masteryTomes:3,universalSoul5:5,summonerXp:1000}
};
