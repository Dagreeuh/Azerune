import React,{useState}from'react';
import{useGame}from'../store/GameContext';
import{ACADEMY_TUTORIALS,ACADEMY_REWARD,ACADEMY_FINAL_REWARD,ACADEMY_TOTAL_REWARD}from'../data/tutorials';
import TutorialModal from'../components/TutorialModal';

export default function TutorialAcademyPage(){
 const{tutorialAcademy,completeAcademyTutorial,claimAcademyTutorial,claimAcademyFinal}=useGame();
 const[active,setActive]=useState(null),[message,setMessage]=useState(''),[pending,setPending]=useState(null);
 const completed=ACADEMY_TUTORIALS.filter(item=>tutorialAcademy.completed[item.id]).length;
 const claimed=ACADEMY_TUTORIALS.filter(item=>tutorialAcademy.claimed[item.id]).length;
 const percent=ACADEMY_TUTORIALS.length?Math.round(completed/ACADEMY_TUTORIALS.length*100):0;
 const allCompleted=completed===ACADEMY_TUTORIALS.length;
 const finalReady=allCompleted&&!tutorialAcademy.finalClaimed;
 const stateOf=id=>tutorialAcademy.claimed[id]?'claimed':tutorialAcademy.completed[id]?'ready':'open';
 const claim=id=>{if(pending)return;setPending(`lesson:${id}`);const result=claimAcademyTutorial(id);setMessage(result.message);setPending(null)};
 const claimFinal=()=>{if(pending)return;setPending('final');const result=claimAcademyFinal();setMessage(result.message);setPending(null)};
 const complete=id=>{const result=completeAcademyTutorial(id);setActive(null);setMessage(result.ok?'Leçon terminée. La récompense est disponible sur sa carte.':result.message)};
 const finalRewardLabel=`🪙 ${ACADEMY_FINAL_REWARD.gold} Or · 🔥 ${ACADEMY_FINAL_REWARD.stones} Pierre${ACADEMY_FINAL_REWARD.stones>1?'s':''} de foyer`;
 return <section className="academy-page"><header className="academy-hero"><div><small>FORMATION DES INVOCATEURS</small><h2>📘 Académie d’Azerune</h2><p>Apprends chaque mécanique grâce à des démonstrations et des défis sans échec punitif.</p></div><div className="academy-overview"><b>{completed} / {ACADEMY_TUTORIALS.length}</b><span>{claimed*ACADEMY_REWARD} / {ACADEMY_TOTAL_REWARD} Cristaux récupérés</span></div><div className="academy-progress"><i style={{width:`${percent}%`}}/><strong>{percent} %</strong></div></header>{message&&<p className="academy-message" role="status">{message}</p>}<div className="academy-grid">{ACADEMY_TUTORIALS.map((lesson,index)=>{const state=stateOf(lesson.id),claiming=pending===`lesson:${lesson.id}`;return <article key={lesson.id} className={`academy-card ${state}`}><header><span>{lesson.icon}</span><div><small>LEÇON {index+1}</small><h3>{lesson.title}</h3></div><em>{state==='claimed'?'✅ Terminé':state==='ready'?'🎁 Récompense disponible':'▶ Commencer'}</em></header><p>{lesson.summary}</p><div className="academy-card-reward">💎 {ACADEMY_REWARD} Cristaux</div>{state==='ready'?<button onClick={()=>claim(lesson.id)} disabled={Boolean(pending)}>{claiming?'Attribution…':`Récupérer ${ACADEMY_REWARD} Cristaux`}</button>:<button onClick={()=>setActive(lesson)} disabled={Boolean(pending)}>{state==='claimed'?'Rejouer':'Commencer'}</button>}</article>})}</div><article className={`academy-final ${tutorialAcademy.finalClaimed?'claimed':finalReady?'ready':''}`}><span>🏆</span><div><small>RÉCOMPENSE FINALE</small><h3>Compléter toute l’Académie</h3><p>Une récompense unique pour avoir terminé les {ACADEMY_TUTORIALS.length} leçons.</p><b>{finalRewardLabel}</b></div><button onClick={claimFinal} disabled={!finalReady||Boolean(pending)}>{tutorialAcademy.finalClaimed?'Récompense récupérée':pending==='final'?'Attribution…':finalReady?'Récupérer':`${ACADEMY_TUTORIALS.length} leçons requises`}</button></article>{active&&<TutorialModal lesson={active} onClose={()=>setActive(null)} onComplete={complete}/>}</section>;
}
