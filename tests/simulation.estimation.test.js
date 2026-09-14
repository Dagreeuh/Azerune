import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{simulerMission,verdictSimule,optionsDeCombat,TIRAGES_PAR_DEFAUT,ACTIONS_MAX}from'../src/utils/simulation';
import{joueur,avecHasard,equipePour}from'../Audit/mesures/joueur';
import{createRaidMission}from'../src/data/raids';
import{createExpeditionMission}from'../src/data/expeditions';
import{calibratedEncounterPower}from'../src/utils/stats';
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

describe('l’indicateur de difficulte et le combat reel s’accordent',()=>{
  // HISTOIRE DE CE CONTRAT, parce qu'elle explique sa forme actuelle.
  //
  // Il exigeait d'abord qu'il EXISTE des combats ou le verdict affiche et le
  // combat reel se contredisent : c'etait la justification du simulateur. Il a
  // cesse d'en trouver deux fois.
  //
  // La premiere fois etait un faux espoir. Son echantillon multipliait les
  // statistiques d'une equipe par un coefficient, et l'equilibrage avait
  // simplement deplace la zone de desaccord hors de portee. Verifie par un
  // balayage large — 840 couples (palier x mission) — l'indicateur se trompait
  // encore 20 % du temps.
  //
  // La seconde fois est la bonne. `calibratedEncounterPower` enumerait les
  // modes par procuration au lieu de demander si la mission annonce un chiffre :
  // l'ecran de raid affichait « Recommandee : 10 200 » pendant que le verdict a
  // cote etait calcule sur 52 300. Corrige, le meme balayage tombe a 1 %.
  //
  // Le contrat s'inverse donc : ce n'est plus le desaccord qu'on exige, c'est
  // l'accord. Un futur changement d'equilibrage qui remettrait l'annonce en
  // defaut le fera echouer.
  const PROFILS=[
    {zone:1,difficulte:'normal',niveau:1,etoiles:3,niveauObjet:0,competences:1},
    {zone:3,difficulte:'normal',niveau:20,etoiles:4,niveauObjet:3,competences:2},
    {zone:5,difficulte:'normal',niveau:30,etoiles:4,niveauObjet:6,competences:3},
    {zone:9,difficulte:'normal',niveau:50,etoiles:5,niveauObjet:12,competences:'max'}];

  const balayer=()=>{
    const missions=[];
    [0,1,2].forEach(d=>[0,4,9].forEach(z=>
      missions.push(avecHasard(13,()=>createMission(DIFFICULTIES[d],CONTINENTS[z],CONTINENTS[z].stages[6])))));
    [1,5,9].forEach(n=>missions.push(avecHasard(11,()=>createRaidMission('heartforge',n))));
    [1,5,9].forEach(n=>missions.push(avecHasard(12,()=>createExpeditionMission('treasury',n))));
    let cas=0,rassurantPerdu=0,inquietantGagne=0;
    PROFILS.forEach(profil=>{
      const j=joueur(profil);
      missions.forEach(mission=>{
        const equipe=equipePour(mission,j);
        const simule=avecHasard(313,()=>simulerMission({mission,team:equipe,
          heroes:j.heroes,getStats:j.getStats,tirages:8}));
        const annonce=assessTeamForMission(equipe,j.heroes,j.getStats,mission).verdict.key;
        cas+=1;
        if(['comfortable','adapted'].includes(annonce)&&simule.taux<=.1)rassurantPerdu+=1;
        if(['insufficient','very-insufficient'].includes(annonce)&&simule.taux>=.9)inquietantGagne+=1;
      });
    });
    return{cas,rassurantPerdu,inquietantGagne};
  };

  it('les contradictions franches restent rares',()=>{
    const{cas,rassurantPerdu,inquietantGagne}=balayer();
    expect(cas,'le balayage ne couvre plus rien').toBeGreaterThanOrEqual(50);
    const taux=(rassurantPerdu+inquietantGagne)/cas;
    expect(taux,`${rassurantPerdu+inquietantGagne} contradictions sur ${cas} couples`)
      .toBeLessThanOrEqual(.10);
  });

  it('le jeu ne decourage plus un joueur qui gagnerait',()=>{
    // Le defaut d'origine, en une ligne : « insuffisant » annonce a un joueur
    // qui gagne douze fois sur douze, 20 % du temps.
    const{cas,inquietantGagne}=balayer();
    expect(inquietantGagne/cas,`${inquietantGagne} faux « insuffisant » sur ${cas}`)
      .toBeLessThanOrEqual(.08);
  });

  it('la puissance annoncee d’un mode fait foi sur son propre ecran',()=>{
    // Deux chiffres differents sur la meme page : l'ecran de raid affichait
    // 10 200 et le verdict etait calcule sur 52 300.
    const raid=createRaidMission('heartforge',10);
    expect(calibratedEncounterPower(raid)).toBe(raid.recommended);
    const expedition=createExpeditionMission('treasury',10);
    expect(calibratedEncounterPower(expedition)).toBe(expedition.recommended);
    const campagne=createMission(DIFFICULTIES[0],CONTINENTS[4],CONTINENTS[4].stages[6]);
    expect(calibratedEncounterPower(campagne)).toBe(campagne.recommended);
  });
});
