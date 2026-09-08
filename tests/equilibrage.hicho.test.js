import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill}from'../src/battle/engine';
import{makeEnemy,fixedRandom}from'./helpers';

// Mesure (Audit/mesures, bloc 4) : Hicho, un 5★, ressortait 27e sur 30 avec
// trois sorts qui n'infligent aucun degat. Un combat est une course : un
// soutien qui ne fait que la prolonger ne pese rien. Ses totems galvanisent
// donc l'equipe en plus de la soigner, et il remonte a x1,54 (21e).
// Aucune statistique n'a ete touchee, et il reste un soigneur pur.
const HICHO=15;
const STATS={hp:9000,atk:700,def:200,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};
const poser=()=>{
  const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
  const b=createBattle([HICHO,1,19],heroes,()=>({...STATS}),
    {enemies:[makeEnemy({id:'e1',hp:400000,atk:1,def:100,spd:1,element:'Arcane'})]});
  return{...b,turn:HICHO,allies:b.allies.map(u=>u.id===HICHO?{...u,cooldowns:[0,0,0]}:u)};
};
const lancer=(b,i,cible)=>{fixedRandom(.5);const r=castSkill(b,i,cible);return r.battle||r};

describe('Hicho accelere la course au lieu de seulement la subir',()=>{
  it('la Vague de soins galvanise la cible en plus de la soigner',()=>{
    const avant=poser();
    const apres=lancer(avant,0,1);
    const soigne=apres.allies.find(u=>u.id===1);
    expect(soigne.buffs.atkUp,'la Vague de soins ne galvanise plus').toBeTruthy();
    expect(soigne.hp,'la Vague de soins ne soigne plus').toBeGreaterThan(0);
  });

  it('le Totem guerisseur galvanise toute l’equipe',()=>{
    const avant=poser();
    const apres=lancer(avant,1,HICHO);
    apres.allies.forEach(u=>expect(u.buffs.atkUp,`${u.name} n’est pas galvanisé`).toBeTruthy());
    apres.allies.forEach(u=>expect(u.buffs.healingTotem,`${u.name} n’a pas le totem`).toBeTruthy());
  });

  it('la galvanisation du Totem dure aussi longtemps que le Totem',()=>{
    const avant=poser();
    const apres=lancer(avant,1,HICHO);
    const u=apres.allies.find(x=>x.id===1);
    expect(u.buffs.atkUp.turns,'la galvanisation ne suit pas le Totem')
      .toBe(u.buffs.healingTotem.turns);
  });

  it('la Maree ancestrale accelere l’equipe en plus de la soigner',()=>{
    const avant=poser();
    const blesses={...avant,allies:avant.allies.map(u=>({...u,hp:Math.round(u.maxHp*.4)}))};
    const apres=lancer(blesses,2,HICHO);
    apres.allies.forEach(u=>expect(u.buffs.speedUp,`${u.name} n’est pas accéléré`).toBeTruthy());
    apres.allies.forEach(u=>expect(u.hp,`${u.name} n’a pas été soigné`).toBeGreaterThan(Math.round(u.maxHp*.4)));
  });

  it('il reste un soigneur : aucun de ses sorts n’inflige de degats',()=>{
    // Le correctif ne devait pas le transformer en attaquant.
    const hero=HEROES.find(h=>h.id===HICHO);
    hero.skills.forEach(s=>expect(s.power||0,s.name).toBe(0));
  });

  it('ses statistiques de base sont inchangees',()=>{
    const hero=HEROES.find(h=>h.id===HICHO);
    expect({hp:hero.hp,atk:hero.atk,def:hero.def,spd:hero.spd})
      .toEqual({hp:225,atk:30,def:18,spd:108});
  });
});

describe('Yunmei : un 4★ ne doit pas dominer tous les 5★',()=>{
  it('sa Paume de brume frappe comme un soutien, pas comme un attaquant',()=>{
    // Elle sortait 1re sur 30 a x0,93 quand le meilleur 5★ demandait x1,10.
    // Sa frappe sans recharge soignait ET infligeait des degats d'attaquant.
    const yunmei=HEROES.find(h=>h.name==='Yunmei');
    expect(yunmei.skills[0].power,'sa frappe est revenue à un niveau d’attaquant').toBe(.7);
    const attaquants=HEROES.filter(h=>h.rarity===4&&h.skills[0].cd===0&&h.skills[0].power>0);
    const median=attaquants.map(h=>h.skills[0].power).sort((a,b)=>a-b)[Math.floor(attaquants.length/2)];
    expect(yunmei.skills[0].power,'elle frappe plus fort que la médiane des 4★').toBeLessThanOrEqual(median);
  });

  it('sa resurrection reste intacte : c’est son identite',()=>{
    // Ressusciter est ce qui casse la spirale des morts, et c'est ce qui la
    // rend forte. On a baisse ses degats, pas ce qui fait d'elle Yunmei.
    const yunmei=HEROES.find(h=>h.name==='Yunmei');
    expect(yunmei.skills[2].effect).toBe('revival');
  });
});
