// Le Sablier d'Azerune — pression temporelle du Mythic+.
//
// Un budget de tours partage par les quatre vagues. Le depasser ne fait pas
// perdre : il declenche l'Effondrement, une montee progressive de l'Attaque
// ennemie qui rend la mort inevitable si l'ecart de puissance est reel.
//
// Un joueur correctement equipe termine sous le budget et ne voit jamais la
// mecanique.

import{MYTHIC_DEFAULT_BUDGET,MYTHIC_COLLAPSE_RATE,mythicPerfectTurns}from'../data/mythic';

const nombre=(valeur,repli=0)=>{const n=Number(valeur);return Number.isFinite(n)?n:repli};

/**
 * Etat initial du Sablier. Le budget vient de la mission : il depend du
 * contenu reel du niveau, pas d'une constante globale.
 */
export function createMythicState(budget){
  const demande=nombre(budget,MYTHIC_DEFAULT_BUDGET);
  return{turns:0,budget:demande>0?demande:MYTHIC_DEFAULT_BUDGET,rate:MYTHIC_COLLAPSE_RATE};
}

/** Tours restants avant l'Effondrement. Zero une fois le sablier vide. */
export const mythicSandLeft=state=>
  Math.max(0,nombre(state?.budget,MYTHIC_DEFAULT_BUDGET)-nombre(state?.turns));

/** Nombre de tours joues au-dela du budget. */
export const mythicOvertime=state=>
  Math.max(0,nombre(state?.turns)-nombre(state?.budget,MYTHIC_DEFAULT_BUDGET));

/** L'Effondrement a-t-il commence ? */
export const mythicCollapsed=state=>mythicOvertime(state)>0;

/**
 * Multiplicateur applique a l'Attaque ennemie.
 * Vaut 1 tant que le budget tient, puis croit de `rate` par tour depasse.
 */
export function mythicCollapseFactor(state){
  if(!state)return 1;
  const depasse=mythicOvertime(state);
  if(!depasse)return 1;
  return 1+Math.max(0,nombre(state.rate,MYTHIC_COLLAPSE_RATE))*depasse;
}

/** Avance le Sablier d'un tour. Fonction pure. */
export const advanceMythicClock=state=>
  state?{...state,turns:nombre(state.turns)+1}:state;

/**
 * Les trois paliers de fin de course. Le facteur multiplie le butin de la
 * premiere validation du niveau — voir GameContext.finishMythicMission.
 */
export const MYTHIC_TIERS={
  perfect:{key:'perfect',label:'Sablier parfait',icon:'\u231b',rewardFactor:1.25},
  held:{key:'held',label:'Sablier tenu',icon:'\u23f3',rewardFactor:1},
  collapsed:{key:'collapsed',label:'Effondrement',icon:'\ud83d\udca5',rewardFactor:.6}
};

/**
 * Palier de fin de course, d'apres les tours consommes.
 * Le seuil « parfait » ne peut jamais depasser le budget lui-meme, afin de
 * rester coherent si un budget reduit est utilise un jour.
 */
export function mythicRunTier(state){
  const turns=nombre(state?.turns),
    budget=nombre(state?.budget,MYTHIC_DEFAULT_BUDGET),
    seuilParfait=Math.min(mythicPerfectTurns(budget),budget),
    palier=turns<=seuilParfait?MYTHIC_TIERS.perfect:turns<=budget?MYTHIC_TIERS.held:MYTHIC_TIERS.collapsed;
  return{...palier,turns,budget};
}

/**
 * Applique le palier de Sablier au butin d'un niveau Mythic+.
 * Seules les ressources chiffrees sont mises a l'echelle ; le reste du butin
 * (equipement, relique) reste binaire. Un gain non nul ne tombe jamais a zero :
 * une course validee rapporte toujours quelque chose.
 */
export function scaleMythicReward(reward,tier){
  const facteur=Math.max(0,nombre(tier?.rewardFactor,1)),
    dose=valeur=>{const v=nombre(valeur);return v>0?Math.max(1,Math.round(v*facteur)):0};
  return{
    ...(reward||{}),
    gold:dose(reward?.gold),gems:dose(reward?.gems),stones:dose(reward?.stones),
    essence:dose(reward?.essence),tomes:dose(reward?.tomes),souls:dose(reward?.souls)
  };
}
