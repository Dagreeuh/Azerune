import{describe,it}from'vitest';
import{joueur,avecHasard}from'./joueur.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission}from'../../src/data/raids.js';

/**
 * Le Raid est annoncé 4v4. Le quatrième champion aide-t-il ?
 *
 * Le Cœur incandescent gagne une charge À CHAQUE ACTION DE CHAMPION. Une équipe
 * de quatre agit donc un tiers plus souvent qu'une équipe de trois, et fait
 * arriver l'Éruption un tiers plus tôt — sans que le quatrième compense
 * toujours ce qu'il coûte. On mesure l'ecart.
 */
const NOYAU=['Hicho','Aurelis','Morghast'];
describe('le quatrième champion du Raid',()=>{
  it('trois contre quatre, à chaque niveau',()=>{
    const j=joueur({zone:9,difficulte:'normal',niveau:50,etoiles:5,niveauObjet:12,competences:'max'});
    const noyau=NOYAU.map(n=>j.heroes.find(h=>h.name===n).id);
    const candidats=['Ignovar','Vexil','Brom','Brilith','Vharok']
      .map(n=>j.heroes.find(h=>h.name===n));
    const taux=equipe=>niveau=>{
      const m=avecHasard(11,()=>createRaidMission('heartforge',niveau));
      return[1,2,3].reduce((s,g)=>s+avecHasard(g*977,()=>simulerMission({mission:m,team:equipe,
        heroes:j.heroes,getStats:j.getStats,tirages:20})).victoires,0);
    };
    const niveaux=[7,8,9,10];
    console.log('équipe                          '+niveaux.map(n=>`niv${n}`.padStart(7)).join(''));
    console.log('à TROIS (noyau seul)            '+niveaux.map(n=>String(taux(noyau)(n)).padStart(7)).join(''));
    candidats.forEach(c=>console.log(`+ ${c.name.padEnd(28)}`+
      niveaux.map(n=>String(taux([...noyau,c.id])(n)).padStart(7)).join('')));
    console.log('(victoires sur 60)');
  });
},{timeout:1800000});
