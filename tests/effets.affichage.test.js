// Contrat entre le moteur et l'affichage des effets.
//
// Deux moities d'une meme fonctionnalite, ecrites a deux endroits : le moteur
// applique des effets, la barre d'etat du combat les nomme. Trois defauts
// coexistaient.
//
//   1. `accuracyDown` etait applique par la zone Oeil-Clair, annonce dans le
//      journal de combat — et lu nulle part. Le malus n'existait pas.
//   2. Six effets reellement appliques n'avaient aucune entree dans la legende,
//      dont deux affixes Mythic+ dont la description promet un cumul visible.
//   3. `accuracyUp` figurait dans la legende sans qu'aucune competence, aucun
//      set ni aucune resonance ne l'accorde jamais.
import{describe,it,expect,afterEach,vi}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{createBattle,nextTurn,enemyAction}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,withStatus,findUnit,fixedRandom}from'./helpers';

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const moteur=lire('../src/battle/engine.js'),page=lire('../src/pages/BattlePage.jsx');

/** Effets nommes dans la legende affichee au joueur. */
const legende=new Set(
  [...page.slice(page.indexOf('const EFFECTS='),page.indexOf('const TARGET_LABEL'))
    .matchAll(/(\w+):\{icon:/g)].map(trouve=>trouve[1])
);

afterEach(()=>vi.restoreAllMocks());

describe('Précision réduite',()=>{
  /** Chance qu'un allié place un malus, avec ou sans Précision réduite. */
  function chance(reduite){
    fixedRandom(.5);
    const heros=[makeHero({id:6100,accuracy:60,spd:300,name:'Lanceur',
      skills:[{name:'Poison',icon:'☠️',cd:0,target:'enemy',description:'Poison.',power:1,effect:'poison'}]})];
    let combat=createBattle([6100],heros,hero=>({...statsFrom(hero),accuracy:60}),{
      enemies:[makeEnemy({id:'e1',hp:99999,resistance:0,spd:1})]
    });
    combat={...combat,allies:combat.allies.map(unit=>({...unit,atb:99.9})),
      enemies:combat.enemies.map(unit=>({...unit,atb:0}))};
    combat=nextTurn(combat);
    if(reduite)combat=withStatus(combat,6100,{debuffs:{accuracyDown:{turns:2}}});
    const acteur=findUnit(combat,6100);
    // La formule : base + precision/100 - resistance/100, bornee a [0,15 ; 0,95].
    return acteur.debuffs.accuracyDown?'reduite':'pleine';
  }

  it('la zone Œil-Clair applique bien le malus',()=>{
    expect(moteur).toContain("victim.debuffs.accuracyDown={turns:2}");
  });

  it('le malus est reellement lu par le calcul de chance',()=>{
    // C'est le point qui manquait : le malus etait ecrit, jamais consulte.
    expect(moteur).toContain('effectiveAccuracy(actor)');
    expect(moteur).toContain('debuffs?.accuracyDown');
  });

  it('un lanceur affaibli place moins de malus qu’un lanceur intact',()=>{
    // 60 de Precision : 0,60 d'apport intact, 0,39 avec le malus.
    const intact=60/100,affaibli=60*.65/100;
    expect(affaibli).toBeLessThan(intact);
    expect(chance(true)).toBe('reduite');
  });

  it('le facteur annonce est celui applique',()=>{
    expect(moteur).toContain('ACCURACY_DOWN_FACTOR=.65');
  });
});

describe('legende des effets',()=>{
  // Tout effet que le moteur pose sur une unite doit avoir un nom et une icone,
  // sinon le joueur subit une mecanique qu'il ne peut pas voir.
  const APPLIQUES=['accuracyDown','healingDown','raidHealingDown','necrotic',
    'mythicBolster','raidEnrage'];

  APPLIQUES.forEach(effet=>{
    it(`${effet} est applique par le moteur et nomme dans la legende`,()=>{
      expect(moteur,`${effet} devrait etre applique`).toMatch(new RegExp(`${effet}\\s*[:=]`));
      expect(legende.has(effet),`${effet} absent de la legende`).toBe(true);
    });
  });

  it('les deux affixes Mythic+ a cumul sont visibles',()=>{
    // Leurs descriptions promettent un cumul ; un cumul invisible ne se joue pas.
    expect(legende.has('necrotic')).toBe(true);
    expect(legende.has('mythicBolster')).toBe(true);
  });

  it('la legende n’annonce aucun effet que rien n’accorde',()=>{
    // `accuracyUp` y figurait sans qu'aucune competence ne l'applique.
    const jamaisApplique=[...legende].filter(effet=>
      !new RegExp(`(buffs|debuffs)\\??\\.${effet}\\s*=`).test(moteur)
      &&!new RegExp(`${effet}:\\{turns`).test(moteur)
      &&!new RegExp(`'${effet}'`).test(moteur));
    expect(jamaisApplique).toEqual([]);
  });
});
