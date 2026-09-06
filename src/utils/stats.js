import{ITEMS,itemStats,setStats,activeSets,SETS}from'../data/items';
import{normalizeChampionProgress,resonanceBonus}from'./progression';

export function progressionStats(hero,championProgress){
  const progress=normalizeChampionProgress(hero,championProgress);
  const extraStars=progress.stars-hero.rarity;
  const levelFactor=1+(progress.level-1)*0.045;
  const starFactor=1+extraStars*.18;
  const resonance=resonanceBonus(progress),resonanceFactor=1+resonance.allPercent/100;
  return {
    hp:Math.round(hero.hp*levelFactor*starFactor*resonanceFactor),
    atk:Math.round(hero.atk*levelFactor*starFactor*resonanceFactor),
    def:Math.round(hero.def*levelFactor*starFactor*resonanceFactor),
    spd:hero.spd+extraStars*2+Math.floor((progress.level-1)/10)+resonance.speed,
    crit:5,
    critDamage:50,
    accuracy:(hero.accuracy??0)+resonance.accuracy,
    resistance:(hero.resistance??(hero.role?.toLowerCase().match(/gardien|tank|vengeance|brise-fer/)?25:hero.role?.toLowerCase().match(/prêtre|chaman|soigneur|restauration|discipline/)?20:15))+resonance.resistance,
    resonanceLevel:progress.resonance,
    resonanceIdentity:resonance.identity
  };
}

export function totalStats(hero,equipment,championProgress,inventory=[]){
  const stats=progressionStats(hero,championProgress);
  const equipped=Object.values(equipment[hero.id]||{}).map(id=>inventory.find(item=>item.id===id)||ITEMS.find(item=>item.id===id)).filter(Boolean);
  const bonuses={};
  equipped.forEach(item=>Object.entries(item.mainStat?itemStats(item):(item.stats||{})).forEach(([key,value])=>bonuses[key]=(bonuses[key]||0)+value));
  Object.entries(setStats(equipped)).forEach(([key,value])=>bonuses[key]=(bonuses[key]||0)+value);
  ['hp','atk','def'].forEach(key=>{stats[key]+=bonuses[key]||0;stats[key]=Math.round(stats[key]*(1+(bonuses[`${key}Pct`]||0)/100))});
  stats.spd=Math.round((stats.spd+(bonuses.spd||0))*(1+(bonuses.spdPct||0)/100));
  ['crit','critDamage','accuracy','resistance'].forEach(key=>stats[key]=(stats[key]||0)+(bonuses[key]||0));
  stats.crit=Math.min(100,Math.max(0,stats.crit));
  stats.accuracy=Math.min(120,Math.max(0,stats.accuracy));
  stats.resistance=Math.min(120,Math.max(0,stats.resistance));
  const completedSets=activeSets(equipped);
  stats.setEffects=[...new Set(completedSets.map(id=>SETS[id]?.effect).filter(Boolean))];
  return stats;
}


export function championPower(stats){
  const durability=stats.hp*.30+stats.def*5.5;
  const offense=stats.atk*7.5;
  const tempo=stats.spd*1.7;
  const utility=(stats.crit||0)*2+(stats.critDamage||50)*.35+(stats.accuracy||0)*1.5+(stats.resistance||0)*1.25;
  return Math.round(durability+offense+tempo+utility);
}
export function teamPower(heroIds,heroes,getStats){
  return heroIds.reduce((sum,id)=>{const hero=heroes.find(entry=>entry.id===id);return sum+(hero?championPower(getStats(hero)):0)},0);
}
export function missionDifficulty(teamValue,recommended){
  const ratio=teamValue/Math.max(1,recommended);
  if(ratio>=1.75)return{key:'very-easy',label:'Très facile',icon:'🟢',ratio};
  if(ratio>=1.25)return{key:'accessible',label:'Abordable',icon:'🔵',ratio};
  if(ratio>=.85)return{key:'balanced',label:'Équilibré',icon:'🟡',ratio};
  if(ratio>=.70)return{key:'hard',label:'Difficile',icon:'🟠',ratio};
  return{key:'extreme',label:'Extrême',icon:'🔴',ratio};
}
export function campaignXp(baseXp,teamValue,recommended){
  const ratio=teamValue/Math.max(1,recommended);
  const factor=ratio<=1.10?1:ratio<=1.30?.80:ratio<=1.55?.60:ratio<=1.90?.40:ratio<=2.30?.25:.15;
  return{xp:Math.max(10,Math.round(baseXp*factor)),factor,ratio};
}


export function enemyPower(enemy,scale=1){
  const scaled={
    hp:Math.round(enemy.hp*scale),
    atk:Math.round(enemy.atk*scale),
    def:Math.round(enemy.def*scale),
    spd:enemy.spd,
    crit:0,
    critDamage:50,
    accuracy:enemy.accuracy||0,
    resistance:enemy.resistance||0
  };
  return championPower(scaled);
}

export function encounterPower(enemies,scale=1,boss=false){
  const raw=(enemies||[]).reduce((sum,enemy)=>sum+enemyPower(enemy,scale),0);
  const encounterFactor=boss?1.38:1.30;
  return Math.max(1,Math.round(raw*encounterFactor));
}

/* v1.37.0 - Evaluation globale de préparation */

/**
 * Capacités d'équipe, par identifiant d'effet EXACT.
 *
 * Le rapprochement se faisait auparavant par sous-chaîne sur les effets
 * concaténés du champion. Trois compétences offensives qui BRISENT les
 * boucliers — shieldBreaker, shieldExpose, shieldExecute — étaient donc
 * comptées comme des fournisseurs de boucliers, ce qui gonflait la note de
 * survie et faisait passer un briseur de boucliers pour un protecteur.
 *
 * Toute entrée ajoutée ici doit correspondre à un effet réellement traité par
 * src/battle/engine.js. tests/stats.test.js vérifie que c'est le cas.
 */
const SKILL_TAGS={
 heal:['healingSeed','seedBloom','livingGarden','atonementStrike','atonementPenance',
       'totemHeal','healingTotem','totemTide','soulMetamorphosis'],
 cleanse:['healingSeed','seedBloom'],
 // aegisStrike accorde un bouclier — shield(low, actor.maxHp*.08) — et manquait.
 shield:['guardianLink','guardianWall','rescueShield','rescueSanctuary','atonementShield',
         'soulMetamorphosis','aegisStrike'],
 // gardenThorn applique Ralentissement — debuff(chosen,'slow',2,.75) — et manquait.
 control:['impactQuake','unstableStun','gardenPrison','refluxStrike','refluxDrain',
          'bladeDanceDrain','highTide','soulSigil','gardenThorn'],
 debuff:['agony','corruption','alchemyPoison','alchemyMix','alchemyCatalyst','emberBurn',
         'virulentPoison','festeringStrike','festeringSpread','impactFracture','herbalThorn',
         'lowTide','condemnStrip']
};
const hasAny=(effects,values)=>values.some(value=>effects.has(value));
function heroCapabilities(hero){
  const skills=hero?.skills||[];
  const effects=new Set(skills.map(skill=>String(skill.effect||'')));
  const targets=skills.map(skill=>String(skill.target||''));
  return{
    heal:hasAny(effects,SKILL_TAGS.heal),
    cleanse:hasAny(effects,SKILL_TAGS.cleanse),
    shield:hasAny(effects,SKILL_TAGS.shield),
    control:hasAny(effects,SKILL_TAGS.control),
    debuff:hasAny(effects,SKILL_TAGS.debuff),
    aoe:targets.includes('allEnemies'),
    support:targets.some(value=>['ally','allAllies','self'].includes(value))
  };
}
function missionKind(mission={}){return mission.raid?'raid':mission.mythic?'mythic':mission.expedition?'expedition':'campaign';}
export function calibratedEncounterPower(mission={}){if(mission.difficultyId&&Number.isFinite(Number(mission.recommended)))return Math.max(1,Math.round(Number(mission.recommended)));const enemies=mission.enemies||mission.waves?.[0]||[],raw=enemies.reduce((sum,enemy)=>sum+enemyPower(enemy,1),0),kind=missionKind(mission),boss=Boolean(mission.boss||mission.raid||mission.mythic),mechanics=(mission.raidData?.mechanics||mission.expeditionData?.mechanics||mission.mechanics||[]).length,waves=mission.waves?.length||1,affixes=mission.affixIds?.length||mission.affixes?.length||0,level=mission.raidLevel||mission.expeditionLevel||mission.mythicLevel||Number(mission.stageId)||1;let factor=boss?1.48:1.35;if(kind==='expedition')factor*=1.12+level*.025+mechanics*.055;if(kind==='raid')factor*=1.48+level*.055+mechanics*.10;if(kind==='mythic')factor*=1.22+(waves-1)*.16+affixes*.14+level*.012+Math.floor(level/10)*.12;return Math.max(1,Math.round(raw*factor));}
export function assessTeamForMission(members,heroes,getStats,mission={}){const chosen=(members||[]).map(id=>heroes.find(hero=>hero.id===id)).filter(Boolean),stats=chosen.map(getStats),caps=chosen.map(heroCapabilities),recommended=calibratedEncounterPower(mission),power=teamPower(members,heroes,getStats),ratio=power/Math.max(1,recommended),avg=key=>stats.length?stats.reduce((sum,value)=>sum+(value[key]||0),0)/stats.length:0,has=key=>caps.some(value=>value[key]),allEffects=stats.flatMap(value=>value.setEffects||[]),kind=missionKind(mission),fireThreat=kind==='raid'||mission.enemies?.some(enemy=>enemy.element==='Feu')||false,fireproof=allEffects.includes('fireproofSet'),needsSustain=kind==='raid'||kind==='mythic'||Boolean(mission.boss),needsCleanse=fireThreat||mission.affixIds?.includes('necrotic'),needsAoe=kind==='raid'||kind==='mythic'||(mission.enemies?.length||0)>=3;const borne=valeur=>Math.max(0,Math.min(100,Math.round(valeur)));const checks={damage:borne((ratio*82+(has('debuff')?8:0)+(has('aoe')&&needsAoe?8:0))),survival:borne((ratio*72+(has('heal')?12:0)+(has('shield')?8:0)+(fireproof&&fireThreat?18:0)+Math.min(10,avg('resistance')/6))),tempo:borne((ratio*70+Math.min(24,avg('spd')/7)+(has('control')?6:0))),sustain:has('heal')?'Adapté':has('shield')?'Partiel':'Absent',cleanse:has('cleanse')?'Présente':'Absente',fire:fireThreat?(fireproof?'Ignifuge actif':'Faible'):'Non requis'};const gaps=[];if((mission.teamSize||3)>chosen.length)gaps.push(`Composition incomplète : ${chosen.length}/${mission.teamSize} champions.`);if(needsSustain&&!has('heal'))gaps.push('Aucun soin fiable pour un combat prolongé.');if(needsCleanse&&!has('cleanse'))gaps.push('Aucune purification détectée.');if(fireThreat&&!fireproof)gaps.push('Aucun bonus Ignifuge actif.');if(needsAoe&&!has('aoe'))gaps.push('Peu de dégâts de zone pour gérer les serviteurs.');if(avg('accuracy')<25&&has('debuff'))gaps.push('Précision moyenne faible pour fiabiliser les malus.');let score=borne((checks.damage+checks.survival+checks.tempo)/3-gaps.length*7);if(ratio<.7)score=Math.min(score,39);else if(ratio<.9)score=Math.min(score,54);else if(ratio<1.05)score=Math.min(score,69);if(needsSustain&&!has('heal'))score=Math.min(score,69);if(kind==='raid'&&!fireproof)score=Math.min(score,69);score=borne(score);const verdict=score>=86?{key:'comfortable',label:'Confortable',icon:'🟢'}:score>=70?{key:'adapted',label:'Adapté',icon:'🔵'}:score>=55?{key:'risky',label:'Risqué',icon:'🟡'}:score>=40?{key:'insufficient',label:'Insuffisant',icon:'🟠'}:{key:'very-insufficient',label:'Très insuffisant',icon:'🔴'};return{power,recommended,ratio,score,verdict,checks,gaps,kind};}
