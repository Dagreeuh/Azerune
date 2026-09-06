import React,{useRef,useState}from'react';
import{Capacitor}from'@capacitor/core';
import{Directory,Encoding,Filesystem}from'@capacitor/filesystem';
import{Share}from'@capacitor/share';
import{FilePicker}from'@capawesome/capacitor-file-picker';
import{useGame}from'../store/GameContext';
import{applySaveImport,createSaveExport,validateSaveExport}from'../utils/storage';

const RESET_WORD='REINITIALISER';
const decodeBase64Utf8=value=>{const binary=atob(value),bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));return new TextDecoder('utf-8').decode(bytes)};

export default function SettingsPage(){
  const{summonerProfile,summonerXpRequired}=useGame();
  const[step,setStep]=useState(0); const PREF_KEY='azerune-summon-preferences-v1'; const readPrefs=()=>{try{return{confirmMultiSummon:true,reducedAnimations:false,...JSON.parse(localStorage.getItem(PREF_KEY)||'{}')}}catch{return{confirmMultiSummon:true,reducedAnimations:false}}}; const[summonPrefs,setSummonPrefs]=useState(readPrefs); const updateSummonPref=(key,value)=>{const next={...summonPrefs,[key]:value};setSummonPrefs(next);localStorage.setItem(PREF_KEY,JSON.stringify(next))};
  const[input,setInput]=useState('');
  const[error,setError]=useState('');
  const fileInputRef=useRef(null);
  const[saveMessage,setSaveMessage]=useState(null);
  const[pendingImport,setPendingImport]=useState(null);

  const cancel=()=>{setStep(0);setInput('');setError('')};
  const maxed=summonerProfile.level>=60,required=maxed?1:summonerXpRequired(summonerProfile.level),percent=maxed?100:Math.min(100,summonerProfile.xp/required*100),remaining=maxed?0:Math.max(0,required-summonerProfile.xp);
  const exportSave=async()=>{
    try{
      const payload=createSaveExport(),data=JSON.stringify(payload,null,2),timestamp=new Date().toISOString().slice(0,10),fileName=`azerune-save-${timestamp}.json`;
      if(Capacitor.isNativePlatform()){
        const written=await Filesystem.writeFile({path:fileName,data,directory:Directory.Cache,encoding:Encoding.UTF8,recursive:true});
        const uri=written.uri||(await Filesystem.getUri({path:fileName,directory:Directory.Cache})).uri;
        await Share.share({title:'Sauvegarde Azerune',text:'Sauvegarde Azerune à conserver ou transférer vers un autre appareil.',files:[uri],dialogTitle:'Exporter la sauvegarde Azerune'});
        setSaveMessage({type:'success',text:'Sauvegarde créée. Choisis une application pour la conserver ou la partager.'});
        return;
      }
      const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=fileName;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      setSaveMessage({type:'success',text:'Sauvegarde exportée avec succès.'});
    }catch(error){console.error('Export de sauvegarde impossible',error);setSaveMessage({type:'error',text:'Impossible d’exporter la sauvegarde.'});}
  };
  const prepareImport=(parsed,fileName)=>{
    const validation=validateSaveExport(parsed);
    if(!validation.ok){setPendingImport(null);setSaveMessage({type:'error',text:validation.message});return;}
    setPendingImport({payload:parsed,fileName,exportedAt:parsed.exportedAt});setSaveMessage(null);
  };
  const openImportPicker=async()=>{
    if(!Capacitor.isNativePlatform()){fileInputRef.current?.click();return;}
    try{
      const result=await FilePicker.pickFiles({types:['application/json','text/json','text/plain'],limit:1,readData:true}),file=result.files?.[0];
      if(!file)return;
      if(!String(file.name||'').toLowerCase().endsWith('.json')){setSaveMessage({type:'error',text:'Choisis un fichier de sauvegarde Azerune au format JSON.'});return;}
      if(!file.data)throw new Error('Le sélecteur Android n’a renvoyé aucune donnée.');
      prepareImport(JSON.parse(decodeBase64Utf8(file.data)),file.name||'sauvegarde.json');
    }catch(error){
      const cancelled=/cancel/i.test(String(error?.message||error));if(cancelled)return;
      console.error('Import de sauvegarde impossible',error);setPendingImport(null);setSaveMessage({type:'error',text:'Le fichier JSON est illisible, endommagé ou inaccessible.'});
    }
  };
  const selectImportFile=async event=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    if(!file.name.toLowerCase().endsWith('.json')){setSaveMessage({type:'error',text:'Choisis un fichier de sauvegarde au format JSON.'});return;}
    try{prepareImport(JSON.parse(await file.text()),file.name);}
    catch{setPendingImport(null);setSaveMessage({type:'error',text:'Le fichier JSON est illisible ou endommagé.'});}
  };
  const confirmImport=()=>{
    if(!pendingImport)return;
    const result=applySaveImport(pendingImport.payload);
    if(!result.ok){setSaveMessage({type:'error',text:result.message});setPendingImport(null);return;}
    setSaveMessage({type:'success',text:'Sauvegarde importée. Rechargement du jeu...'});
    setPendingImport(null);
    window.setTimeout(()=>window.location.reload(),350);
  };

  const resetProgress=()=>{
    if(input.trim().toUpperCase()!==RESET_WORD){
      setError(`Écris exactement ${RESET_WORD} pour confirmer.`);
      return;
    }
    localStorage.removeItem('azerune-save');
    localStorage.removeItem('azerune-save-daily');
    localStorage.removeItem('azerune-tutorial-completed-v1');
    sessionStorage.clear();
    window.location.reload();
  };

  return <section className="polished-settings">
    <div className="settings-heading">
      <div><h2>⚙️ Paramètres</h2><p>Gère le profil et les données enregistrées dans ce navigateur.</p></div>
      <div className="settings-profile-card"><div className="settings-profile-orb">🔮</div><div className="settings-profile-main"><div className="settings-profile-identity"><div><b>{summonerProfile.name||'Nouvel Invocateur'}</b><small>Invocateur d’Azerune</small></div><span>Niveau {summonerProfile.level}</span></div><div className={`settings-xp-bar ${maxed?'maxed':''}`}><i style={{width:`${percent}%`}}/><strong>{maxed?'NIVEAU MAXIMUM':`${summonerProfile.xp} / ${required} XP`}</strong></div><div className="settings-xp-details"><b>{Math.round(percent)} %</b><small>{maxed?'Progression terminée':`${remaining} XP avant le niveau ${summonerProfile.level+1}`}</small></div></div></div>
    </div>

    <article className="settings-card save-management-card">
      <div className="settings-icon">💾</div>
      <div className="save-management-content">
        <h3>Gestion de la sauvegarde</h3>
        <p>La progression est enregistrée automatiquement dans ce navigateur. Exporte-la pour la conserver ou la transférer vers un autre appareil.</p>
        <small>L’importation remplace la progression actuelle uniquement après validation complète du fichier.</small>
        <div className="save-management-actions">
          <button type="button" className="secondary" onClick={exportSave}>Exporter la sauvegarde</button>
          <button type="button" onClick={openImportPicker}>Importer une sauvegarde</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={selectImportFile} hidden/>
        </div>
        {saveMessage&&<p className={`save-message ${saveMessage.type}`} role="status">{saveMessage.text}</p>}
        {pendingImport&&<div className="save-import-confirmation">
          <h4>Remplacer la sauvegarde actuelle ?</h4>
          <p>Le fichier <b>{pendingImport.fileName}</b> est valide. La progression actuelle de ce navigateur sera remplacée.</p>
          {pendingImport.exportedAt&&<small>Export créé le {new Date(pendingImport.exportedAt).toLocaleString('fr-FR')}.</small>}
          <div className="save-management-actions">
            <button type="button" className="secondary" onClick={()=>setPendingImport(null)}>Annuler</button>
            <button type="button" className="danger" onClick={confirmImport}>Importer et remplacer</button>
          </div>
        </div>}
      </div>
    </article>

    <article className="summon-protection-settings"><span>🔥</span><div><h3>Protection des invocations</h3><p>Contrôle la confirmation x10 et le rythme des révélations.</p><label><input type="checkbox" checked={summonPrefs.confirmMultiSummon} onChange={e=>updateSummonPref('confirmMultiSummon',e.target.checked)}/> Demander une confirmation avant chaque invocation x10</label><label><input type="checkbox" checked={summonPrefs.reducedAnimations} onChange={e=>updateSummonPref('reducedAnimations',e.target.checked)}/> Réduire les animations d’invocation</label></div></article><article className="danger-zone">
      <div className="danger-zone-header"><div className="settings-icon">⚠️</div><div><h3>Zone dangereuse</h3><p>La réinitialisation est définitive et ne peut pas être annulée.</p></div></div>

      {step===0&&<button className="reset-progress-button" onClick={()=>setStep(1)}>Réinitialiser la progression</button>}

      {step===1&&<div className="reset-confirmation">
        <h4>Première confirmation</h4>
        <p>Cette action supprimera le profil de <b>{summonerProfile.name}</b> et toutes les données du jeu sur ce navigateur.</p>
        <ul>
          <li>Nom, niveau et XP d’Invocateur</li>
          <li>Champions, niveaux, étoiles et Fragments d’âme</li>
          <li>Ressources, pity, équipe et équipement</li>
          <li>Campagne, quêtes et récompenses</li>
          <li>Historique, codes utilisés et tutoriel</li>
        </ul>
        <div className="reset-actions"><button className="secondary" onClick={cancel}>Annuler</button><button className="danger" onClick={()=>setStep(2)}>Je comprends, continuer</button></div>
      </div>}

      {step===2&&<div className="reset-confirmation final-step">
        <h4>Confirmation finale</h4>
        <p>Écris <code>{RESET_WORD}</code> pour autoriser l’effacement définitif.</p>
        <input value={input} onChange={event=>{setInput(event.target.value);setError('')}} placeholder={RESET_WORD} autoComplete="off"/>
        {error&&<p className="reset-error">{error}</p>}
        <div className="reset-actions"><button className="secondary" onClick={cancel}>Annuler</button><button className="danger" disabled={input.trim().toUpperCase()!==RESET_WORD} onClick={resetProgress}>Effacer définitivement</button></div>
      </div>}
    </article>
  </section>;
}
