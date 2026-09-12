import{describe,it,expect}from'vitest';
import fs from'node:fs';
import path from'node:path';
import{affinity,poidsAffinite,detailAffinite,POIDS_AFFINITE}from'../src/utils/elements';
import{optionsDeCombat}from'../src/utils/simulation';
import{CONTINENTS,DIFFICULTIES,createMission}from'../src/data/campaign';

const RACINE=path.resolve(__dirname,'..');
const lire=p=>fs.readFileSync(path.join(RACINE,p),'utf8');

describe('poids de l’affinité selon la difficulté',()=>{
  it('monte avec la difficulté',()=>{
    // En Normal le mur doit être l'équipement et le niveau, pas la couleur.
    expect(poidsAffinite('normal')).toBeLessThan(poidsAffinite('hard'));
    expect(poidsAffinite('hard')).toBeLessThan(poidsAffinite('hardcore'));
    expect(poidsAffinite('hardcore')).toBe(1);
  });

  it('reste entier hors campagne',()=>{
    // Raids, mythique, boss de monde, défis, arène : contenus de fin de
    // parcours, l'affinité y garde tout son poids.
    [null,undefined,'','raid','mythic','inconnu'].forEach(d=>
      expect(poidsAffinite(d),String(d)).toBe(1));
  });

  it('n’atténue jamais le NEUTRE',()=>{
    Object.keys(POIDS_AFFINITE).forEach(d=>{
      const r=affinity('Feu','Feu',d);
      expect(r.damage).toBe(1);
      expect(r.effect).toBe(0);
    });
  });
});

describe('ce que l’atténuation change, et ce qu’elle ne change pas',()=>{
  it('rapproche les multiplicateurs de 1 sans inverser le sens',()=>{
    const pleine=affinity('Feu','Nature');
    const douce=affinity('Feu','Nature','normal');
    expect(douce.damage).toBeGreaterThan(1);
    expect(douce.damage).toBeLessThan(pleine.damage);
    const faiblePleine=affinity('Nature','Feu');
    const faibleDouce=affinity('Nature','Feu','normal');
    expect(faibleDouce.damage).toBeLessThan(1);
    expect(faibleDouce.damage).toBeGreaterThan(faiblePleine.damage);
  });

  it('ne touche ni au libellé, ni à l’icône, ni à la couleur',()=>{
    // « EFFICACE » reste « EFFICACE » : seule l'ampleur bouge. Sinon le joueur
    // ne saurait plus lire le triangle élémentaire d'un mode à l'autre.
    const paires=[['Feu','Nature'],['Nature','Feu'],['Eau','Eau']];
    paires.forEach(([a,b])=>{
      const plein=affinity(a,b),doux=affinity(a,b,'normal');
      ['key','label','icon','color'].forEach(champ=>
        expect(doux[champ],`${a}→${b} ${champ}`).toBe(plein[champ]));
    });
  });

  it('atténue les effets autant que les dégâts',()=>{
    const r=affinity('Feu','Nature','normal');
    expect(r.effect).toBeCloseTo(.15*POIDS_AFFINITE.normal,5);
  });
});

describe('l’affichage ne peut plus mentir',()=>{
  // C'est LE point : le combat annonçait « ×1,30 » en dur à quatre endroits.
  // Atténuer sans toucher à l'affichage aurait recréé le défaut que cet audit
  // traque depuis le début — annoncé au joueur, jamais appliqué.
  const battle=lire('src/pages/BattlePage.jsx');

  it('le détail est calculé à partir de la relation',()=>{
    expect(detailAffinite(affinity('Feu','Nature'))).toBe('Dégâts ×1,30 · Effets +15 %');
    expect(detailAffinite(affinity('Nature','Feu'))).toBe('Dégâts ×0,75 · Effets -15 %');
    expect(detailAffinite(affinity('Feu','Feu'))).toBe('Dégâts ×1,00');
  });

  it('suit la difficulté',()=>{
    expect(detailAffinite(affinity('Feu','Nature','normal'))).toContain('×1,14');
    expect(detailAffinite(affinity('Feu','Nature','hardcore'))).toContain('×1,30');
  });

  it('l’écran de combat n’écrit plus aucun multiplicateur en dur',()=>{
    expect(battle).not.toMatch(/×1,30/);
    expect(battle).not.toMatch(/×0,75/);
    expect(battle).not.toMatch(/Effets \+15 %/);
  });

  it('l’écran de combat passe la difficulté à chaque lecture d’affinité',()=>{
    const appels=battle.match(/affinity\([^)]*\)/g)||[];
    expect(appels.length).toBeGreaterThan(0);
    appels.forEach(appel=>
      expect(appel,`${appel} ignore la difficulté`).toMatch(/difficulte/));
  });
});

describe('la difficulté atteint bien le moteur',()=>{
  const moteur=lire('src/battle/engine.js');

  it('le combat retient sa difficulté',()=>{
    expect(moteur).toMatch(/difficulte:options\.difficulte\|\|null/);
  });

  it('toutes les lectures d’affinité du moteur la prennent en compte',()=>{
    const appels=moteur.match(/affinity\([^)]*\)/g)||[];
    expect(appels.length).toBe(5);
    appels.forEach(appel=>
      expect(appel,`${appel} ignore la difficulté`).toMatch(/battle\.difficulte/));
  });

  it('les options de mission la transmettent',()=>{
    const continent=CONTINENTS[0],stage=continent.stages[0];
    DIFFICULTIES.forEach(diff=>{
      const mission=createMission(diff,continent,stage);
      expect(optionsDeCombat(mission).difficulte,diff.id).toBe(diff.id);
    });
    expect(optionsDeCombat(null).difficulte).toBe(null);
  });
});
