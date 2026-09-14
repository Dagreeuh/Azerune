import{it}from'vitest';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill}from'../src/battle/engine';
import{makeEnemy,fixedRandom}from'./helpers';
const S={hp:12000,atk:700,def:220,spd:100,crit:0,critDamage:50,accuracy:60,resistance:0,setEffects:[],resonanceLevel:0};
const poser=(id,ordre)=>{
  const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
  const autres=HEROES.filter(h=>h.id!==id).slice(0,2).map(h=>h.id);
  let b=createBattle([id,...autres],heroes,()=>({...S}),
    {enemies:[makeEnemy({id:'e1',hp:900000,atk:1,def:120,spd:1,element:'Arcane'})]});
  ordre.forEach(i=>{b={...b,turn:id,allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u),
    enemies:b.enemies.map(u=>({...u,debuffs:{...u.debuffs,bleed:{turns:1,source:id,sourceAtk:S.atk}}}))};
    fixedRandom(.5);const r=castSkill(b,i,b.enemies[0].id);b=r.battle||r;});
  return b;};
it('sondages',()=>{
  const DAG=HEROES.find(h=>h.name==='Dagcat').id;
  [['feralShred seul',[1]],['feralFinish après 3 points',[0,0,0,2]]].forEach(([nom,ordre])=>{
    const b=poser(DAG,ordre);
    console.log(`${nom} → saignement ${JSON.stringify(b.enemies[0].debuffs.bleed)} | points ${b.allies.find(u=>u.id===DAG).mechanic?.value}`);
  });
  const LEL=HEROES.find(h=>h.name==='Lelianna').id;
  const b=poser(LEL,[1]);
  console.log('Lelianna après Bouclier d’expiation → buffs alliés :',JSON.stringify(b.allies.map(u=>Object.keys(u.buffs||{}))));
});
