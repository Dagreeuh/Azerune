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

describe('les ressources portées par l’ennemi se lisent sur l’ennemi',()=>{
  // Virulence et Givre ne sont pas des compteurs personnels : ce sont des cumuls
  // de malus poses sur la cible. Leur barre lisait pourtant `mechanic.value`,
  // reste a zero pour toujours — la ressource existait, elle etait lue au
  // mauvais endroit.
  it('l’écran lit les cumuls portés par les ennemis',()=>{
    expect(page).toContain("enemyStacks=cle=>livingEnemies.map");
    expect(page).toContain("enemyStacks('virulence')");
    expect(page).toContain("enemyStacks('frost')");
  });

  it('les deux panneaux sont réellement branchés sur leur champion',()=>{
    // Verifier la seule presence du nom de classe laisserait passer un panneau
    // desactive : la classe survit dans la branche morte.
    expect(page).toContain('isMalvek?<div className={`champion-resource malvek-virulence');
    expect(page).toContain('isSivrane?<div className={`champion-resource sivrane-frost');
    expect(page).toMatch(/isMalvek=unit\.id===22\|\|unit\.skills\?\.some/);
    expect(page).toMatch(/isSivrane=unit\.id===33\|\|unit\.skills\?\.some/);
    expect(page).toContain('Aucune cible infectée');
    expect(page).toContain('Aucune cible givrée');
  });

  it('les clés de malus lues sont celles que le moteur pose',()=>{
    // Une cle mal orthographiee afficherait « Aucune cible » pour toujours,
    // sans erreur ni message.
    expect(moteur).toMatch(/debuffs\.virulence=\{/);
    expect(moteur).toMatch(/debuffs\.frost=\{/);
  });

  it('le plafond et le seuil affichés sont ceux du moteur',()=>{
    // Deux nombres differents, qu'il ne faut pas confondre : le Givre plafonne
    // a 5 cumuls, mais la Brisure ne fige qu'a partir de 3. Afficher « /3 »
    // aurait produit « 4/3 » des le quatrieme cumul.
    expect(moteur,'plafond de Givre').toContain('stacks:Math.min(5,(x.debuffs.frost?.stacks||0)+1)');
    expect(moteur,'seuil de Brisure').toContain("if(cumuls>=3)debuff(chosen,'stun'");
    expect(page).toContain('/5 · ');
    expect(page).toContain('BRISURE PRÊTE');
    expect(page).not.toContain('/3 · ');
  });

  it('Seraphiel garde son compteur personnel',()=>{
    // Sa Condamnation monte bien sur lui : Dissipation sacree l'incremente
    // quand elle retire des ameliorations ennemies. Elle n'avait pas a etre
    // deplacee — mon premier releve la croyait morte parce que les ennemis de
    // test ne portaient aucune amelioration a dissiper.
    const bloc=moteur.slice(moteur.indexOf("if(e==='condemnStrip'){"));
    expect(bloc.slice(0,600)).toContain('m.value=Math.min(6,(m.value||0)+gained)');
    expect(page).not.toContain("enemyStacks('condemn')");
  });
});
