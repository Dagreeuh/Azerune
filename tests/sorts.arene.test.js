import{describe,it,expect}from'vitest';
import fs from'node:fs';
import path from'node:path';
import{ciblageDe}from'../src/pages/ArenePrototypePage';
import{CUSTOM_HEROES}from'../src/data/customHeroes';
import{HEROES as BASE}from'../src/data/heroes';

const RACINE=path.resolve(__dirname,'..');
const lire=p=>fs.readFileSync(path.join(RACINE,p),'utf8');
const index=JSON.parse(lire('public/sprites/champions/index.json'));
const tous=[...BASE,...CUSTOM_HEROES];

describe('liaison sort → animation → effet',()=>{
  Object.entries(index).forEach(([heroId,entree])=>{
    const meta=JSON.parse(lire(path.join('public',entree.description.replace(/^\//,''))));
    const hero=tous.find(h=>h.id===Number(heroId));

    describe(entree.nom,()=>{
      it('déclare autant de sorts que le champion a de compétences',()=>{
        // Un sort non lié retomberait sur l'animation d'attaque par défaut :
        // le champion lancerait sa Marée ancestrale en donnant un coup de bâton.
        expect(hero,`champion ${heroId} introuvable`).toBeTruthy();
        expect(meta.sorts).toHaveLength(hero.skills.length);
      });

      it('ne vise que des animations présentes dans la feuille',()=>{
        meta.sorts.forEach((sort,i)=>{
          expect(Object.keys(meta.cadres),`sort ${i} → ${sort.anim}`).toContain(sort.anim);
        });
      });

      it('ne vise que des effets réellement découpés',()=>{
        // C'est LE contrôle qui compte : un index d'effet hors bornes ne
        // provoque aucune erreur à l'exécution, l'effet ne s'affiche
        // simplement jamais. Rien ne le signalerait sans ce test.
        meta.sorts.forEach((sort,i)=>{
          (sort.effets||[]).forEach((e,j)=>{
            const liste=meta.cadres[e.source];
            expect(liste,`sort ${i}, effet ${j} : source « ${e.source} » absente`).toBeTruthy();
            expect(e.index,`sort ${i}, effet ${j} : index ${e.index} hors des ${liste.length} cadres`)
              .toBeLessThan(liste.length);
            expect(e.index).toBeGreaterThanOrEqual(0);
          });
        });
      });

      it('n’emploie que des placements connus du rendu',()=>{
        const connus=['lanceur','cible','cibles','projectile'];
        meta.sorts.forEach((sort,i)=>(sort.effets||[]).forEach((e,j)=>{
          expect(connus,`sort ${i}, effet ${j}`).toContain(e.ou);
        }));
      });

      it('lie chaque compétence à au moins un effet',()=>{
        meta.sorts.forEach((sort,i)=>{
          expect((sort.effets||[]).length,`${hero.skills[i]?.[0]||i} sans effet`).toBeGreaterThan(0);
        });
      });
    });
  });
});

describe('choix de cible',()=>{
  it('demande une cible pour les compétences à cible unique',()=>{
    expect(ciblageDe({target:'enemy'})).toEqual({demande:true,camp:'enemy'});
    expect(ciblageDe({target:'ally'})).toEqual({demande:true,camp:'ally'});
  });

  it('n’en demande pas pour les zones et les sorts sur soi',()=>{
    // Demander une cible pour une compétence qui frappe tout le monde serait un
    // clic pour rien, et laisserait croire à un choix qui n'existe pas.
    ['allEnemies','allAllies','self',undefined].forEach(t=>{
      expect(ciblageDe({target:t}).demande,String(t)).toBe(false);
    });
  });
});

describe('rendu des effets',()=>{
  const arene=lire('src/pixi/arene.js');

  it('signale un effet introuvable au lieu de l’ignorer',()=>{
    expect(arene).toMatch(/rapport\?\.manquants\.push/);
  });

  it('rend compte de ce qui a été joué',()=>{
    expect(arene).toMatch(/rapport\?\.joues\.push/);
    expect(arene).toMatch(/rapport\.anim=anim/);
  });

  it('lance l’animation et les effets ensemble',()=>{
    // Les enchaîner donnait une frappe, un silence, puis un éclair.
    expect(arene).toMatch(/Promise\.all\(mouvements\)/);
  });

  it('ne fait avancer le lanceur que pour un sort de contact',()=>{
    expect(arene).toMatch(/const contact=effets\.every\(e=>e\.ou!=='projectile'\)/);
  });
});

describe('la page reste soumise au moteur',()=>{
  const page=lire('src/pages/ArenePrototypePage.jsx');

  it('lance les compétences par castSkill, pas par une copie',()=>{
    expect(page).toMatch(/castSkill\(bat,index,cibleId\?\?acteur\.id\)/);
  });

  it('affiche le refus du moteur plutôt que de le contourner',()=>{
    expect(page).toMatch(/if\(resultat\?\.error\)\{setMessage\(resultat\.error\);return\}/);
  });

  it('privilégie la cible désignée pour placer l’effet',()=>{
    // Un soin sur un allié déjà au maximum ne change aucun point de vie :
    // sans la cible désignée, l'effet retombait sur le lanceur.
    expect(page).toMatch(/cibleVoulue\?\[cibleVoulue\]:\[\]/);
  });
});
