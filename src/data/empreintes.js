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

import{clesDuChampion,cleNodeId}from'./clesDeVoute';

/**
 * Coût d'une clé de voûte, et Résonance qui l'ouvre.
 *
 * Le coût baisse d'un point à la Résonance maximale. Ce n'est pas un détail de
 * reglage : c'est ce qui rend l'arbitrage symetrique. A six points pour six
 * noeuds de socle, prendre tout le socle ou prendre une cle depensent
 * exactement le meme budget — aucune des deux voies ne gaspille un point. Une
 * version precedente donnait sept points : le socle complet en laissait un
 * inutilise, et la cle devenait de fait obligatoire.
 */
export const COUT_CLE=2;
export const COUT_CLE_MAITRISE=1;
export const RESONANCE_CLE=3;
export const RESONANCE_MAITRISE=5;
export const coutDeCle=(progress={})=>
 (Math.max(0,Math.min(5,Number(progress.resonance)||0))>=RESONANCE_MAITRISE?COUT_CLE_MAITRISE:COUT_CLE);

export const BRANCHES=[
 {id:'force',name:'Force',icon:'⚔️',summary:'Amplifie ce que le champion fait déjà : dégâts, soins ou boucliers.'},
 {id:'emprise',name:'Emprise',icon:'🕸️',summary:'Fiabilité et durée des effets — marques, malus, régénérations.'},
 {id:'flux',name:'Flux',icon:'🌀',summary:'Vitesse, temps de recharge, tempo.'}
];
// Deux etages, pas quatre. L'arbre en demandait douze noeuds distincts a des
// champions qui n'offrent que 4 a 11 ancrages (mediane 7) : Caelion, avec
// quatre, portait sept doublons. Il n'avait pas ete dimensionne d'apres ce que
// les champions savent recevoir.
export const ETAGES=2;
/** Resonance exigee pour ouvrir chaque etage. L'etage I est toujours ouvert. */
export const ETAGE_RESONANCE=[0,1];
/** Points offerts par les paliers de Resonance pairs. */
// La Resonance 5 n'apportait AUCUN point : 6 a R4 comme a R5, elle n'ouvrait
// qu'un etage. Le sommet de la progression doit se sentir.
// Echelle de Resonance, ou chaque palier fait quelque chose, et quelque chose
// de DIFFERENT :
//   R1 ouvre l'etage II · R2 +1 point · R3 ouvre la cle de voute
//   R4 +1 point · R5 la cle coute un point de moins
// Au sommet : six points pour six noeuds de socle. Tout prendre est
// impossible, mais les deux voies coutent exactement le meme budget.
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
export const EFFETS_TEMPORELS=new Set(['aegisStrike','agony','alchemyMix','alchemyPoison','atonementPenance','atonementShield','breathOfEons','corruption','ebonMight','emberBurn','emberSpread','feralBuilder','festeringSpread','festeringStrike','frostBolt','frostNova','frostShatter','furyRecklessness','gardenPrison','gardenThorn','guardianLink','guardianWall','healingSeed','healingTotem','herbalThorn','highTide','huntMark','impactFracture','impactQuake','livingGarden','lowTide','maelstromTotem','prepareAim','prescienceStrike','refluxDrain','renewingMist','rescueSanctuary','rescueShield','seedBloom','shieldExpose','soulMetamorphosis','soulSigil','tideStanceStrike','timeAnchor','totemHeal','totemTide','unstableStun','vanish','virulentPoison','virulentSpread']);
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
// Deux etages au lieu de quatre : chaque noeud pese davantage, pour que
// l'arbre entier reste du meme ordre qu'avant la refonte.
const VALEUR={power:[.12,.22],effectRate:[.10,.14],duration:[1,1],cooldown:[1,1]};
const SECOURS=['power','cooldown','duration','effectRate'];

/**
 * Ancre un bonus là où il agit. On garde l'intention de la branche — Emprise
 * parle de fiabilité, Force de puissance — mais on la porte sur une compétence
 * qui sait s'en servir. Si aucune ne le sait, on bascule sur un bonus que la
 * compétence visée peut recevoir. Un nœud ne doit jamais être décoratif.
 */
export function ancrerBonus(hero,prefere,type,etage,pris=null){
 const libre=(skill,cle)=>!pris||!pris.has(`${skill}:${cle}`);
 const ordre=[prefere,0,1,2].filter((valeur,i,liste)=>liste.indexOf(valeur)===i);
 // On vise d'abord un ancrage qui tienne la promesse ET qui ne double pas un
 // noeud deja pose : deux noeuds identiques dans un meme arbre, c'est un choix
 // qui n'en est pas un.
 const exact=ordre.find(index=>peutRecevoir(hero,index,type)&&libre(index,type));
 if(exact!==undefined)return{skill:exact,[type]:VALEUR[type][etage-1]};
 const sort=ordre.find(index=>peutRecevoir(hero,index,type));
 if(sort!==undefined&&!pris)return{skill:sort,[type]:VALEUR[type][etage-1]};
 // Le repli cherche lui aussi un couple (compétence, bonus) encore libre.
 const replisLibre=ordre.flatMap(i=>SECOURS.map(t=>[i,t]))
  .find(([i,t])=>peutRecevoir(hero,i,t)&&libre(i,t));
 if(replisLibre)return{skill:replisLibre[0],[replisLibre[1]]:VALEUR[replisLibre[1]][etage-1]};
 if(sort!==undefined)return{skill:sort,[type]:VALEUR[type][etage-1]};
 const replis=SECOURS.find(autre=>peutRecevoir(hero,prefere,autre));
 if(replis)return{skill:prefere,[replis]:VALEUR[replis][etage-1]};
 const dernier=ordre.map(i=>[i,SECOURS.find(t=>peutRecevoir(hero,i,t))]).find(([,t])=>t);
 return dernier?{skill:dernier[0],[dernier[1]]:VALEUR[dernier[1]][etage-1]}:{skill:prefere,power:VALEUR.power[etage-1]};
}

/** Couples (compétence, bonus) portés par un effet, pour éviter les doublons. */
export const couplesDe=effect=>Object.keys(effect||{})
 .filter(cle=>cle!=='skill'&&cle!=='stats')
 .map(cle=>`${effect.skill}:${cle}`);

/**
 * Deux bonus sur un même nœud doivent viser la même compétence : `{...a,...b}`
 * écraserait sinon le `skill` du premier, et un des deux bonus disparaîtrait
 * sans bruit.
 */
export function combiner(hero,prefere,typeA,typeB,etage,pris=null){
 const a=ancrerBonus(hero,prefere,typeA,etage,pris);
 const b=ancrerBonus(hero,a.skill,typeB,1,pris);
 return b.skill===a.skill?{...a,...b,skill:a.skill}:a;
}

/** Le verbe suit ce que fait la compétence : frapper, soigner ou protéger. */
const verbePuissance=sort=>['enemy','allEnemies'].includes(sort?.target)?'frappe plus fort'
 :/bouclier|égide|rempart|protège|barrière/i.test(`${sort?.name} ${sort?.description}`)?'protège davantage'
 :'agit plus fort';
const MOT={duration:'dure un tour de plus',effectRate:'porte plus souvent',
 cooldown:'revient un tour plus tôt'};
/**
 * Nom et icone d'un noeud, derives du bonus REELLEMENT retenu.
 *
 * Les noeuds portaient un nom fixe — « Prise ferme », « Marque tenace » — pose
 * a l'avance par la branche. Mesure avant refonte : 46 noeuds sur 384
 * n'accordaient pas ce que leur branche annoncait, parce que 17 champions sur
 * 32 n'ont aucun effet a jet et que leur branche Emprise retombait sur de la
 * puissance. Un nom fixe ne pouvait donc que mentir. Le nom suit desormais le
 * bonus, comme le texte le fait deja.
 */
const LIBELLE={power:'Puissance',duration:'Emprise',effectRate:'Fiabilité',cooldown:'Cadence'};
const ICONE={power:'⚔️',duration:'⏳',effectRate:'🎯',cooldown:'🌀',stats:'👣'};
export function nommerBonus(hero,effect){
 const types=Object.keys(effect||{}).filter(cle=>LIBELLE[cle]);
 const sort=hero?.skills?.[effect?.skill];
 const vitesse=effect?.stats?.spd?`Vitesse +${effect.stats.spd}`:null;
 if(!types.length)return{nom:vitesse||'Empreinte',icone:ICONE.stats};
 const titre=`${types.map(cle=>LIBELLE[cle]).join(' et ')}${sort?.name?` · ${sort.name}`:''}`;
 return{nom:vitesse?`${vitesse} · ${titre}`:titre,icone:ICONE[types[0]]};
}
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
 // `name` et `icon` passes ici ne servent plus que de repli : le nom affiche
 // est derive du bonus retenu, pour qu'un noeud ne puisse plus annoncer une
 // chose et en faire une autre.
 // Registre des couples (compétence, bonus) deja poses dans CET arbre.
 const pris=new Set();
 const ancrer=(prefere,type,etage)=>ancrerBonus(hero,prefere,type,etage,pris);
 const noeud=(branche,etage,id,name,icon,effect)=>{
  couplesDe(effect).forEach(couple=>pris.add(couple));
  const {nom,icone}=nommerBonus(hero,effect);
  return{id:`${hero.id}:${branche}:${etage}`,key:id,heroId:hero.id,branche,etage,
   name:nom,icon:icone,nomGenerique:name,effect,detail:decrireBonus(hero,effect)};
 };
 return[
  // Force — amplifier ce que le champion fait deja.
  noeud('force',1,'force-1','Poigne assurée','💪',{...ancrer(s0,'power',1)}),
  noeud('force',2,'force-2','Frappe décisive','⚡',{...ancrer(s2,'power',2)}),
  // Emprise — fiabilite et duree. Pour les champions qui n'ont ni jet ni
  // effet temporel, l'ancrage bascule sur un couple encore libre : le NOM
  // suit alors le bonus reellement retenu, il ne promet plus l'Emprise.
  noeud('emprise',1,'emprise-1','Prise ferme','🪢',{...ancrer(s1,'effectRate',1)}),
  noeud('emprise',2,'emprise-2','Étreinte durable','🔗',combiner(hero,s1,'duration','effectRate',2,pris)),
  // Flux — tempo. Le premier noeud ne demande aucun ancrage : c'est lui qui
  // garantit un arbre sans doublon aux champions les plus pauvres en ancres.
  noeud('flux',1,'flux-1','Pas léger','👣',{stats:{spd:5}}),
  noeud('flux',2,'flux-2','Rappel','🔁',{...ancrer(s2,'cooldown',2)})
 ];
}

/** Un nœud est-il atteignable, au vu des points et de la Resonance ? */
export function empreinteStatus(hero,progress={},lit=[]){
 const arbre=empreinteTree(hero),points=empreintePoints(progress),profondeur=empreinteDepth(progress);
 const resonance=Math.max(0,Math.min(5,Number(progress.resonance)||0));
 const allumes=new Set((lit||[]).filter(id=>arbre.some(noeud=>noeud.id===id)));
 const cles=clesDuChampion(hero?.id);
 const cleActive=cles.find(cle=>(lit||[]).includes(cleNodeId(hero.id,cle.id)))||null;
 // Une cle coute deux points : c'est ce qui rend le choix reel. Avec six
 // points au sommet et six noeuds de socle, on ne peut pas tout prendre.
 const cout=coutDeCle(progress);
 const depenses=allumes.size+(cleActive?cout:0);
 const restants=Math.max(0,points-depenses);
 const cleOuverte=resonance>=RESONANCE_CLE;
 return{
  arbre,points,profondeur,depenses,restants,
  cleOuverte,resonanceCle:RESONANCE_CLE,coutCle:cout,cleActive,
  noeuds:arbre.map(noeud=>{
   const allume=allumes.has(noeud.id);
   const etageOuvert=noeud.etage<=profondeur;
   // Un etage ne s'ouvre qu'apres le precedent : on ne saute pas les paliers.
   const precedent=noeud.etage===1||allumes.has(`${hero.id}:${noeud.branche}:${noeud.etage-1}`);
   return{...noeud,allume,etageOuvert,precedent,
    disponible:!allume&&etageOuvert&&precedent&&restants>0};
  }),
  cles:cles.map(cle=>{
   const id=cleNodeId(hero.id,cle.id);
   const allumee=cleActive?.id===cle.id;
   // Exclusivite : une seule cle, jamais deux. C'est la decision du systeme.
   const exclue=Boolean(cleActive)&&!allumee;
   return{...cle,noeudId:id,allumee,exclue,ouverte:cleOuverte,
    disponible:!allumee&&!exclue&&cleOuverte&&restants>=cout};
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
