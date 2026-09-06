// Evaluation de preparation affichee avant une mission.
//
// Le joueur decide d engager sur cette note. Elle repose sur une detection des
// capacites de l equipe a partir des effets des competences : c est la partie
// la plus fragile, parce qu une erreur ne plante rien, elle conseille mal.
import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{assessTeamForMission}from'../src/utils/stats';
import{HEROES}from'../src/data/heroes';
import{makeHero}from'./helpers';

const source=fs.readFileSync(fileURLToPath(new URL('../src/utils/stats.js',import.meta.url)),'utf8');
const moteur=fs.readFileSync(fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8');

/** Effets listes dans SKILL_TAGS, lus depuis la source. */
function tagsDeclares(){
  const bloc=source.slice(source.indexOf('const SKILL_TAGS={'),source.indexOf('const hasAny='));
  const tags={};
  for(const ligne of bloc.matchAll(/(\w+):\[([^\]]*)\]/gs))
    tags[ligne[1]]=[...ligne[2].matchAll(/'([^']+)'/g)].map(m=>m[1]);
  return tags;
}

/** Champion factice portant exactement les effets demandes. */
const avecEffets=(effets,cible='enemy')=>makeHero({
  skills:effets.map(effect=>({name:effect,icon:'x',cd:0,target:cible,
    description:effect,power:1,effect}))
});

/** Evalue une equipe sur une mission dont on fixe la puissance conseillee. */
function evaluer(equipe,mission={}){
  const getStats=hero=>({hp:hero.hp,atk:hero.atk,def:hero.def,spd:hero.spd,
    crit:5,critDamage:50,accuracy:hero.accuracy??10,resistance:hero.resistance??15,
    setEffects:hero.setEffects||[]});
  return assessTeamForMission(equipe.map(hero=>hero.id),equipe,getStats,
    {difficultyId:'normal',recommended:5000,teamSize:equipe.length,...mission});
}

describe('SKILL_TAGS — coherence avec le reste du jeu',()=>{
  const tags=tagsDeclares();
  const effetsDuRoster=new Set(HEROES.flatMap(hero=>hero.skills.map(skill=>skill.effect)));

  it('les cinq categories sont declarees et non vides',()=>{
    ['heal','cleanse','shield','control','debuff'].forEach(cle=>{
      expect(tags[cle],cle).toBeTruthy();
      expect(tags[cle].length,cle).toBeGreaterThan(0);
    });
  });

  it('chaque effet liste existe reellement sur un champion',()=>{
    // Une entree qui ne correspond a aucun effet est du code mort : elle donne
    // l illusion d une couverture qui n existe pas.
    const orphelins=[];
    Object.entries(tags).forEach(([categorie,effets])=>
      effets.forEach(effet=>{
        if(!effetsDuRoster.has(effet))orphelins.push(`${categorie}: ${effet}`);
      }));
    expect(orphelins).toEqual([]);
  });

  it('chaque effet liste est reellement traite par le moteur de combat',()=>{
    const inconnus=[];
    Object.entries(tags).forEach(([categorie,effets])=>
      effets.forEach(effet=>{
        if(!moteur.includes(`'${effet}'`))inconnus.push(`${categorie}: ${effet}`);
      }));
    expect(inconnus).toEqual([]);
  });

  it('aucune compétence anti-bouclier n est classee comme protection',()=>{
    ['shieldBreaker','shieldExpose','shieldExecute'].forEach(effet=>
      expect(tags.shield,effet).not.toContain(effet));
  });
});

describe('detection des capacites',()=>{
  // Regression : le rapprochement se faisait par sous-chaine sur les effets
  // concatenes. Korga, dont les trois competences BRISENT les boucliers,
  // etait compte comme un fournisseur de boucliers.
  it('un briseur de boucliers ne compte pas comme protection',()=>{
    const korga=avecEffets(['shieldBreaker','shieldExpose','shieldExecute']);
    expect(evaluer([korga]).checks.sustain).toBe('Absent');
  });

  it('Korga, du roster reel, n est plus compte comme protecteur',()=>{
    const korga=HEROES.find(hero=>hero.name==='Korga');
    expect(korga,'Korga doit exister dans le roster').toBeTruthy();
    expect(evaluer([korga]).checks.sustain).toBe('Absent');
  });

  it('un vrai fournisseur de boucliers compte comme protection',()=>{
    expect(evaluer([avecEffets(['guardianWall'],'allAllies')]).checks.sustain).toBe('Partiel');
  });

  it('aegisStrike est reconnu comme un bouclier',()=>{
    expect(evaluer([avecEffets(['aegisStrike'])]).checks.sustain).toBe('Partiel');
  });

  it('un soin l emporte sur un simple bouclier dans le verdict de soutien',()=>{
    expect(evaluer([avecEffets(['healingTotem'],'allAllies')]).checks.sustain).toBe('Adapté');
  });

  it('le rapprochement est exact et non par sous-chaine',()=>{
    // Cas discriminant : chacun de ces noms CONTIENT un effet liste comme
    // sous-chaine stricte, tout en designant l inverse. Un rapprochement par
    // sous-chaine les classerait protecteur et soigneur ; le rapprochement
    // exact ne leur accorde rien. C est la forme exacte du bug d origine, dont
    // Korga etait la victime reelle.
    const resultat=evaluer([avecEffets(['rescueShieldBreaker','healingTotemSuppressor'])]);
    expect(resultat.checks.sustain).toBe('Absent');
    expect(resultat.checks.cleanse).toBe('Absente');
  });

  it('un effet inconnu n apporte aucune capacite',()=>{
    const resultat=evaluer([avecEffets(['effetTotalementInconnu'])]);
    expect(resultat.checks.sustain).toBe('Absent');
    expect(resultat.checks.cleanse).toBe('Absente');
  });

  it('la purification est detectee sur les effets qui purifient vraiment',()=>{
    expect(evaluer([avecEffets(['seedBloom'],'allAllies')]).checks.cleanse).toBe('Présente');
    expect(evaluer([avecEffets(['condemnStrip'])]).checks.cleanse).toBe('Absente');
  });

  it('les degats de zone sont detectes sur la cible, pas sur l effet',()=>{
    const zone=evaluer([avecEffets(['arcaneBlast'],'allEnemies')],
      {enemies:[{hp:1,atk:1,def:1,spd:1},{hp:1,atk:1,def:1,spd:1},{hp:1,atk:1,def:1,spd:1}]});
    expect(zone.gaps).not.toContain('Peu de dégâts de zone pour gérer les serviteurs.');
  });
});

describe('bornes du score et des notes',()=>{
  const faible=()=>makeHero({hp:10,atk:1,def:1,spd:1});

  it('le score reste dans 0 a 100 sur une equipe tres faible et lacunaire',()=>{
    const resultat=evaluer([faible()],{raid:true,recommended:999999,teamSize:4,
      affixIds:['necrotic'],enemies:[{hp:1,atk:1,def:1,spd:1,element:'Feu'},
        {hp:1,atk:1,def:1,spd:1},{hp:1,atk:1,def:1,spd:1}]});
    expect(resultat.score).toBeGreaterThanOrEqual(0);
    expect(resultat.score).toBeLessThanOrEqual(100);
    expect(resultat.gaps.length).toBeGreaterThan(3);
  });

  it('les trois notes restent dans 0 a 100',()=>{
    [evaluer([faible()],{recommended:999999}),
     evaluer([makeHero({hp:99999,atk:9999,def:9999,spd:9999})],{recommended:1})]
      .forEach(resultat=>['damage','survival','tempo'].forEach(cle=>{
        expect(resultat.checks[cle],cle).toBeGreaterThanOrEqual(0);
        expect(resultat.checks[cle],cle).toBeLessThanOrEqual(100);
      }));
  });

  it('un verdict est toujours rendu, avec une etiquette et une icone',()=>{
    [1,5000,999999].forEach(recommended=>{
      const{verdict}=evaluer([makeHero({})],{recommended});
      expect(verdict.key).toBeTruthy();
      expect(verdict.label).toBeTruthy();
      expect(verdict.icon).toBeTruthy();
    });
  });

  it('tient sur une equipe vide sans produire de valeur non finie',()=>{
    const resultat=evaluer([]);
    expect(Number.isFinite(resultat.score)).toBe(true);
    expect(Number.isFinite(resultat.ratio)).toBe(true);
    expect(resultat.power).toBe(0);
  });
});

describe('plafonds de prudence',()=>{
  const costaud=()=>makeHero({hp:20000,atk:2000,def:900,spd:200});

  it('une equipe trop faible ne peut pas depasser le palier de son ratio',()=>{
    // ratio < 0,70 plafonne le score a 39.
    expect(evaluer([costaud()],{recommended:9999999}).score).toBeLessThanOrEqual(39);
  });

  it('un combat prolonge sans soin plafonne le score',()=>{
    const sansSoin=evaluer([costaud(),costaud(),costaud()],
      {recommended:1,boss:true,teamSize:3});
    expect(sansSoin.score).toBeLessThanOrEqual(69);
    expect(sansSoin.gaps).toContain('Aucun soin fiable pour un combat prolongé.');
  });

  it('un raid sans set Ignifuge plafonne le score',()=>{
    const soigneur={...avecEffets(['healingTotem'],'allAllies'),hp:20000,atk:2000,def:900,spd:200};
    const resultat=evaluer([soigneur],{recommended:1,raid:true,teamSize:1});
    expect(resultat.score).toBeLessThanOrEqual(69);
    expect(resultat.gaps).toContain('Aucun bonus Ignifuge actif.');
  });

  it('une composition incomplete est signalee',()=>{
    expect(evaluer([makeHero({})],{teamSize:4}).gaps[0]).toContain('Composition incomplète');
  });

  it('une Precision faible est signalee quand l equipe mise sur les malus',()=>{
    const empoisonneur={...avecEffets(['alchemyPoison']),accuracy:5};
    expect(evaluer([empoisonneur],{recommended:1}).gaps)
      .toContain('Précision moyenne faible pour fiabiliser les malus.');
  });
});
