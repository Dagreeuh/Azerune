import{describe,it,expect}from'vitest';
import fs from'node:fs';
import path from'node:path';
import{allerRetour,cadresAttente,enBoucle,BOUCLEES}from'../src/pixi/cadence';

const RACINE=path.resolve(__dirname,'..');
const lire=p=>fs.readFileSync(path.join(RACINE,p),'utf8');

describe('aller-retour',()=>{
  it('repart en arrière sans rejouer les extrémités',()=>{
    // Rejouer le premier ou le dernier cadre marquerait un temps d'arrêt aux
    // deux bouts du balancement.
    expect(allerRetour(['a','b','c','d'])).toEqual(['a','b','c','d','c','b']);
    expect(allerRetour(['a','b','c'])).toEqual(['a','b','c','b']);
  });

  it('ne saute jamais entre le dernier cadre et la reprise',()=>{
    // C'est tout l'intérêt : en boucle simple, le passage du dernier cadre au
    // premier fait pivoter le champion d'un coup. En aller-retour, deux cadres
    // consécutifs sont toujours voisins dans la série d'origine.
    const source=[0,1,2,3,4];
    const suite=allerRetour(source);
    const boucle=[...suite,suite[0]];
    boucle.slice(1).forEach((cadre,i)=>{
      expect(Math.abs(cadre-boucle[i]),`saut entre ${boucle[i]} et ${cadre}`).toBe(1);
    });
  });

  it('laisse tranquilles les séries trop courtes',()=>{
    expect(allerRetour(['a','b'])).toEqual(['a','b']);
    expect(allerRetour(['a'])).toEqual(['a']);
    expect(allerRetour([])).toEqual([]);
    expect(allerRetour(undefined)).toEqual([]);
  });

  it('double presque la durée d’un cycle',()=>{
    expect(allerRetour(new Array(5).fill(0))).toHaveLength(8);
    expect(allerRetour(new Array(9).fill(0))).toHaveLength(16);
  });
});

describe('cadres d’attente',()=>{
  it('ne garde que les premières poses quand on le demande',()=>{
    expect(cadresAttente(['a','b','c','d','e'],3)).toEqual(['a','b','c']);
  });

  it('garde tout sans consigne',()=>{
    // Une feuille dont l'attente est une vraie boucle ne doit pas être rognée.
    [0,null,undefined,-1,NaN].forEach(v=>
      expect(cadresAttente(['a','b','c'],v),String(v)).toEqual(['a','b','c']));
  });

  it('ne réclame jamais plus de cadres qu’il n’en existe',()=>{
    expect(cadresAttente(['a','b'],9)).toEqual(['a','b']);
    expect(cadresAttente([],4)).toEqual([]);
    expect(cadresAttente(undefined,4)).toEqual([]);
  });

  it('coupe le demi-tour des deux champions dessinés',()=>{
    // La rangée « Idle » des feuilles reçues est un tour de présentation —
    // face, trois-quarts, dos — et non une boucle d'attente. Jouée entière,
    // elle fait pivoter le champion dos à l'ennemi une fois sur deux.
    const index=JSON.parse(lire('public/sprites/champions/index.json'));
    Object.values(index).forEach(e=>{
      const meta=JSON.parse(lire(path.join('public',e.description.replace(/^\//,''))));
      expect(meta.attente,`${e.nom} : attente non déclarée`).toBeGreaterThan(0);
      expect(meta.attente,`${e.nom} : attente au-delà des cadres`)
        .toBeLessThanOrEqual(meta.cadres.repos.length);
      // Deux cadres suffisent à respirer, mais pas à balancer.
      expect(meta.attente).toBeGreaterThanOrEqual(2);
      // Une valeur qui ne retranche rien est une déclaration inutile : soit on
      // rogne, soit on n'écrit pas `attente`. C'est aussi le seul garde-fou
      // possible ici — reconnaître à l'image qu'une pose montre le dos n'est
      // PAS mesurable : l'écart au premier cadre vaut 0,303 pour le
      // trois-quarts de Lelianna et 0,307 pour son dos. Aucun seuil ne les
      // sépare, et en inventer un calé sur deux feuilles serait un faux test.
      expect(meta.attente,`${e.nom} : attente sans effet`)
        .toBeLessThan(meta.cadres.repos.length);
    });
  });
});

describe('quelles animations bouclent',()=>{
  it('l’attente et la marche, oui',()=>{
    expect(enBoucle('repos')).toBe(true);
    expect(enBoucle('marche')).toBe(true);
  });

  it('la frappe, le soin et la mort, non',()=>{
    // Un coup de bâton rejoué à l'envers n'a aucun sens, et une mort qui
    // revient en arrière ressusciterait le champion.
    ['attaque','soin','mort','eclair','effets','totem'].forEach(a=>
      expect(enBoucle(a),a).toBe(false));
  });

  it('ne boucle que sur des animations que les feuilles fournissent',()=>{
    const index=JSON.parse(lire('public/sprites/champions/index.json'));
    Object.values(index).forEach(e=>{
      const meta=JSON.parse(lire(path.join('public',e.description.replace(/^\//,''))));
      const presentes=BOUCLEES.filter(a=>meta.cadres[a]);
      expect(presentes.length,`${e.nom} : aucune animation bouclée`).toBeGreaterThan(0);
    });
  });
});

describe('immobilité hors tour',()=>{
  // Une scène où tout le monde s'agite en permanence fatigue et ne dit rien.
  // Figer l'attente rend le mouvement porteur de sens — ce qui bouge est ce
  // qui se passe — et désigne au passage le champion qui a la main.
  const arene=lire('src/pixi/arene.js');
  const page=lire('src/pages/ArenePrototypePage.jsx');

  it('ne lance aucune animation à la mise en place',()=>{
    // `play()` sur le sprite fraîchement créé faisait boucler tout le monde
    // dès l'ouverture, avant la moindre action.
    const creation=arene.slice(arene.indexOf('new AnimatedSprite('),
      arene.indexOf('const hauteur='));
    expect(creation).not.toMatch(/sprite\.play\(\)/);
  });

  it('arrête l’attente de qui n’a pas la main',()=>{
    expect(arene).toMatch(/if\(e\.id===actifId\)e\.sprite\.gotoAndPlay\(0\);\s*else e\.sprite\.gotoAndStop\(0\)/);
  });

  it('fait passer TOUT retour à l’attente par la règle d’immobilité',()=>{
    // Chemin atteignable : un champion dont la feuille n'a pas de rangée
    // « Attaque » lance ses sorts sur l'animation d'attente. Sans ce
    // routage, il se mettrait à boucler alors que ce n'est pas son tour.
    expect(arene).toMatch(/if\(anim==='repos'\)\{poseRepos\(e\);return\}/);
    expect(arene).toMatch(/lanceur\.jeux\.attaque\?'attaque':'repos'/);
  });

  it('n’interrompt pas une frappe en cours pour la figer',()=>{
    // Un sort en cours doit aller au bout ; son `onComplete` reposera
    // l'attente avec la bonne décision.
    expect(arene).toMatch(/if\(!e\.mort&&e\.sprite\.loop\)poseRepos\(e\)/);
  });

  it('revient à l’attente figée après une animation ponctuelle',()=>{
    expect(arene).toMatch(/onComplete=boucler\?null:\(\)=>\{if\(!e\.mort\)poseRepos\(e\)\}/);
  });

  it('la page désigne l’actif à chaque tour',()=>{
    expect(page).toMatch(/arene\.current\?\.actif\(acteur\?\.id\|\|null\)/);
  });

  it('personne n’a la main avant le premier tour, ni après la fin',()=>{
    expect(page).toMatch(/arene\.current\.actif\(null\)/);
    expect(page).toMatch(/if\(b\.winner\)\{a\.actif\(null\)/);
  });
});

describe('branchement dans l’arène',()=>{
  const arene=lire('src/pixi/arene.js');

  it('pose l’attente rognée et en aller-retour dès la mise en place',()=>{
    expect(arene).toMatch(/new AnimatedSprite\(allerRetour\(cadresAttente\(jeux\.repos,attente\)\)\)/);
  });

  it('ne rogne QUE l’attente',()=>{
    // Rogner une frappe ou une mort couperait l'animation en plein geste.
    expect(arene).toMatch(/anim==='repos'\?cadresAttente\(e\.jeux\[anim\],e\.attente\):e\.jeux\[anim\]/);
  });

  it('applique l’aller-retour à toute animation bouclée',()=>{
    expect(arene).toMatch(/const boucler=boucle\|\|enBoucle\(anim\)/);
    expect(arene).toMatch(/e\.sprite\.textures=boucler\?allerRetour\(suite\):suite/);
  });

  it('laisse les animations ponctuelles se lire à l’endroit',()=>{
    // `loop` doit suivre la même décision, sinon une frappe boucle en silence.
    expect(arene).toMatch(/e\.sprite\.loop=boucler/);
  });
});
