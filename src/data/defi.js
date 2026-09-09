/**
 * Défi de la semaine — la première fonctionnalité sociale du jeu.
 *
 * Azerune est « à vocation entre amis » : dix codes promo portent les prénoms
 * des amis, dix champions aussi, et il n'existait aucune fonctionnalité
 * sociale. Aucune. Le moteur étant déterministe et la sauvegarde déjà
 * exportable, on peut se comparer sans serveur : tout le monde affronte la même
 * rencontre pendant sept jours, le score est le nombre d'actions dépensées, et
 * on s'échange un code court.
 *
 * Détail : Audit/RAPPORT-EXPERIENCE-JOUEUR.md
 */

/** Clé ISO de la semaine : même valeur pour tout le monde, sept jours durant. */
export function cleSemaine(date=new Date()){
  const jour=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  // Jeudi de la semaine courante : la norme ISO 8601.
  jour.setUTCDate(jour.getUTCDate()+4-(jour.getUTCDay()||7));
  const debut=new Date(Date.UTC(jour.getUTCFullYear(),0,1));
  const numero=Math.ceil(((jour-debut)/86400000+1)/7);
  return `${jour.getUTCFullYear()}-S${String(numero).padStart(2,'0')}`;
}

/** Générateur pseudo-aléatoire amorcé, pour que la rencontre soit la même partout. */
const graineDepuis=texte=>{
  let h=2166136261;
  for(let i=0;i<texte.length;i+=1){h^=texte.charCodeAt(i);h=Math.imul(h,16777619)}
  return h>>>0;
};
const suite=graine=>{let a=graine>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;
  t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
  return((t^(t>>>14))>>>0)/4294967296}};

const ADVERSAIRES=[
  {id:'colosse',name:'Colosse de granit',icon:'🗿',element:'Nature',hp:1900,atk:150,def:120,spd:96},
  {id:'brasier',name:'Cœur de brasier',icon:'🔥',element:'Feu',hp:1500,atk:190,def:70,spd:112},
  {id:'maree',name:'Marée hurlante',icon:'🌊',element:'Eau',hp:1700,atk:160,def:90,spd:104},
  {id:'ombre',name:'Ombre affamée',icon:'🌑',element:'Ombre',hp:1400,atk:205,def:60,spd:124},
  {id:'aube',name:'Sentinelle de l’Aube',icon:'✨',element:'Lumière',hp:1750,atk:155,def:105,spd:100},
  {id:'echo',name:'Écho dissonant',icon:'🔮',element:'Arcane',hp:1600,atk:175,def:85,spd:118}
];
const TITRES=['Épreuve du Vide','Serment rompu','Veille des Cendres','Chasse aux Échos',
  'Marche des Reliques','Convocation des Anciens','Brèche du Crépuscule'];

/** La rencontre de la semaine : identique pour tout le monde. */
export function defiDeLaSemaine(date=new Date()){
  const semaine=cleSemaine(date),tirer=suite(graineDepuis(semaine));
  const melange=[...ADVERSAIRES].sort(()=>tirer()-.5);
  const chef=melange[0],escorte=melange.slice(1,3);
  // Calibre pour rester à portée d'un joueur de milieu de campagne : le défi
  // se joue entre amis de niveaux différents, pas entre optimisateurs.
  const echelle=.55+tirer()*.25;
  const unite=(source,role)=>({id:`defi-${source.id}-${role}`,name:source.name,icon:source.icon,
    element:source.element,accuracy:35,resistance:35,bossUnit:role==='chef',
    hp:Math.round(source.hp*echelle*(role==='chef'?1.9:1)),
    atk:Math.round(source.atk*echelle*(role==='chef'?1.12:1)),
    def:Math.round(source.def*echelle),spd:source.spd});
  const enemies=[unite(chef,'chef'),...escorte.map(x=>unite(x,'escorte'))];
  const recommended=Math.round(enemies.reduce((somme,u)=>
    somme+u.hp*.30+u.atk*7.5+u.def*5.5+u.spd*1.7+u.accuracy*1.5+u.resistance*1.25,0)*1.52);
  return{semaine,key:`defi:${semaine}`,defi:true,
    name:`${TITRES[graineDepuis(semaine)%TITRES.length]} · ${semaine}`,
    continentName:'Défi de la semaine',difficultyName:'Entre amis',
    icon:chef.icon,enemies,scale:1,recommended,
    description:'La même rencontre pour tout le monde pendant sept jours. Le score est la part des points de vie arrachés : à égalité parfaite, le moins d’actions l’emporte.'};
}

/* ---- Codes de partage ------------------------------------------------- */

const ALPHABET='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const controle=texte=>{let somme=0;for(let i=0;i<texte.length;i+=1)somme=(somme*31+texte.charCodeAt(i))>>>0;
  return ALPHABET[somme%36]+ALPHABET[(somme>>>5)%36]};
/** Le nom peut contenir n'importe quoi : on le protège avant l'encodage. */
const enBase64=texte=>btoa(unescape(encodeURIComponent(texte)));
const deBase64=texte=>decodeURIComponent(escape(atob(texte)));

/**
 * Comparaison de deux tentatives. La part de PV arrachés d'abord — c'est ce
 * qui permet à un joueur de début de campagne de participer quand même — puis
 * le nombre d'actions à égalité parfaite.
 *
 * Renvoie un nombre négatif si `a` est meilleure, positif si `b` l'est.
 */
export function comparerTentatives(a,b){
  if(!a)return b?1:0;
  if(!b)return -1;
  const pa=Number(a.part)||0,pb=Number(b.part)||0;
  if(pa!==pb)return pb-pa;
  return(Number(a.actions)||0)-(Number(b.actions)||0);
}

/** Code court à envoyer à ses amis. */
export function encoderDefi({semaine,nom,actions,part,puissance}){
  if(!semaine||!Number.isFinite(Number(actions)))return null;
  const charge=[semaine,String(nom||'Invocateur').slice(0,20).replace(/\|/g,' '),
    Math.max(0,Math.round(Number(actions))),Math.max(0,Math.round(Number(puissance)||0)),
    Math.max(0,Math.min(100,Math.round(Number(part)||0)))].join('|');
  const corps=enBase64(charge).replace(/=+$/,'');
  return `AZ-${corps}-${controle(corps)}`;
}

/** Lecture d'un code d'ami. Renvoie null si le code est abîmé. */
export function lireDefi(code){
  const propre=String(code||'').trim().toUpperCase().replace(/\s+/g,'');
  const parties=String(code||'').trim().replace(/\s+/g,'').split('-');
  if(parties.length!==3||parties[0].toUpperCase()!=='AZ')return null;
  const[,corps,somme]=parties;
  if(controle(corps)!==somme.toUpperCase())return null;
  try{
    const[semaine,nom,actions,puissance,part]=deBase64(corps).split('|');
    if(!semaine||!actions)return null;
    return{semaine,nom,actions:Number(actions),puissance:Number(puissance)||0,
      part:Math.max(0,Math.min(100,Number(part)||0)),brut:propre};
  }catch{return null}
}
