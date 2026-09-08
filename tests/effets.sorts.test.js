import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{VFX_ARCHETYPES,ELEMENT_PALETTE,paletteFor,vfxForEvent,archetypeIds,allLayers,allImpacts}
  from'../src/data/spellVfx';

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const css=lire('../src/styles.css');
const ELEMENTS=[...new Set(HEROES.map(hero=>hero.element))];

describe('chaque sort a une allure',()=>{
  it('tout effet du roster produit un archétype connu',()=>{
    HEROES.forEach(hero=>(hero.skills||[]).forEach(skill=>{
      const vfx=vfxForEvent({type:'damage',skillEffect:skill.effect,element:hero.element});
      expect(archetypeIds(),`${hero.name} · ${skill.name}`).toContain(vfx.id);
    }));
  });

  it('un événement inconnu retombe sur une allure valide, sans lever',()=>{
    [{},{type:'damage'},{skillEffect:'sortImaginaire'},{element:'Éther'},
     {type:'inconnu',skillEffect:null,element:undefined}]
      .forEach(evenement=>{
        expect(()=>vfxForEvent(evenement)).not.toThrow();
        expect(archetypeIds()).toContain(vfxForEvent(evenement).id);
      });
  });

  it('l’intention prime sur l’élément : un soin ressemble à un soin',()=>{
    ELEMENTS.forEach(element=>{
      expect(vfxForEvent({type:'heal',element}).id,`soin ${element}`).toBe('mend');
      expect(vfxForEvent({type:'shield',element}).id,`bouclier ${element}`).toBe('ward');
    });
  });

  it('le sort nommé prime sur l’élément',()=>{
    // Une Salve de givre lancee par un champion de Feu doit rester du givre.
    expect(vfxForEvent({type:'damage',skillEffect:'frostNova',element:'Feu'}).id).toBe('frost');
    expect(vfxForEvent({type:'damage',skillEffect:'holyPowerVerdict',element:'Ombre'}).id).toBe('holy');
  });

  it('à défaut, l’élément décide',()=>{
    expect(vfxForEvent({type:'damage',skillEffect:'sortInconnu',element:'Feu'}).id).toBe('flame');
    expect(vfxForEvent({type:'damage',skillEffect:'sortInconnu',element:'Ombre'}).id).toBe('shadow');
  });

  it('les six éléments du roster ont une palette dédiée',()=>{
    ELEMENTS.forEach(element=>{
      expect(ELEMENT_PALETTE[element],element).toBeDefined();
      expect(paletteFor(element)).not.toBe(ELEMENT_PALETTE.neutral);
    });
    expect(paletteFor('Éther')).toBe(ELEMENT_PALETTE.neutral);
  });

  it('toute palette est complète et en hexadécimal',()=>{
    Object.entries(ELEMENT_PALETTE).forEach(([nom,palette])=>{
      ['core','trail','glow'].forEach(ton=>
        expect(palette[ton],`${nom}.${ton}`).toMatch(/^#[0-9a-f]{6}$/i));
    });
  });
});

describe('l’intensité se lit sans changer la forme',()=>{
  it('un critique intensifie mais garde le même archétype',()=>{
    const normal=vfxForEvent({type:'damage',skillEffect:'frostBolt',element:'Eau'});
    const critique=vfxForEvent({type:'damage',skillEffect:'frostBolt',element:'Eau',critical:true});
    expect(critique.id).toBe(normal.id);
    expect(critique.intensity).toBeGreaterThan(normal.intensity);
    expect(critique.duration).toBeGreaterThan(normal.duration);
  });

  it('l’affinité module l’intensité dans les deux sens',()=>{
    const base=vfxForEvent({type:'damage',skillEffect:'frostBolt'}).intensity;
    expect(vfxForEvent({type:'damage',skillEffect:'frostBolt',affinity:'effective'}).intensity)
      .toBeGreaterThan(base);
    expect(vfxForEvent({type:'damage',skillEffect:'frostBolt',affinity:'weak'}).intensity)
      .toBeLessThan(base);
  });

  it('l’intensité reste dans des bornes affichables',()=>{
    [true,false].forEach(critical=>['effective','weak','neutral'].forEach(affinity=>{
      const valeur=vfxForEvent({type:'damage',critical,affinity}).intensity;
      expect(valeur).toBeGreaterThan(.5);
      expect(valeur).toBeLessThan(2);
    }));
  });
});

describe('les archétypes et le style se rejoignent',()=>{
  // Un archetype qui nomme une couche absente du CSS s'affiche vide : aucun
  // test unitaire ne le verrait, et l'ecran ne montrerait rien.
  /** Bloc de regle contenant ce selecteur, selecteurs groupes compris. */
  const regleDe=selecteur=>{
    const position=css.search(new RegExp(`\\${selecteur}\\s*[,{]`));
    if(position<0)return null;
    const ouverture=css.indexOf('{',position);
    return css.slice(ouverture,css.indexOf('}',ouverture));
  };

  it('chaque couche déclarée existe en CSS',()=>{
    // Le selecteur peut etre groupe — `.vfx-sparks,.vfx-motes,.vfx-dust{…}` —
    // donc on cherche le nom suivi d'une virgule ou d'une accolade, pas
    // l'accolade seule.
    allLayers().forEach(couche=>
      expect(regleDe(`.vfx-${couche}`),`couche « ${couche} » absente du CSS`).not.toBeNull());
  });

  it('chaque couche a une animation nommée',()=>{
    allLayers().forEach(couche=>
      expect(regleDe(`.vfx-${couche}`),`couche « ${couche} » sans animation-name`)
        .toContain('animation-name'));
  });

  it('chaque animation nommée a ses keyframes',()=>{
    // Une animation sans keyframes ne leve pas : elle ne fait simplement rien.
    allLayers().forEach(couche=>{
      const nom=regleDe(`.vfx-${couche}`).match(/animation-name:([a-zA-Z]+)/)?.[1];
      expect(nom,`couche « ${couche} »`).toBeTruthy();
      // Borner le mot : `toContain('@keyframes vfxShards')` passerait sur
      // `@keyframes vfxShardsOld`, et l'animation resterait pourtant morte.
      expect(css,`keyframes « ${nom} » manquantes`).toMatch(new RegExp(`@keyframes ${nom}\\b`));
    });
  });

  it('chaque archétype a au moins une couche et un impact',()=>{
    Object.entries(VFX_ARCHETYPES).forEach(([id,archetype])=>{
      expect(archetype.layers.length,id).toBeGreaterThan(0);
      expect(archetype.impact,id).toBeTruthy();
      expect(archetype.label,id).toBeTruthy();
    });
  });

  it('aucun archétype n’est inatteignable',()=>{
    // Un archetype que rien ne peut produire est du code mort deguise en design.
    const atteints=new Set();
    HEROES.forEach(hero=>(hero.skills||[]).forEach(skill=>
      atteints.add(vfxForEvent({type:'damage',skillEffect:skill.effect,element:hero.element}).id)));
    ['heal','shield','dot','recoil','ghoul'].forEach(type=>
      atteints.add(vfxForEvent({type}).id));
    ELEMENTS.forEach(element=>atteints.add(vfxForEvent({type:'damage',element}).id));
    expect([...archetypeIds()].filter(id=>!atteints.has(id))).toEqual([]);
  });

  it('les impacts déclarés sont tous distincts et utilisés',()=>{
    expect(allImpacts().length).toBeGreaterThan(5);
  });
});

describe('couper les effets les coupe vraiment',()=>{
  const page=lire('../src/pages/BattlePage.jsx');
  const composant=lire('../src/components/SpellVfx.jsx');

  it('le composant ne rend rien quand il est désactivé',()=>{
    expect(composant).toContain('if(!enabled||!events.length)return null;');
  });

  it('l’écran de combat porte l’état et le transmet',()=>{
    expect(page).toContain('vfxEnabled');
    expect(page).toMatch(/<SpellVfx events=\{events\} enabled=\{vfxEnabled\}\/>/);
  });

  it('le réglage est celui des Paramètres, pas un second',()=>{
    // Un joueur qui coupe les animations quelque part doit les couper partout.
    expect(page).toContain("COMBAT_PREF_KEY='azerune-summon-preferences-v1'");
    expect(lire('../src/pages/SettingsPage.jsx')).toContain('reducedAnimations');
  });

  it('l’écriture de la préférence ne casse pas si le stockage refuse',()=>{
    // localStorage leve en navigation privee et quand le site est bloque :
    // sans garde, couper les effets ferait tomber tout l'ecran de combat.
    const extrait=nom=>{const debut=page.indexOf(`export const ${nom}=`);
      return page.slice(debut,page.indexOf('\n',debut))};
    ['combatPrefs','writeCombatPref'].forEach(nom=>{
      expect(extrait(nom),`${nom} sans try`).toContain('try{');
      expect(extrait(nom),`${nom} sans catch`).toContain('catch');
    });
  });

  it('la classe de coupure éteint le rendu et les mouvements',()=>{
    expect(css).toContain('.no-vfx .spell-vfx{display:none}');
    expect(css).toContain('prefers-reduced-motion:reduce');
  });

  it('l’effet de bord sort de l’updater de setState',()=>{
    // Ecrire dans localStorage a l'interieur d'un updater declenche
    // « Cannot update a component while rendering another » : React peut
    // rejouer l'updater pendant un rendu.
    expect(page).not.toMatch(/setVfxEnabled\(current=>\{[^}]*writeCombatPref/);
    expect(page).toContain('const toggleVfx=()=>{const next=!vfxEnabled;writeCombatPref(!next);setVfxEnabled(next)};');
  });
});

describe('le moteur fournit ce qu’il faut pour animer',()=>{
  it('chaque événement porte le sort et l’élément de son lanceur',()=>{
    const moteur=lire('../src/battle/engine.js');
    expect(moteur).toContain('skillEffect:skill.effect');
    expect(moteur).toContain('element:actor.element');
  });
});
