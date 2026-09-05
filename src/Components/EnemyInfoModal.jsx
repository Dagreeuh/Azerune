import React,{useEffect}from'react';
import{elementMeta}from'../utils/elements';

const ROLE_LABELS={assaulter:'Assaillant régional',support:'Soutien régional',controller:'Contrôleur régional',
  boss:'Boss','forge-golem':'Boss mécanique',treasurer:'Boss défensif',ancient:'Esprit croissant',
  ember:'Mécanique prioritaire',priest:'Soigneur',guardian:'Protecteur',thief:'Attaquant rapide',guard:'Protecteur',
  'time-spirit':'Contrôle de jauge','offense-crystal':'Cristal offensif','defense-crystal':'Cristal défensif','healing-crystal':'Cristal régénérant'
};
const ROLE_DETAILS={
  boss:'Boss principal de la rencontre.','forge-golem':'Renforcé tant que ses cristaux restent actifs.',treasurer:'Les gardes augmentent sa Défense.',
  ember:'Sa mort retire 4 charges au Cœur incandescent.',priest:'Soigne Rhazakar et augmente son Attaque.',guardian:'Provoque l’équipe et protège les serviteurs.',
  thief:'Doit être éliminé rapidement pour sécuriser le butin.',guard:'Augmente la Défense du Trésorier.',ancient:'Gagne progressivement de l’Attaque.',
  'time-spirit':'Réduit la jauge d’action de toute l’équipe.','offense-crystal':'Augmente l’Attaque du Golem astral.',
  'defense-crystal':'Augmente la Défense du Golem astral.','healing-crystal':'Rend des PV au Golem astral.',assaulter:'Attaquant associé à la mécanique régionale.',support:'Soutien qui soigne, purifie ou protège.',controller:'Contrôleur qui perturbe le rythme de l’escouade.'
};
const roleKey=enemy=>enemy.raidRole||enemy.expeditionRole||enemy.campaignRole||(enemy.bossUnit?'boss':'enemy');
const fallbackRole=enemy=>enemy.bossUnit?'Boss':enemy.hp>=enemy.atk*7?'Défenseur':enemy.spd>=115?'Attaquant rapide':enemy.atk>=enemy.def*2?'Attaquant':'Soutien';

export default function EnemyInfoModal({title,subtitle,enemies,onClose,note}){
  useEffect(()=>{const close=event=>event.key==='Escape'&&onClose();window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[onClose]);
  if(!enemies)return null;
  return <div className="enemy-info-backdrop" onClick={onClose}><div className="enemy-info-modal" role="dialog" aria-modal="true" aria-labelledby="enemy-info-title" onClick={event=>event.stopPropagation()}>
    <div className="enemy-info-heading"><div><small>{subtitle}</small><h3 id="enemy-info-title">{title}</h3><p>Composition et statistiques adaptées au niveau sélectionné.</p></div><button className="enemy-info-close" onClick={onClose}>✕</button></div>
    <div className="enemy-info-grid">{enemies.map((enemy,index)=>{const element=elementMeta(enemy.element),key=roleKey(enemy),role=ROLE_LABELS[key]||fallbackRole(enemy),detail=ROLE_DETAILS[key];return <article key={`${enemy.id||enemy.name}-${index}`} className={`enemy-info-card ${enemy.bossUnit?'boss-card':''}`} style={{'--enemy-element':element.color}}><div className="enemy-info-identity"><span>{enemy.icon}</span><div><b>{enemy.name}</b><small>{role}</small></div>{enemy.bossUnit&&<em>BOSS</em>}</div><span className="enemy-element-badge" style={{'--enemy-element':element.color}}>{element.icon} {element.name}</span>{detail&&<p className="enemy-role-detail">{detail}</p>}<div className="enemy-stat-grid"><span><small>PV</small><b>{enemy.hp}</b></span><span><small>ATQ</small><b>{enemy.atk}</b></span><span><small>DEF</small><b>{enemy.def}</b></span><span><small>VIT</small><b>{enemy.spd}</b></span><span><small>PRÉC.</small><b>{enemy.accuracy}</b></span><span><small>RÉS.</small><b>{enemy.resistance}</b></span></div></article>})}</div>
    <div className="enemy-info-footer"><small>{note}</small><button onClick={onClose}>Fermer</button></div>
  </div></div>;
}
