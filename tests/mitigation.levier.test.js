import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{mitigation,COEFF_DEFENSE}from'../src/utils/skillMath';

/**
 * Le poids de la Défense est LE levier d'équilibrage du moteur.
 *
 * Mesuré le long de la progression, avec l'ancien coefficient de 3 : la part de
 * dégâts absorbée passait de 29 % (zone 1) à 69 % (raid 10), pendant que soins
 * et boucliers — calculés sur les PV MAX de l'allié — ne subissaient aucune
 * réduction. Le rapport soutien/dégâts dérivait de 0,89 à 2,89.
 *
 * Conséquence sur le roster : plus un champion infligeait de dégâts par action,
 * MOINS il faisait gagner son équipe. Les cinq champions sans utilité
 * occupaient les cinq dernières places du classement.
 *
 * Ce fichier garde deux choses : que la valeur reste dans une plage où les
 * dégâts comptent, et qu'elle ne soit recopiée NULLE PART.
 */
const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');

describe('le poids de la Défense est une constante unique',()=>{
  it('la mitigation suit exactement la constante',()=>{
    expect(mitigation(0)).toBe(1);
    [10,50,100,500].forEach(def=>
      expect(mitigation(def)).toBeCloseTo(100/(100+def*COEFF_DEFENSE)));
  });

  it('elle reste dans la plage où les dégâts comptent',()=>{
    // Au-dessus de 2, la mitigation dépasse 60 % dès qu'un ennemi de fin de jeu
    // atteint 75 de Défense, et les frappeurs purs redeviennent inutiles.
    expect(COEFF_DEFENSE).toBeLessThanOrEqual(2);
    // En dessous de 1, la Défense ne protège plus de rien.
    expect(COEFF_DEFENSE).toBeGreaterThanOrEqual(1);
  });

  it('un ennemi très défendu absorbe moins des deux tiers des dégâts',()=>{
    // 75 de Défense est l'ordre de grandeur du boss de raid au niveau 10.
    expect(1-mitigation(75)).toBeLessThan(.66);
  });

  it('aucun fichier ne recopie la formule',()=>{
    ['../src/battle/engine.js','../src/utils/stats.js','../src/utils/skills.js']
      .forEach(chemin=>expect(lire(chemin).match(/100\/\(100\+/g),chemin).toBeNull());
  });

  it('l’infobulle de combat affiche la constante, pas un nombre écrit à la main',()=>{
    const page=lire('../src/pages/BattlePage.jsx');
    expect(page).toContain('COEFF_DEFENSE');
    expect(page).not.toMatch(/DÉF × 3\)/);
  });
});
