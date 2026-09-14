import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill,pvReference}from'../src/battle/engine';
import{mulberry32}from'./helpers';

// Mathanae ressortait 1er sur 32 avec 49 % de victoires contre 20 % de moyenne,
// et TROIS FOIS le taux du tank suivant — mesure sur 106 combats par champion,
// aux raretes et plafonds de niveau reels. Trois retouches de kit le ramenent a
// 31 %, toujours meilleur tank du jeu mais plus meilleur champion du jeu.
// Aucune statistique n'a ete touchee : il n'etait pas surstatte (8e sur 11 chez
// les 5★ selon la formule de puissance du jeu).
// Detail : Audit/RAPPORT-MATHANAE.md
const MATHANAE=18;
const STATS={hp:9000,atk:900,def:300,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};
const ennemi=(nom,element='Arcane')=>({name:nom,icon:'x',hp:60000,atk:1,def:150,spd:1,accuracy:0,resistance:0,element});

/** Combat prêt à jouer, avec le nombre d'ennemis demandé. */
function poser(nombreEnnemis=3,graine=5){
  const heroes=HEROES.map(hero=>({...hero,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
  const battle=createBattle([MATHANAE,1,19],heroes,()=>({...STATS}),
    {enemies:Array.from({length:nombreEnnemis},(unused,index)=>ennemi(`Cible ${index+1}`))});
  return{...battle,turn:MATHANAE,
    allies:battle.allies.map(unit=>unit.id===MATHANAE?{...unit,cooldowns:[0,0,0]}:unit)};
}
const lancer=(battle,index,cible)=>{
  const vrai=Math.random;Math.random=mulberry32(5);
  try{const sortie=castSkill(battle,index,cible);return sortie.battle||sortie}finally{Math.random=vrai}
};
const lui=battle=>battle.allies.find(unit=>unit.id===MATHANAE);

describe('Sigil de tourment ne remplit plus la jauge d’un coup',()=>{
  it('deux Fragments au maximum, quel que soit le nombre de cibles',()=>{
    [1,2,3,4].forEach(nombre=>{
      const avant=poser(nombre);
      const apres=lancer(avant,1,avant.enemies[0].id);
      expect(lui(apres).mechanic.value,`${nombre} ennemi(s)`).toBe(Math.min(2,nombre));
    });
  });

  it('il faut donc au moins trois lancers pour remplir les cinq Fragments',()=>{
    let battle=poser(3);
    let lancers=0;
    while(lui(battle).mechanic.value<5&&lancers<10){
      battle={...battle,turn:MATHANAE,
        allies:battle.allies.map(unit=>unit.id===MATHANAE?{...unit,cooldowns:[0,0,0]}:unit)};
      battle=lancer(battle,1,battle.enemies[0].id);
      lancers+=1;
    }
    expect(lui(battle).mechanic.value).toBe(5);
    expect(lancers,'la jauge se remplissait en deux lancers').toBeGreaterThanOrEqual(3);
  });

  it('le renfort de Défense dure moins que la recharge du sort',()=>{
    // Trois tours sur une recharge de trois, c'etait une Defense augmentee en
    // permanence — et ses degats se calculent sur la Defense.
    const avant=poser(3);
    const apres=lancer(avant,1,avant.enemies[0].id);
    const recharge=HEROES.find(hero=>hero.id===MATHANAE).skills[1].cd;
    expect(lui(apres).buffs.defUp.turns).toBeLessThan(recharge);
  });

  it('la provocation vise toujours toutes les cibles : c’est son identité',()=>{
    // Elle ne s'applique qu'a 60 % par cible (0,75 moins la penalite d'affinite),
    // donc on verifie le jet, pas le resultat : chaque ennemi est soit provoque,
    // soit nomme dans le message de resistance. Restreindre le sort a la cible
    // designee laisserait les deux autres absents des deux listes.
    const avant=poser(3);
    const apres=lancer(avant,1,avant.enemies[0].id);
    const journal=apres.log[0];
    apres.enemies.forEach(cible=>{
      const vise=Boolean(cible.debuffs.provoke)||journal.includes(`${cible.name} résiste à Provocation`);
      expect(vise,`${cible.name} n’a pas été visé par la provocation`).toBe(true);
    });
    expect(apres.enemies.some(cible=>cible.debuffs.provoke),'plus aucune provocation ne passe').toBe(true);
  });
});

describe('Métamorphose démoniaque protège, sans remplacer un soigneur',()=>{
  const charge=(battle,cibles=3)=>{
    let courant=battle;
    for(let tour=0;tour<3;tour+=1){
      courant={...courant,turn:MATHANAE,
        allies:courant.allies.map(unit=>unit.id===MATHANAE?{...unit,cooldowns:[0,0,0]}:unit)};
      courant=lancer(courant,1,courant.enemies[0].id);
    }
    return{...courant,turn:MATHANAE,
      allies:courant.allies.map(unit=>unit.id===MATHANAE?{...unit,cooldowns:[0,0,0]}:unit)};
  };

  it('le bouclier ne couvre plus toute l’équipe',()=>{
    const pret=charge(poser(3));
    const blesses=pret.allies.map(unit=>({...unit,hp:Math.round(unit.maxHp*.5)}));
    const apres=lancer({...pret,allies:blesses},2,blesses[0].id);
    const protegees=apres.allies.filter(unit=>unit.shield>0);
    expect(protegees.length,'toute l’équipe était protégée').toBeLessThanOrEqual(2);
    expect(protegees.length,'plus personne n’est protégé').toBeGreaterThan(0);
  });

  it('le bouclier va aux alliés les plus bas',()=>{
    const pret=charge(poser(3));
    const allies=pret.allies.map((unit,rang)=>({...unit,hp:Math.round(unit.maxHp*(rang===0?.95:rang===1?.20:.35))}));
    const apres=lancer({...pret,allies},2,allies[0].id);
    const protegees=apres.allies.filter(unit=>unit.shield>0).map(unit=>unit.id);
    expect(protegees,'le plus haut en PV ne doit pas être servi en premier').not.toContain(allies[0].id);
  });

  it('son soin personnel reste utile mais borné',()=>{
    const pret=charge(poser(3));
    const blesse=pret.allies.map(unit=>unit.id===MATHANAE?{...unit,hp:Math.round(unit.maxHp*.3)}:unit);
    const avantPv=blesse.find(unit=>unit.id===MATHANAE).hp;
    const apres=lancer({...pret,allies:blesse},2,blesse[0].id);
    const soin=lui(apres).hp-avantPv;
    // Le soin est un pourcentage de la reserve de reference, pas de la barre
    // affichee : c'est sur cette base qu'il a ete borne.
    const part=soin/pvReference(lui(apres));
    expect(part,'le soin a disparu').toBeGreaterThan(.05);
    // A cinq Fragments il rendait 38 % de ses PV maximum d'un seul sort.
    expect(part,'le soin reste trop gros').toBeLessThan(.30);
  });
});

describe('les descriptions annoncent ce que le moteur fait vraiment',()=>{
  const sorts=()=>HEROES.find(hero=>hero.id===MATHANAE).skills;

  it('Sigil n’annonce plus « 1 Fragment par cible »',()=>{
    // La description promettait un gain proportionnel au nombre d'ennemis.
    // Le moteur plafonne desormais a 2 : le texte doit suivre.
    const texte=sorts()[1].description;
    expect(texte,'la promesse « par cible » a survécu').not.toMatch(/par cible/i);
    expect(texte).toMatch(/2 Fragments/);
  });

  it('le plafond annoncé est bien celui que le moteur applique',()=>{
    const annonce=Number(sorts()[1].description.match(/(\d+) Fragments/)[1]);
    const apres=lancer(poser(4),1,poser(4).enemies[0].id);
    expect(lui(apres).mechanic.value,'texte et moteur ne disent pas la même chose').toBe(annonce);
  });

  it('Métamorphose annonce les deux alliés protégés',()=>{
    expect(sorts()[2].description).toMatch(/2 alliés/);
  });
});

describe('ce qui n’a pas été touché',()=>{
  it('ses statistiques de base sont inchangées : il n’était pas surstatté',()=>{
    // 8e sur 11 chez les 5★ selon la ponderation du jeu. Le probleme etait le
    // cumul de son kit, pas sa fiche.
    const hero=HEROES.find(entry=>entry.id===MATHANAE);
    expect({hp:hero.hp,atk:hero.atk,def:hero.def,spd:hero.spd})
      .toEqual({hp:260,atk:34,def:24,spd:107});
  });

  it('il frappe toujours avec la Défense',()=>{
    const hero=HEROES.find(entry=>entry.id===MATHANAE);
    expect(hero.skills[0].effect).toBe('soulCleaveBuilder');
  });
});
