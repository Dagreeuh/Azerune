import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{COMBAT_SPEEDS,AUTO_BASE_DELAY,autoDelay,enemyDelay,vfxParDefaut}from'../src/pages/BattlePage';
import{SWEEP_DAILY_LIMIT}from'../src/store/GameContext';

// GameContext est un composant React : on ne peut pas le rendre ici. Le projet
// verifie donc ses contrats sur le texte source, comme ailleurs dans la suite.
const contexte=fs.readFileSync(fileURLToPath(new URL('../src/store/GameContext.jsx',import.meta.url)),'utf8');
const campagne=fs.readFileSync(fileURLToPath(new URL('../src/pages/CampaignPage.jsx',import.meta.url)),'utf8');

describe('Balayage : la meme recolte, sans le combat',()=>{
  it('le combat rejoue et le balayage passent par la meme fonction de recolte',()=>{
    // S'ils divergeaient, balayer deviendrait un choix d'optimisation au lieu
    // d'un confort — c'est tout ce qu'on veut eviter.
    const appels=contexte.match(/recolteDeFarm\(/g)||[];
    expect(appels.length,'la recolte de farm n’est plus partagée').toBe(2);
    expect(contexte,'le combat rejoué n’utilise plus la recolte partagée')
      .toContain('if(!improved)return recolteDeFarm(mission,previous,xpResult);');
    expect(contexte,'le balayage n’utilise plus la recolte partagée')
      .toMatch(/return\{\.\.\.recolteDeFarm\(mission,previous,xpResult\),sweep:true/);
  });

  it('on ne balaye qu’une mission maitrisee a trois etoiles',()=>{
    expect(contexte).toMatch(/canSweep=mission=>[^;]*campaign\.scores\[mission\.key\]\|\|0\)>=3/);
  });

  it('les autres modes ne se balayent pas',()=>{
    const ligne=contexte.match(/const canSweep=mission=>[^;]+;/)[0];
    ['raid','mythic','expedition','worldBoss'].forEach(mode=>
      expect(ligne,`${mode} est balayable`).toContain(`!mission.${mode}`));
  });

  it('le balayage est borne a la journee',()=>{
    expect(SWEEP_DAILY_LIMIT).toBeGreaterThan(0);
    expect(contexte,'la limite quotidienne n’est plus vérifiée')
      .toContain('const sweepsLeft=()=>Math.max(0,SWEEP_DAILY_LIMIT-Number(daily.sweeps||0));');
    expect(contexte,'le compteur du jour n’est plus incrémenté')
      .toMatch(/setDaily\(current=>\(\{\.\.\.current,sweeps:Number\(current\.sweeps\|\|0\)\+1\}\)\)/);
    expect(contexte,'canSweep ne consulte plus le quota').toMatch(/canSweep=mission=>[^;]*sweepsLeft\(\)>0/);
  });

  it('le compteur du jour repart a zero avec la journee',()=>{
    expect(contexte).toMatch(/const freshDaily=\(\)=>\(\{[\s\S]*?sweeps:0\}\);/);
  });

  it('le bouton n’apparait que sur une mission balayable',()=>{
    expect(campagne).toContain('{canSweep(mission)&&<button className="sweep-button"');
  });
});

describe('Vitesse du combat automatique',()=>{
  it('le delai de base reste celui d’origine a x1',()=>{
    expect(autoDelay(1)).toBe(AUTO_BASE_DELAY);
  });

  it('chaque palier divise reellement le delai',()=>{
    COMBAT_SPEEDS.forEach(v=>expect(autoDelay(v),`x${v}`).toBe(Math.round(AUTO_BASE_DELAY/v)));
    expect(autoDelay(3)).toBeLessThan(autoDelay(2));
    expect(autoDelay(2)).toBeLessThan(autoDelay(1));
  });

  it('une vitesse inconnue retombe sur x1 plutot que de casser la boucle',()=>{
    [0,-1,7,null,undefined,'2'].forEach(v=>expect(autoDelay(v),String(v)).toBe(AUTO_BASE_DELAY));
  });

  it('la boucle AUTO utilise bien le delai reglable',()=>{
    const page=fs.readFileSync(fileURLToPath(new URL('../src/pages/BattlePage.jsx',import.meta.url)),'utf8');
    expect(page,'la boucle AUTO est restée sur un délai fixe').toContain('timer=window.setTimeout(jouer,autoDelay(speed));');
    expect(page,'un changement de vitesse ne relance pas la boucle')
      .toContain('autoSkillPriorities,speed,relanceAuto]);');
  });

  it('le tour ennemi suit la vitesse choisie, avec un plancher lisible',()=>{
    // Il restait fige a 480 ms : en x3 l'escouade jouait trois fois plus vite
    // que l'adversaire et le combat avancait par a-coups.
    expect(enemyDelay(1)).toBe(480);
    expect(enemyDelay(2)).toBe(240);
    expect(enemyDelay(3)).toBe(160);
    expect(enemyDelay(99),'une vitesse inconnue retombe sur x1').toBe(480);
    COMBAT_SPEEDS.forEach(v=>expect(enemyDelay(v),`x${v} passe sous le plancher`).toBeGreaterThanOrEqual(150));
    // Definir la fonction ne suffit pas : un mutant qui remettait 480 en dur
    // sur le site d'appel survivait a tous les tests ci-dessus.
    const page=fs.readFileSync(fileURLToPath(new URL('../src/pages/BattlePage.jsx',import.meta.url)),'utf8');
    expect(page,'le tour ennemi est resté sur un délai fixe')
      .toContain("runEnemyAction('normal'),enemyDelay(speed))");
    expect(page,'un changement de vitesse ne relance pas le tour ennemi')
      .toContain('},[battle?.turn,battle?.winner,speed]);');
  });

  it('deux tapes rapides sur la vitesse comptent bien pour deux',()=>{
    // `cycleSpeed` lisait `speed` dans sa fermeture : deux clics dans le meme
    // lot React repartaient tous les deux de la meme valeur, et x1 n'allait
    // jamais qu'a x2.
    const page=fs.readFileSync(fileURLToPath(new URL('../src/pages/BattlePage.jsx',import.meta.url)),'utf8');
    expect(page,'cycleSpeed lit encore une valeur figée').toContain('const cycleSpeed=()=>setSpeed(courante=>{');
    expect(page).toContain('COMBAT_SPEEDS.indexOf(courante)');
  });

  it('la boucle AUTO se réarme au lieu d’abandonner le tour',()=>{
    // Mesure avant correctif : six combats geles sur huit en vitesse x2, AUTO
    // affiche « ACTIF » et un allie fige a 100 % de jauge. La garde faisait un
    // `return` sec ; aucune action n'etant jouee, `battle.turn` ne changeait
    // pas, donc l'effet ne se rejouait jamais et son minuteur restait orphelin.
    const page=fs.readFileSync(fileURLToPath(new URL('../src/pages/BattlePage.jsx',import.meta.url)),'utf8');
    const debut=page.indexOf('const jouer=()=>{');
    expect(debut,'la boucle AUTO n’a plus de fonction réarmable').toBeGreaterThan(0);
    const corps=page.slice(debut,page.indexOf('timer=window.setTimeout(jouer,autoDelay(speed));',debut));
    expect(corps,'la garde abandonne encore le tour')
      .toContain('{timer=window.setTimeout(jouer,90);return}');
    expect(corps,'la garde ne doit jamais renoncer sans repousser')
      .not.toMatch(/autoActionLock\.current\)return;(?!\s*\{)/);
    // Le watchdog doit pouvoir forcer la relance : il relance parfois sur le
    // MEME acteur, et `battle.turn` ne suffit donc pas a reveiller l'effet.
    expect(page,'le watchdog ne peut pas relancer la boucle').toContain('setRelanceAuto(valeur=>valeur+1);');
  });
});
