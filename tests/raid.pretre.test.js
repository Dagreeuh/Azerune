// Raid : le Prêtre des flammes soigne le boss. Que fait-il quand le boss est
// deja mort ?
//
// Le code cherchait le boss vivant puis lisait `boss.maxHp` sans verifier
// qu'il en avait trouve un. Tuer le boss avant ses serviteurs — la strategie
// que tout joueur emploie — faisait donc planter le moteur au tour suivant du
// pretre. Les branches voisines (cristaux d'expedition) verifiaient toutes la
// presence de leur boss ; celle-ci l'avait oublie.
import{describe,it,expect,afterEach,vi}from'vitest';
import{createBattle,nextTurn,enemyAction}from'../src/battle/engine';
import{RAIDS,createRaidMission}from'../src/data/raids';
import{makeHero,statsFrom,fixedRandom}from'./helpers';

afterEach(()=>vi.restoreAllMocks());

/** Combat de raid ou seul le pretre survit encore cote ennemi. */
function raidSansBoss(){
  const heros=[0,1,2,3].map(index=>makeHero({id:7300+index,hp:90000,def:0,spd:1,name:`A${index}`}));
  const mission=createRaidMission(RAIDS[0].id,5);
  let combat=createBattle(heros.map(hero=>hero.id),heros,statsFrom,{
    enemies:mission.enemies,enemyScale:mission.scale||1,
    raid:{...mission.raidData,level:mission.raidLevel}
  });
  // Tout le monde meurt sauf le pretre, qui est pret a agir.
  const enemies=combat.enemies.map(unit=>unit.raidRole==='priest'
    ?{...unit,atb:99.9,cooldowns:[0,0,0]}
    :{...unit,hp:0,dead:true,atb:0});
  return nextTurn({...combat,allies:combat.allies.map(unit=>({...unit,atb:0})),enemies});
}

describe('Prêtre des flammes sans boss',()=>{
  it('le raid comporte bien un prêtre et un boss',()=>{
    const mission=createRaidMission(RAIDS[0].id,5);
    const roles=mission.enemies.map(unit=>unit.raidRole);
    expect(roles).toContain('priest');
    expect(roles).toContain('boss');
  });

  it('le prêtre agit sans faire planter le combat quand le boss est mort',()=>{
    fixedRandom(.5);
    const combat=raidSansBoss();
    expect(combat.turn).toBeTruthy();
    expect(()=>enemyAction(combat)).not.toThrow();
  });

  it('il attaque au lieu de soigner un boss inexistant',()=>{
    fixedRandom(.5);
    const combat=raidSansBoss();
    const avant=combat.allies.reduce((total,unit)=>total+unit.hp,0);
    const resolu=enemyAction(combat);
    const apres=resolu.allies.reduce((total,unit)=>total+unit.hp,0);
    expect(apres).toBeLessThan(avant);
  });

  it('aucun soin n’est rapporte alors qu’il n’y a personne a soigner',()=>{
    fixedRandom(.5);
    const resolu=enemyAction(raidSansBoss());
    expect((resolu.lastEvents||[]).filter(event=>event.type==='heal')).toEqual([]);
  });

  it('tant que le boss vit, le prêtre le soigne toujours',()=>{
    // La correction ne doit pas desactiver la mecanique elle-meme.
    fixedRandom(.5);
    const heros=[0,1,2,3].map(index=>makeHero({id:7400+index,hp:90000,def:0,spd:1,name:`A${index}`}));
    const mission=createRaidMission(RAIDS[0].id,5);
    let combat=createBattle(heros.map(hero=>hero.id),heros,statsFrom,{
      enemies:mission.enemies,enemyScale:mission.scale||1,
      raid:{...mission.raidData,level:mission.raidLevel}
    });
    const enemies=combat.enemies.map(unit=>unit.raidRole==='priest'
      ?{...unit,atb:99.9,cooldowns:[0,0,0]}
      :unit.raidRole==='boss'?{...unit,hp:Math.round(unit.maxHp*.4),atb:0}
      :{...unit,hp:0,dead:true,atb:0});
    combat=nextTurn({...combat,allies:combat.allies.map(unit=>({...unit,atb:0})),enemies});
    const resolu=enemyAction(combat);
    const boss=resolu.enemies.find(unit=>unit.raidRole==='boss');
    expect(boss.hp).toBeGreaterThan(Math.round(boss.maxHp*.4));
    expect((resolu.lastEvents||[]).some(event=>event.type==='heal')).toBe(true);
  });
});
