// Affinites elementaires : fonctions pures, aucun aleatoire.
import{describe,it,expect}from'vitest';
import{affinity,areaAffinity,normalizeElement,elementMeta,ELEMENTS}from'../src/utils/elements';

const TOUS=['Feu','Nature','Eau','Arcane','Ombre','Lumiere'];
const NOMS=Object.keys(ELEMENTS); // avec les accents reels du jeu

describe('normalizeElement',()=>{
  it('replie les anciens elements Terre et Vent sur Nature',()=>{
    expect(normalizeElement('Terre')).toBe('Nature');
    expect(normalizeElement('Vent')).toBe('Nature');
  });

  it('replie tout element inconnu sur Arcane',()=>{
    expect(normalizeElement('Plasma')).toBe('Arcane');
    expect(normalizeElement(undefined)).toBe('Arcane');
    expect(normalizeElement(null)).toBe('Arcane');
    expect(normalizeElement('')).toBe('Arcane');
  });

  it('laisse passer les six elements valides',()=>{
    NOMS.forEach(nom=>expect(normalizeElement(nom)).toBe(nom));
  });

  it('est idempotente',()=>{
    [...NOMS,'Terre','Vent','Inconnu'].forEach(valeur=>
      expect(normalizeElement(normalizeElement(valeur))).toBe(normalizeElement(valeur)));
  });
});

describe('cycles d affinite',()=>{
  it('respecte le cycle Feu > Nature > Eau > Feu',()=>{
    expect(affinity('Feu','Nature').key).toBe('effective');
    expect(affinity('Nature','Eau').key).toBe('effective');
    expect(affinity('Eau','Feu').key).toBe('effective');
  });

  it('respecte le cycle Arcane > Ombre > Lumiere > Arcane',()=>{
    const lumiere=NOMS.find(nom=>nom.startsWith('Lum'));
    expect(affinity('Arcane','Ombre').key).toBe('effective');
    expect(affinity('Ombre',lumiere).key).toBe('effective');
    expect(affinity(lumiere,'Arcane').key).toBe('effective');
  });

  it('aucun element n est efficace contre lui-meme',()=>{
    NOMS.forEach(nom=>expect(affinity(nom,nom).key).toBe('neutral'));
  });

  it('est antisymetrique : si A bat B alors B est inefficace contre A',()=>{
    NOMS.forEach(a=>NOMS.forEach(b=>{
      if(affinity(a,b).key==='effective')expect(affinity(b,a).key).toBe('weak');
      if(affinity(a,b).key==='weak')expect(affinity(b,a).key).toBe('effective');
    }));
  });

  it('les deux cycles sont etanches : aucune interaction entre eux',()=>{
    const cycleA=['Feu','Nature','Eau'];
    const cycleB=NOMS.filter(nom=>!cycleA.includes(nom));
    cycleA.forEach(a=>cycleB.forEach(b=>{
      expect(affinity(a,b).key).toBe('neutral');
      expect(affinity(b,a).key).toBe('neutral');
    }));
  });
});

describe('valeurs renvoyees',()=>{
  it('EFFICACE vaut 1,30 en degats et +15 % en chance d effet',()=>{
    const relation=affinity('Feu','Nature');
    expect(relation.damage).toBe(1.30);
    expect(relation.effect).toBe(.15);
    expect(relation.label).toBe('EFFICACE');
  });

  it('INEFFICACE vaut 0,75 en degats et -15 % en chance d effet',()=>{
    const relation=affinity('Nature','Feu');
    expect(relation.damage).toBe(.75);
    expect(relation.effect).toBe(-.15);
  });

  it('NEUTRE est strictement sans effet',()=>{
    const relation=affinity('Feu','Feu');
    expect(relation.damage).toBe(1);
    expect(relation.effect).toBe(0);
  });

  it('applique la normalisation avant de comparer',()=>{
    // Terre devient Nature, donc Feu doit etre efficace contre Terre.
    expect(affinity('Feu','Terre').key).toBe('effective');
    expect(affinity('Vent','Eau').key).toBe('effective');
  });
});

describe('areaAffinity',()=>{
  it('compte les trois relations sur un groupe de cibles',()=>{
    const cibles=[{element:'Nature'},{element:'Nature'},{element:'Eau'},{element:'Feu'}];
    expect(areaAffinity('Feu',cibles)).toEqual({effective:2,neutral:1,weak:1});
  });

  it('renvoie des compteurs a zero sur un groupe vide',()=>{
    expect(areaAffinity('Feu',[])).toEqual({effective:0,neutral:0,weak:0});
  });

  it('conserve le total : chaque cible est comptee une fois et une seule',()=>{
    const cibles=NOMS.map(nom=>({element:nom}));
    const compte=areaAffinity('Arcane',cibles);
    expect(compte.effective+compte.neutral+compte.weak).toBe(cibles.length);
  });
});

describe('elementMeta',()=>{
  it('fournit un nom, une icone et une couleur pour tout element',()=>{
    [...NOMS,'Terre','Inconnu'].forEach(valeur=>{
      const meta=elementMeta(valeur);
      expect(meta.name).toBe(normalizeElement(valeur));
      expect(meta.icon).toBeTruthy();
      expect(meta.color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
