import{describe,it}from'vitest';
import{joueur,avecHasard}from'./joueur.js';
import{ECHELLE}from'./echelle.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission,RAID_POWER}from'../../src/data/raids.js';
import{createExpeditionMission,EXPEDITION_POWER,EXPEDITIONS}from'../../src/data/expeditions.js';
import{CONTINENTS,DIFFICULTIES,createMission}from'../../src/data/campaign.js';
import{teamPower,championPower}from'../../src/utils/stats.js';

/**
 * À quel moment de la partie chaque contenu devient-il jouable ?
 *
 * Pour chacun des quinze joueurs de l'échelle, on joue le combat 16 fois. Le
 * premier qui gagne au moins la moitié du temps donne le « palier requis ».
 * La puissance annoncée au joueur est comparée à la sienne : c'est l'écart
 * entre ce que le jeu promet et ce qu'il demande.
 */
const equipeBrute=j=>[...j.heroes].map(h=>({h,pw:championPower(j.getStats(h))}))
  .sort((a,b)=>b.pw-a.pw).slice(0,4).map(x=>x.h.id);

const JOUEURS=ECHELLE.map(p=>{const j=joueur(p);const equipe=equipeBrute(j);
  return{...p,j,equipe,puissance:teamPower(equipe,j.heroes,j.getStats)};});

/** Premier palier de l'échelle qui gagne au moins 8 fois sur 16. */
function palierRequis(mission,tirages=16){
  for(let i=0;i<JOUEURS.length;i+=1){
    const p=JOUEURS[i];
    const r=avecHasard(313,()=>simulerMission({mission,team:p.equipe,heroes:p.j.heroes,
      getStats:p.j.getStats,tirages}));
    if(r.victoires*2>=tirages)return{indice:i,...p,victoires:r.victoires,actions:r.actionsMoyennes};
  }
  return null;
}

const ligne=(nom,annonce,r)=>{
  if(!r){console.log(`${nom.padEnd(30)} | ${String(annonce).padStart(7)} | INFAISABLE même au plafond ⛔`);return null}
  const ecart=Math.round((annonce/r.puissance-1)*100);
  const marque=Math.abs(ecart)<=20?'':Math.abs(ecart)<=50?' ⚠':' ⛔';
  console.log(`${nom.padEnd(30)} | ${String(annonce).padStart(7)} | ${String(r.puissance).padStart(7)} | ${((ecart>0?'+':'')+ecart+' %').padStart(7)}${marque.padEnd(3)} | ${r.nom}`);
  return ecart;
};

describe('à quel palier chaque contenu devient jouable',()=>{
  it('échelle de progression',()=>{
    console.log('\nÉCHELLE DE PROGRESSION');
    JOUEURS.forEach((p,i)=>console.log(`${String(i).padStart(2)}. ${p.nom.padEnd(30)} puissance ${p.puissance}`));
    const entete=()=>console.log('CONTENU                        | annoncé | requis  | écart       | palier requis');
    const ecarts=[];

    console.log('\n=== RAID Fournaise du Cœur-Monde');entete();
    for(let n=1;n<=10;n+=1)ecarts.push(['raid',ligne(`niveau ${n}`,RAID_POWER[n-1],
      palierRequis(avecHasard(11,()=>createRaidMission('heartforge',n))))]);

    console.log('\n=== EXPÉDITIONS');entete();
    EXPEDITIONS.forEach(exp=>[1,3,5,7,10].forEach(n=>ecarts.push(['expedition',
      ligne(`${exp.name.slice(0,22)} · ${n}`,EXPEDITION_POWER[n-1],
        palierRequis(avecHasard(12,()=>createExpeditionMission(exp.id,n))))])));

    console.log('\n=== CAMPAGNE (boss de zone)');entete();
    DIFFICULTIES.forEach(d=>[1,3,5,7,9,10].forEach(z=>{
      const continent=CONTINENTS[z-1];
      const mission=avecHasard(13,()=>createMission(d,continent,continent.stages[6]));
      ecarts.push(['campagne',ligne(`${d.name} · zone ${z}`,mission.recommended,palierRequis(mission))]);
    }));

    console.log('\n=== SYNTHÈSE (écart entre puissance annoncée et puissance requise)');
    ['raid','expedition','campagne'].forEach(k=>{
      const v=ecarts.filter(([kk,e])=>kk===k&&e!==null).map(([,e])=>e).sort((a,b)=>a-b);
      if(!v.length)return;
      console.log(`${k.padEnd(12)} médian ${v[Math.floor(v.length/2)]} % · min ${v[0]} % · max ${v[v.length-1]} %`);
    });
  });
},{timeout:1800000});
