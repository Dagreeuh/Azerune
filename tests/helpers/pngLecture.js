import{inflateSync}from'node:zlib';
import fs from'node:fs';

// Relecture d'un PNG RGBA sans filtre (ceux que produit `outils/generer-sprites.mjs`).
// Les tests jugent les pixels réellement écrits, pas l'intention du code.
export function lirePNG(chemin){
  const buf=fs.readFileSync(chemin);
  let p=8,largeur=0,hauteur=0;const idat=[];
  while(p<buf.length){
    const len=buf.readUInt32BE(p),type=buf.toString('ascii',p+4,p+8),d=buf.slice(p+8,p+8+len);
    if(type==='IHDR'){largeur=d.readUInt32BE(0);hauteur=d.readUInt32BE(4);}
    if(type==='IDAT')idat.push(d);
    p+=12+len;
  }
  const brut=inflateSync(Buffer.concat(idat));
  const px=Buffer.alloc(largeur*hauteur*4);
  for(let y=0;y<hauteur;y+=1)brut.copy(px,y*largeur*4,y*(largeur*4+1)+1,(y+1)*(largeur*4+1));
  return{largeur,hauteur,px,
    alpha:(x,y)=>px[(y*largeur+x)*4+3]};
}

// Nombre de morceaux d'un seul tenant dans un cadre, en 4-voisinage.
// Une silhouette qui se fragmente veut dire un bras ou une corne qui flotte :
// c'est arrivé deux fois, et ça ne se voit qu'à l'œil ou par ce compte.
export function morceaux(img,cadre){
  const vus=new Set(),cle=(x,y)=>y*img.largeur+x;
  let total=0;
  for(let y=cadre.y;y<cadre.y+cadre.h;y+=1)for(let x=cadre.x;x<cadre.x+cadre.w;x+=1){
    if(!img.alpha(x,y)||vus.has(cle(x,y)))continue;
    total+=1;
    const pile=[[x,y]];vus.add(cle(x,y));
    while(pile.length){
      const[cx,cy]=pile.pop();
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        const nx=cx+dx,ny=cy+dy;
        if(nx<cadre.x||ny<cadre.y||nx>=cadre.x+cadre.w||ny>=cadre.y+cadre.h)return;
        if(!img.alpha(nx,ny)||vus.has(cle(nx,ny)))return;
        vus.add(cle(nx,ny));pile.push([nx,ny]);
      });
    }
  }
  return total;
}

export const pixelsOpaques=(img,cadre)=>{
  let n=0;
  for(let y=cadre.y;y<cadre.y+cadre.h;y+=1)for(let x=cadre.x;x<cadre.x+cadre.w;x+=1)if(img.alpha(x,y))n+=1;
  return n;
};
