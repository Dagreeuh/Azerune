/**
 * Harnais de mesure de l'audit d'experience joueur (Audit/RAPPORT-EXPERIENCE-JOUEUR.md).
 *
 * Ce fichier ne contient AUCUNE assertion : ce sont des mesures, pas des tests.
 * Il vit hors de `tests/` pour ne pas alourdir la suite, et se lance avec :
 *
 *     npm run mesures
 *
 * Chaque bloc affiche les chiffres cites dans le rapport, pour qu'ils restent
 * reproductibles et refutables.
 */
import{it}from'vitest';
import{HEROES}from'../../src/data/heroes';
import{CONTINENTS,DIFFICULTIES,createMission}from'../../src/data/campaign';
import{createBattle,castSkill,enemyAction,nextTurn,winner,performAutoAction}from'../../src/battle/engine';
import{totalStats,teamPower,assessTeamForMission}from'../../src/utils/stats';
import{defaultChampionProgress}from'../../src/utils/progression';
import{mulberry32}from'../../tests/helpers';

let EQUIPE=[1,19,3],ETOILES=0,FACTEUR=1;
const stats=hero=>{
  const e=ETOILES?Math.max(hero.rarity,ETOILES):hero.rarity;
  const b=totalStats(hero,{},{...defaultChampionProgress(hero),level:e*10,stars:e},[]);
  return{...b,hp:Math.round(b.hp*FACTEUR),atk:Math.round(b.atk*FACTEUR),def:Math.round(b.def*FACTEUR)};
};

/** Joue un combat entier avec la strategie donnee. Retourne le verdict et le cout. */
function jouer(mission,strategie,graine){
  let actions=0;const vrai=Math.random;Math.random=mulberry32(graine);
  try{
    const heroes=HEROES.map(h=>({...h,currentStars:h.rarity,skillLevels:{0:1,1:1,2:1}}));
    let b=createBattle(EQUIPE,heroes,stats,{enemies:mission.enemies,enemyScale:mission.scale||1});
    for(let garde=0;garde<400&&!b.winner;garde+=1){
      if(!b.turn){b=nextTurn(b);continue}
      if(String(b.turn).startsWith('e')){actions+=1;b=enemyAction(b);continue}
      const acteur=b.allies.find(u=>u.id===b.turn);
      if(!acteur){b=nextTurn({...b,turn:null});continue}
      actions+=1;const sortie=strategie(b,acteur);
      b=sortie&&sortie.battle?sortie.battle:sortie||b;
      b={...b,winner:winner(b.allies,b.enemies)};
    }
    return{gagne:b.winner==='ally',actions};
  }finally{Math.random=vrai}
}

const AUTO=b=>performAutoAction(b,{});
const SPAM=b=>castSkill(b,0,b.enemies.find(u=>!u.dead)?.id);
const dispo=(b,a)=>a.skills.map((s,i)=>i).filter(i=>(a.cooldowns?.[i]||0)<=0&&(i<2||a.currentStars>=4||a.rarity>=4));
const HASARD=(b,a)=>{
  const l=dispo(b,a),i=l[Math.floor(Math.random()*l.length)]??0,s=a.skills[i];
  const pool=['ally','allAllies'].includes(s.target)?b.allies.filter(u=>!u.dead):b.enemies.filter(u=>!u.dead);
  return castSkill(b,i,pool[Math.floor(Math.random()*pool.length)]?.id);
};
/** Oracle glouton : essaie toutes les combinaisons, garde le plus gros gain immediat. */
const ORACLE=(b,a)=>{
  const pv=x=>x.enemies.reduce((s,u)=>s+Math.max(0,u.hp),0),avant=pv(b);
  let best=null,gain=-1;
  for(const i of dispo(b,a)){const s=a.skills[i];
    const pool=['ally','allAllies'].includes(s.target)?b.allies.filter(u=>!u.dead):b.enemies.filter(u=>!u.dead);
    for(const c of pool){const r=castSkill(b,i,c.id);if(r.error)continue;
      const g=avant-pv(r.battle);if(g>gain){gain=g;best=r}}}
  return best||SPAM(b,a);
};

/** Facteur de puissance auquel l'equipe franchit 50 % de victoires. */
const seuil=(missions,graines,plafond=3.2)=>{
  const taux=()=>{let v=0,n=0;missions.forEach((m,i)=>graines.forEach(g=>{n+=1;if(jouer(m,AUTO,g+i).gagne)v+=1}));return v/n};
  let bas=.4,haut=plafond;FACTEUR=haut;
  if(taux()<.5)return null;
  for(let k=0;k<7;k+=1){const mi=(bas+haut)/2;FACTEUR=Number(mi.toFixed(3));if(taux()>=.5)haut=mi;else bas=mi}
  return haut;
};

it('1. largeur de la bande de transition',()=>{
  ETOILES=5;
  const cibles=[['Normal Z5-7',0,4,6,.90,1.05],['Normal Z8-4',0,7,3,.85,1.00],
    ['Difficile Z3-7',1,2,6,1.05,1.20],['Difficile Z6-4',1,5,3,1.15,1.30]];
  const G=Array.from({length:40},(u,i)=>1+i*7),larg=[];
  console.log('\n=== 1. BANDE DE TRANSITION (grille 1 %, 40 graines par point) ===');
  cibles.forEach(([nom,d,z,st,a,b])=>{
    const m=createMission(DIFFICULTIES[d],CONTINENTS[z],CONTINENTS[z].stages[st]),pts=[];
    for(let f=a;f<=b+1e-9;f+=.01){FACTEUR=Number(f.toFixed(2));
      let v=0;G.forEach(g=>{if(jouer(m,AUTO,g).gagne)v+=1});pts.push([FACTEUR,v/G.length])}
    const bas=pts.find(x=>x[1]>=.1),haut=pts.find(x=>x[1]>=.9);
    if(bas&&haut)larg.push(haut[0]-bas[0]);
    console.log(nom.padEnd(16)+pts.map(x=>`${x[0].toFixed(2)}:${(100*x[1]).toFixed(0).padStart(3)}`).join(' '));
  });
  FACTEUR=1;ETOILES=0;
  console.log('LARGEUR MOYENNE 10→90 % :',(100*larg.reduce((a,b)=>a+b,0)/larg.length).toFixed(1),'% de puissance');
},1800000);

it('2. valeur des decisions du joueur',()=>{
  ETOILES=5;
  const missions=[];
  DIFFICULTIES.forEach(d=>[3,5,7,9].forEach(z=>[3,6].forEach(st=>
    missions.push({nom:`${d.name} Z${z+1}-${st+1}`,m:createMission(d,CONTINENTS[z],CONTINENTS[z].stages[st])}))));
  const G=[11,29,37,53,71,97],strategies={AUTO,ORACLE,HASARD,'SPAM sort 1':SPAM},detail={};
  console.log('\n=== 2. VALEUR DES DECISIONS ('+missions.length+' missions x '+G.length+' graines) ===');
  const global={};Object.keys(strategies).forEach(n=>{global[n]={v:0,n:0}});
  missions.forEach(({nom,m})=>{detail[nom]={};
    for(const[n,f]of Object.entries(strategies)){let v=0;
      G.forEach(g=>{global[n].n+=1;if(jouer(m,f,g).gagne){v+=1;global[n].v+=1}});
      detail[nom][n]=v/G.length}});
  Object.entries(global).sort((a,b)=>b[1].v/b[1].n-a[1].v/a[1].n)
    .forEach(([n,r])=>console.log(`${n.padEnd(12)} ${(100*r.v/r.n).toFixed(1)} % (${r.v}/${r.n})`));
  const tranchees=Object.values(detail).filter(r=>{const v=Object.values(r);return Math.max(...v)-Math.min(...v)>0}).length;
  console.log(`missions ou la strategie change le resultat : ${tranchees}/${missions.length}`);
  ETOILES=0;
},1800000);

it('3. cout reel d’une session',()=>{
  ETOILES=5;FACTEUR=1.35;
  const G=[3,11,19,29,37,53,71,97],mesure=[];
  [[0,2,3],[0,4,6],[0,6,3],[1,2,6],[1,4,3]].forEach(([d,z,st])=>{
    const m=createMission(DIFFICULTIES[d],CONTINENTS[z],CONTINENTS[z].stages[st]);
    G.forEach(g=>{const r=jouer(m,AUTO,g);if(r.gagne)mesure.push(r.actions)})});
  mesure.sort((a,b)=>a-b);
  const med=mesure[Math.floor(mesure.length/2)],DELAI=.56;
  console.log('\n=== 3. COUT D’UNE SESSION ===');
  console.log('actions par combat : min',mesure[0],'| mediane',med,'| max',mesure[mesure.length-1]);
  console.log('duree AUTO (560 ms/action) : mediane',(med*DELAI).toFixed(0),'s');
  console.log('boucle quotidienne 16 combats →',(16*med*DELAI/60).toFixed(1),'minutes de combat AUTO');
  FACTEUR=1;ETOILES=0;
},1800000);

it('4. seuil de puissance par champion',()=>{
  const G=Array.from({length:10},(u,i)=>3+i*17);
  const missions=[[0,4,6],[0,6,3],[1,3,6]].map(([d,z,st])=>
    createMission(DIFFICULTIES[d],CONTINENTS[z],CONTINENTS[z].stages[st]));
  const PARTENAIRES=[1,19],res=[];
  HEROES.forEach(h=>{if(PARTENAIRES.includes(h.id))return;
    EQUIPE=[h.id,...PARTENAIRES];res.push({nom:h.name,rarete:h.rarity,seuil:seuil(missions,G)})});
  EQUIPE=[1,19,3];FACTEUR=1;
  res.sort((a,b)=>(a.seuil??9)-(b.seuil??9));
  console.log('\n=== 4. SEUIL DE PUISSANCE PAR CHAMPION (bas = porte l’equipe) ===');
  res.forEach((r,i)=>console.log(`${String(i+1).padStart(2)}. ${r.nom.padEnd(14)} ${r.rarete}★  ${r.seuil?'x'+r.seuil.toFixed(2):'jamais (>x3.2)'}`));
  const ok=res.filter(r=>r.seuil);
  console.log(`ecart meilleur→pire : ${((ok[ok.length-1].seuil/ok[0].seuil-1)*100).toFixed(0)} % de puissance`);
},2400000);

it('5. honnetete de la puissance recommandee',()=>{
  const G=Array.from({length:20},(u,i)=>5+i*11),ratios=[];
  console.log('\n=== 5. PUISSANCE RECOMMANDEE vs SEUIL REEL ===');
  [[0,2,3],[0,4,6],[0,6,3],[0,8,6],[1,1,3],[1,3,6],[1,5,3],[2,0,6],[2,2,3]].forEach(([d,z,st])=>{
    const m=createMission(DIFFICULTIES[d],CONTINENTS[z],CONTINENTS[z].stages[st]);
    const s=seuil([m],G,4);
    const nom=`${DIFFICULTIES[d].name} Z${z+1}-${st+1}`;
    if(!s){console.log(nom.padEnd(18)+'hors de portee');return}
    FACTEUR=s;
    const p=teamPower(EQUIPE,HEROES,stats),a=assessTeamForMission(EQUIPE,HEROES,stats,m);
    ratios.push(p/m.recommended);
    console.log(`${nom.padEnd(18)} recommandee ${String(m.recommended).padStart(6)} · seuil reel ${String(Math.round(p)).padStart(6)} · ratio ${(p/m.recommended).toFixed(2)} · verdict affiche ${a.verdict.icon} ${a.verdict.label} (${a.score})`);
  });
  FACTEUR=1;
  const moy=ratios.reduce((a,b)=>a+b,0)/ratios.length;
  console.log(`ratio moyen ${moy.toFixed(2)} · de ${Math.min(...ratios).toFixed(2)} a ${Math.max(...ratios).toFixed(2)} (un indicateur honnete vaudrait 1.00)`);
},1800000);
