import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{BANNERS}from'../src/data/banners';

// GameContext est un composant React : le projet le verifie par contrat sur son
// texte source plutot que par un rendu. Ce fichier verifie que les deux moities
// du portail se rejoignent — celle qui tire et celle qui affiche. Un `value` qui
// n'exporte pas ce que la page destructure ne casse aucun test unitaire : la
// page rend `undefined` en silence.
const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const contexte=lire('../src/store/GameContext.jsx');
const page=lire('../src/pages/SummonPage.jsx');

/** Ce que le fournisseur expose dans son objet `value`. */
const exposes=(()=>{
  const debut=contexte.lastIndexOf('const value={');
  const extrait=contexte.slice(debut,contexte.indexOf('\n',debut));
  return new Set(extrait.split(/[{,]/).map(part=>part.split(':')[0].trim()).filter(Boolean));
})();
/** Ce que la page reclame a useGame(). */
const reclames=(()=>{
  const trouve=page.match(/const\{([^}]+)\}=useGame\(\);/);
  return trouve?trouve[1].split(',').map(part=>part.split(':')[0].trim()).filter(Boolean):[];
})();

describe('la page d’invocation et le fournisseur se rejoignent',()=>{
  it('tout ce que la page reclame est reellement exporte',()=>{
    const manquants=reclames.filter(nom=>!exposes.has(nom));
    expect(manquants).toEqual([]);
  });

  it('la page reclame bien les nouvelles cles des portails',()=>{
    ['BANNERS','DEFAULT_BANNER','monthlyFeatured','electedChampion','electedGuarantee','setElectedChampion']
      .forEach(cle=>expect(reclames).toContain(cle));
  });
});

describe('le portail traverse reellement l’appel',()=>{
  it('summonMany accepte un portail et lui donne une valeur par defaut',()=>{
    expect(contexte).toMatch(/const summonMany=\(count,currency,bannerId=DEFAULT_BANNER\)=>/);
  });

  it('les trois appels de la page transmettent le portail choisi',()=>{
    // Un seul appel qui oublie l'argument suffit a renvoyer le joueur sur le
    // Portail ancestral sans qu'aucun message ne le signale.
    const appels=page.match(/summonMany\([^)]*\)/g)||[];
    expect(appels.length).toBeGreaterThan(0);
    appels.forEach(appel=>expect(appel).toContain('bannerId'));
  });

  it('un portail qui refuse les Pierres de foyer les refuse vraiment',()=>{
    expect(contexte).toContain("if(currency==='stone'&&!banner.acceptsStones)return null;");
  });

  it('le ciblage ne s’applique qu’a une rarete 5 deja decidee',()=>{
    // C'est l'invariant economique : le portail choisit LEQUEL des 5★ sort, il
    // ne decide jamais QU'IL sort. Appeler resolveFiveStar hors de cette garde
    // changerait le taux.
    const garde=contexte.indexOf('if(hero.rarity===5){');
    const appel=contexte.indexOf('resolveFiveStar({');
    expect(garde).toBeGreaterThan(-1);
    expect(appel).toBeGreaterThan(garde);
    expect(appel-garde).toBeLessThan(400);
  });

  it('la garantie de l’elu est reportee d’une invocation a la suivante',()=>{
    expect(contexte).toContain('guaranteeDraft=cible.guaranteed');
    expect(contexte).toContain('setElectedGuarantee(guaranteeDraft)');
  });

  it('changer d’elu desarme la garantie',()=>{
    expect(contexte).toMatch(/setElectedChampionState\(id\);setElectedGuarantee\(false\);/);
  });

  it('l’elu et sa garantie sont sauvegardes',()=>{
    // Borner a l'objet sauvegarde, et non aux 3 000 caracteres suivants : le
    // tableau de dependances du useEffect vient juste apres et cite les memes
    // noms. Un test trop large passait meme apres retrait de la charge utile.
    const debut=contexte.indexOf("save('azerune-save',{");
    const charge=contexte.slice(debut,contexte.indexOf('})',debut));
    expect(charge).toContain('electedChampion');
    expect(charge).toContain('electedGuarantee');
  });

  it('une sauvegarde ancienne, sans portail, se relit sans exception',()=>{
    expect(contexte).toContain('stored.electedChampion??null');
    expect(contexte).toContain('stored.electedGuarantee??false');
  });
});

describe('l’ecran annonce ce que le code fait',()=>{
  it('chaque portail declare est affichable',()=>{
    BANNERS.forEach(banner=>{
      expect(banner.name.length).toBeGreaterThan(0);
      expect(banner.summary.length).toBeGreaterThan(0);
      expect(banner.detail.length).toBeGreaterThan(0);
      expect(typeof banner.acceptsStones).toBe('boolean');
    });
  });

  it('la page affiche les parts depuis les constantes, sans les recopier',()=>{
    // Un pourcentage ecrit en dur dans le JSX se desynchronise du jour ou la
    // constante bouge. C'est exactement la panne de l'onglet Difficile.
    expect(page).toContain('ELECTED_SHARE');
    expect(page).toContain('MONTHLY_SHARE');
    expect(page).not.toMatch(/50\s*% de chances qu’un 5★/);
  });

  it('la page dit au joueur que les Pierres ne valent qu’au Portail ancestral',()=>{
    expect(page).toContain('summon-stones-note');
  });
});
