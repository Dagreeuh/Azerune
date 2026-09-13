import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{progressionStats,championPower,socleDeRarete,SOCLE_RARETE}from'../src/utils/stats';
import{MAX_STARS}from'../src/utils/progression';

/**
 * La promesse d'un jeu à invocations : un 5★ vaut mieux qu'un 3★.
 *
 * Elle ne tenait pas. Mesurée sur deux rencontres et trois compositions :
 *
 *   sans Ascension      3★ 11 victoires · 4★ 16 · 5★ 19   ordre CORRECT
 *   tous à 5 étoiles    3★ 11 · 4★ 10 · 5★  9             ordre INVERSÉ
 *   tous à 6 étoiles    3★ 11 · 4★ 13 · 5★ 10             ordre INVERSÉ
 *
 * La cause était arithmétique. `starFactor = 1 + (étoiles − rareté) × 0,18` :
 * mené à 6 étoiles un 3★ gagnait 54 %, un 5★ seulement 18 %. Les budgets de
 * base n'étant espacés que de 7,7 % par rang, l'Ascension **retournait**
 * l'ordre — et dès 4 étoiles, pas seulement au plafond.
 *
 * Le socle élargit les écarts de base à 19 % par rang, ce qui laisse
 * l'Ascension aussi généreuse tout en gardant l'ordre à chaque palier.
 */
const progres=(hero,stars,level=1)=>({level,stars,resonance:0,soulFragments:0,empreintes:[]});
const budget=s=>s.hp*.30+s.atk*7.5+s.def*5.5+s.spd*1.7;
const moyenne=(rarete,stars)=>{
  const groupe=HEROES.filter(h=>h.rarity===rarete);
  return groupe.reduce((somme,h)=>somme+budget(progressionStats(h,progres(h,stars))),0)/groupe.length;
};

describe('le socle de rareté remet l’invocation dans le bon sens',()=>{
  it('à chaque palier d’étoiles, la rareté ordonne les statistiques',()=>{
    for(let etoiles=3;etoiles<=MAX_STARS;etoiles+=1){
      const valeurs=[3,4,5].filter(r=>r<=etoiles).map(r=>({r,v:moyenne(r,etoiles)}));
      valeurs.forEach((x,i)=>{if(i)expect(x.v,
        `à ${etoiles}★ : ${x.r}★ (${Math.round(x.v)}) ne dépasse pas ${valeurs[i-1].r}★ (${Math.round(valeurs[i-1].v)})`)
        .toBeGreaterThan(valeurs[i-1].v);});
    }
  });

  // Le défaut d'origine, en une ligne : au plafond, un 3★ dépassait un 5★.
  it('au plafond de 6★, un 5★ dépasse un 3★',()=>{
    expect(moyenne(5,MAX_STARS)).toBeGreaterThan(moyenne(3,MAX_STARS)*1.05);
  });

  it('le socle ne gonfle pas le jeu : la moyenne du roster est préservée',()=>{
    // 606 avant l'introduction du socle, mesuré sur les fiches d'origine.
    const brut=HEROES.reduce((s,h)=>s+(h.hp*.30+h.atk*7.5+h.def*5.5+h.spd*1.7),0)/HEROES.length;
    const avec=[3,4,5].reduce((s,r)=>s+moyenne(r,r)*HEROES.filter(h=>h.rarity===r).length,0)/HEROES.length;
    expect(Math.abs(avec/brut-1),'le niveau de puissance général a bougé').toBeLessThan(.03);
  });

  it('l’Ascension n’a pas été vidée pour acheter l’ordre',()=>{
    // Le socle multiplie les statistiques DE BASE : il s'annule dans le rapport
    // « au plafond / à l'origine ». L'autre façon de réparer l'inversion aurait
    // été de réduire le gain d'Ascension — c'est-à-dire de vider le principal
    // levier de progression du joueur. Ce contrat interdit ce chemin.
    const gain=r=>moyenne(r,MAX_STARS)/moyenne(r,r);
    // Valeurs relevees : 3★ x1,370 · 4★ x1,253 · 5★ x1,139. Les seuils sont
    // poses juste en dessous — ils interdisent de rogner l'Ascension, ils ne
    // figent pas un reglage.
    expect(gain(3),'3★').toBeGreaterThan(1.35);
    expect(gain(4),'4★').toBeGreaterThan(1.23);
    expect(gain(5),'5★').toBeGreaterThan(1.12);
  });

  it('la Vitesse échappe au socle : c’est un trait d’identité',()=>{
    HEROES.forEach(h=>expect(progressionStats(h,progres(h,h.rarity)).spd,h.name).toBe(h.spd));
  });

  it('le socle est croissant et n’existe qu’à un seul endroit',()=>{
    expect(socleDeRarete(3)).toBeLessThan(socleDeRarete(4));
    expect(socleDeRarete(4)).toBeLessThan(socleDeRarete(5));
    // Une rareté inconnue ne doit pas anéantir un champion.
    expect(socleDeRarete(9)).toBe(1);
    expect(Object.keys(SOCLE_RARETE)).toEqual(['3','4','5']);
  });

  it('la puissance affichée suit le même ordre',()=>{
    const pw=(r,e)=>{const g=HEROES.filter(h=>h.rarity===r);
      return g.reduce((s,h)=>s+championPower(progressionStats(h,progres(h,e))),0)/g.length;};
    expect(pw(5,MAX_STARS)).toBeGreaterThan(pw(4,MAX_STARS));
    expect(pw(4,MAX_STARS)).toBeGreaterThan(pw(3,MAX_STARS));
  });
});
