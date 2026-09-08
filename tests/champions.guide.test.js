import{describe,it,expect}from'vitest';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{HEROES}from'../src/data/heroes';
import{championGuide,championIdentity,mergeGuide,ROSTER_PROFILES}from'../src/data/championIdentities';

// Ecran noir a l'ouverture des six derniers champions : championGuide
// n'appliquait ses valeurs par defaut que si le profil manquait ENTIEREMENT.
// Un profil PARTIEL passait a travers, et `guide.priorityStats.join(' · ')`
// levait sur undefined — toute la page champion tombait, et la modale de guide
// avec elle. Ces tests verrouillent le contrat plutot que les six cas.
const lire=chemin=>fs.readFileSync(fileURLToPath(new URL(chemin,import.meta.url)),'utf8');

/**
 * Champs que les ecrans lisent reellement sur le guide.
 *
 * On part des cles du guide lui-meme et on cherche `.cle` dans les sources,
 * plutot que de deviner le nom de la variable : la modale l'appelle `g`, la
 * page l'appelle `guide`, et une prochaine page l'appellera autrement.
 */
const SOURCES=['../src/pages/HeroesPage.jsx','../src/components/ChampionGuideModal.jsx']
  .map(lire).join('\n');
const LUS=new Set(Object.keys(championGuide(HEROES[0]))
  .filter(cle=>new RegExp(`\\.${cle}\\b`).test(SOURCES)));

describe('le guide est complet pour chaque champion',()=>{
  it('les écrans lisent bien un jeu de champs identifiable',()=>{
    // Si ce test tombe, c'est que les pages ont change de forme et que le test
    // suivant ne verifie plus rien : il faut le relire, pas le supprimer.
    expect(LUS.size).toBeGreaterThan(5);
    ['priorityStats','complexity','modes','opening'].forEach(champ=>
      expect(LUS.has(champ),`« ${champ} » n’est plus lu par aucun écran`).toBe(true));
  });

  it.each(HEROES.map(hero=>[hero.name,hero]))('%s a tous les champs affichés',(nom,hero)=>{
    const guide=championGuide(hero);
    LUS.forEach(champ=>expect(guide[champ],`${nom} · ${champ}`).toBeDefined());
  });

  it('les champs de liste sont bien des tableaux, jamais une chaîne',()=>{
    // `.join` sur une chaine ne leve pas mais renvoie n'importe quoi ; sur un
    // nombre, elle leve. Les deux sont des pannes silencieuses differentes.
    HEROES.forEach(hero=>{
      const guide=championGuide(hero);
      ['priorityStats','modes','opening','composition'].forEach(champ=>
        expect(Array.isArray(guide[champ]),`${hero.name} · ${champ}`).toBe(true));
    });
  });

  it('la complexité est un nombre affichable',()=>{
    HEROES.forEach(hero=>{
      const valeur=championGuide(hero).complexity;
      expect(Number.isFinite(valeur),hero.name).toBe(true);
      expect(valeur).toBeGreaterThanOrEqual(1);
      expect(valeur).toBeLessThanOrEqual(3);
    });
  });

  it('un profil PARTIEL ne casse plus rien',()=>{
    // Le defaut exact, reproduit. Tous les profils du roster etant desormais
    // complets, aucun champion reel ne passe plus par ce chemin : sans ce test
    // sur la fusion elle-meme, la regression reviendrait en silence.
    const partiel={primaryRole:'Rôle',secondaryRole:'Appoint',niche:'.',ideal:'.',
      limitation:'.',composition:['Allié']};
    const guide=mergeGuide(championIdentity(HEROES[0]),partiel);
    LUS.forEach(champ=>expect(guide[champ],champ).toBeDefined());
    expect(()=>guide.priorityStats.join(' · ')).not.toThrow();
    expect(guide.primaryRole,'le profil doit primer sur le défaut').toBe('Rôle');
    expect(guide.composition).toEqual(['Allié']);
  });

  it('le profil prime toujours sur le défaut',()=>{
    const guide=mergeGuide({},{priorityStats:['ATQ'],complexity:3,modes:['Raid'],opening:['a']});
    expect(guide.priorityStats).toEqual(['ATQ']);
    expect(guide.complexity).toBe(3);
    expect(guide.modes).toEqual(['Raid']);
  });

  it('aucun profil du tout donne le défaut complet',()=>{
    // L'identite reste necessaire : `title` et `summary` en viennent, pas du
    // profil. Le defaut ne comble que les champs de profil.
    const guide=mergeGuide(championIdentity(HEROES[0]),undefined);
    LUS.forEach(champ=>expect(guide[champ],champ).toBeDefined());
    expect(guide.priorityStats).toEqual([]);
  });

  it('un champion sans aucun profil reste affichable',()=>{
    const orphelin={id:99999,name:'Orphelin',rarity:4,element:'Eau',role:'Inconnu'};
    expect(ROSTER_PROFILES[99999]).toBeUndefined();
    const guide=championGuide(orphelin);
    expect(guide.priorityStats).toEqual([]);
    expect(guide.complexity).toBe(1);
  });

  it('le guide porte l’identité, pas seulement le profil',()=>{
    // `LUS` se deduit de la sortie de championGuide : si la fusion cessait
    // d'inclure l'identite, l'ensemble se retrecirait et les tests ci-dessus
    // ne verraient plus rien. On ancre donc explicitement sur championIdentity.
    HEROES.forEach(hero=>{
      const identite=championIdentity(hero),guide=championGuide(hero);
      expect(identite.title,hero.name).toBeTruthy();
      expect(identite.summary,hero.name).toBeTruthy();
      Object.keys(identite).forEach(cle=>
        expect(guide[cle],`${hero.name} · ${cle} perdu à la fusion`).toBeDefined());
    });
  });
});

describe('les profils écrits à la main restent utiles',()=>{
  it('chaque champion du roster a un profil dédié, pas seulement le défaut',()=>{
    // Le defaut evite l'ecran noir ; il ne remplace pas un vrai profil. Un
    // champion ajoute sans profil s'afficherait « Polyvalent · Adaptable ».
    HEROES.forEach(hero=>expect(ROSTER_PROFILES[hero.id],`${hero.name} (id ${hero.id})`).toBeDefined());
  });

  it('aucun profil n’est vide de conseils',()=>{
    HEROES.forEach(hero=>{
      const guide=championGuide(hero);
      expect(guide.priorityStats.length,`${hero.name} · statistiques prioritaires`).toBeGreaterThan(0);
      expect(guide.opening.length,`${hero.name} · ouverture`).toBeGreaterThan(0);
      // Une ligne d'ouverture doit etre une phrase, pas un remplissage.
      guide.opening.forEach(ligne=>
        expect(String(ligne).length,`${hero.name} · « ${ligne} »`).toBeGreaterThan(20));
      guide.priorityStats.forEach(stat=>
        expect(String(stat).length,`${hero.name} · stat « ${stat} »`).toBeGreaterThan(1));
      expect(guide.modes.length,`${hero.name} · modes`).toBeGreaterThan(0);
    });
  });

  it('un profil ne référence pas un champion inexistant',()=>{
    Object.keys(ROSTER_PROFILES).forEach(id=>
      expect(HEROES.some(hero=>String(hero.id)===id),`profil orphelin : id ${id}`).toBe(true));
  });
});
