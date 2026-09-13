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
/**
 * NOYAU CORRECTEMENT COMPOSE — et c'est tout le sujet.
 *
 * La premiere version de ce banc utilisait Thorgar, Kaelen et Vaeloria : un
 * noyau choisi a la puissance, sans soin. Mesure ulterieure : une equipe ainsi
 * composee perd la ou une equipe avec un soin et un bouclier gagne, a trois
 * fois moins de puissance. Le banc classait donc surtout la capacite de chaque
 * champion a RATTRAPER un noyau defaillant — pas son apport reel.
 *
 * Le noyau est desormais celui d'un joueur averti : un soin, un bouclier, un
 * frappeur. La quatrieme place tourne.
 */
const NOMS_NOYAU=['Hicho','Aurelis','Morghast'];

describe('apport de chaque champion a une equipe bien composee',()=>{
  it('plus haut niveau de raid franchi, quatrieme place tournante',()=>{
    const j=joueur({zone:9,difficulte:'normal',niveau:50,etoiles:5,niveauObjet:12,competences:'max'});
    const noyau=NOMS_NOYAU.map(n=>j.heroes.find(h=>h.name===n).id);
    const missions=Array.from({length:10},(u,i)=>avecHasard(11,()=>createRaidMission('heartforge',i+1)));
    const taux=(mission,equipe)=>[1,2].reduce((s,g)=>s+avecHasard(g*977,()=>simulerMission({mission,
      team:equipe,heroes:j.heroes,getStats:j.getStats,tirages:15})).victoires,0);
    const seuil=equipe=>{let haut=0;for(let n=1;n<=10;n+=1){if(taux(missions[n-1],equipe)>=15)haut=n;else break}return haut};
    const temoin=seuil(noyau);
    console.log(`\nNoyau seul (3 champions : ${NOMS_NOYAU.join(', ')}) : raid ${temoin}`);
    const lignes=j.heroes.filter(h=>!noyau.includes(h.id)).map(h=>({h,
      pw:championPower(j.getStats(h)),niveau:seuil([...noyau,h.id])}));
    lignes.sort((a,b)=>b.niveau-a.niveau||b.pw-a.pw);
    const tri=[...lignes].map(l=>l.niveau).sort((a,b)=>a-b);
    const median=tri[Math.floor(tri.length/2)];
    console.log(`Mediane du roster : raid ${median}. Apport = seuil - ${temoin} (noyau seul).`);
    console.log('champion        rar elem     | puissance | raid max | apport');
    lignes.forEach(l=>{
      const apport=l.niveau-temoin;
      const marque=l.niveau<median-1?' INUTILE':l.niveau<median?' faible':l.niveau>median+1?' FORT':'';
      console.log(`${l.h.name.padEnd(15)} ${l.h.rarity}* ${l.h.element.padEnd(8)} | ${String(l.pw).padStart(9)} | ${String(l.niveau).padStart(8)} | ${(apport>0?'+':'')+apport}${marque}`);
    });
  });
},{timeout:1800000});
