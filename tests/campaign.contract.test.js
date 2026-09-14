// Contrat de cablage de la Campagne.
//
// Chaque continent porte une mecanique de zone, appliquee par le moteur via
// `actor.campaignZone`, qui vaut toujours `continent.id`. Si le moteur teste un
// identifiant qui n'est plus celui d'aucun continent, la mecanique ne se
// declenche jamais : aucune erreur, aucune trace, le continent perd simplement
// sa particularite.
//
// C'est ce qui s'etait produit apres la refonte de la Campagne de 15 a 10 zones.
// Le moteur traitait encore 'rempart-anciens', ancien identifiant, alors que le
// continent s'appelle desormais 'rempart-endurance' : le neuvieme continent,
// niveaux 49 a 54, n'avait plus aucune mecanique active.
import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{CONTINENTS,DIFFICULTIES}from'../src/data/campaign';

const moteur=fs.readFileSync(
  fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8');
const donnees=fs.readFileSync(
  fileURLToPath(new URL('../src/data/campaign.js',import.meta.url)),'utf8');

const continents=CONTINENTS.map(continent=>continent.id);

/** Mecaniques de zone declarees, y compris celles des zones disparues. */
const mecaniquesDeclarees=[...new Set(
  [...donnees.matchAll(/'([a-z-]+)':\{icon:'[^']*',name:'/g)].map(m=>m[1]))];

/**
 * Identifiants de zone que le moteur teste encore alors qu'aucun continent ne
 * les porte : vestiges de la refonte 15 -> 10 zones.
 *
 * Ils sont inertes par construction — `campaignZone` vaut toujours l'identifiant
 * d'un continent existant — et conserves comme trace des anciennes zones. Toute
 * NOUVELLE entree ici est en revanche suspecte : c'est le signe d'un continent
 * renomme sans que le moteur suive.
 */
const ZONES_HERITEES=['netherys','chambre-echos','couronne-givree',
  'fournaise-incendiaire','trone-volcan','rempart-anciens'];

describe('continents',()=>{
  it('la campagne compte dix continents et trois difficultes',()=>{
    expect(continents).toHaveLength(10);
    expect(DIFFICULTIES.map(d=>d.id)).toEqual(['normal','hard','hardcore']);
  });

  it('les identifiants de continent sont uniques',()=>{
    expect(new Set(continents).size).toBe(continents.length);
  });

  it('chaque continent annonce des etapes et un nom',()=>{
    CONTINENTS.forEach(continent=>{
      expect(continent.name,`${continent.id} nom`).toBeTruthy();
      expect(continent.stages?.length,`${continent.id} etapes`).toBeGreaterThan(0);
    });
  });
});

describe('mecaniques de zone',()=>{
  it('chaque continent declare sa mecanique',()=>{
    const sansMecanique=continents.filter(id=>!mecaniquesDeclarees.includes(id));
    expect(sansMecanique).toEqual([]);
  });

  // Le controle qui manquait. Un continent que le moteur ne teste jamais perd
  // sa mecanique en silence.
  it('chaque continent est reellement reconnu par le moteur de combat',()=>{
    const ignores=continents.filter(id=>!moteur.includes(`'${id}'`))
      .map(id=>{
        const continent=CONTINENTS.find(c=>c.id===id);
        return `${id} « ${continent?.name} » — mécanique jamais appliquée`;
      });
    expect(ignores).toEqual([]);
  });

  it('les zones heritees restent inertes et repertoriees',()=>{
    // Elles ne correspondent a aucun continent : elles ne peuvent pas se
    // declencher, puisque campaignZone vaut toujours un identifiant existant.
    ZONES_HERITEES.forEach(id=>
      expect(continents,`${id} est redevenu un continent`).not.toContain(id));
  });

  it('aucune zone inconnue ne s ajoute a la liste des vestiges',()=>{
    // Une mecanique declaree qui n est ni un continent ni un vestige connu
    // signale un renommage a moitie fait.
    const inattendues=mecaniquesDeclarees
      .filter(id=>!continents.includes(id))
      .filter(id=>!ZONES_HERITEES.includes(id));
    expect(inattendues).toEqual([]);
  });
});
