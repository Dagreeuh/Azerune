// Courbe de butin Mythic+ : la progression doit etre reelle a chaque palier.
//
// Les anciennes tables fonctionnaient par blocs, et deux blocs etaient plus
// genereux que le bloc suivant : le palier 10 donnait de meilleures pieces que
// les paliers 11 a 15, le palier 20 que les paliers 21 a 24. La puissance du
// joueur stagnait pendant que les ennemis continuaient de monter, ce qui
// faisait du palier 15 le mur du mode.
//
// Ces tests verrouillent la propriete qui manquait — aucune regression d'un
// palier au suivant — et les valeurs des paliers-jalons, qui n'ont pas bouge.
import{describe,it,expect}from'vitest';
import{mythicLootPreview,generateMythicItem,QUALITIES}from'../src/data/items';

const ECHELLE=['normal','common','rare','epic','legendary'];
const PALIERS=[...Array(30)].map((_,index)=>index+1);

/** Nombre d'etoiles moyen du butin d'un palier. */
const etoilesMoyennes=level=>mythicLootPreview(level).stars
  .reduce((somme,[valeur,poids])=>somme+valeur*poids/100,0);

/** Qualite moyenne, exprimee sur l'echelle normal(0) -> legendaire(4). */
const qualiteMoyenne=level=>mythicLootPreview(level).qualities
  .reduce((somme,[valeur,poids])=>somme+ECHELLE.indexOf(valeur)*poids/100,0);

describe('progression du butin',()=>{
  it('le nombre d’etoiles ne recule jamais d’un palier au suivant',()=>{
    for(let level=2;level<=30;level+=1)
      expect(etoilesMoyennes(level),`palier ${level}`)
        .toBeGreaterThan(etoilesMoyennes(level-1));
  });

  it('la qualite ne recule jamais d’un palier au suivant',()=>{
    for(let level=2;level<=30;level+=1)
      expect(qualiteMoyenne(level),`palier ${level}`)
        .toBeGreaterThan(qualiteMoyenne(level-1));
  });

  it('le niveau d’objet ne recule jamais d’un palier au suivant',()=>{
    for(let level=2;level<=30;level+=1){
      const[bas]=mythicLootPreview(level).itemLevel,[basPrecedent]=mythicLootPreview(level-1).itemLevel;
      expect(bas,`palier ${level}`).toBeGreaterThan(basPrecedent);
    }
  });

  it('aucun palier ne bat le palier 10, sauf ceux qui viennent apres',()=>{
    // La regression exacte qui existait : le jalon 10 surpassait les paliers
    // 11 a 15, donc farmer 15 valait moins que farmer 10.
    for(let level=11;level<=15;level+=1){
      expect(qualiteMoyenne(level),`qualite au palier ${level}`)
        .toBeGreaterThan(qualiteMoyenne(10));
      expect(etoilesMoyennes(level),`etoiles au palier ${level}`)
        .toBeGreaterThan(etoilesMoyennes(10));
    }
  });

  it('le meme piege est ferme autour du jalon 20',()=>{
    for(let level=21;level<=24;level+=1)
      expect(qualiteMoyenne(level),`palier ${level}`)
        .toBeGreaterThan(qualiteMoyenne(20));
  });
});

describe('valeurs des paliers-jalons',()=>{
  // Les jalons gardent exactement leurs valeurs d'avant la correction : aucun
  // palier n'a ete affaibli, seuls les intermediaires ont ete releves.
  it('le palier 1 reste 2★ et l’entree de gamme',()=>{
    expect(etoilesMoyennes(1)).toBe(2);
    expect(qualiteMoyenne(1)).toBeCloseTo(.95,2);
  });

  it('le palier 6 garde les valeurs de son ancien bloc',()=>{
    // Sans ce jalon, l'interpolation depuis le palier 1 creuserait la bande
    // d'entree : les paliers 6 a 9 recevraient moins qu'avant la correction.
    expect(etoilesMoyennes(6)).toBeCloseTo(2.20,2);
    expect(qualiteMoyenne(6)).toBeCloseTo(1.42,2);
  });

  it('aucun palier ne recoit moins qu’avant la correction',()=>{
    // Valeurs moyennes des anciennes tables par bloc. Le correctif devait
    // supprimer les creux, jamais affaiblir un palier.
    const avant=level=>{
      const etoiles=level<=5?2:level<=9?2.2:level<=15?3:level<=19?3.25:level<=24?4:level<=29?4.2:5,
        qualite=level<=5?.95:level<=9?1.42:level===10?2.20:level<=15?1.95:level<=19?2.37
          :level===20?2.70:level<=24?2.65:level<=29?2.92:3.30;
      return{etoiles,qualite};
    };
    PALIERS.forEach(level=>{
      expect(etoilesMoyennes(level),`etoiles au palier ${level}`)
        .toBeGreaterThanOrEqual(avant(level).etoiles-.001);
      expect(qualiteMoyenne(level),`qualite au palier ${level}`)
        .toBeGreaterThanOrEqual(avant(level).qualite-.001);
    });
  });

  it('le palier 10 reste 3★ et rare/epique 80-20',()=>{
    expect(etoilesMoyennes(10)).toBe(3);
    expect(mythicLootPreview(10).qualities).toEqual([['rare',80],['epic',20]]);
  });

  it('le palier 20 reste 4★',()=>{
    expect(etoilesMoyennes(20)).toBe(4);
    expect(qualiteMoyenne(20)).toBeCloseTo(2.70,2);
  });

  it('le palier 30 reste 5★ et epique/legendaire 70-30',()=>{
    expect(etoilesMoyennes(30)).toBe(5);
    expect(mythicLootPreview(30).qualities).toEqual([['epic',70],['legendary',30]]);
  });

  it('le sommet de la courbe n’a pas ete gonfle',()=>{
    // Le correctif ne devait pas enrichir la fin de jeu, seulement supprimer
    // les creux : le legendaire reste plafonne a 30 % au dernier palier.
    const legendaire=mythicLootPreview(30).qualities.find(([nom])=>nom==='legendary');
    expect(legendaire[1]).toBeLessThanOrEqual(30);
  });
});

// Note : `mythicSplit` conserve une garde `part >= 100` qu'aucune table
// actuelle ne peut atteindre — les jalons ne produisent jamais de fraction
// superieure a 0,9. C'est une protection pour les tables futures, et aucune
// mutation ne peut donc la tuer.
describe('coherence des tables',()=>{
  it('chaque palier declare des poids qui totalisent 100',()=>{
    PALIERS.forEach(level=>{
      const apercu=mythicLootPreview(level);
      const somme=liste=>liste.reduce((total,[,poids])=>total+poids,0);
      expect(somme(apercu.stars),`etoiles au palier ${level}`).toBe(100);
      expect(somme(apercu.qualities),`qualites au palier ${level}`).toBe(100);
    });
  });

  it('aucune qualite annoncee n’est inconnue du jeu',()=>{
    PALIERS.forEach(level=>mythicLootPreview(level).qualities.forEach(([nom])=>{
      expect(QUALITIES[nom],`qualite ${nom} au palier ${level}`).toBeTruthy();
      expect(ECHELLE).toContain(nom);
    }));
  });

  it('l’Unique ne tombe jamais dans le butin Mythic+',()=>{
    // La qualite Unique est reservee aux armes de chronique.
    PALIERS.forEach(level=>
      expect(mythicLootPreview(level).qualities.map(([nom])=>nom)).not.toContain('unique'));
  });

  it('les etoiles restent dans les bornes du jeu',()=>{
    PALIERS.forEach(level=>mythicLootPreview(level).stars.forEach(([valeur])=>{
      expect(valeur).toBeGreaterThanOrEqual(2);
      expect(valeur).toBeLessThanOrEqual(5);
      expect(Number.isInteger(valeur)).toBe(true);
    }));
  });

  it('une piece generee respecte les bornes annoncees par l’apercu',()=>{
    // L'apercu et le generateur doivent lire les memes tables : c'est le
    // contrat que le joueur voit avant de lancer une course.
    [1,7,15,23,30].forEach(level=>{
      const apercu=mythicLootPreview(level),
        etoiles=new Set(apercu.stars.map(([valeur])=>valeur)),
        qualites=new Set(apercu.qualities.map(([nom])=>nom));
      for(let tirage=0;tirage<80;tirage+=1){
        const piece=generateMythicItem({level});
        expect(etoiles.has(piece.stars),`etoiles au palier ${level}`).toBe(true);
        expect(qualites.has(piece.quality),`qualite au palier ${level}`).toBe(true);
        expect(piece.itemLevel).toBeGreaterThanOrEqual(apercu.itemLevel[0]);
        expect(piece.itemLevel).toBeLessThanOrEqual(apercu.itemLevel[1]);
      }
    });
  });
});
