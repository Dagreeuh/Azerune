import{describe,it}from'vitest';
import{joueur,avecHasard,equipePour}from'./joueur.js';
import{ECHELLE}from'./echelle.js';
import{simulerMission}from'../../src/utils/simulation.js';
import{createRaidMission,RAID_POWER}from'../../src/data/raids.js';
import{createExpeditionMission,EXPEDITIONS,EXPEDITION_POWER}from'../../src/data/expeditions.js';
import{CONTINENTS,DIFFICULTIES,createMission}from'../../src/data/campaign.js';
import{teamPower,calibratedEncounterPower}from'../../src/utils/stats.js';

/**
 * Ce que le jeu ANNONCE contre ce qu'il DEMANDE.
 *
 * Mesuré : sur 840 couples (palier × mission), 20 % de contradictions franches,
 * toutes dans le même sens — « insuffisant » annoncé à un joueur qui gagne 12
 * fois sur 12. La recommandation de campagne n'est pas relevée, c'est une
 * formule sur les statistiques ennemies (× 1,52 pour un boss) ; elle n'a pas
 * suivi l'allègement de la Défense ni le socle de rareté.
 */
const J=ECHELLE.map(p=>({...p,j:joueur(p)}));
function requis(mission,tirages=16){
  for(const p of J){
    const eq=equipePour(mission,p.j);
    const r=avecHasard(313,()=>simulerMission({mission,team:eq,heroes:p.j.heroes,
      getStats:p.j.getStats,tirages}));
    if(r.victoires*2>=tirages)return teamPower(eq,p.j.heroes,p.j.getStats);
  }
  return null;
}
// Le chiffre AFFICHE et le chiffre qui pilote le VERDICT ne sont pas toujours
// le meme : `assessTeamForMission` passe par `calibratedEncounterPower`, qui ne
// retient `mission.recommended` que si la mission porte un `difficultyId` —
// c'est-a-dire la campagne, et elle seule.
const ligne=(nom,annonce,reel,verdict)=>{
  const e=reel?Math.round((annonce/reel-1)*100):null;
  const v=reel&&verdict?Math.round((verdict/reel-1)*100):null;
  const m=e===null?' —':Math.abs(e)<=20?'':Math.abs(e)<=50?' ⚠':' ⛔';
  const mv=v===null?'':Math.abs(v)<=20?'':Math.abs(v)<=50?' ⚠':' ⛔';
  console.log(`${nom.padEnd(26)} | ${String(annonce).padStart(7)} | ${String(reel??'jamais').padStart(7)} | ${((e===null?'—':(e>0?'+':'')+e+' %')).padStart(7)}${m.padEnd(3)}| verdict ${String(verdict??'—').padStart(7)} ${((v===null?'—':(v>0?'+':'')+v+' %')).padStart(7)}${mv}`);
  return v===null?e:v;
};

describe('annoncé contre demandé',()=>{
  it('campagne, raid, expéditions',()=>{
    const ecarts={campagne:[],raid:[],expedition:[]};
    console.log('\n=== CAMPAGNE (boss de zone)');
    console.log('CONTENU                    | annoncé | requis  | écart  | chiffre du verdict');
    DIFFICULTIES.forEach(d=>[1,3,5,7,9,10].forEach(z=>{
      const c=CONTINENTS[z-1];
      const m=avecHasard(13,()=>createMission(d,c,c.stages[6]));
      const e=(r=>ligne(`${d.name} · zone ${z}`,m.recommended,r,calibratedEncounterPower(m)))(requis(m));
      if(e!==null)ecarts.campagne.push(e);
    }));
    console.log('\n=== CAMPAGNE (étape ordinaire, zone 5)');
    DIFFICULTIES.forEach(d=>[1,4].forEach(st=>{
      const c=CONTINENTS[4];
      const m=avecHasard(13,()=>createMission(d,c,c.stages[st]));
      const e=(r=>ligne(`${d.name} · z5 étape ${st+1}`,m.recommended,r,calibratedEncounterPower(m)))(requis(m));
      if(e!==null)ecarts.campagne.push(e);
    }));
    console.log('\n=== RAID');
    for(let n=1;n<=10;n+=1){
      const mr=avecHasard(11,()=>createRaidMission('heartforge',n));
      const e=ligne(`niveau ${n}`,RAID_POWER[n-1],requis(mr),calibratedEncounterPower(mr));
      if(e!==null)ecarts.raid.push(e);
    }
    console.log('\n=== EXPÉDITIONS (médiane des quatre)');
    for(let n=1;n<=10;n+=1){
      const v=EXPEDITIONS.map(x=>requis(avecHasard(12,()=>createExpeditionMission(x.id,n)))).filter(Boolean).sort((a,b)=>a-b);
      const me=avecHasard(12,()=>createExpeditionMission('treasury',n));
      const e=ligne(`niveau ${n}`,EXPEDITION_POWER[n-1],v.length?v[Math.floor(v.length/2)]:null,calibratedEncounterPower(me));
      if(e!==null)ecarts.expedition.push(e);
    }
    console.log('\n=== SYNTHÈSE');
    Object.entries(ecarts).forEach(([k,v])=>{
      if(!v.length)return;const t=[...v].sort((a,b)=>a-b);
      console.log(`${k.padEnd(12)} médian ${t[Math.floor(t.length/2)]} % · min ${t[0]} % · max ${t[t.length-1]} %`);
    });
  });
},{timeout:1800000});
