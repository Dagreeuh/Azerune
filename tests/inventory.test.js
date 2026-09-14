// Inventaire : valeur de revente et protections avant destruction.
//
// La vente et le recyclage partageaient trois protections ecrites deux fois.
// Elles sont desormais en un seul endroit : ces tests garantissent qu'elles ne
// peuvent plus diverger, et qu'aucune ne saute.
import{describe,it,expect}from'vitest';
import{SELL_QUALITY_MULTIPLIERS,itemSellValue,isItemEquipped,disposalBlock}
  from'../src/utils/inventory';

const objet=(patch={})=>({id:'o1',name:'Casque',itemLevel:20,stars:3,quality:'rare',
  locked:false,unique:false,...patch});

describe('valeur de revente',()=>{
  it('suit la formule (niveau + 10) x etoiles x qualite',()=>{
    expect(itemSellValue(objet({itemLevel:20,stars:3,quality:'rare'})))
      .toBe(Math.round(30*3*1.8));
  });

  it('applique le bareme de qualite annonce',()=>{
    expect(SELL_QUALITY_MULTIPLIERS).toEqual({normal:1,common:1.3,rare:1.8,epic:2.7,legendary:5});
  });

  it('monte avec la qualite, a niveau et etoiles egaux',()=>{
    const valeurs=['normal','common','rare','epic','legendary']
      .map(quality=>itemSellValue(objet({quality})));
    for(let i=1;i<valeurs.length;i+=1)expect(valeurs[i]).toBeGreaterThan(valeurs[i-1]);
  });

  it('monte avec le niveau et avec les etoiles',()=>{
    expect(itemSellValue(objet({itemLevel:60}))).toBeGreaterThan(itemSellValue(objet()));
    expect(itemSellValue(objet({stars:5}))).toBeGreaterThan(itemSellValue(objet({stars:3})));
  });

  it('traite une qualite inconnue comme un multiplicateur neutre',()=>{
    expect(itemSellValue(objet({quality:'mythique'}))).toBe(Math.round(30*3*1));
  });

  it('ne renvoie jamais NaN sur un objet incomplet',()=>{
    [{},objet({itemLevel:undefined}),objet({stars:undefined}),
     objet({itemLevel:'abc',stars:'abc'})].forEach(cible=>{
      const valeur=itemSellValue(cible);
      expect(Number.isFinite(valeur),JSON.stringify(cible).slice(0,40)).toBe(true);
      expect(valeur).toBeGreaterThanOrEqual(0);
    });
  });

  it('vaut zero sans objet',()=>{
    expect(itemSellValue(null)).toBe(0);
    expect(itemSellValue(undefined)).toBe(0);
  });
});

describe('objet porte par un champion',()=>{
  const equipement={7:{Arme:'o1',Casque:'o2'},9:{Bottes:'o3'}};

  it('reconnait un objet equipe, quel que soit le champion',()=>{
    expect(isItemEquipped('o1',equipement)).toBe(true);
    expect(isItemEquipped('o3',equipement)).toBe(true);
  });

  it('ne signale pas un objet libre',()=>{
    expect(isItemEquipped('o9',equipement)).toBe(false);
  });

  it('tolere un equipement vide, nul ou troue',()=>{
    expect(isItemEquipped('o1',{})).toBe(false);
    expect(isItemEquipped('o1',null)).toBe(false);
    expect(isItemEquipped('o1',{7:null,9:undefined})).toBe(false);
  });
});

describe('protections avant destruction',()=>{
  const equipement={7:{Arme:'equipe'}};

  it('laisse passer un objet libre',()=>{
    expect(disposalBlock(objet(),equipement,'vendre')).toBeNull();
    expect(disposalBlock(objet(),equipement,'recycler')).toBeNull();
  });

  it('refuse un objet absent',()=>{
    expect(disposalBlock(null,equipement,'vendre')).toContain('introuvable');
  });

  it('protege une arme Unique',()=>{
    expect(disposalBlock(objet({unique:true}),equipement,'vendre')).toContain('Unique');
    expect(disposalBlock(objet({unique:true}),equipement,'recycler')).toContain('Unique');
  });

  it('protege un objet verrouille',()=>{
    expect(disposalBlock(objet({locked:true}),equipement,'vendre')).toContain('Déverrouille');
  });

  it('protege un objet porte par un champion',()=>{
    expect(disposalBlock(objet({id:'equipe'}),equipement,'vendre')).toContain('Retire');
  });

  it('accorde le message a l action demandee',()=>{
    expect(disposalBlock(objet({unique:true}),equipement,'recycler')).toContain('recyclée');
    expect(disposalBlock(objet({unique:true}),equipement,'vendre')).toContain('vendue');
    expect(disposalBlock(objet({locked:true}),equipement,'recycler')).toContain('le recycler');
    expect(disposalBlock(objet({locked:true}),equipement,'vendre')).toContain('le vendre');
  });

  it('applique les memes protections a la vente et au recyclage',()=>{
    // Les deux chemins partagent ce controle : aucun ne doit etre plus permissif.
    [{unique:true},{locked:true},{id:'equipe'}].forEach(patch=>{
      const cible=objet(patch);
      expect(Boolean(disposalBlock(cible,equipement,'vendre')),JSON.stringify(patch)).toBe(true);
      expect(Boolean(disposalBlock(cible,equipement,'recycler')),JSON.stringify(patch)).toBe(true);
    });
  });

  it('signale la protection la plus forte en premier',()=>{
    // Un objet Unique, verrouille ET equipe doit parler de son unicite.
    const cumul=objet({id:'equipe',unique:true,locked:true});
    expect(disposalBlock(cumul,equipement,'vendre')).toContain('Unique');
  });
});
