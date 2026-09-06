// Boutique : rafraichissement, emplacements, achat.
//
// Regles extraites de GameProvider. Un controle rate ici coute une devise au
// joueur, ou lui en donne indument.
import{describe,it,expect}from'vitest';
import{SHOP_CURRENCIES,INVENTORY_LIMIT,refreshCost,canRefreshShop,
        nextSlotCost,canUnlockSlot,offerBalance,canBuyOffer}from'../src/utils/shop';
import{SHOP_BASE_SLOTS,SHOP_MAX_SLOTS,SHOP_SLOT_COSTS,SHOP_REFRESH_COSTS,
        SHOP_MAX_REFRESHES,generateShopOffers}from'../src/data/shop';

describe('cout de rafraichissement',()=>{
  it('suit le bareme annonce',()=>{
    // Fige en clair : lire la table des deux cotes ne testerait rien.
    expect(SHOP_REFRESH_COSTS).toEqual([25,50,100,150,150]);
    expect(SHOP_MAX_REFRESHES).toBe(5);
    // La table et la limite doivent rester couplees : ajouter un cout sans
    // relever la limite rendrait le dernier inatteignable, et l'inverse
    // ferait dependre le refus d'une case de tableau absente.
    expect(SHOP_REFRESH_COSTS).toHaveLength(SHOP_MAX_REFRESHES);
    [25,50,100,150,150].forEach((cout,index)=>expect(refreshCost(index),`n°${index}`).toBe(cout));
  });

  it('n en propose plus une fois la limite atteinte',()=>{
    expect(refreshCost(SHOP_MAX_REFRESHES)).toBeNull();
    expect(refreshCost(99)).toBeNull();
  });

  it('le cout ne decroit jamais',()=>{
    for(let index=1;index<SHOP_MAX_REFRESHES;index+=1)
      expect(refreshCost(index)).toBeGreaterThanOrEqual(refreshCost(index-1));
  });

  it('traite un compteur negatif ou invalide comme un premier rafraichissement',()=>{
    // Une sauvegarde importee peut porter n importe quoi. Un cout indefini se
    // propagerait en NaN sur le solde de cristaux, ce qui est irrattrapable.
    [-1,-50,undefined,null,'abc',NaN].forEach(valeur=>
      expect(refreshCost(valeur),String(valeur)).toBe(25));
  });
});

describe('autorisation de rafraichir',()=>{
  it('refuse au-dela de la limite quotidienne',()=>{
    const resultat=canRefreshShop({refreshCount:SHOP_MAX_REFRESHES},99999);
    expect(resultat.ok).toBe(false);
    expect(resultat.message).toContain('Limite');
  });

  it('refuse un solde insuffisant, en annoncant le prix',()=>{
    const resultat=canRefreshShop({refreshCount:0},10);
    expect(resultat.ok).toBe(false);
    expect(resultat.message).toContain('25');
    expect(resultat.cost).toBe(25);
  });

  it('accepte un solde tout juste suffisant',()=>{
    expect(canRefreshShop({refreshCount:0},25)).toEqual({ok:true,cost:25});
  });

  it('ne renvoie jamais un cout non fini',()=>{
    [-1,0,3,4,5,99].forEach(refreshCount=>{
      const resultat=canRefreshShop({refreshCount},99999);
      if(resultat.ok)expect(Number.isFinite(resultat.cost),String(refreshCount)).toBe(true);
    });
  });
});

describe('emplacements de boutique',()=>{
  it('suit le bareme annonce, du 7e au 12e',()=>{
    expect(SHOP_BASE_SLOTS).toBe(6);
    expect(SHOP_MAX_SLOTS).toBe(12);
    expect(SHOP_SLOT_COSTS).toEqual({7:300,8:600,9:1000,10:1500,11:2200,12:3000});
    for(let slot=SHOP_BASE_SLOTS;slot<SHOP_MAX_SLOTS;slot+=1)
      expect(nextSlotCost(slot),`depuis ${slot}`).toBe(SHOP_SLOT_COSTS[slot+1]);
  });

  it('le prix monte a chaque emplacement',()=>{
    for(let slot=SHOP_BASE_SLOTS+1;slot<SHOP_MAX_SLOTS;slot+=1)
      expect(nextSlotCost(slot)).toBeGreaterThan(nextSlotCost(slot-1));
  });

  it('n en propose plus au dernier emplacement',()=>{
    expect(nextSlotCost(SHOP_MAX_SLOTS)).toBeNull();
    expect(nextSlotCost(99)).toBeNull();
  });

  it('borne un compte d emplacements invalide sur la base',()=>{
    [0,-3,undefined,'abc'].forEach(valeur=>
      expect(nextSlotCost(valeur),String(valeur)).toBe(SHOP_SLOT_COSTS[SHOP_BASE_SLOTS+1]));
  });

  it('annonce le numero du prochain emplacement',()=>{
    expect(canUnlockSlot({slotCount:6},99999)).toEqual({ok:true,cost:300,next:7});
    expect(canUnlockSlot({slotCount:11},99999)).toEqual({ok:true,cost:3000,next:12});
  });

  it('refuse un solde insuffisant sans consommer quoi que ce soit',()=>{
    const resultat=canUnlockSlot({slotCount:6},299);
    expect(resultat.ok).toBe(false);
    expect(resultat.cost).toBe(300);
  });

  it('refuse quand tout est debloque',()=>{
    expect(canUnlockSlot({slotCount:SHOP_MAX_SLOTS},99999).ok).toBe(false);
  });
});

describe('achat d une offre',()=>{
  const offre=(patch={})=>({id:'o1',type:'stones',currency:'gold',price:1000,
    stock:1,sold:0,amount:1,...patch});
  const soldes={gold:5000,gems:500,bloodFragments:50};

  it('accepte une offre payable',()=>{
    expect(canBuyOffer(offre(),soldes,0)).toEqual({ok:true});
  });

  it('refuse une offre absente',()=>{
    expect(canBuyOffer(null,soldes,0).ok).toBe(false);
    expect(canBuyOffer(undefined,soldes,0).message).toContain('introuvable');
  });

  it('refuse une offre deja vendue',()=>{
    expect(canBuyOffer(offre({sold:1,stock:1}),soldes,0).message).toContain('déjà vendue');
  });

  it('lit le solde de la bonne devise',()=>{
    expect(offerBalance(offre({currency:'gold'}),soldes)).toBe(5000);
    expect(offerBalance(offre({currency:'gems'}),soldes)).toBe(500);
    expect(offerBalance(offre({currency:'blood'}),soldes)).toBe(50);
  });

  it('refuse un solde insuffisant dans chaque devise',()=>{
    expect(canBuyOffer(offre({currency:'gold',price:6000}),soldes,0).ok).toBe(false);
    expect(canBuyOffer(offre({currency:'gems',price:600}),soldes,0).ok).toBe(false);
    expect(canBuyOffer(offre({currency:'blood',price:60}),soldes,0).ok).toBe(false);
  });

  it('accepte un solde exactement egal au prix',()=>{
    expect(canBuyOffer(offre({currency:'blood',price:50}),soldes,0).ok).toBe(true);
  });

  it('refuse une devise inconnue pour la bonne raison',()=>{
    // Sans ce controle, le solde d une devise inconnue vaut 0 et l offre serait
    // refusee pour « solde insuffisant » : meme verdict, mauvais diagnostic.
    const resultat=canBuyOffer(offre({currency:'coquillages'}),soldes,0);
    expect(resultat.ok).toBe(false);
    expect(resultat.message).toBe('Devise inconnue.');
    expect(offerBalance(offre({currency:'coquillages'}),soldes)).toBe(0);
  });

  it('refuse un equipement quand l inventaire est plein',()=>{
    const resultat=canBuyOffer(offre({type:'gear'}),soldes,INVENTORY_LIMIT);
    expect(resultat.ok).toBe(false);
    expect(resultat.message).toContain(String(INVENTORY_LIMIT));
  });

  it('laisse passer une ressource meme avec l inventaire plein',()=>{
    expect(canBuyOffer(offre({type:'stones'}),soldes,INVENTORY_LIMIT).ok).toBe(true);
  });

  it('les trois devises de la boutique sont declarees',()=>{
    expect(Object.keys(SHOP_CURRENCIES).sort()).toEqual(['blood','gems','gold']);
  });
});

describe('offres generees',()=>{
  it('produit exactement le nombre d emplacements demande',()=>{
    [SHOP_BASE_SLOTS,9,SHOP_MAX_SLOTS].forEach(nombre=>
      expect(generateShopOffers(nombre),`${nombre} emplacements`).toHaveLength(nombre));
  });

  it('chaque offre est achetable en principe',()=>{
    generateShopOffers(SHOP_MAX_SLOTS).forEach(offre=>{
      expect(SHOP_CURRENCIES[offre.currency],`devise de ${offre.name}`).toBeTruthy();
      expect(offre.price,`prix de ${offre.name}`).toBeGreaterThan(0);
      expect(offre.stock,`stock de ${offre.name}`).toBeGreaterThan(0);
      expect(offre.sold).toBe(0);
      expect(offre.name).toBeTruthy();
    });
  });

  it('une offre de ressource annonce toujours une quantite',()=>{
    generateShopOffers(SHOP_MAX_SLOTS).filter(offre=>offre.type!=='gear')
      .forEach(offre=>expect(offre.amount,`${offre.name}`).toBeGreaterThan(0));
  });

  it('une offre d equipement annonce toujours ce qu elle contient',()=>{
    generateShopOffers(SHOP_MAX_SLOTS).filter(offre=>offre.type==='gear')
      .forEach(offre=>{
        expect(offre.gear,`${offre.name}`).toBeTruthy();
        expect(offre.gear.stars).toBeGreaterThan(0);
      });
  });

  it('reserve le dernier emplacement aux Fragments de sang',()=>{
    [SHOP_BASE_SLOTS,SHOP_MAX_SLOTS].forEach(nombre=>{
      const offres=generateShopOffers(nombre);
      expect(offres[nombre-1].currency,`${nombre} emplacements`).toBe('blood');
      expect(offres.slice(0,-1).every(offre=>offre.currency!=='blood')).toBe(true);
    });
  });

  it('les identifiants d offres sont uniques',()=>{
    const ids=generateShopOffers(SHOP_MAX_SLOTS).map(offre=>offre.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
