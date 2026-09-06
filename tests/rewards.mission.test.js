// Calcul des recompenses de fin de mission.
//
// Ces regles vivaient dans des closures de GameProvider, melees aux appels
// setState, et n'etaient donc atteignables par aucun test. Elles sont
// desormais pures : GameContext garde les effets de bord, ce module decide ce
// que le joueur recoit.
import{describe,it,expect,afterEach,vi}from'vitest';
import{
  CAMPAIGN_STAR_SHARES,CAMPAIGN_MAX_STARS,CAMPAIGN_STONE_DAILY_LIMIT,
  campaignLootRate,campaignStoneChance,campaignStoneCapped,campaignBaseXp,
  campaignFarmGold,campaignRewardShare,campaignMissionRewards,
  campaignGiftConfig,campaignProgressionGift,
  raidQualityBonus,raidBonusLootAllowed,RAID_BONUS_LOOT_CHANCE,raidRelicChance,
  expeditionGearChance,EXPEDITION_FIRST_WIN_BONUS,expeditionRewardAmount
}from'../src/utils/rewards';
import{SETS}from'../src/data/items';
import{seedRandom}from'./helpers';

afterEach(()=>vi.restoreAllMocks());

const mission=(patch={})=>({difficultyId:'normal',boss:false,continentId:'valebrume',
  continentName:'Valebrume',continentIndex:0,
  reward:{gold:1000,gems:100,stones:2,xpBase:200},...patch});

describe('taux de butin de campagne',()=>{
  it('suit la table annoncee, par difficulte et selon boss ou etape',()=>{
    const attendu={normal:{stage:42,boss:58},hard:{stage:54,boss:68},hardcore:{stage:66,boss:80}};
    Object.entries(attendu).forEach(([difficultyId,valeurs])=>{
      expect(campaignLootRate(mission({difficultyId,boss:false})),difficultyId).toBe(valeurs.stage);
      expect(campaignLootRate(mission({difficultyId,boss:true})),difficultyId).toBe(valeurs.boss);
    });
  });

  it('un boss donne toujours un meilleur taux que l etape',()=>{
    ['normal','hard','hardcore'].forEach(difficultyId=>
      expect(campaignLootRate(mission({difficultyId,boss:true})))
        .toBeGreaterThan(campaignLootRate(mission({difficultyId,boss:false}))));
  });

  it('le taux monte avec la difficulte',()=>{
    const taux=['normal','hard','hardcore'].map(difficultyId=>
      campaignLootRate(mission({difficultyId})));
    expect(taux[1]).toBeGreaterThan(taux[0]);
    expect(taux[2]).toBeGreaterThan(taux[1]);
  });

  it('retombe sur la Normale pour une difficulte inconnue',()=>{
    expect(campaignLootRate(mission({difficultyId:'cauchemar'}))).toBe(42);
    expect(campaignLootRate({})).toBe(42);
  });
});

describe('Pierres de foyer de campagne',()=>{
  it('suit la table annoncee',()=>{
    expect(campaignStoneChance(mission({difficultyId:'normal',boss:false}))).toBe(.0035);
    expect(campaignStoneChance(mission({difficultyId:'normal',boss:true}))).toBe(.0075);
    expect(campaignStoneChance(mission({difficultyId:'hardcore',boss:true}))).toBe(.015);
  });

  it('ne donne aucune chance sur une difficulte inconnue',()=>{
    expect(campaignStoneChance(mission({difficultyId:'cauchemar'}))).toBe(0);
    expect(campaignStoneChance({})).toBe(0);
  });

  it('le plafond quotidien est de trois Pierres',()=>{
    expect(CAMPAIGN_STONE_DAILY_LIMIT).toBe(3);
    expect(campaignStoneCapped(0)).toBe(false);
    expect(campaignStoneCapped(2)).toBe(false);
    expect(campaignStoneCapped(3)).toBe(true);
    expect(campaignStoneCapped(9)).toBe(true);
  });

  it('traite une valeur absente ou invalide comme zero Pierre utilisee',()=>{
    expect(campaignStoneCapped(undefined)).toBe(false);
    expect(campaignStoneCapped('abc')).toBe(false);
  });
});

describe('XP de campagne',()=>{
  it('donne l XP de base annonce quand le score progresse',()=>{
    expect(campaignBaseXp(mission({reward:{xpBase:300}}),true)).toBe(300);
  });

  it('applique 180 par defaut si la mission n annonce rien',()=>{
    expect(campaignBaseXp(mission({reward:{}}),true)).toBe(180);
    expect(campaignBaseXp({},true)).toBe(180);
  });

  it('reduit fortement l XP en farm, un peu moins en haute difficulte',()=>{
    const base=mission({reward:{xpBase:1000}});
    expect(campaignBaseXp({...base,difficultyId:'normal'},false)).toBe(250);
    expect(campaignBaseXp({...base,difficultyId:'hard'},false)).toBe(275);
    expect(campaignBaseXp({...base,difficultyId:'hardcore'},false)).toBe(300);
  });

  it('le farm rapporte toujours moins que la progression',()=>{
    ['normal','hard','hardcore'].forEach(difficultyId=>{
      const cible=mission({difficultyId,reward:{xpBase:1000}});
      expect(campaignBaseXp(cible,false)).toBeLessThan(campaignBaseXp(cible,true));
    });
  });
});

describe('or de farm',()=>{
  it('rend 20 % de l or de la mission',()=>{
    expect(campaignFarmGold(mission({reward:{gold:1000}}))).toBe(200);
  });

  it('rend au moins 1 or, meme sur une mission tres pauvre',()=>{
    expect(campaignFarmGold(mission({reward:{gold:1}}))).toBe(1);
    expect(campaignFarmGold(mission({reward:{gold:0}}))).toBe(1);
  });

  it('ne leve pas sur une mission sans bloc de recompense',()=>{
    expect(()=>campaignFarmGold({})).not.toThrow();
    expect(campaignFarmGold({})).toBe(1);
  });
});

describe('parts de recompense par etoiles',()=>{
  it('les paliers cumules sont bien 0, 45, 72 et 100 %',()=>{
    // Fige en clair : lire la constante des deux cotes ne testerait rien.
    expect(CAMPAIGN_STAR_SHARES).toEqual([0,.45,.72,1]);
    expect(CAMPAIGN_MAX_STARS).toBe(3);
  });

  it('un premier passage paye le palier atteint en entier',()=>{
    expect(campaignRewardShare(1,0)).toBeCloseTo(.45);
    expect(campaignRewardShare(2,0)).toBeCloseTo(.72);
    expect(campaignRewardShare(3,0)).toBeCloseTo(1);
  });

  it('une amelioration ne paye que la difference',()=>{
    expect(campaignRewardShare(3,2)).toBeCloseTo(.28);
    expect(campaignRewardShare(2,1)).toBeCloseTo(.27);
  });

  it('rejouer sans ameliorer ne paye rien',()=>{
    [0,1,2,3].forEach(stars=>expect(campaignRewardShare(stars,stars)).toBe(0));
    expect(campaignRewardShare(1,3)).toBe(0);
  });

  it('les parts successives se recomposent en un total de 100 %',()=>{
    const total=campaignRewardShare(1,0)+campaignRewardShare(2,1)+campaignRewardShare(3,2);
    expect(total).toBeCloseTo(1);
  });

  it('borne un nombre d etoiles hors plage au lieu de produire NaN',()=>{
    expect(campaignRewardShare(9,0)).toBeCloseTo(1);
    expect(campaignRewardShare(-2,0)).toBe(0);
    expect(Number.isFinite(campaignRewardShare(undefined,undefined))).toBe(true);
  });
});

describe('recompenses de mission',()=>{
  it('met a l echelle l or et les cristaux sur la part due',()=>{
    const r=campaignMissionRewards(mission({reward:{gold:1000,gems:100,stones:2}}),3,0);
    expect(r.gold).toBe(1000);
    expect(r.gems).toBe(100);
    expect(r.rewardPercent).toBe(100);
  });

  it('ne paye que la difference sur une amelioration',()=>{
    const r=campaignMissionRewards(mission({reward:{gold:1000,gems:100}}),3,2);
    expect(r.gold).toBe(280);
    expect(r.gems).toBe(28);
    expect(r.rewardPercent).toBe(28);
  });

  it('ne donne les Pierres qu au tout premier passage',()=>{
    expect(campaignMissionRewards(mission(),1,0).stones).toBe(2);
    expect(campaignMissionRewards(mission(),3,1).stones).toBe(0);
    expect(campaignMissionRewards(mission(),3,2).stones).toBe(0);
  });

  it('signale correctement le premier passage',()=>{
    expect(campaignMissionRewards(mission(),1,0).firstClear).toBe(true);
    expect(campaignMissionRewards(mission(),3,1).firstClear).toBe(false);
  });

  it('ne leve pas sur une mission sans bloc de recompense',()=>{
    const r=campaignMissionRewards({},3,0);
    expect(r.gold).toBe(0);
    expect(r.gems).toBe(0);
    expect(r.stones).toBe(0);
  });
});

describe('cadeau de progression',()=>{
  const boss=(patch={})=>mission({boss:true,difficultyId:'normal',...patch});

  it('n est du qu au premier passage d un boss de continent en Normale',()=>{
    expect(campaignGiftConfig(boss(),true)).toBeTruthy();
    expect(campaignGiftConfig(boss(),false)).toBeNull();
    expect(campaignGiftConfig(boss({boss:false}),true)).toBeNull();
    expect(campaignGiftConfig(boss({difficultyId:'hard'}),true)).toBeNull();
  });

  it('n existe pas pour un continent sans cadeau declare',()=>{
    expect(campaignGiftConfig(boss({continentId:'arene-lames'}),true)).toBeNull();
  });

  it('produit une piece du set annonce pour chaque continent concerne',()=>{
    const attendu={valebrume:'vitality',khazdrum:'attack',
      'bastion-pierre':'defense','coeur-ignifuge':'fireproof'};
    Object.entries(attendu).forEach(([continentId,setId])=>{
      seedRandom(1);
      const piece=campaignProgressionGift(boss({continentId}),true,0);
      expect(piece.setId,continentId).toBe(setId);
      expect(SETS[piece.setId],continentId).toBeTruthy();
      vi.restoreAllMocks();
    });
  });

  it('le cadeau du continent final est meilleur que les cadeaux d initiation',()=>{
    seedRandom(1);const finale=campaignProgressionGift(boss({continentId:'coeur-ignifuge'}),true,0);
    vi.restoreAllMocks();
    seedRandom(1);const initiation=campaignProgressionGift(boss(),true,0);
    expect(finale.stars).toBe(3);
    expect(finale.quality).toBe('rare');
    expect(initiation.stars).toBe(2);
    expect(initiation.quality).toBe('common');
    expect(finale.giftType).toBe('fireproof');
    expect(initiation.giftType).toBe('tutorial');
  });

  it('reprend le niveau du butin de la mission quand il existe',()=>{
    seedRandom(1);
    expect(campaignProgressionGift(boss(),true,37).itemLevel).toBe(37);
  });

  it('retombe sur le rang du continent sans butin',()=>{
    seedRandom(1);
    expect(campaignProgressionGift(boss({continentIndex:4}),true,0).itemLevel).toBe(5);
    vi.restoreAllMocks();
    seedRandom(1);
    expect(campaignProgressionGift(boss({continentIndex:undefined}),true,null).itemLevel).toBe(1);
  });

  it('ne renvoie rien quand il n est pas du',()=>{
    expect(campaignProgressionGift(boss(),false,0)).toBeNull();
  });
});

describe('raid',()=>{
  it('un combat sans perte ameliore la qualite du butin',()=>{
    expect(raidQualityBonus({flawless:true})).toBe(5);
    expect(raidQualityBonus({flawless:false})).toBe(0);
    expect(raidQualityBonus(null)).toBe(0);
  });

  it('le butin supplementaire demande un sans-faute sur les mecaniques',()=>{
    expect(raidBonusLootAllowed({mechanicFailures:0})).toBe(true);
    expect(raidBonusLootAllowed({mechanicFailures:1})).toBe(false);
    expect(raidBonusLootAllowed(null)).toBe(false);
    expect(RAID_BONUS_LOOT_CHANCE).toBe(.10);
  });

  it('la relique unique est reservee a la Fournaise, niveaux 9 et 10',()=>{
    expect(raidRelicChance('heartforge',9)).toBe(.0005);
    expect(raidRelicChance('heartforge',10)).toBe(.0015);
    expect(raidRelicChance('heartforge',8)).toBe(0);
    expect(raidRelicChance('autre',10)).toBe(0);
  });

  it('le niveau 10 est trois fois plus genereux que le niveau 9',()=>{
    expect(raidRelicChance('heartforge',10)).toBeCloseTo(raidRelicChance('heartforge',9)*3);
  });
});

describe('expedition',()=>{
  it('utilise la chance de butin annoncee par l expedition',()=>{
    expect(expeditionGearChance({gearChance:.5},10)).toBe(.5);
    expect(expeditionGearChance({gearChance:0},10)).toBe(0);
  });

  it('sinon la deduit du niveau',()=>{
    expect(expeditionGearChance({},1)).toBeCloseTo(.335);
    expect(expeditionGearChance({},10)).toBeCloseTo(.65);
  });

  it('la chance deduite monte avec le niveau',()=>{
    expect(expeditionGearChance({},10)).toBeGreaterThan(expeditionGearChance({},1));
  });

  it('la premiere victoire donne 25 % de plus',()=>{
    expect(EXPEDITION_FIRST_WIN_BONUS).toBe(1.25);
    expect(expeditionRewardAmount(1000,true,true).amount).toBe(1250);
    expect(expeditionRewardAmount(1000,false,true).amount).toBe(1000);
  });

  it('ne donne rien sans Sceau',()=>{
    expect(expeditionRewardAmount(1000,true,false).amount).toBe(0);
    expect(expeditionRewardAmount({minor:10},true,false).ascension)
      .toEqual({minor:0,major:0,mythic:0});
  });

  it('met a l echelle chaque grade d Essence d ascension',()=>{
    expect(expeditionRewardAmount({minor:10,major:4,mythic:1},true,true).ascension)
      .toEqual({minor:13,major:5,mythic:1});
  });

  it('une expedition d Essences ne verse aucun montant simple',()=>{
    const resultat=expeditionRewardAmount({minor:10},false,true);
    expect(resultat.amount).toBe(0);
    expect(resultat.ascension.minor).toBe(10);
  });

  it('tolere une recompense absente',()=>{
    expect(expeditionRewardAmount(undefined,true,true))
      .toEqual({amount:0,ascension:{minor:0,major:0,mythic:0}});
  });
});
