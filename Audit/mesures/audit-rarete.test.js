import{describe,it}from'vitest';
import{joueur,avecHasard,equipePour}from'./joueur.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission}from'../../src/data/raids.js';
import{CONTINENTS,DIFFICULTIES,createMission}from'../../src/data/campaign.js';
import{championPower}from'../../src/utils/stats.js';

/**
 * La rareté achète-t-elle quelque chose ?
 *
 * C'est la promesse centrale d'un jeu à invocations : un 5★ doit valoir mieux
 * qu'un 3★. Mesuré sur le roster complet, elle ne tient pas — Thorgar et
 * Aurelis, deux 3★, sont dans le haut du classement.
 *
 * Hypothèse arithmétique : `starFactor = 1 + (étoiles - rareté) × 0,18`. Un 3★
 * mené à 6 étoiles gagne 54 %, un 5★ seulement 18 %. Comme les budgets de base
 * ne sont espacés que de 16 % (561 / 604 / 652), l'Ascension RETOURNE l'ordre.
 *
 * Ce banc sépare les deux causes possibles : on compare les moyennes par rareté
 * à ÉTOILES ÉGALES (l'Ascension joue) et à RARETÉ D'ORIGINE (elle ne joue pas).
 */
const NOYAUX=[['Hicho','Aurelis','Morghast'],['Morghast','Ignovar','Aurelis'],
  ['Hicho','Morghast','Ignovar']];
const echelonner=(m,f)=>({...m,enemies:m.enemies.map(u=>({...u,hp:Math.round(u.hp*f),
  atk:Math.round(u.atk*f),def:Math.round(u.def*f)}))});

function classer(profil,etiquette){
  const j=joueur(profil);
  const noyaux=NOYAUX.map(noms=>noms.map(n=>j.heroes.find(h=>h.name===n).id));
  const z7=CONTINENTS[6];
  const taux=(m,eq,t=10)=>avecHasard(977,()=>simulerMission({mission:m,team:eq,
    heroes:j.heroes,getStats:j.getStats,tirages:t})).victoires;
  const brutes=[avecHasard(11,()=>createRaidMission('heartforge',5)),
    avecHasard(13,()=>createMission(DIFFICULTIES[0],z7,z7.stages[6]))];
  const refs=brutes.map(brute=>noyaux.map(noyau=>{
    let bas=.3,haut=14;
    for(let i=0;i<11;i+=1){const m=Math.sqrt(bas*haut);
      if(taux(echelonner(brute,m),noyau)*2>=10)bas=m;else haut=m;}
    return echelonner(brute,Math.sqrt(bas*haut));
  }));
  const lignes=j.heroes.map(h=>({h,
    pw:championPower(j.getStats(h)),
    v:refs.reduce((s,ms)=>s+noyaux.reduce((t,n,i)=>
      t+taux(ms[i],[...n.filter(id=>id!==h.id).slice(0,2),h.id],8),0),0)}));
  const moy=r=>{const l=lignes.filter(x=>x.h.rarity===r);
    return{v:Math.round(l.reduce((s,x)=>s+x.v,0)/l.length),
      pw:Math.round(l.reduce((s,x)=>s+x.pw,0)/l.length)};};
  const[a,b,c]=[moy(3),moy(4),moy(5)];
  console.log(`${etiquette.padEnd(34)} 3★ ${String(a.v).padStart(3)} (pw ${a.pw})  4★ ${String(b.v).padStart(3)} (pw ${b.pw})  5★ ${String(c.v).padStart(3)} (pw ${c.pw})   ordre ${c.v>b.v&&b.v>a.v?'CORRECT':'INVERSÉ ou plat'}`);
}

describe('la rareté achète-t-elle quelque chose',()=>{
  it('moyenne de victoires par rareté, avec et sans Ascension',()=>{
    console.log('victoires moyennes sur 48 (2 rencontres × 3 noyaux × 8 tirages)\n');
    classer({zone:5,difficulte:'normal',niveau:30,etoiles:3,niveauObjet:6,competences:3},
      'sans Ascension (rareté d’origine)');
    classer({zone:5,difficulte:'normal',niveau:30,etoiles:5,niveauObjet:6,competences:3},
      'tous menés à 5 étoiles');
    classer({zone:5,difficulte:'normal',niveau:30,etoiles:6,niveauObjet:6,competences:3},
      'tous menés à 6 étoiles');
  });
},{timeout:1800000});
