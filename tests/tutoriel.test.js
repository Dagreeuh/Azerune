// Le tutoriel d'ouverture.
//
// Mesuré avant correction : deux écrans d'introduction, onze étapes guidées,
// puis un combat à finir seul. Les ennemis totalisaient 1 220 points de vie et
// 180 de bouclier, soit **quarante-neuf actions** pour en venir à bout — dont
// une quarantaine après la dernière consigne. La partie la plus longue du
// tutoriel était celle qui n'enseignait rien, et rien ne permettait de le
// passer.
import{describe,it,expect,afterEach,vi}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{TUTORIAL_STARTERS,TUTORIAL_ENEMIES,TUTORIAL_STATS,TUTORIAL_STEPS,
  resolveTutorialActor,resolveTutorialTarget}from'../src/data/tutorialBattle';
import{createBattle,castSkill,enemyAction,nextTurn,winner}from'../src/battle/engine';
import{mulberry32}from'./helpers';

const page=fs.readFileSync(fileURLToPath(new URL('../src/pages/TutorialPage.jsx',import.meta.url)),'utf8');

afterEach(()=>vi.restoreAllMocks());

/** Le combat du tutoriel, tel que la page le construit. */
function combatTutoriel(){
  const heroes=HEROES.filter(hero=>TUTORIAL_STARTERS.includes(hero.id))
    .map(hero=>({...hero,currentStars:hero.rarity,skillLevels:{0:1,1:1,2:1},uniqueWeapon:null}));
  const combat=createBattle(TUTORIAL_STARTERS,heroes,
    hero=>({...TUTORIAL_STATS[hero.id],setEffects:[],resonanceLevel:0}),
    {enemies:TUTORIAL_ENEMIES,enemyScale:1,tutorialBattle:{enabled:true,controlled:true,scenarioId:'test'}});
  combat.enemies=combat.enemies.map((unite,index)=>index===1?{...unite,shield:50,maxShield:50}:unite);
  return combat;
}

/** Actions du joueur nécessaires pour venir à bout du combat. */
function actionsPourFinir(){
  vi.spyOn(Math,'random').mockImplementation(mulberry32(7));
  let combat=combatTutoriel(),actions=0;
  for(let garde=0;garde<400;garde+=1){
    if(winner(combat.allies,combat.enemies))break;
    if(!combat.turn){combat=nextTurn(combat);continue}
    if(String(combat.turn).startsWith('e')){combat=enemyAction(combat);continue}
    const cible=combat.enemies.find(unite=>!unite.dead);
    if(!cible)break;
    const sortie=castSkill(combat,0,cible.id);
    if(sortie.error){combat=nextTurn(combat);continue}
    combat=sortie.battle;actions+=1;
  }
  return actions;
}

describe('longueur du tutoriel',()=>{
  it('il tient en six étapes guidées au plus',()=>{
    expect(TUTORIAL_STEPS.length).toBeLessThanOrEqual(6);
  });

  it('il demande au plus cinq actions guidées au joueur',()=>{
    // Les autres etapes sont une action ennemie ou un rappel a lire.
    expect(TUTORIAL_STEPS.filter(etape=>etape.type==='player').length).toBeLessThanOrEqual(5);
  });

  it('le combat entier se termine en une douzaine d’actions',()=>{
    // Il en fallait quarante-neuf. La borne haute protege contre un retour en
    // arriere sur les points de vie des ennemis.
    const actions=actionsPourFinir();
    expect(actions).toBeGreaterThan(4);
    expect(actions,`${actions} actions pour finir le tutoriel`).toBeLessThanOrEqual(14);
  });

  it('la partie libre qui suit les consignes reste courte',()=>{
    const guidees=TUTORIAL_STEPS.filter(etape=>etape.type==='player').length;
    expect(actionsPourFinir()-guidees).toBeLessThanOrEqual(9);
  });
});

describe('on peut le quitter',()=>{
  it('un bouton pour passer le tutoriel existe',()=>{
    expect(page).toContain('Passer le tutoriel');
  });

  it('il est proposé dès les écrans d’introduction',()=>{
    const intro=page.slice(page.indexOf('if(intro===0)'),page.indexOf('if(!battle)'));
    expect((intro.match(/BoutonPasser/g)||[]).length).toBeGreaterThanOrEqual(2);
  });

  it('il reste accessible pendant le combat, tant qu’il n’est pas gagné',()=>{
    expect(page).toContain("{!battle.winner&&<BoutonPasser");
  });

  it('passer conserve la récompense de bienvenue',()=>{
    // Le tutoriel est facultatif : le cadeau d'accueil n'est pas le paiement
    // d'une corvee.
    const saut=page.slice(page.indexOf('const passer='),page.indexOf('const BoutonPasser'));
    expect(saut).toContain('finish()');
    expect(page).toContain('const finish=()=>{completeTutorialReward()');
  });
});

describe('les étapes restent cohérentes',()=>{
  it('chaque étape désigne un acteur qui existe',()=>{
    const combat=combatTutoriel();
    TUTORIAL_STEPS.forEach((etape,index)=>{
      const acteur=resolveTutorialActor(etape,combat);
      if(etape.type==='affinity')return;
      expect(acteur,`étape ${index+1} · ${etape.title}`).toBeTruthy();
      expect([...combat.allies,...combat.enemies].some(unite=>unite.id===acteur)).toBe(true);
    });
  });

  it('chaque cible désignée existe elle aussi',()=>{
    const combat=combatTutoriel();
    TUTORIAL_STEPS.filter(etape=>etape.targetId!=null).forEach(etape=>{
      const cible=resolveTutorialTarget(etape,combat);
      expect(cible,`${etape.title}`).toBeTruthy();
      expect([...combat.allies,...combat.enemies].some(unite=>unite.id===cible)).toBe(true);
    });
  });

  it('aucune étape n’exige une compétence verrouillée',()=>{
    // Le troisieme sort demande 4★ en jeu normal : le tutoriel ne s'appuie plus
    // sur cette exception, qu'il fallait expliquer au joueur avant qu'il ait
    // compris les deux premieres.
    TUTORIAL_STEPS.forEach(etape=>{
      if(etape.skillIndex==null)return;
      expect(etape.skillIndex,`${etape.title}`).toBeLessThan(2);
    });
  });

  it('chaque étape porte un titre et une consigne',()=>{
    TUTORIAL_STEPS.forEach((etape,index)=>{
      expect(etape.title,`étape ${index+1}`).toBeTruthy();
      expect(etape.text,`étape ${index+1}`).toBeTruthy();
    });
  });

  it('il enseigne bien attaquer, protéger, soigner et les affinités',()=>{
    const types=TUTORIAL_STEPS.map(etape=>etape.type);
    expect(types).toContain('player');
    expect(types).toContain('enemy');
    expect(types).toContain('affinity');
    const titres=TUTORIAL_STEPS.map(etape=>etape.title).join(' ');
    expect(titres).toMatch(/Attaquer/i);
    expect(titres).toMatch(/Protéger/i);
    expect(titres).toMatch(/Soigner/i);
  });
});
