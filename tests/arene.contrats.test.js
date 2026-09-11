import{describe,it,expect}from'vitest';
import fs from'node:fs';
import path from'node:path';

const RACINE=path.resolve(__dirname,'..');
const lire=p=>fs.readFileSync(path.join(RACINE,p),'utf8');
const arene=lire('src/pixi/arene.js');
const monture=lire('src/components/ArenePixi.jsx');
const styles=lire('src/styles.css');
const page=lire('src/pages/ArenePrototypePage.jsx');

describe('rendu net',()=>{
  it('force le filtrage au plus proche voisin sur les feuilles chargées',()=>{
    // Sans cette ligne le pixel art est interpolé et devient flou : c'est la
    // seule régression qui annulerait toute la direction artistique sans
    // provoquer la moindre erreur.
    expect(arene).toMatch(/scaleMode\s*=\s*'nearest'/);
  });

  it('désactive l’anticrénelage du rendu',()=>{
    expect(arene).toMatch(/antialias:\s*false/);
  });

  it('garde le rendu pixelisé côté CSS',()=>{
    const regle=styles.slice(styles.lastIndexOf('.arene-pixi canvas'));
    expect(regle).toMatch(/image-rendering:\s*pixelated/);
  });
});

describe('séparation des responsabilités',()=>{
  it('l’arène ignore React',()=>{
    // L'arène doit rester testable sans React, et React testable sans WebGL.
    expect(arene).not.toMatch(/from\s*'react'/);
  });

  it('l’arène ignore le moteur de combat',()=>{
    expect(arene).not.toMatch(/battle\/engine/);
  });

  it('PixiJS n’est chargé qu’à la demande',()=>{
    // Un import statique ferait entrer 300 ko de WebGL dans le paquet principal,
    // que le joueur ouvre l'arène ou non.
    expect(monture).toMatch(/await import\('\.\.\/pixi\/arene'\)/);
    expect(page).not.toMatch(/^import.*from'pixi\.js'/m);
  });
});

describe('cycle de vie',()=>{
  it('détruit le rendu au démontage',()=>{
    expect(monture).toMatch(/return\s*\(\)=>\{[^}]*detruire\(\)/);
    expect(arene).toMatch(/app\.destroy\(/);
  });

  it('retire ses animations en cours à la destruction',()=>{
    // Un tween oublié continue de tourner sur un rendu détruit.
    expect(arene).toMatch(/encours\.forEach\(b=>app\.ticker\.remove\(b\)\)/);
  });

  it('signale l’absence de WebGL au lieu d’afficher un cadre noir',()=>{
    expect(monture).toMatch(/onPerdu\?\.\(erreur\)/);
    expect(page).toMatch(/WebGL indisponible/);
  });
});

describe('accès depuis le jeu',()=>{
  // L'arène a d'abord été cachée dans un bouton en bas des Paramètres, APRÈS
  // la zone d'effacement : le joueur ne l'a jamais trouvée. Une page
  // inatteignable n'existe pas.
  const layout=lire('src/components/Layout.jsx');
  const app=lire('src/App.jsx');

  it('a son propre onglet dans la navigation',()=>{
    expect(layout).toMatch(/\['arene',[^\]]*\]/);
  });

  it('n’est verrouillée derrière aucun niveau d’Invocateur',()=>{
    const onglet=layout.match(/\['arene','[^']*','[^']*',(\d+)\]/);
    expect(onglet,'onglet arene absent de la barre').not.toBeNull();
    expect(Number(onglet[1]),'un niveau requis rendrait l’onglet grisé').toBe(1);
  });

  it('est branchée sur une vraie page',()=>{
    expect(app).toMatch(/page==='arene'\?<ArenePrototypePage\/>/);
  });

  it('rétrécit la scène sur téléphone, pas les champions',()=>{
    // Écraser 960 px logiques dans 380 px d'écran rendait les sprites
    // illisibles sur mobile.
    expect(page).toMatch(/window\.innerWidth<700/);
    expect(page).toMatch(/largeur:520/);
    expect(page).not.toMatch(/largeur=\{960\}/);
  });
});

describe('honnêteté du prototype',()=>{
  it('utilise le vrai moteur, pas une simulation d’affichage',()=>{
    expect(page).toMatch(/from'\.\.\/battle\/engine'/);
    // Chercher le NOM suffisait à passer alors que l'appel avait disparu :
    // un mutant a survécu à cette version du test. On exige l'appel.
    ['createBattle','nextTurn','performAutoAction','enemyAction'].forEach(f=>{
      expect(page,f).toMatch(new RegExp(`${f}\\s*\\(`));
    });
  });

  it('annonce à l’écran que les sprites sont provisoires',()=>{
    expect(page).toMatch(/provisoires/);
  });
});
