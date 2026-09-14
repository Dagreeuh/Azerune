import{describe,it,expect}from'vitest';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill,nextTurn,enemyAction,winner,performAutoAction}from'../src/battle/engine';
import{makeEnemy,makeHero,statsFrom,giveTurnTo,findUnit,fixedRandom,seedRandom}from './helpers';

/**
 * Caelion, Chronomancien — refonte.
 *
 * L'ancien kit était entièrement de la manipulation de JAUGE : voler 15 % ici,
 * en donner 25 % là, mémoriser puis restaurer. Mesuré sur quatre rencontres et
 * trois compositions : **6 victoires sur 288**, dernier du jeu, et il y restait
 * après avoir QUADRUPLÉ ses chiffres — offrir un tour entier de jauge ne
 * changeait rien.
 *
 * La raison est structurelle : la jauge est une file d'attente, pas une
 * ressource. Avancer un allié retarde les autres ; le nombre d'actions d'une
 * équipe est fixé par la VITESSE. Caelion passait son tour à réordonner ce qui
 * allait arriver de toute façon.
 *
 * Le kit garde son identité — le temps — et change de levier : ralentir
 * l'ennemi, hâter l'allié. Mesuré après refonte : 6 → 23 sur 288, et l'équipe
 * agit 2,92 fois par action ennemie contre 2,37 avec un quatrième champion
 * ordinaire.
 */
const CAELION=30,ECLAT=0,HATE=1,DISTORSION=2;
const S=()=>({hp:4000,atk:200,def:60,spd:100,crit:0,critDamage:50,
  accuracy:60,resistance:0,setEffects:[],resonanceLevel:0});

function scene({allieMort=false}={}){
  fixedRandom(.5);
  const caelion=HEROES.find(h=>h.id===CAELION);
  const equipe=[caelion,makeHero({id:9401,name:'Compagne',hp:3000,atk:80,def:20,spd:90}),
    makeHero({id:9402,name:'Comparse',hp:3000,atk:80,def:20,spd:80})];
  let b=createBattle(equipe.map(h=>h.id),equipe.map(h=>({...h,currentStars:6,skillLevels:{0:1,1:1,2:1}})),
    ()=>S(),{enemies:[makeEnemy({id:'c0',hp:400000,atk:10,def:0,spd:50,element:'Nature',resistance:0})]});
  // La recharge a rendre est sur l'ALLIE ; Caelion, lui, doit pouvoir lancer.
  b={...b,allies:b.allies.map(u=>({...u,cooldowns:u.id===CAELION?[0,0,0]:[0,2,0],
    ...(allieMort&&u.id===9401?{hp:0,dead:true}:{})}))};
  return nextTurn(giveTurnTo(b,CAELION));
}
const lancer=(b,index,cible)=>{const s=castSkill(b,index,cible);return s.battle||b};

describe('Caelion ralentit l’ennemi et hâte les siens',()=>{
  it('l’Éclat du sablier frappe et ralentit',()=>{
    const avant=scene(),ennemi=avant.enemies[0];
    const apres=lancer(avant,ECLAT,ennemi.id);
    const cible=apres.enemies[0];
    expect(cible.hp,'aucun dégât').toBeLessThan(ennemi.hp);
    expect(cible.debuffs.slow,'pas de Ralentissement').toBeTruthy();
  });

  it('la Hâte temporelle accélère un AUTRE allié et lui rend une recharge',()=>{
    const avant=scene();
    const apres=lancer(avant,HATE,9401);
    const allie=findUnit(apres,9401);
    expect(allie.buffs.speedUp).toBeTruthy();
    expect(allie.cooldowns[1],'la recharge n’a pas été rendue').toBeLessThan(2);
    expect(findUnit(apres,CAELION).buffs.speedUp,'Caelion se hâte lui-même').toBeFalsy();
  });

  it('la Distorsion temporelle hâte TOUTE l’équipe',()=>{
    const apres=lancer(scene(),DISTORSION,CAELION);
    apres.allies.filter(u=>!u.dead)
      .forEach(u=>expect(u.buffs.speedUp,`${u.name} n’est pas hâté`).toBeTruthy());
  });

  it('un allié hâté est réellement plus rapide',()=>{
    const avant=scene();
    const vitesseAvant=findUnit(avant,9401).currentSpd;
    const apres=nextTurn(lancer(avant,DISTORSION,CAELION));
    expect(findUnit(apres,9401).currentSpd).toBeGreaterThan(vitesseAvant);
  });

  it('la Distorsion relève un allié tombé, une seule fois',()=>{
    let b=scene({allieMort:true});
    b=lancer(b,DISTORSION,CAELION);
    const releve=findUnit(b,9401);
    expect(releve.dead).toBe(false);
    expect(releve.hp).toBeCloseTo(Math.round(releve.maxHp*.35),-1);
    // Une seconde chute ne se rattrape pas.
    b={...b,allies:b.allies.map(u=>u.id===9401?{...u,hp:0,dead:true}:{...u,cooldowns:[0,0,0]})};
    b=lancer(nextTurn(giveTurnTo(b,CAELION)),DISTORSION,CAELION);
    expect(findUnit(b,9401).dead,'la réanimation a resservi').toBe(true);
  });

  // Le contrat qui compte vraiment : la hate doit se traduire par des ACTIONS.
  it('l’équipe agit plus souvent avec Caelion qu’avec un champion ordinaire',()=>{
    const rapport=quatrieme=>{
      seedRandom(4242);
      const heroes=HEROES.map(h=>({...h,currentStars:6,skillLevels:{0:1,1:1,2:1}}));
      let b=createBattle([1,3,7,quatrieme],heroes,()=>S(),
        {enemies:[makeEnemy({id:'c0',hp:900000,atk:20,def:40,spd:100,element:'Nature',resistance:0})]});
      let a=0,e=0;
      for(let g=0;g<700&&!b.winner;g+=1){
        if(!b.turn){b=nextTurn(b);continue}
        if(String(b.turn).startsWith('e')){b=enemyAction(b);e+=1;continue}
        const o=performAutoAction(b);b=o?.battle||b;
        b={...b,winner:winner(b.allies,b.enemies)};a+=1;
      }
      return a/Math.max(1,e);
    };
    // Vharok : un quatrieme champion ordinaire, sans hate.
    const vharok=HEROES.find(h=>h.name==='Vharok').id;
    expect(rapport(CAELION)).toBeGreaterThan(rapport(vharok));
  });

  it('les descriptions annoncent ce que le moteur applique',()=>{
    const caelion=HEROES.find(h=>h.id===CAELION);
    expect(caelion.skills[ECLAT].description).toMatch(/ralentit/i);
    expect(caelion.skills[HATE].description).toMatch(/accélère.*allié/i);
    expect(caelion.skills[DISTORSION].description).toMatch(/toute l’équipe/i);
    expect(caelion.skills[DISTORSION].description).toMatch(/une fois par combat/i);
    // Plus aucune promesse de jauge : le kit n'en manipule plus.
    caelion.skills.forEach(s=>expect(s.description,s.name).not.toMatch(/jauge/i));
  });
});
