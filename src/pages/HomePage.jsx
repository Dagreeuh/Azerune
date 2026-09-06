import React,{useState}from'react';
import{useGame}from'../store/GameContext';

export default function HomePage({setPage,onTutorial}){
  const{redeemCode,redeemedCodes,summonerProfile,summonerXpRequired}=useGame();
  const[code,setCode]=useState(''),[feedback,setFeedback]=useState(null),[submitting,setSubmitting]=useState(false); const safeCodes=Array.isArray(redeemedCodes)?redeemedCodes:[],safeProfile={level:Math.max(1,Number(summonerProfile?.level)||1),xp:Math.max(0,Number(summonerProfile?.xp)||0)};
  const submit=event=>{event.preventDefault();if(submitting)return;setSubmitting(true);const result=redeemCode(code);setFeedback(result);if(result.ok)setCode('');setSubmitting(false)};
  return <section>
    <div className="hero"><div>🏰</div><h2>Citadelle des Échos</h2><p>Campagne, raids, collection, équipement, boutique et combat tactique.</p><div className="home-actions"><button onClick={()=>setPage('campaign')}>🗺️ Continuer la campagne</button><button onClick={()=>setPage('battle')}>⚔️ Combat libre</button><button className="secondary" onClick={onTutorial}>📖 Rejouer le tutoriel</button></div></div>
    {safeProfile.level<3&&<article className="starter-path"><div>🧭</div><div><h3>Parcours de départ · Équipe 3★ équilibrée</h3><p>Commence avec Thorgar pour protéger, Sylven pour soigner et Korga pour briser la Défense. Fais-les progresser pour débloquer leur troisième compétence en 4★.</p><b>Niveau {safeProfile.level} · {safeProfile.xp}/{summonerXpRequired(safeProfile.level)} XP</b><div className="starter-actions"><button onClick={()=>setPage('campaign')}>🗺️ Première mission</button><button onClick={()=>setPage('quests')}>📜 Quêtes journalières</button></div></div></article>}
    <article className="promo-center"><div className="promo-icon">🎟️</div><div className="promo-copy"><h2>Codes de récompense</h2><p>Entre un code promotionnel pour recevoir des ressources ou débloquer un champion 5★. Chaque code est utilisable une seule fois par sauvegarde.</p><form onSubmit={submit}><input value={code} onChange={event=>setCode(event.target.value)} placeholder="ENTRE TON CODE" autoComplete="off"/><button type="submit">Valider le code</button></form>{feedback&&<p className={feedback.ok?'promo-success':'promo-error'}>{feedback.ok?'✓':'✕'} {feedback.message}</p>}<small>{safeCodes.length} code{safeCodes.length>1?'s':''} utilisé{safeCodes.length>1?'s':''}</small></div></article>
  </section>;
}
