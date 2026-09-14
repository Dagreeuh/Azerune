// Les trois portails d'invocation.
//
// Regle de conception, valable pour les trois : AUCUN portail ne modifie le
// taux de 5★. Ils changent la CIBLE, jamais le VOLUME. Un joueur qui invoque
// cent fois obtient le meme nombre de 5★ quel que soit le portail choisi ; ce
// qui change, c'est la probabilite que ce 5★ soit celui qu'il attend.
//
// C'est ce qui permet d'ouvrir deux portails supplementaires sans toucher a
// l'equilibre de l'economie : les cristaux gagnes valent exactement autant
// qu'avant, et personne ne debloque le roster plus vite. Un portail qui aurait
// releve le taux aurait force a revoir toutes les sources de cristaux.
//
// Deuxieme regle : le compteur de garantie (pite) est COMMUN aux trois. Changer
// de portail ne fait rien perdre. C'est le choix accueillant — un jeu entre
// amis n'a pas a punir la curiosite.

import{HEROES}from'./heroes';

/** Prix commun aux trois portails : aucun n'achete de meilleures chances. */
export const SUMMON_COST={single:100,multi:900};
export const PITY_THRESHOLD=100;

/** Part des 5★ qui tombe sur la cible, par portail. */
export const ELECTED_SHARE=.50;
export const MONTHLY_SHARE=.75;
/** Nombre de 5★ mis en avant chaque mois. */
export const MONTHLY_FEATURED_COUNT=3;

export const BANNERS=[
 {id:'ancestral',name:'Portail ancestral',icon:'🌀',
  summary:'Le pool complet, sans favori.',
  detail:'Tous les champions peuvent apparaitre. Seul portail qui accepte les Pierres de foyer.',
  acceptsStones:true},
 {id:'voeu',name:'Vœu d’Azerune',icon:'🕯️',
  summary:'Vous nommez un 5★. Une chance sur deux qu’un 5★ soit lui.',
  detail:'Si le 5★ obtenu n’est pas votre élu, le prochain 5★ de ce portail l’est à coup sûr. Changer d’élu remet cette garantie à zéro.',
  acceptsStones:false},
 {id:'conjonction',name:'Conjonction mensuelle',icon:'🌙',
  summary:'Trois 5★ mis en avant, renouvelés chaque mois.',
  detail:'Trois chances sur quatre qu’un 5★ soit l’un des trois. Vous ne choisissez pas lequel, et le trio change au premier du mois.',
  acceptsStones:false}
];
export const DEFAULT_BANNER='ancestral';
export const bannerById=id=>BANNERS.find(entry=>entry.id===id)||BANNERS[0];

/** Les 5★ invocables, tries pour que l'ordre ne depende pas du fichier source. */
export const fiveStarPool=(heroes=HEROES)=>
 heroes.filter(hero=>hero.rarity===5).map(hero=>hero.id).sort((a,b)=>a-b);

/**
 * Identifiant du mois. Les amis qui jouent le meme mois voient le meme trio :
 * la rotation est calculee, jamais tiree au hasard.
 */
export const monthKey=(date=new Date())=>date.getFullYear()*12+date.getMonth();

/**
 * Trio du mois. Melange deterministe du pool par un generateur congruentiel
 * amorce sur le mois — meme entree, meme sortie, sur toutes les machines.
 */
export function monthlyFeatured(date=new Date(),heroes=HEROES){
 const pool=fiveStarPool(heroes);
 if(!pool.length)return[];
 let graine=(monthKey(date)*2654435761)>>>0;
 const suivant=()=>{graine=(graine*1664525+1013904223)>>>0;return graine/4294967296};
 const melange=[...pool];
 for(let index=melange.length-1;index>0;index-=1){
  const cible=Math.floor(suivant()*(index+1));
  [melange[index],melange[cible]]=[melange[cible],melange[index]];
 }
 return melange.slice(0,Math.min(MONTHLY_FEATURED_COUNT,melange.length));
}

/**
 * Quel 5★ tombe, sachant que la rarete 5 est deja decidee ailleurs.
 *
 * `roll` et `pick` sont injectes : la decision est pure et se teste sans
 * toucher a Math.random. Renvoie l'identifiant retenu et si la garantie de
 * l'elu doit rester armee pour le prochain 5★.
 */
export function resolveFiveStar({bannerId,electedId,featured=[],guaranteed=false,roll=0,pick=list=>list[0],heroes=HEROES}){
 const pool=fiveStarPool(heroes);
 if(!pool.length)return{id:null,guaranteed:false,onTarget:false};
 const horsCible=exclus=>{const reste=pool.filter(id=>!exclus.includes(id));return reste.length?pick(reste):pick(pool)};
 if(bannerId==='voeu'&&electedId&&pool.includes(electedId)){
  if(guaranteed||roll<ELECTED_SHARE)return{id:electedId,guaranteed:false,onTarget:true};
  return{id:horsCible([electedId]),guaranteed:true,onTarget:false};
 }
 if(bannerId==='conjonction'){
  const cibles=featured.filter(id=>pool.includes(id));
  if(cibles.length&&roll<MONTHLY_SHARE)return{id:pick(cibles),guaranteed,onTarget:true};
  return{id:horsCible(cibles),guaranteed,onTarget:false};
 }
 return{id:pick(pool),guaranteed,onTarget:false};
}
