import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill,nextTurn}from'../src/battle/engine';
import{makeEnemy,fixedRandom}from'./helpers';

// Deux descriptions promettent un effet qui n'arrive PAS au lancer : la Graine
// de Sylven purifie « en danger », et la Pénitence de Lelianna soigne les alliés
// sous Expiation. La battue de tous les champions les signale forcément — ces
// tests sont la preuve que les deux promesses sont bien tenues, au bon moment.

const S={hp:12000,atk:700,def:220,spd:100,crit:0,critDamage:50,accuracy:60,
  resistance:0,setEffects:[],resonanceLevel:0};
const idDe=n=>HEROES.find(h=>h.name===n).id;
const poser=id=>{
  const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
  const autres=HEROES.filter(h=>h.id!==id).slice(0,2).map(h=>h.id);
  const b=createBattle([id,...autres],heroes,()=>({...S}),
    {enemies:[makeEnemy({id:'e1',hp:900000,atk:1,def:120,spd:1,element:'Arcane'})]});
  return{...b,turn:id,allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)};
};
const pret=(b,id)=>({...b,turn:id,allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)});
const lancer=(b,i,c)=>{fixedRandom(.5);const r=castSkill(b,i,c);return r.battle||r};

describe('Graine purifiante de Sylven',()=>{
  const scene=()=>{
    const id=idDe('Sylven');let b=poser(id);
    const allie=b.allies.find(u=>u.id!==id).id;
    b={...b,allies:b.allies.map(u=>u.id===allie
      ?{...u,debuffs:{poison:{turns:3},slow:{turns:3}}}:u)};
    return{b:lancer(b,1,allie),allie};
  };
  const malus=(b,id)=>Object.keys(b.allies.find(u=>u.id===id).debuffs||{});

  it('elle ne purifie pas au moment où on la pose',()=>{
    const{b,allie}=scene();
    expect(malus(b,allie),'la graine purifie trop tôt').toEqual(['poison','slow']);
  });

  it('elle attend vraiment le danger : en pleine forme, elle dort',()=>{
    // Sans cette borne, la graine deviendrait une purification immédiate à
    // chaque tour, et « en danger » ne voudrait plus rien dire.
    const{b,allie}=scene();
    const enForme={...b,turn:null,
      allies:b.allies.map(u=>u.id===allie?{...u,hp:Math.round(u.maxHp*.9),atb:100}:{...u,atb:0})};
    expect(malus(nextTurn(enForme),allie),'la graine éclot alors que l’allié va bien')
      .toEqual(['poison','slow']);
  });

  it('elle purifie quand l’allié tombe en danger',()=>{
    const{b,allie}=scene();
    const enDanger={...b,turn:null,
      allies:b.allies.map(u=>u.id===allie?{...u,hp:Math.round(u.maxHp*.3),atb:100}:{...u,atb:0})};
    expect(malus(nextTurn(enDanger),allie).length,'la graine n’a jamais purifié')
      .toBeLessThan(2);
  });

  it('elle soigne aussi en éclosant',()=>{
    const{b,allie}=scene();
    const bas=Math.round(b.allies.find(u=>u.id===allie).maxHp*.3);
    const enDanger={...b,turn:null,
      allies:b.allies.map(u=>u.id===allie?{...u,hp:bas,atb:100}:{...u,atb:0})};
    expect(nextTurn(enDanger).allies.find(u=>u.id===allie).hp).toBeGreaterThan(bas);
  });
});

describe('Pénitence de Lelianna',()=>{
  const id=()=>idDe('Lelianna');

  it('elle applique elle-même l’Expiation à toute l’équipe',()=>{
    // Elle exigeait l'Expiation posee a l'avance, donc soignait au mieux UN
    // allie — alors que son texte et son identite promettaient « chaque allie
    // sous Expiation ». C'est la Penitence qui la pose desormais.
    let b=poser(id());
    expect(b.allies.filter(u=>u.buffs?.atonement),'l’Expiation est déjà là').toHaveLength(0);
    const apres=lancer(b,2,b.enemies[0].id);
    expect(apres.allies.filter(u=>u.buffs?.atonement?.source===id()),
      'la Pénitence n’applique pas l’Expiation').toHaveLength(3);
  });

  it('c’est le Châtiment, lui, qui ne soigne personne sans Expiation',()=>{
    // La condition n'a pas disparu du kit : elle porte sur le sort de base.
    let b=poser(id());
    b={...b,allies:b.allies.map(u=>({...u,hp:Math.round(u.maxHp*.3)}))};
    const avant=b.allies.reduce((s,u)=>s+u.hp,0);
    const apres=lancer(b,0,b.enemies[0].id);
    expect(apres.allies.reduce((s,u)=>s+u.hp,0),'le Châtiment soigne sans Expiation').toBe(avant);
  });

  it('après la Pénitence, le Châtiment soigne toute l’équipe',()=>{
    // C'est la boucle reelle : l'ultime ouvre la fenetre, le sort de base
    // l'entretient tant que l'Expiation tient.
    let b=poser(id());
    b=lancer(b,2,b.enemies[0].id);
    b=pret(b,id());
    b={...b,allies:b.allies.map(u=>({...u,hp:Math.round(u.maxHp*.3)}))};
    const avant=b.allies.map(u=>({id:u.id,hp:u.hp}));
    const apres=lancer(b,0,b.enemies[0].id);
    apres.allies.forEach(u=>expect(u.hp,`${u.name} n’est pas soigné`)
      .toBeGreaterThan(avant.find(x=>x.id===u.id).hp));
  });

  it('elle soigne l’allié sous Expiation',()=>{
    let b=poser(id());
    const allie=b.allies.find(u=>u.id!==id()).id;
    b=lancer(b,1,allie);                 // Bouclier d'expiation : pose Expiation
    expect(Object.keys(b.allies.find(u=>u.id===allie).buffs||{}),'Expiation n’est pas posée')
      .toContain('atonement');
    b=pret(b,id());
    b={...b,allies:b.allies.map(u=>({...u,hp:Math.round(u.maxHp*.3)}))};
    const avant=b.allies.find(u=>u.id===allie).hp;
    const apres=lancer(b,2,b.enemies[0].id);
    expect(apres.allies.find(u=>u.id===allie).hp,'la Pénitence ne soigne pas l’Expiation')
      .toBeGreaterThan(avant);
  });
});
