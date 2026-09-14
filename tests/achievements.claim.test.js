// Reclamation d'un haut fait et score global.
import{describe,it,expect}from'vitest';
import{canClaimAchievement,findAchievement,achievementGearConfigs}
  from'../src/utils/achievements';
import{ACHIEVEMENTS,achievementScore,achievementReady}from'../src/data/achievements';
import{emptyProgressionStats,mergeChampionStats}from'../src/utils/progressionStats';
import{HEROES}from'../src/data/heroes';

const etatVide=()=>({campaign:{scores:{}},expeditionProgress:{},raidProgress:{},
  mythicProgress:{},owned:[],championProgress:{},forgeHistory:[],inventory:[],
  history:[],legendaryChronicles:{obtainedWeapons:{}},
  progressionStats:emptyProgressionStats()});

/** Etat ou un haut fait de maitrise donne est termine. */
function etatAvecMaitrise(cible){
  const[,id,,effet]=cible.counter.split('.');
  let champions={};
  for(let tour=0;tour<cible.goal;tour+=1)
    champions=mergeChampionStats(champions,{[id]:{skillUses:{[effet]:1}}});
  return{...etatVide(),progressionStats:{...emptyProgressionStats(),champions}};
}
const maitrise=ACHIEVEMENTS.find(a=>String(a.counter||'').includes('.skillUses.'));

describe('findAchievement',()=>{
  it('retrouve un haut fait existant',()=>{
    expect(findAchievement(ACHIEVEMENTS[0].id)).toBe(ACHIEVEMENTS[0]);
  });

  it('renvoie null sur un identifiant inconnu',()=>{
    expect(findAchievement('inexistant')).toBeNull();
    expect(findAchievement(undefined)).toBeNull();
  });
});

describe('canClaimAchievement',()=>{
  it('refuse un haut fait inconnu',()=>{
    expect(canClaimAchievement('inexistant',etatVide()).message).toContain('introuvable');
  });

  it('refuse un objectif non termine',()=>{
    expect(canClaimAchievement(maitrise.id,etatVide()).message).toContain('non terminé');
  });

  it('accorde la recompense d un objectif termine',()=>{
    const resultat=canClaimAchievement(maitrise.id,etatAvecMaitrise(maitrise));
    expect(resultat.ok).toBe(true);
    expect(resultat.achievement.id).toBe(maitrise.id);
    expect(resultat.reward).toBeTruthy();
  });

  it('refuse une recompense deja reclamee, meme objectif termine',()=>{
    const etat=etatAvecMaitrise(maitrise);
    expect(canClaimAchievement(maitrise.id,etat,{[maitrise.id]:Date.now()}).message)
      .toContain('déjà réclamée');
  });

  it('verifie la reclamation avant l objectif',()=>{
    // Un haut fait deja reclame doit le dire, meme si l objectif a ete perdu.
    expect(canClaimAchievement(maitrise.id,etatVide(),{[maitrise.id]:1}).message)
      .toContain('déjà réclamée');
  });

  it('tolere un etat absent sans lever',()=>{
    expect(()=>canClaimAchievement(maitrise.id,undefined)).not.toThrow();
    expect(canClaimAchievement(maitrise.id,undefined).ok).toBe(false);
  });

  it('ne renvoie jamais une recompense sans le drapeau ok',()=>{
    [canClaimAchievement('x',etatVide()),canClaimAchievement(maitrise.id,etatVide())]
      .forEach(resultat=>{
        expect(resultat.ok).toBe(false);
        expect(resultat.reward).toBeUndefined();
      });
  });
});

describe('pieces offertes par un haut fait',()=>{
  it('renvoie une liste vide sans equipement',()=>{
    expect(achievementGearConfigs({})).toEqual([]);
    expect(achievementGearConfigs()).toEqual([]);
  });

  it('prend la piece unique et le lot',()=>{
    expect(achievementGearConfigs({gear:{slot:'Arme'}})).toHaveLength(1);
    expect(achievementGearConfigs({gearPack:[{slot:'Arme'},{slot:'Casque'}]})).toHaveLength(2);
    expect(achievementGearConfigs({gear:{slot:'Arme'},gearPack:[{slot:'Casque'}]}))
      .toHaveLength(2);
  });

  it('chaque piece offerte designe un emplacement',()=>{
    ACHIEVEMENTS.forEach(a=>achievementGearConfigs(a.reward||{}).forEach(piece=>
      expect(piece.slot,`${a.id}`).toBeTruthy()));
  });
});

describe('score de hauts faits',()=>{
  it('vaut zero sur une partie neuve',()=>{
    expect(achievementScore({progressionStats:emptyProgressionStats(),...etatVide()},{}))
      .toBe(0);
  });

  it('augmente des qu un objectif est atteint',()=>{
    const etat=etatAvecMaitrise(maitrise);
    expect(achievementScore(etat,{})).toBeGreaterThan(0);
  });

  it('compte aussi un haut fait deja reclame',()=>{
    // Reclamer ne doit pas faire perdre les points acquis.
    expect(achievementScore(etatVide(),{[maitrise.id]:Date.now()})).toBe(maitrise.score);
  });

  it('ne compte pas deux fois un haut fait atteint et reclame',()=>{
    const etat=etatAvecMaitrise(maitrise);
    expect(achievementScore(etat,{[maitrise.id]:Date.now()}))
      .toBe(achievementScore(etat,{}));
  });

  it('chaque haut fait annonce un score positif',()=>{
    ACHIEVEMENTS.forEach(a=>expect(a.score,`${a.id}`).toBeGreaterThan(0));
  });
});
