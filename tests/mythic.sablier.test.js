// Le Sablier d'Azerune — pression temporelle du Mythic+.
//
// Trois choses doivent tenir ensemble, et chacune a deja ete cassee ailleurs
// dans ce projet :
//   1. la logique pure (utils/mythic) ;
//   2. le cablage moteur (createBattle / nextTurn / enemyAction) ;
//   3. le cablage recompense (GameContext / BattlePage).
// Une moitie ecrite sans l'autre est la signature de bug la plus frequente ici,
// d'ou les tests de contrat sur les sources en fin de fichier.
import{describe,it,expect,afterEach,vi}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{MYTHIC_BUDGET_FACTOR,MYTHIC_PERFECT_RATIO,MYTHIC_COLLAPSE_RATE,MYTHIC_DEFAULT_BUDGET,mythicTurnBudget,mythicPerfectTurns,createMythicMission,MYTHIC_LEVELS}from'../src/data/mythic';
import{createMythicState,advanceMythicClock,mythicSandLeft,mythicOvertime,mythicCollapsed,mythicCollapseFactor,mythicRunTier,scaleMythicReward,MYTHIC_TIERS}from'../src/utils/mythic';
import{createBattle,nextTurn,enemyAction,advanceMythicWave}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,findUnit,fixedRandom}from'./helpers';

const BUDGET=80,PARFAIT=mythicPerfectTurns(BUDGET);

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const moteur=lire('../src/battle/engine.js'),
  contexte=lire('../src/store/GameContext.jsx'),
  pageCombat=lire('../src/pages/BattlePage.jsx'),
  pageMythic=lire('../src/pages/MythicPage.jsx');

/** Avance un etat de sablier de n tours. */
const apres=(etat,n)=>{let v=etat;for(let i=0;i<n;i+=1)v=advanceMythicClock(v);return v};

afterEach(()=>vi.restoreAllMocks());

describe('constantes du Sablier',()=>{
  // Valeurs calibrees par simulation (Audit/PROPOSITION-SABLIER-MYTHIC.md).
  // Volontairement en dur : les recalculer depuis leur propre formule ne
  // testerait rien.
  it('le facteur de budget est de 133 tours par unite de ratio',()=>{
    expect(MYTHIC_BUDGET_FACTOR).toBe(133);
  });

  it('l’Effondrement coute 5 % d’Attaque ennemie par tour depasse',()=>{
    expect(MYTHIC_COLLAPSE_RATE).toBe(.05);
  });

  it('le Sablier parfait demande les trois quarts du budget',()=>{
    expect(MYTHIC_PERFECT_RATIO).toBe(.75);
  });

  it('le seuil parfait reste strictement sous le budget',()=>{
    // Sinon le palier « Sablier tenu » n'existerait plus.
    expect(MYTHIC_PERFECT_RATIO).toBeGreaterThan(0);
    expect(MYTHIC_PERFECT_RATIO).toBeLessThan(1);
  });
});

describe('budget propre a chaque niveau',()=>{
  it('le budget suit les PV ennemis rapportes a la puissance recommandee',()=>{
    // 13 300 PV pour 10 000 de puissance recommandee : 133 x 1,33 = 177.
    expect(mythicTurnBudget([[{hp:6650}],[{hp:6650}]],10000)).toBe(177);
  });

  it('les quatre vagues comptent, pas seulement la premiere',()=>{
    const uneVague=mythicTurnBudget([[{hp:1000}]],1000);
    expect(mythicTurnBudget([[{hp:1000}],[{hp:1000}],[{hp:1000}],[{hp:1000}]],1000))
      .toBe(uneVague*4);
  });

  it('un contenu absent retombe sur le budget par defaut',()=>{
    expect(mythicTurnBudget(null,10000)).toBe(MYTHIC_DEFAULT_BUDGET);
    expect(mythicTurnBudget([[{hp:100}]],0)).toBe(MYTHIC_DEFAULT_BUDGET);
    expect(mythicTurnBudget([[{hp:'?'}]],10000)).toBe(MYTHIC_DEFAULT_BUDGET);
  });

  it('le budget de repli est de 100 tours',()=>{
    expect(MYTHIC_DEFAULT_BUDGET).toBe(100);
  });

  it('le budget ne descend jamais sous 40 tours',()=>{
    expect(mythicTurnBudget([[{hp:1}]],10000)).toBe(40);
  });

  it('chaque niveau Mythic+ expose son propre budget',()=>{
    // Sans budget sur la mission, le moteur retomberait silencieusement sur la
    // valeur par defaut et le Sablier serait le meme partout.
    MYTHIC_LEVELS.forEach(level=>{
      const budget=createMythicMission(level).turnBudget;
      expect(Number.isInteger(budget)).toBe(true);
      expect(budget).toBeGreaterThan(40);
    });
  });

  it('un budget fixe rendrait Mythic+ 1 plus severe que Mythic+ 30',()=>{
    // Le probleme que la formule corrige : la course la plus longue est la
    // plus basse, parce que sa puissance recommandee est faible.
    expect(createMythicMission(1).turnBudget)
      .toBeGreaterThan(createMythicMission(30).turnBudget);
  });

  it('le seuil parfait vaut les trois quarts du budget du niveau',()=>{
    expect(mythicPerfectTurns(100)).toBe(75);
    expect(mythicPerfectTurns(133)).toBe(100);
  });

  it('un budget invalide ne rend pas le seuil parfait absurde',()=>{
    expect(mythicPerfectTurns(0)).toBe(mythicPerfectTurns(MYTHIC_DEFAULT_BUDGET));
    expect(mythicPerfectTurns('?')).toBe(mythicPerfectTurns(MYTHIC_DEFAULT_BUDGET));
  });
});

describe('etat initial',()=>{
  it('le sablier demarre plein, sur le budget demande',()=>{
    expect(createMythicState(BUDGET)).toEqual({turns:0,budget:BUDGET,rate:MYTHIC_COLLAPSE_RATE});
  });

  it('sans budget fourni, le sablier retombe sur la valeur par defaut',()=>{
    expect(createMythicState().budget).toBe(MYTHIC_DEFAULT_BUDGET);
    expect(createMythicState(0).budget).toBe(MYTHIC_DEFAULT_BUDGET);
    expect(createMythicState(-10).budget).toBe(MYTHIC_DEFAULT_BUDGET);
  });

  it('aucun tour consomme, aucun depassement, aucun effondrement',()=>{
    const etat=createMythicState(BUDGET);
    expect(mythicSandLeft(etat)).toBe(BUDGET);
    expect(mythicOvertime(etat)).toBe(0);
    expect(mythicCollapsed(etat)).toBe(false);
  });
});

describe('ecoulement du sablier',()=>{
  it('un tour consomme exactement un tour',()=>{
    expect(advanceMythicClock(createMythicState(BUDGET)).turns).toBe(1);
  });

  it('avancer ne modifie pas l’etat recu',()=>{
    const etat=createMythicState(BUDGET);
    advanceMythicClock(etat);
    expect(etat.turns).toBe(0);
  });

  it('le sable restant decroit tour par tour',()=>{
    expect(mythicSandLeft(apres(createMythicState(BUDGET),12))).toBe(BUDGET-12);
  });

  it('le sable restant ne descend jamais sous zero',()=>{
    expect(mythicSandLeft(apres(createMythicState(BUDGET),BUDGET+9))).toBe(0);
  });

  it('sans etat mythique, avancer ne cree rien',()=>{
    expect(advanceMythicClock(null)).toBe(null);
    expect(advanceMythicClock(undefined)).toBe(undefined);
  });
});

describe('declenchement de l’Effondrement',()=>{
  it('le dernier tour du budget ne declenche pas l’Effondrement',()=>{
    const etat=apres(createMythicState(BUDGET),BUDGET);
    expect(mythicOvertime(etat)).toBe(0);
    expect(mythicCollapsed(etat)).toBe(false);
    expect(mythicCollapseFactor(etat)).toBe(1);
  });

  it('le tour suivant le declenche',()=>{
    const etat=apres(createMythicState(BUDGET),BUDGET+1);
    expect(mythicOvertime(etat)).toBe(1);
    expect(mythicCollapsed(etat)).toBe(true);
  });

  it('le premier tour d’Effondrement vaut exactement +5 %',()=>{
    expect(mythicCollapseFactor(apres(createMythicState(BUDGET),BUDGET+1)))
      .toBeCloseTo(1.05,10);
  });

  it('l’Effondrement est cumulatif, pas multiplicatif',()=>{
    // 10 tours depasses : 1 + 0,05 x 10 = 1,50 (et non 1,05^10 = 1,63).
    expect(mythicCollapseFactor(apres(createMythicState(BUDGET),BUDGET+10)))
      .toBeCloseTo(1.5,10);
  });

  it('le facteur croit strictement a chaque tour depasse',()=>{
    let etat=apres(createMythicState(BUDGET),BUDGET),precedent=mythicCollapseFactor(etat);
    for(let i=0;i<6;i+=1){
      etat=advanceMythicClock(etat);
      const valeur=mythicCollapseFactor(etat);
      expect(valeur).toBeGreaterThan(precedent);
      precedent=valeur;
    }
  });

  it('hors Mythic+, le facteur reste neutre',()=>{
    expect(mythicCollapseFactor(null)).toBe(1);
    expect(mythicCollapseFactor(undefined)).toBe(1);
  });

  it('un etat corrompu ne fait pas exploser les degats',()=>{
    // localStorage peut rendre n'importe quoi : le repli doit rester neutre.
    expect(mythicCollapseFactor({turns:'?',budget:BUDGET,rate:MYTHIC_COLLAPSE_RATE})).toBe(1);
    expect(mythicCollapseFactor({turns:BUDGET+4,budget:BUDGET,rate:'?'}))
      .toBeCloseTo(1.2,10);
    expect(mythicCollapseFactor({turns:BUDGET+4,budget:BUDGET,rate:-3})).toBe(1);
  });
});

describe('paliers de recompense',()=>{
  it('la table declare exactement trois paliers',()=>{
    expect(Object.keys(MYTHIC_TIERS).sort()).toEqual(['collapsed','held','perfect']);
  });

  it('les facteurs de butin sont ceux annonces au joueur',()=>{
    expect(MYTHIC_TIERS.perfect.rewardFactor).toBe(1.25);
    expect(MYTHIC_TIERS.held.rewardFactor).toBe(1);
    expect(MYTHIC_TIERS.collapsed.rewardFactor).toBe(.6);
  });

  it('le seuil parfait exact donne encore le Sablier parfait',()=>{
    expect(mythicRunTier(apres(createMythicState(BUDGET),PARFAIT)).key).toBe('perfect');
  });

  it('un tour de plus bascule sur le Sablier tenu',()=>{
    expect(mythicRunTier(apres(createMythicState(BUDGET),PARFAIT+1)).key).toBe('held');
  });

  it('le dernier tour du budget reste un Sablier tenu',()=>{
    expect(mythicRunTier(apres(createMythicState(BUDGET),BUDGET)).key).toBe('held');
  });

  it('le tour suivant donne l’Effondrement',()=>{
    expect(mythicRunTier(apres(createMythicState(BUDGET),BUDGET+1)).key).toBe('collapsed');
  });

  it('le palier rapporte les tours et le budget pour l’affichage',()=>{
    const palier=mythicRunTier(apres(createMythicState(BUDGET),42));
    expect(palier.turns).toBe(42);
    expect(palier.budget).toBe(BUDGET);
    expect(palier.label).toBeTruthy();
    expect(palier.icon).toBeTruthy();
  });

  it('un budget reduit deplace les deux seuils avec lui',()=>{
    expect(mythicRunTier({turns:12,budget:10,rate:MYTHIC_COLLAPSE_RATE}).key).toBe('collapsed');
    expect(mythicRunTier({turns:9,budget:10,rate:MYTHIC_COLLAPSE_RATE}).key).toBe('held');
    expect(mythicRunTier({turns:7,budget:10,rate:MYTHIC_COLLAPSE_RATE}).key).toBe('perfect');
  });

  it('un budget corrompu ne peut pas offrir un Sablier parfait imperissable',()=>{
    // Etat relu depuis localStorage : un budget nul ferait retomber le seuil
    // parfait sur le budget par defaut, donc 75 tours gratuits.
    expect(mythicRunTier({turns:5,budget:0,rate:MYTHIC_COLLAPSE_RATE}).key).toBe('collapsed');
    expect(mythicRunTier({turns:5,budget:-4,rate:MYTHIC_COLLAPSE_RATE}).key).toBe('collapsed');
  });

  it('un etat absent est traite comme une course parfaite, jamais comme une punition',()=>{
    expect(mythicRunTier(null).rewardFactor).toBe(MYTHIC_TIERS.perfect.rewardFactor);
  });
});

describe('mise a l’echelle du butin',()=>{
  const butin={gold:1000,gems:40,stones:6,essence:25,tomes:3,souls:2,gear:true};

  it('un Sablier tenu ne change rien',()=>{
    expect(scaleMythicReward(butin,MYTHIC_TIERS.held)).toEqual(butin);
  });

  it('un Sablier parfait majore chaque ressource de 25 %',()=>{
    expect(scaleMythicReward(butin,MYTHIC_TIERS.perfect))
      .toEqual({gold:1250,gems:50,stones:8,essence:31,tomes:4,souls:3,gear:true});
  });

  it('un Effondrement ampute chaque ressource de 40 %',()=>{
    expect(scaleMythicReward(butin,MYTHIC_TIERS.collapsed))
      .toEqual({gold:600,gems:24,stones:4,essence:15,tomes:2,souls:1,gear:true});
  });

  it('l’equipement reste binaire, il n’est jamais mis a l’echelle',()=>{
    expect(scaleMythicReward(butin,MYTHIC_TIERS.collapsed).gear).toBe(true);
  });

  it('un gain non nul ne peut pas tomber a zero, meme avec un facteur severe',()=>{
    // Garde-fou independant des trois paliers actuels : quel que soit le
    // facteur, une course validee rapporte toujours quelque chose.
    // 1 x 0,2 = 0,2, qui s'arrondirait a 0 sans le plancher.
    expect(scaleMythicReward({tomes:1,souls:1,gold:2},{rewardFactor:.2}))
      .toMatchObject({tomes:1,souls:1,gold:1});
  });

  it('une ressource absente reste absente, pas convertie en gain',()=>{
    expect(scaleMythicReward({gold:100},MYTHIC_TIERS.perfect))
      .toMatchObject({gold:125,gems:0,stones:0,essence:0,tomes:0,souls:0});
  });

  it('sans palier, le butin passe intact',()=>{
    expect(scaleMythicReward(butin,null)).toEqual(butin);
    expect(scaleMythicReward(butin,{})).toEqual(butin);
  });

  it('un butin absent ne fait pas planter la fin de mission',()=>{
    expect(scaleMythicReward(undefined,MYTHIC_TIERS.perfect))
      .toEqual({gold:0,gems:0,stones:0,essence:0,tomes:0,souls:0});
  });
});

/** Un combat Mythic+ minimal, ennemi lent pour ne pas agir tout seul. */
function combatMythic(options={}){
  const heros=[makeHero({id:5101,hp:100000,def:0,spd:1,name:'A0'})];
  return createBattle(heros.map(h=>h.id),heros,statsFrom,{
    enemies:[makeEnemy({id:'e1',hp:99999,atk:100,def:0,spd:300,element:'Arcane'})],
    mythic:{level:20,season:'test',turnBudget:BUDGET},
    ...options
  });
}

describe('cablage moteur',()=>{
  it('un combat Mythic+ demarre avec un sablier',()=>{
    expect(combatMythic().mythicState).toEqual(createMythicState(BUDGET));
  });

  it('le budget du niveau arrive reellement jusqu’au combat',()=>{
    // Le maillon fragile : une mission qui calcule son budget mais ne le
    // transmet pas laisserait tous les niveaux sur la valeur par defaut.
    expect(combatMythic({mythic:{level:20,season:'test',turnBudget:123}}).mythicState.budget).toBe(123);
    expect(combatMythic({mythic:{level:20,season:'test'}}).mythicState.budget).toBe(MYTHIC_DEFAULT_BUDGET);
  });

  it('un combat ordinaire n’en a pas',()=>{
    const heros=[makeHero({id:5111})];
    const combat=createBattle(heros.map(h=>h.id),heros,statsFrom,{enemies:[makeEnemy()]});
    expect(combat.mythicState).toBe(null);
    expect(nextTurn(combat).mythicState).toBe(null);
  });

  it('chaque tour resolu consomme un grain',()=>{
    let combat=combatMythic();
    for(let i=1;i<=5;i+=1){
      combat=nextTurn(combat);
      expect(combat.mythicState.turns).toBe(i);
    }
  });

  it('le budget est partage par les quatre vagues',()=>{
    // Le point central du design : passer a la vague suivante ne remet pas le
    // sablier a zero, sinon la course n'a plus aucune pression.
    const vague=()=>[makeEnemy({id:'e1',hp:99999,atk:100,def:0,spd:300,element:'Arcane'})];
    let combat=combatMythic({waves:[vague(),vague(),vague(),vague()]});
    expect(combat.totalWaves).toBe(4);
    combat=nextTurn(nextTurn(nextTurn(combat)));
    const avant=combat.mythicState.turns;
    const suivante=advanceMythicWave({...combat,winner:'ally'});
    expect(suivante.mythicState.turns).toBe(avant);
    expect(nextTurn(suivante).mythicState.turns).toBe(avant+1);
  });
});

describe('effet reel de l’Effondrement en combat',()=>{
  /** Degats infliges par l'ennemi avec un sablier donne. */
  function degatsAvec(turns){
    fixedRandom(.5); // variance 1,00, aucun critique
    let combat=combatMythic();
    combat={...combat,allies:combat.allies.map(u=>({...u,atb:0})),enemies:combat.enemies.map(u=>({...u,atb:99.9}))};
    combat=nextTurn(combat);
    combat={...combat,mythicState:{...combat.mythicState,turns}};
    const avant=findUnit(combat,5101).hp;
    return avant-findUnit(enemyAction(combat),5101).hp;
  }

  it('sous le budget, les degats ennemis sont inchanges',()=>{
    expect(degatsAvec(BUDGET)).toBe(degatsAvec(0));
  });

  it('au-dela, les degats ennemis augmentent',()=>{
    expect(degatsAvec(BUDGET+10)).toBeGreaterThan(degatsAvec(0));
  });

  it('l’augmentation suit exactement le facteur d’Effondrement',()=>{
    const base=degatsAvec(0),depasse=degatsAvec(BUDGET+10);
    // Facteur 1,50 ; l'arrondi final du moteur autorise un ecart d'une unite.
    expect(Math.abs(depasse-Math.round(base*1.5))).toBeLessThanOrEqual(1);
  });
});

describe('contrat de cablage — le Sablier atteint bien le joueur',()=>{
  it('le moteur applique le facteur a l’Attaque ennemie',()=>{
    expect(moteur).toContain('mythicCollapseFactor(battle.mythicState)');
  });

  it('le moteur avance le sablier a chaque tour',()=>{
    expect(moteur).toContain('advanceMythicClock(battle.mythicState)');
  });

  it('finishMythicMission recoit le combat et lit le palier',()=>{
    // Sans le combat, le palier serait toujours « parfait » et la mecanique
    // n'aurait aucune consequence sur le butin.
    expect(contexte).toContain('finishMythicMission=(mission,battle)=>');
    expect(contexte).toContain('mythicRunTier(battle?.mythicState)');
    expect(contexte).toContain('scaleMythicReward(mission.reward,tier)');
  });

  it('BattlePage transmet reellement le combat',()=>{
    expect(pageCombat).toContain('finishMythicMission(mission,battle)');
  });

  it('BattlePage transmet le budget de la mission au moteur',()=>{
    expect(pageCombat).toContain('turnBudget:mission.turnBudget');
  });

  it('le sablier restant est affiche pendant le combat',()=>{
    // La valeur doit apparaitre dans le libelle, pas seulement dans une
    // condition de style : un compteur fige ne previent personne.
    expect(pageCombat).toContain('${mythicSandLeft(battle.mythicState)} tours');
    expect(pageCombat).toContain('${mythicOvertime(battle.mythicState)}');
    expect(pageCombat).toContain('mythicCollapsed(battle.mythicState)');
  });

  it('le palier obtenu est affiche dans l’ecran de recompense',()=>{
    expect(pageCombat).toContain('missionReward.rewards.mythicTier.label');
  });

  it('la regle est expliquee avant de lancer une course',()=>{
    // Une pression que le joueur decouvre en la subissant est une punition.
    expect(pageMythic).toContain('mythic-sablier-brief');
    expect(pageMythic).toContain('mission.turnBudget');
    expect(pageMythic).toContain('MYTHIC_COLLAPSE_RATE');
    expect(pageMythic).toContain('MYTHIC_TIERS');
  });
});
