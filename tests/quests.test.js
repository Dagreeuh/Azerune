// Progression et validation des quetes.
//
// Ces regles vivaient dans des closures de GameProvider. Elles decident quand
// une quete avance, quand sa recompense est due, et quand le coffre de fin de
// periode s'ouvre.
import{describe,it,expect}from'vitest';
import{QUEST_EVENT_ALIASES,normalizeQuestEvent,questCompleted,advanceQuestProgress,
        claimedQuestCount,chestRequirement,canClaimQuest,canClaimChest,chestProgress}
  from'../src/utils/quests';
import{QUESTS,WEEKLY_QUESTS,MONTHLY_QUESTS,QUEST_GROUPS,QUEST_PERIOD_CONFIG}
  from'../src/data/quests';

const quete=(patch={})=>({id:'q1',event:'battleCompleted',goal:3,...patch});

describe('noms d evenements',()=>{
  it('traduit l ancien nom des competences',()=>{
    expect(QUEST_EVENT_ALIASES.skills).toBe('skillUsed');
    expect(normalizeQuestEvent('skills')).toBe('skillUsed');
  });

  it('laisse passer tout autre nom',()=>{
    expect(normalizeQuestEvent('battleCompleted')).toBe('battleCompleted');
    expect(normalizeQuestEvent('inconnu')).toBe('inconnu');
  });
});

describe('advanceQuestProgress',()=>{
  const quetes=[quete({id:'combats',event:'battleCompleted',goal:3}),
                quete({id:'boss',event:'bossDefeated',goal:2})];

  it('fait progresser les quetes qui ecoutent l evenement',()=>{
    expect(advanceQuestProgress(quetes,{},'battleCompleted',1)).toEqual({combats:1});
  });

  it('laisse les autres quetes intactes',()=>{
    const apres=advanceQuestProgress(quetes,{combats:1,boss:1},'bossDefeated',1);
    expect(apres.combats).toBe(1);
    expect(apres.boss).toBe(2);
  });

  it('respecte le montant de l evenement',()=>{
    expect(advanceQuestProgress(quetes,{},'battleCompleted',2).combats).toBe(2);
  });

  it('plafonne au but de la quete',()=>{
    expect(advanceQuestProgress(quetes,{},'battleCompleted',99).combats).toBe(3);
    expect(advanceQuestProgress(quetes,{combats:3},'battleCompleted',5).combats).toBe(3);
  });

  it('ne modifie jamais l avancement recu',()=>{
    const avant={combats:1};
    const copie={...avant};
    advanceQuestProgress(quetes,avant,'battleCompleted',1);
    expect(avant).toEqual(copie);
  });

  it('accepte l ancien nom d evenement',()=>{
    const avecCompetences=[quete({id:'sorts',event:'skillUsed',goal:6})];
    expect(advanceQuestProgress(avecCompetences,{},'skills',4).sorts).toBe(4);
  });

  it('ne bouge pas sur un evenement qu aucune quete n ecoute',()=>{
    expect(advanceQuestProgress(quetes,{combats:1},'inconnu',5)).toEqual({combats:1});
  });

  it('tolere une liste de quetes ou un avancement absents',()=>{
    expect(advanceQuestProgress(null,null,'battleCompleted',1)).toEqual({});
    expect(advanceQuestProgress(quetes,undefined,'battleCompleted',1).combats).toBe(1);
  });

  it('traite un montant invalide comme zero',()=>{
    expect(advanceQuestProgress(quetes,{},'battleCompleted','abc').combats).toBe(0);
  });
});

describe('advanceQuestProgress — seuil de valeur',()=>{
  const quetes=[quete({id:'mythic30',event:'mythicLevelReached',goal:1,threshold:30})];

  it('ignore un evenement sous le seuil',()=>{
    expect(advanceQuestProgress(quetes,{},'mythicLevelReached',1,{value:29})).toEqual({});
  });

  it('compte un evenement qui atteint le seuil',()=>{
    expect(advanceQuestProgress(quetes,{},'mythicLevelReached',1,{value:30}).mythic30).toBe(1);
  });

  it('compte un evenement au-dela du seuil',()=>{
    expect(advanceQuestProgress(quetes,{},'mythicLevelReached',1,{value:45}).mythic30).toBe(1);
  });

  it('ignore un evenement sans valeur',()=>{
    expect(advanceQuestProgress(quetes,{},'mythicLevelReached',1,{})).toEqual({});
  });
});

describe('advanceQuestProgress — champions distincts',()=>{
  const quetes=[quete({id:'niveau40',event:'heroLevelReached',goal:3,
    mode:'uniqueHeroes',threshold:40})];
  const monte=(progress,championId,value)=>
    advanceQuestProgress(quetes,progress,'heroLevelReached',1,{championId,value});

  it('compte un champion qui atteint le seuil',()=>{
    const apres=monte({},7,40);
    expect(apres.niveau40).toBe(1);
    expect(apres['niveau40:heroes']).toEqual(['7']);
  });

  it('ne compte pas deux fois le meme champion',()=>{
    let etat=monte({},7,40);
    etat=monte(etat,7,55);
    expect(etat.niveau40).toBe(1);
    expect(etat['niveau40:heroes']).toEqual(['7']);
  });

  it('compte des champions differents',()=>{
    let etat=monte({},7,40);
    etat=monte(etat,9,42);
    expect(etat.niveau40).toBe(2);
    expect(etat['niveau40:heroes']).toEqual(['7','9']);
  });

  it('ignore un champion sous le seuil',()=>{
    expect(monte({},7,39).niveau40).toBe(0);
  });

  it('plafonne au but meme avec plus de champions',()=>{
    let etat={};
    [1,2,3,4,5].forEach(id=>{etat=monte(etat,id,60)});
    expect(etat.niveau40).toBe(3);
    expect(etat['niveau40:heroes']).toHaveLength(5);
  });

  it('ignore un evenement sans champion',()=>{
    expect(monte({},null,60).niveau40).toBe(0);
  });
});

describe('reclamation d une quete',()=>{
  const q=quete({id:'combats',goal:3});

  it('refuse une quete non terminee',()=>{
    expect(canClaimQuest(q,{progress:{combats:2},claimed:{}})).toBe(false);
  });

  it('accepte une quete terminee',()=>{
    expect(canClaimQuest(q,{progress:{combats:3},claimed:{}})).toBe(true);
  });

  it('accepte une quete depassee',()=>{
    expect(canClaimQuest(q,{progress:{combats:9},claimed:{}})).toBe(true);
  });

  it('refuse une recompense deja prise',()=>{
    expect(canClaimQuest(q,{progress:{combats:3},claimed:{combats:true}})).toBe(false);
  });

  it('refuse sans quete ou sans etat',()=>{
    expect(canClaimQuest(null,{progress:{},claimed:{}})).toBe(false);
    expect(canClaimQuest(q,null)).toBe(false);
  });

  it('questCompleted suit le meme seuil',()=>{
    expect(questCompleted(q,{combats:2})).toBe(false);
    expect(questCompleted(q,{combats:3})).toBe(true);
    expect(questCompleted(q,{})).toBe(false);
  });
});

describe('coffre de fin de periode',()=>{
  const groupe=[quete({id:'a'}),quete({id:'b'}),quete({id:'c'}),quete({id:'d'})];

  it('reprend le nombre requis annonce par la periode',()=>{
    expect(chestRequirement('daily',QUESTS)).toBe(QUEST_PERIOD_CONFIG.daily.requiredForChest);
  });

  it('exige tout le groupe si la periode n annonce rien',()=>{
    expect(chestRequirement('inconnue',groupe)).toBe(4);
  });

  it('compte les quetes reclamees du groupe',()=>{
    expect(claimedQuestCount(groupe,{a:true,c:true})).toBe(2);
  });

  it('ne compte pas une quete etrangere au groupe',()=>{
    expect(claimedQuestCount(groupe,{a:true,intruse:true})).toBe(1);
  });

  it('refuse le coffre tant que le compte n y est pas',()=>{
    expect(canClaimChest('inconnue',groupe,{claimed:{a:true,b:true,c:true},bonus:false}))
      .toBe(false);
  });

  it('ouvre le coffre une fois le compte atteint',()=>{
    expect(canClaimChest('inconnue',groupe,{claimed:{a:true,b:true,c:true,d:true},bonus:false}))
      .toBe(true);
  });

  it('refuse un coffre deja ouvert',()=>{
    expect(canClaimChest('inconnue',groupe,{claimed:{a:true,b:true,c:true,d:true},bonus:true}))
      .toBe(false);
  });

  it('decrit l avancement du coffre pour l affichage',()=>{
    expect(chestProgress('inconnue',groupe,{claimed:{a:true,b:true}}))
      .toEqual({claimed:2,required:4,ready:false,opened:false});
    expect(chestProgress('inconnue',groupe,{claimed:{a:true,b:true,c:true,d:true}}))
      .toEqual({claimed:4,required:4,ready:true,opened:false});
    expect(chestProgress('inconnue',groupe,{claimed:{a:true,b:true,c:true,d:true},bonus:true}))
      .toEqual({claimed:4,required:4,ready:false,opened:true});
  });
});

describe('donnees reelles des quetes',()=>{
  it('chaque periode annonce un coffre atteignable',()=>{
    const groupes={daily:QUESTS,weekly:WEEKLY_QUESTS,monthly:MONTHLY_QUESTS};
    Object.entries(groupes).forEach(([periode,quetes])=>{
      const requis=QUEST_PERIOD_CONFIG[periode].requiredForChest;
      expect(requis,periode).toBeGreaterThan(0);
      expect(requis,`${periode} : coffre hors d atteinte`).toBeLessThanOrEqual(quetes.length);
    });
  });

  it('les identifiants de quete sont uniques dans chaque groupe',()=>{
    Object.entries(QUEST_GROUPS).forEach(([groupe,quetes])=>{
      const ids=quetes.map(q=>q.id);
      expect(new Set(ids).size,`doublon dans ${groupe}`).toBe(ids.length);
    });
  });

  it('chaque quete annonce un but strictement positif et un evenement',()=>{
    Object.entries(QUEST_GROUPS).forEach(([groupe,quetes])=>quetes.forEach(q=>{
      expect(q.goal,`${groupe}/${q.id} but`).toBeGreaterThan(0);
      expect(q.event,`${groupe}/${q.id} evenement`).toBeTruthy();
      expect(q.name,`${groupe}/${q.id} nom`).toBeTruthy();
    }));
  });

  it('une quete a seuil vise un seul palier, pas un compteur',()=>{
    QUEST_GROUPS.progression.filter(q=>q.threshold&&q.mode!=='uniqueHeroes')
      .forEach(q=>expect(q.goal,`${q.id}`).toBe(1));
  });
});
