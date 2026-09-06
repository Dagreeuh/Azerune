import React,{useEffect,useId,useState}from'react';
import{resonanceConstellation,resonanceIdentityBonus}from'../data/championIdentities';
import{RESONANCE_COSTS,remainingResonanceFragments}from'../utils/progression';
import{elementMeta}from'../utils/elements';

const ROMAN=['I','II','III','IV','V'];
const BONUSES=['+2 % PV, ATQ et DEF','+3 Vitesse','+3 % Précision et Résistance',null,'+2 % PV, ATQ et DEF · Prestige maximal'];

const ART={
 shield:{points:[[50,10],[22,27],[27,65],[50,88],[73,65]],paths:['M50 10 L78 24 L73 65 Q66 81 50 90 Q34 81 27 65 L22 24 Z','M50 18 L67 29 L64 59 Q60 72 50 79 Q40 72 36 59 L33 29 Z'],runes:[[50,35],[43,49],[57,49],[50,64]]},
 arrow:{points:[[12,72],[30,58],[49,43],[68,28],[88,12]],paths:['M10 76 Q42 63 84 18','M67 16 L88 12 L83 33','M20 68 L29 78','M36 54 L45 64'],runes:[[23,31],[45,24],[67,57]]},
 hammer:{points:[[18,25],[42,18],[58,34],[45,56],[74,82]],paths:['M18 25 L42 18 L59 35 L46 54','M46 54 L74 82','M32 14 L49 31 L59 21 L42 5 Z','M68 76 L80 88'],runes:[[24,53],[70,23],[56,70]]},
 tree:{points:[[50,88],[50,66],[27,47],[50,18],[74,47]],paths:['M50 89 L50 18','M50 65 Q31 62 27 47','M50 65 Q69 62 74 47','M50 44 Q36 39 31 27','M50 44 Q64 39 69 27','M38 88 Q50 76 62 88'],runes:[[22,70],[78,70],[50,35]]},
 crystal:{points:[[50,8],[18,42],[50,91],[82,42],[50,49]],paths:['M50 8 L82 42 L50 91 L18 42 Z','M50 8 L50 91','M18 42 L82 42','M50 49 L34 42 L50 20 L66 42 Z'],runes:[[29,67],[71,67],[50,73]]},
 wave:{points:[[8,60],[27,35],[48,57],[69,31],[92,54]],paths:['M7 62 Q18 31 31 51 T55 52 T78 45 T94 55','M8 73 Q24 47 40 67 T72 61 T94 68','M15 82 Q31 63 47 78 T80 75'],runes:[[22,22],[51,27],[81,20]]},
 spiral:{points:[[50,50],[64,40],[67,61],[43,73],[23,47]],paths:['M50 50 C58 40 70 44 68 57 C65 72 43 80 28 66 C9 48 22 21 50 17 C78 13 94 39 85 65'],runes:[[50,17],[83,35],[28,67]]},
 blades:{points:[[50,12],[20,33],[29,78],[71,78],[80,33]],paths:['M50 14 C77 16 89 40 75 63 C67 75 58 80 50 88','M50 88 C24 82 11 59 22 37 C29 25 39 18 50 14','M22 37 C31 53 43 59 50 50 C58 40 69 42 79 33'],runes:[[50,29],[68,62],[32,62]]},
 crown:{points:[[12,70],[28,28],[50,58],[72,28],[88,70]],paths:['M12 70 L28 28 L50 58 L72 28 L88 70 Z','M18 70 Q50 84 82 70','M36 69 L50 14 L64 69'],runes:[[19,48],[50,35],[81,48]]},
 flame:{points:[[50,88],[27,68],[42,43],[50,12],[72,64]],paths:['M50 90 C22 83 16 57 34 38 C36 55 47 57 45 37 C44 25 51 16 61 9 C59 28 79 39 78 61 C77 79 63 89 50 90 Z','M50 79 C39 74 38 62 47 52 C48 61 55 60 57 52 C66 65 61 76 50 79 Z'],runes:[[30,48],[67,36],[60,70]]},
 balance:{points:[[50,13],[50,40],[19,61],[81,61],[50,89]],paths:['M50 13 L50 89','M22 35 L78 35','M30 35 L18 61 L42 61 Z','M70 35 L58 61 L82 61 Z','M31 89 Q50 76 69 89'],runes:[[18,51],[82,51],[50,64]]},
 triangle:{points:[[50,10],[15,82],[85,82],[50,61],[50,37]],paths:['M50 10 L15 82 L85 82 Z','M50 37 L31 70 L69 70 Z','M15 82 L50 61 L85 82'],runes:[[27,45],[73,45],[50,75]]},
 hourglass:{points:[[20,12],[80,12],[50,50],[20,88],[80,88]],paths:['M20 12 L80 12 L50 50 L80 88 L20 88 L50 50 Z','M28 20 Q50 39 72 20','M28 80 Q50 61 72 80'],runes:[[35,32],[65,68],[50,50]]},
 beast:{points:[[15,70],[33,45],[50,61],[67,35],[87,52]],paths:['M16 71 Q24 48 34 45 Q42 43 50 61 Q56 39 67 35 Q78 35 87 52','M34 45 Q30 22 43 28','M67 35 Q72 16 80 29','M43 70 Q50 84 59 69'],runes:[[23,63],[50,30],[78,45]]},
 wings:{points:[[50,76],[24,57],[11,28],[50,47],[89,28]],paths:['M50 76 Q36 52 11 28 Q17 57 42 70','M50 76 Q64 52 89 28 Q83 57 58 70','M50 47 L50 82','M42 39 Q50 23 58 39'],runes:[[22,45],[78,45],[50,25]]},
 orb:{points:[[50,50],[20,23],[80,23],[79,79],[20,79]],paths:['M50 12 A38 38 0 1 1 49.9 12','M20 50 A30 15 0 1 0 80 50 A30 15 0 1 0 20 50','M50 20 A15 30 0 1 1 50 80 A15 30 0 1 1 50 20'],runes:[[50,12],[84,50],[50,88],[16,50]]},
 totem:{points:[[50,89],[50,70],[34,53],[66,35],[50,12]],paths:['M40 88 L60 88 L64 73 L58 58 L65 43 L60 26 L56 12 L44 12 L40 26 L35 43 L42 58 L36 73 Z','M35 43 L65 43','M42 58 L58 58'],runes:[[50,21],[50,50],[50,78]]},
 skull:{points:[[24,34],[50,12],[76,34],[66,68],[50,88]],paths:['M24 34 Q28 11 50 12 Q72 11 76 34 L69 63 L59 72 L41 72 L31 63 Z','M41 72 L41 84 L50 89 L59 84 L59 72','M34 42 Q41 34 45 45','M55 45 Q59 34 66 42','M46 58 L50 51 L54 58 Z'],runes:[[35,43],[65,43],[50,80]]},
 candles:{points:[[14,76],[31,34],[50,69],[69,27],[86,76]],paths:['M14 76 L14 45','M31 76 L31 34','M50 76 L50 47','M69 76 L69 27','M86 76 L86 44','M8 76 Q50 87 92 76'],runes:[[14,38],[31,27],[50,40],[69,20],[86,37]]},
 diamond:{points:[[50,9],[82,50],[50,91],[18,50],[50,50]],paths:['M50 9 L82 50 L50 91 L18 50 Z','M50 9 L50 91','M18 50 L82 50','M32 50 L50 27 L68 50 L50 73 Z'],runes:[[50,27],[68,50],[50,73],[32,50]]},
 star:{points:[[50,9],[69,37],[89,50],[67,69],[50,91]],paths:['M50 9 L61 39 L89 50 L61 61 L50 91 L39 61 L11 50 L39 39 Z'],runes:[[50,25],[75,50],[50,75],[25,50]]}
};

function Node({point,index,progress,ready}){
 const unlocked=progress>index,current=progress===index&&ready;
 return <g className={`resonance-node ${unlocked?'unlocked':''} ${current?'ready':''}`} transform={`translate(${point[0]} ${point[1]})`}><circle r="5.8"/><text y="1.7">{ROMAN[index]}</text></g>;
}

function ConstellationArtwork({meta,progress,ready,gradientId}){
 const art=ART[meta.shape]||ART.star;
 return <svg viewBox="0 0 100 100" role="img" aria-label={meta.name}>
  <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6ee7b7"/><stop offset=".52" stopColor="#fde68a"/><stop offset="1" stopColor="#67e8f9"/></linearGradient></defs>
  <g className={`constellation-art art-${meta.shape}`}>{art.paths.map((path,index)=><path key={index} className={`constellation-path path-${index+1}`} d={path}/>)}</g>
  <g className="constellation-runes">{(art.runes||[]).map((point,index)=><circle key={index} cx={point[0]} cy={point[1]} r={index%2?1.15:1.45}/>)}</g>
  {meta.shape==='blades'&&<g className="blade-emblems" fill={`url(#${gradientId})`}><path d="M48 18 L52 18 L55 43 L50 51 L45 43 Z"/><path d="M48 18 L52 18 L55 43 L50 51 L45 43 Z" transform="rotate(120 50 50)"/><path d="M48 18 L52 18 L55 43 L50 51 L45 43 Z" transform="rotate(240 50 50)"/></g>}
  {meta.shape==='orb'&&<circle className="constellation-core-orb" cx="50" cy="50" r="8"/>}
  {meta.shape==='skull'&&<path className="summon-silhouette" d="M43 83 Q50 73 57 83 L55 92 L50 87 L45 92 Z"/>}
  {art.points.map((point,index)=><Node key={index} point={point} index={index} progress={progress} ready={ready}/>) }
  <text className="constellation-symbol" x="50" y="55">{meta.symbol}</text>
 </svg>;
}

const constellationLore=(hero,meta)=>({
 1:'Un rempart runique se referme autour de l’étoile protégée.',3:'La trajectoire de la flèche suit la proie sans jamais perdre son élan.',7:'Trois lames, une seule cadence. Chaque trajectoire nourrit la Tempête finale.',8:'Le marteau accumule ses Impacts avant de fendre le sol.',19:'Les branches portent les Graines qui protègent et purifient l’escouade.',20:'Le cristal se fracture autour du point d’exécution.',21:'Le Reflux voyage d’une vague ennemie vers le rythme allié.',22:'La spirale resserre la Virulence autour de sa cible.',23:'L’Égide enferme l’équipe dans un diamant de lumière.',24:'L’Instabilité tourne autour d’un noyau arcanique prêt à éclater.',25:'La couronne relie les Marées haute et basse.',26:'Les Braises convergent vers le cœur de l’Embrasement.',27:'Le Jardin déploie ses racines entre soin et entrave.',28:'La Balance transforme les améliorations ennemies en Condamnation.',29:'Les trois sommets réunissent Poison, Brûlure et Saignement.',30:'Le Sablier relie le tour mémorisé à son retour temporel.',9:'Le Marteau solaire se charge de Puissance sacrée avant le Verdict.',10:'La silhouette du félin suit la montée des points de combo.',11:'Les lames surgissent de l’ombre après la Disparition.',12:'Les ailes entourent le cœur de l’Expiation.',13:'La flèche de Visée traverse la Défense sur une trajectoire parfaite.',14:'Quatre orbites alimentent le noyau des Charges arcaniques.',15:'Le Totem unit cinq Marées de soin persistantes.',16:'Le crâne et la silhouette invoquée représentent les Blessures et la Goule.',17:'Les cinq chandelles consument lentement les afflictions avant l’Extase.',18:'Les ailes démoniaques s’ouvrent lorsque les Fragments sont consommés.'
}[hero.id]||`Les cinq étoiles retracent ${meta.name.toLowerCase()}.`);

export default function ResonanceConstellationModal({hero,progress,status,onActivate,onClose}){
 const[activating,setActivating]=useState(false),rawId=useId();
 const gradientId=`constellation-${String(rawId).replace(/:/g,'')}`;
 const meta=resonanceConstellation(hero),element=elementMeta(hero.element),maxed=progress.resonance>=5,remaining=remainingResonanceFragments(progress);
 useEffect(()=>{const key=event=>event.key==='Escape'&&onClose();document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[onClose]);
 useEffect(()=>()=>clearTimeout(window.__azeruneResonanceTimer),[]);
 const activate=()=>{if(!status.ready||activating)return;setActivating(true);const result=onActivate();if(result?.ok===false){setActivating(false);return}clearTimeout(window.__azeruneResonanceTimer);window.__azeruneResonanceTimer=setTimeout(()=>setActivating(false),850)};
 return <div className="resonance-modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&onClose()}><section className={`resonance-modal ${maxed?'perfect':''} ${activating?'activating':''}`} style={{'--resonance-color':element.color}} role="dialog" aria-modal="true" aria-labelledby="resonance-title"><header><div><small>CONSTELLATION PERSONNELLE</small><h2 id="resonance-title">{hero.icon} {hero.name}</h2><p>{element.icon} {element.name} · {hero.role}</p></div><button type="button" onClick={onClose} aria-label="Fermer">✕</button></header><div className="resonance-modal-grid"><div className={`constellation-stage constellation-${meta.shape}`}><ConstellationArtwork meta={meta} progress={progress.resonance} ready={status.ready} gradientId={gradientId}/><strong>{meta.name}</strong><span className="constellation-lore">{constellationLore(hero,meta)}</span>{maxed&&<b>✦ RÉSONANCE PARFAITE ✦</b>}</div><aside><div className="resonance-rank">Résonance {progress.resonance}/5</div><div className="fragment-cap"><small>FRAGMENTS D’ÂME</small><b>🧩 {progress.soulFragments}/{remaining}</b><p>{remaining===0?'Les futurs doublons deviennent des Fragments de sang.':'Plafond correspondant à toutes les Résonances restantes.'}</p></div><h3>Chemin de Résonance</h3>{RESONANCE_COSTS.map((cost,index)=><article key={index} className={`${progress.resonance>index?'active':''} ${progress.resonance===index?'next':''}`}><span>{progress.resonance>index?'✓':'✦'} {ROMAN[index]}</span><div><b>{BONUSES[index]||resonanceIdentityBonus(hero)}</b><small>{progress.resonance>index?'Activée':`${cost} Fragment${cost>1?'s':''}`}</small></div></article>)}<button className="resonance-activate" disabled={maxed||!status.ready||activating} onClick={activate}>{maxed?'Constellation accomplie':activating?'Éveil en cours...':status.ready?`Activer Résonance ${ROMAN[progress.resonance]}`:`${status.required} Fragment${status.required>1?'s':''} requis`}</button></aside></div></section></div>;
}
