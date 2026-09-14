/**
 * Modèle de joueur : à quoi ressemble une équipe à un point donné de la partie.
 *
 * Pour savoir si un contenu est faisable, il ne suffit pas de comparer deux
 * nombres de « puissance ». Il faut une équipe réelle — des champions à un
 * niveau, un nombre d'étoiles, et surtout de l'ÉQUIPEMENT — et la faire jouer.
 *
 * L'équipement n'est pas inventé ici : il est produit par `generateCampaignItem`,
 * la fonction qui fait tomber le butin en jeu. Un joueur modélisé porte donc ce
 * que le jeu lui donne vraiment dans la zone où il farme, ni plus ni moins.
 */
import{HEROES}from'../../src/data/heroes.js';
import{CONTINENTS}from'../../src/data/campaign.js';
import{generateCampaignItem,SLOTS,SETS}from'../../src/data/items.js';
import{totalStats,championPower}from'../../src/utils/stats.js';
import{empreinteTree,empreintePoints,empreinteDepth,empreinteBonuses}from'../../src/data/empreintes.js';
import{skillMaxLevel}from'../../src/utils/skills.js';

/** PRNG mulberry32 : même graine, même joueur, d'une mesure à l'autre. */
export function mulberry32(seed){
  let a=seed>>>0;
  return()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
}

/** Exécute `fn` avec un Math.random déterministe, puis le rend. */
export function avecHasard(graine,fn){
  const vrai=Math.random,suite=mulberry32(graine);
  Math.random=suite;
  try{return fn()}finally{Math.random=vrai}
}

/**
 * Répartition des six pièces entre les sets de la zone.
 *
 * Une première version alternait les sets une pièce sur deux. Un set de quatre
 * pièces ne se complétait alors JAMAIS : le joueur de la zone 8 (lifesteal 4 +
 * attack 4) portait six pièces et zéro bonus de set, et la mesure le faisait
 * passer pour plus faible que le joueur de la zone 6. C'était mon modèle qui
 * jouait mal, pas le jeu qui était cassé.
 *
 * Un joueur sensé complète d'abord le set le plus exigeant, puis verse le
 * reste sur le moins exigeant — un set à deux pièces compte d'ailleurs autant
 * de fois qu'il tient dans les pièces portées.
 */
function repartirSets(setIds){
  const tries=[...setIds].sort((a,b)=>SETS[b].pieces-SETS[a].pieces);
  const plan=[];
  tries.forEach(id=>{for(let i=0;i<SETS[id].pieces&&plan.length<6;i+=1)plan.push(id)});
  const petit=tries[tries.length-1];
  while(plan.length<6)plan.push(petit);
  return plan.slice(0,6);
}

/**
 * Six pièces pour un champion, tirées du butin de la zone indiquée.
 * `setsVoulus` force le set quand la zone le propose : un joueur qui farme
 * cible ses pièces, il ne les prend pas au hasard.
 */
function equiper(zoneIndex,difficulte,setsVoulus,niveauObjet){
  const continent=CONTINENTS[zoneIndex],plan=repartirSets(setsVoulus);
  return SLOTS.map((slot,i)=>{
    const objet=generateCampaignItem({continentId:continent.id,continentIndex:zoneIndex,
      continentName:continent.name,name:`palier ${i+1}`,stageId:String(i+1),
      difficultyId:difficulte,boss:false,preferredSetId:plan[i]});
    return{...objet,slot,level:niveauObjet};
  });
}

/**
 * Une allocation d'Empreintes légale et maximale : on dépense tout le budget
 * en respectant l'étage ouvert et la chaîne de prérequis. Sans cela le modèle
 * sous-estime un joueur avancé, et déclarerait « infaisable » un contenu qui
 * ne l'est pas.
 */
function empreintesMax(hero,progress){
  const arbre=empreinteTree(hero),points=empreintePoints(progress),profondeur=empreinteDepth(progress);
  const lit=[],allumes=new Set();
  for(let etage=1;etage<=profondeur;etage+=1){
    arbre.filter(n=>n.etage===etage).forEach(n=>{
      if(lit.length>=points)return;
      const precedent=etage===1||allumes.has(`${hero.id}:${n.branche}:${etage-1}`);
      if(!precedent)return;
      lit.push(n.id);allumes.add(n.id);
    });
  }
  return lit;
}

/**
 * Un joueur complet.
 *   zone        1-10, la zone farmée (l'équipement vient de là)
 *   difficulte  'normal' | 'hard' | 'hardcore', qualité du butin
 *   niveau      niveau des champions (1-60)
 *   etoiles     étoiles des champions (3-6), plancher à leur rareté
 *   niveauObjet amélioration des pièces (0-15)
 * Renvoie { heroes, getStats, equipement } directement utilisables par
 * `simulerMission` et par `teamPower`.
 */
export function joueur({zone=1,difficulte='normal',niveau=10,etoiles=3,niveauObjet=0,
  resonance=0,competences=1,empreintes=false,graine=7}={}){
  const zoneIndex=Math.max(0,Math.min(9,zone-1));
  const setsVoulus=CONTINENTS[zoneIndex].setIds||[CONTINENTS[zoneIndex].setId];
  const equipement={},inventaire=[],progres={};
  avecHasard(graine,()=>{
    HEROES.forEach(hero=>{
      const pieces=equiper(zoneIndex,difficulte,setsVoulus,niveauObjet);
      equipement[hero.id]={};
      pieces.forEach(piece=>{equipement[hero.id][piece.slot]=piece.id;inventaire.push(piece)});
      const base={level:niveau,stars:Math.max(hero.rarity,etoiles),xp:0,resonance};
      progres[hero.id]={...base,empreintes:empreintes?empreintesMax(hero,base):[]};
    });
  });
  const cache=new Map();
  const getStats=hero=>{
    if(!cache.has(hero.id))cache.set(hero.id,totalStats(hero,equipement,progres[hero.id],inventaire));
    return cache.get(hero.id);
  };
  // Les niveaux de competence et les bonus d'Empreinte voyagent sur l'objet
  // champion : c'est la que `createBattle` les lit.
  const niveaux=competences==='max'?null:{0:competences,1:competences,2:competences};
  // `currentStars` n'est pas decoratif : le moteur refuse la 3e competence a un
  // champion 3* qui ne l'a pas atteint 4*. L'oublier bride tout un tiers du
  // roster sans rien signaler.
  const roster=HEROES.map(hero=>({...hero,
    currentStars:progres[hero.id].stars,
    skillLevels:niveaux||{0:skillMaxLevel(0),1:skillMaxLevel(1),2:skillMaxLevel(2)},
    empreinteSkills:empreintes?empreinteBonuses(hero,progres[hero.id].empreintes).skills:null}));
  return{heroes:roster,getStats,equipement,inventaire,progres,
    etiquette:`zone ${zone} ${difficulte} · niv ${niveau} · ${etoiles}★ · +${niveauObjet}`};
}

/**
 * L'équipe que le jeu autorise pour CETTE mission.
 *
 * Piège coûteux : seul le raid se joue à quatre. La campagne, les expéditions
 * et le Mythic+ se jouent à TROIS (`Math.min(4, mission.teamSize || 3)` dans
 * Layout et GameContext). Mesurer partout avec quatre champions donne une
 * équipe 33 % plus fournie que celle du joueur, et fausse tout calibrage.
 */
const puissanceDe=(j,hero)=>championPower(j.getStats(hero));
export const tailleEquipe=mission=>Math.max(1,Math.min(4,Number(mission?.teamSize)||3));

/**
 * ÉQUIPE FIXE — et c'est le point le plus important de ce fichier.
 *
 * Une première version composait l'équipe en prenant « les quatre champions les
 * plus puissants ». Erreur grossière, et longue à voir : la composition changeait
 * presque entièrement d'un palier de progression au suivant (zone 9 :
 * Brom, Ignovar, Korga, Kaelen ; zone 10 : Histéria, Vexil, Thorgar, Brom).
 * Chaque comparaison « ce joueur est mieux équipé et gagne moins » comparait en
 * réalité DEUX ÉQUIPES DIFFÉRENTES. Toute non-monotonie observée était suspecte.
 *
 * L'équipe est désormais la même partout : un soin, un bouclier, deux frappeurs
 * — la composition qu'un joueur averti amène, et celle que le banc d'apport
 * désigne comme la plus utile. Seul l'ÉQUIPEMENT varie d'un palier à l'autre,
 * ce qui est précisément la question posée.
 */
const NOMS_EQUIPE=['Hicho','Aurelis','Morghast','Ignovar'];
export const equipeFixe=(j,taille=4)=>NOMS_EQUIPE.slice(0,taille)
  .map(nom=>j.heroes.find(h=>h.name===nom)?.id).filter(id=>id!==undefined);

export const equipePour=(mission,j,champion)=>{
  const taille=tailleEquipe(mission);
  if(champion===undefined)return equipeFixe(j,taille);
  // Un champion impose : il prend la place du dernier de l'equipe type.
  return[champion,...equipeFixe(j,taille).filter(id=>id!==champion).slice(0,taille-1)];
};

/** Ancienne regle, gardee pour montrer ce qu'elle valait. */
export const equipeParPuissance=(mission,j)=>[...j.heroes]
  .map(h=>({h,pw:puissanceDe(j,h)})).sort((a,b)=>b.pw-a.pw)
  .slice(0,tailleEquipe(mission)).map(x=>x.h.id);
