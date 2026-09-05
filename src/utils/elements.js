export const ELEMENTS={
  Feu:{icon:'🔥',color:'#f97316'},Nature:{icon:'🌿',color:'#22c55e'},Eau:{icon:'💧',color:'#38bdf8'},
  Arcane:{icon:'🔮',color:'#a855f7'},Ombre:{icon:'🌑',color:'#64748b'},Lumière:{icon:'✨',color:'#facc15'}
};
const ADVANTAGE={Feu:'Nature',Nature:'Eau',Eau:'Feu',Arcane:'Ombre',Ombre:'Lumière',Lumière:'Arcane'};
export function normalizeElement(value){if(value==='Terre'||value==='Vent')return'Nature';return ELEMENTS[value]?value:'Arcane'}
export function elementMeta(value){const name=normalizeElement(value);return{name,...ELEMENTS[name]}}
export function affinity(attacker,defender){
  const from=normalizeElement(attacker),to=normalizeElement(defender);
  if(ADVANTAGE[from]===to)return{key:'effective',label:'EFFICACE',icon:'▲',damage:1.30,effect:.15,color:'#4ade80'};
  if(ADVANTAGE[to]===from)return{key:'weak',label:'INEFFICACE',icon:'▼',damage:.75,effect:-.15,color:'#f87171'};
  return{key:'neutral',label:'NEUTRE',icon:'●',damage:1,effect:0,color:'#94a3b8'};
}
export function areaAffinity(attacker,targets=[]){
  const counts={effective:0,neutral:0,weak:0};targets.forEach(target=>counts[affinity(attacker,target.element).key]++);
  return counts;
}

export const ELEMENT_CYCLES=[['Feu','Nature','Eau','Feu'],['Arcane','Ombre','Lumière','Arcane']];
