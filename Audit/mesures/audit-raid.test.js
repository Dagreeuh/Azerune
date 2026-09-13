/**
 * ATTENTION — ce banc compose l'equipe avec LES QUATRE CHAMPIONS LES PLUS
 * PUISSANTS. Mesure ulterieure : cette regle est mauvaise, et c'est elle qui
 * fait paraitre le raid infaisable. Une equipe composee (un soin, un bouclier,
 * deux frappeurs) gagne les memes niveaux avec trois fois moins de puissance.
 * Le banc est conserve tel quel car il montre precisement ce que subit un
 * joueur qui choisit ses champions au chiffre de puissance. Pour mesurer le
 * contenu lui-meme, utiliser `equipePour` (equipe fixe et composee).
 */
import{describe,it}from'vitest';
import{joueur,avecHasard}from'./joueur.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission,RAID_POWER}from'../../src/data/raids.js';
import{teamPower,championPower}from'../../src/utils/stats.js';
import{HEROES}from'../../src/data/heroes.js';

const PROFILS=[
  {nom:'fin campagne normale',zone:10,difficulte:'normal',niveau:60,etoiles:5,niveauObjet:9},
  {nom:'campagne difficile',zone:10,difficulte:'hard',niveau:60,etoiles:6,niveauObjet:12},
  {nom:'campagne hardcore',zone:10,difficulte:'hardcore',niveau:60,etoiles:6,niveauObjet:15},
  {nom:'hardcore + compétences max',zone:10,difficulte:'hardcore',niveau:60,etoiles:6,niveauObjet:15,
    competences:'max'},
  {nom:'PLAFOND (rés. 5 + Empreintes)',zone:10,difficulte:'hardcore',niveau:60,etoiles:6,niveauObjet:15,
    competences:'max',resonance:5,empreintes:true}
];

/** Les 4 champions les plus puissants : ce que choisit un joueur qui ne sait pas. */
const equipeBrute=j=>[...j.heroes].map(h=>({h,pw:championPower(j.getStats(h))}))
  .sort((a,b)=>b.pw-a.pw).slice(0,4).map(x=>x.h.id);

describe('le raid est-il faisable',()=>{
  it('taux de victoire par niveau de raid',()=>{
    PROFILS.forEach(p=>{
      const j=joueur(p);
      const equipe=equipeBrute(j);
      const pw=teamPower(equipe,j.heroes,j.getStats);
      console.log(`\n### ${p.nom} — puissance ${pw}`);
      console.log('niv | annoncé | ratio | victoires/20 | actions moy.');
      for(let n=1;n<=10;n+=1){
        const mission=avecHasard(11,()=>createRaidMission('heartforge',n));
        const r=avecHasard(101+n,()=>simulerMission({mission,team:equipe,heroes:j.heroes,
          getStats:j.getStats,tirages:20}));
        console.log(`${String(n).padStart(3)} | ${String(RAID_POWER[n-1]).padStart(7)} | ${(pw/RAID_POWER[n-1]).toFixed(2)} | ${String(r.victoires).padStart(12)} | ${r.actionsMoyennes}`);
      }
    });
  });
},{timeout:600000});
