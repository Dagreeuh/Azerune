import React,{useCallback,useEffect,useRef,useState}from'react';
import{useGame}from'../store/GameContext';
import{createBattle,nextTurn,enemyAction,performAutoAction,castSkill}from'../battle/engine';
import ArenePixi from'../components/ArenePixi';

// Arène : le VRAI moteur de combat, rendu par PixiJS.
//
// Rien n'est simulé. Les tours viennent de `nextTurn`, les actions de
// `castSkill`, les dégâts sont lus en comparant les points de vie avant et
// après. Le rendu ne décide de rien — il ne fait qu'illustrer ce que le moteur
// a déjà tranché. C'est la seule façon honnête de montrer un combat : si
// l'image et les chiffres pouvaient diverger, l'image ne prouverait rien.

const ELEMENTS=['feu','eau','nature','lumiere','ombre','arcane'];
// La teinte SUIT l'élément, elle ne l'invente pas. Les ennemis de la campagne
// sortent tous en arcane, et c'est exact : `enemies.js` et `campaign.js` ne
// déclarent aucun élément, or `normalizeElement` rabat l'inconnu sur Arcane.
export const feuilleDe=(unite,genre)=>{
  const e=String(unite?.element||'').toLowerCase().replace('è','e').replace('é','e');
  return `${genre}-${ELEMENTS.includes(e)?e:'arcane'}`;
};

// Sur téléphone, 960 pixels logiques écrasés dans 380 pixels d'écran rendent
// les champions illisibles — or c'est exactement ce qu'on vient regarder. On
// réduit la scène plutôt que les personnages.
const tailleArene=()=>(typeof window!=='undefined'&&window.innerWidth<700)
  ?{largeur:520,hauteur:360}:{largeur:960,hauteur:420};

// Quelles cibles une compétence accepte-t-elle ? Le moteur tranche à l'arrivée
// (`castSkill` refuse ce qui ne va pas) ; ceci ne sert qu'à savoir s'il faut
// demander une cible au joueur, et laquelle proposer.
export const ciblageDe=skill=>{
  if(skill?.target==='enemy')return{demande:true,camp:'enemy'};
  if(skill?.target==='ally')return{demande:true,camp:'ally'};
  return{demande:false,camp:null};
};

const vivants=(bataille,camp)=>
  (camp==='enemy'?bataille.enemies:bataille.allies).filter(u=>!u.dead);

export default function ArenePrototypePage(){
  const{HEROES,team,stats,getProgress,autoSkillPriorities}=useGame();
  const [taille]=useState(tailleArene);
  const arene=useRef(null);
  const combat=useRef(null);
  const occupe=useRef(false);
  const [etat,setEtat]=useState('chargement');
  const [ips,setIps]=useState(0);
  const [journal,setJournal]=useState([]);
  const [vue,setVue]=useState(null);      // photo du combat pour l'affichage
  const [sortChoisi,setSortChoisi]=useState(null);
  const [auto,setAuto]=useState(false);
  const [message,setMessage]=useState('');
  const [liaisons,setLiaisons]=useState([]);

  const rafraichir=()=>setVue(photo(combat.current));

  const demarrer=useCallback(async()=>{
    if(!arene.current)return;
    // Un champion qui possède une vraie feuille dessinée passe devant : c'est
    // précisément ce qu'on vient regarder.
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
    avancer();
  },[HEROES,team,stats,getProgress]);

  const pret=useCallback(a=>{arene.current=a;demarrer();},[demarrer]);

  // Avance jusqu'à ce que quelqu'un ait la main. Si c'est un ennemi — ou si le
  // mode automatique est actif — l'action se joue seule ; sinon on rend la main
  // au joueur.
  const avancer=useCallback(async()=>{
    if(occupe.current)return;
    let b=combat.current;
    if(!b||b.winner)return;
    b=nextTurn(b);
    combat.current=b;
    const acteur=[...b.allies,...b.enemies].find(u=>u.id===b.turn);
    if(!acteur){rafraichir();return}
    if(acteur.side==='ally'&&!auto){setSortChoisi(null);rafraichir();return}
    await jouer(acteur.side==='ally'
      ?bat=>performAutoAction(bat,autoSkillPriorities||{})
      :bat=>enemyAction(bat));
  },[auto,autoSkillPriorities]);

  // Une action, du moteur jusqu'à l'écran. L'ordre compte : le moteur tranche,
  // PUIS on illustre. Jamais l'inverse.
  const jouer=useCallback(async(action,spec,cibleVoulue)=>{
    const a=arene.current;
    let b=combat.current;
    if(!a||!b||b.winner||occupe.current)return;
    occupe.current=true;
    try{
      const acteur=[...b.allies,...b.enemies].find(u=>u.id===b.turn);
      const avant=new Map([...b.allies,...b.enemies].map(u=>[u.id,{hp:u.hp,dead:u.dead}]));
      const resultat=action(b);
      if(resultat?.error){setMessage(resultat.error);return}
      setMessage('');
      b=resultat?.battle||resultat||b;
      combat.current=b;

      const apres=[...b.allies,...b.enemies];
      // Deux sources, dans cet ordre. La cible DÉSIGNÉE d'abord : c'est celle
      // que le joueur regarde, et un soin sur un allié déjà au maximum ne
      // change aucun point de vie — sans elle, l'effet retombait sur le
      // lanceur. Les unités réellement touchées ensuite, car une zone, un
      // rebond ou un soin d'équipe atteignent plus que la cible désignée.
      const touchees=apres.filter(u=>{
        const v=avant.get(u.id);
        return v&&u.hp!==v.hp&&u.id!==acteur?.id;
      }).map(u=>u.id);
      const cibles=[...new Set([...(cibleVoulue?[cibleVoulue]:[]),...touchees])];
      const rapport=await a.sort(acteur?.id,cibles.length?cibles:[acteur?.id],spec);
      // Un historique, pas une ligne unique : les ennemis jouent aussitôt
      // après et écrasaient la liaison du joueur avant qu'il ait pu la lire.
      setLiaisons(l=>[{cle:`${b.actionSeq||0}-${acteur?.id}-${Date.now()}`,
        lanceur:acteur?.name||'',sort:acteurSkillNom(acteur,resultat),...rapport},...l].slice(0,5));

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
    }finally{
      occupe.current=false;
      rafraichir();
    }
  },[]);

  // Enchaînement : tant que personne n'attend le joueur, ça tourne tout seul.
  useEffect(()=>{
    if(etat!=='en-cours')return undefined;
    const t=window.setInterval(()=>{
      const b=combat.current;
      if(!b||b.winner||occupe.current)return;
      const acteur=[...b.allies,...b.enemies].find(u=>u.id===b.turn);
      if(acteur&&acteur.side==='ally'&&!auto)return;   // au joueur de décider
      avancer();
    },650);
    return()=>window.clearInterval(t);
  },[etat,auto,avancer]);

  useEffect(()=>{
    const t=window.setInterval(()=>{if(arene.current)setIps(arene.current.ips())},500);
    return()=>window.clearInterval(t);
  },[]);

  const lancer=(index,cibleId)=>{
    const b=combat.current;
    const acteur=b?.allies?.find(u=>u.id===b.turn);
    if(!acteur)return;
    const spec=arene.current?.sortsDe(acteur.id)?.[index];
    setSortChoisi(null);
    jouer(bat=>castSkill(bat,index,cibleId??acteur.id),spec,cibleId);
  };

  const choisirSort=index=>{
    const b=combat.current;
    const acteur=b?.allies?.find(u=>u.id===b.turn);
    const skill=acteur?.skills?.[index];
    if(!skill)return;
    const{demande,camp}=ciblageDe(skill);
    if(!demande){lancer(index,null);return}
    const possibles=vivants(b,camp);
    // Une seule cible possible : la demander serait un clic pour rien.
    if(possibles.length===1){lancer(index,possibles[0].id);return}
    setSortChoisi({index,camp,skill});
  };

  const actif=vue?.tour?.side==='ally'?vue.tour:null;

  return <section className="page arene-prototype">
    <h2>Arène — prototype pixel art</h2>
    <p className="arene-avertissement">
      Le moteur de combat est le vrai : les tours, les dégâts et les soins
      viennent de lui. Choisis une compétence, puis une cible. Les champions
      dessinés jouent leurs vraies animations ; les autres gardent des sprites
      générés, provisoires.
    </p>

    <ArenePixi largeur={taille.largeur} hauteur={taille.hauteur} onPret={pret}
      onPerdu={()=>setEtat('sans-webgl')}/>

    <div className="arene-barre">
      <span className="arene-tour">
        {etat==='victoire'?'Victoire.':etat==='defaite'?'Défaite.'
          :actif?`Au tour de ${actif.name}`
          :vue?.tour?`${vue.tour.name} agit…`:'…'}
      </span>
      <label className="arene-auto">
        <input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)}/>
        Automatique
      </label>
      <span className="arene-mesure">{ips||'—'} IPS</span>
    </div>

    {actif&&!sortChoisi&&<ul className="arene-sorts">
      {actif.skills.map((skill,index)=>{
        const recharge=actif.cooldowns?.[index]||0;
        return <li key={index}>
          <button disabled={recharge>0} onClick={()=>choisirSort(index)}
            title={skill.desc||skill.description||skill.name}>
            <b>{skill.icon}</b>
            <span>{skill.name}</span>
            <small>{recharge>0?`${recharge} tour${recharge>1?'s':''}`:'Prêt'}</small>
          </button>
        </li>;
      })}
    </ul>}

    {actif&&sortChoisi&&<div className="arene-ciblage">
      <p>{sortChoisi.skill.name} — choisis une cible</p>
      <ul>
        {vivants(combat.current,sortChoisi.camp).map(u=>
          <li key={u.id}><button onClick={()=>lancer(sortChoisi.index,u.id)}>
            <span>{u.name}</span>
            <small>{Math.round(u.hp/u.maxHp*100)} %</small>
          </button></li>)}
      </ul>
      <button className="secondary" onClick={()=>setSortChoisi(null)}>Annuler</button>
    </div>}

    {liaisons.length>0&&<ol className="arene-liaisons">
      {liaisons.map(l=><li key={l.cle}>
        <b>{l.lanceur}</b>
        <span className="liaison-sort">{l.sort}</span>
        <span>animation <code>{l.anim}</code></span>
        <span>{l.joues.length?<>effets <code>{l.joues.join(', ')}</code></>:'aucun effet lié'}</span>
        <span>{l.cibles} cible{l.cibles>1?'s':''}</span>
        <span>{l.ms} ms</span>
        {l.manquants.length>0&&<em>introuvables : {l.manquants.join(', ')}</em>}
      </li>)}
    </ol>}

    {message&&<p className="arene-erreur">{message}</p>}
    {etat==='sans-webgl'&&<p className="arene-erreur">WebGL indisponible sur cet appareil : l’arène ne peut pas s’afficher.</p>}
    {etat==='sans-equipe'&&<p className="arene-erreur">Compose une équipe avant d’ouvrir l’arène.</p>}

    <ul className="arene-journal">{journal.filter(Boolean).map((ligne,i)=><li key={i}>{ligne}</li>)}</ul>
  </section>;
}

// Le nom de la compétence jouée, lu dans le journal du moteur — pas reconstruit
// de notre côté, pour que l'affichage ne puisse pas raconter autre chose.
const acteurSkillNom=(acteur,resultat)=>{
  const ligne=String(resultat?.battle?.log?.[0]||'');
  const m=ligne.match(/utilise ([^:.]+)/);
  return m?m[1].trim():(acteur?.name||'');
};

// Photo figée du combat : React ne doit jamais lire `combat.current` pendant le
// rendu, sous peine d'afficher un état à moitié appliqué.
const photo=b=>b?{
  tour:[...b.allies,...b.enemies].find(u=>u.id===b.turn)||null,
  winner:b.winner,
}:null;
