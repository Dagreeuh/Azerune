import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';

// Refonte d'interface v1.77 — ambiance pierre-et-or, ergonomie du combat.
//
// Mesures avant refonte :
//   • 2 459 occurrences de couleurs pour 370 teintes, et 7 variables CSS en
//     tout — dont 5 servaient aux effets de sort. Changer une teinte voulait
//     dire la changer a la main, partout.
//   • Ecran de combat : 4 cibles tactiles sur 13 sous 44 px, 4 boutons
//     flottants poses dans 4 coins differents, texte a 6 px, et 27 % de la
//     hauteur pris par le bandeau de profil et la navigation PENDANT le combat.
//
// La palette n'est pas inventee : elle est extraite du Journal de quetes, seul
// ecran qui portait deja l'ambiance. Detail : section 22 du rapport.

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const styles=()=>lire('../src/styles.css');
const page=()=>lire('../src/pages/BattlePage.jsx');
/**
 * Corps d'une regle CSS. On prend la DERNIERE occurrence du selecteur : c'est
 * celle qui gagne en cascade, et les surcharges de la refonte sont ajoutees en
 * fin de feuille. Viser la premiere lisait l'ancienne regle — ce test a
 * commence par echouer exactement comme cela.
 */
/** Tous les corps de règle portant ce sélecteur, dans l'ordre de la feuille. */
const regles=(css,selecteur)=>{
  const sorties=[];let i=css.indexOf(selecteur);
  while(i>=0){sorties.push(css.slice(i,css.indexOf('}',i)+1));i=css.indexOf(selecteur,i+1)}
  return sorties;
};
/**
 * Corps d'une regle. Par defaut la DERNIERE : c'est elle qui gagne en cascade,
 * et les surcharges de la refonte sont ajoutees en fin de feuille. Viser la
 * premiere lisait l'ancienne regle — ce test a commence par echouer ainsi.
 */
const regle=(css,selecteur,rang=-1)=>{const liste=regles(css,selecteur);
  return liste.length?liste.at(rang):''};

describe('la palette vit dans des jetons, plus dans 2 459 valeurs en dur',()=>{
  const JETONS=['--fond','--pierre-900','--pierre-800','--pierre-700','--bord','--bord-clair',
    '--metal','--or','--or-clair','--or-pale','--texte-vif','--texte','--texte-doux',
    '--azur','--vie','--sang','--police-titre','--biseau','--relief'];

  it('tous les jetons de thème sont déclarés',()=>{
    const racine=styles().slice(0,styles().indexOf('\n}\n'));
    JETONS.forEach(j=>expect(racine,`le jeton ${j} a disparu`).toContain(`${j}:`));
  });

  it('chaque jeton sert réellement quelque part',()=>{
    // Un jeton declare et jamais utilise, c'est du vocabulaire mort.
    const css=styles();
    JETONS.forEach(j=>{
      const emplois=[...css.matchAll(new RegExp(`var\\(${j}\\)`,'g'))].length;
      expect(emplois,`le jeton ${j} n’est utilisé nulle part`).toBeGreaterThan(0);
    });
  });

  it('l’ardoise froide n’est pas revenue',()=>{
    // Les teintes Tailwind qui donnaient au jeu son air de tableau de bord.
    const froides=['#020617','#0f172a','#111827','#1e293b','#334155','#475569','#94a3b8','#cbd5e1'];
    const revenues=froides.filter(c=>styles().toLowerCase().includes(c));
    expect(revenues,'des teintes ardoise ont été réintroduites').toEqual([]);
  });

  it('la part de couleurs en dur a nettement baissé',()=>{
    // 2 459 avant refonte. Le reste est fait de teintes locales assumees
    // (rarete, elements, degrades ponctuels) — mais la charpente passe par
    // les jetons.
    const enDur=[...styles().matchAll(/#[0-9a-fA-F]{3,8}/g)].length;
    expect(enDur,`${enDur} couleurs en dur`).toBeLessThan(1000);
    const parJeton=[...styles().matchAll(/var\(--/g)].length;
    expect(parJeton,'les jetons ne portent pas la charpente').toBeGreaterThan(enDur);
  });

  it('les titres portent l’ambiance, le corps reste lisible',()=>{
    expect(styles()).toMatch(/--police-titre:\s*Georgia/);
    expect(styles(),'les titres n’utilisent pas la police d’ambiance')
      .toContain('h2,h3,.hero h2{font-family:var(--police-titre)}');
  });
});

describe('le combat se joue en plein écran',()=>{
  it('la page pose et retire elle-même le mode plein écran',()=>{
    const src=page();
    expect(src).toContain("document.body.classList.toggle('combat-plein-ecran',actif)");
    expect(src,'le mode reste collé après avoir quitté la page')
      .toContain("return()=>document.body.classList.remove('combat-plein-ecran')");
  });

  it('il ne s’active que pendant un combat non terminé',()=>{
    const src=page();
    expect(src).toContain('const actif=Boolean(battle&&!battle.winner)');
  });

  it('le bandeau de profil et la navigation s’effacent',()=>{
    const css=styles();
    expect(css).toContain('body.combat-plein-ecran .app>.game-header');
    expect(css).toContain('body.combat-plein-ecran .app>nav');
    expect(regle(css,'body.combat-plein-ecran .app>.game-header'),
      'ils sont ciblés mais pas masqués').toContain('display:none');
  });

  it('la place libérée revient à l’arène',()=>{
    // Sans cela, les 250 px repris restaient un trou entre le journal et la
    // barre de sorts : mesure, l'arene ne gagnait que 15 px.
    expect(styles()).toContain('body.combat-plein-ecran .battle-main-grid{flex:1;min-height:0}');
  });

  it('une sortie explicite existe, puisque la navigation est masquée',()=>{
    const src=page();
    expect(src,'aucun bouton pour quitter').toContain('hud-quitter');
    expect(src,'on quitte sans confirmation').toContain('setAbandonConfirm(true)');
    expect(src,'la confirmation ne mène nulle part').toContain('onClick={returnToActivity}');
  });
});

describe('les commandes de combat sont rassemblées et atteignables',()=>{
  it('les quatre boutons flottants ont disparu',()=>{
    const src=page();
    ['battle-auto-toggle','battle-speed-toggle','battle-vfx-toggle','affinity-fab']
      .forEach(c=>expect(src,`le bouton flottant ${c} est revenu`).not.toContain(c));
  });

  it('elles vivent toutes dans la même barre',()=>{
    const src=page();
    const barre=src.slice(src.indexOf('<div className="battle-hud">'),src.indexOf('</div>\n  </div>'));
    ['toggleAuto','cycleSpeed','toggleVfx','setAffinityOpen','setAbandonConfirm']
      .forEach(a=>expect(barre,`${a} n’est pas dans la barre`).toContain(a));
  });

  it('chaque commande atteint la taille tactile minimale',()=>{
    // Mesure avant : AUTO 56x38, EFFETS 74x38, affinités 42x42, vitesse 406x41.
    const base=regle(styles(),'.hud-bouton{',0);
    const largeur=Number(base.match(/min-width:(\d+)px/)?.[1]||0);
    const hauteur=Number(base.match(/min-height:(\d+)px/)?.[1]||0);
    expect(largeur,`min-width ${largeur}px`).toBeGreaterThanOrEqual(44);
    expect(hauteur,`min-height ${hauteur}px`).toBeGreaterThanOrEqual(44);
    // Sous 620 px la surcharge retire le `min-width` : c'est voulu, mais alors
    // les boutons DOIVENT s'étirer pour remplir la barre, sinon ils
    // rétréciraient sous la cible tactile. Mesuré à 430 px : aucune commande
    // sous 44 px.
    const etroit=regles(styles(),'.hud-bouton{').slice(1).join(' ');
    if(etroit.includes('min-width:0'))
      expect(etroit,'les commandes rétrécissent sans s’étirer').toContain('flex:1 1 0');
  });

  it('un plancher de lisibilité remplace le texte à 6 px',()=>{
    expect(styles()).toContain('.battle-screen-compact small,.battle-screen-compact em,.battle-screen-compact span{font-size:max(8px,1em)}');
  });
});

describe('les deux camps se distinguent d’un coup d’œil',()=>{
  it('le camp ennemi et le camp allié ne portent pas la même teinte',()=>{
    const css=styles();
    const ennemi=regle(css,'.enemy-side{background:linear-gradient(180deg,#2a0f0b66');
    const allie=regle(css,'.ally-side{background:linear-gradient(180deg,#1d2a1266');
    expect(ennemi,'le camp ennemi n’est plus teinté').toBeTruthy();
    expect(allie,'le camp allié n’est plus teinté').toBeTruthy();
    expect(ennemi).not.toBe(allie);
  });

  it('le nom du champion est empilé sous son portrait, sans troncature',()=>{
    // Il partageait sa ligne avec le portrait et la reserve de la pastille de
    // niveau : sur une carte de 109 px, « Thorgar » s'affichait « T… ».
    const r=regle(styles(),'.compact-unit .unit-identity{display:grid');
    expect(r,'l’identité n’est plus empilée').toContain('grid-template-columns:1fr');
    // On vise la regle du NOM, pas la feuille entiere : `white-space:normal`
    // apparait ailleurs, et une assertion large laissait passer un retour a
    // la troncature.
    // La derniere regle qui TRAITE la propriete decide : viser simplement la
    // derniere regle du selecteur lisait la surcharge de large ecran, qui ne
    // parle que de taille de police.
    const derniere=propriete=>regles(styles(),'.compact-unit .unit-identity strong{')
      .filter(r=>r.includes(`${propriete}:`)).at(-1)||'';
    expect(derniere('white-space'),'le nom est de nouveau tronqué').toContain('white-space:normal');
    expect(derniere('text-overflow'),'le nom est de nouveau coupé').toContain('text-overflow:clip');
  });
});
