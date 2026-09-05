// Puissance de champion, puissance d equipe, et evaluation de faisabilite.
//
// C est le chiffre sur lequel le joueur decide d engager un combat : la note
// affichee avant chaque mission. Une erreur ici ne plante rien, elle conseille
// mal — le pire des defauts, parce qu il est invisible.
import{describe,it,expect}from'vitest';
import{progressionStats,totalStats,championPower,teamPower,missionDifficulty,
        campaignXp,enemyPower,encounterPower,calibratedEncounterPower,
        assessTeamForMission}from'../src/utils/stats';
import{HEROES}from'../src/data/heroes';
import{makeHero}from'./helpers';

/** Statistiques completes minimales, pour piloter championPower directement. */
const stats=(patch={})=>
  ({hp:1000,atk:100,def:50,spd:100,crit:5,critDamage:50,accuracy:10,resistance:15,...patch});

const progression=(patch={})=>({level:1,stars:3,resonance:0,soulFragments:0,...patch});

describe('championPower',()=>{
  it('est croissant sur chaque statistique',()=>{
    const base=championPower(stats());
    ['hp','atk','def','spd','crit','critDamage','accuracy','resistance'].forEach(cle=>{
      expect(championPower(stats({[cle]:stats()[cle]+100})),cle).toBeGreaterThan(base);
    });
  });

  it('pondere l Attaque plus fortement que les PV',()=>{
    // 7,5 par point d Attaque contre 0,30 par point de PV.
    const parAttaque=championPower(stats({atk:200}))-championPower(stats());
    const parPv=championPower(stats({hp:1100}))-championPower(stats());
    expect(parAttaque).toBeGreaterThan(parPv);
  });

  it('renvoie un entier',()=>{
    expect(Number.isInteger(championPower(stats({hp:1337,spd:97})))).toBe(true);
  });

  it('reste defini sur des statistiques partielles',()=>{
    const valeur=championPower({hp:100,atk:10,def:5,spd:50});
    expect(Number.isFinite(valeur)).toBe(true);
    expect(valeur).toBeGreaterThan(0);
  });
});

describe('teamPower',()=>{
  const roster=[makeHero({hp:1000,atk:100,def:50,spd:100}),
                makeHero({hp:800,atk:120,def:30,spd:110})];
  const getStats=hero=>stats({hp:hero.hp,atk:hero.atk,def:hero.def,spd:hero.spd});

  it('somme la puissance des membres',()=>{
    const total=teamPower(roster.map(h=>h.id),roster,getStats);
    expect(total).toBe(championPower(getStats(roster[0]))+championPower(getStats(roster[1])));
  });

  it('ignore les identifiants inconnus au lieu de casser',()=>{
    expect(teamPower([roster[0].id,999999],roster,getStats))
      .toBe(championPower(getStats(roster[0])));
  });

  it('vaut zero sur une equipe vide',()=>{
    expect(teamPower([],roster,getStats)).toBe(0);
  });
});

describe('progressionStats',()=>{
  const hero=()=>makeHero({hp:1000,atk:100,def:50,spd:100,rarity:3,role:'Combattant'});

  it('le niveau 1 sans etoile bonus rend les statistiques de base',()=>{
    const resultat=progressionStats(hero(),progression());
    expect(resultat.hp).toBe(1000);
    expect(resultat.atk).toBe(100);
    expect(resultat.spd).toBe(100);
  });

  it('chaque niveau ajoute 4,5 % aux statistiques principales',()=>{
    const resultat=progressionStats(hero(),progression({level:11}));
    expect(resultat.hp).toBe(Math.round(1000*(1+10*.045)));
  });

  it('chaque etoile au-dela de la rarete ajoute 18 %',()=>{
    const resultat=progressionStats(hero(),progression({stars:5}));
    expect(resultat.atk).toBe(Math.round(100*(1+2*.18)));
  });

  it('la Vitesse progresse par paliers, pas en pourcentage',()=>{
    expect(progressionStats(hero(),progression({level:11})).spd).toBe(101);
    expect(progressionStats(hero(),progression({stars:5})).spd).toBe(104);
  });

  it('les tanks partent avec plus de Resistance que les combattants',()=>{
    const tank={...hero(),role:'Gardien runique'},combattant=hero();
    expect(progressionStats(tank,progression()).resistance)
      .toBeGreaterThan(progressionStats(combattant,progression()).resistance);
  });

  it('une Resistance explicite du champion l emporte sur celle du role',()=>{
    expect(progressionStats({...hero(),resistance:42},progression()).resistance).toBe(42);
  });
});

describe('totalStats',()=>{
  const hero=makeHero({id:4242,hp:1000,atk:100,def:50,spd:100,rarity:3});
  const equipe=objets=>({[hero.id]:Object.fromEntries(objets.map((o,i)=>[`slot${i}`,o.id]))});

  it('additionne les bonus plats avant les bonus en pourcentage',()=>{
    const objet={id:'o1',stats:{atk:50,atkPct:100}};
    const resultat=totalStats(hero,equipe([objet]),progression(),[objet]);
    expect(resultat.atk).toBe(Math.round((100+50)*2));
  });

  it('ignore un objet equipe introuvable dans l inventaire',()=>{
    const resultat=totalStats(hero,{[hero.id]:{arme:'inexistant'}},progression(),[]);
    expect(resultat.atk).toBe(100);
  });

  it('borne le Critique, la Precision et la Resistance',()=>{
    const objet={id:'o2',stats:{crit:500,accuracy:500,resistance:500}};
    const resultat=totalStats(hero,equipe([objet]),progression(),[objet]);
    expect(resultat.crit).toBe(100);
    expect(resultat.accuracy).toBe(120);
    expect(resultat.resistance).toBe(120);
  });

  it('expose toujours un tableau setEffects, meme sans equipement',()=>{
    expect(totalStats(hero,{},progression(),[])).toHaveProperty('setEffects',[]);
  });
});

describe('missionDifficulty',()=>{
  const paliers=[[2.0,'very-easy'],[1.75,'very-easy'],[1.5,'accessible'],[1.25,'accessible'],
                 [1.0,'balanced'],[.85,'balanced'],[.8,'hard'],[.70,'hard'],[.5,'extreme']];

  it('classe chaque palier de ratio',()=>{
    paliers.forEach(([ratio,attendu])=>{
      expect(missionDifficulty(ratio*1000,1000).key,`ratio ${ratio}`).toBe(attendu);
    });
  });

  it('les paliers sont ordonnes du plus facile au plus dur',()=>{
    const ordre=['very-easy','accessible','balanced','hard','extreme'];
    const observes=[2.0,1.5,1.0,.8,.5].map(r=>missionDifficulty(r*1000,1000).key);
    expect(observes).toEqual(ordre);
  });

  it('ne divise jamais par zero',()=>{
    expect(Number.isFinite(missionDifficulty(500,0).ratio)).toBe(true);
    expect(missionDifficulty(500,0).key).toBe('very-easy');
  });
});

describe('campaignXp',()=>{
  it('donne l XP plein tant que l equipe reste proche du niveau conseille',()=>{
    expect(campaignXp(100,1050,1000).xp).toBe(100);
  });

  it('reduit l XP a mesure que l equipe surclasse la mission',()=>{
    const paliers=[1.2,1.4,1.7,2.1,3.0].map(ratio=>campaignXp(100,ratio*1000,1000).xp);
    for(let i=1;i<paliers.length;i+=1)expect(paliers[i]).toBeLessThan(paliers[i-1]);
  });

  it('ne descend jamais sous 10 XP',()=>{
    expect(campaignXp(1,50000,1000).xp).toBe(10);
  });

  it('une equipe plus faible garde l XP plein',()=>{
    expect(campaignXp(100,500,1000).factor).toBe(1);
  });
});

describe('enemyPower et encounterPower',()=>{
  const gobelin={hp:400,atk:35,def:16,spd:96};

  it('la mise a l echelle augmente la puissance',()=>{
    expect(enemyPower(gobelin,2)).toBeGreaterThan(enemyPower(gobelin,1));
  });

  it('une rencontre vaut plus que la somme brute de ses ennemis',()=>{
    const somme=enemyPower(gobelin)*3;
    expect(encounterPower([gobelin,gobelin,gobelin])).toBeGreaterThan(somme);
  });

  it('une rencontre de boss pese plus qu une rencontre ordinaire',()=>{
    expect(encounterPower([gobelin],1,true)).toBeGreaterThan(encounterPower([gobelin],1,false));
  });

  it('vaut au moins 1 sur une rencontre vide',()=>{
    expect(encounterPower([])).toBe(1);
    expect(encounterPower(null)).toBe(1);
  });
});

describe('calibratedEncounterPower',()=>{
  const gobelin={hp:400,atk:35,def:16,spd:96};

  it('fait confiance a la valeur conseillee d une mission de campagne',()=>{
    expect(calibratedEncounterPower({difficultyId:'normal',recommended:4321})).toBe(4321);
  });

  it('recalcule si la valeur conseillee est absente ou invalide',()=>{
    const sansValeur=calibratedEncounterPower({difficultyId:'normal',enemies:[gobelin]});
    expect(sansValeur).toBeGreaterThan(0);
    expect(calibratedEncounterPower({difficultyId:'normal',recommended:'abc',enemies:[gobelin]}))
      .toBe(sansValeur);
  });

  it('un raid pese plus qu une expedition de meme composition',()=>{
    const base={enemies:[gobelin]};
    expect(calibratedEncounterPower({...base,raid:true,raidLevel:1}))
      .toBeGreaterThan(calibratedEncounterPower({...base,expedition:true,expeditionLevel:1}));
  });

  it('monte avec le niveau de raid et le nombre de mecaniques',()=>{
    const base={enemies:[gobelin],raid:true};
    expect(calibratedEncounterPower({...base,raidLevel:10}))
      .toBeGreaterThan(calibratedEncounterPower({...base,raidLevel:1}));
    expect(calibratedEncounterPower({...base,raidLevel:1,raidData:{mechanics:[1,2,3]}}))
      .toBeGreaterThan(calibratedEncounterPower({...base,raidLevel:1}));
  });

  it('monte avec le nombre de vagues et d affixes en Mythic+',()=>{
    const base={enemies:[gobelin],mythic:true,mythicLevel:5};
    expect(calibratedEncounterPower({...base,waves:[[gobelin],[gobelin],[gobelin]]}))
      .toBeGreaterThan(calibratedEncounterPower({...base,waves:[[gobelin]]}));
    expect(calibratedEncounterPower({...base,affixIds:['fortified','tyrannical']}))
      .toBeGreaterThan(calibratedEncounterPower(base));
  });

  it('vaut au moins 1 sur une mission vide',()=>{
    expect(calibratedEncounterPower({})).toBe(1);
    expect(calibratedEncounterPower()).toBe(1);
  });
});
