import React,{useEffect,useState}from'react';
import{useGame}from'../store/GameContext';

export default function Layout({page,setPage,children}){
  const{HEROES,owned,team,teamPresets,activeTeamSlot,selectTeamPreset,teamPower,gems,gold,hearthstones,bloodFragments,forgeEssence,summonerProfile,summonerXpRequired,setSummonerName,unlocks,battleSession,battleInProgress,pendingMission,preparationMission,cancelMissionPreparation,confirmMissionPreparation,abandonBattle,dismissPendingMission,replaceBattleWithPending}=useGame();
  const[prepTeam,setPrepTeam]=useState(team);const preparationMaxMembers=Math.max(1,Math.min(4,Number(preparationMission?.teamSize)||3));
  useEffect(()=>{if(preparationMission)setPrepTeam([...team])},[preparationMission]);
  const[name,setName]=useState(''),[nameError,setNameError]=useState(''),[abandonConfirm,setAbandonConfirm]=useState(false);
  const nav=[['home','🏰','Accueil',1],['academy','📘','Académie',1],['campaign','🗺️','Campagne',1],['raids','🔥','Raids',10],['squad','👥','Équipe',1],['codex','📖','Codex',1],['gear','🎒','Stuff',2],['inventory','🧰','Inventaire',1],['shop','🛒','Boutique',2],['quests','📜','Quêtes',1],['achievements','🏆','Hauts faits',1],['mythic','🗝️','Mythic+',8],['summon','🌀','Invocation',1],['history','🕘','Historique',10],['expeditions','⚔️','Expéditions',3],['settings','⚙️','Paramètres',1]];
  const submitName=event=>{event.preventDefault();const clean=name.trim();if(clean.length<3)return setNameError('Le nom doit contenir au moins 3 caractères.');setSummonerName(clean)};
  const maxed=summonerProfile.level>=60,required=maxed?1:summonerXpRequired(summonerProfile.level),percent=maxed?100:Math.min(100,summonerProfile.xp/required*100);
  return <div className="app">
    {!summonerProfile.name&&<div className="summoner-setup"><form onSubmit={submitName}><div className="summoner-orb">🔮</div><h1>Choisis ton nom d’Invocateur</h1><p>Ce nom représentera ton profil dans les Chroniques d’Azerune.</p><input maxLength="20" value={name} onChange={event=>setName(event.target.value)} placeholder="Nom d’Invocateur" autoFocus/><button>Commencer l’aventure</button>{nameError&&<small>{nameError}</small>}</form></div>}
    <header className="game-header">
      <div className="brand-profile">
        <h1>CHRONIQUES D’AZERUNE</h1>
        <div className="summoner-profile-card">
          <div className="summoner-avatar">🔮</div>
          <div className="summoner-profile-main">
            <div className="summoner-identity">
              <div className="summoner-name-block"><b>{summonerProfile.name||'Nouvel Invocateur'}</b><small>Invocateur d’Azerune</small></div>
              <span className="summoner-level">Niveau {summonerProfile.level}</span>
            </div>
            <div className={`wow-xp-bar ${maxed?'maxed':''}`} title={maxed?'Niveau maximum':`${summonerProfile.xp} XP sur ${required} · ${Math.max(0,required-summonerProfile.xp)} XP restantes`}>
              <i style={{width:`${percent}%`}}/>
              <div className="xp-shine"/>
              <strong>{maxed?'NIVEAU MAXIMUM':`${summonerProfile.xp} / ${required} XP`}</strong>
            </div>
            <div className="xp-details">
              <span>{Math.round(percent)} %</span>
              <small>{maxed?'Progression terminée':`${Math.max(0,required-summonerProfile.xp)} XP avant le niveau ${summonerProfile.level+1}`}</small>
            </div>
          </div>
        </div>
      </div>
      <div className="resource-wallet"><span>💎 {gems}</span><span>🪙 {gold}</span><span>🔥 {hearthstones}</span><span className="blood-wallet">🩸 {bloodFragments}</span><span className="essence-wallet" title="Essence utilisée pour améliorer les équipements jusqu’à +15">🔹 {forgeEssence}</span></div>
    </header>
    <main>{children}</main>
    <nav>{nav.map(([id,icon,label,level])=>{const locked=summonerProfile.level<level;return <button key={id} disabled={locked} title={locked?`Niveau ${level} requis`:label} onClick={()=>!locked&&setPage(id)} className={page===id?'active':''}><span>{locked?'🔒':icon}</span>{label}</button>})}</nav>
    {battleInProgress&&page!=='battle'&&<aside className="active-battle-card"><div className="active-battle-icon">⚔️</div><div><small>COMBAT EN COURS</small><b>{battleSession.mission?.name||'Combat'}</b><span>{battleSession.battle?.turn?`Tour : ${battleSession.battle.allies.find(unit=>unit.id===battleSession.battle.turn)?.name||battleSession.battle.enemies.find(unit=>unit.id===battleSession.battle.turn)?.name||'En attente'}`:'Préparation du combat'}</span><em>Équipe {battleSession.battle?.allies.filter(unit=>!unit.dead).length||battleSession.team?.length||0}/{battleSession.battle?.allies.length||battleSession.team?.length||0} · Ennemis {battleSession.battle?.enemies.filter(unit=>!unit.dead).length||battleSession.mission?.enemies?.length||0}/{battleSession.battle?.enemies.length||battleSession.mission?.enemies?.length||0}</em></div><button onClick={()=>setPage('battle')}>Reprendre</button><button className="danger" onClick={()=>setAbandonConfirm(true)}>Abandonner</button></aside>}
    {abandonConfirm&&<div className="battle-blocker-backdrop" onClick={()=>setAbandonConfirm(false)}><div className="battle-blocker-modal" onClick={event=>event.stopPropagation()}><div>⚠️</div><h3>Abandonner le combat ?</h3><p>La progression de cette bataille sera supprimée. Aucune récompense, tentative de Raid ou Sceau d’Expédition ne sera consommé.</p><div className="abandon-confirm-actions"><button className="secondary" onClick={()=>setAbandonConfirm(false)}>Continuer</button><button className="danger" onClick={()=>{abandonBattle();setAbandonConfirm(false)}}>Confirmer l’abandon</button></div></div></div>}
    {preparationMission&&<div className="team-prep-backdrop" onClick={cancelMissionPreparation}><section className="team-prep-modal" onClick={event=>event.stopPropagation()}><header><div><small>PRÉPARATION DU COMBAT</small><h2>{preparationMission.name||'Mission'}</h2><p>Choisis une équipe enregistrée ou compose temporairement ton groupe. {preparationMaxMembers===4?'Raid 4v4 : le quatrième champion est un renfort temporaire.':''}</p></div><button className="secondary" onClick={cancelMissionPreparation}>✕</button></header><div className="team-prep-presets">{teamPresets.map(preset=><button key={preset.id} className={activeTeamSlot===preset.id?'active':''} onClick={()=>{selectTeamPreset(preset.id);setPrepTeam([...preset.members])}}><b>{preset.id}</b><span>{preset.members.length?preset.members.map(id=>HEROES.find(hero=>hero.id===id)?.icon).join(' '):'Vide'}</span><small>{preset.name}</small></button>)}</div><div className="team-prep-members"><aside><small>ÉQUIPE CHOISIE</small>{Array.from({length:preparationMaxMembers},(_,index)=>index).map(index=>{const hero=HEROES.find(entry=>entry.id===prepTeam[index]);return <div key={index} className={hero?'filled':''}><b>{hero?.icon||'＋'}</b><span>{hero?.name||`Emplacement ${index+1}`}</span>{hero&&<button onClick={()=>setPrepTeam(current=>current.filter((_,slot)=>slot!==index))}>Retirer</button>}</div>})}<strong>⚔️ Puissance {teamPower(prepTeam).toLocaleString('fr-FR')}</strong>{preparationMission.recommended&&<em>Recommandée : {preparationMission.recommended.toLocaleString('fr-FR')}</em>}</aside><div className="team-prep-roster">{HEROES.filter(hero=>owned.includes(hero.id)).map(hero=><button key={hero.id} className={prepTeam.includes(hero.id)?'selected':''} onClick={()=>setPrepTeam(current=>current.includes(hero.id)?current.filter(id=>id!==hero.id):current.length<preparationMaxMembers?[...current,hero.id].slice(0,preparationMaxMembers):current)}><b>{hero.icon}</b><span>{hero.name}</span><small>{hero.role}</small></button>)}</div></div><footer><button className="secondary" onClick={cancelMissionPreparation}>Annuler</button><button disabled={!prepTeam.length} onClick={()=>{const result=confirmMissionPreparation(prepTeam);if(result.ok)setPage('battle')}}>Lancer avec cette équipe</button></footer></section></div>}
    {pendingMission&&<div className="battle-blocker-backdrop" onClick={dismissPendingMission}><div className="battle-blocker-modal" onClick={event=>event.stopPropagation()}><div>⚔️</div><h3>Un combat est déjà en cours</h3><p><b>{battleSession?.mission?.name}</b><br/>Termine ou abandonne ce combat avant de lancer une autre mission.</p><div><button className="secondary" onClick={dismissPendingMission}>Fermer</button><button onClick={()=>{dismissPendingMission();setPage('battle')}}>Reprendre</button><button className="danger" onClick={()=>{replaceBattleWithPending();setPage('battle')}}>Abandonner et lancer</button></div></div></div>}
  </div>;
}
