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
/**
 * TROIS noyaux, pas un.
 *
 * Avec un noyau unique contenant un soigneur, tout second soigneur est
 * redondant PAR CONSTRUCTION : Yunmei, qui rend 1 863 points de soin par action
 * au banc de kits, sortait derniere du classement pour cette seule raison. Un
 * classement qui punit un champion parce qu'il double le role du noyau ne
 * mesure pas le champion, il mesure le noyau.
 *
 * On fait donc tourner trois compositions — avec soin, sans soin, sans
 * bouclier — et on somme. Un champion n'est faible que s'il l'est dans les
 * trois.
 */
const NOYAUX=[['Hicho','Aurelis','Morghast'],['Morghast','Ignovar','Aurelis'],
  ['Hicho','Morghast','Ignovar']];
const echelonner=(m,f)=>({...m,enemies:m.enemies.map(u=>({...u,hp:Math.round(u.hp*f),
  atk:Math.round(u.atk*f),def:Math.round(u.def*f)}))});

describe('classement multi-rencontres',()=>{
 it('victoires sur 60, chaque rencontre calee a la bascule',()=>{
  const j=joueur({zone:5,difficulte:'normal',niveau:30,etoiles:4,niveauObjet:6,competences:3});
  const noyaux=NOYAUX.map(noms=>noms.map(n=>j.heroes.find(h=>h.name===n).id));
  const z7=CONTINENTS[6],z4=CONTINENTS[3];
  const brutes=[
    ['raid feu',avecHasard(11,()=>createRaidMission('heartforge',5))],
    ['camp. z7',avecHasard(13,()=>createMission(DIFFICULTIES[0],z7,z7.stages[6]))],
    ['forge arcane',avecHasard(12,()=>createExpeditionMission('astral-forge',6))],
    ['camp. z4 dur',avecHasard(13,()=>createMission(DIFFICULTIES[1],z4,z4.stages[6]))]];
  const taux=(m,eq,t=20)=>[1,2,3].reduce((s,g)=>s+avecHasard(g*977,()=>simulerMission({mission:m,
    team:eq,heroes:j.heroes,getStats:j.getStats,tirages:t})).victoires,0);
  // Chaque couple (rencontre, noyau) est calibre SEPAREMENT.
  //
  // Une version precedente calait la rencontre sur le premier noyau seulement.
  // Les deux autres, plus faibles, y perdaient alors 24 fois sur 24 : les
  // cellules du bas saturaient a zero et aucun renforcement de champion n'y
  // etait visible. Un banc qui sature a une extremite ne mesure plus ce qui s'y
  // passe — il l'a deja decide.
  const refs=brutes.map(([nom,brute])=>{
    const parNoyau=noyaux.map(noyau=>{
      let bas=.3,haut=14;
      for(let i=0;i<12;i+=1){const m=Math.sqrt(bas*haut);
        if(taux(echelonner(brute,m),noyau,10)*2>=30)bas=m;else haut=m;}
      return echelonner(brute,Math.sqrt(bas*haut));
    });
    return[nom,parNoyau];
  });
  const temoins=refs.map(([,ms])=>ms.reduce((s,m,i)=>s+taux(m,noyaux[i],8),0));

  const lignes=j.heroes.map(h=>{
    const vals=refs.map(([,ms])=>noyaux.reduce((s,n,i)=>
      s+taux(ms[i],[...n.filter(id=>id!==h.id).slice(0,2),h.id],8),0));
    return{h,vals,total:vals.reduce((s,v)=>s+v,0)};
  });
  lignes.sort((a,b)=>b.total-a.total);
  const tri=[...lignes].map(l=>l.total).sort((a,b)=>a-b);
  const median=tri[Math.floor(tri.length/2)];
  console.log(`\nmediane du roster : ${median}/288 (3 noyaux x 4 rencontres x 24 tirages)`);
  console.log('champion        rar elem     |'+refs.map(([n])=>n.padStart(13)).join('')+'   TOTAL');
  lignes.forEach(l=>{
    const marque=l.total<median-45?'  TRES FAIBLE':l.total<median-22?'  faible':l.total>median+22?'  FORT':'';
    console.log(`${l.h.name.padEnd(15)} ${l.h.rarity}* ${l.h.element.padEnd(8)} |`+
      l.vals.map(v=>String(v).padStart(13)).join('')+String(l.total).padStart(8)+marque);
  });
 },1800000);
},{timeout:1800000});
