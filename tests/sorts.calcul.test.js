import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{skillDamageProfile,scalingStat,bonusLabel,mitigation,CONDITIONAL_BONUSES,
  DEF_SCALED,HP_SCALED,CRIT_MULTIPLIER,SCALING_LABEL}from'../src/utils/skillMath';
import{skillBonuses,skillMaxLevel}from'../src/utils/skills';
import{createBattle,castSkill}from'../src/battle/engine';
import{mulberry32}from'./helpers';

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const moteur=lire('../src/battle/engine.js');
const STATS={hp:9000,atk:900,def:300,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};

describe('le tooltip dit la vérité sur le moteur',()=>{
  // Une table de bonus recopiee a la main derive toujours. Celle-ci est
  // confrontee au code du moteur : tout effet auquel le moteur accorde un bonus
  // doit etre decrit ici, et reciproquement.
  const bonusDuMoteur=(()=>{
    const debut=moteur.indexOf('if(damageEffects.has(e))');
    const bloc=moteur.slice(debut,debut+4200);
    const trouves=new Set();
    // Chaque affectation de `bonus`, puis remontee jusqu'au `if(` qui la garde.
    // Deux pieges qu'une regex naive rate : une condition peut nommer PLUSIEURS
    // effets — `e==='a'||e==='b'` — et le bloc contient aussi des comparaisons
    // sans rapport, comme `m.mode==='high'`, qu'il ne faut pas prendre pour un
    // nom de sort.
    for(const entree of bloc.matchAll(/bonus\s*[+*]?=/g)){
      const avant=bloc.slice(Math.max(0,entree.index-320),entree.index);
      // Chercher le dernier `if(e===`, pas le dernier `if(` : la garde utile
      // peut envelopper une condition imbriquee qui, elle, ne nomme aucun sort
      // — comme `if(…){…;if((target.shield||0)>0)bonus=…}`.
      const garde=avant.lastIndexOf('if(e===');
      if(garde<0)continue;
      for(const nom of avant.slice(garde).matchAll(/\be==='([a-zA-Z]+)'/g))trouves.add(nom[1]);
    }
    return trouves;
  })();

  it('la lecture du moteur a bien trouvé des bonus',()=>{
    expect(bonusDuMoteur.size).toBeGreaterThan(12);
  });

  it('tout bonus du moteur est décrit dans la table',()=>{
    const manquants=[...bonusDuMoteur].filter(effet=>!CONDITIONAL_BONUSES[effet]);
    expect(manquants,`bonus non documentés : ${manquants.join(', ')}`).toEqual([]);
  });

  it('la table ne décrit aucun bonus qui n’existe plus',()=>{
    const inventes=Object.keys(CONDITIONAL_BONUSES).filter(effet=>!bonusDuMoteur.has(effet));
    expect(inventes,`bonus fantômes : ${inventes.join(', ')}`).toEqual([]);
  });

  it('les sorts qui frappent avec la Défense sont ceux du moteur',()=>{
    const ligne=moteur.match(/if\(((?:e==='[a-zA-Z]+'\|\|)*e==='[a-zA-Z]+')\)defScale=true/);
    expect(ligne,'la ligne defScale du moteur est introuvable').not.toBeNull();
    const attendus=[...ligne[1].matchAll(/e==='([a-zA-Z]+)'/g)].map(entree=>entree[1]);
    expect([...DEF_SCALED].sort()).toEqual(attendus.sort());
  });

  it('le multiplicateur critique et la mitigation viennent du moteur',()=>{
    expect(moteur).toContain('(critical?1.5:1)');
    expect(CRIT_MULTIPLIER).toBe(1.5);
    expect(moteur).toContain('100/(100+defense*3)');
    expect(mitigation(100)).toBeCloseTo(100/400);
    expect(mitigation(0)).toBe(1);
  });
});

describe('le profil chiffré d’un sort',()=>{
  const korga=HEROES.find(hero=>hero.name==='Korga');

  it('le ratio annoncé inclut la maîtrise',()=>{
    const base=skillDamageProfile(korga,0,STATS,{0:1});
    const monte=skillDamageProfile(korga,0,STATS,{0:skillMaxLevel(0)});
    expect(base.ratio).toBeCloseTo(korga.skills[0].power);
    expect(monte.ratio).toBeGreaterThan(base.ratio);
    expect(monte.ratio).toBeCloseTo(korga.skills[0].power*(1+skillBonuses(0,skillMaxLevel(0),korga.skills[0]).power));
  });

  it('les dégâts annoncés correspondent au moteur, variance et critique mis à part',()=>{
    // Le moteur applique en plus une variance de ±8 % : on verifie que la valeur
    // annoncee tombe dans cette fourchette, jamais qu'elle est exacte.
    const vrai=Math.random;
    try{
      const profil=skillDamageProfile(korga,0,STATS,{0:1},{defense:200});
      const mesures=[];
      for(let essai=0;essai<40;essai+=1){
        Math.random=mulberry32(essai+1);
        const heroes=HEROES.map(hero=>({...hero,currentStars:6,skillLevels:{0:1,1:1,2:1}}));
        let battle=createBattle([korga.id,1,19],heroes,()=>({...STATS}),
          {enemies:[{name:'C',icon:'x',hp:999999,atk:1,def:200,spd:1,accuracy:0,resistance:0,element:'Arcane'}]});
        battle={...battle,turn:korga.id};
        const avant=battle.enemies[0].hp,apres=castSkill(battle,0,battle.enemies[0].id);
        mesures.push(avant-(apres.battle||apres).enemies[0].hp);
      }
      const sansCritique=mesures.filter(valeur=>valeur<profil.expected*1.3);
      const moyenne=sansCritique.reduce((somme,valeur)=>somme+valeur,0)/sansCritique.length;
      expect(moyenne).toBeGreaterThan(profil.expected*.88);
      expect(moyenne).toBeLessThan(profil.expected*1.12);
    }finally{Math.random=vrai}
  });

  it('un sort sans puissance n’annonce pas de dégâts',()=>{
    HEROES.forEach(hero=>(hero.skills||[]).forEach((skill,index)=>{
      const profil=skillDamageProfile(hero,index,STATS,{});
      expect(profil.damage,`${hero.name} · ${skill.name}`).toBe((skill.power||0)>0);
    }));
  });

  it('chaque sort annonce une statistique connue',()=>{
    HEROES.forEach(hero=>(hero.skills||[]).forEach((skill,index)=>{
      const profil=skillDamageProfile(hero,index,STATS,{});
      expect(Object.keys(SCALING_LABEL),`${hero.name} · ${skill.name}`).toContain(profil.stat);
      expect(profil.statLabel).toBeTruthy();
    }));
  });

  it('les sorts de soin partent des PV maximum, pas de l’Attaque',()=>{
    HP_SCALED.forEach(effet=>expect(scalingStat(effet),effet).toBe('hp'));
    DEF_SCALED.forEach(effet=>expect(scalingStat(effet),effet).toBe('def'));
    expect(scalingStat('sortInconnu')).toBe('atk');
  });

  it('la Résonance IV renforce les bonus qui la mentionnent',()=>{
    const vexil=HEROES.find(hero=>hero.name==='Vexil');
    const sans=skillDamageProfile(vexil,0,STATS,{},{resonanceIV:false});
    const avec=skillDamageProfile(vexil,0,STATS,{},{resonanceIV:true});
    expect(avec.conditionals[0].applied).toBeGreaterThan(sans.conditionals[0].applied);
  });

  it('une entrée invalide ne lève pas',()=>{
    expect(skillDamageProfile(null,0,STATS,{})).toBeNull();
    expect(skillDamageProfile({skills:[]},5,STATS,{})).toBeNull();
    expect(()=>skillDamageProfile(korga,0,{},{})).not.toThrow();
    expect(skillDamageProfile(korga,0,{},{}).expected).toBe(0);
  });

  it('la recharge annoncée retire la réduction de maîtrise',()=>{
    HEROES.forEach(hero=>(hero.skills||[]).forEach((skill,index)=>{
      const max=skillMaxLevel(index);
      const profil=skillDamageProfile(hero,index,STATS,{[index]:max});
      expect(profil.cooldown,`${hero.name} · ${skill.name}`).toBeGreaterThanOrEqual(0);
      expect(profil.cooldown).toBeLessThanOrEqual(skill.cd||0);
    }));
  });
});

describe('les libellés restent lisibles',()=>{
  it('chaque bonus produit un libellé non vide',()=>{
    Object.values(CONDITIONAL_BONUSES).flat().forEach(bonus=>{
      const rendu=bonusLabel({...bonus,applied:bonus.value});
      expect(rendu,JSON.stringify(bonus)).toMatch(/[×+]/);
      expect(bonus.when,'un bonus sans condition lisible').toBeTruthy();
    });
  });

  it('le tooltip affiche bien le calcul',()=>{
    const page=lire('../src/pages/BattlePage.jsx');
    expect(page).toContain('skillDamageProfile');
    expect(page).toContain('CALCUL DES DÉGÂTS');
    expect(page).toContain('BONUS CONDITIONNELS');
    // La defense de la cible visee rend l'estimation concrete.
    expect(page).toContain('defense={effectiveEnemy?.def||0}');
  });
});
