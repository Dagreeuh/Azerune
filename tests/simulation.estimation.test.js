import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{simulerMission,verdictSimule,optionsDeCombat,TIRAGES_PAR_DEFAUT,ACTIONS_MAX}from'../src/utils/simulation';
import{joueur,avecHasard,equipePour}from'../Audit/mesures/joueur';
import{HEROES}from'../src/data/heroes';
import{CONTINENTS,DIFFICULTIES,createMission}from'../src/data/campaign';
import{totalStats,assessTeamForMission}from'../src/utils/stats';
import{defaultChampionProgress}from'../src/utils/progression';

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const heroes=HEROES.map(h=>({...h,currentStars:h.rarity,skillLevels:{0:1,1:1,2:1}}));
const statsAvec=facteur=>hero=>{
  const b=totalStats(hero,{},{...defaultChampionProgress(hero),level:hero.rarity*10,stars:hero.rarity},[]);
  return{...b,hp:Math.round(b.hp*facteur),atk:Math.round(b.atk*facteur),def:Math.round(b.def*facteur)};
};
const mission=createMission(DIFFICULTIES[0],CONTINENTS[4],CONTINENTS[4].stages[6]);
const EQUIPE=[1,19,3];

describe('la simulation joue vraiment le combat',()=>{
  it('elle rend autant de resultats qu’on lui demande de tirages',()=>{
    const r=simulerMission({mission,team:EQUIPE,heroes,getStats:statsAvec(1),tirages:8});
    expect(r.tirages).toBe(8);
    expect(r.victoires).toBeLessThanOrEqual(8);
    expect(r.taux).toBeCloseTo(r.victoires/8,10);
  });

  it('chaque combat va a son terme, aucun ne reste en suspens',()=>{
    const r=simulerMission({mission,team:EQUIPE,heroes,getStats:statsAvec(1.4),tirages:10});
    expect(r.aboutis,'un combat simulé n’a pas abouti').toBe(10);
    expect(r.actionsMoyennes).toBeGreaterThan(0);
    expect(r.actionsMoyennes).toBeLessThan(ACTIONS_MAX);
  });

  it('une equipe ecrasee ne gagne jamais, une equipe ecrasante gagne toujours',()=>{
    expect(simulerMission({mission,team:EQUIPE,heroes,getStats:statsAvec(.35),tirages:10}).victoires).toBe(0);
    expect(simulerMission({mission,team:EQUIPE,heroes,getStats:statsAvec(3),tirages:10}).victoires).toBe(10);
  });

  it('elle est monotone : plus de puissance ne donne jamais moins de victoires',()=>{
    // C'est precisement ce que l'indicateur de puissance ne garantissait pas.
    const taux=[.6,.9,1.2,1.6,2.4].map(f=>
      simulerMission({mission,team:EQUIPE,heroes,getStats:statsAvec(f),tirages:12}).victoires);
    taux.forEach((v,i)=>{if(i)expect(v,`palier ${i}`).toBeGreaterThanOrEqual(taux[i-1])});
  });

  it('sans mission ou sans equipe, elle ne renvoie rien plutot que d’inventer',()=>{
    expect(simulerMission({mission:null,team:EQUIPE,heroes,getStats:statsAvec(1)})).toBe(null);
    expect(simulerMission({mission,team:[],heroes,getStats:statsAvec(1)})).toBe(null);
  });

  it('un nombre de tirages absurde retombe sur la valeur par defaut',()=>{
    [0,-5,'?',null,undefined,NaN].forEach(v=>
      expect(simulerMission({mission,team:EQUIPE,heroes,getStats:statsAvec(1),tirages:v}).tirages,String(v))
        .toBe(TIRAGES_PAR_DEFAUT));
  });
});

describe('elle dit la verite la ou l’indicateur de puissance se trompait',()=>{
  // L'audit a mesure un indicateur qui se trompe alors que quelques pour cent
  // de puissance decident du combat. On ne choisit pas un cas a la main : on
  // balaye de VRAIS joueurs — un niveau, des etoiles, le butin de la zone
  // farmee — contre de vraies missions, et on exige qu'une contradiction
  // franche existe.
  //
  // Une premiere version balayait sept missions en multipliant les
  // statistiques d'une equipe par un coefficient. Elle a cesse de trouver quoi
  // que ce soit le jour ou l'equilibrage a bouge — non parce que l'indicateur
  // etait devenu fiable, mais parce que son echantillon ne traversait plus la
  // zone de desaccord. Mesure sur 840 couples (palier x mission) : 20 % de
  // contradictions franches subsistent, toutes dans le meme sens — le jeu
  // annonce « insuffisant » a un joueur qui gagne 12 fois sur 12.
  //
  // Si ce test tombe un jour, refaire CE balayage large avant de conclure quoi
  // que ce soit : c'est l'echantillon qui ment en premier, pas le jeu.
  it('il existe des combats ou le verdict affiche et le combat reel se contredisent',()=>{
    const contradictions=[];
    const profils=[
      {zone:1,difficulte:'normal',niveau:1,etoiles:3,niveauObjet:0,competences:1},
      {zone:2,difficulte:'normal',niveau:10,etoiles:3,niveauObjet:0,competences:1},
      {zone:5,difficulte:'normal',niveau:30,etoiles:4,niveauObjet:6,competences:3}];
    profils.forEach(profil=>{
      const j=joueur(profil);
      [[0,0,6],[0,3,6],[0,5,6]].forEach(([d,z,st])=>{
        const cible=avecHasard(13,()=>createMission(DIFFICULTIES[d],CONTINENTS[z],CONTINENTS[z].stages[st]));
        const equipe=equipePour(cible,j);
        const simule=avecHasard(313,()=>simulerMission({mission:cible,team:equipe,
          heroes:j.heroes,getStats:j.getStats,tirages:12}));
        const annonce=assessTeamForMission(equipe,j.heroes,j.getStats,cible).verdict.key;
        const rassurant=['comfortable','adapted'].includes(annonce);
        const inquietant=['insufficient','very-insufficient'].includes(annonce);
        if(rassurant&&simule.taux<=.1)contradictions.push(`${annonce} mais ${simule.victoires}/12`);
        if(inquietant&&simule.taux>=.9)contradictions.push(`${annonce} mais ${simule.victoires}/12`);
      });
    });
    expect(contradictions.length,'aucune contradiction sur cet echantillon — elargir le balayage avant de conclure')
      .toBeGreaterThan(0);
  });
});
