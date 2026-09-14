// Découpe une feuille de personnage en cadres exploitables.
//
// Les feuilles arrivent en disposition libre : un portrait en pied, des rangées
// d'animation, des effets, des vignettes. Rien n'est aligné sur une grille. On
// ne peut donc pas « couper tous les 64 pixels » — il faut trouver les îlots.
//
// Le fond est détouré par REMPLISSAGE DEPUIS LES BORDS, pas par un test de
// couleur global : un noir enfermé dans le personnage (contour, ombre, cuir)
// n'est jamais atteint par le remplissage, donc il survit. Un simple « tout ce
// qui est noir devient transparent » troue les silhouettes.
import fs from'node:fs';
import{decoderPNG,encoderPNG}from'./png.mjs';

const args=process.argv.slice(2);
const source=args[0];
const opt=(nom,defaut)=>{const i=args.indexOf(nom);return i>=0?Number(args[i+1]):defaut};
const SEUIL=opt('--seuil',34);       // luminance en dessous de laquelle un pixel est du fond
const MIN=opt('--min',600);          // aire minimale d'un îlot retenu
const apercu=args.includes('--apercu')?args[args.indexOf('--apercu')+1]:null;

const img=decoderPNG(fs.readFileSync(source));
const{largeur:L,hauteur:H,px}=img;
const lum=i=>Math.max(px[i*4],px[i*4+1],px[i*4+2]);

// --- 1. Le fond, par remplissage depuis les bords
const fond=new Uint8Array(L*H);
const file=[];
const pousser=i=>{if(!fond[i]&&lum(i)<=SEUIL){fond[i]=1;file.push(i)}};
for(let x=0;x<L;x+=1){pousser(x);pousser((H-1)*L+x)}
for(let y=0;y<H;y+=1){pousser(y*L);pousser(y*L+L-1)}
while(file.length){
  const i=file.pop(),x=i%L,y=(i/L)|0;
  if(x>0)pousser(i-1);
  if(x<L-1)pousser(i+1);
  if(y>0)pousser(i-L);
  if(y<H-1)pousser(i+L);
}

// --- 2. Les îlots, en 8-voisinage (une mèche de cheveux tient à un pixel)
const vu=new Uint8Array(L*H);
const ilots=[];
for(let d=0;d<L*H;d+=1){
  if(fond[d]||vu[d])continue;
  let x0=L,x1=-1,y0=H,y1=-1,aire=0;
  const pile=[d];vu[d]=1;
  while(pile.length){
    const i=pile.pop(),x=i%L,y=(i/L)|0;
    aire+=1;
    if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
    for(let dy=-1;dy<=1;dy+=1)for(let dx=-1;dx<=1;dx+=1){
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=L||ny>=H)continue;
      const j=ny*L+nx;
      if(fond[j]||vu[j])continue;
      vu[j]=1;pile.push(j);
    }
  }
  if(aire>=MIN)ilots.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,aire});
}

// --- 3. Les libellés ne sont pas des cadres
// Sur cette feuille les titres de rangée montent au plus à 48 px de haut, la
// plus petite pièce d'animation en fait 63 : le seuil est mesuré, pas deviné.
//
// Ce qui n'est PAS fait ici, volontairement : recoller les fragments (le bâton
// qui se détache au KO, une plume). J'avais écrit ce recollage ; il chaînait le
// portrait en pied jusqu'aux rangées voisines et soudait la feuille entière en
// un seul bloc. Une pièce isolée perdue vaut mieux qu'un découpage qui
// s'effondre en silence — les rares cas se traitent dans la config du champion.
const MINH=opt('--minh',52);
const texte=ilots.filter(b=>b.h<MINH);
const cadres=ilots.filter(b=>b.h>=MINH);

// --- 4. Regroupement en rangées, par centre vertical
// Le grand portrait en pied chevauche plusieurs rangées : s'il participe au
// regroupement, il les enchaîne toutes en une seule. On l'écarte d'abord.
const hauteurs=cadres.map(b=>b.h).sort((a,b)=>a-b);
const mediane=hauteurs[hauteurs.length>>1]||1;
const HORS=opt('--hors',2.6);
const geants=cadres.filter(b=>b.h>mediane*HORS);
const normaux=cadres.filter(b=>b.h<=mediane*HORS);

normaux.sort((a,b)=>(a.y+a.h/2)-(b.y+b.h/2));
const rangees=[];
normaux.forEach(b=>{
  const centre=b.y+b.h/2;
  const r=rangees.find(r=>Math.abs(r.centre-centre)<Math.max(b.h,r.hauteur)*.45);
  if(r){r.cadres.push(b);
    r.centre=r.cadres.reduce((s,c)=>s+c.y+c.h/2,0)/r.cadres.length;
    r.hauteur=Math.max(r.hauteur,b.h);}
  else rangees.push({centre,hauteur:b.h,cadres:[b]});
});
rangees.sort((a,b)=>a.centre-b.centre);
rangees.forEach(r=>r.cadres.sort((a,b)=>a.x-b.x));

console.log(`${source} — ${L}×${H}`);
console.log(`${cadres.length} cadres · ${texte.length} libellés écartés · ${geants.length} hors-gabarit · ${rangees.length} rangées\n`);
console.log('rangée | cadres |      y | haut. | larg. | échelle');
rangees.forEach((r,n)=>{
  const hm=Math.max(...r.cadres.map(c=>c.h)),lm=Math.max(...r.cadres.map(c=>c.w));
  console.log(`${String(n).padStart(6)} | ${String(r.cadres.length).padStart(6)} | ${String(Math.round(r.centre-r.hauteur/2)).padStart(6)} | ${String(hm).padStart(5)} | ${String(lm).padStart(5)} | ×${(hm/mediane).toFixed(2)}`);
});
if(geants.length)console.log(`\nhors-gabarit : ${geants.map(g=>`${g.w}×${g.h}@${g.x},${g.y}`).join(' · ')}`);

const manifeste=args.includes('--manifeste')?args[args.indexOf('--manifeste')+1]:null;
if(manifeste){
  fs.writeFileSync(manifeste,JSON.stringify({source,largeur:L,hauteur:H,mediane,
    rangees:rangees.map(r=>({y:Math.round(r.centre-r.hauteur/2),hauteur:r.hauteur,cadres:r.cadres})),
    horsGabarit:geants},null,1));
  console.log(`\nmanifeste → ${manifeste}`);
}

// --- 5. Aperçu : le découpage dessiné sur l'image, pour le juger à l'œil
if(apercu){
  const out=Buffer.from(px);
  const trait=(x,y,c)=>{if(x<0||y<0||x>=L||y>=H)return;const i=(y*L+x)*4;
    out[i]=c[0];out[i+1]=c[1];out[i+2]=c[2];out[i+3]=255};
  const TEINTES=[[255,80,80],[80,255,120],[120,180,255],[255,210,80],[220,120,255],[120,255,240]];
  rangees.forEach((r,n)=>{
    const c=TEINTES[n%TEINTES.length];
    r.cadres.forEach(b=>{
      for(let x=b.x;x<b.x+b.w;x+=1){trait(x,b.y,c);trait(x,b.y+b.h-1,c)}
      for(let y=b.y;y<b.y+b.h;y+=1){trait(b.x,y,c);trait(b.x+b.w-1,y,c)}
    });
  });
  fs.writeFileSync(apercu,encoderPNG(L,H,out));
  console.log(`\naperçu → ${apercu}`);
}
