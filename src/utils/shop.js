// Boutique : rafraichissement, deblocage d'emplacements, achat d'une offre.
//
// Regles pures extraites de GameProvider : elles disent si une action est
// possible et ce qu'elle coute, sans rien ecrire.

import{SHOP_BASE_SLOTS,SHOP_MAX_SLOTS,SHOP_SLOT_COSTS,SHOP_REFRESH_COSTS,SHOP_MAX_REFRESHES}
  from'../data/shop';

const entier=valeur=>{const n=Math.trunc(Number(valeur));return Number.isFinite(n)?n:0};

/** Devises acceptees par la boutique, et l'etiquette affichee au joueur. */
export const SHOP_CURRENCIES={
  gold:{cle:'gold',label:'or'},
  gems:{cle:'gems',label:'cristaux'},
  blood:{cle:'bloodFragments',label:'Fragments de sang'}
};

/** Limite d'inventaire, partagee avec les tirages de butin. */
export const INVENTORY_LIMIT=300;

/**
 * Cout du prochain rafraichissement, ou null s'il n'y en a plus.
 *
 * Le compteur est borne : une sauvegarde importee peut porter une valeur
 * negative ou absurde, et un cout indefini se propagerait en NaN sur le solde
 * de cristaux, ce qui est irrattrapable pour le joueur.
 */
export function refreshCost(refreshCount){
  const compte=Math.max(0,entier(refreshCount));
  if(compte>=SHOP_MAX_REFRESHES)return null;
  const cout=SHOP_REFRESH_COSTS[compte];
  return Number.isFinite(cout)?cout:null;
}

/** Le joueur peut-il rafraichir la boutique ? */
export function canRefreshShop(shopState={},gems=0){
  const cout=refreshCost(shopState.refreshCount);
  if(cout===null)return{ok:false,message:'Limite quotidienne de rafraîchissements atteinte.'};
  if(entier(gems)<cout)return{ok:false,message:`Il faut ${cout} cristaux.`,cost:cout};
  return{ok:true,cost:cout};
}

/** Cout du prochain emplacement, ou null si tout est deja debloque. */
export function nextSlotCost(slotCount){
  const actuel=Math.max(SHOP_BASE_SLOTS,Math.min(SHOP_MAX_SLOTS,entier(slotCount)||SHOP_BASE_SLOTS));
  if(actuel>=SHOP_MAX_SLOTS)return null;
  const cout=SHOP_SLOT_COSTS[actuel+1];
  return Number.isFinite(cout)?cout:null;
}

/** Le joueur peut-il debloquer un emplacement de plus ? */
export function canUnlockSlot(shopState={},gems=0){
  const cout=nextSlotCost(shopState.slotCount);
  if(cout===null)return{ok:false,message:'Tous les emplacements sont déjà débloqués.'};
  const suivant=Math.max(SHOP_BASE_SLOTS,Math.min(SHOP_MAX_SLOTS,entier(shopState.slotCount)||SHOP_BASE_SLOTS))+1;
  if(entier(gems)<cout)return{ok:false,message:`Il faut ${cout} cristaux.`,cost:cout,next:suivant};
  return{ok:true,cost:cout,next:suivant};
}

/** Solde disponible pour la devise d'une offre. */
export function offerBalance(offer={},balances={}){
  const devise=SHOP_CURRENCIES[offer.currency];
  return devise?entier(balances[devise.cle]):0;
}

/** Une offre est-elle achetable ? */
export function canBuyOffer(offer,balances={},inventorySize=0){
  if(!offer)return{ok:false,message:'Offre introuvable.'};
  if(entier(offer.sold)>=entier(offer.stock))return{ok:false,message:'Cette offre est déjà vendue.'};
  if(!SHOP_CURRENCIES[offer.currency])return{ok:false,message:'Devise inconnue.'};
  if(offerBalance(offer,balances)<entier(offer.price))return{ok:false,message:'Solde insuffisant.'};
  if(offer.type==='gear'&&entier(inventorySize)>=INVENTORY_LIMIT)
    return{ok:false,message:`Inventaire plein : ${INVENTORY_LIMIT}/${INVENTORY_LIMIT} objets.`};
  return{ok:true};
}
