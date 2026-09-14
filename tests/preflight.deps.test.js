import{describe,it,expect,beforeEach,afterEach}from'vitest';
import{execFileSync}from'node:child_process';
import fs from'node:fs';
import os from'node:os';
import path from'node:path';

const OUTIL=path.resolve(__dirname,'../outils/verifier-deps.mjs');
let bac;

// Le contrôle lit le dossier courant : on lui fabrique un faux projet, plutôt
// que de déplacer les vraies dépendances du dépôt.
const lancer=()=>{
  try{
    execFileSync(process.execPath,[OUTIL],{cwd:bac,stdio:'pipe'});
    return{code:0,sortie:''};
  }catch(e){
    return{code:e.status,sortie:String(e.stderr||'')};
  }
};
const projet=(manifeste,installees=[])=>{
  fs.writeFileSync(path.join(bac,'package.json'),manifeste);
  installees.forEach(nom=>{
    const d=path.join(bac,'node_modules',nom);
    fs.mkdirSync(d,{recursive:true});
    fs.writeFileSync(path.join(d,'package.json'),'{}');
  });
};

beforeEach(()=>{bac=fs.mkdtempSync(path.join(os.tmpdir(),'azerune-'))});
afterEach(()=>fs.rmSync(bac,{recursive:true,force:true}));

describe('contrôle des dépendances avant lancement',()=>{
  it('se tait quand tout est installé',()=>{
    projet(JSON.stringify({dependencies:{'pixi.js':'^8'}}),['pixi.js']);
    expect(lancer().code).toBe(0);
  });

  it('arrête le lancement et nomme ce qui manque',()=>{
    // Le cas vécu : une dépendance ajoutée par un `git pull`, jamais installée.
    // Vite s'écrasait sur « Failed to resolve import » au milieu d'une pile de
    // trente lignes, sans jamais dire de lancer `npm install`.
    projet(JSON.stringify({dependencies:{'pixi.js':'^8','react':'^18'}}),['react']);
    const r=lancer();
    expect(r.code).toBe(1);
    expect(r.sortie).toContain('pixi.js');
    expect(r.sortie).not.toContain('react');
    expect(r.sortie).toContain('npm install');
  });

  it('contrôle aussi les dépendances de développement',()=>{
    projet(JSON.stringify({devDependencies:{'vitest':'^2'}}));
    expect(lancer().code).toBe(1);
  });

  it('ne bloque jamais pour autre chose',()=>{
    // Un manifeste illisible est un problème, mais pas CELUI-là : le contrôle
    // doit s'effacer plutôt que d'empêcher de travailler.
    fs.writeFileSync(path.join(bac,'package.json'),'{ ceci n’est pas du JSON');
    expect(lancer().code).toBe(0);
  });

  it('ne bloque pas en l’absence de manifeste',()=>{
    expect(lancer().code).toBe(0);
  });
});

describe('branchement',()=>{
  it('s’exécute avant `npm run dev`',()=>{
    const manifeste=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../package.json'),'utf8'));
    expect(manifeste.scripts.predev).toBe('node outils/verifier-deps.mjs');
  });
});
