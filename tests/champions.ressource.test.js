import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{championIdentity}from'../src/data/championIdentities';
import{createBattle,castSkill}from'../src/battle/engine';
import{mulberry32}from'./helpers';

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const page=lire('../src/pages/BattlePage.jsx');
const moteur=lire('../src/battle/engine.js');
const STATS={hp:9000,atk:900,def:300,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};

describe('la barre de ressource ne ment plus',()=>{
  // Yunmei affichait « Aucune 0/5 » : la barre etait un repli generique, servi
  // a tout champion sans mecanique speciale, et rien ne l'incrementait jamais.
  // L'identite disait pourtant deja `resource: 'Aucune'`.
  it('l’écran masque la barre quand l’identité annonce « Aucune »',()=>{
    expect(page).toContain("championIdentity(unit).resource==='Aucune'?null:");
  });

  it('les champions sans ressource sont bien déclarés ainsi',()=>{
    ['Yunmei','Aszhal','Ragnhild'].forEach(nom=>{
      const hero=HEROES.find(entry=>entry.name===nom);
      expect(championIdentity(hero).resource,nom).toBe('Aucune');
    });
  });

  it('un champion à ressource garde la sienne',()=>{
    ['Vexil','Nyxaris','Vharok','Korga'].forEach(nom=>{
      const hero=HEROES.find(entry=>entry.name===nom);
      expect(championIdentity(hero).resource,nom).not.toBe('Aucune');
    });
  });

  it('chaque champion déclare une ressource, ne serait-ce que « Aucune »',()=>{
    // Sans valeur, l'ecran afficherait une barre vide sans titre.
    HEROES.forEach(hero=>expect(championIdentity(hero).resource,hero.name).toBeTruthy());
  });
});

describe('les renforts portent leur nom',()=>{
  // Prescience, Puissance d'ebene et Souffle des eons posent tous le meme buff
  // `damageUp`. La pastille affichait « Dégâts + » pour les trois : en regardant
  // Aszhal, on ne voyait donc jamais Prescience s'appliquer — d'autant qu'elle
  // se pose sur un AUTRE champion.
  const lancer=(heroId,index)=>{
    const vrai=Math.random;Math.random=mulberry32(5);
    try{
      const heroes=HEROES.map(hero=>({...hero,currentStars:6,skillLevels:{0:1,1:1,2:1}}));
      let battle=createBattle([heroId,20,19],heroes,()=>({...STATS}),
        {enemies:[{name:'C',icon:'x',hp:99999,atk:1,def:200,spd:1,accuracy:0,resistance:0,element:'Feu'}]});
      battle={...battle,turn:heroId};
      battle.allies=battle.allies.map(unit=>unit.id===heroId?{...unit,cooldowns:[0,0,0]}:unit);
      const cible=index===0?battle.enemies[0].id:battle.allies[1].id;
      const sortie=castSkill(battle,index,cible);
      return sortie.battle||sortie;
    }finally{Math.random=vrai}
  };

  it('Prescience s’applique bien, et à un autre champion',()=>{
    const apres=lancer(35,0);
    const aszhal=apres.allies.find(unit=>unit.id===35);
    const porteurs=apres.allies.filter(unit=>unit.buffs?.damageUp);
    expect(porteurs.length,'aucun allié ne reçoit Prescience').toBe(1);
    expect(porteurs[0].id,'Aszhal se buffe lui-même').not.toBe(35);
    expect(aszhal.buffs?.damageUp).toBeUndefined();
    expect(porteurs[0].buffs.damageUp.label).toBe('Prescience');
    expect(porteurs[0].buffs.damageUp.power).toBeGreaterThan(0);
  });

  it('les trois sources de « Dégâts + » se distinguent',()=>{
    const noms=new Set();
    [[35,0],[35,1],[35,2]].forEach(([heroId,index])=>{
      lancer(heroId,index).allies.forEach(unit=>{
        if(unit.buffs?.damageUp?.label)noms.add(unit.buffs.damageUp.label);
      });
    });
    expect([...noms].sort()).toEqual(['Prescience','Puissance d’ébène','Souffle des éons']);
  });

  it('tout buff damageUp posé par le moteur porte un nom',()=>{
    // Un buff sans libelle retomberait sur le generique « Dégâts + », et le
    // joueur ne saurait plus lequel des trois sorts l'a pose.
    const poses=[...moteur.matchAll(/buffs\.damageUp=\{([^}]*)\}/g)].map(entree=>entree[1]);
    expect(poses.length,'aucune pose de damageUp trouvée dans le moteur').toBeGreaterThanOrEqual(3);
    poses.forEach(corps=>expect(corps,`damageUp sans label : ${corps}`).toContain('label:'));
  });

  it('la pastille affiche le nom du buff quand il en porte un',()=>{
    expect(page).toContain('const nom=value.label||meta.label;');
  });
});
