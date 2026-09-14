/**
 * Combien d'altérations échappent au jet de résistance ?
 *
 * Aucune assertion — c'est une battue.
 *
 * `debuffChance` vaut : chance de base + maîtrise + Précision de l'attaquant
 * − Résistance de la cible, borné à [15 %, 95 %]. Toute écriture directe de
 * `target.debuffs.X = …` saute ce calcul : l'altération tombe à coup sûr, la
 * Résistance de la cible n'y peut rien, et la Précision de l'attaquant ne lui
 * sert à rien.
 *
 * On compte ici, sur de vrais combats, combien d'applications passent par le
 * jet et combien l'évitent.
 */
import{it}from'vitest';
import{CONTINENTS,DIFFICULTIES,createMission}from'../../src/data/campaign';
import{HEROES}from'../../src/data/heroes';
import{createBattle,nextTurn,enemyAction,performAutoAction,winner}from'../../src/battle/engine';
import{optionsDeCombat}from'../../src/utils/simulation';
import{seedRandom}from'../../tests/helpers';

const S={hp:2600,atk:120,def:150,spd:100,crit:10,critDamage:60,
  accuracy:40,resistance:20,setEffects:[],resonanceLevel:0};

/** Joue un combat et relève toutes les altérations apparues, camp par camp. */
function derouler(mission,heroes,team,stats){
  let b=createBattle(team,heroes,()=>({...stats}),optionsDeCombat(mission));
  const poses={allie:{},ennemi:{}};
  const photo=()=>Object.fromEntries([...b.allies,...b.enemies]
    .map(u=>[u.id,new Set(Object.keys(u.debuffs||{}))]));
  let avant=photo();
  for(let garde=0;garde<600&&!b.winner;garde+=1){
    if(!b.turn){b=nextTurn(b);continue}
    b=String(b.turn).startsWith('e')?enemyAction(b):(performAutoAction(b,{})?.battle||b);
    b={...b,winner:winner(b.allies,b.enemies)};
    const apres=photo();
    [...b.allies,...b.enemies].forEach(u=>{
      const vieux=avant[u.id]||new Set();
      (apres[u.id]||new Set()).forEach(cle=>{
        if(vieux.has(cle))return;
        const camp=u.side==='ally'?'allie':'ennemi';
        poses[camp][cle]=(poses[camp][cle]||0)+1;
      });
    });
    avant=apres;
  }
  return poses;
}

it('altérations posées au cours de vrais combats',()=>{
  const heroes=HEROES.map(h=>({...h,currentStars:5}));
  const team=[HEROES[0].id,HEROES[1].id,HEROES[2].id];
  const total={allie:{},ennemi:{}};
  // Quatre zones aux mécaniques différentes, toutes difficultés confondues.
  [0,4,7,9].forEach(zi=>{
    const continent=CONTINENTS[zi];
    DIFFICULTIES.forEach(diff=>{
      [2,4,6].forEach(si=>{
        const mission=createMission(diff,continent,continent.stages[si]);
        seedRandom(100+zi*10+si);
        const poses=derouler(mission,heroes,team,S);
        ['allie','ennemi'].forEach(camp=>
          Object.entries(poses[camp]).forEach(([k,n])=>{
            total[camp][k]=(total[camp][k]||0)+n;
          }));
      });
    });
  });
  const montre=(titre,m)=>{
    const lignes=Object.entries(m).sort((a,b)=>b[1]-a[1]);
    const somme=lignes.reduce((s,[,n])=>s+n,0);
    console.log(`\n  ${titre} — ${somme} applications`);
    lignes.forEach(([k,n])=>console.log(`    ${k.padEnd(16)} ${String(n).padStart(4)}`));
  };
  console.log('\n=== Altérations posées sur 36 combats ===');
  montre('SUR LES ALLIÉS (posées par les ennemis)',total.allie);
  montre('SUR LES ENNEMIS (posées par les champions)',total.ennemi);
});

it('la Résistance du joueur sert-elle enfin à quelque chose ?',()=>{
  // Avant : les mécaniques de zone tombaient à coup sûr. Un joueur qui montait
  // sa Résistance — et il existe des sets entiers pour ça — ne gagnait
  // strictement rien. On mesure maintenant le nombre d'altérations subies
  // selon l'investissement.
  const heroes=HEROES.map(h=>({...h,currentStars:5}));
  const team=[HEROES[0].id,HEROES[1].id,HEROES[2].id];
  console.log('\n=== Altérations subies selon la Résistance de l’équipe ===');
  console.log('  résistance   altérations subies   sur 12 combats');
  [0,15,30,45,60,75].forEach(resistance=>{
    let subies=0;
    [0,4,7,9].forEach(zi=>{
      const continent=CONTINENTS[zi];
      [2,4,6].forEach(si=>{
        const mission=createMission(DIFFICULTIES[0],continent,continent.stages[si]);
        seedRandom(100+zi*10+si);
        const poses=derouler(mission,heroes,team,{...S,resistance});
        subies+=Object.values(poses.allie).reduce((a,b)=>a+b,0);
      });
    });
    console.log(`  ${String(resistance).padStart(9)}   ${String(subies).padStart(18)}`);
  });
});
