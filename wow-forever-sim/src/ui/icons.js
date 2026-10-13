// Icônes du jeu intégrées à la page (aucune image externe n’est autorisée).

import { ICON_DATA, SLOT_ICON_DATA, TALENT_BG_DATA } from '../icons.js';

const FALLBACK_ICON = 'inv_misc_questionmark';

export function iconSrc(name) {
  return `data:image/webp;base64,${ICON_DATA[name] || ICON_DATA[FALLBACK_ICON]}`;
}

// Texture d’emplacement vide de la fiche de personnage.
export function slotIconSrc(slotId) {
  return SLOT_ICON_DATA[slotId] ? `data:image/webp;base64,${SLOT_ICON_DATA[slotId]}` : iconSrc(FALLBACK_ICON);
}

// Icône d’un objet : la sienne, sinon la texture de l’emplacement (objets saisis à la main).
export function itemIconSrc(item, slotId) {
  return item && item.icon ? iconSrc(item.icon) : slotIconSrc(slotId);
}

export function talentBgSrc(treeId) {
  return TALENT_BG_DATA[treeId] ? `data:image/jpeg;base64,${TALENT_BG_DATA[treeId]}` : '';
}
