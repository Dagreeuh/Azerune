import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill}from'../src/battle/engine';
import{ARCHETYPES,CLES_DE_VOUTE,clesDuChampion,cleAllumee,bonusDeCle,cleNodeId}from'../src/data/clesDeVoute';
import{empreinteStatus,empreinteTree,empreintePoints,empreinteDepth,COUT_CLE,COUT_CLE_MAITRISE,coutDeCle,RESONANCE_CLE,RESONANCE_MAITRISE,
  ETAGE_RESONANCE,RESONANCE_POINT_TIERS,peutRecevoir}from'../src/data/empreintes';
import{mulberry32}from'./helpers';

// Refonte des Empreintes — v1.74.
//
// Diagnostic mesure du systeme d'avant :
//   • 32 champions, UN seul jeu de noms de noeuds — aucune identite
//   • 46 noeuds sur 384 ne faisaient pas ce que leur branche annoncait :
//     17 champions sur 32 n'ont aucun effet a jet, donc toute leur branche
//     Emprise retombait sur de la puissance
//   • l'arbre exigeait 12 noeuds distincts a des champions qui n'offrent que
//     4 a 11 ancrages (mediane 7) — Caelion en portait sept doublons
//   • 19 repartitions legales a 6★ R5, mais 32 points d'ecart entre la
//     meilleure et la pire : une bonne reponse et dix-huit pieges
//
// Detail : Audit/RAPPORT-EXPERIENCE-JOUEUR.md, section 20.

const STATS={hp:9000,atk:900,def:200,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};
const ennemi=(n,hp=900000)=>({name:n,icon:'x',hp,atk:1,def:150,spd:95,accuracy:0,resistance:0,element:'Feu'});
const poser=(equipe,cle,nb=3,statsPar=null)=>{
  const h=HEROES.map(x=>({...x,currentStars:5,skillLevels:{0:1,1:1,2:1},
    cleDeVoute:x.id===equipe[0]&&cle?cle:null}));
  return createBattle(equipe,h,hero=>({...STATS,...(statsPar?statsPar(hero):{})}),
    {enemies:Array.from({length:nb},(u,i)=>ennemi(`C${i+1}`))});
};
const pret=(b,id)=>({...b,turn:id,allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)});
const lancer=(b,id,i,c)=>{const v=Math.random;Math.random=mulberry32(7);
  try{const o=castSkill(pret(b,id),i,c);return o.battle||o}finally{Math.random=v}};
const cle=(a,v)=>({archetype:a,valeur:v??ARCHETYPES[a].defaut,nom:'Clé de test'});

describe('les dix archétypes font réellement quelque chose',()=>{
  it('Amorce : le champion entre en combat avec sa ressource',()=>{
    expect(poser([26,20,19],null).allies[0].mechanic.value).toBe(0);
    expect(poser([26,20,19],cle('amorce')).allies[0].mechanic.value).toBe(2);
  });

  it('Amorce ne dépasse jamais le plafond du champion',()=>{
    // Nyxaris plafonne a 3 : une amorce de 9 ne doit pas la mettre a 9.
    const b=poser([36,20,19],cle('amorce',9));
    expect(b.allies[0].mechanic.value).toBe(b.allies[0].mechanic.max);
  });

  it('Sacrifice : ressource au maximum, PV maximum réduits',()=>{
    const sans=poser([9,20,19],null),avec=poser([9,20,19],cle('sacrifice'));
    expect(avec.allies[0].mechanic.value).toBe(avec.allies[0].mechanic.max);
    expect(sans.allies[0].mechanic.value).toBe(0);
    expect(avec.allies[0].maxHp,'les PV ne sont pas payés').toBeLessThan(sans.allies[0].maxHp);
    expect(avec.allies[0].hp).toBeLessThanOrEqual(avec.allies[0].maxHp);
  });

  const degats=(equipe,c,prepare=x=>x)=>{
    let b=prepare(poser(equipe,c));
    const avant=b.enemies[0].hp;
    return avant-lancer(b,equipe[0],0,b.enemies[0].id).enemies[0].hp;
  };

  it('Ferveur : la ressource actuelle amplifie le coup',()=>{
    const plein=b=>({...b,allies:b.allies.map(u=>u.id===24?{...u,mechanic:{...u.mechanic,value:5}}:u)});
    expect(degats([24,20,19],cle('ferveur'),plein)).toBeGreaterThan(degats([24,20,19],null,plein));
  });

  it('Ferveur ne donne rien à ressource vide : c’est tout son intérêt',()=>{
    const vide=b=>({...b,allies:b.allies.map(u=>u.id===24?{...u,mechanic:{...u.mechanic,value:0}}:u)});
    expect(degats([24,20,19],cle('ferveur'),vide)).toBe(degats([24,20,19],null,vide));
  });

  it('Acharnement : la cible affaiblie prend davantage',()=>{
    const bas=b=>({...b,enemies:b.enemies.map((e,i)=>i===0?{...e,hp:Math.round(e.maxHp*.2)}:e)});
    expect(degats([20,19,1],cle('acharnement'),bas)).toBeGreaterThan(degats([20,19,1],null,bas));
  });

  it('Acharnement ne se déclenche pas sur une cible en pleine forme',()=>{
    expect(degats([20,19,1],cle('acharnement'))).toBe(degats([20,19,1],null));
  });

  it('Vampirisme : une part des dégâts revient en PV',()=>{
    const rendu=c=>{let b=poser([32,20,19],c);
      b={...b,allies:b.allies.map(u=>u.id===32?{...u,hp:Math.round(u.maxHp*.5)}:u)};
      const a=lancer(b,32,0,b.enemies[0].id);
      return a.allies.find(u=>u.id===32).hp-b.allies.find(u=>u.id===32).hp};
    expect(rendu(cle('vampirisme'))).toBeGreaterThan(rendu(null));
  });

  it('Dévouement : les soins sont plus grands',()=>{
    // Yunmei soigne 43 % d'une barre : il reste de la place pour mesurer la
    // hausse. Hicho, lui, en rend deja 96 % — sa mesure ne dirait rien.
    const soin=c=>{
      let b=poser([34,20,19],c);
      b={...b,allies:b.allies.map(u=>u.id===20?{...u,hp:1}:u)};
      return lancer(b,34,1,b.allies.find(u=>u.id===20).id).allies.find(u=>u.id===20).hp-1;
    };
    const sans=soin(null),avec=soin(cle('devouement'));
    expect(sans,'le soin sature déjà sans la clé, la mesure ne vaudrait rien')
      .toBeLessThan(poser([34,20,19],null).allies.find(u=>u.id===20).maxHp*.9);
    expect(avec/sans,'la hausse ne correspond pas à la valeur annoncée').toBeCloseTo(1.20,1);
  });

  it('Dévouement : le surplus devient un bouclier au lieu d’être perdu',()=>{
    // Mesure : le soin de base de Hicho rend deja 96 % d'une barre pleine.
    // Sans cette conversion, la cle etait presque morte chez le champion a qui
    // elle est proposee — annoncee, jamais ressentie.
    const essai=c=>{
      let b=poser([15,20,19],c);
      b={...b,allies:b.allies.map(u=>u.id===20?{...u,hp:Math.round(u.maxHp*.9)}:u)};
      const a=lancer(b,15,0,b.allies.find(u=>u.id===20).id).allies.find(u=>u.id===20);
      return{pv:a.hp,bouclier:a.shield||0};
    };
    const sans=essai(null),avec=essai(cle('devouement'));
    expect(sans.bouclier,'un bouclier apparaît sans la clé').toBe(0);
    expect(avec.bouclier,'le surplus est toujours perdu').toBeGreaterThan(0);
    expect(avec.pv,'les PV devraient être pleins dans les deux cas').toBe(sans.pv);
  });

  it('Égide : les boucliers sont plus grands',()=>{
    const bouclier=c=>{const b=poser([23,20,19],c);
      return lancer(b,23,1,b.allies.find(u=>u.id===20).id).allies.find(u=>u.id===20).shield};
    expect(bouclier(cle('egide'))/bouclier(null)).toBeCloseTo(1.25,1);
  });

  it('Persistance : tout ce que le champion applique dure un tour de plus',()=>{
    const tours=c=>lancer(poser([33,20,19],c),33,0,poser([33,20,19],c).enemies[0].id)
      .enemies[0].debuffs?.frost?.turns||0;
    expect(tours(cle('persistance'))).toBe(tours(null)+1);
  });

  it('Contagion : un malus nouveau gagne un second porteur',()=>{
    const touches=c=>lancer(poser([33,20,19],c),33,0,poser([33,20,19],c).enemies[0].id)
      .enemies.filter(e=>e.debuffs?.frost).length;
    expect(touches(null),'le sort touche déjà tout le monde, la mesure ne vaut rien').toBe(1);
    expect(touches(cle('contagion'))).toBe(2);
  });

  it('Contagion couvre les malus écrits en direct, pas seulement ceux qui passent par debuff()',()=>{
    // La moitie des poses de malus du moteur n'appellent pas `debuff()` — dont
    // toutes les afflictions signature. Le Givre en fait partie : une accroche
    // sur `debuff()` seule ne l'aurait jamais propagé.
    const moteur=fs.readFileSync(fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8');
    expect(moteur,'le Givre passerait maintenant par debuff()').toContain("x.debuffs.frost={turns:3+mastery.duration");
    const b=lancer(poser([33,20,19],cle('contagion')),33,0,poser([33,20,19],null).enemies[0].id);
    expect(b.enemies.filter(e=>e.debuffs?.frost)).toHaveLength(2);
  });

  it('Contagion ne cascade pas sur elle-même',()=>{
    // Propager en cours de parcours ferait rebondir la propagation d'ennemi en
    // ennemi jusqu'a couvrir tout le terrain.
    const b=lancer(poser([33,20,19],cle('contagion'),5),33,0,poser([33,20,19],null,5).enemies[0].id);
    expect(b.enemies.filter(e=>e.debuffs?.frost).length,'la contagion a fait boule de neige').toBe(2);
  });

  it('Contagion ne propage que le malus NOUVEAU, pas ceux déjà en place',()=>{
    // Sinon, frapper un ennemi deja afflige repandrait aussi les malus poses
    // par quelqu'un d'autre, des tours plus tot — la cle ferait bien plus que
    // ce qu'elle annonce.
    const depart=poser([33,20,19],cle('contagion'));
    const avec={...depart,enemies:depart.enemies.map((e,i)=>i===0
      ?{...e,debuffs:{...e.debuffs,poison:{turns:5,source:99}}}:e)};
    const apres=lancer(avec,33,0,avec.enemies[0].id);
    expect(apres.enemies.filter(e=>e.debuffs?.frost),'le Givre nouveau ne s’est pas propagé').toHaveLength(2);
    expect(apres.enemies.filter(e=>e.debuffs?.poison),'un malus déjà en place s’est propagé').toHaveLength(1);
  });

  it('Élan : finir au plafond de ressource rend de la jauge',()=>{
    const jauge=c=>{let b=poser([36,20,19],c);
      b={...b,allies:b.allies.map(u=>u.id===36?{...u,mechanic:{...u.mechanic,value:3}}:u)};
      return Math.round(lancer(b,36,0,b.enemies[0].id).allies.find(u=>u.id===36).atb)};
    expect(jauge(cle('elan'))-jauge(null)).toBe(ARCHETYPES.elan.defaut);
  });

  it('Élan ne donne rien si la ressource n’est pas au plafond',()=>{
    const jauge=c=>{let b=poser([36,20,19],c);
      b={...b,allies:b.allies.map(u=>u.id===36?{...u,mechanic:{...u.mechanic,value:0}}:u)};
      return Math.round(lancer(b,36,0,b.enemies[0].id).allies.find(u=>u.id===36).atb)};
    expect(jauge(cle('elan'))).toBe(jauge(null));
  });
});

describe('chaque champion a ses trois clés, écrites pour lui',()=>{
  it('les 32 champions sont couverts, trois clés chacun',()=>{
    HEROES.forEach(h=>{
      const cles=clesDuChampion(h.id);
      expect(cles,`${h.name} n’a pas de clés`).toHaveLength(3);
      cles.forEach(c=>{
        expect(ARCHETYPES[c.archetype],`${h.name} · archétype inconnu ${c.archetype}`).toBeTruthy();
        expect(c.nom.length,`${h.name} · nom vide`).toBeGreaterThan(2);
        expect(c.texte.length,`${h.name} · texte vide`).toBeGreaterThan(20);
        expect(c.effet.length,`${h.name} · effet non résolu`).toBeGreaterThan(10);
      });
    });
  });

  it('les trois clés d’un champion sont vraiment différentes',()=>{
    // Trois variantes du meme archetype ne seraient qu'un choix de chiffres.
    HEROES.forEach(h=>{
      const archetypes=clesDuChampion(h.id).map(c=>c.archetype);
      expect(new Set(archetypes).size,`${h.name} : ${archetypes.join(', ')}`).toBe(3);
    });
  });

  it('aucun identifiant de clé n’est réutilisé dans tout le jeu',()=>{
    const ids=HEROES.flatMap(h=>clesDuChampion(h.id).map(c=>c.id));
    expect(ids.length-new Set(ids).size,'deux clés partagent un identifiant').toBe(0);
  });

  it('les textes parlent du champion, pas de l’archétype',()=>{
    // Un texte generique reutilise d'un champion a l'autre ne dirait rien.
    const textes=HEROES.flatMap(h=>clesDuChampion(h.id).map(c=>c.texte));
    expect(new Set(textes).size,'des textes de clé sont recopiés').toBe(textes.length);
  });

  it('chaque archétype sert à plusieurs champions : aucun n’est du code mort',()=>{
    const emploi={};
    HEROES.forEach(h=>clesDuChampion(h.id).forEach(c=>{emploi[c.archetype]=(emploi[c.archetype]||0)+1}));
    Object.keys(ARCHETYPES).forEach(a=>
      expect(emploi[a]||0,`l’archétype « ${a} » n’est utilisé par personne`).toBeGreaterThan(0));
  });

  it('un archétype n’a qu’un seul point d’accroche dans le moteur',()=>{
    // C'est la promesse qui rend dix archetypes testables plutot que 96
    // mecaniques : si un archetype etait lu a deux endroits, une correction sur
    // l'un laisserait l'autre en arriere.
    const moteur=fs.readFileSync(fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8');
    Object.keys(ARCHETYPES).forEach(a=>{
      const appels=[...moteur.matchAll(new RegExp(`cleDe\\([^,]+,'${a}'\\)`,'g'))].length;
      expect(appels,`« ${a} » est lu ${appels} fois par le moteur`).toBe(1);
    });
  });
});

describe('une seule clé, jamais deux',()=>{
  const hero=HEROES.find(h=>h.id===33);
  const etat=(resonance,lit)=>empreinteStatus(hero,{stars:6,resonance},lit);
  const cles=clesDuChampion(33);
  const noeud=i=>cleNodeId(33,cles[i].id);

  it('sous la Résonance requise, aucune clé n’est disponible',()=>{
    const e=etat(RESONANCE_CLE-1,[]);
    expect(e.cleOuverte).toBe(false);
    e.cles.forEach(c=>expect(c.disponible).toBe(false));
  });

  it('à la Résonance requise, les trois sont ouvertes',()=>{
    const e=etat(RESONANCE_CLE,[]);
    expect(e.cleOuverte).toBe(true);
    expect(e.cles.filter(c=>c.disponible)).toHaveLength(3);
  });

  it('en allumer une écarte les deux autres',()=>{
    const e=etat(5,[noeud(0)]);
    expect(e.cles.filter(c=>c.allumee)).toHaveLength(1);
    expect(e.cles.filter(c=>c.exclue)).toHaveLength(2);
    expect(e.cles.filter(c=>c.disponible)).toHaveLength(0);
    expect(e.cleActive.id).toBe(cles[0].id);
  });

  it('elle coûte deux points, et un seul à la Résonance maximale',()=>{
    // La baisse de coût au sommet n'est pas un réglage : c'est ce qui rend les
    // deux voies également efficaces. Avant, prendre tout le socle gaspillait
    // un point et la clé devenait de fait obligatoire.
    expect(coutDeCle({resonance:RESONANCE_MAITRISE-1})).toBe(COUT_CLE);
    expect(coutDeCle({resonance:RESONANCE_MAITRISE})).toBe(COUT_CLE_MAITRISE);
    expect(etat(4,[]).restants-etat(4,[noeud(0)]).restants).toBe(COUT_CLE);
    expect(etat(5,[]).restants-etat(5,[noeud(0)]).restants).toBe(COUT_CLE_MAITRISE);
    expect(etat(4,[noeud(0)]).depenses).toBe(COUT_CLE);
  });

  it('les deux voies dépensent exactement le même budget',()=>{
    // C'est la definition d'un arbitrage : aucune des deux ne gaspille.
    const socle=empreinteTree(hero).map(n=>n.id);
    const points=empreintePoints({stars:6,resonance:5});
    expect(etat(5,socle).restants,'prendre tout le socle gaspille des points').toBe(0);
    expect(etat(5,[...socle.slice(0,points-COUT_CLE_MAITRISE),noeud(0)]).restants,
      'la voie avec clé gaspille des points').toBe(0);
    expect(socle.length+COUT_CLE_MAITRISE,'on peut tout prendre').toBeGreaterThan(points);
  });

  it('sans assez de points libres, elle reste indisponible',()=>{
    const arbre=empreinteTree(hero).map(n=>n.id);
    // A la Resonance 4 la cle coute deux points : en laisser un seul ne suffit pas.
    const e=etat(4,arbre.slice(0,empreintePoints({stars:6,resonance:4})-1));
    expect(e.restants).toBe(1);
    e.cles.forEach(c=>expect(c.disponible,'une clé passe avec un seul point').toBe(false));
  });

  it('le moteur ne lit qu’une clé, celle qui est allumée',()=>{
    expect(bonusDeCle(33,[])).toBe(null);
    expect(bonusDeCle(33,[noeud(1)]).archetype).toBe(cles[1].archetype);
    expect(cleAllumee(33,[noeud(2)]).id).toBe(cles[2].id);
  });
});

describe('le socle ne ment plus',()=>{
  it('le nom d’un nœud suit le bonus qu’il accorde',()=>{
    // Un nom fixe pose par la branche mentait pour 46 noeuds sur 384.
    const LIBELLE={power:'Puissance',duration:'Emprise',effectRate:'Fiabilité',cooldown:'Cadence'};
    const ecarts=[];
    HEROES.forEach(h=>empreinteTree(h).forEach(n=>{
      const types=Object.keys(n.effect).filter(c=>LIBELLE[c]);
      types.forEach(t=>{if(!n.name.includes(LIBELLE[t]))ecarts.push(`${h.name} · ${n.name} accorde ${t}`)});
      if(!types.length&&n.effect.stats?.spd&&!n.name.includes('Vitesse'))ecarts.push(`${h.name} · ${n.name}`);
    }));
    expect(ecarts).toEqual([]);
  });

  it('un nœud nomme la compétence qu’il touche',()=>{
    HEROES.forEach(h=>empreinteTree(h).forEach(n=>{
      if(n.effect.skill===undefined)return;
      expect(n.name,`${h.name} · ${n.name}`).toContain(h.skills[n.effect.skill].name);
    }));
  });

  it('un nœud ne vise jamais un bonus que la compétence ne sait pas recevoir',()=>{
    HEROES.forEach(h=>empreinteTree(h).forEach(n=>{
      Object.keys(n.effect).filter(c=>c!=='skill'&&c!=='stats').forEach(type=>
        expect(peutRecevoir(h,n.effect.skill,type),`${h.name} · ${n.name} · ${type}`).toBe(true));
    }));
  });
});

describe('l’échelle de progression : chaque palier de Résonance fait quelque chose',()=>{
  it('chaque palier fait quelque chose, et quelque chose de différent',()=>{
    expect(empreinteDepth({resonance:0})).toBe(1);
    expect(empreinteDepth({resonance:1}),'R1 ouvre l’étage II').toBe(2);
    expect(RESONANCE_POINT_TIERS,'R2 et R4 donnent un point').toEqual([2,4]);
    expect(RESONANCE_CLE,'R3 ouvre la clé').toBe(3);
    expect(coutDeCle({resonance:5}),'R5 allège la clé').toBeLessThan(coutDeCle({resonance:4}));
  });

  it('la Résonance 5 rapporte enfin quelque chose',()=>{
    // Elle donnait 6 points comme R4 : le sommet absolu de la progression
    // n'ouvrait qu'un etage et rien d'autre.
    const apport=r=>({points:empreintePoints({stars:6,resonance:r}),
      etages:empreinteDepth({resonance:r}),cout:coutDeCle({resonance:r})});
    expect(JSON.stringify(apport(5))).not.toBe(JSON.stringify(apport(4)));
  });

  it('on ne peut jamais tout prendre',()=>{
    const socle=empreinteTree(HEROES[0]).length;
    expect(empreintePoints({stars:6,resonance:5}),'socle et clé tiennent dans le budget')
      .toBeLessThan(socle+coutDeCle({resonance:5}));
  });

  it('mais on peut prendre tout le socle, en renonçant à la clé',()=>{
    const socle=empreinteTree(HEROES[0]).length;
    expect(empreintePoints({stars:6,resonance:5})).toBe(socle);
  });
});
