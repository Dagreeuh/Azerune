// Inventaire : valeur de vente et protections avant destruction d'un objet.
//
// Regles pures extraites de GameProvider. La vente et le recyclage partageaient
// les memes trois protections, ecrites deux fois : elles sont ici en un seul
// endroit, pour qu'elles ne puissent plus diverger.

const nombre=valeur=>{const n=Number(valeur);return Number.isFinite(n)?n:0};

/** Multiplicateur de prix de revente, par qualite. */
export const SELL_QUALITY_MULTIPLIERS={normal:1,common:1.3,rare:1.8,epic:2.7,legendary:5};

/** Or rendu par la vente d'un objet. */
export function itemSellValue(item){
  if(!item)return 0;
  const multiplicateur=SELL_QUALITY_MULTIPLIERS[item.quality]||1;
  return Math.max(0,Math.round((nombre(item.itemLevel)+10)*nombre(item.stars)*multiplicateur));
}

/** L'objet est-il porte par un champion ? */
export const isItemEquipped=(itemId,equipment={})=>
  Object.values(equipment||{}).some(gear=>Object.values(gear||{}).includes(itemId));

/**
 * Raison qui empeche de detruire un objet, ou null s'il est libre.
 * `action` complete le message : « le vendre », « le recycler ».
 */
export function disposalBlock(item,equipment,action){
  if(!item)return'Objet introuvable.';
  if(item.unique)return`Une arme Unique ne peut pas être ${action==='recycler'?'recyclée':'vendue'}.`;
  if(item.locked)return`Déverrouille cet objet avant de ${action==='recycler'?'le recycler':'le vendre'}.`;
  if(isItemEquipped(item.id,equipment))
    return`Retire cet objet du champion avant de ${action==='recycler'?'le recycler':'le vendre'}.`;
  return null;
}
