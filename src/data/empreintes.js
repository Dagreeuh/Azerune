// Les Empreintes d'Azerune : l'arbre de progression par champion.
//
// Pourquoi un arbre plutot qu'une piste. Avant lui, un joueur ne posait qu'UN
// choix sur toute la progression d'un champion — l'orientation de
// Cendre-Sepulcrale. La Resonance s'applique seule, les niveaux de competence
// montent en ligne droite. Il y avait de la puissance a gagner partout, et
// aucune decision a prendre nulle part.
//
// Regle d'equilibre, la meme que pour les portails d'invocation : on change la
// FORME, pas le VOLUME. Le budget de points n'atteint jamais le nombre de
// noeuds — six sur douze au maximum absolu. On ne renforce donc pas un
// champion, on le specialise. Deux joueurs avec le meme Thorgar pleinement
// investi n'ont pas le meme Thorgar.
//
// Regle d'implementation : une Empreinte n'agit qu'a travers des leviers que le
// moteur lit deja — les quatre bonus de competence (puissance, chance d'effet,
// duree, recharge) et les statistiques. Aucun code de combat nouveau, donc
// aucune surface de bug nouvelle dans le moteur.

import{HEROES}from'./heroes';
import{skillMaxLevel}from'../utils/skills';
import{CHAMPION_TYPES}from'./championIdentities';

export const BRANCHES=[
 {id:'force',name:'Force',icon:'⚔️',summary:'Amplifie ce que le champion fait déjà : dégâts, soins ou boucliers.'},
 {id:'emprise',name:'Emprise',icon:'🕸️',summary:'Fiabilité et durée des effets — marques, malus, régénérations.'},
 {id:'flux',name:'Flux',icon:'🌀',summary:'Vitesse, temps de recharge, tempo.'}
];
export const ETAGES=4;
/** Resonance exigee pour ouvrir chaque etage. L'etage I est toujours ouvert. */
export const ETAGE_RESONANCE=[0,1,3,5];
/** Points offerts par les paliers de Resonance pairs. */
export const RESONANCE_POINT_TIERS=[2,4];

/**
 * Points disponibles.
 *
 * Les etoiles sont le corps du budget — donc l'Ascension, donc les essences,
 * donc les autres contenus. La Resonance en ajoute deux. Un champion 6★ R5,
 * sommet absolu de la progression, dispose de six points pour douze noeuds.
 */
export function empreintePoints(progress={}){
 const stars=Math.max(3,Math.min(6,Number(progress.stars)||3));
 const resonance=Math.max(0,Math.min(5,Number(progress.resonance)||0));
 return(stars-2)+RESONANCE_POINT_TIERS.filter(palier=>resonance>=palier).length;
}
/** Etage le plus profond accessible, de 1 a 4. */
export const empreinteDepth=(progress={})=>{
 const resonance=Math.max(0,Math.min(5,Number(progress.resonance)||0));
 return ETAGE_RESONANCE.filter(seuil=>resonance>=seuil).length;
};

/** Le champion soigne-t-il ou protege-t-il plutot qu'il ne frappe ? */
const SOUTIEN=new Set(['soigneur','tank','protecteur','soutien']);
const estSoutien=hero=>{
 const types=CHAMPION_TYPES[hero?.id]||[];
 return types.length>0&&types.every(type=>SOUTIEN.has(type));
};

/** Index de competence vise par un noeud, borne au kit reel du champion. */
const skillIndex=(hero,souhaite)=>Math.min(souhaite,Math.max(0,(hero?.skills?.length||1)-1));

/**
 * Les douze noeuds d'un champion, derives de son kit.
 *
 * Rien n'est ecrit a la main pour trente-six champions : chaque noeud lit le
 * sort qu'il vise et se nomme d'apres lui. Un noeud de Force sur une soigneuse
 * annonce « Soins +8 % » parce que powerLabel sait deja lire son effet.
 */
export function empreinteTree(hero){
 if(!hero?.skills?.length)return[];
 const soutien=estSoutien(hero);
 const s0=skillIndex(hero,0),s1=skillIndex(hero,1),s2=skillIndex(hero,2);
 const noeud=(branche,etage,id,name,icon,effect,detail)=>
  ({id:`${hero.id}:${branche}:${etage}`,key:id,heroId:hero.id,branche,etage,name,icon,effect,detail});
 return[
  // Force — amplifie l'action principale, puis l'ultime.
  noeud('force',1,'force-1','Poigne assurée','💪',{skill:s0,power:.06},
   'La compétence de base frappe (ou soigne) plus fort.'),
  noeud('force',2,'force-2','Second souffle','🔥',{skill:s1,power:.08},
   'La deuxième compétence gagne en puissance.'),
  noeud('force',3,'force-3','Frappe décisive','⚡',{skill:s2,power:.10},
   'L’ultime gagne en puissance.'),
  noeud('force',4,'force-4','Sommet','🏔️',{skill:s2,power:.14},
   'L’ultime frappe encore plus fort. Le nœud le plus cher de la branche.'),
  // Emprise — fiabilite et duree.
  noeud('emprise',1,'emprise-1','Prise ferme','🪢',{skill:s1,effectRate:.08},
   'Les effets de la deuxième compétence portent plus souvent.'),
  noeud('emprise',2,'emprise-2','Marque tenace','⏳',{skill:s0,duration:1},
   'Ce que pose la compétence de base dure un tour de plus.'),
  noeud('emprise',3,'emprise-3','Emprise profonde','🕸️',{skill:s2,effectRate:.12},
   'Les effets de l’ultime portent nettement plus souvent.'),
  noeud('emprise',4,'emprise-4','Étreinte durable','🔗',{skill:s1,duration:1,effectRate:.06},
   'La deuxième compétence dure un tour de plus et porte mieux.'),
  // Flux — tempo.
  noeud('flux',1,'flux-1','Pas léger','👣',{stats:{spd:4}},
   'Vitesse +4. Agir plus tôt vaut souvent mieux que frapper plus fort.'),
  noeud('flux',2,'flux-2','Souffle court','💨',{skill:s1,cooldown:1},
   'La deuxième compétence revient un tour plus tôt.'),
  noeud('flux',3,'flux-3','Rappel','🔁',{skill:s2,cooldown:1},
   'L’ultime revient un tour plus tôt.'),
  noeud('flux',4,'flux-4','Cadence','🌀',{stats:{spd:6},skill:s0,power:.04},
   soutien?'Vitesse +6, et la compétence de base soigne un peu plus.'
    :'Vitesse +6, et la compétence de base frappe un peu plus fort.')
 ];
}

/** Un nœud est-il atteignable, au vu des points et de la Resonance ? */
export function empreinteStatus(hero,progress={},lit=[]){
 const arbre=empreinteTree(hero),points=empreintePoints(progress),profondeur=empreinteDepth(progress);
 const allumes=new Set((lit||[]).filter(id=>arbre.some(noeud=>noeud.id===id)));
 return{
  arbre,points,profondeur,
  depenses:allumes.size,
  restants:Math.max(0,points-allumes.size),
  noeuds:arbre.map(noeud=>{
   const allume=allumes.has(noeud.id);
   const etageOuvert=noeud.etage<=profondeur;
   // Un etage ne s'ouvre qu'apres le precedent : on ne saute pas les paliers.
   const precedent=noeud.etage===1||allumes.has(`${hero.id}:${noeud.branche}:${noeud.etage-1}`);
   return{...noeud,allume,etageOuvert,precedent,
    disponible:!allume&&etageOuvert&&precedent&&allumes.size<points};
  })
 };
}

/** Somme des effets allumes : statistiques d'un cote, bonus de sort de l'autre. */
export function empreinteBonuses(hero,lit=[]){
 const arbre=empreinteTree(hero),allumes=new Set(lit||[]);
 const stats={},skills={};
 arbre.filter(noeud=>allumes.has(noeud.id)).forEach(({effect})=>{
  Object.entries(effect.stats||{}).forEach(([cle,valeur])=>{stats[cle]=(stats[cle]||0)+valeur});
  if(effect.skill===undefined)return;
  const cible=skills[effect.skill]||(skills[effect.skill]={power:0,effectRate:0,duration:0,cooldown:0});
  ['power','effectRate','duration','cooldown'].forEach(cle=>{if(effect[cle])cible[cle]+=effect[cle]});
 });
 return{stats,skills};
}

// Le plancher de recharge n'est pas redefini ici : le moteur calcule deja
// `Math.max(0, cd - cooldown) + 1`, donc un tour au minimum, quelle que soit la
// reduction cumulee. Le dupliquer aurait cree deux verites pour une seule regle.

/** Toutes les Empreintes existantes, pour les verifications globales. */
export const allTrees=()=>HEROES.map(hero=>({hero,arbre:empreinteTree(hero)}));
export const maxSkillLevel=skillMaxLevel;
