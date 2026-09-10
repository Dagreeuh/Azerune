import React,{useCallback,useEffect,useRef,useState}from'react';
import{useGame}from'../store/GameContext';
import{createBattle,nextTurn,enemyAction,performAutoAction}from'../battle/engine';
import ArenePixi from'../components/ArenePixi';

// Prototype d'arène : le VRAI moteur de combat, rendu par PixiJS.
//
// Rien n'est simulé ici. Les tours viennent de `nextTurn`, les actions de
// `performAutoAction` et `enemyAction`, les dégâts sont lus en comparant les
// points de vie avant et après. C'est la seule façon honnête de juger si le
// rendu tient : s'il devait mentir sur les chiffres, autant ne pas le montrer.

const ELEMENTS=['feu','eau','nature','lumiere','ombre','arcane'];
// La teinte SUIT l'élément, elle ne l'invente pas. Les ennemis de la campagne
// sortent tous en arcane, et c'est exact : `enemies.js` et `campaign.js` ne
// déclarent aucun élément, or `normalizeElement` rabat l'inconnu sur Arcane.
// Il serait facile de tirer une couleur au hasard du nom pour « faire joli » ;
// ce serait mentir au joueur, à qui la couleur annonce une affinité.
export const feuilleDe=(unite,genre)=>{
  const e=String(unite?.element||'').toLowerCase().replace('è','e').replace('é','e');
  return `${genre}-${ELEMENTS.includes(e)?e:'arcane'}`;
};

export default function ArenePrototypePage(){
  const{HEROES,team,stats,getProgress,autoSkillPriorities}=useGame();
  const arene=useRef(null);
  const combat=useRef(null);
  const [etat,setEtat]=useState('chargement');
  const [ips,setIps]=useState(0);
  const [journal,setJournal]=useState([]);

  const demarrer=useCallback(async()=>{
    if(!arene.current)return;
    // Sur cet écran d'essai, un champion qui possède une vraie feuille dessinée
    // passe devant : c'est précisément ce qu'on vient regarder.
    const dessines=(HEROES||[]).filter(h=>arene.current.feuillePour(h.id)).map(h=>h.id);
    const equipe=[...new Set([...dessines,...(team||[])])].slice(0,3);
    if(!equipe.length){setEtat('sans-equipe');return}
    const heros=HEROES.map(hero=>({...hero,currentStars:getProgress(hero).stars,
      currentLevel:getProgress(hero).level}));
    const bataille=createBattle(equipe,heros,stats,{});
    combat.current=bataille;
    await arene.current.placer([
      ...bataille.allies.map(u=>({id:u.id,cote:'allie',nom:u.name,
        feuille:arene.current.feuillePour(u.id)||feuilleDe(u,'heros')})),
      ...bataille.enemies.map(u=>({id:u.id,cote:'ennemi',nom:u.name,feuille:feuilleDe(u,'monstre')})),
    ]);
    setJournal(['Le combat commence.']);
    setEtat('en-cours');
  },[HEROES,team,stats,getProgress]);

  const pret=useCallback(a=>{arene.current=a;demarrer();},[demarrer]);

  // Une action de combat, traduite en mouvement. Le diff des points de vie
  // évite de dépendre de la forme exacte de `lastEvents`, qui décrit le combat
  // pour le journal et pas pour le rendu.
  const pas=useCallback(async()=>{
    const a=arene.current;
    let b=combat.current;
    if(!a||!b||b.winner)return;
    const avant=new Map([...b.allies,...b.enemies].map(u=>[u.id,{hp:u.hp,dead:u.dead}]));
    b=nextTurn(b);
    const acteur=[...b.allies,...b.enemies].find(u=>u.id===b.turn);
    if(!acteur){combat.current=b;return}
    const resultat=acteur.side==='ally'?performAutoAction(b,autoSkillPriorities||{}):enemyAction(b);
    b=resultat?.battle||resultat||b;
    combat.current=b;

    const apres=[...b.allies,...b.enemies];
    const frappe=apres.find(u=>{const v=avant.get(u.id);return v&&u.hp<v.hp&&u.id!==acteur.id});
    await a.frapper(acteur.id,frappe?.id);
    apres.forEach(u=>{
      const v=avant.get(u.id);
      if(!v)return;
      a.pv(u.id,u.maxHp?u.hp/u.maxHp:0);
      if(u.hp<v.hp){a.toucher(u.id);a.chiffre(u.id,`-${v.hp-u.hp}`,{couleur:0xff6b52});}
      else if(u.hp>v.hp)a.chiffre(u.id,`+${u.hp-v.hp}`,{couleur:0x8ce06a});
      if(u.dead&&!v.dead)a.mourir(u.id);
    });
    setJournal(j=>[String(b.log?.[0]||''),...j].slice(0,6));
    if(b.winner)setEtat(b.winner==='ally'?'victoire':'defaite');
  },[autoSkillPriorities]);

  // Boucle : une action toutes les 700 ms tant que le combat dure.
  useEffect(()=>{
    if(etat!=='en-cours')return undefined;
    let vivant=true;
    const tour=async()=>{if(!vivant)return;await pas();if(vivant)minuteur=window.setTimeout(tour,700)};
    let minuteur=window.setTimeout(tour,700);
    return()=>{vivant=false;window.clearTimeout(minuteur)};
  },[etat,pas]);

  // Compteur d'images par seconde : la question posée était « est-ce que ça
  // tiendra sur téléphone ». Autant l'afficher plutôt que l'affirmer.
  useEffect(()=>{
    const t=window.setInterval(()=>{if(arene.current)setIps(arene.current.ips())},500);
    return()=>window.clearInterval(t);
  },[]);

  return <section className="page arene-prototype">
    <h2>Arène — prototype pixel art</h2>
    <p className="arene-avertissement">
      Écran d'essai. Le moteur de combat est le vrai ; les sprites sont générés
      et provisoires. On regarde ici la fluidité et la lisibilité, rien d'autre.
    </p>
    <ArenePixi largeur={960} hauteur={420} onPret={pret}
      onPerdu={()=>setEtat('sans-webgl')}/>
    <p className="arene-mesure">Images par seconde : <strong>{ips||'—'}</strong></p>
    {etat==='sans-webgl'&&<p className="arene-erreur">WebGL indisponible sur cet appareil : l'arène ne peut pas s'afficher.</p>}
    {etat==='sans-equipe'&&<p className="arene-erreur">Compose une équipe avant d'ouvrir l'arène.</p>}
    {etat==='victoire'&&<p className="arene-verdict">Victoire.</p>}
    {etat==='defaite'&&<p className="arene-verdict">Défaite.</p>}
    <ul className="arene-journal">{journal.filter(Boolean).map((ligne,i)=><li key={i}>{ligne}</li>)}</ul>
  </section>;
}
