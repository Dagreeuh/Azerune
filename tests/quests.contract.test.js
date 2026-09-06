// Contrat de cablage des evenements de quete.
//
// Une quete declare un `event`. Le code emet des evenements par
// emitProgressEvent / progressQuest. Si les deux listes divergent, une quete
// affichee au joueur n'avance jamais — sans erreur, sans trace.
//
// C'est exactement ce qui s'est produit : HOTFIX-QUETES-VALIDATION corrige
// « les compétences envoyaient skills alors que les quêtes attendaient
// skillUsed », et skillUsed est ensuite reste sans emetteur. Deux quetes,
// « Maitre des arcanes » et « Maitrise tactique », etaient impossibles a
// terminer. Ce test rend ce genre d'ecart impossible a rater.
import{describe,it,expect}from'vitest';
import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';
import{QUEST_GROUPS}from'../src/data/quests';
import{QUEST_EVENT_ALIASES}from'../src/utils/quests';

const racine=fileURLToPath(new URL('../src/',import.meta.url));

/** Tout le code source de l'application, concatene. */
function sources(){
  const fichiers=[];
  const parcourir=dossier=>fs.readdirSync(dossier,{withFileTypes:true}).forEach(entree=>{
    const complet=path.join(dossier,entree.name);
    if(entree.isDirectory())parcourir(complet);
    else if(/\.(js|jsx)$/.test(entree.name))fichiers.push(fs.readFileSync(complet,'utf8'));
  });
  parcourir(racine);
  return fichiers.join('\n');
}

const code=sources();

/** Evenements emis avec un nom litteral. */
const evenementsEmis=new Set(
  [...code.matchAll(/(?:emitProgressEvent|progressQuest)\(\s*'([^']+)'/g)].map(m=>m[1])
    .map(nom=>QUEST_EVENT_ALIASES[nom]||nom));

/** Evenements attendus par au moins une quete. */
const evenementsAttendus=new Map();
Object.entries(QUEST_GROUPS).forEach(([groupe,quetes])=>
  quetes.forEach(quete=>{
    if(!evenementsAttendus.has(quete.event))evenementsAttendus.set(quete.event,[]);
    evenementsAttendus.get(quete.event).push(`${groupe}/${quete.id}`);
  }));

/**
 * Evenements emis qu'aucune quete n'ecoute, et c'est voulu.
 *
 * `itemRecycled` est un point d'accroche pour une future quete de recyclage.
 * Toute autre entree doit etre justifiee ici, ou l'emission retiree.
 */
const EMIS_SANS_QUETE=['itemRecycled'];

describe('cablage des evenements de quete',()=>{
  it('le code emet bien des evenements',()=>{
    expect(evenementsEmis.size).toBeGreaterThan(15);
    expect(evenementsAttendus.size).toBeGreaterThan(15);
  });

  it('chaque evenement attendu par une quete est reellement emis',()=>{
    const orphelins=[...evenementsAttendus.entries()]
      .filter(([evenement])=>!evenementsEmis.has(evenement))
      .map(([evenement,quetes])=>`${evenement} — attendu par ${quetes.join(', ')}`);
    expect(orphelins).toEqual([]);
  });

  it('chaque evenement emis est ecoute, ou explicitement mis de cote',()=>{
    const inutiles=[...evenementsEmis]
      .filter(evenement=>!evenementsAttendus.has(evenement))
      .filter(evenement=>!EMIS_SANS_QUETE.includes(evenement));
    expect(inutiles).toEqual([]);
  });

  it('la liste des evenements sans quete reste justifiee',()=>{
    // Si une quete se met a ecouter l un d eux, il faut le retirer d ici.
    const encoreSansQuete=EMIS_SANS_QUETE.filter(e=>!evenementsAttendus.has(e));
    expect(encoreSansQuete).toEqual(EMIS_SANS_QUETE);
  });

  it('toute quete affichee au joueur peut progresser',()=>{
    // Formulation orientee joueur du meme controle : aucune quete visible ne
    // doit dependre d un evenement que rien ne declenche.
    const impossibles=[];
    Object.entries(QUEST_GROUPS).forEach(([groupe,quetes])=>quetes.forEach(quete=>{
      if(!evenementsEmis.has(quete.event))
        impossibles.push(`${groupe}/${quete.id} « ${quete.name} » attend ${quete.event}`);
    }));
    expect(impossibles).toEqual([]);
  });
});

describe('evenements de combat derives des statistiques',()=>{
  it('les compteurs de fin de combat alimentent bien leurs quetes',()=>{
    // dotDamageDealt, supportDone et skillUsed sont calcules depuis combatStats
    // dans recordBattleResult. Les trois doivent y figurer.
    ['dotDamageDealt','supportDone','skillUsed'].forEach(evenement=>{
      expect(code,`${evenement} doit etre emis`).toContain(`emitProgressEvent('${evenement}'`);
      expect(evenementsAttendus.has(evenement),`${evenement} doit servir a une quete`).toBe(true);
    });
  });

  it('skillUsed est calcule depuis les utilisations de competences du combat',()=>{
    expect(code).toMatch(/emitProgressEvent\('skillUsed'[^;]*skillUses/);
  });
});
