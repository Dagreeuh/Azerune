import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{BRANCHES,ETAGE_RESONANCE,RESONANCE_POINT_TIERS,ETAGES}from'../src/data/empreintes';

// Meme garde que pour les portails d'invocation : une cle que la page reclame
// sans que le fournisseur l'expose ne casse aucun test unitaire — le panneau
// rend `undefined` en silence, ou lance a la premiere interaction.
const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const contexte=lire('../src/store/GameContext.jsx');
const heroes=lire('../src/pages/HeroesPage.jsx');

const exposes=(()=>{
  const debut=contexte.lastIndexOf('const value={');
  return new Set(contexte.slice(debut,contexte.indexOf('\n',debut))
    .split(/[{,]/).map(part=>part.split(':')[0].trim()).filter(Boolean));
})();
const reclames=heroes.slice(heroes.indexOf('const{'),heroes.indexOf('}=useGame();'))
  .split(',').map(part=>part.split(':')[0].replace('const{','').trim()).filter(Boolean);

describe('la fiche champion et le fournisseur se rejoignent',()=>{
  it('tout ce que la page reclame est reellement exporte',()=>{
    expect(reclames.filter(nom=>!exposes.has(nom))).toEqual([]);
  });
  it('les cles des Empreintes sont bien reclamees',()=>{
    ['getEmpreinteStatus','lightEmpreinte','resetEmpreintes','BRANCHES','ETAGE_RESONANCE','RESONANCE_POINT_TIERS']
      .forEach(cle=>expect(reclames,cle).toContain(cle));
  });
});

describe('l’ecran dit ce que le code fait',()=>{
  it('le panneau affiche les trois branches depuis les donnees',()=>{
    expect(heroes).toContain('BRANCHES.map');
    expect(BRANCHES.length).toBe(3);
  });

  it('les seuils affiches viennent des constantes, pas du JSX',()=>{
    // Un seuil ecrit en dur se desynchronise le jour ou la constante bouge.
    // C'est exactement la panne de l'onglet Difficile.
    expect(heroes).toContain('ETAGE_RESONANCE[noeud.etage-1]');
    expect(heroes).not.toMatch(/Résonance [0-9] requise<\/em>/);
  });

  it('le panneau annonce que l’arbre ne peut pas etre complete',()=>{
    expect(heroes).toContain('empreintes.arbre.length');
    expect(heroes).toContain('empreintes.points');
  });

  it('la Resonance annonce sa nouvelle fonction',()=>{
    // Sans cette ligne, la refonte est invisible : le joueur lit toujours
    // « +3 Vitesse » et ignore qu'un palier ouvre un etage ou verse un point.
    expect(heroes).toContain('resonance-empreinte-note');
    expect(heroes).toContain('RESONANCE_POINT_TIERS.includes');
  });

  it('chaque palier de Resonance a un libelle a afficher',()=>{
    for(let palier=1;palier<=5;palier+=1){
      const donnePoint=RESONANCE_POINT_TIERS.includes(palier);
      const index=ETAGE_RESONANCE.indexOf(palier);
      // L'un ou l'autre doit exister, sinon le JSX afficherait « étage undefined ».
      expect(donnePoint||(index>=0&&index<ETAGES),`Résonance ${palier}`).toBe(true);
    }
  });

  it('le style des Empreintes existe',()=>{
    const css=lire('../src/styles.css');
    ['.empreintes-panel','.empreinte-noeud','.empreinte-noeud.allume','.empreinte-noeud.verrouille','.resonance-empreinte-note']
      .forEach(classe=>expect(css,classe).toContain(classe));
    BRANCHES.forEach(({id})=>expect(css).toContain(`.branche-${id}`));
  });
});
