import{describe,it}from'vitest';
import{joueur,avecHasard}from'./joueur.js';
import{createRaidMission}from'../../src/data/raids.js';
import{optionsDeCombat}from'../../src/utils/simulation.js';
import{createBattle,nextTurn,enemyAction,winner,performAutoAction}from'../../src/battle/engine.js';
import{championPower}from'../../src/utils/stats.js';
describe('les faibles meurent-ils',()=>{
 it('survie et actions du quatrieme champion',()=>{
  const j=joueur({zone:5,difficulte:'normal',niveau:30,etoiles:4,niveauObjet:6,competences:3});
  const noyau=['Hicho','Aurelis','Morghast'].map(n=>j.heroes.find(h=>h.name===n).id);
  const m=avecHasard(11,()=>createRaidMission('heartforge',4));
  console.log('champion        | PV  | morts /20 | action ou il meurt | actions moy.');
  ['Nyxaris','Vharok','Brilith','Nerissa','Caelion','Sylven','Ignovar','Maerys','Mathanae'].forEach(nom=>{
    const h=j.heroes.find(x=>x.name===nom);
    const st=j.getStats(h);
    let morts=0,quand=[],actions=0;
    for(let t=0;t<20;t+=1)avecHasard(700+t,()=>{
      let b=createBattle([...noyau,h.id],j.heroes,j.getStats,optionsDeCombat(m));
      let n=0,mortA=null;
      for(let g=0;g<600&&!b.winner;g+=1){
        if(!b.turn){b=nextTurn(b);continue}
        if(String(b.turn).startsWith('e')){b=enemyAction(b);continue}
        const acteur=b.turn;const o=performAutoAction(b);b=o?.battle||b;
        b={...b,winner:winner(b.allies,b.enemies)};
        if(acteur===h.id)n+=1;
        const u=b.allies.find(x=>x.id===h.id);
        if(mortA===null&&u?.dead)mortA=n;
      }
      actions+=n;if(mortA!==null){morts+=1;quand.push(mortA);}
    });
    const moy=quand.length?(quand.reduce((s,x)=>s+x,0)/quand.length).toFixed(1):'—';
    console.log(`${nom.padEnd(15)} | ${String(st.hp).padStart(4)}| ${String(morts).padStart(9)} | ${String(moy).padStart(18)} | ${(actions/20).toFixed(1)}`);
  });
 },1800000);
},{timeout:1800000});
