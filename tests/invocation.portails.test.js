import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{BANNERS,DEFAULT_BANNER,bannerById,fiveStarPool,monthlyFeatured,monthKey,resolveFiveStar,
  ELECTED_SHARE,MONTHLY_SHARE,MONTHLY_FEATURED_COUNT,SUMMON_COST,PITY_THRESHOLD}from'../src/data/banners';
import{mulberry32}from'./helpers';

const POOL=fiveStarPool(HEROES);
/** Tirage d'un 5★ sur un portail, avec un generateur maitrise. */
const tirer=(bannerId,options={},alea=Math.random)=>resolveFiveStar({
  bannerId,roll:alea(),pick:list=>list[Math.floor(alea()*list.length)],heroes:HEROES,...options});

describe('les portails existent et se distinguent',()=>{
  it('trois portails, identifiants uniques',()=>{
    expect(BANNERS).toHaveLength(3);
    expect(new Set(BANNERS.map(entry=>entry.id)).size).toBe(3);
  });
  it('le portail par defaut existe',()=>{
    expect(BANNERS.some(entry=>entry.id===DEFAULT_BANNER)).toBe(true);
  });
  it('un identifiant inconnu retombe sur un portail valide',()=>{
    expect(BANNERS).toContain(bannerById('inexistant'));
    expect(BANNERS).toContain(bannerById(undefined));
  });
  it('seul le Portail ancestral accepte les Pierres de foyer',()=>{
    expect(BANNERS.filter(entry=>entry.acceptsStones).map(entry=>entry.id)).toEqual(['ancestral']);
  });
});

describe('aucun portail ne change les taux',()=>{
  // C'est l'invariant qui permet d'ouvrir deux portails sans revoir l'economie :
  // ils changent la cible, jamais le volume. Un portail qui releverait le taux
  // de 5★ ferait de tous les cristaux gagnes une valeur differente selon
  // l'endroit ou on les depense.
  it('le prix est identique sur les trois portails',()=>{
    expect(SUMMON_COST.single).toBe(100);
    expect(SUMMON_COST.multi).toBe(900);
  });
  it('resolveFiveStar rend toujours un 5★, quel que soit le portail',()=>{
    const alea=mulberry32(7);
    BANNERS.forEach(banner=>{
      for(let essai=0;essai<200;essai+=1){
        const sortie=tirer(banner.id,{electedId:POOL[0],featured:POOL.slice(0,3)},alea);
        expect(POOL).toContain(sortie.id);
      }
    });
  });
  it('le compteur de garantie est commun : un seul seuil, pas un par portail',()=>{
    expect(PITY_THRESHOLD).toBe(100);
  });
  it('les parts annoncees a l’ecran sont bien celles du code',()=>{
    // Ces trois nombres sont affiches au joueur (« une chance sur deux »,
    // « trois chances sur quatre », « trois 5★ »). Les comparer entre eux ne
    // suffit pas : une constante qui bouge emporterait la promesse avec elle.
    expect(ELECTED_SHARE).toBe(.50);
    expect(MONTHLY_SHARE).toBe(.75);
    expect(MONTHLY_FEATURED_COUNT).toBe(3);
  });
});

describe('Vœu d’Azerune — l’élu',()=>{
  it('un roll sous le seuil donne l’élu',()=>{
    const sortie=resolveFiveStar({bannerId:'voeu',electedId:POOL[2],roll:ELECTED_SHARE-.01,heroes:HEROES});
    expect(sortie.id).toBe(POOL[2]);
    expect(sortie.onTarget).toBe(true);
    expect(sortie.guaranteed).toBe(false);
  });
  it('un roll au-dessus du seuil donne un autre champion et arme la garantie',()=>{
    const sortie=resolveFiveStar({bannerId:'voeu',electedId:POOL[2],roll:ELECTED_SHARE+.01,
      pick:list=>list[0],heroes:HEROES});
    expect(sortie.id).not.toBe(POOL[2]);
    expect(sortie.guaranteed).toBe(true);
    expect(sortie.onTarget).toBe(false);
  });
  it('la garantie armee force l’élu au 5★ suivant, meme sur un mauvais roll',()=>{
    const sortie=resolveFiveStar({bannerId:'voeu',electedId:POOL[2],guaranteed:true,roll:.999,heroes:HEROES});
    expect(sortie.id).toBe(POOL[2]);
    expect(sortie.guaranteed).toBe(false);
  });
  it('sans élu nomme, le portail se comporte comme le pool complet',()=>{
    const sortie=resolveFiveStar({bannerId:'voeu',electedId:null,roll:.99,pick:list=>list[0],heroes:HEROES});
    expect(POOL).toContain(sortie.id);
    expect(sortie.guaranteed).toBe(false);
  });
  it('un élu qui n’est pas un 5★ est ignore',()=>{
    const troisEtoiles=HEROES.find(hero=>hero.rarity===3);
    const sortie=resolveFiveStar({bannerId:'voeu',electedId:troisEtoiles.id,roll:0,pick:list=>list[0],heroes:HEROES});
    expect(sortie.id).not.toBe(troisEtoiles.id);
    expect(POOL).toContain(sortie.id);
  });
  it('sur la duree, deux 5★ suffisent en moyenne a obtenir l’élu',()=>{
    // 50 % puis garantie : au pire deux 5★. C'est la promesse affichee.
    const alea=mulberry32(99);let total=0;
    for(let essai=0;essai<400;essai+=1){
      let garanti=false,tirages=0;
      for(;;){
        tirages+=1;
        const sortie=resolveFiveStar({bannerId:'voeu',electedId:POOL[1],guaranteed:garanti,
          roll:alea(),pick:list=>list[Math.floor(alea()*list.length)],heroes:HEROES});
        garanti=sortie.guaranteed;
        if(sortie.id===POOL[1])break;
        expect(tirages).toBeLessThan(3);
      }
      total+=tirages;
    }
    expect(total/400).toBeLessThan(1.6);
    expect(total/400).toBeGreaterThan(1.3);
  });
});

describe('Conjonction mensuelle — le trio',()=>{
  it('trois champions 5★ mis en avant',()=>{
    const trio=monthlyFeatured(new Date(2026,8,1),HEROES);
    expect(trio).toHaveLength(MONTHLY_FEATURED_COUNT);
    expect(new Set(trio).size).toBe(MONTHLY_FEATURED_COUNT);
    trio.forEach(id=>expect(POOL).toContain(id));
  });
  it('le trio est stable dans le mois : deux amis voient la meme chose',()=>{
    const a=monthlyFeatured(new Date(2026,8,1),HEROES);
    const b=monthlyFeatured(new Date(2026,8,27,23,59),HEROES);
    expect(b).toEqual(a);
  });
  it('le trio change d’un mois a l’autre',()=>{
    const mois=Array.from({length:12},(unused,index)=>monthlyFeatured(new Date(2026,index,15),HEROES).join('-'));
    expect(new Set(mois).size).toBeGreaterThan(6);
  });
  it('la rotation tient compte de l’annee',()=>{
    // Decembre 2026 contre janvier 2027 ne prouverait rien : les deux mois
    // different deja. Le defaut a debusquer est un decembre identique d'une
    // annee sur l'autre, soit une rotation qui boucle sur douze trios.
    expect(monthKey(new Date(2026,11,1))).not.toBe(monthKey(new Date(2027,11,1)));
    expect(monthlyFeatured(new Date(2026,11,1),HEROES))
      .not.toEqual(monthlyFeatured(new Date(2027,11,1),HEROES));
  });
  it('l’ordre du fichier source ne decide pas du trio',()=>{
    // Le pool est trie avant melange. Sans ce tri, reordonner heroes.js
    // changerait la rotation de tous les mois, pour tout le monde.
    const melange=[...HEROES].reverse();
    expect(fiveStarPool(melange)).toEqual(fiveStarPool(HEROES));
    expect(monthlyFeatured(new Date(2026,5,1),melange))
      .toEqual(monthlyFeatured(new Date(2026,5,1),HEROES));
  });

  it('un roll sous le seuil donne l’un des trois',()=>{
    const trio=POOL.slice(0,3);
    const sortie=resolveFiveStar({bannerId:'conjonction',featured:trio,roll:MONTHLY_SHARE-.01,
      pick:list=>list[0],heroes:HEROES});
    expect(trio).toContain(sortie.id);
    expect(sortie.onTarget).toBe(true);
  });
  it('un roll au-dessus du seuil sort du trio',()=>{
    const trio=POOL.slice(0,3);
    const sortie=resolveFiveStar({bannerId:'conjonction',featured:trio,roll:MONTHLY_SHARE+.01,
      pick:list=>list[0],heroes:HEROES});
    expect(trio).not.toContain(sortie.id);
    expect(sortie.onTarget).toBe(false);
  });
  it('la Conjonction n’arme aucune garantie : c’est la difference avec le Vœu',()=>{
    [MONTHLY_SHARE-.01,MONTHLY_SHARE+.01].forEach(roll=>{
      expect(resolveFiveStar({bannerId:'conjonction',featured:POOL.slice(0,3),roll,
        pick:list=>list[0],heroes:HEROES}).guaranteed).toBe(false);
    });
  });
});

describe('le ciblage tient les promesses affichees',()=>{
  const mesurer=(bannerId,options,cible)=>{
    const alea=mulberry32(2024);let touches=0;const total=20000;
    for(let essai=0;essai<total;essai+=1){
      if(cible(tirer(bannerId,options,alea).id))touches+=1;
    }
    return touches/total;
  };
  it('le Portail ancestral ne favorise personne',()=>{
    const part=mesurer('ancestral',{},id=>id===POOL[0]);
    expect(Math.abs(part-1/POOL.length)).toBeLessThan(.02);
  });
  it('le Vœu tient sa moitie, garantie desarmee',()=>{
    const part=mesurer('voeu',{electedId:POOL[0],guaranteed:false},id=>id===POOL[0]);
    expect(Math.abs(part-ELECTED_SHARE)).toBeLessThan(.02);
  });
  it('la Conjonction tient ses trois quarts',()=>{
    const trio=POOL.slice(0,3);
    const part=mesurer('conjonction',{featured:trio},id=>trio.includes(id));
    expect(Math.abs(part-MONTHLY_SHARE)).toBeLessThan(.02);
  });
  it('le Vœu cible mieux un champion precis que la Conjonction',()=>{
    // Le Vœu vise UN champion ; la Conjonction repartit sur trois. Choisir doit
    // valoir mieux que subir le trio, sinon le Vœu n'a pas de raison d'exister.
    const trio=POOL.slice(0,3);
    const voeu=mesurer('voeu',{electedId:trio[0],guaranteed:false},id=>id===trio[0]);
    const conjonction=mesurer('conjonction',{featured:trio},id=>id===trio[0]);
    expect(voeu).toBeGreaterThan(conjonction);
  });
  it('la Conjonction cible mieux « l’un des trois » que le Vœu',()=>{
    // Et reciproquement : subir le trio doit valoir mieux que viser hors trio,
    // sinon la Conjonction n'a pas de raison d'exister.
    const trio=POOL.slice(0,3);
    const conjonction=mesurer('conjonction',{featured:trio},id=>trio.includes(id));
    const voeu=mesurer('voeu',{electedId:POOL[POOL.length-1],guaranteed:false},id=>trio.includes(id));
    expect(conjonction).toBeGreaterThan(voeu);
  });
});
