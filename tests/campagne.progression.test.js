import{describe,it,expect}from'vitest';
import{CONTINENTS,DIFFICULTIES,createMission,missionXpBase}from'../src/data/campaign';
import{xpForNextLevel}from'../src/utils/progression';
import{campaignBaseXp}from'../src/utils/rewards';
import{campaignLootPreview}from'../src/data/items';

const zones=CONTINENTS.map((continent,index)=>({continent,zone:index+1}));
const difficulte=id=>DIFFICULTIES.find(entry=>entry.id===id);
/** Cout cumule des six niveaux de la bande annoncee par la zone. */
const bandeXp=zone=>{let total=0;for(let level=zone*6-5;level<=zone*6;level+=1)total+=xpForNextLevel(level);return total};
/** XP versee par un premier nettoyage complet de la zone, a une difficulte. */
const xpZone=(id,continent)=>continent.stages.reduce((sum,stage)=>
  sum+campaignBaseXp(createMission(difficulte(id),continent,stage),true),0);

describe('la campagne suit la courbe de niveaux',()=>{
  // Le defaut d'origine : xpBase grandissait lineairement (x3,4 de la zone 1 a
  // la zone 10) quand le cout des niveaux grandit en puissance 1,28 (x150). La
  // couverture tombait de 116 % a 13 % et le joueur atteignait la derniere zone
  // au niveau 25 pour une bande 55-60. On verrouille la couverture, pas la
  // valeur : c'est elle qui doit rester stable quand la courbe bouge.
  it.each(zones)('zone $zone couvre une part utile de sa bande de niveaux',({continent,zone})=>{
    const couverture=xpZone('normal',continent)/bandeXp(zone);
    expect(couverture).toBeGreaterThan(.45);
    expect(couverture).toBeLessThan(.80);
  });

  it('la couverture ne s’effondre pas d’une zone a l’autre',()=>{
    const couvertures=zones.map(({continent,zone})=>xpZone('normal',continent)/bandeXp(zone));
    const min=Math.min(...couvertures),max=Math.max(...couvertures);
    // Une derive de plus de 40 % entre la meilleure et la pire zone signalerait
    // le retour d'une recompense qui ne suit plus le cout des niveaux.
    expect(max/min).toBeLessThan(1.4);
  });

  it('la zone 10 ne verse pas moins que la zone 1 alors qu’elle coute 30 fois plus',()=>{
    expect(xpZone('normal',CONTINENTS[9])).toBeGreaterThan(xpZone('normal',CONTINENTS[0])*20);
  });

  it('le boss verse une prime nette, pas seulement le rang de son palier',()=>{
    // Comparer le boss au palier 6 ne prouve rien : le palier 7 pese deja plus
    // lourd. On compare donc a difficulte de palier egale.
    zones.forEach(({zone})=>{
      expect(missionXpBase(zone,7,true)).toBeGreaterThan(missionXpBase(zone,7,false)*1.5);
    });
  });

  it('Difficile et Hardcore versent plus d’XP que Normal a zone egale',()=>{
    CONTINENTS.forEach(continent=>{
      const normal=xpZone('normal',continent),hard=xpZone('hard',continent),hardcore=xpZone('hardcore',continent);
      expect(hard).toBeGreaterThan(normal);
      expect(hardcore).toBeGreaterThan(hard);
    });
  });

  it('le farm rapporte moins qu’un premier nettoyage',()=>{
    const mission=createMission(difficulte('normal'),CONTINENTS[4],CONTINENTS[4].stages[6]);
    expect(campaignBaseXp(mission,false)).toBeLessThan(campaignBaseXp(mission,true)/2);
  });
});

/** Puissance recommandee du premier et du dernier palier d'une difficulte. */
const bornes=id=>({
  entree:createMission(difficulte(id),CONTINENTS[0],CONTINENTS[0].stages[0]).recommended,
  sortie:createMission(difficulte(id),CONTINENTS[9],CONTINENTS[9].stages[6]).recommended
});

describe('les difficultes s’enchainent sans marche descendante',()=>{
  // La courbe d'objets etait deja continue (zone 10 Normal : niveau 75-76,
  // zone 1 Difficile : 74-75) mais la courbe d'ennemis repartait de la zone 1.
  // Un joueur sortant de Normal entrait en Difficile a 1,84 fois la puissance
  // recommandee et traversait toute la campagne sans farmer.
  it.each([['normal','hard'],['hard','hardcore']])('entrer en %s -> %s ne fait pas retomber l’exigence sous le tiers',(avant,apres)=>{
    const sortie=bornes(avant).sortie,entree=bornes(apres).entree;
    expect(entree).toBeGreaterThan(sortie*.33);
  });

  it('chaque difficulte reste plus exigeante que la precedente, zone par zone',()=>{
    CONTINENTS.forEach(continent=>continent.stages.forEach(stage=>{
      const normal=createMission(difficulte('normal'),continent,stage).recommended;
      const hard=createMission(difficulte('hard'),continent,stage).recommended;
      const hardcore=createMission(difficulte('hardcore'),continent,stage).recommended;
      expect(hard).toBeGreaterThan(normal);
      expect(hardcore).toBeGreaterThan(hard);
    }));
  });

  it('le raccord s’efface en fin de campagne au lieu de doubler l’ecart',()=>{
    // Le facteur de continuite doit valoir davantage en zone 1 qu'en zone 10,
    // sinon il ne raccorde rien : il ne fait que rendre la difficulte plus dure
    // partout.
    const rapport=zone=>createMission(difficulte('hard'),CONTINENTS[zone],CONTINENTS[zone].stages[0]).recommended
      /createMission(difficulte('normal'),CONTINENTS[zone],CONTINENTS[zone].stages[0]).recommended;
    expect(rapport(0)).toBeGreaterThan(rapport(9)*1.15);
  });

  it('la progression a l’interieur d’une difficulte reste croissante',()=>{
    ['normal','hard','hardcore'].forEach(id=>{
      const valeurs=CONTINENTS.map(continent=>createMission(difficulte(id),continent,continent.stages[0]).recommended);
      valeurs.slice(1).forEach((valeur,index)=>expect(valeur).toBeGreaterThan(valeurs[index]));
    });
  });
});

describe('l’onglet de difficulte annonce le butin qu’il donne vraiment',()=>{
  // L'onglet Difficile promettait « 3★ à 5★ » alors que campaignLootProfile
  // plafonne a 4★ : la 5★ n'existe qu'en Hardcore. L'apercu par mission etait
  // juste, seul le libelle de l'onglet mentait.
  const etoilesReelles=id=>CONTINENTS.flatMap(continent=>continent.stages.flatMap(stage=>
    campaignLootPreview(createMission(difficulte(id),continent,stage)).stars.match(/\d/g).map(Number)));
  // Verifier le maximum seul laisserait passer une borne basse fausse : l'onglet
  // Hardcore pourrait annoncer « 3★ a 5★ » sans jamais donner de 3★.
  it.each(['normal','hard','hardcore'])('%s annonce ses deux bornes',id=>{
    const reelles=etoilesReelles(id),annonce=(difficulte(id).loot.match(/\d(?=★)/g)||[]).map(Number);
    expect(Math.min(...annonce)).toBe(Math.min(...reelles));
    expect(Math.max(...annonce)).toBe(Math.max(...reelles));
  });
});
