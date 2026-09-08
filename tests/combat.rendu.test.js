import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';

// React peut rejouer un updater de setState pendant un rendu. Un effet de bord
// place a l'interieur part donc au mauvais moment — d'ou l'avertissement
// « Cannot update a component while rendering a different component » — et,
// bien plus grave ici, le MOTEUR DE COMBAT y etait appele : l'action etait
// recalculee, tirages aleatoires compris, puis jetee.
const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const page=lire('../src/pages/BattlePage.jsx');

/**
 * Corps des updaters de setState de la page : `setX(current=>{ … })`.
 * On equilibre les accolades pour ne pas s'arreter a la premiere fermeture.
 */
const updaters=(()=>{
  // On extrait l'ARGUMENT de chaque `setX(...)` en equilibrant les parentheses,
  // puis on ne garde que ceux qui sont des fonctions. Parser la seule forme
  // `setX(current=>{…})` laissait passer deux echappatoires : un autre nom de
  // parametre, et un corps concis sans accolades — `setX(cur=>expr)`.
  const trouves=[];
  // `setTimeout` et consorts commencent aussi par `set` + majuscule, et leur
  // rappel a parfaitement le droit d'avoir des effets de bord : il s'execute
  // hors rendu. Les exclure explicitement plutot que de relacher la regle.
  const MINUTEURS=new Set(['setTimeout','setInterval','setImmediate']);
  const motif=/\b(set[A-Z][A-Za-z]*)\(/g;
  let entree;
  while((entree=motif.exec(page))){
    if(MINUTEURS.has(entree[1]))continue;
    let profondeur=1,index=motif.lastIndex;
    while(index<page.length&&profondeur>0){
      const caractere=page[index];
      if(caractere==='(')profondeur+=1;
      else if(caractere===')')profondeur-=1;
      index+=1;
    }
    const argument=page.slice(motif.lastIndex,index-1);
    if(argument.includes('=>'))trouves.push({debut:entree.index,corps:argument});
  }
  return trouves;
})();

describe('aucun effet de bord dans un updater de rendu',()=>{
  it('la page contient bien des updaters à inspecter',()=>{
    // Sans cette garde, une refonte qui supprimerait tous les updaters rendrait
    // les tests suivants vrais par vacuite.
    expect(updaters.length).toBeGreaterThan(2);
  });

  it('la boucle AUTO n’appelle plus le moteur depuis un updater',()=>{
    // C'etait le cas nuisible : `performAutoAction` y cotoyait `progress()`,
    // un setState du fournisseur. Rejoue pendant un rendu, le compteur de quete
    // pouvait avancer plusieurs fois pour une seule action.
    updaters.forEach(({corps},index)=>
      expect(corps.includes('performAutoAction('),
        `updater n°${index+1} appelle encore performAutoAction()`).toBe(false));
  });

  it('aucun updater ne mêle un appel moteur à un effet de bord',()=>{
    // Quatre updaters de reprise (« watchdog ») appellent encore nextTurn ou
    // enemyAction. C'est un reste inelegant — un rejeu recalcule l'etat — mais
    // sans consequence observable : React retient la derniere valeur rendue, et
    // ces updaters n'ont AUCUN effet de bord. Les reecrire toucherait a la
    // logique de reprise des combats bloques, pour un gain nul. Ce test
    // verrouille la seule combinaison reellement dangereuse.
    const MOTEUR=['performAutoAction(','nextTurn(','enemyAction(','castSkill('];
    const EFFETS=['progress(','grantXp(','grantSummonerXp(','recordBattleResult(',
      'updateBattleSession(','localStorage','sessionStorage'];
    updaters.forEach(({corps},index)=>{
      const moteur=MOTEUR.filter(appel=>corps.includes(appel));
      const effets=EFFETS.filter(appel=>corps.includes(appel));
      expect(moteur.length&&effets.length?`${moteur} + ${effets}`:'',
        `updater n°${index+1} mêle moteur et effet de bord`).toBe('');
    });
  });

  it('aucun updater ne déclenche un setState du fournisseur de jeu',()=>{
    ['progress(','grantXp(','grantSummonerXp(','recordBattleResult(','updateBattleSession(',
     'finishCampaignMission(','finishRaidMission(','finishMythicMission(','abandonBattle(',
     'writeCombatPref('].forEach(appel=>updaters.forEach(({corps},index)=>
      expect(corps.includes(appel),`updater n°${index+1} appelle ${appel})`).toBe(false)));
  });

  it('aucun updater n’écrit dans le stockage',()=>{
    updaters.forEach(({corps},index)=>{
      expect(corps.includes('localStorage'),`updater n°${index+1} touche localStorage`).toBe(false);
      expect(corps.includes('sessionStorage'),`updater n°${index+1} touche sessionStorage`).toBe(false);
    });
  });

  it('la boucle AUTO lit l’état commité au lieu d’un updater',()=>{
    // `battleRef` porte le dernier combat commite : les gardes contre un etat
    // perime sont conservees, mais l'action n'est jouee qu'une fois.
    //
    // Compter les occurrences plutot que d'en chercher une : les deux chemins
    // AUTO — premier tour et action — doivent lire la reference, et `toContain`
    // resterait vrai si l'un des deux repassait sur la valeur de rendu.
    const lectures=page.match(/const courant=battleRef\.current;/g)||[];
    expect(lectures.length,'les deux chemins AUTO doivent lire battleRef').toBe(2);
    expect(page).not.toMatch(/const courant=battle;/);
    expect(page).toMatch(/courant\?\.autoMode&&!courant\.winner&&courant\.turn===turn/);
  });

  it('la progression de quête part hors de tout updater',()=>{
    const position=page.indexOf("progress('skills');setBattle(result.battle)");
    expect(position,'l’appel attendu est introuvable').toBeGreaterThan(-1);
    expect(updaters.some(({corps})=>corps.includes("progress('skills')"))).toBe(false);
  });
});
