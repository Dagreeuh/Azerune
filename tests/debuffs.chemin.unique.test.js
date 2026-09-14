import{describe,it,expect}from'vitest';
import fs from'node:fs';
import path from'node:path';
import{createBattle,castSkill,enemyAction,nextTurn}from'../src/battle/engine';
import{HEROES}from'../src/data/heroes';
import{makeEnemy,seedRandom,fixedRandom}from'./helpers';

const RACINE=path.resolve(__dirname,'..');
const moteur=fs.readFileSync(path.join(RACINE,'src/battle/engine.js'),'utf8');
const S={hp:9000,atk:600,def:200,spd:100,crit:0,critDamage:50,
  accuracy:40,resistance:0,setEffects:[],resonanceLevel:0};

const KAELEN=HEROES.find(h=>h.name==='Kaelen').id;
const combat=(options={})=>{
  const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
  const equipe=[KAELEN,...HEROES.filter(h=>h.id!==KAELEN).slice(0,2).map(h=>h.id)];
  const b=createBattle(equipe,heroes,()=>({...S}),{
    enemies:[makeEnemy({id:'e1',name:'E1',hp:90000,atk:1,def:50,spd:1,element:'Arcane'}),
             makeEnemy({id:'e2',name:'E2',hp:90000,atk:1,def:50,spd:1,element:'Arcane'})],
    ...options});
  return{...b,turn:KAELEN,allies:b.allies.map(u=>u.id===KAELEN?{...u,cooldowns:[0,0,0]}:u)};
};

describe('un seul chemin pour poser une altération',()=>{
  it('le moteur n’écrit plus aucun malus en direct',()=>{
    // C'est LA garantie structurelle du chantier : 28 écritures directes
    // sautaient la Volonté de fer, la durée de maîtrise, le modificateur
    // d'affinité et surtout le jet de résistance. Une seule qui réapparaît et
    // tout le raisonnement retombe.
    const directes=moteur.match(/\w+\.debuffs\.\w+\s*=[^=]/g)||[];
    expect(directes,`écritures directes : ${directes.join(', ')}`).toHaveLength(0);
  });

  it('toute écriture passe par l’écrivain central',()=>{
    expect(moteur).toMatch(/const ecrireDebuff=/);
    // Deux écritures indexées seulement : celle qui pose, celle qui met à
    // jour. Toutes deux dans un helper nommé, aucune ailleurs.
    const ecritures=moteur.match(/\.debuffs\[\w+\]\s*=/g)||[];
    expect(ecritures).toHaveLength(2);
    expect(moteur).toMatch(/const majDebuff=[\s\S]{0,220}\.debuffs\[key\]=/);
  });

  it('l’écrivain renseigne toujours la source et son attaque',()=>{
    // Un `burn` sans `sourceAtk` ne sait pas combien il doit infliger : les
    // écritures directes l'omettaient souvent.
    expect(moteur).toMatch(/target\.debuffs\[key\]=\{turns,source:actor\.id,sourceAtk:actor\.atk/);
  });
});

describe('Volonté de fer s’applique sur tous les chemins',()=>{
  it('bloque la Traque, qui était écrite en direct',()=>{
    // La règle de mission ne protégeait que les altérations passant par
    // `debuff()`. La désignation de Kaelen, écrite en direct, l'ignorait.
    fixedRandom(0);
    const b=combat({regle:{id:'resistance',name:'Volonté de fer'}});
    const apres=castSkill(b,1,b.enemies[0].id).battle;
    const cible=apres.enemies[0];
    expect(cible.debuffs.hunt,'la Traque a traversé la Volonté de fer').toBeUndefined();
  });

  it('ne fait pas planter le combat quand une désignation échoue',()=>{
    // Le journal lisait `chosen.debuffs.hunt.turns` en supposant la réussite.
    // Une fois la règle réellement appliquée, le combat plantait — et aucun
    // des 1 794 tests ne couvrait la règle ET la Traque ensemble.
    fixedRandom(0);
    const b=combat({regle:{id:'resistance',name:'Volonté de fer'}});
    const sortie=castSkill(b,1,b.enemies[0].id);
    expect(sortie.error).toBeFalsy();
    expect(String(sortie.battle.log?.[0]||'')).toMatch(/Volonté de fer|résiste/i);
  });

  it('couvre aussi la propagation de la clé Contagion',()=>{
    // La Contagion recopie une altération sur un voisin. Elle écrivait en
    // direct : la règle de mission ne s'y appliquait pas, et un mutant qui la
    // remettait en écriture directe ne cassait aucun test.
    expect(moteur).toMatch(/poserDebuff\(battle,actor,voisin,cle,/);
    const direct=moteur.match(/ecrireDebuff\([^;]*voisin/g)||[];
    expect(direct,'la Contagion écrit hors des règles').toHaveLength(0);
  });

  it('laisse passer la Traque sans la règle',()=>{
    fixedRandom(0);
    const apres=(()=>{const c=combat();return castSkill(c,1,c.enemies[0].id).battle})();
    expect(apres.enemies[0].debuffs.hunt).toBeTruthy();
  });
});

describe('la Résistance protège enfin des mécaniques de zone',()=>{
  // Elles étaient écrites en direct : elles tombaient à coup sûr, et les sets
  // d'équipement qui donnent de la Résistance ne servaient à rien contre elles.
  const subies=resistance=>{
    const heroes=HEROES.map(h=>({...h,currentStars:5}));
    const equipe=HEROES.slice(0,3).map(h=>h.id);
    let total=0;
    for(let graine=1;graine<=40;graine+=1){
      seedRandom(graine);
      let b=createBattle(equipe,heroes,()=>({...S,resistance}),{
        enemies:[makeEnemy({id:'e1',name:'Givre',hp:90000,atk:40,def:50,spd:400,
          element:'Eau',campaignZone:'couronne-givree',campaignMechanic:{name:'Gel'},
          campaignUnit:true,campaignDifficulty:'normal'})]});
      for(let i=0;i<6&&!b.winner;i+=1){
        b=nextTurn(b);
        if(String(b.turn).startsWith('e'))b=enemyAction(b);
      }
      total+=b.allies.filter(u=>u.debuffs?.slow||u.debuffs?.healingDown).length;
    }
    return total;
  };

  it('une équipe résistante subit moins d’altérations',()=>{
    const sans=subies(0),avec=subies(80);
    expect(avec,`sans ${sans}, avec ${avec}`).toBeLessThan(sans);
  });

  it('le jet est bien celui du moteur, pas une constante',()=>{
    expect(moteur).toMatch(/const CHANCE_MECANIQUE_ZONE=/);
    expect(moteur).toMatch(/tryDebuff\(actor,victim,'\w+',\d+,CHANCE_MECANIQUE_ZONE/);
  });
});

describe('mise à jour d’une altération déjà posée',()=>{
  it('ne retouche ni la durée ni la source',()=>{
    // Les écritures de Pourriture recalculaient `5+mastery.duration` juste
    // après que `debuff()` l'ait écrit : deux sources de vérité pour une même
    // durée, qui dérivent dès que l'une change.
    expect(moteur).toMatch(/const majDebuff=\(target,key,extra\)=>\{/);
    expect(moteur).toMatch(/target\.debuffs\[key\]=\{\.\.\.actuel,\.\.\.extra\}/);
    const maj=moteur.match(/majDebuff\([^;]*\)/g)||[];
    expect(maj.length).toBeGreaterThan(0);
    maj.forEach(appel=>
      expect(appel,`${appel} retouche la durée`).not.toMatch(/turns\s*:/));
  });

  it('ne crée rien si l’altération n’est pas là',()=>{
    expect(moteur).toMatch(/const actuel=target\?\.debuffs\?\.\[key\];\s*if\(!actuel\)return false/);
  });
});
