// Progression et validation des quetes.
//
// Ces regles etaient des closures de GameProvider, melees aux setState. Elles
// sont ici pures : elles calculent l'avancement et disent si une recompense est
// due, sans rien ecrire. GameContext garde les effets de bord.

import{QUEST_PERIOD_CONFIG}from'../data/quests';

const nombre=valeur=>{const n=Number(valeur);return Number.isFinite(n)?n:0};

/**
 * Anciens noms d'evenements encore tolerés.
 *
 * Les competences emettaient `skills` alors que les quetes attendaient
 * `skillUsed` (voir HOTFIX-QUETES-VALIDATION). Plus aucun appelant n'utilise
 * l'ancien nom, mais la tolerance est conservee : elle ne coute rien et protege
 * une sauvegarde ou un appel oublie.
 */
export const QUEST_EVENT_ALIASES={skills:'skillUsed'};

export const normalizeQuestEvent=event=>QUEST_EVENT_ALIASES[event]||event;

/** Une quete est-elle terminee au vu de l'avancement courant ? */
export const questCompleted=(quest,progress={})=>
  nombre(progress[quest?.id])>=nombre(quest?.goal);

/**
 * Avancement apres un evenement, pour un groupe de quetes.
 *
 * Trois comportements coexistent :
 *  - par defaut, on incremente jusqu'au but ;
 *  - `mode:'uniqueHeroes'` compte des champions DISTINCTS ayant atteint un
 *    seuil, et memorise leurs identifiants sous `<id>:heroes` ;
 *  - `threshold` sans ce mode filtre : l'evenement ne compte que si
 *    `payload.value` atteint le seuil.
 *
 * Renvoie toujours un nouvel objet ; l'entree n'est jamais modifiee.
 */
export function advanceQuestProgress(quests,progress,event,amount=1,payload={}){
  const cible=normalizeQuestEvent(event);
  const suivant={...(progress||{})};
  const gain=nombre(amount);
  (quests||[]).filter(quest=>quest?.event===cible).forEach(quest=>{
    if(quest.mode==='uniqueHeroes'){
      const cle=`${quest.id}:heroes`;
      const ids=new Set(Array.isArray(suivant[cle])?suivant[cle]:[]);
      if(payload.championId!=null&&nombre(payload.value)>=nombre(quest.threshold))
        ids.add(String(payload.championId));
      suivant[cle]=[...ids];
      suivant[quest.id]=Math.min(nombre(quest.goal),ids.size);
      return;
    }
    if(quest.threshold&&nombre(payload.value)<nombre(quest.threshold))return;
    suivant[quest.id]=Math.min(nombre(quest.goal),nombre(suivant[quest.id])+gain);
  });
  return suivant;
}

/** Nombre de quetes du groupe dont la recompense a ete reclamee. */
export const claimedQuestCount=(quests,claimed={})=>
  (quests||[]).filter(quest=>claimed?.[quest?.id]).length;

/** Nombre de quetes a reclamer pour ouvrir le coffre de la periode. */
export function chestRequirement(period,quests){
  const annonce=QUEST_PERIOD_CONFIG?.[period]?.requiredForChest;
  return annonce||(quests||[]).length;
}

/**
 * Une quete peut-elle etre reclamee ?
 * `state` porte `progress` et `claimed` de la periode.
 */
export function canClaimQuest(quest,state){
  if(!quest||!state)return false;
  if(state.claimed?.[quest.id])return false;
  return questCompleted(quest,state.progress||{});
}

/** Le coffre de fin de periode peut-il etre ouvert ? */
export function canClaimChest(period,quests,state){
  if(!quests||!state||state.bonus)return false;
  return claimedQuestCount(quests,state.claimed)>=chestRequirement(period,quests);
}

/** Avancement d'un coffre, pour l'affichage. */
export function chestProgress(period,quests,state={}){
  const required=chestRequirement(period,quests);
  const claimed=claimedQuestCount(quests,state.claimed);
  return{claimed,required,ready:claimed>=required&&!state.bonus,opened:Boolean(state.bonus)};
}
