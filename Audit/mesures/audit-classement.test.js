import{describe,it}from'vitest';
import{joueur,avecHasard}from'./joueur.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission}from'../../src/data/raids.js';
import{createExpeditionMission}from'../../src/data/expeditions.js';
import{CONTINENTS,DIFFICULTIES,createMission}from'../../src/data/campaign.js';

/**
 * Classement des champions sur QUATRE rencontres d'elements differents, chacune
 * ramenee a son point de bascule pour ce joueur.
 *
 * Deux versions precedentes de ce banc ne departageaient rien :
 *   · la premiere cherchait le SEUIL entier de raid franchi — dix marches pour
 *     trente champions, tout le monde finissait sur la meme ;
 *   · la seconde gardait les rencontres a leur difficulte nominale, ou le noyau
 *     seul gagne deja 60 fois sur 60. Une rencontre gagnee d'avance ne classe
 *     personne : il faut que le noyau y soit indecis, sinon le quatrieme
 *     champion n'a rien a changer.
 *
 * Chaque rencontre est donc mise a l'echelle par dichotomie jusqu'a ce que le
 * trio seul y gagne une fois sur deux. 240 tirages par champion.
 */
const NOYAU=['Hicho','Aurelis','Morghast'];
const echelonner=(m,f)=>({...m,enemies:m.enemies.map(u=>({...u,hp:Math.round(u.hp*f),
  atk:Math.round(u.atk*f),def:Math.round(u.def*f)}))});

describe('classement multi-rencontres',()=>{
 it('victoires sur 60, chaque rencontre calee a la bascule',()=>{
  const j=joueur({zone:5,difficulte:'normal',niveau:30,etoiles:4,niveauObjet:6,competences:3});
  const noyau=NOYAU.map(n=>j.heroes.find(h=>h.name===n).id);
  const z7=CONTINENTS[6],z4=CONTINENTS[3];
  const brutes=[
    ['raid feu',avecHasard(11,()=>createRaidMission('heartforge',5))],
    ['camp. z7',avecHasard(13,()=>createMission(DIFFICULTIES[0],z7,z7.stages[6]))],
    ['forge arcane',avecHasard(12,()=>createExpeditionMission('astral-forge',6))],
    ['camp. z4 dur',avecHasard(13,()=>createMission(DIFFICULTIES[1],z4,z4.stages[6]))]];
  const taux=(m,eq,t=20)=>[1,2,3].reduce((s,g)=>s+avecHasard(g*977,()=>simulerMission({mission:m,
    team:eq,heroes:j.heroes,getStats:j.getStats,tirages:t})).victoires,0);
  // Dichotomie sur le facteur pour amener le noyau seul autour de 30/60.
  const refs=brutes.map(([nom,brute])=>{
    let bas=.5,haut=12;
    for(let i=0;i<12;i+=1){const m=Math.sqrt(bas*haut);
      if(taux(echelonner(brute,m),noyau,10)*2>=30)bas=m;else haut=m;}
    const f=Math.sqrt(bas*haut);
    return[nom,echelonner(brute,f),f];
  });
  const temoins=refs.map(([,m])=>taux(m,noyau));
  console.log('rencontre                '+refs.map(([n],i)=>`${n} x${refs[i][2].toFixed(1)}`.padStart(16)).join(''));
  console.log('noyau seul               '+temoins.map(v=>String(v).padStart(16)).join(''));
  const lignes=j.heroes.filter(h=>!noyau.includes(h.id)).map(h=>{
    const vals=refs.map(([,m])=>taux(m,[...noyau,h.id]));
    return{h,vals,total:vals.reduce((s,v)=>s+v,0)};
  });
  lignes.sort((a,b)=>b.total-a.total);
  const tri=[...lignes].map(l=>l.total).sort((a,b)=>a-b);
  const median=tri[Math.floor(tri.length/2)];
  console.log(`\nmediane du roster : ${median}/240`);
  console.log('champion        rar elem     |'+refs.map(([n])=>n.padStart(13)).join('')+'   TOTAL');
  lignes.forEach(l=>{
    const marque=l.total<median-45?'  TRES FAIBLE':l.total<median-25?'  faible':l.total>median+25?'  FORT':'';
    console.log(`${l.h.name.padEnd(15)} ${l.h.rarity}* ${l.h.element.padEnd(8)} |`+
      l.vals.map(v=>String(v).padStart(13)).join('')+String(l.total).padStart(8)+marque);
  });
 },1800000);
},{timeout:1800000});
