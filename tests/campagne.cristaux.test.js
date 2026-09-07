import{describe,it,expect}from'vitest';
import{CONTINENTS,DIFFICULTIES,STAR_MILESTONES,createMission,missionGems,continentClearReward,continentCleared,continentClearKey,missionKey}from'../src/data/campaign';
import{campaignMissionRewards}from'../src/utils/rewards';

const difficulte=id=>DIFFICULTIES.find(entry=>entry.id===id);
const COUT_X10=900;
/** Cristaux verses par une difficulte entiere : missions + paliers de continent. */
const cristauxCampagne=id=>CONTINENTS.reduce((total,continent,index)=>
  total+continent.stages.reduce((sum,stage)=>sum+createMission(difficulte(id),continent,stage).reward.gems,0)
  +continentClearReward(index,id).gems,0);
const paliersEtoiles=STAR_MILESTONES.reduce((sum,item)=>sum+(item.reward.gems||0),0);

describe('les cristaux de campagne suivent la progression',()=>{
  // Les cristaux etaient plats : 11 par palier et 34 par boss, de la zone 1 a la
  // zone 10. Une zone tardive versait autant qu'une zone d'ouverture.
  it('une mission tardive verse plus qu’une mission d’ouverture',()=>{
    CONTINENTS.forEach((continent,index)=>{
      if(index===0)return;
      const tot=stage=>createMission(difficulte('normal'),continent,stage).reward.gems;
      const ref=stage=>createMission(difficulte('normal'),CONTINENTS[0],stage).reward.gems;
      expect(tot(continent.stages[0])).toBeGreaterThan(ref(CONTINENTS[0].stages[0]));
    });
  });

  it('le boss verse plus que les paliers ordinaires de sa zone',()=>{
    CONTINENTS.forEach((continent,index)=>{
      expect(missionGems(index+1,true)).toBeGreaterThan(missionGems(index+1,false));
    });
  });

  it('la croissance reste douce : le cristal est la monnaie rare',()=>{
    // Sans borne haute, indexer sur la zone reviendrait a inonder la fin de
    // campagne. La zone 10 doit valoir davantage que la zone 1, pas un ordre de
    // grandeur de plus.
    const rapport=missionGems(10,true)/missionGems(1,true);
    expect(rapport).toBeGreaterThan(1.5);
    expect(rapport).toBeLessThan(3);
  });
});

describe('les paliers de continent',()=>{
  it('grandissent avec la zone',()=>{
    const valeurs=CONTINENTS.map((unused,index)=>continentClearReward(index,'normal').gems);
    valeurs.slice(1).forEach((valeur,index)=>expect(valeur).toBeGreaterThan(valeurs[index]));
  });

  it('suivent la difficulte',()=>{
    CONTINENTS.forEach((unused,index)=>{
      expect(continentClearReward(index,'hard').gems).toBeGreaterThan(continentClearReward(index,'normal').gems);
      expect(continentClearReward(index,'hardcore').gems).toBeGreaterThan(continentClearReward(index,'hard').gems);
    });
  });

  it('le premier palier ouvre la premiere invocation x10',()=>{
    // Le joueur demarre a 600 cristaux (500 + 100 du tutoriel). Le premier
    // continent verse une centaine de cristaux par ses missions. Le palier doit
    // franchir les 900 : sans cela, il termine tout un continent sans jamais
    // pouvoir s'offrir un rituel.
    const missions=CONTINENTS[0].stages.reduce((sum,stage)=>
      sum+createMission(difficulte('normal'),CONTINENTS[0],stage).reward.gems,0);
    expect(600+missions+continentClearReward(0,'normal').gems).toBeGreaterThanOrEqual(COUT_X10);
  });

  it('ne se declenche qu’une fois le continent entierement termine',()=>{
    const continent=CONTINENTS[0],scores={};
    continent.stages.slice(0,-1).forEach(stage=>{scores[missionKey('normal',continent.id,stage.id)]=3});
    expect(continentCleared(scores,'normal',continent)).toBe(false);
    scores[missionKey('normal',continent.id,continent.stages[6].id)]=1;
    expect(continentCleared(scores,'normal',continent)).toBe(true);
  });

  it('une mission a zero etoile ne compte pas comme terminee',()=>{
    const continent=CONTINENTS[0],scores={};
    continent.stages.forEach(stage=>{scores[missionKey('normal',continent.id,stage.id)]=3});
    scores[missionKey('normal',continent.id,continent.stages[3].id)]=0;
    expect(continentCleared(scores,'normal',continent)).toBe(false);
  });

  it('la cle separe les difficultes : le meme continent se paie trois fois',()=>{
    const cles=DIFFICULTIES.map(entry=>continentClearKey(entry.id,CONTINENTS[0].id));
    expect(new Set(cles).size).toBe(DIFFICULTIES.length);
  });
});

describe('l’economie reste bornee',()=>{
  it.each(['normal','hard','hardcore'])('%s finance un nombre d’invocations tenu',id=>{
    const total=cristauxCampagne(id)+paliersEtoiles;
    // Le plancher evite le retour d'une campagne qui ne finance rien ; le
    // plafond evite d'ouvrir tout le roster sans jouer les autres contenus.
    expect(total/COUT_X10).toBeGreaterThan(8);
    expect(total/COUT_X10).toBeLessThan(16);
  });

  it('la campagne entiere ne suffit pas a completer le roster',()=>{
    const total=DIFFICULTIES.reduce((sum,entry)=>sum+cristauxCampagne(entry.id),0)+paliersEtoiles*3;
    // 3 difficultes completes, trois-etoilees de bout en bout, restent sous les
    // 400 invocations : le gacha garde sa part.
    expect(total/90).toBeLessThan(400);
  });

  it('le farm ne verse aucun cristal',()=>{
    const mission=createMission(difficulte('normal'),CONTINENTS[4],CONTINENTS[4].stages[6]);
    expect(campaignMissionRewards(mission,3,3).gems).toBe(0);
    expect(campaignMissionRewards(mission,2,3).gems).toBe(0);
  });
});
