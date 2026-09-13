import{describe,it}from'vitest';
import{joueur,avecHasard,equipePour}from'./joueur.js';
import{ECHELLE}from'./echelle.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission}from'../../src/data/raids.js';
import{teamPower}from'../../src/utils/stats.js';

/**
 * Calibrage du raid, barreau par barreau.
 *
 * Mesuré : cinq paliers de progression consécutifs plafonnent tous au niveau 5,
 * puis 5 % de puissance en plus font basculer de 3/60 à 55/60. Ce n'est pas une
 * courbe, c'est un mur précédé d'un plateau.
 *
 * On cherche, pour chaque niveau, le facteur d'échelle qui place la rencontre
 * au point d'équilibre du barreau VISÉ, avec l'ÉQUIPE FIXE (un soin, un
 * bouclier, deux frappeurs).
 *
 * Le premier calibrage composait l'équipe en prenant les quatre champions les
 * plus puissants. Il concluait que le raid était trop dur. Avec une équipe
 * correctement composée, la mesure dit exactement l'inverse : un joueur de la
 * zone 10 enchaîne les dix niveaux, et le raid n'utilise que 40 % de la
 * progression disponible. La composition pèse plus lourd que tout le reste.
 */
const CIBLE=[5,7,8,10,11,13,15,17,19,20];
const J=ECHELLE.map(p=>({...p,j:joueur(p)}));
const reechelonner=(mission,f)=>({...mission,enemies:mission.enemies.map(u=>
  ({...u,hp:Math.round(u.hp*f),atk:Math.round(u.atk*f),def:Math.round(u.def*f)}))});

function facteur(base,p,tirages=20){
  const eq=equipePour(base,p.j);
  const taux=f=>avecHasard(313,()=>simulerMission({mission:reechelonner(base,f),team:eq,
    heroes:p.j.heroes,getStats:p.j.getStats,tirages})).victoires/tirages;
  let bas=.05,haut=30;
  if(taux(haut)>=.5)return null;
  if(taux(bas)<.5)return 0;
  for(let i=0;i<15;i+=1){const m=Math.sqrt(bas*haut);if(taux(m)>=.5)bas=m;else haut=m}
  return Math.sqrt(bas*haut);
}

describe('calibrage du raid',()=>{
  it('facteur nécessaire par niveau',()=>{
    console.log('niv | barreau visé                   | puiss. | échelle act. | voulue | ×');
    const voulues=[];
    for(let n=1;n<=10;n+=1){
      const p=J[CIBLE[n-1]];
      const base=avecHasard(11,()=>createRaidMission('heartforge',n));
      const f=facteur(base,p);
      const actuelle=1+(n-1)*.18;
      const voulue=f===null?null:actuelle*f;
      voulues.push(voulue);
      const pw=teamPower(equipePour(base,p.j),p.j.heroes,p.j.getStats);
      console.log(`${String(n).padStart(3)} | ${p.nom.padEnd(30)} | ${String(pw).padStart(6)} | ${actuelle.toFixed(2).padStart(12)} | ${(voulue?voulue.toFixed(2):'—').padStart(6)} | ${f?f.toFixed(2):'—'}`);
    }
    console.log('\nRAID_SCALE proposé =',JSON.stringify(voulues.map(v=>v?Math.round(v*100)/100:null)));
  });
},{timeout:1800000});
