import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill}from'../src/battle/engine';
import{makeEnemy,fixedRandom}from'./helpers';
import{skillDamageProfile}from'../src/utils/skillMath';

/**
 * Nyxaris : les Charges doivent peser.
 *
 * Classé dernier du roster sur quatre rencontres d'éléments différents
 * (12 victoires sur 288, médiane 71) alors qu'il inflige 17 % de dégâts de plus
 * que la médiane au banc à statistiques égalisées. Son kit est du dégât pur,
 * sans malus ni soin ni bouclier : son seul levier est l'ampleur du paiement
 * des Charges, et trois Charges ne valaient que +90 %.
 *
 * Mesuré après passage à +50 % par Charge : 12 → 33 victoires sur 288.
 */
const S={hp:9000,atk:600,def:200,spd:100,crit:0,critDamage:50,
  accuracy:40,resistance:20,setEffects:[],resonanceLevel:0};
const NYXARIS=36,DESINTEGRATION=1,VAGUE=2;
const roster=()=>HEROES.map(h=>({...h,currentStars:6,skillLevels:{0:1,1:1,2:1}}));
const cibles=()=>[makeEnemy({id:'e1',hp:900000,atk:1,def:120,spd:1,element:'Nature'}),
  makeEnemy({id:'e2',hp:900000,atk:1,def:120,spd:1,element:'Nature'})];

/** Combat prêt, avec `charges` Charges déjà accumulées. */
function poser(charges){
  const b=createBattle([NYXARIS,1,3],roster(),()=>({...S}),{enemies:cibles()});
  return{...b,turn:NYXARIS,
    allies:b.allies.map(u=>u.id===NYXARIS?{...u,mechanic:{...u.mechanic,value:charges},cooldowns:[0,0,0]}:u)};
}
// `createBattle` ne conserve pas forcement l'identifiant d'ennemi qu'on lui
// passe : on lit celui du combat plutot que de le supposer.
const degats=(charges,index)=>{
  fixedRandom(.5);
  const avant=poser(charges);
  const cible=avant.enemies[0].id;
  const apres=castSkill(avant,index,cible).battle;
  const total=combat=>combat.enemies.reduce((s,u)=>s+Math.max(0,u.hp),0);
  return total(avant)-total(apres);
};

describe('les Charges de Nyxaris pèsent sur les dégâts',()=>{
  it('trois Charges valent +150 % sur la Désintégration',()=>{
    const sans=degats(0,DESINTEGRATION),plein=degats(3,DESINTEGRATION);
    expect(sans).toBeGreaterThan(0);
    // Le defaut d'origine, en une ligne : trois Charges ne valaient que +90 %.
    expect(plein/sans).toBeGreaterThan(2.3);
    expect(plein/sans).toBeLessThan(2.7);
  });

  it('trois Charges valent +120 % sur la Vague d’éternité',()=>{
    const sans=degats(0,VAGUE),plein=degats(3,VAGUE);
    expect(sans).toBeGreaterThan(0);
    expect(plein/sans).toBeGreaterThan(2.0);
    expect(plein/sans).toBeLessThan(2.4);
  });

  it('chaque Charge compte, pas seulement la troisième',()=>{
    const paliers=[0,1,2,3].map(n=>degats(n,DESINTEGRATION));
    paliers.forEach((v,i)=>{if(i)expect(v).toBeGreaterThan(paliers[i-1])});
  });

  it('la description annonce ce que le moteur applique',()=>{
    const nyxaris=HEROES.find(h=>h.id===NYXARIS);
    expect(nyxaris.skills[DESINTEGRATION].description).toContain('+50 %');
    expect(nyxaris.skills[VAGUE].description).toContain('+40 %');
    // L'infobulle reconstitue le calcul : elle doit connaitre le bonus.
    const profil=skillDamageProfile(nyxaris,DESINTEGRATION,{});
    expect(profil).toBeTruthy();
  });
});
