import React,{useState}from'react';
import ChampionGuideModal from'../components/ChampionGuideModal';
import ResonanceConstellationModal from'../components/ResonanceConstellationModal';
import AutoSkillPriorityModal from'../components/AutoSkillPriorityModal';
import{useGame}from'../store/GameContext';
import{HeroCard,Stats,Bar}from'../components/Cards';
import{levelCap,xpForNextLevel}from'../utils/progression';
import{skillMechanic}from'../utils/skills';
import{elementMeta}from'../utils/elements';
import{championIdentity,championGuide,complexityLabel,resonanceIdentityBonus,championTypes,CHAMPION_TYPE_OPTIONS}from'../data/championIdentities';

export default function HeroesPage({squad=false}){
  const{
    HEROES,owned,team,stats,naturalStats,getProgress,
    championPower,teamPower,getEvolutionStatus,evolveHero,getResonanceStatus,reinforceResonance,ascensionEssences,
    masteryTomes,getSkillInfo,upgradeSkill,gold,teamPresets,activeTeamSlot,selectTeamPreset,renameTeamPreset,saveCurrentTeamToPreset,setTeamMember,removeTeamMember,clearCurrentTeam,copyTeamPreset,getAutoSkillPriority,setAutoSkillPriority,resetAutoSkillPriority
  }=useGame();
  const[selected,setSelected]=useState(team[0]||1);
  const[evolutionMessage,setEvolutionMessage]=useState(null);
  const[skillMessage,setSkillMessage]=useState(null);
  const[teamMessage,setTeamMessage]=useState(null),[renamingSlot,setRenamingSlot]=useState(null),[presetName,setPresetName]=useState(''),[selectedSlot,setSelectedSlot]=useState(null),[teamQuery,setTeamQuery]=useState(''),[teamType,setTeamType]=useState('all'),[teamElement,setTeamElement]=useState('all'),[teamSort,setTeamSort]=useState('power'),[copyTarget,setCopyTarget]=useState('');
  const[query,setQuery]=useState(''),[rarity,setRarity]=useState('all'),[ownership,setOwnership]=useState('all'),[championType,setChampionType]=useState('all'),[elementFilter,setElementFilter]=useState('all'),[detailTab,setDetailTab]=useState('identity'),[guideHero,setGuideHero]=useState(null),[resonanceHero,setResonanceHero]=useState(null),[autoHero,setAutoHero]=useState(null);
  const baseList=squad?HEROES.filter(entry=>team.includes(entry.id)):HEROES;
  const elementOptions=[...new Set(HEROES.map(entry=>entry.element).filter(Boolean))].map(id=>({id,...elementMeta(id)})).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  const list=baseList.filter(entry=>(!query||entry.name.toLowerCase().includes(query.toLowerCase())||entry.role.toLowerCase().includes(query.toLowerCase()))&&(rarity==='all'||entry.rarity===Number(rarity))&&(ownership==='all'||(ownership==='owned')===owned.includes(entry.id))&&(championType==='all'||championTypes(entry).includes(championType))&&(elementFilter==='all'||entry.element===elementFilter));
  const resetCodexFilters=()=>{setQuery('');setRarity('all');setOwnership('all');setChampionType('all');setElementFilter('all');};
  const codexFiltersActive=Boolean(query)||rarity!=='all'||ownership!=='all'||championType!=='all'||elementFilter!=='all'; 
  const hero=HEROES.find(entry=>entry.id===selected)||HEROES[0];
  const isOwned=owned.includes(hero.id);
  const progress=getProgress(hero);
  const cap=levelCap(progress.stars);
  const maxed=progress.level>=cap;
  const evolution=getEvolutionStatus(hero);
  const heroElement=elementMeta(hero.element);
  const identity=championIdentity(hero);
  const guide=championGuide(hero);
  const personalFragments=Number(progress.soulFragments||0);
  const resonance=getResonanceStatus(hero);
  const resonanceIV=resonanceIdentityBonus(hero);

  const evolve=()=>setEvolutionMessage(evolveHero(hero.id));
  const reinforce=()=>setEvolutionMessage(reinforceResonance(hero.id));
  const safeGetAutoPriority=heroId=>typeof getAutoSkillPriority==='function'?getAutoSkillPriority(heroId):[2,1,0];
  const safeSetAutoPriority=(heroId,order)=>typeof setAutoSkillPriority==='function'?setAutoSkillPriority(heroId,order):{ok:false,message:'Configuration AUTO indisponible.'};
  const safeResetAutoPriority=heroId=>typeof resetAutoSkillPriority==='function'?resetAutoSkillPriority(heroId):{ok:false,message:'Configuration AUTO indisponible.'};
  const improveSkill=index=>setSkillMessage(upgradeSkill(hero.id,index));
  if(squad){
    const ownedHeroes=HEROES.filter(entry=>owned.includes(entry.id));
    const elements=[...new Set(ownedHeroes.map(entry=>entry.element).filter(Boolean))].map(id=>({id,...elementMeta(id)})).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
    const roster=ownedHeroes.filter(entry=>(!teamQuery||entry.name.toLowerCase().includes(teamQuery.toLowerCase())||entry.role.toLowerCase().includes(teamQuery.toLowerCase()))&&(teamType==='all'||championTypes(entry).includes(teamType))&&(teamElement==='all'||entry.element===teamElement)).sort((a,b)=>teamSort==='name'?a.name.localeCompare(b.name,'fr'):teamSort==='level'?getProgress(b).level-getProgress(a).level:teamSort==='stars'?getProgress(b).stars-getProgress(a).stars:championPower(b)-championPower(a));
    const placeHero=entry=>{const existing=team.indexOf(entry.id);if(existing>=0){setSelectedSlot(existing);setTeamMessage({ok:true,message:`${entry.name} occupe déjà l’emplacement ${existing+1}.`});return}const target=selectedSlot??(team.length<3?team.length:null);if(target==null){setTeamMessage({ok:false,message:'Équipe pleine : sélectionne un emplacement à remplacer.'});return}const result=setTeamMember(target,entry.id);setTeamMessage(result);setSelectedSlot(null);setSelected(entry.id)};
    return <section className="heroes-page squad-page team-builder-page"><div className="heroes-page-heading squad-heading"><div><small>COMPOSITION RAPIDE</small><h2>Équipes</h2><p>Compose tes formations avec tous tes champions possédés. Le Codex reste réservé aux informations détaillées.</p></div><span className="heroes-count">{owned.length} possédés</span></div><section className="team-preset-manager"><header><div><small>COMPOSITIONS ENREGISTRÉES</small><h3>Équipes 1 à 9</h3></div><span className="team-autosave">✓ Enregistrement automatique</span></header><div className="team-preset-slots">{teamPresets.map(preset=>{const members=preset.members.map(id=>HEROES.find(entry=>entry.id===id)).filter(Boolean);return <button key={preset.id} className={activeTeamSlot===preset.id?'active':''} onClick={()=>{setTeamMessage(selectTeamPreset(preset.id));setSelectedSlot(null)}}><b>{preset.id}</b><strong>{preset.name}</strong><span>{members.length?members.map(member=>member.icon).join(' '):'Vide'}</span></button>})}</div><div className="team-preset-actions team-builder-preset-actions"><input value={presetName} onChange={event=>setPresetName(event.target.value)} placeholder={teamPresets[activeTeamSlot-1]?.name||`Équipe ${activeTeamSlot}`}/><button onClick={()=>{setTeamMessage(renameTeamPreset(activeTeamSlot,presetName));setPresetName('')}}>Renommer</button><select value={copyTarget} onChange={event=>setCopyTarget(event.target.value)}><option value="">Copier vers…</option>{teamPresets.filter(p=>p.id!==activeTeamSlot).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button disabled={!copyTarget} onClick={()=>{setTeamMessage(copyTeamPreset(activeTeamSlot,copyTarget));setCopyTarget('')}}>Copier</button></div>{teamMessage&&<p className={teamMessage.ok?'team-preset-success':'team-preset-error'}>{teamMessage.message}</p>}</section><div className="team-builder-layout"><aside className="team-builder-active"><header><div><small>ÉQUIPE ACTIVE</small><h3>{teamPresets[activeTeamSlot-1]?.name}</h3></div><b>⚔️ {teamPower().toLocaleString('fr-FR')}</b></header><p className="team-builder-help">Sélectionne un emplacement, puis clique sur un champion. Sans sélection, le premier emplacement libre est utilisé.</p><div className="team-builder-slots">{[0,1,2].map(index=>{const member=HEROES.find(entry=>entry.id===team[index]);return <article key={index} className={`team-builder-slot ${selectedSlot===index?'selected':''} ${member?'filled':'empty'}`} onClick={()=>setSelectedSlot(index)}>{member?<><span>{member.icon}</span><div><small>EMPLACEMENT {index+1}</small><strong>{member.name}</strong><em>{member.role} · {getProgress(member).stars}★ · Niv. {getProgress(member).level}</em><b>⚔️ {championPower(member).toLocaleString('fr-FR')}</b></div><button onClick={event=>{event.stopPropagation();setTeamMessage(removeTeamMember(index));setSelectedSlot(null)}}>Retirer</button></>:<><span>＋</span><div><small>EMPLACEMENT {index+1}</small><strong>{selectedSlot===index?'Choisis un champion':'Emplacement vide'}</strong></div></>}</article>})}</div><button className="team-clear-button" disabled={!team.length} onClick={()=>{setTeamMessage(clearCurrentTeam());setSelectedSlot(0)}}>Vider l’équipe</button></aside><main className="team-builder-roster"><header><div><small>ROSTER POSSÉDÉ</small><h3>Choisir un champion</h3></div><span>{roster.length} résultat(s)</span></header><div className="team-builder-toolbar"><input value={teamQuery} onChange={event=>setTeamQuery(event.target.value)} placeholder="Rechercher un champion ou une spécialité…"/><select aria-label="Filtrer l’équipe par type de champion" value={teamType} onChange={event=>setTeamType(event.target.value)}><option value="all">Tous les types</option>{CHAMPION_TYPE_OPTIONS.map(type=><option key={type.id} value={type.id}>{type.icon} {type.label}</option>)}</select><select value={teamElement} onChange={event=>setTeamElement(event.target.value)}><option value="all">Tous les éléments</option>{elements.map(element=><option key={element.id} value={element.id}>{element.icon} {element.name}</option>)}</select><select value={teamSort} onChange={event=>setTeamSort(event.target.value)}><option value="power">Puissance</option><option value="level">Niveau</option><option value="stars">Étoiles</option><option value="name">Nom</option></select><button disabled={!teamQuery&&teamType==='all'&&teamElement==='all'&&teamSort==='power'} onClick={()=>{setTeamQuery('');setTeamType('all');setTeamElement('all');setTeamSort('power')}}>Réinitialiser</button></div><div className="team-roster-grid">{roster.map(entry=>{const progress=getProgress(entry),slot=team.indexOf(entry.id),meta=elementMeta(entry.element);return <article key={entry.id} className={`team-roster-card ${slot>=0?'in-team':''}`} style={{'--element-color':meta.color}} onClick={()=>placeHero(entry)}><header><span>{entry.icon}</span><div><strong>{entry.name}</strong><small>{entry.role} · {meta.icon} {meta.name}</small></div>{slot>=0&&<em>✓ Slot {slot+1}</em>}</header><div className="team-roster-stats"><span>{progress.stars}★</span><span>Niv. {progress.level}</span><b>⚔️ {championPower(entry).toLocaleString('fr-FR')}</b></div><div className="team-roster-actions"><button onClick={event=>{event.stopPropagation();placeHero(entry)}}>{slot>=0?'Sélectionner':selectedSlot!=null?`Placer en ${selectedSlot+1}`:team.length<3?'Ajouter':'Choisir un slot'}</button><button className="secondary" onClick={event=>{event.stopPropagation();setAutoHero(entry)}}>⚙ AUTO</button></div></article>})}</div></main></div>{autoHero&&<AutoSkillPriorityModal hero={autoHero} progress={getProgress(autoHero)} initialOrder={safeGetAutoPriority(autoHero.id)} onSave={order=>safeSetAutoPriority(autoHero.id,order)} onReset={()=>safeResetAutoPriority(autoHero.id)} onClose={()=>setAutoHero(null)}/>}</section>;
  }

  return <section className={squad?'heroes-page squad-page':'heroes-page codex-page'}>
    <div className={`heroes-page-heading ${squad?'squad-heading':'codex-heading'}`}><div><small>{squad?'ESCOUADE ACTIVE':'COLLECTION'}</small><h2>{squad?'Équipe active':'Codex des champions'}</h2><p>{squad?'Protection, soutien et dégâts réunis dans une équipe de trois champions.':'Consulte les informations, statistiques, compétences, Ascension et Résonance de chaque champion.'}</p></div><span className="heroes-count">{squad?`${team.length} / 3`:`${owned.length} / ${HEROES.length}`}</span></div>
    {!squad&&<div className="codex-toolbar codex-toolbar-types"><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Rechercher un champion ou un rôle..."/><select value={rarity} onChange={event=>setRarity(event.target.value)}><option value="all">Toutes raretés</option><option value="3">3★</option><option value="4">4★</option><option value="5">5★</option></select><select value={ownership} onChange={event=>setOwnership(event.target.value)}><option value="all">Tous</option><option value="owned">Possédés</option><option value="missing">Non possédés</option></select><select aria-label="Filtrer par type de champion" value={championType} onChange={event=>setChampionType(event.target.value)}><option value="all">Tous les types</option>{CHAMPION_TYPE_OPTIONS.map(type=><option key={type.id} value={type.id}>{type.icon} {type.label}</option>)}</select><select aria-label="Filtrer par élément" value={elementFilter} onChange={event=>setElementFilter(event.target.value)}><option value="all">Tous les éléments</option>{elementOptions.map(element=><option key={element.id} value={element.id}>{element.icon} {element.name}</option>)}</select><button type="button" className="filter-reset" disabled={!codexFiltersActive} onClick={resetCodexFilters}>Réinitialiser</button><span>{list.length} résultat(s)</span></div>}
    {squad&&<section className="team-preset-manager"><header><div><small>COMPOSITIONS ENREGISTRÉES</small><h3>Équipes 1 à 9</h3></div><button onClick={()=>setTeamMessage(saveCurrentTeamToPreset(activeTeamSlot))}>Enregistrer l’équipe active</button></header><div className="team-preset-slots">{teamPresets.map(preset=>{const members=preset.members.map(id=>HEROES.find(entry=>entry.id===id)).filter(Boolean);return <button key={preset.id} className={activeTeamSlot===preset.id?'active':''} onClick={()=>{setTeamMessage(selectTeamPreset(preset.id));setSelected(preset.members[0]||selected)}}><b>{preset.id}</b><strong>{preset.name}</strong><span>{members.length?members.map(member=>member.icon).join(' '):'Emplacement vide'}</span></button>})}</div><div className="team-preset-actions"><input value={presetName} onChange={event=>setPresetName(event.target.value)} placeholder={teamPresets[activeTeamSlot-1]?.name||`Équipe ${activeTeamSlot}`}/><button onClick={()=>{setTeamMessage(renameTeamPreset(activeTeamSlot,presetName));setPresetName('');setRenamingSlot(null)}}>Renommer l’équipe {activeTeamSlot}</button></div>{teamMessage&&<p className={teamMessage.ok?'team-preset-success':'team-preset-error'}>{teamMessage.message}</p>}</section>}
    {squad&&<div className="team-power-showcase"><div className="team-power-icon">⚔️</div><div className="team-power-copy"><small>PUISSANCE TOTALE</small><b>{teamPower().toLocaleString('fr-FR')}</b><p>Progression, étoiles, statistiques et équipement des trois champions inclus.</p></div><div className="team-role-strip"><span>🛡️ Protection</span><span>🌿 Soutien</span><span>🪓 Dégâts</span></div></div>}

    <div className={`grid cards ${squad?'team-member-strip':'codex-champion-grid'}`}>
      {list.map(entry=><div key={entry.id} className="hero-card-auto-wrap"><HeroCard
        hero={entry}
        locked={false}
        owned={owned.includes(entry.id)}
        progress={owned.includes(entry.id)?getProgress(entry):null}
        selected={selected===entry.id}
        onClick={()=>{setSelected(entry.id);setEvolutionMessage(null);setSkillMessage(null);setDetailTab('identity')}}
      />{squad&&owned.includes(entry.id)&&<div className="hero-auto-config-row"><button className="hero-auto-config" onClick={event=>{event.stopPropagation();setAutoHero(entry)}} title="Configurer les priorités du combat automatique">⚙ Priorités AUTO</button></div>}</div>)}
    </div>

    <article className={`panel ${isOwned?'':'champion-locked'}`}>
      <div className="profile">
        <b className="emoji">{hero.icon}</b>
        <div>
          <h2>{hero.name}</h2>
          <p>{hero.role} · <span className="element-badge" style={{'--element-color':heroElement.color}}>{heroElement.icon} {heroElement.name}</span></p>
          <div className="champion-power">⚔️ Puissance {championPower(hero).toLocaleString('fr-FR')}</div>
          <div className="champion-rank">
            {'★'.repeat(isOwned?progress.stars:hero.rarity)}
            {'☆'.repeat(6-(isOwned?progress.stars:hero.rarity))}
          </div>
          <b>{isOwned?`Niveau ${progress.level}/${cap}`:'Non possédé · aperçu niveau 1'}</b>
          <div className={`codex-ownership-status ${isOwned?'owned':'missing'}`}>
            {isOwned?'✓ Champion possédé · progression disponible':'🔒 Champion non possédé · aperçu uniquement'}
          </div>
        </div>
      </div>

      <section className="champion-quick-info"><div><small>STATISTIQUES</small><b>❤️ {isOwned?stats(hero).hp:hero.hp}</b><b>⚔️ {isOwned?stats(hero).atk:hero.atk}</b><b>🛡️ {isOwned?stats(hero).def:hero.def}</b><b>⚡ {isOwned?stats(hero).spd:hero.spd}</b></div><div><small>PROGRESSION</small><b>Niveau {isOwned?progress.level:1}/{cap}</b><b>✦ Résonance {progress.resonance}/5</b><b>🧩 {personalFragments} fragment{personalFragments>1?'s':''}</b><b>⭐ {isOwned?progress.stars:hero.rarity}★</b></div><div><small>COMPÉTENCES</small>{hero.skills.map((skill,index)=><button key={skill.name} onClick={()=>setDetailTab('skills')} title={skill.name}>{skill.icon} <span>{skill.name}</span><em>Niv. {getSkillInfo(hero,index).level}</em></button>)}</div></section>
      <div className="champion-detail-tabs" role="tablist" aria-label="Informations du champion"><button type="button" role="tab" aria-selected={detailTab==='identity'} className={detailTab==='identity'?'active':''} onClick={()=>setDetailTab('identity')}>Identité</button><button type="button" role="tab" aria-selected={detailTab==='stats'} className={detailTab==='stats'?'active':''} onClick={()=>setDetailTab('stats')}>Statistiques</button><button type="button" role="tab" aria-selected={detailTab==='progress'} className={detailTab==='progress'?'active':''} onClick={()=>setDetailTab('progress')}>Progression</button><button type="button" role="tab" aria-selected={detailTab==='skills'} className={detailTab==='skills'?'active':''} onClick={()=>setDetailTab('skills')}>Compétences</button></div>
      <div className={`champion-tab-panel ${detailTab==='progress'?'visible':''}`}>
      {isOwned&&<div className="xp-panel">
        <div>
          <span>Expérience</span>
          <b>{maxed?'Niveau maximum':`${progress.xp}/${xpForNextLevel(progress.level)} XP`}</b>
        </div>
        <Bar
          v={maxed?1:progress.xp}
          max={maxed?1:xpForNextLevel(progress.level)}
          color={maxed?'#fbbf24':'#8b5cf6'}
        />
        <small>Le plafond augmente de 10 niveaux par étoile, jusqu’au niveau 60.</small>
      </div>}

      {isOwned&&<div className="champion-growth-grid">
        <article className={`ascension-panel ${evolution.canEvolve?'evolution-ready':''}`}><header><div><small>ASCENSION</small><h3>{evolution.maxStars?'Rang maximum':`${progress.stars}★ → ${progress.stars+1}★`}</h3></div><span>⭐</span></header>{evolution.maxStars?<p>Ce champion a atteint le rang maximal 6★.</p>:<><div className="growth-requirements"><span className={evolution.levelReady?'ready':'missing'}>{evolution.levelReady?'✓':'🔒'} Niveau {evolution.maxLevel}</span><span className={gold>=evolution.cost.gold?'ready':'missing'}>🪙 {gold.toLocaleString('fr-FR')} / {evolution.cost.gold.toLocaleString('fr-FR')}</span>{evolution.cost.minor>0&&<span className={ascensionEssences.minor>=evolution.cost.minor?'ready':'missing'}>🔹 {ascensionEssences.minor} / {evolution.cost.minor}</span>}{evolution.cost.major>0&&<span className={ascensionEssences.major>=evolution.cost.major?'ready':'missing'}>🔷 {ascensionEssences.major} / {evolution.cost.major}</span>}{evolution.cost.mythic>0&&<span className={ascensionEssences.mythic>=evolution.cost.mythic?'ready':'missing'}>💠 {ascensionEssences.mythic} / {evolution.cost.mythic}</span>}</div><button disabled={!evolution.canEvolve} onClick={evolve}>{evolution.canEvolve?'⭐ Faire l’Ascension':`Préparer l’Ascension ${progress.stars}★`}</button><small>Les doublons ne sont pas requis. Le champion revient au niveau 1, mais conserve ses compétences, son équipement et sa Résonance.</small></>}</article>
        <article className={`resonance-panel resonance-${progress.resonance}`}><header><div><small>DOUBLONS</small><h3>Résonance {progress.resonance}/5</h3></div><span>✦</span></header><p>🧩 Fragments d’âme disponibles : <b>{personalFragments}</b></p>{resonance.maxed?<><strong>Résonance maximale</strong><p>Les prochains doublons seront convertis en Fragments de sang.</p><button className="open-constellation-button perfect" onClick={()=>setResonanceHero(hero)}>✦ Admirer la constellation</button></>:<><div className="resonance-next"><small>Prochain niveau</small><b>{resonance.required} Fragment{resonance.required>1?'s':''} requis</b><p>{resonance.next===1?'+2 % PV, ATQ et DEF':resonance.next===2?'+3 Vitesse':resonance.next===3?'+3 % Précision et Résistance':resonance.next===4?resonanceIV:'+2 % PV, ATQ et DEF et prestige maximal'}</p></div><button className="open-constellation-button" onClick={()=>setResonanceHero(hero)}>✦ Ouvrir la constellation</button></>}{evolutionMessage&&<p className={evolutionMessage.ok?'evolution-success':'evolution-error'}>{evolutionMessage.message}</p>}</article>
      </div>}

      </div>
      <div className={`champion-tab-panel ${detailTab==='identity'?'visible':''}`}>
      <section className="champion-identity-panel roster-identity" style={{'--element-color':heroElement.color}}><div className="identity-title"><span>{identity.icon}</span><div><small>MÉCANIQUE DISTINCTIVE</small><h3>{identity.title}</h3><em className={`complexity complexity-${guide.complexity}`}>{complexityLabel(guide.complexity)}</em></div></div><p>{identity.summary}</p><div className="identity-grid roster-grid"><div><small>RÔLE PRINCIPAL</small><b>{guide.primaryRole}</b></div><div><small>RÔLE SECONDAIRE</small><b>{guide.secondaryRole}</b></div><div><small>NICHE</small><b>{guide.niche}</b></div><div><small>SITUATION IDÉALE</small><b>{guide.ideal}</b></div><div><small>LIMITE RÉELLE</small><b>{guide.limitation}</b></div><div><small>STUFF CONSEILLÉ</small><b>{guide.priorityStats.join(' · ')}</b></div></div><button className="gameplay-guide-button" onClick={()=>setGuideHero(hero)}>ⓘ Comprendre le gameplay</button></section>
      </div>
      <div className={`champion-tab-panel ${detailTab==='stats'?'visible':''}`}>
      <Stats
        s={isOwned?stats(hero):{hp:hero.hp,atk:hero.atk,def:hero.def,spd:hero.spd,crit:5,accuracy:hero.accuracy||0,resistance:hero.resistance||15}}
        base={{hp:hero.hp,atk:hero.atk,def:hero.def,spd:hero.spd,crit:5,accuracy:hero.accuracy||0,resistance:hero.resistance||15}}
        progressed={naturalStats(hero)}
      />

      </div>
      <div className={`champion-tab-panel ${detailTab==='skills'?'visible':''}`}>
      <h3>Sorts</h3>
      <div className="mastery-wallet">📘 Tomes de maîtrise : <b>{masteryTomes}</b></div>
      <div className="grid skills">
        {hero.skills.map((skill,index)=>{
          const info=getSkillInfo(hero,index);
          const mechanic=skillMechanic(skill);
          const skillUnlocked=index<2||hero.rarity>=4||progress.stars>=4;
          const effectiveCd=Math.max(0,skill.cd-info.bonuses.cooldown);
          const cannotAfford=masteryTomes<1||gold<info.cost;
          return <article key={skill.name} className={`${info.maxed?'skill-maxed':''} ${!skillUnlocked?'skill-locked-card':''}`}>
            <div className="skill-title">
              <b className="emoji">{skillUnlocked?skill.icon:'🔒'}</b>
              <span>Niveau {info.level}/{info.maxLevel}</span>
            </div>
            <strong>{skill.name}</strong>
            <p>{skillUnlocked?skill.description:'Compétence verrouillée. Fais évoluer ce champion naturel 3★ en 4★ pour la débloquer.'}</p>
            <small>Recharge {effectiveCd||'Aucune'} · Cible {skill.target}</small>
            <div className="skill-mechanics">
              <div><small>Mécanique</small><p>{mechanic.mechanic}</p></div>
              <div><small>Statistiques clés</small><p>{mechanic.scaling.join(' · ')}</p></div>
              <div className="gear-tip"><small>Conseil d’équipement</small><p>{mechanic.gear}</p></div>
            </div>
            <div className="skill-level-bar">
              {Array.from({length:info.maxLevel},(_,slot)=><i
                key={slot}
                className={slot<info.level?'filled':''}
              />)}
            </div>
            {info.next
              ?<div className="next-skill-up">
                <small>Prochain niveau</small>
                <b>{info.next.label}</b>
              </div>
              :<div className="next-skill-up max"><b>Compétence au maximum</b></div>}
            <button
              disabled={!isOwned||!skillUnlocked||info.maxed||cannotAfford}
              onClick={()=>improveSkill(index)}
            >
              {!skillUnlocked?'Évolution 4★ requise':info.maxed?'MAX':`Améliorer · 📘 1 · 🪙 ${info.cost.toLocaleString('fr-FR')}`}
            </button>
          </article>;
        })}
      </div>
      {skillMessage&&<p className={skillMessage.ok?'skill-up-success':'skill-up-error'}>
        {skillMessage.message}
      </p>}
      </div>
    </article>
    {guideHero&&<ChampionGuideModal hero={guideHero} onClose={()=>setGuideHero(null)}/>}
    {autoHero&&<AutoSkillPriorityModal hero={autoHero} progress={getProgress(autoHero)} initialOrder={safeGetAutoPriority(autoHero.id)} onSave={order=>safeSetAutoPriority(autoHero.id,order)} onReset={()=>safeResetAutoPriority(autoHero.id)} onClose={()=>setAutoHero(null)}/>}
    {resonanceHero&&<ResonanceConstellationModal hero={resonanceHero} progress={getProgress(resonanceHero)} status={getResonanceStatus(resonanceHero)} onActivate={()=>setEvolutionMessage(reinforceResonance(resonanceHero.id))} onClose={()=>setResonanceHero(null)}/>}
  </section>;
}
