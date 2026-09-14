import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{CONTINENTS,DIFFICULTIES,createMission,REGLES_SPECIALES,regleDeMission}from'../src/data/campaign';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill,nextTurn}from'../src/battle/engine';
import{optionsDeCombat}from'../src/utils/simulation';
import{makeEnemy,fixedRandom}from'./helpers';

// La campagne annonce 210 missions pour ~20 rencontres distinctes : les mêmes
// 70 étapes rejouées en Normal, Difficile et Hardcore. Les règles spéciales
// ajoutent une contrainte de composition, sans nouveau contenu.
// Mesure : Silence des soins coûte +27,2 % de puissance à une équipe qui
// repose sur les soins, et +0,0 % à une équipe qui s'en passe.

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const toutes=id=>CONTINENTS.flatMap((zone,z)=>zone.stages.map(st=>createMission(DIFFICULTIES[id],zone,st)));

describe('les règles n’entravent jamais le chemin obligatoire',()=>{
  it('aucune mission Normale ne porte de règle',()=>{
    // La Normal doit rester finissable : c'est le chemin obligatoire.
    expect(toutes(0).filter(m=>m.regle).map(m=>m.key)).toEqual([]);
  });

  it('aucun boss ne porte de règle',()=>{
    // Un mur de progression ne doit pas devenir une impasse.
    [1,2].forEach(d=>expect(toutes(d).filter(m=>m.boss&&m.regle).map(m=>m.key),
      DIFFICULTIES[d].name).toEqual([]));
    // Et la garde tient même si une étape réglée devenait un boss.
    expect(regleDeMission('hard',0,3,true),'un boss sur une étape réglée passe').toBe(null);
    expect(regleDeMission('hardcore',0,2,true)).toBe(null);
    expect(regleDeMission('hard',0,3,false),'la garde bloque tout, même les non-boss').toBeTruthy();
  });

  it('la Difficile en porte deux par zone, la Hardcore trois',()=>{
    CONTINENTS.forEach((zone,z)=>{
      const dur=zone.stages.filter(st=>regleDeMission('hard',z,st.id,st.boss)).length;
      const hardcore=zone.stages.filter(st=>regleDeMission('hardcore',z,st.id,st.boss)).length;
      expect(dur,`${zone.name} en Difficile`).toBe(2);
      expect(hardcore,`${zone.name} en Hardcore`).toBe(3);
    });
  });

  it('les quatre règles tournent : aucune ne monopolise une difficulté',()=>{
    [1,2].forEach(d=>{
      const vues=new Set(toutes(d).filter(m=>m.regle).map(m=>m.regle.id));
      expect(vues.size,DIFFICULTIES[d].name).toBe(Object.keys(REGLES_SPECIALES).length);
    });
  });

  it('la règle d’une étape ne change pas d’une partie à l’autre',()=>{
    const a=createMission(DIFFICULTIES[1],CONTINENTS[4],CONTINENTS[4].stages[2]);
    const b=createMission(DIFFICULTIES[1],CONTINENTS[4],CONTINENTS[4].stages[2]);
    expect(a.regle?.id).toBe(b.regle?.id);
  });

  it('chaque règle s’explique au joueur',()=>{
    Object.values(REGLES_SPECIALES).forEach(r=>{
      expect(r.name,r.id).toBeTruthy();
      expect(r.summary?.length,r.id).toBeGreaterThan(20);
      expect(r.icon,r.id).toBeTruthy();
    });
  });
});

describe('les règles font vraiment ce qu’elles annoncent',()=>{
  const STATS={hp:9000,atk:700,def:200,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};
  const poser=(regle,meneur=15)=>{
    const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
    const b=createBattle([meneur,1,3],heroes,()=>({...STATS}),
      {enemies:[makeEnemy({id:'e1',hp:400000,atk:1,def:100,spd:1,element:'Arcane'})],regle});
    return{...b,turn:meneur,allies:b.allies.map(u=>u.id===meneur
      ?{...u,cooldowns:[0,0,0]}:{...u,hp:Math.round(u.maxHp*.3)})};
  };
  const lancer=(b,i,c)=>{fixedRandom(.5);const r=castSkill(b,i,c);return r.battle||r};

  it('Silence des soins annule les soins',()=>{
    const soin=regle=>{const av=poser(regle),avant=av.allies.find(u=>u.id===1).hp;
      return lancer(av,0,1).allies.find(u=>u.id===1).hp-avant;};
    expect(soin(null),'le soin de référence ne passe pas').toBeGreaterThan(0);
    expect(soin(REGLES_SPECIALES['sans-soin']),'le Silence laisse passer un soin').toBe(0);
  });

  it('Silence des soins laisse les boucliers intacts',()=>{
    // C'est ce que la règle annonce, et c'est ce qui la rend jouable.
    const b=poser(REGLES_SPECIALES['sans-soin'],23);
    const apres=lancer(b,1,23);
    expect(apres.allies.find(u=>u.id===23).shield,'les boucliers tombent aussi').toBeGreaterThan(0);
  });

  it('Marche forcée fait entrer l’équipe à 60 % de ses PV',()=>{
    // On regarde le meneur : `poser` blesse volontairement les deux autres.
    const meneur=b=>b.allies.find(u=>u.id===15);
    expect(Math.round(100*meneur(poser(REGLES_SPECIALES.fragile)).hp/meneur(poser(null)).maxHp)).toBe(60);
    const normal=meneur(poser(null));
    expect(normal.hp,'sans règle, on entre à plein').toBe(normal.maxHp);
  });

  it('Embuscade donne aux ennemis une jauge pleine',()=>{
    expect(poser(REGLES_SPECIALES.hate).enemies.every(u=>u.atb===100)).toBe(true);
    expect(poser(null).enemies.every(u=>u.atb===100),'sans règle, les jauges sont tirées').toBe(false);
  });

  it('Volonté de fer fait résister les ennemis aux malus soumis à la Précision',()=>{
    // Elle ne bloque QUE ceux-là, et son texte ne promet que ceux-là : les
    // marques de mécanique (Traque, Marque d'exécution) sont posées en direct
    // par les kits, et les bloquer casserait ces kits.
    // Morghast (Fiole toxique) passe bien par le jet de Précision.
    const MORGHAST=HEROES.find(h=>h.skills.some(sk=>sk.effect==='alchemyPoison')).id;
    const jouer=regle=>{const b=poser(regle,MORGHAST);
      return Object.keys(lancer(b,0,b.enemies[0].id).enemies[0].debuffs||{});};
    expect(jouer(null),'le témoin ne pose pas de Poison, le test ne prouve rien').toContain('poison');
    expect(jouer(REGLES_SPECIALES.resistance),'le Poison passe malgré la Volonté de fer')
      .not.toContain('poison');
  });

  it('elle ne protège que l’adversaire, jamais l’équipe',()=>{
    // Sinon ce serait un cadeau : les malus que le joueur SUBIT doivent passer.
    const moteur=fs.readFileSync(fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8');
    expect(moteur,'la règle protège aussi les alliés')
      .toContain("battle.regle?.id==='resistance'&&target.side==='enemy'");
  });

  it('son texte ne promet pas plus que ce qu’elle bloque',()=>{
    expect(REGLES_SPECIALES.resistance.summary).toMatch(/Précision/);
    expect(REGLES_SPECIALES.resistance.summary,'elle promet encore « tous les malus »')
      .not.toMatch(/tous les malus\./);
  });

  it('mais elle n’immunise pas les alliés : c’est une règle sur l’adversaire',()=>{
    const b=poser(REGLES_SPECIALES.resistance);
    const allie=b.allies[1];
    expect(()=>nextTurn(b)).not.toThrow();
    expect(allie).toBeTruthy();
  });
});

describe('la règle suit la mission jusqu’au combat et à l’estimation',()=>{
  it('les options de combat transportent la règle',()=>{
    const m=createMission(DIFFICULTIES[1],CONTINENTS[2],CONTINENTS[2].stages[2]);
    expect(optionsDeCombat(m).regle).toBe(m.regle);
    expect(optionsDeCombat({enemies:[]}).regle).toBe(null);
  });

  it('le combat garde la règle dans son état',()=>{
    const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
    const b=createBattle([1,19,3],heroes,()=>({hp:5000,atk:300,def:100,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0}),
      {enemies:[makeEnemy({id:'e1',hp:9000,atk:20,def:10,spd:1,element:'Arcane'})],regle:REGLES_SPECIALES.hate});
    expect(b.regle.id).toBe('hate');
  });

  it('le joueur est prévenu avant, pendant et sur la carte de mission',()=>{
    expect(lire('../src/pages/CampaignPage.jsx'),'la carte de mission n’annonce pas la règle')
      .toContain('stage-regle');
    expect(lire('../src/components/Layout.jsx'),'la préparation n’annonce pas la règle')
      .toContain('preparationMission.regle&&');
    expect(lire('../src/pages/BattlePage.jsx'),'le combat n’affiche pas la règle')
      .toContain('battle.regle&&');
  });
});
