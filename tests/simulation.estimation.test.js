import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{simulerMission,verdictSimule,optionsDeCombat,TIRAGES_PAR_DEFAUT,ACTIONS_MAX}from'../src/utils/simulation';
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
  it('il existe des combats ou le verdict affiche et le combat reel se contredisent',()=>{
    // L'audit a mesure un indicateur qui se trompe de -21 % a +43 % alors que
    // 4 % de puissance decident du combat. On ne choisit pas un cas a la main :
    // on balaye, et on exige qu'une contradiction franche existe.
    // Si ce test tombe un jour, c'est que l'indicateur est devenu fiable et
    // qu'il faut le supprimer, pas le rafistoler.
    const contradictions=[];
    [[0,2,3],[0,4,6],[0,6,3],[0,8,6],[1,1,3],[1,3,6],[1,5,3]].forEach(([d,z,st])=>{
      const cible=createMission(DIFFICULTIES[d],CONTINENTS[z],CONTINENTS[z].stages[st]);
      [.8,1,1.2,1.5,2].forEach(f=>{
        const getStats=statsAvec(f);
        const simule=simulerMission({mission:cible,team:EQUIPE,heroes,getStats,tirages:12});
        const annonce=assessTeamForMission(EQUIPE,HEROES,getStats,cible).verdict.key;
        const rassurant=['comfortable','adapted'].includes(annonce);
        const inquietant=['insufficient','very-insufficient'].includes(annonce);
        if(rassurant&&simule.taux<=.1)contradictions.push(`${annonce} mais ${simule.victoires}/12`);
        if(inquietant&&simule.taux>=.9)contradictions.push(`${annonce} mais ${simule.victoires}/12`);
      });
    });
    expect(contradictions.length,'aucune contradiction : l’indicateur serait devenu fiable')
      .toBeGreaterThan(0);
  });
});

describe('le verdict reste honnete',()=>{
  it('il compte les victoires reelles, sans arrondi flatteur',()=>{
    // Un palier par branche : chacune doit citer le nombre reel de victoires.
    expect(verdictSimule({victoires:19,tirages:20,taux:.95}).phrase).toContain('19 fois sur 20');
    expect(verdictSimule({victoires:14,tirages:20,taux:.7}).phrase).toContain('14 fois sur 20');
    expect(verdictSimule({victoires:9,tirages:20,taux:.45}).phrase).toContain('9 victoires sur 20');
    expect(verdictSimule({victoires:3,tirages:20,taux:.15}).phrase).toContain('3 fois sur 20');
    expect(verdictSimule({victoires:0,tirages:20,taux:0}).phrase).toContain('Aucune victoire');
  });

  it('chaque palier a son icone, et elles sont toutes differentes',()=>{
    const paliers=[1,.8,.5,.2,0].map(t=>verdictSimule({victoires:Math.round(t*20),tirages:20,taux:t}));
    expect(new Set(paliers.map(p=>p.cle)).size,'deux paliers se confondent').toBe(5);
    expect(new Set(paliers.map(p=>p.icone)).size).toBe(5);
  });

  it('un combat a pile ou face n’est jamais annonce comme confortable',()=>{
    // C'est exactement le defaut mesure de l'ancien indicateur.
    const v=verdictSimule({victoires:10,tirages:20,taux:.5});
    expect(v.cle).toBe('serre');
    expect(v.phrase).toContain('serré');
  });

  it('sans resultat, pas de verdict invente',()=>{
    expect(verdictSimule(null)).toBe(null);
  });
});

describe('on simule bien le combat qu’on va jouer',()=>{
  it('BattlePage et la simulation partagent la construction des options',()=>{
    expect(lire('../src/pages/BattlePage.jsx'),'BattlePage reconstruit ses options dans son coin')
      .toContain('optionsDeCombat(mission)');
    expect(lire('../src/utils/simulation.js'),'la simulation n’utilise plus les options partagées')
      .toContain('const options=optionsDeCombat(mission);');
  });

  it('les options portent tout ce qui change un combat',()=>{
    const o=optionsDeCombat({enemies:[{id:'a'}],scale:2,raid:true,raidData:{x:1},raidLevel:5,
      mythic:true,mythicLevel:12,mythicSeason:3,turnBudget:88,waves:[[]],affixIds:['bolstering']});
    expect(o.enemies).toEqual([{id:'a'}]);
    expect(o.enemyScale).toBe(2);
    expect(o.raid).toEqual({x:1,level:5});
    expect(o.mythic).toEqual({level:12,season:3,turnBudget:88});
    expect(o.waves).toEqual([[]]);
    expect(o.affixIds).toEqual(['bolstering']);
  });

  it('une mission ordinaire n’herite ni de Raid ni de Mythic+',()=>{
    const o=optionsDeCombat({enemies:[],scale:1});
    expect(o.raid).toBe(null);
    expect(o.mythic).toBe(null);
  });

  it('l’estimation du contexte utilise l’equipement et la progression reels',()=>{
    const source=lire('../src/store/GameContext.jsx');
    expect(source).toContain('const estimerMission=(mission,members=team,tirages)=>{');
    // On lit le corps de estimerMission, pas le fichier entier : les memes
    // appels existent ailleurs et masqueraient une regression ici.
    const debut=source.indexOf('const estimerMission=');
    const contexte=source.slice(debut,source.indexOf('const requestMissionStart=',debut));
    expect(contexte.length,'le corps de estimerMission est introuvable').toBeGreaterThan(200);
    // On vise la ligne qui alimente la simulation, pas n'importe quel appel :
    // le meme calcul apparait juste a cote pour le bilan d'equipe.
    expect(contexte,'la simulation ignore l’équipement')
      .toContain('getStats:hero=>totalStats(hero,equipment,getProgress(hero),inventory)');
    expect(contexte,'la simulation ignore les Empreintes').toContain('empreinteBonuses(hero,getProgress(hero).empreintes).skills');
    expect(contexte,'la simulation ignore les armes uniques').toContain('uniqueWeapon:getUniqueWeaponForHero(hero)');
    expect(contexte,'la simulation ignore les priorités de sorts').toContain('priorites:autoSkillPriorities');
  });
});
