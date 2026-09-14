import{describe,it,expect}from'vitest';
import{CONTINENTS,DIFFICULTIES,createMission,elementDuPalier}from'../src/data/campaign';
import{HEROES}from'../src/data/heroes';
import{CUSTOM_HEROES}from'../src/data/customHeroes';
import{normalizeElement,ELEMENTS,affinity}from'../src/utils/elements';

const NOMS=Object.keys(ELEMENTS);
// On lit les ennemis INSTANCIÉS, jamais le texte source : l'élément est passé
// positionnellement du tuple de zone jusqu'au constructeur, et un grep sur
// `element:'…'` m'avait fait conclure à tort qu'il n'y en avait aucun.
const ennemis=CONTINENTS.flatMap(continent=>
  continent.stages.flatMap(stage=>
    createMission(DIFFICULTIES[0],continent,stage).enemies.map(u=>({
      zone:continent.id,stage:stage.id,element:normalizeElement(u.element)}))));

const part=element=>ennemis.filter(u=>u.element===element).length/ennemis.length;

describe('éléments des ennemis de campagne',()=>{
  it('couvre les six éléments',()=>{
    // Eau était absente de toute la campagne : les huit champions Nature du
    // roster ne pouvaient être efficaces nulle part, Nature ne battant que
    // l'Eau. Aucun élément ne doit redevenir orphelin.
    NOMS.forEach(e=>expect(part(e),`${e} absent de la campagne`).toBeGreaterThan(0));
  });

  it('n’en laisse aucun écraser les autres',()=>{
    // Avant : Feu 30 %, Lumière 30 %, Eau 0 %. La borne haute est volontairement
    // lâche — c'est un garde-fou contre la dérive, pas un réglage fin.
    NOMS.forEach(e=>{
      expect(part(e),`${e} trop rare`).toBeGreaterThanOrEqual(.10);
      expect(part(e),`${e} trop fréquent`).toBeLessThanOrEqual(.25);
    });
  });

  it('garde à chaque zone son élément dominant',()=>{
    // L'identité du lieu ne bouge pas : la Crypte reste Ombre, les Forges
    // restent Feu. C'est ce qui sépare « varier » de « mélanger au hasard ».
    CONTINENTS.forEach(continent=>{
      const compte={};
      continent.stages.forEach(stage=>{
        const e=elementDuPalier(continent.id,stage.id);
        compte[e]=(compte[e]||0)+1;
      });
      const[dominant,n]=Object.entries(compte).sort((a,b)=>b[1]-a[1])[0];
      expect(n,`${continent.id} : dominante trop faible`).toBeGreaterThanOrEqual(4);
      expect(elementDuPalier(continent.id,'7'),
        `${continent.id} : le gardien doit porter l’élément de la zone`).toBe(dominant);
    });
  });

  it('fait varier les éléments À L’INTÉRIEUR de chaque zone',()=>{
    // Une zone monolithique ne demande qu'une décision, à l'entrée, puis plus
    // aucune pendant 21 combats.
    CONTINENTS.forEach(continent=>{
      const vus=new Set(continent.stages.map(stage=>elementDuPalier(continent.id,stage.id)));
      expect(vus.size,`${continent.id} : une seule couleur sur 7 paliers`).toBeGreaterThanOrEqual(2);
    });
  });

  it('donne le même élément aux ennemis d’un même palier',()=>{
    // La lisibilité passe avant la finesse : un combat annonce une couleur.
    CONTINENTS.forEach(continent=>continent.stages.forEach(stage=>{
      const m=createMission(DIFFICULTIES[0],continent,stage);
      const els=new Set(m.enemies.map(u=>normalizeElement(u.element)));
      expect(els.size,`${continent.id}/${stage.id}`).toBe(1);
    }));
  });
});

describe('équité entre champions',()=>{
  const roster=[...HEROES,...CUSTOM_HEROES];

  it('ne laisse aucun élément sans bon moment',()=>{
    NOMS.forEach(e=>{
      const efficace=ennemis.filter(u=>affinity(e,u.element).key==='effective').length;
      expect(efficace,`${e} n’est efficace nulle part`).toBeGreaterThan(0);
    });
  });

  it('garde l’avantage net dans une fourchette étroite',()=>{
    // Avant : de -30 points (Nature) à +20 (Feu, Ombre), soit 50 points d'écart
    // entre deux champions de puissance identique, invisible pour le joueur.
    const nets=NOMS.map(e=>{
      const c={effective:0,neutral:0,weak:0};
      ennemis.forEach(u=>{c[affinity(e,u.element).key]+=1});
      return{e,net:(c.effective-c.weak)/ennemis.length*100};
    });
    nets.forEach(({e,net})=>
      expect(Math.abs(net),`${e} : ${net.toFixed(0)} points d’écart`).toBeLessThanOrEqual(8));
    const ecart=Math.max(...nets.map(n=>n.net))-Math.min(...nets.map(n=>n.net));
    expect(ecart,'amplitude entre le mieux et le moins bien servi').toBeLessThanOrEqual(12);
  });

  it('n’oublie pas le groupe le plus nombreux du roster',()=>{
    // Nature compte huit champions — plus que tout autre élément — et n'avait
    // aucun bon moment. Ce test nomme le cas qui a déclenché le chantier.
    const parElement={};
    roster.forEach(h=>{const e=normalizeElement(h.element);parElement[e]=(parElement[e]||0)+1});
    const[plusNombreux]=Object.entries(parElement).sort((a,b)=>b[1]-a[1])[0];
    const efficace=ennemis.filter(u=>affinity(plusNombreux,u.element).key==='effective').length;
    expect(efficace/ennemis.length,`${plusNombreux} : trop peu de bons moments`)
      .toBeGreaterThanOrEqual(.12);
  });
});
