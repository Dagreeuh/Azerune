import{describe,it,expect}from'vitest';
import fs from'node:fs';
import path from'node:path';
import{deflateSync}from'node:zlib';
import{decoderPNG,encoderPNG}from'../outils/png.mjs';
import{lirePNG,pixelsOpaques}from'./helpers/pngLecture';

const RACINE=path.resolve(__dirname,'..');
const lire=p=>fs.readFileSync(path.join(RACINE,p),'utf8');

describe('codec PNG',()=>{
  it('relit ce qu’il écrit, à l’octet près',()=>{
    const px=Buffer.alloc(7*5*4);
    for(let i=0;i<7*5;i+=1){px[i*4]=i*3&255;px[i*4+1]=255-i;px[i*4+2]=i*7&255;px[i*4+3]=i%4?255:0}
    const relu=decoderPNG(encoderPNG(7,5,px));
    expect(relu.largeur).toBe(7);
    expect(relu.hauteur).toBe(5);
    expect(Buffer.compare(relu.px,px)).toBe(0);
  });

  // Les feuilles viennent d'outils tiers et utilisent TOUS les filtres, pas
  // seulement le filtre 0 que nos propres encodeurs écrivent. Chercher les
  // formules dans le source ne prouvait rien : une mutation du prédicteur
  // Paeth passait au travers. On encode donc nous-mêmes, filtre par filtre,
  // et on exige de retrouver l'image d'origine à l'octet près.
  const filtrer=(image,l,h,bpp,type)=>{
    const ligne=l*bpp,out=Buffer.alloc(h*(ligne+1));
    const pa=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);
      return da<=db&&da<=dc?a:db<=dc?b:c};
    for(let y=0;y<h;y+=1){
      out[y*(ligne+1)]=type;
      for(let i=0;i<ligne;i+=1){
        const x=image[y*ligne+i];
        const a=i>=bpp?image[y*ligne+i-bpp]:0;
        const b=y>0?image[(y-1)*ligne+i]:0;
        const c=(i>=bpp&&y>0)?image[(y-1)*ligne+i-bpp]:0;
        const pred=type===0?0:type===1?a:type===2?b:type===3?((a+b)>>1):pa(a,b,c);
        out[y*(ligne+1)+1+i]=(x-pred)&0xff;
      }
    }
    return out;
  };
  const fabriquer=(l,h,bpp,type,image)=>{
    const crcT=Array.from({length:256},(u,n)=>{let c=n;
      for(let k=0;k<8;k+=1)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
    const crc=b=>{let c=0xffffffff;for(const o of b)c=crcT[(c^o)&0xff]^(c>>>8);return(c^0xffffffff)>>>0};
    const bloc=(t,d)=>{const a=Buffer.alloc(4);a.writeUInt32BE(d.length);
      const co=Buffer.concat([Buffer.from(t,'ascii'),d]);const z=Buffer.alloc(4);z.writeUInt32BE(crc(co));
      return Buffer.concat([a,co,z])};
    const ihdr=Buffer.alloc(13);
    ihdr.writeUInt32BE(l,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=bpp===4?6:bpp===3?2:0;
    return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),bloc('IHDR',ihdr),
      bloc('IDAT',deflateSync(filtrer(image,l,h,bpp,type))),bloc('IEND',Buffer.alloc(0))]);
  };

  [0,1,2,3,4].forEach(type=>{
    it(`décode le filtre de ligne ${type}`,()=>{
      const l=5,h=4,bpp=4,image=Buffer.alloc(l*h*bpp);
      for(let i=0;i<image.length;i+=1)image[i]=(i*37+i%7*11)&0xff;
      const relu=decoderPNG(fabriquer(l,h,bpp,type,image));
      expect(Buffer.compare(relu.px,image)).toBe(0);
    });
  });

  it('décode un PNG RGB sans canal alpha',()=>{
    const l=4,h=3,image=Buffer.alloc(l*h*3);
    for(let i=0;i<image.length;i+=1)image[i]=(i*23)&0xff;
    const relu=decoderPNG(fabriquer(l,h,3,4,image));
    for(let i=0;i<l*h;i+=1){
      expect(relu.px[i*4]).toBe(image[i*3]);
      expect(relu.px[i*4+1]).toBe(image[i*3+1]);
      expect(relu.px[i*4+2]).toBe(image[i*3+2]);
      expect(relu.px[i*4+3],'opaque par défaut').toBe(255);
    }
  });

  it('refuse clairement ce qu’il ne sait pas lire',()=>{
    expect(()=>decoderPNG(Buffer.alloc(64))).toThrow(/n’est pas un PNG/);
  });
});

describe('feuille importée de Lelianna',()=>{
  const meta=JSON.parse(lire('public/sprites/champions/lelianna.json'));
  const img=lirePNG(path.join(RACINE,'public',meta.fichier.replace(/^\//,'')));

  it('déclare les animations attendues',()=>{
    ['repos','marche','attaque','soin','mort','portrait'].forEach(a=>{
      expect(Object.keys(meta.cadres)).toContain(a);
      expect(meta.cadres[a].length).toBeGreaterThan(0);
    });
  });

  it('range chaque cadre dans la feuille, sans débordement',()=>{
    Object.entries(meta.cadres).forEach(([anim,liste])=>{
      liste.forEach((c,i)=>{
        expect(c.x+c.w,`${anim} ${i}`).toBeLessThanOrEqual(img.largeur);
        expect(c.y+c.h,`${anim} ${i}`).toBeLessThanOrEqual(img.hauteur);
      });
    });
  });

  it('ne livre aucun cadre vide',()=>{
    Object.entries(meta.cadres).forEach(([anim,liste])=>{
      liste.forEach((c,i)=>expect(pixelsOpaques(img,c),`${anim} ${i}`).toBeGreaterThan(200));
    });
  });

  it('détoure vraiment le fond',()=>{
    // Vérifier seulement qu'il reste des pixels sombres DANS le sprite ne
    // prouve rien : ça passe aussi quand rien n'est détouré. Il faut exiger les
    // deux — du transparent autour, du sombre dedans.
    const c=meta.cadres.repos[0];
    let opaques=0;
    for(let y=c.y;y<c.y+c.h;y+=1)for(let x=c.x;x<c.x+c.w;x+=1)
      if(img.alpha(x,y)>200)opaques+=1;
    const part=opaques/(c.w*c.h);
    expect(part,'le fond doit être transparent').toBeLessThan(0.75);
    expect(part,'le personnage doit rester plein').toBeGreaterThan(0.15);
  });

  it('ne troue pas le personnage en détourant',()=>{
    // Un « tout ce qui est noir devient transparent » perce les contours. Le
    // remplissage depuis les bords laisse survivre les noirs enfermés.
    const c=meta.cadres.repos[0];
    let sombresDedans=0;
    for(let y=c.y+2;y<c.y+c.h-2;y+=1)for(let x=c.x+2;x<c.x+c.w-2;x+=1){
      const i=(y*img.largeur+x)*4;
      if(img.px[i+3]>200&&Math.max(img.px[i],img.px[i+1],img.px[i+2])<34)sombresDedans+=1;
    }
    expect(sombresDedans).toBeGreaterThan(0);
  });

  it('ramène toutes les animations à la même taille de personnage',()=>{
    // Les rangées d'une feuille sont dessinées à des échelles différentes. Sans
    // recalage, le champion grandit en attaquant.
    const cible=meta.hauteurCible;
    Object.entries(meta.cadres).forEach(([anim,liste])=>{
      const haut=Math.max(...liste.map(c=>c.h));
      expect(haut*meta.echelles[anim],anim).toBeCloseTo(cible,0);
    });
  });

  it('garde les cadres à leur taille native',()=>{
    // L'invariant qui protège l'art : le pipeline ne redimensionne jamais. Si
    // toutes les échelles valaient 1, c'est que quelqu'un a rééchantillonné en
    // amont — et le pixel art n'y survit pas.
    const echelles=Object.values(meta.echelles);
    expect(echelles.some(e=>Math.abs(e-1)>0.05)).toBe(true);
    expect(lire('outils/importer-champion.mjs')).toMatch(/NE JAMAIS RÉÉCHANTILLONNER/);
  });
});

describe('l’arène sait afficher une feuille dessinée',()=>{
  const arene=lire('src/pixi/arene.js');

  it('charge l’index des champions sans casser si absent',()=>{
    expect(arene).toMatch(/champions\/index\.json/);
    expect(arene).toMatch(/atlas\.champions=\{\}/);
  });

  it('applique l’échelle à chaque changement d’animation',()=>{
    expect(arene).toMatch(/function appliquerEchelle/);
    expect(arene).toMatch(/e\.sprite\.textures=e\.jeux\[anim\];\s*appliquerEchelle\(e,anim\)/);
  });

  it('place les unités d’après leur largeur mesurée',()=>{
    expect(arene).toMatch(/e\.sprite\.width/);
  });
});
