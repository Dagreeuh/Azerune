import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{UNIQUE_WEAPONS}from'../src/data/legendary';
import{createBattle,castSkill}from'../src/battle/engine';
import{makeEnemy,fixedRandom,mulberry32}from'./helpers';

// Une arme Unique se gagne au bout d'une chronique longue et rare. Son pouvoir
// doit exister. Battue des sept : deux d'entre elles — le Bâton des Astres
// Brisés et l'Égide des Mille Marées — n'étaient référencées nulle part dans le
// moteur : leur effet ne faisait rien.

const S={hp:14000,atk:800,def:220,spd:100,crit:0,critDamage:50,accuracy:60,
  resistance:0,setEffects:[],resonanceLevel:0};
/** Une équipe dont le premier champion porte l'arme donnée. */
const poser=(id,arme,orientation)=>{
  const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1},
    // `arme` nulle = aucune arme du tout. Sans cette garde, le témoin porterait
    // un objet arme vide, la décharge générique se déclencherait aussi, et toute
    // arme paraîtrait fonctionner.
    uniqueWeapon:h.id===id&&arme?{...UNIQUE_WEAPONS[arme],uniqueId:arme,orientation}:null}));
  const autres=HEROES.filter(h=>h.id!==id).slice(0,2).map(h=>h.id);
  const b=createBattle([id,...autres],heroes,()=>({...S}),
    {enemies:[makeEnemy({id:'e1',hp:900000,atk:1,def:120,spd:1,element:'Arcane'})]});
  return{...b,turn:id,allies:b.allies.map(u=>u.id===id
    ?{...u,cooldowns:[0,0,0]}:{...u,hp:Math.round(u.maxHp*.35)})};
};
const pret=(b,id)=>({...b,turn:id,allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)});
const lancer=(b,i,c)=>{fixedRandom(.5);const r=castSkill(b,i,c);return r.battle||r};
/**
 * Enchaîne huit lancers : de quoi charger n'importe quelle arme.
 *
 * Le générateur est amorcé sur toute la séquence, création du combat comprise :
 * `createBattle` tire les jauges de départ au hasard, et sans cette précaution
 * deux exécutions diffèrent toujours — le test passait alors par accident, pour
 * n'importe quelle arme, y compris décorative.
 */
const marteler=(id,arme,index=0,orientation)=>{
  const vrai=Math.random;Math.random=mulberry32(20260909);
  try{
    let b=poser(id,arme,orientation);
    for(let k=0;k<8;k+=1){b=pret(b,id);
      const h=HEROES.find(x=>x.id===id);
      const cible=['ally','allAllies'].includes(h.skills[index].target)
        ?b.allies.find(u=>u.id!==id).id:b.enemies[0].id;
      b=lancer(b,index,cible);}
    return b;
  }finally{Math.random=vrai}
};

describe('les sept armes Uniques ont toutes un pouvoir qui agit',()=>{
  const trace=b=>JSON.stringify({
    e:b.enemies.map(u=>({hp:u.hp,d:u.debuffs,atb:Math.round(u.atb)})),
    a:b.allies.map(u=>({hp:u.hp,s:u.shield,b:Object.keys(u.buffs||{})}))});

  Object.keys(UNIQUE_WEAPONS).forEach(arme=>{
    it(`${UNIQUE_WEAPONS[arme].name} change quelque chose au combat`,()=>{
      // Témoin SANS arme du tout : un témoin portant une arme inconnue
      // déclencherait quand même la décharge générique, et toute arme
      // paraîtrait fonctionner.
      const porteurs=[1,19,15];
      const orientations=UNIQUE_WEAPONS[arme].orientation?['purified','corrupted']:[undefined];
      orientations.forEach(sens=>{
        const differe=porteurs.some(id=>[0,1,2].some(i=>{
          try{return trace(marteler(id,arme,i,sens))!==trace(marteler(id,null,i))}catch{return false}
        }));
        expect(differe,`${arme}${sens?` (${sens})`:''} : aucun effet observable, l’arme est décorative`).toBe(true);
      });
    });
  });

  it('les deux orientations de Cendre-Sépulcrale ne font pas la même chose',()=>{
    // La chronique fait choisir : les deux branches doivent exister, et différer.
    const pur=trace(marteler(1,'sepulchral',0,'purified'));
    const corrompu=trace(marteler(1,'sepulchral',0,'corrupted'));
    expect(pur,'les deux orientations sont identiques').not.toBe(corrompu);
  });

  it('la lame purifiée soigne et délivre, elle n’est pas qu’un défaut de choix',()=>{
    // Comparer les deux orientations ne suffit pas : une branche purifiée vide
    // différerait quand même de la corrompue, qui pose une Corruption.
    const soins=arme=>{
      const b=marteler(1,arme,0,'purified');
      return b.allies.filter(u=>u.id!==1).reduce((s,u)=>s+u.hp,0);
    };
    expect(soins('sepulchral'),'la lame purifiée ne soigne personne')
      .toBeGreaterThan(soins(null));
  });
});

describe('les deux armes de soutien tiennent leur promesse',()=>{
  const HICHO=15; // soigneur pur : il n'inflige aucun dégât
  const boucliers=b=>b.allies.reduce((s,u)=>s+(u.shield||0),0);

  it('le Bâton des Astres Brisés protège même sans infliger un seul dégât',()=>{
    // La décharge générique exige des dégâts. Une arme de soutien qui n'agit
    // que si l'on frappe ne sert à rien à un soigneur.
    expect(boucliers(marteler(HICHO,'brokenstars',0)),'aucun alignement protecteur')
      .toBeGreaterThan(0);
    expect(boucliers(marteler(HICHO,null,0)),'le témoin protège déjà, la mesure ne prouve rien')
      .toBe(0);
  });

  it('l’alignement attend bien cinq compétences',()=>{
    const apres=n=>{let b=poser(HICHO,'brokenstars');
      for(let k=0;k<n;k+=1){b=pret(b,HICHO);b=lancer(b,0,b.allies.find(u=>u.id!==HICHO).id);}
      return boucliers(b);};
    expect(apres(4),'l’alignement s’éveille trop tôt').toBe(0);
    expect(apres(5),'l’alignement ne s’éveille pas au cinquième').toBeGreaterThan(0);
  });

  it('l’Égide des Mille Marées convertit le surplus de soin en bouclier',()=>{
    // Hicho soigne bien au-delà du plafond quand l'équipe est presque pleine :
    // c'est exactement le surplus que l'arme doit récupérer.
    const scene=arme=>{
      let b=poser(HICHO,arme);
      b={...b,allies:b.allies.map(u=>({...u,hp:u.maxHp-1}))};
      b=pret(b,HICHO);
      return boucliers(lancer(b,0,b.allies.find(u=>u.id!==HICHO).id));
    };
    expect(scene('tides'),'le surplus de soin est toujours perdu').toBeGreaterThan(0);
    expect(scene(null),'le témoin gagne déjà un bouclier, la mesure ne prouve rien').toBe(0);
  });

  it('sans surplus, l’Égide ne donne rien',()=>{
    // Elle récupère un gaspillage, elle ne crée pas de bouclier gratuit.
    let b=poser(HICHO,'tides');
    b={...b,allies:b.allies.map(u=>({...u,hp:1}))};
    b=pret(b,HICHO);
    expect(boucliers(lancer(b,0,b.allies.find(u=>u.id!==HICHO).id)),
      'l’Égide donne un bouclier sans surplus').toBe(0);
  });
});
