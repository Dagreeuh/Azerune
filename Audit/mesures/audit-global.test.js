import{describe,it}from'vitest';
import{joueur}from'./joueur.js';
import{teamPower,championPower}from'../../src/utils/stats.js';
import{HEROES}from'../../src/data/heroes.js';

const POINTS=[
  {nom:'sortie de tutoriel',zone:1,difficulte:'normal',niveau:5,etoiles:3,niveauObjet:0},
  {nom:'fin zone 2',zone:2,difficulte:'normal',niveau:12,etoiles:3,niveauObjet:0},
  {nom:'fin zone 5',zone:5,difficulte:'normal',niveau:30,etoiles:4,niveauObjet:3},
  {nom:'fin zone 8',zone:8,difficulte:'normal',niveau:48,etoiles:5,niveauObjet:6},
  {nom:'fin campagne normale',zone:10,difficulte:'normal',niveau:60,etoiles:5,niveauObjet:9},
  {nom:'campagne difficile finie',zone:10,difficulte:'hard',niveau:60,etoiles:6,niveauObjet:12},
  {nom:'campagne hardcore finie',zone:10,difficulte:'hardcore',niveau:60,etoiles:6,niveauObjet:15}
];

describe('modèle de joueur',()=>{
  it('puissance d’équipe aux points de progression',()=>{
    console.log('\nPOINT                      | puissance équipe (4 meilleurs) | 1 champion moyen');
    POINTS.forEach(p=>{
      const j=joueur(p);
      const classe=[...HEROES].map(h=>({h,pw:championPower(j.getStats(h))})).sort((a,b)=>b.pw-a.pw);
      const quatre=classe.slice(0,4).map(x=>x.h.id);
      const moyenne=Math.round(classe.reduce((s,x)=>s+x.pw,0)/classe.length);
      console.log(`${p.nom.padEnd(26)} | ${String(teamPower(quatre,HEROES,j.getStats)).padStart(30)} | ${moyenne}`);
    });
  });
});
