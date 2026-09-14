import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{resonanceIdentityBonus}from'../src/data/championIdentities';
import{createBattle,castSkill}from'../src/battle/engine';
import{makeEnemy,fixedRandom}from'./helpers';

// Audit de tous les champions (Audit/mesures/audit-champions.test.js) :
// trois champions promettaient une amélioration à Résonance IV que le moteur
// n'appliquait nulle part. Le joueur payait des cristaux et des Âmes
// universelles pour un texte sans effet.

const S=r=>({hp:12000,atk:700,def:220,spd:100,crit:0,critDamage:50,accuracy:60,
  resistance:0,setEffects:[],resonanceLevel:r});
const idDe=n=>HEROES.find(h=>h.name===n).id;
const poser=(id,r)=>{
  const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
  const autres=HEROES.filter(h=>h.id!==id).slice(0,2).map(h=>h.id);
  const b=createBattle([id,...autres],heroes,()=>S(r),
    {enemies:[makeEnemy({id:'e1',hp:900000,atk:1,def:120,spd:1,element:'Arcane'})]});
  return{...b,turn:id,allies:b.allies.map(u=>u.id===id
    ?{...u,cooldowns:[0,0,0]}:{...u,hp:Math.round(u.maxHp*.15)})};
};
const pret=(b,id)=>({...b,turn:id,allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)});
const lancer=(b,i,c)=>{fixedRandom(.5);const r=castSkill(b,i,c);return r.battle||r};
const pv=b=>b.allies.reduce((s,u)=>s+u.hp,0);

describe('Résonance IV : ce qui est promis doit se produire',()=>{
  it('Aurelis — l’Égide de secours accorde un bouclier plus grand',()=>{
    const mesure=r=>{const id=idDe('Aurelis');
      const b=lancer(poser(id,r),1,poser(id,r).allies.find(u=>u.id!==id).id);
      return b.allies.reduce((s,u)=>s+(u.shield||0),0);};
    expect(mesure(0),'aucun bouclier de référence, la mesure ne prouve rien').toBeGreaterThan(0);
    expect(mesure(4),'la Résonance IV d’Aurelis ne fait rien').toBeGreaterThan(mesure(0));
  });

  it('Elowen — le Jardin vivant soigne davantage',()=>{
    const mesure=r=>{const id=idDe('Elowen');const b=poser(id,r);
      const avant=pv(b);return pv(lancer(b,1,id))-avant;};
    expect(mesure(0)).toBeGreaterThan(0);
    expect(mesure(4),'la Résonance IV d’Elowen ne fait rien').toBeGreaterThan(mesure(0));
  });

  it('Hicho — la Marée ancestrale soigne davantage',()=>{
    const mesure=r=>{const id=idDe('Hicho');let b=poser(id,r);
      b=pret(b,id);b=lancer(b,1,id);b=pret(b,id);
      // Le Totem vient de soigner : sans re-blesser, le soin de l'ultime est
      // plafonné et la comparaison ne mesurerait rien.
      b={...b,allies:b.allies.map(u=>({...u,hp:Math.round(u.maxHp*.1)}))};
      const avant=pv(b);return pv(lancer(b,2,id))-avant;};
    expect(mesure(0)).toBeGreaterThan(0);
    expect(mesure(4),'la Résonance IV de Hicho ne fait rien').toBeGreaterThan(mesure(0));
  });

  it('les témoins qui marchaient déjà marchent toujours',()=>{
    // Caelion et Morghast servaient de référence pendant l'audit : s'ils
    // tombaient, c'est la mesure elle-même qui serait fausse.
    const caelion=r=>{const id=idDe('Caelion');let b=poser(id,r);
      const allie=b.allies.find(u=>u.id!==id).id;
      b=lancer(b,1,allie);
      b={...b,allies:b.allies.map(u=>u.id===allie?{...u,hp:0,dead:true}:u)};
      b=pret(b,id);return lancer(b,2,b.enemies[0].id).allies.find(u=>u.id===allie).hp;};
    expect(caelion(4)).toBeGreaterThan(caelion(0));
  });

  it('chaque champion annonce une Résonance IV, aucun n’est laissé sans texte',()=>{
    HEROES.forEach(h=>{
      const texte=resonanceIdentityBonus(h);
      expect(texte,h.name).toBeTruthy();
      expect(texte.length,h.name).toBeGreaterThan(20);
    });
  });
});
