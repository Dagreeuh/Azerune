// Contrat des Chroniques légendaires.
//
// La chaine est longue : une relique tombe d'une activite, le joueur l'examine,
// la chronique s'active, un world boss devient accessible, puis l'arme Unique
// se forge. Chaque maillon est declare dans un fichier different.
//
// Si un maillon manque, rien ne plante : le contenu devient simplement
// inaccessible. C'etait le cas de la Larme de la Mer ancienne, seule relique
// sur huit a n'etre accordee par aucune activite — bloquant la chronique
// « tides », son world boss, sa forge, et par ricochet le haut fait
// « Chroniques accomplies » qui exige les sept armes.
import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{UNIQUE_WEAPONS,RELICS,CHRONICLE_STEPS}from'../src/data/legendary';
import{WORLD_BOSSES}from'../src/data/worldBosses';
import{HEROES}from'../src/data/heroes';
import{SETS}from'../src/data/items';

const contexte=fs.readFileSync(
  fileURLToPath(new URL('../src/store/GameContext.jsx',import.meta.url)),'utf8');

const armes=Object.keys(UNIQUE_WEAPONS);
const nomsDeChampions=new Set(HEROES.map(hero=>hero.name));
const idsDeReliques=new Set(RELICS.map(relique=>relique.id));

describe('armes uniques',()=>{
  it('chaque arme declare une relique qui existe',()=>{
    const casses=armes.filter(id=>!idsDeReliques.has(UNIQUE_WEAPONS[id].relic))
      .map(id=>`${id} -> ${UNIQUE_WEAPONS[id].relic}`);
    expect(casses).toEqual([]);
  });

  it('une seconde relique, quand elle existe, existe aussi',()=>{
    const casses=armes.filter(id=>{
      const seconde=UNIQUE_WEAPONS[id].secondRelic;
      return seconde&&!idsDeReliques.has(seconde);
    });
    expect(casses).toEqual([]);
  });

  it('chaque arme vise un set d equipement qui existe',()=>{
    const casses=armes.filter(id=>!SETS[UNIQUE_WEAPONS[id].setId])
      .map(id=>`${id} -> ${UNIQUE_WEAPONS[id].setId}`);
    expect(casses).toEqual([]);
  });

  it('chaque arme ne cite que des champions du roster',()=>{
    const casses=armes.flatMap(id=>(UNIQUE_WEAPONS[id].heroes||[])
      .filter(nom=>!nomsDeChampions.has(nom)).map(nom=>`${id} -> ${nom}`));
    expect(casses).toEqual([]);
  });

  it('chaque arme a ses etapes de chronique, et reciproquement',()=>{
    expect(armes.filter(id=>!CHRONICLE_STEPS[id])).toEqual([]);
    expect(Object.keys(CHRONICLE_STEPS).filter(id=>!UNIQUE_WEAPONS[id])).toEqual([]);
  });

  it('chaque chronique se termine par la forge de son arme',()=>{
    armes.forEach(id=>{
      const etapes=CHRONICLE_STEPS[id];
      expect(etapes.length,`${id}`).toBeGreaterThan(1);
      expect(etapes[etapes.length-1][2],`${id} dernière étape`).toBe('gear');
    });
  });
});

describe('reliques — source réelle',()=>{
  // Le contrôle décisif : une relique que rien n'accorde bloque toute sa
  // chronique, en silence.
  it('chaque relique est accordée par au moins une activité',()=>{
    const orphelines=RELICS.filter(relique=>!contexte.includes(`'${relique.id}'`))
      .map(relique=>`${relique.id} « ${relique.name} » — aucune activité ne l'accorde`);
    expect(orphelines).toEqual([]);
  });

  it('chaque relique se rattache à une arme existante',()=>{
    const orphelines=RELICS.filter(relique=>!UNIQUE_WEAPONS[relique.weaponId])
      .map(relique=>`${relique.id} -> ${relique.weaponId}`);
    expect(orphelines).toEqual([]);
  });

  it('chaque arme est couverte par au moins une relique',()=>{
    const sansRelique=armes.filter(id=>!RELICS.some(relique=>relique.weaponId===id));
    expect(sansRelique).toEqual([]);
  });

  it('les identifiants de relique sont uniques',()=>{
    const ids=RELICS.map(relique=>relique.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('world boss',()=>{
  const bosses=Object.values(WORLD_BOSSES);

  it('chaque world boss vise une arme existante',()=>{
    const casses=bosses.filter(boss=>!UNIQUE_WEAPONS[boss.weaponId])
      .map(boss=>`${boss.id} -> ${boss.weaponId}`);
    expect(casses).toEqual([]);
  });

  it('chaque world boss annonce un adversaire et une puissance conseillée',()=>{
    bosses.forEach(boss=>{
      expect(boss.enemies?.length,`${boss.id}`).toBeGreaterThan(0);
      expect(boss.recommended,`${boss.id}`).toBeGreaterThan(0);
      expect(boss.name,`${boss.id}`).toBeTruthy();
    });
  });

  it('chaque chronique citant un world boss en a réellement un',()=>{
    // Une étape « worldboss » sans boss correspondant bloquerait la chronique.
    const manquants=Object.entries(CHRONICLE_STEPS)
      .filter(([id,etapes])=>etapes.some(etape=>etape[2]==='worldboss'))
      .filter(([id])=>!bosses.some(boss=>boss.weaponId===id))
      .map(([id])=>`${id} attend un world boss qui n'existe pas`);
    expect(manquants).toEqual([]);
  });
});
