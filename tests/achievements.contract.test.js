// Contrat des compteurs de hauts faits.
//
// Un haut fait designe sa source par un chemin en clair :
// 'lifetime.combat.damageDealt', 'champions.1.skillUses.guardianStrike'. La
// resolution se fait par reduce sur les points, avec un repli a 0. Un chemin
// mal orthographie, ou pointant vers une branche jamais alimentee, ne leve
// rien : le haut fait reste bloque a zero pour toujours.
//
// C'est ce qui s'est produit : la v1.51.2 annoncait « l'agregation par champion
// des degats, soins, mitigations », et `progressionStats.champions` etait
// initialise a {} sans jamais etre ecrit. Les 104 hauts faits de maitrise,
// soit 46 % du total, etaient impossibles a terminer.
import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{ACHIEVEMENTS,ACHIEVEMENT_CATEGORIES,achievementProgress,achievementReady}
  from'../src/data/achievements';
import{UNIQUE_WEAPONS}from'../src/data/legendary';
import{CONTINENTS,DIFFICULTIES}from'../src/data/campaign';
import{MAX_RESONANCE,MAX_STARS,MAX_LEVEL,levelCap}from'../src/utils/progression';
import{ITEM_MAX_UPGRADE}from'../src/data/items';
import{emptyProgressionStats,emptyChampionStat,mergeChampionStats,CHAMPION_METRICS}
  from'../src/utils/progressionStats';
import{HEROES}from'../src/data/heroes';

const code=fs.readFileSync(
  fileURLToPath(new URL('../src/store/GameContext.jsx',import.meta.url)),'utf8');

const reference=emptyProgressionStats();
const heroesById=new Map(HEROES.map(hero=>[String(hero.id),hero]));

/** Le chemin resout-il dans la forme de reference ? */
const resoutDans=(objet,chemin)=>
  chemin.split('.').reduce((valeur,cle)=>
    valeur&&typeof valeur==='object'&&cle in valeur?valeur[cle]:undefined,objet)!==undefined;

const compteurs=ACHIEVEMENTS.filter(a=>a.counter).map(a=>({id:a.id,counter:a.counter,name:a.name}));
const champions=compteurs.filter(a=>a.counter.startsWith('champions.'));
const globaux=compteurs.filter(a=>!a.counter.startsWith('champions.'));

describe('compteurs globaux',()=>{
  it('il y en a un nombre significatif',()=>{
    expect(globaux.length).toBeGreaterThan(80);
  });

  it('chaque chemin resout dans la forme des statistiques',()=>{
    const casses=globaux.filter(a=>!resoutDans(reference,a.counter))
      .map(a=>`${a.id} « ${a.name} » lit ${a.counter}`);
    expect(casses).toEqual([]);
  });

  it('chaque chemin pointe sur un nombre, pas sur une branche',()=>{
    const mauvais=globaux.filter(a=>{
      const valeur=a.counter.split('.').reduce((v,k)=>v?.[k],reference);
      return typeof valeur!=='number';
    }).map(a=>`${a.id} lit ${a.counter}`);
    expect(mauvais).toEqual([]);
  });
});

describe('compteurs de maitrise par champion',()=>{
  it('il y en a un par competence et un par role, pour chaque champion',()=>{
    expect(champions.length).toBe(HEROES.length*4);
  });

  it('chaque compteur vise un champion qui existe',()=>{
    const inconnus=champions.filter(a=>!heroesById.has(a.counter.split('.')[1]))
      .map(a=>`${a.id} lit ${a.counter}`);
    expect(inconnus).toEqual([]);
  });

  it('chaque compteur de competence vise un effet du kit de ce champion',()=>{
    const casses=[];
    champions.filter(a=>a.counter.includes('.skillUses.')).forEach(a=>{
      const[, id,,effet]=a.counter.split('.');
      const hero=heroesById.get(id);
      if(!hero?.skills?.some(skill=>skill.effect===effet))
        casses.push(`${a.id} lit ${a.counter} — absent du kit de ${hero?.name||id}`);
    });
    expect(casses).toEqual([]);
  });

  it('chaque compteur de role vise une metrique reellement cumulee',()=>{
    const casses=champions.filter(a=>!a.counter.includes('.skillUses.'))
      .filter(a=>!CHAMPION_METRICS.includes(a.counter.split('.')[2]))
      .map(a=>`${a.id} lit ${a.counter}`);
    expect(casses).toEqual([]);
  });
});

describe('les statistiques par champion sont reellement alimentees',()=>{
  it('le rapport de combat est agrege dans progressionStats',()=>{
    // Sans cet appel, les 104 maitrises restent a zero pour toujours.
    expect(code).toContain('mergeChampionStats(current.champions,battle.combatStats)');
  });

  it('un combat credite les compteurs que les maitrises lisent',()=>{
    const hero=HEROES[0];
    const effet=hero.skills[0].effect;
    const combatStats={[hero.id]:{damage:1200,healing:300,mitigation:150,
      skillUses:{[effet]:3}}};
    const stats={...emptyProgressionStats(),
      champions:mergeChampionStats({},combatStats)};

    const lire=chemin=>chemin.split('.').reduce((v,k)=>v?.[k],stats);
    expect(lire(`champions.${hero.id}.damage`)).toBe(1200);
    expect(lire(`champions.${hero.id}.healing`)).toBe(300);
    expect(lire(`champions.${hero.id}.mitigation`)).toBe(150);
    expect(lire(`champions.${hero.id}.skillUses.${effet}`)).toBe(3);
  });

  it('un haut fait de maitrise devient realisable apres assez de combats',()=>{
    const cible=ACHIEVEMENTS.find(a=>String(a.counter||'').includes('.skillUses.'));
    const[, id,,effet]=cible.counter.split('.');
    let champions={};
    // Un combat par utilisation, comme en jeu.
    for(let tour=0;tour<cible.goal;tour+=1)
      champions=mergeChampionStats(champions,{[id]:{skillUses:{[effet]:1}}});
    const etat={progressionStats:{...emptyProgressionStats(),champions}};
    expect(achievementProgress(cible,etat).current).toBe(cible.goal);
    expect(achievementReady(cible,etat)).toBe(true);
  });

  it('sans agregation, ces hauts faits restent bloques a zero',()=>{
    // Formulation du bug d'origine : la forme vide ne suffit pas.
    const cible=ACHIEVEMENTS.find(a=>String(a.counter||'').includes('.skillUses.'));
    const etat={progressionStats:emptyProgressionStats()};
    expect(achievementProgress(cible,etat).current).toBe(0);
    expect(achievementReady(cible,etat)).toBe(false);
  });
});

describe('coherence du catalogue',()=>{
  it('les identifiants de hauts faits sont uniques',()=>{
    const ids=ACHIEVEMENTS.map(a=>a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque haut fait annonce un but positif, un nom et une recompense',()=>{
    ACHIEVEMENTS.forEach(a=>{
      expect(a.goal,`${a.id} but`).toBeGreaterThan(0);
      expect(a.name,`${a.id} nom`).toBeTruthy();
      expect(a.description,`${a.id} description`).toBeTruthy();
      expect(a.reward,`${a.id} recompense`).toBeTruthy();
    });
  });

  it('chaque haut fait appartient a une categorie declaree',()=>{
    const connues=new Set(ACHIEVEMENT_CATEGORIES);
    const orphelins=ACHIEVEMENTS.filter(a=>!connues.has(a.category))
      .map(a=>`${a.id} en categorie « ${a.category} »`);
    expect(orphelins).toEqual([]);
  });

  it('chaque haut fait a soit un compteur, soit une valeur derivee',()=>{
    const sansSource=ACHIEVEMENTS.filter(a=>!a.counter&&!a.derived).map(a=>a.id);
    expect(sansSource).toEqual([]);
  });

  it('les paliers d une serie montent, et la recompense avec',()=>{
    const series={};
    ACHIEVEMENTS.filter(a=>a.series).forEach(a=>{
      (series[a.series]=series[a.series]||[]).push(a);
    });
    Object.entries(series).forEach(([nom,paliers])=>{
      const tries=[...paliers].sort((a,b)=>a.tier-b.tier);
      for(let index=1;index<tries.length;index+=1){
        expect(tries[index].goal,`${nom} palier ${index+1}`)
          .toBeGreaterThan(tries[index-1].goal);
        expect(tries[index].score,`${nom} score ${index+1}`)
          .toBeGreaterThan(tries[index-1].score);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Valeurs derivees.
//
// Second chemin de resolution, a cote des compteurs : `derived(name, state)`
// renvoie `{...}[name] || 0`. Un nom non gere retombe donc a 0, exactement
// comme un chemin qui ne resout pas — meme silence, meme haut fait bloque.

/** Etat de jeu complet, tel que GameContext le transmet. */
const etatVide=()=>({campaign:{scores:{}},expeditionProgress:{},raidProgress:{},
  mythicProgress:{},owned:[],championProgress:{},forgeHistory:[],inventory:[],
  history:[],legendaryChronicles:{obtainedWeapons:{}},
  progressionStats:emptyProgressionStats()});

/** Etat d'un joueur ayant tout termine. */
function etatComplet(){
  const championProgress=Object.fromEntries(HEROES.map(hero=>
    [hero.id,{level:MAX_LEVEL,xp:0,stars:MAX_STARS,soulFragments:0,resonance:MAX_RESONANCE}]));
  const scores=Object.fromEntries(CONTINENTS.flatMap(continent=>
    (continent.stages||[]).flatMap(stage=>
      DIFFICULTIES.map(difficulte=>[`${difficulte.id}:${continent.id}:${stage.id}`,3]))));
  return{...etatVide(),
    owned:HEROES.map(hero=>hero.id),
    championProgress,
    campaign:{scores},
    inventory:[{id:'i1',level:ITEM_MAX_UPGRADE}],
    legendaryChronicles:{obtainedWeapons:Object.fromEntries(
      Object.keys(UNIQUE_WEAPONS).map(cle=>[cle,true]))}};
}

const derives=ACHIEVEMENTS.filter(a=>a.derived);

describe('valeurs derivees',()=>{
  it('il y en a, et chacune a un but',()=>{
    expect(derives.length).toBeGreaterThan(5);
    derives.forEach(a=>expect(a.goal,`${a.id}`).toBeGreaterThan(0));
  });

  it('chaque valeur derivee est reellement calculee, jamais un repli muet',()=>{
    // Un nom non gere renvoie 0 en silence. On le detecte en comparant un etat
    // vide a un etat ou tout est termine : une valeur reellement calculee doit
    // bouger, sinon elle est indistinguable d'un nom inconnu.
    const vide=etatVide(),complet=etatComplet();
    const muettes=[...new Set(derives.map(a=>a.derived))].filter(nom=>{
      const faux={id:'x',derived:nom,goal:1};
      return achievementProgress(faux,vide).current===achievementProgress(faux,complet).current;
    });
    expect(muettes).toEqual([]);
  });

  it('chaque valeur derivee reste un nombre fini, meme sur un etat vide',()=>{
    [...new Set(derives.map(a=>a.derived))].forEach(nom=>{
      const valeur=achievementProgress({id:'x',derived:nom,goal:1},etatVide()).current;
      expect(Number.isFinite(valeur),nom).toBe(true);
      expect(valeur,nom).toBeGreaterThanOrEqual(0);
    });
  });

  it('tolere un etat incomplet sans lever',()=>{
    [...new Set(derives.map(a=>a.derived))].forEach(nom=>{
      expect(()=>achievementProgress({id:'x',derived:nom,goal:1},{}),nom).not.toThrow();
    });
  });

  it('aucun haut fait derive n est bloque a zero une fois le jeu termine',()=>{
    // Le test qu'aucune suite ne faisait : le joueur qui a tout fait peut-il
    // vraiment tout valider ?
    const complet=etatComplet();
    const impossibles=derives.filter(a=>!achievementReady(a,complet))
      .map(a=>`${a.id} « ${a.name} » — ${a.derived} atteint ` +
        `${achievementProgress(a,complet).current}/${a.goal}`);
    expect(impossibles).toEqual([]);
  });
});

describe('atteignabilite des buts derives',()=>{
  it('les buts de collection ne depassent pas le roster',()=>{
    derives.filter(a=>['ownedCount','sixStarCount','level60Count'].includes(a.derived))
      .forEach(a=>expect(a.goal,`${a.id}`).toBeLessThanOrEqual(HEROES.length));
  });

  it('le but de Resonance ne depasse pas le maximum du jeu',()=>{
    derives.filter(a=>a.derived==='maxResonance')
      .forEach(a=>expect(a.goal,`${a.id}`).toBeLessThanOrEqual(MAX_RESONANCE));
  });

  it('le niveau 60 est bien atteignable au maximum d etoiles',()=>{
    expect(levelCap(MAX_STARS)).toBeGreaterThanOrEqual(MAX_LEVEL);
  });

  it('le but d etoiles de campagne ne depasse pas ce que la campagne peut rendre',()=>{
    const etapes=CONTINENTS.reduce((n,c)=>n+(c.stages?.length||0),0);
    const maximum=etapes*DIFFICULTIES.length*3;
    derives.filter(a=>a.derived==='campaignStars').forEach(a=>
      expect(a.goal,`${a.id} vise ${a.goal} etoiles sur ${maximum} possibles`)
        .toBeLessThanOrEqual(maximum));
  });

  it('le seuil des Chroniques suit le nombre d armes uniques du jeu',()=>{
    // Ecrit en dur, il aurait valide le haut fait a 7 sur 8 apres l ajout d une
    // arme, ou l aurait rendu impossible apres un retrait.
    const partiel={...etatComplet(),legendaryChronicles:{obtainedWeapons:
      Object.fromEntries(Object.keys(UNIQUE_WEAPONS).slice(1).map(cle=>[cle,true]))}};
    const cible=derives.find(a=>a.derived==='uniqueComplete');
    expect(achievementReady(cible,partiel)).toBe(false);
    expect(achievementReady(cible,etatComplet())).toBe(true);
  });
});
