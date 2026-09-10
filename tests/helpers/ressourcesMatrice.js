// Matrice de reference pour l'affichage des ressources de champion.
//
// Partagee entre le test de non-regression et le script qui a genere le
// fixture : ils DOIVENT rendre exactement la meme chose, sinon la comparaison
// ne prouve rien. Elle a d'abord echoue pour cette raison precise — le script
// et le test ne donnaient pas les memes buffs aux allies.
import React from'react';
import{renderToStaticMarkup}from'react-dom/server';
import{Unit}from'../../src/pages/BattlePage';
import{HEROES}from'../../src/data/heroes';

export const ETATS=[
  ['vide',{}],['zero',{value:0}],['un',{value:1}],['deux',{value:2}],
  ['trois',{value:3,danceSteps:[1,2,3]}],['quatre',{value:4,danceSteps:[1,2]}],
  ['cinq',{value:5,max:5}],['six',{value:6}],['soixante',{value:60}],
  ['actif-cible',{active:true,value:2,targetId:true}],
  ['actif-sans-cible',{active:true,value:2}],
  ['actif-depense',{active:true,value:1,targetId:true,anchorSpent:true}],
  ['inactif-depense',{active:false,anchorSpent:true,targetId:true}],
  ['maree-haute',{active:true,mode:'high'}],['maree-basse',{mode:'low'}],
  ['goule',{ghoulTurns:2,ghoulDamage:44,value:1}],['max-declare',{value:2,max:9}],
];
/** [nom, ennemis charges de malus, allies porteurs de liens] */
export const TERRAINS=[['riche',true,true],['vierge',false,false],['sans-ennemi',null,true]];

const ALLIE=(hero,mechanic)=>({...hero,side:'ally',hp:100,maxHp:100,shield:0,maxShield:0,atb:50,
  currentSpd:100,buffs:{},debuffs:{},cooldowns:[0,0,0],mechanic,dead:false,atk:100});
const AUTRES=[
  {id:901,name:'Allié A',icon:'a',side:'ally',hp:50,maxHp:100,dead:false,debuffs:{},
   buffs:{atonement:{turns:2},guardianLink:{turns:3}}},
  {id:902,name:'Allié B',icon:'b',side:'ally',hp:80,maxHp:100,dead:false,debuffs:{},
   buffs:{atonement:{turns:2},guardianLink:{turns:3}}}];
const ENNEMIS=[
  {id:'e1',name:'Cible A',icon:'x',side:'enemy',hp:100,maxHp:100,dead:false,element:'Feu',shield:0,
   debuffs:{hunt:{turns:3},poison:{stacks:2},burn:{},bleed:{},agony:{stacks:3},corruption:{},
     virulence:{stacks:4},frost:{stacks:4},exposed:{}}},
  {id:'e2',name:'Cible B',icon:'y',side:'enemy',hp:60,maxHp:100,dead:false,element:'Eau',shield:0,debuffs:{}}];

/** Rend la carte d'un champion dans un etat donne, et renvoie sa pastille. */
export function pastille(hero,mecanique,charge,liens){
  const marquer=entrees=>Object.fromEntries(Object.entries(entrees).map(([cle,v])=>[cle,{...v,source:hero.id}]));
  const allies=liens?AUTRES.map(a=>({...a,buffs:marquer(a.buffs)})):AUTRES.map(a=>({...a,buffs:{}}));
  const enemies=charge===null?[]:charge
    ?ENNEMIS.map(e=>({...e,debuffs:marquer(e.debuffs)}))
    :ENNEMIS.map(e=>({...e,debuffs:{},shield:0,maxShield:0}));
  const cible=mecanique.targetId?([1,23,30].includes(hero.id)?902:'e1'):undefined;
  const unit=ALLIE(hero,{...mecanique,targetId:cible});
  const html=renderToStaticMarkup(React.createElement(Unit,{unit,active:false,selected:false,
    automatic:false,onClick:()=>{},events:[],enemies,allies:[unit,...allies],vfxEnabled:true}));
  const m=html.match(/<div class="champion-resource[\s\S]*?<\/div>/);
  return m?m[0]:null;
}

/** Toutes les combinaisons, sous la forme {cle: pastille}. */
export function toutesLesPastilles(){
  const sortie={};
  HEROES.forEach(hero=>ETATS.forEach(([nom,mecanique])=>TERRAINS.forEach(([terrain,charge,liens])=>{
    sortie[`${hero.id}|${hero.name}|${nom}|${terrain}`]=pastille(hero,mecanique,charge,liens);
  })));
  return sortie;
}
