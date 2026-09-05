// Degats periodiques : appliques au debut du tour de la cible, dans nextTurn.
// Formules verrouillees ici pour que tout reequilibrage soit un choix explicite.
import{describe,it,expect,beforeEach,afterEach,vi}from'vitest';
import{createBattle,nextTurn}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,giveTurnTo,findUnit,withStatus,fixedRandom}from './helpers';

const PV=1000;

/** Combat a un champion (PV connus) contre un ennemi inerte tres lent. */
function combatSolo(){
  const heros=makeHero({hp:PV,spd:200});
  let combat=createBattle([heros.id],[heros],statsFrom,{
    enemies:[makeEnemy({id:'inerte',hp:99999,spd:1})]
  });
  return{combat,id:heros.id};
}

/** Fait agir le champion une fois avec les statuts donnes, renvoie ses PV. */
function pvApresUnTour(statuts){
  let{combat,id}=combatSolo();
  combat=withStatus(combat,id,statuts);
  combat=giveTurnTo(combat,id);
  return findUnit(nextTurn(combat),id);
}

const perte=statuts=>PV-pvApresUnTour(statuts).hp;

beforeEach(()=>fixedRandom(.5));
afterEach(()=>vi.restoreAllMocks());

describe('formules de degats periodiques',()=>{
  it('Poison inflige 6 % des PV max',()=>{
    expect(perte({debuffs:{poison:{turns:3}}})).toBe(Math.round(PV*.06));
  });

  it('Brulure inflige 5 % des PV max',()=>{
    expect(perte({debuffs:{burn:{turns:3}}})).toBe(Math.round(PV*.05));
  });

  it('Saignement inflige 4,5 % des PV max',()=>{
    expect(perte({debuffs:{bleed:{turns:3}}})).toBe(Math.round(PV*.045));
  });

  it('Corruption inflige 3,5 % des PV max',()=>{
    expect(perte({debuffs:{corruption:{turns:4}}})).toBe(Math.round(PV*.035));
  });

  it('Agonie part de 2,7 % des PV max a une charge',()=>{
    expect(perte({debuffs:{agony:{turns:4,stacks:1}}})).toBe(Math.round(PV*(.018+.009)));
  });
});

describe('Virulence amplifie le Poison',()=>{
  it('ne change rien a une seule charge',()=>{
    expect(perte({debuffs:{poison:{turns:3},virulence:{turns:3,stacks:1}}}))
      .toBe(Math.round(PV*.06));
  });

  it('ajoute 12 % de degats par charge supplementaire',()=>{
    [2,3,4,5].forEach(charges=>{
      expect(perte({debuffs:{poison:{turns:3},virulence:{turns:3,stacks:charges}}}))
        .toBe(Math.round(PV*.06*(1+.12*(charges-1))));
    });
  });

  it('traite une Virulence a zero charge comme une charge',()=>{
    expect(perte({debuffs:{poison:{turns:3},virulence:{turns:3,stacks:0}}}))
      .toBe(Math.round(PV*.06));
  });
});

describe('Agonie monte en charges',()=>{
  it('incremente la charge apres chaque tour',()=>{
    const unite=pvApresUnTour({debuffs:{agony:{turns:5,stacks:1}}});
    expect(unite.debuffs.agony.stacks).toBe(2);
  });

  it('plafonne a cinq charges',()=>{
    const unite=pvApresUnTour({debuffs:{agony:{turns:5,stacks:5}}});
    expect(unite.debuffs.agony.stacks).toBe(5);
  });

  it('suit la courbe 0,018 + 0,009 par charge, plafonnee a cinq',()=>{
    [1,2,3,4,5].forEach(charges=>{
      expect(perte({debuffs:{agony:{turns:5,stacks:charges}}}))
        .toBe(Math.round(PV*(.018+.009*charges)));
    });
    // Au-dela du plafond, les degats n augmentent plus.
    expect(perte({debuffs:{agony:{turns:5,stacks:9}}}))
      .toBe(Math.round(PV*(.018+.009*5)));
  });
});

describe('set Ignifuge',()=>{
  it('reduit la Brulure de 25 %',()=>{
    expect(perte({debuffs:{burn:{turns:3}},patch:{setEffects:['fireproofSet']}}))
      .toBe(Math.round(PV*.05*.75));
  });

  it('ne touche ni au Poison ni au Saignement',()=>{
    const patch={setEffects:['fireproofSet']};
    expect(perte({debuffs:{poison:{turns:3}},patch})).toBe(Math.round(PV*.06));
    expect(perte({debuffs:{bleed:{turns:3}},patch})).toBe(Math.round(PV*.045));
  });
});

describe('cumul et bornes',()=>{
  it('additionne tous les degats periodiques du meme tour',()=>{
    const attendu=Math.round(PV*.06)+Math.round(PV*.05)+Math.round(PV*.045)
      +Math.round(PV*(.018+.009))+Math.round(PV*.035);
    expect(perte({debuffs:{
      poison:{turns:3},burn:{turns:3},bleed:{turns:3},
      agony:{turns:3,stacks:1},corruption:{turns:3}
    }})).toBe(attendu);
  });

  it('la Regeneration soigne 6 % et se soustrait aux degats periodiques',()=>{
    const unite=pvApresUnTour({
      debuffs:{poison:{turns:3}},
      buffs:{regen:{turns:3}},
      patch:{hp:PV/2}
    });
    expect(unite.hp).toBe(PV/2-Math.round(PV*.06)+Math.round(PV*.06));
  });

  it('la Regeneration ne fait jamais depasser les PV max',()=>{
    const unite=pvApresUnTour({buffs:{regen:{turns:3}}});
    expect(unite.hp).toBe(PV);
  });

  it('les degats periodiques peuvent tuer, sans PV negatifs',()=>{
    const unite=pvApresUnTour({
      debuffs:{poison:{turns:3},burn:{turns:3},bleed:{turns:3}},
      patch:{hp:10}
    });
    expect(unite.hp).toBe(0);
    expect(unite.dead).toBe(true);
  });

  it('journalise les degats periodiques subis',()=>{
    let{combat,id}=combatSolo();
    combat=giveTurnTo(withStatus(combat,id,{debuffs:{poison:{turns:3}}}),id);
    const suivant=nextTurn(combat);
    expect(suivant.log.some(ligne=>ligne.includes('degats periodiques')
      ||ligne.includes('dégâts périodiques'))).toBe(true);
    expect(suivant.lastEvents.some(evenement=>evenement.type==='dot'
      &&evenement.amount===Math.round(PV*.06))).toBe(true);
  });
});

describe('expiration',()=>{
  it('retire le malus dont la duree tombe a zero',()=>{
    const unite=pvApresUnTour({debuffs:{poison:{turns:1}}});
    expect(unite.debuffs.poison).toBeUndefined();
  });

  it('conserve le malus dont la duree reste positive',()=>{
    const unite=pvApresUnTour({debuffs:{poison:{turns:3}}});
    expect(unite.debuffs.poison.turns).toBe(2);
  });

  it('inflige quand meme les degats du dernier tour avant expiration',()=>{
    expect(perte({debuffs:{poison:{turns:1}}})).toBe(Math.round(PV*.06));
  });
});
