import{ENEMIES}from'../data/enemies';
import{skillBonuses}from'../utils/skills';
import{affinity,normalizeElement}from'../utils/elements';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const copyUnit=unit=>({...unit,buffs:{...unit.buffs},debuffs:{...unit.debuffs},mechanic:{...(unit.mechanic||{}),danceSteps:[...(unit.mechanic?.danceSteps||[])]}});
const makeEnemies=(source,scale=1,wave=1)=>source.map((enemy,index)=>{let hp=Math.round(enemy.hp*scale),atk=Math.round(enemy.atk*scale),def=Math.round(enemy.def*scale);return{...enemy,id:`e-w${wave}-${index}-${enemy.id||'mythic'}`,element:normalizeElement(enemy.element),accuracy:enemy.accuracy||10,resistance:enemy.resistance||15,hp,atk,def,maxHp:hp,atb:Math.random()*12,buffs:{},debuffs:{},shield:0,maxShield:0,dead:false,side:'enemy',currentSpd:enemy.spd,skip:false,cooldowns:[0,0],enemyTurnCount:0}});
const affixState=(ids=[])=>({ids,deathsThisWave:0,revived:false});
const bossDotAmount=(unit,debuff,percent,fallback)=>{const raw=Math.round(unit.maxHp*percent),sourceAtk=Math.max(0,Number(debuff?.sourceAtk)||0);if(!unit.bossUnit||!sourceAtk)return raw;return Math.min(raw,Math.round(sourceAtk*fallback));};
const decay=group=>Object.fromEntries(Object.entries(group||{}).map(([key,value])=>[key,{...value,turns:value.turns-1}]).filter(([,value])=>value.turns>0));

const DEBUFF_LABELS={atkDown:'Attaque réduite',defDown:'Défense réduite',slow:'Vitesse réduite',mark:'Marque',poison:'Poison',burn:'Brûlure',bleed:'Saignement',stun:'Étourdissement',provoke:'Provocation',hunt:'Traque',virulence:'Virulence',exposed:'Armure exposée',agony:'Agonie',corruption:'Corruption',festering:'Blessure purulente',healingDown:'Soins reçus réduits'};
const debuffChance=(actor,target,baseChance,mastery=0)=>clamp(baseChance+mastery+(actor.accuracy||0)/100-(target.resistance||0)/100,.15,.95);
const tryDebuff=(actor,target,key,turns,baseChance,mastery,resisted)=>{
  const chance=debuffChance(actor,target,baseChance,mastery);
  if(Math.random()<=chance){target.debuffs[key]={turns};return true;}
  resisted.push(`${target.name} résiste à ${DEBUFF_LABELS[key]||key} (${Math.round(chance*100)} %).`);
  return false;
};

export const winner=(allies,enemies)=>enemies.every(unit=>unit.dead)?'ally':allies.every(unit=>unit.dead)?'enemy':null;
export function advanceMythicWave(battle){if(!battle?.mythic||battle.winner!=='ally'||battle.wave>=battle.totalWaves)return battle;const nextWave=battle.wave+1,enemies=makeEnemies(battle.waves[nextWave-1],1,nextWave),allies=battle.allies.map(unit=>({...unit,atb:Math.min(25,Number(unit.atb)||0),buffs:{...unit.buffs},debuffs:{...unit.debuffs}}));return{...battle,allies,enemies,wave:nextWave,winner:null,turn:null,affixState:{...(battle.affixState||{}),deathsThisWave:0,revived:false},lastEvents:[],log:[`Vague ${nextWave}/${battle.totalWaves} : de nouveaux ennemis apparaissent.`,...(battle.log||[])].slice(0,16)}}

export function createBattle(team,heroes,getStats,options={}){
  const rawEnemySource=options.enemies||ENEMIES,affixes=options.affixIds||[];const enemySource=rawEnemySource.map(enemy=>{const boss=Boolean(enemy.bossUnit),fortified=affixes.includes('fortified')&&!boss,tyrannical=affixes.includes('tyrannical')&&boss;return{...enemy,hp:Math.round(enemy.hp*(fortified?1.15:tyrannical?1.18:1)),atk:Math.round(enemy.atk*(fortified||tyrannical?1.10:1)),resistance:(enemy.resistance||15)+(fortified?5:0),accuracy:(enemy.accuracy||10)+(tyrannical?8:0)}});
  const enemyScale=options.enemyScale||1;
  return{
    allies:team.map(id=>{const hero=heroes.find(item=>item.id===id),stats=getStats(hero),initialShield=stats.setEffects?.includes('protectionSet')?Math.round(stats.hp*.15):0;return{...hero,element:normalizeElement(hero.element),...stats,maxHp:stats.hp,atb:Math.random()*12,cooldowns:[0,0,0],buffs:initialShield?{protectionSet:{turns:99}}:{},debuffs:{},shield:initialShield,maxShield:initialShield,dead:false,side:'ally',currentSpd:stats.spd,skip:false,uniqueWeapon:hero.uniqueWeapon||null,weaponCharge:0,mechanic:{key:hero.id,value:0,max:hero.name==='Korga'||hero.skills?.some(skill=>skill.effect==='shieldExecute')?0:hero.id===28?6:5,mode:hero.id===25?'high':null,targetId:null,lastSkill:null,danceSteps:[],active:hero.id===25}}}),
    enemies:makeEnemies(enemySource,enemyScale,1),
    turn:null,winner:null,rewarded:false,mythic:options.mythic||null,wave:1,totalWaves:options.waves?.length||1,waves:options.waves||null,affixState:affixState(options.affixIds),raid:options.raid||null,raidState:options.raid?{charges:0,maxCharges:options.raid.eruptionAt||10,phaseTwo:false,failedMechanic:null,championActions:0}:null,lastEvents:[],eventSeq:0,log:['Le combat commence.']
  };
}

export function nextTurn(battle){
  if(!battle||battle.winner)return battle;
  let raidState=battle.raidState?{...battle.raidState}:null;
  let allies=battle.allies.map(unit=>({...unit,currentSpd:Math.max(20,Math.round(unit.spd*(unit.buffs.speedUp?1.25:1)*(unit.debuffs.slow?0.75:1)))}));
  let enemies=battle.enemies.map(unit=>({...unit,currentSpd:Math.max(20,Math.round(unit.spd*(unit.buffs.speedUp?1.25:1)*(unit.debuffs.slow?0.75:1)))}));
  const early=winner(allies,enemies);
  if(early)return{...battle,allies,enemies,winner:early,turn:null};
  const living=[...allies,...enemies].filter(unit=>!unit.dead).map(unit=>({...unit,atb:Number.isFinite(unit.atb)?Math.max(0,unit.atb):0,currentSpd:Number.isFinite(unit.currentSpd)?Math.max(20,unit.currentSpd):20}));
  let gaugeSteps=0;while(!living.some(unit=>unit.atb>=100)&&gaugeSteps<10000){living.forEach(unit=>unit.atb+=unit.currentSpd/100);gaugeSteps+=1;}if(gaugeSteps>=10000)living.forEach(unit=>unit.atb=Math.max(unit.atb,100));
  living.sort((a,b)=>b.atb-a.atb);
  const actor=living[0],unit=copyUnit(actor),stunned=Boolean(unit.debuffs.stun);
  let dot=0,healing=0;const periodic=[];
  if(unit.debuffs.poison){const stacks=Math.max(1,unit.debuffs.virulence?.stacks||1),amount=Math.round(unit.maxHp*.06*(1+.12*(stacks-1)));dot+=amount;periodic.push(`Poison ${amount}`);}
  if(unit.debuffs.burn){const amount=Math.round(bossDotAmount(unit,unit.debuffs.burn,.05,1.15)*(unit.setEffects?.includes('fireproofSet')?.75:1));dot+=amount;periodic.push(`Brûlure ${amount}`);}
  if(unit.debuffs.bleed){const amount=bossDotAmount(unit,unit.debuffs.bleed,.045,1.05);dot+=amount;periodic.push(`Saignement ${amount}`);}
  if(unit.debuffs.agony){const stacks=Math.min(5,unit.debuffs.agony.stacks||1),amount=Math.round(unit.maxHp*(.018+.009*stacks));dot+=amount;periodic.push(`Agonie ${amount}`);unit.debuffs.agony={...unit.debuffs.agony,stacks:Math.min(5,stacks+1)};}
  if(unit.debuffs.corruption){const amount=bossDotAmount(unit,unit.debuffs.corruption,.035,.95);dot+=amount;periodic.push(`Corruption ${amount}`);}
  if(unit.buffs.regen){const amount=Math.round(unit.maxHp*.06);healing+=amount;periodic.push(`Régénération +${amount}`);}
  if(unit.buffs.healingTotem){const source=allies.find(value=>value.id===unit.buffs.healingTotem.source&&!value.dead),amount=Math.round(unit.maxHp*(source?.mechanic?.active?(Number(source.resonanceLevel||0)>=4?.09:.08):.05));healing+=amount;periodic.push(`Totem +${amount}`);}
  if(unit.buffs.healingSeed&&unit.hp/unit.maxHp<=.5){const amount=Math.round(unit.buffs.healingSeed.power||unit.maxHp*.2);healing+=amount;const first=Object.keys(unit.debuffs||{}).find(key=>!['provoke'].includes(key));if(first)delete unit.debuffs[first];delete unit.buffs.healingSeed;periodic.push(`Graine +${amount}`);}
  unit.hp=clamp(unit.hp-dot+healing,0,unit.maxHp);unit.dead=unit.hp<=0;
  const expiredBuffs=Object.entries(unit.buffs||{}).filter(([,value])=>value.turns<=1).map(([key])=>key),expiredDebuffs=Object.entries(unit.debuffs||{}).filter(([,value])=>value.turns<=1).map(([key])=>key);
  unit.buffs=decay(unit.buffs);unit.debuffs=decay(unit.debuffs);
  if(unit.mechanic?.active&&['livingGarden','healingTotem'].includes(unit.mechanic.type)){unit.mechanic.value=Math.max(0,(unit.mechanic.value||0)-1);if(unit.mechanic.value===0)unit.mechanic.active=false;}
  allies=allies.map(value=>value.id===unit.id?{...unit,atb:100,skip:stunned}:({...value,atb:living.find(x=>x.id===value.id)?.atb??value.atb}));
  enemies=enemies.map(value=>value.id===unit.id?{...unit,atb:100,skip:stunned}:({...value,atb:living.find(x=>x.id===value.id)?.atb??value.atb}));
  const battleWinner=winner(allies,enemies);
  const events=[];
  if(dot)events.push(`${unit.name} subit ${dot} dégâts périodiques (${periodic.filter(entry=>!entry.includes('+')).join(', ')}).`);
  if(healing)events.push(`${unit.name} récupère ${healing} PV (${periodic.filter(entry=>entry.includes('+')).join(', ')}).`);
  if(expiredBuffs.length||expiredDebuffs.length)events.push(`${unit.name} : expiration de ${[...expiredBuffs,...expiredDebuffs].join(', ')}.`);
  const structured=[];if(dot)structured.push({id:`event-${(battle.eventSeq||0)+1}`,sourceId:unit.id,targetId:unit.id,amount:dot,type:'dot',affinity:'neutral',critical:false});if(healing)structured.push({id:`event-${(battle.eventSeq||0)+2}`,sourceId:unit.id,targetId:unit.id,amount:healing,type:'heal',affinity:'neutral',critical:false});return{...battle,allies,enemies,raidState,lastEvents:structured,eventSeq:(battle.eventSeq||0)+structured.length,winner:battleWinner,turn:battleWinner||unit.dead?null:unit.id,log:[...events,...battle.log].slice(0,12)};
}

export function finish(battle,id,text,retain=0){
  let allies=battle.allies.map(unit=>unit.id===id?{...unit,atb:retain,cooldowns:unit.cooldowns.map(value=>Math.max(0,value-1)),skip:false}:unit);
  let enemies=battle.enemies.map(unit=>unit.id===id?{...unit,atb:0,skip:false}:unit),raidState=battle.raidState?{...battle.raidState}:null,events=[];
  if(raidState){
    const actor=allies.find(unit=>unit.id===id),ember=enemies.find(unit=>unit.raidRole==='ember'),previousEmber=battle.enemies.find(unit=>unit.raidRole==='ember');
    if(previousEmber&&!previousEmber.dead&&ember?.dead){raidState.charges=Math.max(0,raidState.charges-4);events.push('L’Élémentaire de braise est détruit : 4 charges retirées.');}
    if(actor){raidState.charges+=1;raidState.championActions+=1;events.push(`Cœur incandescent : ${raidState.charges}/${raidState.maxCharges} charges.`);}
    const boss=enemies.find(unit=>unit.raidRole==='boss'&&!unit.dead);
    if(boss&&!raidState.phaseTwo&&boss.hp/boss.maxHp<=.30&&battle.raid?.level===10){raidState.phaseTwo=true;raidState.maxCharges=8;boss.buffs.atkUp={turns:99};boss.buffs.speedUp={turns:99};events.push('Rhazakar entre dans l’Incarnation du Brasier : Éruption à 8 charges.');}
    if(boss&&raidState.charges>=raidState.maxCharges){
      raidState.charges=0;raidState.failedMechanic='Éruption du Cœur-Monde';
      allies=allies.map(unit=>{if(unit.dead)return unit;const damage=Math.round(unit.maxHp*(battle.raid.level>=9?.95:.80));const next={...unit,hp:Math.max(0,unit.hp-damage),debuffs:{...unit.debuffs,burn:{turns:3}}};next.dead=next.hp<=0;return next});
      if(battle.raid.level>=7)boss.buffs.atkUp={turns:3};events.push('ÉCHEC DE MÉCANIQUE : Rhazakar déclenche Éruption du Cœur-Monde.');
    }
  }
  if(battle.mythic){const before=new Map(battle.enemies.map(unit=>[unit.id,unit.dead])),newDeaths=enemies.filter(unit=>unit.dead&&!before.get(unit.id));if(newDeaths.length){const ids=battle.affixState?.ids||[];if(ids.includes('bolstering'))enemies=enemies.map(unit=>unit.dead?unit:{...unit,buffs:{...unit.buffs,atkUp:{turns:2},defUp:{turns:2}}});if(ids.includes('bursting'))allies=allies.map(unit=>unit.dead?unit:(()=>{const damage=Math.round(unit.maxHp*.03*newDeaths.length),hp=Math.max(0,unit.hp-damage);return{...unit,hp,dead:hp<=0}})());events.push(`${newDeaths.length} ennemi(s) vaincu(s) déclenchent les affixes.`);}}
  return{...battle,allies,enemies,raidState,turn:null,winner:winner(allies,enemies),log:[...events.reverse(),text,...battle.log].slice(0,16)};
}

export function enemyAction(battle){
  const actor=battle.enemies.find(unit=>unit.id===battle.turn);
  if(!actor||actor.dead)return{...battle,turn:null};
  if(actor.skip)return finish(battle,actor.id,`${actor.name} est étourdi et passe son tour.`);
  let allies=battle.allies.map(copyUnit),enemies=battle.enemies.map(copyUnit);
  const choices=allies.filter(unit=>!unit.dead);
  const provoker=choices.find(unit=>unit.id===actor.debuffs.provoke?.source);
  const enemyAffinityRank=key=>key==='effective'?0:key==='neutral'?1:2;
  const tankRole=unit=>/gardien|tank|vengeance|brise-fer/i.test(String(unit.role||''));
  const elementalTarget=choices
    .map((unit,index)=>({unit,index,rank:enemyAffinityRank(affinity(actor.element,unit.element).key),tank:tankRole(unit)?-18:0}))
    .sort((left,right)=>(left.rank*100+left.tank)-(right.rank*100+right.tank)||left.index-right.index)[0]?.unit;
  const victim=provoker||elementalTarget||choices[0];
  if(!victim)return{...battle,winner:'enemy',turn:null};
  const cooldowns=(actor.cooldowns||[0,0]).map(value=>Math.max(0,value-1));
  const turnCount=(actor.enemyTurnCount||0)+1;
  const resisted=[],actionEvents=[];
  const hit=(target,multiplier=1)=>{
    const defense=target.def*(target.buffs.defUp?1.3:1)*(target.debuffs.defDown?0.7:1);
    const attackPower=actor.atk*(actor.debuffs.atkDown?.7:1);
    const variance=.92+Math.random()*.16,critical=Math.random()<(actor.bossUnit?(actor.campaignUnit?({easy:.10,normal:.12,hard:.14,hardcore:.16}[actor.campaignDifficulty]||.12):.16):.08);
    const relation=affinity(actor.element,target.element);
    let damage=Math.max(6,Math.round(attackPower*multiplier*100/(100+defense*3)*variance*(actor.bossUnit?(actor.campaignUnit?({easy:1.04,normal:1.06,hard:1.09,hardcore:1.12}[actor.campaignDifficulty]||1.06):1.12):1)*(critical?1.5:1)*relation.damage));if(target.id===25&&target.mechanic?.mode==='high')damage=Math.max(1,Math.round(damage*.82));
    const absorbed=Math.min(target.shield,damage);damage-=absorbed;
    target.hp=Math.max(0,target.hp-damage);target.shield=Math.max(0,target.shield-absorbed);target.dead=target.hp<=0;if(battle.mythic&&battle.affixState?.ids?.includes('necrotic')&&damage>0)target.debuffs.necrotic={turns:2,stacks:Math.min(5,(target.debuffs.necrotic?.stacks||0)+1)};
    const guardianId=target.buffs.guardianLink?.source,guardian=allies.find(unit=>unit.id===guardianId&&!unit.dead);
    if(guardian&&damage>0){const redirected=Math.min(guardian.hp-1,Math.round(damage*.30));guardian.hp=Math.max(1,guardian.hp-redirected);target.hp=Math.min(target.maxHp,target.hp+redirected);damage-=redirected;actionEvents.push({id:`event-${(battle.eventSeq||0)+actionEvents.length+1}-${guardian.id}`,sourceId:actor.id,targetId:guardian.id,amount:redirected,type:'damage',affinity:'neutral',critical:false});}
    const aurelis=allies.find(unit=>unit.id===23&&!unit.dead&&unit.mechanic?.active),needsRescue=target.hp>0&&target.hp/target.maxHp<=.25&&(target.shield||0)<=0;
    if(aurelis&&needsRescue&&(aurelis.mechanic.targetId==null||aurelis.mechanic.targetId===target.id)){const rescue=Math.round(target.maxHp*(Number(aurelis.resonanceLevel||0)>=4?.25:.22));target.shield+=rescue;target.maxShield=Math.max(target.maxShield||0,target.shield);aurelis.mechanic.active=false;actionEvents.push({id:`event-${(battle.eventSeq||0)+actionEvents.length+1}-${target.id}-rescue`,sourceId:aurelis.id,targetId:target.id,amount:rescue,type:'shield',affinity:'neutral',critical:false});}
    if(target.id===18&&damage>0)target.mechanic.value=Math.min(5,(target.mechanic.value||0)+1);
    actionEvents.push({id:`event-${(battle.eventSeq||0)+actionEvents.length+1}-${target.id}`,sourceId:actor.id,targetId:target.id,amount:damage,type:'damage',affinity:relation.key,critical});
    if(damage>0&&!target.dead&&target.setEffects?.includes('counterSet')&&Math.random()<.20){const counterDefense=actor.def*(actor.buffs.defUp?1.3:1)*(actor.debuffs.defDown?.7:1),counter=Math.max(1,Math.round(target.atk*.75*100/(100+counterDefense*3)));actor.hp=Math.max(0,actor.hp-counter);actor.dead=actor.hp<=0;actionEvents.push({id:`event-${(battle.eventSeq||0)+actionEvents.length+1}-${actor.id}-counter`,sourceId:target.id,targetId:actor.id,amount:counter,type:'damage',affinity:'neutral',critical:false,sourceType:'counter'});}
    return{damage,absorbed,critical,relation};
  };
  let text='';
  const expeditionBoss=enemies.find(unit=>unit.bossUnit&&!unit.dead);
  if(actor.expeditionRole==='minor-shard'){
    enemies.filter(unit=>!unit.dead).forEach(unit=>{unit.atb=Math.min(100,(unit.atb||0)+14);unit.buffs.speedUp={turns:2};});text=`${actor.name} libère une impulsion : l’équipe ennemie gagne de la jauge et de la Vitesse.`;
  }else if(actor.expeditionRole==='major-shard'&&expeditionBoss){
    expeditionBoss.buffs.defUp={turns:2};const barrier=Math.round(expeditionBoss.maxHp*.06);expeditionBoss.shield=(expeditionBoss.shield||0)+barrier;expeditionBoss.maxShield=Math.max(expeditionBoss.maxShield||0,expeditionBoss.shield);actionEvents.push({id:`event-${(battle.eventSeq||0)+actionEvents.length+1}`,sourceId:actor.id,targetId:expeditionBoss.id,amount:barrier,type:'shield',affinity:'neutral',critical:false});text=`${actor.name} protège le Gardien : Défense augmentée et ${barrier} de bouclier.`;
  }else if(actor.expeditionRole==='mythic-shard'&&expeditionBoss){
    const heal=Math.round(expeditionBoss.maxHp*.09);expeditionBoss.hp=Math.min(expeditionBoss.maxHp,expeditionBoss.hp+heal);expeditionBoss.buffs.atkUp={turns:2};actionEvents.push({id:`event-${(battle.eventSeq||0)+actionEvents.length+1}`,sourceId:actor.id,targetId:expeditionBoss.id,amount:heal,type:'heal',affinity:'neutral',critical:false});text=`${actor.name} rend ${heal} PV au Gardien et augmente son Attaque.`;
  }else if(actor.expeditionRole==='ascension-guardian'){
    const shards=enemies.filter(unit=>!unit.dead&&String(unit.expeditionRole||'').endsWith('-shard')).length,mult=1.02+shards*.12;const result=hit(victim,mult);text=`${actor.name} canalise ${shards} Éclat(s) : ${result.damage} dégâts.`;
  }else if(actor.expeditionRole==='guard'&&expeditionBoss){expeditionBoss.buffs.defUp={turns:2};const result=hit(victim,.75);text=`${actor.name} protège le Trésorier et frappe ${victim.name} : ${result.damage} dégâts.`;
  }else if(actor.expeditionRole==='thief'){const result=hit(victim,1.05);text=`${actor.name} tente de s’enfuir avec le butin : ${result.damage} dégâts.`;
  }else if(actor.expeditionRole==='time-spirit'){choices.forEach(target=>target.atb=Math.max(0,target.atb-18));const result=hit(victim,.7);text=`${actor.name} ralentit le temps : ${result.damage} dégâts et jauge de l’équipe réduite.`;
  }else if(actor.expeditionRole==='ancient'){actor.buffs.atkUp={turns:3};const result=hit(victim,1+.04*Math.min(8,turnCount));text=`${actor.name} accumule la puissance des âges : ${result.damage} dégâts.`;
  }else if(actor.expeditionRole==='offense-crystal'&&expeditionBoss){expeditionBoss.buffs.atkUp={turns:2};text=`${actor.name} augmente l’Attaque du Golem astral.`;
  }else if(actor.expeditionRole==='defense-crystal'&&expeditionBoss){expeditionBoss.buffs.defUp={turns:2};text=`${actor.name} augmente la Défense du Golem astral.`;
  }else if(actor.expeditionRole==='healing-crystal'&&expeditionBoss){const heal=Math.round(expeditionBoss.maxHp*.08);expeditionBoss.hp=Math.min(expeditionBoss.maxHp,expeditionBoss.hp+heal);actionEvents.push({id:`event-${(battle.eventSeq||0)+actionEvents.length+1}`,sourceId:actor.id,targetId:expeditionBoss.id,amount:heal,type:'heal',affinity:'neutral',critical:false});text=`${actor.name} rend ${heal} PV au Golem astral.`;
  }else if(actor.raidRole==='priest'&&cooldowns[0]===0){const boss=enemies.find(unit=>unit.raidRole==='boss'&&!unit.dead);const heal=Math.round(boss.maxHp*.08);boss.hp=Math.min(boss.maxHp,boss.hp+heal);actionEvents.push({id:`event-${(battle.eventSeq||0)+actionEvents.length+1}`,sourceId:actor.id,targetId:boss.id,amount:heal,type:'heal',affinity:'neutral',critical:false});boss.buffs.atkUp={turns:2};cooldowns[0]=3;text=`${actor.name} canalise Flamme nourricière : ${heal} PV rendus à Rhazakar et Attaque augmentée.`;
  }else if(actor.raidRole==='guardian'&&cooldowns[0]===0){choices.forEach(target=>tryDebuff(actor,target,'provoke',1,.55,0,resisted));actor.buffs.defUp={turns:2};cooldowns[0]=3;text=`${actor.name} utilise Rempart de lave : Provocation et Défense augmentée.`;
  }else if(actor.aiRole==='lunar-stag'){
    if(cooldowns[0]===0&&turnCount%2===0){let total=0;for(const target of choices.filter(unit=>!unit.dead)){const result=hit(target,.55);total+=result.damage;}cooldowns[0]=3;text=`${actor.name} utilise Onde lunaire : ${total} dégâts de zone.`;}
    else{const result=hit(victim,1);text=`${actor.name}${result.critical?' réalise un coup critique et':''} frappe ${victim.name} : ${result.damage} dégâts · ${result.relation.label}${result.absorbed?` · ${result.absorbed} absorbés`:''}.`;}
  }else if(actor.campaignUnit&&actor.campaignRole==='support'&&cooldowns[0]===0&&turnCount%2===0){
    const ally=[...enemies].filter(unit=>!unit.dead).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
    if(actor.campaignZone==='valebrume'){const heal=Math.round(ally.maxHp*(.08+.02*(actor.campaignMechanicTier||1)));ally.hp=Math.min(ally.maxHp,ally.hp+heal);ally.buffs.regen={turns:2};text=`${actor.name} répand la Sève vivante : ${heal} PV et Régénération.`;}
    else if(actor.campaignZone==='oeil-clair'||actor.campaignZone==='temple-inebranlable'){const key=Object.keys(ally.debuffs||{})[0];if(key)delete ally.debuffs[key];ally.buffs.defUp={turns:2};text=`${actor.name} purifie un malus et consacre ${ally.name}.`;}
    else if(actor.campaignZone==='bastion-pierre'||actor.campaignZone==='rempart-anciens'){const barrier=Math.round(ally.maxHp*(.10+.04*(actor.campaignMechanicTier||1)));ally.shield+=barrier;ally.maxShield=Math.max(ally.maxShield||0,ally.shield);ally.buffs.defUp={turns:2};actionEvents.push({id:`event-${(battle.eventSeq||0)+actionEvents.length+1}`,sourceId:actor.id,targetId:ally.id,amount:barrier,type:'shield',affinity:'neutral',critical:false});text=`${actor.name} érige un rempart de ${barrier}.`;}
    else{const heal=Math.round(ally.maxHp*(.08+.03*(actor.campaignMechanicTier||1)));ally.hp=Math.min(ally.maxHp,ally.hp+heal);ally.buffs.atkUp={turns:2};text=`${actor.name} soutient ${ally.name} : ${heal} PV et Attaque augmentée.`;}
    cooldowns[0]=3;
  }else if(actor.campaignUnit&&cooldowns[0]===0&&turnCount%2===0){
    const z=actor.campaignZone;let result;
    if(z==='crypte-sanglante'){result=hit(victim,1.08);const life=Math.round(result.damage*.35);actor.hp=Math.min(actor.maxHp,actor.hp+life);actionEvents.push({id:`event-${(battle.eventSeq||0)+actionEvents.length+1}`,sourceId:actor.id,targetId:actor.id,amount:life,type:'heal',affinity:'neutral',critical:false});text=`${actor.name} assouvit sa Soif carmine : ${result.damage} dégâts et ${life} PV récupérés.`;}
    else if(z==='cimes-vent'){choices.forEach(t=>t.atb=Math.max(0,t.atb-12));enemies.filter(e=>!e.dead).forEach(e=>e.atb=Math.min(100,e.atb+10));result=hit(victim,.78);text=`${actor.name} inverse les courants : ${result.damage} dégâts et jauges déplacées.`;}
    else if(z==='arene-lames'){victim.debuffs.mark={turns:2};result=hit(victim,victim.hp/victim.maxHp<=.35?1.55:1.18);text=`${actor.name} pose une Marque d’exécution : ${result.damage} dégâts.`;}
    else if(z==='netherys'){victim.debuffs.healingDown={turns:2};result=hit(victim,1+.04*Math.min(8,turnCount));text=`${actor.name} propage l’Érosion du Vide : ${result.damage} dégâts, soins réduits.`;}
    else if(z==='couronne-givree'){victim.debuffs.slow={turns:2};victim.debuffs.healingDown={turns:2};result=hit(victim,.95);text=`${actor.name} applique Gel persistant : ${result.damage} dégâts.`;}
    else if(z==='fournaise-incendiaire'||z==='coeur-ignifuge'){victim.debuffs.burn={turns:3};if(z==='coeur-ignifuge')victim.debuffs.healingDown={turns:2};result=hit(victim,1.02);text=`${actor.name} embrase ${victim.name} : ${result.damage} dégâts.`;}
    else if(z==='trone-volcan'){if(actor.hp/actor.maxHp<=.4){actor.buffs.atkUp={turns:3};actor.buffs.speedUp={turns:3}}result=hit(victim,actor.hp/actor.maxHp<=.4?1.42:1.05);text=`${actor.name} libère sa Furie volcanique : ${result.damage} dégâts.`;}
    else if(z==='chambre-echos'){actor.buffs.atkUp={turns:2};result=hit(victim,1.12);text=`${actor.name} renvoie un Écho vengeur : ${result.damage} dégâts.`;}
    else if(z==='khazdrum'){actor.buffs.atkUp={turns:2};result=hit(victim,1+.06*Math.min(5,turnCount));text=`${actor.name} monte en Surchauffe : ${result.damage} dégâts.`;}
    else if(z==='oeil-clair'){victim.debuffs.accuracyDown={turns:2};result=hit(victim,.92);text=`${actor.name} brouille la vision : ${result.damage} dégâts et Précision réduite.`;}
    else{result=hit(victim,1.12);text=`${actor.name} exploite la mécanique de ${actor.campaignMechanic?.name||'la zone'} : ${result.damage} dégâts.`;}
    cooldowns[0]=3;
  }else if(actor.bossUnit&&cooldowns[1]===0&&turnCount%3===0){
    let total=0;
    const tier=actor.campaignMechanicTier||1,campaignMajor=actor.campaignUnit?({normal:.62,hard:.72,hardcore:.84}[actor.campaignDifficulty]||.62):.72;choices.filter(target=>!target.dead).forEach(target=>{const result=hit(target,campaignMajor);total+=result.damage;tryDebuff(actor,target,'slow',tier>=2?2:1,tier>=3?.72:tier>=2?.62:.52,0,resisted);if(tier>=3&&['netherys','couronne-givree','coeur-ignifuge'].includes(actor.campaignZone))target.debuffs.healingDown={turns:2};});
    const healRate=actor.campaignUnit?({normal:.07,hard:.10,hardcore:.13}[actor.campaignDifficulty]||.07):.12,heal=Math.round(actor.maxHp*healRate);const self=enemies.find(unit=>unit.id===actor.id);self.hp=Math.min(self.maxHp,self.hp+heal);self.buffs.defUp={turns:tier>=2?2:1};if(tier>=3)self.buffs.atkUp={turns:2};
    cooldowns[1]=4;text=`${actor.name} déchaîne son pouvoir majeur : ${total} dégâts de zone, ralentissement et ${heal} PV récupérés.`;
  }else if(cooldowns[0]===0&&turnCount%2===0){
    const index=Number(String(actor.id).split('-')[1]||0)%3;
    if(index===0){const result=hit(victim,1.15);tryDebuff(actor,victim,'bleed',2,.65,0,resisted);text=`${actor.name} utilise Lacération : ${result.damage} dégâts.`;}
    else if(index===1){const ally=[...enemies].filter(unit=>!unit.dead).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];const heal=Math.round(ally.maxHp*.14);ally.hp=Math.min(ally.maxHp,ally.hp+heal);actionEvents.push({id:`event-${(battle.eventSeq||0)+actionEvents.length+1}`,sourceId:actor.id,targetId:ally.id,amount:heal,type:'heal',affinity:'neutral',critical:false});ally.buffs.atkUp={turns:2};text=`${actor.name} utilise Soutien obscur : ${heal} PV rendus à ${ally.name} et Attaque augmentée.`;}
    else{let total=0;for(const target of choices.filter(unit=>!unit.dead)){total+=hit(target,.55).damage;}text=`${actor.name} utilise Onde hostile : ${total} dégâts de zone.`;}
    cooldowns[0]=3;
  }else{
    const result=hit(victim,1);text=`${actor.name}${result.critical?' réalise un coup critique et':''} frappe ${victim.name} : ${result.damage} dégâts · ${result.relation.label}${result.absorbed?` · ${result.absorbed} absorbés`:''}.`;
  }
  enemies=enemies.map(unit=>unit.id===actor.id?{...unit,cooldowns,enemyTurnCount:turnCount}:unit);
  if(resisted.length)text+=` ${resisted.join(' ')}`;
  const resolved=finish({...battle,allies,enemies,lastEvents:actionEvents,eventSeq:(battle.eventSeq||0)+actionEvents.length},actor.id,text||`${actor.name} termine son tour.`);return resolved.turn===actor.id?{...resolved,turn:null}:resolved;
}
const AUTO_CONTROL_DEBUFFS=new Set(['stun','provoke']);
const AUTO_DANGEROUS_DEBUFFS=new Set(['stun','healingDown','provoke','burn','poison','bleed','agony','corruption']);
const livingLeft=units=>(units||[]).filter(unit=>!unit.dead);
const hpRatio=unit=>unit.maxHp>0?unit.hp/unit.maxHp:1;
const affinityRank=key=>key==='effective'?0:key==='neutral'?1:2;

export function chooseAutoEnemyTarget(battle,actor,skill){
  const enemies=livingLeft(battle?.enemies);if(!enemies.length)return null;
  const effect=skill?.effect;
  const score=(enemy,index)=>{
    let special=0;
    if(['shieldBreaker','shieldExpose'].includes(effect))special=(enemy.shield||0)>0?-1200:0;
    if(effect==='shieldExecute'){if(enemy.debuffs?.exposed)special=-1600;else if(enemy.shieldBroken||(enemy.maxShield||0)>0&&(enemy.shield||0)<=0)special=-1300;else special=0;}
    if(effect==='condemnStrip')special=-120*Object.keys(enemy.buffs||{}).length;
    if(effect==='apocalypse')special=-140*(enemy.debuffs?.festering?.stacks||0);
    if(effect==='rapture')special=-100*['agony','corruption','poison','burn','bleed'].filter(key=>enemy.debuffs?.[key]).length;
    if(effect==='alchemyCatalyst')special=-100*['poison','burn','bleed'].filter(key=>enemy.debuffs?.[key]).length;
    if(['huntStrike','huntFinish'].includes(effect)&&actor.mechanic?.targetId===enemy.id)special-=800;
    if(['feralFinish','rogueFinish'].includes(effect))special-=Math.round((1-hpRatio(enemy))*500);
    return special+affinityRank(affinity(actor.element,enemy.element).key)*100+index;
  };
  return enemies.map((enemy,index)=>({enemy,value:score(enemy,index)})).sort((a,b)=>a.value-b.value)[0]?.enemy||enemies[0];
}

export function chooseAutoAllyTarget(battle,actor,skill){
  const allies=livingLeft(battle?.allies);if(!allies.length)return null;
  const effect=skill?.effect;
  return [...allies].sort((a,b)=>{
    let sa=0,sb=0;
    if(effect==='healingSeed'){sa+=a.buffs?.healingSeed?500:0;sb+=b.buffs?.healingSeed?500:0;}
    if(['rescueShield','atonementShield'].includes(effect)){sa+=(a.shield||0)>0?300:0;sb+=(b.shield||0)>0?300:0;}
    if(effect==='guardianLink'){sa+=a.id===actor.id?500:0;sb+=b.id===actor.id?500:0;sa+=(a.buffs?.guardianLink?350:0);sb+=(b.buffs?.guardianLink?350:0);sa-=(a.atk||0)*.35;sb-=(b.atk||0)*.35;}
    if(effect==='timeAnchor'){const ac=Math.max(...(a.cooldowns||[0])),bc=Math.max(...(b.cooldowns||[0]));sa+=a.id===actor.id?600:0;sb+=b.id===actor.id?600:0;sa-=(a.atk||0)*.45-ac*35;sb-=(b.atk||0)*.45-bc*35;}
    const da=Object.keys(a.debuffs||{}),db=Object.keys(b.debuffs||{});
    if(String(effect).toLowerCase().includes('cleanse')){sa-=da.reduce((n,key)=>n+(AUTO_CONTROL_DEBUFFS.has(key)?100:AUTO_DANGEROUS_DEBUFFS.has(key)?40:10),0);sb-=db.reduce((n,key)=>n+(AUTO_CONTROL_DEBUFFS.has(key)?100:AUTO_DANGEROUS_DEBUFFS.has(key)?40:10),0);}
    sa+=hpRatio(a)*100+(a.def||0)*.03;sb+=hpRatio(b)*100+(b.def||0)*.03;
    return sa-sb;
  })[0]||actor;
}

const autoSkillUseful=(battle,actor,skill,{respectPlayerPriority=false}={})=>{
  const allies=livingLeft(battle?.allies),enemies=livingLeft(battle?.enemies),effect=skill?.effect;
  if(!skill||!enemies.length)return false;
  if(effect==='livingGarden'&&actor.mechanic?.active)return false;
  if(effect==='healingTotem'&&actor.mechanic?.active)return false;
  if(effect==='seedBloom'&&!allies.some(unit=>unit.buffs?.healingSeed)&&allies.every(unit=>hpRatio(unit)>.72))return false;
  if(effect==='timeRestore'&&!actor.mechanic?.active)return false;
  if(effect==='alchemyCatalyst'&&!enemies.some(unit=>['poison','burn','bleed'].filter(key=>unit.debuffs?.[key]).length>=2))return false;
  if(effect==='emberDetonate'&&!enemies.some(unit=>unit.debuffs?.burn))return false;
  if(effect==='apocalypse'&&!enemies.some(unit=>(unit.debuffs?.festering?.stacks||0)>=2))return false;
  if(effect==='rapture'&&!enemies.some(unit=>unit.debuffs?.agony||unit.debuffs?.corruption))return false;
  if(effect==='condemnStrip'&&!enemies.some(unit=>Object.keys(unit.buffs||{}).length))return false;
  if(effect==='shieldExpose'&&!enemies.some(unit=>(unit.shield||0)>0))return false;
  if(effect==='shieldExecute'&&!enemies.some(unit=>unit.debuffs?.exposed||unit.shieldBroken||((unit.maxShield||0)>0&&(unit.shield||0)<=0)))return false;
  if(effect==='impactQuake'&&(actor.mechanic?.value||0)<3)return false;
  if(effect==='holyPowerVerdict'&&(actor.mechanic?.value||0)<3)return false;
  if(effect==='feralFinish'&&(actor.mechanic?.value||0)<3)return false;
  if(effect==='rogueFinish'&&(actor.mechanic?.value||0)<3)return false;
  if(effect==='aimShot'&&!actor.mechanic?.active&&(actor.mechanic?.value||0)<2)return false;
  if(effect==='arcaneBarrage'&&(actor.mechanic?.value||0)<2)return false;
  if(effect==='soulMetamorphosis'&&(actor.mechanic?.value||0)<3&&allies.every(unit=>hpRatio(unit)>.65))return false;
  if(!respectPlayerPriority&&['allAllies','ally'].includes(skill.target)&&['livingGarden','healingTotem','totemTide','seedBloom','timeRestore','soulMetamorphosis'].includes(effect)&&allies.every(unit=>hpRatio(unit)>.88)&&!actor.mechanic?.active)return false;
  return true;
};

export function chooseAutoSkill(battle,priorities={}){
  const actor=battle?.allies?.find(unit=>unit.id===battle.turn&&!unit.dead);if(!actor)return null;
  const customPriority=Array.isArray(priorities?.[actor.id])&&priorities[actor.id].length>0;
  let order=customPriority?priorities[actor.id]:[2,1,0];
  order=[...new Set([...order,0,1,2].map(Number).filter(index=>index>=0&&index<actor.skills.length))];
  if(actor.id===7){const unused=order.filter(index=>!(actor.mechanic?.danceSteps||[]).includes(index+1));if(unused.length)order=[...unused,...order.filter(index=>!unused.includes(index))];}
  for(const index of order){const skill=actor.skills[index];const unlocked=index<2||actor.rarity>=4||actor.currentStars>=4;if(unlocked&&(actor.cooldowns?.[index]||0)<=0&&autoSkillUseful(battle,actor,skill,{respectPlayerPriority:customPriority}))return index;}
  return order.find(index=>{const unlocked=index<2||actor.rarity>=4||actor.currentStars>=4;return unlocked&&(actor.cooldowns?.[index]||0)<=0})??null;
}

export function performAutoAction(battle,priorities={}){
  const actor=battle?.allies?.find(unit=>unit.id===battle.turn&&!unit.dead);if(!actor)return{battle,error:'Aucun champion actif.'};
  const index=chooseAutoSkill(battle,priorities);if(index==null)return{battle:finish(battle,actor.id,`${actor.name} ne trouve aucune compétence utilisable.`)};
  const skill=actor.skills[index];let target=null;
  if(skill.target==='enemy'||skill.target==='allEnemies')target=chooseAutoEnemyTarget(battle,actor,skill);
  else if(skill.target==='ally'||skill.target==='allAllies')target=chooseAutoAllyTarget(battle,actor,skill);
  else target=actor;
  return castSkill(battle,index,target?.id||actor.id);
}

export function castSkill(battle,index,targetId){
  const original=battle.allies.find(unit=>unit.id===battle.turn),skill=original?.skills[index],mastery=skillBonuses(index,original?.skillLevels?.[index]||1,skill);
  if(!original||!skill||original.cooldowns[index]>0)return{battle,error:'Action impossible'};
  if(index===2&&original.rarity===3&&(original.currentStars||3)<4)return{battle,error:'Cette compétence se débloque à l’évolution 4★.'};
  if(original.skip)return{battle:finish(battle,original.id,`${original.name} est étourdi et passe son tour.`)};
  let allies=battle.allies.map(copyUnit),enemies=battle.enemies.map(copyUnit),actor=allies.find(unit=>unit.id===original.id);
  let chosen=[...allies,...enemies].find(unit=>unit.id===targetId&&!unit.dead);
  if(skill.target==='enemy'&&chosen?.side!=='enemy')chosen=enemies.find(unit=>!unit.dead);
  if(skill.target==='ally'&&chosen?.side!=='ally')chosen=[...allies].filter(unit=>!unit.dead).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  if(skill.target==='self')chosen=actor;
  if(skill.target==='enemy'&&!chosen)return{battle,error:'Aucune cible ennemie disponible.'};
  if(skill.target==='ally'&&!chosen)return{battle,error:'Aucun allié disponible.'};
  const events=[],logs=[],resisted=[];let damageTotal=0,healingTotal=0,shieldTotal=0,retain=0;
  const event=(target,amount,type,extra={})=>events.push({id:`event-${(battle.eventSeq||0)+events.length+1}-${target.id}`,sourceId:actor.id,targetId:target.id,amount:Math.max(0,Math.round(amount)),type,affinity:'neutral',critical:false,...extra});
  const heal=(target,raw,type='heal')=>{const adjusted=target.debuffs?.healingDown?raw*.60:raw;const amount=Math.max(0,Math.min(target.maxHp-target.hp,Math.round(adjusted)));target.hp+=amount;healingTotal+=amount;if(amount)event(target,amount,type);return amount};
  const shield=(target,raw)=>{const amount=Math.max(0,Math.round(raw));target.shield+=amount;target.maxShield=Math.max(target.maxShield||0,target.shield);target.buffs.shield={turns:2+mastery.duration};shieldTotal+=amount;if(amount)event(target,amount,'shield');return amount};
  const debuff=(target,key,turns,chance=.75)=>{const relation=affinity(actor.element,target.element),applied=tryDebuff(actor,target,key,turns+mastery.duration,chance+relation.effect,mastery.effectRate,resisted);if(applied)target.debuffs[key]={...target.debuffs[key],source:actor.id,sourceAtk:actor.atk};return applied};
  const hit=(target,mult=skill.power||0,opts={})=>{if(!target||target.dead||mult<=0)return{damage:0,critical:false,relation:{key:'neutral',label:'NEUTRE'}};const relation=affinity(actor.element,target.element),attack=opts.defScale?actor.def*(actor.buffs.defUp?1.3:1):actor.atk*(actor.buffs.atkUp?1.25:1),defense=target.def*(target.buffs.defUp?1.3:1)*(target.debuffs.defDown?.7:1)*(opts.pierce?.15:1);let power=mult*(1+mastery.power)*relation.damage*(opts.bonus||1);if(target.debuffs.mark)power*=1.2;if(actor.setEffects?.includes('volcanicFurySet')&&actor.hp/actor.maxHp<.5)power*=1.12;let base=Math.max(5,Math.round(attack*power*100/(100+defense*3))),critical=opts.forceCrit||Math.random()<(actor.crit||5)/100,damage=Math.round(base*(critical?1+(actor.critDamage||50)/100:1));const absorbed=Math.min(target.shield||0,opts.shieldBreaker?damage*2:damage);target.shield=Math.max(0,(target.shield||0)-absorbed);if(absorbed>0&&target.shield<=0)target.shieldBroken=true;if(!opts.shieldOnly){damage=Math.max(0,damage-(opts.shieldBreaker?Math.ceil(absorbed/2):absorbed));target.hp=Math.max(0,target.hp-damage);target.dead=target.hp<=0;}damageTotal+=damage;if(damage>0&&actor.setEffects?.includes('lifestealSet')&&actor.hp<actor.maxHp){const life=Math.min(actor.maxHp-actor.hp,Math.max(1,Math.round(damage*.25)));actor.hp+=life;healingTotal+=life;event(actor,life,'heal',{sourceType:'lifesteal'});}const hunter=allies.find(unit=>unit.mechanic?.targetId===target.id&&unit.mechanic?.active&&!unit.dead);if(hunter&&hunter.id!==actor.id)hunter.atb=Math.min(100,hunter.atb+(Number(hunter.resonanceLevel||0)>=4?15:12));event(target,damage,'damage',{affinity:relation.key,critical});return{damage,critical,relation,absorbed}};
  const targets=skill.target==='allEnemies'?enemies.filter(unit=>!unit.dead):skill.target==='enemy'?[chosen]:[];
  const e=skill.effect,m=actor.mechanic||(actor.mechanic={value:0,max:5}),resonanceIV=Number(actor.resonanceLevel||0)>=4;const ghoulTurns=Math.max(0,m.ghoulTurns||0),offensiveSkill=['enemy','allEnemies'].includes(skill.target),ghoulTarget=chosen?.side==='enemy'&&!chosen.dead?chosen:enemies.find(unit=>!unit.dead);if(ghoulTurns>0&&offensiveSkill&&ghoulTarget){const ghoulDamage=Math.round(actor.atk*.28);ghoulTarget.hp=Math.max(0,ghoulTarget.hp-ghoulDamage);ghoulTarget.dead=ghoulTarget.hp<=0;if(ghoulTarget.dead){ghoulTarget.atb=0;ghoulTarget.shield=0;}damageTotal+=ghoulDamage;event(ghoulTarget,ghoulDamage,'ghoul',{sourceType:'ghoul'});m.ghoulTurns=Math.max(0,ghoulTurns-1);m.value=m.ghoulTurns;m.active=m.ghoulTurns>0;if(m.ghoulTurns>0)actor.buffs.ghoul={turns:m.ghoulTurns+1,source:actor.id,damage:ghoulDamage};else delete actor.buffs.ghoul;logs.push(`💀 La Goule de ${actor.name} frappe ${ghoulTarget.name} : ${ghoulDamage} dégâts.`);}
  // Generic damage first, with unique modifiers.
  const damageEffects=new Set(['guardianStrike','huntStrike','huntMark','huntFinish','bladeDance','bladeDanceDrain','bladeDanceStorm','impactStrike','impactFracture','impactQuake','herbalThorn','shieldBreaker','shieldExpose','shieldExecute','refluxStrike','refluxDrain','virulentStrike','virulentPoison','virulentSpread','aegisStrike','unstableBolt','unstableStun','unstableRelease','tideStanceStrike','lowTide','highTide','emberBurn','emberSpread','emberDetonate','gardenThorn','gardenPrison','condemnStrike','condemnStrip','condemnJudgment','alchemyPoison','alchemyMix','alchemyCatalyst','anchorStrike','holyPowerStrike','holyPowerStorm','holyPowerVerdict','feralBuilder','feralShred','feralFinish','rogueBuilder','rogueFinish','atonementStrike','atonementPenance','aimBuilder','aimShot','arcaneBlast','arcaneBarrage','arcaneOrb','festeringStrike','festeringSpread','apocalypse','agony','corruption','rapture','soulCleaveBuilder','soulSigil']);
  if(damageEffects.has(e))targets.forEach(target=>{let bonus=1,pierce=false,forceCrit=false,defScale=false,shieldBreaker=false,hits=1;if(e==='huntFinish'&&target.debuffs.hunt)bonus=1.45;if(e==='guardianStrike'||e==='impactStrike'||e==='tideStanceStrike'||e==='soulCleaveBuilder')defScale=true;if(e==='shieldBreaker'||e==='shieldExpose'){shieldBreaker=true;if((target.shield||0)>0)bonus=resonanceIV?1.38:1.25}if(e==='shieldExecute'&&(target.debuffs.exposed||target.shieldBroken||((target.maxShield||0)>0&&(target.shield||0)<=0)))bonus=1.65;if(e==='virulentStrike')bonus+=.18*(target.debuffs.virulence?.stacks||0);if(e==='unstableBolt'||e==='unstableStun'||e==='unstableRelease')bonus+=(resonanceIV?.14:.12)*(m.value||0);if(e==='condemnStrike'||e==='condemnJudgment')bonus+=.16*(m.value||0);if(e==='tideStanceStrike'){if(m.mode==='low')bonus*=resonanceIV?1.38:1.28;else if(m.mode==='high')bonus*=resonanceIV?1.16:1.10;}if(e==='holyPowerVerdict')bonus+=.28*(m.value||0);if(e==='feralFinish')bonus+=.22*(m.value||0);if(e==='rogueFinish'){bonus+=(resonanceIV?.28:.25)*(m.value||0);forceCrit=m.active}if(e==='atonementPenance')hits=3;if(e==='aimShot'){bonus+=.22*(m.value||0);pierce=true;forceCrit=m.active;if(resonanceIV)bonus+=.12}if(e==='arcaneBlast'||e==='arcaneBarrage'||e==='arcaneOrb')bonus+=.16*(e==='arcaneOrb'?4:(m.value||0));if(actor.id===11&&m.active&&['enemy','allEnemies'].includes(skill.target))forceCrit=true;if(e==='apocalypse')bonus+=.2*(target.debuffs.festering?.stacks||0);if(e==='rapture')bonus+=.22*['agony','corruption','poison','burn','bleed'].filter(k=>target.debuffs[k]).length;for(let i=0;i<hits;i++)hit(target,(skill.power||0)/hits,{bonus,pierce,forceCrit,defScale,shieldBreaker});});
  // Unique mechanics and effects.
  if(e==='guardianLink'){actor.mechanic={...m,targetId:chosen.id,active:true};chosen.buffs.guardianLink={turns:3+mastery.duration,source:actor.id};}
  if(e==='guardianWall')allies.filter(x=>!x.dead).forEach(x=>shield(x,x.maxHp*(x.id===m.targetId?(resonanceIV?.31:.28):(resonanceIV?.20:.18))*(1+mastery.power)));
  if(e==='huntMark'){chosen.debuffs.hunt={turns:4+mastery.duration,source:actor.id};chosen.debuffs.mark={turns:3+mastery.duration};m.targetId=chosen.id;m.active=true;}
  if(['huntStrike','huntFinish'].includes(e)&&chosen.id===m.targetId)retain=22;
  if(e.startsWith('bladeDance')){const step=index+1;m.danceSteps=[...new Set([...(m.danceSteps||[]),step])];m.value=m.danceSteps.length;m.lastSkill=step;if(m.danceSteps.length>=3){m.value=0;m.danceSteps=[];retain=resonanceIV?115:100;logs.push(resonanceIV?'Danse complète : Vaeloria rejoue immédiatement avec 15 % de jauge conservée.':'Danse complète : Vaeloria rejoue immédiatement.');}}
  if(e==='bladeDanceDrain')chosen.atb=Math.max(0,chosen.atb-(resonanceIV?27:22));
  if(e==='impactStrike')m.value=Math.min(3,(m.value||0)+1);
  if(e==='impactFracture'){const impacts=Math.max(0,Math.min(3,m.value||0)),turns=impacts>=3?3:impacts>=1?2:1,chance=impacts>=3?.95:impacts===2?.88:impacts===1?.72:.55;debuff(chosen,'defDown',turns,chance);debuff(chosen,'slow',turns,chance);logs.push(`Fracture tellurique consomme ${impacts} Impact(s) : ${turns} tour(s), ${Math.round(chance*100)} % de chance de base.`);m.value=0;}
  if(e==='impactQuake'){if((m.value||0)>=3)targets.forEach(t=>debuff(t,'stun',1,resonanceIV?.95:.9));m.value=0;}
  if(e==='herbalThorn')debuff(chosen,'atkDown',2,.75);
  if(e==='healingSeed'){chosen.buffs.healingSeed={turns:4+mastery.duration,source:actor.id,power:Math.round(actor.maxHp*(resonanceIV?.23:.2))};m.value=Math.min(3,(m.value||0)+1);}
  if(e==='seedBloom')allies.filter(x=>!x.dead).forEach(x=>{if(x.buffs.healingSeed){heal(x,x.buffs.healingSeed.power*(1+mastery.power));const first=Object.keys(x.debuffs||{})[0];if(first)delete x.debuffs[first];delete x.buffs.healingSeed;}x.buffs.regen={turns:2+mastery.duration};});
  if(e==='shieldExpose'){chosen.debuffs.exposed={turns:2+mastery.duration};}
  if(e==='refluxStrike'){const removed=Math.min(18,chosen.atb);chosen.atb-=removed;m.value=Math.min(60,(m.value||0)+Math.round(removed*(resonanceIV?1.2:1)));}
  if(e==='refluxDrain'){const removed=Math.min(32,chosen.atb);chosen.atb-=removed;debuff(chosen,'slow',2,.8);m.value=Math.min(60,(m.value||0)+removed);}
  if(e==='refluxRelease'){const boost=Math.max(10,Math.round((m.value||0)/Math.max(1,allies.filter(x=>!x.dead).length)));allies.filter(x=>!x.dead).forEach(x=>x.atb=Math.min(100,x.atb+boost));m.value=0;}
  if(['virulentPoison','virulentSpread'].includes(e))targets.forEach(t=>{const old=t.debuffs.virulence?.stacks||0;t.debuffs.virulence={turns:4+mastery.duration,stacks:Math.min(5,old+(e==='virulentPoison'?(resonanceIV?3:2):1))};t.debuffs.poison={turns:3+mastery.duration,source:actor.id,sourceAtk:actor.atk};});
  if(e==='aegisStrike'){const low=[...allies].filter(x=>!x.dead).sort((a,b)=>(a.shield||0)-(b.shield||0))[0];if(low)shield(low,actor.maxHp*.08);}
  if(e==='rescueShield'){shield(chosen,chosen.maxHp*.32*(1+mastery.power));m.active=true;m.targetId=chosen.id;}
  if(e==='rescueSanctuary'){allies.filter(x=>!x.dead).forEach(x=>shield(x,x.maxHp*.16*(1+mastery.power)));m.active=true;m.targetId=null;}
  if(e==='unstableBolt')m.value=Math.min(5,(m.value||0)+1);
  if(e==='unstableStun')debuff(chosen,'stun',1,.35+.1*(m.value||0));
  if(e==='unstableRelease'){if((m.value||0)>=4){const recoil=Math.round(actor.maxHp*.12);actor.hp=Math.max(1,actor.hp-recoil);event(actor,recoil,'dot');}m.value=0;}
  if(e==='tideStanceStrike'){const previous=m.mode||'high';if(previous==='low'){chosen.atb=Math.max(0,chosen.atb-(resonanceIV?22:16));logs.push('Marée basse : dégâts renforcés et jauge ennemie réduite.');}else{actor.buffs.defUp={turns:2+mastery.duration};logs.push('Marée haute : Défense renforcée avant le changement de posture.');}m.mode=previous==='high'?'low':'high';m.active=true;}
  if(e==='lowTide'){m.mode='low';m.active=true;targets.forEach(t=>{debuff(t,'atkDown',resonanceIV?3:2,resonanceIV?.95:.85);t.atb=Math.max(0,t.atb-(resonanceIV?14:10));});logs.push('Maerys adopte Marée basse : Attaque et jauge ennemies réduites.');}
  if(e==='highTide'){m.mode='high';m.active=true;targets.forEach(t=>{if(debuff(t,'provoke',resonanceIV?3:2,resonanceIV?.90:.80))t.debuffs.provoke.source=actor.id});actor.buffs.defUp={turns:3+mastery.duration};logs.push('Maerys adopte Marée haute : Provocation et Défense augmentée.');}
  if(e==='emberBurn'){debuff(chosen,'burn',3,.8);m.value=Math.min(5,(m.value||0)+1);}
  if(e==='emberSpread')targets.forEach(t=>{debuff(t,'burn',3,.75);if(t.debuffs.burn)t.debuffs.burn.turns+=1});
  if(e==='emberDetonate')targets.forEach(t=>{if(t.debuffs.burn){const burst=Math.round(t.maxHp*.07*(1+Math.min(5,m.value||0)*.12)*(resonanceIV?1.18:1));t.hp=Math.max(0,t.hp-burst);t.dead=t.hp<=0;if(t.dead){t.atb=0;t.shield=0;}damageTotal+=burst;event(t,burst,'damage',{affinity:'neutral'});delete t.debuffs.burn;}}),m.value=0;
  if(e==='gardenThorn')debuff(chosen,'slow',2,.75);
  if(e==='livingGarden'){m.active=true;m.type='livingGarden';m.value=3+mastery.duration;allies.filter(x=>!x.dead).forEach(x=>{heal(x,x.maxHp*.09*(1+mastery.power));x.buffs.regen={turns:2+mastery.duration};x.buffs.livingGarden={turns:3+mastery.duration,source:actor.id}});enemies.filter(x=>!x.dead).forEach(x=>x.debuffs.slow={turns:2});}
  if(e==='gardenPrison')targets.forEach(t=>debuff(t,'stun',1,m.active?.55:.30));
  if(e==='condemnStrip'){const protectedBuffs=new Set(['guardianLink','timeAnchor','ghoul','livingGarden','healingTotem']);const removable=Object.keys(chosen.buffs||{}).filter(key=>!protectedBuffs.has(key));removable.forEach(key=>delete chosen.buffs[key]);const gained=removable.length;m.value=Math.min(6,(m.value||0)+gained);m.active=m.value>0;logs.push(gained?`Dissipation sacrée retire ${gained} amélioration(s) : Condamnation ${m.value}/6.`:'Dissipation sacrée ne trouve aucune amélioration dissipable.');}
  if(e==='condemnStrike'&&(m.value||0)>0)logs.push(`Sentence radieuse est renforcée par ${m.value} charge(s) de Condamnation.`);
  if(e==='condemnJudgment'){const spent=m.value||0;if(spent)logs.push(`Jugement de l’Aube consume ${spent} charge(s) de Condamnation sur toute la zone.`);m.value=resonanceIV&&spent>0?1:0;m.active=m.value>0;if(m.value)logs.push('Résonance IV : 1 charge de Condamnation est conservée.');}
  const alchemyReaction=t=>{const poison=Boolean(t.debuffs.poison),burn=Boolean(t.debuffs.burn),bleed=Boolean(t.debuffs.bleed),count=[poison,burn,bleed].filter(Boolean).length;if(count<2)return;if(poison&&bleed){const burst=Math.round(t.maxHp*(count===3?.10:.06)*(resonanceIV?1.15:1));t.hp=Math.max(0,t.hp-burst);t.dead=t.hp<=0;damageTotal+=burst;event(t,burst,'damage');logs.push(`🧪 Réaction hémotoxique sur ${t.name} : ${burst} dégâts immédiats.`);}if(poison&&burn){t.debuffs.healingDown={turns:(count===3?3:2)+(resonanceIV?1:0)};logs.push(`🧪 Réaction caustique : soins reçus réduits sur ${t.name}.`);}if(burn&&bleed){t.debuffs.defDown={turns:(count===3?3:2)+(resonanceIV?1:0)};logs.push(`🧪 Réaction thermique : Défense réduite sur ${t.name}.`);}if(count===3){t.debuffs.slow={turns:resonanceIV?3:2};logs.push(`☣️ Catalyse parfaite sur ${t.name} : les afflictions sont conservées.`);}};
  if(e==='alchemyPoison')targets.forEach(t=>{debuff(t,'poison',3,.8);alchemyReaction(t)});
  if(e==='alchemyMix')targets.forEach(t=>{debuff(t,'poison',3,.8);debuff(t,'bleed',3,.8);alchemyReaction(t)});
  if(e==='alchemyCatalyst')targets.forEach(alchemyReaction);
  if(e==='anchorStrike'&&m.targetId){const ally=allies.find(x=>x.id===m.targetId);if(ally)ally.atb=Math.min(100,ally.atb+18);}
  if(e==='timeAnchor'){actor.mechanic={...m,targetId:chosen.id,active:true,snapshot:{atb:chosen.atb,cooldowns:[...chosen.cooldowns]}};chosen.buffs.timeAnchor={turns:4+mastery.duration};}
  if(e==='timeRestore'){const anchor=allies.find(x=>x.id===m.targetId);if(anchor&&m.snapshot){anchor.atb=Math.max(anchor.atb,m.snapshot.atb,80);anchor.cooldowns=anchor.cooldowns.map((v,i)=>Math.min(v,m.snapshot.cooldowns[i]||0));}allies.filter(x=>x.id!==actor.id).forEach(x=>x.cooldowns=x.cooldowns.map(v=>Math.max(0,v-(resonanceIV?2:1))));m.active=false;if(resonanceIV)logs.push('Résonance IV : les temps de recharge alliés sont réduits de 2 tours.');}
  if(e==='holyPowerStrike')m.value=Math.min(5,(m.value||0)+1);
  if(e==='holyPowerStorm')m.value=Math.min(5,(m.value||0)+2);
  if(e==='holyPowerVerdict')m.value=resonanceIV?1:0;
  if(e==='feralBuilder'){m.value=Math.min(5,(m.value||0)+1);debuff(chosen,'bleed',3,.8);}
  if(e==='feralShred'){m.value=Math.min(5,(m.value||0)+2);if(chosen.debuffs.bleed)chosen.debuffs.bleed.turns+=2;}
  if(e==='feralFinish'){if(chosen.debuffs.bleed)chosen.debuffs.bleed.turns+=(m.value||0)+(resonanceIV?1:0);m.value=0;}
  if(e==='rogueBuilder'){m.value=Math.min(5,(m.value||0)+1);chosen.atb=Math.max(0,chosen.atb-18);}
  if(actor.id===11&&m.active&&['rogueBuilder','rogueFinish'].includes(e)){if(resonanceIV&&chosen&&!chosen.dead){const opening=Math.round(actor.atk*.18);chosen.hp=Math.max(0,chosen.hp-opening);chosen.dead=chosen.hp<=0;damageTotal+=opening;event(chosen,opening,'damage',{affinity:'neutral',opening:true});logs.push(`Résonance IV : ouverture renforcée, ${opening} dégâts supplémentaires.`);}m.active=false;delete actor.buffs.vanish;logs.push('Disparition est consommée par la première attaque offensive.');}
  if(e==='vanish'){m.active=true;actor.buffs.vanish={turns:2+mastery.duration};m.value=Math.min(5,(m.value||0)+2);}
  if(e==='rogueFinish'){m.value=0;}
  if(e==='atonementShield'){shield(chosen,chosen.maxHp*.28*(1+mastery.power));chosen.buffs.atonement={turns:3+mastery.duration,source:actor.id};m.value=allies.filter(x=>x.buffs.atonement?.source===actor.id).length;}
  if(e==='atonementStrike'||e==='atonementPenance'){allies.filter(x=>!x.dead&&x.buffs.atonement?.source===actor.id).forEach(x=>heal(x,damageTotal*(resonanceIV?.40:.35)));m.value=allies.filter(x=>x.buffs.atonement?.source===actor.id).length;}
  if(e==='aimBuilder')m.value=Math.min(3,(m.value||0)+1);
  if(e==='prepareAim'){m.active=true;m.value=Math.min(3,(m.value||0)+1);actor.buffs.aimed={turns:2+mastery.duration};}
  if(e==='aimShot'){m.active=false;m.value=0;delete actor.buffs.aimed;}
  if(e==='arcaneBlast')m.value=Math.min(4,(m.value||0)+1);
  if(e==='arcaneBarrage')m.value=resonanceIV?1:0;
  if(e==='arcaneOrb')m.value=4;
  if(e==='totemHeal')heal(chosen,chosen.maxHp*(m.active?.44:.36)*(1+mastery.power));
  if(e==='healingTotem'){m.active=true;m.type='healingTotem';m.value=3+mastery.duration;allies.filter(x=>!x.dead).forEach(x=>{x.buffs.healingTotem={turns:m.value,source:actor.id};heal(x,x.maxHp*.08)});}
  if(e==='totemTide'){allies.filter(x=>!x.dead).forEach(x=>heal(x,x.maxHp*.28*(1+mastery.power)));if(m.active)m.value+=2;}
  if(e==='festeringStrike'){const previous=chosen.debuffs.festering?.stacks||0;if(debuff(chosen,'festering',5,1)){chosen.debuffs.festering={...chosen.debuffs.festering,turns:5+mastery.duration,stacks:Math.min(6,previous+2)};logs.push(`Blessures purulentes : ${chosen.debuffs.festering.stacks}/6 sur ${chosen.name}.`);}}
  if(e==='festeringSpread')targets.forEach(t=>{const previous=t.debuffs.festering?.stacks||0;if(debuff(t,'festering',4,.85)){t.debuffs.festering={...t.debuffs.festering,turns:4+mastery.duration,stacks:Math.min(6,previous+1)};logs.push(`Blessures purulentes : ${t.debuffs.festering.stacks}/6 sur ${t.name}.`);}});
  if(e==='apocalypse'){const stacks=chosen.debuffs.festering?.stacks||0;delete chosen.debuffs.festering;const duration=Math.max(1,Math.min(resonanceIV?5:4,stacks+(resonanceIV?1:0)));m.value=duration;m.ghoulTurns=duration;m.active=true;m.ghoulDamage=Math.round(actor.atk*.28);actor.buffs.ghoul={turns:duration+1,source:actor.id,damage:m.ghoulDamage};if(stacks){const extra=Math.round(actor.atk*.3*stacks);chosen.hp=Math.max(0,chosen.hp-extra);chosen.dead=chosen.hp<=0;if(chosen.dead){chosen.atb=0;chosen.shield=0;}damageTotal+=extra;event(chosen,extra,'damage');logs.push(`Apocalypse consomme ${stacks} Blessure(s) purulente(s) et invoque la Goule pour ${duration} attaque(s).`);}else logs.push('Apocalypse invoque la Goule pour 1 attaque, sans Blessure purulente consommée.');}
  if(e==='agony')chosen.debuffs.agony={turns:4+mastery.duration,stacks:1,source:actor.id,sourceAtk:actor.atk};
  if(e==='corruption')targets.forEach(t=>t.debuffs.corruption={turns:4+mastery.duration,source:actor.id,sourceAtk:actor.atk});
  if(e==='rapture')targets.forEach(t=>{let burst=0;if(t.debuffs.agony)burst+=Math.round(t.maxHp*.035*(t.debuffs.agony.stacks||1));if(t.debuffs.corruption)burst+=Math.round(t.maxHp*.04);if(resonanceIV)burst=Math.round(burst*1.12);if(burst){t.hp=Math.max(0,t.hp-burst);t.dead=t.hp<=0;if(t.dead){t.atb=0;t.shield=0;}damageTotal+=burst;event(t,burst,'dot');}});
  if(e==='soulCleaveBuilder')m.value=Math.min(5,(m.value||0)+1);
  if(e==='soulSigil'){targets.forEach(t=>{if(debuff(t,'provoke',2,.75))t.debuffs.provoke.source=actor.id});m.value=Math.min(5,(m.value||0)+targets.length);actor.buffs.defUp={turns:3};}
  if(e==='soulMetamorphosis'){const charges=m.value||0;heal(actor,actor.maxHp*(.08+(resonanceIV?.067:.06)*charges));allies.filter(x=>!x.dead).forEach(x=>shield(x,x.maxHp*(.08+(resonanceIV?.039:.035)*charges)*(1+mastery.power)));actor.buffs.defUp={turns:2+Math.min(3,charges)};m.value=0;}
  if(actor.uniqueWeapon&&damageTotal>0){actor.weaponCharge=(actor.weaponCharge||0)+1;const trigger=actor.uniqueWeapon.uniqueId==='heartworld'?5:4;if(actor.weaponCharge>=trigger&&chosen&&!chosen.dead){const bonus=Math.round(actor.atk*(actor.uniqueWeapon.uniqueId==='eclipse'?.58:.42));chosen.hp=Math.max(0,chosen.hp-bonus);chosen.dead=chosen.hp<=0;damageTotal+=bonus;event(chosen,bonus,'damage',{affinity:'neutral',weapon:true});if(actor.uniqueWeapon.uniqueId==='heartworld')chosen.debuffs.burn={turns:2};if(actor.uniqueWeapon.uniqueId==='stormprince')chosen.atb=Math.max(0,chosen.atb-15);if(actor.uniqueWeapon.uniqueId==='plague'&&Object.keys(chosen.debuffs||{}).length)chosen.debuffs.healingDown={turns:2};if(actor.uniqueWeapon.uniqueId==='sepulchral'&&actor.uniqueWeapon.orientation==='corrupted')chosen.debuffs.corruption={turns:3};actor.weaponCharge=0;logs.push(`${actor.uniqueWeapon.icon||'✦'} ${actor.uniqueWeapon.name} libère son pouvoir : ${bonus} dégâts.`);}}
  if(offensiveSkill&&damageTotal>0&&actor.setEffects?.includes('incendiarySet')){const burnTarget=chosen?.side==='enemy'&&!chosen.dead?chosen:enemies.find(x=>!x.dead);if(burnTarget&&Math.random()<.25){const applied=tryDebuff(actor,burnTarget,'burn',2,.75,0,resisted);if(applied){burnTarget.debuffs.burn={...burnTarget.debuffs.burn,source:actor.id,sourceAtk:actor.atk};logs.push(`🔥 Set Incendiaire : ${burnTarget.name} subit Brûlure.`);}}}
  actor.cooldowns=actor.cooldowns.map((value,i)=>i===index?Math.max(0,skill.cd-mastery.cooldown)+1:value);
  const details=[damageTotal?`${damageTotal} dégâts`:null,healingTotal?`${healingTotal} soins`:null,shieldTotal?`${shieldTotal} bouclier`:null].filter(Boolean).join(' · '),resource=actor.name!=='Korga'&&!actor.skills?.some(skill=>skill.effect==='shieldExecute')&&actor.mechanic?.value?` · ${actor.mechanic.value} charge(s)`:'';
  enemies=enemies.map(unit=>unit.hp<=0?{...unit,hp:0,dead:true,atb:0,shield:0}:unit);allies=allies.map(unit=>unit.hp<=0?{...unit,hp:0,dead:true,atb:0,shield:0}:unit);
  const next={...battle,allies,enemies,lastEvents:events,eventSeq:(battle.eventSeq||0)+events.length};
  return{battle:finish(next,actor.id,`${actor.name} utilise ${skill.name}${details?` : ${details}`:''}${resource}.${resisted.length?` ${resisted.join(' ')}`:''}${logs.length?` ${logs.join(' ')}`:''}`,retain)};
}
