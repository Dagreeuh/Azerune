// Générateur de sprite sheets pixel art.
//
// Direction artistique : la lisibilité « Disney pixel RPG » (contour noir franc,
// visage expressif, rampes saturées à trois tons) posée sur le vocabulaire
// d'armure de World of Warcraft (acier, liseré d'or, tabard, cape, écu en
// goutte). L'élément du champion ne teinte que le tissu, la cape et l'énergie
// de l'arme : l'acier et l'or restent constants, c'est ce qui tient l'ensemble.
//
// Le dessin ne pose pas les couleurs directement. Il remplit un MASQUE de
// matières ; le rendu en déduit le contour (toute matière voisine du vide) et
// l'ombrage (lumière en haut à gauche). C'est ce qui donne le relief sans
// placer un seul pixel de contour à la main — et ce qui rend les silhouettes
// remplaçables par de vrais assets sans toucher au moteur de rendu.
import{deflateSync}from'node:zlib';
import fs from'node:fs';

const T=48;                       // côté d'une case, en pixels
const ANIMS=[['repos',4],['attaque',4],['touche',2],['mort',4]];
const COLONNES=ANIMS.reduce((s,[,n])=>s+n,0);

/* ---- Encodage PNG minimal (RGBA, sans dépendance) ---------------------- */
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
function encoderPNG(largeur,hauteur,rgba){
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur,0);ihdr.writeUInt32BE(hauteur,4);
  ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  const brut=Buffer.alloc(hauteur*(largeur*4+1));
  for(let y=0;y<hauteur;y+=1){
    brut[y*(largeur*4+1)]=0;
    rgba.copy(brut,y*(largeur*4+1)+1,y*largeur*4,(y+1)*largeur*4);
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
    morceau('IHDR',ihdr),morceau('IDAT',deflateSync(brut,{level:9})),morceau('IEND',Buffer.alloc(0))]);
}

/* ---- Toile de pixels ---------------------------------------------------- */
const toile=(l,h)=>({l,h,data:Buffer.alloc(l*h*4)});
const poser=(t,x,y,[r,v,b,a=255])=>{
  if(x<0||y<0||x>=t.l||y>=t.h)return;
  const i=(y*t.l+x)*4;t.data[i]=r;t.data[i+1]=v;t.data[i+2]=b;t.data[i+3]=a;
};

const hex=s=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
const sombre=(c,f=.55)=>c.map(v=>Math.round(v*f));
const clair=(c,f=1.35)=>c.map(v=>Math.min(255,Math.round(v*f)));
const melange=(a,b,f)=>a.map((v,i)=>Math.round(v+(b[i]-v)*f));
// Une matière = trois tons. L'ombre et la lumière sont déduites de la base,
// pour qu'ajouter une couleur ne demande jamais d'en accorder trois.
const rampe=(base,f=.5,g=1.4)=>[sombre(base,f),base,clair(base,g)];

/* ---- Matières ----------------------------------------------------------- */
const PEAU=1,CHEVEUX=2,ACIER=3,OR=4,TISSU=5,CUIR=6,CAPE=7,ENERGIE=8,
      OEIL=9,BLANC=10,OS=11,LUEUR=12,CHAIR=13,MEMBRE=14;
const CONTOUR=hex('#100c09');

/* ---- Masque de matières ------------------------------------------------- */
const masque=()=>new Int8Array(T*T);
const lire=(m,x,y)=>(x<0||y<0||x>=T||y>=T)?0:m[y*T+x];

/* ---- Rendu : contour puis ombrage --------------------------------------- */
function rendre(t,ox,m,rampes,alpha){
  const a=Math.round(255*alpha);
  for(let y=0;y<T;y+=1)for(let x=0;x<T;x+=1){
    const c=lire(m,x,y);
    if(!c)continue;
    const r=rampes[c]||rampes[TISSU];
    const bord=!lire(m,x-1,y)||!lire(m,x+1,y)||!lire(m,x,y-1)||!lire(m,x,y+1);
    let couleur;
    if(bord)couleur=melange(CONTOUR,r[0],.22);   // contour noir légèrement teinté
    else{
      const haut=lire(m,x,y-1)!==c,gauche=lire(m,x-1,y)!==c;
      const bas=lire(m,x,y+1)!==c,droite=lire(m,x+1,y)!==c;
      couleur=(haut||gauche)?r[2]:(bas||droite)?r[0]:r[1];
    }
    poser(t,ox+x,y,[...couleur,a]);
  }
}

/* ---- Silhouettes -------------------------------------------------------- */
// Deux règles tiennent la lisibilité, et elles valent pour toute silhouette
// ajoutée plus tard :
//   1. deux volumes voisins ne partagent jamais la même matière (sinon ils
//      fusionnent en une seule tache : le contour ne se déclenche que contre
//      le vide) ;
//   2. les membres sont séparés du tronc par une colonne de vide, pour que la
//      silhouette reste lisible à petite taille.
const outils=(m,pose)=>{
  const dx=pose.penche|0,dy=pose.bas|0;
  const R=(x,y,w,h,c)=>{for(let j=0;j<h;j+=1)for(let i=0;i<w;i+=1){
    const px=x+i+dx,py=y+j+dy;
    if(px>=0&&py>=0&&px<T&&py<T)m[py*T+px]=c;}};
  // Volume qui se resserre : `dw` pixels rognés de chaque côté du haut au bas.
  const fuseau=(x,y,w,h,dw,c)=>{for(let j=0;j<h;j+=1){
    const k=Math.round(dw*j/Math.max(1,h-1));R(x+k,y+j,w-2*k,1,c);}};
  return{R,fuseau};
};

// Un champion : cape, épaulières d'or, tabard, écu en goutte, masse d'armes.
function heros(m,pose){
  const{R,fuseau}=outils(m,pose);
  const lv=pose.leve|0;

  // Cape en premier : tout le reste passera devant, elle ne montre que ses ailes.
  for(let j=0;j<16;j+=1)R(14-Math.round(j*.2),17+j,20+Math.round(j*.4),1,CAPE);

  // Jambes séparées par deux colonnes de vide, bottes d'or.
  R(20,32,4,8,ACIER);R(26,32,4,8,ACIER);
  R(19,39,5,4,OR);R(26,39,5,4,OR);

  // Bras et mains. Le bras droit se lève à l'attaque et emmène l'arme.
  R(16,23,4,8,ACIER);R(16,30,4,3,PEAU);
  R(30,23-lv,4,8,ACIER);R(30,30-lv,4,3,PEAU);
  R(33,16-lv,2,16,CUIR);                       // hampe
  fuseau(31,10-lv,7,8,1,OR);                   // tête de masse
  R(33,8-lv,3,2,ENERGIE);                      // éclat au sommet

  // Tronc : plastron d'acier, tabard teinté, ceinturon de cuir.
  R(20,17,10,13,ACIER);
  R(22,21,6,12,TISSU);
  R(19,29,12,3,CUIR);R(23,29,4,3,OR);

  // Épaulières d'or : l'acier des bras ne peut pas s'y fondre.
  fuseau(15,16,6,7,1,OR);fuseau(28,16,6,7,1,OR);

  // Écu en goutte par-dessus le bras gauche.
  for(let j=0;j<16;j+=1){const creux=Math.round((j/15)**2*4);R(8+creux,21+j,10-creux*2,1,OR);}
  for(let j=0;j<12;j+=1){const creux=Math.round((j/11)**2*3);R(10+creux,23+j,6-creux*2,1,TISSU);}
  R(12,28,2,2,OR);R(11,29,4,1,OR);

  // Tête, généreuse : c'est elle qui porte l'expression.
  R(22,15,5,2,PEAU);                           // cou
  R(20,5,9,11,PEAU);
  R(19,2,11,5,CHEVEUX);R(19,6,1,7,CHEVEUX);R(29,6,1,7,CHEVEUX);
  R(21,9,2,3,BLANC);R(25,9,2,3,BLANC);         // yeux
  R(22,10,1,2,OEIL);R(26,10,1,2,OEIL);
  R(21,8,2,1,CHEVEUX);R(25,8,2,1,CHEVEUX);     // sourcils
  R(23,14,3,1,OEIL);                           // bouche
}

// Un monstre : brute voûtée, cornes épaisses, gueule armée, regard qui brûle.
// L'ordre de dessin compte : les cornes passent APRÈS la tête, sinon la tête
// recouvre leur base et elles flottent au-dessus du crâne.
function monstre(m,pose){
  const{R,fuseau}=outils(m,pose);
  const lv=pose.leve|0;

  // Tronc voûté, ventre plus clair.
  fuseau(18,22,13,15,1,CHAIR);
  R(21,26,7,9,TISSU);

  // Bras : matière distincte, mais ancrés dans les épaules — ils mordent d'un
  // pixel sur le tronc pour que la silhouette reste d'un seul tenant.
  R(14,23-lv,5,13,MEMBRE);R(30,23,5,13,MEMBRE);
  R(13,35-lv,6,4,OS);R(30,35,6,4,OS);          // griffes

  // Hanches : une ligne d'ombre, faute de quoi les jambes fondent dans le tronc.
  R(19,36,5,5,CHAIR);R(26,36,5,5,CHAIR);
  R(18,36,13,1,OEIL);
  R(18,39,6,4,OS);R(25,39,6,4,OS);             // pieds

  // Tête, plus large que le tronc, détachée par l'ombre de la mâchoire.
  fuseau(17,7,15,15,1,CHAIR);
  R(18,21,13,1,OEIL);
  for(let j=0;j<9;j+=1){const l=Math.max(1,4-Math.round(j*.35)),d=Math.round(j*.5);
    R(17-d,10-j,l,1,OS);R(30+d-l+1,10-j,l,1,OS);}
  R(20,12,4,4,LUEUR);R(25,12,4,4,LUEUR);       // yeux
  R(19,17,11,4,OEIL);                          // gueule
  R(20,17,2,3,OS);R(24,17,2,2,OS);R(27,17,2,3,OS);
}

/* ---- Poses par animation ------------------------------------------------ */
const poseDe=(anim,frame)=>{
  if(anim==='repos')return{bas:[0,0,1,0][frame],leve:[0,1,0,0][frame],penche:0,alpha:1};
  if(anim==='attaque')return{penche:[-1,-3,4,2][frame],leve:[2,5,0,0][frame],bas:[0,0,1,0][frame],alpha:1};
  if(anim==='touche')return{penche:[3,4][frame],bas:[1,2][frame],leve:0,alpha:1};
  return{penche:[2,4,6,7][frame],bas:[1,2,3,4][frame],leve:0,alpha:[1,.85,.6,.28][frame]};
};

/* ---- Palettes ----------------------------------------------------------- */
// Acier, or, peau, cuir, os : constants. L'élément ne teinte que le tissu,
// la cape, l'énergie de l'arme et la chair du monstre.
const COMMUN={
  [PEAU]:rampe(hex('#e8b58a'),.68,1.14),
  [CHEVEUX]:rampe(hex('#c98a35'),.6),
  [ACIER]:rampe(hex('#9aa3ad'),.52,1.28),
  [OR]:rampe(hex('#e0a832'),.55,1.3),
  [CUIR]:rampe(hex('#6b4426'),.6),
  [OEIL]:rampe(hex('#2a1d14'),.9,1.1),
  [BLANC]:rampe(hex('#f2ece0'),.85,1.05),
  [OS]:rampe(hex('#ddd2b4'),.62),
};
const ELEMENTS={
  Feu:{tissu:'#d1481f',cape:'#8f2a12',energie:'#ffb43c',chair:'#b5411c',lueur:'#ffd34d'},
  Eau:{tissu:'#1f74b0',cape:'#134a75',energie:'#8fe3ff',chair:'#1d6f96',lueur:'#9ff0ff'},
  Nature:{tissu:'#3f8f34',cape:'#245c20',energie:'#b6f06a',chair:'#4a7a2a',lueur:'#caff7a'},
  'Lumière':{tissu:'#e0c14e',cape:'#a8801f',energie:'#fff3c9',chair:'#c9a94a',lueur:'#fffbe0'},
  Ombre:{tissu:'#6d3499',cape:'#3f1a5c',energie:'#c88bee',chair:'#59267e',lueur:'#d79cff'},
  Arcane:{tissu:'#4544b5',cape:'#272a7a',energie:'#9fb8ff',chair:'#3c3a92',lueur:'#b7c9ff'},
};
const rampesDe=e=>({...COMMUN,
  [TISSU]:rampe(hex(e.tissu),.55,1.32),
  [CAPE]:rampe(hex(e.cape),.6,1.3),
  [ENERGIE]:rampe(hex(e.energie),.72,1.15),
  [CHAIR]:rampe(hex(e.chair),.55,1.3),
  [MEMBRE]:rampe(sombre(hex(e.chair),.66),.55,1.3),
  [LUEUR]:rampe(hex(e.lueur),.8,1.1),
});

/* ---- Génération --------------------------------------------------------- */
function feuille(dessin,rampes){
  const t=toile(COLONNES*T,T);
  let col=0;
  const cadres={};
  ANIMS.forEach(([anim,n])=>{
    cadres[anim]=[];
    for(let f=0;f<n;f+=1){
      const pose=poseDe(anim,f);
      const m=masque();
      dessin(m,pose);
      rendre(t,col*T,m,rampes,pose.alpha);
      cadres[anim].push({x:col*T,y:0,w:T,h:T});
      col+=1;
    }
  });
  return{png:encoderPNG(t.l,t.h,t.data),cadres};
}

const atlas={taille:T,animations:Object.fromEntries(ANIMS),feuilles:{}};
Object.entries(ELEMENTS).forEach(([element,e])=>{
  const rampes=rampesDe(e);
  [['heros',heros],['monstre',monstre]].forEach(([genre,dessin])=>{
    const{png,cadres}=feuille(dessin,rampes);
    const nom=`${genre}-${element.toLowerCase().replace('è','e')}`;
    fs.writeFileSync(`public/sprites/${nom}.png`,png);
    atlas.feuilles[nom]={fichier:`/sprites/${nom}.png`,cadres};
  });
});
fs.writeFileSync('public/sprites/atlas.json',JSON.stringify(atlas,null,1));
console.log(`${Object.keys(atlas.feuilles).length} feuilles générées · ${COLONNES} cadres de ${T}×${T} chacune`);
