import{describe,it,expect,beforeEach,afterEach}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{vfxParDefaut,systemeReduitLesAnimations}from'../src/pages/BattlePage';

// Trois fois signale : « les effets visuels sur les attaques ne fonctionnent
// toujours pas ». Le moteur et le composant etaient corrects ; c'est le CSS qui
// tuait la couche en dur des que le systeme demandait moins d'animations —
// pendant que le bouton continuait d'afficher « EFFETS » et de se dire actif.
// Mesure au navigateur, sort lance, couche inspectee :
//   prefers-reduced-motion: no-preference → display block, 107x136, anime
//   prefers-reduced-motion: reduce        → display none,  0x0     <-- le bug
// Detail : Audit/RAPPORT-EXPERIENCE-JOUEUR.md, section 17.
const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const styles=()=>lire('../src/styles.css');

describe('le reglage systeme regle le defaut, il ne verrouille pas le rendu',()=>{
  it('le CSS ne cache plus la couche de sorts de sa propre initiative',()=>{
    const bloc=styles().match(/@media\(prefers-reduced-motion:reduce\)\{\s*\.no-vfx \.spell-vfx\{display:none\}\s*\}/);
    expect(bloc,'la règle de réduction de mouvement a changé de forme').toBeTruthy();
    // La regle fautive : `.spell-vfx{display:none}` sans le garde `.no-vfx`
    // devant. Le lookbehind est indispensable — sans lui, la bonne regle
    // declenche l'assertion, et ce test a bien commence par la faire.
    expect(styles(),'le CSS masque encore les effets sans que le joueur l’ait demandé')
      .not.toMatch(/(?<!\.no-vfx )\.spell-vfx\{display:none\}/);
  });

  it('seul le bouton du joueur coupe les effets',()=>{
    expect(styles(),'le bouton ✨ ne commande plus le rendu').toContain('.no-vfx .spell-vfx{display:none}');
  });
});

describe('etat initial du bouton ✨',()=>{
  const vraiMatchMedia=globalThis.window?.matchMedia;
  const poser=(reduit,reglage)=>{
    globalThis.window=globalThis.window||{};
    globalThis.window.matchMedia=()=>({matches:reduit});
    globalThis.localStorage={getItem:()=>reglage===undefined?null:JSON.stringify({reducedAnimations:reglage})};
  };
  beforeEach(()=>{globalThis.window=globalThis.window||{}});
  afterEach(()=>{if(vraiMatchMedia)globalThis.window.matchMedia=vraiMatchMedia;delete globalThis.localStorage});

  it('sans choix du joueur, le systeme decide',()=>{
    poser(true,undefined);expect(vfxParDefaut(),'un téléphone en mode économie garde les effets').toBe(false);
    poser(false,undefined);expect(vfxParDefaut(),'un téléphone normal démarre sans effets').toBe(true);
  });

  it('un choix explicite du joueur bat le systeme, dans les deux sens',()=>{
    // C'est tout l'objet du correctif : sur un telephone qui reduit les
    // animations, rallumer les effets doit vraiment les rallumer.
    poser(true,false);expect(vfxParDefaut(),'le joueur ne peut pas rallumer les effets').toBe(true);
    poser(false,true);expect(vfxParDefaut(),'le joueur ne peut pas couper les effets').toBe(false);
  });

  it('un stockage illisible ne coupe pas le combat',()=>{
    globalThis.window.matchMedia=()=>({matches:false});
    globalThis.localStorage={getItem:()=>{throw new Error('mode privé')}};
    expect(()=>vfxParDefaut()).not.toThrow();
    expect(vfxParDefaut()).toBe(true);
  });

  it('un navigateur sans matchMedia ne casse rien',()=>{
    globalThis.window.matchMedia=undefined;
    expect(systemeReduitLesAnimations()).toBe(false);
  });
});

describe('le reglage des Parametres dit ce qu’il fait',()=>{
  it('il annonce le combat, puisqu’il l’eteint aussi',()=>{
    // Le reglage s'appelait « Réduire les animations d’invocation » alors qu'il
    // partage sa cle avec le combat : le cocher eteignait les effets de sort
    // sans jamais le dire.
    const page=lire('../src/pages/SettingsPage.jsx');
    expect(page,'le libellé ne mentionne toujours pas le combat')
      .toContain('Réduire les animations d’invocation — et les effets de sort en combat');
    expect(page,'le joueur n’apprend pas qu’il peut les régler en combat').toMatch(/bouton ✨/);
  });

  it('la cle de preference est bien partagee, comme le libelle l’annonce',()=>{
    expect(lire('../src/pages/BattlePage.jsx')).toContain("COMBAT_PREF_KEY='azerune-summon-preferences-v1'");
    expect(lire('../src/pages/SettingsPage.jsx')).toContain("'azerune-summon-preferences-v1'");
  });
});
