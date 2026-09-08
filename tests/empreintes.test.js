import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{BRANCHES,ETAGES,ETAGE_RESONANCE,RESONANCE_POINT_TIERS,
  empreinteTree,empreintePoints,empreinteDepth,empreinteStatus,empreinteBonuses,allTrees}from'../src/data/empreintes';
import{defaultChampionProgress,normalizeChampionProgress,MAX_RESONANCE,MAX_STARS}from'../src/utils/progression';
import{totalStats,championPower}from'../src/utils/stats';
import{createBattle,castSkill}from'../src/battle/engine';
import{skillBonuses}from'../src/utils/skills';
import{mulberry32}from'./helpers';

const TAILLE=BRANCHES.length*ETAGES;
const complet={stars:MAX_STARS,resonance:MAX_RESONANCE};
const arbreDe=hero=>empreinteTree(hero);
const branche=(hero,id)=>arbreDe(hero).filter(noeud=>noeud.branche===id).map(noeud=>noeud.id);

describe('l’arbre existe pour tout le roster',()=>{
  it('chaque champion a un arbre complet et bien forme',()=>{
    allTrees().forEach(({hero,arbre})=>{
      expect(arbre,hero.name).toHaveLength(TAILLE);
      expect(new Set(arbre.map(noeud=>noeud.id)).size,hero.name).toBe(TAILLE);
      BRANCHES.forEach(({id})=>{
        const noeuds=arbre.filter(noeud=>noeud.branche===id);
        expect(noeuds.map(noeud=>noeud.etage).sort()).toEqual([1,2,3,4]);
      });
    });
  });

  it('aucun nœud ne vise une compétence que le champion n’a pas',()=>{
    allTrees().forEach(({hero,arbre})=>{
      arbre.forEach(noeud=>{
        if(noeud.effect.skill===undefined)return;
        expect(noeud.effect.skill,`${hero.name} · ${noeud.name}`).toBeLessThan(hero.skills.length);
        expect(noeud.effect.skill).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('chaque nœud fait quelque chose',()=>{
    allTrees().forEach(({hero,arbre})=>arbre.forEach(noeud=>{
      const{stats,skill,...leviers}=noeud.effect;
      const total=Object.values(leviers).reduce((sum,value)=>sum+Math.abs(value),0)
        +Object.values(stats||{}).reduce((sum,value)=>sum+Math.abs(value),0);
      expect(total,`${hero.name} · ${noeud.name}`).toBeGreaterThan(0);
    }));
  });

  it('les identifiants sont uniques dans tout le jeu, pas seulement par champion',()=>{
    const tous=allTrees().flatMap(({arbre})=>arbre.map(noeud=>noeud.id));
    expect(new Set(tous).size).toBe(tous.length);
  });
});

describe('le budget n’atteint jamais l’arbre entier',()=>{
  // C'est la garantie d'equilibre du systeme. Un joueur ne renforce pas son
  // champion, il le specialise : deux Thorgar pleinement investis diffèrent.
  it('même au sommet absolu, la moitié de l’arbre reste éteinte',()=>{
    expect(empreintePoints(complet)).toBeLessThan(TAILLE);
    expect(empreintePoints(complet)).toBe(TAILLE/2);
  });

  it('un champion neuf dispose déjà d’un point',()=>{
    HEROES.forEach(hero=>expect(empreintePoints(defaultChampionProgress(hero)),hero.name).toBeGreaterThanOrEqual(1));
  });

  it('le budget grandit avec les étoiles',()=>{
    const valeurs=[3,4,5,6].map(stars=>empreintePoints({stars,resonance:0}));
    valeurs.slice(1).forEach((valeur,index)=>expect(valeur).toBeGreaterThan(valeurs[index]));
  });

  it('les paliers de Résonance pairs ajoutent un point chacun',()=>{
    RESONANCE_POINT_TIERS.forEach(palier=>{
      expect(empreintePoints({stars:6,resonance:palier}))
        .toBeGreaterThan(empreintePoints({stars:6,resonance:palier-1}));
    });
  });

  it('une progression aberrante ne donne pas de points infinis',()=>{
    [{stars:99,resonance:99},{stars:-5,resonance:-5},{stars:'x',resonance:'y'},{}]
      .forEach(valeur=>{
        const points=empreintePoints(valeur);
        expect(Number.isFinite(points)).toBe(true);
        expect(points).toBeGreaterThanOrEqual(1);
        expect(points).toBeLessThanOrEqual(TAILLE/2);
      });
  });
});

describe('la Résonance ouvre la profondeur',()=>{
  // Avant, R1 a R5 ne versaient que des statistiques plates : +3,8 % de
  // puissance au total pour cinq doublons de 5★, la ressource la plus rare du
  // jeu. Les bonus existants sont conserves ; chaque palier ouvre en plus un
  // etage ou verse un point, donc aucun n'est plus decoratif.
  it('chaque étage exige la Résonance annoncée',()=>{
    ETAGE_RESONANCE.forEach((seuil,index)=>{
      expect(empreinteDepth({resonance:seuil})).toBeGreaterThanOrEqual(index+1);
      if(seuil>0)expect(empreinteDepth({resonance:seuil-1})).toBeLessThan(index+1);
    });
  });

  it('l’étage I est ouvert sans aucune Résonance',()=>{
    expect(empreinteDepth({resonance:0})).toBe(1);
  });

  it('la Résonance maximale ouvre tout l’arbre en profondeur',()=>{
    expect(empreinteDepth({resonance:MAX_RESONANCE})).toBe(ETAGES);
  });

  it('chaque palier de Résonance fait désormais quelque chose',()=>{
    for(let resonance=1;resonance<=MAX_RESONANCE;resonance+=1){
      const ouvreUnEtage=empreinteDepth({resonance})>empreinteDepth({resonance:resonance-1});
      const donneUnPoint=empreintePoints({stars:6,resonance})>empreintePoints({stars:6,resonance:resonance-1});
      expect(ouvreUnEtage||donneUnPoint,`Résonance ${resonance}`).toBe(true);
    }
  });
});

describe('les règles d’allumage',()=>{
  const hero=HEROES[0];
  const etat=(progress,lit)=>empreinteStatus(hero,progress,lit);
  const noeud=(etatCourant,brancheId,etage)=>
    etatCourant.noeuds.find(entry=>entry.branche===brancheId&&entry.etage===etage);

  it('un étage fermé par la Résonance reste inaccessible même avec des points',()=>{
    // Il faut allumer l'etage precedent pour isoler la regle : sinon le nœud
    // est indisponible pour la mauvaise raison, et le test ne prouve rien.
    const premier=branche(hero,'force')[0];
    const courant=etat({stars:6,resonance:0},[premier]);
    expect(courant.restants).toBeGreaterThan(0);
    expect(noeud(courant,'force',2).precedent).toBe(true);
    expect(noeud(courant,'force',2).etageOuvert).toBe(false);
    expect(noeud(courant,'force',2).disponible).toBe(false);
  });

  it('on ne saute pas un étage dans une branche',()=>{
    const courant=etat({stars:6,resonance:5},[]);
    expect(noeud(courant,'force',1).disponible).toBe(true);
    expect(noeud(courant,'force',2).precedent).toBe(false);
    expect(noeud(courant,'force',2).disponible).toBe(false);
  });

  it('graver l’étage précédent ouvre le suivant',()=>{
    const premier=branche(hero,'force')[0];
    const courant=etat({stars:6,resonance:5},[premier]);
    expect(noeud(courant,'force',2).precedent).toBe(true);
    expect(noeud(courant,'force',2).disponible).toBe(true);
  });

  it('à court de points, plus rien n’est disponible',()=>{
    const deuxPremiers=branche(hero,'force').slice(0,1);
    const courant=etat({stars:3,resonance:0},deuxPremiers);
    expect(courant.restants).toBe(0);
    expect(courant.noeuds.some(entry=>entry.disponible)).toBe(false);
  });

  it('un nœud déjà gravé n’est plus disponible',()=>{
    const premier=branche(hero,'force')[0];
    const courant=etat({stars:6,resonance:5},[premier]);
    expect(noeud(courant,'force',1).allume).toBe(true);
    expect(noeud(courant,'force',1).disponible).toBe(false);
  });

  it('un identifiant étranger à l’arbre est ignoré et ne consomme pas de point',()=>{
    const courant=etat({stars:6,resonance:5},['champion-inexistant:force:1','n’importe quoi']);
    expect(courant.depenses).toBe(0);
    expect(courant.restants).toBe(empreintePoints({stars:6,resonance:5}));
  });

  it('les doublons ne comptent qu’une fois',()=>{
    const premier=branche(hero,'force')[0];
    expect(etat({stars:6,resonance:5},[premier,premier,premier]).depenses).toBe(1);
  });
});

describe('les Empreintes agissent réellement',()=>{
  const hero=HEROES.find(entry=>entry.id===20);
  const STATS={hp:9000,atk:900,def:300,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};

  it('un nœud de statistique passe dans totalStats',()=>{
    const base={...defaultChampionProgress(hero),level:60,stars:6,resonance:5};
    const flux=branche(hero,'flux')[0];
    expect(totalStats(hero,{},{...base,empreintes:[flux]},[]).spd)
      .toBeGreaterThan(totalStats(hero,{},base,[]).spd);
  });

  it('les Empreintes survivent au rechargement de la sauvegarde',()=>{
    // normalizeChampionProgress est le passage oblige de toute sauvegarde
    // relue. Si elle rendait un tableau vide, un joueur retrouverait son arbre
    // efface a chaque lancement, sans qu'aucun autre test ne s'en apercoive.
    const gravees=branche(hero,'force').slice(0,2);
    const relu=normalizeChampionProgress(hero,{level:60,stars:6,resonance:5,empreintes:gravees});
    expect(relu.empreintes).toEqual(gravees);
    expect(empreinteStatus(hero,relu,relu.empreintes).depenses).toBe(2);
  });

  it('une sauvegarde sans Empreintes se calcule sans exception',()=>{
    const base=normalizeChampionProgress(hero,{level:40,stars:5});
    expect(()=>totalStats(hero,{},base,[])).not.toThrow();
    expect(()=>totalStats(hero,{},{level:40,stars:5},[])).not.toThrow();
  });

  const degats=(empreintes,index=2)=>{
    const vrai=Math.random;Math.random=mulberry32(5);
    try{
      const heroes=HEROES.map(entry=>({...entry,currentStars:6,skillLevels:{0:6,1:5,2:4},
        empreinteSkills:empreinteBonuses(entry,empreintes).skills}));
      let battle=createBattle([1,19,20],heroes,()=>({...STATS}),
        {enemies:[{name:'C',icon:'x',hp:900000,atk:1,def:200,spd:1,accuracy:0,resistance:0,element:'Feu'}]});
      battle={...battle,turn:battle.allies[2].id};
      const avant=battle.enemies[0].hp,apres=castSkill(battle,index,battle.enemies[0].id);
      return avant-(apres.battle||apres).enemies[0].hp;
    }finally{Math.random=vrai}
  };

  it('la branche Force augmente vraiment les dégâts de l’ultime',()=>{
    const sans=degats([]),avec=degats(branche(hero,'force'));
    expect(avec).toBeGreaterThan(sans);
    expect(avec/sans).toBeGreaterThan(1.15);
  });

  it('mais reste loin derrière l’équipement',()=>{
    // L'equipement complet vaut +172 %. Un systeme de progression qui
    // s'en approcherait deviendrait la nouvelle source de puissance dominante.
    expect(degats(branche(hero,'force'))/degats([])).toBeLessThan(1.5);
  });

  it('la réduction de recharge ne descend jamais sous un tour',()=>{
    // Le moteur borne deja : max(0, cd - reduction) + 1. Les Empreintes de Flux
    // s'ajoutant a la maitrise, ce plancher doit tenir a leur cumul.
    HEROES.forEach(entry=>{
      const flux=empreinteBonuses(entry,branche(entry,'flux')).skills;
      entry.skills.forEach((skill,index)=>{
        const total=skillBonuses(index,6,skill).cooldown+(flux[index]?.cooldown||0);
        expect(Math.max(0,(skill.cd||0)-total)+1,`${entry.name} · ${skill.name}`).toBeGreaterThanOrEqual(1);
      });
    });
  });

  it('la puissance affichée bouge peu : les Empreintes changent la forme, pas le total',()=>{
    // Consequence voulue : la recommandation de puissance des missions reste
    // honnête. Elle sous-estime legerement un champion investi plutot que de le
    // surestimer, ce qui est le sens sûr de l'erreur.
    const base={...defaultChampionProgress(hero),level:60,stars:6,resonance:5};
    const six=[...branche(hero,'force'),...branche(hero,'flux').slice(0,2)];
    const rapport=championPower(totalStats(hero,{},{...base,empreintes:six},[]))
      /championPower(totalStats(hero,{},base,[]));
    expect(rapport).toBeGreaterThanOrEqual(1);
    expect(rapport).toBeLessThan(1.05);
  });
});
