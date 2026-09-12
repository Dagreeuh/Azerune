import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill,nextTurn}from'../src/battle/engine';
import{peutRecevoir,EFFETS_A_JET,EFFETS_TEMPORELS,EFFETS_A_PUISSANCE}from'../src/data/empreintes';
import{makeEnemy,fixedRandom}from'./helpers';

/**
 * Les trois listes d'effets disent-elles la vérité ? Vérifié EN JOUANT.
 *
 * `EFFETS_A_JET`, `EFFETS_TEMPORELS` et `EFFETS_A_PUISSANCE` décident quels
 * nœuds d'Empreinte s'appliquent à quelle compétence. Le contrat qui les
 * gardait les dérivait en LISANT LE TEXTE du moteur — il cherchait `debuff(`
 * ou `mastery.duration` dans le bloc de chaque effet.
 *
 * Cette méthode a un angle mort : elle ne voit pas ce que font les HELPERS.
 * `shield()` écrit `turns:2+mastery.duration`, si bien que tout sort posant un
 * bouclier a une durée qui suit le bonus — sans jamais écrire `mastery` dans
 * son propre bloc. Cinq effets étaient donc absents de la liste, et le joueur
 * se voyait refuser un bonus qui aurait fonctionné.
 *
 * Ici, on exécute chaque sort et on observe ce qui change.
 */

const S={hp:14000,atk:700,def:220,spd:100,crit:0,critDamage:50,
  accuracy:40,resistance:0,setEffects:[],resonanceLevel:0};
const AUCUN={power:0,effectRate:0,duration:0,cooldown:0};
const AMORCE=.10;
// Des ennemis increvables : rien ne doit mourir, sinon l'état change pour une
// raison étrangère à ce qu'on mesure.
const ennemis=()=>[
  makeEnemy({id:'e1',name:'E1',hp:900000,atk:1,def:120,spd:1,element:'Arcane'}),
  makeEnemy({id:'e2',name:'E2',hp:900000,atk:1,def:120,spd:1,element:'Nature'}),
  makeEnemy({id:'e3',name:'E3',hp:900000,atk:1,def:120,spd:1,element:'Feu'})];

function poser(id,index,bonus){
  const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1},
    empreinteSkills:h.id===id?{[index]:bonus}:null}));
  const autres=HEROES.filter(h=>h.id!==id).slice(0,2).map(h=>h.id);
  const b=createBattle([id,...autres],heroes,()=>({...S}),{enemies:ennemis()});
  // Très bas en points de vie : un soin de 48 % des PV max amplifié par le
  // bonus PLAFONNE au maximum, et les deux mesures finiraient identiques.
  return{...b,turn:id,
    allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0],hp:Math.max(1,Math.round(u.maxHp*.04))}
      :{...u,hp:Math.max(1,Math.round(u.maxHp*.03))})};
}

// Les valeurs portées par les buffs et malus : `ebonMight` écrit sa force LÀ
// et nulle part ailleurs.
const charges=u=>[...Object.values(u.buffs||{}),...Object.values(u.debuffs||{})]
  .reduce((s,v)=>s+Object.entries(v||{})
    .filter(([c])=>c!=='turns'&&c!=='source'&&c!=='sourceAtk')
    .reduce((t,[,x])=>t+(Number(x)||0),0),0);

const photo=b=>{
  const u=[...b.allies,...b.enemies];
  return{
    magnitude:u.reduce((s,x)=>s+x.hp+(x.shield||0)+charges(x)*1000,0),
    duree:Math.max(0,...u.flatMap(x=>[...Object.values(x.buffs||{}),...Object.values(x.debuffs||{})]
      .map(v=>Number(v?.turns)||0))),
    poses:u.map(x=>[...Object.keys(x.buffs||{}),...Object.keys(x.debuffs||{})].sort().join(',')).join('|'),
  };
};

// Plusieurs amorçages : aucun ne convient à tous les kits. Chez Brom, le sort 1
// CONSOMME la ressource, si bien qu'alterner 0,1,0,1 la ramène sans cesse à
// zéro et que le Séisme n'atteint jamais son seuil de trois points.
const PLANS=[[],[0,0,0],[1,1,1],[2,2,2],[0,1,2,0,1,2]];

const amorcer=(b,id,index,plan)=>{
  let etat=b;
  for(const autre of plan){
    if(autre===index)continue;
    const pret={...etat,turn:id,allies:etat.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)};
    const sortie=castSkill(pret,autre,pret.enemies.find(u=>!u.dead)?.id);
    if(sortie?.battle)etat=sortie.battle;
  }
  return{...etat,turn:id,allies:etat.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)};
};

const lancer=(id,index,bonus,tirage,plan)=>{
  fixedRandom(AMORCE);
  let b=poser(id,index,bonus);
  if(plan.length)b=amorcer(b,id,index,plan);
  // Le tirage de la MESURE n'est posé qu'ici : tout ce qui précède est
  // rigoureusement identique d'un lancer à l'autre.
  fixedRandom(tirage);
  const sortie=castSkill(b,index,b.enemies.find(u=>!u.dead)?.id);
  if(!sortie?.battle)return null;
  // Laisser décanter : une graine éclot, un souffle se libère, un poison ronge.
  let apres=sortie.battle;
  for(let t=0;t<4&&!apres.winner;t+=1)apres=nextTurn(apres);
  return{immediat:photo(sortie.battle),decante:photo(apres)};
};

/**
 * Deux effets ne sont PAS observables sur un banc d'essai, et c'est vérifié
 * dans le moteur plutôt que supposé : leur bloc lit bien `mastery.power`.
 *   · guardianLink transfère des dégâts — sa force n'apparaît que lorsque
 *     l'allié lié encaisse un coup, ce qui n'arrive jamais ici ;
 *   · refluxRelease ne libère que de l'énergie déjà stockée.
 * Les inscrire ici plutôt que d'affaiblir l'assertion : une exception nommée
 * et justifiée vaut mieux qu'un test qui ferme les yeux.
 */
const INOBSERVABLES=new Set(['guardianLink','refluxRelease']);

const mesurer=()=>{
  const reel={jet:new Set(),duree:new Set(),puissance:new Set()};
  const declaree={},connus=new Set();
  HEROES.forEach(hero=>hero.skills.forEach((skill,index)=>{
    const e=skill.effect;
    if(!e||connus.has(e))return;
    connus.add(e);
    declaree[e]={jet:peutRecevoir(hero,index,'effectRate'),
      duree:peutRecevoir(hero,index,'duration'),
      puissance:peutRecevoir(hero,index,'power')};
    PLANS.forEach(plan=>{
      const base=lancer(hero.id,index,AUCUN,.10,plan);
      if(!base)return;
      const haut=lancer(hero.id,index,AUCUN,.99,plan);
      if(haut&&haut.immediat.poses!==base.immediat.poses)reel.jet.add(e);
      const long=lancer(hero.id,index,{...AUCUN,duration:3},.10,plan);
      if(long&&long.immediat.duree>base.immediat.duree)reel.duree.add(e);
      const fort=lancer(hero.id,index,{...AUCUN,power:1.5},.10,plan);
      if(fort&&(fort.immediat.magnitude!==base.immediat.magnitude
        ||fort.decante.magnitude!==base.decante.magnitude))reel.puissance.add(e);
    });
  }));
  return{reel,declaree,connus};
};

describe('les listes d’effets correspondent à ce que le moteur fait',()=>{
  const{reel,declaree,connus}=mesurer();
  const declares=cle=>[...connus].filter(e=>declaree[e]?.[cle]).sort();
  const mesures=(cle,ens)=>[...new Set([...ens,
    ...[...connus].filter(e=>INOBSERVABLES.has(e)&&declaree[e]?.[cle])])].sort();

  it('exerce bien tout le roster',()=>{
    expect(connus.size).toBeGreaterThanOrEqual(90);
  });

  // Les deux assertions suivantes ne comparent que des effets PRÉSENTS dans le
  // roster : un nom qui ne correspond à aucun sort resterait invisible des deux
  // côtés. Un tel nom mort ne casse rien aujourd'hui, mais il ment sur ce que
  // les listes contiennent — et il survivra à la disparition du sort qui l'a
  // justifié. On l'interdit explicitement.
  it('aucune liste ne garde le nom d’un effet qui n’existe plus',()=>{
    const orphelins=cle=>[...cle].filter(e=>!connus.has(e)).sort();
    expect({jet:orphelins(EFFETS_A_JET),duree:orphelins(EFFETS_TEMPORELS),
      puissance:orphelins(EFFETS_A_PUISSANCE)})
      .toEqual({jet:[],duree:[],puissance:[]});
  });

  it('« chance d’effet » : exactement les sorts qui tentent un jet',()=>{
    expect(mesures('jet',reel.jet)).toEqual(declares('jet'));
  });

  it('« durée » : exactement les sorts qui posent quelque chose de temporaire',()=>{
    // Cinq sorts à bouclier manquaient : leur durée vient du helper `shield()`,
    // que la dérivation par lecture du source ne pouvait pas voir.
    expect(mesures('duree',reel.duree)).toEqual(declares('duree'));
  });

  it('« puissance » : exactement les sorts dont la magnitude suit la maîtrise',()=>{
    expect(mesures('puissance',reel.puissance)).toEqual(declares('puissance'));
  });
},{timeout:120000});
