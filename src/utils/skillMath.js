// Ce qu'un sort fait vraiment, en chiffres.
//
// Le tooltip n'annoncait qu'une puissance brute — « Dégâts 0,88 » — sans dire
// de quelle statistique elle part, ni ce que valent les bonus conditionnels qui
// font l'essentiel du kit de certains champions. Ce module reconstitue le calcul
// du moteur pour l'expliquer, et un test de contrat verifie qu'aucun bonus du
// moteur ne manque ici : une table recopiee a la main derive toujours.
//
// La formule du moteur, telle quelle :
//   degats = statistique × ratio × 100/(100 + DEF_cible × 3)
//            × variance(0,92–1,08) × critique(×1,5) × affinite
// Le ratio est `skill.power`, augmente par la maitrise, puis multiplie ou
// augmente par les bonus conditionnels ci-dessous.

import{skillBonuses}from'./skills';

/** Sorts qui frappent avec la Defense au lieu de l'Attaque. */
export const DEF_SCALED=new Set(['guardianStrike','impactStrike','tideStanceStrike','soulCleaveBuilder']);
/** Sorts dont l'ampleur depend des PV maximum plutot que d'une frappe. */
export const HP_SCALED=new Set(['healingSeed','seedBloom','rescueShield','rescueSanctuary','livingGarden',
 'guardianWall','totemHeal','healingTotem','totemTide','atonementShield','soulMetamorphosis',
 'renewingMist','mistStrike','revival']);

export const SCALING_LABEL={atk:'Attaque',def:'Défense',hp:'PV maximum'};
/** Statistique qui alimente ce sort. */
export function scalingStat(effect){
 if(DEF_SCALED.has(effect))return'def';
 if(HP_SCALED.has(effect))return'hp';
 return'atk';
}

/**
 * Bonus conditionnels, repris un a un du moteur.
 *
 * `per` : le bonus s'ajoute au ratio, autant de fois que le compteur.
 * `factor` : le bonus multiplie le ratio.
 * `flat` : le bonus s'ajoute une fois.
 * `value` et `resonance` donnent la valeur hors et sous Resonance IV.
 */
export const CONDITIONAL_BONUSES={
 huntFinish:[{kind:'factor',value:1.45,when:'La proie porte la Marque'}],
 shieldExecute:[{kind:'factor',value:1.65,when:'Cible Exposée ou bouclier brisé'}],
 shieldBreaker:[{kind:'factor',value:1.25,resonance:1.38,when:'La cible porte un bouclier'}],
 shieldExpose:[{kind:'factor',value:1.25,resonance:1.38,when:'La cible porte un bouclier'}],
 virulentStrike:[{kind:'per',value:.18,when:'par cumul de Virulence sur la cible'}],
 unstableBolt:[{kind:'per',value:.12,resonance:.14,when:'par charge d’Instabilité'}],
 unstableStun:[{kind:'per',value:.12,resonance:.14,when:'par charge d’Instabilité'}],
 unstableRelease:[{kind:'per',value:.12,resonance:.14,when:'par charge d’Instabilité'}],
 condemnStrike:[{kind:'per',value:.16,when:'par Condamnation accumulée'}],
 condemnJudgment:[{kind:'per',value:.16,when:'par Condamnation accumulée'}],
 tideStanceStrike:[{kind:'factor',value:1.28,resonance:1.38,when:'En Marée basse'},
  {kind:'factor',value:1.10,resonance:1.16,when:'En Marée haute'}],
 maelstromDischarge:[{kind:'per',value:.18,resonance:.22,when:'par cumul de Maelström'}],
 furyExecute:[{kind:'flat',value:.90,resonance:1.10,when:'Cible sous 35 % de ses PV'}],
 frostShatter:[{kind:'per',value:.15,when:'par cumul de Givre sur la cible'}],
 disintegrate:[{kind:'per',value:.30,resonance:.34,when:'par Charge accumulée'}],
 eternitySurge:[{kind:'per',value:.25,resonance:.29,when:'par Charge accumulée'}],
 holyPowerVerdict:[{kind:'per',value:.28,when:'par Puissance sacrée'}],
 feralFinish:[{kind:'per',value:.22,when:'par point de Sauvagerie'}],
 rogueFinish:[{kind:'per',value:.25,resonance:.28,when:'par point de combo'}],
 aimShot:[{kind:'per',value:.22,when:'par charge de Visée'}],
 arcaneBlast:[{kind:'per',value:.16,when:'par Charge arcanique'}],
 arcaneBarrage:[{kind:'per',value:.16,when:'par Charge arcanique'}],
 arcaneOrb:[{kind:'per',value:.16,count:4,when:'par Charge arcanique, portée à 4'}],
 apocalypse:[{kind:'per',value:.20,when:'par Blessure purulente'}],
 rapture:[{kind:'per',value:.22,when:'par affliction distincte sur la cible'}]
};

/** Constantes du moteur reprises telles quelles, pour ne pas les inventer. */
export const CRIT_MULTIPLIER=1.5;
export const VARIANCE=[.92,1.08];
export const AFFINITY={effective:1.30,weak:.75,neutral:1};
/** Mitigation : 100/(100 + DEF × 3). */
export const mitigation=defense=>100/(100+Math.max(0,Number(defense)||0)*3);

/**
 * Profil chiffre d'un sort, pour l'ecran.
 *
 * `stats` sont les statistiques vivantes du champion. `defense` sert d'exemple
 * concret : sans cible, un ratio ne dit rien au joueur.
 */
export function skillDamageProfile(hero,index,stats={},skillLevels={},options={}){
 const skill=hero?.skills?.[index];
 if(!skill)return null;
 const niveau=skillLevels?.[index]||1;
 const mastery=skillBonuses(index,niveau,skill);
 const stat=scalingStat(skill.effect);
 const base=Number(skill.power)||0;
 const ratio=base?base*(1+(mastery.power||0)):0;
 const resonanceIV=Boolean(options.resonanceIV);
 const source=Number(stats[stat])||0;
 const defense=Number(options.defense)||0;
 const brut=ratio*source*mitigation(defense);
 const conditionnels=(CONDITIONAL_BONUSES[skill.effect]||[]).map(bonus=>({
  ...bonus,
  applied:resonanceIV&&bonus.resonance!==undefined?bonus.resonance:bonus.value
 }));
 return{
  skill,level:niveau,maxPower:mastery.power||0,
  stat,statLabel:SCALING_LABEL[stat],statValue:source,
  baseRatio:base,ratio,
  heals:HP_SCALED.has(skill.effect),
  damage:base>0,
  expected:base>0?Math.round(brut):0,
  expectedCrit:base>0?Math.round(brut*CRIT_MULTIPLIER):0,
  mitigation:mitigation(defense),
  conditionals:conditionnels,
  cooldown:Math.max(0,(skill.cd||0)-(mastery.cooldown||0)),
  effectRate:mastery.effectRate||0,
  duration:mastery.duration||0
 };
}

/** Libelle lisible d'un bonus conditionnel. */
export function bonusLabel(bonus){
 const pourcent=valeur=>`${Math.round(valeur*100)} %`;
 if(bonus.kind==='factor')return`×${bonus.applied.toFixed(2).replace('.',',')}`;
 if(bonus.kind==='per')return`+${pourcent(bonus.applied)}${bonus.count?` × ${bonus.count}`:''}`;
 return`+${pourcent(bonus.applied)}`;
}
