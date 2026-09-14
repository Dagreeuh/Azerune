// Contrat entre les donnees d objets et le moteur de combat.
//
// Un set qui declare `effect` promet un comportement au joueur dans l interface
// (bulle du set, page Equipement). Ce comportement doit exister dans le moteur,
// sinon le joueur farme quatre pieces pour rien.
//
// Ce test lit le code source du moteur plutot que d executer un combat : il
// verifie le cablage, pas l equilibrage. C est volontaire — le but est
// d attraper un set orphelin des sa creation, avant meme qu il soit jouable.
import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{SETS,CONTINENT_SETS,RAID_SETS,EXPEDITION_SET_POOLS}from'../src/data/items';

const moteur=fs.readFileSync(
  fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8');

/** Recolte tous les `effect:'xxxSet'` declares, quelle que soit la source. */
function effetsDeclares(){
  const trouves=new Map();
  const parcourir=(valeur,origine)=>{
    if(!valeur||typeof valeur!=='object')return;
    if(typeof valeur.effect==='string'&&valeur.effect.endsWith('Set')){
      if(!trouves.has(valeur.effect))
        trouves.set(valeur.effect,{effet:valeur.effect,nom:valeur.name,bonus:valeur.bonus,origine});
    }
    Object.values(valeur).forEach(enfant=>parcourir(enfant,origine));
  };
  parcourir(SETS,'SETS');
  parcourir(CONTINENT_SETS,'CONTINENT_SETS');
  parcourir(RAID_SETS,'RAID_SETS');
  parcourir(EXPEDITION_SET_POOLS,'EXPEDITION_SET_POOLS');
  return[...trouves.values()];
}

/**
 * Sets declares au joueur mais absents du moteur de combat.
 *
 * La liste est vide, et doit le rester : un set qui promet un bonus dans
 * l interface doit avoir un comportement dans le moteur. Protection,
 * Contre-attaque et Incendiaire y ont figure jusqu a leur implementation
 * (voir Audit/RAPPORT-SETS-ORPHELINS.md).
 *
 * N ajouter une entree ici que pour un set volontairement inerte, et en
 * documentant pourquoi.
 */
const NON_IMPLEMENTES=[];

describe('effets de set',()=>{
  const declares=effetsDeclares();

  it('la liste des effets declares n est pas vide',()=>{
    expect(declares.length).toBeGreaterThanOrEqual(6);
  });

  it('tout effet de set declare est lu par le moteur, hors dette connue',()=>{
    const orphelins=declares
      .filter(set=>!NON_IMPLEMENTES.includes(set.effet))
      .filter(set=>!moteur.includes(set.effet))
      .map(set=>`${set.effet} (${set.nom} — « ${set.bonus} », ${set.origine})`);
    expect(orphelins).toEqual([]);
  });

  it('aucun set n est laisse inerte',()=>{
    expect(NON_IMPLEMENTES).toEqual([]);
  });

  it('chaque effet de la dette correspond bien a un set reellement declare',()=>{
    const connus=declares.map(set=>set.effet);
    NON_IMPLEMENTES.forEach(effet=>expect(connus).toContain(effet));
  });

  it('tout set declare expose un nom et un texte de bonus au joueur',()=>{
    declares.forEach(set=>{
      expect(set.nom,`set ${set.effet}`).toBeTruthy();
      expect(set.bonus,`set ${set.effet}`).toBeTruthy();
    });
  });
});

describe('coherence des sets a statistiques',()=>{
  it('tout set annonce un nombre de pieces strictement positif',()=>{
    Object.entries(SETS).forEach(([cle,set])=>{
      expect(set.pieces,`set ${cle}`).toBeGreaterThan(0);
    });
  });

  it('tout set apporte soit des statistiques, soit un effet',()=>{
    Object.entries(SETS).forEach(([cle,set])=>{
      const utile=(set.stats&&Object.keys(set.stats).length>0)||typeof set.effect==='string';
      expect(utile,`le set ${cle} n apporte ni statistique ni effet`).toBe(true);
    });
  });
});
