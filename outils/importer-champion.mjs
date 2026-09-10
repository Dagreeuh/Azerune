// Transforme une feuille de personnage en atlas de jeu.
//
// Principe directeur : NE JAMAIS RÉÉCHANTILLONNER L'ART. Les rangées d'une
// feuille sont dessinées à des échelles différentes (l'idle ici fait deux fois
// la taille de l'attaque). Redimensionner les cadres pour les uniformiser
// détruirait le pixel art. On garde donc chaque cadre à sa taille native et on
// enregistre un facteur d'échelle PAR ANIMATION, que le rendu applique au
// moment d'afficher — le GPU s'en charge, en filtrage au plus proche voisin.
import fs from'node:fs';
import path from'node:path';
import{decoderPNG,encoderPNG}from'./png.mjs';

const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const SEUIL=34,MIN=600,MINH=52,HORS=2.6;

const img=decoderPNG(fs.readFileSync(config.source));
const{largeur:L,hauteur:H,px}=img;
const lum=i=>Math.max(px[i*4],px[i*4+1],px[i*4+2]);

// Détourage : remplissage du fond depuis les bords (un noir enfermé survit).
const fond=new Uint8Array(L*H),file=[];
const pousser=i=>{if(!fond[i]&&lum(i)<=SEUIL){fond[i]=1;file.push(i)}};
for(let x=0;x<L;x+=1){pousser(x);pousser((H-1)*L+x)}
for(let y=0;y<H;y+=1){pousser(y*L);pousser(y*L+L-1)}
while(file.length){const i=file.pop(),x=i%L,y=(i/L)|0;
  if(x>0)pousser(i-1);if(x<L-1)pousser(i+1);if(y>0)pousser(i-L);if(y<H-1)pousser(i+L)}

// Îlots
const vu=new Uint8Array(L*H),ilots=[];
for(let d=0;d<L*H;d+=1){
  if(fond[d]||vu[d])continue;
  let x0=L,x1=-1,y0=H,y1=-1,aire=0;const pile=[d];vu[d]=1;
  while(pile.length){
    const i=pile.pop(),x=i%L,y=(i/L)|0;aire+=1;
    if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
    for(let dy=-1;dy<=1;dy+=1)for(let dx=-1;dx<=1;dx+=1){
      const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=L||ny>=H)continue;
      const j=ny*L+nx;if(fond[j]||vu[j])continue;vu[j]=1;pile.push(j)}
  }
  if(aire>=MIN)ilots.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1});
}
const cadres=ilots.filter(b=>b.h>=MINH);
const hauteurs=cadres.map(b=>b.h).sort((a,b)=>a-b);
const mediane=hauteurs[hauteurs.length>>1]||1;
const normaux=cadres.filter(b=>b.h<=mediane*HORS);
normaux.sort((a,b)=>(a.y+a.h/2)-(b.y+b.h/2));
const rangees=[];
normaux.forEach(b=>{
  const centre=b.y+b.h/2;
  const r=rangees.find(r=>Math.abs(r.centre-centre)<Math.max(b.h,r.hauteur)*.45);
  if(r){r.cadres.push(b);r.centre=r.cadres.reduce((s,c)=>s+c.y+c.h/2,0)/r.cadres.length;
    r.hauteur=Math.max(r.hauteur,b.h)}
  else rangees.push({centre,hauteur:b.h,cadres:[b]});
});
rangees.sort((a,b)=>a.centre-b.centre);
rangees.forEach(r=>r.cadres.sort((a,b)=>a.x-b.x));

// Un cadre extrait : fond rendu transparent, puis rogné au contenu réel pour
// que l'alignement se fasse sur le personnage et non sur la boîte détectée.
function extraire(b){
  const out=Buffer.alloc(b.w*b.h*4);
  let x0=b.w,x1=-1,y0=b.h,y1=-1;
  for(let y=0;y<b.h;y+=1)for(let x=0;x<b.w;x+=1){
    const s=((b.y+y)*L+(b.x+x)),d=(y*b.w+x)*4;
    if(fond[s])continue;
    out[d]=px[s*4];out[d+1]=px[s*4+1];out[d+2]=px[s*4+2];out[d+3]=255;
    if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
  }
  const w=x1-x0+1,h=y1-y0+1,rogne=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y+=1)out.copy(rogne,y*w*4,((y+y0)*b.w+x0)*4,((y+y0)*b.w+x0+w)*4);
  return{w,h,px:rogne};
}

// Sélection des cadres par animation
const jeux=config.animations.map(a=>{
  const r=rangees[a.rangee];
  if(!r)throw new Error(`rangée ${a.rangee} absente (${rangees.length} détectées)`);
  const choisis=r.cadres.filter(b=>(a.xMin==null||b.x>=a.xMin)&&(a.xMax==null||b.x<a.xMax)
    &&(a.minLargeur==null||b.w>=a.minLargeur));
  if(!choisis.length)throw new Error(`aucun cadre pour « ${a.nom} »`);
  return{nom:a.nom,echelle:a.echelle,images:choisis.map(extraire)};
});

// Composition : une bande par animation, empilées. Chaque cadre garde sa taille
// native ; on note seulement où il se trouve.
const largeurBande=jeux.map(j=>j.images.reduce((s,i)=>s+i.w+2,0));
const LARGEUR=Math.max(...largeurBande);
const hauteurs2=jeux.map(j=>Math.max(...j.images.map(i=>i.h))+2);
const HAUTEUR=hauteurs2.reduce((s,h)=>s+h,0);
const feuille=Buffer.alloc(LARGEUR*HAUTEUR*4);
const atlasCadres={},echelles={};
let oy=0;
jeux.forEach((j,n)=>{
  let ox=0;
  atlasCadres[j.nom]=j.images.map(im=>{
    for(let y=0;y<im.h;y+=1)
      im.px.copy(feuille,((oy+y)*LARGEUR+ox)*4,y*im.w*4,(y+1)*im.w*4);
    const c={x:ox,y:oy,w:im.w,h:im.h};
    ox+=im.w+2;
    return c;
  });
  // Le facteur d'échelle vient de la hauteur du PERSONNAGE dans cette rangée,
  // pas de la boîte : c'est lui qui doit rester constant d'une animation à
  // l'autre, sinon le champion grandit et rétrécit en combattant.
  // Une icône de sort, un totem ou une particule ne sont pas des personnages :
  // les ramener à la hauteur du champion n'aurait aucun sens. La config peut
  // donc fixer l'échelle directement.
  const haut=Math.max(...j.images.map(i=>i.h));
  echelles[j.nom]=j.echelle!=null?j.echelle:Number((config.hauteurCible/haut).toFixed(4));
  oy+=hauteurs2[n];
});

const nom=config.champion.toLowerCase();
fs.mkdirSync('public/sprites/champions',{recursive:true});
fs.writeFileSync(`public/sprites/champions/${nom}.png`,encoderPNG(LARGEUR,HAUTEUR,feuille));
const meta={champion:config.champion,heroId:config.heroId,
  fichier:`/sprites/champions/${nom}.png`,hauteurCible:config.hauteurCible,
  cadres:atlasCadres,echelles};
fs.writeFileSync(`public/sprites/champions/${nom}.json`,JSON.stringify(meta,null,1));
const indexChemin='public/sprites/champions/index.json';
const index=fs.existsSync(indexChemin)?JSON.parse(fs.readFileSync(indexChemin,'utf8')):{};
index[config.heroId]={nom,fichier:meta.fichier,description:`/sprites/champions/${nom}.json`};
fs.writeFileSync(indexChemin,JSON.stringify(index,null,1));

console.log(`${config.champion} — feuille ${LARGEUR}×${HAUTEUR}`);
jeux.forEach(j=>console.log(`  ${j.nom.padEnd(9)} ${String(j.images.length).padStart(2)} cadres · échelle ×${echelles[j.nom]}`));
