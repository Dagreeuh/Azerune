export const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch{return d}};
export const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
export const day=()=>new Date().toLocaleDateString('fr-CA');

export const AZERUNE_SAVE_FORMAT=1;
export const AZERUNE_SAVE_KEYS=['azerune-save','azerune-save-daily','azerune-tutorial-completed-v1','azerune-summon-preferences-v1'];

const readJsonKey=key=>{
  const raw=localStorage.getItem(key);
  if(raw===null)return null;
  try{return JSON.parse(raw)}catch{return raw}
};

export const createSaveExport=()=>({
  game:'azerune',
  format:AZERUNE_SAVE_FORMAT,
  exportedAt:new Date().toISOString(),
  data:Object.fromEntries(AZERUNE_SAVE_KEYS.map(key=>[key,readJsonKey(key)]))
});

export const validateSaveExport=value=>{
  if(!value||typeof value!=='object'||Array.isArray(value))return{ok:false,message:'Le fichier sélectionné ne contient pas une sauvegarde valide.'};
  if(value.game!=='azerune')return{ok:false,message:'Ce fichier ne provient pas d’Azerune.'};
  if(value.format!==AZERUNE_SAVE_FORMAT)return{ok:false,message:`Format de sauvegarde incompatible (${value.format??'inconnu'}).`};
  if(!value.data||typeof value.data!=='object'||Array.isArray(value.data))return{ok:false,message:'Les données de sauvegarde sont absentes ou endommagées.'};
  const main=value.data['azerune-save'];
  if(!main||typeof main!=='object'||Array.isArray(main))return{ok:false,message:'La progression principale est absente ou invalide.'};
  return{ok:true};
};

export const applySaveImport=value=>{
  const validation=validateSaveExport(value);
  if(!validation.ok)return validation;
  const backup=Object.fromEntries(AZERUNE_SAVE_KEYS.map(key=>[key,localStorage.getItem(key)]));
  try{
    AZERUNE_SAVE_KEYS.forEach(key=>{
      const imported=value.data[key];
      if(imported===undefined||imported===null)localStorage.removeItem(key);
      else localStorage.setItem(key,JSON.stringify(imported));
    });
    sessionStorage.clear();
    return{ok:true};
  }catch(error){
    Object.entries(backup).forEach(([key,raw])=>raw===null?localStorage.removeItem(key):localStorage.setItem(key,raw));
    return{ok:false,message:'L’importation a échoué. La sauvegarde précédente a été restaurée.'};
  }
};
