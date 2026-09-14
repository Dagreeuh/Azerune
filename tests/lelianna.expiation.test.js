import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill,COUPS_PENITENCE,COMBAT_TEMPO}from'../src/battle/engine';
import{championIdentity}from'../src/data/championIdentities';
import{mulberry32}from'./helpers';

// Expiation de Lelianna — correctif v1.75.
//
// Signale par le joueur : « la Pénitence, j'ai pas l'impression que ça heal ».
// C'etait vrai, et pas d'un peu.
//
// Elle rendait 35 % des DEGATS infliges. A l'echelle de ce moteur un coup vaut
// environ 3 % d'une barre de vie, donc 35 % de cela valait 1 %. Mesure avant
// correctif : Penitence rendait 34 PV sur une barre de 3 750, quand une brume
// de Yunmei en rend 43 %. Le soin etait annonce, calcule, affiche — et
// invisible. Il n'etait pas casse : il etait inapplicable a cette echelle.
//
// Deux autres defauts sortis de la meme mesure :
//   • « Frappe trois fois » etait purement decoratif : la boucle divise la
//     puissance par le nombre de coups, donc trois frappes valaient une.
//   • Puissance .52 pour un ultime monocible a cinq tours de recharge, quand
//     son sort de base en vaut .84 : son ultime frappait moins fort que son
//     attaque normale.
//
// Detail : Audit/RAPPORT-EXPERIENCE-JOUEUR.md, section 21.

const LELI=12;
const STATS={hp:9000,atk:900,def:200,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};
const heroes=()=>HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
const poser=(resonance=0)=>{
  const b=createBattle([LELI,20,19],heroes(),()=>({...STATS,resonanceLevel:resonance}),
    {enemies:[{name:'Cible',icon:'x',hp:900000,atk:1,def:150,spd:95,element:'Feu'}]});
  return{...b,allies:b.allies.map(u=>({...u,hp:Math.round(u.maxHp*.3)}))};
};
const pret=(b,id)=>({...b,turn:id,allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)});
const lancer=(b,i,c)=>{const v=Math.random;Math.random=mulberry32(7);
  try{const o=castSkill(pret(b,LELI),i,c);return o.battle||o}finally{Math.random=v}};
const sorts=()=>HEROES.find(h=>h.id===LELI).skills;
const barre=b=>b.allies[0].maxHp;
const soinTotal=(avant,apres)=>apres.allies.reduce((s,u)=>s+(u.hp-avant.allies.find(x=>x.id===u.id).hp),0);

describe('la Pénitence soigne enfin, et ça se voit',()=>{
  it('elle rend une part réelle de la barre, pas 1 %',()=>{
    const b=poser(),a=lancer(b,2,b.enemies[0].id);
    const part=soinTotal(b,a)/barre(b);
    // Avant correctif : 34 PV sur 3750, soit 0,9 % — et sur UN seul allié.
    expect(part,`soin total mesuré : ${(part*100).toFixed(0)} % d’une barre`).toBeGreaterThan(.35);
  });

  it('elle applique l’Expiation à toute l’équipe',()=>{
    // Sans cela, « chaque allié sous Expiation » ne pouvait désigner qu'UN
    // allié : seul le Mot de pouvoir la posait, sur une cible unique.
    const b=poser(),a=lancer(b,2,b.enemies[0].id);
    expect(a.allies.filter(u=>u.buffs?.atonement?.source===LELI)).toHaveLength(3);
  });

  it('les trois alliés sont soignés, pas seulement la cible',()=>{
    const b=poser(),a=lancer(b,2,b.enemies[0].id);
    a.allies.forEach(u=>expect(u.hp,`${u.name} n’est pas soigné`)
      .toBeGreaterThan(b.allies.find(x=>x.id===u.id).hp));
  });

  it('son ultime frappe désormais plus fort que son attaque de base',()=>{
    // Il valait .52 contre .84 : cinq tours de recharge pour moins de dégâts
    // qu'un coup normal.
    expect(sorts()[2].power).toBeGreaterThan(sorts()[0].power);
  });
});

describe('les trois coups comptent vraiment',()=>{
  it('le soin est proportionnel au nombre de coups',()=>{
    // La boucle de frappe divise la puissance par le nombre de coups : trois
    // frappes infligent autant qu'une. Ce sont les SOINS qui donnent leur sens
    // aux trois coups — un par coup.
    const b=poser();
    const chatiment=lancer(lancer(b,2,b.enemies[0].id),0,b.enemies[0].id);
    const apresPenitence=lancer(b,2,b.enemies[0].id);
    const parCoup=soinTotal(apresPenitence,chatiment);
    const troisCoups=soinTotal(b,apresPenitence);
    expect(troisCoups/parCoup,'la Pénitence ne soigne pas trois fois plus que le Châtiment')
      .toBeCloseTo(COUPS_PENITENCE,0);
  });

  it('le nombre de coups n’est écrit qu’à un seul endroit',()=>{
    // La boucle de frappe, le soin et le texte doivent dire la meme chose.
    const moteur=fs.readFileSync(fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8');
    expect(COUPS_PENITENCE).toBe(3);
    expect(moteur,'le nombre de coups est écrit en dur dans la boucle')
      .toContain("if(e==='atonementPenance')hits=COUPS_PENITENCE;");
    expect(sorts()[2].description,'le texte n’annonce plus trois coups').toContain('trois fois');
  });
});

describe('le Châtiment entretient la fenêtre ouverte par la Pénitence',()=>{
  it('seul, il ne soigne personne',()=>{
    const b=poser(),a=lancer(b,0,b.enemies[0].id);
    expect(soinTotal(b,a),'il soigne sans Expiation').toBe(0);
  });

  it('après la Pénitence, il soigne toute l’équipe',()=>{
    const b=poser();
    const ouvert=lancer(b,2,b.enemies[0].id);
    const blesse={...ouvert,allies:ouvert.allies.map(u=>({...u,hp:Math.round(u.maxHp*.3)}))};
    const a=lancer(blesse,0,blesse.enemies[0].id);
    a.allies.forEach(u=>expect(u.hp,`${u.name}`).toBeGreaterThan(blesse.allies.find(x=>x.id===u.id).hp));
  });

  it('il soigne une part modeste : c’est un entretien, pas un ultime',()=>{
    const b=poser();
    const ouvert=lancer(b,2,b.enemies[0].id);
    const blesse={...ouvert,allies:ouvert.allies.map(u=>({...u,hp:Math.round(u.maxHp*.3)}))};
    const a=lancer(blesse,0,blesse.enemies[0].id);
    const parAllie=(a.allies[1].hp-blesse.allies[1].hp)/barre(b);
    expect(parAllie,`${(parAllie*100).toFixed(0)} % par allié`).toBeGreaterThan(.04);
    expect(parAllie).toBeLessThan(.10);
  });
});

describe('l’équilibrage reste celui d’un soigneur qui frappe',()=>{
  it('elle soigne nettement moins qu’une soigneuse pure',()=>{
    // Yunmei rend 158 % d'une barre d'un seul Renouveau, sans infliger de
    // degats. Lelianna doit rester derriere.
    const b=poser(),penitence=soinTotal(b,lancer(b,2,b.enemies[0].id))/barre(b);
    const y=createBattle([34,20,19],heroes(),()=>({...STATS}),
      {enemies:[{name:'C',icon:'x',hp:900000,atk:1,def:150,spd:95,element:'Feu'}]});
    const yb={...y,allies:y.allies.map(u=>({...u,hp:Math.round(u.maxHp*.3)}))};
    const v=Math.random;Math.random=mulberry32(7);
    let ya;try{const o=castSkill({...yb,turn:34,allies:yb.allies.map(u=>u.id===34?{...u,cooldowns:[0,0,0]}:u)},2,yb.allies[0].id);ya=o.battle||o}finally{Math.random=v}
    const renouveau=ya.allies.reduce((s,u)=>s+(u.hp-yb.allies.find(x=>x.id===u.id).hp),0)/yb.allies[0].maxHp;
    expect(penitence,`Lelianna ${(penitence*100).toFixed(0)} % · Yunmei ${(renouveau*100).toFixed(0)} %`)
      .toBeLessThan(renouveau);
  });

  it('mais elle inflige des dégâts, ce que Yunmei ne fait pas avec son ultime',()=>{
    const b=poser(),a=lancer(b,2,b.enemies[0].id);
    expect(b.enemies[0].hp-a.enemies[0].hp,'la Pénitence n’inflige plus rien').toBeGreaterThan(100);
  });

  it('la Résonance IV augmente bien le soin par coup',()=>{
    const base=poser(0),haute=poser(4);
    const sansR=soinTotal(base,lancer(base,2,base.enemies[0].id));
    const avecR=soinTotal(haute,lancer(haute,2,haute.enemies[0].id));
    expect(avecR).toBeGreaterThan(sansR);
  });
});

describe('ce que le kit annonce est ce qu’il fait',()=>{
  it('la Pénitence ne promet plus une conversion de dégâts',()=>{
    // La promesse « 35 % des dégâts totaux » etait tenue au sens strict, et
    // invisible au sens reel. Mieux vaut ne plus la faire.
    expect(sorts()[2].description).not.toMatch(/35 %|dégâts totaux/);
    expect(sorts()[2].description).toContain('Expiation à toute l’équipe');
  });

  it('le Châtiment annonce qu’il SOIGNE, et ne prétend plus déclencher l’Expiation',()=>{
    // Ancien texte : « Inflige des dégâts et déclenche Expiation ». C'etait
    // faux : le Châtiment ne pose pas l'Expiation, seul le Mot de pouvoir — et
    // maintenant la Pénitence — la posent. Il soigne ceux qui la portent.
    expect(sorts()[0].description).toContain('soigne les alliés sous Expiation');
    expect(sorts()[0].description,'il prétend de nouveau déclencher l’Expiation')
      .not.toMatch(/déclenche/i);
    const b=poser(),a=lancer(b,0,b.enemies[0].id);
    expect(a.allies.filter(u=>u.buffs?.atonement),'le Châtiment pose l’Expiation').toHaveLength(0);
  });

  it('l’identité ne parle plus de convertir des dégâts en soins',()=>{
    const identite=championIdentity({id:LELI});
    expect(identite.summary).not.toMatch(/convertit ses dégâts/);
    expect(identite.summary).toContain('chaque coup');
  });

  it('la Résonance IV annonce les deux valeurs réelles',()=>{
    const source=fs.readFileSync(fileURLToPath(new URL('../src/data/championIdentities.js',import.meta.url)),'utf8');
    const ligne=source.slice(source.indexOf("12:'"),source.indexOf("',",source.indexOf("12:'")));
    expect(ligne).toContain('8 %');
    expect(ligne).toContain('6 %');
  });

  it('les pourcentages annoncés sont ceux que le moteur applique',()=>{
    // Le soin passe par `heal`, qui multiplie par le tempo de combat : la part
    // ecrite dans le moteur n'est donc pas celle que le joueur voit. C'est
    // exactement le genre d'ecart qui fait mentir un texte.
    const b=poser();
    const ouvert=lancer(b,2,b.enemies[0].id);
    const blesse={...ouvert,allies:ouvert.allies.map(u=>({...u,hp:1}))};
    const a=lancer(blesse,0,blesse.enemies[0].id);
    const partReelle=(a.allies[1].hp-1)/barre(b);
    expect(partReelle,`mesuré ${(partReelle*100).toFixed(1)} %, annoncé 6 %`).toBeCloseTo(.06,2);
    expect(COMBAT_TEMPO,'le tempo a changé, les pourcentages annoncés sont à revoir').toBe(2.4);
  });
});
