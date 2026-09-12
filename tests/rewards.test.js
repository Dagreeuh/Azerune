// Recompenses de fin de mission : generation du butin, sets actifs, forge.
//
// C est ce que le joueur recoit reellement. Une erreur ici ne se voit pas tout
// de suite : elle se traduit par un objet legerement faux, un set qui ne
// s active pas, ou un ecran qui tombe sur une vieille sauvegarde.
import{describe,it,expect,afterEach,vi}from'vitest';
import{SLOTS,QUALITIES,SETS,CONTINENT_SETS,RAID_SETS,ITEM_MAX_UPGRADE,
        ITEM_UPGRADE_MILESTONES,generateCampaignItem,generateRaidItem,
        generateExpeditionItem,generateMythicItem,generateAchievementItem,
        generateShopItem,normalizedItem,activeSets,setStats,upgradeCost,
        recycleEssenceValue,forgeUpgradeItem}from'../src/data/items';
import{seedRandom}from'./helpers';

afterEach(()=>vi.restoreAllMocks());

/** Invariants que tout objet genere doit respecter, quelle que soit la source. */
function objetValide(item,contexte=''){
  expect(SLOTS,`${contexte} slot`).toContain(item.slot);
  expect(QUALITIES[item.quality],`${contexte} qualite ${item.quality}`).toBeTruthy();
  expect(SETS[item.setId],`${contexte} set ${item.setId}`).toBeTruthy();
  expect(item.stars,`${contexte} etoiles`).toBeGreaterThanOrEqual(1);
  expect(item.stars,`${contexte} etoiles`).toBeLessThanOrEqual(5);
  expect(item.itemLevel,`${contexte} niveau d objet`).toBeGreaterThan(0);
  expect(item.level,`${contexte} niveau d amelioration`).toBe(0);
  expect(item.mainStat,`${contexte} stat principale`).toBeTruthy();
  expect(item.mainValue,`${contexte} valeur principale`).toBeGreaterThan(0);
  expect(Object.keys(item.substats).length,`${contexte} sous-stats`)
    .toBe(QUALITIES[item.quality].substats);
  expect(item.mainStat in item.substats,`${contexte} doublon stat principale`).toBe(false);
}

const mission=(patch={})=>({continentId:'valebrume',stageId:3,difficultyId:'normal',
  boss:false,setId:'vitality',...patch});

describe('generateCampaignItem',()=>{
  it('produit un objet valide sur 60 tirages',()=>{
    for(let graine=1;graine<=60;graine+=1){
      seedRandom(graine);
      objetValide(generateCampaignItem(mission()),`graine ${graine}`);
      vi.restoreAllMocks();
    }
  });

  it('tire le set dans le pool du continent',()=>{
    for(let graine=1;graine<=40;graine+=1){
      seedRandom(graine);
      const item=generateCampaignItem(mission({setId:undefined}));
      expect(CONTINENT_SETS.valebrume,`graine ${graine}`).toContain(item.setId);
      vi.restoreAllMocks();
    }
  });

  it('respecte un set demande s il appartient au pool du continent',()=>{
    seedRandom(1);
    expect(generateCampaignItem(mission({preferredSetId:'attack'})).setId).toBe('attack');
  });

  it('ignore un set demande hors du pool du continent',()=>{
    seedRandom(1);
    const item=generateCampaignItem(mission({preferredSetId:'incendiary',setId:undefined}));
    expect(CONTINENT_SETS.valebrume).toContain(item.setId);
  });

  it('un boss donne un objet au moins aussi bon qu une etape',()=>{
    const etoiles=drapeau=>{
      let total=0;
      for(let graine=1;graine<=40;graine+=1){
        seedRandom(graine);
        total+=generateCampaignItem(mission({boss:drapeau,stageId:8})).stars;
        vi.restoreAllMocks();
      }
      return total;
    };
    expect(etoiles(true)).toBeGreaterThanOrEqual(etoiles(false));
  });

  it('est reproductible a graine egale',()=>{
    seedRandom(77);const premier=generateCampaignItem(mission());
    vi.restoreAllMocks();
    seedRandom(77);const second=generateCampaignItem(mission());
    expect({...second,id:null}).toEqual({...premier,id:null});
  });
});

describe('generateRaidItem',()=>{
  it('produit un objet valide et tire dans le pool du raid',()=>{
    for(let graine=1;graine<=40;graine+=1){
      seedRandom(graine);
      const item=generateRaidItem({raidId:'heartforge',stars:4});
      objetValide(item,`graine ${graine}`);
      expect(RAID_SETS.heartforge).toContain(item.setId);
      vi.restoreAllMocks();
    }
  });

  it('minQuality rare exclut les qualites inferieures',()=>{
    for(let graine=1;graine<=40;graine+=1){
      seedRandom(graine);
      const item=generateRaidItem({raidId:'heartforge',minQuality:'rare'});
      expect(['rare','epic','legendary'],`graine ${graine}`).toContain(item.quality);
      vi.restoreAllMocks();
    }
  });

  it('le bonus de qualite ameliore le butin en moyenne',()=>{
    const rang={common:0,rare:1,epic:2,legendary:3};
    const moyenne=bonus=>{
      let total=0;
      for(let graine=1;graine<=60;graine+=1){
        seedRandom(graine);
        total+=rang[generateRaidItem({raidId:'heartforge',qualityBonus:bonus}).quality]??0;
        vi.restoreAllMocks();
      }
      return total;
    };
    expect(moyenne(20)).toBeGreaterThan(moyenne(0));
  });
});

describe('generateExpeditionItem et generateMythicItem',()=>{
  it('l expedition produit un objet valide a tout niveau',()=>{
    [1,5,10].forEach(level=>{
      for(let graine=1;graine<=20;graine+=1){
        seedRandom(graine);
        objetValide(generateExpeditionItem({expeditionId:'inconnue',level}),
          `niveau ${level} graine ${graine}`);
        vi.restoreAllMocks();
      }
    });
  });

  it('l expedition borne le niveau demande',()=>{
    seedRandom(1);const bas=generateExpeditionItem({level:-5});
    vi.restoreAllMocks();
    seedRandom(1);const plancher=generateExpeditionItem({level:1});
    expect(bas.itemLevel).toBe(plancher.itemLevel);
  });

  it('le Mythic+ produit un objet valide a tout niveau',()=>{
    [1,15,30].forEach(level=>{
      for(let graine=1;graine<=20;graine+=1){
        seedRandom(graine);
        objetValide(generateMythicItem({level}),`niveau ${level} graine ${graine}`);
        vi.restoreAllMocks();
      }
    });
  });

  it('le Mythic+ donne de meilleurs objets a haut niveau',()=>{
    const niveauMoyen=level=>{
      let total=0;
      for(let graine=1;graine<=40;graine+=1){
        seedRandom(graine);total+=generateMythicItem({level}).itemLevel;vi.restoreAllMocks();
      }
      return total;
    };
    expect(niveauMoyen(30)).toBeGreaterThan(niveauMoyen(1));
  });
});

describe('generateAchievementItem et generateShopItem',()=>{
  it('le haut fait donne un objet de base coherent',()=>{
    const item=generateAchievementItem({slot:'Arme',setId:'attack',mainStat:'atk'});
    expect(item.slot).toBe('Arme');
    expect(item.setId).toBe('attack');
    expect(item.stars).toBe(1);
    expect(item.quality).toBe('common');
    expect(item.level).toBe(0);
    expect(item.source).toBe('Haut fait');
  });

  it('la boutique produit un objet valide',()=>{
    for(let graine=1;graine<=30;graine+=1){
      seedRandom(graine);
      objetValide(generateShopItem({}),`graine ${graine}`);
      vi.restoreAllMocks();
    }
  });
});

describe('normalizedItem',()=>{
  it('borne le niveau d amelioration',()=>{
    expect(normalizedItem({level:-3}).level).toBe(0);
    expect(normalizedItem({level:999}).level).toBe(ITEM_MAX_UPGRADE);
    expect(normalizedItem({level:'abc'}).level).toBe(0);
  });

  it('remplit les champs absents sans planter',()=>{
    const item=normalizedItem(undefined);
    expect(item.level).toBe(0);
    expect(item.upgradeRolls).toEqual([]);
    expect(item.investedEssence).toBe(0);
    expect(item.substats).toEqual({});
  });

  it('deduit l origine Boutique de la source',()=>{
    expect(normalizedItem({source:'Boutique du portail'}).origin).toBe('shop');
    expect(normalizedItem({source:'Campagne'}).origin).toBe('drop');
    expect(normalizedItem({origin:'crafted',source:'Boutique'}).origin).toBe('crafted');
  });
});

describe('activeSets et setStats',()=>{
  const piece=(setId,index)=>({id:`i${index}`,setId});
  const lot=(setId,nombre)=>Array.from({length:nombre},(_,i)=>piece(setId,i));

  it('active un set 2 pieces des deux pieces',()=>{
    expect(SETS.vitality.pieces).toBe(2);
    expect(activeSets(lot('vitality',1))).toEqual([]);
    expect(activeSets(lot('vitality',2))).toEqual(['vitality']);
  });

  it('active deux fois un set porte en double du nombre de pieces',()=>{
    expect(activeSets(lot('vitality',4))).toEqual(['vitality','vitality']);
  });

  it('n active pas un set 4 pieces incomplet',()=>{
    expect(SETS.attack.pieces).toBe(4);
    expect(activeSets(lot('attack',3))).toEqual([]);
    expect(activeSets(lot('attack',4))).toEqual(['attack']);
  });

  it('cumule les statistiques des sets actifs',()=>{
    expect(setStats(lot('vitality',2))).toEqual(SETS.vitality.stats);
    const double=setStats(lot('vitality',4));
    Object.entries(SETS.vitality.stats).forEach(([cle,valeur])=>
      expect(double[cle]).toBe(valeur*2));
  });

  // Regression : un objet portant un setId disparu du jeu — vieille sauvegarde,
  // set retire lors d une refonte, fichier importe d une autre version — faisait
  // lever SETS[id].pieces, donc tomber totalStats et toute page qui l appelle.
  it('ignore un set inconnu au lieu de planter',()=>{
    const melange=[...lot('vitality',2),piece('setDisparu',9),piece('setDisparu',10)];
    expect(()=>activeSets(melange)).not.toThrow();
    expect(activeSets(melange)).toEqual(['vitality']);
    expect(()=>setStats(melange)).not.toThrow();
    expect(setStats(melange)).toEqual(SETS.vitality.stats);
  });

  it('tolere une liste vide, nulle, ou des objets sans set',()=>{
    expect(activeSets([])).toEqual([]);
    expect(activeSets(null)).toEqual([]);
    expect(activeSets([{id:'x'},null,undefined])).toEqual([]);
    expect(setStats(null)).toEqual({});
  });
});

describe('upgradeCost',()=>{
  const objet=(patch={})=>({id:'o',stars:3,quality:'rare',level:0,...patch});

  it('renvoie le palier suivant et son cout',()=>{
    const cout=upgradeCost(objet());
    expect(cout.target).toBe(1);
    expect(cout.gold).toBeGreaterThan(0);
    expect(cout.essence).toBeGreaterThan(0);
  });

  it('ne propose rien au-dela du niveau maximum',()=>{
    expect(upgradeCost(objet({level:ITEM_MAX_UPGRADE}))).toBeNull();
  });

  it('les paliers a sous-statistique sont bien 3, 6, 9, 12 et 15',()=>{
    // Fige en clair : lire la constante des deux cotes rendrait le test
    // tautologique, et la deplacer ne casserait plus rien.
    expect(ITEM_UPGRADE_MILESTONES).toEqual([3,6,9,12,15]);
  });

  it('signale exactement ces paliers, et aucun autre',()=>{
    for(let cible=1;cible<=ITEM_MAX_UPGRADE;cible+=1){
      expect(upgradeCost(objet({level:cible-1})).milestone,`palier ${cible}`)
        .toBe([3,6,9,12,15].includes(cible));
    }
  });

  it('coute plus cher a haute qualite et haute etoile',()=>{
    const base=upgradeCost(objet({stars:1,quality:'common'})).essence;
    expect(upgradeCost(objet({stars:5,quality:'common'})).essence).toBeGreaterThan(base);
    expect(upgradeCost(objet({stars:1,quality:'legendary'})).essence).toBeGreaterThan(base);
  });

  it('le cout croit avec le niveau vise',()=>{
    const couts=[0,4,9,14].map(level=>upgradeCost(objet({level})).essence);
    for(let i=1;i<couts.length;i+=1)expect(couts[i]).toBeGreaterThan(couts[i-1]);
  });
});

describe('recycleEssenceValue',()=>{
  const objet=(patch={})=>({id:'o',stars:3,quality:'rare',level:0,
    investedEssence:0,origin:'drop',...patch});

  it('rend au moins 1 Essence',()=>{
    expect(recycleEssenceValue(objet({stars:1,quality:'normal'}))).toBeGreaterThanOrEqual(1);
  });

  it('rend 25 % des Essences investies en plus',()=>{
    const nu=recycleEssenceValue(objet());
    expect(recycleEssenceValue(objet({investedEssence:400}))).toBe(nu+100);
  });

  it('penalise fortement un objet achete en Boutique',()=>{
    expect(recycleEssenceValue(objet({origin:'shop'})))
      .toBeLessThan(recycleEssenceValue(objet({origin:'drop'})));
  });

  it('penalise un objet forge, moins fortement que la Boutique',()=>{
    const boutique=recycleEssenceValue(objet({investedEssence:1000,origin:'shop'}));
    const forge=recycleEssenceValue(objet({investedEssence:1000,origin:'crafted'}));
    const butin=recycleEssenceValue(objet({investedEssence:1000,origin:'drop'}));
    expect(forge).toBeLessThan(boutique);
    expect(boutique).toBeLessThan(butin);
  });

  it('rend davantage sur un objet plus etoile',()=>{
    expect(recycleEssenceValue(objet({stars:5})))
      .toBeGreaterThan(recycleEssenceValue(objet({stars:1})));
  });
});

describe('forgeUpgradeItem',()=>{
  const objet=(patch={})=>({id:'o',slot:'Arme',setId:'attack',stars:3,quality:'rare',
    level:0,mainStat:'atk',mainValue:50,substats:{hp:10,def:5},...patch});

  it('monte l objet d un niveau et cumule l investissement',()=>{
    seedRandom(3);
    const avant=objet(),cout=upgradeCost(avant),{ok,item}=forgeUpgradeItem(avant);
    expect(ok).not.toBe(false);
    expect(item.level).toBe(1);
    expect(item.investedEssence).toBe(cout.essence);
    expect(item.investedGold).toBe(cout.gold);
  });

  it('refuse un objet deja au maximum, avec un message',()=>{
    const resultat=forgeUpgradeItem(objet({level:ITEM_MAX_UPGRADE}));
    expect(resultat.ok).toBe(false);
    expect(resultat.message).toBeTruthy();
  });

  it('ne perd jamais l identite de l objet',()=>{
    seedRandom(5);
    const{item}=forgeUpgradeItem(objet());
    expect(item.id).toBe('o');
    expect(item.slot).toBe('Arme');
    expect(item.setId).toBe('attack');
    expect(item.mainStat).toBe('atk');
  });

  it('quinze ameliorations successives menent au niveau maximum',()=>{
    seedRandom(11);
    let item=objet();
    for(let index=0;index<ITEM_MAX_UPGRADE;index+=1)item=forgeUpgradeItem(item).item;
    expect(item.level).toBe(ITEM_MAX_UPGRADE);
    expect(forgeUpgradeItem(item).ok).toBe(false);
  });
});
