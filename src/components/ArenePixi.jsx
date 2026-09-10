import React,{useEffect,useRef}from'react';

// Monture React de l'arène PixiJS : elle ne fait QUE créer le rendu, le rendre
// disponible et le détruire. Aucune logique de combat ne passe par ici — c'est
// ce qui permet de tester l'arène sans React et React sans WebGL.
export default function ArenePixi({largeur=640,hauteur=360,onPret,onPerdu}){
  const hote=useRef(null);
  useEffect(()=>{
    let arene=null,jete=false;
    (async()=>{
      try{
        const{creerArene}=await import('../pixi/arene');
        if(jete)return;
        arene=await creerArene(hote.current,{largeur,hauteur});
        if(jete){arene.detruire();return}
        onPret?.(arene);
      }catch(erreur){
        // WebGL peut manquer (vieux téléphone, navigateur bridé) : on le dit,
        // on ne laisse pas un cadre noir sans explication.
        onPerdu?.(erreur);
      }
    })();
    return()=>{jete=true;arene?.detruire();};
  },[largeur,hauteur]);
  return <div className="arene-pixi" ref={hote}/>;
}
