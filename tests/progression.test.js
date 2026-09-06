// Progression de champion : niveaux, evolution, resonance, doublons.
//
// C'est l'economie du jeu : ce que rapporte un doublon, ce que coute une
// etoile, et combien de tirages separent un champion de son maximum.
import{describe,it,expect}from'vitest';
import{MAX_STARS,MAX_LEVEL,MAX_RESONANCE,RESONANCE_COSTS,BLOOD_FRAGMENT_VALUES,
        ASCENSION_COSTS,levelCap,xpForNextLevel,defaultChampionProgress,
        normalizeChampionProgress,addChampionXp,addSoulFragment,
        remainingResonanceFragments,normalizeResonanceOverflow,bloodFragmentValue,
        evolutionStatus,evolveChampion,resonanceStatus,strengthenResonance,
        evolveFromDuplicate,resonanceBonus}from'../src/utils/progression';

const hero=(rarity=3)=>({id:1,name:'Testeur',rarity,hp:100,atk:10,def:5,spd:100});
const progression=(patch={})=>({level:1,xp:0,stars:3,soulFragments:0,resonance:0,...patch});

describe('constantes d economie',()=>{
  it('sont celles annoncees au joueur',()=>{
    expect(MAX_STARS).toBe(6);
    expect(MAX_LEVEL).toBe(60);
    expect(MAX_RESONANCE).toBe(5);
    expect(RESONANCE_COSTS).toEqual([1,2,3,4,5]);
    expect(BLOOD_FRAGMENT_VALUES).toEqual({3:1,4:3,5:10});
  });

  it('le cout d ascension monte a chaque palier',()=>{
    expect(ASCENSION_COSTS[3].gold).toBeLessThan(ASCENSION_COSTS[4].gold);
    expect(ASCENSION_COSTS[4].gold).toBeLessThan(ASCENSION_COSTS[5].gold);
    expect(ASCENSION_COSTS[5].mythic).toBeGreaterThan(0);
  });

  it('les paliers non finaux ne demandent pas d Essence mythique',()=>{
    expect(ASCENSION_COSTS[3].mythic).toBe(0);
    expect(ASCENSION_COSTS[4].mythic).toBe(0);
  });
});

describe('plafond de niveau',()=>{
  it('vaut dix fois le nombre d etoiles, plafonne a 60',()=>{
    expect(levelCap(1)).toBe(10);
    expect(levelCap(3)).toBe(30);
    expect(levelCap(5)).toBe(50);
    expect(levelCap(6)).toBe(MAX_LEVEL);
    expect(levelCap(9)).toBe(MAX_LEVEL);
  });

  it('l XP requis monte a chaque niveau',()=>{
    for(let level=1;level<MAX_LEVEL;level+=1)
      expect(xpForNextLevel(level+1),`niveau ${level}`).toBeGreaterThan(xpForNextLevel(level));
  });
});

describe('normalizeChampionProgress',()=>{
  it('part des etoiles de rarete pour un champion neuf',()=>{
    expect(defaultChampionProgress(hero(4))).toEqual({level:1,xp:0,stars:4,soulFragments:0,resonance:0});
  });

  it('ne descend jamais sous la rarete du champion',()=>{
    expect(normalizeChampionProgress(hero(5),progression({stars:2})).stars).toBe(5);
  });

  it('ne depasse jamais six etoiles',()=>{
    expect(normalizeChampionProgress(hero(3),progression({stars:99})).stars).toBe(MAX_STARS);
  });

  it('borne le niveau au plafond des etoiles',()=>{
    expect(normalizeChampionProgress(hero(3),progression({stars:3,level:99})).level).toBe(30);
    expect(normalizeChampionProgress(hero(3),progression({stars:6,level:99})).level).toBe(60);
    expect(normalizeChampionProgress(hero(3),progression({level:0})).level).toBe(1);
  });

  it('borne la resonance et les Fragments d ame a ce qui reste utile',()=>{
    expect(normalizeChampionProgress(hero(3),progression({resonance:99})).resonance).toBe(MAX_RESONANCE);
    expect(normalizeChampionProgress(hero(3),progression({soulFragments:999})).soulFragments).toBe(15);
    expect(normalizeChampionProgress(hero(3),progression({resonance:5,soulFragments:99})).soulFragments).toBe(0);
  });

  // Un fichier de sauvegarde importe n'est valide qu'en surface : ses valeurs
  // internes ne le sont pas. Une chaine la ou un nombre est attendu propageait
  // NaN dans les etoiles, donc dans le niveau, donc dans toutes les
  // statistiques du champion et la puissance d'equipe.
  it('ne propage jamais NaN, quelle que soit la valeur recue',()=>{
    const mauvaises=[{stars:'abc'},{stars:NaN},{level:'x'},{xp:'y'},{resonance:'z'},
      {soulFragments:'w'},{stars:{}},{level:[]},{xp:Infinity},undefined,null];
    mauvaises.forEach(valeur=>{
      const resultat=normalizeChampionProgress(hero(3),valeur);
      Object.entries(resultat).forEach(([cle,nombre])=>
        expect(Number.isFinite(nombre),`${cle} pour ${JSON.stringify(valeur)}`).toBe(true));
      expect(resultat.stars).toBe(3);
    });
  });

  it('est idempotente',()=>{
    const une=normalizeChampionProgress(hero(3),progression({stars:5,level:40,resonance:2,soulFragments:3}));
    expect(normalizeChampionProgress(hero(3),une)).toEqual(une);
  });
});

describe('experience',()=>{
  it('monte d un niveau une fois le palier atteint',()=>{
    const requis=xpForNextLevel(1);
    expect(addChampionXp(hero(3),progression(),requis).level).toBe(2);
  });

  it('conserve le surplus d XP',()=>{
    const requis=xpForNextLevel(1);
    expect(addChampionXp(hero(3),progression(),requis+10).xp).toBe(10);
  });

  it('enchaine plusieurs niveaux d un coup',()=>{
    const total=xpForNextLevel(1)+xpForNextLevel(2)+xpForNextLevel(3);
    expect(addChampionXp(hero(3),progression(),total).level).toBe(4);
  });

  it('s arrete au plafond des etoiles et remet l XP a zero',()=>{
    const resultat=addChampionXp(hero(3),progression({stars:3}),9999999);
    expect(resultat.level).toBe(30);
    expect(resultat.xp).toBe(0);
  });

  it('ignore un gain negatif ou invalide',()=>{
    expect(addChampionXp(hero(3),progression({xp:50}),-100).xp).toBe(50);
  });

  it('ne boucle pas indefiniment sur un gain enorme',()=>{
    const depart=Date.now();
    addChampionXp(hero(3),progression({stars:6}),Number.MAX_SAFE_INTEGER);
    expect(Date.now()-depart).toBeLessThan(1000);
  });
});

describe('Fragments d ame et resonance',()=>{
  it('il faut quinze Fragments pour tout monter depuis zero',()=>{
    expect(remainingResonanceFragments({resonance:0})).toBe(15);
  });

  it('le reste diminue a chaque palier franchi',()=>{
    const restes=[0,1,2,3,4,5].map(resonance=>remainingResonanceFragments({resonance}));
    expect(restes).toEqual([15,14,12,9,5,0]);
  });

  it('chaque palier coute ce qu annonce la table',()=>{
    [0,1,2,3,4].forEach(resonance=>{
      const statut=resonanceStatus(hero(3),progression({resonance,soulFragments:99}));
      expect(statut.required,`palier ${resonance+1}`).toBe(RESONANCE_COSTS[resonance]);
    });
  });

  it('n accumule pas de Fragments au-dela de ce qui reste utile',()=>{
    const plein=addSoulFragment(hero(3),progression({resonance:4,soulFragments:5}),10);
    expect(plein.soulFragments).toBe(5);
  });

  it('renforcer consomme exactement le cout du palier',()=>{
    const resultat=strengthenResonance(hero(3),progression({resonance:2,soulFragments:10}));
    expect(resultat.ok).toBe(true);
    expect(resultat.progress.resonance).toBe(3);
    expect(resultat.progress.soulFragments).toBe(10-RESONANCE_COSTS[2]);
  });

  it('refuse de renforcer sans assez de Fragments',()=>{
    const resultat=strengthenResonance(hero(3),progression({resonance:2,soulFragments:2}));
    expect(resultat.ok).toBe(false);
    expect(resultat.status.required).toBe(3);
  });

  it('refuse de renforcer une resonance maximale',()=>{
    const statut=resonanceStatus(hero(3),progression({resonance:MAX_RESONANCE}));
    expect(statut.maxed).toBe(true);
    expect(strengthenResonance(hero(3),progression({resonance:MAX_RESONANCE})).ok).toBe(false);
  });

  it('quinze doublons suffisent a remplir toute la resonance',()=>{
    let etat=progression();
    for(let index=0;index<15;index+=1){
      const tirage=evolveFromDuplicate(hero(3),etat);
      expect(tirage.result,`doublon n°${index+1}`).toBe('soulFragment');
      etat=tirage.progress;
    }
    expect(etat.soulFragments).toBe(15);
    // Le seizieme bascule en Fragments de sang.
    expect(evolveFromDuplicate(hero(3),etat).result).toBe('bloodFragment');
  });
});

describe('doublons',()=>{
  it('un doublon donne un Fragment d ame tant qu il reste utile',()=>{
    const tirage=evolveFromDuplicate(hero(3),progression());
    expect(tirage.result).toBe('soulFragment');
    expect(tirage.progress.soulFragments).toBe(1);
  });

  it('un doublon de champion deja au maximum donne des Fragments de sang',()=>{
    const tirage=evolveFromDuplicate(hero(3),progression({resonance:MAX_RESONANCE}));
    expect(tirage.result).toBe('bloodFragment');
    expect(tirage.bloodFragments).toBe(1);
  });

  it('la valeur en Fragments de sang depend de la rarete',()=>{
    expect(bloodFragmentValue(hero(3))).toBe(1);
    expect(bloodFragmentValue(hero(4))).toBe(3);
    expect(bloodFragmentValue(hero(5))).toBe(10);
  });

  it('un doublon 5 etoiles vaut dix fois un doublon 3 etoiles',()=>{
    const cinq=evolveFromDuplicate(hero(5),{...progression({stars:5}),resonance:MAX_RESONANCE});
    const trois=evolveFromDuplicate(hero(3),progression({resonance:MAX_RESONANCE}));
    expect(cinq.bloodFragments).toBe(trois.bloodFragments*10);
  });

  it('une rarete inconnue vaut au moins un Fragment',()=>{
    expect(bloodFragmentValue({rarity:9})).toBe(1);
    expect(bloodFragmentValue(null)).toBe(1);
  });
});

describe('surplus de Fragments d ame',()=>{
  it('convertit le surplus en Fragments de sang',()=>{
    const resultat=normalizeResonanceOverflow(hero(4),progression({resonance:4,soulFragments:12}));
    expect(resultat.progress.soulFragments).toBe(5);
    expect(resultat.overflow).toBe(7);
    expect(resultat.bloodFragments).toBe(7*3);
  });

  it('ne convertit rien quand il n y a pas de surplus',()=>{
    const resultat=normalizeResonanceOverflow(hero(3),progression({soulFragments:5}));
    expect(resultat.overflow).toBe(0);
    expect(resultat.bloodFragments).toBe(0);
  });
});

describe('evolution',()=>{
  const essences=(patch={})=>({minor:0,major:0,mythic:0,...patch});

  it('demande d avoir atteint le plafond de niveau',()=>{
    const statut=evolutionStatus(hero(3),progression({stars:3,level:29}),essences({minor:99}),999999);
    expect(statut.levelReady).toBe(false);
    expect(statut.canEvolve).toBe(false);
  });

  it('demande aussi les ressources',()=>{
    const statut=evolutionStatus(hero(3),progression({stars:3,level:30}),essences(),0);
    expect(statut.levelReady).toBe(true);
    expect(statut.resourcesReady).toBe(false);
    expect(statut.canEvolve).toBe(false);
  });

  it('autorise l evolution quand tout est reuni',()=>{
    const cout=ASCENSION_COSTS[3];
    const statut=evolutionStatus(hero(3),progression({stars:3,level:30}),
      essences({minor:cout.minor,major:cout.major,mythic:cout.mythic}),cout.gold);
    expect(statut.canEvolve).toBe(true);
    expect(statut.cost).toEqual(cout);
  });

  it('signale un champion deja au maximum d etoiles',()=>{
    const statut=evolutionStatus(hero(3),progression({stars:MAX_STARS,level:60}),essences(),999999);
    expect(statut.maxStars).toBe(true);
    expect(statut.canEvolve).toBe(false);
  });

  it('gagne une etoile et repart au niveau 1',()=>{
    const resultat=evolveChampion(hero(3),progression({stars:3,level:30,xp:500}));
    expect(resultat.ok).toBe(true);
    expect(resultat.progress.stars).toBe(4);
    expect(resultat.progress.level).toBe(1);
    expect(resultat.progress.xp).toBe(0);
    expect(resultat.previousStars).toBe(3);
  });

  it('conserve la resonance et les Fragments a travers l evolution',()=>{
    const resultat=evolveChampion(hero(3),progression({stars:3,level:30,resonance:2,soulFragments:4}));
    expect(resultat.progress.resonance).toBe(2);
    expect(resultat.progress.soulFragments).toBe(4);
  });

  it('refuse sous le plafond de niveau ou au maximum d etoiles',()=>{
    expect(evolveChampion(hero(3),progression({stars:3,level:29})).ok).toBe(false);
    expect(evolveChampion(hero(3),progression({stars:MAX_STARS,level:60})).ok).toBe(false);
  });
});

describe('bonus de resonance',()=>{
  it('ne donne rien a zero',()=>{
    expect(resonanceBonus({resonance:0}))
      .toEqual({allPercent:0,speed:0,accuracy:0,resistance:0,identity:false});
  });

  it('debloque les bonus aux paliers annonces',()=>{
    expect(resonanceBonus({resonance:1}).allPercent).toBe(2);
    expect(resonanceBonus({resonance:2}).speed).toBe(3);
    expect(resonanceBonus({resonance:3}).accuracy).toBe(3);
    expect(resonanceBonus({resonance:3}).resistance).toBe(3);
    expect(resonanceBonus({resonance:4}).identity).toBe(true);
    expect(resonanceBonus({resonance:5}).allPercent).toBe(4);
  });

  it('chaque bonus est acquis definitivement',()=>{
    for(let resonance=1;resonance<=MAX_RESONANCE;resonance+=1){
      const actuel=resonanceBonus({resonance}),precedent=resonanceBonus({resonance:resonance-1});
      ['allPercent','speed','accuracy','resistance'].forEach(cle=>
        expect(actuel[cle],`${cle} au palier ${resonance}`).toBeGreaterThanOrEqual(precedent[cle]));
    }
  });

  it('tolere une resonance absente ou invalide',()=>{
    [null,undefined,{},{resonance:'abc'},{resonance:-5},{resonance:99}].forEach(valeur=>{
      const bonus=resonanceBonus(valeur);
      Object.entries(bonus).forEach(([cle,v])=>{
        if(typeof v==='number')expect(Number.isFinite(v),`${cle}`).toBe(true);
      });
    });
  });
});
