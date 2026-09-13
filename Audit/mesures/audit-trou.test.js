import{describe,it}from'vitest';
import{joueur,avecHasard}from'./joueur.js';
import{ECHELLE}from'./echelle.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission}from'../../src/data/raids.js';
import{teamPower,championPower}from'../../src/utils/stats.js';
import{SETS,CONTINENT_SETS}from'../../src/data/items.js';
import{CONTINENTS}from'../../src/data/campaign.js';

/**
 * Le trou des zones 7-8 : artefact de graine, ou vrai défaut ?
 *
 * La carte montre une équipe qui devient MOINS capable en s'équipant mieux.
 * Une seule graine avec douze tirages ne suffit pas à l'affirmer : on rejoue
 * ici avec cinq graines indépendantes et quarante tirages par point.
 */
const equipeBrute=j=>[...j.heroes].map(h=>({h,pw:championPower(j.getStats(h))}))
  .sort((a,b)=>b.pw-a.pw).slice(0,4).map(x=>x.h.id);

describe('la progression d’équipement est-elle monotone',()=>{
  it('raid 4 et 5, zones 5 à 10',()=>{
    const mission4=avecHasard(11,()=>createRaidMission('heartforge',4));
    const mission5=avecHasard(11,()=>createRaidMission('heartforge',5));
    console.log('\npalier                          puissance | sets portés                  | raid4 /200 | raid5 /200');
    ECHELLE.slice(4,12).forEach(p=>{
      const j=joueur(p),equipe=equipeBrute(j);
      const pw=teamPower(equipe,j.heroes,j.getStats);
      const ids=CONTINENT_SETS[CONTINENTS[p.zone-1].id]||[];
      const actifs=ids.map(id=>`${SETS[id].name}(${SETS[id].pieces})`).join(' + ');
      const compter=mission=>[1,2,3,4,5].reduce((somme,graine)=>somme+
        avecHasard(graine*977,()=>simulerMission({mission,team:equipe,heroes:j.heroes,
          getStats:j.getStats,tirages:40})).victoires,0);
      console.log(`${p.nom.padEnd(31)} ${String(pw).padStart(9)} | ${actifs.padEnd(28)} | ${String(compter(mission4)).padStart(10)} | ${String(compter(mission5)).padStart(10)}`);
    });
  });
},{timeout:1800000});
