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
// L'atlas généré et les feuilles de champion vivent côte à côte. Les secondes
// viennent de vrais dessins : elles arrivent à leur taille native, chaque
// rangée à SON échelle, et c'est le rendu qui les remet d'aplomb. Rien n'est
// rééchantillonné en amont — redimensionner du pixel art le détruit.
const chargerAtlas=()=>{
  if(atlasPromis)return atlasPromis;
  atlasPromis=(async()=>{
    const atlas=await fetch('/sprites/atlas.json').then(r=>r.json());
    Object.values(atlas.feuilles).forEach(def=>{def.zoomBase=ZOOM;def.echelles={};});
    try{
      const index=await fetch('/sprites/champions/index.json').then(r=>r.ok?r.json():{});
      const fiches=await Promise.all(Object.entries(index).map(async([heroId,e])=>
        [heroId,e,await fetch(e.description).then(r=>r.json())]));
      atlas.champions={};
      fiches.forEach(([heroId,e,fiche])=>{
        atlas.feuilles[e.nom]={fichier:e.fichier,cadres:fiche.cadres,
          echelles:fiche.echelles,zoomBase:1};
        atlas.champions[heroId]=e.nom;
      });
    }catch{
      // Pas de feuilles de champion : on tourne avec les sprites générés.
      atlas.champions={};
    }
    return atlas;
  })();
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
  const fiche={jeux,echelles:def.echelles||{},zoomBase:def.zoomBase||ZOOM};
  cache.set(nom,fiche);
  return fiche;
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
    const places=[];
    for(const cote of['allie','ennemi']){
      const groupe=cotes[cote];
      for(let i=0;i<groupe.length;i+=1){
        const u=groupe[i];
        const{jeux,echelles,zoomBase}=await texturesDe(atlas,u.feuille);
        const noeud=new Container();
        const ombre=new Graphics();
        const sprite=new AnimatedSprite(jeux.repos);
        sprite.anchor.set(.5,1);
        sprite.animationSpeed=VITESSE.repos;
        sprite.play();
        const hauteur=Math.round((jeux.repos[0]?.height||atlas.taille)*zoomBase*(echelles.repos||1));
        const barre=new Graphics();
        const nom=new Text({text:u.nom,style:{fontFamily:'Georgia, serif',fontSize:12,
          fill:cote==='allie'?0xead7a0:0xe0b8a8,stroke:{color:0x100c09,width:3}}});
        nom.anchor.set(.5,1);
        nom.y=-hauteur-16;
        noeud.addChild(ombre,sprite,barre,nom);
        // Les alliés au premier plan à gauche, les ennemis en retrait à droite :
        // la profondeur vient de l'écart vertical, pas d'une vraie perspective.
        noeud.y=sol+8+i*10;
        scene.addChild(noeud);
        ombre.ellipse(0,0,hauteur*.22,hauteur*.07).fill({color:0x000000,alpha:.42});
        const etat={id:u.id,cote,noeud,sprite,barre,jeux,echelles,zoomBase,hauteur,
          base:{x:0,y:noeud.y},mort:false};
        unites.set(u.id,etat);
        appliquerEchelle(etat,'repos');
        pv(u.id,1);
        places.push(etat);
      }
    }
    // Placement en second passage : la largeur d'un sprite n'est connue qu'une
    // fois sa texture posée, et une feuille dessinée est trois fois plus large
    // qu'un sprite généré. Répartir « tous les 96 px » faisait passer un
    // champion derrière son voisin.
    ['allie','ennemi'].forEach(cote=>{
      const groupe=places.filter(e=>e.cote===cote);
      if(!groupe.length)return;
      const larges=groupe.map(e=>Math.abs(e.sprite.width));
      const dispo=app.screen.width/2-24;
      const total=larges.reduce((s,l)=>s+l,0);
      // On resserre si besoin, jamais au point de superposer les visages.
      const serre=Math.min(1,dispo/Math.max(1,total))*0.94;
      let curseur=0;
      groupe.forEach((e,i)=>{
        const l=larges[i]*serre;
        const depuisBord=24+curseur+l/2;
        e.noeud.x=cote==='allie'?depuisBord:app.screen.width-depuisBord;
        e.base.x=e.noeud.x;
        curseur+=l;
      });
    });
    // Devant/derrière selon la profondeur, sinon les unités du fond passent devant.
    scene.children.sort((a,b)=>a.y-b.y);
  }

  // Chaque rangée d'une feuille de champion a sa propre échelle. Sans ce
  // recalage à chaque changement d'animation, le champion grandit en attaquant.
  function appliquerEchelle(e,anim){
    const k=e.zoomBase*(e.echelles[anim]??1);
    e.sprite.scale.set(e.cote==='allie'?k:-k,k);   // l'ennemi regarde vers nous
  }

  function animer(id,anim,{boucle=false}={}){
    const e=unites.get(id);
    if(!e||!e.jeux[anim])return;
    e.sprite.textures=e.jeux[anim];
    appliquerEchelle(e,anim);
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
    const l=Math.max(34,e.hauteur*.5),part=Math.max(0,Math.min(1,ratio));
    e.barre.clear();
    e.barre.rect(-l/2-1,-e.hauteur-13,l+2,7).fill({color:0x100c09});
    e.barre.rect(-l/2,-e.hauteur-12,l*part,5)
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
    t.y=e.noeud.y-e.hauteur*.6;
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
    feuillePour:heroId=>atlas.champions?.[String(heroId)]||null,
    ips:()=>Math.round(app.ticker.FPS),
    detruire(){encours.forEach(b=>app.ticker.remove(b));encours.clear();
      app.destroy(true,{children:true});},
  };
}
