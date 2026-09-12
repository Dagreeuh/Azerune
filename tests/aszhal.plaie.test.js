import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{createBattle,castSkill,nextTurn}from'../src/battle/engine';
import{championIdentity}from'../src/data/championIdentities';
import{ressourceAffichee}from'../src/data/ressourcesChampions';
import{mulberry32}from'./helpers';

// Souffle des eons, refonte v1.73 — d'apres le sort du meme nom.
//
// L'ancienne version etait un bonus plat : « toute l'equipe gagne 15 % de
// degats et de la jauge ». Elle marchait, mais elle ne demandait rien au joueur
// et ne se regardait pas. La nouvelle ouvre une Plaie temporelle sur chaque
// ennemi : une part des degats que lui infligent les allies AMPLIFIES PAR
// ASZHAL est mise de cote, puis rendue d'un coup a l'expiration.
//
// Mesure A/B a graines appariees, 40 combats de 24 tours :
//   apport du sort, ancienne version : +6,7 %   nouvelle : +12,0 %
// Detail : Audit/RAPPORT-EXPERIENCE-JOUEUR.md, section 19.

const ASZHAL=35,KORGA=20,SYLVEN=19;
const STATS={hp:9000,atk:900,def:200,spd:100,crit:0,critDamage:50,accuracy:0,resistance:0,setEffects:[],resonanceLevel:0};
const heroes=(resonance=0)=>HEROES.map(h=>({...h,currentStars:5,skillLevels:{0:1,1:1,2:1}}));
const ennemi=(nom,spd=95)=>({name:nom,icon:'x',hp:900000,atk:1,def:150,spd,accuracy:0,resistance:0,element:'Feu'});

function poser({equipe=[ASZHAL,KORGA,SYLVEN],nombreEnnemis=2,resonance=0}={}){
  const stats=()=>({...STATS,resonanceLevel:resonance});
  return createBattle(equipe,heroes(),stats,
    {enemies:Array.from({length:nombreEnnemis},(u,i)=>ennemi(`Cible ${i+1}`))});
}
const pret=(b,id)=>({...b,turn:id,allies:b.allies.map(u=>u.id===id?{...u,cooldowns:[0,0,0]}:u)});
const lancer=(b,id,i,cible)=>{const vrai=Math.random;Math.random=mulberry32(5);
  try{const o=castSkill(pret(b,id),i,cible);return o.battle||o}finally{Math.random=vrai}};
const plaie=(b,i=0)=>b.enemies[i].debuffs?.temporalWound;

describe('le Souffle ouvre une Plaie sur chaque ennemi',()=>{
  it('tous les ennemis vivants sont marqués, pour trois tours',()=>{
    const b=lancer(poser({nombreEnnemis:3}),ASZHAL,2,null);
    expect(b.enemies.filter(e=>e.debuffs?.temporalWound),'tous les ennemis ne sont pas marqués').toHaveLength(3);
    b.enemies.forEach(e=>{
      expect(e.debuffs.temporalWound.turns).toBe(3);
      expect(e.debuffs.temporalWound.source,'la Plaie oublie qui l’a ouverte').toBe(ASZHAL);
      expect(e.debuffs.temporalWound.stored).toBe(0);
    });
  });

  it('un ennemi déjà mort n’est pas marqué',()=>{
    const base=poser({nombreEnnemis:2});
    const avec={...base,enemies:base.enemies.map((e,i)=>i===0?{...e,hp:0,dead:true}:e)};
    const b=lancer(avec,ASZHAL,2,null);
    expect(b.enemies[0].debuffs?.temporalWound,'un cadavre porte une Plaie').toBeUndefined();
    expect(b.enemies[1].debuffs?.temporalWound).toBeTruthy();
  });

  it('l’équipe est amplifiée : c’est la condition, pas la récompense',()=>{
    const b=lancer(poser(),ASZHAL,2,null);
    const amplifies=b.allies.filter(a=>a.buffs?.damageUp?.source===ASZHAL);
    expect(amplifies,'l’équipe n’est pas amplifiée').toHaveLength(3);
    amplifies.forEach(a=>expect(a.buffs.damageUp.label).toBe('Souffle des éons'));
  });

  it('le journal annonce le nombre de Plaies et la part réellement retenue',()=>{
    const b=lancer(poser({nombreEnnemis:2}),ASZHAL,2,null);
    expect(b.log[0]).toContain('2 Plaies temporelles');
    expect(b.log[0]).toContain('15 %');
  });
});

describe('la Plaie ne se nourrit que des alliés qu’Aszhal a amplifiés',()=>{
  const frapper=(b,id)=>lancer(b,id,0,b.enemies[0].id);

  it('un allié amplifié met bien 15 % de côté',()=>{
    let b=lancer(poser(),ASZHAL,2,null);
    const avant=b.enemies[0].hp;
    b=frapper(b,KORGA);
    const degats=avant-b.enemies[0].hp;
    expect(degats,'aucun dégât infligé, la mesure ne vaut rien').toBeGreaterThan(50);
    const part=plaie(b).stored/degats;
    expect(part,`part retenue : ${(part*100).toFixed(1)} %`).toBeGreaterThan(.13);
    expect(part).toBeLessThan(.17);
  });

  it('un allié NON amplifié ne nourrit rien',()=>{
    let b=lancer(poser(),ASZHAL,2,null);
    const depart=b.enemies[0].hp;
    b={...b,allies:b.allies.map(u=>u.id===KORGA?{...u,buffs:{}}:u)};
    const avant=plaie(b).stored;
    b=frapper(b,KORGA);
    expect(b.enemies[0].hp,'la cible n’a pas été frappée').toBeLessThan(depart);
    expect(plaie(b).stored,'une amplification étrangère nourrit la Plaie').toBe(avant);
  });

  it('l’amplification d’un AUTRE champion ne compte pas',()=>{
    // La Plaie retient qui l'a ouverte : seul le porteur d'une amelioration
    // venant d'Aszhal alimente sa facture.
    let b=lancer(poser(),ASZHAL,2,null);
    b={...b,allies:b.allies.map(u=>u.id===KORGA
      ?{...u,buffs:{damageUp:{turns:3,power:.3,source:999,label:'Ailleurs'}}}:u)};
    const avant=plaie(b).stored;
    b=frapper(b,KORGA);
    expect(plaie(b).stored).toBe(avant);
  });

  it('chaque Plaie ne compte que ce qu’elle a reçu',()=>{
    let b=lancer(poser({nombreEnnemis:2}),ASZHAL,2,null);
    b=frapper(b,KORGA);
    expect(plaie(b,0).stored,'la première cible n’a rien retenu').toBeGreaterThan(0);
    expect(plaie(b,1).stored,'une cible non frappée a quand même retenu').toBe(0);
  });
});

describe('la Plaie se referme en dégâts',()=>{
  /**
   * Joue un vrai combat jusqu'a ce que la Plaie du premier ennemi se referme.
   *
   * L'etat est releve AVANT `nextTurn` : c'est lui qui egrene les malus et
   * declenche la detonation, donc le lire apres ne montre plus rien. Ce piege
   * a d'abord fait croire que la Plaie ne se refermait jamais.
   */
  function jusquALaDetonation(b,tours=26){
    for(let t=0;t<tours;t+=1){
      const avant=b.enemies[0],portait=avant.debuffs?.temporalWound,pvAvant=avant.hp;
      b=nextTurn({...b,turn:null});
      if(b.winner)break;
      const apres=b.enemies[0];
      if(portait&&!apres.debuffs?.temporalWound)
        return{stocke:portait.stored,perte:pvAvant-apres.hp,journal:b.log[0]||''};
      const acteur=b.turn;
      if(b.allies.some(u=>u.id===acteur))b=lancer(b,acteur,0,b.enemies.find(e=>!e.dead)?.id);
      else b={...b,turn:null,enemies:b.enemies.map(e=>e.id===acteur?{...e,atb:0}:e)};
    }
    return null;
  }

  it('elle inflige exactement ce qu’elle avait mis de côté',()=>{
    const d=jusquALaDetonation(lancer(poser(),ASZHAL,2,null));
    expect(d,'la Plaie ne s’est jamais refermée').toBeTruthy();
    expect(d.stocke,'rien n’avait été mis de côté').toBeGreaterThan(0);
    expect(d.perte,'la détonation n’a rien infligé').toBe(d.stocke);
  });

  it('la détonation est annoncée au joueur',()=>{
    const d=jusquALaDetonation(lancer(poser(),ASZHAL,2,null));
    expect(d.journal).toContain('Plaie temporelle');
  });

  it('une Plaie vide ne fait rien et ne dit rien',()=>{
    // Une equipe qui ne frappe pas ne recoit rien : le sort n'est pas gratuit.
    let b=lancer(poser(),ASZHAL,2,null);
    const depart=b.enemies[0].hp;
    for(let t=0;t<20&&b.enemies[0].debuffs?.temporalWound;t+=1){
      b=nextTurn({...b,turn:null});
      const acteur=b.turn;
      b={...b,turn:null,
        allies:b.allies.map(u=>u.id===acteur?{...u,atb:0}:u),
        enemies:b.enemies.map(e=>e.id===acteur?{...e,atb:0}:e)};
    }
    expect(b.enemies[0].hp,'une Plaie vide a quand même infligé des dégâts').toBe(depart);
  });
});

describe('la clause anti-escouade large du sort d’origine',()=>{
  it('sans effet à trois champions : la part reste pleine',()=>{
    const b=lancer(poser(),ASZHAL,2,null);
    expect(plaie(b).share).toBeCloseTo(.15,5);
  });

  it('en Raid 4v4 elle mord vraiment : elle n’est jamais du texte mort',()=>{
    // Trois autres allies amplifies : la part tombe a 15 % x 2/3 = 10 %.
    const b=lancer(poser({equipe:[ASZHAL,KORGA,SYLVEN,1]}),ASZHAL,2,null);
    expect(b.allies.filter(a=>!a.dead),'l’escouade n’est pas à quatre').toHaveLength(4);
    expect(plaie(b).share).toBeCloseTo(.10,5);
    expect(b.log[0]).toContain('10 %');
  });
});

describe('Résonance IV',()=>{
  it('porte la part de 15 % à 20 %',()=>{
    const b=lancer(poser({resonance:4}),ASZHAL,2,null);
    expect(plaie(b).share).toBeCloseTo(.20,5);
    expect(b.log[0]).toContain('20 %');
  });

  it('et le texte de Résonance le dit',()=>{
    const source=fs.readFileSync(fileURLToPath(new URL('../src/data/championIdentities.js',import.meta.url)),'utf8');
    const ligne=source.slice(source.indexOf("35:'"),source.indexOf("',",source.indexOf("35:'")));
    expect(ligne,'la Résonance IV annonce autre chose que ce qu’elle fait').toContain('20 %');
    expect(ligne).toContain('15 %');
  });
});

describe('ce que le sort annonce est ce que le moteur fait',()=>{
  const sort=()=>HEROES.find(h=>h.id===ASZHAL).skills[2];

  it('la description parle bien de la Plaie, de la part et de la durée',()=>{
    const texte=sort().description;
    expect(texte).toContain('Plaie temporelle');
    expect(texte).toContain('3 tours');
    expect(texte).toContain('15 %');
    expect(texte,'la clause au-delà de deux alliés n’est pas annoncée').toMatch(/deux autres alliés/);
  });

  it('elle ne promet plus l’ancien bonus plat',()=>{
    expect(sort().description).not.toContain('Toute l’équipe gagne 15 % de dégâts et de la jauge');
  });

  it('les trois nombres annoncés sont ceux du moteur',()=>{
    const b=lancer(poser(),ASZHAL,2,null);
    const texte=sort().description;
    expect(plaie(b).turns).toBe(Number(texte.match(/(\d+) tours/)[1]));
    expect(Math.round(plaie(b).share*100)).toBe(Number(texte.match(/(\d+) %/)[1]));
  });
});

describe('trouvé en chemin : la durée annoncée par Lelianna',()=>{
  it('« pendant 3 tours » est bien ce que le moteur applique',()=>{
    // Trouve par accident : un mutant destine a Aszhal a frappe la description
    // de Lelianna, qui porte la meme phrase — et aucun test ne s'en est aperçu.
    const bouclier=HEROES.find(h=>h.id===12).skills[1];
    expect(bouclier.description).toContain('3 tours');
    const b=createBattle([12,KORGA,SYLVEN],heroes(),()=>({...STATS}),{enemies:[ennemi('C')]});
    const apres=lancer(b,12,1,b.allies.find(a=>a.id===KORGA).id);
    const expiation=apres.allies.find(a=>a.buffs?.atonement)?.buffs.atonement;
    expect(expiation,'aucune Expiation posée').toBeTruthy();
    expect(expiation.turns,'texte et moteur ne disent pas la même durée')
      .toBe(Number(bouclier.description.match(/(\d+) tours/)[1]));
  });
});

describe('Aszhal a enfin une pastille à regarder',()=>{
  const lire=b=>ressourceAffichee(b.allies.find(a=>a.id===ASZHAL),
    {allies:b.allies,enemies:b.enemies},championIdentity({id:ASZHAL}));

  it('sans Plaie ouverte, elle le dit',()=>{
    expect(lire(poser()).detail).toBe('Aucune plaie ouverte');
  });

  it('elle compte les Plaies, la facture et le temps qu’il reste',()=>{
    let b=lancer(poser({nombreEnnemis:2}),ASZHAL,2,null);
    b=lancer(b,KORGA,0,b.enemies[0].id);
    const r=lire(b);
    expect(r.detail).toContain('2 plaies');
    expect(r.detail).toContain(`${plaie(b).stored} en attente`);
    expect(r.detail).toContain('3 tours');
    expect(r.etat,'la pastille reste éteinte alors que la facture monte').toBe('active');
  });

  it('elle ne compte pas les Plaies ouvertes par quelqu’un d’autre',()=>{
    const b=poser();
    const autre={...b,enemies:b.enemies.map(e=>({...e,debuffs:{temporalWound:{turns:3,source:999,stored:500}}}))};
    expect(lire(autre).detail).toBe('Aucune plaie ouverte');
  });

  it('son identité ne dit plus « Aucune »',()=>{
    expect(championIdentity({id:ASZHAL}).resource).toBe('Plaie temporelle');
  });
});
