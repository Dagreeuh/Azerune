// Export et import de sauvegarde (page Parametres).
//
// C est la fonctionnalite ou une erreur coute le plus cher au joueur : elle
// ecrase sa progression. Les tests couvrent le refus des fichiers invalides et
// la restauration de l ancienne sauvegarde quand l ecriture echoue en cours de
// route.
import{describe,it,expect,beforeEach,afterEach,vi}from'vitest';
import{load,save,AZERUNE_SAVE_FORMAT,AZERUNE_SAVE_KEYS,
        createSaveExport,validateSaveExport,applySaveImport}from'../src/utils/storage';

/** Stockage minimal conforme a l API du navigateur. */
function faireStockage(){
  const donnees=new Map();
  return{
    donnees,
    getItem:cle=>donnees.has(cle)?donnees.get(cle):null,
    setItem:(cle,valeur)=>{donnees.set(cle,String(valeur));},
    removeItem:cle=>{donnees.delete(cle);},
    clear:()=>donnees.clear(),
    get length(){return donnees.size}
  };
}

let stockage,session;

beforeEach(()=>{
  stockage=faireStockage();
  session=faireStockage();
  vi.stubGlobal('localStorage',stockage);
  vi.stubGlobal('sessionStorage',session);
});
afterEach(()=>vi.unstubAllGlobals());

/** Etat de depart representatif d une partie en cours. */
function partieEnCours(){
  save('azerune-save',{version:29,gems:1200,owned:[1,3,7]});
  save('azerune-save-daily',{date:'2026-09-05',progress:{battle:2}});
  localStorage.setItem('azerune-tutorial-completed-v1','true');
  save('azerune-summon-preferences-v1',{confirmMultiSummon:false});
}

describe('load et save',()=>{
  it('relit ce qui a ete ecrit',()=>{
    save('cle',{a:1,b:[2,3]});
    expect(load('cle',null)).toEqual({a:1,b:[2,3]});
  });

  it('renvoie la valeur par defaut si la cle est absente',()=>{
    expect(load('inconnue',{defaut:true})).toEqual({defaut:true});
  });

  it('renvoie la valeur par defaut si le contenu est corrompu',()=>{
    localStorage.setItem('cassee','{ceci n est pas du JSON');
    expect(load('cassee','repli')).toBe('repli');
  });

  it('renvoie la valeur par defaut si la valeur stockee est nulle',()=>{
    save('vide',null);
    expect(load('vide','repli')).toBe('repli');
  });
});

describe('createSaveExport',()=>{
  it('produit un fichier signe et versionne',()=>{
    partieEnCours();
    const fichier=createSaveExport();
    expect(fichier.game).toBe('azerune');
    expect(fichier.format).toBe(AZERUNE_SAVE_FORMAT);
    expect(typeof fichier.exportedAt).toBe('string');
  });

  it('embarque toutes les cles de sauvegarde declarees',()=>{
    partieEnCours();
    expect(Object.keys(createSaveExport().data).sort()).toEqual([...AZERUNE_SAVE_KEYS].sort());
  });

  it('conserve le contenu de la progression',()=>{
    partieEnCours();
    expect(createSaveExport().data['azerune-save']).toEqual({version:29,gems:1200,owned:[1,3,7]});
  });

  it('marque a null une cle absente plutot que de l omettre',()=>{
    save('azerune-save',{version:29});
    const fichier=createSaveExport();
    expect(fichier.data['azerune-save-daily']).toBeNull();
    expect('azerune-save-daily' in fichier.data).toBe(true);
  });
});

describe('validateSaveExport',()=>{
  const valide=()=>{partieEnCours();return createSaveExport()};

  it('accepte un fichier produit par le jeu',()=>{
    expect(validateSaveExport(valide()).ok).toBe(true);
  });

  it('refuse ce qui n est pas un objet',()=>{
    [null,undefined,42,'texte',[]].forEach(valeur=>{
      const resultat=validateSaveExport(valeur);
      expect(resultat.ok).toBe(false);
      expect(resultat.message).toBeTruthy();
    });
  });

  it('refuse un fichier venant d un autre jeu',()=>{
    expect(validateSaveExport({...valide(),game:'autre'}).ok).toBe(false);
  });

  it('refuse un format de sauvegarde different',()=>{
    const resultat=validateSaveExport({...valide(),format:AZERUNE_SAVE_FORMAT+1});
    expect(resultat.ok).toBe(false);
    expect(resultat.message).toContain(String(AZERUNE_SAVE_FORMAT+1));
  });

  it('refuse un fichier sans bloc de donnees',()=>{
    expect(validateSaveExport({...valide(),data:null}).ok).toBe(false);
    expect(validateSaveExport({...valide(),data:[]}).ok).toBe(false);
  });

  it('refuse un fichier dont la progression principale est absente ou invalide',()=>{
    const fichier=valide();
    expect(validateSaveExport({...fichier,data:{...fichier.data,'azerune-save':null}}).ok).toBe(false);
    expect(validateSaveExport({...fichier,data:{...fichier.data,'azerune-save':'texte'}}).ok).toBe(false);
    expect(validateSaveExport({...fichier,data:{...fichier.data,'azerune-save':[]}}).ok).toBe(false);
  });

  it('donne toujours un message lisible en cas de refus',()=>{
    [null,{game:'autre'},{game:'azerune',format:99}].forEach(valeur=>{
      const resultat=validateSaveExport(valeur);
      expect(resultat.ok).toBe(false);
      expect(typeof resultat.message).toBe('string');
      expect(resultat.message.length).toBeGreaterThan(0);
    });
  });
});

describe('applySaveImport',()=>{
  it('remplace la progression par celle du fichier',()=>{
    partieEnCours();
    const fichier=createSaveExport();
    save('azerune-save',{version:29,gems:0,owned:[]});
    expect(applySaveImport(fichier).ok).toBe(true);
    expect(load('azerune-save',null)).toEqual({version:29,gems:1200,owned:[1,3,7]});
  });

  it('un aller-retour complet redonne exactement le meme etat',()=>{
    partieEnCours();
    const attendu=Object.fromEntries(
      AZERUNE_SAVE_KEYS.map(cle=>[cle,localStorage.getItem(cle)]));
    const fichier=createSaveExport();
    localStorage.clear();
    applySaveImport(fichier);
    AZERUNE_SAVE_KEYS.forEach(cle=>expect(localStorage.getItem(cle)).toBe(attendu[cle]));
  });

  it('le drapeau de tutoriel reste la chaine exacte attendue par App',()=>{
    // App fait getItem(cle) !== 'true'. Si l import changeait la forme, le
    // tutoriel se relancerait apres une restauration de sauvegarde.
    partieEnCours();
    const fichier=createSaveExport();
    localStorage.clear();
    applySaveImport(fichier);
    expect(localStorage.getItem('azerune-tutorial-completed-v1')).toBe('true');
  });

  it('efface une cle absente du fichier importe',()=>{
    partieEnCours();
    const fichier=createSaveExport();
    fichier.data['azerune-save-daily']=null;
    applySaveImport(fichier);
    expect(localStorage.getItem('azerune-save-daily')).toBeNull();
  });

  it('vide la session en cours pour ne pas melanger deux parties',()=>{
    partieEnCours();
    sessionStorage.setItem('azerune-page','battle');
    applySaveImport(createSaveExport());
    expect(sessionStorage.getItem('azerune-page')).toBeNull();
  });

  it('refuse un fichier invalide sans toucher a la sauvegarde',()=>{
    partieEnCours();
    const avant=localStorage.getItem('azerune-save');
    const resultat=applySaveImport({game:'autre'});
    expect(resultat.ok).toBe(false);
    expect(localStorage.getItem('azerune-save')).toBe(avant);
  });

  it('restaure la sauvegarde precedente si l ecriture echoue en cours de route',()=>{
    partieEnCours();
    const avant=Object.fromEntries(
      AZERUNE_SAVE_KEYS.map(cle=>[cle,localStorage.getItem(cle)]));
    const fichier=createSaveExport();
    save('azerune-save',{version:29,gems:999,owned:[42]});
    const apresModification=Object.fromEntries(
      AZERUNE_SAVE_KEYS.map(cle=>[cle,localStorage.getItem(cle)]));

    // Quota depasse au troisieme write : le cas reel sur mobile.
    let ecritures=0;
    const vraiSetItem=stockage.setItem;
    stockage.setItem=(cle,valeur)=>{
      ecritures+=1;
      if(ecritures===3)throw new Error('QuotaExceededError');
      vraiSetItem(cle,valeur);
    };
    const resultat=applySaveImport(fichier);
    stockage.setItem=vraiSetItem;

    expect(resultat.ok).toBe(false);
    expect(resultat.message).toBeTruthy();
    // L etat d avant l import est rendu, pas celui du fichier.
    AZERUNE_SAVE_KEYS.forEach(cle=>
      expect(localStorage.getItem(cle)).toBe(apresModification[cle]));
    expect(localStorage.getItem('azerune-save')).not.toBe(avant['azerune-save']);
  });
});
