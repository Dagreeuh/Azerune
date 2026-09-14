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

/**
 * On ne mesure pas un SEUIL entier : avec dix niveaux de raid pour trente
 * champions, tout le monde se retrouve sur la meme marche et rien n'est
 * departage. On fixe la rencontre au point de bascule du noyau seul, et on
 * compte les victoires sur 100. C'est une regle graduee, pas un couperet.
 */
describe('apport de chaque champion a une equipe bien composee',()=>{
  it('victoires sur 100 a la rencontre de bascule',()=>{
    const j=joueur({zone:5,difficulte:'normal',niveau:30,etoiles:4,niveauObjet:6,competences:3});
    const noyau=NOMS_NOYAU.map(n=>j.heroes.find(h=>h.name===n).id);
    const taux=(mission,equipe)=>[1,2,3,4,5].reduce((s,g)=>s+avecHasard(g*977,()=>
      simulerMission({mission,team:equipe,heroes:j.heroes,getStats:j.getStats,tirages:20})).victoires,0);
    // Chercher le niveau ou le noyau seul est le plus indecis : c'est la que le
    // quatrieme champion se voit.
    let bascule=1,meilleur=999;
    for(let n=1;n<=10;n+=1){
      const m=avecHasard(11,()=>createRaidMission('heartforge',n));
      const ecart=Math.abs(taux(m,noyau)-50);
      if(ecart<meilleur){meilleur=ecart;bascule=n;}
    }
    const mission=avecHasard(11,()=>createRaidMission('heartforge',bascule));
    const temoin=taux(mission,noyau);
    console.log(`\nRencontre de bascule : raid ${bascule}. Noyau seul (${NOMS_NOYAU.join(', ')}) : ${temoin}/100`);
    const lignes=j.heroes.filter(h=>!noyau.includes(h.id)).map(h=>({h,
      pw:championPower(j.getStats(h)),v:taux(mission,[...noyau,h.id])}));
    lignes.sort((a,b)=>b.v-a.v);
    const tri=[...lignes].map(l=>l.v).sort((a,b)=>a-b);
    const median=tri[Math.floor(tri.length/2)];
    console.log(`Mediane du roster : ${median}/100.`);
    console.log('champion        rar elem     | puissance | victoires | vs noyau seul');
    lignes.forEach(l=>{
      const d=l.v-temoin;
      const marque=l.v<median-20?'  TRES FAIBLE':l.v<median-10?'  faible':l.v>median+12?'  FORT':'';
      console.log(`${l.h.name.padEnd(15)} ${l.h.rarity}* ${l.h.element.padEnd(8)} | ${String(l.pw).padStart(9)} | ${String(l.v).padStart(9)} | ${(d>0?'+':'')+d}${marque}`);
    });
  });
},{timeout:1800000});
