/**
 * ATTENTION — meme reserve que audit-raid.test.js : l'equipe est composee des
 * quatre champions les plus puissants, ce qui surestime la difficulte. Ce banc
 * reste utile pour la LARGEUR de la bande, qui ne depend pas de la composition.
 */
import{describe,it}from'vitest';
import{joueur,avecHasard}from'./joueur.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission}from'../../src/data/raids.js';
import{createExpeditionMission}from'../../src/data/expeditions.js';
import{CONTINENTS,DIFFICULTIES,createMission}from'../../src/data/campaign.js';
import{teamPower,championPower}from'../../src/utils/stats.js';

/**
 * Largeur de la bande « intéressante ».
 *
 * Un contenu amusant a une zone où l'on gagne parfois : c'est là que le joueur
 * sent qu'il progresse. Si l'on passe de 0/20 à 20/20 en quelques pour cent de
 * puissance, il n'y a pas de courbe — il y a un mur, et de l'autre côté une
 * formalité. On mesure donc le taux de victoire en faisant varier FINEMENT la
 * puissance de l'équipe, à contenu fixé.
 */
const equipeBrute=j=>[...j.heroes].map(h=>({h,pw:championPower(j.getStats(h))}))
  .sort((a,b)=>b.pw-a.pw).slice(0,4).map(x=>x.h.id);

/** Multiplie toutes les statistiques de combat par k, sans toucher au reste. */
const echelle=(getStats,k)=>hero=>{const s=getStats(hero);
  return{...s,hp:Math.round(s.hp*k),atk:Math.round(s.atk*k),def:Math.round(s.def*k)};};

function bande(mission,j,equipe,label){
  const ligne=[];
  // Pas MULTIPLICATIF : une bande se lit en pourcentage de puissance, pas en
  // points. Et il faut descendre tres bas — une equipe de fin de jeu gagne le
  // raid 1 a la moitie de ses statistiques.
  for(let k=.04;k<=2.01;k*=1.10){
    const gs=echelle(j.getStats,k);
    const r=avecHasard(313,()=>simulerMission({mission,team:equipe,heroes:j.heroes,
      getStats:gs,tirages:20}));
    ligne.push({k:k.toFixed(3),pw:teamPower(equipe,j.heroes,gs),v:r.victoires});
  }
  const gagne=ligne.filter(x=>x.v>0),partiel=ligne.filter(x=>x.v>0&&x.v<20);
  const largeur=partiel.length?((Number(partiel[partiel.length-1].k)/Number(partiel[0].k)-1)*100).toFixed(0):'0';
  console.log(`\n${label}`);
  // On n'imprime que la zone utile : le dernier 0 et le premier 20 l'encadrent.
  const premier=Math.max(0,ligne.findIndex(x=>x.v>0)-1);
  const dernier=ligne.findIndex((x,i)=>i>=premier&&x.v===20);
  console.log('  '+ligne.slice(premier,(dernier<0?ligne.length:dernier+1))
    .map(x=>`${x.k}:${String(x.v).padStart(2)}`).join(' '));
  console.log(`  → bande incertaine : ${largeur} % de puissance`+
    (gagne.length?` (première victoire à ×${gagne[0].k})`:' (jamais gagné)'));
  return Number(largeur);
}

describe('largeur de la bande de difficulté',()=>{
  it('raid, expédition et campagne',()=>{
    const j=joueur({zone:10,difficulte:'hardcore',niveau:60,etoiles:6,niveauObjet:12,
      competences:'max',resonance:5,empreintes:true});
    const equipe=equipeBrute(j);
    console.log('Échelle ×k appliquée à PV/ATQ/DEF. 20 tirages par point.');
    [1,5,8,10].forEach(n=>bande(avecHasard(11,()=>createRaidMission('heartforge',n)),j,equipe,
      `RAID niveau ${n}`));
    [1,5,10].forEach(n=>bande(avecHasard(12,()=>createExpeditionMission('treasury',n)),j,equipe,
      `EXPÉDITION Trésorerie niveau ${n}`));
    [[0,'1'],[4,'5'],[9,'10']].forEach(([zi,z])=>{
      const continent=CONTINENTS[zi],etape=continent.stages[6];
      const mission=avecHasard(13,()=>createMission(DIFFICULTIES[0],continent,etape));
      bande(mission,j,equipe,`CAMPAGNE normale zone ${z} boss`);
    });
  });
},{timeout:900000});
