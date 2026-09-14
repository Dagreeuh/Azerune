import{describe,it}from'vitest';
import{HEROES}from'../../src/data/heroes.js';
import{createBattle,nextTurn,enemyAction,winner,performAutoAction}from'../../src/battle/engine.js';
import{avecHasard}from'./joueur.js';
import{makeEnemy}from'../../tests/helpers.js';
import{skillMaxLevel}from'../../src/utils/skills.js';

/**
 * Le kit, statistiques égalisées.
 *
 * Comparer deux champions tels qu'ils sortent du jeu mélange deux questions :
 * « son kit est-il bon ? » et « sa ligne de statistiques est-elle bonne ? ».
 * Ici on donne à TOUS la même ligne de statistiques : ce qui reste de l'écart
 * vient du kit seul. C'est la mesure qui dit si un champion est mal conçu,
 * par opposition à simplement moins bien noté.
 */
const S={hp:9000,atk:600,def:200,spd:100,crit:15,critDamage:50,
  accuracy:40,resistance:20,setEffects:[],resonanceLevel:0};
const ROSTER=HEROES.map(h=>({...h,currentStars:6,
  skillLevels:{0:skillMaxLevel(0),1:skillMaxLevel(1),2:skillMaxLevel(2)}}));

/**
 * Trois cibles de PV RÉALISTES.
 *
 * Des mannequins à quatre millions de PV paraissaient commodes — rien ne meurt,
 * la mesure ne s'interrompt pas. Mais plusieurs kits infligent des dégâts
 * PROPORTIONNELS AUX PV MAX de la cible : Morghast affichait 300 000 dégâts par
 * action, soit deux mille fois la médiane. Ce n'était pas un kit surpuissant,
 * c'était un mannequin absurde. On prend donc des PV d'ordre raid, et on les
 * remet à plein entre deux actions mesurées.
 */
const PV_CIBLE=12000;
const cibles=()=>[
  makeEnemy({id:'e1',name:'E1',hp:PV_CIBLE,atk:40,def:200,spd:60,element:'Arcane',resistance:20}),
  makeEnemy({id:'e2',name:'E2',hp:PV_CIBLE,atk:40,def:200,spd:60,element:'Nature',resistance:20}),
  makeEnemy({id:'e3',name:'E3',hp:PV_CIBLE,atk:40,def:200,spd:60,element:'Feu',resistance:20})];

/**
 * Remet la scène en place sans toucher aux altérations ni aux ressources : les
 * cibles retrouvent leurs PV, les alliés reviennent à 40 % — un soin n'a rien à
 * rendre à une équipe en pleine forme, et sans cela tous les soigneurs
 * mesuraient zéro.
 */
const PART_ALLIES=.40;
const remettre=b=>({...b,
  enemies:b.enemies.map(u=>({...u,hp:u.maxHp||PV_CIBLE,dead:false})),
  allies:b.allies.map(u=>({...u,hp:Math.round((u.maxHp||1)*PART_ALLIES),dead:false}))});

/** Compagnons neutres, identiques pour tous : ils ne doivent rien apporter. */
const COMPARSES=[ROSTER[0].id,ROSTER[1].id];

/**
 * Contribution réelle d'un champion, relevée action par action.
 *
 * Une première version faisait la différence des PV ennemis entre le début et
 * la fin du combat, puis divisait par le nombre d'actions du champion testé.
 * Elle lui attribuait donc les dégâts de ses deux comparses, et rendait des
 * valeurs de plusieurs centaines de milliers. On relève désormais l'état juste
 * AVANT et juste APRÈS chacune de ses actions : ce qui bouge entre les deux
 * est le sien, et rien d'autre.
 */
const pvEnnemis=b=>b.enemies.reduce((s,u)=>s+Math.max(0,u.hp),0);
const pvAllies=b=>b.allies.reduce((s,u)=>s+Math.max(0,u.hp),0);
const bouclierAllies=b=>b.allies.reduce((s,u)=>s+(u.shield||0),0);
const malusEnnemis=b=>b.enemies.reduce((s,u)=>s+Object.keys(u.debuffs||{}).length,0);
const buffsAllies=b=>b.allies.reduce((s,u)=>s+Object.keys(u.buffs||{}).length,0);

function banc(id,tours=40){
  const equipe=[id,...COMPARSES.filter(x=>x!==id).slice(0,2)];
  let b=remettre(createBattle(equipe,ROSTER,()=>({...S}),{enemies:cibles()}));
  let actions=0,rates=0,degats=0,soins=0,boucliers=0,malus=0,buffs=0;
  for(let garde=0;garde<tours*20&&actions<tours;garde+=1){
    if(b.winner)break;
    if(!b.turn){b=nextTurn(b);continue}
    if(String(b.turn).startsWith('e')){b=enemyAction(b);continue}
    const acteur=b.turn,teste=acteur===id;
    const avant=teste?{d:pvEnnemis(b),s:pvAllies(b),b:bouclierAllies(b),m:malusEnnemis(b),f:buffsAllies(b)}:null;
    const sortie=performAutoAction(b);
    const apres=sortie&&sortie.battle?sortie.battle:b;
    b={...apres,winner:winner(apres.allies,apres.enemies)};
    if(!teste)continue;
    actions+=1;
    if(sortie&&sortie.error){rates+=1;continue}
    degats+=Math.max(0,avant.d-pvEnnemis(b));
    soins+=Math.max(0,pvAllies(b)-avant.s);
    boucliers+=Math.max(0,bouclierAllies(b)-avant.b);
    malus+=Math.max(0,malusEnnemis(b)-avant.m);
    buffs+=Math.max(0,buffsAllies(b)-avant.f);
    b=remettre(b);
  }
  const par=v=>Math.round(v/Math.max(1,actions));
  return{degats:par(degats),soins:par(soins),boucliers:par(boucliers),
    malus,buffs,actions,rates};
}

describe('kits à statistiques égalisées',()=>{
  it('dégâts par action, soutien, contrôle',()=>{
    const lignes=ROSTER.map(h=>({h,...avecHasard(4242,()=>banc(h.id))}));
    const tri=[...lignes].sort((a,b)=>b.degats-a.degats);
    const median=tri[Math.floor(tri.length/2)].degats;
    console.log(`\nDégâts par action, statistiques identiques pour tous. Médiane : ${median}`);
    console.log('champion        rar élém     | dgt/action  | vs méd. | soins | bouc. | malus | buffs | ratés');
    tri.forEach(l=>{
      const ecart=Math.round((l.degats/median-1)*100);
      const marque=ecart<=-60?' ⛔':ecart<=-35?' ⚠':ecart>=120?' ⛔':ecart>=70?' ⚠':'';
      console.log(`${l.h.name.padEnd(15)} ${l.h.rarity}★ ${l.h.element.padEnd(8)} | ${String(l.degats).padStart(11)} | ${((ecart>0?'+':'')+ecart+'%').padStart(6)}${marque.padEnd(3)}| ${String(l.soins).padStart(5)} | ${String(l.boucliers).padStart(5)} | ${String(l.malus).padStart(5)} | ${String(l.buffs).padStart(5)} | ${l.rates}`);
    });
    const muets=tri.filter(l=>l.degats===0&&l.soins===0&&l.boucliers===0);
    if(muets.length)console.log(`\n⛔ Champions sans effet mesurable : ${muets.map(l=>l.h.name).join(', ')}`);
  });
},{timeout:900000});
