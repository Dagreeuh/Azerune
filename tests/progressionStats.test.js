// Agregation des statistiques permanentes par champion.
//
// C'est ce que lisent les 104 hauts faits de maitrise. L'agregation annoncee
// par la v1.51.2 n'existait pas : `champions` etait initialise a {} et jamais
// ecrit.
import{describe,it,expect}from'vitest';
import{emptyProgressionStats,emptyChampionStat,CHAMPION_METRICS,mergeChampionStats}
  from'../src/utils/progressionStats';

const ligne=(patch={})=>({damage:0,healing:0,mitigation:0,skillUses:{},...patch});

describe('forme de reference',()=>{
  it('expose les quatre familles de compteurs et les champions',()=>{
    const forme=emptyProgressionStats();
    ['battles','combat','summons','forge','activities','chronicles']
      .forEach(cle=>expect(forme.lifetime[cle],cle).toBeTruthy());
    expect(forme.records.mythicHighest).toBe(0);
    expect(forme.champions).toEqual({});
    expect(forme.processed).toEqual({});
  });

  it('tous les compteurs partent de zero',()=>{
    const parcourir=objet=>Object.entries(objet).forEach(([cle,valeur])=>{
      if(typeof valeur==='number')expect(valeur,cle).toBe(0);
      else if(valeur&&typeof valeur==='object')parcourir(valeur);
    });
    parcourir(emptyProgressionStats().lifetime);
  });

  it('renvoie un objet neuf a chaque appel',()=>{
    const une=emptyProgressionStats();
    une.lifetime.battles.won=99;
    expect(emptyProgressionStats().lifetime.battles.won).toBe(0);
  });

  it('la fiche champion vide couvre les metriques et les competences',()=>{
    expect(emptyChampionStat()).toEqual({damage:0,healing:0,mitigation:0,skillUses:{}});
    expect(CHAMPION_METRICS).toEqual(['damage','healing','mitigation']);
  });
});

describe('mergeChampionStats',()=>{
  it('cree la fiche d un champion vu pour la premiere fois',()=>{
    const apres=mergeChampionStats({},{7:ligne({damage:500,skillUses:{frappe:2}})});
    expect(apres[7]).toEqual({damage:500,healing:0,mitigation:0,skillUses:{frappe:2}});
  });

  it('cumule d un combat a l autre',()=>{
    let etat=mergeChampionStats({},{7:ligne({damage:500,healing:100})});
    etat=mergeChampionStats(etat,{7:ligne({damage:300,healing:50,mitigation:20})});
    expect(etat[7]).toEqual({damage:800,healing:150,mitigation:20,skillUses:{}});
  });

  it('cumule les utilisations par competence, sans ecraser les autres',()=>{
    let etat=mergeChampionStats({},{7:ligne({skillUses:{frappe:2,garde:1}})});
    etat=mergeChampionStats(etat,{7:ligne({skillUses:{frappe:3}})});
    expect(etat[7].skillUses).toEqual({frappe:5,garde:1});
  });

  it('traite plusieurs champions dans le meme combat',()=>{
    const apres=mergeChampionStats({},{
      7:ligne({damage:100}),
      9:ligne({healing:200,skillUses:{soin:1}})
    });
    expect(apres[7].damage).toBe(100);
    expect(apres[9].healing).toBe(200);
    expect(apres[9].skillUses.soin).toBe(1);
  });

  it('laisse intacts les champions absents du combat',()=>{
    const avant={7:{damage:999,healing:0,mitigation:0,skillUses:{frappe:4}}};
    const apres=mergeChampionStats(avant,{9:ligne({damage:10})});
    expect(apres[7]).toEqual(avant[7]);
  });

  it('ne modifie jamais l etat recu',()=>{
    const avant={7:{damage:100,healing:0,mitigation:0,skillUses:{frappe:1}}};
    const copie=JSON.parse(JSON.stringify(avant));
    mergeChampionStats(avant,{7:ligne({damage:50,skillUses:{frappe:2}})});
    expect(avant).toEqual(copie);
  });

  it('ignore une valeur negative plutot que de faire reculer un compteur',()=>{
    const apres=mergeChampionStats({7:{damage:100,healing:0,mitigation:0,skillUses:{}}},
      {7:ligne({damage:-500})});
    expect(apres[7].damage).toBe(100);
  });

  it('ignore une valeur non numerique',()=>{
    const apres=mergeChampionStats({},{7:ligne({damage:'beaucoup',skillUses:{frappe:'trois'}})});
    expect(apres[7].damage).toBe(0);
    expect(apres[7].skillUses.frappe).toBe(0);
  });

  it('tolere un rapport de combat vide, nul, ou troue',()=>{
    expect(mergeChampionStats({},null)).toEqual({});
    expect(mergeChampionStats({},{})).toEqual({});
    expect(mergeChampionStats(null,{7:ligne({damage:5})})[7].damage).toBe(5);
    expect(mergeChampionStats({},{7:null,9:'abc'})).toEqual({});
  });

  it('complete une fiche ancienne a laquelle il manque des champs',()=>{
    const apres=mergeChampionStats({7:{damage:50}},{7:ligne({healing:10})});
    expect(apres[7]).toEqual({damage:50,healing:10,mitigation:0,skillUses:{}});
  });

  it('cent utilisations reparties sur cent combats se retrouvent bien',()=>{
    let etat={};
    for(let tour=0;tour<100;tour+=1)
      etat=mergeChampionStats(etat,{7:ligne({damage:10,skillUses:{frappe:1}})});
    expect(etat[7].damage).toBe(1000);
    expect(etat[7].skillUses.frappe).toBe(100);
  });
});
