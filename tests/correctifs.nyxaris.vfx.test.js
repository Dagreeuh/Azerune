import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill}from'../src/battle/engine';
import{makeEnemy,fixedRandom}from'./helpers';

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const NYXARIS=36;
const STATS={hp:9000,atk:800,def:200,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};
const poser=()=>{
  const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
  const b=createBattle([NYXARIS,1,19],heroes,()=>({...STATS}),
    {enemies:[makeEnemy({id:'e1',hp:400000,atk:1,def:100,spd:1,element:'Arcane'})]});
  return{...b,turn:NYXARIS,allies:b.allies.map(u=>u.id===NYXARIS?{...u,cooldowns:[0,0,0]}:u)};
};
const lancer=(b,i,c)=>{fixedRandom(.5);const r=castSkill(b,i,c);return r.battle||r};

describe('Nyxaris : son premier sort n’infligeait rien',()=>{
  it('Incantation prolongee frappe desormais',()=>{
    const avant=poser();
    const apres=lancer(avant,0,avant.enemies[0].id);
    expect(avant.enemies[0].hp-apres.enemies[0].hp,'le premier sort ne fait toujours rien')
      .toBeGreaterThan(0);
  });

  it('elle accumule toujours une Charge : le correctif n’a pas casse son identite',()=>{
    const avant=poser();
    const apres=lancer(avant,0,avant.enemies[0].id);
    expect(apres.allies.find(u=>u.id===NYXARIS).mechanic.value).toBe(1);
  });

  it('les Charges amplifient toujours la Desintegration',()=>{
    let b=poser();
    for(let k=0;k<3;k+=1){b={...b,turn:NYXARIS,allies:b.allies.map(u=>u.id===NYXARIS?{...u,cooldowns:[0,0,0]}:u)};
      b=lancer(b,0,b.enemies[0].id);}
    const charge=b.enemies[0].hp;
    b={...b,turn:NYXARIS,allies:b.allies.map(u=>u.id===NYXARIS?{...u,cooldowns:[0,0,0]}:u)};
    const avecCharges=charge-lancer(b,1,b.enemies[0].id).enemies[0].hp;
    const nu=poser();
    const sansCharge=nu.enemies[0].hp-lancer(nu,1,nu.enemies[0].id).enemies[0].hp;
    expect(avecCharges,'les Charges n’amplifient plus rien').toBeGreaterThan(sansCharge);
  });

  it('plus aucun champion n’a un premier sort sans degats',()=>{
    // C'etait le seul du roster : tous les autres generateurs frappent en
    // chargeant. Un sort qui ne fait rien se lit comme un bug.
    const muets=HEROES.filter(h=>h.skills[0].cd===0&&!(h.skills[0].power>0)
      &&['enemy','allEnemies'].includes(h.skills[0].target));
    expect(muets.map(h=>h.name)).toEqual([]);
  });
});

describe('Effets de sort : ils etaient laves et caches',()=>{
  const css=lire('../src/styles.css');
  const bloc=nom=>{const i=css.indexOf(nom);return css.slice(i,css.indexOf('}',i)+1)};

  it('le halo d’impact est plus petit qu’une carte de combat',()=>{
    // Il faisait 96 px de large sur une carte de 107 px : la carte entiere se
    // lavait en blanc.
    const taille=Number(bloc('.vfx-impact{').match(/width:(\d+)px/)[1]);
    expect(taille,'le halo couvre encore toute la carte').toBeLessThan(80);
  });

  it('le halo porte la couleur du sort, plus seulement du blanc',()=>{
    const fond=bloc('.vfx-impact{');
    expect(fond,'la couleur élémentaire ne porte plus le halo').toContain('var(--vfx-glow)');
    expect(fond).toContain('var(--vfx-core)');
  });

  it('la trainee porte elle aussi la couleur du sort',()=>{
    const fond=bloc('.vfx-streak{');
    expect(fond).toContain('var(--vfx-glow)');
    expect(fond).toContain('var(--vfx-core)');
    expect(fond).toContain('var(--vfx-trail)');
  });

  it('les effets ne se jouent plus derriere le compteur de degats',()=>{
    // Le compteur est pose au centre de la carte en z-index 80 : un effet
    // centre au meme endroit disparait derriere lui.
    const conteneur=bloc('.spell-vfx{');
    expect(conteneur,'les effets sont revenus au centre de la carte').not.toMatch(/inset:0[;\s]/);
    expect(conteneur,'les effets ne sont plus décalés vers le bas').toMatch(/top:\d+px/);
  });

  it('les effets restent sous le compteur de degats dans l’empilement',()=>{
    // On les descend, on ne les fait pas passer devant : le nombre doit rester
    // lisible.
    const z=Number(bloc('.spell-vfx{').match(/z-index:(\d+)/)[1]);
    expect(z).toBeLessThan(80);
  });
});
