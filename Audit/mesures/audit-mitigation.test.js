import{describe,it}from'vitest';
import{joueur,avecHasard,equipePour}from'./joueur.js';
import{ECHELLE}from'./echelle.js';
import{createRaidMission}from'../../src/data/raids.js';
import{CONTINENTS,DIFFICULTIES,createMission}from'../../src/data/campaign.js';
import{optionsDeCombat}from'../../src/utils/simulation.js';
import{createBattle,nextTurn,enemyAction,winner,performAutoAction}from'../../src/battle/engine.js';
// La part mitigee doit venir de la MEME constante que le moteur, sinon la
// colonne ment des qu'on touche au levier.
import{mitigation}from'../../src/utils/skillMath.js';

/**
 * Pourquoi les dégâts ne servent-ils à rien ?
 *
 * Hypothèse : la mitigation `100/(100+DÉF×3)` écrase les dégâts bruts à mesure
 * que la Défense ennemie grandit, tandis que soins et boucliers se calculent
 * sur les PV MAX de l'allié — que l'ennemi ne réduit pas. Plus le contenu
 * monte, plus le soutien prend l'avantage, mécaniquement.
 *
 * On relève donc, le long de la progression : la Défense ennemie, la part de
 * dégâts effectivement absorbée par la mitigation, et le rapport entre ce que
 * l'équipe inflige et ce qu'elle se rend.
 */
const mesurer=(j,mission,tirages=10)=>{
  const eq=equipePour(mission,j);
  let degats=0,soinsEtBoucliers=0,actions=0;
  for(let t=0;t<tirages;t+=1)avecHasard(500+t,()=>{
    let b=createBattle(eq,j.heroes,j.getStats,optionsDeCombat(mission));
    const pvE=()=>b.enemies.reduce((s,u)=>s+Math.max(0,u.hp),0);
    const pvA=()=>b.allies.reduce((s,u)=>s+Math.max(0,u.hp)+(u.shield||0),0);
    for(let g=0;g<600&&!b.winner;g+=1){
      if(!b.turn){b=nextTurn(b);continue}
      if(String(b.turn).startsWith('e')){b=enemyAction(b);continue}
      const avantE=pvE(),avantA=pvA();
      const o=performAutoAction(b);b=o?.battle||b;
      b={...b,winner:winner(b.allies,b.enemies)};
      actions+=1;
      degats+=Math.max(0,avantE-pvE());
      soinsEtBoucliers+=Math.max(0,pvA()-avantA);
    }
  });
  const def=mission.enemies.reduce((s,u)=>s+u.def,0)/mission.enemies.length;
  return{def:Math.round(def),mitige:1-mitigation(def),
    degats:Math.round(degats/Math.max(1,actions)),
    soutien:Math.round(soinsEtBoucliers/Math.max(1,actions))};
};

describe('la mitigation écrase-t-elle les dégâts',()=>{
  it('le long de la progression',()=>{
    console.log('contenu                       | DÉF moy | mitigé | dgt/action | soutien/action | rapport');
    const ligne=(nom,j,mission)=>{
      const r=mesurer(j,mission);
      console.log(`${nom.padEnd(29)} | ${String(r.def).padStart(7)} | ${(r.mitige*100).toFixed(0).padStart(5)}% | ${String(r.degats).padStart(10)} | ${String(r.soutien).padStart(14)} | ${(r.soutien/Math.max(1,r.degats)).toFixed(2)}`);
    };
    [[0,1],[5,3],[9,5],[11,7],[16,10]].forEach(([rang,zone])=>{
      const j=joueur(ECHELLE[rang]);
      const c=CONTINENTS[zone-1];
      ligne(`campagne z${zone} · ${ECHELLE[rang].nom.slice(0,12)}`,j,
        avecHasard(13,()=>createMission(DIFFICULTIES[0],c,c.stages[6])));
    });
    [[5,2],[9,5],[16,8],[20,10]].forEach(([rang,niv])=>{
      const j=joueur(ECHELLE[rang]);
      ligne(`raid ${niv} · ${ECHELLE[rang].nom.slice(0,14)}`,j,
        avecHasard(11,()=>createRaidMission('heartforge',niv)));
    });
  });
},{timeout:1800000});
