import{describe,it}from'vitest';
import{joueur,avecHasard,equipePour}from'./joueur.js';
import{createRaidMission}from'../../src/data/raids.js';
import{optionsDeCombat}from'../../src/utils/simulation.js';
import{createBattle,nextTurn,enemyAction,winner,performAutoAction,chooseAutoSkill}from'../../src/battle/engine.js';

/**
 * Que FAIT réellement un champion quand le pilote automatique le conduit ?
 *
 * Les quatre champions restés en bas du classement ont des kits à condition :
 * accumuler des Charges, ancrer un allié, amplifier avant de frapper. On relève
 * donc ce qu'ils lancent, et dans quel état de ressource, plutôt que de
 * supposer que la règle de pilotage fait ce qu'elle promet.
 */
const NOYAU=['Hicho','Aurelis','Morghast'];
describe('conduite automatique des champions faibles',()=>{
  it('sorts lancés et ressource au moment du lancement',()=>{
    const j=joueur({zone:5,difficulte:'normal',niveau:30,etoiles:4,niveauObjet:6,competences:3});
    const noyau=NOYAU.map(n=>j.heroes.find(h=>h.name===n).id);
    const mission=avecHasard(11,()=>createRaidMission('heartforge',5));
    ['Nyxaris','Aszhal','Caelion','Yunmei','Thorgar'].forEach(nom=>{
      const hero=j.heroes.find(h=>h.name===nom);
      const equipe=[...noyau,hero.id];
      const usage=[0,0,0],ressource=[[],[],[]];
      for(let t=0;t<12;t+=1)avecHasard(700+t,()=>{
        let b=createBattle(equipe,j.heroes,j.getStats,optionsDeCombat(mission));
        for(let g=0;g<600&&!b.winner;g+=1){
          if(!b.turn){b=nextTurn(b);continue}
          if(String(b.turn).startsWith('e')){b=enemyAction(b);continue}
          const acteur=b.turn;
          let idx=null,val=null;
          if(acteur===hero.id){idx=chooseAutoSkill(b,{});
            val=b.allies.find(u=>u.id===hero.id)?.mechanic?.value??0;}
          const o=performAutoAction(b);b=o?.battle||b;
          b={...b,winner:winner(b.allies,b.enemies)};
          if(idx!=null){usage[idx]+=1;ressource[idx].push(val);}
        }
      });
      const total=usage.reduce((s,x)=>s+x,0)||1;
      const moy=a=>a.length?(a.reduce((s,x)=>s+x,0)/a.length).toFixed(1):'—';
      console.log(`\n${nom} (${hero.skills.map(s=>s.name).join(' / ')})`);
      usage.forEach((n,i)=>console.log(`   sort ${i+1} : ${String(Math.round(n/total*100)).padStart(3)} %  (${n} lancers, ressource moyenne au lancement ${moy(ressource[i])})`));
    });
  });
},{timeout:1800000});
