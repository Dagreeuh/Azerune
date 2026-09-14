export const UNIQUE_WEAPONS={
 heartworld:{id:'heartworld',name:'Marteau du Cœur-Monde',icon:'🔨',relic:'heartworld-eye',relicName:'Œil du Cœur-Monde',relicIcon:'👁️',heroes:['Dagcat','Brom','Korga','Ignovar'],setId:'volcanicFury',mainValue:86,substats:{atkPct:18,crit:14,critDamage:24,accuracy:16},effect:'Après 5 charges, une compétence offensive déclenche un impact volcanique.',source:'Chronique du Cœur-Monde'},
 stormprince:{id:'stormprince',name:'Lame du Prince-Tempête',icon:'⚡',relic:'storm-left',relicName:'Lien gauche du Prince-Tempête',relicIcon:'🔗',secondRelic:'storm-right',heroes:['Thorgar','Vaeloria','Mobeen'],setId:'speed',mainValue:82,substats:{atkPct:16,spd:15,crit:12,accuracy:18},effect:'Toutes les quatre attaques, un éclair frappe et réduit la jauge.',source:'Chronique du Prince-Tempête'},
 brokenstars:{id:'brokenstars',name:'Bâton des Astres Brisés',icon:'🌠',relic:'fallen-plume',relicName:'Plume de l’Astre déchu',relicIcon:'🪶',heroes:['Sylven','Elowen','Brilith','Caelion','Vexil'],setId:'protection',mainValue:78,substats:{hpPct:18,spd:14,resistance:18,accuracy:14},effect:'Cinq compétences alliées éveillent un alignement protecteur.',source:'Chronique des Astres Brisés'},
 sepulchral:{id:'sepulchral',name:'Cendre-Sépulcrale',icon:'🗡️',relic:'ash-shard',relicName:'Éclat de Cendre profanée',relicIcon:'🗡️',heroes:['Nashoba','Mathanae','Vélomoteur','Seraphiel'],setId:'destruction',mainValue:88,substats:{atkPct:20,crit:12,critDamage:28,resistance:12},effect:'La lame répond à son orientation purifiée ou corrompue.',source:'Chronique des Serments brisés',orientation:true},
 plague:{id:'plague',name:'Alambic du Fléau primordial',icon:'⚗️',relic:'first-plague',relicName:'Fiole du Premier Fléau',relicIcon:'⚗️',heroes:['Malvek','Morghast','Histéria'],setId:'accuracy',mainValue:81,substats:{atkPct:17,spd:13,accuracy:24,hpPct:12},effect:'Les afflictions différentes renforcent les suivantes.',source:'Chronique du Premier Fléau'},
 eclipse:{id:'eclipse',name:'Arc de la Dernière Éclipse',icon:'🌘',relic:'eclipse-string',relicName:'Corde de la Dernière Éclipse',relicIcon:'🌘',heroes:['Saylich','Kaelen'],setId:'critical',mainValue:90,substats:{atkPct:22,crit:18,critDamage:25,spd:10},effect:'Toutes les quatre attaques monocibles libèrent un trait d’éclipse.',source:'Chronique de la Dernière Éclipse'},
 tides:{id:'tides',name:'Égide des Mille Marées',icon:'🌊',relic:'ancient-tear',relicName:'Larme de la Mer ancienne',relicIcon:'🌊',heroes:['Maerys','Nerissa','Hicho','Lelianna','Aurelis'],setId:'vitality',mainValue:76,substats:{hpPct:22,defPct:16,spd:12,resistance:20},effect:'Les soins excédentaires alimentent une égide collective.',source:'Chronique des Mille Marées'}
};
export const RELICS=Object.values(UNIQUE_WEAPONS).flatMap(w=>[{id:w.relic,weaponId:w.id,name:w.relicName,icon:w.relicIcon},...(w.secondRelic?[{id:w.secondRelic,weaponId:w.id,name:'Lien droit du Prince-Tempête',icon:'🔗'}]:[])]);
export const CHRONICLE_STEPS={heartworld:[['L’Œil qui ne s’éteint jamais','Examiner l’Œil du Cœur-Monde.','inventory'],['Un noyau digne des flammes','Réunir 80 Lingots volcaniques et 25 Cœurs incendiaires.','raids'],['La forge oubliée','Réunir 10 Essences mythiques et 2 500 Essences de forge.','inventory'],['Le Seigneur sous la montagne','Vaincre la Fournaise du Cœur-Monde au niveau 10.','raids'],['Le Marteau du Cœur-Monde','Forger l’arme Unique.','gear']],stormprince:[['Les liens du captif','Réunir les deux Liens du Prince-Tempête.','mythic'],['Le tribut des vents','Réunir 100 Éclats de tempête.','mythic'],['Aeralion','Vaincre Aeralion, Prince de la Tempête captive.','worldboss'],['La Lame répond','Forger la Lame du Prince-Tempête.','gear']],brokenstars:[['La plume impossible','Examiner la Plume de l’Astre déchu.','inventory'],['Quarante éclats','Réunir 40 Fragments du Bâton.','mythic'],['Alignement parfait','Terminer Mythic+ 30.','mythic'],['Le Bâton restauré','Forger le Bâton des Astres Brisés.','gear']],sepulchral:[['Le serment profané','Examiner l’Éclat de Cendre profanée.','inventory'],['Les âmes enchaînées','Réunir 50 Âmes enchaînées.','mythic'],['Le dernier porteur','Vaincre Arkhéon, Porteur du Dernier Serment.','worldboss'],['Purifier ou corrompre','Choisir l’orientation puis forger Cendre-Sépulcrale.','gear']],plague:[['Le premier échantillon','Examiner la Fiole du Premier Fléau.','inventory'],['La recette interdite','Réunir 60 Catalyseurs du Fléau.','mythic'],['Catalyse parfaite','Déclencher les afflictions requises.','campaign'],['L’Alambic primordial','Forger l’arme Unique.','gear']],eclipse:[['La corde sans lumière','Examiner la Corde de la Dernière Éclipse.','inventory'],['Sous la lune noire','Vaincre Astreon en Mythic+ 30.','mythic'],['La Chasseuse de la Lune','Vaincre la Chasseuse de la Dernière Lune.','worldboss'],['Le dernier trait','Forger l’Arc de la Dernière Éclipse.','gear']],tides:[['La larme ancienne','Examiner la Larme de la Mer ancienne.','inventory'],['La mémoire des marées','Réunir 50 Perles abyssales.','worldboss'],['La Mer sans rive','Vaincre Thalassyr, Mémoire de l’Océan.','worldboss'],['L’Égide éveillée','Forger l’Égide des Mille Marées.','gear']]};
export const defaultChronicles=()=>({relics:{},active:{},completed:{},materials:{},kills:{},obtainedWeapons:{},orientations:{}});
export function normalizeChronicles(v={}){return{relics:{...(v.relics||{})},active:{...(v.active||{})},completed:{...(v.completed||{})},materials:{...(v.materials||{})},kills:{...(v.kills||{})},obtainedWeapons:{...(v.obtainedWeapons||{})},orientations:{...(v.orientations||{})}}}
export function createUniqueWeapon(id,setId,orientation){const w=UNIQUE_WEAPONS[id];if(!w)return null;return{id:`unique-${id}`,uniqueId:id,name:`${w.icon} ${w.name}`,icon:w.icon,slot:'Arme',setId:setId||w.setId,quality:'unique',stars:5,itemLevel:180,level:0,mainStat:'atk',mainValue:w.mainValue,substats:{...w.substats},locked:true,unique:true,compatibleHeroes:[...w.heroes],uniqueEffect:w.effect,orientation:orientation||null,source:w.source,upgradeRolls:[],investedEssence:0}}
export const weaponForHero=name=>Object.values(UNIQUE_WEAPONS).find(w=>w.heroes.includes(name));

/* ===================================================================== *
 * Les Vestiges : ce qui rend une Chronique longue.
 *
 * Le squelette existait deja — une relique tres rare ouvre la Chronique, les
 * etapes sont ecrites, l'effet de l'arme est implemente dans le moteur. Mais
 * « Valider l'etape » etait un bouton libre, sans aucune condition : le joueur
 * cliquait trois fois et forgeait l'arme. Les « 80 Lingots volcaniques » et les
 * « 100 Eclats de tempete » n'etaient que du texte, comptes par rien —
 * addLegendaryMaterial n'etait appele nulle part dans tout le projet.
 *
 * Ce bloc rend ces exigences reelles. Cinq natures d'etape, et aucune n'invente
 * de nouvelle instrumentation de combat : les compteurs existent tous deja.
 * ===================================================================== */

/** Materiaux de Chronique. Ils ne tombent que si leur Chronique est active. */
// `rate` egalise la longueur des quetes sans toucher aux quantites annoncees
// dans les textes d'etape — « Quarante eclats » doit rester quarante. Un
// materiau rare tombe moins vite qu'un materiau courant, et c'est le taux qui
// porte la difference, pas le compteur.
export const LEGENDARY_MATERIALS={
 'volcanic-ingot':{name:'Lingot volcanique',icon:'🌋',activity:'raids',weaponId:'heartworld',rate:.5},
 'incendiary-heart':{name:'Cœur incendiaire',icon:'❤️‍🔥',activity:'raids',weaponId:'heartworld',rate:.2},
 'storm-shard':{name:'Éclat de tempête',icon:'⚡',activity:'mythic',weaponId:'stormprince',rate:.5},
 'staff-fragment':{name:'Fragment du Bâton',icon:'🌠',activity:'mythic',weaponId:'brokenstars',rate:.25},
 'chained-soul':{name:'Âme enchaînée',icon:'⛓️',activity:'mythic',weaponId:'sepulchral',rate:.25},
 'plague-catalyst':{name:'Catalyseur du Fléau',icon:'⚗️',activity:'mythic',weaponId:'plague',rate:.3},
 'abyssal-pearl':{name:'Perle abyssale',icon:'🫧',activity:'worldboss',weaponId:'tides',rate:.5}
};

/**
 * Ce que chaque etape exige reellement, dans l'ordre des CHRONICLE_STEPS.
 *
 * `free` couvre les etapes de lecture et de forge : examiner la relique ne doit
 * rien couter, et forger est deja garde par forgeUniqueWeapon.
 */
export const CHRONICLE_REQUIREMENTS={
 heartworld:[
  {kind:'free'},
  {kind:'material',items:[['volcanic-ingot',80],['incendiary-heart',25]]},
  {kind:'resource',items:[['mythicEssence',10,'Essences mythiques'],['forgeEssence',2500,'Essences de forge']]},
  {kind:'kill',id:'heartforge-10',label:'Fournaise du Cœur-Monde niveau 10',count:1},
  {kind:'free'}
 ],
 stormprince:[
  {kind:'relics',ids:['storm-left','storm-right'],label:'Les deux Liens du Prince-Tempête'},
  {kind:'material',items:[['storm-shard',100]]},
  {kind:'kill',id:'worldboss-aeralion',label:'Aeralion, Prince de la Tempête captive',count:1},
  {kind:'free'}
 ],
 brokenstars:[
  {kind:'free'},
  {kind:'material',items:[['staff-fragment',40]]},
  {kind:'kill',id:'mythic-30',label:'Mythic+ 30 terminé',count:1},
  {kind:'free'}
 ],
 sepulchral:[
  {kind:'free'},
  {kind:'material',items:[['chained-soul',50]]},
  {kind:'kill',id:'worldboss-arkheon',label:'Arkhéon, Porteur du Dernier Serment',count:1},
  {kind:'free'}
 ],
 plague:[
  {kind:'free'},
  {kind:'material',items:[['plague-catalyst',60]]},
  // Les afflictions sont deja comptees par lifetime.combat.dotDamageDealt :
  // aucune instrumentation nouvelle, et la condition colle a l'arme.
  {kind:'stat',path:'lifetime.combat.dotDamageDealt',count:750000,label:'Dégâts d’affliction cumulés'},
  {kind:'free'}
 ],
 eclipse:[
  {kind:'free'},
  {kind:'kill',id:'mythic-30-astreon',label:'Astreon vaincu en Mythic+ 30',count:1},
  {kind:'kill',id:'worldboss-huntress',label:'La Chasseuse de la Dernière Lune',count:1},
  {kind:'free'}
 ],
 tides:[
  {kind:'free'},
  {kind:'material',items:[['abyssal-pearl',50]]},
  {kind:'kill',id:'worldboss-thalassyr',label:'Thalassyr, Mémoire de l’Océan',count:1},
  {kind:'free'}
 ]
};

const nombre=valeur=>Number.isFinite(Number(valeur))?Number(valeur):0;
const lire=(objet,chemin)=>String(chemin||'').split('.').reduce((valeur,cle)=>valeur?.[cle],objet);

/** Exigence d'une etape, ou `free` si l'etape n'en declare aucune. */
export const chronicleRequirement=(weaponId,step)=>
 CHRONICLE_REQUIREMENTS[weaponId]?.[Math.max(0,Number(step)||0)]||{kind:'free'};

/**
 * Etat d'avancement d'une etape, lisible tel quel par l'ecran.
 *
 * `contexte` reunit ce que le joueur possede : materiaux, reliques, compteurs de
 * victoire, statistiques a vie et monnaies. Fonction pure : elle ne consomme
 * rien et ne decide rien d'autre que « pret ou pas ».
 */
export function chronicleStepStatus(weaponId,step,contexte={}){
 const exigence=chronicleRequirement(weaponId,step);
 const materiaux=contexte.materials||{},reliques=contexte.relics||{},victoires=contexte.kills||{};
 const lignes=[];
 if(exigence.kind==='material')
  (exigence.items||[]).forEach(([id,besoin])=>lignes.push({
   id,label:LEGENDARY_MATERIALS[id]?.name||id,icon:LEGENDARY_MATERIALS[id]?.icon||'◆',
   have:nombre(materiaux[id]),need:besoin}));
 else if(exigence.kind==='resource')
  (exigence.items||[]).forEach(([id,besoin,libelle])=>lignes.push({
   id,label:libelle,icon:'🔹',have:nombre(contexte.resources?.[id]),need:besoin}));
 else if(exigence.kind==='relics')
  (exigence.ids||[]).forEach(id=>lignes.push({
   id,label:RELICS.find(relic=>relic.id===id)?.name||id,icon:'🗝️',
   have:reliques[id]?.owned?1:0,need:1}));
 else if(exigence.kind==='kill')
  lignes.push({id:exigence.id,label:exigence.label,icon:'⚔️',
   have:Math.min(nombre(victoires[exigence.id]),exigence.count||1),need:exigence.count||1});
 else if(exigence.kind==='stat')
  lignes.push({id:exigence.path,label:exigence.label,icon:'☠️',
   have:Math.min(nombre(lire(contexte.stats,exigence.path)),exigence.count),need:exigence.count});
 return{kind:exigence.kind,lines:lignes,ready:lignes.every(ligne=>ligne.have>=ligne.need)};
}

/** Materiaux a retirer quand l'etape est validee. Seuls les materiaux se consomment. */
export function chronicleStepCost(weaponId,step){
 const exigence=chronicleRequirement(weaponId,step);
 return exigence.kind==='material'?Object.fromEntries((exigence.items||[]).map(([id,besoin])=>[id,besoin])):{};
}

/**
 * Butin de Vestiges d'une activite terminee.
 *
 * Le rendement suit le niveau du contenu : monter en difficulte raccourcit la
 * quete, ce qui est la recompense de la progression. Un materiau ne tombe que
 * si sa Chronique est active — c'est le signal que la chasse a commence, et ca
 * evite d'accumuler des Vestiges pour une arme jamais decouverte.
 */
export const MATERIAL_YIELD={mythic:level=>2+Math.floor(nombre(level)/5),
 raids:level=>2+Math.floor(nombre(level)/2),worldboss:()=>3};
/** Vestiges gagnes pour un materiau donne, a une activite et un niveau donnes. */
export function materialYield(id,activity,level){
 const rendement=MATERIAL_YIELD[activity],materiau=LEGENDARY_MATERIALS[id];
 if(!rendement||!materiau)return 0;
 return Math.max(1,Math.round(rendement(level)*(materiau.rate??1)));
}
export function legendaryMaterialDrops(activity,level,active={}){
 if(!MATERIAL_YIELD[activity])return{};
 return Object.fromEntries(Object.entries(LEGENDARY_MATERIALS)
  .filter(([,materiau])=>materiau.activity===activity&&active[materiau.weaponId])
  .map(([id])=>[id,materialYield(id,activity,level)]));
}

/** Nombre de passages d'activite necessaires a une etape de materiaux. */
export function chronicleGrindLength(weaponId,step,activity,level){
 const exigence=chronicleRequirement(weaponId,step);
 if(exigence.kind!=='material')return 0;
 return Math.max(...(exigence.items||[]).map(([id,besoin])=>
  Math.ceil(besoin/Math.max(1,materialYield(id,activity,level)))),0);
}
