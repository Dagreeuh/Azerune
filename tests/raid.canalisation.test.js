// Canalisation du Cœur — la seule mécanique du Raid dont la réponse n'est pas
// des dégâts.
//
// Mesuré : le Raid était une course contre le compteur de charges, et la
// réponse à une course est toujours plus de dégâts. Deux champions y valaient
// trois fois leur poids. Rien n'y demandait autre chose que de frapper fort.
//
// Le Prêtre canalise, devient intouchable, et seul un étourdissement
// l'interrompt. Sans contrôle dans l'équipe, la canalisation aboutit.
import{describe,it,expect,afterEach,vi}from'vitest';
import{RAIDS,createRaidMission,raidLevelData}from'../src/data/raids';
import{HEROES}from'../src/data/heroes';
import{createBattle,nextTurn,castSkill,finish,chooseAutoEnemyTarget}from'../src/battle/engine';
import{makeHero,statsFrom,findUnit,fixedRandom,giveTurnTo}from'./helpers';

afterEach(()=>vi.restoreAllMocks());

/** Un raid de niveau 6 ou plus, où la Canalisation existe. */
function raid(niveau=6,equipe=null){
  fixedRandom(.5);
  const heros=equipe||[0,1,2,3].map(index=>makeHero({id:9700+index,hp:30000,atk:60,def:0,
    spd:index?1:300,name:`A${index}`,
    skills:[{name:'Trait',icon:'✴️',cd:0,target:'enemy',description:'Frappe.',power:1,effect:'arcaneBlast'}]}));
  const mission=createRaidMission(RAIDS[0].id,niveau);
  let combat=createBattle(heros.map(hero=>hero.id),heros.map(hero=>({...hero,currentStars:6})),
    unite=>({...statsFrom(unite),accuracy:120,resistance:0}),
    {enemies:mission.enemies,enemyScale:mission.scale||1,
      raid:{...mission.raidData,level:mission.raidLevel}});
  return nextTurn(giveTurnTo(combat,heros[0].id));
}
const pretre=combat=>combat.enemies.find(unite=>unite.raidRole==='priest');
const lance=(combat,index,cible)=>{const sortie=castSkill(combat,index,cible);return sortie.battle||sortie};
/** Fait passer `n` actions de champion pour déclencher la machine d'état. */
function actions(combat,n,idActeur){
  for(let tour=0;tour<n;tour+=1)combat=finish(combat,idActeur,'action');
  return combat;
}

describe('déclaration au joueur',()=>{
  it('la mécanique n’existe qu’à partir du niveau 6',()=>{
    expect(raidLevelData('heartforge',5).channelFrom).toBe(null);
    expect(raidLevelData('heartforge',6).channelFrom).toBeGreaterThan(0);
  });

  it('elle est annoncée dans la liste des mécaniques du raid',()=>{
    const noms=raidLevelData('heartforge',6).mechanics.map(([nom])=>nom);
    expect(noms).toContain('Canalisation du Cœur');
  });

  it('l’annonce dit que seul un contrôle l’interrompt',()=>{
    const ligne=raidLevelData('heartforge',6).mechanics.find(([nom])=>nom==='Canalisation du Cœur');
    expect(ligne[1]).toMatch(/contrôle|étourdissement/i);
  });

  it('le dernier palier révèle toutes les mécaniques',()=>{
    const dix=raidLevelData('heartforge',10).mechanics.map(([nom])=>nom);
    expect(dix).toContain('Canalisation du Cœur');
    expect(dix).toContain('Incarnation du Brasier');
  });

  it('le combat porte les réglages de canalisation',()=>{
    const combat=raid(6);
    expect(combat.raidState.channelAt).toBeGreaterThan(0);
    expect(combat.raidState.channelActions).toBeGreaterThan(0);
    expect(combat.raidState.channeling).toBe(false);
  });

  it('au niveau 5, aucune canalisation ne se déclenche jamais',()=>{
    let combat=raid(5);
    combat=actions(combat,20,9700);
    expect(combat.raidState.channeling).toBe(false);
  });
});

describe('la canalisation rend le Prêtre intouchable',()=>{
  /** Amène le combat jusqu'au démarrage de la canalisation. */
  function enCanalisation(niveau=6){
    let combat=raid(niveau);
    combat=actions(combat,combat.raidState.channelAt,9700);
    return combat;
  }

  it('elle démarre après le nombre d’actions annoncé',()=>{
    const combat=enCanalisation();
    expect(combat.raidState.channeling).toBe(true);
    expect(combat.log.some(ligne=>/CANALISATION/.test(ligne))).toBe(true);
  });

  it('frapper le Prêtre pendant la canalisation ne lui retire rien',()=>{
    let combat=enCanalisation();
    combat=nextTurn(giveTurnTo(combat,9700));
    const identifiant=pretre(combat).id,avant=findUnit(combat,identifiant).hp;
    expect(findUnit(lance(combat,0,identifiant),identifiant).hp).toBe(avant);
  });

  it('les autres ennemis restent frappables',()=>{
    let combat=enCanalisation();
    combat=nextTurn(giveTurnTo(combat,9700));
    const boss=combat.enemies.find(unite=>unite.raidRole==='boss').id;
    const avant=findUnit(combat,boss).hp;
    expect(findUnit(lance(combat,0,boss),boss).hp).toBeLessThan(avant);
  });

  it('hors canalisation, le Prêtre encaisse normalement',()=>{
    let combat=raid(6);
    const identifiant=pretre(combat).id,avant=findUnit(combat,identifiant).hp;
    expect(findUnit(lance(combat,0,identifiant),identifiant).hp).toBeLessThan(avant);
  });
});

describe('seul un contrôle l’interrompt',()=>{
  function enCanalisation(){
    let combat=raid(6);
    return actions(combat,combat.raidState.channelAt,9700);
  }

  it('un étourdissement sur le Prêtre interrompt la canalisation',()=>{
    let combat=enCanalisation();
    const identifiant=pretre(combat).id;
    combat={...combat,enemies:combat.enemies.map(unite=>
      unite.id===identifiant?{...unite,debuffs:{...unite.debuffs,stun:{turns:1}}}:unite)};
    combat=finish(combat,9700,'action');
    expect(combat.raidState.channeling).toBe(false);
    expect(combat.raidState.channelsInterrupted).toBe(1);
    expect(combat.log.some(ligne=>/interrompue/.test(ligne))).toBe(true);
  });

  /** Canalisation en cours, Cœur volontairement presque vide. */
  function canalisationCoeurVide(){
    const combat=enCanalisation();
    return{...combat,raidState:{...combat.raidState,charges:0}};
  }

  it('sans interruption, elle fait bondir le Cœur de la moitié de sa capacité',()=>{
    let combat=canalisationCoeurVide();
    const maximum=combat.raidState.maxCharges;
    combat=actions(combat,combat.raidState.channelActions,9700);
    expect(combat.raidState.channelsCompleted).toBe(1);
    expect(combat.log.some(ligne=>/CANALISATION ABOUTIE/.test(ligne))).toBe(true);
    expect(combat.raidState.charges).toBeGreaterThanOrEqual(Math.ceil(maximum/2));
  });

  it('sur un Cœur déjà chargé, elle déclenche l’Éruption',()=>{
    // C'est la vraie sanction : la canalisation ne tue pas seule, elle avance
    // brutalement le compteur vers l'Éruption.
    let combat=enCanalisation();
    combat={...combat,raidState:{...combat.raidState,
      charges:combat.raidState.maxCharges-1}};
    const avant=combat.allies.reduce((total,unite)=>total+unite.hp,0);
    combat=actions(combat,combat.raidState.channelActions,9700);
    expect(combat.allies.reduce((total,unite)=>total+unite.hp,0)).toBeLessThan(avant);
    expect(combat.log.some(ligne=>/Éruption/i.test(ligne))).toBe(true);
  });

  it('interrompre ne fait pas qu’éviter la sanction : cela retire des charges',()=>{
    // Le controle devient un levier sur le Cœur incandescent, au meme titre que
    // tuer l'Élémentaire de braise.
    let combat=enCanalisation();
    combat={...combat,raidState:{...combat.raidState,charges:6}};
    const identifiant=pretre(combat).id;
    combat={...combat,enemies:combat.enemies.map(unite=>
      unite.id===identifiant?{...unite,debuffs:{stun:{turns:1}}}:unite)};
    combat=finish(combat,9700,'action');
    // +1 charge pour l'action, -3 pour l'interruption.
    expect(combat.raidState.charges).toBe(4);
    expect(combat.log.some(ligne=>/3 charges retirées/.test(ligne))).toBe(true);
  });

  it('les charges retirées ne descendent jamais sous zéro',()=>{
    let combat=enCanalisation();
    combat={...combat,raidState:{...combat.raidState,charges:0}};
    const identifiant=pretre(combat).id;
    combat={...combat,enemies:combat.enemies.map(unite=>
      unite.id===identifiant?{...unite,debuffs:{stun:{turns:1}}}:unite)};
    combat=finish(combat,9700,'action');
    expect(combat.raidState.charges).toBeGreaterThanOrEqual(0);
  });

  it('une canalisation aboutie rend des PV au boss',()=>{
    let combat=canalisationCoeurVide();
    const boss=combat.enemies.find(unite=>unite.raidRole==='boss').id;
    combat={...combat,enemies:combat.enemies.map(unite=>
      unite.id===boss?{...unite,hp:Math.round(unite.maxHp*.5)}:unite)};
    const avant=findUnit(combat,boss).hp;
    combat=actions(combat,combat.raidState.channelActions,9700);
    expect(findUnit(combat,boss).hp).toBeGreaterThan(avant);
  });

  it('une canalisation interrompue ne soigne pas le boss',()=>{
    let combat=canalisationCoeurVide();
    const boss=combat.enemies.find(unite=>unite.raidRole==='boss').id;
    const identifiant=pretre(combat).id;
    combat={...combat,enemies:combat.enemies.map(unite=>
      unite.id===boss?{...unite,hp:Math.round(unite.maxHp*.5)}
      :unite.id===identifiant?{...unite,debuffs:{stun:{turns:1}}}:unite)};
    const avant=findUnit(combat,boss).hp;
    combat=actions(combat,combat.raidState.channelActions+1,9700);
    expect(findUnit(combat,boss).hp).toBeLessThanOrEqual(avant);
  });

  it('tuer le Prêtre avant la canalisation la désamorce',()=>{
    let combat=raid(6);
    const identifiant=pretre(combat).id;
    combat={...combat,enemies:combat.enemies.map(unite=>
      unite.id===identifiant?{...unite,hp:0,dead:true}:unite)};
    combat=actions(combat,combat.raidState.channelAt+5,9700);
    expect(combat.raidState.channeling).toBe(false);
    expect(combat.raidState.channelsCompleted).toBe(0);
  });

  it('après une interruption, elle revient plus tard',()=>{
    let combat=enCanalisation();
    const identifiant=pretre(combat).id;
    combat={...combat,enemies:combat.enemies.map(unite=>
      unite.id===identifiant?{...unite,debuffs:{stun:{turns:1}}}:unite)};
    combat=finish(combat,9700,'action');
    const prochaine=combat.raidState.channelAt;
    expect(prochaine).toBeGreaterThan(combat.raidState.championActions);
  });

  it('les paliers élevés laissent moins de temps pour réagir',()=>{
    expect(raidLevelData('heartforge',9).channelActions)
      .toBeLessThan(raidLevelData('heartforge',6).channelActions);
  });
});

describe('le combat automatique sait répondre',()=>{
  /** Une équipe dont un champion peut étourdir : Brom, 3★. */
  function equipeAvecControle(){
    const brom=HEROES.find(hero=>hero.id===8);
    return[{...brom,id:8},...[1,2,3].map(index=>makeHero({id:9800+index,hp:30000,atk:60,def:0,spd:1,
      name:`A${index}`,skills:[{name:'Trait',icon:'✴️',cd:0,target:'enemy',description:'Frappe.',power:1,effect:'arcaneBlast'}]}))];
  }

  it('il envoie les contrôles sur le Prêtre qui canalise',()=>{
    let combat=raid(6,equipeAvecControle());
    combat=actions(combat,combat.raidState.channelAt,8);
    combat=nextTurn(giveTurnTo(combat,8));
    const acteur=findUnit(combat,8),arret=acteur.skills.find(skill=>skill.effect==='impactQuake');
    expect(chooseAutoEnemyTarget(combat,acteur,arret)?.id).toBe(pretre(combat).id);
  });

  it('il détourne les frappes ordinaires du Prêtre intouchable',()=>{
    let combat=raid(6,equipeAvecControle());
    combat=actions(combat,combat.raidState.channelAt,8);
    combat=nextTurn(giveTurnTo(combat,8));
    const acteur=findUnit(combat,8),frappe=acteur.skills[0];
    expect(chooseAutoEnemyTarget(combat,acteur,frappe)?.id).not.toBe(pretre(combat).id);
  });

  it('hors canalisation, il ne s’acharne pas sur le Prêtre',()=>{
    let combat=raid(6,equipeAvecControle());
    combat=nextTurn(giveTurnTo(combat,8));
    const acteur=findUnit(combat,8),arret=acteur.skills.find(skill=>skill.effect==='impactQuake');
    expect(chooseAutoEnemyTarget(combat,acteur,arret)?.id).not.toBe(pretre(combat).id);
  });
});
