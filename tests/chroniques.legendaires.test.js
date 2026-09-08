import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{UNIQUE_WEAPONS,RELICS,CHRONICLE_STEPS,CHRONICLE_REQUIREMENTS,LEGENDARY_MATERIALS,
  chronicleRequirement,chronicleStepStatus,chronicleStepCost,legendaryMaterialDrops,
  materialYield,chronicleGrindLength,normalizeChronicles,defaultChronicles}from'../src/data/legendary';
import{WORLD_BOSSES}from'../src/data/worldBosses';
import{emptyProgressionStats}from'../src/utils/progressionStats';

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const contexte=lire('../src/store/GameContext.jsx');
const armes=Object.keys(CHRONICLE_STEPS);

describe('chaque étape déclare ce qu’elle exige',()=>{
  it('toutes les Chroniques ont autant d’exigences que d’étapes',()=>{
    armes.forEach(id=>{
      expect(CHRONICLE_REQUIREMENTS[id],id).toBeDefined();
      expect(CHRONICLE_REQUIREMENTS[id],id).toHaveLength(CHRONICLE_STEPS[id].length);
    });
  });

  it('la première et la dernière étape restent libres',()=>{
    // Examiner la relique ne doit rien couter, et la forge est deja gardee par
    // forgeUniqueWeapon. Une Chronique dont la derniere etape exigerait encore
    // quelque chose serait impossible a terminer.
    armes.forEach(id=>{
      const dernier=CHRONICLE_REQUIREMENTS[id].length-1;
      expect(chronicleRequirement(id,dernier).kind,`${id} · dernière`).toBe('free');
    });
  });

  it('toute nature d’exigence est connue',()=>{
    const connues=new Set(['free','material','resource','relics','kill','stat']);
    armes.forEach(id=>CHRONICLE_REQUIREMENTS[id].forEach((exigence,index)=>
      expect(connues.has(exigence.kind),`${id} étape ${index+1} : ${exigence.kind}`).toBe(true)));
  });

  it('une étape hors bornes ne lève pas',()=>{
    expect(chronicleRequirement('heartworld',99).kind).toBe('free');
    expect(chronicleRequirement('inexistante',0).kind).toBe('free');
    expect(()=>chronicleStepStatus('inexistante',0,{})).not.toThrow();
  });
});

describe('les exigences pointent vers des choses qui existent',()=>{
  it('chaque matériau appartient à sa propre Chronique',()=>{
    armes.forEach(id=>CHRONICLE_REQUIREMENTS[id].forEach(exigence=>{
      if(exigence.kind!=='material')return;
      exigence.items.forEach(([materiau])=>{
        expect(LEGENDARY_MATERIALS[materiau],materiau).toBeDefined();
        expect(LEGENDARY_MATERIALS[materiau].weaponId,materiau).toBe(id);
      });
    }));
  });

  it('chaque relique exigée existe',()=>{
    armes.forEach(id=>CHRONICLE_REQUIREMENTS[id].forEach(exigence=>{
      if(exigence.kind!=='relics')return;
      exigence.ids.forEach(relique=>
        expect(RELICS.some(entry=>entry.id===relique),relique).toBe(true));
    }));
  });

  it('chaque statistique exigée existe dans le suivi de progression',()=>{
    const reference=emptyProgressionStats();
    armes.forEach(id=>CHRONICLE_REQUIREMENTS[id].forEach(exigence=>{
      if(exigence.kind!=='stat')return;
      const valeur=exigence.path.split('.').reduce((niveau,cle)=>niveau?.[cle],reference);
      expect(valeur,exigence.path).toBeDefined();
    }));
  });

  // LE test de cette série : une condition de victoire dont personne n'émet
  // l'identifiant bloque la Chronique pour toujours, sans erreur ni message.
  // Le boss « Chasseuse de la Dernière Lune » a pour identifiant `huntress` ;
  // la condition attendait `chasseuse`, et rien ne l'aurait signalé.
  it('chaque victoire exigée est réellement enregistrée par le jeu',()=>{
    const attendues=armes.flatMap(id=>CHRONICLE_REQUIREMENTS[id]
      .filter(exigence=>exigence.kind==='kill').map(exigence=>exigence.id));
    expect(attendues.length).toBeGreaterThan(0);
    attendues.forEach(cle=>{
      const litteral=contexte.includes(`recordChronicleKill('${cle}')`);
      const compose=cle.startsWith('worldboss-')
        &&contexte.includes('recordChronicleKill(`worldboss-${boss.id}`)')
        &&Object.keys(WORLD_BOSSES).includes(cle.slice('worldboss-'.length));
      expect(litteral||compose,`aucune émission pour « ${cle} »`).toBe(true);
    });
  });

  it('chaque Adversaire légendaire sert une Chronique existante',()=>{
    Object.values(WORLD_BOSSES).forEach(boss=>{
      expect(UNIQUE_WEAPONS[boss.weaponId],boss.name).toBeDefined();
    });
  });
});

describe('l’avancement se gagne, il ne se clique pas',()=>{
  const vide={materials:{},relics:{},kills:{},stats:emptyProgressionStats(),resources:{}};

  it('une étape de matériaux n’est pas prête les mains vides',()=>{
    expect(chronicleStepStatus('stormprince',1,vide).ready).toBe(false);
  });

  it('elle devient prête exactement au compte demandé',()=>{
    const besoin=CHRONICLE_REQUIREMENTS.stormprince[1].items[0][1];
    expect(chronicleStepStatus('stormprince',1,{...vide,materials:{'storm-shard':besoin-1}}).ready).toBe(false);
    expect(chronicleStepStatus('stormprince',1,{...vide,materials:{'storm-shard':besoin}}).ready).toBe(true);
  });

  it('une étape à deux matériaux exige les deux',()=>{
    const[[a,na],[b,nb]]=CHRONICLE_REQUIREMENTS.heartworld[1].items;
    expect(chronicleStepStatus('heartworld',1,{...vide,materials:{[a]:na}}).ready).toBe(false);
    expect(chronicleStepStatus('heartworld',1,{...vide,materials:{[b]:nb}}).ready).toBe(false);
    expect(chronicleStepStatus('heartworld',1,{...vide,materials:{[a]:na,[b]:nb}}).ready).toBe(true);
  });

  it('les deux Liens du Prince-Tempête sont exigés ensemble',()=>{
    // C'est le cœur de la quête : deux reliques distinctes, chacune à 0,06 % et
    // 0,08 %, sur deux niveaux de Mythic+ différents.
    const un={...vide,relics:{'storm-left':{owned:1}}};
    expect(chronicleStepStatus('stormprince',0,un).ready).toBe(false);
    expect(chronicleStepStatus('stormprince',0,
      {...vide,relics:{'storm-left':{owned:1},'storm-right':{owned:1}}}).ready).toBe(true);
  });

  it('une exigence de victoire compte les victoires',()=>{
    expect(chronicleStepStatus('tides',2,vide).ready).toBe(false);
    expect(chronicleStepStatus('tides',2,{...vide,kills:{'worldboss-thalassyr':1}}).ready).toBe(true);
  });

  it('une exigence de ressource lit les monnaies du joueur',()=>{
    expect(chronicleStepStatus('heartworld',2,vide).ready).toBe(false);
    expect(chronicleStepStatus('heartworld',2,
      {...vide,resources:{mythicEssence:10,forgeEssence:2500}}).ready).toBe(true);
  });

  it('une étape libre est toujours prête',()=>{
    armes.forEach(id=>CHRONICLE_REQUIREMENTS[id].forEach((exigence,index)=>{
      if(exigence.kind==='free')expect(chronicleStepStatus(id,index,vide).ready,`${id} ${index}`).toBe(true);
    }));
  });

  it('seuls les matériaux se consomment',()=>{
    expect(Object.keys(chronicleStepCost('stormprince',1))).toEqual(['storm-shard']);
    ['stormprince:0','heartworld:2','tides:2','plague:2','heartworld:0']
      .forEach(cle=>{const[arme,etape]=cle.split(':');
        expect(chronicleStepCost(arme,Number(etape)),cle).toEqual({})});
  });

  it('le bouton de validation passe par la garde, pas par setChronicleStep',()=>{
    // « Valider l'étape » appelait setChronicleStep sans condition : trois clics
    // et l'arme était forgée.
    const page=lire('../src/pages/QuestsPage.jsx');
    expect(page).toContain('advanceChronicle');
    expect(page).not.toMatch(/onClick=\{\(\)=>setChronicleStep\(/);
  });
});

describe('les Vestiges tombent, et seulement là où il faut',()=>{
  it('aucun Vestige sans Chronique active',()=>{
    expect(legendaryMaterialDrops('mythic',30,{})).toEqual({});
    expect(legendaryMaterialDrops('raids',10,{})).toEqual({});
  });

  it('une Chronique active reçoit ses propres matériaux, pas ceux des autres',()=>{
    const gains=legendaryMaterialDrops('mythic',20,{stormprince:{step:1}});
    expect(Object.keys(gains)).toEqual(['storm-shard']);
  });

  it('une activité inconnue ne donne rien',()=>{
    expect(legendaryMaterialDrops('campagne',10,{stormprince:1})).toEqual({});
  });

  it('une activité ne donne que les matériaux qui lui appartiennent',()=>{
    // Chronique du Marteau active — ses Vestiges viennent des Raids. Un passage
    // de Mythic+ ne doit rien en verser, meme si la Chronique est en cours.
    expect(legendaryMaterialDrops('mythic',30,{heartworld:{step:1}})).toEqual({});
    expect(Object.keys(legendaryMaterialDrops('raids',10,{heartworld:{step:1}})).sort())
      .toEqual(['incendiary-heart','volcanic-ingot']);
    // Deux Chroniques actives sur deux activites : chacune recoit les siennes.
    const surMythic=legendaryMaterialDrops('mythic',20,{heartworld:{step:1},stormprince:{step:1}});
    expect(Object.keys(surMythic)).toEqual(['storm-shard']);
  });

  it('monter en difficulté raccourcit la quête',()=>{
    expect(materialYield('storm-shard','mythic',30)).toBeGreaterThan(materialYield('storm-shard','mythic',10));
    expect(materialYield('volcanic-ingot','raids',10)).toBeGreaterThan(materialYield('volcanic-ingot','raids',6));
  });

  it('un matériau donne toujours au moins un exemplaire',()=>{
    Object.keys(LEGENDARY_MATERIALS).forEach(id=>{
      const materiau=LEGENDARY_MATERIALS[id];
      expect(materialYield(id,materiau.activity,1),id).toBeGreaterThanOrEqual(1);
    });
  });

  it('chaque quête de matériaux demande un farm réellement long',()=>{
    // C'est la demande : « du farm assez long ». On borne des deux cotes — une
    // quête de dix passages ne serait pas une légende, une de deux cents serait
    // une punition.
    armes.forEach(id=>CHRONICLE_REQUIREMENTS[id].forEach((exigence,index)=>{
      if(exigence.kind!=='material')return;
      const activite=CHRONICLE_STEPS[id][index][2];
      const rapide=chronicleGrindLength(id,index,activite,activite==='mythic'?30:activite==='raids'?10:1);
      const lent=chronicleGrindLength(id,index,activite,activite==='mythic'?10:activite==='raids'?6:1);
      expect(rapide,`${id} étape ${index+1} au mieux`).toBeGreaterThanOrEqual(20);
      expect(lent,`${id} étape ${index+1} au pire`).toBeLessThanOrEqual(60);
    }));
  });

  it('les Vestiges tombent à chaque passage de Mythic+, pas au seul premier',()=>{
    // Il n'existe que trente niveaux et une étape en demande vingt à soixante :
    // gager les Vestiges sur le premier clear rendrait la quête impossible.
    const debut=contexte.indexOf('const finishMythicMission=');
    const retourAnticipe=contexte.indexOf('if(!first)return{mythic:true',debut);
    const chute=contexte.indexOf("rollLegendaryMaterials('mythic'",debut);
    expect(chute).toBeGreaterThan(-1);
    expect(chute).toBeLessThan(retourAnticipe);
  });
});

describe('une relique reste très rare, sans devenir inatteignable',()=>{
  // Les taux d'origine donnaient 462 a 1 386 passages pour une chance sur deux,
  // et 2 022 pour les deux Liens du Prince-Tempete reunis. La Chronique qui suit
  // demandant elle-meme vingt a soixante passages, l'aventure entiere etait hors
  // de portee. On verrouille les deux bords : rare par tirage, vivable au total.
  const contexteSource=lire('../src/store/GameContext.jsx');
  const rewards=lire('../src/utils/rewards.js');
  const taux=[...contexteSource.matchAll(/candidates\.push\(((?:\['[a-z-]+',\.[0-9]+\],?)+)\)/g)]
    .flatMap(bloc=>[...bloc[1].matchAll(/\['([a-z-]+)',(\.[0-9]+)\]/g)]
      .map(entree=>[entree[1],Number(entree[2])]));
  const tauxRaid=[...rewards.matchAll(/level===(\d+)\?(\.[0-9]+)/g)].map(m=>['heartworld-eye',Number(m[2])]);
  const tous=[...taux,...tauxRaid];
  /** Passages pour une chance sur deux. */
  const moitie=p=>Math.ceil(Math.log(.5)/Math.log(1-p));

  it('la table de chute est bien lue',()=>{
    expect(tous.length).toBeGreaterThanOrEqual(9);
    tous.forEach(([id,p])=>{
      expect(RELICS.some(relique=>relique.id===id),id).toBe(true);
      expect(p,id).toBeGreaterThan(0);
    });
  });

  it('chaque relique reste sous une chance sur cent',()=>{
    tous.forEach(([id,p])=>expect(p,`${id} à ${(p*100).toFixed(2)} %`).toBeLessThan(.01));
  });

  it('la meilleure source de chaque relique reste atteignable',()=>{
    const meilleure={};
    tous.forEach(([id,p])=>{meilleure[id]=Math.max(meilleure[id]||0,p)});
    Object.entries(meilleure).forEach(([id,p])=>
      expect(moitie(p),`${id} : ${moitie(p)} passages pour 50 %`).toBeLessThanOrEqual(250));
  });

  it('toute relique déclarée peut tomber quelque part',()=>{
    // Une relique sans source rendrait sa Chronique impossible a ouvrir.
    const sources=new Set(tous.map(([id])=>id));
    RELICS.forEach(relique=>expect(sources.has(relique.id),relique.name).toBe(true));
  });
});

describe('la sauvegarde',()=>{
  it('une sauvegarde antérieure aux Vestiges se relit sans exception',()=>{
    const relu=normalizeChronicles({relics:{},active:{stormprince:{step:1}}});
    expect(relu.kills).toEqual({});
    expect(relu.materials).toEqual({});
    expect(()=>chronicleStepStatus('stormprince',1,{...relu,resources:{}})).not.toThrow();
  });

  it('les victoires et les Vestiges survivent au rechargement',()=>{
    // Verifier qu'une sauvegarde vide rend un objet vide ne prouve rien : il
    // faut verifier qu'une sauvegarde pleine rend son contenu. Sans cela, un
    // joueur reperdrait Thalassyr et ses cent Eclats a chaque lancement.
    const relu=normalizeChronicles({kills:{'worldboss-thalassyr':1},materials:{'storm-shard':73}});
    expect(relu.kills['worldboss-thalassyr']).toBe(1);
    expect(relu.materials['storm-shard']).toBe(73);
    expect(chronicleStepStatus('tides',2,{...relu,resources:{},stats:emptyProgressionStats()}).ready).toBe(true);
  });

  it('la forme par défaut contient tout ce que les exigences lisent',()=>{
    const defaut=defaultChronicles();
    ['relics','active','completed','materials','kills','obtainedWeapons','orientations']
      .forEach(cle=>expect(defaut,cle).toHaveProperty(cle));
  });
});
