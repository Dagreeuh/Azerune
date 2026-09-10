// Décodage et encodage PNG, sans dépendance.
//
// Les feuilles de personnage arrivent en PNG : il faut savoir les relire pour
// de bon — donc gérer les cinq filtres de ligne et les types de couleur usuels,
// pas seulement le sous-ensemble que produisent nos propres outils.
import{deflateSync,inflateSync}from'node:zlib';

const CANAUX={0:1,2:3,3:1,4:2,6:4};

export function decoderPNG(buffer){
  if(buffer.readUInt32BE(0)!==0x89504e47)throw new Error('ce fichier n’est pas un PNG');
  let p=8,ihdr=null,palette=null,transparence=null;
  const idat=[];
  while(p<buffer.length){
    const taille=buffer.readUInt32BE(p),type=buffer.toString('ascii',p+4,p+8);
    const data=buffer.slice(p+8,p+8+taille);
    if(type==='IHDR')ihdr={largeur:data.readUInt32BE(0),hauteur:data.readUInt32BE(4),
      profondeur:data[8],couleur:data[9],entrelace:data[12]};
    else if(type==='PLTE')palette=data;
    else if(type==='tRNS')transparence=data;
    else if(type==='IDAT')idat.push(data);
    else if(type==='IEND')break;
    p+=12+taille;
  }
  if(!ihdr)throw new Error('PNG sans en-tête IHDR');
  if(ihdr.profondeur!==8)throw new Error(`profondeur ${ihdr.profondeur} non gérée (8 bits attendus)`);
  if(ihdr.entrelace)throw new Error('PNG entrelacé non géré');
  const canaux=CANAUX[ihdr.couleur];
  if(!canaux)throw new Error(`type de couleur ${ihdr.couleur} non géré`);

  const{largeur,hauteur}=ihdr,bpp=canaux;
  const brut=inflateSync(Buffer.concat(idat));
  const ligne=largeur*bpp,sortie=Buffer.alloc(hauteur*ligne);
  const paeth=(a,b,c)=>{const p0=a+b-c,pa=Math.abs(p0-a),pb=Math.abs(p0-b),pc=Math.abs(p0-c);
    return pa<=pb&&pa<=pc?a:pb<=pc?b:c};
  for(let y=0;y<hauteur;y+=1){
    const filtre=brut[y*(ligne+1)];
    const src=y*(ligne+1)+1,dst=y*ligne,prec=(y-1)*ligne;
    for(let i=0;i<ligne;i+=1){
      const x=brut[src+i];
      const a=i>=bpp?sortie[dst+i-bpp]:0;
      const b=y>0?sortie[prec+i]:0;
      const c=(i>=bpp&&y>0)?sortie[prec+i-bpp]:0;
      sortie[dst+i]=(filtre===0?x:filtre===1?x+a:filtre===2?x+b:
        filtre===3?x+((a+b)>>1):x+paeth(a,b,c))&0xff;
    }
  }
  // Tout ramener en RGBA, pour n'avoir qu'une seule forme à manipuler ensuite.
  const px=Buffer.alloc(largeur*hauteur*4);
  for(let i=0;i<largeur*hauteur;i+=1){
    const s=i*bpp,d=i*4;
    if(ihdr.couleur===6){px[d]=sortie[s];px[d+1]=sortie[s+1];px[d+2]=sortie[s+2];px[d+3]=sortie[s+3]}
    else if(ihdr.couleur===2){px[d]=sortie[s];px[d+1]=sortie[s+1];px[d+2]=sortie[s+2];px[d+3]=255}
    else if(ihdr.couleur===0){px[d]=px[d+1]=px[d+2]=sortie[s];px[d+3]=255}
    else if(ihdr.couleur===4){px[d]=px[d+1]=px[d+2]=sortie[s];px[d+3]=sortie[s+1]}
    else{const k=sortie[s]*3;px[d]=palette[k];px[d+1]=palette[k+1];px[d+2]=palette[k+2];
      px[d+3]=transparence&&sortie[s]<transparence.length?transparence[sortie[s]]:255}
  }
  return{largeur,hauteur,px};
}

const crcTable=Array.from({length:256},(u,n)=>{let c=n;
  for(let k=0;k<8;k+=1)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
const crc=buf=>{let c=0xffffffff;
  for(const o of buf)c=crcTable[(c^o)&0xff]^(c>>>8);return(c^0xffffffff)>>>0};
const morceau=(type,data)=>{
  const l=Buffer.alloc(4);l.writeUInt32BE(data.length);
  const corps=Buffer.concat([Buffer.from(type,'ascii'),data]);
  const c=Buffer.alloc(4);c.writeUInt32BE(crc(corps));
  return Buffer.concat([l,corps,c]);
};
export function encoderPNG(largeur,hauteur,rgba){
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur,0);ihdr.writeUInt32BE(hauteur,4);
  ihdr[8]=8;ihdr[9]=6;
  const brut=Buffer.alloc(hauteur*(largeur*4+1));
  for(let y=0;y<hauteur;y+=1)
    rgba.copy(brut,y*(largeur*4+1)+1,y*largeur*4,(y+1)*largeur*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
    morceau('IHDR',ihdr),morceau('IDAT',deflateSync(brut,{level:9})),morceau('IEND',Buffer.alloc(0))]);
}
