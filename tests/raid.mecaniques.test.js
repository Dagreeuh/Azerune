import{describe,it,expect}from'vitest';
import{RAIDS,createRaidMission,raidLevelData,RAID_POWER,NIVEAU_PRETRE,NIVEAU_GARDIEN,CANALISATION_DEPART}from'../src/data/raids';
import{optionsDeCombat}from'../src/utils/simulation';
import{createBattle,nextTurn,enemyAction,winner,performAutoAction,seuilEruption}from'../src/battle/engine';
import{joueur,avecHasard,equipePour}from'../Audit/mesures/joueur';
import{teamPower}from'../src/utils/stats';
import{simulerMission}from'../src/utils/simulation';

/**
 * Les mécaniques annoncées du Raid doivent exister, et arriver quand le jeu
 * le dit.
 *
 * Deux défauts mesurés :
 *   · le Prêtre apparaissait au niveau 3 et le Gardien au niveau 6, alors que
 *     l'écran les annonce au 4 et au 7 ;
 *   · la Canalisation du Cœur — mécanique écrite de bout en bout, avec sa
 *     punition et sa règle de pilotage automatique — ne s'est JAMAIS déclenchée
 *     en 60 combats. Le Prêtre mourait à la 1,8ᵉ action de champion, la
 *     canalisation démarrait à la 8ᵉ.
 */
const RAID=RAIDS[0].id;
const roleParNiveau=niveau=>createRaidMission(RAID,niveau).enemies.map(u=>u.raidRole);
const annonceJusqua=niveau=>raidLevelData(RAID,niveau).mechanics.map(m=>m[0]);

const combattre=(j,mission,equipe,tirages=10)=>{
  let abouties=0,interrompues=0;
  for(let t=0;t<tirages;t+=1)avecHasard(700+t,()=>{
    let b=createBattle(equipe,j.heroes,j.getStats,optionsDeCombat(mission));
    for(let g=0;g<600&&!b.winner;g+=1){
      if(!b.turn){b=nextTurn(b);continue}
      if(String(b.turn).startsWith('e')){b=enemyAction(b);continue}
      const o=performAutoAction(b);b=o?.battle||b;
      b={...b,winner:winner(b.allies,b.enemies)};
    }
    abouties+=b.raidState?.channelsCompleted||0;
    interrompues+=b.raidState?.channelsInterrupted||0;
  });
  return{abouties,interrompues};
};

describe('les mécaniques du Raid arrivent quand le jeu l’annonce',()=>{
  it('le Prêtre apparaît au niveau où il est annoncé',()=>{
    expect(annonceJusqua(NIVEAU_PRETRE)).toContain('Prêtre des flammes');
    expect(annonceJusqua(NIVEAU_PRETRE-1)).not.toContain('Prêtre des flammes');
    expect(roleParNiveau(NIVEAU_PRETRE)).toContain('priest');
    expect(roleParNiveau(NIVEAU_PRETRE-1)).not.toContain('priest');
  });

  it('le Gardien de lave apparaît au niveau où il est annoncé',()=>{
    expect(annonceJusqua(NIVEAU_GARDIEN)).toContain('Gardien de lave');
    expect(annonceJusqua(NIVEAU_GARDIEN-1)).not.toContain('Gardien de lave');
    expect(roleParNiveau(NIVEAU_GARDIEN)).toContain('guardian');
    expect(roleParNiveau(NIVEAU_GARDIEN-1)).not.toContain('guardian');
  });

  it('la Canalisation démarre avant que le Prêtre ne meure',()=>{
    // Le Prêtre meurt vers la 2e action quand il n'a pas de PV renforcés :
    // le seuil doit rester bas ET le Prêtre doit tenir.
    expect(CANALISATION_DEPART).toBeLessThanOrEqual(6);
    expect(raidLevelData(RAID,6).channelFrom).toBe(CANALISATION_DEPART);
    expect(raidLevelData(RAID,5).channelFrom).toBeNull();
  });

  it('la Canalisation se déclenche vraiment en combat',()=>{
    const j=joueur({zone:10,difficulte:'hard',niveau:60,etoiles:6,niveauObjet:12,competences:'max'});
    const mission=avecHasard(11,()=>createRaidMission(RAID,7));
    const r=combattre(j,mission,equipePour(mission,j));
    // Le défaut d'origine, en une ligne : zéro sur soixante combats.
    expect(r.abouties+r.interrompues).toBeGreaterThan(0);
  });

  it('amener un contrôle permet d’interrompre',()=>{
    const j=joueur({zone:10,difficulte:'hard',niveau:60,etoiles:6,niveauObjet:12,competences:'max'});
    const vexil=j.heroes.find(h=>h.name==='Vexil').id;
    const mission=avecHasard(11,()=>createRaidMission(RAID,7));
    const avec=combattre(j,mission,equipePour(mission,j,vexil));
    expect(avec.interrompues).toBeGreaterThan(0);
  });

  it('la puissance annoncée reste croissante et atteignable',()=>{
    RAID_POWER.forEach((v,i)=>{if(i)expect(v).toBeGreaterThan(RAID_POWER[i-1])});
    const j=joueur({zone:10,difficulte:'normal',niveau:60,etoiles:6,niveauObjet:15,competences:'max'});
    const mission=createRaidMission(RAID,10);
    expect(RAID_POWER[9]).toBeLessThanOrEqual(teamPower(equipePour(mission,j),j.heroes,j.getStats)*1.2);
  });
});

/**
 * Le Raid est annoncé 4v4. Le quatrième champion doit aider, pas punir.
 *
 * Le Cœur incandescent gagne une charge à chaque action de champion : une
 * équipe de quatre agissait un tiers plus souvent et déclenchait l'Éruption un
 * tiers plus tôt. Mesuré au niveau 10 : le trio gagnait 47 fois sur 60, et
 * l'ajout d'un quatrième champion faisait tomber ce chiffre entre 7 et 18.
 * Le quatrième emplacement existait pour être laissé vide.
 */
describe('le quatrième champion du Raid n’est plus une punition',()=>{
  it('le seuil d’Éruption suit la taille de l’équipe',()=>{
    // Le trio reste la référence : son seuil ne bouge pas.
    expect(seuilEruption(9,3)).toBe(9);
    expect(seuilEruption(9,4)).toBeGreaterThan(seuilEruption(9,3));
    // Rapport proportionnel : l'Éruption arrive au même rythme par tour.
    expect(seuilEruption(9,4)).toBe(12);
    // Jamais en dessous d'un plancher jouable, ni au-dessus de quatre.
    expect(seuilEruption(1,1)).toBeGreaterThanOrEqual(3);
    expect(seuilEruption(9,9)).toBe(seuilEruption(9,4));
  });

  it('à armes égales, quatre champions valent mieux que trois',()=>{
    const j=joueur({zone:9,difficulte:'normal',niveau:50,etoiles:5,niveauObjet:12,competences:'max'});
    const noyau=['Hicho','Aurelis','Morghast'].map(n=>j.heroes.find(h=>h.name===n).id);
    // Le renfort est choisi pour que le test SEPARE, et il a change une fois :
    // Vexil servait tant qu'il etait de valeur moyenne ; depuis le socle de
    // rarete il est trop faible pour que son ajout paie le quatrieme
    // emplacement, et le test echouait pour une raison etrangere a la mecanique
    // qu'il garde. Mathanae donne la separation la plus nette — verifie :
    //   avec le correctif : trio 56/60, +Mathanae 60/60
    //   sans le correctif : trio 56/60, +Mathanae 46/60
    const renfort=j.heroes.find(h=>h.name==='Mathanae').id;
    const mission=avecHasard(11,()=>createRaidMission(RAID,9));
    // Trois graines et 60 tirages : c'est le protocole du banc de mesure. A
    // 40 tirages la separation mesuree (60 contre 46) ne se reproduisait pas,
    // et un mutant qui retire le correctif passait le test.
    const taux=equipe=>[1,2,3].reduce((s,g)=>s+avecHasard(g*977,()=>simulerMission({mission,
      team:equipe,heroes:j.heroes,getStats:j.getStats,tirages:20})).victoires,0);
    const trois=taux(noyau),quatre=taux([...noyau,renfort]);
    // Le defaut d'origine, en une ligne : le quatrieme faisait PERDRE.
    expect(quatre).toBeGreaterThanOrEqual(trois);
  });
});
