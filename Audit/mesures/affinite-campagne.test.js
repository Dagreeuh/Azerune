/**
 * L'affinité élémentaire dans la campagne : ce que le joueur affronte, et ce
 * que ça lui coûte.
 *
 * Aucune assertion — c'est une battue, pas un test.
 *
 *     npx vitest run --config vitest.mesures.config.js Audit/mesures/affinite-campagne.test.js
 *
 * Ce fichier existe parce que je me suis trompé. Un grep sur `element:'…'`
 * dans `campaign.js` ne renvoie rien, et j'en ai conclu que la campagne
 * n'attribuait aucun élément. C'est faux : l'élément est passé
 * POSITIONNELLEMENT par le tuple de zone jusqu'au constructeur `enemy()`.
 * Règle retenue : lire les données INSTANCIÉES, jamais le texte source.
 */
import{it}from'vitest';
import{CONTINENTS,DIFFICULTIES,createMission}from'../../src/data/campaign';
import{HEROES}from'../../src/data/heroes';
import{normalizeElement,ELEMENTS}from'../../src/utils/elements';
import{affinity}from'../../src/utils/elements';
import{simulerMission}from'../../src/utils/simulation';
import{poidsAffinite,POIDS_AFFINITE}from'../../src/utils/elements';
import{seedRandom}from'../../tests/helpers';

const NOMS=Object.keys(ELEMENTS);
const pourcent=(n,t)=>t?`${(n/t*100).toFixed(0)} %`:'—';

/** Tous les ennemis de campagne, en difficulté Normal. */
const ennemisDeCampagne=()=>CONTINENTS.flatMap(continent=>
  continent.stages.flatMap(stage=>
    createMission(DIFFICULTIES[0],continent,stage).enemies
      .map(u=>({zone:continent.name,element:normalizeElement(u.element)}))));

it('1 · ce que le joueur affronte',()=>{
  const tous=ennemisDeCampagne();
  console.log('\n=== 1 · Éléments des ennemis de campagne ===');
  console.log('Élément de chacun des 7 paliers, zone par zone :');
  CONTINENTS.forEach(continent=>{
    const suite=continent.stages.map(stage=>{
      const m=createMission(DIFFICULTIES[0],continent,stage);
      return normalizeElement(m.enemies[0].element).slice(0,3);
    });
    console.log(`  ${continent.name.padEnd(30)} ${suite.join(' ')}`);
  });

  const compte={};
  tous.forEach(u=>{compte[u.element]=(compte[u.element]||0)+1});
  console.log(`\n  Sur ${tous.length} ennemis :`);
  NOMS.forEach(e=>console.log(
    `    ${e.padEnd(9)} ${String(compte[e]||0).padStart(4)}  ${pourcent(compte[e]||0,tous.length)}`));
});

it('2 · ce que ça vaut selon l’élément du champion',()=>{
  const tous=ennemisDeCampagne();
  const roster={};
  HEROES.forEach(h=>{const e=normalizeElement(h.element);roster[e]=(roster[e]||0)+1});

  console.log('\n=== 2 · Avantage net par élément de champion, sur toute la campagne ===');
  console.log('élément    champions   efficace   neutre   inefficace   net');
  NOMS.forEach(e=>{
    const c={effective:0,neutral:0,weak:0};
    tous.forEach(u=>{c[affinity(e,u.element).key]+=1});
    const net=(c.effective-c.weak)/tous.length*100;
    console.log(`  ${e.padEnd(9)} ${String(roster[e]||0).padStart(6)}   `
      +`${pourcent(c.effective,tous.length).padStart(8)} `
      +`${pourcent(c.neutral,tous.length).padStart(8)} `
      +`${pourcent(c.weak,tous.length).padStart(12)}   `
      +`${net>0?'+':''}${net.toFixed(0)} pts`);
  });
});

it('3 · ce que ça coûte vraiment, en combat',()=>{
  // Expérience contrôlée : MÊME équipe, MÊME mission, MÊMES graines.
  // Seul l'élément du premier champion change, et TOUTES les statistiques sont
  // identiques — l'écart observé ne peut donc venir que de l'affinité.
  //
  // Deux régimes, parce qu'une seule mesure ne suffit pas :
  //  · « large » : l'équipe gagne toujours. On mesure la VITESSE, sans bruit
  //    de victoire/défaite.
  //  · « serré » : autour du point de bascule. On mesure le TAUX DE VICTOIRE.
  //
  // Premier essai raté, gardé pour mémoire : avec une équipe surpuissante les
  // combats duraient 3,8 actions et les six éléments donnaient le même
  // chiffre — un allié qui tue en un coup tue en un coup, quelle que soit
  // l'affinité. Une mesure doit avoir la résolution de ce qu'elle prétend voir.
  const REGIMES=[
    ['large',{hp:1300,atk:50}],
    ['serré',{hp:900,atk:34}],
  ];
  const base={def:130,spd:100,crit:10,critDamage:60,accuracy:40,resistance:20,
    setEffects:[],resonanceLevel:0};
  const EQUIPE=[HEROES[0].id,HEROES[1].id,HEROES[2].id];
  const GRAINE=7,TIRAGES=20;
  const zones=[CONTINENTS[0],CONTINENTS[1],CONTINENTS[7]];

  zones.forEach(continent=>{
    // Palier 5 : c'est celui qui porte le TROISIÈME élément de la zone. On
    // mesure donc la variété interne, pas la couleur dominante.
    const stage=continent.stages[4];
    const mission=createMission(DIFFICULTIES[0],continent,stage);
    const cible=normalizeElement(mission.enemies[0].element);
    console.log(`\n=== 3 · ${continent.name} — ennemis ${cible} ===`);
    REGIMES.forEach(([nom,reglage])=>{
      const S={...base,...reglage};
      const lignes=NOMS.map(e=>{
        const heroes=HEROES.map(h=>h.id===EQUIPE[0]
          ?{...h,element:e,currentStars:5}:{...h,currentStars:5});
        seedRandom(GRAINE);
        const r=simulerMission({mission,team:EQUIPE,heroes,
          getStats:()=>({...S}),tirages:TIRAGES});
        return{e,rel:affinity(e,cible).label,
          victoires:r.victoires,actions:r.actionsMoyennes};
      });
      const neutre=lignes.find(l=>l.rel==='NEUTRE');
      console.log(`  régime ${nom} :`);
      console.log('    élément     relation      victoires   actions   écart d’actions');
      lignes.forEach(l=>{
        const d=neutre?l.actions-neutre.actions:0;
        console.log(`    ${l.e.padEnd(11)} ${l.rel.padEnd(12)} `
          +`${String(l.victoires).padStart(6)}/${TIRAGES}   `
          +`${String(l.actions).padStart(6)}   `
          +`${d===0?'référence':(d>0?'+':'')+d+' actions'}`);
      });
    });
  });
});

it('4 · combien d’équipement une mauvaise affinité coûte-t-elle ?',()=>{
  // Demande du joueur : en Normal, le mur doit être l'équipement et le niveau,
  // pas la couleur ; en Difficile et Hardcore, la composition redevient
  // déterminante.
  //
  // Le taux de victoire est un mauvais instrument ici : la bascule est presque
  // binaire (0/20 puis 20/20 en deux crans). On mesure donc autre chose, qui
  // répond directement à la question posée — LE SEUIL D'ÉQUIPEMENT à partir
  // duquel l'équipe gagne à tous les coups, selon l'affinité du champion.
  // L'écart entre le seuil « efficace » et le seuil « inefficace » dit
  // exactement ce que la couleur remplace d'équipement.
  const base={def:130,spd:100,crit:10,critDamage:60,accuracy:40,resistance:20,
    setEffects:[],resonanceLevel:0};
  const EQUIPE=[HEROES[0].id,HEROES[1].id,HEROES[2].id];
  const continent=CONTINENTS[7],stage=continent.stages[4];

  const seuil=(mission,element)=>{
    for(let hp=600;hp<=12000;hp=Math.round(hp*1.06)){
      const S={...base,hp,atk:Math.round(hp*.038)};
      // TOUTE l'équipe porte l'élément testé : c'est la décision réelle du
      // joueur — « j'emmène mon groupe Feu dans cette zone » —, pas le
      // remplacement d'un seul champion. Mesurer sur un tiers de l'équipe
      // diluait le signal au point de rendre Hardcore moins sensible que
      // Normal, ce qui était un artefact de protocole, pas une propriété.
      const heroes=HEROES.map(h=>EQUIPE.includes(h.id)
        ?{...h,element,currentStars:5}:{...h,currentStars:5});
      seedRandom(7);
      const r=simulerMission({mission,team:EQUIPE,heroes,getStats:()=>({...S}),tirages:20});
      if(r.victoires===20)return hp;
    }
    return null;
  };

  console.log('\n=== 4 · Seuil d’équipement pour gagner à coup sûr ===');
  DIFFICULTIES.forEach(diff=>{
    const mission=createMission(diff,continent,stage);
    const cible=normalizeElement(mission.enemies[0].element);
    const par={};
    NOMS.forEach(e=>{
      const rel=affinity(e,cible,diff.id);
      (par[rel.label]=par[rel.label]||[]).push({e,hp:seuil(mission,e),mult:rel.damage});
    });
    const moyenne=t=>t&&t.length?Math.round(t.reduce((a,b)=>a+(b.hp||0),0)/t.length):null;
    const eff=moyenne(par.EFFICACE),neu=moyenne(par.NEUTRE),fai=moyenne(par.INEFFICACE);
    console.log(`\n  ${diff.name} — poids de l’affinité ×${poidsAffinite(diff.id)} · ennemis ${cible}`);
    ['EFFICACE','NEUTRE','INEFFICACE'].forEach(nom=>{
      const t=par[nom];
      if(!t)return;
      console.log(`    ${nom.padEnd(12)} ×${t[0].mult.toFixed(2)}   seuil ${String(moyenne(t)).padStart(5)} pv`);
    });
    if(eff&&fai)console.log(
      `    → une mauvaise affinité exige ${((fai/eff-1)*100).toFixed(0)} % d’équipement en plus`);
  });

  // Avant/après sur le mode Normal : on rétablit le poids plein le temps d'une
  // mesure, pour chiffrer ce que l'atténuation a réellement changé.
  const normal=createMission(DIFFICULTIES[0],continent,stage);
  const cibleN=normalizeElement(normal.enemies[0].element);
  const ancien=POIDS_AFFINITE.normal;
  POIDS_AFFINITE.normal=1;
  const avantEff=[],avantFai=[];
  NOMS.forEach(e=>{
    const k=affinity(e,cibleN,'normal').key;
    if(k==='effective')avantEff.push(seuil(normal,e));
    if(k==='weak')avantFai.push(seuil(normal,e));
  });
  POIDS_AFFINITE.normal=ancien;
  const m=t=>t.length?t.reduce((a,b)=>a+b,0)/t.length:null;
  if(m(avantEff)&&m(avantFai))console.log(
    `\n  Normal, AVANT atténuation (poids ×1) : `
    +`une mauvaise affinité exigeait ${((m(avantFai)/m(avantEff)-1)*100).toFixed(0)} % d’équipement en plus`);
});
