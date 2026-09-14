import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{empreinteTree,empreinteBonuses,peutRecevoir,ancrerBonus,combiner,decrireBonus,
  EFFETS_A_JET,EFFETS_TEMPORELS,EFFETS_A_PUISSANCE}from'../src/data/empreintes';

// Le tableau d'Empreintes était identique pour tous les champions. Un bonus de
// fiabilité sur une compétence qui ne tente aucun jet, ou de durée sur une
// frappe qui ne pose rien, ne fait rien du tout : 84 nœuds sur 384 étaient
// morts, soit 22 % du système, jusqu'à 6 sur 12 pour Caelion.

const moteur=fs.readFileSync(fileURLToPath(new URL('../src/battle/engine.js',import.meta.url)),'utf8').split('\n');
const gestion=effet=>moteur.filter(l=>l.includes(`e==='${effet}'`)).join('\n');
const TYPES=['power','duration','effectRate','cooldown'];

describe('aucun nœud d’Empreinte n’est décoratif',()=>{
  it('chaque nœud porte un bonus que sa compétence sait recevoir',()=>{
    const morts=[];
    HEROES.forEach(hero=>{
      empreinteTree(hero).forEach(noeud=>{
        const types=TYPES.filter(t=>noeud.effect?.[t]!==undefined);
        if(!types.length){
          // Un nœud purement statistique est légitime.
          expect(noeud.effect?.stats,`${hero.name} · ${noeud.name} ne fait rien`).toBeTruthy();
          return;
        }
        types.forEach(t=>{
          if(!peutRecevoir(hero,noeud.effect.skill,t))
            morts.push(`${hero.name} · ${noeud.name} (${t}) sur « ${hero.skills[noeud.effect.skill]?.name} »`);
        });
      });
    });
    expect(morts,`${morts.length} nœuds morts`).toEqual([]);
  });

  it('chaque champion garde bien ses six nœuds',()=>{
    // L'arbre en demandait douze a des champions qui n'offrent que 4 a 11
    // ancrages (mediane 7) : Caelion, avec quatre, portait sept doublons.
    HEROES.forEach(h=>expect(empreinteTree(h),h.name).toHaveLength(6));
  });

  it('un arbre ne se répète plus : chaque nœud ancré est unique',()=>{
    // Mesure avant refonte : jusqu'a sept noeuds identiques dans un meme
    // arbre. Un choix entre deux noeuds identiques n'est pas un choix.
    const ecarts=[];
    HEROES.forEach(h=>{
      const couples=empreinteTree(h).flatMap(n=>Object.keys(n.effect||{})
        .filter(c=>c!=='skill'&&c!=='stats').map(c=>`${n.effect.skill}:${c}`));
      const doublons=couples.length-new Set(couples).size;
      // Caelion n'offre que quatre ancrages pour cinq noeuds ancres : un
      // doublon est irreductible chez lui, et chez lui seulement.
      if(doublons>(h.name==='Caelion'?1:0))ecarts.push(`${h.name} : ${doublons} doublon(s)`);
    });
    expect(ecarts).toEqual([]);
  });

  it('un nœud à deux bonus les porte sur la même compétence',()=>{
    // `{...a,...b}` écraserait le `skill` du premier : un des deux bonus se
    // retrouverait sur une compétence qui ne sait pas s'en servir, sans bruit.
    // On balaye toutes les paires de types, pour tous les champions.
    HEROES.forEach(hero=>{
      TYPES.forEach(a=>TYPES.forEach(b=>{
        if(a===b)return;
        [0,1,2].forEach(idx=>{
          const noeud=combiner(hero,idx,a,b,2);
          expect(typeof noeud.skill,`${hero.name} ${a}+${b}`).toBe('number');
          TYPES.filter(t=>noeud[t]!==undefined).forEach(t=>
            expect(peutRecevoir(hero,noeud.skill,t),
              `${hero.name} : ${a}+${b} → ${t} atterrit sur une compétence qui l’ignore`).toBe(true));
        });
      }));
    });
  });

  it('chaque nœud produit vraiment un bonus exploitable',()=>{
    HEROES.forEach(hero=>{
      empreinteTree(hero).forEach(noeud=>{
        const bonus=empreinteBonuses(hero,[noeud.id]);
        const rien=!Object.keys(bonus.skills||{}).length&&!Object.keys(bonus.stats||{}).length;
        expect(rien,`${hero.name} · ${noeud.name} ne produit aucun bonus`).toBe(false);
      });
    });
  });
});

describe('le texte d’un nœud décrit le bonus qu’il porte',()=>{
  it('il nomme la compétence réellement touchée',()=>{
    HEROES.forEach(hero=>{
      empreinteTree(hero).forEach(noeud=>{
        if(noeud.effect?.skill===undefined)return;
        expect(noeud.detail,`${hero.name} · ${noeud.name}`)
          .toContain(hero.skills[noeud.effect.skill].name);
      });
    });
  });

  it('il annonce le bon type de bonus, jamais un autre',()=>{
    const attendu={duration:'dure un tour de plus',effectRate:'porte plus souvent',
      cooldown:'revient un tour plus tôt'};
    HEROES.forEach(hero=>{
      empreinteTree(hero).forEach(noeud=>{
        Object.entries(attendu).forEach(([type,phrase])=>{
          const porte=noeud.effect?.[type]!==undefined;
          expect(noeud.detail.includes(phrase),`${hero.name} · ${noeud.name} · ${type}`).toBe(porte);
        });
      });
    });
  });

  it('un bonus de puissance se dit selon ce que fait la compétence',()=>{
    const dits=new Set();
    HEROES.forEach(hero=>empreinteTree(hero).forEach(n=>{
      if(n.effect?.power===undefined)return;
      ['frappe plus fort','protège davantage','agit plus fort'].forEach(v=>{
        if(n.detail.includes(v))dits.add(v);});
      expect(/frappe plus fort|protège davantage|agit plus fort/.test(n.detail),
        `${hero.name} · ${n.name} : « ${n.detail} »`).toBe(true);
    }));
    expect(dits.size,'un seul verbe sert partout, la nuance est perdue').toBeGreaterThan(1);
  });

  it('sans bonus reconnaissable, il ne raconte rien',()=>{
    expect(decrireBonus(HEROES[0],null)).toBeTruthy();
    expect(decrireBonus(HEROES[0],{stats:{spd:4}})).toContain('Vitesse +4');
  });
});

describe('contrat avec le moteur : les listes ne doivent pas dériver',()=>{
  const effets=[...new Set(HEROES.flatMap(h=>h.skills.map(s=>s.effect)))];

  // Les trois dérivations qui vivaient ici lisaient le TEXTE du moteur — elles
  // cherchaient `debuff(` ou `mastery.duration` dans le bloc de chaque effet.
  // Angle mort : elles ne voyaient pas ce que font les HELPERS. `shield()`
  // écrit `turns:2+mastery.duration`, donc cinq sorts à bouclier avaient une
  // durée qui suivait le bonus sans jamais écrire `mastery` chez eux ; ils
  // manquaient à la liste, et le joueur se voyait refuser un bonus qui
  // fonctionnait.
  //
  // Elles sont remplacées par `tests/effets.proprietes.test.js`, qui EXÉCUTE
  // chaque sort et observe ce qui change.

  it('l’ancrage retombe toujours sur un bonus utilisable',()=>{
    HEROES.forEach(hero=>[0,1,2].forEach(idx=>TYPES.forEach(type=>{
      const ancre=ancrerBonus(hero,idx,type,1);
      const porte=TYPES.find(t=>ancre[t]!==undefined);
      expect(porte,`${hero.name} sort ${idx} ${type}`).toBeTruthy();
      expect(peutRecevoir(hero,ancre.skill,porte),
        `${hero.name} sort ${idx} ${type} → ancré sur un bonus inutilisable`).toBe(true);
    })));
  });
});
