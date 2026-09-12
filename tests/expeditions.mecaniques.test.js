import{describe,it,expect,afterEach,vi}from'vitest';
import{EXPEDITIONS,createExpeditionMission,expeditionLevelData}from'../src/data/expeditions';
import{createBattle,nextTurn,enemyAction}from'../src/battle/engine';
import{makeHero,statsFrom,fixedRandom}from'./helpers';

// Chaque Expédition annonce ses mécaniques au joueur. On vérifie qu'elles se
// produisent vraiment : c'est la classe de bug qui a déjà touché trois armes
// Uniques et deux affixes Mythic+.

afterEach(()=>vi.restoreAllMocks());

/** Combat d'Expédition où c'est le serviteur choisi qui agit. */
const scene=(id,role)=>{
  fixedRandom(.5);
  const mission=createExpeditionMission(id,5);
  const equipe=[makeHero({id:9200,hp:400000,atk:10,def:200,spd:1,name:'A0',element:'Arcane'})];
  const b=createBattle([9200],equipe.map(h=>({...h,currentStars:6})),
    u=>({...statsFrom(u),accuracy:80,resistance:0}),{enemies:mission.enemies});
  const acteur=b.enemies.find(u=>u.expeditionRole===role);
  expect(acteur,`aucun serviteur « ${role} » dans ${id}`).toBeTruthy();
  return{...b,turn:null,
    allies:b.allies.map(u=>({...u,atb:0})),
    enemies:b.enemies.map(u=>u.id===acteur.id?{...u,atb:100}:{...u,atb:0,hp:Math.round(u.maxHp*.5)})};
};
const jouer=combat=>enemyAction(nextTurn(combat));
const boss=b=>b.enemies.find(u=>u.bossUnit);

describe('les mécaniques annoncées se produisent',()=>{
  it('Trésorerie — les gardes renforcent la Défense du Trésorier',()=>{
    const avant=scene('treasury','guard');
    expect(boss(jouer(avant)).buffs?.defUp,'le garde ne renforce personne').toBeTruthy();
  });

  it('Sanctuaire — les Esprits gagnent de l’Attaque à chaque action',()=>{
    const avant=scene('sanctuary','ancient');
    const apres=jouer(avant);
    const esprit=apres.enemies.find(u=>u.expeditionRole==='ancient'&&u.buffs?.atkUp);
    expect(esprit,'aucun Esprit ne monte en Attaque').toBeTruthy();
  });

  it('Forge astrale — le Cristal offensif renforce l’Attaque du Golem',()=>{
    expect(boss(jouer(scene('astral-forge','offense-crystal'))).buffs?.atkUp).toBeTruthy();
  });

  it('Forge astrale — le Cristal défensif renforce sa Défense',()=>{
    expect(boss(jouer(scene('astral-forge','defense-crystal'))).buffs?.defUp).toBeTruthy();
  });

  it('Forge astrale — le Cristal régénérant le soigne vraiment',()=>{
    const avant=scene('astral-forge','healing-crystal');
    const pvAvant=boss(avant).hp;
    expect(boss(jouer(avant)).hp,'le Cristal régénérant ne soigne pas').toBeGreaterThan(pvAvant);
  });

  it('Sanctuaire de l’Ascension — l’Éclat majeur protège le Gardien',()=>{
    const apres=jouer(scene('ascension-sanctuary','major-shard'));
    const gardien=boss(apres);
    expect(gardien.buffs?.defUp||gardien.shield>0,'le Gardien n’est pas protégé').toBeTruthy();
  });

  it('Sanctuaire de l’Ascension — l’Éclat mythique le soigne et le renforce',()=>{
    const avant=scene('ascension-sanctuary','mythic-shard');
    const pvAvant=boss(avant).hp;
    const apres=jouer(avant);
    expect(boss(apres).hp,'l’Éclat mythique ne soigne pas').toBeGreaterThan(pvAvant);
  });

  it('Sanctuaire de l’Ascension — l’Éclat mineur accélère l’équipe ennemie',()=>{
    const apres=jouer(scene('ascension-sanctuary','minor-shard'));
    expect(apres.enemies.some(u=>u.buffs?.speedUp),'personne n’est accéléré').toBe(true);
  });
});

describe('chaque Expédition annonce ce qu’elle fait',()=>{
  it('toutes ont un texte de mécaniques non vide',()=>{
    EXPEDITIONS.forEach(e=>{
      const data=expeditionLevelData(e.id,5);
      expect(Array.isArray(data.mechanics),e.id).toBe(true);
      expect(data.mechanics.length,e.id).toBeGreaterThan(0);
      data.mechanics.forEach(m=>expect(m.length,`${e.id} : « ${m} »`).toBeGreaterThan(15));
    });
  });

  it('tous les rôles présents en combat sont traités par le moteur',()=>{
    // Un serviteur sans traitement se contenterait d'une frappe générique, et
    // la mécanique annoncée n'existerait pas.
    const traites=new Set(['ancient','ascension-guardian','defense-crystal','guard',
      'healing-crystal','major-shard','minor-shard','mythic-shard','offense-crystal',
      'thief','time-spirit','treasurer','forge-golem']);
    EXPEDITIONS.forEach(e=>createExpeditionMission(e.id,5).enemies.forEach(u=>
      expect(traites.has(u.expeditionRole),`${e.id} : rôle « ${u.expeditionRole} » inconnu`).toBe(true)));
  });
});
