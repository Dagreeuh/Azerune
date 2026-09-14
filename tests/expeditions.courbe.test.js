import{describe,it,expect}from'vitest';
import{EXPEDITION_SCALE,EXPEDITION_POWER,EXPEDITIONS,createExpeditionMission,expeditionScale}from'../src/data/expeditions';
import{simulerMission}from'../src/utils/simulation';
import{teamPower}from'../src/utils/stats';
import{joueur,avecHasard,equipePour}from'../Audit/mesures/joueur';

/**
 * Les dix niveaux d'expédition doivent être dix marches.
 *
 * Ils ne l'étaient pas : mesuré, un joueur de la ZONE 3 enchaînait les niveaux
 * 7, 8, 9 et 10. Quatre niveaux sur dix ne demandaient rien de plus que le
 * septième, et le jeu annonçait 16 000 de puissance pour le dernier quand
 * 5 700 suffisaient.
 *
 * Ce test rejoue de vrais combats avec de vraies équipes équipées par le butin
 * du jeu : c'est la seule façon de vérifier qu'une courbe de difficulté monte.
 */
const DEBUTANT={zone:1,difficulte:'normal',niveau:10,etoiles:3,niveauObjet:0,competences:1};
const MILIEU={zone:5,difficulte:'normal',niveau:30,etoiles:4,niveauObjet:6,competences:3};
const FIN={zone:10,difficulte:'normal',niveau:60,etoiles:6,niveauObjet:15,competences:'max'};

const taux=(profil,id,niveau,tirages=12)=>{
  const j=joueur(profil),mission=avecHasard(12,()=>createExpeditionMission(id,niveau));
  const equipe=equipePour(mission,j);
  return avecHasard(313,()=>simulerMission({mission,team:equipe,heroes:j.heroes,
    getStats:j.getStats,tirages})).victoires/tirages;
};

describe('la difficulté des expéditions monte vraiment',()=>{
  it('l’échelle est strictement croissante et couvre un vrai écart',()=>{
    EXPEDITION_SCALE.forEach((v,i)=>{if(i)expect(v).toBeGreaterThan(EXPEDITION_SCALE[i-1])});
    expect(EXPEDITION_SCALE[9]/EXPEDITION_SCALE[0]).toBeGreaterThanOrEqual(8);
  });

  it('la puissance annoncée est strictement croissante',()=>{
    EXPEDITION_POWER.forEach((v,i)=>{if(i)expect(v).toBeGreaterThan(EXPEDITION_POWER[i-1])});
  });

  it('un débutant passe le niveau 1 et échoue au niveau 10',()=>{
    expect(taux(DEBUTANT,'treasury',1)).toBeGreaterThanOrEqual(.75);
    expect(taux(DEBUTANT,'treasury',10)).toBe(0);
  });

  // Le défaut d'origine, en une ligne : un joueur de milieu de partie ne doit
  // pas balayer le contenu final.
  it('un joueur de milieu de partie n’enchaîne pas les derniers niveaux',()=>{
    EXPEDITIONS.forEach(exp=>expect(taux(MILIEU,exp.id,10)).toBeLessThanOrEqual(.25));
  });

  it('une campagne normale terminée ouvre le niveau 10 sur au moins une expédition',()=>{
    const meilleurs=EXPEDITIONS.map(exp=>taux(FIN,exp.id,10));
    expect(Math.max(...meilleurs)).toBeGreaterThanOrEqual(.5);
  });

  it('la puissance annoncée reste dans la réalité de la rencontre',()=>{
    // Le contrat n'est pas « le bon chiffre » mais « pas de mensonge d'un
    // facteur deux » : c'est ce que faisait l'ancienne table.
    const j=joueur(FIN);
    for(let n of[1,5,10]){
      const mission=avecHasard(12,()=>createExpeditionMission('treasury',n));
      const plafond=teamPower(equipePour(mission,j),j.heroes,j.getStats);
      expect(EXPEDITION_POWER[n-1]).toBeLessThanOrEqual(plafond*1.25);
      expect(EXPEDITION_POWER[n-1]).toBeGreaterThan(1000);
    }
  });

  it('expeditionScale borne les niveaux hors plage',()=>{
    expect(expeditionScale(0)).toBe(EXPEDITION_SCALE[0]);
    expect(expeditionScale(99)).toBe(EXPEDITION_SCALE[9]);
  });
});
