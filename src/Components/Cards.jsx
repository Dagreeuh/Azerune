import React from'react';
import{elementMeta}from'../utils/elements'; import{championIdentity}from'../data/championIdentities';
export function Bar({v,max,color='green'}){return <div className="bar"><i style={{width:`${Math.max(0,Math.min(100,v/max*100))}%`,background:color}}/></div>}
export function HeroCard({hero,selected,onClick,locked=false,owned=false,progress}){
  const fragments=Number(progress?.soulFragments||0),resonance=Number(progress?.resonance||0),element=elementMeta(hero.element),identity=championIdentity(hero);
  return <button className={`card element-card ${Number(progress?.resonance||0)>=5?'resonance-perfect-card':''} element-${element.name.toLowerCase()} ${selected?'selected-card':''} ${owned?'owned-card':'unowned-card'}`} style={{'--element-color':element.color}} onClick={onClick}>
    <b className="emoji">{locked?'❔':hero.icon}</b>
    <strong>{locked?'Inconnu':hero.name}</strong>
    <span className="card-natural-rarity">{'★'.repeat(hero.rarity)}</span>
    <small>{hero.role}</small><em className="card-identity">{identity.icon} {identity.title}</em><span className="element-badge" style={{'--element-color':element.color}}>{element.icon} {element.name}</span>
    {owned&&<><span className="card-resonance">✦ Résonance {resonance}/5</span><span className="card-soul-fragments">🧩 {fragments} Fragment{fragments>1?'s':''} d’âme</span></>}
    {!owned&&!locked&&<em className="card-unowned-label">Non possédé</em>}
  </button>;
}
export function Stats({s,base,progressed=base}){
  const labels={hp:'PV',atk:'Attaque',def:'Défense',spd:'Vitesse',crit:'Critique',critDamage:'Dégâts critiques',accuracy:'Précision',resistance:'Résistance'};
  const order=['hp','atk','def','spd','crit','critDamage','accuracy','resistance'];
  const percentStats=new Set(['crit','critDamage','accuracy','resistance']);
  return <div className="stats">{order.filter(key=>Number.isFinite(s?.[key])).map(key=>{
    const value=s[key],baseValue=base?.[key]||0,progressedValue=progressed?.[key]??baseValue;
    const progressionBonus=Math.max(0,progressedValue-baseValue),equipmentBonus=Math.max(0,value-progressedValue),suffix=percentStats.has(key)?' %':'';
    return <div key={key} className={`stat-cell stat-${key}`}><small>{labels[key]}</small><b>{value}{suffix}</b>{progressionBonus>0&&<em className="progression-bonus">+{progressionBonus}{suffix} progression</em>}{equipmentBonus>0&&<em className="equipment-bonus">+{equipmentBonus}{suffix} équipement</em>}</div>;
  })}</div>;
}
