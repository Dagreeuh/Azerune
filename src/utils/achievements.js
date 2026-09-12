// Reclamation d'un haut fait.
//
// Regle pure extraite de GameProvider : elle dit si la recompense est due et
// laquelle. GameContext garde les setState et la generation des pieces.

import{ACHIEVEMENTS,achievementReady}from'../data/achievements';

/** Retrouve un haut fait par identifiant. */
export const findAchievement=id=>ACHIEVEMENTS.find(item=>item.id===id)||null;

/**
 * La recompense d'un haut fait peut-elle etre encaissee ?
 * `state` est l'etat de jeu complet, tel que lu par achievementReady.
 */
export function canClaimAchievement(id,state,claims={}){
  const achievement=findAchievement(id);
  if(!achievement)return{ok:false,message:'Haut fait introuvable.'};
  if(claims?.[id])return{ok:false,message:'Récompense déjà réclamée.'};
  if(!achievementReady(achievement,state||{}))
    return{ok:false,message:'Objectif non terminé.'};
  return{ok:true,achievement,reward:achievement.reward||{}};
}

/** Pieces d'equipement a generer pour une recompense donnee. */
export const achievementGearConfigs=(reward={})=>
  [...(reward.gear?[reward.gear]:[]),...(reward.gearPack||[])];
