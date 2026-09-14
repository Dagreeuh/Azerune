import{describe,it}from'vitest';
import{joueur,avecHasard,equipePour}from'./joueur.js';
import{ECHELLE}from'./echelle.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createExpeditionMission,EXPEDITIONS,EXPEDITION_SCALE}from'../../src/data/expeditions.js';
import{teamPower,championPower}from'../../src/utils/stats.js';

/**
 * Choix de la table de difficulté des expéditions.
 *
 * Le critère n'est pas « quel nombre » mais « quel palier de progression » :
 * une bonne table demande un palier de plus à chaque niveau, sans plateau (deux
 * niveaux au même palier) ni saut (deux paliers sautés d'un coup).
 */
const JOUEURS=ECHELLE.map(p=>({...p,j:joueur(p)}));

const reechelonner=(mission,f)=>({...mission,enemies:mission.enemies.map(u=>
  ({...u,hp:Math.round(u.hp*f),atk:Math.round(u.atk*f),def:Math.round(u.def*f)}))});

function palierRequis(mission,tirages=16){
  for(let i=0;i<JOUEURS.length;i+=1){
    const p=JOUEURS[i],equipe=equipePour(mission,p.j);
    const r=avecHasard(313,()=>simulerMission({mission,team:equipe,heroes:p.j.heroes,
      getStats:p.j.getStats,tirages}));
    if(r.victoires*2>=tirages)return i;
  }
  return null;
}

const CANDIDATES={
  'actuelle (en place)':EXPEDITION_SCALE,
  // La relation mesuree entre echelle et palier est log-lineaire : un palier
  // de plus coute environ x1,41 d'echelle. Cette table suit cette pente.
  'log-lineaire 1,41':[1,1.40,2.00,2.75,3.85,5.45,7.70,10.5,14.8,21.0],
  // Meme pente, comprimee : le niveau 10 doit demander la campagne NORMALE
  // terminee (palier 11), pas la difficile (13,5).
  'comprimee 1,275':[1,1.28,1.63,2.08,2.65,3.38,4.31,5.50,7.00,8.95],
  'comprimee 1,30':[1,1.30,1.69,2.20,2.86,3.71,4.83,6.27,8.16,10.6]
};

describe('table de difficulté des expéditions',()=>{
  it('palier requis par niveau, trois candidates',()=>{
    Object.entries(CANDIDATES).forEach(([nom,table])=>{
      console.log(`\n### ${nom}`);
      console.log('expédition                     '+Array.from({length:10},(u,i)=>String(i+1).padStart(4)).join(''));
      const toutes=[];
      EXPEDITIONS.forEach(exp=>{
        const paliers=[];
        for(let n=1;n<=10;n+=1){
          const base=avecHasard(12,()=>createExpeditionMission(exp.id,n));
          const f=table[n-1]/EXPEDITION_SCALE[n-1];
          paliers.push(palierRequis(reechelonner(base,f)));
        }
        toutes.push(paliers);
        console.log(exp.name.slice(0,30).padEnd(31)+paliers.map(v=>String(v===null?'—':v).padStart(4)).join(''));
      });
      const moyen=Array.from({length:10},(u,i)=>{
        const v=toutes.map(p=>p[i]).filter(x=>x!==null);
        return v.length?(v.reduce((s,x)=>s+x,0)/v.length):null;});
      let plateaux=0,sauts=0;
      for(let i=1;i<10;i+=1){const d=(moyen[i]??0)-(moyen[i-1]??0);
        if(d<.6)plateaux+=1;if(d>2.2)sauts+=1;}
      console.log(`→ moyenne ${moyen.map(v=>v===null?'—':v.toFixed(1)).join(' ')}`);
      console.log(`→ plateaux : ${plateaux} · sauts : ${sauts} · portée ${(moyen[0]??0).toFixed(1)} → ${(moyen[9]??0).toFixed(1)}`);
    });
  });
},{timeout:1800000});
