// Arène pixel art rendue par PixiJS (WebGL).
//
// Ce module ne connaît RIEN du moteur de combat ni de React : on lui décrit des
// unités, on lui demande de jouer une animation, d'afficher un chiffre, de
// bouger une barre de vie. C'est volontaire — le moteur de jeu reste la seule
// vérité, l'arène n'est qu'une vitrine. Le jour où de vrais assets remplacent
// les sprites générés, seul `atlas.json` change.
import{Application,Assets,Texture,Rectangle,AnimatedSprite,Container,Graphics,Text}from'pixi.js';

const ZOOM=3;                     // un pixel d'art = 3 pixels d'écran
const SOL=0.72;                   // hauteur du sol, en part de la scène

let atlasPromis=null;
const chargerAtlas=()=>{
  if(!atlasPromis)atlasPromis=fetch('/sprites/atlas.json').then(r=>r.json());
  return atlasPromis;
};

// Une feuille -> un jeu de textures par animation. Mise en cache : douze
// combats d'affilée ne doivent pas redécouper douze fois les mêmes PNG.
const cache=new Map();
async function texturesDe(atlas,nom){
  if(cache.has(nom))return cache.get(nom);
  const def=atlas.feuilles[nom];
  if(!def)throw new Error(`feuille inconnue : ${nom}`);
  const feuille=await Assets.load(def.fichier);
  feuille.source.scaleMode='nearest';       // net à l'agrandissement, jamais flou
  const jeux={};
  Object.entries(def.cadres).forEach(([anim,cadres])=>{
    jeux[anim]=cadres.map(c=>new Texture({source:feuille.source,frame:new Rectangle(c.x,c.y,c.w,c.h)}));
  });
  cache.set(nom,jeux);
  return jeux;
}

const VITESSE={repos:.09,attaque:.20,touche:.16,mort:.12};

export async function creerArene(conteneur,{largeur=640,hauteur=360}={}){
  const atlas=await chargerAtlas();
  const app=new Application();
  await app.init({width:largeur,height:hauteur,backgroundAlpha:0,antialias:false,autoDensity:true,
    resolution:Math.min(2,window.devicePixelRatio||1)});
  conteneur.appendChild(app.canvas);
  app.canvas.style.width='100%';
  app.canvas.style.height='auto';
  app.canvas.style.imageRendering='pixelated';

  const decor=new Graphics(),scene=new Container(),volants=new Container();
  app.stage.addChild(decor,scene,volants);

  const dessinerDecor=()=>{
    const sol=Math.round(app.screen.height*SOL);
    decor.clear();
    decor.rect(0,0,app.screen.width,sol).fill({color:0x141019});
    decor.rect(0,sol,app.screen.width,app.screen.height-sol).fill({color:0x241d16});
    decor.rect(0,sol,app.screen.width,2).fill({color:0x4a3c26});
    // Dalles, pour que le sol ne soit pas une bande morte.
    for(let x=-40;x<app.screen.width+40;x+=48)
      decor.rect(x,sol+2,2,app.screen.height-sol).fill({color:0x1b150f});
  };
  dessinerDecor();

  const unites=new Map();

  async function placer(liste){
    scene.removeChildren();
    unites.clear();
    const sol=Math.round(app.screen.height*SOL);
    const cotes={allie:liste.filter(u=>u.cote==='allie'),ennemi:liste.filter(u=>u.cote==='ennemi')};
    for(const cote of['allie','ennemi']){
      const groupe=cotes[cote];
      for(let i=0;i<groupe.length;i+=1){
        const u=groupe[i];
        const jeux=await texturesDe(atlas,u.feuille);
        const noeud=new Container();
        const ombre=new Graphics();
        ombre.ellipse(0,0,atlas.taille*ZOOM*.28,atlas.taille*ZOOM*.09).fill({color:0x000000,alpha:.42});
        const sprite=new AnimatedSprite(jeux.repos);
        sprite.anchor.set(.5,1);
        sprite.scale.set(cote==='allie'?ZOOM:-ZOOM,ZOOM);   // l'ennemi regarde vers nous
        sprite.animationSpeed=VITESSE.repos;
        sprite.play();
        const barre=new Graphics();
        const nom=new Text({text:u.nom,style:{fontFamily:'Georgia, serif',fontSize:12,
          fill:cote==='allie'?0xead7a0:0xe0b8a8,stroke:{color:0x100c09,width:3}}});
        nom.anchor.set(.5,1);
        nom.y=-atlas.taille*ZOOM-16;
        noeud.addChild(ombre,sprite,barre,nom);
        // Les alliés au premier plan à gauche, les ennemis en retrait à droite :
        // la profondeur vient de l'écart vertical, pas d'une vraie perspective.
        const pas=Math.min(96,(app.screen.width/2-40)/Math.max(1,groupe.length));
        noeud.x=cote==='allie'?60+i*pas:app.screen.width-60-i*pas;
        noeud.y=sol+8+(cote==='allie'?i*10:i*10);
        scene.addChild(noeud);
        const etat={id:u.id,cote,noeud,sprite,barre,jeux,base:{x:noeud.x,y:noeud.y},mort:false};
        unites.set(u.id,etat);
        pv(u.id,1);
      }
    }
    // Devant/derrière selon la profondeur, sinon les unités du fond passent devant.
    scene.children.sort((a,b)=>a.y-b.y);
  }

  function animer(id,anim,{boucle=false}={}){
    const e=unites.get(id);
    if(!e||!e.jeux[anim])return;
    e.sprite.textures=e.jeux[anim];
    e.sprite.animationSpeed=VITESSE[anim]||.12;
    e.sprite.loop=boucle;
    e.sprite.onComplete=boucle?null:()=>{if(!e.mort)animer(id,'repos',{boucle:true})};
    e.sprite.gotoAndPlay(0);
  }

  // Un pas vers la cible, un coup, un retour : c'est ce mouvement d'aller-retour
  // qui fait lire l'attaque, bien plus que les cadres du sprite.
  function frapper(id,cibleId){
    const e=unites.get(id),c=unites.get(cibleId);
    if(!e)return Promise.resolve();
    animer(id,'attaque');
    const depart=e.base.x,arrivee=c?depart+(c.noeud.x-depart)*.55:depart+(e.cote==='allie'?40:-40);
    return tween(t=>{e.noeud.x=depart+(arrivee-depart)*Math.sin(t*Math.PI);},380);
  }

  function toucher(id){const e=unites.get(id);if(!e||e.mort)return;animer(id,'touche');
    e.noeud.tint=0xffffff;
    tween(t=>{e.sprite.tint=t<.5?0xff8888:0xffffff;},220);}

  function mourir(id){const e=unites.get(id);if(!e||e.mort)return;e.mort=true;animer(id,'mort');
    e.sprite.onComplete=()=>{e.sprite.gotoAndStop(e.jeux.mort.length-1)};}

  function pv(id,ratio){
    const e=unites.get(id);
    if(!e)return;
    const l=atlas.taille*ZOOM*.62,part=Math.max(0,Math.min(1,ratio));
    e.barre.clear();
    e.barre.rect(-l/2-1,-atlas.taille*ZOOM-13,l+2,7).fill({color:0x100c09});
    e.barre.rect(-l/2,-atlas.taille*ZOOM-12,l*part,5)
      .fill({color:e.cote==='allie'?0x5a9e3f:0x8c2b1e});
  }

  // Chiffre flottant : il monte, ralentit, s'efface. Sans le ralentissement il
  // se lit comme une notification ; avec, comme un coup.
  function chiffre(id,texte,{couleur=0xf4d35e,taille=20}={}){
    const e=unites.get(id);
    if(!e)return;
    const t=new Text({text:texte,style:{fontFamily:'Georgia, serif',fontSize:taille,fontWeight:'bold',
      fill:couleur,stroke:{color:0x100c09,width:4}}});
    t.anchor.set(.5,1);
    t.x=e.noeud.x+(Math.random()*20-10);
    t.y=e.noeud.y-atlas.taille*ZOOM*.6;
    volants.addChild(t);
    const y0=t.y;
    tween(p=>{t.y=y0-46*(1-(1-p)**2);t.alpha=p<.7?1:1-(p-.7)/.3;},900)
      .then(()=>{t.destroy();});
  }

  const encours=new Set();
  function tween(pas,duree){
    return new Promise(resoudre=>{
      let ecoule=0;
      const boucle=ticker=>{
        ecoule+=ticker.deltaMS;
        const p=Math.min(1,ecoule/duree);
        pas(p);
        if(p>=1){app.ticker.remove(boucle);encours.delete(boucle);resoudre();}
      };
      encours.add(boucle);
      app.ticker.add(boucle);
    });
  }

  return{
    app,placer,animer,frapper,toucher,mourir,pv,chiffre,
    ips:()=>Math.round(app.ticker.FPS),
    detruire(){encours.forEach(b=>app.ticker.remove(b));encours.clear();
      app.destroy(true,{children:true});},
  };
}
