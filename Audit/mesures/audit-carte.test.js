import{describe,it}from'vitest';
import{joueur,avecHasard,equipePour}from'./joueur.js';
import{ECHELLE}from'./echelle.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission}from'../../src/data/raids.js';
import{createExpeditionMission,EXPEDITIONS}from'../../src/data/expeditions.js';
import{teamPower,championPower}from'../../src/utils/stats.js';

/**
 * Carte de difficulté : victoires sur 12 pour chaque couple (palier, niveau).
 *
 * Un mode bien réglé montre une diagonale : chaque niveau demande un palier de
 * plus que le précédent. Une colonne qui ne bouge plus est un niveau qui
 * n'ajoute rien ; deux colonnes identiques sont deux niveaux pour une seule
 * marche.
 */
const equipeBrute=j=>[...j.heroes].map(h=>({h,pw:championPower(j.getStats(h))}))
  .sort((a,b)=>b.pw-a.pw).slice(0,4).map(x=>x.h.id);
const JOUEURS=ECHELLE.map(p=>{const j=joueur(p);const equipe=equipeBrute(j);
  return{...p,j,equipe,puissance:teamPower(equipe,j.heroes,j.getStats)};});
const TIRAGES=12;

function carte(titre,fabrique){
  console.log(`\n### ${titre}`);
  console.log('palier                          '+Array.from({length:10},(u,i)=>String(i+1).padStart(4)).join(''));
  const colonnes=Array.from({length:10},()=>[]);
  JOUEURS.forEach(p=>{
    const cells=[];
    for(let n=1;n<=10;n+=1){
      const mission=avecHasard(11+n,()=>fabrique(n));
      const r=avecHasard(313,()=>simulerMission({mission,team:p.equipe,heroes:p.j.heroes,
        getStats:p.j.getStats,tirages:TIRAGES}));
      cells.push(r.victoires);colonnes[n-1].push(r.victoires);
    }
    console.log(p.nom.padEnd(32)+cells.map(v=>String(v).padStart(4)).join(''));
  });
  // Deux niveaux consecutifs qui se comportent pareil sur toute l'echelle ne
  // sont qu'une seule marche presentee deux fois.
  const jumeaux=[];
  for(let n=1;n<10;n+=1)if(colonnes[n-1].every((v,i)=>v===colonnes[n][i]))jumeaux.push(`${n}/${n+1}`);
  const marches=new Set(colonnes.map(c=>c.join(','))).size;
  console.log(`→ ${marches} comportements distincts pour 10 niveaux`+
    (jumeaux.length?` · niveaux indiscernables : ${jumeaux.join(', ')}`:''));
}

describe('carte de difficulté',()=>{
  it('raid',()=>carte('RAID Fournaise du Cœur-Monde',n=>createRaidMission('heartforge',n)),1800000);
  EXPEDITIONS.forEach(exp=>it(`expédition ${exp.name}`,()=>
    carte(`EXPÉDITION ${exp.name}`,n=>createExpeditionMission(exp.id,n)),1800000));
},{timeout:1800000});
