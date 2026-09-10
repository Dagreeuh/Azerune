// Ressource affichee d'un champion, declaree par le champion lui-meme.
//
// Avant cette refonte, l'ecran de combat portait 24 identifiants de champion
// codes en dur et 27 variables `isNomDuChampion`, enchaines dans une chaine de
// ternaires de 6 300 caracteres, recalculee a chaque rendu et pour chaque
// unite. Ajouter un champion voulait dire editer cette chaine ; au quarantieme
// elle etait intenable.
//
// Le vrai cout n'etait pas la longueur, c'etait la separation : la ressource
// AFFICHEE vivait dans l'interface, la mecanique qui la PRODUIT vit dans le
// moteur, et rien n'obligeait les deux a dire la meme chose. La battue des
// champions a montre qu'elles divergent — c'est exactement la famille de bugs
// « annonce au joueur mais jamais applique ».
//
// Ici, chaque champion declare comment lire sa propre ressource. L'ecran ne
// fait plus que rendre ce que ce fichier renvoie, et un test verifie que tout
// champion porteur d'une mecanique a bien son entree.
//
// Contrat d'une entree :
//   classe   nom CSS specifique, ou absent pour la presentation generique
//   finale   ajoute `final-resource` (mise en avant sous la carte)
//   effet    nom d'effet de sort qui identifie aussi ce champion, quand son
//            identifiant ne suffit pas (heros derives, variantes)
//   nom      reconnaissance par nom, pour le seul cas historique (Korga)
//   lire(unit, contexte) -> {titre, detail, extra?, etat?}
//     contexte = {allies, enemies, livingEnemies}
//     etat = '' | 'active' | 'warning active' | 'danger active'

/** Cumuls les plus eleves d'un malus parmi les ennemis vivants. */
const cumulsEnnemis=(livingEnemies,cle)=>livingEnemies
  .map(enemy=>({enemy,stacks:Math.max(0,enemy.debuffs?.[cle]?.stacks||0)}))
  .filter(entry=>entry.stacks>0).sort((a,b)=>b.stacks-a.stacks)[0]||null;

const valeur=unit=>unit.mechanic?.value||0;
const pluriel=(n,mot)=>`${mot}${n>1?'s':''}`;
const actifSi=condition=>condition?'active':'';

export const RESSOURCES_CHAMPIONS={
  3:{classe:'kaelen-hunt',effet:'huntMark',lire(unit,{livingEnemies}){
    const proie=livingEnemies.find(enemy=>enemy.id===unit.mechanic?.targetId&&enemy.debuffs?.hunt?.source===unit.id);
    const tours=proie?.debuffs?.hunt?.turns||0;
    return{etat:actifSi(proie),titre:proie?'🎯 PROIE MARQUÉE':'🎯 TRAQUE',
      detail:proie?`${proie.name} · ${tours} ${pluriel(tours,'tour')}`:'Aucune proie'};}},

  7:{classe:'vaeloria-dance',effet:'bladeDanceStorm',lire(unit){
    const etapes=unit.mechanic?.danceSteps||[];
    return{etat:actifSi(valeur(unit)>0),titre:'🗡️ DANSE DES LAMES',detail:`${valeur(unit)}/3 étapes`,
      extra:(unit.skills||[]).map((skill,index)=>`${etapes.includes(index+1)?'✓':'○'} ${index+1} ${skill.name}`).join(' · ')};}},

  9:{classe:'velomoteur-power',lire(unit){
    return{etat:actifSi(valeur(unit)>=5),titre:'⚜️ PUISSANCE SACRÉE',
      detail:`${valeur(unit)}/5${valeur(unit)>=5?' · Verdict prêt':''}`};}},

  10:{classe:'dagcat-combo',lire(unit){
    return{etat:actifSi(valeur(unit)>=3),titre:'🐾 COMBO FAROUCHE',detail:`${valeur(unit)}/5`};}},

  11:{classe:'mobeen-combo',lire(unit){
    return{etat:actifSi(unit.mechanic?.active),titre:unit.mechanic?.active?'🥷 OUVERTURE PRÊTE':'🗡️ COMBO FURTIF',
      detail:`${valeur(unit)}/5`};}},

  12:{classe:'lelianna-atonement',lire(unit,{allies}){
    const lies=allies.filter(ally=>ally.buffs?.atonement?.source===unit.id);
    return{etat:actifSi(lies.length),titre:'🕊️ EXPIATIONS',
      detail:`${lies.length} ${pluriel(lies.length,'allié')} ${pluriel(lies.length,'lié')}`};}},

  13:{classe:'saylich-aim',lire(unit){
    return{etat:actifSi(unit.mechanic?.active),titre:unit.mechanic?.active?'🎯 TIR PRÊT':'🎯 VISÉE',
      detail:unit.mechanic?.active?'Critique garanti':`${valeur(unit)}/3`};}},

  17:{classe:'histeria-afflictions',effet:'rapture',lire(unit,{livingEnemies}){
    const cles=['agony','corruption','poison','burn','bleed'];
    const meilleure=livingEnemies.map(enemy=>{
      const active=cles.filter(cle=>enemy.debuffs?.[cle]);
      const agonyStacks=Math.max(0,enemy.debuffs?.agony?.stacks||0);
      const ready=active.length>=2||agonyStacks>=3;
      return{enemy,active,agonyStacks,ready,score:(ready?100:0)+active.length*10+agonyStacks};
    }).filter(entree=>entree.active.length).sort((a,b)=>b.score-a.score)[0]||null;
    return{etat:actifSi(meilleure?.ready),titre:meilleure?.ready?'🕯️ EXTASE PRÊTE':'🕯️ AFFLICTIONS',
      detail:meilleure?(meilleure.ready?`EXTASE PRÊTE · ${meilleure.enemy.name}`
        :`${meilleure.active.length} ${pluriel(meilleure.active.length,'affliction')} · ${meilleure.enemy.name}${meilleure.agonyStacks?` · Agonie ${meilleure.agonyStacks}`:''}`)
        :'Aucune affliction'};}},

  15:{classe:'hicho-totem',finale:true,lire(unit){
    return{etat:actifSi(unit.mechanic?.active),titre:'🗿 TOTEM',
      detail:unit.mechanic?.active?`${unit.mechanic.value} tour(s)`:'Inactif'};}},

  19:{classe:'sylven-seeds',finale:true,lire(unit){
    return{etat:actifSi(valeur(unit)>0),titre:'🌱 GRAINES',detail:`${valeur(unit)}/3`};}},

  21:{classe:'nerissa-reflux',finale:true,lire(unit){
    return{etat:actifSi(valeur(unit)>0),titre:'🌊 REFLUX',detail:`${valeur(unit)}/60`};}},

  23:{classe:'aurelis-aegis',finale:true,lire(unit){
    return{etat:actifSi(unit.mechanic?.active),titre:'🔷 ÉGIDE',
      detail:unit.mechanic?.active?(unit.mechanic.targetId?'Réservée':'Prête'):'Consommée'};}},

  24:{classe:'vexil-instability',finale:true,lire(unit){
    const v=valeur(unit);
    return{etat:v>=5?'danger active':v>=4?'warning active':'',
      titre:`${v>=5?'☢️':v>=4?'⚠️':'🌀'} INSTABILITÉ`,
      detail:`${v}/5 · ${v>=5?'Critique · 12 % puis retour à 3':v>=4?'Instable · 6 % au prochain sort':'Stable'}`};}},

  26:{classe:'ignovar-embers',finale:true,lire(unit,{livingEnemies}){
    return{etat:actifSi(valeur(unit)>=3),titre:'🔥 BRAISES',
      detail:`${valeur(unit)}/5 · ${livingEnemies.filter(enemy=>enemy.debuffs?.burn).length} brûlé(s)`};}},

  27:{classe:'elowen-garden',finale:true,lire(unit){
    return{etat:actifSi(unit.mechanic?.active),titre:'🌳 JARDIN',
      detail:unit.mechanic?.active?`${unit.mechanic.value} tour(s)`:'Inactif'};}},

  28:{classe:'seraphiel-condemn',finale:true,lire(unit){
    return{etat:actifSi(valeur(unit)>=3),titre:'⚖️ CONDAMNATION',detail:`${valeur(unit)}/6`};}},

  14:{classe:'brilith-arcane',lire(unit){
    return{etat:actifSi(valeur(unit)>=4),titre:'🔮 CHARGES ARCANIQUES',
      detail:`${valeur(unit)}/4${valeur(unit)>=4?' · Barrage optimal':''}`};}},

  8:{classe:'brom-impact',effet:'impactQuake',lire(unit){
    return{etat:actifSi(valeur(unit)>=3),titre:valeur(unit)>=3?'🌋 SÉISME PRÊT':'🔨 IMPACT',
      detail:`${valeur(unit)}/3`};}},

  1:{classe:'thorgar-link',effet:'guardianLink',lire(unit,{allies}){
    const lie=allies.find(ally=>ally.id===unit.mechanic?.targetId&&ally.buffs?.guardianLink?.source===unit.id);
    const tours=lie?.buffs?.guardianLink?.turns||0;
    return{etat:actifSi(lie),titre:lie?'🛡️ SERMENT ACTIF':'🛡️ LIEN RUNIQUE',
      detail:lie?`${lie.name} · ${tours} ${pluriel(tours,'tour')}`:'Aucun allié lié'};}},

  30:{classe:'caelion-anchor',effet:'timeAnchor',lire(unit,{allies}){
    const ancre=allies.find(ally=>ally.id===unit.mechanic?.targetId);
    return{etat:actifSi(unit.mechanic?.active),titre:unit.mechanic?.anchorSpent?'⏳ RETOUR PRÊT':'⏳ ANCRAGE',
      detail:ancre?`${ancre.name} · ${unit.mechanic?.anchorSpent?'Restaurable':'En attente'}`:'Aucun allié ancré'};}},

  // Korga se reconnait par son NOM depuis toujours, pas par son identifiant.
  20:{classe:'korga-fracture',nom:'Korga',effet:'shieldExecute',lire(unit,{livingEnemies}){
    const expose=livingEnemies.find(enemy=>enemy.debuffs?.exposed);
    const brise=livingEnemies.find(enemy=>enemy.shieldBroken||((enemy.maxShield||0)>0&&(enemy.shield||0)<=0));
    const cible=expose||brise;
    return{etat:actifSi(cible),titre:cible?'⚔️ EXÉCUTION PRÊTE':'💥 FRACTURE',
      detail:cible?cible.name:'Aucune cible exposée'};}},

  29:{classe:'morghast-reaction',prefixeEffet:'alchemy',lire(unit,{livingEnemies}){
    const reaction=livingEnemies.map(enemy=>{
      const poison=Boolean(enemy.debuffs?.poison),burn=Boolean(enemy.debuffs?.burn),bleed=Boolean(enemy.debuffs?.bleed);
      const count=[poison,burn,bleed].filter(Boolean).length;
      const label=count===3?'Catalyse parfaite':poison&&bleed?'Hémotoxique':poison&&burn?'Caustique':burn&&bleed?'Thermique':null;
      return label?{enemy,label,count}:null;
    }).filter(Boolean).sort((a,b)=>b.count-a.count)[0]||null;
    return{etat:actifSi(reaction),titre:'🧪 Réactions alchimiques',
      detail:reaction?`${reaction.label} · ${reaction.enemy.name}`:'Combine 2 afflictions'};}},

  22:{classe:'malvek-virulence',effet:'virulentStrike',lire(unit,{livingEnemies}){
    const cumuls=cumulsEnnemis(livingEnemies,'virulence');
    return{etat:actifSi((cumuls?.stacks||0)>=3),titre:'☠️ Virulence sur la cible',
      detail:cumuls?`${cumuls.stacks} ${pluriel(cumuls.stacks,'cumul')} · ${cumuls.enemy.name}`:'Aucune cible infectée'};}},

  33:{classe:'sivrane-frost',effet:'frostShatter',lire(unit,{livingEnemies}){
    const cumuls=cumulsEnnemis(livingEnemies,'frost');
    return{etat:actifSi((cumuls?.stacks||0)>=3),titre:'❄️ Givre sur la cible',
      detail:cumuls?`${cumuls.stacks}/5 · ${cumuls.enemy.name}${cumuls.stacks>=3?' · BRISURE PRÊTE':''}`:'Aucune cible givrée'};}},
};

// L'ordre de reconnaissance reproduit celui de l'ancienne chaine de ternaires :
// un heros derive peut porter deux effets reconnaissables, et c'est le premier
// qui gagnait. Le changer changerait silencieusement un affichage.
export const ORDRE_RECONNAISSANCE=[3,7,9,10,11,12,13,17,15,19,21,23,24,26,27,28,14,8,1,30,20,29,22,33];

/** Le descripteur qui decrit cette unite, ou null s'il n'y en a pas. */
export function descripteurDeRessource(unit){
  if(!unit)return null;
  const effets=(unit.skills||[]).map(skill=>String(skill?.effect||''));
  for(const id of ORDRE_RECONNAISSANCE){
    const entree=RESSOURCES_CHAMPIONS[id];
    if(!entree)continue;
    const parId=unit.id===id;
    const parNom=Boolean(entree.nom)&&unit.name===entree.nom;
    const parEffet=Boolean(entree.effet)&&effets.includes(entree.effet);
    const parPrefixe=Boolean(entree.prefixeEffet)&&effets.some(effet=>effet.startsWith(entree.prefixeEffet));
    if(parId||parNom||parEffet||parPrefixe)return{id,...entree};
  }
  return null;
}

/**
 * Ressource a afficher, prete a rendre — ou null quand le champion n'en a pas.
 *
 * `identite` est le repli generique (`championIdentity`) : il est passe en
 * argument plutot qu'importe, pour que ce module reste une donnee pure et
 * testable sans tirer la moitie du jeu derriere lui.
 */
export function ressourceAffichee(unit,contexte={},identite=null){
  if(!unit)return null;
  const enemies=contexte.enemies||[];
  const allies=contexte.allies||[];
  const livingEnemies=enemies.filter(enemy=>!enemy.dead);
  const descripteur=descripteurDeRessource(unit);
  if(descripteur){
    const lu=descripteur.lire(unit,{allies,enemies,livingEnemies})||{};
    return{classe:descripteur.classe||'',finale:Boolean(descripteur.finale),
      etat:lu.etat||'',titre:lu.titre||'',detail:lu.detail??'',extra:lu.extra};
  }
  // Repli generique : le champion n'a pas de presentation propre. « Aucune »
  // veut dire qu'il n'a volontairement pas de ressource a montrer.
  if(!identite||identite.resource==='Aucune')return null;
  const mode=unit.mechanic?.mode;
  return{classe:'',finale:false,etat:actifSi(unit.mechanic?.active),
    titre:`${identite.icon} ${identite.resource}`,
    detail:mode?(mode==='high'?'MARÉE HAUTE':'MARÉE BASSE')
      :`${valeur(unit)}${unit.mechanic?.max?`/${unit.mechanic.max}`:''}`};
}

/** Classe CSS complete, reproduisant exactement l'ancien gabarit. */
export const classeRessource=ressource=>
  `${['champion-resource',ressource.finale&&'final-resource',ressource.classe].filter(Boolean).join(' ')} ${ressource.etat}`;
