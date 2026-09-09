import React,{useState}from'react';
import{useGame}from'../store/GameContext';

export default function HomePage({setPage,onTutorial}){
  const{redeemCode,redeemedCodes,summonerProfile,summonerXpRequired,defiMission,defiRecord,defiCode,comparerDefi,requestMissionStart}=useGame();
  const[code,setCode]=useState(''),[feedback,setFeedback]=useState(null),[submitting,setSubmitting]=useState(false);
  // Défi de la semaine : la même rencontre pour tout le monde, un code à
  // s'échanger. Rien ne sort de l'appareil tant que le joueur ne copie pas.
  const[codeAmi,setCodeAmi]=useState(''),[duel,setDuel]=useState(null),[copie,setCopie]=useState(false);
  const monCode=defiCode?.()||null;
  const comparer=event=>{event.preventDefault();setDuel(comparerDefi(codeAmi))};
  const copier=()=>{if(!monCode)return;
    try{navigator.clipboard?.writeText(monCode);setCopie(true);window.setTimeout(()=>setCopie(false),2000)}
    catch{setCopie(false)}}; const safeCodes=Array.isArray(redeemedCodes)?redeemedCodes:[],safeProfile={level:Math.max(1,Number(summonerProfile?.level)||1),xp:Math.max(0,Number(summonerProfile?.xp)||0)};
  const submit=event=>{event.preventDefault();if(submitting)return;setSubmitting(true);const result=redeemCode(code);setFeedback(result);if(result.ok)setCode('');setSubmitting(false)};
  return <section>
    <div className="hero"><div>🏰</div><h2>Citadelle des Échos</h2><p>Campagne, raids, collection, équipement, boutique et combat tactique.</p><div className="home-actions"><button onClick={()=>setPage('campaign')}>🗺️ Continuer la campagne</button><button onClick={()=>setPage('battle')}>⚔️ Combat libre</button><button className="secondary" onClick={onTutorial}>📖 Rejouer le tutoriel</button></div></div>
    {safeProfile.level<3&&<article className="starter-path"><div>🧭</div><div><h3>Parcours de départ · Équipe 3★ équilibrée</h3><p>Commence avec Thorgar pour protéger, Sylven pour soigner et Korga pour briser la Défense. Fais-les progresser pour débloquer leur troisième compétence en 4★.</p><b>Niveau {safeProfile.level} · {safeProfile.xp}/{summonerXpRequired(safeProfile.level)} XP</b><div className="starter-actions"><button onClick={()=>setPage('campaign')}>🗺️ Première mission</button><button onClick={()=>setPage('quests')}>📜 Quêtes journalières</button></div></div></article>}
    <article className="defi-card">
      <div className="defi-heading"><div className="defi-icon">{defiMission.icon}</div>
        <div><small>DÉFI DE LA SEMAINE · {defiMission.semaine}</small><h2>{defiMission.name}</h2>
          <p>{defiMission.description}</p></div></div>
      <div className="defi-etat">
        {defiRecord
          ? <b>🏅 Ton meilleur : {defiRecord.part} % · {defiRecord.actions} actions</b>
          : <b>Pas encore tenté cette semaine.</b>}
        <span>⚔️ Recommandée {defiMission.recommended.toLocaleString('fr-FR')}</span>
      </div>
      <button className="defi-launch" onClick={()=>requestMissionStart(defiMission)}>
        {defiRecord?'Retenter le défi':'Relever le défi'}
      </button>
      {monCode&&<div className="defi-partage">
        <small>TON CODE, À ENVOYER À TES AMIS</small>
        <code>{monCode}</code>
        <button type="button" className="secondary" onClick={copier}>{copie?'Copié ✓':'Copier'}</button>
      </div>}
      <form className="defi-duel" onSubmit={comparer}>
        <small>COMPARER AVEC UN AMI</small>
        <input value={codeAmi} onChange={e=>setCodeAmi(e.target.value)} placeholder="AZ-…" aria-label="Code d’un ami"/>
        <button type="submit" disabled={!codeAmi.trim()}>Comparer</button>
      </form>
      {duel&&(duel.ok
        ? <div className="defi-resultat"><b>{duel.verdict}</b>
            {duel.moi&&<span>Toi {duel.moi.part} % en {duel.moi.actions} actions · {duel.ami.nom} {duel.ami.part} % en {duel.ami.actions} actions</span>}</div>
        : <p className="defi-erreur">{duel.raison}</p>)}
    </article>
    <article className="promo-center"><div className="promo-icon">🎟️</div><div className="promo-copy"><h2>Codes de récompense</h2><p>Entre un code promotionnel pour recevoir des ressources ou débloquer un champion 5★. Chaque code est utilisable une seule fois par sauvegarde.</p><form onSubmit={submit}><input value={code} onChange={event=>setCode(event.target.value)} placeholder="ENTRE TON CODE" autoComplete="off"/><button type="submit">Valider le code</button></form>{feedback&&<p className={feedback.ok?'promo-success':'promo-error'}>{feedback.ok?'✓':'✕'} {feedback.message}</p>}<small>{safeCodes.length} code{safeCodes.length>1?'s':''} utilisé{safeCodes.length>1?'s':''}</small></div></article>
  </section>;
}
