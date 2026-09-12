import{describe,it,expect}from'vitest';
import{chooseAutoEnemyTarget,POIDS_ACHEVEMENT,createBattle,nextTurn}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,findUnit}from'./helpers';

// Le ciblage automatique ne regardait que l'affinite puis l'ordre du tableau :
// aucun terme de PV. L'AUTO eparpillait ses degats au lieu d'achever, alors que
// tuer une unite retire definitivement sa part de degats.
// Mesure pres du seuil (Audit/mesures, bloc 6) : une simple focalisation sur
// l'ennemi le plus bas battait l'AUTO du jeu de 19,4 points a x1,05 de
// puissance. Apres correction, l'AUTO gagne 20,7 points et bat toutes les
// heuristiques testees.

/** Combat a trois ennemis dont on fixe les PV. */
const scene=(pv,element='Arcane')=>{
  const heros=makeHero({hp:5000,atk:200,def:20,spd:100,element:'Arcane',name:'A'});
  const combat=createBattle([heros.id],[heros],statsFrom,{
    enemies:pv.map((hp,i)=>makeEnemy({id:`e${i}`,name:`E${i}`,hp:4000,atk:30,def:10,spd:1,element}))
  });
  return{...combat,enemies:combat.enemies.map((unit,i)=>({...unit,hp:pv[i]})),
    allies:combat.allies.map(u=>({...u}))};
};
const acteur=combat=>combat.allies[0];
const frappe={effect:'plainStrike',target:'enemy',power:1};

describe('le ciblage automatique acheve au lieu d’eparpiller',()=>{
  it('a affinite egale, il vise l’ennemi le plus bas en PV',()=>{
    const combat=scene([3000,400,2500]);
    expect(chooseAutoEnemyTarget(combat,acteur(combat),frappe).name).toBe('E1');
  });

  it('il vise les PV absolus, pas le pourcentage',()=>{
    // Le colosse est a 9 % de ses PV, le fretin a 80 % des siens — mais le
    // fretin a moins de PV restants, donc il tombera le premier. C'est lui
    // qu'il faut achever.
    const heros=makeHero({hp:5000,atk:200,def:20,spd:100,element:'Arcane',name:'A'});
    const combat=createBattle([heros.id],[heros],statsFrom,{
      enemies:[makeEnemy({id:'c',name:'Colosse',hp:10000,atk:30,def:10,spd:1,element:'Arcane'}),
               makeEnemy({id:'f',name:'Fretin',hp:1000,atk:30,def:10,spd:1,element:'Arcane'})]
    });
    const blesses={...combat,enemies:combat.enemies.map((u,i)=>({...u,hp:i===0?900:800}))};
    expect(chooseAutoEnemyTarget(blesses,acteur(blesses),frappe).name).toBe('Fretin');
  });

  it('un cadavre ne fausse pas l’echelle d’achevement',()=>{
    // Si les morts entraient dans le calcul du plus bas, le bonus du blesse
    // fondrait et l'affinite reprendrait le dessus sur un ennemi intact.
    // Arcane bat l'Ombre et perd contre la Lumiere.
    const heros=makeHero({hp:5000,atk:200,def:20,spd:100,element:'Arcane',name:'A'});
    const combat=createBattle([heros.id],[heros],statsFrom,{
      enemies:[makeEnemy({id:'l',name:'Blessé',hp:9000,atk:30,def:10,spd:1,element:'Lumière'}),
               makeEnemy({id:'o',name:'Intact',hp:9000,atk:30,def:10,spd:1,element:'Ombre'}),
               makeEnemy({id:'m',name:'Cadavre',hp:9000,atk:30,def:10,spd:1,element:'Arcane'})]
    });
    const avecCadavre={...combat,enemies:combat.enemies.map((u,i)=>
      i===0?{...u,hp:3000}:i===1?{...u,hp:3600}:{...u,hp:0,dead:true})};
    expect(chooseAutoEnemyTarget(avecCadavre,acteur(avecCadavre),frappe).name).toBe('Blessé');
  });

  it('un ennemi intact n’est plus choisi juste parce qu’il est premier',()=>{
    const combat=scene([4000,4000,150]);
    expect(chooseAutoEnemyTarget(combat,acteur(combat),frappe).name).toBe('E2');
  });

  it('tous a egalite, il garde l’ordre d’origine',()=>{
    const combat=scene([4000,4000,4000]);
    expect(chooseAutoEnemyTarget(combat,acteur(combat),frappe).name).toBe('E0');
  });

  it('l’achevement pese plus qu’un rang d’affinite, mais pas deux',()=>{
    // Un rang d'affinite vaut 100 points dans le score de ciblage.
    expect(POIDS_ACHEVEMENT).toBeGreaterThan(100);
    expect(POIDS_ACHEVEMENT).toBeLessThan(200*2+1);
  });

  it('un ennemi mort n’est jamais choisi, meme a zero PV',()=>{
    const combat=scene([3000,2000,2500]);
    const avecMort={...combat,enemies:combat.enemies.map((u,i)=>i===1?{...u,hp:0,dead:true}:u)};
    const cible=chooseAutoEnemyTarget(avecMort,acteur(avecMort),frappe);
    expect(cible.dead).not.toBe(true);
  });
});

describe('les regles de Raid restent prioritaires sur l’achevement',()=>{
  it('hors canalisation, un controle n’est pas gaspille sur le Pretre',()=>{
    // Le Pretre est l'unite la plus fragile du Raid : sans cette regle,
    // l'achevement y enverrait justement le sort qu'il faut garder.
    const heros=makeHero({hp:5000,atk:200,def:20,spd:100,element:'Arcane',name:'A'});
    const combat=createBattle([heros.id],[heros],statsFrom,{
      enemies:[makeEnemy({id:'b',name:'Boss',hp:9000,atk:30,def:10,spd:1,element:'Arcane'}),
               makeEnemy({id:'p',name:'Prêtre',hp:9000,atk:30,def:10,spd:1,element:'Arcane'})]
    });
    const avecPretre={...combat,raidState:{channeling:false},
      enemies:combat.enemies.map((u,i)=>i===1?{...u,raidRole:'priest',hp:200}:u)};
    const arret={effect:'impactQuake',target:'enemy',power:1};
    expect(chooseAutoEnemyTarget(avecPretre,acteur(avecPretre),arret).name).toBe('Boss');
  });

  it('mais un sort ordinaire peut achever le Pretre',()=>{
    const heros=makeHero({hp:5000,atk:200,def:20,spd:100,element:'Arcane',name:'A'});
    const combat=createBattle([heros.id],[heros],statsFrom,{
      enemies:[makeEnemy({id:'b',name:'Boss',hp:9000,atk:30,def:10,spd:1,element:'Arcane'}),
               makeEnemy({id:'p',name:'Prêtre',hp:9000,atk:30,def:10,spd:1,element:'Arcane'})]
    });
    const avecPretre={...combat,raidState:{channeling:false},
      enemies:combat.enemies.map((u,i)=>i===1?{...u,raidRole:'priest',hp:200}:u)};
    expect(chooseAutoEnemyTarget(avecPretre,acteur(avecPretre),frappe).name).toBe('Prêtre');
  });
});
