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
/**
 * Ce que chaque type de bonus peut réellement toucher.
 *
 * Le tableau d'Empreintes était identique pour tous les champions : les mêmes
 * douze nœuds, aux mêmes emplacements. Or un bonus de fiabilité sur une
 * compétence qui ne tente aucun jet, ou un bonus de durée sur une frappe qui ne
 * pose rien, ne fait rien du tout. Mesure : **84 nœuds sur 384 étaient morts**,
 * soit 22 % du système, jusqu'à 6 sur 12 pour Caelion.
 *
 * Ces listes sont dérivées du moteur et vérifiées par un test de contrat : si
 * un kit change, le test dit lequel mettre à jour.
 *
 * Détail : Audit/RAPPORT-EXPERIENCE-JOUEUR.md, section 14.
 */
export const EFFETS_A_JET=new Set(['agony','alchemyMix','alchemyPoison','corruption','emberBurn','emberSpread','feralBuilder','festeringSpread','festeringStrike','frostBolt','frostNova','frostShatter','gardenPrison','gardenThorn','herbalThorn','highTide','impactFracture','impactQuake','livingGarden','lowTide','refluxDrain','shieldExpose','soulSigil','unstableStun','virulentPoison','virulentSpread']);
export const EFFETS_TEMPORELS=new Set(['agony','alchemyMix','alchemyPoison','atonementShield','breathOfEons','corruption','ebonMight','emberBurn','emberSpread','feralBuilder','festeringSpread','festeringStrike','frostBolt','frostNova','frostShatter','furyRecklessness','gardenPrison','gardenThorn','guardianLink','healingSeed','healingTotem','herbalThorn','highTide','huntMark','impactFracture','impactQuake','livingGarden','lowTide','maelstromTotem','prepareAim','prescienceStrike','refluxDrain','renewingMist','seedBloom','shieldExpose','soulSigil','tideStanceStrike','timeAnchor','totemHeal','totemTide','unstableStun','vanish','virulentPoison','virulentSpread']);
export const EFFETS_A_PUISSANCE=new Set(['atonementShield','breathOfEons','ebonMight','emberDetonate','guardianLink','guardianStrike','guardianWall','healingSeed','livingGarden','rapture','refluxRelease','renewingMist','rescueSanctuary','rescueShield','revival','soulMetamorphosis','totemHeal','totemTide']);

/** Cette compétence sait-elle se servir de ce type de bonus ? */
export function peutRecevoir(hero,index,type){
 const sort=hero?.skills?.[index];
 if(!sort)return false;
 if(type==='power')return(sort.power||0)>0||EFFETS_A_PUISSANCE.has(sort.effect);
 if(type==='duration')return EFFETS_TEMPORELS.has(sort.effect);
 if(type==='effectRate')return EFFETS_A_JET.has(sort.effect);
 if(type==='cooldown')return(sort.cd||0)>0;
 return false;
}

/** Valeur d'un bonus selon son type et l'étage du nœud. */
const VALEUR={power:[.06,.08,.10,.14],effectRate:[.06,.08,.10,.12],duration:[1,1,1,1],cooldown:[1,1,1,1]};
const SECOURS=['power','cooldown','duration','effectRate'];

/**
 * Ancre un bonus là où il agit. On garde l'intention de la branche — Emprise
 * parle de fiabilité, Force de puissance — mais on la porte sur une compétence
 * qui sait s'en servir. Si aucune ne le sait, on bascule sur un bonus que la
 * compétence visée peut recevoir. Un nœud ne doit jamais être décoratif.
 */
export function ancrerBonus(hero,prefere,type,etage){
 const ordre=[prefere,0,1,2].filter((valeur,i,liste)=>liste.indexOf(valeur)===i);
 const sort=ordre.find(index=>peutRecevoir(hero,index,type));
 if(sort!==undefined)return{skill:sort,[type]:VALEUR[type][etage-1]};
 const replis=SECOURS.find(autre=>peutRecevoir(hero,prefere,autre));
 if(replis)return{skill:prefere,[replis]:VALEUR[replis][etage-1]};
 const dernier=ordre.map(i=>[i,SECOURS.find(t=>peutRecevoir(hero,i,t))]).find(([,t])=>t);
 return dernier?{skill:dernier[0],[dernier[1]]:VALEUR[dernier[1]][etage-1]}:{skill:prefere,power:VALEUR.power[etage-1]};
}

/**
 * Deux bonus sur un même nœud doivent viser la même compétence : `{...a,...b}`
 * écraserait sinon le `skill` du premier, et un des deux bonus disparaîtrait
 * sans bruit.
 */
export function combiner(hero,prefere,typeA,typeB,etage){
 const a=ancrerBonus(hero,prefere,typeA,etage);
 const b=ancrerBonus(hero,a.skill,typeB,1);
 return b.skill===a.skill?{...a,...b,skill:a.skill}:a;
}

/** Le verbe suit ce que fait la compétence : frapper, soigner ou protéger. */
const verbePuissance=sort=>['enemy','allEnemies'].includes(sort?.target)?'frappe plus fort'
 :/bouclier|égide|rempart|protège|barrière/i.test(`${sort?.name} ${sort?.description}`)?'protège davantage'
 :'agit plus fort';
const MOT={duration:'dure un tour de plus',effectRate:'porte plus souvent',
 cooldown:'revient un tour plus tôt'};
/**
 * Le texte d'un nœud est dérivé du bonus réellement retenu, jamais écrit à la
 * main : c'est la seule façon d'éviter qu'un nœud annonce une chose et en fasse
 * une autre — le défaut que cet audit a justement traqué partout ailleurs.
 */
export function decrireBonus(hero,effect){
 const sort=hero?.skills?.[effect?.skill];
 const morceaux=Object.keys(effect||{})
  .filter(cle=>MOT[cle]||cle==='power')
  .map(cle=>cle==='power'?verbePuissance(sort):MOT[cle]);
 const nom=sort?.name;
 const vitesse=effect?.stats?.spd?`Vitesse +${effect.stats.spd}`:null;
 if(!morceaux.length)return vitesse||'Bonus de caractéristiques.';
 const phrase=`${nom?`« ${nom} »`:'La compétence'} ${morceaux.join(' et ')}.`;
 return vitesse?`${vitesse}, et ${phrase.charAt(0).toLowerCase()}${phrase.slice(1)}`:phrase;
}

export function empreinteTree(hero){
 if(!hero?.skills?.length)return[];
 const soutien=estSoutien(hero);
 const s0=skillIndex(hero,0),s1=skillIndex(hero,1),s2=skillIndex(hero,2);
 const noeud=(branche,etage,id,name,icon,effect)=>
  ({id:`${hero.id}:${branche}:${etage}`,key:id,heroId:hero.id,branche,etage,name,icon,effect,
    detail:decrireBonus(hero,effect)});
 return[
  // Force — amplifie l'action principale, puis l'ultime.
  noeud('force',1,'force-1','Poigne assurée','💪',{...ancrerBonus(hero,s0,'power',1)},
   'La compétence de base frappe (ou soigne) plus fort.'),
  noeud('force',2,'force-2','Second souffle','🔥',{...ancrerBonus(hero,s1,'power',2)},
   'La deuxième compétence gagne en puissance.'),
  noeud('force',3,'force-3','Frappe décisive','⚡',{...ancrerBonus(hero,s2,'power',3)},
   'L’ultime gagne en puissance.'),
  noeud('force',4,'force-4','Sommet','🏔️',{...ancrerBonus(hero,s2,'power',4)},
   'L’ultime frappe encore plus fort. Le nœud le plus cher de la branche.'),
  // Emprise — fiabilite et duree.
  noeud('emprise',1,'emprise-1','Prise ferme','🪢',{...ancrerBonus(hero,s1,'effectRate',2)},
   'Les effets de la deuxième compétence portent plus souvent.'),
  noeud('emprise',2,'emprise-2','Marque tenace','⏳',{...ancrerBonus(hero,s0,'duration',1)},
   'Ce que pose la compétence de base dure un tour de plus.'),
  noeud('emprise',3,'emprise-3','Emprise profonde','🕸️',{...ancrerBonus(hero,s2,'effectRate',4)},
   'Les effets de l’ultime portent nettement plus souvent.'),
  noeud('emprise',4,'emprise-4','Étreinte durable','🔗',combiner(hero,s1,'duration','effectRate',3),
   'La deuxième compétence dure un tour de plus et porte mieux.'),
  // Flux — tempo.
  noeud('flux',1,'flux-1','Pas léger','👣',{stats:{spd:4}},
   'Vitesse +4. Agir plus tôt vaut souvent mieux que frapper plus fort.'),
  noeud('flux',2,'flux-2','Souffle court','💨',{...ancrerBonus(hero,s1,'cooldown',2)},
   'La deuxième compétence revient un tour plus tôt.'),
  noeud('flux',3,'flux-3','Rappel','🔁',{...ancrerBonus(hero,s2,'cooldown',3)},
   'L’ultime revient un tour plus tôt.'),
  noeud('flux',4,'flux-4','Cadence','🌀',{stats:{spd:6},...ancrerBonus(hero,s0,'power',1)},
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
