// Maitrises de competences : paliers d'amelioration et bonus cumules.
//
// Chaque palier ameliore la puissance, la duree, la chance d'effet ou le temps
// de recharge. Les bonus sont lus par le moteur a chaque lancement de sort.
import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{skillMaxLevel,skillUpgradeTrack,skillBonuses,skillUpgradeCost,skillInfo,
        skillMechanic,skillPowerLabel}from'../src/utils/skills';
import{HEROES}from'../src/data/heroes';

const source=fs.readFileSync(fileURLToPath(new URL('../src/utils/skills.js',import.meta.url)),'utf8');
const skill=(patch={})=>({name:'Frappe',icon:'x',cd:0,target:'enemy',
  description:'d',power:1,effect:'basic',...patch});

describe('niveaux maximum',()=>{
  it('decroissent avec le rang de la competence',()=>{
    expect(skillMaxLevel(0)).toBe(6);
    expect(skillMaxLevel(1)).toBe(5);
    expect(skillMaxLevel(2)).toBe(4);
  });
});

describe('paliers d amelioration',()=>{
  // Contrat central : un palier de plus que le maximum n est jamais debloque,
  // un palier de moins laisse un niveau sans effet. Nerissa avait quatre
  // paliers sur une competence qui plafonne a trois.
  it('chaque competence du roster a exactement le bon nombre de paliers',()=>{
    const ecarts=[];
    HEROES.forEach(hero=>(hero.skills||[]).forEach((competence,index)=>{
      const attendu=skillMaxLevel(index)-1;
      const reel=skillUpgradeTrack(index,competence).length;
      if(reel!==attendu)
        ecarts.push(`${hero.name} · compétence ${index+1} (${competence.effect}) : `+
          `${reel} paliers pour ${attendu} attendus`);
    }));
    expect(ecarts).toEqual([]);
  });

  it('chaque palier annonce un type connu, une valeur et une etiquette',()=>{
    const types=new Set(['power','effectRate','duration','cooldown']);
    HEROES.forEach(hero=>(hero.skills||[]).forEach((competence,index)=>
      skillUpgradeTrack(index,competence).forEach((palier,rang)=>{
        const ou=`${hero.name} · compétence ${index+1} · palier ${rang+1}`;
        expect(types.has(palier.type),`${ou} type ${palier.type}`).toBe(true);
        expect(palier.value,`${ou} valeur`).toBeGreaterThan(0);
        expect(palier.label,`${ou} étiquette`).toBeTruthy();
      })));
  });

  it('aucune competence ne gagne plus d un tour de recharge en moins',()=>{
    HEROES.forEach(hero=>(hero.skills||[]).forEach((competence,index)=>{
      const recharges=skillUpgradeTrack(index,competence)
        .filter(palier=>palier.type==='cooldown').length;
      expect(recharges,`${hero.name} · compétence ${index+1}`).toBeLessThanOrEqual(1);
    }));
  });
});

describe('bonus cumules',()=>{
  it('le niveau 1 n accorde aucun bonus',()=>{
    expect(skillBonuses(0,1,skill())).toEqual({power:0,effectRate:0,duration:0,cooldown:0});
  });

  it('chaque niveau ajoute le palier correspondant',()=>{
    const track=skillUpgradeTrack(0,skill());
    expect(skillBonuses(0,2,skill()).power).toBeCloseTo(track[0].value);
    expect(skillBonuses(0,3,skill())[track[1].type]).toBeGreaterThan(0);
  });

  it('le niveau maximum cumule tous les paliers',()=>{
    const track=skillUpgradeTrack(0,skill());
    const attendu={power:0,effectRate:0,duration:0,cooldown:0};
    track.forEach(palier=>{attendu[palier.type]+=palier.value});
    const obtenu=skillBonuses(0,skillMaxLevel(0),skill());
    Object.keys(attendu).forEach(cle=>expect(obtenu[cle],cle).toBeCloseTo(attendu[cle]));
  });

  it('ne depasse jamais le cumul du niveau maximum',()=>{
    const plafond=skillBonuses(0,skillMaxLevel(0),skill());
    expect(skillBonuses(0,99,skill())).toEqual(plafond);
  });

  it('tolere un niveau nul, negatif ou absent',()=>{
    [0,-5,undefined,null].forEach(niveau=>
      expect(skillBonuses(0,niveau,skill()),String(niveau))
        .toEqual({power:0,effectRate:0,duration:0,cooldown:0}));
  });

  it('les bonus montent, jamais ne redescendent',()=>{
    HEROES.forEach(hero=>(hero.skills||[]).forEach((competence,index)=>{
      for(let niveau=2;niveau<=skillMaxLevel(index);niveau+=1){
        const actuel=skillBonuses(index,niveau,competence);
        const precedent=skillBonuses(index,niveau-1,competence);
        Object.keys(actuel).forEach(cle=>
          expect(actuel[cle],`${hero.name} · ${index+1} · ${cle} au niveau ${niveau}`)
            .toBeGreaterThanOrEqual(precedent[cle]));
      }
    }));
  });
});

describe('cout d amelioration',()=>{
  it('monte avec la rarete du champion',()=>{
    expect(skillUpgradeCost({rarity:3})).toBe(10000);
    expect(skillUpgradeCost({rarity:4})).toBe(20000);
    expect(skillUpgradeCost({rarity:5})).toBe(35000);
  });

  it('applique le tarif le plus eleve a une rarete inconnue',()=>{
    expect(skillUpgradeCost({rarity:9})).toBe(35000);
  });
});

describe('skillInfo',()=>{
  const hero=HEROES[0];

  it('decrit le palier suivant tant que la competence n est pas au maximum',()=>{
    const info=skillInfo(hero,0,{0:1});
    expect(info.level).toBe(1);
    expect(info.maxed).toBe(false);
    expect(info.next).toBeTruthy();
    expect(info.current).toEqual([]);
  });

  it('ne propose plus rien au niveau maximum',()=>{
    // Un palier au-dela du maximum se verrait ici : c'etait le cas de Nerissa.
    HEROES.forEach(champion=>(champion.skills||[]).forEach((competence,index)=>{
      const info=skillInfo(champion,index,{[index]:skillMaxLevel(index)});
      expect(info.maxed,`${champion.name} · ${index+1}`).toBe(true);
      expect(info.next,`${champion.name} · ${index+1} propose encore un palier`).toBeNull();
    }));
  });

  it('liste les paliers deja obtenus',()=>{
    const info=skillInfo(hero,0,{0:3});
    expect(info.current).toHaveLength(2);
  });

  it('part du niveau 1 sans donnee de niveau',()=>{
    expect(skillInfo(hero,0,undefined).level).toBe(1);
    expect(skillInfo(hero,0,{}).level).toBe(1);
  });
});

describe('descriptions et profils de statistiques',()=>{
  // Une cle declaree deux fois dans un objet litteral perd silencieusement la
  // premiere valeur. C'etait le cas de unstableRelease, dont la description
  // detaillee — avec les pourcentages de contrecoup — etait ecrasee par une
  // formulation vague.
  it('aucune description n est declaree deux fois',()=>{
    const bloc=source.slice(source.indexOf('const DESCRIPTIONS={'),
      source.indexOf('\n};',source.indexOf('const DESCRIPTIONS={')));
    const cles=[...bloc.matchAll(/[{,]\s*([a-zA-Z][a-zA-Z0-9]*)\s*:'/g)].map(m=>m[1]);
    const doublons=cles.filter((cle,rang)=>cles.indexOf(cle)!==rang);
    expect([...new Set(doublons)]).toEqual([]);
  });

  it('chaque description declaree vise un effet qui existe',()=>{
    const bloc=source.slice(source.indexOf('const DESCRIPTIONS={'),
      source.indexOf('\n};',source.indexOf('const DESCRIPTIONS={')));
    const cles=[...bloc.matchAll(/[{,]\s*([a-zA-Z][a-zA-Z0-9]*)\s*:'/g)].map(m=>m[1]);
    const effets=new Set(HEROES.flatMap(hero=>(hero.skills||[]).map(s=>s.effect)));
    const orphelines=cles.filter(cle=>!effets.has(cle));
    expect(orphelines).toEqual([]);
  });

  it('toute competence recoit une explication et un profil complet',()=>{
    HEROES.forEach(hero=>(hero.skills||[]).forEach(competence=>{
      const info=skillMechanic(competence);
      const ou=`${hero.name} · ${competence.effect}`;
      expect(info.mechanic,`${ou} explication`).toBeTruthy();
      expect(info.scaling,`${ou} statistiques`).toHaveLength(3);
      expect(info.gear,`${ou} conseil d'équipement`).toBeTruthy();
      expect(info.powerStat,`${ou} statistique de puissance`).toBeTruthy();
    }));
  });

  it('l etiquette de puissance reflete la presence d un coefficient',()=>{
    expect(skillPowerLabel(skill({power:1.35}))).toContain('1,35');
    expect(skillPowerLabel(skill({power:0,effect:'timeAnchor'}))).toContain('Aucune valeur');
    expect(skillPowerLabel(skill({power:0,effect:'healingTotem'}))).toContain('PV max');
  });

  it('produit une etiquette lisible pour toutes les competences du roster',()=>{
    HEROES.forEach(hero=>(hero.skills||[]).forEach(competence=>{
      const etiquette=skillPowerLabel(competence);
      expect(etiquette,`${hero.name} · ${competence.effect}`).toBeTruthy();
      expect(etiquette).not.toContain('undefined');
      expect(etiquette).not.toContain('NaN');
    }));
  });
});
