import{describe,it,expect}from'vitest';
import fs from'node:fs';
import path from'node:path';
import{lirePNG,morceaux,pixelsOpaques}from'./helpers/pngLecture';
import{feuilleDe}from'../src/pages/ArenePrototypePage';

const RACINE=path.resolve(__dirname,'..');
const atlas=JSON.parse(fs.readFileSync(path.join(RACINE,'public/sprites/atlas.json'),'utf8'));
const chemin=fichier=>path.join(RACINE,'public',fichier.replace(/^\//,''));
const noms=Object.keys(atlas.feuilles);

describe('atlas des sprites',()=>{
  it('couvre les six éléments pour les deux genres',()=>{
    ['feu','eau','nature','lumiere','ombre','arcane'].forEach(e=>{
      expect(noms).toContain(`heros-${e}`);
      expect(noms).toContain(`monstre-${e}`);
    });
    expect(noms).toHaveLength(12);
  });

  it('décrit les quatre animations attendues',()=>{
    expect(atlas.animations).toEqual({repos:4,attaque:4,touche:2,mort:4});
  });

  it('ne référence que des fichiers réellement présents et aux bonnes dimensions',()=>{
    noms.forEach(nom=>{
      const def=atlas.feuilles[nom];
      expect(fs.existsSync(chemin(def.fichier))).toBe(true);
      const img=lirePNG(chemin(def.fichier));
      expect(img.hauteur).toBe(atlas.taille);
      const cadres=Object.values(def.cadres).flat();
      expect(img.largeur).toBe(cadres.length*atlas.taille);
      cadres.forEach(c=>{
        expect(c.w).toBe(atlas.taille);
        expect(c.x+c.w).toBeLessThanOrEqual(img.largeur);
      });
    });
  });
});

describe('lisibilité des silhouettes',()=>{
  // Ces trois règles ne sont pas cosmétiques : chacune sanctionne un défaut
  // constaté à l'œil pendant la mise au point, et invisible autrement.
  noms.forEach(nom=>{
    const def=atlas.feuilles[nom];
    const img=lirePNG(chemin(def.fichier));
    const cadres=Object.entries(def.cadres).flatMap(([anim,liste])=>liste.map((c,i)=>[`${anim} ${i}`,c]));

    it(`${nom} : aucun cadre vide`,()=>{
      cadres.forEach(([etiquette,c])=>{
        expect(pixelsOpaques(img,c),etiquette).toBeGreaterThan(120);
      });
    });

    it(`${nom} : rien ne déborde du cadre`,()=>{
      // Un pixel sur le bord signifie une silhouette rognée — les bottes et les
      // pieds ont été coupés deux fois avant que cette règle existe.
      cadres.forEach(([etiquette,c])=>{
        for(let x=c.x;x<c.x+c.w;x+=1){
          expect(img.alpha(x,c.y),`${etiquette} haut`).toBe(0);
          expect(img.alpha(x,c.y+c.h-1),`${etiquette} bas`).toBe(0);
        }
        for(let y=c.y;y<c.y+c.h;y+=1){
          expect(img.alpha(c.x,y),`${etiquette} gauche`).toBe(0);
          expect(img.alpha(c.x+c.w-1,y),`${etiquette} droite`).toBe(0);
        }
      });
    });

    it(`${nom} : la silhouette tient d'un seul tenant`,()=>{
      // Les bras du monstre et les cornes ont flotté à côté du corps ; le
      // comptage des morceaux est la seule mesure qui l'attrape sans les yeux.
      cadres.forEach(([etiquette,c])=>{
        expect(morceaux(img,c),etiquette).toBe(1);
      });
    });
  });
});

describe('animation de mort',()=>{
  it('s’efface progressivement au lieu de disparaître d’un coup',()=>{
    const def=atlas.feuilles['heros-feu'];
    const img=lirePNG(chemin(def.fichier));
    const opacites=def.cadres.mort.map(c=>{
      let max=0;
      for(let y=c.y;y<c.y+c.h;y+=1)for(let x=c.x;x<c.x+c.w;x+=1)max=Math.max(max,img.alpha(x,y));
      return max;
    });
    opacites.slice(1).forEach((a,i)=>expect(a).toBeLessThan(opacites[i]));
    expect(opacites[opacites.length-1]).toBeGreaterThan(0);
  });
});

describe('choix de la feuille',()=>{
  it('suit l’élément du champion, accents compris',()=>{
    expect(feuilleDe({element:'Feu'},'heros')).toBe('heros-feu');
    expect(feuilleDe({element:'Lumière'},'heros')).toBe('heros-lumiere');
    expect(feuilleDe({element:'Ombre'},'monstre')).toBe('monstre-ombre');
  });

  it('rabat l’inconnu sur arcane sans inventer de couleur',()=>{
    // La teinte annonce une affinité au joueur : mieux vaut un ennemi arcane
    // de plus qu’un ennemi peint en rouge qui ne brûle pas.
    expect(feuilleDe({element:'Vent'},'monstre')).toBe('monstre-arcane');
    expect(feuilleDe({},'monstre')).toBe('monstre-arcane');
    expect(feuilleDe(null,'heros')).toBe('heros-arcane');
  });
});
