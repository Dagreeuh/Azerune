// Contrat du codex des champions.
//
// championIdentity, resonanceConstellation et leurs voisines retombent sur une
// valeur generique quand le champion n'est pas declare. Un nouveau champion
// oublie dans ces tables ne provoque donc aucune erreur : il herite juste d'une
// fiche « Spécialiste · Champion polyvalent », sans que rien ne le signale.
import{describe,it,expect}from'vitest';
import{CHAMPION_IDENTITIES,RESONANCE_CONSTELLATIONS,RESONANCE_IV_BONUSES,
        CHAMPION_TYPES,ROSTER_PROFILES,championIdentity,championGuide,
        championTypes,resonanceConstellation}from'../src/data/championIdentities';
import{HEROES}from'../src/data/heroes';

const idsDuRoster=HEROES.map(hero=>String(hero.id));

/** Chaque champion est declare, et aucune entree ne vise un champion disparu. */
function couvre(table,nom){
  const cles=new Set(Object.keys(table||{}).map(String));
  const absents=HEROES.filter(hero=>!cles.has(String(hero.id)))
    .map(hero=>`${hero.name} (${hero.id})`);
  const orphelines=[...cles].filter(cle=>!idsDuRoster.includes(cle));
  return{absents,orphelines,nom};
}

describe('couverture du roster',()=>{
  [['CHAMPION_IDENTITIES',()=>CHAMPION_IDENTITIES],
   ['RESONANCE_CONSTELLATIONS',()=>RESONANCE_CONSTELLATIONS],
   ['RESONANCE_IV_BONUSES',()=>RESONANCE_IV_BONUSES],
   ['CHAMPION_TYPES',()=>CHAMPION_TYPES],
   ['ROSTER_PROFILES',()=>ROSTER_PROFILES]].forEach(([nom,lire])=>{
    it(`${nom} declare chaque champion du roster`,()=>{
      expect(couvre(lire(),nom).absents).toEqual([]);
    });

    it(`${nom} ne garde aucune entree sans champion`,()=>{
      expect(couvre(lire(),nom).orphelines).toEqual([]);
    });
  });
});

describe('fiches de champion',()=>{
  it('aucun champion ne retombe sur la fiche generique',()=>{
    // Le repli « Spécialiste » masque un oubli de declaration.
    const generiques=HEROES.filter(hero=>championIdentity(hero).title==='Spécialiste')
      .map(hero=>`${hero.name} (${hero.id})`);
    expect(generiques).toEqual([]);
  });

  it('chaque identite est complete',()=>{
    HEROES.forEach(hero=>{
      const fiche=championIdentity(hero);
      expect(fiche.title,`${hero.name} titre`).toBeTruthy();
      expect(fiche.icon,`${hero.name} icone`).toBeTruthy();
      expect(fiche.summary,`${hero.name} resume`).toBeTruthy();
      expect(fiche.strengths?.length,`${hero.name} forces`).toBeGreaterThan(0);
      expect(fiche.weakness,`${hero.name} faiblesse`).toBeTruthy();
      expect(fiche.gear,`${hero.name} equipement`).toBeTruthy();
    });
  });

  it('chaque champion a une constellation de resonance',()=>{
    HEROES.forEach(hero=>{
      const constellation=resonanceConstellation(hero);
      expect(constellation,`${hero.name}`).toBeTruthy();
    });
  });

  it('chaque champion a un guide et un type',()=>{
    HEROES.forEach(hero=>{
      expect(Object.keys(championGuide(hero)||{}).length,`${hero.name} guide`)
        .toBeGreaterThan(0);
      expect(championTypes(hero)?.length,`${hero.name} type`).toBeGreaterThan(0);
    });
  });

  it('la fiche generique reste disponible pour un champion inconnu',()=>{
    // Elle doit exister comme filet, sans jamais servir au roster reel.
    expect(championIdentity({id:999999}).title).toBe('Spécialiste');
    expect(championIdentity(null).title).toBe('Spécialiste');
  });
});
