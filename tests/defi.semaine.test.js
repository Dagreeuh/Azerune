import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{cleSemaine,defiDeLaSemaine,encoderDefi,lireDefi,comparerTentatives}from'../src/data/defi';

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');

describe('la semaine est la même pour tout le monde',()=>{
  it('sept jours consécutifs donnent la même clé',()=>{
    const lundi=new Date(2026,8,7);
    const cles=Array.from({length:7},(u,i)=>cleSemaine(new Date(2026,8,7+i)));
    expect(new Set(cles).size,'la clé change en cours de semaine').toBe(1);
    expect(cleSemaine(lundi)).toMatch(/^\d{4}-S\d{2}$/);
  });

  it('le lundi suivant change de semaine',()=>{
    expect(cleSemaine(new Date(2026,8,14))).not.toBe(cleSemaine(new Date(2026,8,7)));
  });
});

describe('la rencontre est identique pour tout le monde',()=>{
  it('deux appels le même jour donnent exactement la même rencontre',()=>{
    const a=defiDeLaSemaine(new Date(2026,8,9)),b=defiDeLaSemaine(new Date(2026,8,9));
    expect(a.enemies).toEqual(b.enemies);
    expect(a.name).toBe(b.name);
  });

  it('deux jours de la même semaine aussi : c’est tout l’intérêt',()=>{
    const a=defiDeLaSemaine(new Date(2026,8,7)),b=defiDeLaSemaine(new Date(2026,8,12));
    expect(a.enemies,'la rencontre change en cours de semaine').toEqual(b.enemies);
  });

  it('une autre semaine donne une autre rencontre',()=>{
    const a=defiDeLaSemaine(new Date(2026,8,9)),b=defiDeLaSemaine(new Date(2026,8,16));
    expect(a.name).not.toBe(b.name);
  });

  it('elle tourne vraiment : plusieurs rencontres sur un trimestre',()=>{
    const noms=new Set(Array.from({length:13},(u,i)=>defiDeLaSemaine(new Date(2026,0,5+i*7)).name));
    expect(noms.size,'le défi ne tourne pas assez').toBeGreaterThan(6);
  });

  it('elle reste à portée d’un joueur de milieu de campagne',()=>{
    // Un défi hors de portée de tout le monde n'est pas un défi entre amis.
    for(let i=0;i<26;i+=1){
      const d=defiDeLaSemaine(new Date(2026,0,5+i*7));
      expect(d.recommended,d.name).toBeLessThan(13000);
      expect(d.recommended,d.name).toBeGreaterThan(4000);
    }
  });

  it('elle a un chef et deux comparses',()=>{
    const d=defiDeLaSemaine(new Date(2026,8,9));
    expect(d.enemies).toHaveLength(3);
    expect(d.enemies.filter(e=>e.bossUnit)).toHaveLength(1);
  });
});

describe('le score laisse jouer tout le monde',()=>{
  it('la part de PV arrachés passe avant le nombre d’actions',()=>{
    // Sans ça, un joueur de début de campagne ne pourrait jamais se comparer.
    expect(comparerTentatives({part:60,actions:99},{part:40,actions:3})).toBeLessThan(0);
  });

  it('à part égale, le moins d’actions l’emporte',()=>{
    expect(comparerTentatives({part:100,actions:12},{part:100,actions:20})).toBeLessThan(0);
    expect(comparerTentatives({part:100,actions:20},{part:100,actions:12})).toBeGreaterThan(0);
  });

  it('deux tentatives identiques sont à égalité',()=>{
    expect(comparerTentatives({part:80,actions:14},{part:80,actions:14})).toBe(0);
  });

  it('une première tentative bat l’absence de tentative',()=>{
    expect(comparerTentatives({part:1,actions:200},null)).toBeLessThan(0);
    expect(comparerTentatives(null,{part:1,actions:200})).toBeGreaterThan(0);
  });
});

describe('les codes s’échangent sans serveur',()=>{
  const tentative={semaine:'2026-S37',nom:'Dagcat',actions:14,part:100,puissance:18400};

  it('un code se relit tel qu’il a été écrit',()=>{
    expect(lireDefi(encoderDefi(tentative))).toMatchObject(
      {semaine:'2026-S37',nom:'Dagcat',actions:14,part:100,puissance:18400});
  });

  it('un code abîmé est refusé plutôt que mal lu',()=>{
    const code=encoderDefi(tentative);
    expect(lireDefi(code.slice(0,-1)+'X'),'un code corrompu passe').toBe(null);
    expect(lireDefi(code.replace('AZ-','AY-'))).toBe(null);
    expect(lireDefi('n’importe quoi')).toBe(null);
    expect(lireDefi('')).toBe(null);
    expect(lireDefi(null)).toBe(null);
  });

  it('un nom accentué ou emoji survit à l’aller-retour',()=>{
    const code=encoderDefi({...tentative,nom:'Vélomoteur 🛵'});
    expect(lireDefi(code).nom).toBe('Vélomoteur 🛵');
  });

  it('un nom trop long est tronqué, pas rejeté',()=>{
    const code=encoderDefi({...tentative,nom:'A'.repeat(80)});
    expect(lireDefi(code).nom.length).toBeLessThanOrEqual(20);
  });

  it('le code reste assez court pour tenir dans un message',()=>{
    expect(encoderDefi(tentative).length).toBeLessThan(70);
  });

  it('sans tentative valable, pas de code inventé',()=>{
    expect(encoderDefi({semaine:'2026-S37',nom:'X',actions:'?'})).toBe(null);
    expect(encoderDefi({nom:'X',actions:3})).toBe(null);
  });
});

describe('câblage du défi dans le jeu',()=>{
  const contexte=lire('../src/store/GameContext.jsx');
  const combat=lire('../src/pages/BattlePage.jsx');
  const accueil=lire('../src/pages/HomePage.jsx');

  it('le score est enregistré même sur une défaite',()=>{
    // C'est la condition pour qu'un joueur de début de campagne participe.
    expect(combat,'le Défi n’est plus enregistré en cas de défaite')
      .toContain('else if(mission?.defi){const rewards=finishDefiMission(mission,battle);');
  });

  it('seule une meilleure tentative remplace le record',()=>{
    expect(contexte).toContain('const record=comparerTentatives(tentative,ancien)<0;');
  });

  it('on refuse de comparer deux semaines différentes',()=>{
    // Comparer deux rencontres différentes ne veut rien dire.
    expect(contexte).toContain("if(lu.semaine!==defiMission.semaine)return{ok:false");
  });

  it('l’accueil propose de lancer le défi et d’échanger un code',()=>{
    expect(accueil).toContain('requestMissionStart(defiMission)');
    expect(accueil).toContain('defi-partage');
    expect(accueil).toContain('comparerDefi(codeAmi)');
  });
});
