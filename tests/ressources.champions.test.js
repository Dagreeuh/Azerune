import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{Unit}from'../src/pages/BattlePage';
import{HEROES}from'../src/data/heroes';
import{championIdentity}from'../src/data/championIdentities';
import{RESSOURCES_CHAMPIONS,ORDRE_RECONNAISSANCE,descripteurDeRessource,
  ressourceAffichee,classeRessource}from'../src/data/ressourcesChampions';
// Matrice partagee avec le script qui a genere la reference : c'est ce partage
// qui rend la comparaison valable.
import{ETATS,TERRAINS,pastille}from'./helpers/ressourcesMatrice';

// Refonte declarative des ressources de champion.
//
// L'ecran de combat portait 24 identifiants codes en dur et 27 variables
// `isNomDuChampion` dans une chaine de ternaires de 6 300 caracteres, elle-meme
// precedee d'un preambule de 4 000 caracteres recalcule a chaque rendu pour
// chaque unite. Chaque champion declare desormais sa ressource lui-meme.
//
// La reference ci-dessous a ete capturee sur l'implementation d'AVANT la
// refonte puis comparee caractere pour caractere : 1 632 combinaisons
// (32 champions x 17 etats de mecanique x 3 terrains), 0 difference. C'est ce
// qui autorise a dire que la refonte ne change rien a ce que voit le joueur.

const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');
const REFERENCE=JSON.parse(lire('./fixtures/ressources-champions.json'));
const ALLIES_TEMOINS=[{id:901,name:'Allié A',hp:50,maxHp:100,dead:false,buffs:{},debuffs:{}}];
const ENNEMIS_TEMOINS=[{id:'e1',name:'Cible A',hp:100,maxHp:100,dead:false,shield:0,
  debuffs:{poison:{stacks:2},burn:{},bleed:{},agony:{stacks:3},virulence:{stacks:4},frost:{stacks:4},exposed:{}}}];

describe('l’affichage des ressources est inchangé',()=>{
  it('les 1 632 combinaisons rendent exactement ce qu’elles rendaient avant la refonte',()=>{
    const ecarts=[];
    HEROES.forEach(hero=>ETATS.forEach(([nom,mecanique])=>TERRAINS.forEach(([terrain,charge,liens])=>{
      const cle=`${hero.id}|${hero.name}|${nom}|${terrain}`;
      const attendu=REFERENCE.pastilles[REFERENCE.cas[cle]];
      const obtenu=pastille(hero,mecanique,charge,liens);
      if(obtenu!==attendu)ecarts.push(`${cle}\n  attendu : ${attendu}\n  obtenu  : ${obtenu}`);
    })));
    expect(ecarts.join('\n'),`${ecarts.length} affichage(s) ont changé`).toBe('');
  });

  it('la référence couvre bien tout le roster et tous les états',()=>{
    // Un fixture qui ne couvre plus rien passerait sans rien prouver.
    expect(Object.keys(REFERENCE.cas)).toHaveLength(HEROES.length*ETATS.length*TERRAINS.length);
    expect(new Set(Object.values(REFERENCE.cas)).size,'la référence a perdu sa variété').toBeGreaterThan(150);
    expect(new Set(Object.keys(REFERENCE.cas).map(c=>c.split('|')[1])).size).toBe(HEROES.length);
  });
});

describe('chaque champion déclare sa propre ressource',()=>{
  it('tout champion doté d’une pastille a une entrée, et réciproquement',()=>{
    const declares=new Set(ORDRE_RECONNAISSANCE);
    expect(declares.size,'un identifiant est déclaré deux fois').toBe(ORDRE_RECONNAISSANCE.length);
    Object.keys(RESSOURCES_CHAMPIONS).forEach(id=>
      expect(declares.has(Number(id)),`le champion ${id} n’est pas dans l’ordre de reconnaissance`).toBe(true));
    ORDRE_RECONNAISSANCE.forEach(id=>
      expect(RESSOURCES_CHAMPIONS[id],`l’ordre cite le champion ${id}, qui n’a pas d’entrée`).toBeTruthy());
  });

  it('aucun champion du roster n’est laissé sans affichage par accident',()=>{
    // Un champion sans entree propre doit tomber sur le repli generique — et
    // seul « Aucune » autorise a ne rien afficher du tout.
    const orphelins=HEROES.filter(hero=>!descripteurDeRessource(hero)
      &&championIdentity(hero).resource!=='Aucune'
      &&!ressourceAffichee({...hero,side:'ally',mechanic:{value:1}},{},championIdentity(hero)));
    expect(orphelins.map(h=>h.name)).toEqual([]);
  });

  it('les deux champions sans ressource n’affichent rien',()=>{
    // Aszhal a quitte cette liste en v1.73 : son Souffle des éons ouvre
    // desormais des Plaies temporelles, et une facture qui grossit se suit.
    ['Ragnhild','Yunmei'].forEach(nom=>{
      const hero=HEROES.find(h=>h.name===nom);
      expect(championIdentity(hero).resource,`${nom} a gagné une ressource`).toBe('Aucune');
      expect(ressourceAffichee({...hero,side:'ally',mechanic:{value:3}},{},championIdentity(hero)),
        `${nom} affiche une pastille`).toBe(null);
    });
  });

  it('chaque entrée renvoie un titre et un détail lisibles dans tous les cas',()=>{
    ORDRE_RECONNAISSANCE.forEach(id=>{
      const hero=HEROES.find(h=>h.id===id)||{id,name:'X',skills:[]};
      [{},{value:0},{value:5,active:true,targetId:'e1'}].forEach(mecanique=>{
        const r=ressourceAffichee({...hero,side:'ally',mechanic:mecanique},
          {allies:ALLIES_TEMOINS,enemies:ENNEMIS_TEMOINS},championIdentity(hero));
        expect(r,`le champion ${id} n’affiche rien`).toBeTruthy();
        expect(typeof r.titre,`titre du champion ${id}`).toBe('string');
        expect(r.titre.length,`le champion ${id} a un titre vide`).toBeGreaterThan(0);
        expect(String(r.detail).length,`le champion ${id} a un détail vide`).toBeGreaterThan(0);
      });
    });
  });
});

describe('les cas que la matrice seule ne distingue pas',()=>{
  // Trois mutants avaient survecu a la matrice complete : elle ne portait qu'un
  // seul ennemi charge, et marquait tous les buffs allies au nom du champion.
  // Ces trois cas les tuent.
  const ennemi=(id,nom,debuffs,extra={})=>({id,name:nom,hp:100,maxHp:100,dead:false,shield:0,maxShield:0,debuffs,...extra});
  const lu=(id,contexte)=>ressourceAffichee({...HEROES.find(h=>h.id===id),side:'ally',mechanic:{value:0}},contexte,null);

  it('c’est la cible la PLUS chargée qui est affichée, pas la première venue',()=>{
    const contexte={allies:[],enemies:[
      ennemi('e1','Faible',{frost:{stacks:1}}),
      ennemi('e2','Chargée',{frost:{stacks:5}}),
      ennemi('e3','Moyenne',{frost:{stacks:3}})]};
    expect(lu(33,contexte).detail,'Sivrane ne vise pas la cible la plus givrée').toContain('5/5 · Chargée');
    const virulence={allies:[],enemies:[
      ennemi('e1','Faible',{virulence:{stacks:1}}),
      ennemi('e2','Chargée',{virulence:{stacks:6}})]};
    expect(lu(22,virulence).detail,'Malvek ne vise pas la cible la plus infectée').toContain('6 cumuls · Chargée');
  });

  it('Lelianna ne compte que SES propres Expiations',()=>{
    // Un autre soigneur peut poser la meme amelioration : la compter donnerait
    // a Lelianna un total qu'elle n'a pas produit.
    const allies=[
      {id:901,name:'A',hp:50,maxHp:100,dead:false,debuffs:{},buffs:{atonement:{turns:2,source:12}}},
      {id:902,name:'B',hp:50,maxHp:100,dead:false,debuffs:{},buffs:{atonement:{turns:2,source:999}}},
      {id:903,name:'C',hp:50,maxHp:100,dead:false,debuffs:{},buffs:{atonement:{turns:2,source:999}}}];
    expect(lu(12,{allies,enemies:[]}).detail,'Lelianna compte les Expiations des autres').toBe('1 allié lié');
  });

  it('Korga s’allume aussi sur un bouclier brisé, pas seulement sur Exposé',()=>{
    // Ses deux conditions d'execution sont distinctes : un ennemi dont le
    // bouclier est tombe est une cible valable meme sans le malus Exposé.
    const brise={allies:[],enemies:[ennemi('e1','Brisée',{},{maxShield:80,shield:0})]};
    expect(lu(20,brise).detail,'Korga ignore les boucliers brisés').toBe('Brisée');
    expect(lu(20,brise).etat).toBe('active');
    const expose={allies:[],enemies:[ennemi('e1','Exposée',{exposed:{}})]};
    expect(lu(20,expose).detail).toBe('Exposée');
    const rien={allies:[],enemies:[ennemi('e1','Intacte',{})]};
    expect(lu(20,rien).detail).toBe('Aucune cible exposée');
  });

  it('le Givre s’affiche sur 5 et n’annonce la Brisure qu’à partir de 3',()=>{
    const givre=n=>lu(33,{allies:[],enemies:[ennemi('e1','C',{frost:{stacks:n}})]}).detail;
    expect(givre(5)).toBe('5/5 · C · BRISURE PRÊTE');
    expect(givre(3)).toContain('BRISURE PRÊTE');
    expect(givre(2)).toBe('2/5 · C');
  });
});

describe('reconnaissance d’un champion',()=>{
  it('par identifiant',()=>{
    expect(descripteurDeRessource({id:24,skills:[]}).classe).toBe('vexil-instability');
  });

  it('par effet de sort, pour les héros dérivés qui n’ont pas l’identifiant',()=>{
    expect(descripteurDeRessource({id:9999,skills:[{effect:'huntMark'}]}).classe).toBe('kaelen-hunt');
    expect(descripteurDeRessource({id:9999,skills:[{effect:'timeAnchor'}]}).classe).toBe('caelion-anchor');
  });

  it('par préfixe d’effet, pour Morghast dont les sorts partagent une famille',()=>{
    expect(descripteurDeRessource({id:9999,skills:[{effect:'alchemyMix'}]}).classe).toBe('morghast-reaction');
  });

  it('par nom, le seul cas historique',()=>{
    // Korga a toujours ete reconnue par son nom, pas par son identifiant.
    expect(descripteurDeRessource({id:9999,name:'Korga',skills:[]}).classe).toBe('korga-fracture');
  });

  it('un champion inconnu ne prend la pastille de personne',()=>{
    expect(descripteurDeRessource({id:9999,name:'Inconnu',skills:[{effect:'basic'}]})).toBe(null);
    expect(descripteurDeRessource(null)).toBe(null);
  });

  it('l’ordre de reconnaissance est figé : le changer changerait des affichages',()=>{
    // Un heros derive peut porter deux effets reconnaissables ; c'est le
    // premier de cette liste qui gagnait, et qui doit continuer de gagner.
    expect(ORDRE_RECONNAISSANCE).toEqual([3,7,9,10,11,12,13,17,15,19,21,23,24,26,27,28,14,8,1,30,20,29,22,33,35]);
  });
});

describe('la classe CSS reproduit exactement l’ancien gabarit',()=>{
  it('avec et sans état actif',()=>{
    expect(classeRessource({classe:'kaelen-hunt',finale:false,etat:'active'})).toBe('champion-resource kaelen-hunt active');
    expect(classeRessource({classe:'kaelen-hunt',finale:false,etat:''})).toBe('champion-resource kaelen-hunt ');
  });

  it('les ressources « finales » gardent leur mise en avant',()=>{
    expect(classeRessource({classe:'hicho-totem',finale:true,etat:'active'})).toBe('champion-resource final-resource hicho-totem active');
  });

  it('le repli générique n’ajoute pas d’espace parasite',()=>{
    // `champion-resource  active` (double espace) serait un changement de rendu.
    expect(classeRessource({classe:'',finale:false,etat:'active'})).toBe('champion-resource active');
    expect(classeRessource({classe:'',finale:false,etat:''})).toBe('champion-resource ');
  });

  it('Vexil garde ses deux paliers d’alerte',()=>{
    const lire=v=>ressourceAffichee({id:24,side:'ally',skills:[],mechanic:{value:v}},{},null).etat;
    expect(lire(3)).toBe('');
    expect(lire(4)).toBe('warning active');
    expect(lire(5)).toBe('danger active');
  });
});

describe('l’écran de combat ne connaît plus les champions un par un',()=>{
  it('plus aucun identifiant de champion codé en dur',()=>{
    const page=lire('../src/pages/BattlePage.jsx');
    const enDur=[...page.matchAll(/unit\.id===(\d+)/g)].map(m=>m[1]);
    expect(enDur,'des identifiants de champion sont revenus dans l’écran').toEqual([]);
  });

  it('plus aucune variable « isNomDuChampion »',()=>{
    // On vise les noms du roster, pas toutes les variables `isQuelqueChose` :
    // `isFireproof` ou `isSingleEnemySkill` sont legitimes et n'ont rien a voir
    // avec la connaissance d'un champion en particulier.
    const page=lire('../src/pages/BattlePage.jsx');
    const coupables=HEROES.map(hero=>`is${hero.name.normalize('NFD').replace(/[^A-Za-z]/g,'')}=`)
      .filter(nom=>page.includes(nom));
    expect(coupables,'l’écran reconnaît de nouveau des champions un par un').toEqual([]);
  });

  it('l’écran se contente de rendre ce que le champion déclare',()=>{
    const page=lire('../src/pages/BattlePage.jsx');
    expect(page).toContain('ressourceAffichee(unit,{allies,enemies},championIdentity(unit))');
    expect(page).toContain('<div className={classeRessource(ressource)}>');
  });
});
