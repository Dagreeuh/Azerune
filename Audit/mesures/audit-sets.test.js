import{describe,it}from'vitest';
import{joueur,avecHasard,equipePour}from'./joueur.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission}from'../../src/data/raids.js';
import{CONTINENTS,DIFFICULTIES,createMission}from'../../src/data/campaign.js';
import{SETS,CONTINENT_SETS}from'../../src/data/items.js';
import{teamPower}from'../../src/utils/stats.js';

/**
 * Que vaut réellement le set d'une zone ?
 *
 * Constat : la progression d'équipement n'est pas monotone. Le joueur de la
 * zone 8 gagne 21 % de puissance sur celui de la zone 6 et perd 90 % de ses
 * victoires au raid. Une zone à deux sets de DEUX pièces obtient trois bonus
 * avec six emplacements ; une zone à un set de QUATRE n'en obtient que deux.
 *
 * ATTENTION, PIÈGE : ce banc ne compare PAS des équipements équivalents, et je
 * l'ai d'abord cru. Le niveau d'objet du butin monte avec la zone — 14 niveaux
 * séparent la zone 7 de la zone 9 en difficile. Les écarts observés ici mêlent
 * donc la valeur des sets et la qualité brute des pièces, et ne permettent pas
 * de classer les sets entre eux.
 *
 * Ce que ce banc montre en revanche sans ambiguïté : au raid 7, huit zones sur
 * dix rendent 0 victoire sur 60 et deux en rendent 36 et 16, pour moins de 8 %
 * d'écart de puissance. Ce n'est pas un classement de sets, c'est la preuve que
 * le raid bascule sur un fil.
 */
describe('valeur des sets par zone',()=>{
  it('le raid bascule sur quelques pour cent de puissance',()=>{
    // Une rencontre que TOUT LE MONDE gagne ne classe rien : a qualite
    // d'equipement egale, le raid 4 rendait 60/60 pour les dix zones. On monte
    // la reference jusqu'a ce que les zones se separent.
    const raid=avecHasard(11,()=>createRaidMission('heartforge',7));
    const dur=avecHasard(11,()=>createRaidMission('heartforge',9));
    console.log('zone | sets                              | bonus | puiss. | raid7 /60 | raid9 /60');
    CONTINENTS.forEach((c,i)=>{
      // Même niveau, mêmes étoiles, même amélioration : seuls les sets changent.
      const j=joueur({zone:i+1,difficulte:'hard',niveau:60,etoiles:6,niveauObjet:12,competences:'max'});
      const ids=CONTINENT_SETS[c.id]||[];
      const actifs=ids.reduce((n,id)=>n+(SETS[id].pieces===2?0:1),0);
      const libelle=ids.map(id=>`${SETS[id].name}(${SETS[id].pieces})`).join(' + ');
      // Nombre de bonus reellement actifs, d'apres l'equipement construit.
      const stats=j.getStats(j.heroes[0]);
      const pieces=Object.values(j.equipement[j.heroes[0].id]).map(x=>j.inventaire.find(y=>y.id===x).setId);
      const comptes={};pieces.forEach(x=>comptes[x]=(comptes[x]||0)+1);
      const bonus=Object.entries(comptes).reduce((n,[id,k])=>n+Math.floor(k/SETS[id].pieces),0);
      const f=m=>{const eq=equipePour(m,j);return[1,2,3].reduce((s,g)=>s+avecHasard(g*977,()=>
        simulerMission({mission:m,team:eq,heroes:j.heroes,getStats:j.getStats,tirages:20})).victoires,0)};
      const pw=teamPower(equipePour(raid,j),j.heroes,j.getStats);
      console.log(`${String(i+1).padStart(4)} | ${libelle.padEnd(33)} | ${String(bonus).padStart(5)} | ${String(pw).padStart(6)} | ${String(f(raid)).padStart(9)} | ${String(f(dur)).padStart(8)}`);
    });
  });
},{timeout:1800000});
