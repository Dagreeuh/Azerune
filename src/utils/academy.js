// Academie : progression des lecons et reclamation des recompenses.
//
// Regles pures extraites de GameProvider. Elles disent si une recompense est
// due ; GameContext garde les setState et le verrou anti-double-clic.

import{ACADEMY_TUTORIALS,ACADEMY_REWARD,ACADEMY_FINAL_REWARD}from'../data/tutorials';

/** La lecon existe-t-elle ? */
export const academyLessonExists=id=>ACADEMY_TUTORIALS.some(lecon=>lecon.id===id);

/** Une lecon terminee peut-elle etre encaissee ? */
export function canClaimAcademyLesson(id,progress={}){
  if(!academyLessonExists(id))return{ok:false,message:'Leçon inconnue.'};
  if(!progress.completed?.[id])return{ok:false,message:'Termine d’abord cette leçon.'};
  if(progress.claimed?.[id])return{ok:false,message:'Récompense déjà récupérée.'};
  return{ok:true,gems:ACADEMY_REWARD};
}

/** Toutes les lecons sont-elles terminees ? */
export const academyComplete=(progress={})=>
  ACADEMY_TUTORIALS.every(lecon=>Boolean(progress.completed?.[lecon.id]));

/** La recompense finale peut-elle etre encaissee ? */
export function canClaimAcademyFinal(progress={}){
  if(!academyComplete(progress))
    return{ok:false,message:`Termine les ${ACADEMY_TUTORIALS.length} leçons.`};
  if(progress.finalClaimed)return{ok:false,message:'Récompense finale déjà récupérée.'};
  return{ok:true,...ACADEMY_FINAL_REWARD};
}

/** Etat d'avancement, pour l'affichage. */
export function academySummary(progress={}){
  const total=ACADEMY_TUTORIALS.length;
  const completed=ACADEMY_TUTORIALS.filter(l=>progress.completed?.[l.id]).length;
  const claimed=ACADEMY_TUTORIALS.filter(l=>progress.claimed?.[l.id]).length;
  return{
    total,completed,claimed,
    pendingGems:(completed-claimed)*ACADEMY_REWARD,
    complete:completed>=total,
    finalReady:completed>=total&&!progress.finalClaimed,
    finalClaimed:Boolean(progress.finalClaimed)
  };
}
