import{describe,it,expect,beforeAll}from'vitest';
import React from'react';
import{renderToStaticMarkup}from'react-dom/server';

/**
 * Chaque page du jeu se rend-elle seulement ?
 *
 * Ce fichier existe parce que j'ai livré une régression qui rendait l'écran de
 * combat entièrement vide — `battle is not defined`, une variable utilisée hors
 * de sa portée. `vite build` compile un JSX valide sans rien voir, et les
 * 1 805 tests d'alors n'en rendaient AUCUNE page. Le défaut n'a été trouvé
 * qu'en jouant une partie.
 *
 * Ce test n'affirme rien sur l'apparence. Il pose la seule question qu'aucun
 * autre ne posait : est-ce que ça s'affiche ?
 */

// `renderToStaticMarkup` n'exécute pas les effets, mais le contexte lit le
// stockage dès l'initialisation de son état. On fournit donc le strict
// minimum, sans jamais simuler le comportement du jeu lui-même.
const memoire=()=>{
  const donnees=new Map();
  return{getItem:c=>(donnees.has(c)?donnees.get(c):null),
    setItem:(c,v)=>donnees.set(c,String(v)),
    removeItem:c=>donnees.delete(c),clear:()=>donnees.clear(),
    key:i=>[...donnees.keys()][i]??null,get length(){return donnees.size}};
};

beforeAll(()=>{
  globalThis.localStorage=memoire();
  globalThis.sessionStorage=memoire();
  globalThis.matchMedia=globalThis.matchMedia||(q=>({matches:false,media:q,
    addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  globalThis.window=globalThis.window||globalThis;
  globalThis.requestAnimationFrame=globalThis.requestAnimationFrame||(cb=>setTimeout(cb,0));
});

const PAGES=[
  ['Accueil','HomePage'],
  ['Campagne','CampaignPage'],
  ['Raids','RaidsPage'],
  ['Codex','HeroesPage'],
  ['Équipement','EquipmentPage'],
  ['Inventaire','InventoryPage'],
  ['Boutique','ShopPage'],
  ['Quêtes','QuestsPage'],
  ['Invocation','SummonPage'],
  ['Historique','HistoryPage'],
  ['Expéditions','ExpeditionsPage'],
  ['Hauts faits','AchievementsPage'],
  ['Mythic+','MythicPage'],
  ['Boss de monde','WorldBossPage'],
  ['Combat','BattlePage'],
  ['Académie','TutorialAcademyPage'],
  ['Paramètres','SettingsPage'],
  ['Arène','ArenePrototypePage'],
];

describe('toutes les pages se rendent',()=>{
  PAGES.forEach(([nom,fichier])=>{
    it(nom,async()=>{
      const[{GameProvider},module]=await Promise.all([
        import('../src/store/GameContext'),
        import(`../src/pages/${fichier}`),
      ]);
      const Page=module.default;
      expect(Page,`${fichier} n’exporte pas de composant`).toBeTypeOf('function');
      // `setPage` est la seule prop que l'application transmet aux pages.
      expect(()=>renderToStaticMarkup(
        React.createElement(GameProvider,null,
          React.createElement(Page,{setPage:()=>{}}))
      ),`${nom} ne se rend pas`).not.toThrow();
    });
  });
});
