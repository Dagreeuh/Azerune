import{describe,it,expect}from'vitest';
import{COMBAT_TEMPO,tempoPv,pvReference,createBattle,nextTurn,enemyAction,winner,performAutoAction}from'../src/battle/engine';
import{makeHero,makeEnemy,statsFrom,withStatus,giveTurnTo,findUnit,fixedRandom,mulberry32}from'./helpers';
import{castSkill}from'../src/battle/engine';
import{HEROES}from'../src/data/heroes';

// Le tempo raccourcit la reserve de PV des deux camps. Pour que le rapport
// soin/degats reste celui d'avant, tout ce qui s'exprime en pourcentage de PV
// max se calcule sur la reserve de reference, pas sur la barre raccourcie.
// Mesures : Audit/RAPPORT-EXPERIENCE-JOUEUR.md, `npm run mesures`.

describe('la reserve de combat suit le tempo',()=>{
  it('un champion entre en combat avec sa statistique divisee par le tempo',()=>{
    const heros=makeHero({hp:2400,spd:10});
    const combat=createBattle([heros.id],[heros],statsFrom,{enemies:[makeEnemy({id:'e1',hp:900,spd:1})]});
    const unite=combat.allies[0];
    expect(unite.maxHp,'la reserve alliee ne suit pas le tempo').toBe(Math.round(2400/COMBAT_TEMPO));
    expect(unite.hp,'un champion doit entrer en combat a pleine reserve').toBe(unite.maxHp);
  });

  it('les ennemis suivent le meme tempo que les alliés',()=>{
    const heros=makeHero({hp:2400,spd:10});
    const combat=createBattle([heros.id],[heros],statsFrom,{enemies:[makeEnemy({id:'e1',hp:900,spd:1})]});
    expect(combat.enemies[0].maxHp,'un camp seul a ete raccourci').toBe(Math.round(900/COMBAT_TEMPO));
  });

  it('la reserve de reference redonne la statistique d’origine',()=>{
    expect(pvReference({maxHp:tempoPv(2400)})).toBeCloseTo(2400,0);
  });

  it('le tempo raccourcit vraiment, il ne fait pas semblant',()=>{
    expect(COMBAT_TEMPO,'un tempo de 1 ne change rien').toBeGreaterThan(1);
  });
});

describe('le rapport soin/degats est preserve',()=>{
  const PV=1000;
  /** PV perdus par le champion apres un tour, avec les statuts donnes. */
  const apresUnTour=statuts=>{
    fixedRandom(.5);
    const heros=makeHero({hp:PV,spd:200});
    let combat=createBattle([heros.id],[heros],statsFrom,{enemies:[makeEnemy({id:'inerte',hp:99999,spd:1})]});
    combat=withStatus(combat,heros.id,statuts);
    return findUnit(nextTurn(giveTurnTo(combat,heros.id)),heros.id);
  };

  it('le Poison retire toujours 6 % de la reserve de reference, pas de la barre',()=>{
    const unite=apresUnTour({debuffs:{poison:{turns:3}}});
    const perte=unite.maxHp-unite.hp;
    expect(perte,'le Poison a ete raccourci avec la barre').toBe(Math.round(PV*.06));
    // Sur la barre raccourcie, il pese donc COMBAT_TEMPO fois plus — exactement
    // comme les degats directs, qui derivent des statistiques.
    expect(perte/unite.maxHp).toBeCloseTo(.06*COMBAT_TEMPO,2);
  });

  it('la Regeneration rend toujours 6 % de la reserve de reference',()=>{
    const unite=apresUnTour({buffs:{regen:{turns:3}},patch:{hp:50}});
    expect(unite.hp-50,'le soin periodique n’a pas suivi le tempo').toBe(Math.round(PV*.06));
  });
});

describe('soins et boucliers des sorts se calculent sur la reserve de reference',()=>{
  const STATS={hp:12000,atk:600,def:200,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};
  /** Combat pret a jouer, le champion demande a la main. */
  const poser=id=>{
    const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
    const b=createBattle([id,1,19],heroes,()=>({...STATS}),
      {enemies:[makeEnemy({id:'e1',hp:400000,atk:1,def:100,spd:1,element:'Arcane'})]});
    return{...b,turn:id,allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)};
  };
  const lancer=(b,i,cible)=>{fixedRandom(.5);const r=castSkill(b,i,cible);return r.battle||r};

  it('le Bouclier salvateur d’Aurelis vaut 32 % de la reserve de reference',()=>{
    const avant=poser(23),cible=avant.allies.find(u=>u.id===23);
    const apres=lancer(avant,1,cible.id);
    const protege=apres.allies.find(u=>u.id===cible.id);
    expect(protege.shield,'le bouclier a suivi la barre au lieu de la reference')
      .toBe(Math.round(pvReference(cible)*.32));
  });

  it('le Totem de Hicho soigne un pourcentage de la reserve de reference',()=>{
    const avant=poser(15);
    const blesse=avant.allies.map(u=>u.id===15?{...u,hp:1}:u);
    const cible=blesse.find(u=>u.id===15);
    const apres=lancer({...avant,allies:blesse},0,15);
    const soigne=apres.allies.find(u=>u.id===15);
    expect(soigne.hp-1,'le soin a suivi la barre au lieu de la reference')
      .toBe(Math.round(pvReference(cible)*.40));
  });

  it('le vol de vie de Ragnhild reste une fraction des degats, hors tempo',()=>{
    const avant=poser(32);
    const blesse=avant.allies.map(u=>u.id===32?{...u,hp:1}:u);
    const apres=lancer({...avant,allies:blesse},0,avant.enemies[0].id);
    const degats=avant.enemies[0].hp-apres.enemies[0].hp;
    const rendu=apres.allies.find(u=>u.id===32).hp-1;
    expect(degats,'aucun degat inflige, la mesure ne veut rien dire').toBeGreaterThan(0);
    // Il derive des degats, qui portent deja le tempo : pas de second facteur.
    expect(rendu,'le vol de vie a ete multiplie deux fois par le tempo')
      .toBe(Math.round(Math.round(degats*.20)));
  });
});

describe('les combats sont effectivement plus courts',()=>{
  /** Joue un combat jusqu'au bout et renvoie le nombre d'actions. */
  const derouler=depart=>{
    let b=depart,actions=0;
    for(let garde=0;garde<600&&!b.winner;garde+=1){
      if(!b.turn){b=nextTurn(b);continue}
      if(String(b.turn).startsWith('e')){actions+=1;b=enemyAction(b);continue}
      const r=performAutoAction(b,{});actions+=1;b=r&&r.battle?r.battle:b;
      b={...b,winner:winner(b.allies,b.enemies)};
    }
    return{actions,fini:Boolean(b.winner)};
  };
  /** Le meme combat, mais avec les reserves d'avant le tempo. */
  const sansTempo=b=>({...b,
    allies:b.allies.map(u=>({...u,hp:u.hp*COMBAT_TEMPO,maxHp:u.maxHp*COMBAT_TEMPO})),
    enemies:b.enemies.map(u=>({...u,hp:u.hp*COMBAT_TEMPO,maxHp:u.maxHp*COMBAT_TEMPO}))});

  it('le meme combat demande nettement moins d’actions qu’avec les anciennes reserves',()=>{
    const vrai=Math.random;
    try{
      const heros=[makeHero({hp:3000,atk:200,def:40,spd:110,element:'Arcane',name:'A'})];
      const construire=()=>createBattle([heros[0].id],heros,statsFrom,{
        enemies:[makeEnemy({id:'e1',hp:4000,atk:90,def:30,spd:100,element:'Arcane'})]});
      Math.random=mulberry32(7);const avec=derouler(construire());
      Math.random=mulberry32(7);const avant=derouler(sansTempo(construire()));
      expect(avec.fini&&avant.fini,'un des deux combats n’est pas allé à son terme').toBe(true);
      expect(avec.actions,'le tempo ne raccourcit rien').toBeLessThan(avant.actions);
      // On vise le facteur COMBAT_TEMPO ; on verifie au moins la moitie du gain.
      expect(avant.actions/avec.actions,'le raccourcissement est negligeable')
        .toBeGreaterThan(1+(COMBAT_TEMPO-1)/2);
    }finally{Math.random=vrai}
  });
});
