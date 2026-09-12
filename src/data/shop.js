export const SHOP_BASE_SLOTS=6;
export const SHOP_MAX_SLOTS=12;
export const SHOP_SLOT_COSTS={7:300,8:600,9:1000,10:1500,11:2200,12:3000};
export const SHOP_REFRESH_COSTS=[25,50,100,150,150];
export const SHOP_MAX_REFRESHES=5;

const pick=list=>list[Math.floor(Math.random()*list.length)];
const id=()=>`offer-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const offer=(data)=>({id:id(),stock:1,sold:0,...data});

const goldOffers=[
  ()=>offer({type:'stones',icon:'🔥',name:'Pierre de foyer',description:'Une invocation avec la flamme du foyer.',amount:1,currency:'gold',price:10000,tier:'rare'}),
  ()=>offer({type:'masteryTomes',icon:'📘',name:'Tome de maîtrise',description:'Améliore une compétence de champion.',amount:1,currency:'gold',price:25000,tier:'epic'}),
  ()=>offer({type:'gear',icon:'🪖',name:'Équipement de campagne',description:'Équipement généré de 2★ à 3★.',currency:'gold',price:4500,tier:'rare',gear:{stars:Math.random()<.25?3:2,quality:Math.random()<.25?'rare':'common'}}),
  ()=>offer({type:'gems',icon:'💎',name:'Petite bourse de cristaux',description:'Une offre inhabituelle payée en or.',amount:50,currency:'gold',price:15000,tier:'epic'})
];
const gemOffers=[
  ()=>offer({type:'stones',icon:'🔥',name:'Lot de Pierres de foyer',description:'Cinq invocations au Portail ancestral.',amount:5,currency:'gems',price:450,tier:'rare'}),
  ()=>offer({type:'masteryTomes',icon:'📘',name:'Tome de maîtrise',description:'Améliore une compétence de champion.',amount:1,currency:'gems',price:300,tier:'epic'}),
  ()=>offer({type:'gear',icon:'🛡️',name:'Équipement 4★ Épique',description:'Une pièce épique aléatoire de haut niveau.',currency:'gems',price:700,tier:'epic',gear:{stars:4,quality:'epic'}})
];
const bloodOffers=[
  ()=>offer({type:'universalSoul5',icon:'🌟',name:'Fragment universel 5★',description:'Complète les Fragments d’âme d’un naturel 5★.',amount:1,currency:'blood',price:30,tier:'legendary'}),
  ()=>offer({type:'masteryTomes',icon:'📘',name:'Tome de maîtrise',description:'Une ressource rare pour améliorer un sort.',amount:1,currency:'blood',price:15,tier:'epic'}),
  ()=>offer({type:'stones',icon:'🔥',name:'Cinq Pierres de foyer',description:'Cinq invocations supplémentaires.',amount:5,currency:'blood',price:10,tier:'epic'}),
  ()=>offer({type:'gems',icon:'💎',name:'Coffre de cristaux',description:'Contient 500 cristaux.',amount:500,currency:'blood',price:20,tier:'legendary'}),
  ()=>offer({type:'gear',icon:'🟧',name:'Équipement 5★ Légendaire',description:'Une pièce légendaire aléatoire aux quatre statistiques secondaires.',currency:'blood',price:50,tier:'legendary',gear:{stars:5,quality:'legendary'}})
];

export function generateShopOffers(slotCount=SHOP_BASE_SLOTS){
  const offers=[];
  for(let index=0;index<slotCount;index+=1){
    const pool=index===slotCount-1?bloodOffers:index%3===2?gemOffers:goldOffers;
    offers.push(pick(pool)());
  }
  return offers;
}
export const currencyMeta={gold:{icon:'🪙',name:'or'},gems:{icon:'💎',name:'cristaux'},blood:{icon:'🩸',name:'Fragments de sang'}};
