/**
 * Tour de tous les champions — 32 champions, 96 sorts.
 *
 * Ce fichier ne contient AUCUNE assertion : c'est une battue, pas un test. Il
 * lance chaque sort dans une scene representative et signale tout ce qui
 * detonne : sort sans effet, puissance declaree sans degats, sort de soutien
 * qui blesse, recharge incoherente, et surtout promesse de description non
 * tenue — la classe de bug la plus frequente du projet.
 *
 *     npm run mesures
 *
 * Trois pieges m'ont d'abord fait crier au loup, et sont documentes dans le
 * code : une copie de surface partagee avec le moteur (aucun changement
 * visible), un bouclier de test qui absorbait tous les degats, et des motifs
 * trop larges confondant « brise le bouclier ennemi » et « donne un bouclier ».
 *
 * Deux signalements restent attendus, et sont de faux positifs verifies :
 * la Graine de Sylven purifie plus tard (quand les PV tombent) et la Penitence
 * de Lelianna soigne les allies sous Expiation, qu'un lancer isole n'a pas.
 * Les deux sont verrouilles par tests/promesses.conditionnelles.test.js.
 *
 * Detail : Audit/RAPPORT-EXPERIENCE-JOUEUR.md, section 13.
 */
import{it}from'vitest';
import{HEROES}from'../../src/data/heroes';
import{createBattle,castSkill}from'../../src/battle/engine';
import{makeEnemy,fixedRandom}from'../../tests/helpers';

const S={hp:12000,atk:700,def:220,spd:100,crit:0,critDamage:50,accuracy:40,resistance:0,setEffects:[],resonanceLevel:0};
const ennemis=()=>[
  makeEnemy({id:'e1',name:'E1',hp:900000,atk:1,def:120,spd:1,element:'Arcane'}),
  makeEnemy({id:'e2',name:'E2',hp:900000,atk:1,def:120,spd:1,element:'Nature'}),
  makeEnemy({id:'e3',name:'E3',hp:900000,atk:1,def:120,spd:1,element:'Feu'})];

/** Combat prêt : le champion audité, deux comparses blessés. */
function poser(id){
  const heroes=HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
  const autres=HEROES.filter(h=>h.id!==id).slice(0,2).map(h=>h.id);
  const b=createBattle([id,...autres],heroes,()=>({...S}),{enemies:ennemis()});
  return{...b,turn:id,
    allies:b.allies.map(u=>u.id===id
      ?{...u,cooldowns:[0,0,0],hp:Math.round(u.maxHp*.5)}
      :{...u,hp:Math.round(u.maxHp*.4)})};
}
const pret=(b,id)=>({...b,turn:id,allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)});

/** Photographie de l'état observable. */
const photo=b=>({
  pvEnnemis:b.enemies.reduce((s,u)=>s+u.hp,0),
  pvAllies:b.allies.reduce((s,u)=>s+u.hp,0),
  boucliers:b.allies.reduce((s,u)=>s+(u.shield||0),0),
  bouclierEnnemi:b.enemies.reduce((s,u)=>s+(u.shield||0),0),
  buffs:JSON.stringify(b.allies.map(u=>u.buffs||{})),
  debuffs:JSON.stringify(b.enemies.map(u=>u.debuffs||{})),
  debuffsAllies:JSON.stringify(b.allies.map(u=>u.debuffs||{})),
  buffsEnnemis:JSON.stringify(b.enemies.map(u=>u.buffs||{})),
  mecaEnnemis:JSON.stringify(b.enemies.map(u=>u.mechanic||null)),
  morts:b.enemies.filter(u=>u.dead).length+b.allies.filter(u=>u.dead).length,
  meca:JSON.stringify(b.allies.find(u=>u.id===b.__id)?.mechanic||{}),
  atbEnnemis:b.enemies.reduce((s,u)=>s+(u.atb||0),0)
});


/**
 * Promesses lisibles dans une description, et ce qu'on doit observer si elle
 * est tenue. C'est la classe de bug la plus frequente du projet : une moitie
 * ecrite sans l'autre.
 */
const PROMESSES=[
 [/soigne|soin(?!s réduits)|guéri/i,'soin'],
 [/(?<!brise |détruit |exposé |contre les )bouclier(?!s? (?:ennemis?|adverses?|a été))|protège|barrière/i,'bouclier'],
 [/étourdi/i,'etourdi'],
 [/purifi/i,'purifie'],
 [/provoqu/i,'provoque'],
 [/enflamme|embrase|applique .{0,12}Brûlure|propage .{0,12}Brûlure/i,'brulure'],
 [/empoisonn|applique .{0,12}Poison|Poison\./i,'poison'],
 [/applique .{0,12}Saignement|inflige .{0,12}Saignement|prolonge .{0,12}Saignement/i,'saignement'],
 [/ressuscite|réanime|relève/i,'reanime'],
 [/régénération/i,'regen'],
 [/ralenti/i,'ralenti'],
];
const observe=(avant,apres,soins,bouclier)=>{
  const deb=u=>Object.keys(u.debuffs||{});
  const buf=u=>Object.keys(u.buffs||{});
  const nouveaux=(cle,cote)=>apres[cote].some((u,i)=>deb(u).includes(cle)&&!deb(avant[cote][i]||{}).includes(cle));
  const nouveauBuff=(cle,cote)=>apres[cote].some((u,i)=>buf(u).includes(cle)&&!buf(avant[cote][i]||{}).includes(cle));
  const retires=apres.allies.some((u,i)=>deb(avant.allies[i]||{}).some(k=>!deb(u).includes(k)));
  const bouge=cle=>apres.enemies.some((u,i)=>{
    const a=avant.enemies[i]?.debuffs?.[cle],b=u.debuffs?.[cle];
    return JSON.stringify(a||null)!==JSON.stringify(b||null);});
  return{
    soin:soins>0||nouveauBuff('regen','allies')||nouveauBuff('healingSeed','allies')||nouveauBuff('healingTotem','allies'),
    bouclier:bouclier>0||nouveauBuff('shield','allies'),
    etourdi:nouveaux('stun','enemies'),
    purifie:retires,
    provoque:nouveaux('provoke','enemies'),
    // Applique OU consomme : « propage la Brulure » et « consomme la Brulure »
    // sont deux promesses tenues, et les deux se lisent sur le meme marqueur.
    brulure:bouge('burn'),
    poison:bouge('poison')||bouge('virulence'),
    saignement:bouge('bleed'),
    reanime:apres.allies.filter(u=>u.dead).length<avant.allies.filter(u=>u.dead).length,
    regen:nouveauBuff('regen','allies'),
    ralenti:nouveaux('slow','enemies')||nouveaux('frost','enemies'),
  };
};

it('audit de tous les sorts',()=>{
  const anomalies=[];
  HEROES.forEach(hero=>{
    hero.skills.forEach((skill,index)=>{
      // Trois lancers du sort 1 d'abord : les finisseurs ont besoin de charges.
      let b=poser(hero.id);b.__id=hero.id;
      try{
        for(let k=0;k<3&&index>0;k+=1){b=pret(b,hero.id);fixedRandom(.5);
          const r=castSkill(b,0,b.enemies[0].id);b=(r.battle||r);b.__id=hero.id;}
      }catch(e){anomalies.push({hero:hero.name,index,type:'EXCEPTION en préparation',detail:String(e.message).slice(0,90)});return}
      // Scene representative : allies blesses et affaiblis (il y a quelque chose
      // a soigner et a purifier), ennemis deja affliges et proteges (il y a
      // quelque chose a consommer, a briser et a executer).
      b=pret(b,hero.id);
      b={...b,
        allies:b.allies.map(u=>({...u,hp:Math.round(u.maxHp*.4),
          debuffs:{...u.debuffs,defDown:{turns:3},atkDown:{turns:3}}})),
        enemies:b.enemies.map((u,i)=>({...u,
          hp:i===2?Math.round(u.maxHp*.15):u.hp,
          shield:Math.round(u.maxHp*.02),maxShield:Math.round(u.maxHp*.02),
          debuffs:{...u.debuffs,burn:{turns:1,source:hero.id,sourceAtk:S.atk},
            poison:{turns:1,source:hero.id},bleed:{turns:1,source:hero.id,sourceAtk:S.atk},
            exposed:{turns:1},mark:{turns:1}}}))};
      b.__id=hero.id;
      const avant=photo(b),brutAvant=JSON.parse(JSON.stringify({allies:b.allies,enemies:b.enemies}));
      const cible=['ally','allAllies'].includes(skill.target)
        ?b.allies.find(u=>u.id!==hero.id).id
        :b.enemies[0].id;
      let apres,erreur=null;
      try{fixedRandom(.5);const r=castSkill(b,index,cible);
        if(r.error){erreur=r.error}else{apres=r.battle||r;apres.__id=hero.id;}}
      catch(e){anomalies.push({hero:hero.name,index,type:'EXCEPTION',detail:String(e.message).slice(0,90)});return}
      if(erreur){anomalies.push({hero:hero.name,index,type:'REFUS',detail:erreur});return}
      const a=photo(apres),brutApres={allies:apres.allies,enemies:apres.enemies};
      // Un bouclier absorbe : sans le compter, tout sort passerait pour muet.
      const degats=(avant.pvEnnemis+avant.bouclierEnnemi)-(a.pvEnnemis+a.bouclierEnnemi);
      const soins=a.pvAllies-avant.pvAllies;
      const bouclier=a.boucliers-avant.boucliers;
      const bouge=Object.keys(a).some(cle=>a[cle]!==avant[cle]);
      const ligne={hero:hero.name,index,nom:skill.name,effet:skill.effect,power:skill.power||0,
        cible:skill.target,degats,soins,bouclier};
      if(!bouge)anomalies.push({...ligne,type:'AUCUN EFFET OBSERVABLE'});
      else if((skill.power||0)>0&&['enemy','allEnemies'].includes(skill.target)&&degats<=0)
        anomalies.push({...ligne,type:'PUISSANCE DÉCLARÉE MAIS AUCUN DÉGÂT'});
      else if((skill.power||0)===0&&degats>0&&['enemy','allEnemies'].includes(skill.target))
        anomalies.push({...ligne,type:'DÉGÂTS SANS PUISSANCE DÉCLARÉE'});
      else if(['ally','allAllies','self'].includes(skill.target)&&degats>0)
        anomalies.push({...ligne,type:'SORT DE SOUTIEN QUI BLESSE L’ENNEMI'});
      // Ce que la description promet doit s'observer.
      const vu=observe(brutAvant,brutApres,soins,bouclier);
      PROMESSES.forEach(([motif,cle])=>{
        // Un sort offensif qui parle de bouclier parle de celui de l'ennemi.
        if(cle==='bouclier'&&['enemy','allEnemies'].includes(skill.target))return;
        if(motif.test(skill.description||'')&&!vu[cle])
          anomalies.push({...ligne,type:`PROMESSE NON TENUE : « ${cle} » annoncé, jamais observé`});
      });
    });
  });
  // --- Recharges : ce qui est annonce doit etre applique ---
  HEROES.forEach(hero=>{
    hero.skills.forEach((skill,index)=>{
      let b=poser(hero.id);b=pret(b,hero.id);
      try{fixedRandom(.5);
        const cible=['ally','allAllies'].includes(skill.target)?b.allies.find(u=>u.id!==hero.id).id:b.enemies[0].id;
        const r=castSkill(b,index,cible);const ap=r.battle||r;
        const cd=ap.allies.find(u=>u.id===hero.id)?.cooldowns?.[index]||0;
        // Contrat visible par le joueur : un sort a recharge devient
        // indisponible, un sort sans recharge reste disponible.
        if(skill.cd>0&&cd<=0)anomalies.push({hero:hero.name,index,nom:skill.name,
          type:`RECHARGE : ${skill.cd} annoncée mais le sort reste disponible`});
        if(!skill.cd&&cd>0)anomalies.push({hero:hero.name,index,nom:skill.name,
          type:`RECHARGE : aucune annoncée mais le sort part en recharge (${cd})`});
        // Une recharge plus longue que celle annoncée serait une punition muette.
        if(skill.cd>0&&cd>skill.cd+1)anomalies.push({hero:hero.name,index,nom:skill.name,
          type:`RECHARGE : ${skill.cd} annoncée, ${cd} appliquée`});
      }catch(e){/* deja signale plus haut */}
    });
  });
  console.log('\n=== ANOMALIES ('+anomalies.length+' sur '+HEROES.length*3+' sorts) ===');
  anomalies.forEach(x=>console.log(`${x.hero.padEnd(13)} sort ${x.index+1} · ${(x.nom||'').padEnd(24)} ${x.type}`
    +(x.detail?` — ${x.detail}`:'')+(x.effet?` [${x.effet} p=${x.power} ${x.cible}]`:'')));
},600000);
