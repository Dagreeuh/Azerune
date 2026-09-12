import{describe,it,expect,afterEach,vi}from'vitest';
import{CAMPAIGN_MECHANICS,CONTINENTS,DIFFICULTIES,createMission}from'../src/data/campaign';
import{createBattle,nextTurn,enemyAction}from'../src/battle/engine';
import{makeHero,statsFrom,fixedRandom}from'./helpers';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
const moteur=fs.readFileSync(fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8');

// `actor` provient du combat reçu : le muter n'apparaît pas dans l'état
// renvoyé — le moteur le dit lui-même en commentaire. Cinq mécaniques
// annoncées écrivaient pourtant sur `actor` : elles infligeaient bien leurs
// dégâts, mais leur renforcement ou leur soin disparaissait à chaque tour.

afterEach(()=>vi.restoreAllMocks());

/** Combat de campagne dans la zone demandée, l'ennemi choisi prêt à agir. */
const scene=(zoneId,{pvEnnemi=1}={})=>{
  fixedRandom(.5);
  const zone=CONTINENTS.find(z=>z.id===zoneId);
  expect(zone,`zone ${zoneId} introuvable`).toBeTruthy();
  const mission=createMission(DIFFICULTIES[0],zone,zone.stages[3]);
  const equipe=[makeHero({id:9300,hp:400000,atk:10,def:60,spd:1,name:'A0',element:'Arcane'})];
  const b=createBattle([9300],equipe.map(h=>({...h,currentStars:6})),
    u=>({...statsFrom(u),accuracy:60,resistance:0}),{enemies:mission.enemies});
  return{...b,turn:null,
    allies:b.allies.map(u=>({...u,atb:0})),
    enemies:b.enemies.map((u,i)=>i===0
      ?{...u,atb:100,hp:Math.max(1,Math.round(u.maxHp*pvEnnemi)),cooldowns:[0,0,0],enemyTurnCount:1}
      :{...u,atb:0})};
};
const jouer=b=>enemyAction(nextTurn(b));
const acteur=b=>b.enemies[0];

describe('les mécaniques de zone laissent vraiment une trace',()=>{
  it('Khaz-Drum — la Surchauffe fait monter l’Attaque',()=>{
    expect(CAMPAIGN_MECHANICS.khazdrum.summary).toMatch(/Attaque/i);
    expect(acteur(jouer(scene('khazdrum'))).buffs?.atkUp,'la Surchauffe ne monte pas').toBeTruthy();
  });

  it('Crypte Sanglante — la Soif carmine rend vraiment des PV',()=>{
    expect(CAMPAIGN_MECHANICS['crypte-sanglante'].summary).toMatch(/récupèrent/i);
    const avant=scene('crypte-sanglante',{pvEnnemi:.5});
    const pvAvant=acteur(avant).hp;
    expect(acteur(jouer(avant)).hp,'la Soif carmine ne soigne pas').toBeGreaterThan(pvAvant);
  });

  it('une zone sans renforcement ne renforce personne : le témoin tient',()=>{
    // Sans ce témoin, un bug qui renforcerait tout le monde passerait.
    expect(acteur(jouer(scene('valebrume'))).buffs?.atkUp).toBeFalsy();
  });
});

describe('chaque zone annonce une mécanique au joueur',()=>{
  it('les dix zones jouables ont un texte, un boss décrit et du code moteur',()=>{
    CONTINENTS.forEach(z=>{
      const meca=CAMPAIGN_MECHANICS[z.id];
      expect(meca,`${z.name} n’a pas de mécanique`).toBeTruthy();
      expect(meca.summary.length,z.name).toBeGreaterThan(15);
      expect(meca.boss.length,z.name).toBeGreaterThan(15);
      expect(moteur.includes(`'${z.id}'`),`${z.name} n’a aucun traitement dans le moteur`).toBe(true);
    });
  });

  it('les mécaniques en réserve sont signalées comme telles',()=>{
    // Six mécaniques sont déclarées pour des zones qui n'existent pas encore,
    // et cinq ont déjà leur code moteur. Ce n'est pas un bug — c'est du
    // contenu en attente — mais il vaut mieux que ce soit écrit quelque part
    // que découvert en croyant à une mécanique cassée.
    const jouables=new Set(CONTINENTS.map(z=>z.id));
    const reserve=Object.keys(CAMPAIGN_MECHANICS).filter(id=>!jouables.has(id));
    expect(reserve.sort()).toEqual(['chambre-echos','couronne-givree','fournaise-incendiaire',
      'netherys','rempart-anciens','trone-volcan']);
  });
});
