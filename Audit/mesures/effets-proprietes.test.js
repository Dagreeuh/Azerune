/**
 * Les trois listes d'effets disent-elles la vérité ?
 *
 * `EFFETS_A_JET`, `EFFETS_TEMPORELS` et `EFFETS_A_PUISSANCE` décident quels
 * nœuds d'Empreinte s'appliquent à quelle compétence. Le test de contrat qui
 * les garde les dérive en LISANT LE TEXTE du moteur — il cherche `debuff(`,
 * `mastery.duration`, `mastery.power` dans les lignes concernées.
 *
 * C'est la méthode qui m'a trompé quatre fois dans cet audit. Ici, on dérive
 * la vérité en EXÉCUTANT chaque sort et en observant ce qui change :
 *
 *   · à jet      : le résultat varie-t-il selon le tirage ?
 *   · temporel   : la durée posée suit-elle `mastery.duration` ?
 *   · à puissance: la magnitude suit-elle `mastery.power` ?
 */
import{it}from'vitest';
import{HEROES}from'../../src/data/heroes';
import{createBattle,castSkill,nextTurn}from'../../src/battle/engine';
import{EFFETS_A_JET,EFFETS_TEMPORELS,EFFETS_A_PUISSANCE,peutRecevoir}from'../../src/data/empreintes';
import{makeEnemy,fixedRandom}from'../../tests/helpers';

const S={hp:14000,atk:700,def:220,spd:100,crit:0,critDamage:50,
  accuracy:40,resistance:0,setEffects:[],resonanceLevel:0};
// Des ennemis increvables : rien ne doit mourir, sinon l'état change pour une
// raison qui n'a rien à voir avec ce qu'on mesure.
const ennemis=()=>[
  makeEnemy({id:'e1',name:'E1',hp:900000,atk:1,def:120,spd:1,element:'Arcane'}),
  makeEnemy({id:'e2',name:'E2',hp:900000,atk:1,def:120,spd:1,element:'Nature'}),
  makeEnemy({id:'e3',name:'E3',hp:900000,atk:1,def:120,spd:1,element:'Feu'})];

/** Un combat prêt, le champion audité à la main, ses comparses blessés. */
function poser(id,index,bonus){
  const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1},
    empreinteSkills:h.id===id?{[index]:bonus}:null}));
  const autres=HEROES.filter(h=>h.id!==id).slice(0,2).map(h=>h.id);
  const b=createBattle([id,...autres],heroes,()=>({...S}),{enemies:ennemis()});
  return{...b,turn:id,
    // Très bas en points de vie, volontairement : un soin de 48 % des PV max
    // amplifié par le bonus PLAFONNE au maximum, et les deux mesures finissent
    // identiques. J'avais déclaré `totemHeal` et `totemTide` « sans effet »
    // pour cette seule raison — l'instrument saturait.
    allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0],hp:Math.max(1,Math.round(u.maxHp*.04))}
      :{...u,hp:Math.max(1,Math.round(u.maxHp*.03))})};
}

const AUCUN={power:0,effectRate:0,duration:0,cooldown:0};

/** Ce qu'on observe après un lancer. */
// Les valeurs numériques portées par les buffs et malus — la puissance d'une
// amélioration, la part d'une plaie, un cumul. `ebonMight` écrit sa force
// LÀ et nulle part ailleurs : ne regarder que les points de vie le déclarait
// « sans effet ».
const charges=u=>[...Object.values(u.buffs||{}),...Object.values(u.debuffs||{})]
  .reduce((s,v)=>s+Object.entries(v||{})
    .filter(([c])=>c!=='turns'&&c!=='source'&&c!=='sourceAtk')
    .reduce((t,[,x])=>t+(Number(x)||0),0),0);

const photo=b=>{
  const unites=[...b.allies,...b.enemies];
  return{
    magnitude:unites.reduce((s,u)=>s+u.hp+(u.shield||0)+charges(u)*1000,0),
    duree:Math.max(0,...unites.flatMap(u=>
      [...Object.values(u.buffs||{}),...Object.values(u.debuffs||{})]
        .map(v=>Number(v?.turns)||0))),
    poses:unites.map(u=>
      [...Object.keys(u.buffs||{}),...Object.keys(u.debuffs||{})].sort().join(',')).join('|'),
  };
};

/**
 * Amorcer le champion avant de mesurer.
 *
 * Beaucoup d'effets ne s'expriment QUE si une condition est déjà remplie :
 * des cumuls, une marque, un totem, un allié lié. Les mesurer sur un lancer
 * isolé, c'est reproduire le piège documenté de cet audit — « ce sort ne fait
 * rien » alors qu'il attend son décor. On joue donc d'abord les deux autres
 * compétences du champion, puis on remet les recharges à zéro.
 */
const amorcer=(b,id,index,plan)=>{
  let etat=b;
  // Plusieurs amorçages, parce qu'aucun ne convient à tous les kits :
  //  · rien du tout ;
  //  · le générateur répété — certains effets n'ouvrent qu'à trois points ;
  //  · toutes les compétences en alternance.
  // Alterner NE SUFFIT PAS : chez Brom, le sort 1 CONSOMME la ressource, si
  // bien que 0,1,0,1 la ramène sans cesse à zéro et que le Séisme n'atteint
  // jamais son seuil. Je l'avais déclaré « sans effet » pour cette seule
  // raison. On prend donc l'union de ce que chaque amorçage révèle.
  for(const autre of plan){
    if(autre===index)continue;
    const pret={...etat,turn:id,
      allies:etat.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)};
    const cible=pret.enemies.find(u=>!u.dead)?.id;
    const sortie=castSkill(pret,autre,cible);
    if(sortie?.battle)etat=sortie.battle;
  }
  return{...etat,turn:id,
    allies:etat.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)};
};

const AMORCE=.10;
const lancer=(id,index,bonus,tirage,plan)=>{
  fixedRandom(AMORCE);
  let b=poser(id,index,bonus);
  if(plan?.length)b=amorcer(b,id,index,plan);
  // Le tirage de la MESURE n'est posé qu'ici : tout ce qui précède est
  // rigoureusement identique d'un lancer à l'autre.
  fixedRandom(tirage);
  const cible=b.enemies.find(u=>!u.dead)?.id;
  const sortie=castSkill(b,index,cible);
  if(!sortie?.battle)return null;
  // Laisser décanter : beaucoup d'effets ne livrent leur magnitude qu'aux tours
  // suivants — une graine qui éclot, un souffle qui se libère, un poison qui
  // ronge. Photographier au moment du lancer les déclarait « sans effet ».
  // `nextTurn` ne fait qu'appliquer le tic périodique ; personne n'agit.
  let apres=sortie.battle;
  for(let t=0;t<4&&!apres.winner;t+=1)apres=nextTurn(apres);
  return{immediat:photo(sortie.battle),decante:photo(apres)};
};

it('propriétés réelles de chaque effet',()=>{
  const reel={jet:new Set(),duree:new Set(),puissance:new Set()};
  const declaree={};
  const connus=new Set();
  HEROES.forEach(hero=>hero.skills.forEach((skill,index)=>{
    const e=skill.effect;
    if(!e||connus.has(e))return;
    connus.add(e);
    declaree[e]={jet:peutRecevoir(hero,index,'effectRate'),
      duree:peutRecevoir(hero,index,'duration'),
      puissance:peutRecevoir(hero,index,'power')};
    const PLANS=[[],[0,0,0],[1,1,1],[2,2,2],[0,1,2,0,1,2]];
    PLANS.forEach(plan=>{
      const base=lancer(hero.id,index,AUCUN,.10,plan);
      if(!base)return;
      const haut=lancer(hero.id,index,AUCUN,.99,plan);
      if(haut&&haut.immediat.poses!==base.immediat.poses)reel.jet.add(e);
      const plusLong=lancer(hero.id,index,{...AUCUN,duration:3},.10,plan);
      if(plusLong&&plusLong.immediat.duree>base.immediat.duree)reel.duree.add(e);
      const plusFort=lancer(hero.id,index,{...AUCUN,power:1.5},.10,plan);
      if(plusFort&&(plusFort.immediat.magnitude!==base.immediat.magnitude
        ||plusFort.decante.magnitude!==base.decante.magnitude))reel.puissance.add(e);
    });
  }));

  // On compare à ce que `peutRecevoir` annonce RÉELLEMENT, pas au contenu brut
  // des listes : un sort dont `power > 0` reçoit déjà le bonus de puissance
  // sans figurer dans `EFFETS_A_PUISSANCE`.
  const compare=(titre,cle,mesuree)=>{
    const d=[...connus].filter(e=>declaree[e]?.[cle]);
    const absents=d.filter(e=>!mesuree.has(e));
    const oublies=[...mesuree].filter(e=>!declaree[e]?.[cle]);
    console.log(`\n=== ${titre} ===`);
    console.log(`  déclarés ${d.length} · mesurés ${mesuree.size}`);
    if(absents.length)console.log(`  DÉCLARÉS MAIS SANS EFFET (${absents.length}) : ${absents.sort().join(', ')}`);
    if(oublies.length)console.log(`  OUBLIÉS DE LA LISTE (${oublies.length}) : ${oublies.sort().join(', ')}`);
    if(!absents.length&&!oublies.length)console.log('  accord parfait');
  };
  console.log(`\n${connus.size} effets distincts exercés`);
  compare('À JET (bonus « chance d’effet »)','jet',reel.jet);
  compare('TEMPORELS (bonus « durée »)','duree',reel.duree);
  compare('À PUISSANCE (bonus « puissance »)','puissance',reel.puissance);
});
