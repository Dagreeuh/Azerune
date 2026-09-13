import{describe,it}from'vitest';
import{joueur,avecHasard}from'./joueur.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission}from'../../src/data/raids.js';
import{CONTINENTS,DIFFICULTIES,createMission}from'../../src/data/campaign.js';
import{championPower}from'../../src/utils/stats.js';

/**
 * Apport réel : le champion fait-il gagner ?
 *
 * Le banc de dégâts dit ce qu'un kit inflige. Il ne dit pas si le champion sert.
 * Un soigneur y marque peu et peut être indispensable ; un gros frappeur peut
 * mourir avant d'agir. On mesure donc autre chose : on garde trois compagnons
 * fixes, on fait tourner le quatrième, et on compte les victoires.
 */
const NOYAU=[1,3,7]; // Thorgar, Kaelen, Vaeloria — un garde, un tireur, une lame.

/**
 * On ne compte pas des victoires sur UNE rencontre : calée trop haut, elle
 * renvoyait 0 pour vingt champions sur trente-deux, ce qui ne les départage
 * pas. On cherche le SEUIL — le niveau de raid le plus élevé que l'équipe
 * franchit une fois sur deux. Une échelle, pas un couperet.
 */
describe('apport de chaque champion à l’équipe',()=>{
  it('plus haut niveau de raid franchi, quatrième place tournante',()=>{
    const j=joueur({zone:9,difficulte:'normal',niveau:50,etoiles:5,niveauObjet:12,competences:'max'});
    const missions=Array.from({length:10},(u,i)=>avecHasard(11,()=>createRaidMission('heartforge',i+1)));
    const taux=(mission,equipe)=>avecHasard(977,()=>simulerMission({mission,team:equipe,
      heroes:j.heroes,getStats:j.getStats,tirages:20})).victoires;
    const seuil=equipe=>{let haut=0;for(let n=1;n<=10;n+=1){if(taux(missions[n-1],equipe)>=10)haut=n;else break}return haut};
    const temoin=seuil(NOYAU);
    console.log(`\nNoyau seul (3 champions) : raid ${temoin}`);
    const lignes=j.heroes.filter(h=>!NOYAU.includes(h.id)).map(h=>({h,
      pw:championPower(j.getStats(h)),niveau:seuil([...NOYAU,h.id])}));
    lignes.sort((a,b)=>b.niveau-a.niveau||b.pw-a.pw);
    const median=[...lignes].sort((a,b)=>a.niveau-b.niveau)[Math.floor(lignes.length/2)].niveau;
    console.log(`Médiane du roster : raid ${median}. Apport = seuil - ${temoin} (noyau seul).`);
    console.log('champion        rar élém     | puissance | raid max | apport');
    lignes.forEach(l=>{
      const apport=l.niveau-temoin;
      const marque=l.niveau<median-1?' ⛔':l.niveau<median?' ⚠':l.niveau>median+1?' ★':'';
      console.log(`${l.h.name.padEnd(15)} ${l.h.rarity}★ ${l.h.element.padEnd(8)} | ${String(l.pw).padStart(9)} | ${String(l.niveau).padStart(8)} | ${(apport>0?'+':'')+apport}${marque}`);
    });
  });
},{timeout:1800000});
