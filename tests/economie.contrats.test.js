import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{QUESTS,WEEKLY_QUESTS,MONTHLY_QUESTS,PROGRESSION_QUESTS,FINAL_CHESTS}from'../src/data/quests';
import{ACHIEVEMENTS}from'../src/data/achievements';
import{SHOP_CURRENCIES,canBuyOffer,offerBalance}from'../src/utils/shop';
import{emptyProgressionStats}from'../src/utils/progressionStats';
import{generateShopOffers}from'../src/data/shop';

// Dernier volet de la battue « annoncé mais jamais appliqué » : boutique,
// quêtes, hauts faits et statistiques permanentes.

const contexte=fs.readFileSync(fileURLToPath(new URL('../src/store/GameContext.jsx',import.meta.url)),'utf8');
const quetes=[...QUESTS,...WEEKLY_QUESTS,...MONTHLY_QUESTS,...PROGRESSION_QUESTS];

describe('toute récompense promise est versée',()=>{
  /** Clés que `grantReward` sait verser. */
  const versees=()=>{
    const bloc=contexte.slice(contexte.indexOf('const grantReward='));
    return new Set([...bloc.slice(0,900).matchAll(/reward\.([a-zA-Z0-9]+)/g)].map(m=>m[1]));
  };

  it('chaque clé promise par une quête est versée',()=>{
    const promises=new Set(quetes.flatMap(q=>Object.keys(q.reward||{})));
    const sues=versees();
    [...promises].forEach(cle=>expect(sues.has(cle),`« ${cle} » est promis mais jamais versé`).toBe(true));
    expect(promises.size,'aucune récompense de quête, le test ne prouve rien').toBeGreaterThan(4);
  });

  it('chaque clé des coffres de fin de cycle aussi',()=>{
    const sues=versees();
    Object.entries(FINAL_CHESTS).forEach(([periode,coffre])=>
      Object.keys(coffre).forEach(cle=>
        expect(sues.has(cle),`coffre ${periode} : « ${cle} » jamais versé`).toBe(true)));
  });

  it('chaque clé promise par un haut fait aussi',()=>{
    const sues=versees();
    const promises=new Set(ACHIEVEMENTS.flatMap(a=>Object.keys(a.reward||{})
      .filter(k=>!['gear','gearPack'].includes(k))));
    [...promises].forEach(cle=>expect(sues.has(cle),`haut fait : « ${cle} » jamais versé`).toBe(true));
  });

  it('les pièces d’équipement promises passent par leur propre chemin',()=>{
    // `gear` et `gearPack` ne sont pas des monnaies : ils sont générés.
    const avecGear=ACHIEVEMENTS.filter(a=>a.reward?.gear||a.reward?.gearPack?.length);
    if(!avecGear.length)return;
    expect(contexte,'les hauts faits à équipement ne génèrent rien')
      .toContain('achievementGearConfigs');
  });
});

describe('boutique : chaque offre est achetable et livrée',()=>{
  // On génère beaucoup de vitrines : les offres sont tirées au hasard, une
  // seule passe ne verrait pas tous les types.
  const offres=()=>Array.from({length:60}).flatMap(()=>{
    try{return generateShopOffers(12)||[]}catch{return[]}
  });

  it('toutes les devises déclarées ont leur solde et leur débit',()=>{
    Object.entries(SHOP_CURRENCIES).forEach(([id,devise])=>{
      expect(devise.cle,`devise ${id} sans clé de solde`).toBeTruthy();
      const solde={[devise.cle]:999999};
      expect(offerBalance({currency:id},solde),`solde de ${id} illisible`).toBe(999999);
    });
  });

  it('une devise inconnue est refusée plutôt que traitée en douce',()=>{
    expect(canBuyOffer({currency:'lunes',price:1,stock:1,sold:0},{}).ok).toBe(false);
  });

  it('chaque type d’offre a sa livraison dans le contexte',()=>{
    const types=new Set(offres().map(o=>o.type));
    expect(types.size,'aucune offre générée, le test ne prouve rien').toBeGreaterThan(1);
    types.forEach(type=>expect(contexte,`une offre « ${type} » ne livre rien`)
      .toContain(`item.type==='${type}'`));
  });

  it('une offre déjà vendue ne se rachète pas',()=>{
    expect(canBuyOffer({currency:'gold',price:1,stock:1,sold:1},{gold:999}).ok).toBe(false);
  });

  it('un solde insuffisant bloque l’achat',()=>{
    expect(canBuyOffer({currency:'gems',price:500,stock:1,sold:0},{gems:499}).ok).toBe(false);
    expect(canBuyOffer({currency:'gems',price:500,stock:1,sold:0},{gems:500}).ok).toBe(true);
  });
});

describe('statistiques permanentes : aucune feuille morte parmi celles qui sont lues',()=>{
  const feuilles=(o,prefixe='')=>Object.entries(o).flatMap(([k,v])=>
    v&&typeof v==='object'&&!Array.isArray(v)?feuilles(v,`${prefixe}${k}.`):[`${prefixe}${k}`]);
  /** Une feuille est alimentée si sa clé apparaît dans une écriture chiffrée. */
  const alimentee=chemin=>{
    const cle=chemin.split('.').pop();
    return new RegExp(`${cle}\\s*:\\s*[^,}]*\\+`).test(contexte)
      ||new RegExp(`${cle}\\s*:\\s*Math\\.max`).test(contexte)
      ||new RegExp(`\\[['"\`]?${cle}['"\`]?\\]`).test(contexte);
  };

  it('toute feuille lue par un haut fait est réellement incrémentée',()=>{
    const lues=new Set(ACHIEVEMENTS.map(a=>a.counter).filter(Boolean));
    const mortes=feuilles(emptyProgressionStats())
      .filter(c=>c!=='version'&&lues.has(c)&&!alimentee(c));
    expect(mortes,`${mortes.length} compteurs lus mais jamais incrémentés`).toEqual([]);
  });

  it('les compteurs de Chroniques ne sont plus morts',()=>{
    // Ils existaient dans l'arbre sans jamais bouger : un futur haut fait
    // posé dessus serait né bloqué à zéro.
    expect(contexte,'grantRelic ne compte pas les reliques trouvées')
      .toMatch(/relicsFound:\(Number\(c\.relicsFound\)\|\|0\)\+1/);
    expect(contexte,'activateRelic ne compte pas les activations')
      .toMatch(/activated:\(Number\(c\.activated\)\|\|0\)\+1/);
    expect(alimentee('lifetime.chronicles.relicsFound')).toBe(true);
    expect(alimentee('lifetime.chronicles.activated')).toBe(true);
  });
});

describe('quêtes : chaque événement de suivi est émis quelque part',()=>{
  it('aucune quête ne dépend d’un événement fantôme',()=>{
    const sources=['../src/store/GameContext.jsx','../src/pages/BattlePage.jsx',
      '../src/pages/SettingsPage.jsx','../src/components/Layout.jsx']
      .map(c=>{try{return fs.readFileSync(fileURLToPath(new URL(c,import.meta.url)),'utf8')}catch{return''}})
      .join('\n');
    const fantomes=[...new Set(quetes.map(q=>q.event))].filter(e=>!sources.includes(`'${e}'`));
    expect(fantomes,'des quêtes attendent un événement que rien n’émet').toEqual([]);
  });
});
