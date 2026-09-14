import{empreinteBonuses}from'../data/empreintes';
import{bonusDeCle}from'../data/clesDeVoute';

/**
 * Les champions tels qu'ils ENTRENT en combat.
 *
 * Cette construction vivait dans BattlePage, en une seule expression au milieu
 * d'une fonction `start()` de 400 caracteres. Deux consequences :
 *
 *   · rien d'autre ne pouvait s'en servir — ni la simulation, ni un test — sans
 *     la recopier, et une copie aurait fini par mentir sur les etoiles, les
 *     niveaux de sort ou les Empreintes, c'est-a-dire sur le combat lui-meme ;
 *   · les tests qui la gardaient LISAIENT LE TEXTE de BattlePage.jsx a la
 *     recherche de « skillLevels » et « empreinteSkills ». Ils verifiaient une
 *     orthographe, pas un comportement, et cassaient au premier deplacement du
 *     code sans qu'aucun comportement ait change.
 *
 * Elle est ici, pure et appelable : le contexte de jeu l'appelle, les tests
 * l'exercent, et ce qu'ils verifient est ce que le moteur recoit.
 */
export function championsDeCombat(heroes,{getProgress,skillLevels={},uniqueWeaponFor}={}){
  return(heroes||[]).map(hero=>{
    const progres=getProgress(hero);
    return{...hero,
      currentStars:progres.stars,
      currentLevel:progres.level,
      skillLevels:skillLevels[hero.id]||{},
      empreinteSkills:empreinteBonuses(hero,progres.empreintes).skills,
      cleDeVoute:bonusDeCle(hero.id,progres.empreintes),
      uniqueWeapon:uniqueWeaponFor?uniqueWeaponFor(hero):null};
  });
}
