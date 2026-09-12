// Academie de l'Invocateur : lecons, defis et recompenses.
//
// Douze lecons a 50 Cristaux, plus une recompense finale. Chaque lecon porte un
// defi dont le type est rendu par l'interface : un type non gere afficherait une
// lecon impossible a terminer, donc une recompense inatteignable.
import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{ACADEMY_TUTORIALS,ACADEMY_REWARD,ACADEMY_FINAL_REWARD,ACADEMY_TOTAL_REWARD,
        emptyAcademyProgress}from'../src/data/tutorials';
import{academyLessonExists,canClaimAcademyLesson,academyComplete,
        canClaimAcademyFinal,academySummary}from'../src/utils/academy';

const ui=['../src/components/TutorialModal.jsx','../src/pages/TutorialAcademyPage.jsx']
  .map(p=>fs.readFileSync(fileURLToPath(new URL(p,import.meta.url)),'utf8')).join('\n');

/** Progression avec les lecons indiquees terminees, et eventuellement encaissees. */
const progres=(terminees=[],encaissees=[],finalClaimed=false)=>({
  completed:Object.fromEntries(terminees.map(id=>[id,1])),
  claimed:Object.fromEntries(encaissees.map(id=>[id,1])),
  finalClaimed
});
const toutes=ACADEMY_TUTORIALS.map(l=>l.id);

describe('catalogue des lecons',()=>{
  it('compte douze lecons aux identifiants uniques',()=>{
    expect(ACADEMY_TUTORIALS).toHaveLength(12);
    expect(new Set(toutes).size).toBe(toutes.length);
  });

  it('chaque lecon annonce un titre, un resume et des sujets',()=>{
    ACADEMY_TUTORIALS.forEach(lecon=>{
      expect(lecon.title,`${lecon.id} titre`).toBeTruthy();
      expect(lecon.summary,`${lecon.id} resume`).toBeTruthy();
      expect(lecon.topics?.length,`${lecon.id} sujets`).toBeGreaterThan(0);
    });
  });

  // Contrat de cablage : un type de defi que l'interface ne sait pas rendre
  // bloquerait la lecon, et donc les 50 Cristaux qui vont avec.
  it('chaque type de defi est reellement rendu par l interface',()=>{
    const types=[...new Set(ACADEMY_TUTORIALS.map(l=>l.challenge?.type).filter(Boolean))];
    expect(types.length).toBeGreaterThan(0);
    const nonRendus=types.filter(type=>!ui.includes(`'${type}'`));
    expect(nonRendus).toEqual([]);
  });

  it('chaque lecon porte un defi avec une consigne',()=>{
    ACADEMY_TUTORIALS.forEach(lecon=>{
      expect(lecon.challenge,`${lecon.id} defi`).toBeTruthy();
      expect(lecon.challenge.type,`${lecon.id} type`).toBeTruthy();
      expect(lecon.challenge.prompt,`${lecon.id} consigne`).toBeTruthy();
    });
  });

  it('chaque defi a choix designe une reponse qui existe',()=>{
    ACADEMY_TUTORIALS.filter(l=>l.challenge?.type==='choice').forEach(lecon=>{
      const defi=lecon.challenge;
      expect(Array.isArray(defi.choices),`${lecon.id} choix`).toBe(true);
      expect(defi.choices.length,`${lecon.id} choix`).toBeGreaterThan(1);
      expect(defi.choices[defi.answer],`${lecon.id} réponse ${defi.answer}`).toBeTruthy();
    });
  });
});

describe('recompenses annoncees',()=>{
  it('le total correspond a la somme des lecons',()=>{
    // Fige en clair : ACADEMY_TOTAL_REWARD est calcule a partir de ces deux
    // valeurs, donc les remultiplier ici ne testerait rien.
    expect(ACADEMY_REWARD).toBe(50);
    expect(ACADEMY_TUTORIALS).toHaveLength(12);
    expect(ACADEMY_TOTAL_REWARD).toBe(600);
    expect(ACADEMY_TOTAL_REWARD).toBe(ACADEMY_REWARD*ACADEMY_TUTORIALS.length);
  });

  it('la recompense finale est complete',()=>{
    expect(ACADEMY_FINAL_REWARD.gold).toBeGreaterThan(0);
    expect(ACADEMY_FINAL_REWARD.stones).toBeGreaterThan(0);
  });

  it('la progression vide ne contient aucune lecon terminee',()=>{
    expect(emptyAcademyProgress()).toEqual({completed:{},claimed:{},finalClaimed:false});
  });
});

describe('reclamation d une lecon',()=>{
  const premiere=toutes[0];

  it('refuse une lecon inconnue',()=>{
    expect(academyLessonExists('inexistante')).toBe(false);
    expect(canClaimAcademyLesson('inexistante',progres(toutes)).message).toContain('inconnue');
  });

  it('refuse une lecon non terminee',()=>{
    expect(canClaimAcademyLesson(premiere,progres()).message).toContain('Termine');
  });

  it('accorde les Cristaux d une lecon terminee',()=>{
    expect(canClaimAcademyLesson(premiere,progres([premiere])))
      .toEqual({ok:true,gems:ACADEMY_REWARD});
  });

  it('refuse une recompense deja prise',()=>{
    expect(canClaimAcademyLesson(premiere,progres([premiere],[premiere])).ok).toBe(false);
  });

  it('tolere une progression absente',()=>{
    expect(canClaimAcademyLesson(premiere,undefined).ok).toBe(false);
    expect(()=>canClaimAcademyLesson(premiere,{})).not.toThrow();
  });
});

describe('recompense finale',()=>{
  it('exige les douze lecons',()=>{
    expect(academyComplete(progres(toutes.slice(0,11)))).toBe(false);
    expect(academyComplete(progres(toutes))).toBe(true);
    expect(canClaimAcademyFinal(progres(toutes.slice(0,11))).message).toContain('12');
  });

  it('ne demande pas d avoir encaisse chaque lecon',()=>{
    // Terminer suffit : les Cristaux de chaque lecon sont independants.
    expect(canClaimAcademyFinal(progres(toutes,[])).ok).toBe(true);
  });

  it('accorde Or et Pierre de foyer une seule fois',()=>{
    const resultat=canClaimAcademyFinal(progres(toutes));
    expect(resultat.gold).toBe(ACADEMY_FINAL_REWARD.gold);
    expect(resultat.stones).toBe(ACADEMY_FINAL_REWARD.stones);
    expect(canClaimAcademyFinal(progres(toutes,[],true)).ok).toBe(false);
  });
});

describe('avancement affiche',()=>{
  it('decrit une academie intacte',()=>{
    expect(academySummary(emptyAcademyProgress())).toEqual({
      total:12,completed:0,claimed:0,pendingGems:0,
      complete:false,finalReady:false,finalClaimed:false});
  });

  it('compte les Cristaux en attente',()=>{
    const etat=academySummary(progres(toutes.slice(0,5),toutes.slice(0,2)));
    expect(etat.completed).toBe(5);
    expect(etat.claimed).toBe(2);
    expect(etat.pendingGems).toBe(3*ACADEMY_REWARD);
  });

  it('signale la recompense finale quand tout est termine',()=>{
    expect(academySummary(progres(toutes)).finalReady).toBe(true);
    expect(academySummary(progres(toutes,[],true)).finalReady).toBe(false);
  });

  it('l academie entiere rapporte le total annonce',()=>{
    expect(academySummary(progres(toutes)).total*ACADEMY_REWARD).toBe(ACADEMY_TOTAL_REWARD);
  });
});
