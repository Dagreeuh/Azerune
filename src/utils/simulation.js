import{createBattle,nextTurn,enemyAction,winner,performAutoAction}from'../battle/engine';

/**
 * Estimation des chances de victoire, par simulation du vrai combat.
 *
 * La « puissance recommandée » se trompait de -21 % à +43 %, alors que 4 % de
 * puissance séparent la défaite certaine de la victoire certaine : au point
 * exact du pile ou face, le jeu annonçait selon la mission « Insuffisant » ou
 * « Confortable ». Le moteur, lui, sait jouer le combat en quelques
 * millisecondes. On arrête donc d'estimer : on joue.
 *
 * Détail : Audit/RAPPORT-EXPERIENCE-JOUEUR.md
 */
export const TIRAGES_PAR_DEFAUT=20;
/** Garde-fou : un combat qui n'aboutit pas ne doit pas figer l'interface. */
export const ACTIONS_MAX=600;

/**
 * Options de combat d'une mission. Partagées par le combat réel et par la
 * simulation : c'est ce qui garantit qu'on simule bien ce qu'on va jouer.
 */
export const optionsDeCombat=mission=>({
  enemies:mission?mission.enemies:undefined,
  enemyScale:mission?.scale||1,
  raid:mission?.raid?{...mission.raidData,level:mission.raidLevel}:null,
  mythic:mission?.mythic?{level:mission.mythicLevel,season:mission.mythicSeason,turnBudget:mission.turnBudget}:null,
  waves:mission?.waves,
  affixIds:mission?.affixIds,
  regle:mission?.regle||null
});

/** Joue un combat entier en mode automatique. */
function derouler(depart,priorites){
  let combat=depart,actions=0;
  for(let garde=0;garde<ACTIONS_MAX&&!combat.winner;garde+=1){
    if(!combat.turn){combat=nextTurn(combat);continue}
    if(String(combat.turn).startsWith('e')){actions+=1;combat=enemyAction(combat);continue}
    const sortie=performAutoAction(combat,priorites);
    actions+=1;
    combat=sortie&&sortie.battle?sortie.battle:combat;
    combat={...combat,winner:winner(combat.allies,combat.enemies)};
  }
  return{gagne:combat.winner==='ally',aboutit:Boolean(combat.winner),actions,
    survivants:combat.allies.filter(unit=>!unit.dead).length};
}

/**
 * Simule `tirages` fois la mission avec l'équipe donnée.
 * Renvoie ce qu'on peut annoncer honnêtement au joueur.
 */
export function simulerMission({mission,team,heroes,getStats,priorites={},tirages=TIRAGES_PAR_DEFAUT}){
  const demande=Math.floor(Number(tirages));
  const nombre=Number.isFinite(demande)&&demande>0?demande:TIRAGES_PAR_DEFAUT;
  if(!mission||!Array.isArray(team)||!team.length)return null;
  const options=optionsDeCombat(mission);
  let victoires=0,aboutis=0,actionsTotales=0,survivantsTotal=0;
  for(let i=0;i<nombre;i+=1){
    const resultat=derouler(createBattle(team,heroes,getStats,options),priorites);
    if(resultat.gagne)victoires+=1;
    if(resultat.aboutit)aboutis+=1;
    actionsTotales+=resultat.actions;
    if(resultat.gagne)survivantsTotal+=resultat.survivants;
  }
  return{
    tirages:nombre,victoires,aboutis,
    taux:victoires/nombre,
    actionsMoyennes:Math.round(actionsTotales/nombre),
    survivantsMoyens:victoires?survivantsTotal/victoires:0
  };
}

/** Une phrase honnête, sans note ni couleur trompeuse. */
export function verdictSimule(resultat){
  if(!resultat)return null;
  const{victoires,tirages,taux}=resultat;
  const cle=taux>=.95?'sur':taux>=.7?'favorable':taux>=.4?'serre':taux>0?'defavorable':'perdu';
  const phrase={
    sur:`Tu gagnes ${victoires} fois sur ${tirages}.`,
    favorable:`Tu gagnes ${victoires} fois sur ${tirages}.`,
    serre:`Combat serré : ${victoires} victoires sur ${tirages}.`,
    defavorable:`Tu ne gagnes que ${victoires} fois sur ${tirages}.`,
    perdu:`Aucune victoire sur ${tirages} essais.`
  }[cle];
  const icone={sur:'🟢',favorable:'🔵',serre:'🟡',defavorable:'🟠',perdu:'🔴'}[cle];
  return{cle,icone,phrase};
}
