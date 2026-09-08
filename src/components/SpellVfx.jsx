import React from'react';
import{vfxForEvent}from'../data/spellVfx';

/**
 * Couche d'effets d'un sort, posee sur l'unite touchee.
 *
 * Tout est en CSS : aucune dependance, aucun canvas, aucune boucle
 * d'animation en JavaScript. Les couches sont des elements vides que les
 * keyframes animent, et les couleurs arrivent par variables CSS — le meme
 * archetype sert donc a six elements sans dupliquer une seule regle.
 */
export default function SpellVfx({events=[],enabled=true}){
  if(!enabled||!events.length)return null;
  // Un seul effet par unite : deux sorts simultanes sur la meme cible se
  // masqueraient l'un l'autre et brouilleraient la lecture du combat.
  const principal=events[events.length-1];
  const vfx=vfxForEvent(principal);
  return <span className={`spell-vfx vfx-${vfx.id} impact-${vfx.impact}`} aria-hidden="true"
    style={{'--vfx-core':vfx.palette.core,'--vfx-trail':vfx.palette.trail,'--vfx-glow':vfx.palette.glow,
      '--vfx-intensity':vfx.intensity,'--vfx-duration':`${vfx.duration}ms`}}>
    {vfx.layers.map(layer=><i key={layer} className={`vfx-layer vfx-${layer}`}/>)}
    <i className="vfx-impact"/>
  </span>;
}
