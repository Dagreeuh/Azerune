import{describe,it}from'vitest';
import{joueur,avecHasard,equipePour}from'./joueur.js';
import{ECHELLE}from'./echelle.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission}from'../../src/data/raids.js';

/**
 * Qu'est-ce qui bloque exactement au niveau 6 du raid ?
 *
 * Mesuré : toute la seconde moitié de la campagne normale plafonne au raid 4-5,
 * puis la campagne difficile franchit d'un coup jusqu'au 7. Deux choses
 * arrivent ensemble au niveau 6 — le Gardien de lave (quatrième ennemi) et la
 * Canalisation du Cœur, qui exige un étourdissement. On les débranche une par
 * une : ce qui déplace le mur est la cause.
 */
const PROFILS=[5,6,9,11,12].map(i=>ECHELLE[i]);
const sans=(mission,quoi)=>{
  if(quoi==='gardien')return{...mission,enemies:mission.enemies.filter(u=>u.raidRole!=='guardian')};
  if(quoi==='canalisation')return{...mission,raidData:{...mission.raidData,channelFrom:null}};
  if(quoi==='les deux')return{...mission,enemies:mission.enemies.filter(u=>u.raidRole!=='guardian'),
    raidData:{...mission.raidData,channelFrom:null}};
  return mission;
};

describe('le mur du raid 6',()=>{
  it('victoires sur 60 selon ce qu’on débranche',()=>{
    ['intact','sans gardien','sans canalisation','sans les deux'].forEach(variante=>{
      const quoi=variante.replace('sans ','').replace('intact','');
      console.log(`\n### ${variante}`);
      console.log('palier                          '+[4,5,6,7,8].map(n=>`niv${n}`.padStart(6)).join(''));
      PROFILS.forEach(p=>{
        const j=joueur(p),cells=[];
        [4,5,6,7,8].forEach(n=>{
          const base=avecHasard(11,()=>createRaidMission('heartforge',n));
          const mission=quoi?sans(base,quoi):base;
          const equipe=equipePour(mission,j);
          const v=[1,2,3].reduce((s,g)=>s+avecHasard(g*977,()=>simulerMission({mission,team:equipe,
            heroes:j.heroes,getStats:j.getStats,tirages:20})).victoires,0);
          cells.push(v);
        });
        console.log(p.nom.padEnd(32)+cells.map(v=>String(v).padStart(6)).join(''));
      });
    });
    console.log('\n(victoires sur 60)');
  });
},{timeout:1800000});
