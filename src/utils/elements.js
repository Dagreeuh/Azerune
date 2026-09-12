export const ELEMENTS={
  Feu:{icon:'🔥',color:'#f97316'},Nature:{icon:'🌿',color:'#22c55e'},Eau:{icon:'💧',color:'#38bdf8'},
  Arcane:{icon:'🔮',color:'#a855f7'},Ombre:{icon:'🌑',color:'#64748b'},Lumière:{icon:'✨',color:'#facc15'}
};
const ADVANTAGE={Feu:'Nature',Nature:'Eau',Eau:'Feu',Arcane:'Ombre',Ombre:'Lumière',Lumière:'Arcane'};
export function normalizeElement(value){if(value==='Terre'||value==='Vent')return'Nature';return ELEMENTS[value]?value:'Arcane'}
export function elementMeta(value){const name=normalizeElement(value);return{name,...ELEMENTS[name]}}
const RELATIONS={
  effective:{key:'effective',label:'EFFICACE',icon:'▲',damage:1.30,effect:.15,color:'#4ade80'},
  weak:{key:'weak',label:'INEFFICACE',icon:'▼',damage:.75,effect:-.15,color:'#f87171'},
  neutral:{key:'neutral',label:'NEUTRE',icon:'●',damage:1,effect:0,color:'#94a3b8'}
};

/**
 * Poids de l'affinité selon la difficulté.
 *
 * En Normal, le mur doit être l'équipement et le niveau, pas la couleur : une
 * équipe correctement montée passe même sans l'affinité idéale. En Difficile,
 * puis surtout en Hardcore, la composition redevient déterminante.
 *
 * Hors campagne — raids, mythique, boss de monde, défis, arène — le poids
 * reste entier : ce sont des contenus de fin de parcours.
 */
export const POIDS_AFFINITE={normal:.45,hard:.80,hardcore:1};
export const poidsAffinite=difficulte=>POIDS_AFFINITE[difficulte]??1;

/**
 * La relation entre deux éléments, PONDÉRÉE par la difficulté.
 *
 * Le libellé, l'icône et la couleur ne changent jamais : « EFFICACE » reste
 * « EFFICACE ». Seule l'ampleur bouge — et comme l'interface lit ces mêmes
 * valeurs (voir `detailAffinite`), elle ne peut plus annoncer un chiffre que
 * le moteur n'applique pas.
 */
export function affinity(attacker,defender,difficulte){
  const from=normalizeElement(attacker),to=normalizeElement(defender);
  const base=ADVANTAGE[from]===to?RELATIONS.effective
    :ADVANTAGE[to]===from?RELATIONS.weak:RELATIONS.neutral;
  const poids=poidsAffinite(difficulte);
  return poids===1?{...base}
    :{...base,damage:1+(base.damage-1)*poids,effect:base.effect*poids};
}

/** Ce qu'une relation vaut, en toutes lettres. Jamais écrit en dur ailleurs. */
export const detailAffinite=relation=>{
  if(!relation)return '';
  const dgts=`Dégâts ×${relation.damage.toFixed(2).replace('.',',')}`;
  if(!relation.effect)return dgts;
  const pct=Math.round(relation.effect*100);
  return `${dgts} · Effets ${pct>0?'+':''}${pct} %`;
};
export function areaAffinity(attacker,targets=[]){
  const counts={effective:0,neutral:0,weak:0};targets.forEach(target=>counts[affinity(attacker,target.element).key]++);
  return counts;
}

export const ELEMENT_CYCLES=[['Feu','Nature','Eau','Feu'],['Arcane','Ombre','Lumière','Arcane']];
