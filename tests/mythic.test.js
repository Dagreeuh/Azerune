// Mythic+ : composition des missions, enchainement des vagues, affixes.
import{describe,it,expect,afterEach,beforeEach,vi}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{MYTHIC_AFFIXES,MYTHIC_LEVELS,mythicSeason,createMythicMission}from'../src/data/mythic';
import{createBattle,nextTurn,advanceMythicWave}from'../src/battle/engine';
import{calibratedEncounterPower}from'../src/utils/stats';
import{makeHero,makeEnemy,statsFrom,withStatus,findUnit,fixedRandom}from'./helpers';

const moteur=fs.readFileSync(fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8');
const source=fs.readFileSync(fileURLToPath(new URL('../src/data/mythic.js',import.meta.url)),'utf8');

afterEach(()=>vi.restoreAllMocks());

describe('affixes — contrat de cablage',()=>{
  it('les six affixes annonces sont declares',()=>{
    expect(Object.keys(MYTHIC_AFFIXES).sort())
      .toEqual(['bolstering','bursting','fortified','necrotic','raging','tyrannical']);
  });

  it('chaque affixe declare est reellement lu par le moteur',()=>{
    // Un affixe que le moteur ignore serait affiche au joueur sans rien faire.
    const morts=Object.keys(MYTHIC_AFFIXES).filter(id=>!moteur.includes(`'${id}'`));
    expect(morts).toEqual([]);
  });

  it('chaque affixe des rotations de saison existe',()=>{
    const bloc=source.slice(source.indexOf('const ROTATIONS='),source.indexOf('\n',source.indexOf('const ROTATIONS=')));
    const cites=[...new Set([...bloc.matchAll(/'([a-z]+)'/g)].map(m=>m[1]))];
    expect(cites.length).toBeGreaterThan(0);
    const inconnus=cites.filter(id=>!MYTHIC_AFFIXES[id]);
    expect(inconnus).toEqual([]);
  });

  it('chaque affixe expose un nom, une icone et une description',()=>{
    Object.entries(MYTHIC_AFFIXES).forEach(([id,affixe])=>{
      expect(affixe.name,`${id} nom`).toBeTruthy();
      expect(affixe.icon,`${id} icone`).toBeTruthy();
      expect(affixe.description,`${id} description`).toBeTruthy();
    });
  });
});

describe('saison',()=>{
  it('propose trois affixes tires d une rotation',()=>{
    const saison=mythicSeason();
    expect(saison.affixes).toHaveLength(3);
    saison.affixes.forEach(id=>expect(MYTHIC_AFFIXES[id],id).toBeTruthy());
  });

  it('est stable a l interieur d un meme mois',()=>{
    expect(mythicSeason().key).toBe(mythicSeason().key);
    expect(mythicSeason().affixes).toEqual(mythicSeason().affixes);
  });
});

describe('createMythicMission',()=>{
  it('couvre trente niveaux',()=>{
    expect(MYTHIC_LEVELS).toHaveLength(30);
    expect(MYTHIC_LEVELS[0]).toBe(1);
    expect(MYTHIC_LEVELS[29]).toBe(30);
  });

  it('borne le niveau demande',()=>{
    expect(createMythicMission(0).mythicLevel).toBe(1);
    expect(createMythicMission(-5).mythicLevel).toBe(1);
    expect(createMythicMission(99).mythicLevel).toBe(30);
    expect(createMythicMission('abc').mythicLevel).toBe(1);
    expect(createMythicMission().mythicLevel).toBe(1);
  });

  it('ajoute les affixes par paliers de niveau',()=>{
    const compte=niveau=>createMythicMission(niveau).affixIds.length;
    [1,4].forEach(n=>expect(compte(n),`niveau ${n}`).toBe(0));
    [5,9].forEach(n=>expect(compte(n),`niveau ${n}`).toBe(1));
    [10,19].forEach(n=>expect(compte(n),`niveau ${n}`).toBe(2));
    [20,30].forEach(n=>expect(compte(n),`niveau ${n}`).toBe(3));
  });

  it('le nombre d affixes ne redescend jamais avec le niveau',()=>{
    let precedent=0;
    MYTHIC_LEVELS.forEach(niveau=>{
      const actuel=createMythicMission(niveau).affixIds.length;
      expect(actuel,`niveau ${niveau}`).toBeGreaterThanOrEqual(precedent);
      precedent=actuel;
    });
  });

  it('chaque affixe retenu est resolu en objet affichable',()=>{
    const mission=createMythicMission(30);
    expect(mission.affixes).toHaveLength(mission.affixIds.length);
    mission.affixes.forEach(affixe=>expect(affixe.name).toBeTruthy());
  });

  it('compose quatre vagues, la premiere servant de rencontre initiale',()=>{
    const mission=createMythicMission(10);
    expect(mission.waves).toHaveLength(4);
    expect(mission.enemies).toBe(mission.waves[0]);
    mission.waves.forEach((vague,index)=>{
      expect(vague.length,`vague ${index+1}`).toBeGreaterThan(0);
      vague.forEach(ennemi=>{
        expect(ennemi.hp,`vague ${index+1}`).toBeGreaterThan(0);
        expect(ennemi.name).toBeTruthy();
      });
    });
  });

  it('la puissance conseillee monte a chaque niveau, sans jamais reculer',()=>{
    // Le bonus de palier etait accorde au seul niveau multiple de 10 puis
    // retire au suivant : la valeur reculait de 341 points entre le 10 et le
    // 11, presentant au joueur un palier plus dur comme plus facile.
    for(let niveau=2;niveau<=30;niveau+=1)
      expect(createMythicMission(niveau).recommended,`niveau ${niveau}`)
        .toBeGreaterThan(createMythicMission(niveau-1).recommended);
  });

  it('la puissance affichee au joueur monte elle aussi a chaque niveau',()=>{
    // Le meme defaut existait en double : calibratedEncounterPower porte son
    // propre bonus de palier, et c'est cette valeur-la que MythicPage affiche.
    for(let niveau=2;niveau<=30;niveau+=1)
      expect(calibratedEncounterPower(createMythicMission(niveau)),`niveau ${niveau}`)
        .toBeGreaterThan(calibratedEncounterPower(createMythicMission(niveau-1)));
  });

  it('chaque dizaine franchie ajoute un cran de difficulte',()=>{
    const saut=niveau=>createMythicMission(niveau).recommended
      -createMythicMission(niveau-1).recommended;
    // Le niveau 30 est le dernier : pas de 31 auquel le comparer.
    [10,20].forEach(palier=>
      expect(saut(palier),`palier ${palier}`).toBeGreaterThan(saut(palier+1)));
    expect(saut(30),'palier 30').toBeGreaterThan(saut(29));
  });

  it('annonce une equipe de quatre et un boss decrit',()=>{
    const mission=createMythicMission(15);
    expect(mission.teamSize).toBe(4);
    expect(mission.bossInfo.name).toBeTruthy();
    expect(mission.bossInfo.spells.length).toBeGreaterThan(0);
  });

  it('la cle de mission est unique par saison et par niveau',()=>{
    const cles=MYTHIC_LEVELS.map(niveau=>createMythicMission(niveau).key);
    expect(new Set(cles).size).toBe(cles.length);
  });
});

describe('enchainement des vagues',()=>{
  const combatMythic=(vagues=3)=>{
    const equipe=[makeHero({hp:1000,spd:100})];
    const waves=Array.from({length:vagues},(_,index)=>
      [makeEnemy({id:`v${index}`,hp:200+index*100,spd:90})]);
    return createBattle(equipe.map(h=>h.id),equipe,statsFrom,
      {enemies:waves[0],waves,mythic:{level:5},affixIds:[]});
  };

  it('ne fait rien tant que la vague n est pas gagnee',()=>{
    const combat=combatMythic();
    expect(advanceMythicWave(combat)).toBe(combat);
  });

  it('ne fait rien sur un combat qui n est pas Mythic+',()=>{
    const equipe=[makeHero({})];
    const ordinaire={...createBattle(equipe.map(h=>h.id),equipe,statsFrom,{}),winner:'ally'};
    expect(advanceMythicWave(ordinaire)).toBe(ordinaire);
  });

  it('passe a la vague suivante apres une victoire',()=>{
    const suivant=advanceMythicWave({...combatMythic(),winner:'ally'});
    expect(suivant.wave).toBe(2);
    expect(suivant.winner).toBeNull();
    expect(suivant.turn).toBeNull();
    expect(suivant.enemies[0].hp).toBe(300);
  });

  it('s arrete a la derniere vague',()=>{
    const dernier={...combatMythic(3),winner:'ally',wave:3};
    expect(advanceMythicWave(dernier)).toBe(dernier);
  });

  it('conserve les allies, leurs malus et leurs PV entre les vagues',()=>{
    let combat=combatMythic();
    const id=combat.allies[0].id;
    combat=withStatus(combat,id,{debuffs:{poison:{turns:3}},patch:{hp:420}});
    const suivant=advanceMythicWave({...combat,winner:'ally'});
    const allie=findUnit(suivant,id);
    expect(allie.hp).toBe(420);
    expect(allie.debuffs.poison).toBeTruthy();
  });

  it('ramene la jauge des allies sous 25 au debut de la vague',()=>{
    let combat=combatMythic();
    combat={...combat,allies:combat.allies.map(unit=>({...unit,atb:95}))};
    expect(advanceMythicWave({...combat,winner:'ally'}).allies[0].atb).toBe(25);
  });

  it('remet a zero le compte de morts de la vague',()=>{
    const combat={...combatMythic(),winner:'ally',
      affixState:{ids:['bursting'],deathsThisWave:3,revived:true}};
    const suivant=advanceMythicWave(combat);
    expect(suivant.affixState.deathsThisWave).toBe(0);
    expect(suivant.affixState.revived).toBe(false);
    expect(suivant.affixState.ids).toEqual(['bursting']);
  });

  it('annonce la nouvelle vague dans le journal',()=>{
    const suivant=advanceMythicWave({...combatMythic(),winner:'ally'});
    expect(suivant.log[0]).toContain('Vague 2/3');
  });
});

describe('affixes — effets en combat',()=>{
  beforeEach(()=>fixedRandom(.5));

  const monter=(affixIds,ennemi={})=>{
    const equipe=[makeHero({hp:5000,def:0,spd:1,element:'Arcane'})];
    return createBattle(equipe.map(h=>h.id),equipe,statsFrom,{
      enemies:[makeEnemy({id:'e1',hp:1000,atk:100,def:50,spd:100,
        resistance:15,accuracy:10,element:'Arcane',...ennemi})],
      affixIds,mythic:{level:20}
    });
  };

  it('Fortifié renforce les ennemis ordinaires comme annoncé',()=>{
    // « 20 % de PV, 12 % d'Attaque et 5 Résistance »
    const avec=monter(['fortified']).enemies[0],sans=monter([]).enemies[0];
    expect(avec.hp).toBe(Math.round(sans.hp*1.20));
    expect(avec.atk).toBe(Math.round(sans.atk*1.12));
    expect(avec.resistance).toBe(sans.resistance+5);
  });

  it('Fortifié épargne les boss',()=>{
    const boss={bossUnit:true};
    expect(monter(['fortified'],boss).enemies[0].hp).toBe(monter([],boss).enemies[0].hp);
  });

  it('Tyrannique renforce les boss comme annoncé',()=>{
    // « 25 % de PV, 15 % d'Attaque et 8 Précision »
    const boss={bossUnit:true};
    const avec=monter(['tyrannical'],boss).enemies[0],sans=monter([],boss).enemies[0];
    expect(avec.hp).toBe(Math.round(sans.hp*1.25));
    expect(avec.atk).toBe(Math.round(sans.atk*1.15));
    expect(avec.accuracy).toBe(sans.accuracy+8);
  });

  it('Tyrannique épargne les ennemis ordinaires',()=>{
    expect(monter(['tyrannical']).enemies[0].hp).toBe(monter([]).enemies[0].hp);
  });

  it('Déchaîné accélère un ennemi sous 30 % de PV',()=>{
    // « Sous 30 % de PV, les ennemis gagnent 20 % de Vitesse »
    const vitesse=(affixIds,ratio)=>{
      let combat=monter(affixIds);
      const cible=combat.enemies[0].id;
      combat={...combat,
        allies:combat.allies.map(u=>({...u,atb:0})),
        enemies:combat.enemies.map(u=>({...u,atb:0,hp:Math.round(u.maxHp*ratio)}))};
      return nextTurn(combat).enemies[0].currentSpd;
    };
    expect(vitesse(['raging'],.20)).toBe(Math.round(100*1.20));
    expect(vitesse(['raging'],.50)).toBe(100);
    expect(vitesse([],.20)).toBe(100);
  });
});
